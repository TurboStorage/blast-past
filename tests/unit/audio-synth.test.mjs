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
  // The curve is a Float32Array from the vm sandbox's own realm, so
  // `instanceof Float32Array` (this file's realm) would false-negative.
  assert.equal(
    Object.prototype.toString.call(driveNode.curve),
    "[object Float32Array]",
  );
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
