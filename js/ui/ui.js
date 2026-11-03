"use strict";
/* B.UI class core: DOM wiring, overlay view routing (refresh), openOverlay and close. */
(() => {
  const B = window.BP,
    SUB_OVERLAYS = ["settings", "stats", "help"];
  B.UI = class {
    constructor(g) {
      this.g = g;
      this.root = document.getElementById("overlay");
      this.hud = document.getElementById("hud");
      this.returnMode = "menu";
      this.hudClock = -Infinity;
      this.bind();
      this.refresh();
    }
    bind() {
      this.root.addEventListener("click", (e) => this.onClick(e));
      this.root.addEventListener("input", (e) => this.onSettingInput(e));
      this.root.addEventListener("change", (e) => {
        if (e.target.dataset.setting) this.g.save();
      });
      document
        .getElementById("quickPause")
        ?.addEventListener("click", () => this.g.pause());
    }
    onClick(e) {
      const t = e.target.closest("[data-action]"),
        a = t?.dataset.action,
        g = this.g;
      if (!a) return;
      g.audio.unlock();
      if (a === "deploy" || a === "restart") return g.start();
      if (a === "resume") return g.togglePause();
      if (a === "pause") return g.pause();
      if (a === "upgrade") return g.chooseUpgrade(+t.dataset.index);
      if (a === "fullscreen") return g.fullscreen();
      if (a === "close") return this.close();
      if (SUB_OVERLAYS.includes(a)) this.openOverlay(a);
    }
    onSettingInput(e) {
      const i = e.target,
        k = i.dataset.setting,
        s = this.g.settings;
      if (!k) return;
      s[k] = +i.value;
      const o = i.closest(".setting-row")?.querySelector("output");
      if (o) o.value = Math.round(s[k] * 100) + "%";
    }
    /* The only place the UI writes g.mode: entering or leaving a sub-overlay. */
    setOverlayMode(mode) {
      this.g.mode = mode;
      this.refresh();
    }
    /* Opens settings/stats/help and remembers where BACK should return to. */
    openOverlay(mode) {
      const current = this.g.mode;
      this.returnMode = current === "playing" ? "paused" : current;
      this.setOverlayMode(mode);
    }
    close() {
      this.setOverlayMode(this.returnMode || "menu");
    }
    views() {
      return {
        menu: () => this.menu(),
        paused: () => this.pause(),
        upgrade: () => this.upgrade(),
        dead: () => this.results(),
        settings: () => this.settings(),
        help: () => this.help(),
        stats: () => this.stats(),
      };
    }
    refresh() {
      const m = this.g.mode,
        views = this.views();
      this.root.innerHTML = views[m] ? views[m]() : "";
      this.root.className = "overlay " + m;
      this.root.hidden = !views[m];
      this.hud.hidden = m !== "playing";
      if (m === "playing") this.hudClock = -Infinity;
    }
  };
})();
