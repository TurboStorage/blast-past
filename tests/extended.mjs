import { chromium } from "playwright";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { startCoverage, stopCoverage } from "./coverage.mjs";
import { startStaticServer } from "./local-server.mjs";
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const server = await startStaticServer(root);
let browser, page;
const out = path.resolve("output/extended");
fs.mkdirSync(out, { recursive: true });
const errors = [],
  requests = [],
  report = [];
// Declared before the try block so the catch handler can still take a
// failure screenshot (shot() referenced a page that had not loaded yet).
const shot = (n) => page.screenshot({ path: path.join(out, n + ".png") });
try {
  browser = await chromium.launch({ headless: true });
  page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  await startCoverage(page);
  page.on("pageerror", (e) => errors.push(e.message));
  page.on("request", (r) => {
    if (/^https?:/.test(r.url()) && !r.url().startsWith(server.url))
      requests.push(r.url());
  });
  await page.goto(server.url);
  await page.waitForFunction(() => window.game, undefined, { timeout: 10000 });
  await page.evaluate(() => advanceTime(0));
  await page.locator("[data-action=settings]").click();
  const slider = page.locator("#sfxVolume");
  await slider.evaluate((e) => {
    e.value = ".25";
    e.dispatchEvent(new Event("input", { bubbles: true }));
    e.dispatchEvent(new Event("change", { bubbles: true }));
  });
  assert.equal(await page.evaluate(() => game.settings.sfx), 0.25);
  await shot("settings");
  await page.locator("[data-action=close]").click();
  assert.equal(await page.evaluate(() => game.mode), "menu");
  await page.reload();
  await page.waitForFunction(() => window.game, undefined, { timeout: 10000 });
  assert.equal(await page.evaluate(() => game.settings.sfx), 0.25);
  await page.locator("[data-action=deploy]").click();
  await page.evaluate(() => advanceTime(0));
  await page.locator("#quickPause").click();
  const pausedTime = await page.evaluate(() => game.time);
  await page.locator("[data-action=settings]").click();
  await page.evaluate(() => advanceTime(2000));
  await page.locator("[data-action=close]").click();
  assert.equal(await page.evaluate(() => game.mode), "paused");
  assert.equal(await page.evaluate(() => game.time), pausedTime);
  await page.locator("[data-action=resume]").click();
  await page.evaluate(() => window.dispatchEvent(new Event("blur")));
  assert.equal(await page.evaluate(() => game.mode), "paused");
  await page.locator("[data-action=resume]").click();
  await page.keyboard.press("f");
  await page.waitForTimeout(150);
  const fullscreen = await page.evaluate(() => !!document.fullscreenElement);
  assert(fullscreen, "fullscreen enters via F");
  await page.keyboard.press("f");
  await page.waitForTimeout(150);
  assert.equal(await page.evaluate(() => !!document.fullscreenElement), false);
  report.push({
    test: "HTTP launch, settings save/reload, nested pause, blur, fullscreen",
    passed: true,
  });

  const validation = await page.evaluate(() => {
    const g = game;
    g.start(44);
    for (let i = 0; i < 100; i++) {
      const offered = BP.Upgrades.offer(g);
      if (new Set(offered.map((o) => o.id)).size !== 3) return false;
      if (offered.some((u) => !u.requires(g.player))) return false;
    }
    for (const u of BP.Upgrades.catalog) g.player.ranks[u.id] = u.max;
    const offered = BP.Upgrades.offer(g);
    return new Set(offered.map((o) => o.id)).size === 3;
  });
  assert(validation, "draft prerequisites and exhausted catalog remain valid");
  report.push({
    test: "100 upgrade drafts and exhausted-tree fallbacks",
    passed: true,
  });

  await page.evaluate(() => {
    game.start(999);
    game.director = { update() {} };
    game.manual = true;
    game.player.shield = 999;
    game.enemies = [];
    game.obstacles = [];
  });
  const warningCheck = await page.evaluate(() => {
    const g = game,
      e = g.spawnEnemy("test", 400, 100, { warning: 0, hp: 1000 });
    g.player.x = 400;
    g.player.y = 500;
    g.warnings.push({
      type: "line",
      action: "sweep",
      source: e.id,
      x: 400,
      y: 100,
      x2: 400,
      y2: 720,
      width: 100,
      life: 1,
      maxLife: 1,
      damage: 10,
      label: "SWEEP",
    });
    g.update(0.5);
    const before = g.beams.length;
    g.update(0.5);
    const after = g.beams.length;
    g.update(0.2);
    return { before, after, beam: g.effects.find((e) => e.type === "beam") };
  });
  assert.equal(warningCheck.before, 0);
  assert.equal(warningCheck.after, 1);
  assert(warningCheck.beam);
  await shot("telegraph-sweep");
  await page.evaluate(() => {
    const g = game;
    g.warnings.push({
      type: "circle",
      action: "bombard",
      source: g.enemies[0].id,
      x: 650,
      y: 450,
      radius: 68,
      life: 0.8,
      maxLife: 1,
      label: "BOMBARDMENT",
    });
    g.render();
  });
  await shot("telegraph-bombard");
  report.push({
    test: "Telegraph precedes moving beam; bombardment visible",
    passed: true,
  });

  // Fixed-seed, unmodified-health runs with a simple mouse pilot: useful for pacing, not a human skill estimate.
  const tuning = await page.evaluate(() => {
    const results = [];
    for (const seed of [10, 28, 73]) {
      game.start(seed);
      game.manual = true;
      let firstUpgrade = null;
      const levels = [];
      for (let n = 0; n < 60 * 150 && game.mode !== "dead"; n++) {
        if (game.mode === "upgrade") {
          if (firstUpgrade === null) firstUpgrade = game.time;
          const priorities = [
            "link",
            "drones",
            "arc",
            "rockets",
            "missiles",
            "rapid",
            "caliber",
            "armor",
            "pierce",
          ];
          const offers = game.offers;
          let best = 0;
          for (let i = 1; i < offers.length; i++)
            if (
              (priorities.indexOf(offers[i].id) < 0
                ? 99
                : priorities.indexOf(offers[i].id)) <
              (priorities.indexOf(offers[best].id) < 0
                ? 99
                : priorities.indexOf(offers[best].id))
            )
              best = i;
          game.chooseUpgrade(best);
          levels.push(game.level);
        }
        const p = game.player;
        let x = game.w * 0.5 + Math.sin(game.time * 0.8) * game.w * 0.28,
          y = 515 + Math.sin(game.time * 0.43) * 70;
        const target = game.nearest(p, 500, (e) => e.y < p.y - 80);
        if (target) x = x * 0.45 + target.x * 0.55;
        let fx = 0,
          fy = 0;
        for (const b of game.projectiles)
          if (b.enemy) {
            const d = BP.distance(p, b);
            if (d < 100) {
              fx += ((p.x - b.x) / (d || 1)) * (100 - d) * 4;
              fy += ((p.y - b.y) / (d || 1)) * (100 - d) * 4;
            }
          }
        game.input.x = BP.clamp(x + fx, 35, game.w - 35);
        game.input.y = BP.clamp(y + fy, 220, game.h - 70);
        game.input.moved = true;
        game.input.down = true;
        game.update(1 / 60);
      }
      results.push({
        seed,
        firstUpgrade,
        time: game.time,
        wave: game.wave,
        hp: game.player.hp,
        level: game.level,
        kills: game.kills,
        score: game.score,
        upgrades: game.player.ranks,
      });
    }
    return results;
  });
  report.push({ test: "Natural-health scripted pilot pacing samples", tuning });

  // Real requestAnimationFrame pacing, not thousands of synchronous renders.
  await page.evaluate(() => {
    game.start(55);
    game.manual = false;
    game.player.shield = 999;
    game.wave = 8;
    game.director = new BP.Director(game);
    for (const id of [
      "link",
      "rapid",
      "rapid",
      "rockets",
      "missiles",
      "arc",
      "drones",
      "droneLink",
      "cluster",
      "homing",
      "crit",
      "critArc",
    ])
      BP.Upgrades.apply(game, id);
    game.input.down = true;
    game.gainXp = () => {};
  });
  const pacing = await page.evaluate(
    () =>
      new Promise((resolve) => {
        const samples = [];
        let previous = performance.now(),
          started = previous;
        function frame(now) {
          if (now - started > 750) {
            samples.push(now - previous);
          }
          previous = now;
          game.input.down = true;
          if (now - started < 6000) requestAnimationFrame(frame);
          else {
            samples.sort((a, b) => a - b);
            resolve({
              frames: samples.length,
              medianMs: samples[Math.floor(samples.length * 0.5)],
              p95Ms: samples[Math.floor(samples.length * 0.95)],
              worstMs: samples.at(-1),
              approxFps:
                1000 / (samples.reduce((a, b) => a + b, 0) / samples.length),
              counts: game.snapshot().counts,
            });
          }
        }
        requestAnimationFrame(frame);
      }),
  );
  await shot("real-time-combat");
  report.push({ test: "Real-time rendering over six seconds", pacing });
  await page.evaluate(() => {
    game.manual = true;
  });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.evaluate(() => {
    game.mode = "upgrade";
    game.offers = BP.Upgrades.offer(game);
    game.ui.refresh();
    game.render();
  });
  await shot("small-upgrade");
  const cardBounds = await page.locator(".upgrade-card").evaluateAll((cards) =>
    cards.map((c) => {
      const r = c.getBoundingClientRect();
      return { left: r.left, right: r.right };
    }),
  );
  assert(cardBounds.every((r) => r.left >= 0 && r.right <= 390));
  await page.locator(".upgrade-card").last().scrollIntoViewIfNeeded();
  await page.locator(".upgrade-card").last().click();
  assert.equal(await page.evaluate(() => game.mode), "playing");
  await page.evaluate(() => {
    game.die();
    game.render();
  });
  await shot("small-results");
  await page.locator("[data-action=restart]").scrollIntoViewIfNeeded();
  await page.locator("[data-action=restart]").click();
  assert.equal(await page.evaluate(() => game.mode), "playing");
  report.push({
    test: "Narrow viewport cards/results scroll and remain operable",
    passed: true,
  });
  assert.deepEqual(errors, []);
  assert.deepEqual(requests, [], "zero external asset/network requests");
  report.push({ test: "No page errors or external requests", passed: true });
  fs.writeFileSync(
    path.join(out, "report.json"),
    JSON.stringify({ passed: true, report }, null, 2),
  );
  console.log(JSON.stringify(report, null, 2));
} catch (e) {
  if (page) await shot("failure").catch(() => {});
  fs.writeFileSync(
    path.join(out, "report.json"),
    JSON.stringify(
      { passed: false, report, errors, error: String(e) },
      null,
      2,
    ),
  );
  throw e;
} finally {
  try {
    if (page) await stopCoverage(page, "extended").catch(() => {});
    await browser?.close();
  } finally {
    await server.close();
  }
}
