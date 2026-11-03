"use strict";
/*
 * Hostile fixed-wing airframes.
 *
 * "jet": Su-series style light interceptor. Pointed radome, bubble canopy,
 * leading-edge root extensions blending into swept wings with wingtip rails,
 * twin outward-canted fins (thin slabs from above), all-moving tailplanes and
 * twin engine nozzles. Length 44 px, span 30 px.
 *
 * "munition": Shahed-style one-way attack drone. Cropped delta wing with tip
 * winglets, slim body with a warhead nose and a rear pusher propeller. The prop
 * turns in a vertical plane, so from above it is a foreshortened blur drawn
 * live in overlay(). Length 26 px, span 30 px.
 */
(() => {
  const B = window.BP;
  const K = B.Kit;
  const TAU = Math.PI * 2;

  // ---------------------------------------------------------------- jet

  const JET_BODY = [
    [-22, 0],
    [-20.5, 0.8],
    [-17, 1.7],
    [-12, 2.4],
    [-6, 2.8],
    [-1, 3.4],
    [6, 3.3],
    [12, 2.3],
    [18, 1.4],
    [22.5, 0.9],
    [24, 0.3],
  ];
  // Widely spaced engine nacelles with the tunnel between them.
  const JET_NACELLE = [
    [-2, 1],
    [3, 2.1],
    [17, 2.1],
    [19.6, 1.8],
  ];
  const NACELLE_X = 2.9;

  function jetWings(c, pal) {
    for (const s of [-1, 1]) {
      // Wing with the LERX blended into its root.
      K.plate(c, pal, [
        [s * 2.2, -13],
        [s * 3.4, -6],
        [s * 5.2, -1],
        [s * 14.2, 7],
        [s * 14.2, 10],
        [s * 9, 10.6],
        [s * 4, 11.5],
      ]);
      // Wingtip launch rail.
      c.fillStyle = pal.metalDark;
      c.fillRect(s * 14.8 - 0.8, 3.2, 1.6, 8.6);
      // Hinge line of the flaperons.
      K.lines(c, pal.panel, [[s * 5, 9.4, s * 13.6, 8.8]]);
      // Red recognition star on the upper wing.
      c.fillStyle = pal.mark;
      c.beginPath();
      c.arc(s * 10, 6.4, 1.3, 0, TAU);
      c.fill();
    }
  }

  function jetTail(c, pal) {
    for (const s of [-1, 1]) {
      K.plate(c, pal, [
        [s * 3.8, 13.5],
        [s * 10.4, 18.6],
        [s * 10.4, 21.2],
        [s * 4, 21],
      ]);
    }
  }

  function jetEngines(c, pal) {
    for (const s of [-1, 1]) {
      const x = s * NACELLE_X;
      // Nozzle petals: metal ring with a dark exhaust throat.
      c.fillStyle = pal.metal;
      c.fillRect(x - 1.6, 19, 3.2, 2.6);
      c.fillStyle = pal.exhaust;
      c.beginPath();
      c.ellipse(x, 21, 1.15, 0.9, 0, 0, TAU);
      c.fill();
      c.strokeStyle = pal.outline;
      c.lineWidth = 0.6;
      c.strokeRect(x - 1.6, 19, 3.2, 2.6);
      K.soot(c, x, 21.6, 2.2, 3);
    }
  }

  function jetFins(c, pal) {
    // Canted outward: the slab leans out, so the outboard face shows as light.
    for (const s of [-1, 1]) {
      K.fin(c, pal, s * 4.4, 9.5, 20, 1);
      c.fillStyle = pal.mark;
      c.fillRect(s * 4.4 - 0.5, 16.6, 1, 1.4);
    }
  }

  function jetCockpit(c, pal) {
    K.glass(c, pal, [
      [0, -15.5],
      [1.6, -13],
      [1.8, -8.5],
      [0, -6.2],
      [-1.8, -8.5],
      [-1.6, -13],
    ]);
    // Radome seam and pitot tip.
    K.lines(c, pal.panel, [[-1.6, -17.5, 1.6, -17.5]]);
    c.fillStyle = pal.metalDark;
    c.fillRect(-0.3, -23.4, 0.6, 1.8);
  }

  function jetBody(c, pal) {
    jetTail(c, pal);
    jetWings(c, pal);
    for (const s of [-1, 1]) {
      const nacelle = K.hull(c, pal, JET_NACELLE, s * NACELLE_X);
      K.camo(
        c,
        pal,
        nacelle,
        [s * NACELLE_X - 2, -2, s * NACELLE_X + 2, 20],
        2,
      );
    }
    const hull = K.hull(c, pal, JET_BODY);
    K.camo(c, pal, hull, [-4, -18, 4, 24], 5);
    // Intake lips under the LERX, spine and panel lines.
    c.fillStyle = pal.accent;
    for (const s of [-1, 1]) c.fillRect(s * 3.3 - 0.6, -4.5, 1.2, 3.5);
    K.lines(c, pal.panel, [
      [-2.6, -4, 2.6, -4],
      [-3.2, 4, 3.2, 4],
    ]);
    K.spine(c, pal, -5, 20, -0.5);
    jetEngines(c, pal);
    jetFins(c, pal);
    jetCockpit(c, pal);
  }

  B.Airframes.define({
    id: "jet",
    name: "Su-series interceptor",
    role: "interceptor",
    bounds: { x0: -15.8, y0: -23.6, x1: 15.8, y1: 25 },
    altitude: 22,
    livery: "sand",
    eliteLivery: "elite",
    rotors: [],
    tailRotor: { kind: "none" },
    lights: {
      port: [-14.8, 4],
      starboard: [14.8, 4],
      tail: [0, 24],
    },
    hardpoints: {
      gun: [3, -8],
      muzzle: [0, -23],
      rails: [
        [-14.8, 7],
        [14.8, 7],
      ],
    },
    paint: jetBody,
  });

  // ----------------------------------------------------------- munition

  const MUNITION_BODY = [
    [-13, 0],
    [-11.8, 1.1],
    [-9.5, 1.8],
    [-5, 2.1],
    [4, 2.1],
    [9, 1.8],
    [11, 1.3],
  ];
  const PROP = { y: 12, radius: 4.8 };

  function munitionWings(c, pal) {
    for (const s of [-1, 1]) {
      K.plate(c, pal, [
        [s * 1.6, -7.5],
        [s * 14.6, 6.2],
        [s * 14.6, 9.4],
        [s * 1.6, 9.6],
      ]);
      K.lines(c, pal.panel, [[s * 3, 8.2, s * 13.8, 8.2]]);
      // Tip winglets: small vertical slabs.
      K.fin(c, pal, s * 14.9, 3.6, 11, 1);
    }
  }

  function munitionBody(c, pal) {
    munitionWings(c, pal);
    const hull = K.hull(c, pal, MUNITION_BODY);
    // Warhead warning band behind the nose.
    c.save();
    hull();
    c.clip();
    c.fillStyle = pal.mark;
    c.fillRect(-3, -10.4, 6, 1.5);
    c.restore();
    K.lines(c, pal.panel, [
      [-2, -4, 2, -4],
      [-2, 5, 2, 5],
    ]);
    K.spine(c, pal, -8, 9, -0.5);
    // Seeker window and piston engine cooling vents.
    K.disc(c, pal, 0, -11.4, 0.7, pal.glass[1]);
    c.fillStyle = pal.accent;
    for (const y of [6.2, 7.6]) c.fillRect(-1.2, y, 2.4, 0.6);
    // Prop hub fairing.
    c.fillStyle = pal.metalDark;
    c.fillRect(-0.7, 10.8, 1.4, 1.6);
  }

  // Pusher prop seen edge-on: a thin foreshortened blur with two blade glints
  // sliding across it. Glint speed stays low per frame so it never strobes.
  function munitionProp(c, pal, clock, seed) {
    const { y, radius } = PROP;
    c.fillStyle = `rgba(${pal.disc},0.28)`;
    c.beginPath();
    c.ellipse(0, y, radius, 1.1, 0, 0, TAU);
    c.fill();
    const a = clock * TAU * 3.1 + seed * 2.3;
    c.fillStyle = `rgba(${pal.disc},0.55)`;
    for (const k of [0, Math.PI]) {
      const x = Math.cos(a + k) * radius * 0.8;
      c.beginPath();
      c.ellipse(x, y, 0.9, 0.7, 0, 0, TAU);
      c.fill();
    }
    c.fillStyle = pal.accent;
    c.beginPath();
    c.arc(0, y, 0.7, 0, TAU);
    c.fill();
  }

  B.Airframes.define({
    id: "munition",
    name: "Loitering munition",
    role: "kamikaze",
    bounds: { x0: -16, y0: -13.4, x1: 16, y1: 12.6 },
    altitude: 16,
    livery: "drone",
    eliteLivery: "elite",
    rotors: [],
    tailRotor: { kind: "none" },
    lights: {
      port: [-13.4, 5.4],
      starboard: [13.4, 5.4],
    },
    hardpoints: {
      muzzle: [0, -13],
    },
    paint: munitionBody,
    overlay: munitionProp,
  });
})();
