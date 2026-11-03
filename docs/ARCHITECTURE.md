# BLAST PAST architecture

Vanilla JavaScript, Canvas 2D, no build step. `index.html` loads every module
as an ordered classic `<script>` tag; all of them share one namespace,
`window.BP`, so the game opens directly from `file://` with no server and no
bundler. Keep that working when adding files: append a new `<script>` tag to
`index.html` in the right load position, and never introduce `import`/
`export` into `js/`.

## Load order and the shared namespace

`js/core/namespace.js` runs first and does `window.BP = window.BP || {}`.
Everything else attaches to `B = window.BP` inside its own IIFE:

```js
"use strict";
(() => {
  const B = window.BP;
  B.Something = class { ... };
})();
```

A few files read another module's export at _load time_ (not call time), so
they must load after it — `js/core/math.js` before anything that closes over
`B.clamp`, for instance. Everything else is free to load in any order,
because `window.game = new BP.Game(canvas)` (in `js/main.js`) runs on
`DOMContentLoaded`, by which point every script has already executed.

## Module map

| Directory      | Owns                                                                                                                                                                                                                                  |
| -------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `js/core/`     | Namespace bootstrap, math helpers (`clamp`, `distance`, `angle`, `turn`, `sweptDistance`, `localToWorld`), tuning constants (`B.Config`), the RNG, and keyboard/pointer input.                                                        |
| `js/services/` | `localStorage` persistence and the synthesized Web Audio engine.                                                                                                                                                                      |
| `js/content/`  | Static data: sector names, the upgrade catalog, achievements, enemy stat specs, and the shared weapon hardpoint coordinates.                                                                                                          |
| `js/sim/`      | Gameplay: the player, enemy AI, bosses, the wave director, environment hazards, weapons, projectiles, combat/XP, spawning, and presentation-only attitude (aircraft heading/roll).                                                    |
| `js/render/`   | Everything drawn to the canvas: the airframe registry and each aircraft's plan-view art, the rotor and shadow renderers, terrain, props, effects, the HUD-adjacent hangar screen, and the `Renderer` class that orchestrates a frame. |
| `js/ui/`       | DOM overlays (menu, upgrade cards, results, settings) and the HUD.                                                                                                                                                                    |
| `js/game/`     | The `Game` class: the fixed-step loop, state machine, and the `snapshot()`/`advanceTime()` test hooks.                                                                                                                                |

## The aircraft rendering system

Every aircraft — the player, every enemy type, both bosses, and the escort/
attack drones — is drawn through one shared pipeline instead of bespoke
sprite code per type:

- **`js/render/airframes/registry.js`** defines the airframe schema and
  validates every entry when it registers: rotor direction, tail-rotor side
  (must match the "thrust points toward the advancing-blade side" rule),
  and minimum tail-rotor diameter. See the file's header comment for the
  full schema.
- **`js/render/airframes/*.js`** — one file per airframe (`kestrel.js` is
  the player; `hind.js`, `ka52.js`, `chinook.js`, etc. are enemies/bosses).
  Each calls `B.Airframes.define({...})` with local-frame coordinates: nose
  at `-y`, starboard at `+x`. **Never mirror an airframe to flip facing** —
  rotate it. Mirroring moves the tail rotor to the wrong side.
- **`js/render/airframe-kit.js`** (`B.Kit`) is the shared painter toolkit:
  shaded hulls from centreline stations, glass canopies, wings, fins,
  camouflage, weapon pods.
- **`js/render/rotor.js`** (`B.Rotors`) draws the translucent tip-path disc
  and motion-blurred blade smear for main rotors, and the edge-on blurred
  bar for tail rotors. Spin rate is capped so the per-frame angular step
  stays under the wagon-wheel aliasing limit (`180° / blade count`).
- **`js/render/aircraft.js`** (`B.Aircraft`) is the per-frame orchestrator:
  it caches each airframe's body sprite (DPR-aware, so it stays sharp on
  high-density displays), draws a world-space shadow under one fixed sun
  direction, then the body, rotors, lights, and hit-flash.
- **`js/render/liveries.js`** defines the paint schemes (friendly grey,
  hostile sand/olive, elite charcoal-and-gold, drone).
