// Midnight Crumb — sound. Everything is synthesized with WebAudio at run
// time: no audio files, no network, original bleeps only. Created lazily on
// the first user gesture so browsers allow it.

export class Sfx {
  constructor() {
    this.ctx = null;
    this.muted = false;
    this.master = null;
  }

  ensure() {
    if (this.ctx) {
      if (this.ctx.state === 'suspended') this.ctx.resume();
      return true;
    }
    try {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return false;
      this.ctx = new AC();
      this.master = this.ctx.createGain();
      this.master.gain.value = 0.16;
      this.master.connect(this.ctx.destination);
      return true;
    } catch {
      return false;
    }
  }

  tone(freq, dur, type = 'sine', when = 0, slideTo = 0) {
    if (this.muted || !this.ensure()) return;
    const t0 = this.ctx.currentTime + when;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t0);
    if (slideTo) osc.frequency.exponentialRampToValueAtTime(slideTo, t0 + dur);
    gain.gain.setValueAtTime(0.0001, t0);
    gain.gain.exponentialRampToValueAtTime(1, t0 + 0.012);
    gain.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    osc.connect(gain);
    gain.connect(this.master);
    osc.start(t0);
    osc.stop(t0 + dur + 0.05);
  }

  // Short filtered-noise burst (sizzle / pop texture).
  noise(dur, freq = 1800, when = 0) {
    if (this.muted || !this.ensure()) return;
    const t0 = this.ctx.currentTime + when;
    const len = Math.max(1, Math.floor(this.ctx.sampleRate * dur));
    const buf = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < len; i += 1) data[i] = (Math.random() * 2 - 1) * (1 - i / len);
    const src = this.ctx.createBufferSource();
    src.buffer = buf;
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = freq;
    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.5, t0);
    gain.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    src.connect(filter);
    filter.connect(gain);
    gain.connect(this.master);
    src.start(t0);
  }

  click() { this.tone(660, 0.07, 'triangle'); }
  pick() { this.tone(520, 0.08, 'triangle'); this.tone(780, 0.09, 'sine', 0.05); }
  error() { this.tone(180, 0.16, 'square', 0, 120); }
  plop() { this.tone(320, 0.12, 'sine', 0, 140); this.noise(0.08, 900); }
  ovenDing() { this.tone(880, 0.18, 'sine'); this.tone(1320, 0.22, 'sine', 0.1); }
  golden() { this.tone(740, 0.1, 'triangle'); this.tone(988, 0.12, 'triangle', 0.08); this.tone(1319, 0.2, 'sine', 0.16); }
  serve() {
    [523, 659, 784, 1047].forEach((f, i) => this.tone(f, 0.16, 'triangle', i * 0.07));
  }
  leave() { this.tone(392, 0.14, 'sine', 0, 260); this.tone(262, 0.2, 'sine', 0.1, 180); }
  tick() { this.tone(1200, 0.04, 'square'); }
}
