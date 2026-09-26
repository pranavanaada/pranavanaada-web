import { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'framer-motion';
import type { Review } from '../types/review';
import { useLang } from '../i18n/useLang';
import type { Lang } from '../lib/productUtils';

/** A review's name, title and paragraphs in the given language (falls back to English). */
function localize(review: Review, lang: Lang) {
  const kn = lang === 'kn';
  return {
    name: (kn && review.name_kn) || review.name,
    title: (kn && review.title_kn) || review.title,
    text: (kn && review.text_kn?.length ? review.text_kn : review.text) as string[],
  };
}

function Reviewer({ review, large = false }: { review: Review; large?: boolean }) {
  const { lang } = useLang();
  const r = localize(review, lang);
  return (
    <div className="flex items-center gap-3.5">
      <img
        src={review.photo}
        alt={r.name}
        loading="lazy"
        decoding="async"
        className={`${large ? 'w-16 h-16' : 'w-14 h-14'} shrink-0 rounded-full object-cover border-2 border-gold/70 bg-emerald-950`}
      />
      <div className="min-w-0">
        <div className="font-heading text-cream text-[15px] leading-snug">{r.name}</div>
        {r.title && (
          <div className={`text-xs text-cream/50 leading-snug mt-0.5 ${large ? '' : 'line-clamp-2'}`}>{r.title}</div>
        )}
      </div>
    </div>
  );
}

const QuoteMark = () => (
  <svg viewBox="0 0 32 24" className="w-8 h-6 text-gold/40" fill="currentColor" aria-hidden>
    <path d="M0 24V14.4C0 6.4 4.3 1.6 12.8 0l1.6 3.2C9.6 4.6 7.4 7.3 7.2 11.2H13V24H0zm18 0V14.4C18 6.4 22.3 1.6 30.8 0l1.6 3.2c-4.8 1.4-7 4.1-7.2 8H31V24H18z" />
  </svg>
);

/**
 * A review card. In `excerpt` mode the text is clamped with a "Read full
 * review" button (used by the home page slider); otherwise shows everything.
 */
export default function ReviewCard({
  review,
  excerpt = false,
  onReadMore,
}: {
  review: Review;
  excerpt?: boolean;
  onReadMore?: () => void;
}) {
  const { t, lang } = useLang();
  const text = localize(review, lang).text;
  const isLong = text.join(' ').length > 260;
  return (
    <article className="h-full flex flex-col gap-4 bg-gradient-to-b from-emerald-800 to-emerald-900 border border-emerald-700 rounded-xl p-6 hover:border-gold/50 transition-colors">
      <QuoteMark />
      <div className={`text-sm text-cream/75 leading-relaxed space-y-3 flex-1 ${excerpt ? 'line-clamp-6' : ''}`}>
        {(excerpt ? [text.join(' ')] : text).map((p, i) => (
          <p key={i}>{p}</p>
        ))}
      </div>
      {excerpt && isLong && onReadMore && (
        <button onClick={onReadMore} className="self-start text-xs text-gold hover:text-gold-light underline underline-offset-4">
          {t('readFullReview')}
        </button>
      )}
      <div className="border-t border-emerald-700/70 pt-4">
        <Reviewer review={review} />
      </div>
    </article>
  );
}

/** Full review in a dialog, opened from an excerpt card. */
export function ReviewModal({ review, onClose }: { review: Review | null; onClose: () => void }) {
  const { t, lang } = useLang();
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => {
    if (!review) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onCloseRef.current();
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener('keydown', onKey);
    };
  }, [review]);

  return createPortal(
    <AnimatePresence>
      {review && (
        <motion.div
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-5"
          onClick={onClose}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label={t('reviewBy', { name: localize(review, lang).name })}
            onClick={(e) => e.stopPropagation()}
            className="relative bg-emerald-800 border border-emerald-700 rounded-xl max-w-xl w-full max-h-[85vh] overflow-y-auto p-7 shadow-2xl"
            initial={{ opacity: 0, y: 24, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.98 }}
            transition={{ type: 'spring', stiffness: 380, damping: 30 }}
          >
            <button onClick={onClose} aria-label={t('close')} className="absolute top-4 right-5 text-cream/60 hover:text-cream text-lg">
              ✕
            </button>
            <div className="mb-5 pr-6">
              <Reviewer review={review} large />
            </div>
            <QuoteMark />
            <div className="mt-3 text-[15px] text-cream/80 leading-relaxed space-y-3">
              {localize(review, lang).text.map((p, i) => (
                <p key={i}>{p}</p>
              ))}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  );
}
