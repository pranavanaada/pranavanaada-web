import { reviews } from '../data/reviews';
import ReviewCard from '../components/ReviewCard';
import { Reveal } from '../components/motion';
import { useLang } from '../i18n/useLang';

/** All reviews in full, in a two-column masonry layout. */
export default function Reviews() {
  const { t } = useLang();
  return (
    <div className="max-w-6xl mx-auto px-5 py-14">
      <Reveal className="text-center mb-10">
        <div className="text-xs uppercase tracking-[0.2em] text-gold mb-2">{t('reviewsEyebrow')}</div>
        <h1 className="font-heading text-gold text-3xl mb-2">{t('reviewsTitle')}</h1>
        <p className="text-cream/50 text-sm max-w-xl mx-auto">
          {t('reviewsSubtitle')}
        </p>
      </Reveal>

      <div className="columns-1 md:columns-2 gap-6">
        {reviews.map((r, i) => (
          <Reveal key={r.id} delay={(i % 2) * 0.08} className="break-inside-avoid mb-6">
            <ReviewCard review={r} />
          </Reveal>
        ))}
      </div>
    </div>
  );
}
