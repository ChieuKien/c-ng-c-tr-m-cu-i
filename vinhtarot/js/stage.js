// Sân khấu 3D: vòng xoắn lá bài, biên đạo xào bài, rút – lật – cất bài, trải bài kết quả.
import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { Animator, Ease } from './tween.js';
import { CardFactory } from './cards.js';
import { Bursts, createDust, createStarfield } from './particles.js';
import { createBackTexture, createFallbackFace, createGlowTexture } from './textures.js';
import { SCENE, BRAND } from './config.js';

const Y_AXIS = new THREE.Vector3(0, 1, 0);
const Z_AXIS = new THREE.Vector3(0, 0, 1);
const X_AXIS = new THREE.Vector3(1, 0, 0);
const qY = (a) => new THREE.Quaternion().setFromAxisAngle(Y_AXIS, a);
const qZ = (a) => new THREE.Quaternion().setFromAxisAngle(Z_AXIS, a);
const qX = (a) => new THREE.Quaternion().setFromAxisAngle(X_AXIS, a);

// Bezier bậc 2: đường bay cong tự nhiên hơn đường thẳng
function bezier(out, p0, p1, p2, t) {
  const a = (1 - t) * (1 - t);
  const b = 2 * (1 - t) * t;
  const c = t * t;
  return out.set(a * p0.x + b * p1.x + c * p2.x, a * p0.y + b * p1.y + c * p2.y, a * p0.z + b * p1.z + c * p2.z);
}

// Ngẫu nhiên an toàn (crypto) cho việc xào bài thật — phần biểu diễn chỉ là "diễn"
function secureRandom() {
  const a = new Uint32Array(1);
  crypto.getRandomValues(a);
  return a[0] / 4294967296;
}

