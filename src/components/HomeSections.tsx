import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useLang } from '../i18n/useLang';
import { Reveal, fadeUp, stagger } from './motion';

const icon = {
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.6,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
  className: 'w-6 h-6',
  'aria-hidden': true,
};

const REASONS = [
  {
    title: 'whySoundTitle',
    text: 'whySoundText',
    // Sound waves
    svg: (
      <svg {...icon}>
        <path d="M11 5 6 9H3v6h3l5 4V5z" />
        <path d="M15.5 8.5a5 5 0 0 1 0 7M18.5 5.5a9 9 0 0 1 0 13" />
      </svg>
    ),
  },
  {
    title: 'whyCraftTitle',
    text: 'whyCraftText',
    // Hand
    svg: (
      <svg {...icon}>
        <path d="M18 11V6a2 2 0 0 0-4 0v5M14 10V4a2 2 0 0 0-4 0v6M10 10.5V6a2 2 0 0 0-4 0v8" />
        <path d="M18 8a2 2 0 1 1 4 0v6a8 8 0 0 1-8 8h-2c-2.8 0-4.5-.86-5.99-2.34l-3.6-3.6a2 2 0 0 1 2.83-2.82L7 15" />
      </svg>
    ),
  },
  {
    title: 'whySpiritTitle',
    text: 'whySpiritText',
    // Lamp flame
    svg: (
      <svg {...icon}>
        <path d="M12 3c2 3 3 4.5 3 6.5a3 3 0 0 1-6 0C9 7.5 10 6 12 3z" />
        <path d="M4 15h16l-2 4H6l-2-4zM12 12.5V15" />
      </svg>
    ),
  },
  {
    title: 'whyMaterialTitle',
    text: 'whyMaterialText',
    // Gem / metal
    svg: (
      <svg {...icon}>
        <path d="M6 3h12l3 6-9 12L3 9l3-6z" />
        <path d="M3 9h18M12 21 8 9l4-6 4 6-4 12" />
      </svg>
    ),
  },
];

/** "Why choose our sacred bells?" — four reasons, from the original site. */
export function WhyChoose() {
  const { t } = useLang();
  return (
    <section className="border-t border-emerald-800">
      <div className="max-w-6xl mx-auto px-5 py-16">
        <Reveal>
          <h2 className="font-heading text-gold text-2xl md:text-3xl text-center mb-10">{t('whyTitle')}</h2>
        </Reveal>
        <motion.div
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5"
          variants={stagger(0.1)}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: '0px 0px -60px 0px' }}
        >
          {REASONS.map((r) => (
            <motion.div
              key={r.title}
              variants={fadeUp}
              whileHover={{ y: -4 }}
              className="rounded-xl border border-emerald-700 bg-emerald-800/40 p-6 hover:border-gold/50 transition-colors"
            >
              <div className="w-12 h-12 rounded-full bg-gold/10 border border-gold/30 text-gold flex items-center justify-center mb-4">
                {r.svg}
              </div>
              <h3 className="font-heading text-cream text-lg mb-2">{t(r.title)}</h3>
              <p className="text-sm text-cream/60 leading-relaxed">{t(r.text)}</p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}

/** Closing call to action: "Begin your spiritual journey". */
export function JourneyCta() {
  const { t } = useLang();
  return (
    <section className="relative overflow-hidden border-t border-emerald-800">
      <div
        className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[520px] h-[520px] max-w-[140vw] bg-gold/10 rounded-full blur-3xl pointer-events-none"
        aria-hidden
      />
      <Reveal className="relative max-w-3xl mx-auto px-5 py-20 text-center">
        <h2 className="font-heading text-gold text-2xl md:text-4xl mb-3">{t('journeyTitle')}</h2>
        <p className="text-cream/60 mb-8">{t('journeySubtitle')}</p>
        <motion.div className="inline-block" whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }}>
          <Link
            to="/shop"
            className="inline-block bg-gold text-emerald-950 text-sm font-semibold uppercase tracking-wider px-8 py-3.5 rounded-md hover:bg-gold-light transition-colors shadow-[0_10px_30px_-12px_rgba(201,162,75,0.6)]"
          >
            {t('exploreCollection')}
          </Link>
        </motion.div>
      </Reveal>
    </section>
  );
}
