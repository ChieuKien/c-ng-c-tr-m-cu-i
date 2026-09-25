# Bộ kit Tarot 3D cho dự án Lovable

Toàn bộ trải nghiệm rút bài 3D của Vinh Tarot (xào bài riffle, vòng bài 2 tầng, lật bài nổ hạt sáng, cử chỉ tay,
giải nghĩa 78 lá tiếng Việt) được đóng gói thành **một component React + TypeScript** đúng cấu trúc dự án Lovable
(Vite + React + TS + Tailwind/shadcn).

```
lovable-kit/
├── public/tarot/cards/        # 78 ảnh RWS 1909 (public domain), ~3,3 MB — chỉ tải lá được rút
└── src/
    ├── pages/RutBai.tsx       # trang /rut-bai dùng component
    └── features/tarot3d/
        ├── TarotExperience.tsx  # UI React: màn mở đầu, HUD, khay, giải nghĩa, chia sẻ
        ├── tarot3d.css          # style riêng, mọi class tiền tố vt- (không đụng Tailwind/shadcn)
        ├── index.ts
        ├── data/deck.ts         # 78 lá, nghĩa xuôi/ngược, 4 kiểu trải bài
        └── engine/              # three.js thuần, độc lập React
            ├── stage.ts         # ★ biên đạo 3D: gom – riffle – rải – bay – lật – cất
            ├── cards.ts  particles.ts  textures.ts  tween.ts
            ├── hand-tracking.ts # MediaPipe HandLandmarker (tải khi bật)
            ├── audio.ts  quality.ts  config.ts
```

Đã kiểm chứng trong một dự án giả lập mẫu Lovable (React 18.3, Vite 5.4, react-router 6, TypeScript 5.8):
`tsc` đạt cả cấu hình lỏng của Lovable lẫn `strict`, `vite build` đạt, chạy trọn luồng trên giả lập iPhone 13
(có React StrictMode), rời trang thì canvas/WebGL được giải phóng sạch.

---

## Cách đưa vào Lovable (khuyên dùng: đồng bộ GitHub)

Lovable **không nhận upload file code**, nên đường chắc chắn nhất là qua GitHub (Lovable đồng bộ 2 chiều với nhánh `main`).

### Bước 1 — Nối dự án Lovable với GitHub
Trong Lovable: mở dự án → nút **GitHub** (góc trên bên phải) → **Connect to GitHub** → chọn tài khoản →
**Create Repository**. Lovable tạo repo mới trên GitHub của bạn và từ đó mọi commit lên `main` sẽ tự hiện trong Lovable.

### Bước 2 — Chép kit vào repo đó
Chép nguyên 3 thứ sau vào **đúng vị trí tương ứng** trong repo Lovable:

| Từ kit | Vào repo Lovable |
|---|---|
| `src/features/tarot3d/` | `src/features/tarot3d/` |
| `src/pages/RutBai.tsx` | `src/pages/RutBai.tsx` |
| `public/tarot/cards/` | `public/tarot/cards/` |

(Nếu bạn thêm repo Lovable vào phiên Claude Code, Claude có thể làm bước 2–4 và mở Pull Request cho bạn duyệt.)

### Bước 3 — Cài thư viện
```bash
npm i three@0.186.1 @mediapipe/tasks-vision@1.0.1
npm i -D @types/three@0.186.0
```
Hoặc dán prompt ở mục dưới để Lovable tự cài.

### Bước 4 — Thêm route
Trong `src/App.tsx` (tải lười để three.js chỉ tải khi vào trang rút bài, các trang khác vẫn nhẹ):

```tsx
import { lazy, Suspense } from "react";
const RutBai = lazy(() => import("./pages/RutBai"));

// trong <Routes>, đặt TRƯỚC route "*":
<Route path="/rut-bai" element={<Suspense fallback={null}><RutBai /></Suspense>} />
```

### Bước 5 — Cho iPhone tràn màn hình
Trong `index.html`, sửa thẻ viewport thành:
```html
<meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover" />
```

