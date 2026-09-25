// Điều phối giao diện: màn mở đầu, HUD, cử chỉ tay, trang kết quả.
import { Stage, shuffled } from './stage.js';
import { DECK, SPREADS, summarize } from './deck-data.js';
import { Sfx } from './audio.js';
import { HandController } from './hand-tracking.js';
import { BRAND } from './config.js';

const $ = (s) => document.querySelector(s);
const el = {
  body: document.body,
  stage: $('#stage'),
  intro: $('#intro'),
  form: $('#intro-form'),
  question: $('#question'),
  spreadChips: $('#spread-chips'),
  reversed: $('#opt-reversed'),
  startHand: $('#btn-start-hand'),
  counter: $('#counter'),
  guide: $('#guide'),
  caption: $('#caption'),
  slots: $('#slots'),
  cursor: $('#cursor'),
  cam: $('#cam'),
  camStatus: $('#cam .cam-status'),
  btnHand: $('#btn-hand'),
  btnSound: $('#btn-sound'),
  reading: $('#reading'),
  readingList: $('#reading-list'),
  readingSpread: $('#reading-spread'),
  readingQuestion: $('#reading-question'),
  readingSummary: $('#reading-summary'),
  loader: $('#loader'),
  toast: $('#toast'),
};

const sfx = new Sfx();
const session = { spreadKey: 'time', question: '', draws: [], picked: 0 };
let hand = null;
let handOn = false;

// ---------- Màn mở đầu ----------
document.querySelectorAll('[data-brand]').forEach((n) => (n.textContent = BRAND.name));
$('#btn-book').href = BRAND.bookingUrl;
$('#btn-book').textContent = BRAND.bookingLabel;

Object.entries(SPREADS).forEach(([key, s]) => {
  const label = document.createElement('label');
  label.innerHTML = `<input type="radio" name="spread" value="${key}"${key === session.spreadKey ? ' checked' : ''}><span></span>`;
  label.querySelector('span').append(s.name, Object.assign(document.createElement('small'), { textContent: s.short }));
  el.spreadChips.append(label);
});

el.form.addEventListener('submit', (e) => {
  e.preventDefault();
  begin();
});
el.startHand.addEventListener('click', async () => {
  const ok = await setHand(true);
  if (ok) begin();
});

el.btnSound.setAttribute('aria-pressed', String(sfx.enabled));
el.btnSound.addEventListener('click', () => {
  sfx.unlock();
  el.btnSound.setAttribute('aria-pressed', String(sfx.toggle()));
});
el.btnHand.addEventListener('click', () => setHand(!handOn));

$('#btn-again').addEventListener('click', () => {
  el.reading.hidden = true;
  showIntro();
});
$('#btn-share').addEventListener('click', share);

// ---------- Sân khấu 3D ----------
const GUIDE = {
  shuffling: () => 'Đang xào bài… hãy tập trung vào câu hỏi của bạn',
  choosing: () => {
    const spread = SPREADS[session.spreadKey];
    const pos = spread.positions[session.picked];
    const pre = spread.positions.length > 1 && pos ? `Lá cho “${pos.label}” · ` : '';
    const narrow = innerWidth < 600;
    if (handOn) return pre + (narrow ? 'Đưa tay sang bên để xoay · chụm tay để chọn' : 'Đưa tay sang trái/phải để xoay · chụm ngón cái và ngón trỏ để chọn');
    return pre + (narrow ? 'Vuốt để xoay · chạm để chọn' : 'Kéo để xoay vòng bài · chạm vào lá bạn cảm thấy được gọi tên');
  },
  inspecting: () => (handOn ? 'Chụm tay để tiếp tục' : 'Chạm để tiếp tục'),
  revealing: () => 'Những lá bài đang an bài…',
};

let stage;

function onState(s) {
  el.body.dataset.state = s;
  el.guide.textContent = GUIDE[s]?.() ?? '';
  el.counter.hidden = !['choosing', 'inspecting', 'revealing'].includes(s);
  renderSlotState();
}