- **`js/render/fleet.js`** and **`js/render/bosses.js`** map gameplay
  entities to airframes (`B.EnemyAirframes`, `B.EliteAirframes` in
  `js/content/hardpoints.js`) and call `B.Aircraft.draw` for the player,
  enemies, drones, and bosses respectively.
- **`js/sim/attitude.js`** computes presentation-only heading and roll each
  tick (enemies yaw toward their target or their velocity; the player rolls
  from lateral speed). It reads gameplay state but writes only to
  `entity.visual`/`p.roll`, so it never affects gameplay RNG or the golden
  replay's snapshot hash.
- **`js/content/hardpoints.js`** (`B.Hardpoints`) is the single source of
  truth for weapon-station coordinates, used both by the simulation
  (`js/sim/weapons.js`, via `B.localToWorld`) to spawn projectiles and by
  the art to draw muzzle flashes and pods — so a projectile always leaves
  from where its pod is drawn.

### Adding a new airframe

1. Copy `js/render/airframes/kestrel.js` as a starting point.
2. Pick real-world proportions: main rotor diameter in local px, then derive
   everything else as a fraction of it (see the comments in `kestrel.js` and
   the airframe table below for the ratios this project uses).
3. Work out the tail-rotor side from the rotor direction: a counter-clockwise
   main rotor (seen from above) needs its tail rotor thrusting to starboard;
   clockwise needs port. A **tractor** rotor sits on the thrust side; a
   **pusher** sits on the opposite side. `B.Airframes.define` throws if this
   is wrong.
4. Register the airframe, then add its script tag to `index.html` (and to
   `tools/aircraft-gallery.html`, which loads the same set for visual
   review).
5. Run `npm run gallery <id>` (or open `tools/aircraft-gallery.html`
   directly) to see it at several headings, at 1x and 3x scale, with rotors
   spinning, before wiring it into gameplay.
6. Map an enemy `type` to the new airframe id in `js/content/hardpoints.js`
   (`B.EnemyAirframes`).

| Airframe          | Role                  | Main rotor                        | Tail rotor                 |
| ----------------- | --------------------- | --------------------------------- | -------------------------- |
| `kestrel`         | Player                | 4 blades, CCW                     | Port, pusher               |
| `littleBird`      | Scout                 | 5 blades, CCW                     | Port, 2-blade              |
| `hind`            | Gunship               | 5 blades, CW                      | Port, tractor              |
| `ka52`            | Elite gunship         | Coaxial, 3+3, CW                  | None                       |
| `chinook`         | Heavy                 | Tandem, 3+3 (front CCW / rear CW) | None                       |
| `blackHawk`       | Missile carrier       | 4 blades, CCW                     | Starboard, canted, tractor |
| `mi17`            | Artillery             | 5 blades, CW                      | Port, tractor              |
| `jet`             | Interceptor           | — (fixed-wing)                    | —                          |
| `munition`        | Kamikaze              | — (fixed-wing, pusher prop)       | —                          |
| `quad` / `escort` | Swarm / player drones | 4 rotors, counter-rotating pairs  | None                       |
| `carrier`         | Assault Carrier boss  | 4 rotors, counter-rotating pairs  | None                       |

## Game loop and state machine

`js/game/game.js` runs a fixed 1/60s step (`B.Config.FIXED_DT`) driven by
`requestAnimationFrame`, accumulating real elapsed time so the simulation
never depends on frame rate. `g.mode` is the state machine: `menu` →
`playing` ↔ `paused`/`upgrade` → `dead` → back to `start()`. `Game.update`
runs its sub-steps in a fixed order — particles, effects, timers, player,
weapons, director, enemies, projectiles, pickups, environment, attitude —
and several tests and the golden replay depend on that order and on
`Weapons.explode` being able to push new shrapnel into `g.projectiles`
_during_ the `for...of` loop that moves them, so that shrapnel travels
within the tick it spawns.

## Test hooks (do not rename without updating tests/)

- `window.game` — the live `Game` instance.
- `window.render_game_to_text()` → `JSON.stringify(game.snapshot())`.
- `window.advanceTime(ms)` — sets `game.manual = true` (simulation no longer
  advances from `requestAnimationFrame`) and runs `Math.ceil(ms / 16.67)`
  fixed steps, then renders once.
