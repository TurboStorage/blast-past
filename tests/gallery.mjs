// Screenshots the dev aircraft gallery for visual review.
// Usage: node tests/gallery.mjs [airframeId] — writes output/gallery/*.png
import { chromium } from "playwright";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const out = path.join(root, "output", "gallery");
const only = process.argv[2];
const CLOCKS = [0.5, 0.517, 0.533];
fs.mkdirSync(out, { recursive: true });

const browser = await chromium.launch({ headless: true });
const errors = [];
try {
  const page = await browser.newPage({
    viewport: { width: 1700, height: 1200 },
    deviceScaleFactor: 2,
  });
  page.on("pageerror", (e) => errors.push(e.message));
  const base = pathToFileURL(path.join(root, "tools", "aircraft-gallery.html"));
  for (const [i, t] of CLOCKS.entries()) {
    const query = new URLSearchParams({ t: String(t) });
    if (only) query.set("id", only);
    await page.goto(`${base.href}?${query}`);
    await page.waitForFunction(() => window.galleryReady, undefined, {
      timeout: 10000,
    });
    const name = `${only || "all"}-frame${i}.png`;
    await page
      .locator("#gallery")
      .screenshot({ path: path.join(out, name), scale: "css" });
    // Close-up of the large 2.4x aircraft in the first cell.
    if (only)
      await page.screenshot({
        path: path.join(out, `${only}-zoom${i}.png`),
        clip: { x: 30, y: 60, width: 260, height: 330 },
      });
    console.log("wrote", path.join("output", "gallery", name));
  }
  if (errors.length) {
    console.error("Page errors:\n  " + errors.join("\n  "));
    process.exitCode = 1;
  }
} finally {
  await browser.close();
}
