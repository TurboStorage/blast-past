"use strict";
/*
 * UH-60 Black Hawk with the External Stores Support System (ESSS): the hostile
 * missile carrier. Wide flat-topped cabin with a side-by-side cockpit and big
 * windscreen panels, twin engines on the roof either side of the main
 * transmission with exhausts turned outboard, ESSS stub wings over the cabin
 * doors carrying four Hellfire-style 4-round racks, a long boom ending in a
 * swept tail pylon, a large low stabilator and a tail wheel. The 4-blade CCW
 * rotor needs tail thrust to starboard; the canted tractor tail rotor sits on
 * the STARBOARD side of the pylon, leaning 20 deg, as on the real aircraft.
 *
 * Main rotor D = 76 px; overall length rotors turning ~ 1.22 D.
 */
(() => {
  const B = window.BP;
  const K = B.Kit;

  const MAST = [0, -6];
  const FUSELAGE = [
    [-30.5, 0],
    [-30, 3.2],
    [-28.6, 5.6],
    [-26, 7.2],
    [-21, 8],
    [-12, 8.2],
    [4, 8.2],
    [8, 7.4],
    [11.5, 5.2],
    [15, 3.2],
  ];
  const BOOM = [
    [12, 3.4],
    [20, 2.6],
    [30, 2.1],
    [38, 1.8],
    [43, 1.2],
  ];
  const WING = { root: [7, -3.5, 1.5], tip: [21.5, -2.2, 1.6] };
  const PYLONS = [
    [-19, -1],
    [-12.5, -1],
    [12.5, -1],
    [19, -1],
  ];

  function engine(c, pal, side) {
    const x = side * 5;
    K.hull(
      c,
      pal,
      [
        [-5, 1.4],
        [-3.5, 2.6],
        [5, 2.7],
        [9, 2],
        [10.5, 1.1],
      ],
      x,
    );
    K.disc(c, pal, x, -3.4, 1.2, pal.metalDark);
    // Hover IR suppressor duct turned outboard over the cabin roof.
    K.plate(c, pal, [
      [x + side * 1.2, 7],
      [x + side * 4.6, 8.6],
      [x + side * 4.4, 11.2],
      [x + side * 1.2, 10.4],
    ]);
    K.soot(c, x + side * 3.4, 11, 2.2, 6);
  }

  // Hellfire-style 4-round rack: a launcher beam with two rails either side.
  function rack(c, pal, x, y) {
    c.fillStyle = pal.metalDark;
    c.fillRect(x - 0.6, y - 1.6, 1.2, 3.4);
    c.fillRect(x - 2.9, y + 0.8, 5.8, 1.2);
    for (const dx of [-2.2, -0.75, 0.75, 2.2])
      K.missile(c, pal, x + dx, y + 1, 7.5, 1.2);
  }

  function wings(c, pal) {
    for (const side of [-1, 1]) {
      K.wing(c, pal, side, WING.root, WING.tip);
      K.lines(c, pal.panel, [[side * 8, -1, side * 21, -0.3]]);
      // Red recognition flash near each tip.
      c.fillStyle = pal.mark;
      c.fillRect(side * 20.2 - 0.7, -2, 1.4, 3.4);
    }
    for (const [x, y] of PYLONS) rack(c, pal, x, y);
  }

  function cockpit(c, pal) {
    // Side-by-side cockpit: two large windscreen panels either side of a post.
    for (const side of [-1, 1]) {
      K.glass(
        c,
        pal,
        [
          [side * 0.5, -28.6],
          [side * 3.6, -27.6],
          [side * 6.6, -24.6],
          [side * 6.9, -21.5],
          [side * 0.5, -21.8],
        ],
        false,
      );
    }
    // Overhead eyebrow windows and the flat cabin-roof edge.
    K.glass(
      c,
      pal,
      [
        [-6, -20.6],
        [-1.5, -20.6],
        [-1.5, -18.4],
        [-6, -18.4],
      ],
      false,
    );
    K.glass(
      c,
      pal,
      [
        [1.5, -20.6],
        [6, -20.6],
        [6, -18.4],
        [1.5, -18.4],
      ],
      false,
    );
  }

  function roof(c, pal) {
    // Flat cabin top, door tracks, and transmission fairing over the mast.
    K.lines(c, pal.panel, [
      [-7.2, -17, -7.2, 7],
      [7.2, -17, 7.2, 7],
      [-6, -17, 6, -17],
      [-7.2, -8, 7.2, -8],
      [-4, 11, 4, 11],
      [-2, 22, 2, 22],
      [-1.8, 31, 1.8, 31],
    ]);
    K.plate(
      c,
      pal,
      [
        [0, -12],
        [2.3, -10],
        [2.4, -2],
        [0, 0],
        [-2.4, -2],
        [-2.3, -10],
      ],
      true,
    );
    K.disc(c, pal, MAST[0], MAST[1], 2.2, pal.dark);
  }

  function gear(c, pal) {
    // Main gear struts poke out below the cabin; tail wheel axle under the boom.
    c.fillStyle = pal.metalDark;
    for (const side of [-1, 1]) {
      c.fillRect(side * 8 - (side < 0 ? 2.4 : 0), -15.6, 2.4, 1.2);
      K.disc(c, pal, side * 10.2, -15, 1.1, pal.metalDark);
    }
    c.fillRect(-2.9, 29.4, 5.8, 0.9);
    K.disc(c, pal, 0, 29.8, 1.1, pal.exhaust);
  }

  function tail(c, pal) {
    // Large stabilator low at the tail end, drawn under the swept pylon.
    K.stabilizer(c, pal, 36, 21, 5.2, 0.8);
    c.fillStyle = pal.mark;
    for (const side of [-1, 1]) c.fillRect(side * 9.3 - 0.8, 37, 1.6, 3.2);
    K.fin(c, pal, 0, 30, 46, 1.4);
  }

  function body(c, pal) {
    gear(c, pal);
    const boomPath = K.hull(c, pal, BOOM);
    K.camo(c, pal, boomPath, [-4, 12, 4, 44], 5);
    tail(c, pal);
    const hull = K.hull(c, pal, FUSELAGE);
    K.camo(c, pal, hull, [-9, -30, 9, 16], 11);
    K.spine(c, pal, 4, 42);
    roof(c, pal);
    for (const side of [-1, 1]) engine(c, pal, side);
    cockpit(c, pal);
    wings(c, pal);
    // Hostile recognition band across the boom and a tactical number.
    c.fillStyle = pal.mark;
    c.fillRect(-2.3, 16, 4.6, 1.6);
    c.font = "bold 3.6px Consolas, monospace";
    c.textAlign = "center";
    c.fillText("60", 0, 26);
  }

  B.Airframes.define({
    id: "blackHawk",
    name: "UH-60 Black Hawk (ESSS)",
    role: "enemy",
    bounds: { x0: -23, y0: -31, x1: 23, y1: 47 },
    altitude: 22,
    livery: "sand",
    eliteLivery: "elite",
    rotors: [
      {
        x: MAST[0],
        y: MAST[1],
        radius: 38,
        blades: 4,
        dir: "ccw",
        chord: 2.5,
        tip: "swept",
      },
    ],
    tailRotor: {
      kind: "canted",
      cant: 0.35,
      x: 0,
      y: 41,
      side: 1,
      diameter: 16,
      blades: 4,
      mode: "tractor",
      finHalfWidth: 1.4,
    },
    lights: {
      port: [-22, -1],
      starboard: [22, -1],
      tail: [0, 46],
      beacon: [0, 6],
    },
    hardpoints: {
      gun: [0, -22],
      muzzle: [0, -31],
      rails: PYLONS.map(([x, y]) => [x, y - 3]),
    },
    paint: body,
  });
})();
