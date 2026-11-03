"use strict";
/*
 * Draws the player gunship, enemy aircraft and escort drones through the
 * airframe registry. Shadows are drawn in one pass beneath every aircraft.
 */
(() => {
  const B = window.BP;
  const { TAU, rect, circle } = B.Draw;
  const ELITE_SCALE = 1.13;
  const BLINK_RATE = 18;

  function enemySpec(e) {
    const id =
      (e.elite && B.EliteAirframes[e.type]) || B.EnemyAirframes[e.type];
    return id ? B.Airframes.get(id) : null;
  }

  function enemyPose(e) {
    const v = e.visual || {};
    return {
      x: e.x,
      y: e.y,
      heading: v.heading ?? Math.PI / 2,
      scale: e.elite && e.type !== "swarm" ? ELITE_SCALE : 1,
      vx: v.vx || 0,
      vy: v.vy || 0,
      seed: (e.id || 0) % 97,
      flash: e.flash,
      elite: e.elite,
    };
  }

  function playerPose(p, t, scale) {
    return {
      x: p.x,
      y: p.y,
      heading: p.angle,
      scale,
      roll: p.roll || 0,
      vx: p.vx || 0,
      vy: p.vy || 0,
      alpha: p.invuln > 0 && Math.floor(t * BLINK_RATE) % 2 ? 0.65 : 1,
      loadout: { rockets: p.stats?.rockets, missiles: p.stats?.missiles },
    };
  }

  function muzzleFlash(c, p, scale) {
    const hp = B.Hardpoints.player.muzzle,
      at = B.localToWorld(p, [hp[0] * scale, hp[1] * scale]);
    c.save();
    c.translate(at.x, at.y);
    c.rotate(p.angle);
    c.fillStyle = "#fff2b8";
    c.beginPath();
    c.moveTo(0, -2.6);
    c.lineTo(11, 0);
    c.lineTo(0, 2.6);
    c.closePath();
    c.fill();
    circle(c, 0, 0, 3, "#ffd27a99");
    c.restore();
  }

  function healthBar(c, e) {
    if (e.hp >= e.maxHp) return;
    rect(c, e.x - e.r, e.y - e.r - 9, e.r * 2, 3, "#081719");
    rect(
      c,
      e.x - e.r,
      e.y - e.r - 9,
      e.r * 2 * B.clamp(e.hp / e.maxHp, 0, 1),
      3,
      e.elite ? "#efc274" : "#dd8b77",
    );
  }

  Object.assign(B.Renderer.prototype, {
    // Cosmetic animation clock: real time normally, sim time under test control.
    cosmeticClock(g) {
      const now = performance.now();
      const dt = Math.min(
        0.02,
        Math.max(0, (now - (this.lastNow || now)) / 1000),
      );
      this.lastNow = now;
      this.cosmetic = (this.cosmetic || 0) + dt;
      return g.manual ? g.visualTime : this.cosmetic;
    },

    aircraftShadows(c, g, t) {
      for (const e of g.enemies) {
        if (e.dead || e.warning > 0) continue;
        const spec = e.boss ? null : enemySpec(e);
        if (spec) B.Aircraft.drawShadow(c, spec, enemyPose(e));
        else if (e.boss) this.bossShadow(c, e);
      }
      if (g.mode !== "dead")
        B.Aircraft.drawShadow(
          c,
          B.Airframes.get("kestrel"),
          playerPose(g.player, t, 1),
        );
    },

    helicopter(c, p, t, scale = 1) {
      const spec = B.Airframes.get("kestrel"),
        pose = playerPose(p, t, scale);
      B.Aircraft.draw(c, spec, pose, this.clock ?? t);
      if (p.muzzle > 0) muzzleFlash(c, p, scale);
    },

    enemy(c, e, t) {
      if (e.boss) {
        this.boss(c, e, t);
        return;
      }
      const spec = enemySpec(e);
      if (spec) B.Aircraft.draw(c, spec, enemyPose(e), this.clock ?? t);
      else circle(c, e.x, e.y, e.r, "#935850", "#d9957b");
      if (e.elite) circle(c, e.x, e.y, e.r + 9, null, "#ffd37a55", 1.5);
      healthBar(c, e);
    },

    drone(c, p, angle, t) {
      const spec = B.Airframes.get("escort");
      const pose = { x: p.x, y: p.y, heading: angle, seed: p.index * 13 };
      B.Aircraft.drawShadow(c, spec, pose);
      B.Aircraft.draw(c, spec, pose, this.clock ?? t);
    },

    shield(c, p, t) {
      const r = 46 + Math.sin(t * 6) * 1.5;
      const g = c.createRadialGradient(p.x, p.y, r * 0.7, p.x, p.y, r);
      g.addColorStop(0, "#7adaca00");
      g.addColorStop(1, "#7adaca22");
      c.fillStyle = g;
      c.beginPath();
      c.arc(p.x, p.y, r, 0, TAU);
      c.fill();
      circle(c, p.x, p.y, r, null, "#85e9dc88", 1.5);
    },
  });
})();
