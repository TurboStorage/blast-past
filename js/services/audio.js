"use strict";
/* WebAudio synth engine that plays recipe-driven sound effects (B.Audio). */
(() => {
  const B = window.BP;
  const { RECIPES, THROTTLE } = B.AudioKit;
  const { tone, noise, sub } = B.AudioSynth;
  const CLEANUP_MARGIN_MS = 100;
  B.Audio = class {
    constructor(settings) {
      this.settings = settings || {};
      this.ctx = null;
      this.masterGain = null;
      this.compressor = null;
      this.voices = new Set();
      this.timers = new Set();
      this.last = Object.create(null);
      this.noiseBuffer = null;
      this.maxVoices = 28;
    }
    _master() {
      const v = Number(this.settings.master);
      return Number.isFinite(v) ? Math.max(0, Math.min(1, v)) : 0;
    }
    _sfx() {
      const v = Number(this.settings.sfx);
      return Number.isFinite(v) ? Math.max(0, Math.min(1, v)) : 0;
    }
    _level() {
      return this._master() * this._sfx();
    }
    sync() {
      if (!this.ctx || !this.masterGain) return false;
      const now = this.ctx.currentTime || 0,
        m = this._master();
      try {
        if (m <= 0 && this.masterGain.gain.setValueAtTime)
          this.masterGain.gain.setValueAtTime(0, now);
        else if (this.masterGain.gain.setTargetAtTime)
          this.masterGain.gain.setTargetAtTime(m, now, 0.01);
        else this.masterGain.gain.value = m;
        return true;
      } catch {
        return false;
      }
    }
    unlock() {
      if (!this._level()) return false;
      try {
        if (!this.ctx) {
          const C = window.AudioContext || window.webkitAudioContext;
          if (!C) return false;
          this.ctx = new C();
          this.masterGain = this.ctx.createGain();
          if (this.ctx.createDynamicsCompressor) {
            try {
              this.compressor = this.ctx.createDynamicsCompressor();
              this.compressor.threshold.value = -18;
              this.compressor.knee.value = 18;
              this.compressor.ratio.value = 8;
              this.compressor.attack.value = 0.003;
              this.compressor.release.value = 0.18;
              this.masterGain.connect(this.compressor);
              this.compressor.connect(this.ctx.destination);
            } catch {
              this.compressor = null;
              this.masterGain.connect(this.ctx.destination);
            }
          } else this.masterGain.connect(this.ctx.destination);
          this.sync();
        }
        if (this.ctx.resume) {
          const resumed = this.ctx.resume();
          if (resumed && resumed.catch) resumed.catch(() => {});
        }
        return true;
      } catch {
        return false;
      }
    }
    _noise() {
      if (this.noiseBuffer) return this.noiseBuffer;
      try {
        const c = this.ctx,
          n = Math.floor(c.sampleRate * 0.7),
          b = c.createBuffer(1, n, c.sampleRate),
          d = b.getChannelData(0);
        for (let i = 0; i < n; i++)
          d[i] = (Math.random() * 2 - 1) * (1 - i / n);
        return (this.noiseBuffer = b);
      } catch {
        return null;
      }
    }
    _buildVoiceNodes(recipe, now, level) {
      const sources = [];
      const disposables = [];
      const merge = (r) => {
        sources.push(...r.sources);
        disposables.push(...r.disposables);
      };
      merge(tone(this.ctx, recipe, now, level, this.masterGain));
      (recipe.tones || []).forEach((t) =>
        merge(
          tone(
            this.ctx,
            Object.assign({}, recipe, t),
            now,
            level,
            this.masterGain,
          ),
        ),
      );
      if (recipe.noise) {
        const noiseCfg = Object.assign({}, recipe, {
          vol: (recipe.vol || 0.1) * recipe.noise,
          filter: recipe.noiseFilter,
          dur: recipe.noiseDur || recipe.dur,
        });
        merge(
          noise(this.ctx, this._noise(), noiseCfg, now, level, this.masterGain),
        );
      }
      if (recipe.sub)
        merge(sub(this.ctx, recipe.sub, now, level, this.masterGain));
      const dur = Math.max(
        recipe.dur || 0,
        recipe.noise ? recipe.noiseDur || recipe.dur || 0 : 0,
        recipe.sub ? recipe.sub.dur || 0 : 0,
        ...(recipe.tones || []).map((t) => t.dur || recipe.dur || 0),
      );
      return { sources, disposables, dur };
    }
    _releaseVoice(token, disposables) {
      this.voices.delete(token);
      disposables.forEach((n) => {
        try {
          n.disconnect();
        } catch {}
      });
    }
    _scheduleVoiceCleanup(token, voiceNodes) {
      const { sources, disposables, dur } = voiceNodes;
      let remaining = sources.length,
        finished = false,
        timer = null;
      const finish = (force) => {
        if (finished) return;
        if (!force && --remaining > 0) return;
        finished = true;
        if (timer !== null) {
          clearTimeout(timer);
          this.timers.delete(timer);
        }
        this._releaseVoice(token, disposables);
      };
      sources.forEach((s) => {
        s.onended = () => finish(false);
      });
      try {
        timer = setTimeout(
          () => finish(true),
          Math.ceil((dur || 0.1) * 1000) + CLEANUP_MARGIN_MS,
        );
        this.timers.add(timer);
      } catch {}
      if (!sources.length) finish(true);
    }
    play(name) {
      const c = this.ctx;
      if (c && this.masterGain) this.sync();
      const level = this._sfx();
      if (!this._master() || !level || !c || !this.masterGain) return false;
      const recipe = RECIPES[name] || RECIPES.ui,
        now = c.currentTime || 0;
      if (!this._canFire(name, now)) return false;
      const token = {};
      try {
        this.voices.add(token);
        const nodes = this._buildVoiceNodes(recipe, now, level);
        this._scheduleVoiceCleanup(token, nodes);
        return true;
      } catch {
        this.voices.delete(token);
        return false;
      }
    }
    _canFire(name, now) {
      const last = this.last[name] === undefined ? -Infinity : this.last[name];
      if (
        now - last < (THROTTLE[name] || 0) ||
        this.voices.size >= this.maxVoices
      )
        return false;
      this.last[name] = now;
      return true;
    }
  };
})();
