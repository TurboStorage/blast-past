"use strict";
/* Boss encounters: phased attack telegraphs, arrival, and B.Encounters.boss. */
(() => {
  const B = window.BP;
  const C = B.Encounters;
  const clamp = B.clamp;
  const Kit = B.EncounterKit;
  const { rand, warning } = Kit;

  const PHASE_HP_RATIO_1 = 0.66;
  const PHASE_HP_RATIO_2 = 0.33;
  const PHASE_TRANSITION_ATTACK_TIMER = 1.05;
  const PHASE_BANNER_TIME = 1.8;
  const ATTACK_PATTERN_COUNT = 3;
  const ATTACK_SPEED_PHASE_3 = 0.68;
  const ATTACK_SPEED_PHASE_2 = 0.83;
  const ATTACK_SPEED_PHASE_1 = 1;

  function bossWarning(g, e, kind, life, extra = {}) {
    return warning(
      g,
      Object.assign(
        {
          type: kind,
          x: e.x,
          y: e.y,
          source: e.id,
          life,
          maxLife: life,
          label: kind === "line" ? "SWEEP" : "INCOMING",
          owner: "boss",
        },
        extra,
      ),
    );
  }

  function bossPhaseFor(e) {
    const ratio = e.hp / e.maxHp;
    return ratio > PHASE_HP_RATIO_1 ? 1 : ratio > PHASE_HP_RATIO_2 ? 2 : 3;
  }

  function updateBossMotion(g, e, dt, phase) {
    e.y += Math.min(e.speed * dt, Math.max(0, (e.bossY || 128) - e.y));
    e.x =
      g.w / 2 +
      Math.sin(e.age * (0.21 + phase * 0.035)) *
        Math.min(g.w * (0.12 + 0.045 * phase), 220);
  }

  function handleBossPhaseChange(g, e, phase) {
    if (e.phase === phase) return;
    e.phase = phase;
    e.attack = 0;
    e.attackTimer = PHASE_TRANSITION_ATTACK_TIMER;
    g.banner = (e.name || "BOSS") + " // PHASE " + phase;
    g.bannerTime = PHASE_BANNER_TIME;
    g.audio.play("warning");
  }

  function attackSpeedForPhase(phase) {
    return phase === 3
      ? ATTACK_SPEED_PHASE_3
      : phase === 2
        ? ATTACK_SPEED_PHASE_2
        : ATTACK_SPEED_PHASE_1;
  }

  function carrierMissileFan(g, e, phase, faster, pods) {
    bossWarning(g, e, "fan", 0.82, {
      radius: 125,
      label: "MISSILE FAN",
      action: "fan",
      count: Math.max(1, pods) * (phase + 1),
      damage: 9,
    });
    return 2.15 * faster;
  }

  function carrierDroneDrop(g, e, phase, faster) {
    bossWarning(g, e, "circle", 1.05, {
      x: clamp(g.player.x + rand(g, -100, 100), 80, g.w - 80),
      y: clamp(g.player.y - 110, 95, g.h - 100),
      radius: 75,
      label: "DRONE DROP",
      action: "drones",
      count: phase === 1 ? 1 : phase + 1,
    });
    return 2.55 * faster;
  }

  function carrierSweep(g, e, phase, faster) {
    bossWarning(g, e, "line", 1.05, {
      x: e.x,
      y: e.y,
      x2: e.x,
      y2: g.h,
      width: phase === 3 ? 105 : 70,
      label: "CARRIER SWEEP",
      action: "sweep",
      damage: phase === 3 ? 18 : 13,
    });
    return 2.65 * faster;
  }

  function siegeBombardment(g, e, phase, faster) {
    bossWarning(g, e, "circle", 1.05, {
      x: clamp(g.player.x + rand(g, -95, 95), 70, g.w - 70),
      y: clamp(g.player.y + rand(g, -40, 35), 105, g.h - 65),
      radius: phase === 3 ? 86 : 68,
      label: "BOMBARDMENT",
      action: "bombard",
      damage: phase === 3 ? 22 : 16,
    });
    return 2.25 * faster;
  }

  function siegeRotarySweep(g, e, phase, faster) {
    bossWarning(g, e, "line", 1.15, {
      x: e.x,
      y: e.y,
      x2: e.x,
      y2: g.h,
      width: phase === 3 ? 120 : 84,
      label: "ROTARY SWEEP",
      action: "sweep",
      damage: phase === 3 ? 20 : 14,
    });
    return 2.75 * faster;
  }

  function siegeRocketSalvo(g, e, phase, faster) {
    bossWarning(g, e, "fan", 0.8, {
      radius: 130,
      label: "ROCKET SALVO",
      action: "fan",
      count: 3 + phase,
      damage: 10,
    });
    return 2.1 * faster;
  }

  const CARRIER_ATTACK_PATTERNS = [
    carrierMissileFan,
    carrierDroneDrop,
    carrierSweep,
  ];
  const SIEGE_ATTACK_PATTERNS = [
    siegeBombardment,
    siegeRotarySweep,
    siegeRocketSalvo,
  ];

  function runBossAttack(g, e, phase) {
    const n = e.attack++ % ATTACK_PATTERN_COUNT,
      faster = attackSpeedForPhase(phase);
    const pods = e.parts.filter((p) => !p.dead).length;
    const patterns =
      e.type === "carrierBoss"
        ? CARRIER_ATTACK_PATTERNS
        : SIEGE_ATTACK_PATTERNS;
    e.attackTimer = patterns[n](g, e, phase, faster, pods);
  }

  function bossUpdate(g, e, dt) {
    const phase = bossPhaseFor(e);
    updateBossMotion(g, e, dt, phase);
    handleBossPhaseChange(g, e, phase);
    e.attackTimer -= dt;
    if (e.attackTimer > 0) return;
    runBossAttack(g, e, phase);
  }

  Kit.bossUpdate = bossUpdate;
  C.boss = (g, kind) => {
    const carrier = kind === "carrier";
    const hp = carrier ? 1850 : 2100;
    const e = C.spawn(g, carrier ? "carrierBoss" : "siegeBoss", g.w / 2, -90, {
      boss: true,
      name: carrier ? "ASSAULT CARRIER" : "SIEGE PLATFORM",
      r: carrier ? 72 : 78,
      hp,
      maxHp: hp,
      speed: 80,
      bossY: 138,
      warning: 1.5,
      score: 7000,
      xp: 360,
      cost: 99,
      phase: 0,
      attackTimer: 1.5,
      parts: [
        { x: -54, y: 5, r: 19, hp: 130, maxHp: 130, name: "PORT POD" },
        { x: 54, y: 5, r: 19, hp: 130, maxHp: 130, name: "STARBOARD POD" },
      ],
    });
    if (e) {
      g.banner = e.name + " INBOUND";
      g.bannerTime = 3;
      g.audio.play("bossArrival");
      warning(g, {
        type: "circle",
        x: g.w / 2,
        y: 140,
        radius: 125,
        life: 1.5,
        maxLife: 1.5,
        label: e.name,
        color: "#ff7468",
      });
    }
    return e;
  };
})();
