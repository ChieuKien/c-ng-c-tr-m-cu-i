// Thông số thương hiệu & chuyển động. Có thể ghi đè qua props của <TarotExperience />.

export interface BrandConfig {
  name: string;
  backText: string; // chữ in trên mặt lưng lá bài
  bookingUrl: string; // nút kêu gọi hành động ở trang kết quả
  bookingLabel: string;
  homeHref: string;
}

export const DEFAULT_BRAND: BrandConfig = {
  name: 'Vinh Tarot',
  backText: 'VINH TAROT',
  bookingUrl: 'https://vinhtarot.com',
  bookingLabel: 'Đặt lịch xem chuyên sâu',
  homeHref: '/',
};

export interface CardDims {
  width: number;
  height: number;
  depth: number;
  radius: number;
}

export interface SceneConfig {
  card: CardDims;
  perTurn: number; // số lá tối đa mỗi tầng (78 lá → 2 tầng)
  tilt: number; // nghiêng vòng bài (rad)
  idleSpin: number; // rad/s khi để yên
  maxSpin: number; // rad/s tối đa
  bob: number; // biên độ nhấp nhô
  inspectDistance: number; // khoảng cách lá tới camera khi lật
  inspectFill: number; // lá chiếm bao nhiêu chiều cao màn hình khi lật
  holdMs: number; // thời gian dừng xem trước khi cất vào khay
}

export const SCENE: SceneConfig = {
  card: { width: 1.0, height: 1.75, depth: 0.016, radius: 0.06 },
  perTurn: 39,
  tilt: -0.1,
  idleSpin: 0.1,
  maxSpin: 2.4,
  bob: 0.09,
  inspectDistance: 3.2,
  inspectFill: 0.5,
  holdMs: 1900,
};

// MediaPipe: phần JS lấy từ npm (@mediapipe/tasks-vision, tách chunk riêng, chỉ tải khi bật cử chỉ tay);
// WASM + mô hình tải từ CDN. Giữ số phiên bản WASM trùng với package.json.
export const HAND_TRACKING = {
  wasmUrl: 'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@1.0.1/wasm',
  modelUrl:
    'https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task',
};
