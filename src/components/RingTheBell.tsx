import { useCallback, useEffect, useId, useRef, useState } from 'react';
import { AnimatePresence, motion, useAnimationControls, useReducedMotion } from 'framer-motion';
import { useLang } from '../i18n/useLang';
import ganteSound from '../assets/audio/gante.mp3';

// Only one bell rings at a time across the page.
const PLAY_EVENT = 'pranavanaada:bell-play';

interface Ring {
  id: number;
  strength: number;
}

/**
 * "Ring the bell" — plays the real Pranavanaada bell recording. While it rings,
 * the page listens to the audio (Web Audio analyser) and sends out a golden
 * ring on every pulse of the sound, so the "Om… Om… Om…" beating is visible.
 * The glow around the bell follows the loudness as the ring swells and fades.
 */
export default function RingTheBell({ variant = 'hero' }: { variant?: 'hero' | 'compact' }) {
  const { t } = useLang();
  const instanceId = useId();
  const reduceMotion = useReducedMotion();
  const bellControls = useAnimationControls();

  const [playing, setPlaying] = useState(false);
  const [rings, setRings] = useState<Ring[]>([]);

  const rootRef = useRef<HTMLDivElement>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const ctxRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const gainRef = useRef<GainNode | null>(null);
  const rafRef = useRef<number>(0);
  const ringId = useRef(0);

  const spawnRing = useCallback((strength: number) => {
    const id = ++ringId.current;
    setRings((r) => [...r.slice(-9), { id, strength }]);
  }, []);

  const setLevel = (level: number) => rootRef.current?.style.setProperty('--level', level.toFixed(3));

  const stopLoop = () => {
    cancelAnimationFrame(rafRef.current);
    setLevel(0);
  };

  const stop = useCallback((fade = true) => {
    const audio = audioRef.current;
    const ctx = ctxRef.current;
    const gain = gainRef.current;
    setPlaying(false);
    stopLoop();
    if (!audio) return;
    if (fade && ctx && gain) {
      // Soft fade instead of a hard cut
      gain.gain.setTargetAtTime(0, ctx.currentTime, 0.15);
      window.setTimeout(() => {
        audio.pause();
        gain.gain.value = 1;
      }, 600);
    } else {
      audio.pause();
    }
  }, []);

  // Follow the sound: RMS loudness drives the glow; each local peak is a pulse → ring.
  const startLoop = useCallback(() => {
    const analyser = analyserRef.current;
    const buf = analyser ? new Float32Array(analyser.fftSize) : null;
    let smooth = 0;
    let prev = 0;
    let rising = false;
    let lastPulse = 0;
    const started = performance.now();

    const tick = (now: number) => {
      let rms: number;
      if (analyser && buf) {
        analyser.getFloatTimeDomainData(buf);
        let sum = 0;
        for (let i = 0; i < buf.length; i++) sum += buf[i] * buf[i];
        rms = Math.sqrt(sum / buf.length);
      } else {
        // No Web Audio: approximate the recording's swell-and-fade with ~5 pulses/s
        const s = (now - started) / 1000;
        const envelope = Math.min(1, s / 6) * Math.exp(-Math.max(0, s - 7) / 4);
        rms = 0.12 * envelope * (0.6 + 0.4 * Math.sin(s * Math.PI * 2 * 4.8));
      }
      smooth = smooth * 0.55 + rms * 0.45;
      setLevel(Math.min(1, smooth * 5));

      if (smooth > prev) rising = true;
      else if (rising && smooth < prev) {
        rising = false;
        if (prev > 0.012 && now - lastPulse > 150) {
          lastPulse = now;
          // Scaled so the loudest pulses (~0.14 RMS in the recording) are near 0.65,
          // leaving visible difference as the ring swells and fades.
          spawnRing(Math.min(1, prev * 4.5));
        }
      }
      prev = smooth;
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
  }, [spawnRing]);

  async function ring() {
    if (playing) {
      stop();
      return;
    }
    window.dispatchEvent(new CustomEvent(PLAY_EVENT, { detail: instanceId }));

    if (!audioRef.current) {
      const audio = new Audio(ganteSound);
      audio.preload = 'auto';
      audio.addEventListener('ended', () => {
        setPlaying(false);
        stopLoop();
      });
      audioRef.current = audio;
      try {
        const Ctx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
        const ctx = new Ctx();
        const source = ctx.createMediaElementSource(audio);
        const gain = ctx.createGain();
        const analyser = ctx.createAnalyser();
        analyser.fftSize = 1024;
        source.connect(gain).connect(analyser).connect(ctx.destination);
        ctxRef.current = ctx;
        gainRef.current = gain;
        analyserRef.current = analyser;
      } catch {
        // Web Audio unavailable — the sound still plays, animation is approximated.
      }
    }

    const audio = audioRef.current;
    await ctxRef.current?.resume().catch(() => {});
    if (gainRef.current) gainRef.current.gain.value = 1;
    audio.currentTime = 0;
    try {
      await audio.play();
    } catch {
      return;
    }
    setPlaying(true);
    if (!reduceMotion) {
      // The strike: the bell swings and settles
      bellControls.start({
        rotate: [0, -16, 12, -8, 5, -2, 0],
        transition: { duration: 1.8, ease: 'easeOut' },
      });
    }
    startLoop();
  }

  // Stop if another bell on the page starts, and clean up on unmount.
  useEffect(() => {
    const onOther = (e: Event) => {
      if ((e as CustomEvent).detail !== instanceId) stop(false);
    };
    window.addEventListener(PLAY_EVENT, onOther);
    return () => {
      window.removeEventListener(PLAY_EVENT, onOther);
      cancelAnimationFrame(rafRef.current);
      audioRef.current?.pause();
      ctxRef.current?.close().catch(() => {});
    };
  }, [instanceId, stop]);

  const hero = variant === 'hero';
  const size = hero ? 'w-24 h-24 md:w-28 md:h-28' : 'w-14 h-14';

  const button = (
    <div className={`relative ${size} shrink-0`}>
      {/* Sound rings — one per pulse of the real audio */}
      {!reduceMotion && (
        <div className="absolute inset-0 pointer-events-none" aria-hidden>
          <AnimatePresence>
            {rings.map((r) => (
              <motion.span
                key={r.id}
                className="absolute inset-0 rounded-full border-2 border-gold"
                initial={{ scale: 1, opacity: 0.25 + r.strength * 0.6 }}
                animate={{ scale: hero ? 3.4 : 2.6, opacity: 0 }}
                transition={{ duration: 2.2, ease: 'easeOut' }}
                onAnimationComplete={() => setRings((all) => all.filter((x) => x.id !== r.id))}
              />
            ))}
          </AnimatePresence>
        </div>
      )}

      <motion.button
        type="button"
        onClick={ring}
        aria-pressed={playing}
        aria-label={playing ? t('stopSound') : t('ringBell')}
        whileHover={{ scale: 1.06 }}
        whileTap={{ scale: 0.94 }}
        className="bell-glow relative w-full h-full rounded-full bg-gradient-to-b from-emerald-800 to-emerald-950 border-2 border-gold/80 text-gold flex items-center justify-center"
      >
        <motion.span animate={bellControls} style={{ originX: 0.5, originY: 0.08 }} className="block w-1/2 h-1/2">
          <BellGlyph />
        </motion.span>
        {/* Idle hint: a slow breathing ring so it reads as tappable */}
        {!playing && !reduceMotion && (
          <motion.span
            className="absolute inset-0 rounded-full border border-gold/50"
            animate={{ scale: [1, 1.25], opacity: [0.6, 0] }}
            transition={{ duration: 2.4, repeat: Infinity, ease: 'easeOut' }}
            aria-hidden
          />
        )}
      </motion.button>
    </div>
  );

  if (!hero) {
    return (
      <div ref={rootRef} className="inline-flex items-center gap-3">
        {button}
        <div className="text-left">
          <div className="text-sm text-cream">{playing ? t('stopSound') : t('hearBell')}</div>
          <div className="text-xs text-cream/50">{playing ? t('listening') : t('ringHint')}</div>
        </div>
      </div>
    );
  }

  return (
    <div ref={rootRef} className="flex flex-col items-center">
      {button}
      <div className="mt-5 h-10 text-center">
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={playing ? 'on' : 'off'}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.25 }}
          >
            <div className="text-sm font-semibold text-gold-light">{playing ? t('listening') : t('ringBell')}</div>
            <div className="text-xs text-cream/60">{playing ? t('tapToStop') : t('ringHint')}</div>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}

