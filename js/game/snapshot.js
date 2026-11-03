"use strict";
/* Game#snapshot: serialized run state for render_game_to_text and tests. */
(() => {
  const B = window.BP;
  const COORDINATES = "origin top-left; +x right; +y down; logical pixels";
  const WAVES_PER_SECTOR = 10;
  const MAX_HOSTILE_PROJECTILES = 60;

  const playerState = (p) => ({
    x: p.x,
    y: p.y,
    vx: p.vx,
    vy: p.vy,
    hp: p.hp,
    maxHp: p.maxHp,
    r: p.r,
    boostCd: p.boostCd,
    shield: p.shield,
    angle: p.angle,
  });
  const offerState = (u) => ({
    id: u.id,
    name: u.name,
    description: u.description,
  });
  const enemyState = (e) => ({
    id: e.id,
    type: e.type,
    x: e.x,
    y: e.y,
    hp: e.hp,
    r: e.r,
    warning: e.warning,
    boss: e.boss,
    phase: e.phase,
  });
  const pickupState = (p) => ({ type: p.type, x: p.x, y: p.y, value: p.value });
  const obstacleState = (o) => ({
    type: o.type,
    x: o.x,
    y: o.y,
    hp: o.hp,
    r: o.r,
  });
  const hostileProjectiles = (projectiles) =>
    projectiles
      .filter((p) => p.enemy)
      .slice(0, MAX_HOSTILE_PROJECTILES)
      .map((p) => ({ x: p.x, y: p.y, angle: p.angle, speed: p.speed }));
  const sectorFor = (wave) =>
    B.sectors[Math.floor((wave - 1) / WAVES_PER_SECTOR) % B.sectors.length];

  Object.assign(B.Game.prototype, {
    snapshot() {
      return {
        coordinates: COORDINATES,
        mode: this.mode,
        width: this.w,
        height: this.h,
        player: playerState(this.player),
        wave: this.wave,
        waveTime: this.waveTime,
        sector: sectorFor(this.wave),
        time: this.time,
        score: this.score,
        kills: this.kills,
        level: this.level,
        xp: this.xp,
        xpNext: this.xpNext,
        pendingLevels: this.pendingLevels,
        combo: this.combo,
        upgrades: this.player.ranks,
        offers: this.offers.map(offerState),
        enemies: this.enemies.map(enemyState),
        pickups: this.pickups.map(pickupState),
        obstacles: this.obstacles.map(obstacleState),
        hostileProjectiles: hostileProjectiles(this.projectiles),
        counts: {
          projectiles: this.projectiles.length,
          particles: this.particles.length,
          enemies: this.enemies.length,
        },
        weapons: this.weaponDamage,
      };
    },
  });
})();
