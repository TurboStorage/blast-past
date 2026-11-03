// Optional Chromium V8 JS coverage for the browser suites. Enabled when the
// COVERAGE environment variable is set; raw data goes to output/coverage/.
import fs from "node:fs";
import path from "node:path";

const enabled = Boolean(process.env.COVERAGE);
const dir = path.resolve("output/coverage");

export async function startCoverage(page) {
  if (enabled)
    await page.coverage.startJSCoverage({ resetOnNavigation: false });
}

export async function stopCoverage(page, name) {
  if (!enabled) return;
  const entries = await page.coverage.stopJSCoverage();
  fs.mkdirSync(dir, { recursive: true });
  const ours = entries.filter((e) => /\/js\/.+\.js/.test(e.url));
  fs.writeFileSync(path.join(dir, `${name}.json`), JSON.stringify(ours));
}