/** Hand bell drawing used inside the button. */
function BellGlyph() {
  return (
    <svg viewBox="0 0 48 48" className="w-full h-full" aria-hidden>
      <defs>
        <linearGradient id="bell-gold" x1="0" x2="1" y1="0" y2="1">
          <stop offset="0" stopColor="#f3dc9b" />
          <stop offset="0.5" stopColor="#c9a24b" />
          <stop offset="1" stopColor="#8a6a22" />
        </linearGradient>
      </defs>
      {/* finial + handle */}
      <circle cx="24" cy="4.5" r="2.6" fill="url(#bell-gold)" />
      <rect x="22" y="6.5" width="4" height="11" rx="1.6" fill="url(#bell-gold)" />
      <rect x="20.5" y="9" width="7" height="1.6" rx="0.8" fill="#8a6a22" opacity="0.6" />
      <rect x="20.5" y="12.5" width="7" height="1.6" rx="0.8" fill="#8a6a22" opacity="0.6" />
      {/* bell body */}
      <path d="M24 17c-6.6 0-10.4 4.8-10.4 11.2v6.6L10 39.5h28l-3.6-4.7v-6.6C34.4 21.8 30.6 17 24 17z" fill="url(#bell-gold)" />
      <path d="M10 39.5h28" stroke="#8a6a22" strokeWidth="1.6" strokeLinecap="round" />
      <circle cx="24" cy="43" r="2.4" fill="url(#bell-gold)" />
      {/* highlight */}
      <path d="M18 24c.8-2.6 2.6-4 4.6-4.4" stroke="#fff6d8" strokeWidth="1.4" strokeLinecap="round" fill="none" opacity="0.7" />
    </svg>
  );
}
