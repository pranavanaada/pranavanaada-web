import { motion } from 'framer-motion';
import { useLang } from '../i18n/useLang';
import { useCombos, useProducts } from '../hooks/useProducts';
import ComboCard from './ComboCard';
import { Reveal, stagger } from './motion';

/** Home page combo offers — hidden entirely until an admin creates a combo. */
export default function CombosSection({ onEnquire }: { onEnquire: (name: string) => void }) {
  const { t } = useLang();
  const { combos } = useCombos();
  const { products } = useProducts();
  if (combos.length === 0) return null;

  return (
    <section className="border-t border-emerald-800">
      <div className="max-w-6xl mx-auto px-5 py-16">
        <Reveal className="text-center mb-10">
          <h2 className="font-heading text-gold text-2xl md:text-3xl mb-2">{t('combos')}</h2>
          <p className="text-cream/50 text-sm">{t('combosSubtitle')}</p>
        </Reveal>
        <motion.div
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          variants={stagger(0.1)}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: '0px 0px -60px 0px' }}
        >
          {combos.map((c) => (
            <ComboCard key={c.id} combo={c} products={products} onEnquire={onEnquire} />
          ))}
        </motion.div>
      </div>
    </section>
  );
}
