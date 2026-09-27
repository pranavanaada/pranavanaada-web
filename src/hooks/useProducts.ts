import { useEffect, useState } from 'react';
import { isSupabaseConfigured, supabaseAnonKey, supabaseUrl } from '../lib/supabaseConfig';
import { sortProducts } from '../lib/productUtils';
import { fallbackProducts } from '../data/products';
import type { Combo, Product } from '../types/product';

interface Result<T> {
  rows: T[];
  usingFallback: boolean;
}

// Shared across pages so navigating Home → Shop → product detail doesn't
// refetch each time. A full page reload (or invalidateCatalog()) fetches fresh data.
const cache = new Map<string, Result<unknown>>();
const inflight = new Map<string, Promise<Result<unknown>>>();
const listeners = new Set<() => void>();

const FETCH_TIMEOUT_MS = 6000;

async function fetchTable<T>(
  table: 'products' | 'combos',
  onlyVisible: boolean,
  fallback: T[]
): Promise<Result<T>> {
  if (!isSupabaseConfigured) return { rows: fallback, usingFallback: true };
  try {
    if (onlyVisible) {
      // Public catalogue: a plain REST call, so visitors never download the Supabase SDK.
      const res = await fetch(`${supabaseUrl}/rest/v1/${table}?select=*&is_visible=eq.true`, {
        headers: { apikey: supabaseAnonKey, Authorization: `Bearer ${supabaseAnonKey}` },
        signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = (await res.json()) as (T & { sort_order?: number })[];
      return { rows: sortProducts(data) as T[], usingFallback: false };
    }
    // Admin views include hidden rows, which need the signed-in session.
    const { supabase } = await import('../lib/supabaseClient');
    let query = supabase.from(table).select('*');
    if (onlyVisible) query = query.eq('is_visible', true);
    const { data, error } = await query.abortSignal(AbortSignal.timeout(FETCH_TIMEOUT_MS));
    if (error || !data) throw error || new Error('No data');
    return { rows: sortProducts(data as (T & { sort_order?: number })[]) as T[], usingFallback: false };
  } catch {
    return { rows: fallback, usingFallback: true };
  }
}

function load<T>(key: string, fetcher: () => Promise<Result<T>>): Promise<Result<T>> {
  let p = inflight.get(key) as Promise<Result<T>> | undefined;
  if (!p) {
    p = fetcher().then((result) => {
      cache.set(key, result);
      return result;
    });
    inflight.set(key, p as Promise<Result<unknown>>);
  }
  return p;
}

/** Drop cached products/combos so the next read refetches (called after admin edits). */
export function invalidateCatalog() {
  cache.clear();
  inflight.clear();
  listeners.forEach((fn) => fn());
}

function useCached<T>(key: string, fetcher: () => Promise<Result<T>>) {
  const [result, setResult] = useState<Result<T> | null>((cache.get(key) as Result<T>) ?? null);
  const [version, setVersion] = useState(0);

  useEffect(() => {
    const onInvalidate = () => setVersion((v) => v + 1);
    listeners.add(onInvalidate);
    return () => {
      listeners.delete(onInvalidate);
    };
  }, []);

  useEffect(() => {
    const cached = cache.get(key) as Result<T> | undefined;
    if (cached) {
      setResult(cached);
      return;
    }
    let cancelled = false;
    load(key, fetcher).then((r) => {
      if (!cancelled) setResult(r);
    });
    return () => {
      cancelled = true;
    };
    // fetcher is derived from key
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, version]);

  return result;
}

const visibleFallback = (onlyVisible: boolean) =>
  onlyVisible ? fallbackProducts.filter((p) => p.is_visible) : fallbackProducts;

/** Start fetching the catalog early (e.g. on link hover) without rendering. */
export function prefetchProducts(onlyVisible = true) {
  load(`products:${onlyVisible}`, () => fetchTable('products', onlyVisible, visibleFallback(onlyVisible)));
}

/**
 * Loads products from Supabase. If Supabase isn't configured yet (see
 * src/lib/supabaseConfig.ts), falls back to the local seed catalog so the site
 * is always browsable.
 */
export function useProducts(onlyVisible = true) {
  const result = useCached(`products:${onlyVisible}`, () =>
    fetchTable<Product>('products', onlyVisible, visibleFallback(onlyVisible))
  );
  return {
    products: result?.rows ?? [],
    loading: result === null,
    usingFallback: result?.usingFallback ?? false,
  };
}

/** Loads combo offers (none until an admin creates them). */
export function useCombos(onlyVisible = true) {
  const result = useCached(`combos:${onlyVisible}`, () => fetchTable<Combo>('combos', onlyVisible, []));
  return { combos: result?.rows ?? [], loading: result === null };
}
