import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { supabase } from '../../lib/supabaseClient';
import { invalidateCatalog } from '../../hooks/useProducts';
import type { Product, ProductCategory, ProductVariant } from '../../types/product';
import ImageManager, { type ManagedImage } from './ImageManager';
import { MAX_VIDEO_MB, uploadProductVideo } from '../../lib/imageUpload';

export const inputClass =
  'w-full bg-emerald-950 border border-emerald-700 rounded-md px-3 py-2.5 text-sm outline-none focus:border-gold';

// Form rows keep prices as strings while typing.
type VariantRow = { label: string; size: string; price: string; inStock: boolean };

export function Toggle({
  checked,
  onChange,
  label,
  hint,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
  hint?: string;
}) {
  return (
    <label className="flex items-start gap-3 cursor-pointer select-none">
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={`relative mt-0.5 w-10 h-6 shrink-0 rounded-full transition-colors ${checked ? 'bg-gold' : 'bg-emerald-700'}`}
      >
        <span
          className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-cream shadow transition-transform ${
            checked ? 'translate-x-4' : ''
          }`}
        />
      </button>
      <span>
        <span className="block text-sm text-cream">{label}</span>
        {hint && <span className="block text-xs text-cream/45">{hint}</span>}
      </span>
    </label>
  );
}

export function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <fieldset className="border border-emerald-800 rounded-xl p-5 space-y-4">
      <legend className="text-xs uppercase tracking-wider text-gold px-2">{title}</legend>
      {children}
    </fieldset>
  );
}

export default function AdminProductForm() {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const navigate = useNavigate();

  const [loaded, setLoaded] = useState(!isEdit);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [category, setCategory] = useState<ProductCategory>('hand-bell');
  const [badge, setBadge] = useState('');
  const [nameKn, setNameKn] = useState('');
  const [descriptionKn, setDescriptionKn] = useState('');
  const [badgeKn, setBadgeKn] = useState('');
  const [variants, setVariants] = useState<VariantRow[]>([]);
  const [images, setImages] = useState<ManagedImage[]>([]);
  const [video, setVideo] = useState<string | null>(null);
  const [videoBusy, setVideoBusy] = useState(false);
  const [spin, setSpin] = useState<string[]>([]);
  const [inStock, setInStock] = useState(true);
  const [visible, setVisible] = useState(true);
  const [featured, setFeatured] = useState(false);
  const [sortOrder, setSortOrder] = useState('0');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isEdit) return;
    supabase
      .from('products')
      .select('*')
      .eq('id', id)
      .single()
      .then(({ data, error }) => {
        if (error || !data) {
          setError('Could not load this product.');
          return;
        }
        const p = data as Product;
        setName(p.name);
        setDescription(p.description);
        setPrice(String(p.price));
        setCategory(p.category);
        setBadge(p.badge || '');
        setNameKn(p.name_kn || '');
        setDescriptionKn(p.description_kn || '');
        setBadgeKn(p.badge_kn || '');
        setVariants(
          (p.variants || []).map((v) => ({
            label: v.label,
            size: v.size || '',
            price: String(v.price),
            inStock: v.in_stock !== false,
          }))
        );
        setVideo(p.video ?? null);
        setSpin(p.spin ?? []);
        setImages([
          ...(p.image ? [{ url: p.image, thumb: p.thumb }] : []),
          ...(p.images || []).map((url) => ({ url })),
        ]);
        setInStock(p.in_stock !== false);
        setVisible(p.is_visible);
        setFeatured(!!p.featured);
        setSortOrder(String(p.sort_order ?? 0));
        setLoaded(true);
      });
  }, [id, isEdit]);

  function updateVariant<K extends keyof VariantRow>(index: number, field: K, value: VariantRow[K]) {
    setVariants((rows) => rows.map((r, i) => (i === index ? { ...r, [field]: value } : r)));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const cleanVariants: ProductVariant[] = variants
      .filter((v) => v.label.trim())
      .map((v) => ({
        label: v.label.trim(),
        ...(v.size.trim() ? { size: v.size.trim() } : {}),
        price: Number(v.price),
        in_stock: v.inStock,
      }));
    if (cleanVariants.some((v) => !Number.isFinite(v.price) || v.price <= 0)) {
      setError('Every weight option needs a price.');
      return;
    }
    if (!cleanVariants.length && !(Number(price) > 0)) {
      setError('Enter a price, or add weight options with prices.');
      return;
    }
    if (!images.length) {
      setError('Add at least one photo.');
      return;
    }

    setSaving(true);
    const [main, ...extras] = images;
    const payload = {
      name: name.trim(),
      description: description.trim(),
      // With weight options, the listed price is the lowest ("from") price.
      price: cleanVariants.length ? Math.min(...cleanVariants.map((v) => v.price)) : Number(price),
      category,
      badge: badge.trim() || null,
      name_kn: nameKn.trim() || null,
      description_kn: descriptionKn.trim() || null,
      badge_kn: badgeKn.trim() || null,
      variants: cleanVariants,
      image: main.url,
      thumb: main.thumb || null,
      video,
      spin,
      images: extras.map((i) => i.url),
      in_stock: inStock,
      is_visible: visible,
      featured,
      sort_order: Number(sortOrder) || 0,
    };

    const { error: saveError } = isEdit
      ? await supabase.from('products').update(payload).eq('id', id)
      : await supabase.from('products').insert(payload);

    setSaving(false);
    if (saveError) {
      setError(saveError.message);
      return;
    }
    invalidateCatalog();
    navigate('/admin');
  }

  if (!loaded) {
    return <p className="text-cream/50">{error || 'Loading…'}</p>;
  }

  return (
    <div className="max-w-2xl">
      <Link to="/admin" className="text-xs text-cream/50 hover:text-gold">
        ← All products
      </Link>
      <h1 className="font-heading text-gold text-2xl mt-2 mb-6">{isEdit ? 'Edit Product' : 'Add Product'}</h1>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Section title="Details">
          <div>
            <label className="block text-xs text-cream/50 mb-1">Name</label>
            <input required value={name} onChange={(e) => setName(e.target.value)} className={inputClass} />
          </div>
          <div>
            <label className="block text-xs text-cream/50 mb-1">Description</label>
            <textarea
              required
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className={`${inputClass} resize-y`}
            />
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-cream/50 mb-1">Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as ProductCategory)}
                className={inputClass}
              >
                <option value="hand-bell">Hand Bell</option>
                <option value="hanging-bell">Hanging Bell</option>
                <option value="jayagante">Jayagante</option>
              </select>
            </div>
            <div>
              <label className="block text-xs text-cream/50 mb-1">Badge on photo (optional)</label>
              <input
                placeholder="e.g. Stick included"
                maxLength={24}
                value={badge}
                onChange={(e) => setBadge(e.target.value)}
                className={inputClass}
              />
            </div>
          </div>
        </Section>

        <Section title="Photos">
          <ImageManager images={images} onChange={setImages} />
          <div className="border-t border-emerald-800 pt-4">
            <div className="text-xs text-cream/50 mb-2">Product video (optional — shown as the last item in the gallery)</div>
            {video ? (
              <div className="flex items-start gap-4">
                <video src={video} muted loop autoPlay playsInline className="w-32 h-32 object-cover rounded-lg border border-emerald-700" />
                <button type="button" onClick={() => setVideo(null)} className="text-xs text-red-300 hover:underline">
                  Remove video
                </button>
              </div>
            ) : (
              <label className="inline-block cursor-pointer text-xs text-gold hover:underline">
                {videoBusy ? 'Uploading video…' : '+ Upload a short video (MP4, under ' + MAX_VIDEO_MB + ' MB)'}
                <input
                  type="file"
                  accept="video/mp4,video/webm,video/quicktime"
                  hidden
                  disabled={videoBusy}
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    e.target.value = '';
                    if (!file) return;
                    setVideoBusy(true);
                    setError(null);
                    try {
                      setVideo(await uploadProductVideo(file));
                    } catch (err) {
                      setError(err instanceof Error ? err.message : 'Video upload failed');
                    } finally {
                      setVideoBusy(false);
                    }
                  }}
                />
              </label>
            )}
          </div>
        </Section>

        <Section title="360° view">
          {spin.length > 0 ? (
            <div className="space-y-3">
              <div className="text-xs text-cream/50">
                Shown first on the product page; turns through these {spin.length} views in order.
              </div>
              <div className="flex flex-wrap gap-2">
                {spin.map((url, i) => (
                  <div key={url} className="relative">
                    <img src={url} alt={`360° view ${i + 1}`} className="w-20 h-24 object-cover rounded-md border border-emerald-700" />
                    <span className="absolute bottom-1 left-1 text-[10px] bg-emerald-950/80 text-cream/80 px-1.5 rounded">{i + 1}</span>
                  </div>
                ))}
              </div>
              <button
                type="button"
                onClick={() => {
                  if (confirm('Remove the 360° view from this product? The product page will open on the main photo instead.')) setSpin([]);
                }}
                className="text-xs text-red-300 hover:underline"
              >
                Remove 360° view
              </button>
              <p className="text-[11px] text-cream/40">Takes effect when you save the product.</p>
            </div>
          ) : (
            <p className="text-xs text-cream/50">
              No 360° view. To add one, send photos of the bell from each side (front, side, back, other side) on the green
              cloth — they're lined up and placed on the felt background automatically.
            </p>
          )}
        </Section>

        <Section title="Price & weights">
          {variants.length === 0 ? (
            <>
              <div className="max-w-[200px]">
                <label className="block text-xs text-cream/50 mb-1">Price (₹)</label>
                <input
                  type="number"
                  min="1"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  className={inputClass}
                />
              </div>
              <p className="text-xs text-cream/40">
                Single price. Add weight options below if this product comes in several weights.
              </p>
            </>
          ) : (
            <div className="space-y-2">
              <div className="hidden sm:grid grid-cols-[1fr_1.6fr_1fr_auto_auto] gap-2 text-[11px] text-cream/40">
                <span>Weight</span>
                <span>Size</span>
                <span>Price (₹)</span>
                <span>In stock</span>
                <span className="w-6" />
              </div>
              {variants.map((v, i) => (
                <div
                  key={i}
                  className="grid grid-cols-2 sm:grid-cols-[1fr_1.6fr_1fr_auto_auto] gap-2 items-center border-b border-emerald-800/60 sm:border-0 pb-3 sm:pb-0"
                >
                  <input
                    required
                    placeholder="1 kg"
                    value={v.label}
                    onChange={(e) => updateVariant(i, 'label', e.target.value)}
                    className={inputClass}
                  />
                  <input
                    placeholder="9 in tall · 5 in wide"
                    value={v.size}
                    onChange={(e) => updateVariant(i, 'size', e.target.value)}
                    className={inputClass}
                  />
                  <input
                    required
                    type="number"
                    min="1"
                    placeholder="10000"
                    value={v.price}
                    onChange={(e) => updateVariant(i, 'price', e.target.value)}
                    className={inputClass}
                  />
                  <button
                    type="button"
                    onClick={() => updateVariant(i, 'inStock', !v.inStock)}
                    className={`text-xs px-3 py-2 rounded-md border whitespace-nowrap ${
                      v.inStock ? 'border-gold/50 text-gold' : 'border-red-400/50 text-red-300'
                    }`}
                  >
                    {v.inStock ? 'In stock' : 'Out of stock'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setVariants((rows) => rows.filter((_, j) => j !== i))}
                    aria-label="Remove weight option"
                    className="w-6 text-cream/40 hover:text-red-400"
                  >
                    ✕
                  </button>
                </div>
              ))}
              <p className="text-xs text-cream/40">
                The lowest price is shown as the "from" price. Out-of-stock weights can't be added to enquiries.
              </p>
            </div>
          )}
          <button
            type="button"
            onClick={() => setVariants((rows) => [...rows, { label: '', size: '', price: '', inStock: true }])}
            className="text-xs text-gold hover:underline"
          >
            + Add weight option
          </button>
        </Section>

        <Section title="Availability & display">
          <Toggle
            checked={inStock}
            onChange={setInStock}
            label="In stock"
            hint="Turn off to mark the whole product out of stock. Visitors can still ask about availability."
          />
          <Toggle
            checked={visible}
            onChange={setVisible}
            label="Visible on website"
            hint="Hidden products stay here in the admin panel but don't appear on the site."
          />
          <Toggle checked={featured} onChange={setFeatured} label="Featured on home page" hint="Up to 4 featured products are shown." />
          <div className="max-w-[200px]">
            <label className="block text-xs text-cream/50 mb-1">Display order</label>
            <input
              type="number"
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value)}
              className={inputClass}
            />
            <p className="text-[11px] text-cream/40 mt-1">Lower numbers are shown first.</p>
          </div>
        </Section>

        {/* Kannada version — shown when visitors switch to ಕನ್ನಡ; English is used if left blank */}
        <Section title="ಕನ್ನಡ (Kannada) — optional">
          <div>
            <label className="block text-xs text-cream/50 mb-1">Name (Kannada)</label>
            <input lang="kn" value={nameKn} onChange={(e) => setNameKn(e.target.value)} className={inputClass} />
          </div>
          <div>
            <label className="block text-xs text-cream/50 mb-1">Description (Kannada)</label>
            <textarea
              lang="kn"
              value={descriptionKn}
              onChange={(e) => setDescriptionKn(e.target.value)}
              rows={3}
              className={`${inputClass} resize-y`}
            />
          </div>
          <div>
            <label className="block text-xs text-cream/50 mb-1">Badge (Kannada)</label>
            <input lang="kn" maxLength={24} value={badgeKn} onChange={(e) => setBadgeKn(e.target.value)} className={inputClass} />
          </div>
        </Section>

        {error && <p className="text-sm text-red-400">{error}</p>}

        <div className="flex gap-3 sticky bottom-0 bg-emerald-900/95 backdrop-blur py-4 -mx-1 px-1">
          <button
            type="button"
            onClick={() => navigate('/admin')}
            className="flex-1 py-3 rounded-md border border-gold text-gold text-sm font-semibold uppercase tracking-wide"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving}
            className="flex-1 py-3 rounded-md bg-gold text-emerald-950 text-sm font-semibold uppercase tracking-wide disabled:opacity-60"
          >
            {saving ? 'Saving…' : isEdit ? 'Save Changes' : 'Add Product'}
          </button>
        </div>
      </form>
    </div>
  );
}
