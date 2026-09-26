import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import type { Combo, Product, ProductVariant } from '../types/product';
import { comboName, describeLines, resolveCombo, type ResolvedComboLine } from '../lib/comboUtils';
import { formatINR, weightLabel, type Lang } from '../lib/productUtils';

export { formatINR };

export interface CartItem {
  /** Unique per product + weight, e.g. "nandi-hand-bell::1.5 kg". */
  key: string;
  id: string;
  name: string;
  name_kn?: string;
  /** Weight label, e.g. "1.5 kg" (empty for single-price products). */
  variant?: string;
  size?: string;
  price: number;
  thumb: string;
  qty: number;
  /** Set for combo offers: what the combo contains, in English and Kannada. */
  combo?: { includes: string; includes_kn: string };
}

interface CartContextValue {
  items: CartItem[];
  count: number;
  total: number;
  add: (product: Product, variant?: ProductVariant, qty?: number) => void;
  addCombo: (combo: Combo, lines: ResolvedComboLine[]) => void;
  setQty: (key: string, qty: number) => void;
  remove: (key: string) => void;
  clear: () => void;
  /** Re-link / refresh / drop items against the live catalogue (see reconcileCart). */
  sync: (products: Product[], combos: Combo[]) => void;
  /** Whether this product (optionally in this weight) is in the list. */
  has: (id: string, variant?: ProductVariant) => boolean;
  isOpen: boolean;
  open: () => void;
  close: () => void;
  /** The most recently added item, for the "added" toast. `key` changes on every add. */
  lastAdded: { item: CartItem; key: number } | null;
}

// v2: items are keyed per weight. The old v1 list (placeholder products/prices)
// is simply dropped.
const STORAGE_KEY = 'pranavanaada-enquiry-cart-v2';
const MAX_QTY = 99;

const CartContext = createContext<CartContextValue | undefined>(undefined);

const itemKey = (id: string, variant?: ProductVariant) => (variant?.label ? `${id}::${variant.label}` : id);

const sameName = (a?: string | null, b?: string | null) =>
  !!a && !!b && a.trim().toLowerCase() === b.trim().toLowerCase();

/**
 * Bring saved cart items in line with the live catalogue: re-link items whose
 * product id changed (e.g. added before the catalogue moved to the database —
 * matched by name), refresh prices/names/photos, and drop anything that no
 * longer exists. Returns null when nothing changed.
 */
export function reconcileCart(items: CartItem[], products: Product[], combos: Combo[]): CartItem[] | null {
  const byId = new Map(products.map((p) => [p.id, p]));
  const comboById = new Map(combos.map((c) => [c.id, c]));
  const next: CartItem[] = [];

  for (const item of items) {
    if (item.key.startsWith('combo::')) {
      const c = comboById.get(item.id);
      if (!c) continue;
      const lines = resolveCombo(c, products);
      if (!lines.length) continue;
      next.push({
        ...item,
        name: c.name,
        name_kn: c.name_kn || undefined,
        price: c.price,
        thumb: c.image || lines[0].product.thumb || lines[0].product.image,
        combo: { includes: describeLines(lines, 'en'), includes_kn: describeLines(lines, 'kn') },
      });
      continue;
    }

    const p = byId.get(item.id) ?? products.find((x) => sameName(x.name, item.name) || sameName(x.name_kn, item.name_kn));
    if (!p) continue;
    const variants = (p.variants ?? []).filter((v) => v?.label);
    const variant = item.variant ? variants.find((v) => v.label === item.variant) : undefined;
    if (item.variant && !variant) continue; // that weight was removed
    if (!item.variant && variants.length) continue; // product now sold by weight — let them re-pick

    const key = itemKey(p.id, variant);
    const refreshed: CartItem = {
      ...item,
      key,
      id: p.id,
      name: p.name,
      name_kn: p.name_kn || undefined,
      size: variant?.size,
      price: variant?.price ?? p.price,
      thumb: p.thumb || p.image,
    };
    const dup = next.find((x) => x.key === key);
    if (dup) dup.qty = Math.min(MAX_QTY, dup.qty + refreshed.qty);
    else next.push(refreshed);
  }

  return JSON.stringify(next) === JSON.stringify(items) ? null : next;
}

function loadStored(): CartItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed)
      ? parsed.filter((i) => i && typeof i.key === 'string' && typeof i.id === 'string' && i.qty > 0)
      : [];
  } catch {
    return [];
  }
}

