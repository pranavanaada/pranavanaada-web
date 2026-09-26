import { supabase } from './supabaseClient';
import { uploadAsIs } from './imageUpload';
import { fallbackProducts } from '../data/products';

/**
 * Copy the built-in catalog (src/data/products.ts) into Supabase: uploads each
 * photo to storage and inserts the product rows. Used once, from the admin
 * panel, when the products table is empty.
 */
export async function importStarterCatalog(onProgress?: (done: number, total: number) => void) {
  const total = fallbackProducts.length;
  let done = 0;
  for (const [index, p] of fallbackProducts.entries()) {
    const slug = p.id;
    const image = await uploadAsIs(p.image, slug);
    const thumb = p.thumb ? await uploadAsIs(p.thumb, `${slug}-thumb`, 'products/thumbs') : null;
    const images = await Promise.all((p.images ?? []).map((src, i) => uploadAsIs(src, `${slug}-${i + 1}`)));

    const { error } = await supabase.from('products').insert({
      name: p.name,
      description: p.description,
      price: p.price,
      category: p.category,
      image,
      thumb,
      images,
      variants: p.variants ?? [],
      badge: p.badge ?? null,
      name_kn: p.name_kn ?? null,
      description_kn: p.description_kn ?? null,
      badge_kn: p.badge_kn ?? null,
      in_stock: true,
      is_visible: true,
      featured: index < 4, // the first four were the home page's featured products
      sort_order: (index + 1) * 10, // gaps leave room to slot products in between later
    });
    if (error) throw new Error(`${p.name}: ${error.message}`);
    onProgress?.(++done, total);
  }
}
