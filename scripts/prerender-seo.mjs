#!/usr/bin/env node
/**
 * Runs after `vite build`. For every public page and every product it writes
 * dist/<path>.html with that page's title, description, canonical URL,
 * link-preview (Open Graph) tags, structured data and a short text summary —
 * so Google, WhatsApp, Facebook etc. see the right information without running
 * JavaScript. Also writes dist/sitemap.xml.
 *
 * Products are read from Supabase (visible ones only). If Supabase can't be
 * reached, the static pages are still generated and the build doesn't fail.
 * Vercel serves these files first and falls back to the app for everything else.
 */
import fs from 'node:fs';
import path from 'node:path';

const SITE_URL = 'https://www.pranavanaada.com';
const SITE_NAME = 'Pranavanaada';
const DEFAULT_IMAGE = `${SITE_URL}/og-image.jpg`;
const DIST = path.resolve('dist');
const PAGES = JSON.parse(fs.readFileSync('src/seo-pages.json', 'utf8'));

const CATEGORY_NAME = { 'hand-bell': 'Hand Bell', 'hanging-bell': 'Hanging Bell', jayagante: 'Jayagante' };

// Keep in sync with slugify() in src/lib/productUtils.ts
const slugify = (name) => name.toLowerCase().normalize('NFKD').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
const esc = (s) => String(s ?? '').replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const inr = (n) => `₹${Number(n).toLocaleString('en-IN')}`;

function env(name) {
  if (process.env[name]) return process.env[name];
  try {
    const line = fs.readFileSync('.env.local', 'utf8').split(/\r?\n/).find((l) => l.startsWith(`${name}=`));
    return line ? line.slice(name.length + 1).trim() : '';
  } catch {
    return '';
  }
}