export function shuffled(list) {
  const a = list.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(secureRandom() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export class Stage {
  constructor(container, { sfx, callbacks }) {
    this.container = container;
    this.sfx = sfx;
    this.cb = callbacks;
    this.anim = new Animator();
    this.state = 'idle';
    this.cards = [];
    this.picked = [];
    this.hovered = null;
    this.pointer = { x: 0, y: 0, active: false, down: false, dragging: false, sx: 0, sy: 0, startRot: 0 };
    this.spin = 0;
    this.handSpin = 0;
    this.dragVel = 0;
    this.speed = matchMedia('(prefers-reduced-motion: reduce)').matches ? 0.55 : 1;
    this.skipHold = null;

    const r = (this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' }));
    r.setPixelRatio(Math.min(devicePixelRatio, 2));
    r.toneMapping = THREE.ACESFilmicToneMapping;
    r.toneMappingExposure = 1.05;
    container.appendChild(r.domElement);

    this.scene = new THREE.Scene();
    this.scene.fog = new THREE.FogExp2(0x07050f, 0.028);
    this.camera = new THREE.PerspectiveCamera(56, 1, 0.1, 200);

    const pmrem = new THREE.PMREMGenerator(r);
    this.scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
    this.scene.environmentIntensity = 0.45;
    pmrem.dispose();

    this.scene.add(new THREE.AmbientLight(0xffffff, 0.35));
    this.scene.add(new THREE.HemisphereLight(0xc9bcff, 0x1a1030, 0.6));
    const key = new THREE.DirectionalLight(0xfff0d8, 1.7);
    key.position.set(2, 6, 9);
    this.scene.add(key);
    this.spot = new THREE.PointLight(0xffcf7a, 0, 12, 2);
    this.scene.add(this.spot);

    this.glowTex = createGlowTexture();
    this.stars = createStarfield(this.glowTex);
    this.dust = createDust(this.glowTex);
    this.scene.add(this.stars, this.dust);
    this.bursts = new Bursts(this.scene, this.glowTex);

    const spriteMat = (opacity) =>
      new THREE.SpriteMaterial({ map: this.glowTex, color: 0xffc977, transparent: true, opacity, depthWrite: false, blending: THREE.AdditiveBlending });
    this.hoverGlow = new THREE.Sprite(spriteMat(0));
    this.halo = new THREE.Sprite(spriteMat(0));
    this.halo.renderOrder = -1;
    this.scene.add(this.hoverGlow, this.halo);

    this.ring = new THREE.Group();
    this.scene.add(this.ring);
    this.raycaster = new THREE.Raycaster();

    this.factory = new CardFactory(r, createBackTexture(r, BRAND.backText), SCENE.card);

    this.resize();
    addEventListener('resize', () => this.resize());
    this.clock = performance.now();
    r.setAnimationLoop((t) => this.tick(t));
  }

  // ---------- Bố cục theo kích thước màn hình ----------
  visibleSize(dist) {
    const h = 2 * Math.tan(THREE.MathUtils.degToRad(this.camera.fov / 2)) * dist;
    return { h, w: h * this.camera.aspect };
  }

  // Điểm thế giới tương ứng toạ độ NDC (-1..1) ở khoảng cách dist trước camera
  worldAt(nx, ny, dist) {
    const { w, h } = this.visibleSize(dist);
    return new THREE.Vector3(this.camera.position.x + (nx * w) / 2, this.camera.position.y + (ny * h) / 2, this.camera.position.z - dist);
  }

  toScreen(v) {
    const p = v.clone().project(this.camera);
    return { x: ((p.x + 1) / 2) * innerWidth, y: ((1 - p.y) / 2) * innerHeight };
  }

  resize() {
    const w = innerWidth;
    const h = innerHeight;
    this.renderer.setSize(w, h);
    const aspect = w / h;
    this.portrait = aspect < 0.9;
    this.camera.aspect = aspect;
    this.camera.fov = this.portrait ? 68 : 52;
    const R = this.radius || 6;
    this.camera.position.set(0, 0, this.portrait ? R * 0.2 : R * 0.7);
    this.camera.updateProjectionMatrix();
    this.camera.updateMatrixWorld(); // bắt buộc trước khi project() toạ độ ra màn hình
    this.layoutFixed();
    for (const m of [this.stars.material, this.dust.material]) m.uniforms.uPixelRatio.value = Math.min(devicePixelRatio, 2);
  }

  layoutFixed() {
    const { height: ch, width: cw } = SCENE.card;
    // vị trí lật xem
    const d = SCENE.inspectDistance;
    const vis = this.visibleSize(d);
    let s = (SCENE.inspectFill * vis.h) / ch;
    s = Math.min(s, (0.78 * vis.w) / cw);
    this.inspect = { pos: this.worldAt(0, 0.14, d), scale: s };

    // khay chứa lá đã rút ở đáy màn hình
    const n = this.spread ? this.spread.positions.length : 3;
    const dT = 3;
    const vt = this.visibleSize(dT);
    const gapRatio = 0.14;
    let st = ((this.portrait ? 0.13 : 0.17) * vt.h) / ch;
    st = Math.min(st, (0.86 * vt.w) / (cw * (n + (n - 1) * gapRatio)));
    const slotW = cw * st;
    const slotH = ch * st;
    const g = slotW * gapRatio;
    const marginBottom = ((this.portrait ? 60 : 50) / innerHeight) * vt.h; // chừa chỗ cho dòng hướng dẫn
    const y = -vt.h / 2 + marginBottom + slotH / 2;
    const total = n * slotW + (n - 1) * g;
    this.slots = Array.from({ length: n }, (_, i) => {
      const pos = new THREE.Vector3(-total / 2 + slotW / 2 + i * (slotW + g), this.camera.position.y + y, this.camera.position.z - dT);
      return { pos, scale: st };
    });
    this.picked.forEach((p, i) => {
      if (!p.busy && this.state !== 'reading' && this.state !== 'revealing') {
        p.mesh.position.copy(this.slots[i].pos);
        p.mesh.scale.setScalar(this.slots[i].scale);
      }
    });
    if (this.state === 'reading') this.layoutReading(false);
    this.emitLayout();
  }

  emitLayout() {
    const pxPerUnit = innerHeight / this.visibleSize(3).h;
    const { width: cw, height: ch } = SCENE.card;
    this.cb.onLayout?.({
      slots: this.slots.map((s) => {
        const c = this.toScreen(s.pos);
        return { x: c.x, y: c.y, w: cw * s.scale * pxPerUnit, h: ch * s.scale * pxPerUnit };
      }),
    });
  }

  // ---------- Dựng bộ bài ----------
  build(deckData, spread, { allowReversed }) {
    this.reset();
    this.spread = spread;
    this.allowReversed = allowReversed;
    const n = deckData.length;
    this.perTurn = Math.min(n, SCENE.perTurn);
    const { width: cw, height: ch } = SCENE.card;
    this.radius = Math.max(4.4, (this.perTurn * cw * 1.22) / (2 * Math.PI));
    this.pitch = ch * 1.1;
    this.rows = Math.ceil(n / this.perTurn);
    this.cards = deckData.map((card, i) => {
      const mesh = this.factory.create(card, i);
      mesh.rotation.order = 'YXZ';
      mesh.userData.base = this.ringSlot(i);
      this.ring.add(mesh);
      return mesh;
    });
    this.ring.rotation.x = SCENE.tilt;
    this.resize();
  }

  // Vị trí thứ k trên vòng: các tầng xếp chồng, tầng lẻ lệch nửa lá (kiểu xếp gạch).
  // θ bắt đầu từ π = chính diện camera → lá đầu tiên được chia rơi ngay giữa màn hình.
  ringSlot(k) {
    const row = Math.floor(k / this.perTurn);
    const col = k % this.perTurn;
    return {
      theta: Math.PI + ((col + (row % 2) * 0.5) / this.perTurn) * Math.PI * 2,
      y: (row - (this.rows - 1) / 2) * this.pitch,
      phase: secureRandom() * Math.PI * 2,
    };
  }

  reset() {
    this.anim.clear();
    this.gen = (this.gen || 0) + 1;
    this.skipHold = null;
    for (const m of this.cards) {
      m.parent?.remove(m);
      if (m.material[0] !== this.factory.sharedBack) m.material[0].dispose();
    }
    this.cards = [];
    this.picked = [];
    this.hovered = null;
    this.ring.rotation.set(0, 0, 0);
    this.ring.scale.setScalar(1);
    this.ring.visible = true;
    this.factory.setDeckOpacity(1);
    this.halo.material.opacity = 0;
    this.hoverGlow.material.opacity = 0;
    this.spot.intensity = 0;
    this.spin = 0;
    this.setState('idle');
  }

  setState(s) {
    this.state = s;
    this.cb.onState?.(s);
  }

  dur(ms) {
    return ms * this.speed;
  }

  // ---------- Biên đạo "gieo bài": gom – xào riffle – rải thành vòng xoắn ----------
  async perform() {
    this.setState('shuffling');
    const cards = this.cards;
    const n = cards.length;
    const cam = this.camera.position;
    // Các lá là con của vòng (đang nghiêng) → quy đổi vị trí/hướng của xấp bài từ toạ độ thế giới sang toạ độ cục bộ
    this.ring.updateMatrixWorld(true);
    const stackCenter = this.ring.worldToLocal(this.worldAt(0, this.portrait ? 0.08 : 0.04, this.portrait ? 5.2 : 6));
    const thick = 0.012;
    const qBack = this.ring.quaternion.clone().invert().multiply(qY(Math.PI)); // mặt lưng hướng về camera
    const stackPos = (k) => stackCenter.clone().add(new THREE.Vector3(0, 0, k * thick));

    // 1) Gom: các lá bay từ khắp bầu trời phía trước về thành một xấp
    cards.forEach((m) => {
      m.position.set((secureRandom() - 0.5) * 30, (secureRandom() - 0.5) * 18, cam.z - 12 - secureRandom() * 14);
      m.quaternion.setFromEuler(new THREE.Euler(secureRandom() * 6, secureRandom() * 6, secureRandom() * 6));
      m.scale.setScalar(1);
    });
    let order = cards.slice();
    await Promise.all(
      order.map((m, k) => {
        const p0 = m.position.clone();
        const q0 = m.quaternion.clone();
        const p2 = stackPos(k);
        const p1 = p0.clone().lerp(p2, 0.5).add(new THREE.Vector3(0, 3, 2));
        const jitter = qZ((secureRandom() - 0.5) * 0.06);
        const q2 = qBack.clone().multiply(jitter);
        return this.anim.run(
          this.dur(1100),
          (t) => {
            bezier(m.position, p0, p1, p2, t);
            m.quaternion.slerpQuaternions(q0, q2, t);
          },
          { delay: this.dur(k * (900 / n)), ease: Ease.outCubic },
        );
      }),
    );
    this.sfx.tick(0, 0.25);

    // 2) Xào kiểu riffle 2 lần: chia đôi → tách sang hai bên → đan xen lại
    const { width: cw } = SCENE.card;
    for (let round = 0; round < 2; round++) {
      const cut = Math.floor(n / 2 + (secureRandom() - 0.5) * n * 0.15);
      const left = order.slice(0, cut);
      const right = order.slice(cut);
      const splitOut = (half, dir) =>
        half.map((m) => {
          const p0 = m.position.clone();
          const q0 = m.quaternion.clone();
          const p2 = p0.clone().add(new THREE.Vector3(dir * cw * 0.62, 0, 0.25));
          const q2 = qBack.clone().multiply(qZ(dir * -0.16)).multiply(qX(-0.25));
          return this.anim.run(this.dur(380), (t) => {
            m.position.lerpVectors(p0, p2, t);
            m.quaternion.slerpQuaternions(q0, q2, t);
          }, { ease: Ease.inOutCubic });
        });
      await Promise.all([...splitOut(left, -1), ...splitOut(right, 1)]);

      // đan xen: rút xen kẽ 1–3 lá từ đáy mỗi nửa
      const merged = [];
      let li = 0;
      let ri = 0;
      let fromLeft = secureRandom() < 0.5;
      while (li < left.length || ri < right.length) {
        const take = 1 + Math.floor(secureRandom() * 3);
        for (let k = 0; k < take; k++) {
          if (fromLeft && li < left.length) merged.push(left[li++]);
          else if (!fromLeft && ri < right.length) merged.push(right[ri++]);
        }
        fromLeft = !fromLeft;
      }
      this.sfx.riffle(Math.min(n, 40), this.dur(650) / 1000);
      await Promise.all(
        merged.map((m, k) => {
          const p0 = m.position.clone();
          const q0 = m.quaternion.clone();
          const p2 = stackPos(k);
          const q2 = qBack.clone().multiply(qZ((secureRandom() - 0.5) * 0.05));
          return this.anim.run(
            this.dur(300),
            (t, raw) => {
              m.position.lerpVectors(p0, p2, t);
              m.position.y += Math.sin(raw * Math.PI) * 0.18;
              m.quaternion.slerpQuaternions(q0, q2, t);
            },
            { delay: this.dur(k * (650 / n)), ease: Ease.outQuad },
          );
        }),
      );
      order = merged;
      await this.anim.wait(this.dur(120));
    }

    // 3) Rải bài: lá thứ k "chia" quanh vòng tròn theo toạ độ cực (góc θ, bán kính r, độ cao y).
    //    Nội suy trong hệ cực → lá quét quanh tâm thành hình quạt, không bao giờ bay xuyên qua camera.
    this.sfx.whoosh(1.2);
    await Promise.all(
      order.map((m, k) => {
        m.userData.base = this.ringSlot(k);
        const { theta, y } = m.userData.base;
        const q0 = m.quaternion.clone();
        const r0 = Math.hypot(m.position.x, m.position.z);
        const y0 = m.position.y;
        const th0 = Math.atan2(m.position.x, m.position.z);
        const dTheta = (((theta - th0) % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2);
        const q = new THREE.Quaternion();
        return this.anim.run(
          this.dur(1150),
          (t, raw) => {
            const th = th0 + dTheta * t;
            const r = r0 + (this.radius - r0) * Ease.outCubic(raw);
            m.position.set(Math.sin(th) * r, y0 + (y - y0) * Ease.inOutSine(raw) + Math.sin(raw * Math.PI) * 0.6, Math.cos(th) * r);
            q.copy(qY(th)).multiply(qZ(Math.sin(raw * Math.PI) * 0.45));
            m.quaternion.slerpQuaternions(q0, q, Math.min(1, raw * 4));
          },
          { delay: this.dur(k * (1300 / n)), ease: Ease.inOutCubic },
        );
      }),
    );
    this.spin = 0;
    this.setState('choosing');
  }

  // ---------- Rút một lá ----------
  async pick(mesh) {
    if (this.state !== 'choosing' || !mesh || mesh.userData.picked) return;
    const slotIndex = this.picked.length;
    if (slotIndex >= this.slots.length) return;
    this.setState('inspecting');
    const card = mesh.userData.card;
    const reversed = this.allowReversed && secureRandom() < 0.5;
    const entry = { mesh, card, reversed, position: this.spread.positions[slotIndex], busy: true };
    this.picked.push(entry);
    mesh.userData.picked = true;
    this.hovered = null;
    const facePromise = this.factory.loadFace(card);
    this.scene.attach(mesh); // tách khỏi vòng xoay nhưng giữ nguyên toạ độ thế giới
    this.sfx.whoosh(0.7);
    navigator.vibrate?.(15);

    // Pha A — bay ra trước mặt, vẫn úp mặt lưng
    const p0 = mesh.position.clone();
    const q0 = mesh.quaternion.clone();
    const s0 = mesh.scale.x;
    const { pos: p2, scale: s2 } = this.inspect;
    const p1 = p0.clone().lerp(p2, 0.5).add(new THREE.Vector3(0, 1.1, 0.6));
    const qBack = qY(Math.PI);
    this.spot.position.copy(p2).add(new THREE.Vector3(0, 0.6, 1.4));
    await this.anim.run(
      this.dur(850),
      (t) => {
        bezier(mesh.position, p0, p1, p2, t);
        mesh.quaternion.slerpQuaternions(q0, qBack, t);
        mesh.scale.setScalar(s0 + (s2 - s0) * t);
        this.spot.intensity = 5 * t;
      },
      { ease: Ease.outCubic },
    );

    // chờ ảnh (tối đa 1.5s), lỗi thì dùng mặt vẽ tay
    const gen = this.gen;
    const tex = await Promise.race([facePromise, this.anim.wait(1500).then(() => null)]);
    if (gen !== this.gen) return; // đã bấm trải bài mới trong lúc chờ ảnh
    this.factory.applyFace(mesh, tex || createFallbackFace(card));

    // Pha B — lật 180° quanh trục Y (kèm xoay 180° quanh Z nếu là lá ngược)
    let revealed = false;
    await this.anim.run(
      this.dur(950),
      (t, raw) => {
        const q = qY(Math.PI * (1 - t));
        if (reversed) q.multiply(qZ(Math.PI * Math.min(1, t)));
        q.multiply(qX(Math.sin(raw * Math.PI) * 0.35));
        mesh.quaternion.copy(q);
        mesh.scale.setScalar(s2 * (1 + 0.07 * Math.sin(raw * Math.PI)));
        if (!revealed && raw > 0.42) {
          revealed = true;
          this.bursts.emit(mesh.position.clone().add(new THREE.Vector3(0, 0, -0.15)));
          this.sfx.chime(reversed ? 440 : 523.25);
          navigator.vibrate?.([10, 40, 20]);
          this.halo.position.copy(mesh.position).add(new THREE.Vector3(0, 0, -0.2));
          this.halo.scale.setScalar(SCENE.card.height * s2 * 2.4);
          this.anim.to(this.halo.material, { opacity: 0.85 }, 400);
          // tính theo vị trí nghỉ cuối cùng (không theo khung hình đang nghiêng/phóng to giữa lúc lật)
          const bottom = p2.clone().add(new THREE.Vector3(0, (-SCENE.card.height * s2) / 2, 0));
          this.cb.onCaption?.({ ...entry, index: slotIndex }, this.toScreen(bottom));
        }
      },
      { ease: Ease.outBack },
    );

    // Giữ để người xem đọc tên lá (chạm để bỏ qua)
    await Promise.race([this.anim.wait(this.dur(SCENE.holdMs)), new Promise((res) => (this.skipHold = res))]);
    this.skipHold = null;
    this.cb.onCaption?.(null);
    this.anim.to(this.halo.material, { opacity: 0 }, 300);
    this.anim.to(this.spot, { intensity: 0 }, 400);

    // Pha C — cất vào khay
    const slot = this.slots[slotIndex];
    const pa = mesh.position.clone();
    const qa = mesh.quaternion.clone();
    const qFinal = reversed ? qZ(Math.PI) : new THREE.Quaternion();
    const pc = pa.clone().lerp(slot.pos, 0.5).add(new THREE.Vector3(0, 0.3, 0.3));
    this.sfx.whoosh(0.5);
    await this.anim.run(
      this.dur(700),
      (t) => {
        const target = this.slots[slotIndex];
        bezier(mesh.position, pa, pc, target.pos, t);
        mesh.quaternion.slerpQuaternions(qa, qFinal, t);
        mesh.scale.setScalar(s2 + (target.scale - s2) * t);
      },
      { ease: Ease.inOutCubic },
    );
    entry.busy = false;
    this.cb.onPicked?.(this.picked.length, entry);

    if (this.picked.length >= this.slots.length) await this.finale();
    else this.setState('choosing');
  }

  // ---------- Kết thúc: vòng bài tan đi, các lá đã rút bay ra giữa ----------
  async finale() {
    this.setState('revealing');
    await this.anim.wait(this.dur(350));
    this.sfx.whoosh(1.1);
    const fade = this.anim.run(this.dur(1100), (t) => {
      this.factory.setDeckOpacity(1 - t);
      this.ring.scale.setScalar(1 + t * 0.4);
    }, { ease: Ease.inCubic });
    this.spin = 1.8;
    await this.layoutReading(true);
    await fade;
    this.ring.visible = false;
    const center = this.readingTargets.reduce((acc, t) => acc.add(t.pos), new THREE.Vector3()).divideScalar(this.readingTargets.length);
    this.bursts.emit(center.add(new THREE.Vector3(0, 0, -0.4)), { count: 260, speed: 3.2, life: 2.2 });
    this.sfx.chime(392);
    this.setState('reading');
    this.cb.onReading?.(this.picked.map(({ card, reversed, position }) => ({ card, reversed, position })));
  }

  readingSlots() {
    const n = this.picked.length;
    const { width: cw, height: ch } = SCENE.card;
    const d = 4.2;
    // vùng dành cho lá bài (NDC): ngang → nửa trái; dọc → phần trên
    const region = this.portrait ? { x0: -0.92, x1: 0.92, y0: 0.1, y1: 0.9 } : { x0: -0.92, x1: 0.1, y0: -0.62, y1: 0.72 };
    const cols = this.portrait && n > 3 ? 3 : n;
    const rows = Math.ceil(n / cols);
    const vis = this.visibleSize(d);
    const rw = ((region.x1 - region.x0) / 2) * vis.w;
    const rh = ((region.y1 - region.y0) / 2) * vis.h;
    const s = Math.min((rh * 0.9) / (rows * ch * 1.1), (rw * 0.94) / (cols * cw * 1.14));
    const cx = ((region.x0 + region.x1) / 2) * (vis.w / 2);
    const cy = ((region.y0 + region.y1) / 2) * (vis.h / 2);
    return this.picked.map((_, i) => {
      const r = Math.floor(i / cols);
      const inRow = r === rows - 1 ? n - r * cols : cols;
      const c = i - r * cols;
      const x = cx + (c - (inRow - 1) / 2) * cw * s * 1.14;
      const y = cy + ((rows - 1) / 2 - r) * ch * s * 1.1;
      return { pos: new THREE.Vector3(x, this.camera.position.y + y, this.camera.position.z - d), scale: s };
    });
  }

  layoutReading(animate) {
    const targets = this.readingSlots();
    this.readingTargets = targets;
    if (!animate) {
      this.picked.forEach((p, i) => {
        p.mesh.position.copy(targets[i].pos);
        p.mesh.scale.setScalar(targets[i].scale);
      });
      return Promise.resolve();
    }
    return Promise.all(
      this.picked.map((p, i) => {
        const m = p.mesh;
        const p0 = m.position.clone();
        const s0 = m.scale.x;
        const p1 = p0.clone().lerp(targets[i].pos, 0.5).add(new THREE.Vector3(0, 0.8, 0.6));
        const qEnd = p.reversed ? qZ(Math.PI) : new THREE.Quaternion();
        return this.anim.run(
          this.dur(1200),
          (t) => {
            bezier(m.position, p0, p1, targets[i].pos, t);
            m.quaternion.copy(qY(Math.PI * 2 * t)).multiply(qEnd); // xoay trọn một vòng khi bay
            m.scale.setScalar(s0 + (targets[i].scale - s0) * t);
          },
          { delay: this.dur(i * 140), ease: Ease.inOutCubic },
        );
      }),
    );
  }

  // ---------- Tương tác ----------
  setPointer(x, y, active = true) {
    this.pointer.x = x;
    this.pointer.y = y;
    this.pointer.active = active;
    if (this.pointer.down) {
      const dx = x - this.pointer.sx;
      if (!this.pointer.dragging && Math.hypot(dx, y - this.pointer.sy) > 8) this.pointer.dragging = true;
      if (this.pointer.dragging && this.state !== 'reading') {
        const k = (Math.PI * 1.6) / innerWidth;
        const prev = this.ring.rotation.y;
        const now = performance.now();
        const dtp = Math.max(0.008, (now - (this.pointer.lt || now)) / 1000);
        this.pointer.lt = now;
        this.ring.rotation.y = this.pointer.startRot - dx * k; // lá bài chạy theo ngón tay
        // vận tốc kéo (làm mượt) → giữ quán tính khi thả tay
        this.dragVel = this.dragVel * 0.3 + ((this.ring.rotation.y - prev) / dtp) * 0.7;
      }
    }
  }

  pointerDown(x, y) {
    Object.assign(this.pointer, { down: true, dragging: false, sx: x, sy: y, startRot: this.ring.rotation.y });
    this.dragVel = 0;
  }

  pointerUp(x, y) {
    const wasDrag = this.pointer.dragging;
    this.pointer.down = false;
    this.pointer.dragging = false;
    if (wasDrag) {
      this.spin = THREE.MathUtils.clamp(this.dragVel, -SCENE.maxSpin, SCENE.maxSpin);
      return;
    }
    this.click(x, y);
  }

  click(x, y) {
    if (this.state === 'inspecting') {
      this.skipHold?.();
      return;
    }
    const hit = this.hit(x, y, this.state === 'reading' ? this.picked.map((p) => p.mesh) : this.ring.children);
    if (this.state === 'choosing' && hit) this.pick(hit);
    else if (this.state === 'reading' && hit) this.cb.onCardClick?.(this.picked.findIndex((p) => p.mesh === hit));
  }

  hit(x, y, objects) {
    const ndc = new THREE.Vector2((x / innerWidth) * 2 - 1, -(y / innerHeight) * 2 + 1);
    this.raycaster.setFromCamera(ndc, this.camera);
    const hits = this.raycaster.intersectObjects(objects, false);
    return hits.length ? hits[0].object : null;
  }

  nudge(dir) {
    this.spin = THREE.MathUtils.clamp(this.spin + dir * 0.9, -SCENE.maxSpin, SCENE.maxSpin);
  }

  // Chọn lá gần tâm màn hình nhất (dùng cho phím Enter)
  pickCenter() {
    if (this.state !== 'choosing') return;
    let best = null;
    let bestD = Infinity;
    const v = new THREE.Vector3();
    for (const m of this.ring.children) {
      m.getWorldPosition(v);
      if (v.z > this.camera.position.z - 1) continue;
      const p = v.project(this.camera);
      const d = p.x * p.x + p.y * p.y;
      if (d < bestD) {
        bestD = d;
        best = m;
      }
    }
    this.pick(best);
  }

  setHandSpin(palmX) {
    // vùng chết ở giữa, càng ra rìa càng xoay nhanh (liên tục, không giật cục)
    const d = palmX - 0.5;
    const dead = 0.13;
    const k = Math.max(0, Math.abs(d) - dead) / (0.5 - dead);
    this.handSpin = Math.sign(d) * Math.pow(k, 1.4) * SCENE.maxSpin * 0.75;
  }

  // ---------- Vòng lặp khung hình ----------
  tick(now) {
    const dt = Math.min(0.05, (now - this.clock) / 1000);
    this.clock = now;
    this.lastDt = dt;
    const time = now / 1000;
    this.anim.update(now);

    this.stars.material.uniforms.uTime.value = time;
    this.dust.material.uniforms.uTime.value = time;
    this.stars.rotation.y = time * 0.004;
    this.dust.rotation.y = -time * 0.03;

    const live = this.state === 'choosing' || this.state === 'inspecting' || this.state === 'revealing';
    if (live) {
      if (!this.pointer.dragging) {
        const target = this.state === 'revealing' ? 2.2 : SCENE.idleSpin + this.handSpin;
        this.spin += (target - this.spin) * (1 - Math.exp(-dt * 1.6));
        this.ring.rotation.y += this.spin * dt;
      }
      this.updateHover();
      for (const m of this.ring.children) {
        const { theta, y, phase } = m.userData.base;
        const lift = (m.userData.lift += ((m === this.hovered ? 1 : 0) - m.userData.lift) * (1 - Math.exp(-dt * 10)));
        const r = this.radius - lift * 0.55;
        m.position.set(Math.sin(theta) * r, y + Math.sin(time * 1.1 + phase) * SCENE.bob + lift * 0.1, Math.cos(theta) * r);
        m.rotation.set(Math.sin(time * 0.7 + phase) * 0.05, theta, Math.sin(time * 0.5 + phase) * 0.03);
        m.scale.setScalar(1 + lift * 0.08);
      }
    }
    if (this.state === 'reading') {
      this.updateHover(this.picked.map((p) => p.mesh));
      this.picked.forEach((p, i) => {
        const t = this.readingTargets?.[i];
        if (!t) return;
        const lift = (p.mesh.userData.lift += ((p.mesh === this.hovered ? 1 : 0) - p.mesh.userData.lift) * (1 - Math.exp(-dt * 8)));
        p.mesh.position.set(t.pos.x, t.pos.y + Math.sin(time * 1.2 + i) * 0.03, t.pos.z + lift * 0.25);
      });
    }

    // hào quang theo lá đang được trỏ vào
    if (this.hovered) {
      const wp = this.hovered.getWorldPosition(new THREE.Vector3());
      const toCam = this.camera.position.clone().sub(wp).normalize();
      this.hoverGlow.position.copy(wp).addScaledVector(toCam, -0.15);
      const sc = SCENE.card.height * this.hovered.getWorldScale(new THREE.Vector3()).x * 1.9;
      this.hoverGlow.scale.setScalar(sc);
    }
    const glowTarget = this.hovered ? 0.55 : 0;
    this.hoverGlow.material.opacity += (glowTarget - this.hoverGlow.material.opacity) * (1 - Math.exp(-dt * 10));
    if (this.halo.material.opacity > 0.01) this.halo.material.rotation = time * 0.2;

    this.bursts.update(dt, time);
    this.renderer.render(this.scene, this.camera);
  }

  updateHover(objects = this.ring.children) {
    const canHover = this.pointer.active && (this.state === 'choosing' || this.state === 'reading') && !this.pointer.dragging;
    const hit = canHover ? this.hit(this.pointer.x, this.pointer.y, objects) : null;
    if (hit !== this.hovered) {
      this.hovered = hit;
      this.cb.onHover?.(!!hit);
      if (hit && this.state === 'choosing') this.sfx.tick(0, 0.05);
    }
  }
}
