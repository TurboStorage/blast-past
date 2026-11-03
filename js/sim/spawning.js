"use strict";
/* Game spawn helpers: targeting, particles, effects, bullets, enemies, drops. */
(() => {
  const B = window.BP;
  Object.assign(B.Game.prototype, {
    nearest(from, range = 9999, predicate = () => true) {
      let found = null,
        best = range;
      for (const e of this.enemies) {
        if (e.dead || e.warning > 0 || !predicate(e)) continue;
        const d = B.distance(from, e);
        if (d < best) {
          best = d;
          found = e;
        }
      }
      return found;
    },
    particle(x, y, vx, vy, color, life = 0.5, size = 3) {
      if (
        this.particles.length <
        Math.round(B.Config.MAX_PARTICLES * this.settings.particles)
      )
        this.particles.push({ x, y, vx, vy, color, life, maxLife: life, size });
    },
    burst(x, y, color, count = 15, size = 4) {
      for (let i = 0; i < count * this.settings.particles; i++) {
        const a = this.rng.range(0, Math.PI * 2),
          v = this.rng.range(25, 180);
        this.particle(
          x,
          y,
          Math.cos(a) * v,
          Math.sin(a) * v,
          color,
          this.rng.range(0.2, 0.7),
          this.rng.range(1, size),
        );
      }
    },
    effect(type, x, y, extra = {}) {
      if (this.effects.length < B.Config.MAX_EFFECTS)
        this.effects.push({ type, x, y, life: 0.4, maxLife: 0.4, ...extra });
    },
    bullet(x, y, angle, options = {}) {
      if (this.projectiles.length >= B.Config.MAX_PROJECTILES) return;
      const p = {
        id: ++this.uid,
        x,
        y,
        px: x,
        py: y,
        angle,
        speed: 720,
        r: 3,
        damage: 12,
        life: 2,
        enemy: false,
        color: "#ffd58a",
        weapon: "minigun",
        pierce: 0,
        hit: new Set(),
        ...options,
      };
      this.projectiles.push(p);
      return p;
    },
    firePrimary() {
      const p = this.player,
        s = p.stats;
      const streams = Math.min(7, s.streams);
      for (let n = 0; n < streams; n++) {
        const a = p.angle + (n - (streams - 1) / 2) * 0.105;
        const critical = this.rng.next() < s.crit;
        this.bullet(p.x + Math.cos(a) * 26, p.y + Math.sin(a) * 26, a, {
          damage:
            s.damage *
            (critical ? 2 : 1) *
            (s.redline && p.hp < p.maxHp * B.Config.REDLINE_HULL
              ? B.Config.REDLINE_BONUS
              : 1),
          pierce: s.pierce,
          critical,
          explosive: s.explosive,
          slow: s.slow,
          r: critical ? 4 : 3,
        });
      }
      p.muzzle = 0.06;
      this.audio.play("shoot");
    },
    spawnEnemy(
      type = "scout",
      x = this.rng.range(40, this.w - 40),
      y = -30,
      options = {},
    ) {
      if (this.enemies.length >= B.Config.MAX_ENEMIES) return null;
      const e = {
        id: ++this.uid,
        type,
        x,
        y,
        r: 18,
        hp: 24,
        maxHp: 24,
        speed: 75,
        age: 0,
        warning: 0.7,
        fire: 2,
        flash: 0,
        dead: false,
        score: 100,
        xp: 10,
        ...options,
      };
      this.enemies.push(e);
      return e;
    },
    drop(x, y, type = "xp", value = 10) {
      if (this.pickups.length >= B.Config.MAX_PICKUPS) {
        if (type === "xp") {
          const existing = this.pickups.find((p) => p.type === "xp");
          if (existing) existing.value += value;
        }
        return;
      }
      this.pickups.push({
        x,
        y,
        type,
        value,
        r: type === "xp" ? 5 : 12,
        life: 20,
      });
    },
  });
})();
