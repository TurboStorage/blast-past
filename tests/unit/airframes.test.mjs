// Realism invariants for every registered airframe.
import { test } from "node:test";
import assert from "node:assert/strict";
import { loadBP, AIRFRAMES } from "./load-bp.mjs";

const B = loadBP(AIRFRAMES);
const specs = B.Airframes.ids().map((id) => B.Airframes.get(id));
const SINGLE_ROTOR_LENGTH = [1.1, 1.3]; // overall length / D, rotors turning

function overallLength(spec) {
  const rotor = spec.rotors[0],
    tail = spec.tailRotor;
  const front = Math.min(spec.bounds.y0, rotor.y - rotor.radius);
  let back = Math.max(spec.bounds.y1, rotor.y + rotor.radius);
  if (tail.kind === "conventional" || tail.kind === "canted")
    back = Math.max(back, tail.y + tail.diameter / 2);
  return back - front;
}

test("every enemy type and elite swap maps to a registered airframe", () => {
  for (const [type, id] of Object.entries({
    ...B.EnemyAirframes,
    ...B.EliteAirframes,
  }))
    assert.ok(B.Airframes.get(id), `${type} -> ${id} is registered`);
  for (const id of ["kestrel", "escort"]) assert.ok(B.Airframes.get(id));
});

test("tail rotors sit on the side their rotor direction demands", () => {
  for (const spec of specs) {
    const tail = spec.tailRotor;
    if (!spec.rotors.length || !["conventional", "canted"].includes(tail.kind))
      continue;
    const expected = B.Airframes.expectedTailSide(
      spec.rotors[0].dir,
      tail.mode,
    );
    assert.equal(tail.side, expected, `${spec.id} tail rotor side`);
    assert.ok(
      tail.diameter >= 0.17 * spec.rotors[0].radius * 2,
      `${spec.id} size`,
    );
  }
});

test("US-style rotors turn counter-clockwise, Russian-style clockwise", () => {
  const expected = {
    kestrel: "ccw",
    littleBird: "ccw",
    blackHawk: "ccw",
    hind: "cw",
    mi17: "cw",
  };
  for (const [id, dir] of Object.entries(expected))
    assert.equal(B.Airframes.get(id).rotors[0].dir, dir, id);
});

test("single-rotor helicopters keep realistic plan-view length ratios", () => {
  for (const spec of specs) {
    if (spec.rotors.length !== 1 || spec.rotors[0].coaxial) continue;
    if (spec.tailRotor.kind === "none") continue;
    const ratio = overallLength(spec) / (spec.rotors[0].radius * 2);
    assert.ok(
      ratio >= SINGLE_ROTOR_LENGTH[0] && ratio <= SINGLE_ROTOR_LENGTH[1],
      `${spec.id} length/D = ${ratio.toFixed(2)}`,
    );
  }
});

test("tandem and coaxial types have no tail rotor", () => {
  assert.equal(B.Airframes.get("chinook").tailRotor.kind, "none");
  assert.equal(B.Airframes.get("chinook").rotors.length, 2);
  assert.equal(B.Airframes.get("ka52").tailRotor.kind, "none");
  assert.ok(B.Airframes.get("ka52").rotors[0].coaxial);
});

test("quadcopter neighbours counter-rotate", () => {
  for (const id of ["quad", "escort", "carrier"]) {
    const rotors = B.Airframes.get(id).rotors;
    assert.equal(rotors.length, 4, id);
    const cw = rotors.filter((r) => r.dir === "cw").length;
    assert.equal(cw, 2, `${id} has two clockwise rotors`);
  }
});

test("the registry rejects a tail rotor on the wrong side", () => {
  const bad = {
    id: "wrong",
    bounds: { x0: -5, y0: -5, x1: 5, y1: 5 },
    paint() {},
    rotors: [{ x: 0, y: 0, radius: 20, blades: 4, dir: "ccw" }],
    tailRotor: {
      kind: "conventional",
      x: 0,
      y: 25,
      side: 1,
      diameter: 8,
      mode: "pusher",
    },
  };
  assert.throws(() => B.Airframes.define(bad), /wrong side/);
});

test("rotor spin rate stays under the wagon-wheel limit at 60 fps", () => {
  const ctx = loadBP([...AIRFRAMES, "js/render/rotor.js"]);
  for (const blades of [2, 3, 4, 5]) {
    const stepPerFrame = ctx.Rotors.spinRate(blades) / 60;
    assert.ok(stepPerFrame < Math.PI / blades, `${blades} blades`);
  }
});
