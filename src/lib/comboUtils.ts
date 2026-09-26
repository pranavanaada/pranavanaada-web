import type { Combo, Product, ProductVariant } from '../types/product';
import { getVariants, isVariantAvailable, productName, weightLabel, type Lang } from './productUtils';

export interface ResolvedComboLine {
  product: Product;
  variant?: ProductVariant;
  qty: number;
  /** Regular price of this line (unit price × qty). */
  lineTotal: number;
}

/** Match combo items to current products; lines whose product no longer exists are dropped. */
export function resolveCombo(combo: Combo, products: Product[]): ResolvedComboLine[] {
  const byId = new Map(products.map((p) => [p.id, p]));
  return (combo.items ?? []).flatMap((item) => {
    const product = byId.get(item.product_id);
    if (!product) return [];
    const variants = getVariants(product);
    const variant = variants.find((v) => v.label === (item.variant ?? '')) ?? variants[0];
    const qty = Math.max(1, item.qty || 1);
    return [{ product, variant: variant.label ? variant : undefined, qty, lineTotal: variant.price * qty }];
  });
}

export const regularTotal = (lines: ResolvedComboLine[]) => lines.reduce((n, l) => n + l.lineTotal, 0);

/** Combo can be enquired about only when it and every included product/weight is in stock. */
export const isComboAvailable = (combo: Combo, lines: ResolvedComboLine[]) =>
  combo.in_stock !== false && lines.length > 0 && lines.every((l) => isVariantAvailable(l.product, l.variant));

export const comboName = (c: Combo, lang: Lang) => (lang === 'kn' && c.name_kn) || c.name;
export const comboDescription = (c: Combo, lang: Lang) => (lang === 'kn' && c.description_kn) || c.description;

/** "Anjaneya Hand Bell · 1 kg × 1, Panchaloha Jayagante · 1000 g × 1" */
export function describeLines(lines: ResolvedComboLine[], lang: Lang) {
  return lines
    .map((l) => {
      const name = productName(l.product, lang);
      const weight = l.variant ? ` · ${weightLabel(l.variant.label, lang)}` : '';
      return `${name}${weight} × ${l.qty}`;
    })
    .join(', ');
}
