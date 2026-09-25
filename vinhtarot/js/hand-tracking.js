// Điều khiển bằng cử chỉ tay qua webcam — MediaPipe Tasks Vision (HandLandmarker).
// Chỉ tải thư viện + mô hình (~8 MB) khi người dùng chủ động bật.
import { HAND_TRACKING } from './config.js';

// Bộ lọc One Euro: khử rung khi tay đứng yên, vẫn bám nhanh khi tay di chuyển nhanh.
class OneEuro {
  constructor(minCutoff = 1.4, beta = 9, dCutoff = 1.2) {
    Object.assign(this, { minCutoff, beta, dCutoff });
    this.x = null;
    this.dx = 0;
    this.t = 0;
  }
  static alpha(cutoff, dt) {
    const tau = 1 / (2 * Math.PI * cutoff);
    return 1 / (1 + tau / dt);
  }
  filter(x, t) {
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

const CONNECTIONS = [
  [0, 1], [1, 2], [2, 3], [3, 4], [0, 5], [5, 6], [6, 7], [7, 8], [5, 9], [9, 10], [10, 11], [11, 12],
  [9, 13], [13, 14], [14, 15], [15, 16], [13, 17], [17, 18], [18, 19], [19, 20], [0, 17],
];

export class HandController {
  constructor({ video, overlay, onFrame, onStatus }) {
    this.video = video;
    this.overlay = overlay;
    this.onFrame = onFrame;
    this.onStatus = onStatus;
    this.running = false;
    this.pinched = false;
    this.fx = new OneEuro();
    this.fy = new OneEuro();
    this.lastVideoTime = -1;
  }

  async start() {
    if (this.running) return;
    if (!this.landmarker) await this.load(); // mô hình chỉ tải một lần, bật/tắt lại không tải nữa
    this.onStatus?.('camera', 'Đang mở camera…');
    await this.openCamera();
  }

  async load() {
    this.onStatus?.('loading', 'Đang tải mô hình nhận diện tay (~11 MB, chỉ lần đầu)…');
    const vision = await import(/* @vite-ignore */ HAND_TRACKING.bundleUrl);
    const fileset = await vision.FilesetResolver.forVisionTasks(HAND_TRACKING.wasmUrl);
    const make = (delegate) =>
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

  async openCamera() {
    this.stream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 480 } },
      audio: false,
    });
    this.video.srcObject = this.stream;
    await this.video.play();
    this.running = true;
    this.onStatus?.('ready', 'Đưa bàn tay lên trước camera');
    this.loop();
  }

  stop() {
    this.running = false;
    this.stream?.getTracks().forEach((t) => t.stop());
    this.stream = null;
    this.video.srcObject = null;
    this.onFrame?.({ present: false });
  }

  loop = () => {
    if (!this.running) return;
    const v = this.video;
    if (v.readyState >= 2 && v.currentTime !== this.lastVideoTime) {
      this.lastVideoTime = v.currentTime;
      const now = performance.now();
      const res = this.landmarker.detectForVideo(v, now);
      this.process(res, now / 1000);
    }
    if (v.requestVideoFrameCallback) v.requestVideoFrameCallback(this.loop);
    else requestAnimationFrame(this.loop);
  };

  process(res, t) {
    const lm = res.landmarks?.[0];
    this.draw(lm);
    if (!lm) {
      this.fx.reset();
      this.fy.reset();
      if (this.pinched) {
        this.pinched = false;
        this.onFrame?.({ present: false, pinchEnd: true });
      } else this.onFrame?.({ present: false });
      return;
    }
    const aspect = (this.video.videoWidth || 640) / (this.video.videoHeight || 480);
    const d = (a, b) => Math.hypot((lm[a].x - lm[b].x) * aspect, lm[a].y - lm[b].y);

    // Chuẩn hoá khoảng cách chụm theo kích thước bàn tay (cổ tay → gốc ngón giữa)
    // → hoạt động ổn định dù tay gần hay xa camera.
    const handSize = d(0, 9) || 1e-3;
    const ratio = d(4, 8) / handSize;
    const wasPinched = this.pinched;
    if (!this.pinched && ratio < 0.26) this.pinched = true; // hysteresis: vào < 0.26
    else if (this.pinched && ratio > 0.42) this.pinched = false; // ra > 0.42

    // Con trỏ = trung điểm đầu ngón cái & ngón trỏ, lật gương (selfie)
    const rawX = 1 - (lm[4].x + lm[8].x) / 2;
    const rawY = (lm[4].y + lm[8].y) / 2;
    // Nới vùng hoạt động: 10%–90% khung hình ánh xạ ra toàn màn hình
    const expand = (v) => Math.min(1, Math.max(0, (v - 0.1) / 0.8));
    const x = this.fx.filter(expand(rawX), t);
    const y = this.fy.filter(expand(rawY), t);
    const palmX = 1 - lm[9].x;

    this.onFrame?.({
      present: true,
      x,
      y,
      palmX,
      pinched: this.pinched,
      pinchStart: this.pinched && !wasPinched,
      pinchEnd: !this.pinched && wasPinched,
    });
  }

  draw(lm) {
    const c = this.overlay;
    if (!c) return;
    const ctx = c.getContext('2d');
    const w = (c.width = c.clientWidth * devicePixelRatio);
    const h = (c.height = c.clientHeight * devicePixelRatio);
    ctx.clearRect(0, 0, w, h);
    if (!lm) return;
    const px = (p) => [(1 - p.x) * w, p.y * h];
    ctx.strokeStyle = this.pinched ? '#fff3c4' : 'rgba(217,181,108,0.9)';
    ctx.lineWidth = 2 * devicePixelRatio;
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
      ctx.arc(x, y, 2.2 * devicePixelRatio, 0, Math.PI * 2);
      ctx.fill();
    }
  }
}
