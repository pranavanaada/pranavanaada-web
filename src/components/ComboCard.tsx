import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import type { Combo, Product } from '../types/product';
import { useLang } from '../i18n/useLang';
import { useCart } from '../hooks/useCart';
import { formatINR, productName, weightLabel } from '../lib/productUtils';
import { comboDescription, comboName, isComboAvailable, regularTotal, resolveCombo } from '../lib/comboUtils';
import { fadeUp } from './motion';

/** A combo offer: included items, regular total struck through, combo price and savings. */
export default function ComboCard({
  combo,
  products,
  onEnquire,
}: {
  combo: Combo;
  products: Product[];
  onEnquire: (name: string) => void;
}) {
  const { t, lang } = useLang();
  const cart = useCart();
  const lines = resolveCombo(combo, products);
  if (lines.length === 0) return null;

  const regular = regularTotal(lines);
  const savings = Math.max(0, regular - combo.price);
  const available = isComboAvailable(combo, lines);
  const inCart = cart.items.some((i) => i.key === `combo::${combo.id}`);
  const name = comboName(combo, lang);

  // Photo: the combo's own image, or a collage of up to three item photos.
  const photos = combo.image ? [combo.image] : lines.slice(0, 3).map((l) => l.product.thumb || l.product.image);

  return (
    <motion.article
      variants={fadeUp}
      whileHover={{ y: -6 }}
      transition={{ type: 'spring', stiffness: 300, damping: 24 }}
      className="w-full rounded-xl overflow-hidden border border-gold/40 bg-gradient-to-b from-emerald-800 to-emerald-900 hover:border-gold hover:shadow-[0_18px_40px_-18px_rgba(201,162,75,0.5)] transition-[border-color,box-shadow] duration-300 flex flex-col"
    >
      <div className="relative aspect-[16/10] bg-emerald-950 overflow-hidden">
        <div className={`grid h-full ${photos.length === 1 ? 'grid-cols-1' : photos.length === 2 ? 'grid-cols-2' : 'grid-cols-3'} gap-0.5`}>
          {photos.map((src, i) => (
            <img
              key={i}
              src={src}
              alt=""
              loading="lazy"
              className={`w-full h-full object-cover ${available ? '' : 'grayscale-[60%] brightness-75'}`}
            />
          ))}
        </div>
        <span className="absolute top-3 left-3 bg-gold text-emerald-950 text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full">
          {t('combo')}
        </span>
        {savings > 0 && (
          <span className="absolute top-3 right-3 bg-emerald-950/90 border border-gold/50 text-gold-light text-[11px] font-semibold px-2.5 py-1 rounded-full">
            {t('youSave', { amount: formatINR(savings) })}
          </span>
        )}
        {!available && (
          <span className="absolute inset-x-0 bottom-0 bg-emerald-950/85 text-cream text-xs font-semibold uppercase tracking-widest text-center py-2">
            {t('outOfStock')}
          </span>
        )}
      </div>

      <div className="p-5 flex flex-col flex-1">
        <h3 className="font-heading text-cream text-lg mb-1">{name}</h3>
        {comboDescription(combo, lang) && (
          <p className="text-xs text-cream/60 leading-relaxed mb-3">{comboDescription(combo, lang)}</p>
        )}

        <div className="text-[11px] uppercase tracking-wider text-cream/40 mb-1.5">{t('includes')}</div>
        <ul className="space-y-1.5 mb-4 flex-1">
          {lines.map((l, i) => (
            <li key={i} className="flex items-center gap-2.5 text-sm">
              <img src={l.product.thumb || l.product.image} alt="" className="w-8 h-8 rounded object-cover shrink-0" />
              <Link to={`/shop/${l.product.id}`} className="flex-1 min-w-0 truncate text-cream/80 hover:text-gold">
                {productName(l.product, lang)}
                {l.variant && <span className="text-cream/50"> · {weightLabel(l.variant.label, lang)}</span>}
              </Link>
              <span className="text-cream/50 shrink-0">× {l.qty}</span>
            </li>
          ))}
        </ul>

        <div className="flex items-baseline gap-3 mb-4">
          <span className="text-gold text-xl font-semibold">{formatINR(combo.price)}</span>
          {savings > 0 && (
            <span className="text-sm text-cream/40 line-through" title={t('regularPrice')}>
              {formatINR(regular)}
            </span>
          )}
        </div>

        <div className="flex gap-2">
          {available ? (
            <motion.button
              whileTap={{ scale: 0.96 }}
              onClick={() => (inCart ? cart.open() : cart.addCombo(combo, lines))}
              className={`flex-1 text-xs font-semibold uppercase tracking-wide py-2.5 rounded-md transition-colors ${
                inCart ? 'border border-gold text-gold hover:bg-gold/10' : 'bg-gold text-emerald-950 hover:bg-gold-light'
              }`}
            >
              {inCart ? `✓ ${t('inList')}` : `+ ${t('addToEnquiry')}`}
            </motion.button>
          ) : (
            <button
              disabled
              className="flex-1 text-xs font-semibold uppercase tracking-wide py-2.5 rounded-md border border-emerald-700 text-cream/40 cursor-not-allowed"
            >
              {t('outOfStock')}
            </button>
          )}
          <button
            onClick={() => onEnquire(`${t('combo')}: ${name}`)}
            className="px-3 text-xs font-semibold uppercase tracking-wide py-2.5 rounded-md border border-emerald-700 text-cream/70 hover:border-gold hover:text-gold transition-colors"
          >
            {available ? t('enquireNow') : t('askAvailability')}
          </button>
        </div>
      </div>
    </motion.article>
  );
}
