"use strict";
/*
 * Airframe registry and schema. Every aircraft is plain data plus a body painter.
 *
 * Local frame: nose points to -y, starboard is +x, units are game pixels at scale 1.
 * The origin is the gameplay hitbox centre. Never mirror an airframe to change
 * facing: rotate it. Mirroring moves the tail rotor to the wrong side.
 *
 * spec = {
 *   id, name, role,
 *   bounds: {x0, y0, x1, y1},          body extent (rotor discs excluded)
 *   altitude,                          shadow offset in px along the sun vector
 *   rotors: [{x, y, radius, blades, dir: "ccw"|"cw", chord, tip, coaxial?}],
 *   tailRotor: {kind: "conventional"|"canted"|"fenestron"|"none", x, y,
 *               side: -1 (port) | 1 (starboard), diameter, blades,
 *               mode: "pusher"|"tractor", finHalfWidth, cant?},
 *   lights: {port, starboard, tail, beacon},   [x, y] pairs, optional
 *   hardpoints: {gun, muzzle, pods: [[x, y]], rails: [[x, y]]},
 *     Reference-only: documents where a store or muzzle sits on the body art.
 *     The player's actual fire points come from B.Hardpoints.player
 *     (js/content/hardpoints.js), the single source consumed by
 *     js/sim/weapons.js; enemies fire from their entity position. This field
 *     is not read by the renderer or simulation — treat it as annotation for
 *     whoever draws the next airframe, not a wired-up API.
 *   livery: "id of B.Liveries entry", eliteLivery,
 *   paint(c, pal),                     draws the static body in local coords
 *   stores?(c, pal, loadout),          optional live overlay (weapon pods)
 *   overlay?(c, pal, clock, seed),     optional live draw above the rotors
 * }
 */
(() => {
  const B = window.BP;
  const specs = {};
  const DIRS = ["ccw", "cw"];
  const TIPS = ["square", "swept", "paddle"];
  const TAIL_MODES = ["pusher", "tractor"];
  const TAIL_KINDS = ["conventional", "canted", "fenestron", "none"];

  // A counter-clockwise rotor (seen from above) needs tail thrust to starboard.
  // A tractor rotor sits on the thrust side; a pusher sits on the opposite side.
  function expectedTailSide(dir, mode) {
    const thrust = dir === "ccw" ? 1 : -1;
    return mode === "tractor" ? thrust : -thrust;
  }

  function fail(id, message) {
    throw new Error(`Airframe "${id}": ${message}`);
  }

  function validateRotor(id, rotor) {
    if (!(rotor.radius > 0)) fail(id, "rotor radius must be positive");
    if (!(rotor.blades >= 2)) fail(id, "rotor needs at least two blades");
    if (!DIRS.includes(rotor.dir)) fail(id, `rotor dir must be ${DIRS}`);
    if (rotor.tip != null && !TIPS.includes(rotor.tip))
      fail(id, `rotor tip must be one of ${TIPS}`);
  }

  function validateTail(id, spec) {
    const tail = spec.tailRotor;
    if (!tail || !TAIL_KINDS.includes(tail.kind))
      fail(id, `tailRotor.kind must be one of ${TAIL_KINDS}`);
    if (tail.kind !== "conventional" && tail.kind !== "canted") return;
    if (!TAIL_MODES.includes(tail.mode))
      fail(id, `tailRotor.mode must be one of ${TAIL_MODES}`);
    const main = spec.rotors[0];
    if (tail.side !== expectedTailSide(main.dir, tail.mode))
      fail(id, "tail rotor is on the wrong side for its rotor direction");
    if (tail.diameter < 0.17 * main.radius * 2)
      fail(id, "tail rotor diameter is below 0.17 of the main rotor");
  }

  function validateLiveries(id, spec) {
    if (spec.livery && !B.Liveries[spec.livery])
      fail(id, `unknown livery "${spec.livery}"`);
    if (spec.eliteLivery && !B.Liveries[spec.eliteLivery])
      fail(id, `unknown eliteLivery "${spec.eliteLivery}"`);
  }

  function validate(spec) {
    const id = spec.id || "?";
    if (typeof spec.paint !== "function") fail(id, "paint() is required");
    const b = spec.bounds;
    if (!b || !(b.x1 > b.x0 && b.y1 > b.y0)) fail(id, "bounds are invalid");
    for (const rotor of spec.rotors || []) validateRotor(id, rotor);
    // A tail rotor is only meaningful alongside a main rotor; fixed-wing
    // airframes (rotors: []) skip this check entirely.
    if (spec.rotors?.length) validateTail(id, spec);
    validateLiveries(id, spec);
  }

  B.Airframes = {
    define(spec) {
      validate(spec);
      specs[spec.id] = Object.freeze(spec);
      return spec;
    },
    get(id) {
      return specs[id] || null;
    },
    ids() {
      return Object.keys(specs);
    },
    expectedTailSide,
  };
})();
