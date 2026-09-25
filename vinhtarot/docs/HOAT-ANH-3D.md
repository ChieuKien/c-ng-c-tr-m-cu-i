# Hoạt ảnh 3D khi gieo bài — phân tích chuyên sâu

Tài liệu này giải thích **cách một trang rút bài Tarot 3D hoạt động**, từ trang tham khảo
(tarotcuabin.com) đến bản dựng lại cho **vinhtarot.com** trong thư mục này.

> Về bản quyền: repo công khai của trang tham khảo (`Dhao1601/tarotcuabin`) **không có giấy phép** (nghĩa
> là giữ toàn quyền). Vì vậy bản Vinh Tarot **không sao chép mã, ảnh mặt lưng, hay thương hiệu** của họ. Ý tưởng
> tương tác (vòng bài 3D + chụm tay để chọn) không phải đối tượng được bảo hộ, nên được viết lại từ đầu với kiến
> trúc khác và nhiều cải tiến. Ảnh mặt tranh là bộ Rider–Waite–Smith bản in 1909 (Pamela Colman Smith mất năm 1951),
> đã thuộc **phạm vi công cộng** ở Việt Nam (50 năm sau khi tác giả mất), Mỹ và EU.

---

## 1. Trang tham khảo làm gì (tóm tắt kỹ thuật)

| Thành phần | Cách họ làm | Hạn chế |
|---|---|---|
| Đồ hoạ | Three.js r128 (bản 2021) + Tween.js | Thư viện cũ, API `@mediapipe/hands` đã ngừng phát triển |
| Bộ bài | 16 lá Ẩn Chính, 1 vòng tròn, camera đặt **bên trong** vòng | Thiếu 62 lá, không có lá ngược |
| Lá bài | Hình hộp chữ nhật (6 mặt vật liệu), viền vàng kim loại | Góc vuông, nhìn giống viên gạch khi nghiêng |
| Ảnh | Tải **cả 16 ảnh** từ Wikimedia ngay khi mở trang | Tốn băng thông, phụ thuộc máy chủ ngoài |
| Chọn bài | Raycast khi bấm chuột, hoặc khi **khoảng cách ngón cái–trỏ < 0.08** | Ngưỡng tuyệt đối → tay xa camera khó chụm, tay gần dễ chụm nhầm |
| Xoay | Tay ở 40% trái/60% phải → tốc độ cố định | Xoay kiểu bật/tắt, giật |
| Hạt | 150 hạt, cập nhật **mỗi khung hình** một lượng cố định | Máy 120 Hz chạy nhanh gấp đôi máy 60 Hz |
| Xào bài | Chỉ `Math.random` sắp xếp lại mảng, **không có hoạt ảnh xào** | Thiếu "khoảnh khắc nghi lễ" |
| Camera | Tự bật ngay khi vào trang | Người dùng e ngại, trình duyệt có thể chặn |
| Kết quả | Hộp thoại 3 lá, "chơi lại" = tải lại trang | Nội dung ngắn một dòng |

Điểm hay nên giữ: **cảm giác bị bao quanh** bởi vòng bài, **chụm tay để chọn** (rất "viral" trên TikTok), lá bay
ra trước mặt rồi lật, nổ hạt sáng, cất vào khay.

---

## 2. Kiến trúc bản Vinh Tarot

