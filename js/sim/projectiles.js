"use strict";
/* Game per-tick projectile and pickup simulation. */
(() => {
  const B = window.BP;
  const HOMING_SEARCH_RADIUS = 700;
  const HOMING_TURN_RATE_BOOSTED = 5;
  const HOMING_TURN_RATE_BASE = 3.5;
  const OFFSCREEN_MARGIN_X = 100;
  const OFFSCREEN_MARGIN_TOP = 150;
  const SPLASH_DAMAGE_MULT = 0.8;
  const DEFAULT_EXPLOSIVE_RADIUS = 48;
  const DEFAULT_EXPLOSIVE_DAMAGE_MULT = 0.5;
  const CRIT_ARC_TARGET_COUNT = 3;
  const CRIT_ARC_DAMAGE_MULT = 0.45;
  const PROJECTILE_SLOW_DURATION = 1.3;

  Object.assign(B.Game.prototype, {
    updateProjectiles(dt) {
      for (const p of this.projectiles) {
        if (p.dead) continue;
        this.moveAndAge(p, dt);
        if (B.Environment?.hitProjectile?.(this, p)) continue;
        if (p.enemy) {
          if (this.hostileVsPlayer(p)) break;
        } else {
          this.friendlyVsEnemies(p);
        }
        this.cullExpiredProjectile(p);
      }
      this.projectiles = this.projectiles.filter((p) => !p.dead);
    },
    moveAndAge(p, dt) {
      p.life -= dt;
      p.px = p.x;
      p.py = p.y;
      if (p.homing) this.applyHoming(p, dt);
      p.x += Math.cos(p.angle) * p.speed * dt;
      p.y += Math.sin(p.angle) * p.speed * dt;
    },
    applyHoming(p, dt) {
      const target =
        this.enemies.find(
          (e) => e.id === p.targetId && !e.dead && e.warning <= 0,
        ) || this.nearest(p, HOMING_SEARCH_RADIUS);
      if (target)
        p.angle = B.turn(
          p.angle,
          B.angle(p, target),
          dt *
            (this.player.stats.homing
              ? HOMING_TURN_RATE_BOOSTED
              : HOMING_TURN_RATE_BASE),
        );
    },
    hostileVsPlayer(p) {
      if (B.distance(p, this.player) >= p.r + this.player.r) return false;
      this.hurt(p.damage);
      p.dead = true;
      return this.mode !== "playing";
    },
    friendlyVsEnemies(p) {
      for (const e of this.enemies) {
        if (e.dead || e.warning > 0 || p.hit.has(e.id)) continue;
        if (B.sweptDistance(p, e.x, e.y) < e.r + p.r) {
          this.applyProjectileHit(p, e);
          if (p.pierce-- <= 0) {
            p.dead = true;
            break;
          }
        }
      }
    },
    applyProjectileHit(p, e) {
      p.hit.add(e.id);
      if (!B.Encounters?.damagePart?.(this, e, p, p.damage))
        this.damageEnemy(e, p.damage, p.weapon, p);
      if (p.splash && B.Weapons)
        B.Weapons.explode(
          this,
          p.x,
          p.y,
          p.splash,
          p.damage * SPLASH_DAMAGE_MULT,
          p.weapon,
          p.cluster,
        );
      else if (p.explosive && this.rng.next() < p.explosive && B.Weapons)
        B.Weapons.explode(
          this,
          p.x,
          p.y,
          DEFAULT_EXPLOSIVE_RADIUS * this.player.stats.blast,
          p.damage * DEFAULT_EXPLOSIVE_DAMAGE_MULT,
          p.weapon,
          0,
        );
      if (p.critical && this.player.stats.critArc && B.Weapons)
        B.Weapons.arc(
          this,
          e,
          CRIT_ARC_TARGET_COUNT,
          p.damage * CRIT_ARC_DAMAGE_MULT,
        );
      if (p.slow) e.slow = PROJECTILE_SLOW_DURATION;
    },
    cullExpiredProjectile(p) {
      if (
        p.life <= 0 ||
        p.x < -OFFSCREEN_MARGIN_X ||
        p.x > this.w + OFFSCREEN_MARGIN_X ||
        p.y < -OFFSCREEN_MARGIN_TOP ||
        p.y > this.h + OFFSCREEN_MARGIN_X
      )
        p.dead = true;
    },
    updatePickups(dt) {
      for (const p of this.pickups) {
        p.life -= dt;
        p.y += 12 * dt;
        const d = B.distance(p, this.player);
        if (d < this.player.stats.magnet || p.life < 8) {
          const speed = 250 + 400 / (d / 80 + 1);
          p.x += ((this.player.x - p.x) / (d || 1)) * Math.min(d, dt * speed);
          p.y += ((this.player.y - p.y) / (d || 1)) * Math.min(d, dt * speed);
        }
        if (d < 22) {
          p.life = 0;
          if (p.type === "xp") {
            this.gainXp(p.value * (1 + this.player.stats.salvage));
            this.audio.play("xp");
          } else if (p.type === "repair") {
            this.player.hp = Math.min(this.player.maxHp, this.player.hp + 25);
            this.audio.play("repair");
          } else if (p.type === "shield") {
            this.player.shield = 6;
            this.audio.play("shield");
          } else if (p.type === "emp") {
            this.projectiles = this.projectiles.filter((b) => !b.enemy);
            for (const e of this.enemies) this.damageEnemy(e, 75, "EMP");
            this.effect("ring", this.player.x, this.player.y, {
              radius: 700,
              life: 0.8,
              maxLife: 0.8,
            });
            this.audio.play("emp");
          }
        }
      }
      this.pickups = this.pickups.filter(
        (p) => p.life > 0 && p.y < this.h + 40,
      );
    },
  });
})();
