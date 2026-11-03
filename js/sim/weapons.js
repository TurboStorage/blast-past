"use strict";
(() => {
  const B = window.BP;
  const REACTOR_BONUS = 1.5;
  const RETRY_DELAY = 0.2;
  const DRONE_ORBIT_SPEED = 1.25;
  const DRONE_ORBIT_RX = 57;
  const DRONE_ORBIT_RY = 36;
  const ROCKET_RANGE = 850;
  const ROCKET_SPREAD = 0.12;
  const ROCKET_COOLDOWN = 2.5;
  const MISSILE_COOLDOWN = 3.6;
  const MISSILE_LAUNCH_ANGLE = 0.5;
  const MISSILE_PRIORITY_BONUS = 800;
  const MISSILE_DISTANCE_WEIGHT = 0.1;
  const ARC_BASE_RANGE = 290;
  const ARC_BASE_TARGETS = 2;
  const ARC_BASE_DAMAGE = 22;
  const ARC_DAMAGE_PER_RANK = 13;
  const ARC_COOLDOWN = 1.8;
  const ARC_RETRY_DELAY = 0.15;
  const DRONE_RANGE = 600;
  const DRONE_MAX_STREAMS = 4;
  const DRONE_SPREAD = 0.09;
  const DRONE_DAMAGE = 9;
  const DRONE_CRIT_MULTIPLIER = 2;
  const DRONE_MUZZLE_LIFE = 0.07;
  const DRONE_COOLDOWN = 0.42;
  const DRONE_RETRY_DELAY = 0.15;
  const TRAIL_RATE = 30;
  const TRAIL_SPEED = 30;
  const EXPLOSION_SHAKE = 4;
  const EXPLOSION_FALLOFF = 0.45;
  const SHRAPNEL_PER_CLUSTER = 4;
  const SHRAPNEL_DAMAGE_SCALE = 0.3;
  const DEFAULT_OBSTACLE_RADIUS = 20;

  const ROCKET_SPEC = {
    speed: 390,
    damage: 42,
    splash: 72,
    r: 5,
    life: 3.5,
    color: "#ffb26c",
  };
  const MISSILE_SPEC = {
    speed: 310,
    damage: 62,
    splash: 55,
    r: 5,
    life: 5,
    color: "#c5edb9",
  };

  const power = (p) =>
    (p.stats.reactor ? REACTOR_BONUS : 1) *
    (p.stats.redline && p.hp < p.maxHp * B.Config.REDLINE_HULL
      ? B.Config.REDLINE_BONUS
      : 1);

  const tickCooldowns = (c, dt) => {
    for (const key of Object.keys(c)) c[key] -= dt;
  };

  const fireRockets = (g, p, s, c) => {
    const target = g.nearest(p, ROCKET_RANGE);
    if (!target) {
      c.rockets = RETRY_DELAY;
      return;
    }
    for (let n = 0; n < s.rockets; n++) {
      const pod = B.localToWorld(p, B.Hardpoints.player.rocketPods[n % 2]);
      const spread = (n - (s.rockets - 1) / 2) * ROCKET_SPREAD;
      g.bullet(pod.x, pod.y, p.angle + spread, {
        weapon: "rockets",
        kind: "rocket",
        speed: ROCKET_SPEC.speed,
        damage: ROCKET_SPEC.damage * power(p),
        splash: ROCKET_SPEC.splash * s.blast,
        cluster: s.cluster,
        homing: s.homing,
        r: ROCKET_SPEC.r,
        life: ROCKET_SPEC.life,
        color: ROCKET_SPEC.color,
      });
    }
    g.audio.play("rocket");
    c.rockets = ROCKET_COOLDOWN * (s.reload || 1);
  };

  const missilePriority = (e, p) =>
    Number(e.boss || e.elite) * MISSILE_PRIORITY_BONUS +
    e.maxHp -
    B.distance(e, p) * MISSILE_DISTANCE_WEIGHT;

  const missileTargets = (g, p) =>
    g.enemies
      .filter((e) => !e.dead && e.warning <= 0)
      .sort((a, b) => missilePriority(b, p) - missilePriority(a, p));

  const launchMissile = (g, p, s, n, targets) => {
    const rail = B.localToWorld(p, B.Hardpoints.player.missileRails[n % 2]);
    g.bullet(
      rail.x,
      rail.y,
      -Math.PI / 2 + (n % 2 ? MISSILE_LAUNCH_ANGLE : -MISSILE_LAUNCH_ANGLE),
      {
        weapon: "missiles",
        kind: "missile",
        speed: MISSILE_SPEC.speed,
        damage: MISSILE_SPEC.damage * power(p),
        splash: MISSILE_SPEC.splash * s.blast,
        cluster: s.cluster,
        homing: true,
        targetId: targets[n % targets.length].id,
        r: MISSILE_SPEC.r,
        life: MISSILE_SPEC.life,
        color: MISSILE_SPEC.color,
      },
    );
  };

  const fireMissiles = (g, p, s, c) => {
    const targets = missileTargets(g, p);
    if (!targets.length) {
      c.missiles = RETRY_DELAY;
      return;
    }
    for (let n = 0; n < s.missiles; n++) launchMissile(g, p, s, n, targets);
    c.missiles = MISSILE_COOLDOWN * (s.reload || 1);
    g.audio.play("missile");
  };

  const fireArc = (g, p, s, c) => {
    const range = ARC_BASE_RANGE + (s.arcRange || 0);
    if (!g.nearest(p, range)) {
      c.arc = ARC_RETRY_DELAY;
      return;
    }
    B.Weapons.arc(
      g,
      p,
      ARC_BASE_TARGETS + s.arc,
      (ARC_BASE_DAMAGE + s.arc * ARC_DAMAGE_PER_RANK) * power(p),
      range,
    );
    c.arc = ARC_COOLDOWN * (s.arcRate || 1);
    g.audio.play("arc");
  };

  const fireDroneStreams = (g, p, s, drone, target) => {
    const streams = s.droneLink ? Math.min(s.streams, DRONE_MAX_STREAMS) : 1;
    for (let n = 0; n < streams; n++) {
      const critical = !!s.droneLink && g.rng.next() < s.crit;
      g.bullet(
        drone.x,
        drone.y,
        B.angle(drone, target) + (n - (streams - 1) / 2) * DRONE_SPREAD,
        {
          weapon: "drones",
          damage:
            DRONE_DAMAGE * power(p) * (critical ? DRONE_CRIT_MULTIPLIER : 1),
          speed: 650,
          color: "#8be6d5",
          pierce: s.droneLink ? s.pierce : 0,
          explosive: s.droneLink ? s.explosive : 0,
          critical,
          r: 2.5,
        },
      );
    }
    g.effect("muzzle", drone.x, drone.y, {
      life: DRONE_MUZZLE_LIFE,
      maxLife: DRONE_MUZZLE_LIFE,
    });
  };

  const fireDrones = (g, p, s, c) => {
    let fired = false;
    for (const drone of B.Weapons.dronePositions(g)) {
      const target = g.nearest(drone, DRONE_RANGE);
      if (!target) continue;
      fireDroneStreams(g, p, s, drone, target);
      fired = true;
    }
    c.drones = fired ? DRONE_COOLDOWN : DRONE_RETRY_DELAY;
  };

  const isOwnOrdnance = (b) =>
    !b.enemy && (b.kind === "rocket" || b.kind === "missile");

  const emitTrails = (g, dt) => {
    for (const b of g.projectiles) {
      if (!isOwnOrdnance(b) || !(g.rng.next() < dt * TRAIL_RATE)) continue;
      g.particle(
        b.x,
        b.y,
        -Math.cos(b.angle) * TRAIL_SPEED,
        -Math.sin(b.angle) * TRAIL_SPEED,
        "#83918a",
        0.32,
        3,
      );
    }
  };

  const splashFalloff = (x, y, e, radius) =>
    1 - EXPLOSION_FALLOFF * B.clamp(B.distance({ x, y }, e) / radius, 0, 1);

  const splashEnemies = (g, x, y, radius, damage, weapon) => {
    for (const e of g.enemies) {
      if (!e.dead && B.distance({ x, y }, e) < radius + e.r)
        g.damageEnemy(e, damage * splashFalloff(x, y, e, radius), weapon);
    }
  };

  const spawnShrapnel = (g, x, y, damage, weapon, cluster) => {
    const count = cluster * SHRAPNEL_PER_CLUSTER;
    for (let i = 0; i < count; i++)
      g.bullet(x, y, (i * Math.PI * 2) / count, {
        weapon,
        kind: "shrapnel",
        damage: damage * SHRAPNEL_DAMAGE_SCALE,
        speed: 380,
        life: 0.65,
        r: 3,
        color: "#ffe6a7",
      });
  };

  const damageObstacles = (g, x, y, radius, damage) => {
    for (const o of g.obstacles) {
      const reach = radius + (o.r || DEFAULT_OBSTACLE_RADIUS);
      if (o.dead || !(B.distance({ x, y }, o) < reach)) continue;
      o.hp -= damage;
      if (o.hp <= 0 && B.Environment?.explode) B.Environment.explode(g, o);
    }
  };

  B.Weapons = {
    dronePositions(g) {
      const p = g.player;
      return Array.from({ length: p.stats.drones }, (_, i) => {
        const a =
          g.time * DRONE_ORBIT_SPEED + (i * Math.PI * 2) / p.stats.drones;
        return {
          x: p.x + Math.cos(a) * DRONE_ORBIT_RX,
          y: p.y + Math.sin(a) * DRONE_ORBIT_RY,
          index: i,
        };
      });
    },
    update(g, dt) {
      const p = g.player,
        s = p.stats,
        c = p.cooldowns;
      tickCooldowns(c, dt);
      if (s.rockets && c.rockets <= 0) fireRockets(g, p, s, c);
      if (s.missiles && c.missiles <= 0) fireMissiles(g, p, s, c);
      if (s.arc && c.arc <= 0) fireArc(g, p, s, c);
      if (s.drones && c.drones <= 0) fireDrones(g, p, s, c);
      emitTrails(g, dt);
    },
    explode(g, x, y, radius, damage, weapon = "rockets", cluster = 0) {
      g.effect("ring", x, y, {
        radius,
        color: "#ffbb71",
        life: 0.35,
        maxLife: 0.35,
      });
      g.burst(x, y, "#ffc078", 25, 6);
      g.shake = Math.max(g.shake, EXPLOSION_SHAKE);
      g.audio.play("explosion");
      splashEnemies(g, x, y, radius, damage, weapon);
      if (cluster) spawnShrapnel(g, x, y, damage, weapon, cluster);
      damageObstacles(g, x, y, radius, damage);
    },
    arc(g, origin, count, damage, range = 180) {
      const seen = new Set(origin.id ? [origin.id] : []),
        points = [{ x: origin.x, y: origin.y }];
      let last = origin;
      for (let i = 0; i < count; i++) {
        const target = g.nearest(last, range, (e) => !seen.has(e.id));
        if (!target) break;
        seen.add(target.id);
        points.push({ x: target.x, y: target.y });
        g.damageEnemy(target, damage, "arc");
        last = target;
      }
      if (points.length > 1)
        g.effect("arc", origin.x, origin.y, {
          points,
          color: "#9beeea",
          life: 0.2,
          maxLife: 0.2,
        });
    },
  };
})();
