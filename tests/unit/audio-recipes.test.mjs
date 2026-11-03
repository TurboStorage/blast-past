import { test } from "node:test";
import assert from "node:assert/strict";
import { loadBP, AUDIO_RECIPES } from "./load-bp.mjs";

const B = loadBP(AUDIO_RECIPES);
const { RECIPES, THROTTLE } = B.AudioKit;

const WAVE_TYPES = ["sine", "square", "sawtooth", "triangle"];

function assertFilter(filter, label) {
  assert.equal(typeof filter, "object", `${label} filter must be an object`);
  assert.ok(filter.from > 0, `${label} filter.from must be > 0`);
  assert.ok(filter.to > 0, `${label} filter.to must be > 0`);
  if (filter.type != null) assert.equal(typeof filter.type, "string");
  if (filter.q != null)
    assert.ok(filter.q > 0, `${label} filter.q must be > 0`);
}

function assertToneLayer(layer, label) {
  // tones[] override entries may omit `dur` to inherit the parent recipe's
  // duration when merged at play time, so it's only checked when present.
  if (layer.dur != null) assert.ok(layer.dur > 0, `${label}.dur must be > 0`);
  assert.ok(layer.vol > 0 && layer.vol <= 1, `${label}.vol must be in (0,1]`);
  assert.ok(
    WAVE_TYPES.includes(layer.type),
    `${label}.type must be a known oscillator type`,
  );
  assert.ok(layer.from > 0, `${label}.from must be > 0`);
  assert.ok(layer.to > 0, `${label}.to must be > 0`);
  if (layer.unison != null) {
    assert.ok(
      Number.isInteger(layer.unison) && layer.unison >= 1,
      `${label}.unison must be an int >= 1`,
    );
  }
  if (layer.detune != null)
    assert.ok(layer.detune >= 0, `${label}.detune must be >= 0`);
  if (layer.spread != null)
    assert.ok(
      layer.spread >= 0 && layer.spread <= 1,
      `${label}.spread must be in [0,1]`,
    );
  if (layer.drive != null)
    assert.ok(
      layer.drive >= 0 && layer.drive <= 1,
      `${label}.drive must be in [0,1]`,
    );
  if (layer.filter) assertFilter(layer.filter, `${label}.filter`);
}

test("every recipe has a valid base tone shape", () => {
  for (const [name, recipe] of Object.entries(RECIPES)) {
    assert.ok(recipe.dur > 0, `${name}.dur must be > 0`);
    assertToneLayer(recipe, name);
  }
});

test("optional noise/noiseFilter/sub fields are well-formed when present", () => {
  for (const [name, recipe] of Object.entries(RECIPES)) {
    if (recipe.noise != null) {
      assert.ok(
        recipe.noise > 0 && recipe.noise <= 1,
        `${name}.noise must be in (0,1]`,
      );
    }
    if (recipe.noiseDur != null) {
      assert.ok(recipe.noiseDur > 0, `${name}.noiseDur must be > 0`);
    }
    if (recipe.noiseFilter)
      assertFilter(recipe.noiseFilter, `${name}.noiseFilter`);
    if (recipe.sub) {
      assert.ok(recipe.sub.from > 0, `${name}.sub.from must be > 0`);
      assert.ok(recipe.sub.to > 0, `${name}.sub.to must be > 0`);
      assert.ok(
        recipe.sub.vol > 0 && recipe.sub.vol <= 1,
        `${name}.sub.vol must be in (0,1]`,
      );
    }
  }
});

test("tones[] layers are well-formed when present", () => {
  for (const [name, recipe] of Object.entries(RECIPES)) {
    (recipe.tones || []).forEach((t, i) =>
      assertToneLayer(t, `${name}.tones[${i}]`),
    );
  }
});

test("THROTTLE keys reference real recipes and are positive", () => {
  for (const [name, seconds] of Object.entries(THROTTLE)) {
    assert.ok(name in RECIPES, `THROTTLE key "${name}" must be a real recipe`);
    assert.ok(seconds > 0, `THROTTLE.${name} must be > 0`);
  }
});
