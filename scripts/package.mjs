// Builds the deployable game folder and upload zip from the files index.html
// actually references. Output (gitignored): dist/blast-past/ and
// dist/blast-past-hawk-host.zip
import { zipSync } from "fflate";
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const dist = path.join(root, "dist");
const target = path.join(dist, "blast-past");
const zipPath = path.join(dist, "blast-past-hawk-host.zip");
const REFERENCE = /<(?:script[^>]*\ssrc|link[^>]*\shref)="([^"?#]+)[^"]*"/g;

function referencedFiles(html) {
  // _headers is a Cloudflare Pages config (revalidate on every load), not
  // referenced from the HTML, so it is added explicitly.
  const files = new Set(["index.html", "_headers"]);
  for (const [, ref] of html.matchAll(REFERENCE)) {
    if (/^[a-z]+:/i.test(ref) || ref.startsWith("/"))
      throw new Error(`index.html must only reference local files: ${ref}`);
    files.add(path.normalize(ref));
  }
  return [...files];
}

function copy(files) {
  fs.rmSync(target, { recursive: true, force: true });
  for (const file of files) {
    const from = path.join(root, file);
    if (!fs.existsSync(from))
      throw new Error(`index.html references a missing file: ${file}`);
    const to = path.join(target, file);
    fs.mkdirSync(path.dirname(to), { recursive: true });
    fs.copyFileSync(from, to);
  }
}

// Some hosts pin a browser cache TTL that ignores our headers, so stamp every
// script/stylesheet URL with a hash of the build: a new deploy is a new URL.
function stampVersions(files) {
  const hash = crypto.createHash("sha1");
  for (const file of files.filter((f) => f !== "index.html").sort())
    hash.update(file).update(fs.readFileSync(path.join(target, file)));
  const version = hash.digest("hex").slice(0, 10);
  const indexPath = path.join(target, "index.html");
  const stamped = fs
    .readFileSync(indexPath, "utf8")
    .replace(
      /(<(?:script[^>]*\ssrc|link[^>]*\shref)=")([^"?#]+)(")/g,
      `$1$2?v=${version}$3`,
    );
  fs.writeFileSync(indexPath, stamped);
}

function zip(files) {
  const entries = {};
  for (const file of files)
    entries[file.split(path.sep).join("/")] = fs.readFileSync(
      path.join(target, file),
    );
  fs.writeFileSync(zipPath, zipSync(entries, { level: 9 }));
}

const html = fs.readFileSync(path.join(root, "index.html"), "utf8");
const files = referencedFiles(html);
copy(files);
stampVersions(files);
zip(files);
const kb = (fs.statSync(zipPath).size / 1024).toFixed(1);
console.log(
  `Packaged ${files.length} files -> dist/blast-past/ (${kb} KB zip)`,
);
