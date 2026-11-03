"use strict";
/*
 * Draws any registered airframe. Bodies are cached at scale x DPR so they stay
 * sharp; shadows and hit flashes are silhouettes derived from the same cached
 * body. The sun is fixed in world space, so every shadow falls the same way.
 *
 * pose = {x, y, heading, scale?, roll?, vx?, vy?, seed?, flash?, alpha?,
 *         elite?, loadout?}   heading is the world angle the nose points at.
 */
(() => {
  const B = window.BP;
  const TAU = Math.PI * 2;
  const SUN = { x: 0.55, y: 0.85 };
  const SHADOW_ALPHA = 0.3;
  const PAD = 2;
  const MAX_TILT = 4;
  const bodies = new Map();
  let dpr = 1;

  function palette(spec, elite) {
    const id = (elite && spec.eliteLivery) || spec.livery || "ghost";
    return { id, pal: B.Liveries[id] || B.Liveries.ghost };
  }

  function paintBody(spec, pal, res) {
    const b = spec.bounds,
      w = b.x1 - b.x0 + PAD * 2,
      h = b.y1 - b.y0 + PAD * 2,
      canvas = document.createElement("canvas");
    canvas.width = Math.ceil(w * res);
    canvas.height = Math.ceil(h * res);
    const c = canvas.getContext("2d");
    c.setTransform(res, 0, 0, res, (PAD - b.x0) * res, (PAD - b.y0) * res);
    c.lineJoin = "round";
    spec.paint(c, pal);
    return { canvas, x: b.x0 - PAD, y: b.y0 - PAD, w, h };
  }

  function tinted(entry, color) {
    const canvas = document.createElement("canvas");
    canvas.width = entry.canvas.width;
    canvas.height = entry.canvas.height;
    const c = canvas.getContext("2d");
    c.drawImage(entry.canvas, 0, 0);
    c.globalCompositeOperation = "source-in";
    c.fillStyle = color;
    c.fillRect(0, 0, canvas.width, canvas.height);
    return { ...entry, canvas };
  }

  function sprites(spec, elite, scale) {
    const res = Math.max(1, Math.round(scale * dpr * 4) / 4),
      { id, pal } = palette(spec, elite),
      key = `${spec.id}|${id}|${res}`;
    let set = bodies.get(key);
    if (!set) {
      const body = paintBody(spec, pal, res);
      set = {
        pal,
        res,
        body,
        shadow: tinted(body, "#000"),
        flash: tinted(body, "#fff6dc"),
      };
      bodies.set(key, set);
    }
    return set;
  }

  function blit(c, entry, alpha = 1) {
    if (alpha <= 0) return;
    const previous = c.globalAlpha;
    c.globalAlpha = previous * alpha;
    c.drawImage(entry.canvas, entry.x, entry.y, entry.w, entry.h);
    c.globalAlpha = previous;
  }

  // Rotor tip-path planes tilt toward the direction of travel.
  function discTilt(pose) {
    const speed = Math.hypot(pose.vx || 0, pose.vy || 0);
    if (!speed)
      return { x: 0, y: 0, squash: 1 - Math.abs(pose.roll || 0) * 0.12 };
    const k = Math.min(1, speed / 300) * MAX_TILT,
      a = Math.atan2(pose.vy, pose.vx) - pose.heading - Math.PI / 2;
    return {
      x: Math.cos(a) * k,
      y: Math.sin(a) * k,
      squash: 1 - Math.abs(pose.roll || 0) * 0.12,
    };
  }

  function lights(c, spec, pal, clock, seed) {
    const L = spec.lights || {};
    const dot = (p, color, r) => {
      if (!p) return;
      c.fillStyle = color + "33";
      c.beginPath();
      c.arc(p[0], p[1], r * 1.8, 0, TAU);
      c.fill();
      c.fillStyle = color;
      c.beginPath();
      c.arc(p[0], p[1], r, 0, TAU);
      c.fill();
    };
    dot(L.port, pal.lightPort, 1.1);
    dot(L.starboard, pal.lightStarboard, 1.1);
    dot(L.tail, pal.lightTail, 0.9);
    // Anti-collision beacon: a short flash roughly once per second.
    if (L.beacon && (clock * 1.2 + seed * 0.37) % 1 < 0.12)
      dot(L.beacon, pal.beacon, 1.4);
  }

  function frame(c, pose) {
    c.translate(pose.x, pose.y);
    c.rotate(pose.heading + Math.PI / 2);
    const s = pose.scale || 1;
    c.scale(s * (1 - Math.abs(pose.roll || 0) * 0.25), s);
  }

  const Aircraft = {
    SUN,

    setDpr(value) {
      if (value === dpr) return;
      dpr = value;
      bodies.clear();
      B.Rotors.clear();
    },

    // Silhouette plus faint disc shadows, offset along the world sun vector.
    drawShadow(c, spec, pose) {
      const scale = pose.scale || 1,
        set = sprites(spec, pose.elite, scale),
        alt = (spec.altitude || 18) * scale;
      c.save();
      c.globalAlpha = SHADOW_ALPHA * (pose.alpha ?? 1);
      frame(c, { ...pose, x: pose.x + SUN.x * alt, y: pose.y + SUN.y * alt });
      blit(c, set.shadow);
      c.fillStyle = "#000";
      c.globalAlpha *= 0.22;
      for (const r of spec.rotors || []) {
        c.beginPath();
        c.arc(r.x, r.y, r.radius, 0, TAU);
        c.fill();
      }
      c.restore();
    },

    draw(c, spec, pose, clock) {
      const scale = pose.scale || 1,
        set = sprites(spec, pose.elite, scale),
        pal = set.pal,
        seed = pose.seed || 0,
        res = set.res;
      c.save();
      if (pose.alpha != null) c.globalAlpha = pose.alpha;
      frame(c, pose);
      blit(c, set.body);
      if (spec.stores && pose.loadout) spec.stores(c, pal, pose.loadout);
      B.Rotors.drawTail(c, spec.tailRotor, pal, clock, seed);
      if (pose.flash > 0) blit(c, set.flash, Math.min(1, pose.flash * 6) * 0.7);
      const tilt = discTilt(pose);
      (spec.rotors || []).forEach((rotor, i) => {
        // Small props barely tilt; a full-size disc shifts up to MAX_TILT px.
        const k = Math.min(1, (rotor.radius * 0.1) / MAX_TILT);
        const t = { x: tilt.x * k, y: tilt.y * k, squash: tilt.squash };
        B.Rotors.drawMain(c, rotor, pal, clock, seed * 1.7 + i * 0.9, res, t);
      });
      if (spec.overlay) spec.overlay(c, pal, clock, seed);
      lights(c, spec, pal, clock, seed);
      c.restore();
    },
  };
  B.Aircraft = Aircraft;
})();
