"use strict";
/*
 * Small multirotor drones seen from above: an X-frame of carbon arms, a motor
 * bell at each arm tip, a central shaded body with the battery pack strapped
 * on top and a camera/sensor gimbal on the nose. Props are 2-blade rotors that
 * counter-rotate with their neighbours (diagonal pairs share a direction):
 * front-right and rear-left CCW, front-left and rear-right CW, props-in as on
 * a typical FPV quad. No tail rotor.
 *
 * "quad"   hostile attack quad, ~20 px across, slung munition, red nose LED.
 * "escort" friendly escort drone, ~22 px across, nose gun, teal markings.
 */
(() => {
  const B = window.BP;
  const K = B.Kit;
  const TAU = Math.PI * 2;
  const LED_PULSE_HZ = 2.2;
  const PROP_COLOR = "#cfd6d9";

  // Four rotors on an X at +-arm; order FL, FR, RR, RL.
  function props(arm, radius, chord) {
    const corners = [
      [-1, -1, "cw"],
      [1, -1, "ccw"],
      [1, 1, "cw"],
      [-1, 1, "ccw"],
    ];
    return corners.map(([sx, sy, dir]) => ({
      x: sx * arm,
      y: sy * arm,
      radius,
      blades: 2,
      dir,
      chord,
      tip: "square",
    }));
  }

  // Carbon arm from the hub to one motor, drawn as a slim shaded plank.
  function arm(c, pal, x, y, width) {
    const len = Math.hypot(x, y),
      nx = (-y / len) * (width / 2),
      ny = (x / len) * (width / 2);
    K.polygon(c, [
      [nx, ny],
      [x + nx, y + ny],
      [x - nx, y - ny],
      [-nx, -ny],
    ]);
    c.fillStyle = pal.metalDark;
    c.fill();
    c.strokeStyle = pal.outline;
    c.lineWidth = 0.4;
    c.stroke();
    // Lit edge on the upper-left face of the arm.
    K.lines(
      c,
      pal.spine,
      [[nx * 0.4, ny * 0.4, x + nx * 0.4, y + ny * 0.4]],
      0.35,
    );
  }

  // Brushless motor bell with a lit rim and a dark shaft cap.
  function motor(c, pal, x, y, r) {
    K.disc(c, pal, x, y, r, pal.metal);
    c.fillStyle = pal.metalDark;
    c.beginPath();
    c.arc(x, y, r * 0.45, 0, TAU);
    c.fill();
  }

  function frame(c, pal, rotors, armWidth, motorR) {
    for (const r of rotors) arm(c, pal, r.x, r.y, armWidth);
    for (const r of rotors) motor(c, pal, r.x, r.y, motorR);
  }

  // Nose gimbal: dark ball with a glass lens looking forward.
  function gimbal(c, pal, y, r) {
    K.disc(c, pal, 0, y, r, pal.accent);
    c.fillStyle = pal.glass[1];
    c.beginPath();
    c.arc(0, y - r * 0.35, r * 0.45, 0, TAU);
    c.fill();
    c.fillStyle = "#ffffff66";
    c.fillRect(-r * 0.3, y - r * 0.6, r * 0.25, r * 0.25);
  }

  // Battery pack on top of the body with a strap across it.
  function battery(c, pal, x0, y0, w, h, strap) {
    K.polygon(c, [
      [x0, y0],
      [x0 + w, y0],
      [x0 + w, y0 + h],
      [x0, y0 + h],
    ]);
    const g = c.createLinearGradient(x0, 0, x0 + w, 0);
    g.addColorStop(0, pal.dark);
    g.addColorStop(0.35, pal.accent);
    g.addColorStop(1, "#0d0f10");
    c.fillStyle = g;
    c.fill();
    c.strokeStyle = pal.outline;
    c.lineWidth = 0.4;
    c.stroke();
    c.fillStyle = strap;
    c.fillRect(x0 - 0.3, y0 + h * 0.45, w + 0.6, Math.max(0.6, h * 0.16));
  }

  // Front LEDs pulse gently; the glow reads even under a prop disc.
  function led(c, x, y, color, strength) {
    c.fillStyle = color + "40";
    c.beginPath();
    c.arc(x, y, 1.6 * strength, 0, TAU);
    c.fill();
    c.fillStyle = color;
    c.beginPath();
    c.arc(x, y, 0.65, 0, TAU);
    c.fill();
  }

  // The shared rotor smear paints blades in the dark livery blade colour, which
  // vanishes on props this small. Overlay a light leading blade (plus a short
  // trailing ghost) at the same strobe-safe spin rate so each prop reads.
  function propBlades(c, rotors, color, clock, seed) {
    const rate = B.Rotors.spinRate(2);
    c.strokeStyle = color;
    c.lineCap = "round";
    rotors.forEach((r, i) => {
      const sign = r.dir === "cw" ? 1 : -1,
        angle = sign * (clock * rate + seed * 1.7 + i * 0.9);
      for (const [lag, alpha, width] of [
        [0.4, 0.2, 1],
        [0, 0.62, 0.7],
      ]) {
        const a = angle - sign * lag,
          dx = Math.cos(a) * r.radius * 0.94,
          dy = Math.sin(a) * r.radius * 0.94;
        c.globalAlpha = alpha;
        c.lineWidth = width;
        c.beginPath();
        c.moveTo(r.x - dx, r.y - dy);
        c.lineTo(r.x + dx, r.y + dy);
        c.stroke();
      }
    });
    c.globalAlpha = 1;
    c.lineCap = "butt";
  }

  function pulse(clock, seed) {
    return 0.75 + 0.25 * Math.sin((clock * LED_PULSE_HZ + seed * 0.31) * TAU);
  }

  /* ---------- Attack quadcopter (hostile swarm) ---------- */

  const QUAD_ROTORS = props(5.5, 4.5, 1.1);
  const QUAD_BODY = [
    [-4.6, 1.2],
    [-4, 2.3],
    [-1.5, 2.8],
    [2, 2.8],
    [3.8, 2.2],
    [4.4, 1.2],
  ];

  // Mortar-style bomblet hung under the belly: tail and fins show aft.
  function munition(c, pal) {
    c.fillStyle = pal.store;
    c.fillRect(-1.1, -1, 2.2, 7.4);
    c.strokeStyle = pal.outline;
    c.lineWidth = 0.4;
    c.strokeRect(-1.1, -1, 2.2, 7.4);
    c.fillStyle = pal.mark;
    c.fillRect(-1.1, 4.3, 2.2, 0.9);
    c.fillStyle = pal.storeDark;
    c.fillRect(-1.9, 6.3, 3.8, 1.1);
    c.fillRect(-0.35, 6.3, 0.7, 2);
  }

  function paintQuad(c, pal) {
    munition(c, pal);
    frame(c, pal, QUAD_ROTORS, 1.5, 1.35);
    K.hull(c, pal, QUAD_BODY);
    battery(c, pal, -1.7, -1.4, 3.4, 4, pal.mark + "aa");
    gimbal(c, pal, -4.3, 1.5);
    // Antenna stub on the tail.
    K.lines(c, pal.metalDark, [[0.8, 4.2, 1.8, 6.4]], 0.4);
  }

  function overlayQuad(c, pal, clock, seed) {
    const s = pulse(clock, seed);
    propBlades(c, QUAD_ROTORS, PROP_COLOR, clock, seed);
    led(c, 0, -5.8, pal.mark, s);
    for (const r of QUAD_ROTORS.slice(0, 2))
      led(c, r.x, r.y, pal.lightPort, s * 0.7);
  }

  B.Airframes.define({
    id: "quad",
    name: "Attack quadcopter",
    role: "enemy",
    bounds: { x0: -7, y0: -7, x1: 7, y1: 8.6 },
    altitude: 11,
    livery: "drone",
    eliteLivery: "elite",
    rotors: QUAD_ROTORS,
    tailRotor: { kind: "none" },
    hardpoints: { gun: [0, 2], muzzle: [0, 6], pods: [[0, 2.5]] },
    paint: paintQuad,
    overlay: overlayQuad,
  });

  /* ---------- Escort drone (friendly) ---------- */

  const ESCORT_ROTORS = props(6, 5, 1.2);
  const ESCORT_BODY = [
    [-5.4, 0.9],
    [-4.8, 2.2],
    [-2.5, 3.1],
    [2, 3.2],
    [4.4, 2.6],
    [5.4, 1.4],
  ];

  function gun(c, pal) {
    c.fillStyle = pal.metalDark;
    c.fillRect(-0.45, -10.4, 0.9, 5.4);
    c.fillStyle = pal.metal;
    c.fillRect(-0.45, -10.4, 0.35, 5.4);
    c.fillStyle = pal.exhaust;
    c.fillRect(-0.7, -10.6, 1.4, 0.9);
  }

  function paintEscort(c, pal) {
    gun(c, pal);
    frame(c, pal, ESCORT_ROTORS, 1.6, 1.5);
    K.hull(c, pal, ESCORT_BODY);
    battery(c, pal, -1.9, -1.2, 3.8, 4.3, pal.mark + "cc");
    // Friendly recognition chevron on the tail.
    c.strokeStyle = pal.mark;
    c.lineWidth = 0.6;
    c.beginPath();
    c.moveTo(-1.8, 5.2);
    c.lineTo(0, 4.1);
    c.lineTo(1.8, 5.2);
    c.stroke();
    gimbal(c, pal, -4.4, 1.6);
  }

  function overlayEscort(c, pal, clock, seed) {
    const s = pulse(clock, seed);
    propBlades(c, ESCORT_ROTORS, PROP_COLOR, clock, seed);
    led(c, -2.4, -3.8, "#5ff2ff", s);
    led(c, 2.4, -3.8, "#5ff2ff", s);
    for (const r of ESCORT_ROTORS.slice(2))
      led(c, r.x, r.y, pal.lightStarboard, s * 0.7);
  }

  B.Airframes.define({
    id: "escort",
    name: "Escort drone",
    role: "escort",
    bounds: { x0: -7.6, y0: -10.8, x1: 7.6, y1: 7.6 },
    altitude: 13,
    livery: "escort",
    eliteLivery: "escort",
    rotors: ESCORT_ROTORS,
    tailRotor: { kind: "none" },
    hardpoints: { gun: [0, -6], muzzle: [0, -11] },
    paint: paintEscort,
    overlay: overlayEscort,
  });
})();
