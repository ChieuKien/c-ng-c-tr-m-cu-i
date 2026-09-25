// Cấu hình thương hiệu & thông số cảnh 3D. Sửa file này để đổi tên, link, cảm giác chuyển động.

export const BRAND = {
  name: 'Vinh Tarot',
  site: 'vinhtarot.com',
  backText: 'VINH TAROT', // chữ in trên mặt lưng lá bài
  // Nút kêu gọi hành động ở trang kết quả (đổi thành link Messenger/Zalo/đặt lịch thật)
  bookingUrl: 'https://vinhtarot.com',
  bookingLabel: 'Đặt lịch xem chuyên sâu',
};

export const SCENE = {
  card: { width: 1.0, height: 1.75, depth: 0.016, radius: 0.06 },
  perTurn: 39, // số lá tối đa trên một vòng xoắn (78 lá → 2 tầng)
  tilt: -0.1, // nghiêng vòng bài (rad) để thấy chiều sâu
  idleSpin: 0.1, // rad/s khi để yên
  maxSpin: 2.4, // rad/s tối đa khi xoay bằng tay/cử chỉ
  bob: 0.09, // biên độ nhấp nhô
  inspectDistance: 3.2, // khoảng cách lá bài tới camera khi lật xem
  inspectFill: 0.5, // lá bài chiếm bao nhiêu % chiều cao màn hình khi lật
  holdMs: 1900, // thời gian dừng xem trước khi cất vào khay
};

// MediaPipe Tasks Vision — chỉ tải khi người dùng bật chế độ cử chỉ tay.
export const HAND_TRACKING = {
  bundleUrl: 'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@1.0.1/vision_bundle.mjs',
  wasmUrl: 'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@1.0.1/wasm',
  modelUrl:
    'https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task',
};
