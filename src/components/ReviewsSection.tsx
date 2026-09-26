import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useReducedMotion } from 'framer-motion';
import { useLang } from '../i18n/useLang';
import { reviews } from '../data/reviews';
import type { Review } from '../types/review';
import ReviewCard, { ReviewModal } from './ReviewCard';
import { Reveal } from './motion';

const AUTO_ADVANCE_MS = 6000;

/**
 * Home page testimonials: a swipeable, snap-scrolling row of review cards with
 * arrow buttons. Advances on its own until the visitor hovers or interacts.
 */
export default function ReviewsSection() {
  const trackRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState<Review | null>(null);
  const [paused, setPaused] = useState(false);
  const [interacted, setInteracted] = useState(false);
  const [atStart, setAtStart] = useState(true);
  const [atEnd, setAtEnd] = useState(false);
  const reduceMotion = useReducedMotion();
  const { t } = useLang();

  function updateEdges() {
    const el = trackRef.current;
    if (!el) return;
    setAtStart(el.scrollLeft < 8);
    setAtEnd(el.scrollLeft + el.clientWidth >= el.scrollWidth - 8);
  }

  function scrollByCard(direction: 1 | -1) {
    const el = trackRef.current;
    if (!el) return;
    const card = el.querySelector<HTMLElement>('[data-card]');
    const step = card ? card.offsetWidth + 20 : el.clientWidth * 0.8; // 20 = gap-5
    el.scrollBy({ left: direction * step, behavior: 'smooth' });
  }

  useEffect(() => {
    if (paused || interacted || open || reduceMotion) return;
    const timer = setInterval(() => {
      const el = trackRef.current;
      if (!el) return;
      if (el.scrollLeft + el.clientWidth >= el.scrollWidth - 8) el.scrollTo({ left: 0, behavior: 'smooth' });
      else scrollByCard(1);
    }, AUTO_ADVANCE_MS);
    return () => clearInterval(timer);
  }, [paused, interacted, open, reduceMotion]);

  const arrowClass =
    'w-10 h-10 rounded-full border border-emerald-700 text-cream flex items-center justify-center hover:border-gold hover:text-gold disabled:opacity-30 disabled:hover:border-emerald-700 disabled:hover:text-cream transition-colors';

  return (
    <section className="relative py-16 border-t border-emerald-800 bg-gradient-to-b from-emerald-950/40 to-transparent">
      <div className="max-w-6xl mx-auto px-5">
        <Reveal className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-8">
          <div>
            <div className="text-xs uppercase tracking-[0.2em] text-gold mb-2">{t('reviewsEyebrow')}</div>
            <h2 className="font-heading text-gold text-2xl md:text-3xl">{t('reviewsTitle')}</h2>
            <p className="text-cream/50 text-sm mt-2 max-w-lg">
              {t('reviewsSubtitle')}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              aria-label={t('prevReviews')}
              disabled={atStart}
              onClick={() => {
                setInteracted(true);
                scrollByCard(-1);
              }}
              className={arrowClass}
            >
              ←
            </button>
            <button
              aria-label={t('nextReviews')}
              disabled={atEnd}
              onClick={() => {
                setInteracted(true);
                scrollByCard(1);
              }}
              className={arrowClass}
            >
              →
            </button>
          </div>
        </Reveal>
      </div>

      <Reveal delay={0.1}>
        <div
          ref={trackRef}
          onScroll={updateEdges}
          onMouseEnter={() => setPaused(true)}
          onMouseLeave={() => setPaused(false)}
          onTouchStart={() => setInteracted(true)}
          onFocus={() => setPaused(true)}
          onBlur={() => setPaused(false)}
          className="flex gap-5 overflow-x-auto snap-x snap-mandatory scroll-smooth pb-4 px-5 md:px-[max(1.25rem,calc((100vw_-_72rem)/2_+_1.25rem))] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          {reviews.map((r) => (
            <div key={r.id} data-card className="snap-start shrink-0 w-[85%] sm:w-[360px]">
              <ReviewCard review={r} excerpt onReadMore={() => setOpen(r)} />
            </div>
          ))}
        </div>
      </Reveal>

      <div className="text-center mt-6">
        <Link to="/reviews" className="group text-gold text-sm underline underline-offset-4 hover:text-gold-light">
          {t('readAllReviews', { count: reviews.length })}{' '}
          <span className="inline-block transition-transform duration-300 group-hover:translate-x-1">→</span>
        </Link>
      </div>

      <ReviewModal review={open} onClose={() => setOpen(null)} />
    </section>
  );
}
