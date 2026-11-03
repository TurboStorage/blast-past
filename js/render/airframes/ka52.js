"use strict";
/*
 * Ka-52 Alligator, the elite gunship. Kamov coaxial layout: two contra-rotating
 * 3-blade rotors on one tall mast, so there is no tail rotor and no anti-torque
 * offset. Recognition cues from above: the wide rounded nose with SIDE-BY-SIDE
 * two-seat glazing, a tall mast fairing with a mast-top sight dome, wide stub
 * wings with three stations and wingtip EW pods, twin engine nacelles with
 * outboard exhaust diffusers, and a slim boom ending in a stabilizer with
 * endplate fins plus a central fin. The 30 mm cannon rides on the starboard
 * side of the fuselage.
 *
 * Main rotor D = 72 px; overall length rotors turning ~ 1.10 D.
 */
(() => {
  const B = window.BP;
  const K = B.Kit;
  const TAU = Math.PI * 2;
  const MAST = [0, -3];

  const FUSELAGE = [
    [-32, 0],
    [-31.4, 3],
    [-29.6, 5.2],
    [-26.5, 6.6],
    [-21, 7.3],
    [-13, 7.4],
    [-7, 6.8],
    [0, 6],
    [6, 5.2],
    [11, 4.4],
    [14, 3.7],
    [17, 3.1],
  ];
  const BOOM = [
    [14, 3.4],
    [20, 2.7],
    [28, 2.2],
    [35, 1.9],
    [38.5, 1.1],
  ];
  const MAST_FAIRING = [
    [-11, 0.6],
    [-9, 2.4],
    [-5, 3.3],
    [3, 3.3],
    [8, 2.4],
    [12, 0.8],
  ];
  const WING = { root: [6, -5.5, 3.5], tip: [18.2, -3.8, 2] };
  const STATIONS = [
    [-9.5, 0],
    [-12.8, 0],
    [-16, 0],
    [9.5, 0],
    [12.8, 0],
    [16, 0],
  ];
  const TIP_POD_X = 19;
  const STAB = { y: 30.5, span: 19, chord: 4 };
  const GUN_X = 7.8;

  function nacelle(c, pal, side) {
    const x = side * 8.6;
    K.hull(
      c,
      pal,
      [
        [-8.5, 1.2],
        [-6.8, 2.8],
        [4, 3.1],
        [8.5, 2.7],
        [10.5, 1.5],
      ],
      x,
    );
    // Dust-protected intake face and a bleed louvre line.
    K.disc(c, pal, x, -6.2, 1.6, pal.accent);
    K.lines(c, pal.panel, [[x - 1.6, 2, x + 1.6, 2]]);
    // Exhaust diffuser box angled outboard and aft.
    K.plate(c, pal, [
      [x + side * 0.8, 7.5],
      [x + side * 4.2, 9.5],
      [x + side * 4.4, 13],
      [x + side * 1.2, 11.8],
    ]);
    c.fillStyle = pal.exhaust;
    c.fillRect(x + side * 2.8 - 1.2, 12.3, 2.4, 1);
    K.soot(c, x + side * 3, 13, 2.6, 6);
  }

  function tipPod(c, pal, side) {
    const x = side * TIP_POD_X;
    K.hull(
      c,
      pal,
      [
        [-6, 0.4],
        [-4.8, 1.3],
        [2.5, 1.4],
        [4.2, 0.9],
        [4.8, 0.3],
      ],
      x,
    );
    // Missile-warning sensor window and flare cassette on the aft end.
    K.disc(c, pal, x, -4.6, 0.7, pal.glass[1]);
    c.fillStyle = pal.metalDark;
    c.fillRect(x - 0.9, 2.2, 1.8, 1.6);
  }

  function wings(c, pal) {
    for (const side of [-1, 1]) {
      K.wing(c, pal, side, WING.root, WING.tip);
      c.fillStyle = pal.metalDark;
      for (const [x] of STATIONS.filter((p) => Math.sign(p[0]) === side))
        c.fillRect(x - 0.6, -2.4, 1.2, 4);
      tipPod(c, pal, side);
    }
  }

  function tail(c, pal) {
    const boomPath = K.hull(c, pal, BOOM);
    K.camo(c, pal, boomPath, [-4, 14, 4, 39], 5);
    K.stabilizer(c, pal, STAB.y, STAB.span, STAB.chord, 0.5);
    // Endplate fins at the stabilizer tips, toed slightly for yaw stability.
    for (const side of [-1, 1]) K.fin(c, pal, side * 9.3, 28.2, 36.2, 0.9);
    K.fin(c, pal, 0, 25, 40, 1.2);
  }

  function cockpit(c, pal) {
    // One wide canopy: pilot to port, navigator-operator to starboard.
    K.glass(c, pal, [
      [0, -27.4],
      [4.4, -26.4],
      [6, -22],
      [6, -14.5],
      [3.4, -12.2],
      [-3.4, -12.2],
      [-6, -14.5],
      [-6, -22],
      [-4.4, -26.4],
    ]);
    K.lines(c, pal.frame, [
      [0, -27, 0, -12.4],
      [-5.2, -22.6, 5.2, -22.6],
      [-5.8, -17.5, -0.4, -17.5],
      [0.4, -17.5, 5.8, -17.5],
    ]);
  }

  function nose(c, pal) {
    // Radome seam, the sighting-system ball peeking out under the chin.
    K.lines(c, pal.panel, [
      [-5.4, -28.6, 5.4, -28.6],
      [-7.1, -11, -6.4, -3],
      [7.1, -11, 6.4, -3],
    ]);
    c.fillStyle = pal.accent;
    c.beginPath();
    c.arc(0, -30.4, 1.4, 0, TAU);
    c.fill();
  }

  function gun(c, pal) {
    // Starboard-side 2A42 cannon; the nacelle hides its breech from above.
    K.plate(c, pal, [
      [GUN_X - 1.1, -4],
      [GUN_X + 1.1, -4],
      [GUN_X + 1, 3],
      [GUN_X - 1, 3],
    ]);
    c.fillStyle = pal.metalDark;
    c.fillRect(GUN_X - 0.45, -17, 0.9, 13.2);
    c.fillRect(GUN_X - 0.7, -17.6, 1.4, 1.4);
  }

  function markings(c, pal) {
    c.fillStyle = pal.mark;
    c.font = "bold 4px Consolas, monospace";
    c.textAlign = "center";
    c.fillText("52", 0, 24);
    // Gold trim chevron across the nose.
    c.strokeStyle = pal.mark;
    c.lineWidth = 0.8;
    c.beginPath();
    c.moveTo(-4.4, -29.2);
    c.lineTo(0, -30.9);
    c.lineTo(4.4, -29.2);
    c.stroke();
  }

  function body(c, pal) {
    tail(c, pal);
    wings(c, pal);
    gun(c, pal);
    for (const side of [-1, 1]) nacelle(c, pal, side);
    const hull = K.hull(c, pal, FUSELAGE);
    K.camo(c, pal, hull, [-8, -32, 8, 17], 9);
    nose(c, pal);
    K.lines(c, pal.panel, [
      [-4, -9, 4, -9],
      [-3.4, 12, 3.4, 12],
    ]);
    K.hull(c, pal, MAST_FAIRING);
    K.spine(c, pal, -10, 36);
    cockpit(c, pal);
    K.disc(c, pal, MAST[0], MAST[1], 2.4, pal.dark);
    markings(c, pal);
  }

  // Mast-top sight dome sits above both rotor hubs, so it paints after them.
  function overlay(c, pal) {
    K.disc(c, pal, MAST[0], MAST[1], 1.9, pal.accent);
    c.fillStyle = pal.mark;
    c.fillRect(MAST[0] - 0.6, MAST[1] - 1.5, 1.2, 0.7);
  }

  function stores(c, pal, loadout) {
    const inner = STATIONS.filter((p) => Math.abs(p[0]) < 14),
      outer = STATIONS.filter((p) => Math.abs(p[0]) > 14);
    if (loadout.rockets)
      for (const [x, y] of inner) K.pod(c, pal, x, y + 1, 9, 1.5, 20);
    if (loadout.missiles)
      for (const [x, y] of outer)
        for (const dx of [-0.8, 0.8])
          K.missile(c, pal, x + dx, y + 1.5, 8, 1.1);
  }

  B.Airframes.define({
    id: "ka52",
    name: "Ka-52 Alligator",
    role: "elite",
    bounds: { x0: -21, y0: -33, x1: 21, y1: 41 },
    altitude: 22,
    livery: "elite",
    eliteLivery: "elite",
    rotors: [
      {
        x: MAST[0],
        y: MAST[1],
        radius: 36,
        blades: 3,
        dir: "cw",
        chord: 2.9,
        tip: "swept",
        coaxial: true,
      },
    ],
    tailRotor: { kind: "none" },
    lights: {
      port: [-20, -1],
      starboard: [20, -1],
      tail: [0, 40],
      beacon: [0, 14],
    },
    hardpoints: {
      gun: [GUN_X, -4],
      muzzle: [GUN_X, -18],
      pods: STATIONS,
    },
    paint: body,
    overlay,
    stores,
  });
})();