function onLayout({ slots }) {
  const n = slots.length;
  if (el.slots.children.length !== n) {
    el.slots.replaceChildren(
      ...slots.map((_, i) => {
        const d = document.createElement('div');
        d.className = 'slot';
        const label = document.createElement('span');
        label.textContent = SPREADS[session.spreadKey].positions[i]?.label ?? '';
        d.append(label);
        return d;
      }),
    );
  }
  slots.forEach((s, i) => {
    Object.assign(el.slots.children[i].style, { left: `${s.x}px`, top: `${s.y}px`, width: `${s.w}px`, height: `${s.h}px` });
  });
  renderSlotState();
}

function renderSlotState() {
  [...el.slots.children].forEach((d, i) => {
    d.classList.toggle('filled', i < session.picked);
    d.classList.toggle('next', i === session.picked);
  });
}

function onCaption(entry, pos) {
  if (!entry) {
    el.caption.hidden = true;
    return;
  }
  const spread = SPREADS[session.spreadKey];
  el.caption.querySelector('.cap-pos').textContent = spread.positions.length > 1 ? entry.position.label : 'Thông điệp của bạn';
  el.caption.querySelector('.cap-vi').textContent = entry.card.vi + (entry.reversed ? ' (ngược)' : '');
  el.caption.querySelector('.cap-en').textContent = entry.card.en;
  el.caption.style.left = `${pos.x}px`;
  el.caption.style.top = `${Math.min(pos.y + 14, innerHeight - 110)}px`;
  el.caption.hidden = false;
  // chạy lại animation xuất hiện
  el.caption.style.animation = 'none';
  void el.caption.offsetWidth;
  el.caption.style.animation = '';
}

function onPicked(count) {
  session.picked = count;
  el.counter.textContent = `${count} / ${SPREADS[session.spreadKey].positions.length}`;
  renderSlotState();
}

function onReading(draws) {
  session.draws = draws;
  const spread = SPREADS[session.spreadKey];
  el.readingSpread.textContent = `${spread.name} · ${draws.length} lá`;
  el.readingQuestion.hidden = !session.question;
  el.readingQuestion.textContent = session.question ? `“${session.question}”` : '';
  el.readingList.replaceChildren(
    ...draws.map((d, i) => {
      const art = document.createElement('article');
      art.className = 'draw';
      art.id = `draw-${i}`;
      art.style.animationDelay = `${0.15 + i * 0.12}s`;
      art.innerHTML = `
        <img alt="" loading="lazy">
        <div>
          <p class="pos"></p>
          <p class="hint"></p>
          <h3></h3>
          <p class="keys"></p>
          <p class="meaning"></p>
        </div>`;
      const img = art.querySelector('img');
      img.src = d.card.img;
      img.alt = d.card.en;
      img.classList.toggle('rev', d.reversed);
      art.querySelector('.pos').textContent = `✦ ${d.position.label}`;
      art.querySelector('.hint').textContent = d.position.hint;
      const h3 = art.querySelector('h3');
      h3.append(d.card.vi, ' ', Object.assign(document.createElement('small'), { textContent: d.card.en }));
      if (d.reversed) h3.append(Object.assign(document.createElement('span'), { className: 'tag', textContent: 'Ngược' }));
      art.querySelector('.keys').textContent = d.reversed ? d.card.keysRev : d.card.keysUp;
      art.querySelector('.meaning').textContent = d.reversed ? d.card.rev : d.card.up;
      return art;
    }),
  );
  el.readingSummary.replaceChildren(...summarize(draws).map((t) => Object.assign(document.createElement('li'), { textContent: t })));
  el.reading.hidden = false;
  el.reading.scrollTop = 0;

  // Sự kiện để trang chủ vinhtarot.com gắn analytics / lưu lịch sử / gửi CRM
  window.dispatchEvent(
    new CustomEvent('vinhtarot:reading', {
      detail: {
        spread: session.spreadKey,
        question: session.question,
        cards: draws.map((d) => ({ id: d.card.id, name: d.card.en, reversed: d.reversed, position: d.position.label })),
      },
    }),
  );
}

