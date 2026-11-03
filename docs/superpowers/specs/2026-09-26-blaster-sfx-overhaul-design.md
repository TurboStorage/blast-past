# Blaster SFX Overhaul — Design

## Problem

All game SFX are procedurally synthesized (no audio assets, no build step) via
`js/services/audio-recipes.js` (data) and `js/services/audio.js` (WebAudio
engine). Every sound is a single oscillator with an exponential pitch sweep
plus an optional flat-decay noise burst. This reads as thin, single-tone
8-bit-arcade "beeps," most noticeably on the weapon-fire sounds (`shoot`,
`heavy`, `rocket`, `missile`, `arc`).

## Scope

Rework every recipe in `RECIPES` (all ~20 sounds — weapon fire, explosions/
impacts, and utility/pickup sounds) toward a punchier, layered "modern sci-fi
shooter" character, while staying 100% procedural (no sample files, no asset
pipeline, no new dependencies).

## Architecture

Split the synthesis primitives out of the engine/lifecycle code:

- **`js/services/audio-synth.js`** (new) — stateless DSP builders exposed as
  `B.AudioSynth`:
  - `tone(ctx, cfg, now, level, dest)` — N unison oscillators (`cfg.unison`,
    default 1) detuned by `cfg.detune` cents, optionally stereo-spread via
    `StereoPannerNode` (`cfg.spread`), summed through a shared envelope gain,
    with an optional filter envelope (`cfg.filter: {type, from, to, q}`) and
    optional soft-clip distortion (`cfg.drive`, 0–1) inserted before `dest`.
  - `noise(ctx, noiseBuffer, cfg, now, level, dest)` — existing decaying noise
    burst, now with an optional `cfg.filter` envelope (bandpass/lowpass) for
    shaped noise instead of a flat spectral wash.
  - `sub(ctx, cfg, now, level, dest)` — short sine "thump" layer for low-end
    punch on impacts (`cfg.sub: {from, to, vol, dur}`).
  - `driveCurve(amount)` — memoized `WaveShaperNode` curve generator (soft
    clip), keyed by rounded amount to avoid recomputation per play.
  - Every builder returns the list of created nodes so the caller can track
    them for cleanup (extends the existing `{source, gain}` node-tracking
    shape used by `_scheduleVoiceCleanup`/`_releaseVoice`).

- **`js/services/audio.js`** (trimmed) — keeps the `Audio` class: master gain
  - compressor, per-sound throttling (`THROTTLE`), voice pool cap
    (`maxVoices`), and cleanup scheduling. `_buildVoiceNodes` now calls into
    `B.AudioSynth` instead of building oscillators/filters inline.

- **`js/services/audio-recipes.js`** (rewritten data only) — recipes gain new
  _optional_ fields (`unison`, `detune`, `spread`, `filter`, `drive`, `sub`).
  All fields are additive; nothing outside these three files changes, since
  every call site only does `audio.play("name")`.

- **`index.html`** — add `<script src="js/services/audio-synth.js">` before
  `audio.js` (after `audio-recipes.js`).

## Per-sound treatment

- **shoot**: 2-voice detuned square/saw unison, fast downward bandpass sweep,
  short tight noise transient. This is the sound people hear most — biggest
  lever for "no longer 80s."
- **heavy / rocket / missile / arc**: same layering approach, each keeps its
  existing pitch identity (missile/arc stay more tonal; heavy gets more
  `drive` grit).
- **explosion / bossDeath / damage / death**: add a `sub` thump layer and a
  filtered (bandpass, sweeping down) noise burst instead of flat noise decay,
  for a real "crack + boom" instead of a wash.
- **UI / pickup / level-up / repair / shield / xp / upgrade / warning /
  bossArrival**: lighter touch — modest unison + filter for polish; these are
  in scope per user direction but aren't "blasters" so get less aggressive
  treatment (no drive/sub needed).

## Testing / verification

No existing tests reference audio (`tests/` has zero hits for
`Audio`/`RECIPES`/`THROTTLE`), so there's no regression suite to satisfy.
Verification plan:

1. Load the game in the browser preview, trigger every sound path (fire all
   weapon types, take damage, die, kill a boss, open shop/UI), confirm zero
   console/WebAudio errors and that `AudioContext` node counts return to
   baseline after each sound finishes (no leaked nodes).
2. Run `npm run lint` and `npm run test:unit` to confirm nothing else broke.
3. Audio quality itself is a human-ear judgment call — I cannot hear output.
   This is explicitly an iterative pass: ship the rework, then adjust
   specific recipes based on the user's listening feedback.

## Out of scope

- Sample-based audio / asset pipeline (explicitly rejected in favor of
  staying procedural).
- Positional/3D audio, music, or new sound events not already in `RECIPES`.
- Changes to any call site outside the three audio service files.