- Tests reassign `game.enemies` / `game.projectiles` / `game.obstacles`
  directly, so no module may cache a reference to those arrays across ticks.
- The enemy type `"test"` must fall through both `Encounters.update` (no
  matching AI branch) and the renderer (no matching airframe) without
  throwing.

## Testing

| Command                                   | What it checks                                                                                                                                                                                                                                                      |
| ----------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `npm test`                                | `tests/verify.mjs` — Playwright over `file://`; movement, combat, upgrades, bosses, persistence, screenshots.                                                                                                                                                       |
| `npm run test:extended`                   | `tests/extended.mjs` — served over HTTP; settings persistence, fullscreen, upgrade-draft stress test, narrow viewports.                                                                                                                                             |
| `npm run test:golden`                     | `tests/golden.mjs` — replays 3 fixed seeds through the campaign and both bosses and hashes `snapshot()` every 60 steps. Any refactor that changes gameplay behavior fails this; regenerate deliberately with `npm run golden:update` and explain why in the commit. |
| `npm run test:unit`                       | `tests/unit/` — `node:test` running the classic scripts in `node:vm` against a fake `window`; math/RNG/config invariants and airframe realism checks (tail-rotor side, rotor direction by nationality, wagon-wheel spin limit).                                     |
| `npm run coverage`                        | Runs the three browser suites under Chromium's V8 coverage and reports the executed-source percentage per file (target ≥80%).                                                                                                                                       |
| `npm run gallery [id]`                    | Screenshots `tools/aircraft-gallery.html` (every airframe, or one by id) for visual review.                                                                                                                                                                         |
| `npm run lint` / `npm run format[:check]` | ESLint / Prettier.                                                                                                                                                                                                                                                  |

## Packaging

`npm run package` reads the `<script>`/`<link>` tags `index.html` actually
references, copies exactly those files into `dist/blast-past/`, and zips
them to `dist/blast-past-hawk-host.zip`. `dist/` is gitignored — it is
always regenerated from source, never hand-maintained.

## Deployment (manual — pushing to GitLab does NOT deploy)

The live site at [blast-past.eyesonflash.com](https://blast-past.eyesonflash.com/)
is a Cloudflare Pages project named **`eyesonflash-apps`** (it also hosts
other apps under that account; `blast-past.eyesonflash.com` is its custom
domain for this one). **This Pages project has no Git provider connected**
(`wrangler pages project list` shows `Git Provider: No`) — it only updates
when someone runs `wrangler pages deploy` by hand. Merging or pushing to
`main` on GitLab has no effect on the live site by itself.

To ship a change:

```bash
node scripts/package.mjs   # rebuilds dist/blast-past/ from the current tree
npx wrangler pages deploy dist/blast-past --project-name=eyesonflash-apps --branch=main
```

`wrangler` will use whatever Cloudflare account is already authenticated on
the machine (check with `npx wrangler whoami`; as of this writing that's the
`eyesonflash@gmail.com` account, token stored at
`~/AppData/Roaming/xdg.config/.wrangler/config/default.toml` on Windows). No
separate login step should be needed unless that token has expired.

Verify a deploy landed by checking the script list `index.html` actually
serves, e.g.:

```bash
curl -sSL https://blast-past.eyesonflash.com/ | grep 'script src'
```

If it still lists the old flat `js/core.js`, `js/render.js`, etc. instead of
the `js/core/…`, `js/render/…` module paths, the deploy didn't take (or
hasn't propagated yet — Cloudflare's edge is usually near-instant, but give
it a few seconds).

### GitLab CI is intentionally inert

`.gitlab-ci.yml` defines `lint`, `unit`, and `test` jobs, but **this project
has no active GitLab runner** and none is planned — GitLab's hosted runners
are a paid feature for this account and that cost isn't worth it for a
personal project. Every pipeline will sit in a permanent **"stuck" /
pending** state with the message _"you don't have any active runners that
can run this job."_ This is expected and not a bug to chase — treat GitLab's
pipeline UI as decorative. The actual test suite (`npm test`, `test:extended`,
`test:golden`, `test:unit`, `lint`, `format:check`) is run locally / by the
agent before anything ships; there is no CI gate in practice.
