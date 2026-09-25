// Hệ hạt ShaderMaterial: kích thước, độ mờ, màu riêng từng hạt; nhấp nháy tính trên GPU.
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

export type SparkPoints = THREE.Points<THREE.BufferGeometry, THREE.ShaderMaterial>;

function makeMaterial(map: THREE.Texture, twinkle: number, pixelRatio: number) {
  return new THREE.ShaderMaterial({
    uniforms: {
      uMap: { value: map },
      uTime: { value: 0 },
      uPixelRatio: { value: pixelRatio },
      uTwinkle: { value: twinkle },
    },
    vertexShader: vertex,
    fragmentShader: fragment,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });
}

const PALETTE = [new THREE.Color('#fff6e0'), new THREE.Color('#ffd98a'), new THREE.Color('#e7c9ff'), new THREE.Color('#b9d4ff')];

function makeGeometry(count: number) {
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(count * 3), 3));
  geo.setAttribute('aSize', new THREE.BufferAttribute(new Float32Array(count), 1));
  geo.setAttribute('aAlpha', new THREE.BufferAttribute(new Float32Array(count), 1));
  geo.setAttribute('aSeed', new THREE.BufferAttribute(new Float32Array(count), 1));
  geo.setAttribute('aColor', new THREE.BufferAttribute(new Float32Array(count * 3), 3));
  return geo;
}

// Bầu trời sao bao quanh cảnh
export function createStarfield(map: THREE.Texture, count: number, pixelRatio: number): SparkPoints {
  const geo = makeGeometry(count);
  const a = geo.attributes;
  for (let i = 0; i < count; i++) {
    const u = Math.random() * 2 - 1;
    const th = Math.random() * Math.PI * 2;
    const r = 25 + Math.random() * 35;
    const s = Math.sqrt(1 - u * u);
    a.position.setXYZ(i, r * s * Math.cos(th), r * u, r * s * Math.sin(th));
    a.aSize.setX(i, Math.random() < 0.06 ? 2.6 + Math.random() * 2 : 0.6 + Math.random() * 1.2);
    a.aAlpha.setX(i, 0.35 + Math.random() * 0.65);
    a.aSeed.setX(i, Math.random());
    const c = PALETTE[(Math.random() * PALETTE.length) | 0];
    a.aColor.setXYZ(i, c.r, c.g, c.b);
  }
  const pts = new THREE.Points(geo, makeMaterial(map, 1, pixelRatio));
  pts.frustumCulled = false;
  return pts;
}

// Bụi vàng lơ lửng trong lòng vòng bài
export function createDust(map: THREE.Texture, count: number, pixelRatio: number, radius = 7, height = 6): SparkPoints {
  const pts = createStarfield(map, count, pixelRatio);
  const a = pts.geometry.attributes;
  const gold = PALETTE[1];
  for (let i = 0; i < count; i++) {
    const ang = Math.random() * Math.PI * 2;
    const r = Math.sqrt(Math.random()) * radius;
    a.position.setXYZ(i, Math.cos(ang) * r, (Math.random() - 0.5) * height, Math.sin(ang) * r);
    a.aSize.setX(i, 0.25 + Math.random() * 0.45);
    a.aColor.setXYZ(i, gold.r, gold.g, gold.b);
  }
  return pts;
}

interface Burst {
  pts: SparkPoints;
  vel: Float32Array;
  age: number;
  life: number;
  base: Float32Array;
}

// Vụ nổ hạt khi lật bài — vật lý tính theo dt (không phụ thuộc FPS)
export class Bursts {
  private items: Burst[] = [];
  pixelRatio: number;

  constructor(private scene: THREE.Scene, private map: THREE.Texture, private defaultCount: number, pixelRatio: number) {
    this.pixelRatio = pixelRatio;
  }

  emit(origin: THREE.Vector3, { count = this.defaultCount, speed = 2.4, spread = 1, life = 1.6 } = {}) {
    const geo = makeGeometry(count);
    const a = geo.attributes;
    const vel = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      a.position.setXYZ(i, origin.x, origin.y, origin.z);
      const u = Math.random() * 2 - 1;
      const th = Math.random() * Math.PI * 2;
      const s = Math.sqrt(1 - u * u);
      const v = speed * (0.35 + Math.random() * 0.65);
      // z luôn âm → hạt toả ra phía sau lá bài, thành quầng sáng viền quanh thay vì che tranh
      vel.set([s * Math.cos(th) * v * spread, u * v * spread, -Math.abs(s * Math.sin(th)) * v * 0.35], i * 3);
      a.aSize.setX(i, 0.25 + Math.random() * 0.7);
      a.aAlpha.setX(i, 1);
      a.aSeed.setX(i, Math.random());
      const c = Math.random() < 0.7 ? PALETTE[1] : PALETTE[0];
      a.aColor.setXYZ(i, c.r, c.g, c.b);
    }
    const pts = new THREE.Points(geo, makeMaterial(this.map, 0.6, this.pixelRatio));
    pts.frustumCulled = false;
    pts.renderOrder = 10;
    this.scene.add(pts);
    this.items.push({ pts, vel, age: 0, life, base: (a.aAlpha.array as Float32Array).slice() });
  }

  update(dt: number, time: number) {
    for (let k = this.items.length - 1; k >= 0; k--) {
      const b = this.items[k];
      b.age += dt;
      const pos = b.pts.geometry.attributes.position;
      const alpha = b.pts.geometry.attributes.aAlpha;
      const p = pos.array as Float32Array;
      const al = alpha.array as Float32Array;
      const drag = Math.exp(-2.2 * dt);
      const fade = Math.max(0, 1 - b.age / b.life);
      for (let i = 0; i < pos.count; i++) {
        b.vel[i * 3] *= drag;
        b.vel[i * 3 + 1] = b.vel[i * 3 + 1] * drag - 0.35 * dt; // trọng lực nhẹ
        b.vel[i * 3 + 2] *= drag;
        p[i * 3] += b.vel[i * 3] * dt;
        p[i * 3 + 1] += b.vel[i * 3 + 1] * dt;
        p[i * 3 + 2] += b.vel[i * 3 + 2] * dt;
        al[i] = b.base[i] * fade * fade;
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

  dispose() {
    for (const b of this.items) {
      this.scene.remove(b.pts);
      b.pts.geometry.dispose();
      b.pts.material.dispose();
    }
    this.items = [];
  }
}
