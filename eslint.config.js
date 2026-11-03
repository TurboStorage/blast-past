import js from "@eslint/js";
import globals from "globals";

// The game runs as classic <script> tags sharing one global (window.BP), so
// every runtime file is a browser script, not a module. game.js also puts
// window.game, window.render_game_to_text and window.advanceTime on the
// page for the test suites to call.
const gameGlobals = {
  BP: "readonly",
  game: "writable",
  render_game_to_text: "writable",
  advanceTime: "writable",
};

export default [
  js.configs.recommended,
  {
    files: ["js/**/*.js", "tools/**/*.js"],
    languageOptions: {
      sourceType: "script",
      ecmaVersion: 2022,
      globals: { ...globals.browser, ...gameGlobals },
    },
    rules: {
      "no-console": "warn",
      "no-unused-vars": ["warn", { argsIgnorePattern: "^_" }],
      // Ignoring an unsupported/rejected browser API (fullscreen, audio node
      // teardown) with an empty catch is an intentional, documented pattern.
      "no-empty": ["error", { allowEmptyCatch: true }],
    },
  },
  {
    files: ["scripts/**/*.mjs", "tests/**/*.mjs", "tests/unit/**/*.mjs"],
    languageOptions: {
      sourceType: "module",
      ecmaVersion: 2022,
      // Node top-level code and in-browser page.evaluate() closures share
      // these files, so both global sets apply.
      globals: { ...globals.node, ...globals.browser, ...gameGlobals },
    },
    rules: {
      "no-unused-vars": ["warn", { argsIgnorePattern: "^_" }],
      "no-empty": ["error", { allowEmptyCatch: true }],
    },
  },
  {
    ignores: [
      "docs/archive/**",
      "output/**",
      "dist/**",
      "node_modules/**",
      ".claude/**",
    ],
  },
];
