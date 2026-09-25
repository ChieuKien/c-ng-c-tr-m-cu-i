// Bộ tween tối giản: mỗi animation là một hàm nhận tiến độ t ∈ [0,1], trả về Promise
// → biên đạo chuyển động tuần tự bằng async/await.

export type EaseFn = (t: number) => number;

export const Ease = {
  linear: (t: number) => t,
  inQuad: (t: number) => t * t,
  outQuad: (t: number) => 1 - (1 - t) * (1 - t),
  outCubic: (t: number) => 1 - Math.pow(1 - t, 3),
  inCubic: (t: number) => t * t * t,
  inOutCubic: (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2),
  inOutSine: (t: number) => -(Math.cos(Math.PI * t) - 1) / 2,
  outBack: (t: number) => {
    const s = 1.70158;
    return 1 + (s + 1) * Math.pow(t - 1, 3) + s * Math.pow(t - 1, 2);
  },
} satisfies Record<string, EaseFn>;

interface Job {
  start: number;
  duration: number;
  fn: (t: number, raw: number) => void;
  ease: EaseFn;
  resolve: () => void;
}

export class Animator {
  now = 0;
  private jobs = new Set<Job>();

  run(duration: number, fn: (t: number, raw: number) => void, { delay = 0, ease = Ease.linear }: { delay?: number; ease?: EaseFn } = {}) {
    return new Promise<void>((resolve) => {
      this.jobs.add({ start: this.now + delay, duration: Math.max(1, duration), fn, ease, resolve });
    });
  }

  wait(ms: number) {
    return this.run(ms, () => {});
  }

  // Tween thuộc tính số của một object (vd: material.opacity)
  to<T extends object>(target: T, props: Partial<Record<keyof T, number>>, duration: number) {
    const t = target as Record<string, number>;
    const p = props as Record<string, number>;
    const from: Record<string, number> = {};
    for (const k in p) from[k] = t[k];
    return this.run(duration, (e) => {
      for (const k in p) t[k] = from[k] + (p[k] - from[k]) * e;
    });
  }

  update(now: number) {
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

  // Huỷ mọi animation: Promise đang chờ không bao giờ resolve → chuỗi async cũ dừng hẳn
  clear() {
    this.jobs.clear();
  }
}
