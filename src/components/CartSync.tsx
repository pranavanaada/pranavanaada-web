import { useEffect } from 'react';
import { useCart } from '../hooks/useCart';
import { useCombos, useProducts } from '../hooks/useProducts';

/**
 * Keeps the saved cart in step with the live catalogue — fixes items added
 * before a product's id changed, updates prices the admin has edited, and
 * removes deleted products. Skipped while showing the offline fallback
 * catalogue, so a network hiccup never empties someone's cart.
 */
export default function CartSync() {
  const { sync, items } = useCart();
  const { products, loading, usingFallback } = useProducts();
  const { combos, loading: combosLoading } = useCombos();

  useEffect(() => {
    if (loading || combosLoading || usingFallback || items.length === 0) return;
    sync(products, combos);
  }, [products, combos, loading, combosLoading, usingFallback, items.length, sync]);

  return null;
}
