"use strict";
/*
 * Boss art. The Assault Carrier is a quad-rotor airframe flying nose-down
 * toward the player; its destructible weapon pods mount on the airframe's
 * pylons. The Siege Platform is a hovering sea fortress with rotating
 * batteries. Both share the aircraft sun direction for shadows.
 */
(() => {
  const B = window.BP;
  const { TAU, poly, rect, circle } = B.Draw;
  // Nose-down, the carrier's local pod pylons at (±54, 5) land at world
  // (∓54, -5); shifting the body 10 px aft puts them on the gameplay parts.
  const CARRIER_OFFSET = 10;
  const SIEGE_ALTITUDE = 26;

  function carrierPose(e) {
    return {
      x: e.x,
      y: e.y + CARRIER_OFFSET,
      heading: Math.PI / 2,
      seed: 5,
      flash: e.flash,
      elite: false,
    };
  }

  function siegeHull(c, e, t) {
    const points = Array.from({ length: 8 }, (_, i) => [
      Math.cos((i * TAU) / 8 + Math.PI / 8) * 76,
      Math.sin((i * TAU) / 8 + Math.PI / 8) * 76,
    ]);
    const hull = c.createLinearGradient(-76, -76, 76, 76);
    hull.addColorStop(0, "#6f7178");
    hull.addColorStop(1, "#3c3e45");
    poly(c, points, hull, "#bba68c", 2);
    circle(c, 0, 0, 59, "#353c47", "#977f6c", 3);
    circle(c, 0, 0, 44, "#735c55", "#e0af7a", 2);
    c.save();
    c.rotate(t * (e.phase || 1) * 0.18);
    for (let n = 0; n < 4; n++) {
      c.rotate(Math.PI / 2);
      rect(c, -7, -69, 14, 36, "#7f695e", "#d6b083");
      rect(c, -4, -73, 8, 20, "#343b44");
    }
    c.restore();
    circle(c, 0, 0, 21, "#283d46", "#c8a77d", 3);
    circle(c, 0, 0, 10, "#d7a46b");
  }

  function part(c, p) {
    if (p.dead) {
      circle(c, p.x, p.y, p.r, "#25232b", "#594642");
      poly(
        c,
        [
          [p.x - 9, p.y],
          [p.x, p.y - 8],
          [p.x + 6, p.y + 10],
        ],
        "#e0814c88",
      );
      return;
    }
    const shell = c.createRadialGradient(p.x - 5, p.y - 6, 2, p.x, p.y, p.r);
    shell.addColorStop(0, "#b39676");
    shell.addColorStop(1, "#5e4a3b");
    circle(c, p.x, p.y, p.r, shell, "#dfb785", 2);
    circle(c, p.x, p.y, p.r * 0.64, "#343d40", "#b19c76");
    for (let n = -1; n <= 1; n++)
      rect(c, p.x + n * 7 - 2, p.y - 5, 4, 18, "#c2a27d", "#362d2d");
  }

  function damage(c, e, t) {
    if (e.phase <= 1) return;
    poly(
      c,
      [
        [-12, 18],
        [-4, 11],
        [1, 23],
        [10, 17],
        [4, 38],
      ],
      "#33272f",
    );
    circle(c, 3, 26, 4 + Math.sin(t * 17) * 2, "#ffac6266");
  }

  Object.assign(B.Renderer.prototype, {
    bossShadow(c, e) {
      if (e.type === "carrierBoss") {
        B.Aircraft.drawShadow(c, B.Airframes.get("carrier"), carrierPose(e));
        return;
      }
      const sun = B.Aircraft.SUN;
      c.save();
      c.globalAlpha = 0.3;
      c.translate(e.x + sun.x * SIEGE_ALTITUDE, e.y + sun.y * SIEGE_ALTITUDE);
      circle(c, 0, 0, 78, "#000");
      c.restore();
    },

    boss(c, e, t) {
      const carrier = e.type === "carrierBoss";
      if (carrier)
        B.Aircraft.draw(
          c,
          B.Airframes.get("carrier"),
          carrierPose(e),
          this.clock ?? t,
        );
      c.save();
      c.translate(e.x, e.y);
      if (!carrier) siegeHull(c, e, t);
      for (const p of e.parts || []) part(c, p);
      damage(c, e, t);
      if (e.flash > 0 && !carrier) {
        c.globalCompositeOperation = "screen";
        circle(c, 0, 0, 55, "#fff3db55");
      }
      c.restore();
    },
  });
})();
