"use strict";
/* All artwork is generated locally. Cached terrain/sprites keep the hot draw path small. */
(() => {
  const B = window.BP;
  B.Renderer = class {
    constructor(canvas) {
      this.ctx = canvas.getContext("2d", { alpha: false });
      this.dpr = 1;
      this.tiles = [];
      this.buildTerrain();
    }
    resize(w, h, dpr) {
      this.w = w;
      this.h = h;
      this.dpr = dpr;
      B.Aircraft.setDpr(dpr);
      this.vignette = this.ctx.createRadialGradient(
        w * 0.5,
        h * 0.45,
        h * 0.25,
        w * 0.5,
        h * 0.5,
        Math.max(w, h) * 0.65,
      );
      this.vignette.addColorStop(0, "#020c1000");
      this.vignette.addColorStop(1, "#020c1077");
    }
    draw(g) {
      const c = this.ctx,
        t = g.visualTime;
      this.clock = this.cosmeticClock(g);
      c.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
      c.globalAlpha = 1;
      c.fillStyle = "#102027";
      c.fillRect(0, 0, g.w, g.h);
      c.save();
      const shake = g.shake * g.settings.shake;
      if (shake)
        c.translate(Math.sin(t * 121) * shake, Math.cos(t * 149) * shake * 0.6);
      this.background(c, g, t);
      if (g.mode === "menu") this.hangar(c, g, t);
      else this.world(c, g, t);
      c.restore();
      c.fillStyle = this.vignette;
      c.fillRect(0, 0, g.w, g.h);
      if (
        g.mode === "playing" &&
        g.player.hp < g.player.maxHp * B.Config.LOW_HULL
      ) {
        c.strokeStyle = `rgba(248,93,83,${0.3 + Math.sin(t * 5) * 0.15})`;
        c.lineWidth = 7;
        c.strokeRect(2, 2, g.w - 4, g.h - 4);
      }
    }
    world(c, g, t) {
      for (const o of g.obstacles) this.obstacle(c, o);
      for (const p of g.pickups) this.pickup(c, p, t);
      for (const warning of g.warnings) this.telegraph(c, warning, t);
      this.aircraftShadows(c, g, t);
      for (const e of g.enemies) {
        if (e.dead) continue;
        if (e.warning > 0) this.spawnWarning(c, e, g, t);
        else this.enemy(c, e, t);
      }
      for (const p of g.projectiles) if (!p.dead) this.projectile(c, p);
      for (const p of g.particles) {
        c.globalAlpha = B.clamp(p.life / p.maxLife, 0, 1);
        c.fillStyle = p.color;
        const size = p.size * (0.4 + (0.6 * p.life) / p.maxLife);
        c.fillRect(p.x - size * 0.5, p.y - size * 0.5, size, size);
      }
      c.globalAlpha = 1;
      if (g.mode !== "dead") {
        this.helicopter(c, g.player, t, 1);
        // Escort drones fly above the gunship, so they draw over its rotor.
        for (const drone of B.Weapons.dronePositions(g)) {
          const target = g.nearest(drone, 600);
          this.drone(
            c,
            drone,
            target ? B.angle(drone, target) : -Math.PI / 2,
            t,
          );
        }
        if (g.player.shield > 0) this.shield(c, g.player, t);
        if (g.mode === "playing" && g.input.moved) {
          const x = g.input.x,
            y = g.input.y;
          c.strokeStyle = "#d6e6c777";
          c.lineWidth = 1;
          c.beginPath();
          c.moveTo(x - 8, y);
          c.lineTo(x - 3, y);
          c.moveTo(x + 3, y);
          c.lineTo(x + 8, y);
          c.moveTo(x, y - 8);
          c.lineTo(x, y - 3);
          c.moveTo(x, y + 3);
          c.lineTo(x, y + 8);
          c.stroke();
        }
      }
      this.effects(c, g);
    }
  };
})();
