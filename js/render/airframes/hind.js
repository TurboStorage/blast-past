"use strict";
/*
 * Mi-24 Hind, the hostile heavy gunship. Tandem "double bubble" canopies with
 * the gunner's bubble in the nose and the pilot's bubble raised behind it, a
 * chin gun turret, two top-mounted engines with big round dust-filter intakes
 * ahead of the mast, a slim troop-cabin fuselage, drooping anhedral stub wings
 * with two pylons and a wingtip missile rail per side, and a long boom with
 * mid-mounted stabilizers and the fin at the end. The 5-blade rotor turns
 * clockwise seen from above, so tail thrust goes to port and the tractor tail
 * rotor sits on the PORT side of the fin, as on the Mi-24V.
 *
 * Main rotor D = 78 px; overall length rotors turning ~ 1.18 D.
 */
(() => {
  const B = window.BP;
  const K = B.Kit;

  const MAST_Y = -6;
  const FUSELAGE = [
    [-31, 0],
    [-30.4, 2],
    [-28.6, 3.2],
    [-25, 3.8],
    [-21, 4.2],
    [-17, 5.2],
    [-12, 6.4],
    [-6, 7],
    [3, 7],
    [8, 5.8],
    [12, 4.4],
    [15, 3.6],
  ];
  const BOOM = [
    [12, 3.6],
    [20, 3],
    [31, 2.4],
    [41, 2],
    [46, 1.2],
  ];
  const NACELLE = [
    [-14.5, 1.6],
    [-13.5, 3],
    [-6, 3.2],
    [3, 3],
    [7.5, 1.8],
  ];
  const WING = { root: [6, -1, 8], tip: [17, 1.2, 6.2] };
  const PODS = [
    [-9.8, 4],
    [-13.6, 4],
    [9.8, 4],
    [13.6, 4],
  ];
  const RAILS = [
    [-17.6, 3],
    [17.6, 3],
  ];

  function nacelle(c, pal, side) {
    const x = side * 5;
    const path = K.hull(c, pal, NACELLE, x);
    K.camo(c, pal, path, [x - 3, -15, x + 3, 8], 11 + side);
    // Round dust-filter front on the forward intake.
    K.disc(c, pal, x + side * 1, -14.4, 3.3, pal.dark);
    K.disc(c, pal, x + side * 1, -14.4, 2.3, pal.metal);
    K.lines(
      c,
      pal.outline,
      [
        [x + side * 1 - 2.1, -14.4, x + side * 1 + 2.1, -14.4],
        [x + side * 1, -16.5, x + side * 1, -12.3],
      ],
      0.4,
    );
    // Exhaust nozzle turned aft and outboard.
    K.polygon(c, [
      [x + side * 1.4, 3.6],
      [x + side * 4.8, 6],
      [x + side * 4.4, 9.6],
      [x + side * 1, 7.6],
    ]);
    c.fillStyle = pal.metalDark;
    c.fill();
    c.strokeStyle = pal.outline;
    c.lineWidth = 0.7;
    c.stroke();
    K.disc(c, pal, x + side * 3.2, 8.4, 1, pal.exhaust);
    K.soot(c, x + side * 3.6, 9.2, 2.4, 7);
  }

  function wing(c, pal, side) {
    K.wing(c, pal, side, WING.root, WING.tip);
    // Anhedral droop: the outer panel falls away from the light and darkens.
    const g = c.createLinearGradient(side * 9, 0, side * 17, 0);
    g.addColorStop(0, "rgba(0,0,0,0)");
    g.addColorStop(1, "rgba(0,0,0,0.38)");
    K.polygon(c, [
      [side * 9, -0.2],
      [side * 17, 1.2],
      [side * 17, 6.2],
      [side * 9, 7.3],
    ]);
    c.fillStyle = g;
    c.fill();
    K.lines(c, pal.panel, [[side * 9, 0.3, side * 9, 7.3]]);
    // Pylons and the wingtip endplate launch rail.
    c.fillStyle = pal.metalDark;
    for (const [px] of PODS.filter((p) => Math.sign(p[0]) === side))
      c.fillRect(px - 0.6, 1.2, 1.2, 4);
    c.fillRect(side * 17.6 - 0.7, -1.5, 1.4, 9.5);
  }

  function cockpit(c, pal) {
    // Gunner's bubble in the nose, pilot's larger bubble raised behind it.
    K.glass(c, pal, [
      [0, -30],
      [2.6, -28.4],
      [3.1, -24.5],
      [2.2, -21.6],
      [0, -21],
      [-2.2, -21.6],
      [-3.1, -24.5],
      [-2.6, -28.4],
    ]);
    K.glass(c, pal, [
      [0, -20.2],
      [3.2, -19],
      [3.9, -15.5],
      [3.3, -12],
      [0, -11.2],
      [-3.3, -12],
      [-3.9, -15.5],
      [-3.2, -19],
    ]);
    K.lines(c, pal.frame, [
      [-2.4, -26.2, 2.4, -26.2],
      [0, -21, 0, -20.2],
      [-3.6, -17, 3.6, -17],
      [0, -20, 0, -11.4],
    ]);
  }

  function nose(c, pal) {
    // Chin gun turret under the front bubble, barrel reaching past the nose.
    K.disc(c, pal, 0, -30.2, 2.2, pal.accent);
    c.fillStyle = pal.metalDark;
    c.fillRect(-0.55, -36, 1.1, 5.2);
    c.fillStyle = pal.exhaust;
    c.fillRect(-0.7, -36.4, 1.4, 0.9);
  }

  function nosePods(c, pal) {
    // Missile guidance pod to port and rangefinder fairing to starboard.
    K.disc(c, pal, -3.6, -25.5, 1.2, pal.accent);
    K.disc(c, pal, 3.5, -24.5, 0.9, pal.accent);
  }

  function tail(c, pal) {
    const boom = K.hull(c, pal, BOOM);
    K.camo(c, pal, boom, [-4, 12, 4, 46], 5);
    // Hostile recognition band around the boom.
    c.fillStyle = pal.mark;
    c.fillRect(-2.9, 22, 5.8, 2);
    K.stabilizer(c, pal, 30, 16, 3.4, 1);
    K.fin(c, pal, 0, 36.5, 46.5, 1.2);
    c.fillStyle = pal.mark;
    c.fillRect(-1, 43.5, 2, 2.4);
  }

  function body(c, pal) {
    tail(c, pal);
    for (const side of [-1, 1]) wing(c, pal, side);
    nose(c, pal);
    const hull = K.hull(c, pal, FUSELAGE);
    K.camo(c, pal, hull, [-7, -31, 7, 15], 4);
    // Troop cabin: sliding doors and floor frames.
    K.lines(c, pal.panel, [
      [-6.4, -9, -6.4, 2],
      [6.4, -9, 6.4, 2],
      [-5.6, -9, 5.6, -9],
      [-5.6, 2, 5.6, 2],
      [-4, 10, 4, 10],
    ]);
    nosePods(c, pal);
    cockpit(c, pal);
    for (const side of [-1, 1]) nacelle(c, pal, side);
    // Main gearbox and mast fairing between the engines.
    K.plate(
      c,
      pal,
      [
        [-1.6, -11],
        [1.6, -11],
        [2, 2],
        [-2, 2],
      ],
      true,
    );
    K.disc(c, pal, 0, MAST_Y, 2.4, pal.dark);
    K.spine(c, pal, 3, 44, -0.6);
  }

  function stores(c, pal, loadout) {
    if (loadout.rockets) {
      for (const [x, y] of PODS) K.pod(c, pal, x, y, 9, 1.8, 32);
    }
    if (loadout.missiles) {
      for (const [x, y] of RAILS)
        for (const dx of [-1.3, 1.3]) K.missile(c, pal, x + dx, y, 9, 1.4);
    }
  }

  B.Airframes.define({
    id: "hind",
    name: "Mi-24 Hind gunship",
    role: "enemy",
    bounds: { x0: -20, y0: -37, x1: 20, y1: 47 },
    altitude: 22,
    livery: "sand",
    eliteLivery: "elite",
    rotors: [
      {
        x: 0,
        y: MAST_Y,
        radius: 39,
        blades: 5,
        dir: "cw",
        chord: 2.5,
        tip: "square",
      },
    ],
    tailRotor: {
      kind: "conventional",
      x: 0,
      y: 42,
      side: -1,
      diameter: 16,
      blades: 3,
      mode: "tractor",
      finHalfWidth: 1.2,
    },
    lights: {
      port: [-18, 2],
      starboard: [18, 2],
      tail: [0, 47],
      beacon: [0, 11],
    },
    hardpoints: {
      gun: [0, -30],
      muzzle: [0, -36.5],
      pods: PODS,
      rails: RAILS,
    },
    paint: body,
    stores,
  });
})();
