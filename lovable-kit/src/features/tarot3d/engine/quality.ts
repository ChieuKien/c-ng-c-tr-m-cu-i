// Chọn mức chất lượng theo thiết bị. Mức khởi đầu chỉ là ước lượng;
// Stage còn tự hạ độ phân giải khi đo thấy FPS thấp (dynamic resolution).

export interface Quality {
  maxDpr: number; // giới hạn devicePixelRatio khi vẽ
  antialias: boolean;
  stars: number;
  dust: number;
  burst: number;
}

export function detectQuality(): Quality {
  const coarse = matchMedia('(pointer: coarse)').matches; // điện thoại / máy tính bảng
  const cores = navigator.hardwareConcurrency || 4;
  const mem = (navigator as Navigator & { deviceMemory?: number }).deviceMemory ?? 4;
  const dpr = window.devicePixelRatio || 1;
  if (cores <= 2 || mem <= 2) return { maxDpr: 1.25, antialias: false, stars: 600, dust: 80, burst: 90 };
  // Màn điện thoại DPR 3 vẽ gấp 9 lần số điểm ảnh; 1.75 vẫn nét mà nhẹ hơn ~3 lần
  if (coarse) return { maxDpr: 1.75, antialias: dpr < 2, stars: 1000, dust: 150, burst: 130 };
  return { maxDpr: 2, antialias: true, stars: 1400, dust: 220, burst: 170 };
}
