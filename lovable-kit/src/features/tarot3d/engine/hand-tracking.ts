// Điều khiển bằng cử chỉ tay qua webcam — MediaPipe Tasks Vision (HandLandmarker).
// Thư viện được import động → Vite tách chunk riêng, chỉ tải khi người dùng bật.
import type { HandLandmarker, NormalizedLandmark } from '@mediapipe/tasks-vision';
import { HAND_TRACKING } from './config';

// Bộ lọc One Euro: khử rung khi tay đứng yên, vẫn bám nhanh khi tay di chuyển nhanh.
class OneEuro {
  private x: number | null = null;
  private dx = 0;
  private t = 0;
  constructor(private minCutoff = 1.4, private beta = 9, private dCutoff = 1.2) {}
  private static alpha(cutoff: number, dt: number) {
    const tau = 1 / (2 * Math.PI * cutoff);
    return 1 / (1 + tau / dt);
  }
  filter(x: number, t: number) {
    if (this.x === null) {
      this.x = x;
      this.t = t;
      return x;
    }
    const dt = Math.max(1e-3, t - this.t);
    this.t = t;
    const dxRaw = (x - this.x) / dt;
    this.dx += OneEuro.alpha(this.dCutoff, dt) * (dxRaw - this.dx);
    const cutoff = this.minCutoff + this.beta * Math.abs(this.dx);
    this.x += OneEuro.alpha(cutoff, dt) * (x - this.x);
    return this.x;
  }
  reset() {
    this.x = null;
    this.dx = 0;
  }
}

const CONNECTIONS: [number, number][] = [
  [0, 1], [1, 2], [2, 3], [3, 4], [0, 5], [5, 6], [6, 7], [7, 8], [5, 9], [9, 10], [10, 11], [11, 12],
  [9, 13], [13, 14], [14, 15], [15, 16], [13, 17], [17, 18], [18, 19], [19, 20], [0, 17],
];

export interface HandFrame {
  present: boolean;
  x?: number; // 0..1 theo chiều ngang vùng hiển thị (đã lật gương)
  y?: number;
  palmX?: number;
  pinched?: boolean;
  pinchStart?: boolean;
  pinchEnd?: boolean;
}

export class HandController {
  private running = false;
  private pinched = false;
  private fx = new OneEuro();
  private fy = new OneEuro();
  private lastVideoTime = -1;
  private landmarker: HandLandmarker | null = null;
  private stream: MediaStream | null = null;

  constructor(
    private video: HTMLVideoElement,
    private overlay: HTMLCanvasElement | null,
    private onFrame: (f: HandFrame) => void,
    private onStatus: (text: string) => void,
  ) {}

  async start() {
    if (this.running) return;
    if (!this.landmarker) await this.load(); // mô hình chỉ tải một lần
    this.onStatus('Đang mở camera…');
    this.stream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 480 } },
      audio: false,
    });
    this.video.srcObject = this.stream;
    await this.video.play();
    this.running = true;
    this.onStatus('Đưa bàn tay lên trước camera');
    this.loop();
  }

  private async load() {
    this.onStatus('Đang tải mô hình nhận diện tay (~11 MB, chỉ lần đầu)…');
    const vision = await import('@mediapipe/tasks-vision');
    const fileset = await vision.FilesetResolver.forVisionTasks(HAND_TRACKING.wasmUrl);
    const make = (delegate: 'GPU' | 'CPU') =>
      vision.HandLandmarker.createFromOptions(fileset, {
        baseOptions: { modelAssetPath: HAND_TRACKING.modelUrl, delegate },
        runningMode: 'VIDEO',
        numHands: 1,
        minHandDetectionConfidence: 0.6,
        minHandPresenceConfidence: 0.6,
        minTrackingConfidence: 0.5,
      });
    try {
      this.landmarker = await make('GPU');
    } catch {
      this.landmarker = await make('CPU'); // máy không hỗ trợ WebGL2 cho MediaPipe
    }
  }

  stop() {
    this.running = false;
    this.stream?.getTracks().forEach((t) => t.stop());
    this.stream = null;
    this.video.srcObject = null;
    this.onFrame({ present: false, pinchEnd: this.pinched });
    this.pinched = false;
  }

  dispose() {
    this.stop();
    this.landmarker?.close();
    this.landmarker = null;
  }

  private loop = () => {
    if (!this.running || !this.landmarker) return;
    const v = this.video;
    if (v.readyState >= 2 && v.currentTime !== this.lastVideoTime) {
      this.lastVideoTime = v.currentTime;
      const now = performance.now();
      const res = this.landmarker.detectForVideo(v, now);
      this.process(res.landmarks?.[0], now / 1000);
    }
    if ('requestVideoFrameCallback' in v) v.requestVideoFrameCallback(this.loop);
    else requestAnimationFrame(this.loop);
  };

  private process(lm: NormalizedLandmark[] | undefined, t: number) {
    this.draw(lm);
    if (!lm) {
      this.fx.reset();
      this.fy.reset();
      const wasPinched = this.pinched;
      this.pinched = false;
      this.onFrame({ present: false, pinchEnd: wasPinched });
      return;
    }
    const aspect = (this.video.videoWidth || 640) / (this.video.videoHeight || 480);
    const d = (a: number, b: number) => Math.hypot((lm[a].x - lm[b].x) * aspect, lm[a].y - lm[b].y);

    // Khoảng cách chụm chuẩn hoá theo cỡ bàn tay (cổ tay → gốc ngón giữa)
    // → ổn định dù tay gần hay xa camera. Hysteresis: vào < 0.26, ra > 0.42.
    const ratio = d(4, 8) / (d(0, 9) || 1e-3);
    const wasPinched = this.pinched;
    if (!this.pinched && ratio < 0.26) this.pinched = true;
    else if (this.pinched && ratio > 0.42) this.pinched = false;

    // Con trỏ = trung điểm đầu ngón cái & ngón trỏ, lật gương; vùng 10–90% khung hình phủ toàn màn hình
    const expand = (v: number) => Math.min(1, Math.max(0, (v - 0.1) / 0.8));
    const x = this.fx.filter(expand(1 - (lm[4].x + lm[8].x) / 2), t);
    const y = this.fy.filter(expand((lm[4].y + lm[8].y) / 2), t);

    this.onFrame({
      present: true,
      x,
      y,
      palmX: 1 - lm[9].x,
      pinched: this.pinched,
      pinchStart: this.pinched && !wasPinched,
      pinchEnd: !this.pinched && wasPinched,
    });
  }

  private draw(lm: NormalizedLandmark[] | undefined) {
    const c = this.overlay;
    if (!c) return;
    const ctx = c.getContext('2d');
    if (!ctx) return;
    const dpr = window.devicePixelRatio || 1;
    const w = (c.width = c.clientWidth * dpr);
    const h = (c.height = c.clientHeight * dpr);
    ctx.clearRect(0, 0, w, h);
    if (!lm) return;
    const px = (p: NormalizedLandmark) => [(1 - p.x) * w, p.y * h] as const;
    ctx.strokeStyle = this.pinched ? '#fff3c4' : 'rgba(217,181,108,0.9)';
    ctx.lineWidth = 2 * dpr;
    for (const [a, b] of CONNECTIONS) {
      const [x1, y1] = px(lm[a]);
      const [x2, y2] = px(lm[b]);
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.stroke();
    }
    ctx.fillStyle = '#fff';
    for (const p of lm) {
      const [x, y] = px(p);
      ctx.beginPath();
      ctx.arc(x, y, 2.2 * dpr, 0, Math.PI * 2);
      ctx.fill();
    }
  }
}
