// All sound is synthesised with the Web Audio API — no audio files.
export class AudioEngine {
  constructor() {
    this.ctx = null;
    this.started = false;
    this.heartTimer = null;
    this.heartRate = 0;      // beats per second target (0 = silent)
    this.chaseTimer = null;
    this.ambientTimer = null;
    this.nodes = {};
  }

  init() {
    if (this.ctx) { this.ctx.resume?.(); return; }
    const Ctx = window.AudioContext || window.webkitAudioContext;
    this.ctx = new Ctx();
    const ctx = this.ctx;

    this.master = ctx.createGain();
    this.master.gain.value = 0.9;
    this.master.connect(ctx.destination);

    // convolution reverb (generated impulse)
    this.reverb = ctx.createConvolver();
    this.reverb.buffer = this._impulse(2.6, 3.2);
    this.reverbGain = ctx.createGain();
    this.reverbGain.gain.value = 0.4;
    this.reverb.connect(this.reverbGain).connect(this.master);

    this.dry = ctx.createGain();
    this.dry.gain.value = 1.0;
    this.dry.connect(this.master);
  }

  _out(node, wet = 0.3) {
    node.connect(this.dry);
    const g = this.ctx.createGain();
    g.gain.value = wet;
    node.connect(g).connect(this.reverb);
  }

