import type { Product, ProductVariant } from '../types/product';

export type Lang = 'en' | 'kn';

export const formatINR = (n: number) => `₹${n.toLocaleString('en-IN')}`;

/** The product's weight options, or a single implicit option for single-price products. */
export function getVariants(product: Product): ProductVariant[] {
  const list = Array.isArray(product.variants) ? product.variants.filter((v) => v && v.label) : [];
  return list.length > 0 ? list : [{ label: '', price: product.price }];
}

export function hasVariants(product: Product) {
  return getVariants(product).some((v) => v.label);
}

/** "from ₹10,000" when prices differ across weights, otherwise the single price. */
export function priceLabel(product: Product) {
  const prices = getVariants(product).map((v) => v.price);
  const min = Math.min(...prices);
  return prices.some((p) => p !== min) ? `from ${formatINR(min)}` : formatINR(min);
}

/** All photos for the gallery: main image first, then extras (deduplicated). */
export function getGallery(product: Product) {
  return [product.image, ...(product.images ?? [])].filter((src, i, all) => src && all.indexOf(src) === i);
}

// ---- Stock ---------------------------------------------------------------

/** A weight is available when the product and that weight are both in stock. */
export const isVariantAvailable = (product: Product, variant?: ProductVariant) =>
  product.in_stock !== false && variant?.in_stock !== false;

/** The product can be added to the enquiry list in at least one weight. */
export const isProductAvailable = (product: Product) =>
  product.in_stock !== false && getVariants(product).some((v) => v.in_stock !== false);

/** Index of the first in-stock weight (so cards open on something that can be added). */
export const firstAvailableIndex = (product: Product) =>
  Math.max(0, getVariants(product).findIndex((v) => v.in_stock !== false));

/** Display order: explicit sort_order first, then newest. */
export function sortProducts<T extends { sort_order?: number; created_at?: string }>(list: T[]) {
  return [...list].sort(
    (a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0) || (b.created_at ?? '').localeCompare(a.created_at ?? '')
  );
}

// ---- Localisation -------------------------------------------------------

export const productName = (p: Product, lang: Lang) => (lang === 'kn' && p.name_kn) || p.name;
export const productDescription = (p: Product, lang: Lang) => (lang === 'kn' && p.description_kn) || p.description;
export const productBadge = (p: Product, lang: Lang) => (lang === 'kn' && p.badge_kn) || p.badge || null;

const KN_UNITS: Record<string, string> = { kg: 'ಕೆ.ಜಿ', g: 'ಗ್ರಾಂ', in: 'ಇಂಚು', mm: 'ಮಿ.ಮೀ' };
const KN_DIMENSIONS: Record<string, string> = {
  tall: 'ಎತ್ತರ',
  wide: 'ಅಗಲ',
  dia: 'ವ್ಯಾಸ',
  long: 'ಉದ್ದ',
  thick: 'ದಪ್ಪ',
};

/** "1.5 kg" → "1.5 ಕೆ.ಜಿ" in Kannada. Unrecognised labels are returned unchanged. */
export function weightLabel(label: string, lang: Lang) {
  if (lang !== 'kn') return label;
  const m = /^([\d.]+)\s*(kg|g)$/i.exec(label.trim());
  return m ? `${m[1]} ${KN_UNITS[m[2].toLowerCase()]}` : label;
}

/** "9 in tall · 5 in wide" → "ಎತ್ತರ 9 ಇಂಚು · ಅಗಲ 5 ಇಂಚು" in Kannada. */
export function sizeLabel(size: string | undefined, lang: Lang) {
  if (!size || lang !== 'kn') return size;
  return size
    .split('·')
    .map((part) => {
      const m = /^([\d.]+)\s*(in|mm)\s+(tall|wide|dia\.?|long|thick)$/i.exec(part.trim());
      if (!m) return part.trim();
      const dim = KN_DIMENSIONS[m[3].toLowerCase().replace('.', '')];
      return `${dim} ${m[1]} ${KN_UNITS[m[2].toLowerCase()]}`;
    })
    .join(' · ');
}

/** Display name including the chosen weight, e.g. "Nandi Hand Bell · 1.5 kg". */
export function nameWithVariant(product: Product, variant: ProductVariant | undefined, lang: Lang = 'en') {
  const name = productName(product, lang);
  return variant?.label ? `${name} · ${weightLabel(variant.label, lang)}` : name;
}

// ---- URLs ------------------------------------------------------------------------

/** "Anjaneya Hand Bell" → "anjaneya-hand-bell" (readable, search-friendly URLs). */
export const slugify = (name: string) =>
  name
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

/** Product page URL, e.g. /shop/anjaneya-hand-bell */
export const productPath = (p: { name: string }) => `/shop/${slugify(p.name)}`;

/** Find a product from a URL segment: its slug, or (for older links) its id. */
export const findProduct = <T extends { id: string; name: string }>(list: T[], param: string | undefined) =>
  param ? list.find((p) => slugify(p.name) === param) ?? list.find((p) => p.id === param) : undefined;
