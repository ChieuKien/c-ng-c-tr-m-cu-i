// Hình học + vật liệu lá bài.
// Lá bài = khối ép đùn (ExtrudeGeometry) từ hình chữ nhật bo góc, chia 3 nhóm vật liệu:
//   nhóm 0 = mặt +Z (mặt tranh), nhóm 1 = mặt −Z (mặt lưng), nhóm 2 = cạnh viền vàng.
import * as THREE from 'three';
import { createFallbackFace } from './textures.js';

export const GROUP_FACE = 0;
export const GROUP_BACK = 1;
export const GROUP_EDGE = 2;

export function createCardGeometry({ width: w, height: h, depth: d, radius: r }) {
  const x = -w / 2;
  const y = -h / 2;
  const shape = new THREE.Shape();
  shape.moveTo(x + r, y);
  shape.lineTo(x + w - r, y);
  shape.quadraticCurveTo(x + w, y, x + w, y + r);
  shape.lineTo(x + w, y + h - r);
  shape.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  shape.lineTo(x + r, y + h);
  shape.quadraticCurveTo(x, y + h, x, y + h - r);
  shape.lineTo(x, y + r);
  shape.quadraticCurveTo(x, y, x + r, y);

  const geo = new THREE.ExtrudeGeometry(shape, { depth: d, bevelEnabled: false, curveSegments: 5 });
  geo.translate(0, 0, -d / 2);

  // ExtrudeGeometry gộp cả 2 mặt nắp vào group 0 → tách lại theo dấu của z,
  // đồng thời chuẩn hoá UV về [0,1] (mặt sau lật u để ảnh không bị soi gương).
  const pos = geo.attributes.position;
  const uv = geo.attributes.uv;
  const [lids, sides] = geo.groups;
  const front = [];
  const back = [];
  for (let tri = lids.start; tri < lids.start + lids.count; tri += 3) {
    const isFront = pos.getZ(tri) > 0;
    for (let k = 0; k < 3; k++) {
      const i = tri + k;
      const u = (pos.getX(i) + w / 2) / w;
      const v = (pos.getY(i) + h / 2) / h;
      uv.setXY(i, isFront ? u : 1 - u, v);
    }
    (isFront ? front : back).push(tri);
  }
  uv.needsUpdate = true;

  // Sắp xếp lại buffer để mỗi nhóm là một dải liên tục
  const order = [...front, ...back];
  const reorder = (attr) => {
    const src = attr.array.slice();
    const n = attr.itemSize;
    order.forEach((tri, j) => {
      for (let k = 0; k < 3 * n; k++) attr.array[(lids.start + j * 3) * n + k] = src[tri * n + k];
    });
    attr.needsUpdate = true;
  };
  reorder(pos);
  reorder(uv);
  if (geo.attributes.normal) reorder(geo.attributes.normal);

  geo.clearGroups();
  geo.addGroup(lids.start, front.length * 3, GROUP_FACE);
  geo.addGroup(lids.start + front.length * 3, back.length * 3, GROUP_BACK);
  geo.addGroup(sides.start, sides.count, GROUP_EDGE);
  geo.computeBoundingSphere();
  return geo;
}

export class CardFactory {
  constructor(renderer, backTexture, dims) {
    this.dims = dims;
    this.geometry = createCardGeometry(dims);
    this.loader = new THREE.TextureLoader();
    this.anisotropy = renderer.capabilities.getMaxAnisotropy();

    // Vật liệu dùng chung cho cả bộ bài đang xoay (có thể làm mờ cùng lúc khi kết thúc)
    this.sharedBack = new THREE.MeshStandardMaterial({ map: backTexture, roughness: 0.72, metalness: 0.05, envMapIntensity: 0.5 });
    this.sharedEdge = new THREE.MeshStandardMaterial({ color: 0xd4af5f, roughness: 0.28, metalness: 0.9 });
    // Vật liệu riêng cho lá đã rút (không bị ảnh hưởng khi bộ bài mờ đi)
    this.pickedBack = this.sharedBack.clone();
    this.pickedEdge = this.sharedEdge.clone();
    this.cache = new Map();
  }

  create(card, index) {
    // Khi còn nằm trong vòng xoay: cả hai mặt đều là mặt lưng → không lộ bài từ bất kỳ góc nào
    const mesh = new THREE.Mesh(this.geometry, [this.sharedBack, this.sharedBack, this.sharedEdge]);
    mesh.userData = { card, index, lift: 0, picked: false };
    return mesh;
  }

  // Tải ảnh mặt trước chỉ khi lá được chọn (lazy) → trang nhẹ, không tải 78 ảnh ngay từ đầu
  loadFace(card) {
    if (this.cache.has(card.id)) return this.cache.get(card.id);
    const p = new Promise((resolve) => {
      this.loader.load(
        card.img,
        (tex) => {
          tex.colorSpace = THREE.SRGBColorSpace;
          tex.anisotropy = this.anisotropy;
          resolve(tex);
        },
        undefined,
        () => resolve(createFallbackFace(card)),
      );
    });
    this.cache.set(card.id, p);
    return p;
  }

  applyFace(mesh, texture) {
    // Mặt tranh không chịu ánh sáng/tone mapping → giữ đúng màu gốc, luôn rõ nét khi đọc
    const face = new THREE.MeshBasicMaterial({ map: texture, color: 0xf4f1ea, toneMapped: false });
    mesh.material = [face, this.pickedBack, this.pickedEdge];
  }

  setDeckOpacity(o) {
    const transparent = o < 1;
    for (const m of [this.sharedBack, this.sharedEdge]) {
      if (m.transparent !== transparent) {
        m.transparent = transparent;
        m.needsUpdate = true;
      }
      m.opacity = o;
    }
  }
}
