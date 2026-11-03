"use strict";
/* B.UI HUD: the in-flight heads-up display is built once, then tick() updates text and bar widths in place (throttled). */
(() => {
  const B = window.BP,
    HUD_INTERVAL = 0.1,
    clamp = (v, a, b) => Math.max(a, Math.min(b, v)),
    pct = (value, max) => clamp((value / max) * 100, 0, 100) + "%",
    text = () => document.createTextNode(""),
    el = (tag, className, ...children) => {
      const node = document.createElement(tag);
      if (className) node.className = className;
      node.append(...children);
      return node;
    },
    setText = (node, value) => {
      const next = String(value);
      if (node.textContent !== next) node.textContent = next;
    },
    setWidth = (node, value) => {
      if (node.style.width !== value) node.style.width = value;
    },
    setShown = (node, shown) => {
      if (node.hidden === shown) node.hidden = !shown;
    },
    sectorIndex = (wave) => Math.floor((wave - 1) / 10) % 3,
    bar = () => {
      const fill = el("i");
      return { fill, track: el("span", "", fill) };
    };

  const buildTop = (r) => {
    r.sector = text();
    r.wave = text();
    r.waveTimer = text();
    r.score = text();
    return el(
      "div",
      "hud-top",
      el("span", "sector", r.sector),
      el(
        "span",
        "wave",
        "WAVE ",
        el("b", "", r.wave),
        " ",
        el("i", "", r.waveTimer),
      ),
      el("span", "score", r.score),
    );
  };

  const buildBoss = (r) => {
    const hp = bar();
    r.bossName = text();
    r.bossPhase = text();
    r.bossFill = hp.fill;
    r.boss = el(
      "div",
      "boss-meter",
      el("label", "", r.bossName, el("b", "", r.bossPhase)),
      hp.track,
    );
    return r.boss;
  };

  const buildMeters = (r) => {
    const hull = bar(),
      xp = bar();
    r.hull = text();
    r.level = text();
    r.hullFill = hull.fill;
    r.xpFill = xp.fill;
    return [
      el("div", "meter", el("label", "", r.hull), hull.track),
      el(
        "div",
        "meter xp",
        el("label", "", r.level, el("small", "", "XP")),
        xp.track,
      ),
    ];
  };

  const buildBottom = (r) => {
    r.weapons = text();
    r.combo = el("b");
    r.boostFill = el("b");
    return el(
      "div",
      "hud-bottom",
      ...buildMeters(r),
      el("div", "hud-status", r.weapons, r.combo),
      el("div", "boost", "BOOST ", el("i", "boostbar", r.boostFill)),
    );
  };

  const buildHud = (root) => {
    const r = {};
    r.banner = el("div", "banner");
    root.replaceChildren(buildTop(r), buildBoss(r), buildBottom(r), r.banner);
    return r;
  };

  const weaponSummary = (stats) => {
    const parts = [
      ["ROCKETS", stats.rockets],
      ["MISSILES", stats.missiles],
      ["ARC", stats.arc],
      ["DRONES", stats.drones],
    ]
      .filter(([, n]) => n)
      .map(([label, n]) => `${label} ×${n}`);
    return parts.join(" · ") || "MINIGUN ONLINE";
  };

  Object.assign(B.UI.prototype, {
    tick() {
      const g = this.g;
      if (!this.hud || g.mode !== "playing") return;
      if (g.visualTime - this.hudClock < HUD_INTERVAL) return;
      this.hudClock = g.visualTime;
      this.hudRefs ??= buildHud(this.hud);
      const boss = g.enemies.find((e) => e.boss && !e.dead);
      this.updateHudTop(boss);
      this.updateHudBoss(boss);
      this.updateHudBottom();
      setText(this.hudRefs.banner, g.banner ?? "");
      setShown(this.hudRefs.banner, g.bannerTime > 0);
    },
    updateHudTop(boss) {
      const g = this.g,
        r = this.hudRefs,
        timer = Math.max(0, Math.ceil(g.waveTime)) + "s";
      setText(r.sector, g.sector || B.sectors[sectorIndex(g.wave)]);
      setText(r.wave, String(g.wave).padStart(2, "0"));
      setText(r.waveTimer, boss ? "BOSS" : timer);
      setText(r.score, String(g.score).padStart(6, "0"));
    },
    updateHudBoss(boss) {
      const r = this.hudRefs;
      setShown(r.boss, !!boss);
      if (!boss) return;
      setText(r.bossName, `${boss.name || "HOSTILE COMMAND"} `);
      setText(r.bossPhase, `PHASE ${boss.phase || 1}`);
      setWidth(r.bossFill, pct(boss.hp, boss.maxHp));
    },
    updateHudBottom() {
      const g = this.g,
        r = this.hudRefs,
        p = g.player,
        boostMax = 4 / (p.stats.boostRecharge || 1);
      setText(r.hull, `HULL ${Math.ceil(p.hp)} / ${p.maxHp}`);
      setWidth(r.hullFill, pct(p.hp, p.maxHp));
      setText(r.level, `LV ${g.level} `);
      setWidth(r.xpFill, pct(g.xp, g.xpNext));
      setText(r.weapons, weaponSummary(p.stats));
      setText(r.combo, `COMBO ×${g.combo}`);
      setShown(r.combo, g.combo > 1);
      setWidth(r.boostFill, pct(boostMax - p.boostCd, boostMax));
    },
  });
})();
