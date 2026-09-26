import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { DEFAULT_SETTINGS, type StoreSettings } from '../../lib/checkout';
import { Toggle, inputClass } from './AdminProductForm';

/** Checkout rules: payment methods, COD limit, delivery charge, lead time. */
export default function StoreSettingsForm() {
  const [s, setS] = useState<StoreSettings>(DEFAULT_SETTINGS);
  const [loaded, setLoaded] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);

  useEffect(() => {
    supabase
      .from('store_settings')
      .select('*')
      .eq('id', 1)
      .maybeSingle()
      .then(({ data }) => {
        if (data) {
          setS({
            cod_enabled: data.cod_enabled,
            cod_max_total: Number(data.cod_max_total),
            online_enabled: data.online_enabled,
            shipping_fee: Number(data.shipping_fee),
            free_shipping_above: Number(data.free_shipping_above),
            min_delivery_days: Number(data.min_delivery_days),
          });
        }
        setLoaded(true);
      });
  }, []);

  const num = (k: keyof StoreSettings) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setS((x) => ({ ...x, [k]: Math.max(0, Number(e.target.value) || 0) }));

  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (!s.cod_enabled && !s.online_enabled) {
      setMessage({ ok: false, text: 'Keep at least one payment method switched on.' });
      return;
    }
    setSaving(true);
    const { error } = await supabase
      .from('store_settings')
      .update({ ...s, updated_at: new Date().toISOString() })
      .eq('id', 1);
    setSaving(false);
    setMessage(error ? { ok: false, text: error.message } : { ok: true, text: 'Saved. Checkout uses these rules immediately.' });
  }

  if (!loaded) return <p className="text-cream/50 text-sm">Loading…</p>;

  return (
    <form onSubmit={save} className="rounded-xl border border-emerald-700 bg-emerald-800/30 p-5 space-y-5">
      <h2 className="text-cream font-medium">Checkout & delivery</h2>

      <Toggle
        checked={s.online_enabled}
        onChange={(v) => setS((x) => ({ ...x, online_enabled: v }))}
        label="Pay now (online, via Razorpay)"
        hint="Needs Razorpay keys set up — see README.md → Payments."
      />
      <Toggle
        checked={s.cod_enabled}
        onChange={(v) => setS((x) => ({ ...x, cod_enabled: v }))}
        label="Pay on delivery (cash / UPI)"
      />
      {s.cod_enabled && (
        <div className="max-w-[240px] pl-[52px]">
          <label className="block text-xs text-cream/50 mb-1">Only for orders up to (₹)</label>
          <input type="number" min="0" value={s.cod_max_total} onChange={num('cod_max_total')} className={inputClass} />
          <p className="text-[11px] text-cream/40 mt-1">0 = no limit. A limit protects you from costly refused deliveries.</p>
        </div>
      )}

      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs text-cream/50 mb-1">Delivery charge per order (₹)</label>
          <input type="number" min="0" value={s.shipping_fee} onChange={num('shipping_fee')} className={inputClass} />
        </div>
        <div>
          <label className="block text-xs text-cream/50 mb-1">Free delivery for orders from (₹)</label>
          <input type="number" min="0" value={s.free_shipping_above} onChange={num('free_shipping_above')} className={inputClass} />
          <p className="text-[11px] text-cream/40 mt-1">0 = always charge the delivery fee.</p>
        </div>
        <div>
          <label className="block text-xs text-cream/50 mb-1">Earliest delivery (days after order)</label>
          <input type="number" min="0" value={s.min_delivery_days} onChange={num('min_delivery_days')} className={inputClass} />
        </div>
      </div>

      {message && <p className={`text-xs ${message.ok ? 'text-emerald-200' : 'text-red-400'}`}>{message.text}</p>}
      <button
        type="submit"
        disabled={saving}
        className="w-full bg-gold text-emerald-950 py-3 rounded-md text-sm font-semibold uppercase tracking-wide disabled:opacity-60"
      >
        {saving ? 'Saving…' : 'Save checkout settings'}
      </button>
    </form>
  );
}
