"use strict";
/* Transient visuals: projectiles, spawn warnings, attack telegraphs and effects. */
(() => {
  const B = window.BP;
  const { poly, rect, circle, label } = B.Draw;
  Object.assign(B.Renderer.prototype, {
    projectile(c, p) {
      const color = p.enemy ? "#ff7881" : p.color;
      c.save();
      c.strokeStyle = color;
      c.lineWidth = p.enemy ? 2 : p.r;
      if (p.kind === "rocket" || p.kind === "missile" || p.seekPlayer) {
        c.translate(p.x, p.y);
        c.rotate(p.angle);
        poly(
          c,
          [
            [8, 0],
            [-5, -3],
            [-5, 3],
          ],
          p.enemy ? "#ffab85" : "#e9ddad",
        );
        rect(c, -11, -2, 6, 4, p.enemy ? "#ef6863" : "#ffb368");
        if (p.enemy) circle(c, 0, 0, p.r + 3, null, "#ff7b7255");
      } else if (p.enemy) {
        circle(c, p.x, p.y, p.r + 2, "#ef556d1a");
        circle(c, p.x, p.y, p.r, color, "#ffe1c2", 1);
      } else {
        c.globalAlpha = 0.4;
        c.beginPath();
        c.moveTo(p.x - Math.cos(p.angle) * 19, p.y - Math.sin(p.angle) * 19);
        c.lineTo(p.x, p.y);
        c.stroke();
        c.globalAlpha = 1;
        c.lineWidth = Math.max(1.5, p.r * 0.7);
        c.strokeStyle = "#fff0c4";
        c.beginPath();
        c.moveTo(p.x - Math.cos(p.angle) * 6, p.y - Math.sin(p.angle) * 6);
        c.lineTo(p.x, p.y);
        c.stroke();
      }
      c.restore();
    },
    spawnWarning(c, e, g, t) {
      const x = B.clamp(e.x, 24, g.w - 24),
        y = B.clamp(e.y, 84, g.h - 40);
      c.save();
      c.globalAlpha = 0.5 + Math.sin(t * 15) * 0.2;
      poly(
        c,
        [
          [x - 6, y - 8],
          [x + 6, y - 8],
          [x, y],
        ],
        null,
        "#f0ae71",
        1.5,
      );
      c.strokeStyle = "#f0ae7155";
      c.beginPath();
      c.moveTo(x - 16, y + 5);
      c.lineTo(x + 16, y + 5);
      c.stroke();
      if (e.boss) label(c, "HEAVY CONTACT", x, y + 22, "#f1bc7e", 10, "center");
      c.restore();
    },
    telegraph(c, w, _t) {
      const q = B.clamp(w.life / w.maxLife, 0, 1);
      c.save();
      c.strokeStyle = w.color || "#ffc079";
      c.fillStyle = "#e8984612";
      c.lineWidth = 1.5;
      if (w.type === "line") {
        const width = w.width || 40;
        c.fillRect(w.x - width / 2, w.y, width, (w.y2 || 720) - w.y);
        c.setLineDash([10, 8]);
        c.strokeRect(w.x - width / 2, w.y, width, (w.y2 || 720) - w.y);
        c.setLineDash([]);
        c.globalAlpha = 0.35;
        c.lineWidth = 2;
        c.beginPath();
        c.moveTo(w.x, w.y);
        c.lineTo(w.x2, w.y2);
        c.stroke();
      } else if (w.type === "fan") {
        c.beginPath();
        c.arc(w.x, w.y, w.radius || 100, 0.2 * Math.PI, 0.8 * Math.PI);
        c.stroke();
      } else {
        circle(c, w.x, w.y, w.radius, "#ffb25c0d", w.color || "#ffc079");
        circle(c, w.x, w.y, w.radius * (1 - q), null, "#f3b86d88", 2);
        c.beginPath();
        c.moveTo(w.x - 7, w.y);
        c.lineTo(w.x + 7, w.y);
        c.moveTo(w.x, w.y - 7);
        c.lineTo(w.x, w.y + 7);
        c.stroke();
      }
      c.globalAlpha = 0.9;
      if (w.label)
        label(
          c,
          w.label,
          w.x,
          Math.max(96, w.y - (w.radius || 25) - 10),
          "#f7c788",
          10,
          "center",
        );
      c.restore();
    },
    effects(c, g) {
      for (const e of g.effects) {
        if (e.delay > 0) continue;
        paintEffect(c, e);
      }
    },
  });

  function drawRingEffect(c, e, q) {
    circle(
      c,
      e.x,
      e.y,
      (e.radius || 45) * (1 - q * 0.8),
      q > 0.75 ? "#ffdd9c33" : null,
      e.color || "#f5c28b",
      q * 3,
    );
    circle(c, e.x, e.y, Math.max(1, (e.radius || 45) * 0.25 * q), "#ffd99b22");
  }

  // Builds the whole jittered polyline as one path so the white core stroke
  // below covers every segment, not just whichever one was drawn last.
  function traceArcPath(c, points) {
    c.beginPath();
    for (let i = 1; i < points.length; i++) {
      const a = points[i - 1],
        b = points[i];
      if (i === 1) c.moveTo(a.x, a.y);
      for (let n = 1; n <= 5; n++) {
        const f = n / 5;
        c.lineTo(
          a.x + (b.x - a.x) * f + (n < 5 ? Math.sin(i * 7 + n * 5) * 9 : 0),
          a.y + (b.y - a.y) * f + (n < 5 ? Math.cos(n * 9) * 9 : 0),
        );
      }
    }
  }

  function drawArcEffect(c, e) {
    c.lineWidth = 2;
    traceArcPath(c, e.points);
    c.stroke();
    c.lineWidth = 1;
    c.strokeStyle = "#eeffff";
    c.stroke();
  }

  function drawBeamEffect(c, e, q) {
    c.lineWidth = e.width || 30;
    c.globalAlpha = q * 0.35;
    c.beginPath();
    c.moveTo(e.x, e.y);
    c.lineTo(e.x2, e.y2);
    c.stroke();
    c.globalAlpha = q;
    c.lineWidth = 4;
    c.strokeStyle = "#ffe2aa";
    c.stroke();
  }

  function paintEffect(c, e) {
    const q = B.clamp(e.life / e.maxLife, 0, 1);
    c.save();
    c.globalAlpha = q;
    c.strokeStyle = e.color || "#ffc58b";
    c.fillStyle = e.color || "#ffc58b";
    if (e.type === "ring" || e.type === "detonation") drawRingEffect(c, e, q);
    else if (e.type === "arc" && e.points) drawArcEffect(c, e);
    else if (e.type === "beam") drawBeamEffect(c, e, q);
    else if (e.type === "muzzle") circle(c, e.x, e.y, 5, "#fff1b4");
    else if (e.type === "text")
      label(c, e.text, e.x, e.y - (1 - q) * 24, e.color, 13, "center");
    c.restore();
  }
})();