```
vinhtarot/
├── index.html            # khung trang + importmap
├── css/style.css         # giao diện (tối, vàng kim, glassmorphism)
├── js/
│   ├── config.js         # thương hiệu, link đặt lịch, thông số chuyển động
│   ├── main.js           # điều phối UI: màn mở đầu, HUD, kết quả, chia sẻ
│   ├── stage.js          # ★ sân khấu 3D: bố cục, biên đạo xào/rải/rút/lật
│   ├── cards.js          # hình học lá bài bo góc + vật liệu + tải ảnh lười
│   ├── textures.js       # vẽ mặt lưng, đốm sáng, mặt dự phòng bằng Canvas 2D
│   ├── particles.js      # sao nền, bụi vàng, vụ nổ hạt (ShaderMaterial)
│   ├── tween.js          # bộ tween ~70 dòng, dùng Promise
│   ├── hand-tracking.js  # MediaPipe HandLandmarker + bộ lọc One Euro
│   ├── audio.js          # âm thanh tổng hợp bằng Web Audio
│   └── deck-data.js      # 78 lá, nghĩa xuôi/ngược tiếng Việt, kiểu trải bài
├── assets/cards/*.jpg    # 78 ảnh RWS 1909 (≈ 42 KB/ảnh, tổng 3,3 MB)
└── vendor/               # three.js r186 đã tree-shake (147 KB gzip) + RoomEnvironment
```

Máy trạng thái của sân khấu:

```
idle → shuffling → choosing ⇄ inspecting → revealing → reading
 (màn mở đầu)  (gom–xào–rải)  (chọn)   (bay–lật–cất)  (vòng tan)  (giải nghĩa)
```

---

## 3. Dựng không gian: vì sao "bao quanh" lại đẹp

* **Scene graph**: mọi lá bài là con của một `Group` tên `ring`. Xoay cả vòng chỉ cần đổi `ring.rotation.y`
  — không phải tính lại từng lá.
* **Camera nằm trong vòng**, nhìn về phía −Z. Lá ở phía xa nhỏ, hai bên to dần và cong về phía người xem →
  mắt đọc ra chiều sâu ngay lập tức. Vòng được **nghiêng −0.1 rad** (`SCENE.tilt`) để dải bài thành hình "nụ cười",
  tăng cảm giác nhìn từ trên xuống.
* **Bán kính tự tính theo số lá** để các lá không chồng nhau:
  `R = max(4.4, lá_mỗi_vòng × rộng_lá × 1.22 / 2π)`. 78 lá → 2 tầng × 39 lá, R ≈ 7,6; 22 lá → 1 tầng, R = 4,4.
* **Vị trí lá thứ k**: `θ = π + (cột + 0,5·(tầng lẻ)) / 39 × 2π`, `y = (tầng − 0,5) × 1,1 × cao_lá`.
  Tầng lẻ lệch nửa lá (kiểu xếp gạch) để không có "khe dọc". `θ = π` là chính diện camera.
* **Hướng lá**: lá ở góc θ có `rotation.y = θ` → mặt −Z (mặt lưng) luôn hướng vào tâm, tức hướng về người xem.
* **Camera đáp ứng màn hình**: ngang → FOV 52°, camera lùi về 0,7R; dọc (điện thoại) → FOV 68°, camera gần tâm
  (0,2R) để lá đủ to cho ngón tay (≈ 70 px trên iPhone).

## 4. Lá bài 3D bo góc

1. Vẽ hình chữ nhật bo góc bằng `THREE.Shape` (4 cạnh + 4 cung `quadraticCurveTo`).
2. `ExtrudeGeometry` ép đùn dày 0,016 → có mặt trước, mặt sau và **cạnh thật**.
3. Three.js gộp mặt trước và mặt sau vào cùng một nhóm vật liệu, nên code **tách lại theo dấu của z** và sắp xếp
   lại buffer thành 3 nhóm: `0 = mặt tranh (+Z)`, `1 = mặt lưng (−Z)`, `2 = cạnh`.
4. UV được chuẩn hoá về [0,1]; **mặt sau lật trục u** để chữ không bị soi gương.
5. Khi lá còn trong vòng, **cả hai mặt đều là mặt lưng** → xoay kiểu gì cũng không "lộ bài".
6. **Tải lười**: ảnh mặt tranh chỉ được tải khi lá được chọn (song song với lúc lá đang bay ≈ 0,85 s, ảnh 42 KB
   tải xong từ trước). Mỗi lượt 3 lá chỉ tốn ≈ 130 KB ảnh thay vì 3,3 MB.
