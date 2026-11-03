# Blaster SFX Overhaul Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the thin, single-oscillator "80s arcade beep" SFX with layered, filtered, punchier procedural sounds, while staying 100% WebAudio-synthesized (no sample files, no asset pipeline).

**Architecture:** Split synthesis primitives (`audio-synth.js`, new) out of the engine/lifecycle code (`audio.js`, existing), extend the recipe data (`audio-recipes.js`) with optional `unison`/`detune`/`spread`/`filter`/`drive`/`sub`/`noiseFilter` fields, and add a mock-`AudioContext` test harness so the node-graph wiring is unit-tested even though perceptual audio quality itself is a manual, human-ear judgment call (spec: `docs/superpowers/specs/2026-09-26-blaster-sfx-overhaul-design.md`).

**Tech Stack:** Vanilla WebAudio (`OscillatorNode`, `GainNode`, `BiquadFilterNode`, `WaveShaperNode`, `StereoPannerNode`, `AudioBufferSourceNode`), `node --test` for unit tests (existing project convention, see `tests/unit/`).

---

## Reference: full recipe table (Task 1 uses this)

This is the complete rewritten `RECIPES` object referenced by Task 1. Field
meanings:

- `dur`, `vol`, `type`, `from`, `to` — existing base oscillator + pitch
  envelope (unchanged meaning).
- `unison` (int ≥ 1, default 1) — number of detuned oscillator copies.
- `detune` (cents, default 0) — total spread across unison voices.
- `spread` (0–1, default 0) — stereo pan spread across unison voices (no-op
  if `unison` is 1).
