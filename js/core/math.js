"use strict";
/* Shared math helpers: clamp, distance, angle, angular turn, local-to-world. */
(() => {
  const B = window.BP;
  B.clamp = (n, a, b) => Math.max(a, Math.min(b, n));
  B.distance = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
  B.angle = (a, b) => Math.atan2(b.y - a.y, b.x - a.x);
  B.turn = (a, b, amount) =>
    a + B.clamp(Math.atan2(Math.sin(b - a), Math.cos(b - a)), -amount, amount);
  // Distance from (cx, cy) to a projectile's swept path this tick, from its
  // previous position (px, py) to its current one; catches fast shots.
  B.sweptDistance = (p, cx, cy) => {
    const sx = p.px == null ? p.x : p.px,
      sy = p.py == null ? p.y : p.py,
      dx = p.x - sx,
      dy = p.y - sy,
      l = dx * dx + dy * dy,
      t = l ? B.clamp(((cx - sx) * dx + (cy - sy) * dy) / l, 0, 1) : 0;
    return Math.hypot(cx - sx - dx * t, cy - sy - dy * t);
  };
  // Airframe-local point (nose -y, starboard +x) to world space for an entity
  // whose nose points along `angle`.
  B.localToWorld = (entity, [lx, ly]) => {
    const a = entity.angle + Math.PI / 2,
      cos = Math.cos(a),
      sin = Math.sin(a);
    return {
      x: entity.x + lx * cos - ly * sin,
      y: entity.y + lx * sin + ly * cos,
    };
  };
})();
