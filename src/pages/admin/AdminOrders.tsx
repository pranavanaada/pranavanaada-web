import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { formatINR } from '../../lib/productUtils';
import { inputClass } from './AdminProductForm';

interface OrderItem {
  type: 'product' | 'combo';
  name: string;
  variant?: string | null;
  size?: string | null;
  includes?: string;
  image?: string;
  unit_price: number;
  qty: number;
  line_total: number;
}

interface Order {
  id: string;
  order_number: string;
  customer_name: string;
  email: string;
  phone: string;
  alt_phone: string | null;
  address_line1: string;
  address_line2: string | null;
  landmark: string | null;
  city: string;
  state: string;
  pincode: string;
  address_type: string | null;
  preferred_delivery_date: string | null;
  notes: string | null;
  gstin: string | null;
  language: string | null;
  items: OrderItem[];
  subtotal: number;
  shipping_fee: number;
  total: number;
  payment_method: 'online' | 'cod';
  payment_status: 'pending' | 'paid' | 'failed' | 'cod_pending' | 'refunded';
  razorpay_payment_id: string | null;
  status: 'awaiting_payment' | 'placed' | 'confirmed' | 'shipped' | 'delivered' | 'cancelled';
  courier: string | null;
  tracking_number: string | null;
  admin_notes: string | null;
  notifications?: { channel: 'email' | 'whatsapp'; to: 'customer' | 'admin'; ok: boolean; detail: string }[];
  created_at: string;
  delivered_at?: string | null;
}

const STATUS_LABEL: Record<Order['status'], string> = {
  awaiting_payment: 'Awaiting payment',
  placed: 'New',
  confirmed: 'Confirmed',
  shipped: 'Shipped',
  delivered: 'Delivered',
  cancelled: 'Cancelled',
};

const PAYMENT_LABEL: Record<Order['payment_status'], { text: string; cls: string }> = {
  paid: { text: 'Paid online', cls: 'bg-gold/20 text-gold' },
  cod_pending: { text: 'Pay on delivery', cls: 'bg-sky-400/15 text-sky-200' },
  pending: { text: 'Payment pending', cls: 'bg-cream/10 text-cream/60' },
  failed: { text: 'Payment failed', cls: 'bg-red-400/15 text-red-300' },
  refunded: { text: 'Refunded', cls: 'bg-cream/10 text-cream/60' },
};

type Tab = 'active' | 'delivered' | 'cancelled' | 'unpaid' | 'all';

const TO_DELIVER: Order['status'][] = ['placed', 'confirmed', 'shipped'];

// "To deliver" = needs work; unpaid online attempts are kept separate so they don't clutter it.
const inTab = (o: Order, tab: Tab) =>
  tab === 'all'
    ? true
    : tab === 'unpaid'
      ? o.status === 'awaiting_payment'
      : tab === 'delivered'
        ? o.status === 'delivered'
        : tab === 'cancelled'
          ? o.status === 'cancelled'
          : TO_DELIVER.includes(o.status);

/** A sale counts once it's delivered and hasn't been refunded. */
const isSale = (o: Order) => o.status === 'delivered' && o.payment_status !== 'refunded';
const sum = (list: Order[]) => list.reduce((t, o) => t + Number(o.total), 0);
const deliveredOn = (o: Order) => new Date(o.delivered_at || o.created_at);

const waNumber = (phone: string) => {
  const d = phone.replace(/\D/g, '');
  return d.length === 10 ? `91${d}` : d;
};

