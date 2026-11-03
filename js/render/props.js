"use strict";
/* Battlefield props: destructible obstacles and collectible pickups. */
(() => {
  const B = window.BP;
  const { poly, rect, circle, label } = B.Draw;
  function paintFuelObstacle(c, r) {
    circle(c, 0, 0, r * 0.8, "#8d663b", "#d3a46b", 2);
    rect(c, -r * 0.65, -r * 0.58, r * 1.3, r * 1.16, "#8a6745", "#dbb97d");
    rect(c, -r * 0.65, -r * 0.3, r * 1.3, 4, "#443e31");
    rect(c, -r * 0.65, r * 0.3, r * 1.3, 4, "#443e31");
    poly(
      c,
      [
        [0, -9],
        [-7, 4],
        [0, 9],
        [7, 4],
      ],
      "#ffd37e",
    );
  }

  function paintCargoObstacle(c, r) {
    rect(c, -r * 0.78, -r * 0.62, r * 1.56, r * 1.24, "#456460", "#91aaa0");
    for (let x = -r * 0.6; x < r * 0.7; x += 9)
      rect(c, x, -r * 0.52, 3, r * 1.04, "#294943");
    rect(c, -r * 0.78, -3, r * 1.56, 6, "#bbac75");
  }

  function paintWreckObstacle(c, r) {
    poly(
      c,
      [
        [-r, -r * 0.3],
        [-r * 0.4, -r * 0.45],
        [-r * 0.15, -r],
        [r * 0.2, -r * 0.8],
        [r * 0.35, -r * 0.18],
        [r, 0],
        [r * 0.65, r * 0.25],
        [r * 0.25, r * 0.2],
        [r * 0.1, r * 0.8],
        [-r * 0.2, r],
        [-r * 0.35, r * 0.2],
        [-r * 0.8, r * 0.25],
      ],
      "#4a5553",
      "#7c8580",
    );
    rect(c, -6, -r * 0.6, 12, r * 1.1, "#2d3b3b", "#687575");
    poly(
      c,
      [
        [-r * 0.5, -3],
        [-8, 1],
        [-r * 0.3, 8],
      ],
      "#b4a171",
    );
  }

  Object.assign(B.Renderer.prototype, {
    obstacle(c, o) {
      c.save();
      c.translate(o.x, o.y);
      c.rotate(o.angle || 0);
      const r = o.r;
      if (o.type === "fuel") paintFuelObstacle(c, r);
      else if (o.type === "cargo") paintCargoObstacle(c, r);
      else paintWreckObstacle(c, r);
      c.restore();
    },
    pickup(c, p, t) {
      c.save();
      c.translate(p.x, p.y);
      const xp = p.type === "xp",
        color = xp
          ? "#77e9cc"
          : p.type === "repair"
            ? "#b9ec95"
            : p.type === "emp"
              ? "#e4b4ff"
              : "#83d9f1";
      if (xp) {
        c.rotate(Math.PI / 4);
        rect(c, -3, -3, 6, 6, color);
        rect(c, -6, -6, 12, 12, "#72dfc00c", "#72dfc02a");
      } else {
        circle(c, 0, 0, 16 + Math.sin(t * 5) * 2, "#071b23cc", color, 1.5);
        label(
          c,
          p.type === "repair" ? "+" : p.type === "emp" ? "E" : "S",
          0,
          5,
          color,
          16,
          "center",
        );
      }
      c.restore();
    },
  });
})();
