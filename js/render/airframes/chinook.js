"use strict";
/*
 * CH-47 Chinook, hostile heavy lift. Tandem rotors on a long flat-sided box
 * fuselage: rounded nose with side-by-side cockpit glazing, a low forward
 * pylon over the cockpit, a synchronising-shaft tunnel and walkways along the
 * roof, and a tall aft pylon with a turboshaft pod on each side at the very
 * back. Long fuel sponsons bulge from the lower sides; the loading ramp closes
 * the tail. The front rotor turns CCW and the rear CW, so their torques cancel
 * and there is no tail rotor. Rear rotor is listed last so it draws on top,
 * as the aft pylon is the taller one.
 *
 * Rotor D = 66 px, hub spacing 43 px (35% overlap), length rotors turning 109.
 * Fuselage is ~30% wider than true scale for readability.
 */
(() => {
  const B = window.BP;
  const K = B.Kit;

  const FUSELAGE = [
    [-31.5, 0],
    [-31, 3.4],
    [-29.6, 6.2],
    [-27, 8],
    [-23, 8.8],
    [-14, 9],
    [10, 9],
    [22, 8.8],
    [27, 8.2],
    [30.5, 7],
    [31.5, 5],
  ];
  const FWD_PYLON = [
    [-28, 0.6],
    [-26.5, 3],
    [-23, 4.4],
    [-18, 4.4],
    [-13, 3.2],
    [-10.5, 1],
  ];
  const AFT_PYLON = [
    [-2, 0.8],
    [0.5, 3.6],
    [6, 5.2],
    [18, 5.8],
    [28, 5.6],
    [32.5, 4.2],
    [34, 0.8],
  ];
  const ENGINE = [
    [16.5, 1.2],
    [18, 2.9],
    [21, 3.1],
    [28, 3],
    [31.5, 2.3],
    [33, 1.2],
  ];
  const ENGINE_X = 9.4;

  function sponsons(c, pal) {
    for (const side of [-1, 1]) {
      K.plate(
        c,
        pal,
        [
          [side * 7, -17],
          [side * 11.6, -14.5],
          [side * 13.2, -8],
          [side * 13.2, 6],
          [side * 11.8, 11.5],
          [side * 7, 13.5],
        ],
        true,
      );
      // Fuel cell seams across the sponson.
      K.lines(c, pal.panel, [
        [side * 9.2, -10, side * 12.6, -10],
        [side * 9.2, -2, side * 13.1, -2],
        [side * 9.2, 5.5, side * 12.8, 5.5],
      ]);
    }
  }

  function roof(c, pal) {
    // Walkway edges, frame lines, and the aft loading ramp outline.
    K.lines(c, pal.panel, [
      [-5.6, -22, -5.6, 26],
      [5.6, -22, 5.6, 26],
      [-8.4, -8, 8.4, -8],
      [-8.4, 2, -5.6, 2],
      [5.6, 2, 8.4, 2],
      [-8.6, 12, 8.6, 12],
      [-8.6, 20, 8.6, 20],
    ]);
    K.lines(
      c,
      pal.outline,
      [
        [-7.6, 25.5, 7.6, 25.5],
        [-7.6, 25.5, -6.6, 31.2],
        [7.6, 25.5, 6.6, 31.2],
      ],
      0.7,
    );
    // Walkway anti-slip strips.
    c.fillStyle = pal.accent + "66";
    c.fillRect(-5.2, -8, 1.4, 20);
    c.fillRect(3.8, -8, 1.4, 20);
    // Synchronising shaft tunnel linking the two pylons.
    K.hull(c, pal, [
      [-12, 0.8],
      [-10.5, 2],
      [0, 2],
      [2, 0.8],
    ]);
  }

  function cockpit(c, pal) {
    // Side-by-side pilots: one wrap-around pane each side of the centre post.
    for (const side of [-1, 1]) {
      K.glass(
        c,
        pal,
        [
          [side * 0.7, -30.8],
          [side * 4.2, -30],
          [side * 7, -27.8],
          [side * 7.8, -24.2],
          [side * 4.6, -23.6],
          [side * 0.8, -25.6],
        ],
        false,
      );
    }
    K.lines(c, pal.frame, [
      [-4.6, -30, -4.8, -23.8],
      [4.6, -30, 4.8, -23.8],
    ]);
  }

  function forwardPylon(c, pal) {
    K.hull(c, pal, FWD_PYLON);
    K.lines(c, pal.panel, [
      [-3.6, -20, 3.6, -20],
      [-3.4, -15, 3.4, -15],
    ]);
    K.spine(c, pal, -26, -12, -1.4);
  }

  function engine(c, pal, side) {
    const x = side * ENGINE_X;
    K.hull(c, pal, ENGINE, x);
    // Intake screen, cowling seam, and exhaust with soot trailing aft.
    K.disc(c, pal, x, 18.2, 1.9, pal.accent);
    K.lines(c, pal.panel, [[x - 2.8, 25.5, x + 2.8, 25.5]]);
    K.disc(c, pal, x, 32, 1.2, pal.exhaust);
    K.soot(c, x, 33, 2.2, 3.5);
  }

  function aftPylon(c, pal) {
    for (const side of [-1, 1]) engine(c, pal, side);
    const path = K.hull(c, pal, AFT_PYLON);
    // The aft pylon stands taller, so it catches more light.
    c.save();
    path();
    c.clip();
    c.fillStyle = "#ffffff1c";
    c.fillRect(-6, -2, 12, 37);
    c.restore();
    K.spine(c, pal, 3, 32, -1.8);
    K.lines(c, pal.panel, [
      [-5.4, 10, 5.4, 10],
      [-5.4, 26, 5.4, 26],
    ]);
  }

  function markings(c, pal) {
    // Hostile red recognition flashes on the sponsons and aft pylon.
    c.fillStyle = pal.mark;
    for (const side of [-1, 1]) c.fillRect(side * 12 - 1, -7, 2, 4);
    c.fillRect(-4.4, 28, 8.8, 1.6);
    c.font = "bold 4px Consolas, monospace";
    c.textAlign = "center";
    c.fillText("47", 0, 17.5);
  }

  function body(c, pal) {
    sponsons(c, pal);
    const hull = K.hull(c, pal, FUSELAGE);
    K.camo(c, pal, hull, [-9, -31, 9, 31], 11);
    roof(c, pal);
    cockpit(c, pal);
    forwardPylon(c, pal);
    aftPylon(c, pal);
    markings(c, pal);
  }

  B.Airframes.define({
    id: "chinook",
    name: "CH-47 Chinook",
    role: "enemy",
    bounds: { x0: -14, y0: -32, x1: 14, y1: 37 },
    altitude: 22,
    livery: "olive",
    eliteLivery: "elite",
    rotors: [
      { x: 0, y: -21.5, radius: 33, blades: 3, dir: "ccw", chord: 2.8 },
      { x: 0, y: 21.5, radius: 33, blades: 3, dir: "cw", chord: 2.8 },
    ],
    tailRotor: { kind: "none" },
    lights: {
      port: [-13, 0],
      starboard: [13, 0],
      tail: [0, 34],
      beacon: [0, -4],
    },
    hardpoints: {},
    paint: body,
  });
})();