7. Mặt tranh dùng `MeshBasicMaterial` + `toneMapped: false` → màu in gốc, không bị ánh đèn làm cháy.
   Cạnh vàng dùng `MeshStandardMaterial` kim loại + bản đồ môi trường `RoomEnvironment` (PMREM) để lấp lánh khi xoay.
8. Mặt lưng được **vẽ bằng Canvas 2D** (gradient chàm, 260 hạt sao có seed, vòng tròn đồng tâm, sao 8 cánh, trăng
   khuyết, chuỗi tuần trăng, chữ `VINH TAROT`) và **đối xứng xoay 180°** — đúng chuẩn mặt lưng bài Tarot, không để lộ
   lá xuôi/ngược. Đổi thương hiệu chỉ cần sửa `BRAND.backText`.

## 5. Biên đạo "gieo bài" — trái tim của hiệu ứng

Toàn bộ chuyển động được viết bằng một bộ tween nhỏ trả về `Promise`, nên kịch bản đọc như văn xuôi:

```js
await gom();          // các lá bay từ bầu trời về một xấp
await riffle(); ×2    // chia đôi – tách sang hai bên – đan xen
await raiBai();       // chia lá quanh vòng tròn
```

| Pha | Thời lượng | Kỹ thuật | Easing |
|---|---|---|---|
| **Gom** | 1,1 s + trễ so le 0,9 s cho cả bộ | Mỗi lá bay theo **Bézier bậc 2** (điểm điều khiển đẩy lên trên), hướng nội suy bằng **quaternion slerp** từ góc ngẫu nhiên về "úp mặt lưng" | `outCubic` — lao nhanh rồi đậu nhẹ |
| **Tách đôi** | 0,38 s | Hai nửa xấp dạt sang trái/phải 0,62 rộng lá, nghiêng ±0,16 rad quanh Z và −0,25 rad quanh X | `inOutCubic` |
| **Đan xen (riffle)** | 0,65 s cho cả bộ, mỗi lá 0,3 s | Lấy xen kẽ 1–3 lá từ đáy mỗi nửa; lá nảy lên 0,18 đơn vị theo `sin(πt)` rồi rơi vào xấp | `outQuad` |
| **Rải thành vòng** | 1,15 s + trễ so le 1,3 s | **Nội suy trong toạ độ cực** (θ, r, y) chứ không phải đường thẳng | `inOutCubic` cho θ, `outCubic` cho r |

**Vì sao rải theo toạ độ cực?** Nếu nội suy thẳng (hoặc Bézier) từ xấp bài tới lá ở phía sau lưng người xem,
đường bay sẽ **xuyên qua camera** — lá to phình cả màn hình trong một khung hình. Nội suy góc θ tăng dần từ π
(chính diện) đi vòng quanh tâm, bán kính r nở từ khoảng cách xấp bài tới R: lá quét thành **hình quạt** và không
bao giờ đi qua tâm. Lá thứ k quét thêm `k/39 × 360°`, tạo hiệu ứng "chia bài quanh bàn" rất tự nhiên.

**"Xào thật" khác "diễn xào"**: phần biểu diễn chỉ là hoạt ảnh. Thứ tự bài thật được xáo bằng Fisher–Yates dùng
`crypto.getRandomValues` (ngẫu nhiên mật mã, không đoán được), lá ngược cũng quyết định bằng crypto 50/50.
Điều này quan trọng với người dùng tin Tarot: kết quả không bị "sắp đặt" bởi animation.

## 6. Rút một lá: bay – lật – cất (3 pha)

1. **Tách khỏi vòng mà không giật**: `scene.attach(mesh)` chuyển lá từ `ring` ra `scene` nhưng **giữ nguyên toạ độ
   thế giới** (khác `scene.add` sẽ làm lá nhảy vị trí vì mất phép xoay của vòng).
2. **Pha A (0,85 s)**: bay theo Bézier tới điểm cách camera 3,2 đơn vị, phóng to sao cho lá chiếm 50% chiều cao màn
   hình: `scale = 0,5 × 2·d·tan(FOV/2) / cao_lá` (tự co theo chiều ngang trên điện thoại). Đèn điểm vàng sáng dần.
