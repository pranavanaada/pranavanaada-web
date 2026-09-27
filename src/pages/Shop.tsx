import { useState } from 'react';
import { useLang } from '../i18n/useLang';
import { useSearchParams } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { useCombos, useProducts } from '../hooks/useProducts';
import ComboCard from '../components/ComboCard';
import ProductCard from '../components/ProductCard';
import InquiryModal from '../components/InquiryModal';
import { Reveal } from '../components/motion';
import type { Product, ProductCategory, ProductVariant } from '../types/product';
import { nameWithVariant } from '../lib/productUtils';

type Filter = ProductCategory | 'all' | 'combos';

const CATEGORIES: { key: Filter; labelKey: string }[] = [
  { key: 'all', labelKey: 'allProducts' },
  { key: 'hand-bell', labelKey: 'handBells' },
  { key: 'hanging-bell', labelKey: 'hangingBells' },
  { key: 'jayagante', labelKey: 'jayagante' },
  { key: 'combos', labelKey: 'combos' },
];

export default function Shop() {
  const { t, lang } = useLang();
  const { products, loading } = useProducts();
  const { combos } = useCombos();
  // The Combo Offers tab only appears once an admin has created a combo
  const categories = CATEGORIES.filter((c) => c.key !== 'combos' || combos.length > 0);
  // The active category lives in the URL (?category=hand-bell) so the Home
  // page chips can link straight into a filtered view.
  const [searchParams, setSearchParams] = useSearchParams();
  const param = searchParams.get('category');
  const filter: Filter = categories.some((c) => c.key === param) ? (param as Filter) : 'all';
  const setFilter = (key: Filter) =>
    setSearchParams(key === 'all' ? {} : { category: key }, { replace: true });
  const [enquiryName, setEnquiryName] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  const filtered = filter === 'all' ? products : products.filter((p) => p.category === filter);

  function openEnquiry(p: Product, v?: ProductVariant) {
    setEnquiryName(nameWithVariant(p, v, lang));
    setModalOpen(true);
  }

  return (
    <div className="max-w-7xl mx-auto px-5 pt-8 pb-14">
      <Reveal className="text-center mb-6">
        <h1 className="font-heading text-gold text-3xl mb-2">{t('shop')}</h1>
        <p className="text-cream/50 text-sm">{t('shopSubtitle')}</p>
      </Reveal>

      <Reveal delay={0.1} className="flex flex-wrap justify-center gap-2.5 mb-8">
        {categories.map((c) => {
          const active = filter === c.key;
          return (
            <button
              key={c.key}
              onClick={() => setFilter(c.key)}
              className={`relative text-sm px-5 py-2.5 rounded-full border transition-colors ${
                active ? 'text-emerald-950 border-gold font-semibold' : 'border-emerald-700 text-cream/60 hover:border-gold/50'
              }`}
            >
              {/* The gold pill slides between filters */}
              {active && (
                <motion.span
                  layoutId="shop-filter-pill"
                  className="absolute inset-0 rounded-full bg-gold"
                  transition={{ type: 'spring', stiffness: 400, damping: 32 }}
                />
              )}
              <span className="relative">{t(c.labelKey)}</span>
            </button>
          );
        })}
      </Reveal>

      {filter === 'combos' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {combos.map((c) => (
            <motion.div key={c.id} initial="hidden" animate="show" className="flex">
              <ComboCard
                combo={c}
                products={products}
                onEnquire={(name) => {
                  setEnquiryName(name);
                  setModalOpen(true);
                }}
              />
            </motion.div>
          ))}
        </div>
      ) : loading ? (
        <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-5">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="rounded-xl overflow-hidden border border-emerald-800">
              <div className="aspect-square shimmer" />
              <div className="p-4 space-y-2">
                <div className="h-4 w-3/4 rounded shimmer" />
                <div className="h-4 w-1/3 rounded shimmer" />
              </div>
            </div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center text-cream/50 py-16">{t('noProducts')}</div>
      ) : (
        <motion.div layout className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-5">
          <AnimatePresence mode="popLayout">
            {filtered.map((p, i) => (
              <motion.div
                key={p.id}
                layout
                initial={{ opacity: 0, y: 24, scale: 0.97 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.45, delay: Math.min(i, 8) * 0.05, ease: [0.22, 1, 0.36, 1] }}
                className="flex"
              >
                <ProductCard product={p} onEnquire={openEnquiry} priority={i < 3} />
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>
      )}

      <InquiryModal
        open={modalOpen}
        productName={enquiryName}
        onClose={() => setModalOpen(false)}
      />
    </div>
  );
}
