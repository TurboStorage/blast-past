"use strict";
/*
 * Mi-17 rocket carrier, the hostile rocket artillery. Mi-8MTV inspired: a big
 * rounded transport hull with a blunt, many-paned glazed nose, the engine
 * housing on the roof forward of the mast with two dust-filter capped intakes
 * over the cockpit and exhausts either side, round external fuel tanks on the
 * cabin flanks, outrigger pylons carrying six UB-32 style rocket pods, clamshell
 * rear doors and a long boom ending in the fin with a small stabilizer. The
 * 5-blade rotor turns CLOCKWISE seen from above, so tail thrust points to port
 * and the 3-blade tractor tail rotor sits on the PORT side of the fin.
 *
 * Main rotor D = 84 px; overall length rotors turning ~ 1.23 D.
 */
(() => {
  const B = window.BP;
  const K = B.Kit;

  const MAST_Y = -6;
  const FUSELAGE = [
    [-33, 0],
    [-32.5, 3.8],
    [-31, 6],
    [-28, 7.3],
    [-23, 7.9],
    [-14, 8.1],
    [2, 8.2],
    [9, 7.9],
    [13, 6.8],
    [16, 5],
    [18.5, 3.4],
  ];
  const BOOM = [
    [15, 3.3],
    [24, 2.7],
    [36, 2.1],
    [45, 1.7],
    [49, 1.1],
  ];
  const ENGINES = [
    [-25, 2.4],
    [-23, 4],
    [-12, 4.4],
    [-2, 4.3],
    [3, 3.2],
    [5, 1.6],
  ];
  const POD_Y = 2.5;
  const PODS = [
    [-12.2, POD_Y],
    [-16.2, POD_Y],
    [-20.2, POD_Y],
    [12.2, POD_Y],
    [16.2, POD_Y],
    [20.2, POD_Y],
  ];

  // Round external fuel tank bulging from the cabin flank.
  function fuelTank(c, pal, side) {
    const x = side * 9.8;
    K.hull(
      c,
      pal,
      [
        [-18, 0.8],
        [-16.4, 2.6],
        [-12, 3.3],
        [-5, 3.3],
        [-2.4, 2.4],
        [-1, 0.8],
      ],
      x,
    );
    K.lines(c, pal.panel, [
      [x - 2.9, -13, x + 2.9, -13],
      [x - 2.9, -6, x + 2.9, -6],
    ]);
    star(c, pal, x + side * 0.4, -9, 1.5);
  }

  // Outrigger truss from the cabin side with three pylons and their pods.
  function outrigger(c, pal, side) {
    for (const [x, y] of PODS.filter((p) => Math.sign(p[0]) === side))
      K.pod(c, pal, x, y, 11, 2.1, 32);
    K.plate(c, pal, [
      [side * 7.6, POD_Y - 2.2],
      [side * 21.2, POD_Y - 1.2],
      [side * 21.2, POD_Y + 0.6],
      [side * 7.6, POD_Y + 2.4],
    ]);
    c.fillStyle = pal.metalDark;
    for (const [x] of PODS.filter((p) => Math.sign(p[0]) === side))
      c.fillRect(x - 0.6, POD_Y - 1.4, 1.2, 1.8);
    // Diagonal strut back to the lower fuselage.
    K.lines(
      c,
      pal.metalDark,
      [[side * 7.8, POD_Y + 6, side * 14.2, POD_Y + 0.8]],
      0.9,
    );
  }

  // Blunt nose glazing: many small flat panes in a heavy frame.
  function glazing(c, pal) {
    K.glass(c, pal, [
      [0, -32.6],
      [4.2, -32],
      [6.8, -29.6],
      [7.2, -25.6],
      [3.8, -24.4],
      [0, -24.2],
      [-3.8, -24.4],
      [-7.2, -25.6],
      [-6.8, -29.6],
      [-4.2, -32],
    ]);
    K.lines(
      c,
      pal.frame,
      [
        [0, -32.6, 0, -24.2],
        [-3.2, -32.2, -3.5, -24.3],
        [3.2, -32.2, 3.5, -24.3],
        [-6, -30.8, 6, -30.8],
        [-7, -28.2, 7, -28.2],
        [-7.2, -26, 7.2, -26],
      ],
      0.7,
    );
    // Bulged side blister windows.
    for (const side of [-1, 1])
      K.glass(c, pal, [
        [side * 7, -24],
        [side * 8.5, -23],
        [side * 8.5, -20],
        [side * 7.2, -19.4],
      ]);
  }

  // Roof engine housing with capped intakes, exhausts and the gearbox fairing.
  function engineDeck(c, pal) {
    for (const side of [-1, 1]) {
      const x = side * 4.2;
      K.plate(c, pal, [
        [x, -9.5],
        [x + side * 3.6, -8],
        [x + side * 3.6, -4.4],
        [x, -5],
      ]);
      K.disc(c, pal, x + side * 3.4, -6.2, 1.2, pal.exhaust);
      K.soot(c, x + side * 3.6, -5, 2.2, 8);
    }
    const deck = K.hull(c, pal, ENGINES);
    K.camo(c, pal, deck, [-5, -25, 5, 5], 11);
    for (const side of [-1, 1]) {
      const x = side * 2.4;
      K.disc(c, pal, x, -24.4, 2.3, pal.dark);
      K.disc(c, pal, x, -24.4, 1.3, pal.accent);
    }
    K.lines(c, pal.panel, [
      [0, -21, 0, -10],
      [-4.4, -16, 4.4, -16],
      [-4.2, 0, 4.2, 0],
    ]);
    K.disc(c, pal, 0, MAST_Y, 3, pal.dark);
  }

  // Five-point recognition star centred on (x, y).
  function star(c, pal, x, y, r) {
    const pts = [];
    for (let i = 0; i < 10; i++) {
      const a = -Math.PI / 2 + (i * Math.PI) / 5,
        d = i % 2 ? r * 0.42 : r;
      pts.push([x + Math.cos(a) * d, y + Math.sin(a) * d]);
    }
    K.polygon(c, pts);
    c.fillStyle = pal.mark;
    c.fill();
  }

  function tail(c, pal) {
    const boomPath = K.hull(c, pal, BOOM);
    K.camo(c, pal, boomPath, [-4, 15, 4, 50], 5);
    c.fillStyle = pal.mark;
    c.fillRect(-2.4, 30, 4.8, 1.6);
    K.stabilizer(c, pal, 37, 15, 3.2, 0.8);
    K.fin(c, pal, 0, 41, 52, 1.3);
  }

  function body(c, pal) {
    tail(c, pal);
    for (const side of [-1, 1]) fuelTank(c, pal, side);
    const hull = K.hull(c, pal, FUSELAGE);
    K.camo(c, pal, hull, [-7, -33, 7, 18], 7);
    // Clamshell rear doors and cabin roof panels.
    K.lines(c, pal.panel, [
      [-7.2, 10.5, -1.4, 13.6],
      [7.2, 10.5, 1.4, 13.6],
      [-1.4, 13.6, 1.4, 13.6],
      [0, 13.6, 0, 18.5],
      [-7.8, -19, 7.8, -19],
      [-8.1, 7, -6.9, 7],
      [8.1, 7, 6.9, 7],
    ]);
    for (const side of [-1, 1]) outrigger(c, pal, side);
    glazing(c, pal);
    engineDeck(c, pal);
    K.spine(c, pal, 6, 46);
  }

  B.Airframes.define({
    id: "mi17",
    name: "Mi-17 rocket carrier",
    role: "enemy",
    bounds: { x0: -23, y0: -34, x1: 23, y1: 53 },
    altitude: 22,
    livery: "olive",
    eliteLivery: "elite",
    rotors: [
      {
        x: 0,
        y: MAST_Y,
        radius: 42,
        blades: 5,
        dir: "cw",
        chord: 2.7,
        tip: "square",
      },
    ],
    tailRotor: {
      kind: "conventional",
      x: 0,
      y: 46,
      side: -1,
      diameter: 18,
      blades: 3,
      mode: "tractor",
      finHalfWidth: 1.3,
    },
    lights: {
      port: [-21.2, 2],
      starboard: [21.2, 2],
      tail: [0, 52],
      beacon: [0, 10],
    },
    hardpoints: {
      pods: PODS,
    },
    paint: body,
  });
})();
