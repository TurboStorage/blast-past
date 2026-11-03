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
  // masterGain/compressor are persistent infra, not voice-scoped — only
  // nodes created from here on (by this play()) should end up disconnected.
  const baseline = audio.ctx.nodes.length;
  assert.equal(audio.play("shoot"), true);
  assert.equal(audio.voices.size, 1);
  endAllSources(audio);
  assert.equal(audio.voices.size, 0);
  const voiceNodes = audio.ctx.nodes.slice(baseline);
  const leaked = voiceNodes.filter((n) => !n.disconnected);
  assert.equal(
    leaked.length,
    0,
    "every voice node should be disconnected after cleanup",
  );
});

test("a noise tail longer than the main tone (noiseDur) keeps the voice alive until it ends", () => {
  const B = makeB();
  const audio = new B.Audio({ master: 1, sfx: 1 });
  audio.unlock();
  const baseline = audio.ctx.nodes.length;
  // "shoot" has noise.dur (0.22) > dur (0.09) — the tail should outlive the tone.
  assert.equal(audio.play("shoot"), true);
  const voiceNodes = audio.ctx.nodes.slice(baseline);
  const oscillators = voiceNodes.filter((n) => n.kind === "oscillator");
  const noiseSource = voiceNodes.find((n) => n.kind === "bufferSource");
  assert.ok(
    oscillators.length > 0 && noiseSource,
    "expected both a tone and a noise layer",
  );
  oscillators.forEach((o) => o.end());
  assert.equal(
    audio.voices.size,
    1,
    "voice should stay alive while the noise tail is still playing",
  );
  noiseSource.end();
  assert.equal(
    audio.voices.size,
    0,
    "voice should release once the noise tail ends",
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