function onCardClick(i) {
  const art = document.getElementById(`draw-${i}`);
  if (!art) return;
  art.scrollIntoView({ behavior: 'smooth', block: 'start' });
  art.classList.remove('flash');
  void art.offsetWidth;
  art.classList.add('flash');
}

// ---------- Luồng chính ----------
function showIntro() {
  el.intro.hidden = false;
  el.caption.hidden = true;
  el.body.dataset.state = 'idle';
  el.guide.textContent = '';
  el.counter.hidden = true;
}

function begin() {
  sfx.unlock();
  const form = new FormData(el.form);
  session.spreadKey = form.get('spread') || 'time';
  session.question = el.question.value.trim();
  session.picked = 0;
  const deck = form.get('deck') === 'major' ? DECK.filter((c) => c.arcana === 'major') : DECK;
  const spread = SPREADS[session.spreadKey];
  el.counter.textContent = `0 / ${spread.positions.length}`;
  el.slots.replaceChildren();
  el.intro.hidden = true;
  el.reading.hidden = true;
  stage.build(shuffled(deck), spread, { allowReversed: el.reversed.checked });
  stage.perform();
}

// ---------- Nhập liệu: chuột / cảm ứng / bàn phím ----------
function bindPointer(canvas) {
  canvas.addEventListener('pointerdown', (e) => {
    sfx.unlock();
    canvas.setPointerCapture(e.pointerId);
    stage.setPointer(e.clientX, e.clientY, true);
    stage.pointerDown(e.clientX, e.clientY);
  });
  canvas.addEventListener('pointermove', (e) => {
    if (handOn) return;
    stage.setPointer(e.clientX, e.clientY, e.pointerType === 'mouse' || e.buttons > 0);
  });
  canvas.addEventListener('pointerup', (e) => {
    stage.pointerUp(e.clientX, e.clientY);
    if (e.pointerType !== 'mouse') stage.setPointer(e.clientX, e.clientY, false);
  });
  canvas.addEventListener('pointercancel', () => {
    stage.pointer.down = false;
    stage.pointer.dragging = false;
  });
  canvas.addEventListener('pointerleave', (e) => {
    if (e.pointerType === 'mouse' && !handOn) stage.setPointer(e.clientX, e.clientY, false);
  });
  canvas.addEventListener('wheel', (e) => stage.nudge(Math.sign(e.deltaY || e.deltaX) * 0.5), { passive: true });
  addEventListener('keydown', (e) => {
    if (e.target.closest('input, textarea, button, a')) return;
    if (e.key === 'ArrowLeft') stage.nudge(-1);
    else if (e.key === 'ArrowRight') stage.nudge(1);
    else if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      if (stage.state === 'inspecting') stage.skipHold?.();
      else stage.pickCenter();
    }
  });
}

// ---------- Cử chỉ tay ----------
async function setHand(on) {
  if (!on) {
    hand?.stop();
    handOn = false;
    el.cam.hidden = true;
    el.cursor.hidden = true;
    el.btnHand.setAttribute('aria-pressed', 'false');
    stage.setHandSpin(0.5);
    onState(stage.state);
    return false;
  }
  if (!navigator.mediaDevices?.getUserMedia) {
    toast('Trình duyệt này không hỗ trợ camera.');
    return false;
  }
  el.cam.hidden = false;
  hand ??= new HandController({
    video: el.cam.querySelector('video'),
    overlay: el.cam.querySelector('canvas'),
    onFrame: onHandFrame,
    onStatus: (_, text) => (el.camStatus.textContent = text),
  });
  try {
    await hand.start();
    handOn = true;
    el.btnHand.setAttribute('aria-pressed', 'true');
    onState(stage.state);
    setTimeout(() => (el.camStatus.textContent = ''), 2500);
    return true;
  } catch (err) {
    console.warn(err);
    hand.stop();
    el.cam.hidden = true;
    const denied = err && (err.name === 'NotAllowedError' || err.name === 'SecurityError');
    toast(denied ? 'Bạn chưa cho phép dùng camera — vẫn có thể chơi bằng chuột/cảm ứng.' : 'Không khởi động được nhận diện tay. Hãy thử lại hoặc dùng chuột/cảm ứng.');
    return false;
  }
}

