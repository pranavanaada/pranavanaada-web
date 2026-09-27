import { useEffect } from 'react';
import type { Product } from '../types/product';
import { getVariants, productPath } from './productUtils';
import { EMAIL, PHONE_TEL, SOCIAL_LINKS } from '../config/contact';

/** Canonical site address (the www host is the one with a valid certificate). */
export const SITE_URL = 'https://www.pranavanaada.com';
export const SITE_NAME = 'Pranavanaada';
export const DEFAULT_IMAGE = `${SITE_URL}/og-image.jpg`;

export interface SeoOptions {
  title: string;
  description?: string;
  /** Path of this page, e.g. /shop/anjaneya-hand-bell — used for the canonical URL. */
  path?: string;
  /** Absolute image URL for link previews (WhatsApp, Facebook…). */
  image?: string;
  type?: 'website' | 'product';
  /** Structured data (schema.org) for search engines. */
  jsonLd?: object | object[];
  /** Keep this page out of search results (checkout, admin…). */
  noindex?: boolean;
}

function setMeta(attr: 'name' | 'property', key: string, content: string) {
  let el = document.head.querySelector<HTMLMetaElement>(`meta[${attr}="${key}"]`);
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute(attr, key);
    document.head.appendChild(el);
  }
  el.content = content;
}

function setLink(rel: string, href: string) {
  let el = document.head.querySelector<HTMLLinkElement>(`link[rel="${rel}"]`);
  if (!el) {
    el = document.createElement('link');
    el.rel = rel;
    document.head.appendChild(el);
  }
  el.href = href;
}

/**
 * Update the page title, description, canonical URL, link-preview tags and
 * structured data. The same tags are written into static HTML at build time
 * (scripts/prerender-seo.mjs) so crawlers and WhatsApp see them without JS.
 */
export function applySeo(o: SeoOptions) {
  const url = `${SITE_URL}${o.path ?? window.location.pathname}`;
  const image = o.image || DEFAULT_IMAGE;
  document.title = o.title;
  if (o.description) {
    setMeta('name', 'description', o.description);
    setMeta('property', 'og:description', o.description);
    setMeta('name', 'twitter:description', o.description);
  }
  setMeta('name', 'robots', o.noindex ? 'noindex, nofollow' : 'index, follow');
  setLink('canonical', url);
  setMeta('property', 'og:title', o.title);
  setMeta('property', 'og:url', url);
  setMeta('property', 'og:type', o.type ?? 'website');
  setMeta('property', 'og:image', image);
  setMeta('property', 'og:site_name', SITE_NAME);
  setMeta('name', 'twitter:card', 'summary_large_image');
  setMeta('name', 'twitter:title', o.title);
  setMeta('name', 'twitter:image', image);

  document.head.querySelectorAll('script[data-seo="jsonld"]').forEach((s) => s.remove());
  if (o.jsonLd) {
    const s = document.createElement('script');
    s.type = 'application/ld+json';
    s.dataset.seo = 'jsonld';
    s.textContent = JSON.stringify(o.jsonLd);
    document.head.appendChild(s);
  }
}

export function useSeo(o: SeoOptions | null) {
  const key = o ? JSON.stringify(o) : '';
  useEffect(() => {
    if (o) applySeo(o);
    // key captures every field of o
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);
}

// ---- Structured data ----------------------------------------------------------------

export const organizationJsonLd = () => ({
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: SITE_NAME,
  url: SITE_URL,
  logo: `${SITE_URL}/og-image.jpg`,
  email: EMAIL,
  telephone: PHONE_TEL,
  sameAs: Object.values(SOCIAL_LINKS).filter(Boolean),
});

export const websiteJsonLd = () => ({
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  name: SITE_NAME,
  url: SITE_URL,
  inLanguage: ['en', 'kn'],
});

const CATEGORY_NAME: Record<string, string> = {
  'hand-bell': 'Hand Bell',
  'hanging-bell': 'Hanging Bell',
  jayagante: 'Jayagante',
};

export function productJsonLd(p: Product) {
  const variants = getVariants(p);
  const prices = variants.map((v) => v.price);
  const inStock = p.in_stock !== false && variants.some((v) => v.in_stock !== false);
  const availability = `https://schema.org/${inStock ? 'InStock' : 'OutOfStock'}`;
  const url = `${SITE_URL}${productPath(p)}`;
  return {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: p.name,
    description: p.description,
    image: [p.image, ...(p.images ?? [])].filter(Boolean),
    sku: p.id,
    category: CATEGORY_NAME[p.category] ?? 'Pooja Bell',
    material: 'Panchaloha',
    brand: { '@type': 'Brand', name: SITE_NAME },
    offers:
      prices.length > 1
        ? {
            '@type': 'AggregateOffer',
            priceCurrency: 'INR',
            lowPrice: Math.min(...prices),
            highPrice: Math.max(...prices),
            offerCount: prices.length,
            availability,
            url,
          }
        : { '@type': 'Offer', priceCurrency: 'INR', price: prices[0], availability, url },
  };
}

/** "Anjaneya Hand Bell — Panchaloha Hand Bell from ₹10,000 | Pranavanaada" */
export function productSeo(p: Product): SeoOptions {
  const prices = getVariants(p).map((v) => v.price);
  const from = `₹${Math.min(...prices).toLocaleString('en-IN')}`;
  const weights = getVariants(p)
    .map((v) => v.label)
    .filter(Boolean)
    .join(', ');
  return {
    title: `${p.name} — Panchaloha ${CATEGORY_NAME[p.category] ?? 'Bell'} from ${from} | ${SITE_NAME}`,
    description: `${p.description}${weights ? ` Available in ${weights}.` : ''} Price from ${from}. Handcrafted by ${SITE_NAME}.`,
    path: productPath(p),
    image: p.image,
    type: 'product',
    jsonLd: productJsonLd(p),
  };
}
