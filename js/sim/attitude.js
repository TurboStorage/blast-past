"use strict";
/*
 * Presentation-only attitude: where each aircraft's nose points and how far
 * the player's airframe rolls. Uses no RNG and never feeds back into gameplay,
 * so fixed-seed replays are unaffected.
 */
(() => {
  const B = window.BP;
  const TURN_RATE = 3;
  const MIN_SPEED = 6;
  const ROLL_MAX = 0.35;
  const ROLL_EASE = 6;

  function velocityHeading(v) {
    return Math.hypot(v.vx, v.vy) > MIN_SPEED ? Math.atan2(v.vy, v.vx) : null;
  }

  function desiredHeading(g, e, v) {
    const moving = velocityHeading(v);
    if (B.FixedWing.has(e.type)) return moving;
    return B.angle(e, g.player);
  }

  function updateEnemy(g, e, dt) {
    const v =
      e.visual || (e.visual = { heading: Math.PI / 2, px: e.x, py: e.y });
    if (dt > 0) {
      v.vx = (e.x - v.px) / dt;
      v.vy = (e.y - v.py) / dt;
    }
    v.px = e.x;
    v.py = e.y;
    if (e.boss) return;
    const want = desiredHeading(g, e, v);
    if (want == null) return;
    const rate = B.FixedWing.has(e.type) ? TURN_RATE * 3 : TURN_RATE;
    v.heading = B.turn(v.heading, want, rate * dt);
  }

  B.Attitude = {
    update(g, dt) {
      const p = g.player;
      const target = B.clamp(p.vx / (p.stats?.speed || 300), -1, 1) * ROLL_MAX;
      p.roll =
        (p.roll || 0) + (target - (p.roll || 0)) * Math.min(1, dt * ROLL_EASE);
      for (const e of g.enemies)
        if (!e.dead && e.warning <= 0) updateEnemy(g, e, dt);
    },
  };
})();
