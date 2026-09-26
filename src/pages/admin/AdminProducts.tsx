import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../../lib/supabaseClient';
import { invalidateCatalog } from '../../hooks/useProducts';
import { importStarterCatalog } from '../../lib/starterCatalog';
import { priceLabel, sortProducts } from '../../lib/productUtils';
import type { Product } from '../../types/product';

const CATEGORY_LABEL: Record<string, string> = {
  'hand-bell': 'Hand bell',
  'hanging-bell': 'Hanging bell',
  jayagante: 'Jayagante',
};

function Pill({
  on,
  onClick,
  onLabel,
  offLabel,
  danger = false,
}: {
  on: boolean;
  onClick: () => void;
  onLabel: string;
  offLabel: string;
  danger?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      className={`text-xs px-3 py-1.5 rounded-full whitespace-nowrap transition-colors ${
        on
          ? 'bg-gold/20 text-gold hover:bg-gold/30'
          : danger
            ? 'bg-red-400/15 text-red-300 hover:bg-red-400/25'
            : 'bg-cream/10 text-cream/45 hover:bg-cream/15'
      }`}
    >
      {on ? onLabel : offLabel}
    </button>
  );
}

export default function AdminProducts() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [importing, setImporting] = useState<string | null>(null);

  async function load() {
    const { data, error } = await supabase.from('products').select('*');
    if (error) {
      setErrorMsg('Could not load products. Make sure you have run supabase/schema.sql — see README.md.');
    } else {
      setProducts(sortProducts((data || []) as Product[]));
      setErrorMsg(null);
    }
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  // Optimistic quick-edit: update the row on screen immediately, then save.
  async function patch(p: Product, changes: Partial<Product>) {
    setProducts((list) => list.map((x) => (x.id === p.id ? { ...x, ...changes } : x)));
    const { error } = await supabase.from('products').update(changes).eq('id', p.id);
    if (error) {
      setErrorMsg(`Could not update "${p.name}": ${error.message}`);
      load();
    } else invalidateCatalog();
  }

  async function remove(p: Product) {
    if (!confirm(`Delete "${p.name}"? This cannot be undone.`)) return;
    const { error } = await supabase.from('products').delete().eq('id', p.id);
    if (error) setErrorMsg(error.message);
    invalidateCatalog();
    load();
  }

  async function runImport() {
    setErrorMsg(null);
    setImporting('Starting…');
    try {
      await importStarterCatalog((done, total) => setImporting(`Imported ${done} of ${total}…`));
      invalidateCatalog();
      await load();
    } catch (e) {
      setErrorMsg(`Import stopped: ${e instanceof Error ? e.message : String(e)}`);
      load();
    } finally {
      setImporting(null);
    }
  }

  const outOfStock = products.filter((p) => p.in_stock === false).length;
  const partial = products.filter(
    (p) => p.in_stock !== false && (p.variants ?? []).some((v) => v.in_stock === false)
  ).length;

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <div>
          <h1 className="font-heading text-gold text-2xl">Products</h1>
          {!loading && products.length > 0 && (
            <p className="text-xs text-cream/50 mt-1">
              {products.length} products · {outOfStock} out of stock
              {partial > 0 && ` · ${partial} with some weights out of stock`}
            </p>
          )}
        </div>
        <Link to="/admin/products/new" className="bg-gold text-emerald-950 text-sm font-semibold px-4 py-2 rounded-md">
          + Add Product
        </Link>
      </div>

      {errorMsg && <p className="text-sm text-red-400 mb-4">{errorMsg}</p>}

      {loading ? (
        <p className="text-cream/50">Loading…</p>
      ) : products.length === 0 ? (
        <div className="max-w-lg rounded-xl border border-emerald-700 bg-emerald-800/40 p-6">
          <h2 className="font-heading text-cream text-lg mb-2">No products yet</h2>
          <p className="text-sm text-cream/60 mb-5">
            Import the 7 bells currently shown on the website (with their photos, weights, prices and Kannada text), then
            edit them here — or add products one by one.
          </p>
          <button
            onClick={runImport}
            disabled={!!importing}
            className="bg-gold text-emerald-950 text-sm font-semibold px-5 py-2.5 rounded-md disabled:opacity-60"
          >
            {importing ?? 'Import starter catalogue'}
          </button>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-emerald-800">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-cream/50 bg-emerald-950/50">
                <th className="py-2.5 px-3">Product</th>
                <th className="py-2.5 px-3">Price</th>
                <th className="py-2.5 px-3">Stock</th>
                <th className="py-2.5 px-3">On site</th>
                <th className="py-2.5 px-3">Home</th>
                <th className="py-2.5 px-3" />
              </tr>
            </thead>
            <tbody>
              {products.map((p) => {
                const weightsOut = (p.variants ?? []).filter((v) => v.in_stock === false).map((v) => v.label);
                return (
                  <tr key={p.id} className="border-t border-emerald-800 align-middle">
                    <td className="py-3 px-3">
                      <div className="flex items-center gap-3 min-w-[220px]">
                        <img src={p.thumb || p.image} alt="" className="w-12 h-12 object-cover rounded-md shrink-0" />
                        <div className="min-w-0">
                          <Link to={`/admin/products/${p.id}/edit`} className="text-cream hover:text-gold">
                            {p.name}
                          </Link>
                          <div className="text-xs text-cream/40">{CATEGORY_LABEL[p.category] ?? p.category}</div>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-3 text-gold whitespace-nowrap">{priceLabel(p)}</td>
                    <td className="py-3 px-3">
                      <Pill
                        on={p.in_stock !== false}
                        onClick={() => patch(p, { in_stock: p.in_stock === false })}
                        onLabel="In stock"
                        offLabel="Out of stock"
                        danger
                      />
                      {p.in_stock !== false && weightsOut.length > 0 && (
                        <div className="text-[11px] text-red-300/80 mt-1">Out: {weightsOut.join(', ')}</div>
                      )}
                    </td>
                    <td className="py-3 px-3">
                      <Pill
                        on={p.is_visible}
                        onClick={() => patch(p, { is_visible: !p.is_visible })}
                        onLabel="Visible"
                        offLabel="Hidden"
                      />
                    </td>
                    <td className="py-3 px-3">
                      <button
                        onClick={() => patch(p, { featured: !p.featured })}
                        title={p.featured ? 'Featured on home page' : 'Not featured'}
                        className={`text-lg ${p.featured ? 'text-gold' : 'text-cream/25 hover:text-cream/50'}`}
                      >
                        ★
                      </button>
                    </td>
                    <td className="py-3 px-3 whitespace-nowrap space-x-3 text-right">
                      <Link to={`/admin/products/${p.id}/edit`} className="text-gold hover:underline">
                        Edit
                      </Link>
                      <button onClick={() => remove(p)} className="text-red-400 hover:underline">
                        Delete
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
