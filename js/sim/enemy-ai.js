"use strict";
/* Encounter core (B.Encounters): enemy spawning, per-type enemy brains, boss component hits. */
(() => {
  const B = window.BP;
  const C = (B.Encounters = {});
  const clamp = B.clamp,
    dist = B.distance,
    angle = B.angle;
  const specs = B.EnemySpecs;
  const Kit = B.EncounterKit;
  const { rand, warning, shot } = Kit;
  C.spawn = (g, type, x, y, extra = {}) => {
    const s = specs[type] || specs.scout;
    const e = g.spawnEnemy(
      type,
      x,
      y,
      Object.assign(
        {
          r: s.r,
          hp: s.hp,
          maxHp: s.hp,
          speed: s.speed,
          score: s.score,
          xp: s.xp,
          cost: s.cost,
          color: s.color,
          fire: rand(g, 0.75, 2.1),
          turn: rand(g, -1, 1),
          seed: rand(g, 0, 99),
        },
        extra,
      ),
    );
    if (e && !e.boss) {
      const sector = Math.floor((g.wave - 1) / 10);
      e.speed *= 1 + Math.min(sector, 8) * 0.04;
      e.hp *= 1 + Math.min(sector, 8) * 0.08;
      e.maxHp = e.hp;
    }
    return e;
  };
  function fireAtPlayer(g, e, damage = 9, speed = 220, opts = {}) {
    shot(g, e, angle(e, g.player), Object.assign({ damage, speed }, opts));
  }
  // Descending enemies never leave the field: at the low line they turn back
  // up, at the high line they dive again, so they keep strafing until killed.
  const PATROL_LOW = 0.78,
    PATROL_HIGH = 0.22,
    PATROL_CLIMB = 0.6,
    PATROL_SWING = 0.4;
  function patrol(g, e, speed, dt) {
    if (e.y > g.h * PATROL_LOW) e.climbing = true;
    else if (e.climbing && e.y < g.h * PATROL_HIGH) e.climbing = false;
    e.y += speed * (e.climbing ? -PATROL_CLIMB : 1) * dt;
    if (e.climbing)
      e.x += Math.sign(g.player.x - e.x) * speed * PATROL_SWING * dt;
  }
  function flock(g, e, dt) {
    const phase = e.seed + e.age * 2.7;
    e.x += Math.sin(phase) * 42 * dt;
    patrol(g, e, e.speed * (e.slow > 0 ? 0.52 : 1), dt);
  }
  C.update = (g, e, dt) => {
    if (e.boss) return Kit.bossUpdate(g, e, dt);
    e.slow = Math.max(0, (e.slow || 0) - dt);
    const speed = e.speed * (e.slow > 0 ? 0.52 : 1);
    e.fire -= dt * (1 + Math.min(8, Math.floor((g.wave - 1) / 10)) * 0.12);
    switch (e.type) {
      case "scout":
        patrol(g, e, speed, dt);
        e.x += Math.sin(e.age * 2 + e.seed) * 35 * dt;
        if (e.fire <= 0 && e.y > 20) {
          fireAtPlayer(g, e, 7, 205);
          e.fire = rand(g, 1.8, 2.7);
        }
        break;
      case "gunship":
        patrol(g, e, speed, dt);
        e.x += Math.sin(e.age * 0.9 + e.seed) * 58 * dt;
        if (e.fire <= 0) {
          for (let i = -1; i <= 1; i++)
            shot(g, e, angle(e, g.player) + i * 0.16, {
              damage: 9,
              speed: 210,
            });
          e.fire = 2.35;
        }
        break;
      case "interceptor": {
        const a = angle(e, g.player);
        e.x += Math.cos(a) * speed * dt;
        e.y += Math.sin(a) * speed * dt * 0.72;
        if (e.fire <= 0) {
          fireAtPlayer(g, e, 11, 280);
          e.fire = 1.45;
        }
        break;
      }
      case "kamikaze": {
        const a = angle(e, g.player);
        e.x += Math.cos(a) * speed * dt;
        e.y += Math.sin(a) * speed * dt;
        if (dist(e, g.player) < e.r + g.player.r + 5) {
          g.hurt(18);
          e.dead = true;
          g.burst(e.x, e.y, "#ff9a65", 18, 4);
        }
        break;
      }
      case "swarm":
        flock(g, e, dt);
        if (e.fire <= 0 && e.y > 70) {
          fireAtPlayer(g, e, 4, 180);
          e.fire = 3.2;
        }
        break;
      case "heavy":
        patrol(g, e, speed, dt);
        e.x += Math.sin(e.age * 0.55 + e.seed) * 24 * dt;
        if (e.fire <= 0) {
          const a = angle(e, g.player);
          for (let i = -2; i <= 2; i++)
            shot(g, e, a + i * 0.12, { damage: 11, speed: 190, r: 6 });
          e.fire = e.elite ? 2.55 : 3.3;
        }
        break;
      case "missile":
        patrol(g, e, speed, dt);
        if (e.fire <= 0) {
          for (let i = -1; i <= 1; i++)
            shot(g, e, angle(e, g.player) + i * 0.14, {
              damage: 14,
              speed: 145,
              r: 7,
              seekPlayer: true,
              turnRate: 2.2,
              life: 7,
              color: "#ff9a6b",
            });
          e.fire = 4.2;
        }
        break;
      case "artillery":
        patrol(g, e, speed, dt);
        if (e.fire <= 0) {
          const x = clamp(g.player.x + rand(g, -85, 85), 55, g.w - 55),
            y = clamp(g.player.y + rand(g, -55, 55), 110, g.h - 55);
          warning(g, {
            type: "circle",
            x,
            y,
            radius: 54,
            life: 1.15,
            maxLife: 1.15,
            label: "ARTILLERY",
            damage: 15,
            action: "bombard",
            source: e.id,
          });
          e.fire = 3.6;
        }
        break;
    }
    e.x = clamp(e.x, -45, g.w + 45);
  };
  C.damagePart = (g, e, projectile, amount) => {
    if (!e || !e.boss || !e.parts) return false;
    let part = null,
      best = Infinity;
    for (const p of e.parts) {
      if (p.dead) continue;
      const d = B.sweptDistance(projectile, e.x + p.x, e.y + p.y);
      if (d < p.r + (projectile.r || 3) && d < best) {
        part = p;
        best = d;
      }
    }
    if (!part) return false;
    const applied = Math.min(part.hp, Math.max(0, amount || 0));
    part.hp -= applied;
    part.flash = 0.12;
    g.damage = (g.damage || 0) + applied;
    const weapon = projectile.weapon || "components";
    g.weaponDamage || (g.weaponDamage = {});
    g.weaponDamage[weapon] = (g.weaponDamage[weapon] || 0) + applied;
    if (part.hp <= 0) {
      part.dead = true;
      g.score += 250;
      g.drop(e.x + part.x, e.y + part.y, "xp", 30);
      g.burst(e.x + part.x, e.y + part.y, "#ffd087", 28, 4);
      g.damageEnemy(e, 70, "components");
    }
    return true;
  };
})();
