// Runs the browser suites with Chromium V8 coverage and reports, per runtime
// file, the share of source bytes executed in any suite. Exits non-zero when
// total coverage falls below the target.
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const dir = path.join(root, "output", "coverage");
const TARGET = 80;
const SUITES = ["tests/verify.mjs", "tests/extended.mjs", "tests/golden.mjs"];

function runSuites() {
  fs.rmSync(dir, { recursive: true, force: true });
  for (const suite of SUITES)
    execFileSync(process.execPath, [suite], {
      cwd: root,
      stdio: "ignore",
      env: { ...process.env, COVERAGE: "1" },
    });
}

// V8 block ranges nest: later (inner) ranges override their parent's count.
function coveredMask(entry) {
  const mask = new Uint8Array(entry.source.length);
  for (const fn of entry.functions)
    for (const r of fn.ranges)
      mask.fill(r.count > 0 ? 1 : 0, r.startOffset, r.endOffset);
  return mask;
}

function merge() {
  const files = new Map();
  for (const name of fs.readdirSync(dir)) {
    for (const entry of JSON.parse(
      fs.readFileSync(path.join(dir, name), "utf8"),
    )) {
      const file = decodeURIComponent(new URL(entry.url).pathname).replace(
        /^.*?\/js\//,
        "js/",
      );
      const mask = coveredMask(entry);
      const seen = files.get(file);
      if (!seen) files.set(file, { source: entry.source, mask });
      else for (let i = 0; i < mask.length; i++) seen.mask[i] |= mask[i];
    }
  }
  return files;
}

// Count only meaningful characters so whitespace and comments do not skew it.
function measure({ source, mask }) {
  let total = 0,
    hit = 0;
  const code = source.replace(/\/\*[\s\S]*?\*\/|\/\/.*$/gm, (m) =>
    " ".repeat(m.length),
  );
  for (let i = 0; i < code.length; i++) {
    if (/\s/.test(code[i])) continue;
    total++;
    hit += mask[i];
  }
  return { total, hit };
}

runSuites();
let total = 0,
  hit = 0;
const rows = [...merge()].sort(([a], [b]) => a.localeCompare(b));
for (const [file, data] of rows) {
  const m = measure(data);
  total += m.total;
  hit += m.hit;
  console.log(`${((100 * m.hit) / m.total).toFixed(1).padStart(6)}%  ${file}`);
}
const pct = (100 * hit) / total;
console.log(`${pct.toFixed(1).padStart(6)}%  TOTAL (target ${TARGET}%)`);
if (pct < TARGET) process.exitCode = 1;
