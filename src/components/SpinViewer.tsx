import { useEffect, useRef, useState } from 'react';
import { useLang } from '../i18n/useLang';

const HOLD_MS = 1100; // how long each view rests before turning
const TURN_MS = 700; // how long the turn to the next view takes
const RESUME_MS = 2500; // auto-turn resumes this long after the visitor lets go

const easeInOut = (t: number) => (t < 0.5 ? 2 * t * t : 1 - (-2 * t + 2) ** 2 / 2);
const mod = (n: number, m: number) => ((n % m) + m) % m;

/**
 * "360°" view built from photos of the same bell taken from different sides
 * (front → side → back → other side), all lined up to the same size and position.
 * It turns slowly on its own; visitors can drag/swipe or use the arrow keys to turn it.
 * Neighbouring views blend into each other, so the turn looks continuous.
 */
export default function SpinViewer({ frames, alt, badge }: { frames: string[]; alt: string; badge?: string | null }) {
  const { t } = useLang();
  const n = frames.length;
  const [pos, setPos] = useState(0); // position in "frames": 1.5 = halfway between view 2 and view 3
  const posRef = useRef(0);
  const box = useRef<HTMLDivElement>(null);
  const drag = useRef<{ x: number; start: number } | null>(null);
  const tween = useRef<{ from: number; to: number; at: number } | null>(null);
  const pausedUntil = useRef(0);
  const [touched, setTouched] = useState(false);

  const move = (p: number) => {
    posRef.current = p;
    setPos(p);
  };
  const turnTo = (to: number) => (tween.current = { from: posRef.current, to, at: performance.now() });

  useEffect(() => {
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    let visible = true;
    const io = new IntersectionObserver(([e]) => (visible = e.isIntersecting));
    if (box.current) io.observe(box.current);
    let restSince = performance.now();
    let raf = 0;
    const tick = (now: number) => {
      const tw = tween.current;
      if (tw) {
        const k = Math.min(1, (now - tw.at) / TURN_MS);
        move(tw.from + (tw.to - tw.from) * easeInOut(k));
        if (k === 1) {
          tween.current = null;
          restSince = now;
        }
      } else if (!drag.current && !reduced && visible && now > pausedUntil.current && now - restSince > HOLD_MS) {
        turnTo(Math.round(posRef.current) + 1);
      } else if (drag.current || now <= pausedUntil.current) {
        restSince = now;
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(raf);
      io.disconnect();
    };
  }, []);

  function onPointerDown(e: React.PointerEvent<HTMLDivElement>) {
    e.currentTarget.setPointerCapture(e.pointerId);
    tween.current = null;
    drag.current = { x: e.clientX, start: posRef.current };
    setTouched(true);
  }
  function onPointerMove(e: React.PointerEvent<HTMLDivElement>) {
    if (!drag.current || !box.current) return;
    // Dragging across the whole photo turns the bell once
    const dx = e.clientX - drag.current.x;
    move(drag.current.start - (dx / box.current.clientWidth) * n);
  }
  function onPointerUp() {
    if (!drag.current) return;
    drag.current = null;
    pausedUntil.current = performance.now() + RESUME_MS;
    turnTo(Math.round(posRef.current)); // settle on the nearest view
  }
  function onKeyDown(e: React.KeyboardEvent) {
    if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return;
    e.preventDefault();
    setTouched(true);
    pausedUntil.current = performance.now() + RESUME_MS * 2;
    turnTo(Math.round(posRef.current) + (e.key === 'ArrowRight' ? -1 : 1));
  }

  // Current view fully drawn underneath, the next one fading in on top of it
  const base = mod(Math.floor(pos), n);
  const next = mod(base + 1, n);
  const blend = pos - Math.floor(pos);

  return (
    <div
      ref={box}
      role="img"
      aria-label={t('spinLabel', { name: alt })}
      tabIndex={0}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
      onKeyDown={onKeyDown}
      className="group relative block w-full aspect-[3/4] rounded-xl overflow-hidden bg-emerald-950 border border-emerald-800 cursor-grab active:cursor-grabbing select-none touch-pan-y outline-none focus-visible:ring-2 focus-visible:ring-gold"
    >
      {frames.map((src, i) => (
        <img
          key={src}
          src={src}
          alt=""
          draggable={false}
          decoding="async"
          className="absolute inset-0 w-full h-full object-cover pointer-events-none"
          style={{ opacity: i === base ? 1 : i === next ? blend : 0, zIndex: i === next ? 2 : i === base ? 1 : 0 }}
        />
      ))}
      {badge && (
        <span className="absolute z-10 top-3 left-3 bg-emerald-950/85 backdrop-blur text-gold-light border border-gold/40 text-[11px] font-bold uppercase tracking-wider px-3 py-1 rounded-full pointer-events-none">
          {badge}
        </span>
      )}
      <span
        className={`absolute z-10 bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-2 whitespace-nowrap text-[11px] uppercase tracking-wider bg-emerald-950/80 backdrop-blur border border-gold/40 text-gold-light px-3 py-1.5 rounded-full pointer-events-none transition-opacity duration-500 ${
          touched ? 'opacity-0' : 'opacity-100'
        }`}
      >
        <SpinIcon className="w-4 h-4" /> 360° · {t('spinHint')}
      </span>
    </div>
  );
}

export function SpinIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden>
      <ellipse cx="12" cy="12" rx="9" ry="3.5" />
      <path d="M16 7.5 18.5 9 16.5 11" />
      <path d="M12 3v3M12 18v3" />
    </svg>
  );
}
