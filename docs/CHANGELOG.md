# Changelog

Notable changes to BLAST PAST. Dates are when the work landed on the
`feature/aircraft-overhaul` branch.

## Unreleased — realistic helicopter roster and project refactor

### Gameplay

- Enemies no longer despawn off the bottom of the screen. Descending types
  (scout, gunship, swarm, heavy, missile, artillery) turn back at ~78% of the
  screen height and dive again at ~22% (`patrol` in `js/sim/enemy-ai.js`),
  attacking until killed. While climbing they swing toward the player's side,
  and rotor enemies always face the player. Golden replay baseline regenerated.
- Fixed `B.Attitude.update` never being called, so enemies always drew facing
  straight down and the player never banked. It now runs each sim step.
- Controls: removed the saved Mouse/Keyboard setting, which differed between
  browsers because it lives in each browser's localStorage. The game now
  follows whichever device was used last (WASD/arrows, or deliberate cursor
  movement once the keys have been idle 1.5s).
- Input: pointer position is tracked window-wide (not just over the canvas),
  the pointer stays live across DEPLOY/restart, focus is dropped from overlay
  buttons on start, and Space keyup is suppressed in play, fixing mouse vs
  keyboard differences between browsers (notably Firefox).
- Refreshed `assets/blast-past.png` and added `assets/blast-past-gameplay.png`
  (both used in the README).

### Aircraft

- Replaced the single hand-drawn player sprite and generic enemy shapes with
  a shared, data-driven airframe rendering system
  (`js/render/airframes/registry.js`, `airframe-kit.js`, `rotor.js`,
  `aircraft.js`).
- New roster, each modeled on a real airframe's proportions and rotor
  configuration:
  - **Player:** AH-87 Kestrel (Apache/Viper-style tandem gunship).
  - **Scout:** Little Bird. **Gunship:** Mi-24 Hind. **Elite gunship:**
    Ka-52 (coaxial). **Heavy:** CH-47 Chinook (tandem). **Missile carrier:**
    UH-60 Black Hawk with ESSS pylons (canted tail rotor). **Artillery:**
    Mi-17 with rocket outriggers.
  - **Interceptor:** swept-wing jet. **Kamikaze:** delta-wing loitering
    munition. **Swarm / escort drones:** quadcopters.
  - **Assault Carrier boss:** redesigned as a plausible quad-rotor heavy
    gunship; the Siege Platform keeps its sea-fortress silhouette with the
    new lighting/shadow system.
- Every tail rotor is placed on the side its main rotor's spin direction
  demands (validated at registration time) and drawn edge-on as a blurred
  bar beside the fin, instead of a flat spinning disc.
- Main rotors are a cached translucent tip-path disc plus a motion-blurred
  blade smear, capped below the wagon-wheel aliasing limit so they never
  appear to freeze or spin backwards.
- One world-space shadow pass under a fixed sun direction for every
  aircraft; body sprites are cached per DPR so they stay sharp on
  high-density displays.
- Enemies now yaw to face their target or their direction of travel
  (`js/sim/attitude.js`), presentation-only and RNG-free.
- Rockets and missiles now launch from the wing hardpoints
  (`js/content/hardpoints.js`, shared between simulation and art) instead of
  fixed world offsets.

### Refactor

- Split the original 9-file, ~4100-line runtime into 50+ focused modules
  under `js/{core,services,content,sim,render,ui,game}/`. See
  [`ARCHITECTURE.md`](ARCHITECTURE.md) for the module map.
- Every function is now under 50 lines; every file under 800. Consolidated
  three copies of the swept segment/circle hit test into `B.sweptDistance`;
  named tuning constants in `js/core/config.js`.
- Fast-forwarded onto the 4 commits already on `origin/main` (archived the
  old prototype, added a license and CI, moved to Cloudflare Pages).
- Removed the hand-copied `blast-past/` deploy mirror and the stale
  `blast-past-hawk-host.zip`; replaced both with `npm run package`
  (`dist/blast-past/` + zip, built from the files `index.html` actually
  references).

### Testing and tooling

- Added `tests/golden.mjs`: a fixed-seed replay across 3 seeds and 3
  segments (campaign, both bosses), hashing `snapshot()` every 60 steps.
  Every refactor step in this branch was gated on this test passing
  unchanged.
- Added `tests/unit/` (`node:test` running the classic scripts in
  `node:vm`): math/RNG/config invariants, and airframe realism checks
  (tail-rotor side and size, rotor direction by nationality, tandem/coaxial
  configurations, wagon-wheel spin limit).
- Added `npm run coverage` (Chromium V8 coverage across the three browser
  suites); the runtime sits at 93.6%.
- Added ESLint (flat config) and Prettier; `npm run lint` and
  `npm run format:check` are both clean.
- Added `.gitattributes` to normalize line endings to LF on checkout.
- `tools/aircraft-gallery.html` + `npm run gallery [id]`: a dev-only page
  showing every airframe at several headings and scales, for visual review.
- Fixed a pre-existing bug in `tests/extended.mjs` where the failure
  screenshot helper was declared inside the `try` block and unreachable from
  `catch`, so a failing assertion threw a `ReferenceError` instead of saving
  a screenshot.
- Fixed the arc effect's white core stroke only covering the last segment
  of a multi-segment polyline.
