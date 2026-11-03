"use strict";
/* Keyboard and pointer input tracking plus global hotkeys. */
(() => {
  const B = window.BP;
  const DEFAULT_X = 640;
  const DEFAULT_Y = 560;
  const PRIMARY_BUTTON = 0;
  const MOVE_KEYS = [
    "KeyW",
    "KeyA",
    "KeyS",
    "KeyD",
    "ArrowUp",
    "ArrowDown",
    "ArrowLeft",
    "ArrowRight",
  ];
  // Cursor travel (px) that counts as deliberate mouse steering rather than
  // a resting hand nudging the mouse while flying on the keyboard.
  const MOUSE_SWITCH_TRAVEL = 12;
  // While flying on the keyboard the cursor is the aim, so it must not steal
  // steering until the movement keys have been idle this long (ms).
  const KEY_IDLE_MS = 1500;
  const FORM_TAGS = /^(INPUT|SELECT|TEXTAREA)$/;
  const UPGRADE_DIGIT = /^Digit[123]$/;
  const SCROLL_KEYS = [
    "Space",
    "ArrowUp",
    "ArrowDown",
    "ArrowLeft",
    "ArrowRight",
    "Tab",
  ];

  const handleHotkey = (g, code) => {
    if (code === "Escape" || code === "KeyP") g.togglePause();
    if (code === "KeyF") g.fullscreen();
    if (code === "Enter" && ["menu", "dead"].includes(g.mode)) g.start();
    if (UPGRADE_DIGIT.test(code) && g.mode === "upgrade")
      g.chooseUpgrade(Number(code.slice(-1)) - 1);
  };

  B.Input = class {
    constructor(canvas, g) {
      this.keys = new Set();
      this.x = DEFAULT_X;
      this.y = DEFAULT_Y;
      this.down = false;
      this.moved = false;
      // Which device is steering: whichever the player touched last.
      this.scheme = "mouse";
      this.travel = 0;
      this.lastMoveKey = -Infinity;
      this.bindPointer(canvas, g);
      this.bindKeyboard(g);
      this.bindFocus(g);
    }
    bindPointer(canvas, g) {
      const position = (e) => {
        const r = canvas.getBoundingClientRect();
        const x = ((e.clientX - r.left) * g.w) / r.width;
        const y = ((e.clientY - r.top) * g.h) / r.height;
        if (this.moved) this.travel += Math.hypot(x - this.x, y - this.y);
        this.x = x;
        this.y = y;
        this.moved = true;
        const keysIdle = performance.now() - this.lastMoveKey > KEY_IDLE_MS;
        if (this.travel > MOUSE_SWITCH_TRAVEL && keysIdle)
          this.scheme = "mouse";
      };
      window.addEventListener("pointermove", position);
      canvas.addEventListener("pointerdown", (e) => {
        if (e.button !== PRIMARY_BUTTON) return;
        position(e);
        this.down = true;
        canvas.setPointerCapture?.(e.pointerId);
        g.audio?.unlock();
      });
      window.addEventListener("pointerup", () => (this.down = false));
      window.addEventListener("pointercancel", () => this.clear());
    }
    bindKeyboard(g) {
      window.addEventListener("keydown", (e) => {
        if (FORM_TAGS.test(e.target.tagName)) return;
        if (SCROLL_KEYS.includes(e.code) && g.mode === "playing")
          e.preventDefault();
        this.keys.add(e.code);
        if (MOVE_KEYS.includes(e.code)) {
          this.scheme = "keyboard";
          this.travel = 0;
          this.lastMoveKey = performance.now();
        }
        if (e.repeat) return;
        handleHotkey(g, e.code);
      });
      window.addEventListener("keyup", (e) => {
        if (MOVE_KEYS.includes(e.code)) this.lastMoveKey = performance.now();
        // Firefox activates a focused button on Space *keyup*, which
        // keydown's preventDefault does not stop.
        if (e.code === "Space" && g.mode === "playing") e.preventDefault();
        this.keys.delete(e.code);
      });
    }
    bindFocus(g) {
      const suspend = () => {
        this.clear();
        if (g.mode === "playing") g.pause();
      };
      window.addEventListener("blur", suspend);
      document.addEventListener("visibilitychange", () => {
        if (document.hidden) suspend();
      });
    }
    has(...codes) {
      return codes.some((c) => this.keys.has(c));
    }
    clear() {
      this.keys.clear();
      this.down = false;
    }
  };
})();
