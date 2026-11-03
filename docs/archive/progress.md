Original prompt: Completely overhaul and rebuild BLAST PAST from the README concept into a polished browser-native helicopter roguelite. Preserve fast helicopter movement, guns, chaos, upgrades, and escalating survival. Build and test the game, prioritizing game feel, combat, progression, enemy variety, pacing, bosses, feedback, UI, audio, and polish. The user subsequently instructed: plan only; do not execute yet; use cheaper agents as needed when execution starts. On 2026-09-05 the user requested saving the plan to track execution progress.

# BLAST PAST rebuild tracker

Status: COMPLETE — all seven milestones implemented and verified.
Last updated: 2026-09-05

## Execution boundary

- The user authorized execution with “carry out plan” on 2026-09-05.
- Agent work follows the allocation below after the foundation checkpoint.
- Follow the README as the concept specification; the existing implementation is not a requirement to preserve.
- Update this tracker after each meaningful implementation chunk, test, bug discovery, and design decision.
- Mark a milestone complete only after its acceptance checkpoint passes. Record evidence and remaining limitations.

## Inspection findings

- `index.html` contains the currently loaded inline game implementation.
- `src/` contains a separate implementation that differs from the inline runtime.
- Establish one authoritative implementation rather than maintaining both.
- No Git repository was detected in the project or its parents at inspection time.
- No files were modified during planning. This tracker is the first planning artifact saved.

## Product direction

A scrolling aerial warzone where each approximately 30-second wave adds pressure, each upgrade changes capabilities, and each sector culminates in a major boss. Keep mouse-follow steering, immediate shooting, and fast restarts.

Technical baseline: vanilla JavaScript, Canvas 2D, Web Audio, and localStorage. Preserve direct opening of `index.html` without installation. Use ordered browser scripts with a shared namespace, avoiding a mandatory build step or local server. Development and browser test tooling may be separate from runtime dependencies.

Priorities: game feel → combat → builds → enemy variety → pacing → bosses → visual feedback → UI → audio → additional polish.

## Milestone 1 — Foundation and one excellent playable wave

- [x] Establish one authoritative runtime and remove obsolete duplicate runtime paths safely.
- [x] Separate input, simulation, rendering, audio, and content definitions.
- [x] Implement one game loop with explicit menu, combat, upgrade, pause, and results states.
- [x] Preserve direct-file browser launch.
- [x] Implement mouse-follow acceleration, strong braking, arrival dead zone, banking, animated rotors, and clear collision bounds.
- [x] Mouse mode: forward fire with modest target assistance so aiming does not fight steering.
- [x] Keyboard mode: WASD/arrows movement and cursor aiming.
- [x] Add a short cooldown-based boost on Shift.
- [x] Implement satisfying baseline gunfire, damage feedback, pause, and immediate restart.
- [x] Add deterministic time stepping and `window.render_game_to_text` for browser testing.
- [x] Checkpoint: movement, shooting, damage, pause, and restart feel satisfying against a few basic enemies. Test and inspect actual gameplay before expanding content.

## Milestone 2 — Combat and progression

- [x] Minigun: responsive primary fire supporting multishot, piercing, critical hits, and explosive rounds.
- [x] Rocket pods: periodic explosive salvos for crowd clearing.
- [x] Homing missiles: priority targeting with a role against elites.
- [x] Arc cannon: chains through tightly packed enemies.
- [x] Escort drones: independent support that can inherit primary modifiers.
- [x] Keep primary fire player-controlled; acquired auxiliary systems fire automatically.
- [x] Physical XP pickups with generous collection assistance.
- [x] Combo scoring and rare repair, shield, and EMP drops.
- [x] Three upgrade choices per level; correctly queue multiple earned levels.
- [x] Approximately 28–32 upgrades across weapon, airframe, system, and special categories.
- [x] Define prerequisites, rank limits, rarity weights, and useful fallback choices.
- [x] Implement piercing explosive rounds, homing cluster missiles, linked drones, and critical-hit lightning synergies.
- [x] Prevent recursive effects from generating infinite chains.
- [x] Checkpoint: three different builds feel meaningfully different within the first few minutes; upgrade choices remain applicable and mechanically correct.

