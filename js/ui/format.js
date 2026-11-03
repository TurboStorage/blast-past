"use strict";
/* UI formatting helpers (HTML escape, number format, weapon names) on the internal B.UIKit namespace. */
(() => {
  const B = window.BP,
    esc = (v) =>
      String(v ?? "").replace(
        /[&<>"']/g,
        (c) =>
          ({
            "&": "&amp;",
            "<": "&lt;",
            ">": "&gt;",
            '"': "&quot;",
            "'": "&#39;",
          })[c],
      ),
    num = (n) => Math.round(n || 0).toLocaleString(),
    names = {
      minigun: "MINIGUN",
      rockets: "ROCKET PODS",
      missiles: "HUNTER MISSILES",
      arc: "ARC CANNON",
      drones: "ESCORT DRONES",
      EMP: "EMP",
      components: "COMPONENTS",
      fuel: "FUEL BLAST",
    };
  B.UIKit = { esc, num, names };
})();
