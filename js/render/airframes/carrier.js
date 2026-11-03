"use strict";
/*
 * C-09 Assault Carrier, the drone-carrier boss. A heavy quad-rotor gunship in
 * the spirit of the Bell/Boeing Quad TiltRotor studies, flown in helicopter
 * mode: a wide box fuselage with a glazed flight deck, tandem high wings with
 * an engine nacelle and 5-blade rotor at each tip, spine drone-bay doors and a
 * rear loading ramp. Diagonal rotor pairs share a direction, so the torques
 * cancel and no tail rotor is needed.
 *
 * The destructible weapon pods are drawn by the game on top of this body at
 * (+-54, 5), r = 19. The body only paints bare sponson pylons and mount pads
 * there, never the pods themselves.
 *
 * Rotor D = 68 px at (+-62, -40) and (+-62, 48); length rotors turning ~156 px.
 */
(() => {
  const B = window.BP;
  const K = B.Kit;

  const ROTOR_X = 62;
  const FRONT_Y = -40;
  const REAR_Y = 48;
  const POD = [54, 5];
  const FUSELAGE = [
    [-64, 0],
    [-62, 8],
    [-56, 14],
    [-46, 18],
    [-30, 20],
    [20, 20],
    [44, 19],
    [56, 16],
    [62, 12],
    [64, 0],
  ];
  const NACELLE = [
    [-15, 0.5],
    [-12, 5],
    [-4, 7],
    [8, 7],
    [14, 5],
    [17, 1],
  ];

  function wingPlates(c, pal) {
    for (const side of [-1, 1]) {
      // Forward wing: slight sweep, root thick, tapering to the nacelle.
      K.wing(
        c,
        pal,
        side,
        [18, FRONT_Y - 10, FRONT_Y + 8],
        [ROTOR_X, FRONT_Y - 7, FRONT_Y + 6],
      );
      // Rear wing sits higher and a little longer in chord.
      K.wing(
        c,
        pal,
        side,
        [18, REAR_Y - 12, REAR_Y + 8],
        [ROTOR_X, REAR_Y - 8, REAR_Y + 7],
      );
      // Flaperons hinged along the trailing edges.
      K.lines(c, pal.panel, [
        [side * 26, FRONT_Y + 6, side * 55, FRONT_Y + 5],
        [side * 26, REAR_Y + 6, side * 55, REAR_Y + 6],
        [side * 40, FRONT_Y - 8, side * 40, FRONT_Y + 7],
        [side * 40, REAR_Y - 10, side * 40, REAR_Y + 7],
      ]);
      // Walkway strips on the wing roots, with non-slip edges.
      c.fillStyle = pal.panel;
      c.fillRect(side > 0 ? 21 : -33, FRONT_Y - 4, 12, 5);
      c.fillRect(side > 0 ? 21 : -33, REAR_Y - 5, 12, 5);
    }
  }

  function sponson(c, pal, side) {
    const [px, py] = POD;
    // Stub pylon from the fuselage side to the pod mount.
    K.plate(c, pal, [
      [side * 18, py - 11],
      [side * (px - 9), py - 7],
      [side * (px - 9), py + 7],
      [side * 18, py + 12],
    ]);
    K.lines(c, pal.panel, [
      [side * 24, py - 9, side * 24, py + 10],
      [side * 34, py - 8, side * 34, py + 9],
    ]);
    // Clean mount ring and pad where the game hangs the weapon pod.
    K.disc(c, pal, side * px, py, 10, pal.metalDark);
    c.strokeStyle = pal.metal;
    c.lineWidth = 1;
    c.beginPath();
    c.arc(side * px, py, 7, 0, K.TAU);
    c.stroke();
    c.fillStyle = pal.accent;
    for (const [dx, dy] of [
      [-4, -4],
      [4, -4],
      [-4, 4],
      [4, 4],
    ]) {
      c.fillRect(side * px + dx - 0.8, py + dy - 0.8, 1.6, 1.6);
    }
  }

  function nacelle(c, pal, side, y) {
    const x = side * ROTOR_X;
    K.hull(
      c,
      pal,
      NACELLE.map(([dy, w]) => [y + dy, w]),
      x,
    );
    // Intake up front, gearbox fairing under the mast, exhausts aft.
    K.disc(c, pal, x, y - 11, 3, pal.accent);
    K.disc(c, pal, x, y, 5, pal.dark);
    c.fillStyle = pal.exhaust;
    c.fillRect(x - 4.5, y + 12, 3, 3);
    c.fillRect(x + 1.5, y + 12, 3, 3);
    K.soot(c, x - 3, y + 15, 3, 9);
    K.soot(c, x + 3, y + 15, 3, 9);
    K.lines(c, pal.panel, [
      [x - 6, y - 5, x + 6, y - 5],
      [x - 6, y + 6, x + 6, y + 6],
    ]);
    // Red recognition flash on the outboard nacelle cowl.
    c.fillStyle = pal.mark;
    K.polygon(c, [
      [x + side * 3, y - 9],
      [x + side * 6.5, y - 7],
      [x + side * 6.5, y - 3],
      [x + side * 3, y - 5],
    ]);
    c.fill();
  }

  function flightDeck(c, pal) {
    K.glass(c, pal, [
      [0, -58],
      [9, -57],
      [15, -52],
      [16, -45],
      [0, -42],
      [-16, -45],
      [-15, -52],
      [-9, -57],
    ]);
    K.lines(
      c,
      pal.frame,
      [
        [0, -57.5, 0, -42.5],
        [-9, -56.5, -10, -44],
        [9, -56.5, 10, -44],
        [-15, -50, 15, -50],
      ],
      0.9,
    );
    // Chin sensor turret and gun peeking past the glazing.
    K.disc(c, pal, 0, -61.5, 2.4, pal.accent);
    c.fillStyle = pal.metalDark;
    c.fillRect(-0.8, -68, 1.6, 6);
  }

  function spine(c, pal) {
    // Raised dorsal fairing with the drone-bay doors.
    c.fillStyle = pal.dark;
    c.fillRect(-11, -34, 22, 72);
    c.strokeStyle = pal.outline;
    c.lineWidth = 0.8;
    c.strokeRect(-11, -34, 22, 72);
    for (const y of [-30, -6, 18]) {
      c.fillStyle = pal.base;
      c.fillRect(-9, y, 18, 18);
      K.lines(
        c,
        pal.outline,
        [
          [0, y, 0, y + 18],
          [-9, y + 9, -7, y + 9],
          [9, y + 9, 7, y + 9],
        ],
        0.7,
      );
      // Yellow-black style hazard ticks drawn in the hostile mark colour.
      c.fillStyle = pal.mark;
      c.fillRect(-9, y, 18, 1.2);
    }
    K.spine(c, pal, -40, 42, -12);
    K.spine(c, pal, -40, 42, 12);
  }

  function armour(c, pal) {
    // Bolted armour plates down each flank and walkway rails.
    const segments = [];
    for (const side of [-1, 1]) {
      for (const y of [-38, -22, 22, 36]) {
        segments.push([side * 12, y, side * 19, y]);
      }
      segments.push([side * 15, -42, side * 15, 50]);
    }
    K.lines(c, pal.panel, segments, 0.7);
    c.fillStyle = pal.spine;
    for (const side of [-1, 1]) {
      for (let y = -40; y <= 48; y += 8)
        c.fillRect(side * 15.5 - 0.4, y, 0.8, 0.8);
    }
  }

  function tail(c, pal) {
    // Loading ramp with hinge line, twin low stabilizing fins.
    K.plate(c, pal, [
      [-12, 44],
      [12, 44],
      [10, 62],
      [-10, 62],
    ]);
    K.lines(c, pal.outline, [[-12, 44, 12, 44]], 0.9);
    K.lines(c, pal.panel, [
      [-8, 50, 8, 50],
      [-8, 56, 8, 56],
    ]);
    K.fin(c, pal, -16, 46, 66, 1.4);
    K.fin(c, pal, 16, 46, 66, 1.4);
    // Hostile chevron aft of the spine and the registration.
    c.fillStyle = pal.mark;
    K.polygon(c, [
      [-7, 39],
      [0, 43],
      [7, 39],
      [7, 41.5],
      [0, 45.5],
      [-7, 41.5],
    ]);
    c.fill();
    c.fillStyle = pal.mark;
    c.font = "bold 5px Consolas, monospace";
    c.textAlign = "center";
    c.fillText("C-09", 0, 60);
  }

  function body(c, pal) {
    wingPlates(c, pal);
    for (const side of [-1, 1]) sponson(c, pal, side);
    const hull = K.hull(c, pal, FUSELAGE);
    K.camo(c, pal, hull, [-20, -64, 20, 64], 11);
    armour(c, pal);
    spine(c, pal);
    tail(c, pal);
    flightDeck(c, pal);
    for (const side of [-1, 1]) {
      nacelle(c, pal, side, FRONT_Y);
      nacelle(c, pal, side, REAR_Y);
    }
  }

  const rotor = (x, y, dir) => ({
    x,
    y,
    radius: 34,
    blades: 5,
    dir,
    chord: 3.6,
    tip: "square",
  });

  B.Airframes.define({
    id: "carrier",
    name: "C-09 Assault Carrier",
    role: "boss",
    bounds: { x0: -70, y0: -69, x1: 70, y1: 67 },
    altitude: 30,
    livery: "sand",
    eliteLivery: "elite",
    rotors: [
      rotor(-ROTOR_X, FRONT_Y, "ccw"),
      rotor(ROTOR_X, FRONT_Y, "cw"),
      rotor(-ROTOR_X, REAR_Y, "cw"),
      rotor(ROTOR_X, REAR_Y, "ccw"),
    ],
    tailRotor: { kind: "none" },
    lights: {
      port: [-69, FRONT_Y - 2],
      starboard: [69, FRONT_Y - 2],
      tail: [0, 64],
      beacon: [0, -38],
    },
    hardpoints: {
      gun: [0, -61.5],
      muzzle: [0, -69],
      pods: [
        [-POD[0], POD[1]],
        [POD[0], POD[1]],
      ],
    },
    paint: body,
  });
})();
