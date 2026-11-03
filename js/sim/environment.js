"use strict";
/* Battlefield props (B.Environment): obstacles, telegraph payloads, boss beams, missile homing. */
(() => {
  const B = window.BP;
  const C = B.Encounters;
  const clamp = B.clamp,
    dist = B.distance,
    angle = B.angle;
  const { rand, shot } = B.EncounterKit;

  // Obstacle archetypes: [hp, diameter].
  const OBSTACLE_STATS = { fuel: [25, 58], cargo: [70, 75], wreck: [135, 88] };
  const OBSTACLE_TYPES = ["fuel", "cargo", "wreck"];
  const OBSTACLE_SPIN_RANGE = 6.28;
  const WRECK_DRIFT = 20;
  const OBSTACLE_DRIFT = 30;
  const WRECK_CONTACT_DAMAGE = 6;
  const OBSTACLE_DESPAWN_MARGIN = 30;
  const OBSTACLE_MAX_ALIVE = 5;
  const OBSTACLE_SPAWN_RATE = 0.105;
  const OBSTACLE_SPAWN_SPREAD = 0.38;
  const OBSTACLE_EDGE_MARGIN = 45;
  const OBSTACLE_SPAWN_Y = -45;
  // Enemy fire chips obstacles at a reduced rate.
  const ENEMY_SHOT_OBSTACLE_SCALE = 0.35;

  const FUEL_BLAST = {
    color: "#ffb04f",
    particles: 34,
    ring: 100,
    enemyRadius: 100,
    enemyDamage: 75,
    playerRadius: 92,
    playerDamage: 22,
    chainRadius: 105,
    maxChain: 2,
  };
  const DEBRIS_BLAST = { color: "#9aacad", particles: 17, ring: 55 };
  const BLAST_PARTICLE_SIZE = 5;
  const BLAST_RING_LIFE = 0.45;
  const CARGO_XP = 18;
  const CARGO_LOOT_CHANCE = 0.22;
  const CARGO_LOOT_JITTER = 12;
  const CARGO_LOOT = ["repair", "shield"];

  const DEFAULT_MISSILE_TURN_RATE = 2;

  const BOMBARD = {
    radius: 55,
    damage: 15,
    ringLife: 0.35,
    color: "#ff9c62",
    particles: 18,
    particleSize: 4,
  };
  const FAN_SHOT = {
    spread: 0.16,
    damage: 9,
    speed: 180,
    r: 6,
    turnRate: 1.45,
    color: "#ff9a69",
  };
  const DRONE_DROP = {
    jitterX: 70,
    edgeMargin: 30,
    minRise: 10,
    maxRise: 45,
    warning: 0.25,
  };
  const SWEEP = {
    width: 70,
    travelInset: 10,
    beamWidth: 20,
    life: 0.95,
    damage: 14,
  };
  const BEAM_COLOR = "#ffae76";
  const BEAM_FRAME_LIFE = 0.035;

  function liveEnemy(g, id) {
    return g.enemies.find((e) => e.id === id && !e.dead);
  }

  // Telegraph payloads, fired when a warning with a live source expires.
  const WARNING_ACTIONS = {
    bombard(g, w) {
      g.effect("ring", w.x, w.y, {
        radius: w.radius || BOMBARD.radius,
        life: BOMBARD.ringLife,
        maxLife: BOMBARD.ringLife,
      });
      if (dist(w, g.player) < (w.radius || BOMBARD.radius) + g.player.r)
        g.hurt(w.damage || BOMBARD.damage);
      g.burst(w.x, w.y, BOMBARD.color, BOMBARD.particles, BOMBARD.particleSize);
    },
    fan(g, w, source) {
      const a = angle(source, g.player);
      for (let i = 0; i < w.count; i++)
        shot(g, source, a + (i - (w.count - 1) / 2) * FAN_SHOT.spread, {
          damage: w.damage || FAN_SHOT.damage,
          speed: FAN_SHOT.speed,
          r: FAN_SHOT.r,
          seekPlayer: true,
          turnRate: FAN_SHOT.turnRate,
          color: FAN_SHOT.color,
        });
    },
    drones(g, w) {
      for (let i = 0; i < w.count; i++)
        C.spawn(
          g,
          "interceptor",
          clamp(
            w.x + rand(g, -DRONE_DROP.jitterX, DRONE_DROP.jitterX),
            DRONE_DROP.edgeMargin,
            g.w - DRONE_DROP.edgeMargin,
          ),
          w.y - rand(g, DRONE_DROP.minRise, DRONE_DROP.maxRise),
          { warning: DRONE_DROP.warning },
        );
    },
    sweep(g, w) {
      g.beams.push({
        source: w.source,
        x: w.x,
        y: w.y,
        travel: (w.width || SWEEP.width) / 2 - SWEEP.travelInset,
        width: SWEEP.beamWidth,
        life: SWEEP.life,
        maxLife: SWEEP.life,
        damage: w.damage || SWEEP.damage,
      });
      g.audio.play("heavy");
    },
  };

  // Game has already moved missiles this tick, so the turn affects the next tick.
  function steerEnemyMissiles(g, dt) {
    for (const p of g.projectiles)
      if (p.enemy && p.seekPlayer && !p.dead)
        p.angle = B.turn(
          p.angle,
          angle(p, g.player),
          dt * (p.turnRate || DEFAULT_MISSILE_TURN_RATE),
        );
  }

  function resolveWarnings(g, dt) {
    for (const w of g.warnings) {
      w.life -= dt;
      if (w.life > 0 || !w.action) continue;
      const source = liveEnemy(g, w.source);
      if (!source || !Object.hasOwn(WARNING_ACTIONS, w.action)) continue;
      WARNING_ACTIONS[w.action](g, w, source);
    }
    g.warnings = g.warnings.filter((w) => w.life > 0);
  }

  function updateBeams(g, dt) {
    for (const beam of g.beams) {
      beam.life -= dt;
      if (!liveEnemy(g, beam.source)) {
        beam.life = 0;
        continue;
      }
      const x =
        beam.x - beam.travel + 2 * beam.travel * (1 - beam.life / beam.maxLife);
      g.effect("beam", x, beam.y, {
        x2: x,
        y2: g.h,
        width: beam.width,
        color: BEAM_COLOR,
        life: BEAM_FRAME_LIFE,
        maxLife: BEAM_FRAME_LIFE,
      });
      if (
        g.player.y > beam.y &&
        Math.abs(g.player.x - x) < beam.width / 2 + g.player.r
      )
        g.hurt(beam.damage);
    }
    g.beams = g.beams.filter((b) => b.life > 0);
  }

  function pushPlayerOut(g, o, d) {
    const nx = (g.player.x - o.x) / (d || 1),
      ny = (g.player.y - o.y) / (d || 1);
    g.player.x += nx * (o.r + g.player.r - d + 1);
    g.player.y += ny * (o.r + g.player.r - d + 1);
    if (o.type === "wreck") g.hurt(WRECK_CONTACT_DAMAGE);
  }

  function updateObstacles(g, dt) {
    for (const o of g.obstacles) {
      if (o.dead) continue;
      o.y += o.vy * dt;
      if (o.y > g.h + o.r + OBSTACLE_DESPAWN_MARGIN) o.dead = true;
      const d = dist(o, g.player);
      if (d < o.r + g.player.r) pushPlayerOut(g, o, d);
    }
    g.obstacles = g.obstacles.filter((o) => !o.dead);
  }

  function spawnObstacles(g, dt) {
    if (
      g.director?.boss ||
      g.obstacles.length >= OBSTACLE_MAX_ALIVE ||
      g.rng.next() >= dt * OBSTACLE_SPAWN_RATE
    )
      return;
    const x = clamp(
      g.player.x +
        rand(g, -g.w * OBSTACLE_SPAWN_SPREAD, g.w * OBSTACLE_SPAWN_SPREAD),
      OBSTACLE_EDGE_MARGIN,
      g.w - OBSTACLE_EDGE_MARGIN,
    );
    B.Environment.add(g, g.rng.pick(OBSTACLE_TYPES), x, OBSTACLE_SPAWN_Y);
  }

  function explodeCargo(g, o) {
    g.drop(o.x, o.y, "xp", CARGO_XP);
    if (g.rng.next() < CARGO_LOOT_CHANCE)
      g.drop(
        o.x + rand(g, -CARGO_LOOT_JITTER, CARGO_LOOT_JITTER),
        o.y,
        g.rng.pick(CARGO_LOOT),
        1,
      );
  }

  function explodeFuel(g, o, chain) {
    for (const e of g.enemies)
      if (!e.dead && dist(o, e) < FUEL_BLAST.enemyRadius)
        g.damageEnemy(e, FUEL_BLAST.enemyDamage, "fuel");
    if (dist(o, g.player) < FUEL_BLAST.playerRadius)
      g.hurt(FUEL_BLAST.playerDamage);
    if (chain >= FUEL_BLAST.maxChain) return;
    for (const other of g.obstacles)
      if (
        !other.dead &&
        other.type === "fuel" &&
        dist(o, other) < FUEL_BLAST.chainRadius
      )
        B.Environment.explode(g, other, chain + 1);
  }

  B.Environment = {
    add(g, type, x, y) {
      const v = OBSTACLE_STATS[type] || OBSTACLE_STATS.cargo;
      const o = {
        id: ++g.uid,
        type,
        x,
        y,
        r: v[1] / 2,
        hp: v[0],
        maxHp: v[0],
        angle: rand(g, 0, OBSTACLE_SPIN_RANGE),
        dead: false,
        vy: type === "wreck" ? WRECK_DRIFT : OBSTACLE_DRIFT,
      };
      g.obstacles.push(o);
      return o;
    },
    explode(g, o, chain = 0) {
      if (o.dead) return;
      o.dead = true;
      const blast = o.type === "fuel" ? FUEL_BLAST : DEBRIS_BLAST;
      g.burst(o.x, o.y, blast.color, blast.particles, BLAST_PARTICLE_SIZE);
      g.effect("ring", o.x, o.y, {
        radius: blast.ring,
        life: BLAST_RING_LIFE,
        maxLife: BLAST_RING_LIFE,
      });
      if (o.type === "cargo") explodeCargo(g, o);
      if (o.type === "fuel") explodeFuel(g, o, chain);
    },
    hitProjectile(g, p) {
      for (const o of g.obstacles) {
        if (o.dead) continue;
        if (B.sweptDistance(p, o.x, o.y) < o.r + (p.r || 0)) {
          p.dead = true;
          o.hp -= (p.damage || 1) * (p.enemy ? ENEMY_SHOT_OBSTACLE_SCALE : 1);
          if (o.hp <= 0) this.explode(g, o);
          return true;
        }
      }
      return false;
    },
    update(g, dt) {
      steerEnemyMissiles(g, dt);
      resolveWarnings(g, dt);
      updateBeams(g, dt);
      updateObstacles(g, dt);
      spawnObstacles(g, dt);
    },
  };
})();
