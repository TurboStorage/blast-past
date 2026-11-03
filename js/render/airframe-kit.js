"use strict";
/*
 * Painting kit for plan-view airframes. Light comes from the upper left, which
 * matches the shadow direction in aircraft.js. Every helper takes a livery
 * palette from B.Liveries and draws in the airframe's local frame (nose -y).
 */
(() => {
  const B = window.BP;
  const TAU = Math.PI * 2;

  function dedupe(points) {
    return points.filter(
      (p, i) =>
        i === 0 || p[0] !== points[i - 1][0] || p[1] !== points[i - 1][1],
    );
  }

  // Closed Catmull-Rom spline through the points, as cubic Bezier segments.
  function smooth(c, points, tension = 1) {
    const pts = dedupe(points),
      n = pts.length,
      k = tension / 6;
    c.beginPath();
    c.moveTo(pts[0][0], pts[0][1]);
    for (let i = 0; i < n; i++) {
      const p0 = pts[(i - 1 + n) % n],
        p1 = pts[i],
        p2 = pts[(i + 1) % n],
        p3 = pts[(i + 2) % n];
      c.bezierCurveTo(
        p1[0] + (p2[0] - p0[0]) * k,
        p1[1] + (p2[1] - p0[1]) * k,
        p2[0] - (p3[0] - p1[0]) * k,
        p2[1] - (p3[1] - p1[1]) * k,
        p2[0],
        p2[1],
      );
    }
    c.closePath();
  }

  // Symmetric outline from centreline stations [[y, halfWidth], ...] nose to tail.
  function stations(c, list, x = 0) {
    const right = list.map(([y, w]) => [x + w, y]);
    const left = list
      .slice()
      .reverse()
      .map(([y, w]) => [x - w, y]);
    smooth(c, [...right, ...left]);
  }

  function polygon(c, points) {
    c.beginPath();
    points.forEach(([x, y], i) => (i ? c.lineTo(x, y) : c.moveTo(x, y)));
    c.closePath();
  }

  // Cylinder-like shading across the width: lit on the left, shaded on the right.
  function shade(c, pal, x0, x1) {
    const g = c.createLinearGradient(x0, 0, x1, 0);
    g.addColorStop(0, pal.dark);
    g.addColorStop(0.28, pal.light);
    g.addColorStop(0.55, pal.base);
    g.addColorStop(1, pal.dark);
    return g;
  }

  function finish(c, fill, pal, width = 1) {
    c.fillStyle = fill;
    c.fill();
    c.strokeStyle = pal.outline;
    c.lineWidth = width;
    c.stroke();
  }

  function widest(list) {
    return Math.max(...list.map(([, w]) => w));
  }

  const Kit = {
    TAU,
    smooth,
    stations,
    polygon,
    shade,

    // Shaded fuselage or boom from stations; returns the path for later clipping.
    hull(c, pal, list, x = 0) {
      const w = widest(list);
      stations(c, list, x);
      finish(c, shade(c, pal, x - w, x + w), pal);
      return () => stations(c, list, x);
    },

    // Shaded free-form panel (wings, sponsons, nacelles) from a polygon.
    plate(c, pal, points, rounded = false) {
      const xs = points.map((p) => p[0]);
      if (rounded) smooth(c, points, 0.6);
      else polygon(c, points);
      finish(c, shade(c, pal, Math.min(...xs), Math.max(...xs)), pal);
    },

    // Glazing: gradient glass, frame outline, and a soft glint on the lit side.
    glass(c, pal, points, rounded = true) {
      const ys = points.map((p) => p[1]),
        xs = points.map((p) => p[0]);
      const y0 = Math.min(...ys),
        y1 = Math.max(...ys),
        x0 = Math.min(...xs),
        x1 = Math.max(...xs);
      const g = c.createLinearGradient(x0, y0, x1, y1);
      g.addColorStop(0, pal.glass[0]);
      g.addColorStop(0.4, pal.glass[1]);
      g.addColorStop(1, pal.glass[2]);
      if (rounded) smooth(c, points, 0.7);
      else polygon(c, points);
      c.fillStyle = g;
      c.fill();
      c.strokeStyle = pal.frame;
      c.lineWidth = 0.8;
      c.stroke();
      c.save();
      c.clip();
      c.fillStyle = "#ffffff38";
      c.beginPath();
      c.ellipse(
        x0 + (x1 - x0) * 0.3,
        y0 + (y1 - y0) * 0.3,
        (x1 - x0) * 0.18,
        (y1 - y0) * 0.3,
        -0.3,
        0,
        TAU,
      );
      c.fill();
      c.restore();
    },

    // Thin panel lines: [[x0, y0, x1, y1], ...].
    lines(c, color, segments, width = 0.6) {
      c.strokeStyle = color;
      c.lineWidth = width;
      c.beginPath();
      for (const [a, b, d, e] of segments) {
        c.moveTo(a, b);
        c.lineTo(d, e);
      }
      c.stroke();
    },

    // Vertical fin seen from above: a thin slab along the boom axis.
    fin(c, pal, x, y0, y1, half) {
      stations(
        c,
        [
          [y0, 0.2],
          [y0 + (y1 - y0) * 0.25, half],
          [y1 - (y1 - y0) * 0.1, half],
          [y1, 0.3],
        ],
        x,
      );
      finish(c, pal.dark, pal, 0.8);
      c.strokeStyle = pal.spine;
      c.lineWidth = 0.6;
      c.beginPath();
      c.moveTo(x - half * 0.3, y0 + 1);
      c.lineTo(x - half * 0.3, y1 - 1);
      c.stroke();
    },

    // Horizontal stabilizer / stabilator spanning both sides of x = 0.
    stabilizer(c, pal, y, span, chord, sweep = 0) {
      const h = span / 2;
      Kit.plate(c, pal, [
        [-2, y],
        [-h, y + sweep],
        [-h, y + sweep + chord * 0.8],
        [-2, y + chord],
        [2, y + chord],
        [h, y + sweep + chord * 0.8],
        [h, y + sweep],
        [2, y],
      ]);
    },

    // One stub wing on `side` (-1 port, 1 starboard). Droop darkens the tip.
    wing(c, pal, side, root, tip) {
      const [rx, ry0, ry1] = root,
        [tx, ty0, ty1] = tip;
      const pts = [
        [side * rx, ry0],
        [side * tx, ty0],
        [side * tx, ty1],
        [side * rx, ry1],
      ];
      Kit.plate(c, pal, pts);
    },

    // Store body seen from above (rocket pod, fuel tank, gun pod): nose at -y.
    pod(c, pal, x, y, length, radius, tubes = 0) {
      const g = c.createLinearGradient(x - radius, 0, x + radius, 0);
      g.addColorStop(0, pal.storeDark);
      g.addColorStop(0.35, pal.store);
      g.addColorStop(1, pal.storeDark);
      stations(
        c,
        [
          [y - length / 2, radius * 0.55],
          [y - length / 2 + radius * 0.6, radius],
          [y + length / 2 - 1, radius],
          [y + length / 2, radius * 0.6],
        ],
        x,
      );
      c.fillStyle = g;
      c.fill();
      c.strokeStyle = pal.outline;
      c.lineWidth = 0.7;
      c.stroke();
      if (tubes) {
        c.fillStyle = pal.storeTip;
        c.fillRect(x - radius * 0.7, y - length / 2 + 0.4, radius * 1.4, 0.9);
      }
    },

    // Slim missile or rocket with cruciform fins, nose at -y.
    missile(c, pal, x, y, length, width = 1.4) {
      c.fillStyle = pal.store;
      c.fillRect(x - width / 2, y - length / 2, width, length);
      c.fillStyle = pal.storeTip;
      c.fillRect(x - width / 2, y - length / 2, width, 1.2);
      c.fillStyle = pal.storeDark;
      c.fillRect(x - width * 1.3, y + length / 2 - 1.6, width * 2.6, 1);
    },

    // Round intake, exhaust, sensor ball or hub cap with a lit rim.
    disc(c, pal, x, y, r, fill = pal.accent) {
      c.beginPath();
      c.arc(x, y, r, 0, TAU);
      c.fillStyle = fill;
      c.fill();
      c.strokeStyle = pal.outline;
      c.lineWidth = 0.6;
      c.stroke();
      c.beginPath();
      c.arc(x - r * 0.3, y - r * 0.3, r * 0.35, 0, TAU);
      c.fillStyle = "#ffffff26";
      c.fill();
    },

    // Soot streak behind an exhaust, fading aft.
    soot(c, x, y, width, length) {
      const g = c.createLinearGradient(0, y, 0, y + length);
      g.addColorStop(0, "#15171acc");
      g.addColorStop(1, "#15171a00");
      c.fillStyle = g;
      c.fillRect(x - width / 2, y, width, length);
    },

    // Seeded disruptive camouflage clipped to a path callback.
    camo(c, pal, clipPath, box, seed = 1) {
      if (!pal.camo) return;
      let s = seed * 9301 + 49297;
      const rand = () => (s = (s * 9301 + 49297) % 233280) / 233280;
      c.save();
      clipPath();
      c.clip();
      const [x0, y0, x1, y1] = box;
      for (let i = 0; i < 14; i++) {
        c.fillStyle = pal.camo[i % pal.camo.length];
        const x = x0 + rand() * (x1 - x0),
          y = y0 + rand() * (y1 - y0),
          r = 2.5 + rand() * 4.5;
        smooth(c, [
          [x - r, y],
          [x - r * 0.3, y - r * 0.8],
          [x + r * 0.7, y - r * 0.5],
          [x + r, y + r * 0.2],
          [x + r * 0.2, y + r * 0.9],
          [x - r * 0.6, y + r * 0.6],
        ]);
        c.fill();
      }
      c.restore();
    },

    // Lit spine highlight along the top of a fuselage.
    spine(c, pal, y0, y1, x = -1) {
      c.strokeStyle = pal.spine;
      c.lineWidth = 1;
      c.beginPath();
      c.moveTo(x, y0);
      c.lineTo(x, y1);
      c.stroke();
    },
  };
  B.Kit = Kit;
})();
