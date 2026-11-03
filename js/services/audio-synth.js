"use strict";
/* Stateless WebAudio DSP builders shared by B.Audio (internal B.AudioSynth).
 * Every builder takes a live AudioContext, a config object, the current
 * `now` time, the resolved output `level` (0-1), and a `dest` node to
 * connect into. It returns { sources, disposables }:
 *   sources     nodes with a lifecycle end event (osc/bufferSource) —
 *               used by the caller to know when the voice has finished.
 *   disposables every node created, for eventual .disconnect().
 */
(() => {
  const B = window.BP;
  const driveCache = new Map();

  function driveCurve(amount) {
    const amt = Math.max(0, Math.min(1, amount));
    const key = Math.round(amt * 100);
    if (driveCache.has(key)) return driveCache.get(key);
    const k = key * 1.5;
    const n = 256;
    const curve = new Float32Array(n);
    for (let i = 0; i < n; i++) {
      const x = (i / (n - 1)) * 2 - 1;
      curve[i] = ((1 + k / 100) * x) / (1 + (k / 100) * Math.abs(x));
    }
    driveCache.set(key, curve);
    return curve;
  }

  function tone(ctx, cfg, now, level, dest) {
    const dur = cfg.dur || 0.1;
    const unison = Math.max(1, Math.floor(cfg.unison || 1));
    const detuneCents = cfg.detune || 0;
    const spread = unison > 1 ? cfg.spread || 0 : 0;
    const sources = [];
    const disposables = [];

    const gainNode = ctx.createGain();
    gainNode.gain.setValueAtTime(0.0001, now);
    gainNode.gain.linearRampToValueAtTime(
      Math.max(0.0001, (cfg.vol || 0.1) * level),
      now + 0.008,
    );
    gainNode.gain.exponentialRampToValueAtTime(0.0001, now + dur);
    disposables.push(gainNode);
    gainNode.connect(dest);

    let chainHead = gainNode;
    if (cfg.drive) {
      const driveNode = ctx.createWaveShaper();
      driveNode.curve = driveCurve(cfg.drive);
      driveNode.oversample = "2x";
      driveNode.connect(chainHead);
      disposables.push(driveNode);
      chainHead = driveNode;
    }
    if (cfg.filter) {
      const filterNode = ctx.createBiquadFilter();
      filterNode.type = cfg.filter.type || "lowpass";
      filterNode.Q.value = cfg.filter.q != null ? cfg.filter.q : 1;
      const from = Math.max(20, cfg.filter.from || 2000);
      const to = Math.max(20, cfg.filter.to || from);
      filterNode.frequency.setValueAtTime(from, now);
      filterNode.frequency.exponentialRampToValueAtTime(to, now + dur);
      filterNode.connect(chainHead);
      disposables.push(filterNode);
      chainHead = filterNode;
    }

    for (let i = 0; i < unison; i++) {
      const o = ctx.createOscillator();
      o.type = cfg.type || "triangle";
      const centerOffset = unison > 1 ? i / (unison - 1) - 0.5 : 0;
      const wobble = 1 + (Math.random() - 0.5) * 0.07;
      const ratio = Math.pow(2, (centerOffset * detuneCents) / 1200) * wobble;
      o.frequency.setValueAtTime(Math.max(20, (cfg.from || 120) * ratio), now);
      o.frequency.exponentialRampToValueAtTime(
        Math.max(20, (cfg.to || 40) * ratio),
        now + dur,
      );
      disposables.push(o);
      sources.push(o);
      let node = o;
      if (spread && ctx.createStereoPanner) {
        const panNode = ctx.createStereoPanner();
        panNode.pan.value = Math.max(
          -1,
          Math.min(1, centerOffset * 2 * spread),
        );
        o.connect(panNode);
        disposables.push(panNode);
        node = panNode;
      }
      node.connect(chainHead);
      o.start(now);
      o.stop(now + dur + 0.015);
    }
    return { sources, disposables };
  }

  function noise(ctx, buffer, cfg, now, level, dest) {
    if (!buffer) return { sources: [], disposables: [] };
    const dur = cfg.dur || 0.2;
    const src = ctx.createBufferSource();
    src.buffer = buffer;
    const gainNode = ctx.createGain();
    gainNode.gain.setValueAtTime(
      Math.max(0.0001, (cfg.vol || 0.1) * level * 0.5),
      now,
    );
    gainNode.gain.exponentialRampToValueAtTime(0.0001, now + dur);
    const disposables = [src, gainNode];
    let tail = src;
    if (cfg.filter) {
      const filterNode = ctx.createBiquadFilter();
      filterNode.type = cfg.filter.type || "bandpass";
      filterNode.Q.value = cfg.filter.q != null ? cfg.filter.q : 1;
      const from = Math.max(20, cfg.filter.from || 1000);
      const to = Math.max(20, cfg.filter.to || from);
      filterNode.frequency.setValueAtTime(from, now);
      filterNode.frequency.exponentialRampToValueAtTime(to, now + dur);
      disposables.push(filterNode);
      tail.connect(filterNode);
      tail = filterNode;
    }
    tail.connect(gainNode);
    gainNode.connect(dest);
    src.start(now);
    src.stop(now + dur + 0.015);
    return { sources: [src], disposables };
  }

  function sub(ctx, cfg, now, level, dest) {
    const dur = cfg.dur || 0.15;
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = "sine";
    o.frequency.setValueAtTime(Math.max(20, cfg.from || 90), now);
    o.frequency.exponentialRampToValueAtTime(
      Math.max(20, cfg.to || 35),
      now + dur,
    );
    g.gain.setValueAtTime(0.0001, now);
    g.gain.linearRampToValueAtTime(
      Math.max(0.0001, (cfg.vol || 0.15) * level),
      now + 0.004,
    );
    g.gain.exponentialRampToValueAtTime(0.0001, now + dur);
    o.connect(g);
    g.connect(dest);
    o.start(now);
    o.stop(now + dur + 0.015);
    return { sources: [o], disposables: [o, g] };
  }

  B.AudioSynth = { tone, noise, sub, driveCurve };
})();
