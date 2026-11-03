"use strict";
/* Seeded pseudo-random number generator (mulberry32). */
(() => {
  const B = window.BP;
  B.RNG = class {
    constructor(seed = Date.now()) {
      this.state = seed >>> 0 || 1;
    }
    next() {
      let t = (this.state += 0x6d2b79f5);
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    }
    range(a, b) {
      return a + this.next() * (b - a);
    }
    pick(a) {
      return a[Math.floor(this.next() * a.length)];
    }
  };
})();
