import { chromium } from "playwright";
import { pathToFileURL } from "node:url";
import fs from "node:fs";
import path from "node:path";
import assert from "node:assert/strict";
import { startCoverage, stopCoverage } from "./coverage.mjs";

const output = path.resolve("output/verification");
fs.mkdirSync(output, { recursive: true });
const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({
  viewport: { width: 1440, height: 900 },
});
const page = await context.newPage();
await startCoverage(page);
const errors = [];
page.on("pageerror", (e) => errors.push(e.message));
const notes = [];
const record = (name, data) => {
  notes.push({ name, ...data });
  console.log(name, JSON.stringify(data || {}));
};
const state = () => page.evaluate(() => JSON.parse(render_game_to_text()));
const step = (ms) => page.evaluate((ms) => advanceTime(ms), ms);
const shot = (name) =>
  page.screenshot({ path: path.join(output, name + ".png"), fullPage: true });
async function sandbox() {
  await page.evaluate(() => {
    game.start(812);
    game.manual = true;
    game.director = { update() {} };
    game.enemies = [];
    game.projectiles = [];
    game.obstacles = [];
    game.player.invuln = 0;
    game.input.scheme = "mouse";
    game.ui.refresh();
  });
}
try {
  await page.goto(
    process.argv[2] || pathToFileURL(path.resolve("index.html")).href,
  );
  await page.waitForFunction(() => window.game);
  await step(0);
  await shot("01-menu");
  await page.locator("[data-action=deploy]").click();
  await step(0);
  assert.equal((await state()).mode, "playing");
  await page.mouse.move(420, 625);
  await page.mouse.down();
  await step(900);
  const moved = await state();
  assert(moved.player.x < 500, "mouse follow steers left");
  assert(moved.counts.projectiles > 0, "held mouse fires");
  await page.mouse.up();
  await page.keyboard.press("Escape");
  const paused = await state();
  await step(1500);
  assert.equal((await state()).time, paused.time, "pause freezes combat");
  await page.keyboard.press("Escape");
  assert.equal((await state()).mode, "playing");
  await page.keyboard.down("Shift");
  await step(100);
  await page.keyboard.up("Shift");
  assert((await state()).player.boostCd > 3, "boost starts cooldown");
  record("Movement, fire, pause/resume, boost passed");

  await sandbox();
  await page.evaluate(() => {});
  const before = (await state()).player;
  await page.keyboard.down("ArrowRight");
  await page.keyboard.down("ArrowUp");
  await step(1000);
  await page.keyboard.up("ArrowRight");
  await page.keyboard.up("ArrowUp");
  const after = (await state()).player;
  assert(
    after.x > before.x + 180 && after.y < before.y - 180,
    "keyboard diagonal normalized movement",
  );
  await page.mouse.move(50, 300);
  await step(200);
  assert((await state()).player.angle < -2, "keyboard aim follows cursor");
  record("Keyboard steering and independent aim passed");

  await sandbox();
  await page.evaluate(() => {
    const g = game,
      p = g.player;
    g.spawnEnemy("test", p.x, p.y - 115, {
      warning: 0,
      hp: 24,
      maxHp: 24,
      speed: 0,
      xp: 40,
    });
    g.input.down = true;
  });
  await step(350);
  let combat = await state();
  assert.equal(combat.kills, 1, "shots kill target");
  assert(combat.score > 0);
  assert(combat.pickups.length > 0, "enemy death creates salvage");
  await page.evaluate(() => {
    game.input.down = false;
    game.player.y = game.pickups[0].y;
    game.player.x = game.pickups[0].x;
  });
  await step(20);
  combat = await state();
  assert.equal(combat.mode, "upgrade");
  assert.equal(combat.offers.length, 3);
  assert(
    combat.offers.some((u) =>
      ["rockets", "missiles", "arc", "drones"].includes(u.id),
    ),
    "early choice includes auxiliary weapon",
  );
  await shot("02-upgrade");
  await page.keyboard.press("Digit1");
  assert.equal((await state()).mode, "playing");
  assert(Object.keys((await state()).upgrades).length === 1);
  record("Kill → score → physical XP → level → card selection passed");
  await page.evaluate(() => {
    game.gainXp(800);
    game.openUpgrade();
  });
  let choices = 0;
  while ((await state()).mode === "upgrade" && choices < 20) {
    await page.keyboard.press("Digit1");
    choices++;
  }
  assert(choices >= 3 && choices < 20, "multiple earned levels handled");
  record("Queued level-up selections passed", { choices });

  await sandbox();
  await page.evaluate(() => {
    game.player.hp = 50;
    game.hurt(10);
    game.hurt(10);
  });
  assert.equal(
    (await state()).player.hp,
    40,
    "damage grace prevents repeated hit",
  );
  await page.evaluate(() => {
    game.player.invuln = 0;
    game.input.scheme = "mouse";
    game.player.shield = 3;
    game.hurt(100);
  });
  assert.equal((await state()).player.hp, 40, "shield blocks damage");
  await page.evaluate(() => {
    game.player.shield = 0;
    game.player.invuln = 0;
    game.input.scheme = "mouse";
    game.hurt(100);
  });
  assert.equal((await state()).mode, "dead");
  await shot("03-results");
  const runs = await page.evaluate(() => game.saved.runs);
  await page.evaluate(() => game.die());
  assert.equal(
    await page.evaluate(() => game.saved.runs),
    runs,
    "results saved once",
  );
  await page.locator("[data-action=restart]").click();
  assert.equal((await state()).kills, 0);
  assert.equal((await state()).player.hp, 100);
  record("Damage grace, shield, death, persistence, restart passed");

  const buildResults = [];
  for (const build of [
    {
      name: "ballistics",
      upgrades: ["link", "pierce", "explosive", "crit", "critArc"],
    },
    {
      name: "ordnance",
      upgrades: ["rockets", "missiles", "cluster", "homing", "blast"],
    },
    {
      name: "squadron",
      upgrades: ["drones", "link", "droneLink", "arc", "capacitor"],
    },
  ]) {
    await sandbox();
    await page.evaluate((upgrades) => {
      for (const id of upgrades) BP.Upgrades.apply(game, id);
      for (let n = 0; n < 12; n++)
        game.spawnEnemy(
          "test",
          game.player.x + ((n % 4) - 1.5) * 55,
          game.player.y - 160 - Math.floor(n / 4) * 55,
          { warning: 0, hp: 180, maxHp: 180, speed: 0 },
        );
      game.input.down = true;
    }, build.upgrades);
    await step(5000);
    const s = await state();
    assert(
      Object.values(s.weapons).reduce((a, b) => a + b, 0) > 0,
      build.name + " deals damage",
    );
    await shot("build-" + build.name);
    buildResults.push({
      name: build.name,
      kills: s.kills,
      damage: s.weapons,
      projectiles: s.counts.projectiles,
    });
  }
  record("Three distinct weapon builds exercised", { buildResults });

  await sandbox();
  const block = await page.evaluate(() => {
    const g = game,
      p = g.player;
    const o = BP.Environment.add(g, "wreck", p.x, p.y - 55);
    const e = g.spawnEnemy("test", p.x, p.y - 110, {
      warning: 0,
      hp: 100,
      maxHp: 100,
    });
    g.bullet(p.x, p.y, -Math.PI / 2, { speed: 8000, damage: 20 });
    g.update(1 / 60);
    return { hp: e.hp, propHp: o.hp };
  });
  assert.equal(block.hp, 100, "wreck blocks shot before enemy");
  assert(block.propHp < 135);
  record("Wreckage blocks fast projectiles before targets", block);
  await sandbox();
  const cargo = await page.evaluate(() => {
    const g = game,
      o = BP.Environment.add(g, "cargo", 300, 250);
    BP.Environment.explode(g, o);
    return g.pickups;
  });
  assert(cargo.some((p) => p.type === "xp"));
  record("Cargo rewards salvage");

  await sandbox();
  const waves = await page.evaluate(() => {
    const g = game;
    g.player.stats.regen = 8;
    g.player.hp = 50;
    g.player.stats.waveShield = 2;
    g.director = new BP.Director(g);
    g.waveTime = 0.01;
    g.update(1 / 60);
    return { wave: g.wave, hp: g.player.hp, shield: g.player.shield };
  });
  assert.equal(waves.wave, 2);
  assert.equal(waves.hp, 58);
  assert(waves.shield > 1.9);
  record("Automatic wave transition, repair and shield passed", waves);

  const bosses = [];
  for (const kind of ["carrier", "siege"]) {
    await sandbox();
    await page.evaluate((kind) => {
      game.wave = kind === "carrier" ? 10 : 20;
      game.director = new BP.Director(game);
      game.player.shield = 999;
    }, kind);
    await step(6000);
    let s = await state();
    assert(
      s.enemies.some((e) => e.boss),
      "boss spawned",
    );
    await shot("boss-" + kind + "-phase1");
    const phases = await page.evaluate(() => {
      const g = game,
        b = g.enemies.find((e) => e.boss);
      const phases = [];
      for (const ratio of [0.6, 0.28]) {
        b.hp = b.maxHp * ratio;
        g.update(1 / 60);
        phases.push(b.phase);
      }
      return phases;
    });
    assert.deepEqual(phases, [2, 3]);
    await step(4000);
    await shot("boss-" + kind + "-phase3");
    const parts = await page.evaluate(() => {
      const g = game,
        b = g.enemies.find((e) => e.boss),
        part = b.parts[0];
      const p = {
        x: b.x + part.x,
        y: b.y + part.y,
        px: b.x + part.x,
        py: b.y + part.y - 20,
        r: 3,
        weapon: "minigun",
      };
      BP.Encounters.damagePart(g, b, p, part.hp + 1);
      return part.dead;
    });
    assert(parts, "pod destroyed");
    await page.evaluate(() => {
      const b = game.enemies.find((e) => e.boss);
      game.damageEnemy(b, b.hp + 1, "test");
    });
    await step(50);
    s = await state();
    assert.equal(s.wave, kind === "carrier" ? 11 : 21);
    assert.equal(await page.evaluate(() => game.bossKills), 1);
    bosses.push({ kind, phases, nextWave: s.wave });
  }
  record("Both bosses: spawn, phases, parts, death, next sector passed", {
    bosses,
  });

  await sandbox();
  await page.evaluate(() => {
    game.wave = 9;
    game.player.shield = 999;
    game.director = new BP.Director(game);
    for (const id of [
      "link",
      "link",
      "rapid",
      "rapid",
      "pierce",
      "explosive",
      "crit",
      "critArc",
      "rockets",
      "rockets",
      "missiles",
      "cluster",
      "homing",
      "arc",
      "drones",
      "drones",
      "droneLink",
    ])
      BP.Upgrades.apply(game, id);
    game.input.down = true;
  });
  const stress = await page.evaluate(() => {
    const samples = [];
    for (let n = 0; n < 1800; n++) {
      if (game.mode === "upgrade") game.chooseUpgrade(0);
      game.input.down = true;
      const start = performance.now();
      game.update(1 / 60);
      if (n % 10 === 0) game.render();
      samples.push(performance.now() - start);
    }
    samples.sort((a, b) => a - b);
    game.render();
    return {
      median: samples[900],
      p95: samples[1710],
      max: samples[1799],
      counts: game.snapshot().counts,
      wave: game.wave,
    };
  });
  await shot("late-game");
  assert(
    stress.counts.particles <= 650 &&
      stress.counts.projectiles <= 700 &&
      stress.counts.enemies <= 65,
  );
  record(
    "Dense build 30 simulated seconds; draw every 10 steps to avoid an artificial GPU queue flood",
    stress,
  );

  await page.setViewportSize({ width: 390, height: 844 });
  await page.evaluate(() => {
    game.mode = "menu";
    game.ui.refresh();
  });
  await step(0);
  await shot("small-menu");
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth > innerWidth,
  );
  assert(!overflow, "small viewport no horizontal overflow");
  await page.setViewportSize({ width: 1440, height: 900 });
  assert.deepEqual(errors, [], "browser page errors");
  record("No browser errors and small viewport bounds passed");
  fs.writeFileSync(
    path.join(output, "report.json"),
    JSON.stringify({ passed: true, notes, errors }, null, 2),
  );
} catch (error) {
  await shot("failure").catch(() => {});
  fs.writeFileSync(
    path.join(output, "report.json"),
    JSON.stringify(
      { passed: false, notes, errors, error: String(error) },
      null,
      2,
    ),
  );
  throw error;
} finally {
  await stopCoverage(page, "verify").catch(() => {});
  await browser.close();
}