3. **Pha B (0,95 s) — lật**: hướng lá được dựng bằng tích quaternion
   `q(t) = Rᵧ(π·(1−t)) · R_z(π·t nếu lá ngược) · Rₓ(0,35·sin(π·t))`.
   * `Rᵧ` lật từ mặt lưng sang mặt tranh;
   * `R_z` đồng thời xoay 180° nếu là **lá ngược** → lá lật "chéo" rất khác lá xuôi;
   * `Rₓ` nghiêng nhẹ ở giữa pha cho cảm giác cầm bằng tay;
   * easing `outBack` làm lá **lật quá một chút rồi bật lại** — chi tiết nhỏ nhưng tạo cảm giác vật lý.
   Khi tiến độ vượt 42% (lá vừa qua mép 90°): nổ 170 hạt, hào quang vàng, hợp âm ngũ cung, rung nhẹ điện thoại,
   và chú thích tên lá hiện dưới lá (vị trí tính bằng `Vector3.project()` ra toạ độ màn hình).
4. **Giữ 1,9 s** (chạm để bỏ qua), rồi **Pha C (0,7 s)** bay xuống khay đáy màn hình. Khung khay là các ô HTML nét
   đứt, vị trí được chiếu từ toạ độ 3D nên luôn khớp khi đổi kích thước cửa sổ.
5. Đủ lá: vòng bài **mờ dần + nở to 40% + quay nhanh** (1,1 s), các lá đã rút bay ra vùng trái/phía trên, **xoay trọn
   một vòng** trên đường bay (0,14 s so le), nổ hạt lớn, rồi bảng giải nghĩa trượt vào.

**Vì sao dùng quaternion thay vì góc Euler?** Nội suy 3 góc Euler dễ đi đường vòng hoặc bị khoá gimbal; `slerp`
giữa hai quaternion luôn đi **đường ngắn nhất và đều tốc** — lá không "vặn vẹo" khi vừa bay vừa xoay.

## 7. Ánh sáng & hạt

* **Hạt bằng `ShaderMaterial`** (không phải `PointsMaterial`): mỗi hạt có kích thước, độ mờ, màu, seed riêng.
  Kích thước giảm theo khoảng cách: `gl_PointSize = size × 300 / −z`. Nhấp nháy tính **trên GPU** bằng
  `sin(time × tốc_độ + seed)` → 1.400 ngôi sao không tốn CPU.
* **Vật lý theo dt**: vận tốc nhân `e^(−2,2·dt)` (lực cản), trọng lực −0,35·dt, độ mờ giảm theo `(1 − tuổi/đời)²`.
  Kết quả giống nhau trên màn 60 Hz, 120 Hz hay máy yếu tụt khung hình.
* Vận tốc trục z của hạt **luôn hướng ra sau lá** → hạt toả thành quầng sáng viền quanh, không che tranh.
* `AdditiveBlending` + `depthWrite: false` cho hạt/hào quang: ánh sáng cộng dồn, không cắt nhau thành ô vuông.
* **Tone mapping ACES** cho toàn cảnh (màu điện ảnh), riêng mặt tranh tắt tone mapping để giữ màu gốc.
* **Sương mù mũ** (`FogExp2`) làm lá xa chìm dần vào nền → thêm chiều sâu không tốn chi phí.

## 8. Điều khiển bằng cử chỉ tay

* Dùng **MediaPipe Tasks Vision — HandLandmarker** (API mới thay cho `@mediapipe/hands`), chạy WebGL/GPU, tự lùi
  về CPU nếu máy không hỗ trợ. Trả về **21 điểm mốc** bàn tay mỗi khung hình video.
