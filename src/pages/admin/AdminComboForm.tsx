import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { supabase } from '../../lib/supabaseClient';
import { invalidateCatalog } from '../../hooks/useProducts';
import { formatINR, getVariants, sortProducts } from '../../lib/productUtils';
import { regularTotal, resolveCombo } from '../../lib/comboUtils';
import type { Combo, ComboItem, Product } from '../../types/product';
import ImageManager, { type ManagedImage } from './ImageManager';
import { Section, Toggle, inputClass } from './AdminProductForm';

export default function AdminComboForm() {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const navigate = useNavigate();

  const [products, setProducts] = useState<Product[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [name, setName] = useState('');
  const [nameKn, setNameKn] = useState('');
  const [description, setDescription] = useState('');
  const [descriptionKn, setDescriptionKn] = useState('');
  const [items, setItems] = useState<ComboItem[]>([]);
  const [price, setPrice] = useState('');
  const [images, setImages] = useState<ManagedImage[]>([]);
  const [inStock, setInStock] = useState(true);
  const [visible, setVisible] = useState(true);
  const [sortOrder, setSortOrder] = useState('0');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const { data: prods } = await supabase.from('products').select('*');
      setProducts(sortProducts((prods || []) as Product[]));
      if (isEdit) {
        const { data, error } = await supabase.from('combos').select('*').eq('id', id).single();
        if (error || !data) {
          setError('Could not load this combo.');
          return;
        }
        const c = data as Combo;
        setName(c.name);
        setNameKn(c.name_kn || '');
        setDescription(c.description || '');
        setDescriptionKn(c.description_kn || '');
        setItems(c.items || []);
        setPrice(String(c.price));
        setImages(c.image ? [{ url: c.image }] : []);
        setInStock(c.in_stock !== false);
        setVisible(c.is_visible);
        setSortOrder(String(c.sort_order ?? 0));
      }
      setLoaded(true);
    })();
  }, [id, isEdit]);

  const byId = new Map(products.map((p) => [p.id, p]));
  const lines = resolveCombo({ items } as Combo, products);
  const regular = regularTotal(lines);
  const comboPrice = Number(price) || 0;

  function updateItem(index: number, changes: Partial<ComboItem>) {
    setItems((list) => list.map((it, i) => (i === index ? { ...it, ...changes } : it)));
  }

  function addItem() {
    const first = products[0];
    if (!first) return;
    setItems((list) => [...list, { product_id: first.id, variant: getVariants(first)[0].label, qty: 1 }]);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const totalUnits = items.reduce((n, it) => n + Math.max(1, it.qty), 0);
    if (totalUnits < 2) {
      setError('A combo needs at least two items (two products, or one product with quantity 2+).');
      return;
    }
    if (!(comboPrice > 0)) {
      setError('Enter the combo price.');
      return;
    }
    setSaving(true);
    const payload = {
      name: name.trim(),
      name_kn: nameKn.trim() || null,
      description: description.trim(),
      description_kn: descriptionKn.trim() || null,
      items: items.map((it) => ({ product_id: it.product_id, variant: it.variant ?? '', qty: Math.max(1, it.qty) })),
      price: comboPrice,
      image: images[0]?.url ?? null,
      in_stock: inStock,
      is_visible: visible,
      sort_order: Number(sortOrder) || 0,
    };
    const { error: saveError } = isEdit
      ? await supabase.from('combos').update(payload).eq('id', id)
      : await supabase.from('combos').insert(payload);
    setSaving(false);
    if (saveError) {
      setError(saveError.message);
      return;
    }
    invalidateCatalog();
    navigate('/admin/combos');
  }

  if (!loaded) return <p className="text-cream/50">{error || 'Loading…'}</p>;

  return (
    <div className="max-w-2xl">
      <Link to="/admin/combos" className="text-xs text-cream/50 hover:text-gold">
        ← All combos
      </Link>
      <h1 className="font-heading text-gold text-2xl mt-2 mb-6">{isEdit ? 'Edit Combo' : 'New Combo'}</h1>

      {products.length === 0 ? (
        <p className="text-cream/60">Add products first — a combo is made from existing products.</p>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-6">
          <Section title="Details">
            <div>
              <label className="block text-xs text-cream/50 mb-1">Combo name</label>
              <input
                required
                placeholder="e.g. Pooja Room Set"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className={inputClass}
              />
            </div>
            <div>
              <label className="block text-xs text-cream/50 mb-1">Description (optional)</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={2}
                className={`${inputClass} resize-y`}
              />
            </div>
          </Section>

          <Section title="Products in this combo">
            {items.length === 0 && <p className="text-xs text-cream/40">No products added yet.</p>}
            {items.map((it, i) => {
              const product = byId.get(it.product_id);
              const variants = product ? getVariants(product) : [];
              return (
                <div key={i} className="grid grid-cols-[1fr_auto] sm:grid-cols-[2fr_1fr_80px_auto] gap-2 items-center">
                  <select
                    value={it.product_id}
                    onChange={(e) => {
                      const p = byId.get(e.target.value);
                      updateItem(i, { product_id: e.target.value, variant: p ? getVariants(p)[0].label : '' });
                    }}
                    className={`${inputClass} col-span-2 sm:col-span-1`}
                  >
                    {!product && <option value={it.product_id}>(deleted product)</option>}
                    {products.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                  {variants.some((v) => v.label) ? (
                    <select
                      value={it.variant ?? ''}
                      onChange={(e) => updateItem(i, { variant: e.target.value })}
                      className={inputClass}
                    >
                      {variants.map((v) => (
                        <option key={v.label} value={v.label}>
                          {v.label} — {formatINR(v.price)}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <span className="text-xs text-cream/50">{product ? formatINR(product.price) : ''}</span>
                  )}
                  <input
                    type="number"
                    min="1"
                    value={it.qty}
                    onChange={(e) => updateItem(i, { qty: Math.max(1, Number(e.target.value) || 1) })}
                    className={inputClass}
                    aria-label="Quantity"
                  />
                  <button
                    type="button"
                    onClick={() => setItems((list) => list.filter((_, j) => j !== i))}
                    aria-label="Remove product"
                    className="w-6 text-cream/40 hover:text-red-400"
                  >
                    ✕
                  </button>
                </div>
              );
            })}
            <button type="button" onClick={addItem} className="text-xs text-gold hover:underline">
              + Add product
            </button>
          </Section>

          <Section title="Price">
            <div className="grid sm:grid-cols-2 gap-4 items-end">
              <div>
                <div className="text-xs text-cream/50 mb-1">Regular total (calculated)</div>
                <div className="text-lg text-cream/70">{formatINR(regular)}</div>
              </div>
              <div>
                <label className="block text-xs text-cream/50 mb-1">Combo price (₹)</label>
                <input
                  required
                  type="number"
                  min="1"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  className={inputClass}
                />
              </div>
            </div>
            {comboPrice > 0 && regular > 0 && (
              <p className={`text-sm ${comboPrice < regular ? 'text-gold' : 'text-red-300'}`}>
                {comboPrice < regular
                  ? `Visitors save ${formatINR(regular - comboPrice)} (${Math.round(((regular - comboPrice) / regular) * 100)}% off).`
                  : 'The combo price is not lower than buying the items separately.'}
              </p>
            )}
          </Section>

          <Section title="Photo (optional)">
            <p className="text-xs text-cream/45 -mt-1">Without a photo, the included products' photos are shown together.</p>
            <ImageManager images={images.slice(0, 1)} onChange={(imgs) => setImages(imgs.slice(-1))} folder="combos" />
          </Section>

          <Section title="Availability & display">
            <Toggle checked={inStock} onChange={setInStock} label="Available" hint="Turn off to show this combo as out of stock." />
            <Toggle checked={visible} onChange={setVisible} label="Visible on website" />
            <div className="max-w-[200px]">
              <label className="block text-xs text-cream/50 mb-1">Display order</label>
              <input type="number" value={sortOrder} onChange={(e) => setSortOrder(e.target.value)} className={inputClass} />
            </div>
          </Section>

          <Section title="ಕನ್ನಡ (Kannada) — optional">
            <div>
              <label className="block text-xs text-cream/50 mb-1">Combo name (Kannada)</label>
              <input lang="kn" value={nameKn} onChange={(e) => setNameKn(e.target.value)} className={inputClass} />
            </div>
            <div>
              <label className="block text-xs text-cream/50 mb-1">Description (Kannada)</label>
              <textarea
                lang="kn"
                value={descriptionKn}
                onChange={(e) => setDescriptionKn(e.target.value)}
                rows={2}
                className={`${inputClass} resize-y`}
              />
            </div>
          </Section>

          {error && <p className="text-sm text-red-400">{error}</p>}

          <div className="flex gap-3 sticky bottom-0 bg-emerald-900/95 backdrop-blur py-4">
            <button
              type="button"
              onClick={() => navigate('/admin/combos')}
              className="flex-1 py-3 rounded-md border border-gold text-gold text-sm font-semibold uppercase tracking-wide"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 py-3 rounded-md bg-gold text-emerald-950 text-sm font-semibold uppercase tracking-wide disabled:opacity-60"
            >
              {saving ? 'Saving…' : isEdit ? 'Save Changes' : 'Create Combo'}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
