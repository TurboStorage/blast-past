// Minimal WebAudio node graph fake, just enough surface area for
// js/services/audio-synth.js and js/services/audio.js to run under
// node:vm without a real browser AudioContext.

class MockParam {
  constructor(value) {
    this.value = value;
    this.calls = [];
  }
  setValueAtTime(v, t) {
    this.value = v;
    this.calls.push(["setValueAtTime", v, t]);
    return this;
  }
  linearRampToValueAtTime(v, t) {
    this.value = v;
    this.calls.push(["linearRampToValueAtTime", v, t]);
    return this;
  }
  exponentialRampToValueAtTime(v, t) {
    this.value = v;
    this.calls.push(["exponentialRampToValueAtTime", v, t]);
    return this;
  }
}

class MockNode {
  constructor(ctx, kind) {
    this.ctx = ctx;
    this.kind = kind;
    this.connections = [];
    this.disconnected = false;
    ctx.nodes.push(this);
  }
  connect(dest) {
    this.connections.push(dest);
    return dest;
  }
  disconnect() {
    this.disconnected = true;
  }
}

class MockOscillator extends MockNode {
  constructor(ctx) {
    super(ctx, "oscillator");
    this.type = "sine";
    this.frequency = new MockParam(440);
    this.detune = new MockParam(0);
    this.started = false;
    this.stopped = false;
    this.onended = null;
  }
  start(t) {
    this.started = true;
    this.startTime = t;
  }
  stop(t) {
    this.stopped = true;
    this.stopTime = t;
  }
  end() {
    if (this.onended) this.onended();
  }
}

class MockGain extends MockNode {
  constructor(ctx) {
    super(ctx, "gain");
    this.gain = new MockParam(1);
  }
}

class MockBiquadFilter extends MockNode {
  constructor(ctx) {
    super(ctx, "biquad");
    this.type = "lowpass";
    this.frequency = new MockParam(350);
    this.Q = new MockParam(1);
  }
}

class MockWaveShaper extends MockNode {
  constructor(ctx) {
    super(ctx, "waveshaper");
    this.curve = null;
    this.oversample = "none";
  }
}

class MockStereoPanner extends MockNode {
  constructor(ctx) {
    super(ctx, "panner");
    this.pan = new MockParam(0);
  }
}

class MockBufferSource extends MockNode {
  constructor(ctx) {
    super(ctx, "bufferSource");
    this.buffer = null;
    this.started = false;
    this.stopped = false;
    this.onended = null;
  }
  start(t) {
    this.started = true;
    this.startTime = t;
  }
  stop(t) {
    this.stopped = true;
    this.stopTime = t;
  }
  end() {
    if (this.onended) this.onended();
  }
}

class MockAudioBuffer {
  constructor(channels, length, sampleRate) {
    this.length = length;
    this.sampleRate = sampleRate;
    this._data = new Float32Array(length);
  }
  getChannelData() {
    return this._data;
  }
}

class MockCompressor extends MockNode {
  constructor(ctx) {
    super(ctx, "compressor");
    this.threshold = new MockParam(-24);
    this.knee = new MockParam(30);
    this.ratio = new MockParam(12);
    this.attack = new MockParam(0.003);
    this.release = new MockParam(0.25);
  }
}

export class MockAudioContext {
  constructor() {
    this.nodes = [];
    this.currentTime = 0;
    this.sampleRate = 44100;
    this.destination = { connect() {}, disconnect() {} };
    this.resumed = false;
  }
  createOscillator() {
    return new MockOscillator(this);
  }
  createGain() {
    return new MockGain(this);
  }
  createBiquadFilter() {
    return new MockBiquadFilter(this);
  }
  createWaveShaper() {
    return new MockWaveShaper(this);
  }
  createStereoPanner() {
    return new MockStereoPanner(this);
  }
  createBufferSource() {
    return new MockBufferSource(this);
  }
  createBuffer(channels, length, sampleRate) {
    return new MockAudioBuffer(channels, length, sampleRate);
  }
  createDynamicsCompressor() {
    return new MockCompressor(this);
  }
  resume() {
    this.resumed = true;
    return Promise.resolve();
  }
}
