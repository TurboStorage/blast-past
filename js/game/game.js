"use strict";
/* B.Game class: construction, frame loop, test hooks, lifecycle, tick update. */
(() => {
  const B = window.BP;
  const BASE_WIDTH = 1280;
  const LOGICAL_HEIGHT = 720;
  const MIN_ASPECT = 0.65;
  const MAX_ASPECT = 2.4;
  const FALLBACK_ASPECT = 16 / 9; // window not laid out yet (0x0 tab/pane)
  const MAX_DPR = 2;
  const MAX_FRAME_DT = 0.1;
  const WAVE_DURATION = 30;
  const FIRST_XP_THRESHOLD = 35;
  const START_BANNER = "WAVE 01 / SCOUT PATROL";
  const START_BANNER_TIME = 2.5;
  const SHAKE_DECAY = 25;
  const SLOWMO_SCALE = 0.3;
  const DETONATION_COLOR = "#ffc589";
  const DETONATION_PARTICLES = 16;
  const DETONATION_PARTICLE_SIZE = 6;
  const ENEMY_EXIT_MARGIN = 100;
  const CONTACT_DAMAGE = 15;
  const BOSS_CONTACT_DAMAGE = 25;
  const OVERLAY_MODES = ["settings", "help", "stats"];

  B.Game = class {
    constructor(canvas) {
      this.canvas = canvas;
      this.w = BASE_WIDTH;
      this.h = LOGICAL_HEIGHT;
      this.mode = "menu";
      this.visualTime = 0;
      this.rng = new B.RNG();
      this.saved = B.Persistence.load();
      this.settings = Object.assign(
        {},
        B.DEFAULT_SETTINGS,
        this.saved.settings,
      );
      this.audio = new B.Audio(this.settings);
      this.input = new B.Input(canvas, this);
      this.reset();
      this.renderer = new B.Renderer(canvas);
      this.ui = new B.UI(this);
      this.resize();
      window.addEventListener("resize", () => this.resize());
      this.startFrameLoop();
      this.installTestHooks();
    }
    startFrameLoop() {
      this.last = performance.now();
      this.accumulator = 0;
      const frame = (now) => {
        const dt = Math.min(MAX_FRAME_DT, (now - this.last) / 1000);
        this.last = now;
        if (!this.manual) {
          this.accumulator += dt;
          while (this.accumulator >= B.Config.FIXED_DT) {
            this.update(B.Config.FIXED_DT);
            this.accumulator -= B.Config.FIXED_DT;
          }
        }
        this.render();
        requestAnimationFrame(frame);
      };
      requestAnimationFrame(frame);
    }
    installTestHooks() {
      window.render_game_to_text = () => JSON.stringify(this.snapshot());
      window.advanceTime = (ms) => {
        this.manual = true;
        for (let n = 0; n < Math.ceil(ms / (1000 * B.Config.FIXED_DT)); n++)
          this.update(B.Config.FIXED_DT);
        this.render();
      };
    }
    resize() {
      const aspect =
        innerWidth > 0 && innerHeight > 0
          ? innerWidth / innerHeight
          : FALLBACK_ASPECT;
      const ratio = B.clamp(aspect, MIN_ASPECT, MAX_ASPECT);
      this.w = Math.round(LOGICAL_HEIGHT * ratio);
      this.h = LOGICAL_HEIGHT;
      const dpr = Math.min(devicePixelRatio || 1, MAX_DPR);
      this.canvas.width = Math.round(this.w * dpr);
      this.canvas.height = Math.round(this.h * dpr);
      this.renderer?.resize(this.w, this.h, dpr);
      if (this.player) this.clampPlayerToView();
    }
    clampPlayerToView() {
      this.player.x = B.clamp(
        this.player.x,
        B.Config.PLAYER_MARGIN_X,
        this.w - B.Config.PLAYER_MARGIN_X,
      );
      this.player.y = B.clamp(
        this.player.y,
        B.Config.PLAYER_MARGIN_TOP,
        this.h - B.Config.PLAYER_MARGIN_BOTTOM,
      );
    }
    reset(seed) {
      this.rng = new B.RNG(seed);
      this.player = new B.Player(this);
      this.enemies = [];
      this.projectiles = [];
      this.particles = [];
      this.pickups = [];
      this.obstacles = [];
      this.effects = [];
      this.warnings = [];
      this.beams = [];
      this.score = 0;
      this.kills = 0;
      this.damage = 0;
      this.bossKills = 0;
      this.time = 0;
      this.wave = 1;
      this.waveTime = WAVE_DURATION;
      this.level = 1;
      this.xp = 0;
      this.xpNext = FIRST_XP_THRESHOLD;
      this.pendingLevels = 0;
      this.combo = 0;
      this.comboTime = 0;
      this.maxCombo = 0;
      this.shake = 0;
      this.slowmo = 0;
      this.banner = "";
      this.bannerTime = 0;
      this.weaponDamage = {};
      this.uid = 0;
      this.director = null;
      this.offers = [];
      this.resultSaved = false;
    }
    start(seed) {
      this.audio.unlock();
      this.reset(typeof seed === "number" ? seed : undefined);
      this.input.clear();
      document.activeElement?.blur?.();
      this.mode = "playing";
      this.banner = START_BANNER;
      this.bannerTime = START_BANNER_TIME;
      this.director = new B.Director(this);
      this.ui.refresh();
    }
    pause() {
      if (this.mode === "playing") {
        this.mode = "paused";
        this.input.clear();
        this.ui.refresh();
      }
    }
    togglePause() {
      if (this.mode === "playing") this.pause();
      else if (this.mode === "paused") {
        this.mode = "playing";
        this.input.clear();
        this.ui.refresh();
      } else if (OVERLAY_MODES.includes(this.mode)) this.ui.close();
    }
    fullscreen() {
      try {
        if (document.fullscreenElement)
          document.exitFullscreen()?.catch(() => {});
        else document.documentElement.requestFullscreen()?.catch(() => {});
      } catch {}
    }
    update(dt) {
      this.visualTime += dt;
      this.shake = Math.max(0, this.shake - dt * SHAKE_DECAY);
      this.updateParticles(dt);
      this.updateEffects(dt);
      if (this.mode !== "playing") return;
      const simDt = this.applySlowmo(dt);
      this.tickTimers(simDt);
      this.player.update(this, simDt);
      B.Weapons.update(this, simDt);
      if (this.director) this.director.update(simDt);
      this.updateEnemies(simDt);
      B.Attitude.update(this, simDt);
      if (this.mode !== "playing") return;
      this.updateProjectiles(simDt);
      if (this.mode !== "playing") return;
      this.updatePickups(simDt);
      B.Environment.update(this, simDt);
      this.enemies = this.enemies.filter((e) => !e.dead);
      if (this.mode === "playing" && this.pendingLevels) this.openUpgrade();
    }
    updateParticles(dt) {
      for (const p of this.particles) {
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.life -= dt;
      }
      this.particles = this.particles.filter((p) => p.life > 0);
    }
    updateEffects(dt) {
      for (const e of this.effects) {
        if (e.delay > 0) {
          e.delay -= dt;
          if (e.delay <= 0 && e.type === "detonation") {
            this.burst(
              e.x,
              e.y,
              DETONATION_COLOR,
              DETONATION_PARTICLES,
              DETONATION_PARTICLE_SIZE,
            );
            this.audio.play("explosion");
          }
        } else e.life -= dt;
      }
      this.effects = this.effects.filter((e) => e.life > 0);
    }
    applySlowmo(dt) {
      if (this.slowmo <= 0) return dt;
      this.slowmo -= dt;
      return dt * SLOWMO_SCALE;
    }
    tickTimers(dt) {
      this.time += dt;
      this.bannerTime = Math.max(0, this.bannerTime - dt);
      this.comboTime -= dt;
      if (this.comboTime <= 0) this.combo = 0;
    }
    updateEnemies(dt) {
      for (const e of this.enemies) {
        if (e.dead) continue;
        this.updateEnemy(e, dt);
        if (this.mode !== "playing") break;
      }
    }
    updateEnemy(e, dt) {
      e.age += dt;
      e.flash = Math.max(0, e.flash - dt);
      e.warning = Math.max(0, e.warning - dt);
      if (e.warning > 0) return;
      B.Encounters.update(this, e, dt);
      if (e.y > this.h + ENEMY_EXIT_MARGIN) e.dead = true;
      if (B.distance(e, this.player) < e.r + this.player.r)
        this.hurt(e.boss ? BOSS_CONTACT_DAMAGE : CONTACT_DAMAGE);
    }
    render() {
      this.audio.sync?.();
      this.renderer.draw(this);
      this.ui?.tick();
    }
  };
})();