## Milestone 3 — Encounters, hazards, and sectors

- [x] Implement scouts, gunships, interceptors, kamikazes, swarms, armored heavies, missile carriers, and artillery.
- [x] Differentiate enemy silhouettes, movement, attack patterns, and warning cues.
- [x] Build an encounter director using budgets and formation templates.
- [x] Waves 1–3: teach movement and introduce ranged threats.
- [x] Waves 4–5: environmental pressure and an elite encounter.
- [x] Waves 6–9: mixed threats and intensified formations.
- [x] Wave 10: sector boss.
- [x] Regular waves advance automatically after approximately 30 seconds, with a brief nonblocking banner.
- [x] Keep leftover threats within a global pressure budget; boss encounters continue until the boss dies.
- [x] Add explosive fuel tanks, breakable cargo, and projectile-blocking wreckage.
- [x] Spawn warnings and attack telegraphs leave viable escape routes.
- [x] Checkpoint: complete a sector without unannounced unavoidable damage, empty stretches, or excessive enemy health.

## Milestone 4 — Bosses

- [x] Assault Carrier: destructible weapon pods, drone launches, missile fans, and increasingly aggressive damaged phases.
- [x] Siege Platform: rotating batteries, marked bombardment zones, and sweeping beams.
- [x] Three phases and recognizable attack sequences for each boss.
- [x] Boss destruction: component explosions, debris, shockwave, brief slow motion, dramatic audio, and a large reward.
- [x] Continue into harder sectors through new combinations and attack variations, with restrained health scaling.
- [x] Checkpoint: verify all phases, component interactions, deaths, rewards, and sector transitions end to end.

## Milestone 5 — Visual and audio identity

- [x] Detailed procedural Canvas aircraft with military silhouettes and warm metal accents.
- [x] Cyan instrumentation, amber ammunition, and clearly contrasting hostile projectiles.
- [x] Three parallax environments: industrial ruins, ocean installations, and orbital scrapyard.
- [x] Cache reusable artwork and background elements.
- [x] Distinct effects for bullet impacts, rocket recoil, major hits, damage smoke, and boss destruction.
- [x] Synthesized weapon voices, layered explosions, warnings, pickups, upgrade selection, and death sounds.
- [x] Cap simultaneous audio voices.
- [x] Checkpoint: late-game combat remains readable with reduced particles and screen shake disabled.

## Milestone 6 — Complete game flow and persistence

- [x] Animated title screen and one-click deployment.
- [x] Compact combat HUD and clear upgrade cards with keyboard selection.
- [x] Pause/settings and immediate redeployment.
- [x] Results: score, survival time, wave, level, kills, damage, bosses, upgrades, and weapon performance.
- [x] Versioned localStorage with safe defaults for records, discoveries, achievements, and settings.
- [x] No permanent stat grind.
- [x] Master/SFX volume, shake, particle density, fullscreen, and control switching.
- [x] Automatic pause on lost focus and responsive resizing.
- [x] Checkpoint: complete menu → deploy → upgrade → pause/settings → death → results → restart flow; verify saved settings and records after reload.

## Milestone 7 — Balance, verification, and delivery

- [x] Follow the develop-web-game skill's Playwright client loop after meaningful changes.
- [x] Repeatable scenarios cover movement, damage, upgrades, synergies, waves, bosses, death, persistence, and restart.
- [x] Inspect actual gameplay screenshots and text state; review console errors and fix regressions.
- [x] Test direct-file and local HTTP launch.
- [x] Test multiple window sizes, repeated restarts, and dense late-game builds.
- [x] Measure frame time and entity counts before adding optimizations.
- [x] Cap particles, projectiles, enemies, and audio voices; verify cleanup.
- [x] Target smooth 60 FPS on the available machine; record measured results and test conditions.
- [x] Update README with accurate controls, launch instructions, and implemented features.
- [x] Checkpoint: all important interactions pass, no known blocking errors remain, and performance evidence covers demanding gameplay.

## Future agent allocation

Do not dispatch until execution is authorized. First finish the foundation and define shared interfaces. Keep main-loop ownership with one coordinating agent. Give each agent bounded tasks, separate file ownership, acceptance checks, and a concise handoff. Use at most three implementation agents concurrently.

