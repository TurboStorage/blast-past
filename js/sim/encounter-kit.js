"use strict";
/* Shared encounter helpers (B.EncounterKit): seeded ranges, telegraph warnings, enemy shots. */
(() => {
  const B = window.BP;
  function rand(g, a, b) {
    return g.rng.range(a, b);
  }
  function warning(g, o) {
    // Renderer contract: {type, x, y, radius?, x2?, y2?, width?, life, maxLife, color, label}.
    o.life = o.life == null ? 1 : o.life;
    o.maxLife = o.maxLife || o.life;
    o.color = o.color || "#ffbd67";
    if (g.warnings.length < B.Config.MAX_WARNINGS) g.warnings.push(o);
    return o;
  }
  function shot(g, e, a, extra = {}) {
    return g.bullet(
      e.x + Math.cos(a) * (e.r * 0.6),
      e.y + Math.sin(a) * (e.r * 0.6),
      a,
      Object.assign(
        {
          enemy: true,
          speed: 220,
          r: 5,
          damage: 9,
          color: "#ff6e77",
          life: 5,
          weapon: "enemy",
        },
        extra,
      ),
    );
  }
  B.EncounterKit = { rand, warning, shot };
})();
