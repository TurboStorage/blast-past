import { test } from "node:test";
import assert from "node:assert/strict";
import { loadBP, CORE } from "./load-bp.mjs";

const B = loadBP(CORE);
const close = (a, b, eps = 1e-9) =>
  assert.ok(Math.abs(a - b) < eps, `${a} ≈ ${b}`);

test("clamp bounds values to the range", () => {
  assert.equal(B.clamp(5, 0, 3), 3);
  assert.equal(B.clamp(-2, 0, 3), 0);
  assert.equal(B.clamp(1.5, 0, 3), 1.5);
});

test("turn moves toward the target by at most the step, the short way round", () => {
  close(B.turn(0, 1, 0.25), 0.25);
  close(B.turn(3, -3, 0.1), 3.1); // wraps across ±π instead of spinning back
  close(B.turn(0, 0.05, 0.25), 0.05);
});

test("localToWorld maps the nose (-y) along the entity's heading", () => {
  const up = B.localToWorld({ x: 100, y: 100, angle: -Math.PI / 2 }, [0, -10]);
  close(up.x, 100);
  close(up.y, 90);
  const right = B.localToWorld({ x: 0, y: 0, angle: 0 }, [0, -10]);
  close(right.x, 10);
  close(right.y, 0);
  const starboard = B.localToWorld({ x: 0, y: 0, angle: -Math.PI / 2 }, [5, 0]);
  close(starboard.x, 5);
});

test("sweptDistance catches a fast shot that tunnels through a target", () => {
  const shot = { px: 0, py: 0, x: 100, y: 0 };
  close(B.sweptDistance(shot, 50, 3), 3);
  close(B.sweptDistance(shot, 150, 0), 50);
  close(B.sweptDistance({ x: 3, y: 4 }, 0, 0), 5); // no previous position
});

test("RNG is deterministic per seed and range() stays in bounds", () => {
  const a = new B.RNG(42),
    b = new B.RNG(42),
    c = new B.RNG(43);
  const seqA = Array.from({ length: 5 }, () => a.next());
  const seqB = Array.from({ length: 5 }, () => b.next());
  assert.deepEqual(seqA, seqB);
  assert.notDeepEqual(
    seqA,
    Array.from({ length: 5 }, () => c.next()),
  );
  for (let i = 0; i < 500; i++) {
    const v = a.range(-3, 7);
    assert.ok(v >= -3 && v < 7);
  }
});

test("Config is frozen so tuning constants cannot drift at runtime", () => {
  assert.ok(Object.isFrozen(B.Config));
  assert.equal(B.Config.FIXED_DT, 1 / 60);
});