/**
 * Enquiry cart: visitors collect products (with quantities) and send a single
 * enquiry for all of them. Persisted in localStorage so it survives reloads.
 */
export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>(loadStored);
  const [isOpen, setIsOpen] = useState(false);
  const [lastAdded, setLastAdded] = useState<CartContextValue['lastAdded']>(null);
  const addCounter = useRef(0);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch {
      // Storage unavailable (private mode etc.) — cart still works for this visit.
    }
  }, [items]);

  const addItem = useCallback((base: CartItem) => {
    setItems((prev) => {
      const existing = prev.find((i) => i.key === base.key);
      if (!existing) return [...prev, base];
      return prev.map((i) => (i.key === base.key ? { ...i, qty: Math.min(MAX_QTY, i.qty + base.qty) } : i));
    });
    setLastAdded({ item: base, key: ++addCounter.current });
  }, []);

  const addCombo = useCallback(
    (combo: Combo, lines: ResolvedComboLine[]) =>
      addItem({
        key: `combo::${combo.id}`,
        id: combo.id,
        name: comboName(combo, 'en'),
        name_kn: combo.name_kn || undefined,
        price: combo.price,
        thumb: combo.image || lines[0]?.product.thumb || lines[0]?.product.image || '',
        qty: 1,
        combo: { includes: describeLines(lines, 'en'), includes_kn: describeLines(lines, 'kn') },
      }),
    [addItem]
  );

  const add = useCallback((product: Product, variant?: ProductVariant, qty = 1) => {
    const key = itemKey(product.id, variant);
    const base: CartItem = {
      key,
      id: product.id,
      name: product.name,
      name_kn: product.name_kn || undefined,
      variant: variant?.label || undefined,
      size: variant?.size,
      price: variant?.price ?? product.price,
      thumb: product.thumb || product.image,
      qty,
    };
    addItem(base);
  }, [addItem]);

  const setQty = useCallback((key: string, qty: number) => {
    setItems((prev) =>
      qty <= 0
        ? prev.filter((i) => i.key !== key)
        : prev.map((i) => (i.key === key ? { ...i, qty: Math.min(MAX_QTY, qty) } : i))
    );
  }, []);

  const remove = useCallback((key: string) => setItems((prev) => prev.filter((i) => i.key !== key)), []);
  const clear = useCallback(() => setItems([]), []);
  const sync = useCallback(
    (products: Product[], combos: Combo[]) => setItems((prev) => reconcileCart(prev, products, combos) ?? prev),
    []
  );
  const open = useCallback(() => setIsOpen(true), []);
  const close = useCallback(() => setIsOpen(false), []);

  const value = useMemo<CartContextValue>(
    () => ({
      items,
      count: items.reduce((n, i) => n + i.qty, 0),
      total: items.reduce((n, i) => n + i.qty * i.price, 0),
      add,
      addCombo,
      setQty,
      remove,
      clear,
      sync,
      has: (id, variant) =>
        variant ? items.some((i) => i.key === itemKey(id, variant)) : items.some((i) => i.id === id),
      isOpen,
      open,
      close,
      lastAdded,
    }),
    [items, add, addCombo, setQty, remove, clear, sync, isOpen, open, close, lastAdded]
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used within CartProvider');
  return ctx;
}

/** "Nandi Hand Bell · 1.5 kg" (or the Kannada equivalent). */
export function itemLabel(i: CartItem, lang: Lang = 'en') {
  const name = (lang === 'kn' && i.name_kn) || i.name;
  return i.variant ? `${name} · ${weightLabel(i.variant, lang)}` : name;
}

/**
 * Plain-text list of cart items for enquiry messages. Enquiries saved to the
 * admin inbox use English; the WhatsApp text follows the visitor's language.
 */
export function describeItems(items: CartItem[], lang: Lang = 'en', totalLabel = 'Estimated total') {
  const lines = items.map((i) => {
    const includes = i.combo ? `\n    (${lang === 'kn' ? i.combo.includes_kn : i.combo.includes})` : '';
    return `• ${itemLabel(i, lang)} × ${i.qty} — ${formatINR(i.price * i.qty)}${includes}`;
  });
  const total = items.reduce((n, i) => n + i.qty * i.price, 0);
  return `${lines.join('\n')}\n${totalLabel}: ${formatINR(total)}`;
}
