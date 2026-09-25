// Bộ tween tối giản: mỗi animation là một hàm nhận tiến độ t ∈ [0,1].
// Trả về Promise nên có thể viết biên đạo chuyển động tuần tự bằng async/await.

export const Ease = {
  linear: (t) => t,
  inQuad: (t) => t * t,
  outQuad: (t) => 1 - (1 - t) * (1 - t),
  inOutQuad: (t) => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2),
  outCubic: (t) => 1 - Math.pow(1 - t, 3),
  inCubic: (t) => t * t * t,
  inOutCubic: (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2),
  outQuart: (t) => 1 - Math.pow(1 - t, 4),
  outExpo: (t) => (t === 1 ? 1 : 1 - Math.pow(2, -10 * t)),
  inOutSine: (t) => -(Math.cos(Math.PI * t) - 1) / 2,
  outBack: (t, s = 1.70158) => 1 + (s + 1) * Math.pow(t - 1, 3) + s * Math.pow(t - 1, 2),
};

export class Animator {
  constructor() {
    this.now = 0;
    this.jobs = new Set();
  }

  // run(duration, fn(t, raw), { delay, ease }) → Promise
  run(duration, fn, { delay = 0, ease = Ease.linear } = {}) {
    return new Promise((resolve) => {
      const job = { start: this.now + delay, duration: Math.max(1, duration), fn, ease, resolve, started: false };
      this.jobs.add(job);
    });
  }

  wait(ms) {
    return this.run(ms, () => {});
  }

  // Tween thuộc tính số của một object (vd: material.opacity, position.x)
  to(target, props, duration, opts = {}) {
    const from = {};
    for (const k in props) from[k] = target[k];
    return this.run(
      duration,
      (t) => {
        for (const k in props) target[k] = from[k] + (props[k] - from[k]) * t;
      },
      opts,
    );
  }

  update(now) {
    this.now = now;
    for (const job of this.jobs) {
      if (now < job.start) continue;
      const raw = Math.min(1, (now - job.start) / job.duration);
      job.fn(job.ease(raw), raw);
      if (raw >= 1) {
        this.jobs.delete(job);
        job.resolve();
      }
    }
  }

  // Huỷ mọi animation: Promise đang chờ sẽ không bao giờ resolve → chuỗi async cũ dừng hẳn,
  // không thể đổi trạng thái của lượt trải bài mới.
  clear() {
    this.jobs.clear();
  }
}
