import { motion } from 'framer-motion';
import type { ProductVariant } from '../types/product';
import { useLang } from '../i18n/useLang';
import { weightLabel } from '../lib/productUtils';

interface Props {
  variants: ProductVariant[];
  selected: number;
  onSelect: (index: number) => void;
  /** Namespaces the sliding highlight so pickers on different cards don't share it. */
  layoutGroup: string;
  size?: 'sm' | 'md';
}

/** Weight chips (1 kg · 1.5 kg · 2 kg) with a highlight that slides to the chosen one. */
export default function VariantPicker({ variants, selected, onSelect, layoutGroup, size = 'sm' }: Props) {
  const { t, lang } = useLang();
  const chip = size === 'md' ? 'text-sm px-4 py-2' : 'text-xs px-3 py-1.5';
  return (
    <div role="radiogroup" aria-label={t('weight')} className="flex flex-wrap gap-2">
      {variants.map((v, i) => {
        const active = i === selected;
        return (
          <button
            key={v.label}
            type="button"
            role="radio"
            aria-checked={active}
            title={v.in_stock === false ? t('weightOutOfStock') : undefined}
            onClick={() => onSelect(i)}
            className={`relative rounded-md border font-medium transition-colors ${chip} ${
              active ? 'border-gold text-emerald-950' : 'border-emerald-700 text-cream/70 hover:border-gold/60 hover:text-cream'
            }`}
          >
            {active && (
              <motion.span
                layoutId={`variant-${layoutGroup}`}
                className="absolute inset-0 rounded-[5px] bg-gold"
                transition={{ type: 'spring', stiffness: 500, damping: 35 }}
              />
            )}
            <span className={`relative ${v.in_stock === false ? 'line-through opacity-60' : ''}`}>
              {weightLabel(v.label, lang)}
            </span>
          </button>
        );
      })}
    </div>
  );
}
