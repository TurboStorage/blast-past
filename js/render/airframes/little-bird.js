"use strict";
/*
 * MH-6 Sparrow scout, a hostile light attack helicopter. MD 500 / AH-6 Little
 * Bird inspired: egg-shaped cabin widest near the mast, a bubble of glazing
 * over the whole front with side-by-side seats, external weapon planks across
 * the cabin carrying a minigun pod to port and a rocket pod to starboard, a
 * skinny tapering boom and a T-tail with endplates. The 5-blade rotor turns CCW
 * (US design), so tail thrust points to starboard and the 2-blade pusher tail
 * rotor sits on the PORT side of the fin.
 *
 * Main rotor D = 50 px; overall length rotors turning ~ 1.2 D.
 */
(() => {
  const B = window.BP;
  const K = B.Kit;

  const MAST = [0, -4];
  const CABIN = [
    [-17.5, 0],
    [-16.6, 3.4],
    [-14, 5.6],
    [-10, 6.8],
    [-5, 7.2],
    [0, 6.8],
    [4, 5.6],
    [7, 3.8],
    [9.5, 2.1],
  ];
  const BOOM = [
    [8, 2],
    [14, 1.55],
    [22, 1.2],
    [28, 0.95],
    [30, 0.5],
  ];
  const PLANK_Y = -1;
  const GUN_POD = [-10.6, 0];
  const ROCKET_POD = [10.6, 0.4];

  function glazing(c, pal) {
    // One continuous bubble wrapping the nose; roof windows over both seats.
    K.glass(c, pal, [
      [0, -17],
      [3.4, -16.2],
      [5.6, -13.5],
      [6.5, -9.5],
      [6.2, -6.5],
      [3, -5.4],
      [0, -5.2],
      [-3, -5.4],
      [-6.2, -6.5],
      [-6.5, -9.5],
      [-5.6, -13.5],
      [-3.4, -16.2],
    ]);
    // Centre post between the two seats and the windscreen bow.
    K.lines(c, pal.frame, [
      [0, -16.6, 0, -5.4],
      [-5.2, -13, -2.5, -14.2],
      [2.5, -14.2, 5.2, -13],
      [-2.5, -14.2, 2.5, -14.2],
    ]);
  }

  function planks(c, pal) {
    // Weapon planks run straight across the cabin behind the doors.
    c.fillStyle = pal.metalDark;
    c.fillRect(-11.6, PLANK_Y - 1, 23.2, 2);
    c.fillStyle = pal.metal;
    c.fillRect(-11.6, PLANK_Y - 1, 23.2, 0.6);
    c.strokeStyle = pal.outline;
    c.lineWidth = 0.5;
    c.strokeRect(-11.6, PLANK_Y - 1, 23.2, 2);
  }

  function weapons(c, pal) {
    const [gx, gy] = GUN_POD;
    K.pod(c, pal, gx, gy, 7, 1.7);
    // Six-barrel minigun muzzle cluster ahead of the pod.
    c.fillStyle = pal.metalDark;
    c.fillRect(gx - 0.7, gy - 7.5, 1.4, 4.2);
    c.fillStyle = pal.exhaust;
    c.fillRect(gx - 0.8, gy - 7.8, 1.6, 0.6);
    const [rx, ry] = ROCKET_POD;
    K.pod(c, pal, rx, ry, 8, 2, 7);
  }

  function tail(c, pal) {
    const boomPath = K.hull(c, pal, BOOM);
    K.camo(c, pal, boomPath, [-2, 8, 2, 30], 5);
    // Hostile red tail band.
    c.fillStyle = pal.mark;
    c.fillRect(-1.6, 15, 3.2, 2);
    // Small V-ish ventral fin under the tail cone, seen as a slab.
    K.fin(c, pal, 0, 19, 30.5, 0.9);
    // T-tail stabilizer on top of the fin, with endplate fins at the tips.
    K.stabilizer(c, pal, 20, 12, 2.6, 0.5);
    for (const side of [-1, 1]) {
      c.fillStyle = pal.dark;
      c.fillRect(side * 6 - 0.6, 19.2, 1.2, 4.2);
      c.fillStyle = pal.mark;
      c.fillRect(side * 6 - 0.6, 19.2, 1.2, 1.2);
    }
  }

  function cabin(c, pal) {
    // Engine exhaust at the bottom of the tail cone, soot trailing aft.
    K.soot(c, 0, 9, 2.4, 6);
    const hull = K.hull(c, pal, CABIN);
    K.camo(c, pal, hull, [-7, -18, 7, 10], 11);
    // Door frames and the engine access panel behind the mast.
    K.lines(c, pal.panel, [
      [-6.9, -4, -6.9, 2.5],
      [6.9, -4, 6.9, 2.5],
      [-4.8, 4, 4.8, 4],
      [-2.5, 8.2, 2.5, 8.2],
    ]);
    glazing(c, pal);
    K.spine(c, pal, -6, 8);
    // Mast fairing and the engine air intake grille behind it.
    K.disc(c, pal, MAST[0], MAST[1], 2.4, pal.dark);
    K.plate(c, pal, [
      [-2, 1.2],
      [2, 1.2],
      [1.6, 4.8],
      [-1.6, 4.8],
    ]);
    K.lines(c, pal.panel, [[-1.5, 3, 1.5, 3]], 0.5);
  }

  function body(c, pal) {
    tail(c, pal);
    planks(c, pal);
    cabin(c, pal);
    weapons(c, pal);
  }

  B.Airframes.define({
    id: "littleBird",
    name: "MH-6 Sparrow scout",
    role: "enemy",
    bounds: { x0: -12.6, y0: -18.5, x1: 12.6, y1: 31 },
    altitude: 18,
    livery: "sand",
    eliteLivery: "elite",
    rotors: [
      {
        x: MAST[0],
        y: MAST[1],
        radius: 25,
        blades: 5,
        dir: "ccw",
        chord: 1.6,
        tip: "square",
      },
    ],
    tailRotor: {
      kind: "conventional",
      x: 0,
      y: 26,
      side: -1,
      diameter: 10,
      blades: 2,
      mode: "pusher",
      finHalfWidth: 0.9,
    },
    lights: {
      port: [-11.6, PLANK_Y],
      starboard: [11.6, PLANK_Y],
      tail: [0, 30.5],
      beacon: [0, 6.5],
    },
    hardpoints: {
      gun: GUN_POD,
      muzzle: [GUN_POD[0], GUN_POD[1] - 8],
      pods: [ROCKET_POD],
    },
    paint: body,
  });
})();
