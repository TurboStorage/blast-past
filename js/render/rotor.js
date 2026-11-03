"use strict";
/*
 * Rotor rendering. A main rotor is a cached translucent tip-path disc plus a
 * cached smear of N motion-blurred blades, rotated each frame. Its spin rate
 * keeps every frame step at ~55% of the wagon-wheel limit (180 deg / N), so a
 * rotor never appears frozen or reversed. Tail rotors spin in a vertical plane
 * beside the fin, so from above they are drawn edge-on, never as a flat disc.
 */
(() => {
  const B = window.BP;
  const TAU = Math.PI * 2;
  const STROBE_FRACTION = 0.55;
  const FRAME_RATE = 60;
  const GHOSTS = 6;
  const cache = new Map();

  // Angular speed (rad/s) that stays safely under the wagon-wheel limit.
  function spinRate(blades) {
    return ((STROBE_FRACTION * Math.PI) / blades) * FRAME_RATE;
  }

  function canvasFor(key, radius, res, paint) {
    const id = key + "@" + res;
    let entry = cache.get(id);
    if (entry) return entry;
    const size = Math.ceil((radius + 2) * 2 * res),
      canvas = document.createElement("canvas");
    canvas.width = canvas.height = size;
    const c = canvas.getContext("2d");
    c.setTransform(res, 0, 0, res, size / 2, size / 2);
    paint(c);
    entry = { canvas, half: size / 2 / res };
    cache.set(id, entry);
    return entry;
  }

  function paintDisc(c, radius, pal) {
    const g = c.createRadialGradient(0, 0, radius * 0.1, 0, 0, radius);
    g.addColorStop(0, `rgba(${pal.disc},0.02)`);
    g.addColorStop(0.75, `rgba(${pal.disc},0.08)`);
    g.addColorStop(0.97, `rgba(${pal.disc},0.15)`);
    g.addColorStop(1, `rgba(${pal.disc},0)`);
    c.fillStyle = g;
    c.beginPath();
    c.arc(0, 0, radius, 0, TAU);
    c.fill();
    // Painted tip caps smear into a faint coloured ring.
    c.strokeStyle = pal.bladeTip + "18";
    c.lineWidth = Math.max(0.8, radius * 0.035);
    c.beginPath();
    c.arc(0, 0, radius * 0.96, 0, TAU);
    c.stroke();
  }

  // One blade along +x from the hub to the tip, in the rotor's local frame.
  function bladePath(c, radius, chord, tip) {
    const root = radius * 0.12,
      half = chord / 2;
    c.beginPath();
    c.moveTo(root, -half * 0.6);
    if (tip === "swept") {
      c.lineTo(radius * 0.93, -half);
      c.lineTo(radius, -half * 0.2);
      c.lineTo(radius * 0.98, half);
    } else if (tip === "paddle") {
      c.lineTo(radius * 0.82, -half);
      c.lineTo(radius * 0.9, -half * 1.35);
      c.lineTo(radius, -half * 0.5);
      c.lineTo(radius, half);
    } else {
      c.lineTo(radius, -half);
      c.lineTo(radius, half);
    }
    c.lineTo(root, half * 0.6);
    c.closePath();
  }

  // Blades turning clockwise on screen; trailing ghosts sit at smaller angles.
  function paintSmear(c, rotor, pal) {
    const { radius, blades, tip = "square" } = rotor,
      chord = rotor.chord || radius * 0.075,
      sweep = ((STROBE_FRACTION * Math.PI) / blades) * 0.9;
    for (let b = 0; b < blades; b++) {
      const base = (b * TAU) / blades;
      for (let k = GHOSTS; k >= 0; k--) {
        c.save();
        c.rotate(base - (k / GHOSTS) * sweep);
        c.globalAlpha = k === 0 ? 0.62 : 0.32 * (1 - k / (GHOSTS + 1)) ** 1.4;
        bladePath(c, radius, chord, tip);
        c.fillStyle = pal.blade;
        c.fill();
        if (k === 0) {
          c.fillStyle = pal.bladeTip;
          c.globalAlpha = 0.45;
          c.fillRect(radius * 0.92, -chord / 2, radius * 0.06, chord);
        }
        c.restore();
      }
    }
    c.globalAlpha = 1;
    c.fillStyle = pal.metalDark;
    c.beginPath();
    c.arc(0, 0, radius * 0.1, 0, TAU);
    c.fill();
  }

  function rotorKey(rotor, pal, kind) {
    const { radius, blades, chord = 0, tip = "square" } = rotor;
    return `${kind}|${radius}|${blades}|${chord}|${tip}|${pal.blade}|${pal.bladeTip}|${pal.disc}`;
  }

  // Draws a spinning blade set at the current transform (already at the mast).
  function drawBlades(c, rotor, pal, angle, dir, res) {
    const smear = canvasFor(
      rotorKey(rotor, pal, "smear"),
      rotor.radius,
      res,
      (x) => paintSmear(x, rotor, pal),
    );
    c.save();
    // The smear is authored clockwise; mirroring it yields a CCW rotor.
    if (dir === "ccw") c.scale(-1, 1);
    c.rotate(angle);
    c.drawImage(
      smear.canvas,
      -smear.half,
      -smear.half,
      smear.half * 2,
      smear.half * 2,
    );
    c.restore();
  }

  const Rotors = {
    spinRate,

    clear() {
      cache.clear();
    },

    // rotor: {x, y, radius, blades, dir, chord?, tip?, coaxial?}
    drawMain(c, rotor, pal, clock, phase, res, tilt) {
      const disc = canvasFor(
        rotorKey(rotor, pal, "disc"),
        rotor.radius,
        res,
        (x) => paintDisc(x, rotor.radius, pal),
      );
      const angle = clock * spinRate(rotor.blades) + phase;
      c.save();
      c.translate(rotor.x + (tilt?.x || 0), rotor.y + (tilt?.y || 0));
      if (tilt?.squash) c.scale(tilt.squash, 1);
      c.drawImage(
        disc.canvas,
        -disc.half,
        -disc.half,
        disc.half * 2,
        disc.half * 2,
      );
      if (rotor.coaxial) {
        drawBlades(
          c,
          rotor,
          pal,
          angle,
          rotor.dir === "ccw" ? "cw" : "ccw",
          res,
        );
        c.scale(0.97, 0.97);
      }
      drawBlades(c, rotor, pal, angle, rotor.dir, res);
      c.fillStyle = pal.metal;
      c.beginPath();
      c.arc(0, 0, Math.max(1.2, rotor.radius * 0.06), 0, TAU);
      c.fill();
      c.restore();
    },

    // Edge-on tail rotor beside the fin, with blades flicking along the bar.
    drawTail(c, tail, pal, clock, phase) {
      if (!tail || tail.kind === "none" || tail.kind === "fenestron") return;
      const r = tail.diameter / 2,
        blades = tail.blades || 2,
        gap = 1.2,
        x = tail.x + tail.side * ((tail.finHalfWidth || 1) + gap),
        spin = clock * spinRate(blades) * 1.7 + phase * 3;
      c.save();
      c.translate(x, tail.y);
      if (tail.kind === "canted") {
        // A canted disc is seen as a narrow ellipse leaning outboard.
        const minor = r * Math.sin(tail.cant || 0.35);
        c.fillStyle = `rgba(${pal.disc},0.16)`;
        c.beginPath();
        c.ellipse(tail.side * minor * 0.6, 0, minor, r, 0, 0, TAU);
        c.fill();
      }
      const flicker = 0.36 + 0.22 * Math.abs(Math.sin(spin * 2.3));
      c.fillStyle = `rgba(${pal.disc},${flicker.toFixed(3)})`;
      c.beginPath();
      c.ellipse(0, 0, Math.max(1, r * 0.16), r, 0, 0, TAU);
      c.fill();
      // Each blade projects onto the bar as a segment of length r*cos(angle).
      c.strokeStyle = pal.blade;
      c.lineWidth = Math.max(0.8, r * 0.12);
      c.globalAlpha = 0.85;
      c.beginPath();
      for (let b = 0; b < blades; b++) {
        const a = spin + (b * TAU) / blades;
        c.moveTo(0, 0);
        c.lineTo(0, r * Math.cos(a));
      }
      c.stroke();
      c.globalAlpha = 1;
      // Gearbox stub back to the fin, then the hub.
      c.fillStyle = pal.metalDark;
      c.fillRect(tail.side > 0 ? -gap - 0.5 : 0, -0.7, gap + 0.5, 1.4);
      c.beginPath();
      c.arc(0, 0, Math.max(0.9, r * 0.14), 0, TAU);
      c.fill();
      c.restore();
    },
  };
  B.Rotors = Rotors;
})();