let handDrag = false;
function onHandFrame(f) {
  if (!f.present) {
    el.cursor.hidden = true;
    stage.setHandSpin(0.5);
    if (f.pinchEnd) stage.pointerUp(stage.pointer.x, stage.pointer.y);
    stage.setPointer(stage.pointer.x, stage.pointer.y, false);
    return;
  }
  const x = f.x * innerWidth;
  const y = f.y * innerHeight;
  el.cursor.hidden = false;
  el.cursor.style.transform = `translate(${x}px, ${y}px)`;
  el.cursor.classList.toggle('pinching', f.pinched);
  // không tự xoay khi đang chụm (đang kéo hoặc sắp chọn)
  stage.setHandSpin(f.pinched ? 0.5 : f.palmX);

  const overUi = document.elementFromPoint(x, y)?.closest('button, a, label, textarea, input, .reading, .intro-card');
  if (f.pinchStart) {
    handDrag = !overUi;
    if (handDrag) stage.pointerDown(x, y);
  }
  stage.setPointer(x, y, true);
  if (f.pinchEnd) {
    if (handDrag) stage.pointerUp(x, y);
    else {
      // chụm-thả trên nút giao diện = click (điều khiển toàn bộ trang bằng tay)
      const target = document.elementFromPoint(x, y)?.closest('button, a, label');
      target?.click();
    }
    handDrag = false;
  }
}

// ---------- Chia sẻ ----------
async function share() {
  const spread = SPREADS[session.spreadKey];
  const lines = session.draws.map((d) => `• ${d.position.label}: ${d.card.vi}${d.reversed ? ' (ngược)' : ''} — ${d.reversed ? d.card.keysRev : d.card.keysUp}`);
  const text = [`${BRAND.name} · ${spread.name}`, session.question && `“${session.question}”`, ...lines].filter(Boolean).join('\n');
  const url = location.href.split('#')[0];
  if (navigator.share) {
    try {
      await navigator.share({ title: BRAND.name, text, url });
      return;
    } catch (err) {
      if (err?.name === 'AbortError') return; // người dùng tự huỷ
      // trình duyệt/khung nhúng từ chối chia sẻ → chuyển sang sao chép
    }
  }
  try {
    await navigator.clipboard.writeText(`${text}\n${url}`);
    toast('Đã sao chép kết quả');
  } catch {
    toast('Không sao chép được. Bạn có thể chụp màn hình kết quả để chia sẻ.');
  }
}

let toastTimer;
function toast(msg) {
  el.toast.textContent = msg;
  el.toast.hidden = false;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => (el.toast.hidden = true), 3200);
}

// ---------- Khởi động ----------
async function boot() {
  // chờ font để chữ trên mặt lưng lá bài vẽ đúng font thương hiệu
  await Promise.race([document.fonts.load('600 40px "Cormorant Garamond"'), new Promise((r) => setTimeout(r, 2500))]).catch(() => {});
  try {
    stage = new Stage(el.stage, {
      sfx,
      callbacks: {
        onState,
        onLayout,
        onCaption,
        onPicked,
        onReading,
        onCardClick,
        onHover: (h) => (el.body.dataset.hover = String(h)),
      },
    });
  } catch (err) {
    console.error(err);
    el.loader.querySelector('p').textContent = 'Thiết bị không hỗ trợ WebGL';
    return;
  }
  bindPointer(stage.renderer.domElement);
  window.vinhTarot = { stage, session }; // tiện debug / tích hợp
  el.loader.classList.add('done');
  setTimeout(() => el.loader.remove(), 1100);
  showIntro();
}

boot();
