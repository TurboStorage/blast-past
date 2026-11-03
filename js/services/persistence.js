"use strict";
/* Save-data defaults, normalization and localStorage persistence (B.Persistence). */
(() => {
  const B = window.BP,
    KEY = "blast-past-v2",
    SAVE_VERSION = 2,
    DEFAULT_SETTINGS = {
      master: 0.55,
      sfx: 0.7,
      shake: 0.65,
      particles: 1,
    };
  const number = (v, f = 0) =>
    Number.isFinite(Number(v)) ? Math.max(0, Number(v)) : f;
  const clamp = (v, f) => Math.max(0, Math.min(1, number(v, f)));
  const isPlainObject = (v) =>
    Boolean(v) && typeof v === "object" && !Array.isArray(v);
  const copyList = (v) => (Array.isArray(v) ? v.slice() : []);
  function normalizeSettings(raw) {
    const incoming = isPlainObject(raw) ? raw : {};
    return Object.assign({}, DEFAULT_SETTINGS, incoming, {
      master: clamp(incoming.master, DEFAULT_SETTINGS.master),
      sfx: clamp(incoming.sfx, DEFAULT_SETTINGS.sfx),
      shake: clamp(incoming.shake, DEFAULT_SETTINGS.shake),
      particles: clamp(incoming.particles, DEFAULT_SETTINGS.particles),
    });
  }
  // Unknown keys from the source survive; every known field is rebuilt from
  // the source with its default fallback. Field order matches the save shape.
  function normalize(raw) {
    const source = isPlainObject(raw) ? raw : {};
    return Object.assign({}, source, {
      version: SAVE_VERSION,
      bestScore: number(source.bestScore),
      highestWave: number(source.highestWave),
      totalKills: number(source.totalKills),
      bossKills: number(source.bossKills),
      runs: number(source.runs),
      discoveries: copyList(source.discoveries),
      achievements: copyList(source.achievements),
      settings: normalizeSettings(source.settings),
    });
  }
  function storage() {
    try {
      return window.localStorage || null;
    } catch {
      return null;
    }
  }
  B.Persistence = {
    load() {
      const s = storage();
      if (!s) return normalize({});
      try {
        return normalize(JSON.parse(s.getItem(KEY)));
      } catch {
        return normalize({});
      }
    },
    save(data) {
      const s = storage();
      if (!s) return false;
      try {
        s.setItem(KEY, JSON.stringify(normalize(data)));
        return true;
      } catch {
        return false;
      }
    },
  };
  B.DEFAULT_SETTINGS = DEFAULT_SETTINGS;
})();
