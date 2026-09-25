// Trang rút bài Tarot 3D dạng component React — thả vào bất kỳ route nào của dự án Lovable.
// Engine 3D (three.js) nằm trong ./engine, độc lập với React; component chỉ lo giao diện và vòng đời.
import { useCallback, useEffect, useRef, useState, type FormEvent, type PointerEvent as ReactPointerEvent } from 'react';
import { Stage, shuffled, type SlotRect, type StageCallbacks, type StageState } from './engine/stage';
import { Sfx } from './engine/audio';
import { HandController, type HandFrame } from './engine/hand-tracking';
import { DEFAULT_BRAND, type BrandConfig } from './engine/config';
import { DECK, SPREADS, summarize, type Draw, type SpreadKey } from './data/deck';
import './tarot3d.css';

export interface TarotReadingResult {
  spread: SpreadKey;
  question: string;
  draws: Draw[];
}

export interface TarotExperienceProps {
  brand?: Partial<BrandConfig>;
  /** Gọi khi trải bài xong — dùng để lưu Supabase, gửi analytics, v.v. */
  onReading?: (result: TarotReadingResult) => void;
}

const FONT_HREF =
  'https://fonts.googleapis.com/css2?family=Be+Vietnam+Pro:wght@300;400;500;600&family=Cormorant+Garamond:ital,wght@0,500;0,600;0,700;1,500&display=swap';

type Phase = StageState | 'loading' | 'error';

interface Caption {
  key: number;
  label: string;
  vi: string;
  en: string;
  x: number;
  y: number;
}

