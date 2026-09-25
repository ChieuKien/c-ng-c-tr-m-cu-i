// Mọi texture phụ đều vẽ bằng Canvas 2D ngay trên trình duyệt → không cần file ảnh, dễ đổi thương hiệu.
import * as THREE from 'three';

const GOLD = '#d9b56c';
const GOLD_SOFT = 'rgba(217,181,108,0.55)';

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

// PRNG có seed để hoa văn luôn giống nhau giữa các lần tải trang
function mulberry32(seed) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function star(ctx, x, y, rOuter, rInner, points) {
  ctx.beginPath();
  for (let i = 0; i < points * 2; i++) {
    const r = i % 2 === 0 ? rOuter : rInner;
    const a = (i / (points * 2)) * Math.PI * 2 - Math.PI / 2;
    ctx.lineTo(x + Math.cos(a) * r, y + Math.sin(a) * r);
  }
  ctx.closePath();
}

// Nửa hoa văn (vẽ 2 lần, xoay 180°) → mặt lưng đối xứng, không lộ lá xuôi/ngược
function drawBackHalf(ctx, W, H, text) {
  const cx = W / 2;
  ctx.save();
  ctx.fillStyle = GOLD;
  ctx.font = `600 ${Math.round(W * 0.062)}px "Cormorant Garamond", Georgia, serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.letterSpacing = `${Math.round(W * 0.018)}px`;
  ctx.fillText(text, cx, H * 0.085);
  // tia trang trí
  ctx.strokeStyle = GOLD_SOFT;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(W * 0.2, H * 0.125);
  ctx.lineTo(W * 0.8, H * 0.125);
  ctx.stroke();
  star(ctx, cx, H * 0.125, 9, 3.5, 4);
  ctx.fill();
  // chuỗi tuần trăng
  const phases = [-2, -1, 0, 1, 2];
  phases.forEach((p) => {
    const x = cx + p * W * 0.13;
    const y = H * 0.19;
    const r = W * 0.028;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fillStyle = GOLD;
    ctx.fill();
    if (p !== 0) {
      ctx.beginPath();
      ctx.arc(x + Math.sign(p) * r * (1.05 - Math.abs(p) * 0.3), y, r, 0, Math.PI * 2);
      ctx.fillStyle = '#140d2c';
      ctx.fill();
    }
  });
  ctx.restore();
}

export function createBackTexture(renderer, text = 'VINH TAROT') {
  const W = 512;
  const H = 896;
  const c = document.createElement('canvas');
  c.width = W;
  c.height = H;
  const ctx = c.getContext('2d');

  const bg = ctx.createRadialGradient(W / 2, H / 2, 20, W / 2, H / 2, H * 0.62);
  bg.addColorStop(0, '#2a1a5e');
  bg.addColorStop(0.55, '#150e33');
  bg.addColorStop(1, '#0a0719');
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, W, H);

  // bụi sao ngẫu nhiên có seed
  const rand = mulberry32(20260925);
  for (let i = 0; i < 260; i++) {
    const x = rand() * W;
    const y = rand() * H;
    const r = rand() * 1.6 + 0.3;
    ctx.fillStyle = `rgba(255,236,200,${0.25 + rand() * 0.5})`;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  }

  // viền kép
  ctx.strokeStyle = GOLD;
  ctx.lineWidth = 7;
  roundRect(ctx, 18, 18, W - 36, H - 36, 30);
  ctx.stroke();
  ctx.strokeStyle = GOLD_SOFT;
  ctx.lineWidth = 2;
  roundRect(ctx, 36, 36, W - 72, H - 72, 20);
  ctx.stroke();

  // biểu tượng trung tâm: vòng tròn đồng tâm + 16 tia + mặt trời/mặt trăng
  const cx = W / 2;
  const cy = H / 2;
  ctx.save();
  ctx.translate(cx, cy);
  ctx.strokeStyle = GOLD_SOFT;
  ctx.lineWidth = 1.5;
  for (let i = 0; i < 32; i++) {
    const a = (i / 32) * Math.PI * 2;
    const long = i % 2 === 0;
    ctx.beginPath();
    ctx.moveTo(Math.cos(a) * 92, Math.sin(a) * 92);
    ctx.lineTo(Math.cos(a) * (long ? 190 : 150), Math.sin(a) * (long ? 190 : 150));
    ctx.stroke();
  }
  ctx.strokeStyle = GOLD;
  ctx.lineWidth = 3;
  [88, 128, 196].forEach((r) => {
    ctx.beginPath();
    ctx.arc(0, 0, r, 0, Math.PI * 2);
    ctx.stroke();
  });
  // ngôi sao 8 cánh
  ctx.fillStyle = GOLD;
  star(ctx, 0, 0, 78, 30, 8);
  ctx.fill();
  // lưỡi liềm ở giữa
  ctx.beginPath();
  ctx.arc(0, 0, 34, 0, Math.PI * 2);
  ctx.fillStyle = '#150e33';
  ctx.fill();
  ctx.beginPath();
  ctx.arc(0, 0, 26, 0, Math.PI * 2);
  ctx.fillStyle = GOLD;
  ctx.fill();
  ctx.beginPath();
  ctx.arc(10, -6, 23, 0, Math.PI * 2);
  ctx.fillStyle = '#150e33';
  ctx.fill();
  // 4 ngôi sao nhỏ trên vòng ngoài
  ctx.fillStyle = GOLD;
  for (let i = 0; i < 4; i++) {
    const a = (i / 4) * Math.PI * 2 + Math.PI / 4;
    star(ctx, Math.cos(a) * 162, Math.sin(a) * 162, 12, 4, 4);
    ctx.fill();
  }
  ctx.restore();

  drawBackHalf(ctx, W, H, text);
  ctx.save();
  ctx.translate(W, H);
  ctx.rotate(Math.PI);
  drawBackHalf(ctx, W, H, text);
  ctx.restore();

  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = renderer.capabilities.getMaxAnisotropy();
  return tex;
}

// Đốm sáng tròn dùng cho hạt, hào quang, sao nền
export function createGlowTexture(inner = 'rgba(255,245,220,1)', mid = 'rgba(255,200,120,0.35)') {
  const s = 128;
  const c = document.createElement('canvas');
  c.width = c.height = s;
  const ctx = c.getContext('2d');
  const g = ctx.createRadialGradient(s / 2, s / 2, 0, s / 2, s / 2, s / 2);
  g.addColorStop(0, inner);
  g.addColorStop(0.25, mid);
  g.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, s, s);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

// Mặt trước dự phòng khi ảnh không tải được (mất mạng, sai đường dẫn)
export function createFallbackFace(card) {
  const W = 300;
  const H = 527;
  const c = document.createElement('canvas');
  c.width = W;
  c.height = H;
  const ctx = c.getContext('2d');
  const bg = ctx.createLinearGradient(0, 0, 0, H);
  bg.addColorStop(0, '#f4ead3');
  bg.addColorStop(1, '#e2d2ad');
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, W, H);
  ctx.strokeStyle = '#6b4f1d';
  ctx.lineWidth = 6;
  roundRect(ctx, 12, 12, W - 24, H - 24, 14);
  ctx.stroke();
  ctx.fillStyle = '#3b2a0d';
  ctx.textAlign = 'center';
  ctx.font = '600 34px "Cormorant Garamond", Georgia, serif';
  ctx.fillText(card.numeral || '', W / 2, 70);
  ctx.font = '600 30px "Cormorant Garamond", Georgia, serif';
  wrap(ctx, card.en.toUpperCase(), W / 2, H / 2, W - 50, 34);
  ctx.font = '400 22px "Be Vietnam Pro", sans-serif';
  wrap(ctx, card.vi, W / 2, H - 70, W - 50, 26);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

function wrap(ctx, text, x, y, maxW, lh) {
  const words = text.split(' ');
  const lines = [];
  let line = '';
  for (const w of words) {
    const test = line ? `${line} ${w}` : w;
    if (ctx.measureText(test).width > maxW && line) {
      lines.push(line);
      line = w;
    } else line = test;
  }
  lines.push(line);
  lines.forEach((l, i) => ctx.fillText(l, x, y + (i - (lines.length - 1) / 2) * lh));
}
