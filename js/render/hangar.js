"use strict";
/* Menu hangar showcase: the player airframe on its turntable with callout labels. */
(() => {
  const B = window.BP;
  const { circle, label } = B.Draw;
  const SHOWCASE_SCALE = 2.8;

  function paintTurntable(c, x, y) {
    circle(c, x, y, 184, "#12292b77", "#90b7a02a");
    circle(c, x, y, 159, null, "#a6c8ad22");
    circle(c, x, y, 114, null, "#a6c8ad16");
    c.strokeStyle = "#9fc6b140";
    c.setLineDash([3, 7]);
    c.beginPath();
    c.moveTo(x - 224, y);
    c.lineTo(x + 224, y);
    c.moveTo(x, y - 224);
    c.lineTo(x, y + 224);
    c.stroke();
    c.setLineDash([]);
  }

  function buildShowcaseAircraft(x, y) {
    return {
      x,
      y,
      angle: -Math.PI / 2 - 0.25,
      invuln: 0,
      muzzle: 0,
      stats: { rockets: 1, missiles: 1 },
    };
  }

  // Callouts point at real features of the airframe.
  function paintCallouts(c, showcase, spec, x, y) {
    const at = (point) =>
      B.localToWorld(showcase, [
        point[0] * SHOWCASE_SCALE,
        point[1] * SHOWCASE_SCALE,
      ]);
    const gun = at(B.Hardpoints.player.gun),
      engine = at([9.6, 4]),
      tail = at(
        spec.tailRotor ? [spec.tailRotor.x - 2, spec.tailRotor.y] : [0, 50],
      );
    const anchors = [
      [gun.x, gun.y, x - 208, y - 150, "M134 CHIN MINIGUN"],
      [engine.x, engine.y, x + 112, y + 120, "TWIN TURBOSHAFT"],
      [tail.x, tail.y, x - 200, y + 194, "AH-87 // KESTREL"],
    ];
    c.strokeStyle = "#94bbaa70";
    for (const [a, b, xx, yy, text] of anchors) {
      c.beginPath();
      c.moveTo(a, b);
      c.lineTo(xx, yy);
      c.lineTo(xx + 130, yy);
      c.stroke();
      circle(c, a, b, 3, "#bdad78");
      label(c, text, xx, yy - 7, "#bcc1a4", 9);
    }
    label(c, "AIRFRAME 01", x, y - 207, "#e3b871", 11, "center");
    label(c, "ALL SYSTEMS NOMINAL", x, y + 234, "#79cbb9", 10, "center");
  }

  Object.assign(B.Renderer.prototype, {
    hangar(c, g, t) {
      if (g.w < 800) return;
      const x = g.w * 0.75,
        y = g.h * 0.46;
      c.save();
      paintTurntable(c, x, y);
      const showcase = buildShowcaseAircraft(x, y);
      const spec = B.Airframes.get("kestrel");
      B.Aircraft.drawShadow(c, spec, {
        x,
        y,
        heading: showcase.angle,
        scale: SHOWCASE_SCALE,
      });
      this.helicopter(c, showcase, t, SHOWCASE_SCALE);
      paintCallouts(c, showcase, spec, x, y);
      c.restore();
    },
  });
})();
