"use strict";
/* Player helicopter state, stats and per-frame movement, aim and fire update. */
(() => {
  const B = window.BP;
  const BOOST_DURATION = 0.28;
  const BOOST_COOLDOWN = 4;
  const BOOST_INVULN = 0.35;
  const BOOST_BURST_COUNT = 12;
  const BOOST_SPEED_MULTIPLIER = 2.8;
  const MOUSE_DEADZONE = 3;
  const MOUSE_FOLLOW_GAIN = 9;
  const VELOCITY_RESPONSE = 14;
  const MAX_BANK = 0.3;
  const UP = -Math.PI / 2;
  const AUTO_AIM_RANGE = 550;
  const AUTO_AIM_MIN_AHEAD = 25;
  const AUTO_AIM_MIN_WIDTH = 65;
  const AUTO_AIM_CONE_SLOPE = 0.55;
  const AUTO_AIM_MAX_OFFSET = 0.4;
  const TURN_RATE = 12;
  const KILL_CHAIN_MAX_COMBO = 20;
  const KILL_CHAIN_RATE_PER_COMBO = 0.025;
  const EXHAUST_OFFSET_Y = 25;
  const EXHAUST_SPEED = 70;
  const EXHAUST_RATE_DAMAGED = 20;
  const EXHAUST_RATE_NORMAL = 7;
  const EXHAUST_COLOR_DAMAGED = "#65727a";
  const EXHAUST_COLOR_NORMAL = "#d7aa61";

  const tickTimers = (player, dt) => {
    player.invuln = Math.max(0, player.invuln - dt);
    player.boostCd = Math.max(0, player.boostCd - dt);
    player.boost = Math.max(0, player.boost - dt);
    player.shield = Math.max(0, player.shield - dt);
    player.muzzle = Math.max(0, player.muzzle - dt);
  };

  const tryBoost = (player, g, i) => {
    const ready = player.boostCd <= 0;
    if (!ready || !i.has("ShiftLeft", "ShiftRight")) return;
    player.boost = BOOST_DURATION;
    player.boostCd = BOOST_COOLDOWN / player.stats.boostRecharge;
    player.invuln = Math.max(player.invuln, BOOST_INVULN);
    g.audio.play("boost");
    g.burst(player.x, player.y, "#6ce9dd", BOOST_BURST_COUNT);
  };

  const mouseIntent = (player, i) => {
    if (!i.moved) return { dx: 0, dy: 0 };
    const dx = i.x - player.x,
      dy = i.y - player.y;
    const length = Math.hypot(dx, dy);
    if (length < MOUSE_DEADZONE) return { dx: 0, dy: 0 };
    const speed = Math.min(player.stats.speed, length * MOUSE_FOLLOW_GAIN);
    return { dx: (dx / length) * speed, dy: (dy / length) * speed };
  };

  const keyboardIntent = (player, i) => {
    const dx =
      Number(i.has("KeyD", "ArrowRight")) - Number(i.has("KeyA", "ArrowLeft"));
    const dy =
      Number(i.has("KeyS", "ArrowDown")) - Number(i.has("KeyW", "ArrowUp"));
    const length = Math.hypot(dx, dy) || 1;
    const speed = player.stats.speed;
    return { dx: (dx / length) * speed, dy: (dy / length) * speed };
  };

  const movementIntent = (player, g, i) =>
    i.scheme === "mouse" ? mouseIntent(player, i) : keyboardIntent(player, i);

  const applyBoost = (player, intent) => {
    if (player.boost <= 0) return intent;
    const speed = player.stats.speed;
    const { dx, dy } = intent;
    const l = Math.hypot(dx, dy);
    if (l > 0)
      return {
        dx: (dx / l) * speed * BOOST_SPEED_MULTIPLIER,
        dy: (dy / l) * speed * BOOST_SPEED_MULTIPLIER,
      };
    return { dx, dy: -speed * BOOST_SPEED_MULTIPLIER };
  };

  const integrate = (player, g, dt, { dx, dy }) => {
    const blend = 1 - Math.exp(-VELOCITY_RESPONSE * dt);
    player.vx += (dx - player.vx) * blend;
    player.vy += (dy - player.vy) * blend;
    player.x = B.clamp(
      player.x + player.vx * dt,
      B.Config.PLAYER_MARGIN_X,
      g.w - B.Config.PLAYER_MARGIN_X,
    );
    player.y = B.clamp(
      player.y + player.vy * dt,
      B.Config.PLAYER_MARGIN_TOP,
      g.h - B.Config.PLAYER_MARGIN_BOTTOM,
    );
    player.bank +=
      (B.clamp(player.vx / player.stats.speed, -1, 1) * MAX_BANK -
        player.bank) *
      blend;
  };

  const inAimCone = (player, e) =>
    e.y < player.y - AUTO_AIM_MIN_AHEAD &&
    Math.abs(e.x - player.x) <
      Math.max(AUTO_AIM_MIN_WIDTH, (player.y - e.y) * AUTO_AIM_CONE_SLOPE);

  const aimAngle = (player, g, i) => {
    if (i.scheme === "keyboard" && i.moved)
      return B.angle(player, { x: i.x, y: i.y });
    const target = g.nearest(player, AUTO_AIM_RANGE, (e) =>
      inAimCone(player, e),
    );
    if (!target) return UP;
    return B.clamp(
      B.angle(player, target),
      UP - AUTO_AIM_MAX_OFFSET,
      UP + AUTO_AIM_MAX_OFFSET,
    );
  };

  const fireInterval = (s, combo) =>
    1 /
    (s.fireRate *
      (1 +
        (s.killChain
          ? Math.min(combo, KILL_CHAIN_MAX_COMBO) * KILL_CHAIN_RATE_PER_COMBO
          : 0)));

  const updateFire = (player, g, i, dt) => {
    player.fire -= dt;
    const ready = player.fire <= 0;
    if (!ready || !(i.down || i.has("Space"))) return;
    g.firePrimary();
    player.fire = fireInterval(player.stats, g.combo);
  };

  const emitExhaust = (player, g, dt) => {
    const damaged = player.hp < player.maxHp * B.Config.LOW_HULL;
    const rate = damaged ? EXHAUST_RATE_DAMAGED : EXHAUST_RATE_NORMAL;
    if (!(g.rng.next() < dt * rate)) return;
    g.particle(
      player.x,
      player.y + EXHAUST_OFFSET_Y,
      0,
      EXHAUST_SPEED,
      damaged ? EXHAUST_COLOR_DAMAGED : EXHAUST_COLOR_NORMAL,
      0.6,
      3,
    );
  };

  B.Player = class {
    constructor(g) {
      Object.assign(this, {
        x: g.w / 2,
        y: g.h * 0.76,
        vx: 0,
        vy: 0,
        r: 13,
        hp: 100,
        maxHp: 100,
        angle: UP,
        bank: 0,
        invuln: 1,
        boost: 0,
        boostCd: 0,
        fire: 0,
        muzzle: 0,
        shield: 0,
      });
      this.stats = {
        speed: 330,
        damage: 12,
        fireRate: 8,
        streams: 1,
        pierce: 0,
        explosive: 0,
        crit: 0,
        magnet: 115,
        regen: 0,
        rockets: 0,
        missiles: 0,
        arc: 0,
        drones: 0,
        cluster: 0,
        droneLink: 0,
        critArc: 0,
        killChain: 0,
        blast: 1,
        homing: 0,
        slow: 0,
        leech: 0,
        boostRecharge: 1,
        reactor: 0,
        salvage: 0,
      };
      this.ranks = {};
      this.cooldowns = { rockets: 1, missiles: 1.5, arc: 2, drones: 0.3 };
    }
    update(g, dt) {
      const i = g.input;
      tickTimers(this, dt);
      tryBoost(this, g, i);
      const intent = applyBoost(this, movementIntent(this, g, i));
      integrate(this, g, dt, intent);
      this.angle = B.turn(this.angle, aimAngle(this, g, i), dt * TURN_RATE);
      updateFire(this, g, i, dt);
      emitExhaust(this, g, dt);
    }
  };
})();