async function fetchProducts() {
  const url = env('VITE_SUPABASE_URL');
  const key = env('VITE_SUPABASE_ANON_KEY');
  if (!url || !key || url.includes('your-project-ref')) return [];
  try {
    const res = await fetch(`${url}/rest/v1/products?select=*&is_visible=eq.true&order=sort_order.asc`, {
      headers: { apikey: key, Authorization: `Bearer ${key}` },
      signal: AbortSignal.timeout(15000),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (e) {
    console.warn(`prerender-seo: could not load products (${e.message}) — product pages will use the app's defaults.`);
    return [];
  }
}

const variantsOf = (p) => {
  const list = Array.isArray(p.variants) ? p.variants.filter((v) => v?.label) : [];
  return list.length ? list : [{ label: '', price: Number(p.price) }];
};

function productPage(p) {
  const variants = variantsOf(p);
  const prices = variants.map((v) => Number(v.price));
  const low = Math.min(...prices);
  const weights = variants.map((v) => v.label).filter(Boolean).join(', ');
  const inStock = p.in_stock !== false && variants.some((v) => v.in_stock !== false);
  const pagePath = `/shop/${slugify(p.name)}`;
  const url = `${SITE_URL}${pagePath}`;
  const availability = `https://schema.org/${inStock ? 'InStock' : 'OutOfStock'}`;
  return {
    path: pagePath,
    title: `${p.name} — Panchaloha ${CATEGORY_NAME[p.category] ?? 'Bell'} from ${inr(low)} | ${SITE_NAME}`,
    description: `${p.description}${weights ? ` Available in ${weights}.` : ''} Price from ${inr(low)}. Handcrafted by ${SITE_NAME}.`,
    image: p.image || DEFAULT_IMAGE,
    type: 'product',
    heading: p.name,
    summary: `${p.description} ${weights ? `Weights: ${weights}. ` : ''}Price from ${inr(low)}.`,
    jsonLd: {
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
          ? { '@type': 'AggregateOffer', priceCurrency: 'INR', lowPrice: low, highPrice: Math.max(...prices), offerCount: prices.length, availability, url }
          : { '@type': 'Offer', priceCurrency: 'INR', price: low, availability, url },
    },
  };
}

const HOME_JSONLD = [
  {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: SITE_NAME,
    url: SITE_URL,
    logo: `${SITE_URL}/apple-touch-icon.png`,
    email: 'pranavanaadaa@gmail.com',
    telephone: '+918050124365',
    sameAs: [
      'https://www.instagram.com/pranavanaadaa_bells/',
      'https://www.facebook.com/share/1J2y1WPpSR/',
    ],
  },
  { '@context': 'https://schema.org', '@type': 'WebSite', name: SITE_NAME, url: SITE_URL, inLanguage: ['en', 'kn'] },
];

function render(template, page) {
  const url = `${SITE_URL}${page.path === '/' ? '/' : page.path}`;
  const tags = [
    `<title>${esc(page.title)}</title>`,
    `<meta name="description" content="${esc(page.description)}" />`,
    `<link rel="canonical" href="${url}" />`,
    `<meta name="robots" content="index, follow" />`,
    `<meta property="og:type" content="${page.type ?? 'website'}" />`,
    `<meta property="og:site_name" content="${SITE_NAME}" />`,
    `<meta property="og:title" content="${esc(page.title)}" />`,
    `<meta property="og:description" content="${esc(page.description)}" />`,
    `<meta property="og:url" content="${url}" />`,
    `<meta property="og:image" content="${esc(page.image ?? DEFAULT_IMAGE)}" />`,
    `<meta name="twitter:card" content="summary_large_image" />`,
    `<meta name="twitter:title" content="${esc(page.title)}" />`,
    `<meta name="twitter:description" content="${esc(page.description)}" />`,
    `<meta name="twitter:image" content="${esc(page.image ?? DEFAULT_IMAGE)}" />`,
    ...(page.jsonLd ? [`<script type="application/ld+json" data-seo="jsonld">${JSON.stringify(page.jsonLd).replace(/</g, '\\u003c')}</script>`] : []),
  ].join('\n    ');
  const splash = `<div class="splash">
        <div class="brand">${SITE_NAME}</div>
        <h1>${esc(page.heading ?? page.title.split(' — ')[0].split(' | ')[0])}</h1>
        <p>${esc(page.summary ?? page.description)}</p>
      </div>`;
  return template
    .replace(/<!--SEO-->[\s\S]*?<!--\/SEO-->/, tags)
    .replace(/<!--SPLASH-->[\s\S]*?<!--\/SPLASH-->/, splash);
}

function write(pagePath, html) {
  // /about → about.html, /shop/x → shop/x.html (served without the extension via cleanUrls in vercel.json)
  const file = pagePath === '/' ? path.join(DIST, 'index.html') : path.join(DIST, `${pagePath}.html`);
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, html);
}

async function main() {
  const template = fs.readFileSync(path.join(DIST, 'index.html'), 'utf8');
  if (!template.includes('<!--SEO-->') || !template.includes('<!--SPLASH-->')) {
    throw new Error('dist/index.html is missing the <!--SEO--> / <!--SPLASH--> markers');
  }

  const pages = Object.entries(PAGES).map(([p, meta]) => ({
    path: p,
    ...meta,
    ...(p === '/' ? { jsonLd: HOME_JSONLD, heading: 'Handcrafted Panchaloha Pooja Bells' } : {}),
  }));
  const products = await fetchProducts();
  pages.push(...products.map(productPage));

  for (const page of pages) write(page.path, render(template, page));

  const today = new Date().toISOString().slice(0, 10);
  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
${pages
  .map(
    (p) => `  <url>
    <loc>${SITE_URL}${p.path === '/' ? '/' : p.path}</loc>
    <lastmod>${today}</lastmod>
    <priority>${p.path === '/' ? '1.0' : p.type === 'product' ? '0.8' : '0.6'}</priority>${
      p.type === 'product' && p.image ? `\n    <image:image><image:loc>${esc(p.image)}</image:loc></image:image>` : ''
    }
  </url>`
  )
  .join('\n')}
</urlset>
`;
  fs.writeFileSync(path.join(DIST, 'sitemap.xml'), sitemap);
  console.log(`prerender-seo: wrote ${pages.length} pages (${products.length} products) + sitemap.xml`);
}

main().catch((e) => {
  console.error(`prerender-seo failed: ${e.message}`);
  process.exit(1);
});
