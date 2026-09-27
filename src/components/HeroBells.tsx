import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { useLang } from '../i18n/useLang';
import anjaneya from '../assets/hero/anjaneya.webp';
import pranava from '../assets/hero/pranava.webp';
import gola from '../assets/hero/gola.webp';
import hanging from '../assets/hero/hanging.webp';
import jayagante from '../assets/hero/jayagante.webp';

// Transparent cut-outs from the edited photo set, trimmed and compressed.
const BELLS = [
  { src: anjaneya, label: 'heroBellAnjaneya', to: '/shop?category=hand-bell' },
  { src: pranava, label: 'heroBellPranava', to: '/shop?category=hand-bell' },
  { src: hanging, label: 'heroBellHanging', to: '/shop?category=hanging-bell' },
  { src: gola, label: 'heroBellGola', to: '/shop?category=hand-bell' },
  { src: jayagante, label: 'heroBellJayagante', to: '/shop?category=jayagante' },
];

const INTERVAL_MS = 4500;

/**
 * Home hero showcase: one bell at a time floats on a golden halo, then gives
 * way to the next. Pauses while hovered; dots let visitors pick a bell.
 */
export default function HeroBells() {
  const { t } = useLang();
  const reduceMotion = useReducedMotion();
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (paused) return;
    const timer = setInterval(() => setIndex((i) => (i + 1) % BELLS.length), INTERVAL_MS);
    return () => clearInterval(timer);
  }, [paused]);

  // Warm the cache so each bell appears instantly when its turn comes.
  useEffect(() => {
    BELLS.forEach((b) => {
      const img = new Image();
      img.src = b.src;
    });
  }, []);

  const bell = BELLS[index];

  return (
    <div
      className="relative flex flex-col items-center"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <div className="relative w-[280px] h-[330px] sm:w-[340px] sm:h-[400px] lg:w-[420px] lg:h-[500px]">
        {/* Golden halo */}
        <motion.div
          className="absolute inset-x-[8%] top-[6%] bottom-[14%] rounded-full bg-[radial-gradient(circle,rgba(232,205,138,0.35)_0%,rgba(201,162,75,0.12)_45%,transparent_70%)]"
          animate={reduceMotion ? undefined : { scale: [1, 1.06, 1], opacity: [0.85, 1, 0.85] }}
          transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
          aria-hidden
        />
        <div className="absolute inset-x-[14%] top-[10%] bottom-[18%] rounded-full border border-gold/20" aria-hidden />
        {/* Floor shadow */}
        <div
          className="absolute left-1/2 -translate-x-1/2 bottom-[3%] w-[55%] h-6 rounded-[50%] bg-black/45 blur-md"
          aria-hidden
        />

        <AnimatePresence mode="wait">
          <motion.div
            key={bell.src}
            className="absolute inset-0 flex items-end justify-center pb-[6%]"
            initial={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 30, scale: 0.94 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={reduceMotion ? { opacity: 0 } : { opacity: 0, y: -20, scale: 1.03 }}
            transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          >
            <Link to={bell.to} className="block h-[92%]" aria-label={t(bell.label)}>
              <motion.img
                src={bell.src}
                alt={t(bell.label)}
                draggable={false}
                className="h-full w-auto max-w-[min(100%,420px)] object-contain drop-shadow-[0_18px_30px_rgba(0,0,0,0.55)]"
                animate={reduceMotion ? undefined : { y: [0, -10, 0] }}
                transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
              />
            </Link>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Name + dots */}
      <AnimatePresence mode="wait">
        <motion.div
          key={bell.label}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          transition={{ duration: 0.3 }}
          className="font-heading text-gold-light text-lg mt-2"
        >
          {t(bell.label)}
        </motion.div>
      </AnimatePresence>
      <div className="flex gap-2 mt-3" role="tablist" aria-label={t('heroShowcase')}>
        {BELLS.map((b, i) => (
          <button
            key={b.label}
            role="tab"
            aria-selected={i === index}
            aria-label={t(b.label)}
            onClick={() => setIndex(i)}
            className={`h-2 rounded-full transition-all duration-300 ${
              i === index ? 'w-6 bg-gold' : 'w-2 bg-cream/30 hover:bg-cream/60'
            }`}
          />
        ))}
      </div>
    </div>
  );
}
