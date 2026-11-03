"use strict";
/* Shared canvas primitives for the renderer files, exposed internally as B.Draw. */
(() => {
  const B = window.BP,
    TAU = Math.PI * 2;
  const poly = (c, points, fill, stroke, width = 1) => {
    c.beginPath();
    points.forEach(([x, y], i) => (i ? c.lineTo(x, y) : c.moveTo(x, y)));
    c.closePath();
    if (fill) {
      c.fillStyle = fill;
      c.fill();
    }
    if (stroke) {
      c.strokeStyle = stroke;
      c.lineWidth = width;
      c.stroke();
    }
  };
  const rect = (c, x, y, w, h, fill, stroke) => {
    c.fillStyle = fill;
    c.fillRect(x, y, w, h);
    if (stroke) {
      c.strokeStyle = stroke;
      c.lineWidth = 1;
      c.strokeRect(x, y, w, h);
    }
  };
  const circle = (c, x, y, r, fill, stroke, width = 1) => {
    c.beginPath();
    c.arc(x, y, Math.max(0, r), 0, TAU);
    if (fill) {
      c.fillStyle = fill;
      c.fill();
    }
    if (stroke) {
      c.strokeStyle = stroke;
      c.lineWidth = width;
      c.stroke();
    }
  };
  const label = (
    c,
    text,
    x,
    y,
    color = "#a6c3bb",
    size = 10,
    align = "left",
  ) => {
    c.fillStyle = color;
    c.font = `${size}px Consolas, monospace`;
    c.textAlign = align;
    c.fillText(text, x, y);
  };
  B.Draw = { TAU, poly, rect, circle, label };
})();