  _impulse(seconds, decay) {
    const ctx = this.ctx;
    const rate = ctx.sampleRate;
    const len = rate * seconds;
    const buf = ctx.createBuffer(2, len, rate);
    for (let ch = 0; ch < 2; ch++) {
      const d = buf.getChannelData(ch);
      for (let i = 0; i < len; i++) {
        d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, decay);
      }
    }
    return buf;
  }

  _noiseBuffer(type = 'white', seconds = 2) {
    const ctx = this.ctx;
    const len = ctx.sampleRate * seconds;
    const buf = ctx.createBuffer(1, len, ctx.sampleRate);
    const d = buf.getChannelData(0);
    let last = 0;
    for (let i = 0; i < len; i++) {
      const w = Math.random() * 2 - 1;
      if (type === 'brown') { last = (last + 0.02 * w) / 1.02; d[i] = last * 3.5; }
      else d[i] = w;
    }
    return buf;
  }

  _noiseSource(type = 'white', loop = true) {
    const src = this.ctx.createBufferSource();
    src.buffer = this._noiseBuffer(type, 2);
    src.loop = loop;
    return src;
  }

  // ------------------------------ ambient bed ---------------------------
  startAmbient() {
    if (!this.ctx || this.started) return;
    this.started = true;
    const ctx = this.ctx;

    // low drone: two detuned oscillators + slow LFO
    const droneGain = ctx.createGain(); droneGain.gain.value = 0.11;
    const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 220;
    [55, 55.4, 82.5].forEach((f, i) => {
      const o = ctx.createOscillator(); o.type = 'sawtooth'; o.frequency.value = f;
      const g = ctx.createGain(); g.gain.value = i === 2 ? 0.35 : 0.6;
      o.connect(g).connect(lp); o.start();
    });
    const lfo = ctx.createOscillator(); lfo.frequency.value = 0.06;
    const lfoG = ctx.createGain(); lfoG.gain.value = 0.05;
    lfo.connect(lfoG).connect(droneGain.gain); lfo.start();
    lp.connect(droneGain); this._out(droneGain, 0.5);
    this.nodes.drone = droneGain;

    // rain bed
    const rain = this._noiseSource('white');
    const rbp = ctx.createBiquadFilter(); rbp.type = 'bandpass'; rbp.frequency.value = 2600; rbp.Q.value = 0.5;
    const rhp = ctx.createBiquadFilter(); rhp.type = 'highpass'; rhp.frequency.value = 1400;
    const rainG = ctx.createGain(); rainG.gain.value = 0.05;
    rain.connect(rbp).connect(rhp).connect(rainG); this._out(rainG, 0.25);
    rain.start();
    this.nodes.rain = rainG;

    // wind
    const wind = this._noiseSource('brown');
    const wlp = ctx.createBiquadFilter(); wlp.type = 'lowpass'; wlp.frequency.value = 380;
    const windG = ctx.createGain(); windG.gain.value = 0.06;
    const wlfo = ctx.createOscillator(); wlfo.frequency.value = 0.09;
    const wlfoG = ctx.createGain(); wlfoG.gain.value = 0.04;
    wlfo.connect(wlfoG).connect(windG.gain); wlfo.start();
    wind.connect(wlp).connect(windG).connect(this.dry); wind.start();
    this.nodes.wind = windG;

    // entity breathing (starts silent)
    const breath = this._noiseSource('brown');
    const blp = ctx.createBiquadFilter(); blp.type = 'lowpass'; blp.frequency.value = 500;
    const breathG = ctx.createGain(); breathG.gain.value = 0.0;
    const blfo = ctx.createOscillator(); blfo.type = 'sine'; blfo.frequency.value = 0.32;
    const blfoG = ctx.createGain(); blfoG.gain.value = 0.5;
    const blfoBias = ctx.createConstantSource(); blfoBias.offset.value = 0.5;
    blfo.connect(blfoG); blfoG.connect(breathG.gain); blfoBias.connect(breathG.gain);
    blfo.start(); blfoBias.start();
    breath.connect(blp).connect(breathG); this._out(breathG, 0.4); breath.start();
    this.nodes.breath = breathG;
    this.nodes.breathLfo = blfo;

    this._scheduleAmbientEvents();
  }

  setBreathing(intensity) {
    if (!this.nodes.breath) return;
    const t = this.ctx.currentTime;
    this.nodes.breath.gain.cancelScheduledValues(t);
    this.nodes.breath.gain.linearRampToValueAtTime(intensity * 0.16, t + 0.6);
    this.nodes.breathLfo.frequency.setValueAtTime(0.32 + intensity * 0.9, t);
  }

  _scheduleAmbientEvents() {
    const loop = () => {
      if (!this.ctx) return;
      const r = Math.random();
      if (r < 0.4) this.playCreak();
      else if (r < 0.7) this.playWhisper();
      else if (r < 0.85) this.playKnock();
      this.ambientTimer = setTimeout(loop, 4000 + Math.random() * 9000);
    };
    this.ambientTimer = setTimeout(loop, 5000);
  }

  // ------------------------------ one-shots -----------------------------
  _now() { return this.ctx.currentTime; }

  playCreak() {
    if (!this.ctx) return;
    const ctx = this.ctx, t = this._now();
    const o = ctx.createOscillator(); o.type = 'sawtooth';
    o.frequency.setValueAtTime(80 + Math.random() * 60, t);
    o.frequency.exponentialRampToValueAtTime(40 + Math.random() * 30, t + 0.5);
    const bp = ctx.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = 300; bp.Q.value = 6;
    const g = ctx.createGain(); g.gain.setValueAtTime(0.0, t);
    g.gain.linearRampToValueAtTime(0.08, t + 0.05);
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.7);
    o.connect(bp).connect(g); this._out(g, 0.5); o.start(t); o.stop(t + 0.75);
  }

  playDoorCreak() {
    if (!this.ctx) return;
    const ctx = this.ctx, t = this._now();
    const o = ctx.createOscillator(); o.type = 'sawtooth';
    o.frequency.setValueAtTime(220, t);
    o.frequency.exponentialRampToValueAtTime(90, t + 0.9);
    const bp = ctx.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = 700; bp.Q.value = 9;
    const g = ctx.createGain(); g.gain.setValueAtTime(0.001, t);
    g.gain.linearRampToValueAtTime(0.06, t + 0.1);
    g.gain.exponentialRampToValueAtTime(0.001, t + 1.0);
    o.connect(bp).connect(g); this._out(g, 0.6); o.start(t); o.stop(t + 1.05);
  }

  playWhisper() {
    if (!this.ctx) return;
    const ctx = this.ctx, t = this._now();
    const src = this._noiseSource('white', false);
    const bp = ctx.createBiquadFilter(); bp.type = 'bandpass';
    bp.frequency.setValueAtTime(1200, t);
    bp.frequency.linearRampToValueAtTime(2200, t + 0.6);
    bp.Q.value = 7;
    const g = ctx.createGain(); g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(0.05, t + 0.15);
    g.gain.linearRampToValueAtTime(0.0, t + 0.9);
    const pan = ctx.createStereoPanner(); pan.pan.value = Math.random() * 2 - 1;
    src.connect(bp).connect(g).connect(pan); this._out2(pan, 0.6);
    src.start(t); src.stop(t + 1.0);
  }

  _out2(node, wet) {
    node.connect(this.dry);
    const g = this.ctx.createGain(); g.gain.value = wet;
    node.connect(g).connect(this.reverb);
  }

  playKnock() {
    if (!this.ctx) return;
    const ctx = this.ctx; let t = this._now();
    const pan = ctx.createStereoPanner(); pan.pan.value = Math.random() * 2 - 1;
    pan.connect(this.dry); const rg = ctx.createGain(); rg.gain.value = 0.5; pan.connect(rg).connect(this.reverb);
    const n = 2 + (Math.random() * 2 | 0);
    for (let i = 0; i < n; i++) {
      const o = ctx.createOscillator(); o.type = 'sine'; o.frequency.value = 90;
      const g = ctx.createGain(); g.gain.setValueAtTime(0.0, t);
      g.gain.linearRampToValueAtTime(0.12, t + 0.005);
      g.gain.exponentialRampToValueAtTime(0.001, t + 0.16);
      o.connect(g).connect(pan); o.start(t); o.stop(t + 0.18);
      t += 0.22;
    }
  }

  playThunder() {
    if (!this.ctx) return;
    const ctx = this.ctx, t = this._now();
    const src = this._noiseSource('brown', false);
    const lp = ctx.createBiquadFilter(); lp.type = 'lowpass';
    lp.frequency.setValueAtTime(400, t);
    lp.frequency.exponentialRampToValueAtTime(60, t + 2.5);
    const g = ctx.createGain(); g.gain.setValueAtTime(0.0, t);
    g.gain.linearRampToValueAtTime(0.5, t + 0.08);
    g.gain.exponentialRampToValueAtTime(0.2, t + 0.6);
    g.gain.exponentialRampToValueAtTime(0.001, t + 3.0);
    src.connect(lp).connect(g); this._out(g, 0.7); src.start(t); src.stop(t + 3.1);
  }

  playStinger() {
    if (!this.ctx) return;
    const ctx = this.ctx, t = this._now();
    // low drop
    const o = ctx.createOscillator(); o.type = 'sawtooth';
    o.frequency.setValueAtTime(500, t); o.frequency.exponentialRampToValueAtTime(45, t + 0.5);
    const og = ctx.createGain(); og.gain.setValueAtTime(0.25, t); og.gain.exponentialRampToValueAtTime(0.001, t + 0.7);
    o.connect(og).connect(this.master); o.start(t); o.stop(t + 0.72);
    // metallic hit
    const src = this._noiseSource('white', false);
    const bp = ctx.createBiquadFilter(); bp.type = 'highpass'; bp.frequency.value = 1800;
    const g = ctx.createGain(); g.gain.setValueAtTime(0.3, t); g.gain.exponentialRampToValueAtTime(0.001, t + 0.35);
    src.connect(bp).connect(g); this._out(g, 0.6); src.start(t); src.stop(t + 0.4);
  }

  playBang() {
    if (!this.ctx) return;
    const ctx = this.ctx, t = this._now();
    const src = this._noiseSource('white', false);
    const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.setValueAtTime(1200, t);
    lp.frequency.exponentialRampToValueAtTime(120, t + 0.3);
    const g = ctx.createGain(); g.gain.setValueAtTime(0.4, t); g.gain.exponentialRampToValueAtTime(0.001, t + 0.4);
    src.connect(lp).connect(g); this._out(g, 0.5); src.start(t); src.stop(t + 0.45);
  }

  playPickup() {
    if (!this.ctx) return;
    const ctx = this.ctx, t = this._now();
    [880, 1320].forEach((f, i) => {
      const o = ctx.createOscillator(); o.type = 'triangle'; o.frequency.value = f;
      const g = ctx.createGain(); g.gain.setValueAtTime(0.0, t + i * 0.08);
      g.gain.linearRampToValueAtTime(0.12, t + i * 0.08 + 0.02);
      g.gain.exponentialRampToValueAtTime(0.001, t + i * 0.08 + 0.3);
      o.connect(g).connect(this.master); o.start(t + i * 0.08); o.stop(t + i * 0.08 + 0.32);
    });
  }

  playGrowl() {
    if (!this.ctx) return;
    const ctx = this.ctx, t = this._now();
    const o = ctx.createOscillator(); o.type = 'sawtooth'; o.frequency.value = 60;
    const lfo = ctx.createOscillator(); lfo.frequency.value = 22;
    const lfoG = ctx.createGain(); lfoG.gain.value = 20; lfo.connect(lfoG).connect(o.frequency);
    const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 320;
    const g = ctx.createGain(); g.gain.setValueAtTime(0.0, t);
    g.gain.linearRampToValueAtTime(0.22, t + 0.2);
    g.gain.exponentialRampToValueAtTime(0.001, t + 1.6);
    o.connect(lp).connect(g); this._out(g, 0.6); o.start(t); lfo.start(t); o.stop(t + 1.7); lfo.stop(t + 1.7);
  }

  playBanishShriek() {
    if (!this.ctx) return;
    const ctx = this.ctx, t = this._now();
    const o = ctx.createOscillator(); o.type = 'sawtooth';
    o.frequency.setValueAtTime(1600, t); o.frequency.exponentialRampToValueAtTime(180, t + 0.8);
    const o2 = ctx.createOscillator(); o2.type = 'square';
    o2.frequency.setValueAtTime(1610, t); o2.frequency.exponentialRampToValueAtTime(200, t + 0.8);
    const g = ctx.createGain(); g.gain.setValueAtTime(0.0, t);
    g.gain.linearRampToValueAtTime(0.2, t + 0.04);
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.9);
    o.connect(g); o2.connect(g); this._out(g, 0.8); o.start(t); o2.start(t); o.stop(t + 0.95); o2.stop(t + 0.95);
  }

  playScream() {
    if (!this.ctx) return;
    const ctx = this.ctx, t = this._now();
    [440, 660, 880].forEach((f, i) => {
      const o = ctx.createOscillator(); o.type = 'sawtooth';
      o.frequency.setValueAtTime(f * 1.6, t);
      o.frequency.exponentialRampToValueAtTime(f * 0.6, t + 1.2);
      const vib = ctx.createOscillator(); vib.frequency.value = 12 + i * 3;
      const vibG = ctx.createGain(); vibG.gain.value = 25; vib.connect(vibG).connect(o.frequency);
      const g = ctx.createGain(); g.gain.setValueAtTime(0.0, t);
      g.gain.linearRampToValueAtTime(0.16, t + 0.05);
      g.gain.exponentialRampToValueAtTime(0.001, t + 1.3);
      o.connect(g); this._out(g, 0.7); o.start(t); vib.start(t); o.stop(t + 1.35); vib.stop(t + 1.35);
    });
    const n = this._noiseSource('white', false);
    const bp = ctx.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = 2000; bp.Q.value = 2;
    const ng = ctx.createGain(); ng.gain.setValueAtTime(0.12, t); ng.gain.exponentialRampToValueAtTime(0.001, t + 1.2);
    n.connect(bp).connect(ng).connect(this.master); n.start(t); n.stop(t + 1.25);
  }

  // ------------------------------ heartbeat -----------------------------
  setHeartRate(rate) { this.heartRate = rate; this._ensureHeart(); }

  _ensureHeart() {
    if (this.heartTimer || !this.ctx) return;
    const beat = () => {
      if (!this.ctx) return;
      if (this.heartRate > 0) this._thump();
      const interval = this.heartRate > 0 ? 1000 / this.heartRate : 700;
      this.heartTimer = setTimeout(beat, interval);
    };
    this.heartTimer = setTimeout(beat, 200);
  }

  _thump() {
    const ctx = this.ctx, t = this._now();
    const two = [0, 0.16];
    for (const off of two) {
      const o = ctx.createOscillator(); o.type = 'sine';
      o.frequency.setValueAtTime(70, t + off); o.frequency.exponentialRampToValueAtTime(38, t + off + 0.14);
      const g = ctx.createGain(); g.gain.setValueAtTime(0.0, t + off);
      g.gain.linearRampToValueAtTime(Math.min(0.35, 0.12 + this.heartRate * 0.05), t + off + 0.02);
      g.gain.exponentialRampToValueAtTime(0.001, t + off + 0.22);
      o.connect(g).connect(this.master); o.start(t + off); o.stop(t + off + 0.24);
    }
  }

  // ------------------------------ chase music ---------------------------
  startChase() {
    if (!this.ctx || this.chaseTimer) return;
    const ctx = this.ctx;
    let step = 0;
    const bassNotes = [55, 55, 58, 62];
    const loop = () => {
      if (!this.ctx) return;
      const t = this._now();
      const f = bassNotes[step % bassNotes.length];
      const o = ctx.createOscillator(); o.type = 'sawtooth'; o.frequency.value = f;
      const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 500;
      const g = ctx.createGain(); g.gain.setValueAtTime(0.0, t);
      g.gain.linearRampToValueAtTime(0.14, t + 0.02); g.gain.exponentialRampToValueAtTime(0.001, t + 0.28);
      o.connect(lp).connect(g).connect(this.master); o.start(t); o.stop(t + 0.3);
      // dissonant high stab every 4
      if (step % 4 === 0) {
        [1245, 1320].forEach((hf) => {
          const ho = ctx.createOscillator(); ho.type = 'sawtooth'; ho.frequency.value = hf;
          const hg = ctx.createGain(); hg.gain.setValueAtTime(0.05, t); hg.gain.exponentialRampToValueAtTime(0.001, t + 0.5);
          ho.connect(hg); this._out(hg, 0.7); ho.start(t); ho.stop(t + 0.55);
        });
      }
      step++;
      this.chaseTimer = setTimeout(loop, 230);
    };
    loop();
  }

  stopChase() { if (this.chaseTimer) { clearTimeout(this.chaseTimer); this.chaseTimer = null; } }

  reset() {
    this.setHeartRate(0);
    this.stopChase();
    this.setBreathing(0);
  }

  stopAll() {
    if (this.ambientTimer) clearTimeout(this.ambientTimer);
    if (this.heartTimer) clearTimeout(this.heartTimer);
    this.stopChase();
    this.heartTimer = null;
  }
}