### Prompt dán vào khung chat Lovable (sau khi file đã có trong repo)
```
Tôi đã thêm thư mục src/features/tarot3d, trang src/pages/RutBai.tsx và ảnh public/tarot/cards.
Hãy:
1. Cài dependencies: three@0.186.1, @mediapipe/tasks-vision@1.0.1 và devDependency @types/three@0.186.0.
2. Thêm route "/rut-bai" trong App.tsx bằng React.lazy + Suspense, đặt trước route "*".
3. Thêm viewport-fit=cover vào thẻ meta viewport trong index.html.
4. Thêm một nút "Rút bài Tarot" ở trang chủ dẫn tới /rut-bai.
KHÔNG sửa bất kỳ file nào trong src/features/tarot3d/.
```

**Nên thêm vào Project Knowledge của Lovable** (Settings → Knowledge) để AI không "tối ưu" hỏng engine:
> Thư mục `src/features/tarot3d/engine/` là engine 3D viết tay bằng three.js. Không refactor, không chuyển sang
> react-three-fiber, không đổi thời lượng/easing trừ khi tôi yêu cầu rõ. Chỉ chỉnh giao diện trong
> `TarotExperience.tsx`/`tarot3d.css` khi được yêu cầu.

---

## Tuỳ biến

```tsx
<TarotExperience
  brand={{ name: 'Vinh Tarot', backText: 'VINH TAROT', bookingUrl: 'https://m.me/<trang>', bookingLabel: 'Đặt lịch xem chuyên sâu', homeHref: '/' }}
  onReading={(r) => {
    // r = { spread, question, draws: [{ card, reversed, position }] }
    // ví dụ lưu vào Supabase (Lovable Cloud):
    // supabase.from('readings').insert({ spread: r.spread, question: r.question, cards: r.draws.map(d => d.card.id) })
  }}
/>
```

Thông số chuyển động (tốc độ xoay, cỡ lá khi lật, thời gian dừng…) nằm ở `engine/config.ts` → `SCENE`.

## Tối ưu cho điện thoại đã có sẵn

| Vấn đề trên mobile | Cách xử lý trong kit |
|---|---|
| Màn DPR 3 vẽ gấp 9 lần điểm ảnh | Giới hạn pixel ratio 1,75 trên thiết bị cảm ứng (đo được: canvas vẽ ở 1,75 trên máy DPR 3) |
| Máy yếu tụt khung hình | **Độ phân giải động**: đo FPS mỗi giây, 2 giây liền dưới 45 FPS thì hạ pixel ratio 0,25 (tối thiểu 1) |
| Tải trang chậm | three.js tách chunk riêng chỉ cho trang `/rut-bai` (173 KB gzip); MediaPipe tách chunk khác (46 KB) chỉ tải khi bật cử chỉ tay; ảnh lá bài tải lười (~130 KB/lượt 3 lá) |
| Vuốt làm cuộn trang / kéo-để-tải-lại | `touch-action: none` trên vùng 3D, khoá `overscroll-behavior` khi đang ở trang |
| iOS phóng to khi gõ câu hỏi | Ô nhập cỡ chữ 16px |
| Tai thỏ / thanh home iPhone | `env(safe-area-inset-*)` cho thanh trên, dòng hướng dẫn, khay |
| iOS chặn âm thanh | AudioContext mở khoá ở lần chạm đầu tiên |
| Mất ngữ cảnh WebGL khi chuyển app | Chặn mặc định để trình duyệt khôi phục |
| Rời trang trong SPA | `dispose()` giải phóng GPU, gỡ canvas, trả ngữ cảnh WebGL (trình duyệt giới hạn ~16 ngữ cảnh) |
| Thanh địa chỉ ẩn/hiện đổi chiều cao | `ResizeObserver` trên khung chứa, tự tính lại bố cục |
| Người dùng bật "giảm chuyển động" | Hoạt ảnh nhanh gấp ~1,8 lần, tắt animation CSS |

Cử chỉ tay cần **HTTPS** (bản publish của Lovable `*.lovable.app` hoặc tên miền riêng đều có) và quyền camera.
