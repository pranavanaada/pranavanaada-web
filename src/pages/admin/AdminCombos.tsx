import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../../lib/supabaseClient';
import { invalidateCatalog } from '../../hooks/useProducts';
import { formatINR, sortProducts } from '../../lib/productUtils';
import { describeLines, isComboAvailable, regularTotal, resolveCombo } from '../../lib/comboUtils';
import type { Combo, Product } from '../../types/product';

export default function AdminCombos() {
  const [combos, setCombos] = useState<Combo[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  async function load() {
    const [c, p] = await Promise.all([supabase.from('combos').select('*'), supabase.from('products').select('*')]);
    if (c.error || p.error) {
      setErrorMsg('Could not load combos. Make sure you have run the latest supabase/schema.sql.');
    } else {
      setCombos(sortProducts((c.data || []) as Combo[]));
      setProducts((p.data || []) as Product[]);
      setErrorMsg(null);
    }
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  async function patch(c: Combo, changes: Partial<Combo>) {
    setCombos((list) => list.map((x) => (x.id === c.id ? { ...x, ...changes } : x)));
    const { error } = await supabase.from('combos').update(changes).eq('id', c.id);
    if (error) {
      setErrorMsg(error.message);
      load();
    } else invalidateCatalog();
  }

  async function remove(c: Combo) {
    if (!confirm(`Delete combo "${c.name}"?`)) return;
    const { error } = await supabase.from('combos').delete().eq('id', c.id);
    if (error) setErrorMsg(error.message);
    invalidateCatalog();
    load();
  }

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <div>
          <h1 className="font-heading text-gold text-2xl">Combo Offers</h1>
          <p className="text-xs text-cream/50 mt-1">Bundles of products at a special price. Shown on the home page and shop.</p>
        </div>
        <Link to="/admin/combos/new" className="bg-gold text-emerald-950 text-sm font-semibold px-4 py-2 rounded-md">
          + New Combo
        </Link>
      </div>

      {errorMsg && <p className="text-sm text-red-400 mb-4">{errorMsg}</p>}

      {loading ? (
        <p className="text-cream/50">Loading…</p>
      ) : combos.length === 0 ? (
        <p className="text-cream/50">No combos yet. Create one to offer a set of bells at a special price.</p>
      ) : (
        <div className="grid gap-4">
          {combos.map((c) => {
            const lines = resolveCombo(c, products);
            const regular = regularTotal(lines);
            const missing = (c.items?.length ?? 0) - lines.length;
            const available = isComboAvailable(c, lines);
            return (
              <div key={c.id} className="rounded-xl border border-emerald-700 bg-emerald-800/30 p-4 flex flex-wrap gap-4 items-center">
                <div className="flex -space-x-3">
                  {(c.image ? [c.image] : lines.slice(0, 3).map((l) => l.product.thumb || l.product.image)).map((src, i) => (
                    <img key={i} src={src} alt="" className="w-14 h-14 rounded-lg object-cover border-2 border-emerald-900" />
                  ))}
                </div>
                <div className="flex-1 min-w-[200px]">
                  <Link to={`/admin/combos/${c.id}/edit`} className="text-cream hover:text-gold font-medium">
                    {c.name}
                  </Link>
                  <div className="text-xs text-cream/50 mt-0.5">{describeLines(lines, 'en') || 'No products'}</div>
                  <div className="text-sm mt-1">
                    <span className="text-gold font-semibold">{formatINR(c.price)}</span>
                    {regular > c.price && (
                      <span className="text-cream/40 ml-2">
                        <span className="line-through">{formatINR(regular)}</span> · saves {formatINR(regular - c.price)}
                      </span>
                    )}
                  </div>
                  {missing > 0 && (
                    <div className="text-xs text-red-300 mt-1">{missing} included product(s) no longer exist — edit this combo.</div>
                  )}
                  {c.in_stock !== false && !available && lines.length > 0 && (
                    <div className="text-xs text-red-300 mt-1">An included product or weight is out of stock, so visitors can't add this combo.</div>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => patch(c, { in_stock: c.in_stock === false })}
                    className={`text-xs px-3 py-1.5 rounded-full ${c.in_stock !== false ? 'bg-gold/20 text-gold' : 'bg-red-400/15 text-red-300'}`}
                  >
                    {c.in_stock !== false ? 'In stock' : 'Out of stock'}
                  </button>
                  <button
                    onClick={() => patch(c, { is_visible: !c.is_visible })}
                    className={`text-xs px-3 py-1.5 rounded-full ${c.is_visible ? 'bg-gold/20 text-gold' : 'bg-cream/10 text-cream/45'}`}
                  >
                    {c.is_visible ? 'Visible' : 'Hidden'}
                  </button>
                  <Link to={`/admin/combos/${c.id}/edit`} className="text-gold text-sm hover:underline ml-2">
                    Edit
                  </Link>
                  <button onClick={() => remove(c)} className="text-red-400 text-sm hover:underline">
                    Delete
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
