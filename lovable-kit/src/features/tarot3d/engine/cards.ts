// Hình học + vật liệu lá bài.
// Lá bài = khối ép đùn từ hình chữ nhật bo góc, 3 nhóm vật liệu:
//   0 = mặt +Z (tranh), 1 = mặt −Z (lưng), 2 = cạnh viền vàng.
import * as THREE from 'three';
import type { CardDims } from './config';
import type { TarotCard } from '../data/deck';
import { createFallbackFace } from './textures';

export interface CardUserData {
  card: TarotCard;
  index: number;
  lift: number;
  picked: boolean;
  base: { theta: number; y: number; phase: number };
}

export type CardMesh = THREE.Mesh<THREE.BufferGeometry, THREE.Material[]> & { userData: CardUserData };

export function createCardGeometry({ width: w, height: h, depth: d, radius: r }: CardDims) {
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

  // ExtrudeGeometry gộp 2 mặt nắp vào group 0 → tách lại theo dấu z, chuẩn hoá UV về [0,1]
  // (mặt sau lật u để ảnh không bị soi gương).
  const pos = geo.attributes.position as THREE.BufferAttribute;
  const uv = geo.attributes.uv as THREE.BufferAttribute;
  const [lids, sides] = geo.groups;
  const front: number[] = [];
  const back: number[] = [];
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

  const order = [...front, ...back];
  const reorder = (attr: THREE.BufferAttribute) => {
    const src = (attr.array as Float32Array).slice();
    const n = attr.itemSize;
    order.forEach((tri, j) => {
      for (let k = 0; k < 3 * n; k++) (attr.array as Float32Array)[(lids.start + j * 3) * n + k] = src[tri * n + k];
    });
    attr.needsUpdate = true;
  };
  reorder(pos);
  reorder(uv);
  if (geo.attributes.normal) reorder(geo.attributes.normal as THREE.BufferAttribute);

  geo.clearGroups();
  geo.addGroup(lids.start, front.length * 3, 0);
  geo.addGroup(lids.start + front.length * 3, back.length * 3, 1);
  geo.addGroup(sides.start, sides.count, 2);
  geo.computeBoundingSphere();
  return geo;
}

export class CardFactory {
  readonly geometry: THREE.BufferGeometry;
  readonly sharedBack: THREE.MeshStandardMaterial;
  readonly sharedEdge: THREE.MeshStandardMaterial;
  readonly pickedBack: THREE.MeshStandardMaterial;
  readonly pickedEdge: THREE.MeshStandardMaterial;
  private loader = new THREE.TextureLoader();
  private anisotropy: number;
  private cache = new Map<string, Promise<THREE.Texture>>();
  private faces = new Set<THREE.Material>();

  constructor(renderer: THREE.WebGLRenderer, private backTexture: THREE.Texture, dims: CardDims) {
    this.geometry = createCardGeometry(dims);
    this.anisotropy = renderer.capabilities.getMaxAnisotropy();
    // Vật liệu dùng chung cho cả bộ bài đang xoay (làm mờ cùng lúc khi kết thúc)
    this.sharedBack = new THREE.MeshStandardMaterial({ map: backTexture, roughness: 0.72, metalness: 0.05, envMapIntensity: 0.5 });
    this.sharedEdge = new THREE.MeshStandardMaterial({ color: 0xd4af5f, roughness: 0.28, metalness: 0.9 });
    // Vật liệu riêng cho lá đã rút (không bị ảnh hưởng khi bộ bài mờ đi)
    this.pickedBack = this.sharedBack.clone();
    this.pickedEdge = this.sharedEdge.clone();
  }

  create(card: TarotCard, index: number): CardMesh {
    // Khi còn nằm trong vòng: cả hai mặt đều là mặt lưng → không lộ bài từ bất kỳ góc nào
    const mesh = new THREE.Mesh(this.geometry, [this.sharedBack, this.sharedBack, this.sharedEdge]) as unknown as CardMesh;
    mesh.userData = { card, index, lift: 0, picked: false, base: { theta: 0, y: 0, phase: 0 } };
    return mesh;
  }

  // Chỉ tải ảnh mặt tranh khi lá được chọn (lazy) → không tải 78 ảnh ngay từ đầu
  loadFace(card: TarotCard) {
    const hit = this.cache.get(card.id);
    if (hit) return hit;
    const p = new Promise<THREE.Texture>((resolve) => {
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

  applyFace(mesh: CardMesh, texture: THREE.Texture) {
    // Mặt tranh không chịu ánh sáng/tone mapping → giữ đúng màu gốc, luôn rõ nét
    const face = new THREE.MeshBasicMaterial({ map: texture, color: 0xf4f1ea, toneMapped: false });
    this.faces.add(face);
    mesh.material = [face, this.pickedBack, this.pickedEdge];
  }

  releaseFaces() {
    this.faces.forEach((m) => m.dispose());
    this.faces.clear();
  }

  setDeckOpacity(o: number) {
    const transparent = o < 1;
    for (const m of [this.sharedBack, this.sharedEdge]) {
      if (m.transparent !== transparent) {
        m.transparent = transparent;
        m.needsUpdate = true;
      }
      m.opacity = o;
    }
  }

  dispose() {
    this.releaseFaces();
    this.geometry.dispose();
    [this.sharedBack, this.sharedEdge, this.pickedBack, this.pickedEdge].forEach((m) => m.dispose());
    this.backTexture.dispose();
    this.cache.forEach((p) => p.then((t) => t.dispose()));
    this.cache.clear();
  }
}
