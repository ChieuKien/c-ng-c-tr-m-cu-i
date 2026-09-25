// Hiệu ứng âm thanh tổng hợp bằng Web Audio — không cần file mp3.
export class Sfx {
  enabled = true;
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;

  constructor() {
    try {
      this.enabled = localStorage.getItem('vt-sound') !== 'off';
    } catch {
      /* chế độ riêng tư: bỏ qua */
    }
  }

  // Phải gọi trong một thao tác chạm/bấm (iOS chỉ cho phát âm thanh sau tương tác)
  unlock() {
    if (!this.ctx) {
      const AC = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!AC) return;
      this.ctx = new AC();
      this.master = this.ctx.createGain();
      this.master.gain.value = 0.55;
      this.master.connect(this.ctx.destination);
    }
    if (this.ctx.state === 'suspended') void this.ctx.resume();
  }

  toggle() {
    this.enabled = !this.enabled;
    try {
      localStorage.setItem('vt-sound', this.enabled ? 'on' : 'off');
    } catch {
      /* bỏ qua */
    }
    return this.enabled;
  }

  private get ready() {
    return this.enabled && !!this.ctx && this.ctx.state === 'running';
  }

  private noise(duration: number) {
    const ctx = this.ctx!;
    const len = Math.ceil(ctx.sampleRate * duration);
    const buf = ctx.createBuffer(1, len, ctx.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
    const src = ctx.createBufferSource();
    src.buffer = buf;
    return src;
  }

  // tiếng "xoạt" của lá bài
  tick(when = 0, gain = 0.18) {
    if (!this.ready) return;
    const ctx = this.ctx!;
    const t = ctx.currentTime + when;
    const src = this.noise(0.05);
    const bp = ctx.createBiquadFilter();
    bp.type = 'bandpass';
    bp.frequency.value = 2800 + Math.random() * 1800;
    bp.Q.value = 1.2;
    const g = ctx.createGain();
    g.gain.setValueAtTime(gain, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.045);
    src.connect(bp).connect(g).connect(this.master!);
    src.start(t);
  }

  riffle(count = 26, span = 0.55) {
    for (let i = 0; i < count; i++) this.tick((i / count) * span + Math.random() * 0.01, 0.08 + Math.random() * 0.08);
  }

  whoosh(duration = 0.6) {
    if (!this.ready) return;
    const ctx = this.ctx!;
    const t = ctx.currentTime;
    const src = this.noise(duration);
    const bp = ctx.createBiquadFilter();
    bp.type = 'bandpass';
    bp.Q.value = 0.8;
    bp.frequency.setValueAtTime(300, t);
    bp.frequency.exponentialRampToValueAtTime(2400, t + duration * 0.6);
    bp.frequency.exponentialRampToValueAtTime(600, t + duration);
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(0.22, t + duration * 0.35);
    g.gain.exponentialRampToValueAtTime(0.0001, t + duration);
    src.connect(bp).connect(g).connect(this.master!);
    src.start(t);
  }

  // hợp âm ngũ cung lấp lánh khi lật bài
  chime(root = 523.25) {
    if (!this.ready) return;
    const ctx = this.ctx!;
    const t = ctx.currentTime;
    [1, 1.25, 1.5, 2, 2.5].forEach((ratio, i) => {
      const o = ctx.createOscillator();
      o.type = i % 2 ? 'triangle' : 'sine';
      o.frequency.value = root * ratio * (1 + (Math.random() - 0.5) * 0.004);
      const g = ctx.createGain();
      const start = t + i * 0.06;
      g.gain.setValueAtTime(0.0001, start);
      g.gain.exponentialRampToValueAtTime(0.12 / (i * 0.5 + 1), start + 0.02);
      g.gain.exponentialRampToValueAtTime(0.0001, start + 2.2);
      o.connect(g).connect(this.master!);
      o.start(start);
      o.stop(start + 2.3);
    });
  }

  dispose() {
    void this.ctx?.close();
    this.ctx = null;
  }
}
