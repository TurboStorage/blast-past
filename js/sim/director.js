"use strict";
/* Wave director (B.Director): wave pacing, sector banners, formations, boss waves. */
(() => {
  const B = window.BP;
  const C = B.Encounters;
  const clamp = B.clamp;
  const specs = B.EnemySpecs;
  const { rand } = B.EncounterKit;

  const MAX_PRESSURE_CAP = 42;
  const PRESSURE_CAP_BASE = 13;
  const PRESSURE_CAP_PER_WAVE = 2.5;
  const ELITE_HP_MULTIPLIER = 1.55;
  const ELITE_SPEED_MULTIPLIER = 1.12;
  const ELITE_SCORE_MULTIPLIER = 1.5;
  const ELITE_XP_MULTIPLIER = 1.5;
  const ELITE_ROLL_CHANCE = 0.12;
  const ELITE_WAVE_THRESHOLD = 10;

  function pressureCapForWave(w) {
    return Math.min(
      MAX_PRESSURE_CAP,
      PRESSURE_CAP_BASE + w * PRESSURE_CAP_PER_WAVE,
    );
  }

  function pickFormationTypes(w, roll) {
    if (w % 10 === 5)
      return ["heavy", "gunship", "interceptor", "interceptor", "scout"];
    if (w === 1) return ["scout", "scout", "scout"];
    if (w === 2)
      return roll < 0.55 ? ["gunship", "scout"] : ["scout", "scout", "scout"];
    if (w < 6)
      return roll < 0.33
        ? ["gunship", "scout", "scout"]
        : roll < 0.66
          ? ["interceptor", "interceptor", "scout"]
          : ["swarm", "swarm", "swarm", "swarm", "scout"];
    if (roll < 0.2) return ["heavy", "scout", "interceptor"];
    if (roll < 0.43) return ["missile", "scout", "scout"];
    if (roll < 0.64) return ["artillery", "interceptor"];
    if (roll < 0.82) return ["kamikaze", "kamikaze", "gunship"];
    return ["swarm", "swarm", "swarm", "swarm", "swarm", "interceptor"];
  }

  function isEliteFormation(w, roll) {
    return (
      w % 10 === 5 || (w > ELITE_WAVE_THRESHOLD && roll < ELITE_ROLL_CHANCE)
    );
  }

  function eliteOptionsFor(type, elite) {
    if (!elite) return {};
    return {
      elite: true,
      hp: specs[type].hp * ELITE_HP_MULTIPLIER,
      maxHp: specs[type].hp * ELITE_HP_MULTIPLIER,
      speed: specs[type].speed * ELITE_SPEED_MULTIPLIER,
      score: Math.round(specs[type].score * ELITE_SCORE_MULTIPLIER),
      xp: Math.round(specs[type].xp * ELITE_XP_MULTIPLIER),
      color: "#ffcf69",
    };
  }

  function placeFormation(g, types, elite) {
    const spacing = Math.min(100, g.w / (types.length + 1)),
      center = rand(g, g.w * 0.2, g.w * 0.8);
    types.forEach((type, i) => {
      const x = clamp(
        center + (i - (types.length - 1) / 2) * spacing + rand(g, -20, 20),
        35,
        g.w - 35,
      );
      C.spawn(
        g,
        type,
        x,
        -28 - rand(g, 0, 80),
        Object.assign(
          { warning: 0.55 + rand(g, 0, 0.35) },
          eliteOptionsFor(type, elite),
        ),
      );
    });
  }

  B.Director = class {
    constructor(g) {
      this.g = g;
      this.spawn = 0;
      this.serial = 0;
      this.boss = null;
      this.enterWave(true);
    }
    pressure() {
      return this.g.enemies.reduce((n, e) => n + (e.dead ? 0 : e.cost || 1), 0);
    }
    enterWave(first = false) {
      const g = this.g,
        w = g.wave,
        p = g.player,
        s = p.stats || {};
      g.waveTime = 30;
      this.serial = 0;
      this.spawn = 0.3;
      if (!first) {
        if (s.regen) p.hp = Math.min(p.maxHp, p.hp + s.regen);
        if (s.waveShield) p.shield = Math.max(p.shield, s.waveShield);
      }
      g.sector = B.sectors[Math.floor((w - 1) / 10) % 3];
      if (!first) {
        g.banner = "WAVE " + String(w).padStart(2, "0") + " // " + g.sector;
        g.bannerTime = 2.2;
      }
      if (w % 10 === 1 && w > 1)
        g.banner =
          "SECTOR " + (Math.floor((w - 1) / 10) + 1) + " // " + g.sector;
      B.Environment?.setSector?.(g, g.sector);
      if (w === 5 || w % 10 === 5) {
        g.banner = "ELITE AIR WING";
        g.bannerTime = 2.4;
      }
    }
    update(dt) {
      const g = this.g;
      if (this.boss) {
        if (this.boss.dead || !g.enemies.includes(this.boss)) {
          this.boss = null;
          g.wave++;
          this.enterWave();
        }
        return;
      }
      if (g.wave % 10 === 0) {
        for (const e of g.enemies) if (!e.boss) e.dead = true;
        g.projectiles = g.projectiles.filter((p) => !p.enemy);
        this.boss = C.boss(
          g,
          (Math.floor(g.wave / 10) - 1) % 2 === 0 ? "carrier" : "siege",
        );
        return;
      }
      g.waveTime -= dt;
      this.spawn -= dt;
      const cap = pressureCapForWave(g.wave),
        target = Math.min(cap, 8 + g.wave * 1.55);
      if (this.spawn <= 0 && this.pressure() < target) {
        this.spawnFormation();
        this.spawn = clamp(1.35 - g.wave * 0.035, 0.38, 1.35);
      }
      if (g.waveTime <= 0) {
        g.wave++;
        this.enterWave();
      }
    }
    spawnFormation() {
      const g = this.g,
        w = g.wave,
        roll = g.rng.next();
      const types = pickFormationTypes(w, roll);
      const room = Math.max(0, pressureCapForWave(w) - this.pressure()),
        cost = types.reduce((n, t) => n + (specs[t].cost || 1), 0);
      if (cost > room) return;
      placeFormation(g, types, isEliteFormation(w, roll));
    }
  };
})();
