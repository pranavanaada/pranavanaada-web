import { motion } from 'framer-motion';
import { Reveal, fadeUp, stagger } from '../components/motion';
import { useLang } from '../i18n/useLang';
import threeBells from '../assets/about/three-bells.webp';

const METALS = ['metalGold', 'metalSilver', 'metalCopper', 'metalBrass', 'metalTin'];

/** About page — content from the original Pranavanaada site. */
export default function About() {
  const { t } = useLang();
  return (
    <div className="max-w-3xl mx-auto px-5 py-16">
      <Reveal className="text-center mb-12">
        <p className="font-heading text-gold-light text-lg mb-4">{t('invocation')}</p>
        <h1 className="font-heading text-gold text-3xl md:text-4xl">{t('aboutTitle')}</h1>
      </Reveal>

      <Reveal className="mb-10">
        {/* Anjaneya, Chakra and Nandi hand bells together */}
        <img
          src={threeBells}
          alt={t('aboutPhotoAlt')}
          loading="lazy"
          className="w-full max-w-[260px] mx-auto mb-8 md:float-right md:ml-8 md:mb-4 md:w-[240px] rounded-2xl border border-gold/30 shadow-[0_20px_50px_-20px_rgba(0,0,0,0.8)]"
        />
        <h2 className="font-heading text-cream text-2xl mb-3">{t('namasteTitle')}</h2>
        <p className="text-cream/70 leading-relaxed">{t('namasteText')}</p>
      </Reveal>

      <Reveal className="mb-10">
        <h2 className="font-heading text-cream text-2xl mb-3">{t('storyTitle')}</h2>
        <p className="text-cream/70 leading-relaxed">{t('storyText')}</p>
      </Reveal>

      <Reveal className="mb-12">
        <h2 className="font-heading text-cream text-2xl mb-3">{t('culturalTitle')}</h2>
        <p className="text-cream/70 leading-relaxed">{t('culturalText')}</p>
      </Reveal>

      <Reveal>
        <div className="rounded-xl border border-emerald-700 bg-emerald-800/40 p-6 text-center">
          <h3 className="font-heading text-gold text-xl mb-5">{t('metalsTitle')}</h3>
          <motion.ul
            className="flex flex-wrap justify-center gap-3"
            variants={stagger(0.08)}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true }}
          >
            {METALS.map((m) => (
              <motion.li
                key={m}
                variants={fadeUp}
                className="px-5 py-2 rounded-full border border-gold/40 bg-emerald-950/60 text-cream"
              >
                {t(m)}
              </motion.li>
            ))}
          </motion.ul>
        </div>
      </Reveal>
    </div>
  );
}
