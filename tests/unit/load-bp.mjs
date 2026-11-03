// Runs the game's classic browser scripts inside a node:vm context with a
// minimal `window`, returning the populated BP namespace for unit tests.
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { fileURLToPath } from "node:url";

const root = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
  "..",
);

export function loadBP(files, extraGlobals = {}) {
  const window = { ...extraGlobals };
  const context = vm.createContext({
    window,
    Math,
    Object,
    Set,
    Map,
    Error,
    Number,
    Promise,
    setTimeout,
    clearTimeout,
  });
  for (const file of files) {
    const code = fs.readFileSync(path.join(root, file), "utf8");
    vm.runInContext(code, context, { filename: file });
  }
  return window.BP;
}

export const CORE = [
  "js/core/namespace.js",
  "js/core/math.js",
  "js/core/config.js",
  "js/core/rng.js",
];

export const AIRFRAMES = [
  ...CORE,
  "js/content/hardpoints.js",
  "js/render/liveries.js",
  "js/render/airframe-kit.js",
  "js/render/airframes/registry.js",
  ...[
    "kestrel",
    "little-bird",
    "hind",
    "ka52",
    "chinook",
    "black-hawk",
    "mi17",
    "fixed-wing",
    "drones",
    "carrier",
  ].map((name) => `js/render/airframes/${name}.js`),
];

export const AUDIO_RECIPES = [
  "js/core/namespace.js",
  "js/services/audio-recipes.js",
];

export const AUDIO_SYNTH = [
  "js/core/namespace.js",
  "js/services/audio-synth.js",
];

export const AUDIO = [
  "js/core/namespace.js",
  "js/services/audio-recipes.js",
  "js/services/audio-synth.js",
  "js/services/audio.js",
];
