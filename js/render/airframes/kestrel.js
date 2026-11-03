"use strict";
/*
 * AH-87 Kestrel, the player gunship. Apache/Viper inspired: tandem stepped
 * canopy with the gunner in front, nose sensor turret and chin gun, cheek
 * avionics bays, side engine nacelles, straight stub wings with pylons and
 * wingtip rails, a low stabilator and a 4-blade CCW rotor. The CCW rotor needs
 * tail thrust to starboard, so the pusher tail rotor sits on the PORT side of
 * the fin, as on the AH-64.
 *
 * Main rotor D = 84 px; overall length rotors turning ~ 1.21 D.
 */
(() => {
  const B = window.BP;
  const K = B.Kit;

  const FUSELAGE = [
    [-39, 0],
    [-38, 2.4],
    [-35, 3.8],
    [-30, 4.2],
    [-23, 4.8],
    [-14, 5.6],
    [-8, 7.2],
    [2, 7.4],
    [9, 6.2],
    [15, 4.4],
    [21, 3.3],
  ];
  const BOOM = [
    [18, 3.4],
    [30, 2.8],
    [44, 2.4],
    [52, 2.1],
    [55, 1.2],
  ];
  const WING = { root: [6, -1.5, 6.5], tip: [18, 0.2, 5.8] };
  const HP = B.Hardpoints.player;
  const PODS = [...HP.missileRails, ...HP.rocketPods];

  function nacelle(c, pal, side) {
    const x = side * 9.6;
    K.hull(
      c,
      pal,
      [
        [-9, 0.8],
        [-7, 3],
        [8, 3.2],
        [14, 2.4],
        [16, 1.2],
      ],
      x,
    );
    K.disc(c, pal, x, -6.2, 1.8, pal.accent);
    // IR suppressor exhaust turned outboard.
    K.plate(c, pal, [
      [x + side * 1.5, 11],
      [x + side * 5.2, 12.5],
      [x + side * 5, 15.5],
      [x + side * 1.5, 15],
    ]);
    K.soot(c, x + side * 3.4, 15, 2.6, 7);
  }

  function wings(c, pal) {
    for (const side of [-1, 1]) {
      K.wing(c, pal, side, WING.root, WING.tip);
      // Wingtip launch rail and pylons.
      c.fillStyle = pal.metalDark;
      c.fillRect(side * 18.6 - 0.8, -3, 1.6, 9);
      for (const x of [11.5, 15.5]) c.fillRect(side * x - 0.7, 0.5, 1.4, 4);
    }
  }

  function cockpit(c, pal) {
    // Gunner (front) and raised pilot (rear) canopies with flat-plate framing.
    K.glass(c, pal, [
      [0, -34],
      [3.6, -30],
      [3.8, -23],
      [0, -21.5],
      [-3.8, -23],
      [-3.6, -30],
    ]);
    K.glass(c, pal, [
      [0, -20.5],
      [4.4, -17],
      [4.6, -9],
      [0, -7.5],
      [-4.6, -9],
      [-4.4, -17],
    ]);
    K.lines(c, pal.frame, [
      [0, -33, 0, -22],
      [0, -20, 0, -8],
      [-3.6, -26.5, 3.6, -26.5],
      [-4.4, -13, 4.4, -13],
    ]);
  }

  function body(c, pal) {
    const boomPath = K.hull(c, pal, BOOM);
    K.camo(c, pal, boomPath, [-4, 18, 4, 56], 3);
    K.stabilizer(c, pal, 50, 20, 4.2, 0.6);
    wings(c, pal);
    for (const side of [-1, 1]) nacelle(c, pal, side);
    const hull = K.hull(c, pal, FUSELAGE);
    K.camo(c, pal, hull, [-8, -39, 8, 21], 7);
    // Cheek avionics bays and walkway panels.
    K.lines(c, pal.panel, [
      [-6.6, -12, -6.8, 4],
      [6.6, -12, 6.8, 4],
      [-4, 3, 4, 3],
      [-3, 12, 3, 12],
      [-2.4, 22, 2.4, 22],
      [-2.2, 34, 2.2, 34],
    ]);
    K.spine(c, pal, -6, 50);
    cockpit(c, pal);
    // Nose sensor turret, chin gun barrel just visible past the nose.
    K.disc(c, pal, 0, -36.5, 2.6, pal.accent);
    c.fillStyle = pal.glass[1];
    c.fillRect(-1.2, -38.2, 2.4, 1.2);
    c.fillStyle = pal.metalDark;
    c.fillRect(-0.5, -42, 1, 5);
    // Engine deck, mast fairing, low-vis number.
    K.disc(c, pal, 0, -4, 3.2, pal.dark);
    K.fin(c, pal, 0, 44, 57, 1.3);
    c.fillStyle = pal.mark;
    c.font = "bold 4px Consolas, monospace";
    c.textAlign = "center";
    c.fillText("87", 0, 30);
  }

  function stores(c, pal, loadout) {
    if (loadout.rockets) {
      for (const [x, y] of HP.rocketPods) K.pod(c, pal, x, y, 10, 2.1, 19);
    }
    if (loadout.missiles) {
      for (const [x, y] of HP.missileRails)
        for (const dx of [-1.1, 1.1]) K.missile(c, pal, x + dx, y, 8, 1.3);
    }
  }

  B.Airframes.define({
    id: "kestrel",
    name: "AH-87 Kestrel",
    role: "player",
    bounds: { x0: -21, y0: -43, x1: 21, y1: 58 },
    altitude: 24,
    livery: "ghost",
    eliteLivery: "elite",
    rotors: [
      {
        x: 0,
        y: -4,
        radius: 42,
        blades: 4,
        dir: "ccw",
        chord: 3.2,
        tip: "swept",
      },
    ],
    tailRotor: {
      kind: "conventional",
      x: 0,
      y: 50,
      side: -1,
      diameter: 17,
      blades: 4,
      mode: "pusher",
      finHalfWidth: 1.3,
    },
    lights: {
      port: [-19, 1],
      starboard: [19, 1],
      tail: [0, 57],
      beacon: [0, 9],
    },
    hardpoints: {
      gun: HP.gun,
      muzzle: HP.muzzle,
      pods: PODS,
    },
    paint: body,
    stores,
  });
})();
