// Hệ hạt dùng ShaderMaterial: kích thước, độ mờ, màu riêng cho từng hạt; nhấp nháy tính trên GPU.
import * as THREE from 'three';

const vertex = /* glsl */ `
  attribute float aSize;
  attribute float aAlpha;
  attribute float aSeed;
  attribute vec3 aColor;
  uniform float uTime;
  uniform float uPixelRatio;
  uniform float uTwinkle;
  varying float vAlpha;
  varying vec3 vColor;
  void main() {
    vec4 mv = modelViewMatrix * vec4(position, 1.0);
    gl_Position = projectionMatrix * mv;
    float tw = mix(1.0, 0.55 + 0.45 * sin(uTime * (0.8 + aSeed * 2.2) + aSeed * 40.0), uTwinkle);
    gl_PointSize = aSize * uPixelRatio * (300.0 / -mv.z);
    vAlpha = aAlpha * tw;
    vColor = aColor;
  }
`;

const fragment = /* glsl */ `
  uniform sampler2D uMap;
  varying float vAlpha;
  varying vec3 vColor;
  void main() {
    vec4 tex = texture2D(uMap, gl_PointCoord);
    gl_FragColor = vec4(vColor * tex.rgb, tex.a * vAlpha);
  }
`;

function makeMaterial(map, twinkle) {
  return new THREE.ShaderMaterial({
    uniforms: {
      uMap: { value: map },
      uTime: { value: 0 },
      uPixelRatio: { value: Math.min(window.devicePixelRatio, 2) },
      uTwinkle: { value: twinkle },
    },
    vertexShader: vertex,
    fragmentShader: fragment,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });
}

const PALETTE = [
  new THREE.Color('#fff6e0'),
  new THREE.Color('#ffd98a'),
  new THREE.Color('#e7c9ff'),
  new THREE.Color('#b9d4ff'),
];

// Bầu trời sao bao quanh cảnh
export function createStarfield(map, count = 1400) {
  const geo = new THREE.BufferGeometry();
  const pos = new Float32Array(count * 3);
  const size = new Float32Array(count);
  const alpha = new Float32Array(count);
  const seed = new Float32Array(count);
  const color = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) {
    // phân bố đều trên vỏ cầu bán kính 25–60
    const u = Math.random() * 2 - 1;
    const th = Math.random() * Math.PI * 2;
    const r = 25 + Math.random() * 35;
    const s = Math.sqrt(1 - u * u);
    pos.set([r * s * Math.cos(th), r * u, r * s * Math.sin(th)], i * 3);
    size[i] = Math.random() < 0.06 ? 2.6 + Math.random() * 2 : 0.6 + Math.random() * 1.2;
    alpha[i] = 0.35 + Math.random() * 0.65;
    seed[i] = Math.random();
    const c = PALETTE[(Math.random() * PALETTE.length) | 0];
    color.set([c.r, c.g, c.b], i * 3);
  }
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  geo.setAttribute('aSize', new THREE.BufferAttribute(size, 1));
  geo.setAttribute('aAlpha', new THREE.BufferAttribute(alpha, 1));
  geo.setAttribute('aSeed', new THREE.BufferAttribute(seed, 1));
  geo.setAttribute('aColor', new THREE.BufferAttribute(color, 3));
  const pts = new THREE.Points(geo, makeMaterial(map, 1));
  pts.frustumCulled = false;
  return pts;
}

// Bụi vàng lơ lửng trong lòng vòng bài
export function createDust(map, count = 220, radius = 7, height = 6) {
  const pts = createStarfield(map, count);
  const pos = pts.geometry.attributes.position;
  const size = pts.geometry.attributes.aSize;
  const color = pts.geometry.attributes.aColor;
  const gold = PALETTE[1];
  for (let i = 0; i < count; i++) {
    const a = Math.random() * Math.PI * 2;
    const r = Math.sqrt(Math.random()) * radius;
    pos.setXYZ(i, Math.cos(a) * r, (Math.random() - 0.5) * height, Math.sin(a) * r);
    size.setX(i, 0.25 + Math.random() * 0.45);
    color.setXYZ(i, gold.r, gold.g, gold.b);
  }
  return pts;
}

// Vụ nổ hạt khi lật bài — vật lý tính theo dt (không phụ thuộc FPS)
export class Bursts {
  constructor(scene, map) {
    this.scene = scene;
    this.map = map;
    this.items = [];
  }

  emit(origin, { count = 170, speed = 2.4, spread = 1, life = 1.6 } = {}) {
    const geo = new THREE.BufferGeometry();
    const pos = new Float32Array(count * 3);
    const vel = new Float32Array(count * 3);
    const size = new Float32Array(count);
    const alpha = new Float32Array(count);
    const seed = new Float32Array(count);
    const color = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      pos.set([origin.x, origin.y, origin.z], i * 3);
      // hướng ngẫu nhiên đều trên mặt cầu, ép dẹt theo trục z cho giống "vòng sáng"
      const u = Math.random() * 2 - 1;
      const th = Math.random() * Math.PI * 2;
      const s = Math.sqrt(1 - u * u);
      const v = speed * (0.35 + Math.random() * 0.65);
      // z luôn âm → hạt toả ra phía sau lá bài, tạo quầng sáng viền quanh thay vì che mặt tranh
      vel.set([s * Math.cos(th) * v * spread, u * v * spread, -Math.abs(s * Math.sin(th)) * v * 0.35], i * 3);
      size[i] = 0.25 + Math.random() * 0.7;
      alpha[i] = 1;
      seed[i] = Math.random();
      const c = Math.random() < 0.7 ? PALETTE[1] : PALETTE[0];
      color.set([c.r, c.g, c.b], i * 3);
    }
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    geo.setAttribute('aSize', new THREE.BufferAttribute(size, 1));
    geo.setAttribute('aAlpha', new THREE.BufferAttribute(alpha, 1));
    geo.setAttribute('aSeed', new THREE.BufferAttribute(seed, 1));
    geo.setAttribute('aColor', new THREE.BufferAttribute(color, 3));
    const pts = new THREE.Points(geo, makeMaterial(this.map, 0.6));
    pts.frustumCulled = false;
    pts.renderOrder = 10;
    this.scene.add(pts);
    this.items.push({ pts, vel, age: 0, life, base: alpha.slice() });
  }

  update(dt, time) {
    for (let k = this.items.length - 1; k >= 0; k--) {
      const b = this.items[k];
      b.age += dt;
      const pos = b.pts.geometry.attributes.position;
      const alpha = b.pts.geometry.attributes.aAlpha;
      const drag = Math.exp(-2.2 * dt);
      const fade = Math.max(0, 1 - b.age / b.life);
      for (let i = 0; i < pos.count; i++) {
        b.vel[i * 3] *= drag;
        b.vel[i * 3 + 1] = b.vel[i * 3 + 1] * drag - 0.35 * dt; // trọng lực nhẹ
        b.vel[i * 3 + 2] *= drag;
        pos.array[i * 3] += b.vel[i * 3] * dt;
        pos.array[i * 3 + 1] += b.vel[i * 3 + 1] * dt;
        pos.array[i * 3 + 2] += b.vel[i * 3 + 2] * dt;
        alpha.array[i] = b.base[i] * fade * fade;
      }
      pos.needsUpdate = true;
      alpha.needsUpdate = true;
      b.pts.material.uniforms.uTime.value = time;
      if (b.age >= b.life) {
        this.scene.remove(b.pts);
        b.pts.geometry.dispose();
        b.pts.material.dispose();
        this.items.splice(k, 1);
      }
    }
  }
}