* Chỉ tải khi người dùng bấm "Cử chỉ tay": lần đầu ≈ **11 MB** (mô hình 7,8 MB + WASM 3,4 MB nén + 155 KB JS), sau
  đó trình duyệt lưu cache. Toàn bộ xử lý **ngay trên máy**, không gửi hình đi đâu.
* **Chụm tay chuẩn hoá theo cỡ bàn tay**: `tỉ_lệ = khoảng_cách(đầu ngón cái, đầu ngón trỏ) / khoảng_cách(cổ tay,
  gốc ngón giữa)`. Nhờ vậy tay gần hay xa camera đều chụm được như nhau.
* **Trễ (hysteresis)**: chụm khi tỉ lệ < 0,26, chỉ nhả khi > 0,42 → không "nhấp nháy" chụm/nhả ở ngưỡng.
* **Bộ lọc One Euro** cho con trỏ: đứng yên thì lọc mạnh (hết rung), di chuyển nhanh thì lọc nhẹ (không trễ).
* **Ánh xạ vùng 10–90%** khung hình ra toàn màn hình → không cần vươn tay ra mép camera.
* **Xoay kiểu cuộn mép**: lòng bàn tay lệch khỏi giữa quá 13% → tốc độ tăng mượt theo luỹ thừa 1,4 (không bật/tắt).
* **Chụm-thả = bấm, chụm-kéo = xoay** (giống chuột): chụm rồi di chuyển để kéo vòng bài; chụm rồi thả tại chỗ để chọn.
  Chụm-thả trên nút HTML (Xào bài, Trải bài mới…) cũng bấm được → **điều khiển toàn trang không cần chạm**.
* Ô xem trước camera nhỏ góc trên bên trái vẽ khung xương bàn tay để người dùng biết máy đã "thấy" tay.

## 9. Số liệu hiệu năng

| Hạng mục | Giá trị |
|---|---|
| JS tự viết (chưa nén) | ≈ 60 KB |
| three.js đã tree-shake | 584 KB (147 KB gzip) |
| Ảnh tải mỗi lượt 3 lá | ≈ 130 KB (lazy) |
| Ảnh cả bộ (nếu xem hết) | 3,3 MB (78 × ≈ 42 KB, 300×527 px) |
| Lệnh vẽ (draw call) khi chọn bài | ≈ 240 (78 lá × 3 nhóm vật liệu + sao/hạt) |
| Tổng thời lượng mở màn gieo bài | ≈ 6 s (gom 2 s · riffle ×2 ≈ 2,2 s · rải ≈ 2,4 s) |
| Chế độ tay (lần đầu) | ≈ 11 MB, xử lý ~30 khung hình/giây trên điện thoại tầm trung |

Tối ưu thêm nếu cần: gộp 78 lá thành `InstancedMesh` (còn ~3 draw call), nén ảnh sang WebP/KTX2,
giảm `perTurn`/số sao trên máy yếu (`navigator.hardwareConcurrency <= 4`).

## 10. Tuỳ biến nhanh (`js/config.js`)

| Tham số | Ý nghĩa | Gợi ý |
|---|---|---|
| `BRAND.name`, `backText` | Tên trên trang và trên mặt lưng lá bài | |
| `BRAND.bookingUrl` | Nút "Đặt lịch xem chuyên sâu" ở trang kết quả | link Messenger / Zalo OA / form đặt lịch |
| `SCENE.perTurn` | Số lá mỗi tầng | 39 (2 tầng) · 26 (3 tầng) |
| `SCENE.tilt` | Độ nghiêng vòng | −0,1 "nhìn từ trên" · 0 phẳng |
| `SCENE.idleSpin` | Tốc độ tự xoay (rad/s) | 0,05–0,2 |
| `SCENE.inspectFill` | Lá chiếm bao nhiêu chiều cao màn hình khi lật | 0,45–0,6 |
| `SCENE.holdMs` | Thời gian dừng xem mỗi lá | 1500–3000 |

Người dùng bật "giảm chuyển động" trong hệ điều hành sẽ tự nhận hoạt ảnh nhanh gấp ~1,8 lần.
