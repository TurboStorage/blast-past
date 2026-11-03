// Golden replay: deterministic fixed-seed runs whose snapshot hashes must not
// change during behaviour-preserving refactors. `--update` rewrites the baseline.
import { chromium } from "playwright";
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { startCoverage, stopCoverage } from "./coverage.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const baselinePath = path.join(root, "tests", "golden", "baseline.json");
const SEEDS = [1, 7, 42];
const SEGMENTS = [
  { name: "campaign", wave: 1, steps: 2400 },
  { name: "carrier", wave: 10, steps: 1800 },
  { name: "siege", wave: 20, steps: 1800 },
];
const SAMPLE_EVERY = 60;
const update = process.argv.includes("--update");

const sha = (text) => crypto.createHash("sha256").update(text).digest("hex");

// Serialized by Playwright and executed inside the page.
function runSegment({ seed, segment, sampleEvery }) {
  const g = window.game;
  g.manual = true;
  g.start(seed);
  if (segment.wave !== 1) {
    g.wave = segment.wave;
    g.director = new window.BP.Director(g);
    g.player.shield = 999;
  }
  g.input.moved = true;
  g.input.down = true;
  const samples = [];
  for (let step = 1; step <= segment.steps; step++) {
    // Deterministic Lissajous cursor sweep across the lower battlefield.
    g.input.x = g.w * (0.5 + 0.38 * Math.sin(step * 0.013));
    g.input.y = g.h * (0.72 + 0.14 * Math.sin(step * 0.021));
    if (g.mode === "upgrade") g.chooseUpgrade(0);
    if (g.mode === "playing") g.update(1 / 60);
    if (step % sampleEvery === 0) {
      g.render();
      samples.push(JSON.stringify(g.snapshot()));
    }
    if (g.mode === "dead") break;
  }
  return samples;
}

async function capture(page) {
  const result = {};
  for (const seed of SEEDS) {
    result[seed] = {};
    for (const segment of SEGMENTS) {
      const samples = await page.evaluate(runSegment, {
        seed,
        segment,
        sampleEvery: SAMPLE_EVERY,
      });
      result[seed][segment.name] = {
        hash: sha(samples.join("\n")),
        samples: samples.map(sha),
      };
    }
  }
  return result;
}

function firstDifference(expected, actual) {
  const length = Math.max(expected.samples.length, actual.samples.length);
  for (let i = 0; i < length; i++)
    if (expected.samples[i] !== actual.samples[i])
      return `sample ${i} (step ${(i + 1) * SAMPLE_EVERY})`;
  return "sample count";
}

function compare(expected, actual) {
  const failures = [];
  for (const seed of SEEDS)
    for (const { name } of SEGMENTS) {
      const want = expected[seed]?.[name],
        got = actual[seed][name];
      if (!want) failures.push(`seed ${seed} ${name}: missing baseline`);
      else if (want.hash !== got.hash)
        failures.push(`seed ${seed} ${name}: ${firstDifference(want, got)}`);
    }
  return failures;
}

const browser = await chromium.launch({ headless: true });
const errors = [];
try {
  const page = await browser.newPage({
    viewport: { width: 1280, height: 720 },
  });
  page.on("pageerror", (e) => errors.push(e.message));
  await startCoverage(page);
  await page.goto(pathToFileURL(path.join(root, "index.html")).href);
  await page.waitForFunction(() => window.game, undefined, { timeout: 10000 });
  const actual = await capture(page);
  await stopCoverage(page, "golden");
  if (errors.length) throw new Error("Page errors: " + errors.join("; "));
  if (update) {
    fs.mkdirSync(path.dirname(baselinePath), { recursive: true });
    fs.writeFileSync(baselinePath, JSON.stringify(actual, null, 2) + "\n");
    console.log("Golden baseline written:", path.relative(root, baselinePath));
  } else {
    const failures = compare(
      JSON.parse(fs.readFileSync(baselinePath, "utf8")),
      actual,
    );
    if (failures.length) {
      console.error("Golden replay drift:\n  " + failures.join("\n  "));
      process.exitCode = 1;
    } else {
      console.log(
        `Golden replay matches (${SEEDS.length} seeds x ${SEGMENTS.length} segments)`,
      );
    }
  }
} finally {
  await browser.close();
}