| Work package                                     | Suggested model                               |
| ------------------------------------------------ | --------------------------------------------- |
| Enemy definitions and encounter schedules        | GPT-5.6 Luna                                  |
| Upgrade catalog and prerequisite validation      | GPT-5.6 Luna                                  |
| Audio, settings, persistence, and results UI     | GPT-5.6 Luna                                  |
| Combat engine and boss behavior                  | GPT-5.6 Terra                                 |
| Integration, gameplay review, and difficult bugs | Coordinating agent; escalate only when needed |

These are planned allocations, not agent dispatches or a requirement to run every package separately. Respect current tool rules for explicit model selection when execution starts.

## Execution log

| Date       | Work                                                                                                                                                                                                                                                                                    | Validation                                                                                                                                                                                                                      | Remaining work                                                                                                       |
| ---------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------- |
| 2026-09-05 | Read user request, README, existing roadmap, and runtime/source files. Created this tracker at user request.                                                                                                                                                                            | Read-only inspection; no gameplay tests run.                                                                                                                                                                                    | All implementation milestones await authorization.                                                                   |
| 2026-09-05 | Execution authorized. Created browser-script foundation with fixed-step loop, input, player, combat, XP, state transitions, and deterministic hooks. Preserved original HTML as a reference.                                                                                            | JavaScript syntax check passed. Installing matching Playwright browser for the bundled test runtime.                                                                                                                            | Validate foundation, then delegate bounded content/presentation tasks.                                               |
| 2026-09-05 | Completed the authoritative modular runtime, five weapon families, 32-upgrade catalog, eight enemy archetypes, encounter director, destructible hazards, three sectors, two phased bosses, procedural presentation, audio, settings, persistence, commendations, HUD, and results flow. | Full browser verification passed on file and HTTP launches. Both bosses, builds, progression, settings, restart, fullscreen, narrow layouts, and persistence passed. Real-time dense combat measured 60.0 FPS over six seconds. | No blocking work remains. Future balancing should use human play feedback rather than expanding scope speculatively. |

## Final validation evidence

- `tests/verify.mjs`: movement, mouse and keyboard controls, firing, boost, pause, collision, XP, queued upgrades, three distinct builds, damage, shielding, death, persistence, restart, destructible props, wave transitions, both bosses, component destruction, boss death, sector transitions, entity caps, and browser errors.
- `tests/extended.mjs`: HTTP launch, saved settings, nested pause flow, lost-focus pause, fullscreen, 100 randomized upgrade drafts, exhausted-tree fallbacks, warning-to-attack timing, moving boss beam, three fixed-seed pacing samples, real-time frame pacing, narrow-window upgrades/results, and absence of external requests.
- Browser screenshots under `output/verification` and `output/extended` were visually inspected for the menu, combat, upgrades, results, telegraphs, bosses, and narrow layouts.
- Real-time dense combat: 316 measured frames, 16.7 ms median and p95 frame interval, approximately 60.0 FPS, with 39 projectiles, 65 particles, and 7 enemies at capture time.

## Future tuning notes

- Human play feedback may justify adjusting XP rate, weapon balance, or boss pressure. Automated fixed-seed samples reach the first upgrade at roughly 11 seconds and wave 5 at 150 seconds.
- Keep the direct-file launch and zero-runtime-dependency constraint when extending the game.
- Run both browser suites and visually inspect updated screenshots after future gameplay or presentation changes.

## 2026-09-06 copter artwork update
- Rebuilt the cached player airframe with curved shaded armor, split glass cockpit, swept hardpoints, turbine intakes, tapered tail and navigation lights. Refined rotor blades and reduced visual firing recoil. Synced blast-past/js/render.js packaging copy.
- Validated bundled web-game client screenshots and state; npm test and npm run test:extended pass with no browser errors, approximately 60 FPS. No remaining blockers.

## 2026-09-07 distinct gunship revision
- User found the first pass too similar. Replaced airframe with graphite angular gunship, tandem blue glazing, broad turbine shoulders, swept wings, amber markings, longer tail and larger blades. Added renderer asset version to both entry points to refresh browser caches.
- Gameplay screenshot visually inspected; both browser suites pass, no page errors, 60 FPS.