export default function AdminOrders() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [tab, setTab] = useState<Tab>('active');
  const [openId, setOpenId] = useState<string | null>(null);

  async function load() {
    const { data, error } = await supabase.from('orders').select('*').order('created_at', { ascending: false });
    if (error) setErrorMsg('Could not load orders. Make sure you have run the latest supabase/schema.sql.');
    else {
      setOrders((data || []) as Order[]);
      setErrorMsg(null);
    }
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  async function patch(o: Order, changes: Partial<Order>) {
    setOrders((list) => list.map((x) => (x.id === o.id ? { ...x, ...changes } : x)));
    const { error } = await supabase
      .from('orders')
      .update({ ...changes, updated_at: new Date().toISOString() })
      .eq('id', o.id);
    if (error) {
      setErrorMsg(`Could not update ${o.order_number}: ${error.message}`);
      load();
    }
  }

  /** Status change; keeps the delivery date in step (used for "this month" sales). */
  function setStatus(o: Order, status: Order['status']) {
    const changes: Partial<Order> = { status };
    if (status === 'delivered' && o.status !== 'delivered') changes.delivered_at = new Date().toISOString();
    if (status !== 'delivered') changes.delivered_at = null;
    return patch(o, changes);
  }

  function markDelivered(o: Order) {
    const cod = o.payment_method === 'cod' && o.payment_status === 'cod_pending';
    const ok = confirm(
      `Mark ${o.order_number} (${o.customer_name}) as delivered?` +
        (cod ? `

This was pay on delivery — it will also record ${formatINR(o.total)} as received.` : '')
    );
    if (!ok) return;
    patch(o, {
      status: 'delivered',
      delivered_at: new Date().toISOString(),
      ...(cod ? { payment_status: 'paid' as const } : {}),
    });
  }

  const sales = orders.filter(isSale);
  const now = new Date();
  const salesThisMonth = sales.filter((o) => {
    const d = deliveredOn(o);
    return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
  });
  const toDeliver = orders.filter((o) => TO_DELIVER.includes(o.status));

  const counts = (['active', 'delivered', 'cancelled', 'unpaid', 'all'] as Tab[]).reduce(
    (acc, t) => ({ ...acc, [t]: orders.filter((o) => inTab(o, t)).length }),
    {} as Record<Tab, number>
  );
  const shown = orders.filter((o) => inTab(o, tab));

  return (
    <div>
      <h1 className="font-heading text-gold text-2xl mb-4">Orders</h1>

      {!loading && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
          {[
            { label: 'Total sales', value: sum(sales), note: `${sales.length} delivered order${sales.length === 1 ? '' : 's'}`, accent: true },
            {
              label: `${now.toLocaleString('en-IN', { month: 'long' })} sales`,
              value: sum(salesThisMonth),
              note: `${salesThisMonth.length} delivered this month`,
            },
            { label: 'Yet to deliver', value: sum(toDeliver), note: `${toDeliver.length} order${toDeliver.length === 1 ? '' : 's'}` },
          ].map((c) => (
            <div
              key={c.label}
              className={`rounded-xl border p-4 ${c.accent ? 'border-gold/50 bg-gold/10' : 'border-emerald-800 bg-emerald-800/30'}`}
            >
              <div className="text-xs uppercase tracking-wider text-cream/50">{c.label}</div>
              <div className={`text-2xl font-semibold mt-1 ${c.accent ? 'text-gold' : 'text-cream'}`}>{formatINR(c.value)}</div>
              <div className="text-xs text-cream/45 mt-0.5">{c.note}</div>
            </div>
          ))}
        </div>
      )}

      <div className="flex flex-wrap gap-2 mb-6">
        {(
          [
            ['active', 'To deliver'],
            ['delivered', 'Delivered'],
            ['cancelled', 'Cancelled'],
            ['unpaid', 'Unpaid attempts'],
            ['all', 'All'],
          ] as [Tab, string][]
        ).map(([key, label]) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`text-sm px-4 py-1.5 rounded-full border ${
              tab === key ? 'bg-gold text-emerald-950 border-gold font-semibold' : 'border-emerald-700 text-cream/60'
            }`}
          >
            {label} ({counts[key] ?? 0})
          </button>
        ))}
      </div>

      {tab === 'unpaid' && (
        <p className="text-xs text-cream/50 mb-4">
          Customers who chose Pay Now but didn't finish paying. You may want to WhatsApp them — or delete old attempts.
        </p>
      )}

      {errorMsg && <p className="text-sm text-red-400 mb-4">{errorMsg}</p>}

      {loading ? (
        <p className="text-cream/50">Loading…</p>
      ) : shown.length === 0 ? (
        <p className="text-cream/50">No orders here.</p>
      ) : (
        <div className="space-y-3">
          {shown.map((o) => {
            const open = openId === o.id;
            const pay = PAYMENT_LABEL[o.payment_status];
            return (
              <div
                key={o.id}
                className={`rounded-xl border ${o.status === 'placed' ? 'border-gold/60 bg-emerald-800/40' : 'border-emerald-800'}`}
              >
                {/* Row: open/close toggle + delivery action side by side (a button can't hold another button) */}
                <div className="flex flex-wrap items-center">
                <button onClick={() => setOpenId(open ? null : o.id)} className="flex-1 min-w-0 text-left p-4 flex flex-wrap items-center gap-x-4 gap-y-2">
                  <span className="font-semibold text-cream">{o.order_number}</span>
                  <span className="text-sm text-cream/80">{o.customer_name}</span>
                  <span className="text-xs text-cream/40">
                    {new Date(o.created_at).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}
                  </span>
                  <span className="flex-1" />
                  <span className={`text-xs px-2.5 py-1 rounded-full ${pay.cls}`}>{pay.text}</span>
                  <span className="text-xs px-2.5 py-1 rounded-full bg-emerald-950/70 text-cream/80">{STATUS_LABEL[o.status]}</span>
                  <span className="text-gold font-semibold">{formatINR(o.total)}</span>
                  <span className="text-cream/40">{open ? '▴' : '▾'}</span>
                </button>
                {TO_DELIVER.includes(o.status) ? (
                  <div className="w-full sm:w-auto px-4 pb-4 sm:pb-0 sm:pl-0">
                    <button
                      onClick={() => markDelivered(o)}
                      className="w-full sm:w-auto text-sm font-semibold px-4 py-2 rounded-md bg-gold text-emerald-950 hover:bg-gold-light transition-colors"
                    >
                      ✓ Mark delivered
                    </button>
                  </div>
                ) : o.status === 'delivered' && o.delivered_at ? (
                  <div className="w-full sm:w-auto px-4 pb-4 sm:pb-0 sm:pl-0 text-xs text-cream/50">
                    Delivered {new Date(o.delivered_at).toLocaleDateString('en-IN', { dateStyle: 'medium' })}
                  </div>
                ) : null}
                </div>

                {open && (
                  <div className="border-t border-emerald-800 p-4 md:p-5 grid lg:grid-cols-2 gap-6">
                    {/* Left: what & where */}
                    <div className="space-y-5">
                      <div>
                        <h3 className="text-xs uppercase tracking-wider text-cream/45 mb-2">Items</h3>
                        <ul className="space-y-2">
                          {o.items.map((i, n) => (
                            <li key={n} className="flex gap-3 text-sm">
                              {i.image && <img src={i.image} alt="" className="w-10 h-10 rounded object-cover" />}
                              <div className="flex-1">
                                {i.type === 'combo' && <span className="text-[10px] bg-gold/20 text-gold px-1.5 rounded mr-1">COMBO</span>}
                                {i.name}
                                {i.variant && <span className="text-cream/50"> · {i.variant}</span>}
                                {i.includes && <div className="text-[11px] text-cream/45">{i.includes}</div>}
                                <div className="text-xs text-cream/45">
                                  {formatINR(i.unit_price)} × {i.qty}
                                </div>
                              </div>
                              <div>{formatINR(i.line_total)}</div>
                            </li>
                          ))}
                        </ul>
                        <div className="text-sm border-t border-emerald-800 mt-3 pt-2 space-y-0.5">
                          <div className="flex justify-between text-cream/60">
                            <span>Subtotal</span>
                            <span>{formatINR(o.subtotal)}</span>
                          </div>
                          <div className="flex justify-between text-cream/60">
                            <span>Delivery</span>
                            <span>{o.shipping_fee ? formatINR(o.shipping_fee) : 'Free'}</span>
                          </div>
                          <div className="flex justify-between font-semibold">
                            <span>Total</span>
                            <span className="text-gold">{formatINR(o.total)}</span>
                          </div>
                        </div>
                      </div>

                      <div>
                        <h3 className="text-xs uppercase tracking-wider text-cream/45 mb-2">Customer & delivery</h3>
                        <div className="text-sm text-cream/80 leading-relaxed">
                          <div className="font-medium text-cream">{o.customer_name}</div>
                          <div>
                            <a href={`tel:${o.phone}`} className="hover:text-gold">
                              {o.phone}
                            </a>
                            {o.alt_phone && ` · ${o.alt_phone}`} ·{' '}
                            <a href={`mailto:${o.email}`} className="hover:text-gold">
                              {o.email}
                            </a>
                          </div>
                          <div className="mt-2">
                            {o.address_line1}
                            {o.address_line2 && `, ${o.address_line2}`}
                            {o.landmark && <div>Landmark: {o.landmark}</div>}
                            <div>
                              {o.city}, {o.state} – {o.pincode}
                              {o.address_type && <span className="text-cream/45"> ({o.address_type})</span>}
                            </div>
                          </div>
                          {o.preferred_delivery_date && (
                            <div className="mt-2">
                              Preferred delivery:{' '}
                              <b>{new Date(`${o.preferred_delivery_date}T00:00:00`).toLocaleDateString('en-IN', { dateStyle: 'medium' })}</b>
                            </div>
                          )}
                          {o.notes && <div className="mt-2 text-cream/70 whitespace-pre-line">Note: {o.notes}</div>}
                          {o.gstin && <div className="mt-2">GSTIN: {o.gstin}</div>}
                          {o.language === 'kn' && <div className="mt-2 text-xs text-cream/45">Ordered using the Kannada site</div>}
                          {o.razorpay_payment_id && <div className="mt-2 text-xs text-cream/45">Razorpay payment: {o.razorpay_payment_id}</div>}
                        </div>
                        <div className="flex flex-wrap gap-3 mt-3 text-xs">
                          <a
                            href={`https://wa.me/${waNumber(o.phone)}?text=${encodeURIComponent(
                              `Namaste ${o.customer_name}, thank you for your Pranavanaada order ${o.order_number}.`
                            )}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-[#25D366] hover:underline"
                          >
                            WhatsApp customer
                          </a>
                          <button
                            onClick={() =>
                              navigator.clipboard?.writeText(
                                [
                                  o.customer_name,
                                  o.address_line1,
                                  o.address_line2,
                                  o.landmark,
                                  `${o.city}, ${o.state} - ${o.pincode}`,
                                  `Phone: ${o.phone}`,
                                ]
                                  .filter(Boolean)
                                  .join('\n')
                              )
                            }
                            className="text-gold hover:underline"
                          >
                            Copy address (for courier)
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Right: manage */}
                    <div className="space-y-4">
                      {!!o.notifications?.length && (
                        <div>
                          <h3 className="text-xs uppercase tracking-wider text-cream/45 mb-2">Confirmations sent</h3>
                          <ul className="space-y-1 text-xs">
                            {o.notifications.map((n, k) => (
                              <li key={k} className="flex gap-2" title={n.detail}>
                                <span className={n.ok ? 'text-gold' : n.detail.startsWith('skipped') ? 'text-cream/40' : 'text-red-300'}>
                                  {n.ok ? '✓' : n.detail.startsWith('skipped') ? '–' : '✕'}
                                </span>
                                <span className="text-cream/70">
                                  {n.channel === 'email' ? 'Email' : 'WhatsApp'} → {n.to}
                                </span>
                                <span className="text-cream/40 truncate">{n.ok ? '' : n.detail}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                      <div>
                        <label className="block text-xs text-cream/50 mb-1">Order status</label>
                        <select
                          value={o.status}
                          onChange={(e) => setStatus(o, e.target.value as Order['status'])}
                          className={inputClass}
                        >
                          {Object.entries(STATUS_LABEL).map(([k, v]) => (
                            <option key={k} value={k}>
                              {v}
                            </option>
                          ))}
                        </select>
                      </div>

                      {o.payment_method === 'cod' && o.payment_status === 'cod_pending' && (
                        <button
                          onClick={() => patch(o, { payment_status: 'paid' })}
                          className="w-full text-sm py-2 rounded-md border border-gold text-gold hover:bg-gold/10"
                        >
                          Mark cash / UPI received on delivery
                        </button>
                      )}
                      {o.payment_status === 'paid' && o.payment_method === 'online' && (
                        <p className="text-xs text-cream/45">
                          Refunds for online payments are issued from the Razorpay dashboard; then set payment to Refunded here.
                        </p>
                      )}
                      {o.payment_status === 'paid' && (
                        <button onClick={() => patch(o, { payment_status: 'refunded' })} className="text-xs text-cream/50 hover:underline">
                          Mark as refunded
                        </button>
                      )}

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs text-cream/50 mb-1">Courier</label>
                          <input
                            defaultValue={o.courier ?? ''}
                            placeholder="e.g. DTDC"
                            onBlur={(e) => e.target.value !== (o.courier ?? '') && patch(o, { courier: e.target.value || null })}
                            className={inputClass}
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-cream/50 mb-1">Tracking number</label>
                          <input
                            defaultValue={o.tracking_number ?? ''}
                            onBlur={(e) =>
                              e.target.value !== (o.tracking_number ?? '') && patch(o, { tracking_number: e.target.value || null })
                            }
                            className={inputClass}
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-xs text-cream/50 mb-1">Private notes (only admins see these)</label>
                        <textarea
                          rows={3}
                          defaultValue={o.admin_notes ?? ''}
                          onBlur={(e) => e.target.value !== (o.admin_notes ?? '') && patch(o, { admin_notes: e.target.value || null })}
                          className={`${inputClass} resize-y`}
                        />
                        <p className="text-[11px] text-cream/35 mt-1">Courier, tracking and notes save when you click away.</p>
                      </div>

                      {o.status === 'awaiting_payment' && (
                        <button
                          onClick={async () => {
                            if (!confirm(`Delete unpaid order ${o.order_number}?`)) return;
                            const { error } = await supabase.from('orders').delete().eq('id', o.id);
                            if (error) setErrorMsg(error.message);
                            load();
                          }}
                          className="text-xs text-red-400 hover:underline"
                        >
                          Delete this unpaid attempt
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
