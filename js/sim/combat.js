"use strict";
/* Game combat and progression: damage, kills, hurt/die, save, XP, upgrades. */
(() => {
  const B = window.BP;
  Object.assign(B.Game.prototype, {
    damageEnemy(e, amount, weapon = "minigun", _projectile = null) {
      if (e.dead || e.warning > 0) return;
      const actual = Math.min(e.hp, amount);
      e.hp -= amount;
      e.flash = 0.075;
      this.damage += actual;
      this.weaponDamage[weapon] = (this.weaponDamage[weapon] || 0) + actual;
      this.burst(e.x, e.y, "#ffe1a1", 3, 2);
      if (e.hp <= 0) this.killEnemy(e);
    },
    killEnemy(e) {
      if (e.dead) return;
      e.dead = true;
      this.kills++;
      this.combo = Math.min(99, this.combo + 1);
      this.comboTime = 3;
      this.maxCombo = Math.max(this.maxCombo, this.combo);
      this.score += Math.round(e.score * (1 + Math.min(this.combo, 30) * 0.03));
      this.burst(e.x, e.y, e.boss ? "#ffdb9c" : "#ff985d", e.boss ? 90 : 22, 6);
      this.effect("ring", e.x, e.y, { radius: e.boss ? 180 : 45 });
      this.shake = Math.max(this.shake, e.boss ? 14 : 3);
      this.audio.play(e.boss ? "bossDeath" : "explosion");
      this.drop(e.x, e.y, "xp", e.xp || 10);
      if (this.rng.next() < 0.055)
        this.drop(e.x + 10, e.y, this.rng.pick(["repair", "shield", "emp"]), 1);
      if (e.boss) {
        this.bossKills++;
        this.slowmo = 1.2;
        this.waveTime = 0;
        this.enemies.forEach((other) => {
          if (other !== e) other.dead = true;
        });
        this.projectiles.forEach((p) => {
          if (p.enemy) p.dead = true;
        });
        this.banner = (e.name || "BOSS") + " DESTROYED";
        this.bannerTime = 3;
        this.warnings = [];
        this.beams = [];
        for (let n = 0; n < 10; n++)
          this.effect(
            "detonation",
            e.x + this.rng.range(-65, 65),
            e.y + this.rng.range(-50, 50),
            {
              delay: n * 0.075,
              radius: this.rng.range(25, 80),
              life: 0.6,
              maxLife: 0.6,
            },
          );
      }
      if (this.player.stats.leech && this.kills % 15 === 0)
        this.player.hp = Math.min(this.player.maxHp, this.player.hp + 3);
      B.Achievements?.check(this);
    },
    hurt(amount) {
      const p = this.player;
      if (p.invuln > 0 || p.shield > 0 || this.mode !== "playing") return;
      p.hp = Math.max(0, p.hp - amount * (p.stats.reactor ? 1.25 : 1));
      p.invuln = 0.65;
      this.combo = 0;
      this.shake = 10;
      this.audio.play("damage");
      this.burst(p.x, p.y, "#ff6864", 22);
      if (p.hp <= 0) this.die();
    },
    die() {
      if (this.resultSaved) return;
      this.mode = "dead";
      this.input.clear();
      this.audio.play("death");
      this.burst(this.player.x, this.player.y, "#ffb55f", 70);
      this.resultSaved = true;
      this.saved.bestScore = Math.max(this.saved.bestScore || 0, this.score);
      this.saved.highestWave = Math.max(this.saved.highestWave || 0, this.wave);
      this.saved.totalKills = (this.saved.totalKills || 0) + this.kills;
      this.saved.bossKills = (this.saved.bossKills || 0) + this.bossKills;
      this.saved.runs = (this.saved.runs || 0) + 1;
      this.save();
      this.ui.refresh();
    },
    save() {
      this.saved.settings = this.settings;
      B.Persistence.save(this.saved);
    },
    gainXp(amount) {
      this.xp += amount;
      while (this.xp >= this.xpNext) {
        this.xp -= this.xpNext;
        this.level++;
        this.xpNext = Math.round(
          35 + this.level * 16 + Math.pow(this.level, 1.25) * 3,
        );
        this.pendingLevels++;
      }
    },
    openUpgrade() {
      if (!B.Upgrades || !this.pendingLevels || this.mode !== "playing") return;
      this.pendingLevels--;
      this.offers = B.Upgrades.offer(this);
      this.mode = "upgrade";
      this.input.clear();
      this.audio.play("levelUp");
      this.ui.refresh();
    },
    chooseUpgrade(index) {
      if (this.mode !== "upgrade" || !this.offers[index]) return;
      const u = this.offers[index];
      B.Upgrades.apply(this, u.id);
      this.mode = "playing";
      this.audio.play("upgrade");
      this.input.clear();
      this.openUpgrade();
      this.ui.refresh();
    },
  });
})();