export default function TarotExperience({ brand: brandProp, onReading }: TarotExperienceProps) {
  const brandRef = useRef<BrandConfig>({ ...DEFAULT_BRAND, ...brandProp });
  const brand = brandRef.current;

  const hostRef = useRef<HTMLDivElement>(null);
  const cursorRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const camCanvasRef = useRef<HTMLCanvasElement>(null);
  const readingRef = useRef<HTMLElement>(null);
  const stageRef = useRef<Stage | null>(null);
  const sfxRef = useRef<Sfx | null>(null);
  const handRef = useRef<HandController | null>(null);
  const handOnRef = useRef(false);
  const handDragRef = useRef(false);
  const sessionRef = useRef({ spread: 'time' as SpreadKey, question: '' });
  const onReadingRef = useRef(onReading);
  onReadingRef.current = onReading;

  const [phase, setPhase] = useState<Phase>('loading');
  const [introOpen, setIntroOpen] = useState(true);
  const [picked, setPicked] = useState(0);
  const [slots, setSlots] = useState<SlotRect[]>([]);
  const [caption, setCaption] = useState<Caption | null>(null);
  const [draws, setDraws] = useState<Draw[] | null>(null);
  const [flash, setFlash] = useState<{ index: number; key: number } | null>(null);
  const [hover, setHover] = useState(false);
  const [handOn, setHandOn] = useState(false);
  const [camVisible, setCamVisible] = useState(false);
  const [camStatus, setCamStatus] = useState('');
  const [soundOn, setSoundOn] = useState(true);
  const [toast, setToast] = useState<string | null>(null);
  const [session, setSession] = useState(sessionRef.current);
  const [form, setForm] = useState({ question: '', spread: 'time' as SpreadKey, deck: 'full' as 'full' | 'major', reversed: true });
  const [narrow, setNarrow] = useState(() => window.innerWidth < 600);

  const showToast = useCallback((msg: string) => {
    setToast(msg);
    window.setTimeout(() => setToast((t) => (t === msg ? null : t)), 3200);
  }, []);

  // ---------- Khởi tạo & dọn dẹp engine ----------
  useEffect(() => {
    if (!document.querySelector('link[data-vt-font]')) {
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = FONT_HREF;
      link.dataset.vtFont = '1';
      document.head.appendChild(link);
    }
    document.documentElement.classList.add('vt-lock');
    const sfx = new Sfx();
    sfxRef.current = sfx;
    setSoundOn(sfx.enabled);

    const callbacks: StageCallbacks = {
      onState: setPhase,
      onLayout: ({ slots: s }) => setSlots(s),
      onCaption: (entry, pos) => {
        if (!entry || !pos) return setCaption(null);
        const multi = SPREADS[sessionRef.current.spread].positions.length > 1;
        setCaption({
          key: Date.now(),
          label: multi ? entry.position.label : 'Thông điệp của bạn',
          vi: entry.card.vi + (entry.reversed ? ' (ngược)' : ''),
          en: entry.card.en,
          x: pos.x,
          y: pos.y,
        });
      },
      onPicked: setPicked,
      onReading: (result) => {
        setDraws(result);
        const detail = { ...sessionRef.current, draws: result };
        onReadingRef.current?.(detail);
        window.dispatchEvent(new CustomEvent('vinhtarot:reading', { detail }));
      },
      onCardClick: (index) => {
        document.getElementById(`vt-draw-${index}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        setFlash({ index, key: Date.now() });
      },
      onHover: setHover,
    };

    let stage: Stage | null = null;
    let cancelled = false;
    (async () => {
      // chờ font để chữ trên mặt lưng lá bài vẽ đúng font (tối đa 2,5 s)
      await Promise.race([document.fonts.load('600 40px "Cormorant Garamond"'), new Promise((r) => setTimeout(r, 2500))]).catch(() => {});
      if (cancelled || !hostRef.current) return; // StrictMode: lần mount thử đã bị huỷ
      try {
        stage = new Stage(hostRef.current, sfx, callbacks, brandRef.current.backText);
        stageRef.current = stage;
        setPhase('idle');
      } catch (err) {
        console.error(err);
        setPhase('error');
      }
    })();

    const onResize = () => setNarrow(window.innerWidth < 600);
    window.addEventListener('resize', onResize);
    return () => {
      cancelled = true;
      window.removeEventListener('resize', onResize);
      stage?.dispose();
      stageRef.current = null;
      handRef.current?.dispose();
      handRef.current = null;
      sfx.dispose();
      document.documentElement.classList.remove('vt-lock');
    };
  }, []);

  // ---------- Bàn phím ----------
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const stage = stageRef.current;
      if (!stage || (e.target as HTMLElement).closest?.('input, textarea, button, a')) return;
      if (e.key === 'ArrowLeft') stage.nudge(-1);
      else if (e.key === 'ArrowRight') stage.nudge(1);
      else if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        if (stage.state === 'inspecting') stage.skipHold?.();
        else stage.pickCenter();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  // ---------- Chuột / cảm ứng ----------
  const rel = (e: { clientX: number; clientY: number }) => {
    const r = hostRef.current!.getBoundingClientRect();
    return [e.clientX - r.left, e.clientY - r.top] as const;
  };
  const onPointerDown = (e: ReactPointerEvent<HTMLDivElement>) => {
    const stage = stageRef.current;
    if (!stage) return;
    sfxRef.current?.unlock();
    e.currentTarget.setPointerCapture(e.pointerId);
    const [x, y] = rel(e);
    stage.setPointer(x, y, true);
    stage.pointerDown(x, y);
  };
  const onPointerMove = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (handOnRef.current) return;
    const [x, y] = rel(e);
    stageRef.current?.setPointer(x, y, e.pointerType === 'mouse' || e.buttons > 0);
  };
  const onPointerUp = (e: ReactPointerEvent<HTMLDivElement>) => {
    const [x, y] = rel(e);
    stageRef.current?.pointerUp(x, y);
    if (e.pointerType !== 'mouse') stageRef.current?.setPointer(x, y, false);
  };

  // ---------- Luồng chính ----------
  const begin = () => {
    const stage = stageRef.current;
    if (!stage) return;
    sfxRef.current?.unlock();
    const next = { spread: form.spread, question: form.question.trim() };
    sessionRef.current = next;
    setSession(next);
    setPicked(0);
    setDraws(null);
    setCaption(null);
    setIntroOpen(false);
    const deck = form.deck === 'major' ? DECK.filter((c) => c.arcana === 'major') : DECK;
    stage.build(shuffled(deck), SPREADS[form.spread], { allowReversed: form.reversed });
    void stage.perform();
  };

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    begin();
  };

  const again = () => {
    setDraws(null);
    setIntroOpen(true);
  };

  // ---------- Cử chỉ tay ----------
  const onHandFrame = useCallback((f: HandFrame) => {
    const stage = stageRef.current;
    const cursor = cursorRef.current;
    const host = hostRef.current;
    if (!stage || !cursor || !host) return;
    if (!f.present) {
      cursor.hidden = true;
      stage.setHandSpin(0.5);
      if (f.pinchEnd && handDragRef.current) stage.pointerUp(stage.pointer.x, stage.pointer.y);
      handDragRef.current = false;
      stage.setPointer(stage.pointer.x, stage.pointer.y, false);
      return;
    }
    const rect = host.getBoundingClientRect();
    const x = (f.x ?? 0.5) * rect.width;
    const y = (f.y ?? 0.5) * rect.height;
    // cập nhật con trỏ trực tiếp vào DOM (30 lần/giây) — không qua state để tránh render lại React
    cursor.hidden = false;
    cursor.style.transform = `translate(${x}px, ${y}px)`;
    cursor.classList.toggle('vt-pinching', !!f.pinched);
    stage.setHandSpin(f.pinched ? 0.5 : (f.palmX ?? 0.5)); // không tự xoay khi đang chụm

    const under = document.elementFromPoint(rect.left + x, rect.top + y);
    const overUi = under?.closest('button, a, label, textarea, input, .vt-reading, .vt-intro-card');
    if (f.pinchStart) {
      handDragRef.current = !overUi;
      if (handDragRef.current) stage.pointerDown(x, y);
    }
    stage.setPointer(x, y, true);
    if (f.pinchEnd) {
      if (handDragRef.current) stage.pointerUp(x, y);
      else (under?.closest('button, a, label') as HTMLElement | null)?.click(); // chụm-thả trên nút = bấm
      handDragRef.current = false;
    }
  }, []);

  const setHand = async (on: boolean) => {
    const stage = stageRef.current;
    if (!on) {
      handRef.current?.stop();
      handOnRef.current = false;
      setHandOn(false);
      setCamVisible(false);
      stage?.setHandSpin(0.5);
      return false;
    }
    if (!navigator.mediaDevices?.getUserMedia) {
      showToast('Trình duyệt này không hỗ trợ camera.');
      return false;
    }
    setCamVisible(true);
    handRef.current ??= new HandController(videoRef.current!, camCanvasRef.current, onHandFrame, setCamStatus);
    try {
      await handRef.current.start();
      handOnRef.current = true;
      setHandOn(true);
      window.setTimeout(() => setCamStatus(''), 2500);
      return true;
    } catch (err) {
      console.warn(err);
      handRef.current.stop();
      setCamVisible(false);
      const denied = err instanceof DOMException && (err.name === 'NotAllowedError' || err.name === 'SecurityError');
      showToast(
        denied
          ? 'Bạn chưa cho phép dùng camera — vẫn có thể chơi bằng chạm/chuột.'
          : 'Không khởi động được nhận diện tay. Hãy thử lại hoặc dùng chạm/chuột.',
      );
      return false;
    }
  };

  // ---------- Chia sẻ ----------
  const share = async () => {
    if (!draws) return;
    const spread = SPREADS[session.spread];
    const lines = draws.map((d) => `• ${d.position.label}: ${d.card.vi}${d.reversed ? ' (ngược)' : ''} — ${d.reversed ? d.card.keysRev : d.card.keysUp}`);
    const text = [`${brand.name} · ${spread.name}`, session.question && `“${session.question}”`, ...lines].filter(Boolean).join('\n');
    const url = window.location.href.split('#')[0];
    if (navigator.share) {
      try {
        await navigator.share({ title: brand.name, text, url });
        return;
      } catch (err) {
        if ((err as Error)?.name === 'AbortError') return; // người dùng tự huỷ
      }
    }
    try {
      await navigator.clipboard.writeText(`${text}\n${url}`);
      showToast('Đã sao chép kết quả');
    } catch {
      showToast('Không sao chép được. Bạn có thể chụp màn hình kết quả để chia sẻ.');
    }
  };

  // ---------- Nội dung hiển thị ----------
  const spread = SPREADS[session.spread];
  const pos = spread.positions[picked];
  const pre = spread.positions.length > 1 && pos ? `Lá cho “${pos.label}” · ` : '';
  const guide: Partial<Record<Phase, string>> = {
    shuffling: 'Đang xào bài… hãy tập trung vào câu hỏi của bạn',
    choosing:
      pre +
      (handOn
        ? narrow
          ? 'Đưa tay sang bên để xoay · chụm tay để chọn'
          : 'Đưa tay sang trái/phải để xoay · chụm ngón cái và ngón trỏ để chọn'
        : narrow
          ? 'Vuốt để xoay · chạm để chọn'
          : 'Kéo để xoay vòng bài · chạm vào lá bạn cảm thấy được gọi tên'),
    inspecting: handOn ? 'Chụm tay để tiếp tục' : 'Chạm để tiếp tục',
    revealing: 'Những lá bài đang an bài…',
  };
  const showCounter = phase === 'choosing' || phase === 'inspecting' || phase === 'revealing';

  return (
    <div className="vt-root" data-state={phase} data-hover={hover}>
      <div
        ref={hostRef}
        className="vt-stage"
        aria-hidden="true"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={() => stageRef.current?.cancelPointer()}
        onPointerLeave={(e) => {
          if (e.pointerType === 'mouse' && !handOnRef.current) {
            const [x, y] = rel(e);
            stageRef.current?.setPointer(x, y, false);
          }
        }}
        onWheel={(e) => stageRef.current?.nudge(Math.sign(e.deltaY || e.deltaX) * 0.5)}
      />

      <header className="vt-topbar">
        <a className="vt-brand" href={brand.homeHref}>
          <span>✦</span> {brand.name}
        </a>
        <div className="vt-actions-top">
          {showCounter && (
            <span className="vt-pill">
              {picked} / {spread.positions.length}
            </span>
          )}
          <button type="button" className="vt-icon-btn" aria-pressed={handOn} title="Điều khiển bằng cử chỉ tay" onClick={() => void setHand(!handOn)}>
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M8 13V5.5a1.5 1.5 0 0 1 3 0V11m0-6.5V4a1.5 1.5 0 0 1 3 0v7m0-5.5a1.5 1.5 0 0 1 3 0V12m0-4.5a1.5 1.5 0 0 1 3 0V15a7 7 0 0 1-7 7h-1.2a6 6 0 0 1-4.6-2.2L3.6 15.6a1.6 1.6 0 0 1 2.3-2.2L8 15" />
            </svg>
            <span className="vt-label">Cử chỉ tay</span>
          </button>
          <button
            type="button"
            className="vt-icon-btn"
            aria-pressed={soundOn}
            aria-label="Bật/tắt âm thanh"
            onClick={() => {
              sfxRef.current?.unlock();
              setSoundOn(sfxRef.current?.toggle() ?? false);
            }}
          >
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M4 9h4l5-4v14l-5-4H4z" />
              <path className="vt-wave" d="M16.5 8.5a5 5 0 0 1 0 7M19 6a8.5 8.5 0 0 1 0 12" />
            </svg>
          </button>
        </div>
      </header>

      <div className="vt-slots" aria-hidden="true">
        {slots.map((s, i) => (
          <div
            key={i}
            className={`vt-slot${i < picked ? ' vt-filled' : ''}${i === picked ? ' vt-next' : ''}`}
            style={{ left: s.x, top: s.y, width: s.w, height: s.h }}
          >
            <span>{spread.positions[i]?.label}</span>
          </div>
        ))}
      </div>

      {caption && (
        <div key={caption.key} className="vt-caption" style={{ left: caption.x, top: Math.min(caption.y + 14, (hostRef.current?.clientHeight ?? 800) - 110) }}>
          <span className="vt-cap-pos">{caption.label}</span>
          <strong className="vt-cap-vi">{caption.vi}</strong>
          <span className="vt-cap-en">{caption.en}</span>
        </div>
      )}

      <p className="vt-guide" aria-live="polite">
        {introOpen ? '' : (guide[phase] ?? '')}
      </p>

      <div ref={cursorRef} className="vt-hand-cursor" hidden />
      <div className="vt-cam" hidden={!camVisible}>
        <video ref={videoRef} playsInline muted />
        <canvas ref={camCanvasRef} />
        <span className="vt-cam-status">{camStatus}</span>
      </div>

      {introOpen && phase !== 'loading' && (
        <section className="vt-intro">
          <form className="vt-intro-card" onSubmit={onSubmit}>
            <p className="vt-eyebrow">Tarot trực tuyến · Không gian 3D</p>
            <h1>
              Hỏi vũ trụ <em>một câu hỏi</em>
            </h1>
            <p className="vt-lead">Hít thở sâu, nghĩ thật rõ về điều bạn muốn biết, rồi để những lá bài dẫn lối.</p>
            <label className="vt-field">
              <span>
                Câu hỏi của bạn <small>(không bắt buộc)</small>
              </span>
              <textarea
                id="vt-question"
                rows={2}
                maxLength={200}
                placeholder="Ví dụ: Công việc của tôi 3 tháng tới sẽ ra sao?"
                value={form.question}
                onChange={(e) => setForm({ ...form, question: e.target.value })}
              />
            </label>
            <fieldset className="vt-chips">
              <legend>Kiểu trải bài</legend>
              {(Object.keys(SPREADS) as SpreadKey[]).map((key) => (
                <label key={key}>
                  <input type="radio" name="vt-spread" value={key} checked={form.spread === key} onChange={() => setForm({ ...form, spread: key })} />
                  <span>
                    {SPREADS[key].name} <small>{SPREADS[key].short}</small>
                  </span>
                </label>
              ))}
            </fieldset>
            <fieldset className="vt-chips">
              <legend>Bộ bài</legend>
              <label>
                <input type="radio" name="vt-deck" value="full" checked={form.deck === 'full'} onChange={() => setForm({ ...form, deck: 'full' })} />
                <span>78 lá đầy đủ</span>
              </label>
              <label>
                <input type="radio" name="vt-deck" value="major" checked={form.deck === 'major'} onChange={() => setForm({ ...form, deck: 'major' })} />
                <span>22 lá Ẩn Chính</span>
              </label>
            </fieldset>
            <label className="vt-switch">
              <input type="checkbox" checked={form.reversed} onChange={(e) => setForm({ ...form, reversed: e.target.checked })} />
              <span>Tính cả lá ngược</span>
            </label>
            <div className="vt-actions">
              <button type="submit" className="vt-btn vt-btn-primary" disabled={phase === 'error'}>
                Xào bài
              </button>
              <button
                type="button"
                className="vt-btn vt-btn-ghost"
                onClick={async () => {
                  if (await setHand(true)) begin();
                }}
              >
                Chơi bằng cử chỉ tay
              </button>
            </div>
            <p className="vt-fine">
              {phase === 'error'
                ? 'Thiết bị này không hỗ trợ đồ hoạ 3D (WebGL). Hãy thử trình duyệt Chrome hoặc Safari mới.'
                : 'Hình ảnh camera chỉ được xử lý ngay trên máy của bạn, không ghi lại và không gửi đi đâu.'}
            </p>
          </form>
        </section>
      )}

      {draws && (
        <section ref={readingRef} className="vt-reading" aria-live="polite">
          <div className="vt-reading-inner">
            <p className="vt-eyebrow">
              {spread.name} · {draws.length} lá
            </p>
            <h2>Thông điệp từ những lá bài</h2>
            {session.question && <p className="vt-question">“{session.question}”</p>}
            {draws.map((d, i) => (
              <article
                key={flash?.index === i ? `${i}-${flash.key}` : i}
                id={`vt-draw-${i}`}
                className={`vt-draw${flash?.index === i ? ' vt-flash' : ''}`}
                style={{ animationDelay: flash?.index === i ? '0s' : `${0.15 + i * 0.12}s` }}
              >
                <img src={d.card.img} alt={d.card.en} loading="lazy" className={d.reversed ? 'vt-rev' : undefined} />
                <div>
                  <p className="vt-pos">✦ {d.position.label}</p>
                  <p className="vt-hint">{d.position.hint}</p>
                  <h3>
                    {d.card.vi} <small>{d.card.en}</small>
                    {d.reversed && <span className="vt-tag">Ngược</span>}
                  </h3>
                  <p className="vt-keys">{d.reversed ? d.card.keysRev : d.card.keysUp}</p>
                  <p className="vt-meaning">{d.reversed ? d.card.rev : d.card.up}</p>
                </div>
              </article>
            ))}
            <div className="vt-summary">
              <h3>Tổng quan</h3>
              <ul>
                {summarize(draws).map((t) => (
                  <li key={t}>{t}</li>
                ))}
              </ul>
            </div>
            <div className="vt-actions">
              <button type="button" className="vt-btn vt-btn-primary" onClick={again}>
                Trải bài mới
              </button>
              <button type="button" className="vt-btn vt-btn-ghost" onClick={() => void share()}>
                Chia sẻ kết quả
              </button>
              <a className="vt-btn vt-btn-ghost" href={brand.bookingUrl} target="_blank" rel="noopener noreferrer">
                {brand.bookingLabel}
              </a>
            </div>
            <p className="vt-fine">Tarot mang tính chiêm nghiệm và tham khảo; quyết định cuối cùng luôn thuộc về bạn.</p>
          </div>
        </section>
      )}

      {toast && (
        <div className="vt-toast" role="status">
          {toast}
        </div>
      )}

      <div className={`vt-loader${phase !== 'loading' ? ' vt-done' : ''}`} aria-hidden={phase !== 'loading'}>
        <div className="vt-loader-mark">✦</div>
        <p>Đang thắp nến…</p>
      </div>
    </div>
  );
}