- `filter` (optional `{type, from, to, q}`) — sweeping filter envelope on the
  main tone (and any `tones[]` layer that doesn't override it to `null`).
- `drive` (0–1, optional) — soft-clip distortion amount on the main tone.
- `noise` (0–1, optional, unchanged meaning) — noise burst volume as a
  fraction of `vol`.
- `noiseFilter` (optional `{type, from, to, q}`) — sweeping filter on the
  noise burst.
- `sub` (optional `{from, to, vol, dur}`) — short sine "thump" layer.
- `tones` (optional array, unchanged meaning) — extra harmonic layers, each a
  partial override merged onto the recipe for its own `tone()` call.

```js
const RECIPES = {
  shoot: {
    dur: 0.09,
    vol: 0.16,
    type: "sawtooth",
    from: 900,
    to: 220,
    unison: 2,
    detune: 14,
    spread: 0.3,
    filter: { type: "bandpass", from: 3200, to: 900, q: 1.4 },
    drive: 0.12,
    noise: 0.06,
    noiseFilter: { type: "highpass", from: 2500, to: 2500, q: 0.7 },
  },
  heavy: {
    dur: 0.22,
    vol: 0.22,
    type: "sawtooth",
    from: 260,
    to: 70,
    unison: 3,
    detune: 22,
    spread: 0.5,
    filter: { type: "lowpass", from: 3500, to: 500, q: 1 },
    drive: 0.35,
    noise: 0.28,
    noiseFilter: { type: "bandpass", from: 1400, to: 400, q: 1 },
  },
  rocket: {
    dur: 0.32,
    vol: 0.19,
    type: "sawtooth",
    from: 190,
    to: 55,
    unison: 2,
    detune: 16,
    spread: 0.4,
    filter: { type: "lowpass", from: 2600, to: 350, q: 0.9 },
    drive: 0.2,
    noise: 0.35,
    noiseFilter: { type: "bandpass", from: 1800, to: 300, q: 0.8 },
    sub: { from: 130, to: 45, vol: 0.14, dur: 0.28 },
  },
  missile: {
    dur: 0.3,
    vol: 0.15,
    type: "triangle",
    from: 260,
    to: 820,
    unison: 2,
    detune: 10,
    spread: 0.25,
    filter: { type: "bandpass", from: 700, to: 2600, q: 1.2 },
    noise: 0.06,
    noiseFilter: { type: "highpass", from: 3000, to: 3000, q: 0.7 },
  },
  arc: {
    dur: 0.2,
    vol: 0.17,
    type: "sine",
    from: 1100,
    to: 180,
    unison: 3,
    detune: 30,
    spread: 0.6,
    filter: { type: "bandpass", from: 4000, to: 500, q: 2 },
    noise: 0.3,
    noiseFilter: { type: "highpass", from: 2000, to: 2000, q: 1 },
  },
  explosion: {
    dur: 0.5,
    vol: 0.28,
    type: "sawtooth",
    from: 130,
    to: 26,
    unison: 3,
    detune: 25,
    spread: 0.5,
    filter: { type: "lowpass", from: 2200, to: 200, q: 0.8 },
    drive: 0.5,
    noise: 0.95,
    noiseFilter: { type: "bandpass", from: 1600, to: 150, q: 0.7 },
    sub: { from: 100, to: 32, vol: 0.3, dur: 0.42 },
  },
  bossDeath: {
    dur: 1.0,
    vol: 0.32,
    type: "sawtooth",
    from: 100,
    to: 22,
    unison: 4,
    detune: 30,
    spread: 0.6,
    filter: { type: "lowpass", from: 1800, to: 120, q: 0.7 },
    drive: 0.6,
    noise: 1,
    noiseFilter: { type: "bandpass", from: 1200, to: 100, q: 0.6 },
    sub: { from: 85, to: 26, vol: 0.35, dur: 0.9 },
    tones: [
      {
        from: 200,
        to: 45,
        type: "triangle",
        vol: 0.16,
        unison: 2,
        detune: 20,
        filter: null,
        drive: 0,
      },
    ],
  },
  damage: {
    dur: 0.16,
    vol: 0.2,
    type: "square",
    from: 260,
    to: 85,
    unison: 2,
    detune: 18,
    spread: 0.3,
    filter: { type: "lowpass", from: 2600, to: 500, q: 1 },
    drive: 0.25,
    noise: 0.2,
    noiseFilter: { type: "bandpass", from: 1400, to: 400, q: 0.9 },
  },
  death: {
    dur: 1.1,
    vol: 0.26,
    type: "triangle",
    from: 340,
    to: 40,
    unison: 3,
    detune: 22,
    spread: 0.5,
    filter: { type: "lowpass", from: 2000, to: 150, q: 0.8 },
    drive: 0.3,
    noise: 0.5,
    noiseFilter: { type: "bandpass", from: 1200, to: 130, q: 0.7 },
    sub: { from: 90, to: 28, vol: 0.2, dur: 0.9 },
    tones: [
      {
        from: 165,
        to: 30,
        type: "sawtooth",
        vol: 0.13,
        unison: 2,
        detune: 18,
        filter: null,
        drive: 0,
      },
    ],
  },
  boost: {
    dur: 0.34,
    vol: 0.17,
    type: "sawtooth",
    from: 120,
    to: 560,
    unison: 2,
    detune: 14,
    spread: 0.3,
    filter: { type: "lowpass", from: 900, to: 3200, q: 1 },
    noise: 0.3,
    noiseFilter: { type: "highpass", from: 800, to: 2200, q: 0.8 },
  },
  xp: {
    dur: 0.13,
    vol: 0.14,
    type: "sine",
    from: 800,
    to: 1480,
    unison: 2,
    detune: 8,
    spread: 0.2,
    filter: { type: "lowpass", from: 5200, to: 5200, q: 0.7 },
  },
  repair: {
    dur: 0.28,
    vol: 0.15,
    type: "sine",
    from: 420,
    to: 900,
    unison: 2,
    detune: 10,
    spread: 0.3,
    filter: { type: "lowpass", from: 3200, to: 3200, q: 0.7 },
    tones: [{ from: 630, to: 1260, type: "triangle", vol: 0.08, filter: null }],
  },
  shield: {
    dur: 0.4,
    vol: 0.16,
    type: "sine",
    from: 280,
    to: 760,
    unison: 3,
    detune: 16,
    spread: 0.4,
    filter: { type: "bandpass", from: 500, to: 2600, q: 1.1 },
    noise: 0.12,
    noiseFilter: { type: "highpass", from: 1800, to: 1800, q: 0.7 },
  },
  emp: {
    dur: 0.5,
    vol: 0.21,
    type: "square",
    from: 130,
    to: 34,
    unison: 2,
    detune: 26,
    spread: 0.4,
    filter: { type: "lowpass", from: 2400, to: 300, q: 1.2 },
    drive: 0.3,
    noise: 0.6,
    noiseFilter: { type: "bandpass", from: 1600, to: 300, q: 0.8 },
  },
  levelUp: {
    dur: 0.46,
    vol: 0.17,
    type: "triangle",
    from: 460,
    to: 1020,
    unison: 2,
    detune: 10,
    spread: 0.3,
    filter: { type: "lowpass", from: 3600, to: 3600, q: 0.7 },
    tones: [{ from: 690, to: 1360, type: "sine", vol: 0.11, filter: null }],
  },
  upgrade: {
    dur: 0.18,
    vol: 0.15,
    type: "triangle",
    from: 540,
    to: 940,
    unison: 2,
    detune: 8,
    spread: 0.2,
  },
  warning: {
    dur: 0.3,
    vol: 0.17,
    type: "square",
    from: 200,
    to: 130,
    unison: 2,
    detune: 18,
    spread: 0.3,
    filter: { type: "bandpass", from: 1200, to: 700, q: 1.2 },
    noise: 0.12,
    noiseFilter: { type: "highpass", from: 1400, to: 1400, q: 0.7 },
  },
  bossArrival: {
    dur: 0.9,
    vol: 0.25,
    type: "sawtooth",
    from: 78,
    to: 28,
    unison: 3,
    detune: 26,
    spread: 0.5,
    filter: { type: "lowpass", from: 1600, to: 200, q: 0.8 },
    drive: 0.35,
    noise: 0.55,
    noiseFilter: { type: "bandpass", from: 1000, to: 120, q: 0.7 },
    sub: { from: 80, to: 30, vol: 0.22, dur: 0.8 },
    tones: [
      {
        from: 155,
        to: 46,
        type: "triangle",
        vol: 0.1,
        unison: 2,
        detune: 18,
        filter: null,
        drive: 0,
      },
    ],
  },
  ui: {
    dur: 0.09,
    vol: 0.11,
    type: "triangle",
    from: 580,
    to: 840,
    unison: 2,
    detune: 6,
    spread: 0.15,
  },
};
const THROTTLE = {
  shoot: 0.025,
  heavy: 0.04,
  rocket: 0.06,
  missile: 0.06,
  arc: 0.04,
  damage: 0.045,
  ui: 0.025,
  xp: 0.025,
  warning: 0.1,
};
```

---

### Task 1: Rewrite recipe data + schema regression test

**Files:**

- Modify: `js/services/audio-recipes.js` (entire file)
- Test: `tests/unit/audio-recipes.test.mjs` (new)
- Modify: `tests/unit/load-bp.mjs:24-49` (add an `AUDIO_RECIPES` file list export)

No engine code depends on this yet — old `audio.js` simply ignores fields it
doesn't know about, so the game keeps working with the _old_ sound engine
between this task's commit and Task 3's.

- [ ] **Step 1: Add the `AUDIO_RECIPES` file list to the test loader**

Edit `tests/unit/load-bp.mjs`, appending after the existing `AIRFRAMES` export
(after line 49):

```js
export const AUDIO_RECIPES = [
  "js/core/namespace.js",
  "js/services/audio-recipes.js",
];
```

- [ ] **Step 2: Write the failing schema test**

Create `tests/unit/audio-recipes.test.mjs`:

```js
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
  assert.ok(layer.dur > 0, `${label}.dur must be > 0`);
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
```

- [ ] **Step 3: Run the test to confirm it fails against the current recipes**

Run: `node --test tests/unit/audio-recipes.test.mjs`
Expected: passes on the base-shape assertions (current recipes already
satisfy those) but this is just a sanity check that the loader works — the
real point of this task is the _rewrite_ in Step 4. Confirm no crash/loader
error at this point.

- [ ] **Step 4: Replace `js/services/audio-recipes.js` with the new recipe table**

Replace the entire file with:

```js
"use strict";
/* Procedural SFX recipes and per-sound throttle windows (internal B.AudioKit).
 *
 * Optional fields beyond the base { dur, vol, type, from, to }:
 *   unison   int >= 1   detuned oscillator copies (default 1)
 *   detune   cents       total spread across unison voices (default 0)
 *   spread   0-1         stereo pan spread across unison voices (default 0)
 *   filter   {type,from,to,q}  sweeping filter envelope on the main tone
 *   drive    0-1         soft-clip distortion amount on the main tone
 *   noise    0-1         noise burst volume as a fraction of vol
 *   noiseFilter {type,from,to,q}  sweeping filter on the noise burst
 *   sub      {from,to,vol,dur}   short sine "thump" layer
 *   tones    [...]       extra harmonic layers, each merged onto the recipe
 */
(() => {
  const B = window.BP;
  const RECIPES = {
    /* PASTE the full RECIPES object from the "Reference: full recipe table"
       section above verbatim here. */
  };
  const THROTTLE = {
    /* PASTE the full THROTTLE object from the "Reference: full recipe table"
       section above verbatim here. */
  };
  B.AudioKit = { RECIPES, THROTTLE };
})();
```

Do not leave the placeholder comments in the actual file — copy the literal
`RECIPES` and `THROTTLE` object bodies from the Reference section at the top
of this plan into the `const RECIPES = {...}` and `const THROTTLE = {...}`
slots.

- [ ] **Step 5: Run the test to confirm it passes**

Run: `node --test tests/unit/audio-recipes.test.mjs`
Expected: `4 passing`, `0 failing`.

- [ ] **Step 6: Lint and commit**

Run: `npm run lint`
Expected: no errors on the two changed files.

```bash
git add js/services/audio-recipes.js tests/unit/audio-recipes.test.mjs tests/unit/load-bp.mjs
git commit -m "feat(audio): rewrite SFX recipes for layered, filtered sound design"
```

---

### Task 2: DSP primitives module (`audio-synth.js`) + mock AudioContext harness

**Files:**

- Create: `tests/unit/mock-audio.mjs`
- Create: `js/services/audio-synth.js`
- Test: `tests/unit/audio-synth.test.mjs` (new)
- Modify: `tests/unit/load-bp.mjs` (add `AUDIO_SYNTH` file list export)

- [ ] **Step 1: Write the mock AudioContext test fixture**

Create `tests/unit/mock-audio.mjs`:

```js
// Minimal WebAudio node graph fake, just enough surface area for
// js/services/audio-synth.js and js/services/audio.js to run under
// node:vm without a real browser AudioContext.

class MockParam {
  constructor(value) {
    this.value = value;
    this.calls = [];
  }
  setValueAtTime(v, t) {
    this.value = v;
    this.calls.push(["setValueAtTime", v, t]);
    return this;
  }
  linearRampToValueAtTime(v, t) {
    this.value = v;
    this.calls.push(["linearRampToValueAtTime", v, t]);
    return this;
  }
  exponentialRampToValueAtTime(v, t) {
    this.value = v;
    this.calls.push(["exponentialRampToValueAtTime", v, t]);
    return this;
  }
}

class MockNode {
  constructor(ctx, kind) {
    this.ctx = ctx;
    this.kind = kind;
    this.connections = [];
    this.disconnected = false;
    ctx.nodes.push(this);
  }
  connect(dest) {
    this.connections.push(dest);
    return dest;
  }
  disconnect() {
    this.disconnected = true;
  }
}

class MockOscillator extends MockNode {
  constructor(ctx) {
    super(ctx, "oscillator");
    this.type = "sine";
    this.frequency = new MockParam(440);
    this.detune = new MockParam(0);
    this.started = false;
    this.stopped = false;
    this.onended = null;
  }
  start(t) {
    this.started = true;
    this.startTime = t;
  }
  stop(t) {
    this.stopped = true;
    this.stopTime = t;
  }
  end() {
    if (this.onended) this.onended();
  }
}

class MockGain extends MockNode {
  constructor(ctx) {
    super(ctx, "gain");
    this.gain = new MockParam(1);
  }
}

class MockBiquadFilter extends MockNode {
  constructor(ctx) {
    super(ctx, "biquad");
    this.type = "lowpass";
    this.frequency = new MockParam(350);
    this.Q = new MockParam(1);
  }
}

class MockWaveShaper extends MockNode {
  constructor(ctx) {
    super(ctx, "waveshaper");
    this.curve = null;
    this.oversample = "none";
  }
}

class MockStereoPanner extends MockNode {
  constructor(ctx) {
    super(ctx, "panner");
    this.pan = new MockParam(0);
  }
}

class MockBufferSource extends MockNode {
  constructor(ctx) {
    super(ctx, "bufferSource");
    this.buffer = null;
    this.started = false;
    this.stopped = false;
    this.onended = null;
  }
  start(t) {
    this.started = true;
    this.startTime = t;
  }
  stop(t) {
    this.stopped = true;
    this.stopTime = t;
  }
  end() {
    if (this.onended) this.onended();
  }
}

class MockAudioBuffer {
  constructor(channels, length, sampleRate) {
    this.length = length;
    this.sampleRate = sampleRate;
    this._data = new Float32Array(length);
  }
  getChannelData() {
    return this._data;
  }
}

class MockCompressor extends MockNode {
  constructor(ctx) {
    super(ctx, "compressor");
    this.threshold = new MockParam(-24);
    this.knee = new MockParam(30);
    this.ratio = new MockParam(12);
    this.attack = new MockParam(0.003);
    this.release = new MockParam(0.25);
  }
}

export class MockAudioContext {
  constructor() {
    this.nodes = [];
    this.currentTime = 0;
    this.sampleRate = 44100;
    this.destination = { connect() {}, disconnect() {} };
    this.resumed = false;
  }
  createOscillator() {
    return new MockOscillator(this);
  }
  createGain() {
    return new MockGain(this);
  }
  createBiquadFilter() {
    return new MockBiquadFilter(this);
  }
  createWaveShaper() {
    return new MockWaveShaper(this);
  }
  createStereoPanner() {
    return new MockStereoPanner(this);
  }
  createBufferSource() {
    return new MockBufferSource(this);
  }
  createBuffer(channels, length, sampleRate) {
    return new MockAudioBuffer(channels, length, sampleRate);
  }
  createDynamicsCompressor() {
    return new MockCompressor(this);
  }
  resume() {
    this.resumed = true;
    return Promise.resolve();
  }
}
```

- [ ] **Step 2: Add the `AUDIO_SYNTH` file list to the test loader**

Edit `tests/unit/load-bp.mjs`, appending after the `AUDIO_RECIPES` export
added in Task 1:

```js
export const AUDIO_SYNTH = [
  "js/core/namespace.js",
  "js/services/audio-synth.js",
];
```

- [ ] **Step 3: Write the failing tests for the synth primitives**

Create `tests/unit/audio-synth.test.mjs`:

```js
import { test } from "node:test";
import assert from "node:assert/strict";
import { loadBP, AUDIO_SYNTH } from "./load-bp.mjs";
import { MockAudioContext } from "./mock-audio.mjs";

const B = loadBP(AUDIO_SYNTH);
const { tone, noise, sub, driveCurve } = B.AudioSynth;

test("tone() with unison=1 creates one oscillator and one gain, wired oscillator->gain->dest", () => {
  const ctx = new MockAudioContext();
  const dest = { connect() {}, disconnect() {} };
  const { sources, disposables } = tone(
    ctx,
    { dur: 0.1, vol: 0.2, type: "square", from: 400, to: 100 },
    0,
    1,
    dest,
  );
  assert.equal(sources.length, 1);
  assert.equal(disposables.length, 2);
  const [osc] = sources;
  assert.equal(osc.type, "square");
  assert.ok(osc.started);
  assert.equal(osc.connections[0].kind, "gain");
});

test("tone() with unison=3 and spread creates 3 detuned oscillators, 3 panners, symmetric pan values", () => {
  const ctx = new MockAudioContext();
  const dest = { connect() {}, disconnect() {} };
  const { sources, disposables } = tone(
    ctx,
    {
      dur: 0.1,
      vol: 0.2,
      type: "sawtooth",
      from: 200,
      to: 50,
      unison: 3,
      detune: 30,
      spread: 0.5,
    },
    0,
    1,
    dest,
  );
  assert.equal(sources.length, 3);
  // 3 oscillators + 3 panners + 1 gain = 7 disposables
  assert.equal(disposables.length, 7);
  const freqs = sources.map((o) => o.frequency.value);
  assert.ok(
    new Set(freqs).size === 3,
    "each unison voice should have a distinct starting frequency",
  );
  const panners = disposables.filter((n) => n.kind === "panner");
  assert.equal(panners.length, 3);
  const pans = panners.map((p) => p.pan.value).sort((a, b) => a - b);
  assert.ok(
    pans[0] < 0 && pans[2] > 0,
    "panners should spread left/right of center",
  );
  assert.ok(
    Math.abs(pans[0] + pans[2]) < 1e-9,
    "outer pan values should be symmetric around 0",
  );
});

test("tone() with a filter creates a BiquadFilterNode with the configured envelope", () => {
  const ctx = new MockAudioContext();
  const dest = { connect() {}, disconnect() {} };
  const { disposables } = tone(
    ctx,
    {
      dur: 0.2,
      vol: 0.2,
      type: "sine",
      from: 500,
      to: 100,
      filter: { type: "bandpass", from: 3000, to: 400, q: 1.5 },
    },
    0,
    1,
    dest,
  );
  const filterNode = disposables.find((n) => n.kind === "biquad");
  assert.ok(filterNode, "expected a biquad filter node");
  assert.equal(filterNode.type, "bandpass");
  assert.equal(filterNode.Q.value, 1.5);
  assert.equal(filterNode.frequency.calls[0][1], 3000);
  assert.equal(filterNode.frequency.calls.at(-1)[1], 400);
});

test("tone() with drive creates a WaveShaperNode carrying a non-empty curve", () => {
  const ctx = new MockAudioContext();
  const dest = { connect() {}, disconnect() {} };
  const { disposables } = tone(
    ctx,
    { dur: 0.1, vol: 0.2, type: "square", from: 300, to: 80, drive: 0.4 },
    0,
    1,
    dest,
  );
  const driveNode = disposables.find((n) => n.kind === "waveshaper");
  assert.ok(driveNode, "expected a waveshaper node");
  assert.ok(driveNode.curve instanceof Float32Array);
  assert.ok(driveNode.curve.length > 0);
});

test("driveCurve memoizes by rounded amount", () => {
  const a = driveCurve(0.401);
  const b = driveCurve(0.404);
  const c = driveCurve(0.9);
  assert.equal(
    a,
    b,
    "amounts that round to the same key should share a curve instance",
  );
  assert.notEqual(a, c);
});

test("noise() without a filter creates just a buffer source and gain", () => {
  const ctx = new MockAudioContext();
  const dest = { connect() {}, disconnect() {} };
  const buffer = ctx.createBuffer(1, 100, ctx.sampleRate);
  const { sources, disposables } = noise(
    ctx,
    buffer,
    { dur: 0.2, vol: 0.1 },
    0,
    1,
    dest,
  );
  assert.equal(sources.length, 1);
  assert.equal(disposables.length, 2);
  assert.equal(sources[0].buffer, buffer);
});

test("noise() with a filter chains bufferSource -> filter -> gain", () => {
  const ctx = new MockAudioContext();
  const dest = { connect() {}, disconnect() {} };
  const buffer = ctx.createBuffer(1, 100, ctx.sampleRate);
  const { disposables } = noise(
    ctx,
    buffer,
    {
      dur: 0.2,
      vol: 0.1,
      filter: { type: "bandpass", from: 1800, to: 300, q: 0.8 },
    },
    0,
    1,
    dest,
  );
  const filterNode = disposables.find((n) => n.kind === "biquad");
  assert.ok(filterNode);
  assert.equal(filterNode.type, "bandpass");
});

test("sub() creates a single sine oscillator with its own short envelope", () => {
  const ctx = new MockAudioContext();
  const dest = { connect() {}, disconnect() {} };
  const { sources, disposables } = sub(
    ctx,
    { from: 100, to: 30, vol: 0.2, dur: 0.15 },
    0,
    1,
    dest,
  );
  assert.equal(sources.length, 1);
  assert.equal(disposables.length, 2);
  assert.equal(sources[0].type, "sine");
  assert.equal(sources[0].frequency.calls[0][1], 100);
  assert.equal(sources[0].frequency.calls.at(-1)[1], 30);
});
```

- [ ] **Step 4: Run the tests to confirm they fail**

Run: `node --test tests/unit/audio-synth.test.mjs`
Expected: FAIL — `B.AudioSynth` is undefined (module doesn't exist yet).

- [ ] **Step 5: Implement `js/services/audio-synth.js`**

Create `js/services/audio-synth.js`:

```js
"use strict";
/* Stateless WebAudio DSP builders shared by B.Audio (internal B.AudioSynth).
 * Every builder takes a live AudioContext, a config object, the current
 * `now` time, the resolved output `level` (0-1), and a `dest` node to
 * connect into. It returns { sources, disposables }:
 *   sources     nodes with a lifecycle end event (osc/bufferSource) —
 *               used by the caller to know when the voice has finished.
 *   disposables every node created, for eventual .disconnect().
 */
(() => {
  const B = window.BP;
  const driveCache = new Map();

  function driveCurve(amount) {
    const amt = Math.max(0, Math.min(1, amount));
    const key = Math.round(amt * 100);
    if (driveCache.has(key)) return driveCache.get(key);
    const k = key * 1.5;
    const n = 256;
    const curve = new Float32Array(n);
    for (let i = 0; i < n; i++) {
      const x = (i / (n - 1)) * 2 - 1;
      curve[i] = ((1 + k / 100) * x) / (1 + (k / 100) * Math.abs(x));
    }
    driveCache.set(key, curve);
    return curve;
  }

  function tone(ctx, cfg, now, level, dest) {
    const dur = cfg.dur || 0.1;
    const unison = Math.max(1, Math.floor(cfg.unison || 1));
    const detuneCents = cfg.detune || 0;
    const spread = unison > 1 ? cfg.spread || 0 : 0;
    const sources = [];
    const disposables = [];

    const gainNode = ctx.createGain();
    gainNode.gain.setValueAtTime(0.0001, now);
    gainNode.gain.linearRampToValueAtTime(
      Math.max(0.0001, (cfg.vol || 0.1) * level),
      now + 0.008,
    );
    gainNode.gain.exponentialRampToValueAtTime(0.0001, now + dur);
    disposables.push(gainNode);
    gainNode.connect(dest);

    let chainHead = gainNode;
    if (cfg.drive) {
      const driveNode = ctx.createWaveShaper();
      driveNode.curve = driveCurve(cfg.drive);
      driveNode.oversample = "2x";
      driveNode.connect(chainHead);
      disposables.push(driveNode);
      chainHead = driveNode;
    }
    if (cfg.filter) {
      const filterNode = ctx.createBiquadFilter();
      filterNode.type = cfg.filter.type || "lowpass";
      filterNode.Q.value = cfg.filter.q != null ? cfg.filter.q : 1;
      const from = Math.max(20, cfg.filter.from || 2000);
      const to = Math.max(20, cfg.filter.to || from);
      filterNode.frequency.setValueAtTime(from, now);
      filterNode.frequency.exponentialRampToValueAtTime(to, now + dur);
      filterNode.connect(chainHead);
      disposables.push(filterNode);
      chainHead = filterNode;
    }

    for (let i = 0; i < unison; i++) {
      const o = ctx.createOscillator();
      o.type = cfg.type || "triangle";
      const centerOffset = unison > 1 ? i / (unison - 1) - 0.5 : 0;
      const wobble = 1 + (Math.random() - 0.5) * 0.07;
      const ratio = Math.pow(2, (centerOffset * detuneCents) / 1200) * wobble;
      o.frequency.setValueAtTime(Math.max(20, (cfg.from || 120) * ratio), now);
      o.frequency.exponentialRampToValueAtTime(
        Math.max(20, (cfg.to || 40) * ratio),
        now + dur,
      );
      disposables.push(o);
      sources.push(o);
      let node = o;
      if (spread && ctx.createStereoPanner) {
        const panNode = ctx.createStereoPanner();
        panNode.pan.value = Math.max(
          -1,
          Math.min(1, centerOffset * 2 * spread),
        );
        o.connect(panNode);
        disposables.push(panNode);
        node = panNode;
      }
      node.connect(chainHead);
      o.start(now);
      o.stop(now + dur + 0.015);
    }
    return { sources, disposables };
  }

  function noise(ctx, buffer, cfg, now, level, dest) {
    if (!buffer) return { sources: [], disposables: [] };
    const dur = cfg.dur || 0.2;
    const src = ctx.createBufferSource();
    src.buffer = buffer;
    const gainNode = ctx.createGain();
    gainNode.gain.setValueAtTime(
      Math.max(0.0001, (cfg.vol || 0.1) * level * 0.5),
      now,
    );
    gainNode.gain.exponentialRampToValueAtTime(0.0001, now + dur);
    const disposables = [src, gainNode];
    let tail = src;
    if (cfg.filter) {
      const filterNode = ctx.createBiquadFilter();
      filterNode.type = cfg.filter.type || "bandpass";
      filterNode.Q.value = cfg.filter.q != null ? cfg.filter.q : 1;
      const from = Math.max(20, cfg.filter.from || 1000);
      const to = Math.max(20, cfg.filter.to || from);
      filterNode.frequency.setValueAtTime(from, now);
      filterNode.frequency.exponentialRampToValueAtTime(to, now + dur);
      disposables.push(filterNode);
      tail.connect(filterNode);
      tail = filterNode;
    }
    tail.connect(gainNode);
    gainNode.connect(dest);
    src.start(now);
    src.stop(now + dur + 0.015);
    return { sources: [src], disposables };
  }

  function sub(ctx, cfg, now, level, dest) {
    const dur = cfg.dur || 0.15;
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = "sine";
    o.frequency.setValueAtTime(Math.max(20, cfg.from || 90), now);
    o.frequency.exponentialRampToValueAtTime(
      Math.max(20, cfg.to || 35),
      now + dur,
    );
    g.gain.setValueAtTime(0.0001, now);
    g.gain.linearRampToValueAtTime(
      Math.max(0.0001, (cfg.vol || 0.15) * level),
      now + 0.004,
    );
    g.gain.exponentialRampToValueAtTime(0.0001, now + dur);
    o.connect(g);
    g.connect(dest);
    o.start(now);
    o.stop(now + dur + 0.015);
    return { sources: [o], disposables: [o, g] };
  }

  B.AudioSynth = { tone, noise, sub, driveCurve };
})();
```

- [ ] **Step 6: Run the tests to confirm they pass**

Run: `node --test tests/unit/audio-synth.test.mjs`
Expected: `8 passing`, `0 failing`.

- [ ] **Step 7: Lint and commit**

Run: `npm run lint`
Expected: no errors on the new files.

```bash
git add js/services/audio-synth.js tests/unit/audio-synth.test.mjs tests/unit/mock-audio.mjs tests/unit/load-bp.mjs
git commit -m "feat(audio): add procedural DSP primitives module (unison, filter, drive, sub)"
```

---

### Task 3: Rewire the `Audio` engine onto `B.AudioSynth`

**Files:**

- Modify: `tests/unit/load-bp.mjs` (add globals + `AUDIO` file list)
- Modify: `js/services/audio.js` (entire file)
- Test: `tests/unit/audio-engine.test.mjs` (new)

- [ ] **Step 1: Extend the vm context with the globals `audio.js` needs**

`audio.js` uses `Number`, `Number.isFinite`, `setTimeout`, and
`clearTimeout`, none of which are in the current `vm.createContext` call.
Edit `tests/unit/load-bp.mjs`. Change:

```js
export function loadBP(files) {
  const window = {};
  const context = vm.createContext({ window, Math, Object, Set, Map, Error });
```

to:

```js
export function loadBP(files, extraGlobals = {}) {
  const window = { ...extraGlobals };
  const context = vm.createContext({
    window,
    Math,
    Object,
    Set,
    Map,
    Error,
    Number,
    Promise,
    setTimeout,
    clearTimeout,
  });
```

- [ ] **Step 2: Add the `AUDIO` file list export**

Append to `tests/unit/load-bp.mjs` (after `AUDIO_SYNTH` from Task 2):

```js
export const AUDIO = [
  "js/core/namespace.js",
  "js/services/audio-recipes.js",
  "js/services/audio-synth.js",
  "js/services/audio.js",
];
```

- [ ] **Step 3: Write the failing engine tests**

Create `tests/unit/audio-engine.test.mjs`:

```js
import { test } from "node:test";
import assert from "node:assert/strict";
import { loadBP, AUDIO } from "./load-bp.mjs";
import { MockAudioContext } from "./mock-audio.mjs";

function makeB() {
  return loadBP(AUDIO, { AudioContext: MockAudioContext });
}

function endAllSources(audio) {
  audio.ctx.nodes
    .filter(
      (n) =>
        (n.kind === "oscillator" || n.kind === "bufferSource") && n.onended,
    )
    .forEach((n) => n.end());
}

test("unlock() creates a MockAudioContext-backed context when levels are audible", () => {
  const B = makeB();
  const audio = new B.Audio({ master: 1, sfx: 1 });
  assert.equal(audio.unlock(), true);
  assert.ok(audio.ctx instanceof MockAudioContext);
});

test("unlock() does nothing when master/sfx level is zero", () => {
  const B = makeB();
  const audio = new B.Audio({ master: 0, sfx: 1 });
  assert.equal(audio.unlock(), false);
  assert.equal(audio.ctx, null);
});

test("play() starts a voice, and cleanup fully releases it once sources end", () => {
  const B = makeB();
  const audio = new B.Audio({ master: 1, sfx: 1 });
  audio.unlock();
  assert.equal(audio.play("shoot"), true);
  assert.equal(audio.voices.size, 1);
  endAllSources(audio);
  assert.equal(audio.voices.size, 0);
  const leaked = audio.ctx.nodes.filter((n) => !n.disconnected);
  assert.equal(
    leaked.length,
    0,
    "every created node should be disconnected after cleanup",
  );
});

test("play() throttles repeated calls to the same sound within its window", () => {
  const B = makeB();
  const audio = new B.Audio({ master: 1, sfx: 1 });
  audio.unlock();
  assert.equal(audio.play("shoot"), true);
  assert.equal(
    audio.play("shoot"),
    false,
    "second call inside the throttle window should be rejected",
  );
  audio.ctx.currentTime += 1;
  assert.equal(
    audio.play("shoot"),
    true,
    "after the throttle window elapses it should fire again",
  );
});

test("play() respects the maxVoices cap", () => {
  const B = makeB();
  const audio = new B.Audio({ master: 1, sfx: 1 });
  audio.unlock();
  audio.maxVoices = 1;
  assert.equal(audio.play("shoot"), true);
  assert.equal(
    audio.play("heavy"),
    false,
    "voice cap should reject a second concurrent voice",
  );
});

test("play() returns false without ever touching the context when unlock() was never called", () => {
  const B = makeB();
  const audio = new B.Audio({ master: 1, sfx: 1 });
  assert.equal(audio.play("shoot"), false);
  assert.equal(audio.ctx, null);
});
```

- [ ] **Step 4: Run the tests to confirm they fail**

Run: `node --test tests/unit/audio-engine.test.mjs`
Expected: FAIL — `audio.js` still builds nodes inline and its internal
node-tracking shape doesn't match what these tests (and Task 2's synth
module) expect yet.

- [ ] **Step 5: Rewrite `js/services/audio.js`**

Replace the entire file with:

```js
"use strict";
/* WebAudio synth engine that plays recipe-driven sound effects (B.Audio). */
(() => {
  const B = window.BP;
  const { RECIPES, THROTTLE } = B.AudioKit;
  const { tone, noise, sub } = B.AudioSynth;
  const CLEANUP_MARGIN_MS = 100;
  B.Audio = class {
    constructor(settings) {
      this.settings = settings || {};
      this.ctx = null;
      this.masterGain = null;
      this.compressor = null;
      this.voices = new Set();
      this.timers = new Set();
      this.last = Object.create(null);
      this.noiseBuffer = null;
      this.maxVoices = 28;
    }
    _master() {
      const v = Number(this.settings.master);
      return Number.isFinite(v) ? Math.max(0, Math.min(1, v)) : 0;
    }
    _sfx() {
      const v = Number(this.settings.sfx);
      return Number.isFinite(v) ? Math.max(0, Math.min(1, v)) : 0;
    }
    _level() {
      return this._master() * this._sfx();
    }
    sync() {
      if (!this.ctx || !this.masterGain) return false;
      const now = this.ctx.currentTime || 0,
        m = this._master();
      try {
        if (m <= 0 && this.masterGain.gain.setValueAtTime)
          this.masterGain.gain.setValueAtTime(0, now);
        else if (this.masterGain.gain.setTargetAtTime)
          this.masterGain.gain.setTargetAtTime(m, now, 0.01);
        else this.masterGain.gain.value = m;
        return true;
      } catch {
        return false;
      }
    }
    unlock() {
      if (!this._level()) return false;
      try {
        if (!this.ctx) {
          const C = window.AudioContext || window.webkitAudioContext;
          if (!C) return false;
          this.ctx = new C();
          this.masterGain = this.ctx.createGain();
          if (this.ctx.createDynamicsCompressor) {
            try {
              this.compressor = this.ctx.createDynamicsCompressor();
              this.compressor.threshold.value = -18;
              this.compressor.knee.value = 18;
              this.compressor.ratio.value = 8;
              this.compressor.attack.value = 0.003;
              this.compressor.release.value = 0.18;
              this.masterGain.connect(this.compressor);
              this.compressor.connect(this.ctx.destination);
            } catch {
              this.compressor = null;
              this.masterGain.connect(this.ctx.destination);
            }
          } else this.masterGain.connect(this.ctx.destination);
          this.sync();
        }
        if (this.ctx.resume) {
          const resumed = this.ctx.resume();
          if (resumed && resumed.catch) resumed.catch(() => {});
        }
        return true;
      } catch {
        return false;
      }
    }
    _noise() {
      if (this.noiseBuffer) return this.noiseBuffer;
      try {
        const c = this.ctx,
          n = Math.floor(c.sampleRate * 0.7),
          b = c.createBuffer(1, n, c.sampleRate),
          d = b.getChannelData(0);
        for (let i = 0; i < n; i++)
          d[i] = (Math.random() * 2 - 1) * (1 - i / n);
        return (this.noiseBuffer = b);
      } catch {
        return null;
      }
    }
    _buildVoiceNodes(recipe, now, level) {
      const sources = [];
      const disposables = [];
      const merge = (r) => {
        sources.push(...r.sources);
        disposables.push(...r.disposables);
      };
      merge(tone(this.ctx, recipe, now, level, this.masterGain));
      (recipe.tones || []).forEach((t) =>
        merge(
          tone(
            this.ctx,
            Object.assign({}, recipe, t),
            now,
            level,
            this.masterGain,
          ),
        ),
      );
      if (recipe.noise) {
        const noiseCfg = Object.assign({}, recipe, {
          vol: (recipe.vol || 0.1) * recipe.noise,
          filter: recipe.noiseFilter,
        });
        merge(
          noise(this.ctx, this._noise(), noiseCfg, now, level, this.masterGain),
        );
      }
      if (recipe.sub)
        merge(sub(this.ctx, recipe.sub, now, level, this.masterGain));
      return { sources, disposables };
    }
    _releaseVoice(token, disposables) {
      this.voices.delete(token);
      disposables.forEach((n) => {
        try {
          n.disconnect();
        } catch {}
      });
    }
    _scheduleVoiceCleanup(token, voiceNodes, recipe) {
      const { sources, disposables } = voiceNodes;
      let remaining = sources.length,
        finished = false,
        timer = null;
      const finish = (force) => {
        if (finished) return;
        if (!force && --remaining > 0) return;
        finished = true;
        if (timer !== null) {
          clearTimeout(timer);
          this.timers.delete(timer);
        }
        this._releaseVoice(token, disposables);
      };
      sources.forEach((s) => {
        s.onended = () => finish(false);
      });
      try {
        timer = setTimeout(
          () => finish(true),
          Math.ceil((recipe.dur || 0.1) * 1000) + CLEANUP_MARGIN_MS,
        );
        this.timers.add(timer);
      } catch {}
      if (!sources.length) finish(true);
    }
    play(name) {
      const c = this.ctx;
      if (c && this.masterGain) this.sync();
      const level = this._sfx();
      if (!this._master() || !level || !c || !this.masterGain) return false;
      const recipe = RECIPES[name] || RECIPES.ui,
        now = c.currentTime || 0;
      if (!this._canFire(name, now)) return false;
      const token = {};
      try {
        this.voices.add(token);
        const nodes = this._buildVoiceNodes(recipe, now, level);
        this._scheduleVoiceCleanup(token, nodes, recipe);
        return true;
      } catch {
        this.voices.delete(token);
        return false;
      }
    }
    _canFire(name, now) {
      const last = this.last[name] === undefined ? -Infinity : this.last[name];
      if (
        now - last < (THROTTLE[name] || 0) ||
        this.voices.size >= this.maxVoices
      )
        return false;
      this.last[name] = now;
      return true;
    }
  };
})();
```

(This is the same public shape and lifecycle as before — `unlock()`,
`sync()`, `play(name)` — only `_buildVoiceNodes`/`_releaseVoice`/
`_scheduleVoiceCleanup` change internally, plus the old inline
`_tone()`/`_noiseVoice()` methods are gone, replaced by calls into
`B.AudioSynth`.)

- [ ] **Step 6: Run the tests to confirm they pass**

Run: `node --test tests/unit/audio-engine.test.mjs`
Expected: `6 passing`, `0 failing`.

- [ ] **Step 7: Run the full unit suite to confirm no regressions**

Run: `npm run test:unit`
Expected: all files pass, including `core.test.mjs` and `airframes.test.mjs`
(the `loadBP` signature change in Step 1 is additive/backward-compatible —
confirm this here).

- [ ] **Step 8: Lint and commit**

Run: `npm run lint`
Expected: no errors.

```bash
git add js/services/audio.js tests/unit/audio-engine.test.mjs tests/unit/load-bp.mjs
git commit -m "refactor(audio): rewire engine onto AudioSynth primitives, add engine tests"
```

---

### Task 4: Wire the new script into the page and run the full test/lint suite

**Files:**

- Modify: `index.html:24-25`

- [ ] **Step 1: Add the script tag**

In `index.html`, change:

```html
<script src="js/services/audio-recipes.js"></script>
<script src="js/services/audio.js"></script>
```

to:

```html
<script src="js/services/audio-recipes.js"></script>
<script src="js/services/audio-synth.js"></script>
<script src="js/services/audio.js"></script>
```

- [ ] **Step 2: Run the full project checks**

Run: `npm run lint`
Expected: no errors.

Run: `npm run format:check`
Expected: no diffs (if it reports diffs, run `npm run format` and re-check).

Run: `npm run test:unit`
Expected: all passing.

Run: `npm test`
Expected: passes (existing `tests/verify.mjs` suite — confirms nothing else
in the game broke).

- [ ] **Step 3: Commit**

```bash
git add index.html
git commit -m "chore(audio): load audio-synth.js on the page"
```

---

### Task 5: Manual browser verification

**Files:** none (verification only)

- [ ] **Step 1: Serve and open the game**

Run: `npm run serve` (or use the project's browser-preview tooling), then
open the served URL.

- [ ] **Step 2: Trigger every sound path and watch the console**

Start a run, fire the primary weapon (`shoot`), pick up/fire secondary
weapons if equipped (`heavy`/`rocket`/`missile`/`arc`), take damage
(`damage`), destroy enemies (`explosion`), open any UI/shop screen (`ui`,
`upgrade`), level up (`levelUp`), and if reachable in a short session, kill a
boss (`bossDeath`/`bossArrival`) and die (`death`). Confirm:

- No errors in the browser console.
- No `AudioContext`/`WebAudio` warnings about disconnected or invalid nodes.

- [ ] **Step 3: Report back for a listening pass**

This is a human-ear judgment call the implementer cannot make alone — hand
back to the user to actually listen and flag any specific recipe that needs
retuning (frequencies, `vol`, `filter` sweep range, `drive` amount, etc. are
all cheap to iterate on in `js/services/audio-recipes.js` once real feedback
comes in).

---

## Self-Review Notes

- **Spec coverage:** Task 1 covers the recipe rewrite section of the spec;
  Task 2 covers the `audio-synth.js` module and every DSP primitive listed
  (unison/detune/spread, filter, drive, filtered noise, sub); Task 3 covers
  the `audio.js` engine rewrite; Task 4 covers the `index.html` wiring; Task
  5 covers the verification plan (browser check + explicit hand-off for the
  human-ear listening pass, since that's out of scope for automated testing
  per the spec's "Testing / verification" section).
- **Type consistency:** `{ sources, disposables }` is the single shared
  return shape used by `tone()`, `noise()`, and `sub()` in Task 2, and
  consumed identically by `_buildVoiceNodes`/`_scheduleVoiceCleanup`/
  `_releaseVoice` in Task 3 — verified consistent across both tasks.
- **No placeholders:** all code blocks are complete and copy-pasteable
  except the intentional "paste the reference table" instruction in Task 1
  Step 4, which points at a fully-written, non-placeholder object literal
  earlier in this same document.
