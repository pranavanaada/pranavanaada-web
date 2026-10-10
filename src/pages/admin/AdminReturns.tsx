import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { formatINR } from '../../lib/productUtils';
import { adminAction } from '../../lib/adminApi';

interface ReturnRequest {
  id: string;
  order_id: string;
  items: { index: number; name: string; variant: string | null; qty: number; unit_price: number }[];
  reason: 'damaged' | 'defective';
  details: string;
  resolution: 'refund' | 'replacement';
  media: string[];
  video_on_whatsapp: boolean;
  refund_upi: string | null;
  amount: number;
  status: 'requested' | 'approved' | 'rejected' | 'received' | 'refunded' | 'replaced';
  admin_note: string | null;
  razorpay_refund_id: string | null;
  history: { status: string; at: string; note?: string }[];
  created_at: string;
  orders: {
    order_number: string;
    customer_name: string;
    phone: string;
    email: string;
    payment_method: 'online' | 'cod';
    razorpay_payment_id: string | null;
    delivered_at: string | null;
  } | null;
}

type Tab = 'open' | 'done' | 'rejected' | 'all';
const OPEN = ['requested', 'approved', 'received'];

const STATUS: Record<ReturnRequest['status'], { text: string; cls: string }> = {
  requested: { text: 'New — needs review', cls: 'bg-red-400 text-emerald-950' },
  approved: { text: 'Approved — waiting for the item', cls: 'bg-neela/40 text-neela-light' },
  received: { text: 'Item received — check & finish', cls: 'bg-gold/25 text-gold' },
  refunded: { text: 'Refunded', cls: 'bg-cream/10 text-cream/70' },
  replaced: { text: 'Replacement sent', cls: 'bg-cream/10 text-cream/70' },
  rejected: { text: 'Rejected', cls: 'bg-kumkum/25 text-kumkum-light' },
};

const isImage = (path: string) => /\.(jpe?g|png|webp|gif|heic|heif|avif)$/i.test(path);
const waNumber = (phone: string) => {
  const d = phone.replace(/\D/g, '');
  return d.length === 10 ? `91${d}` : d;
};
const when = (d: string) => new Date(d).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' });

/** Return / replacement requests customers send from their order page. */
export default function AdminReturns() {
  const [list, setList] = useState<ReturnRequest[]>([]);
  const [urls, setUrls] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [tab, setTab] = useState<Tab>('open');
  const [working, setWorking] = useState<string | null>(null);

  async function load() {
    const { data, error } = await supabase
      .from('return_requests')
      .select('*, orders(order_number, customer_name, phone, email, payment_method, razorpay_payment_id, delivered_at)')
      .order('created_at', { ascending: false });
    if (error) {
      setErrorMsg('Could not load return requests.');
      setLoading(false);
      return;
    }
    const rows = (data || []) as ReturnRequest[];
    setList(rows);
    // Private files: short-lived links so the videos and photos can be viewed here
    const paths = rows.flatMap((r) => r.media);
    if (paths.length) {
      const { data: signed } = await supabase.storage.from('return-media').createSignedUrls(paths, 60 * 60);
      setUrls(Object.fromEntries((signed || []).filter((s) => s.signedUrl).map((s) => [s.path, s.signedUrl])));
    }
    setErrorMsg(null);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  async function act(r: ReturnRequest, body: Record<string, unknown>) {
    setWorking(r.id);
    try {
      const { request } = await adminAction<{ request: ReturnRequest }>({ returnId: r.id, ...body });
      setList((l) => l.map((x) => (x.id === r.id ? { ...request, orders: x.orders } : x)));
      setErrorMsg(null);
    } catch (e) {
      setErrorMsg(`Could not update the request for ${r.orders?.order_number}: ${(e as Error).message}`);
    } finally {
      setWorking(null);
    }
  }

  function approve(r: ReturnRequest) {
    const note = prompt(
      'Approve this request? The customer gets an email with your return address and how to send the item back.\n\nOptional message to include (or leave empty):',
      ''
    );
    if (note !== null) act(r, { action: 'return-update', status: 'approved', note });
  }
  function reject(r: ReturnRequest) {
    const note = prompt('Why is it being rejected? This is emailed to the customer.', '');
    if (note === null) return;
    if (!note.trim()) return alert('Please give a reason — it is sent to the customer.');
    act(r, { action: 'return-update', status: 'rejected', note });
  }
  function received(r: ReturnRequest) {
    if (confirm('Mark the returned item as received? The customer gets an email saying you are checking it.')) {
      act(r, { action: 'return-update', status: 'received' });
    }
  }
  function refund(r: ReturnRequest) {
    if (r.orders?.payment_method === 'online' && r.orders.razorpay_payment_id) {
      if (confirm(`Refund ${formatINR(r.amount)} to the customer's original payment method through Razorpay now?`)) {
        act(r, { action: 'return-refund' });
      }
    } else {
      const ref = prompt(
        `Send ${formatINR(r.amount)} to: ${r.refund_upi ?? '(no details given — ask the customer)'}\n\nOnce sent, enter the UPI / bank transaction reference:`,
        ''
      );
      if (ref === null) return;
      if (!ref.trim()) return alert('Please enter the transaction reference — it is sent to the customer.');
      act(r, { action: 'return-refund', reference: ref });
    }
  }
  function replaced(r: ReturnRequest) {
    const note = prompt('Replacement dispatched? Courier and tracking number for the customer (optional):', '');
    if (note !== null) act(r, { action: 'return-update', status: 'replaced', note });
  }

  const inTab = (r: ReturnRequest) =>
    tab === 'all' ? true : tab === 'open' ? OPEN.includes(r.status) : tab === 'rejected' ? r.status === 'rejected' : ['refunded', 'replaced'].includes(r.status);
  const count = (t: Tab) => list.filter((r) => (t === 'all' ? true : t === 'open' ? OPEN.includes(r.status) : t === 'rejected' ? r.status === 'rejected' : ['refunded', 'replaced'].includes(r.status))).length;
  const shown = list.filter(inTab);

  return (
    <div>
      <h1 className="font-heading text-gold text-2xl mb-2">Returns & replacements</h1>
      <p className="text-xs text-cream/50 mb-5 max-w-2xl">
        Customers report damaged or defective items from their order page within 3 days of delivery. Check the unboxing video, approve
        or reject, then once the item is back: refund it or send a replacement. Each step emails the customer.
      </p>

      <div className="flex flex-wrap gap-2 mb-6">
        {(
          [
            ['open', 'Open'],
            ['done', 'Completed'],
            ['rejected', 'Rejected'],
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
            {label} ({count(key)})
          </button>
        ))}
      </div>

      {errorMsg && <p className="text-sm text-red-400 mb-4">{errorMsg}</p>}

      {loading ? (
        <p className="text-cream/50">Loading…</p>
      ) : shown.length === 0 ? (
        <p className="text-cream/50">No requests here.</p>
      ) : (
        <div className="space-y-4">
          {shown.map((r) => {
            const o = r.orders;
            const st = STATUS[r.status];
            const busy = working === r.id;
            const btn = 'text-sm font-semibold px-4 py-2 rounded-md transition-colors disabled:opacity-50';
            return (
              <article key={r.id} className={`rounded-xl border p-4 md:p-5 ${r.status === 'requested' ? 'border-gold/60 bg-emerald-800/40' : 'border-emerald-800'}`}>
                <header className="flex flex-wrap items-center gap-x-4 gap-y-2 mb-4">
                  <span className="font-semibold text-cream">{o?.order_number}</span>
                  <span className="text-sm text-cream/80">{o?.customer_name}</span>
                  <span className="text-xs text-cream/40">{when(r.created_at)}</span>
                  <span className="flex-1" />
                  <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${st.cls}`}>{st.text}</span>
                </header>

                <div className="grid lg:grid-cols-2 gap-5">
                  <div className="space-y-3 text-sm">
                    <div>
                      {r.items.map((i) => (
                        <div key={i.index} className="text-cream/85">
                          {i.name}
                          {i.variant && <span className="text-cream/50"> · {i.variant}</span>} × {i.qty}
                          <span className="text-cream/45"> ({formatINR(i.unit_price * i.qty)})</span>
                        </div>
                      ))}
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <div className="text-cream/45">Problem</div>
                        <div className="text-cream">{r.reason === 'damaged' ? 'Damaged in transit' : 'Defective'}</div>
                      </div>
                      <div>
                        <div className="text-cream/45">Customer wants</div>
                        <div className="text-cream font-semibold">
                          {r.resolution === 'refund' ? `Refund · ${formatINR(r.amount)}` : 'Replacement'}
                        </div>
                      </div>
                      <div>
                        <div className="text-cream/45">Paid</div>
                        <div className="text-cream">{o?.payment_method === 'online' ? 'Online (Razorpay)' : 'On delivery'}</div>
                      </div>
                      {r.refund_upi && (
                        <div>
                          <div className="text-cream/45">Refund to</div>
                          <div className="text-cream break-all">{r.refund_upi}</div>
                        </div>
                      )}
                    </div>
                    <blockquote className="border-l-2 border-gold/50 pl-3 text-cream/75 whitespace-pre-line">{r.details}</blockquote>
                    {o && (
                      <div className="flex flex-wrap gap-4 text-xs">
                        <a href={`tel:${o.phone}`} className="text-cream/70 hover:text-gold">
                          📞 {o.phone}
                        </a>
                        <a href={`https://wa.me/${waNumber(o.phone)}?text=${encodeURIComponent(`Namaste ${o.customer_name}, about your request for order ${o.order_number}`)}`} target="_blank" rel="noopener noreferrer" className="text-[#25D366]">
                          WhatsApp
                        </a>
                        <a href={`mailto:${o.email}`} className="text-cream/70 hover:text-gold break-all">
                          {o.email}
                        </a>
                      </div>
                    )}
                    {r.admin_note && <p className="text-xs text-cream/60">Note sent to customer: {r.admin_note}</p>}
                    {r.razorpay_refund_id && <p className="text-xs text-cream/60">Razorpay refund: {r.razorpay_refund_id}</p>}
                    <ol className="text-[11px] text-cream/45 space-y-0.5">
                      {r.history.map((h, n) => (
                        <li key={n}>
                          {when(h.at)} — {h.status}
                          {h.note ? ` (${h.note})` : ''}
                        </li>
                      ))}
                    </ol>
                  </div>

                  {/* Unboxing video + photos */}
                  <div>
                    {r.video_on_whatsapp && r.media.every(isImage) && (
                      <p className="text-xs text-gold-light bg-gold/10 border border-gold/40 rounded-md px-3 py-2 mb-3">
                        The customer is sending the unboxing video on WhatsApp — check it there before approving.
                      </p>
                    )}
                    <div className="grid grid-cols-2 gap-2">
                      {r.media.map((p) =>
                        !urls[p] ? (
                          <div key={p} className="aspect-video rounded-md bg-emerald-950 border border-emerald-800" />
                        ) : isImage(p) ? (
                          <a key={p} href={urls[p]} target="_blank" rel="noopener noreferrer">
                            <img src={urls[p]} alt="Customer photo" className="w-full aspect-video object-cover rounded-md border border-emerald-800" />
                          </a>
                        ) : (
                          <video
                            key={p}
                            src={urls[p]}
                            controls
                            preload="metadata"
                            playsInline
                            className="col-span-2 w-full max-h-[360px] rounded-md border border-emerald-800 bg-black"
                          />
                        )
                      )}
                    </div>
                  </div>
                </div>

                {/* Next step */}
                {OPEN.includes(r.status) && (
                  <div className="flex flex-wrap gap-2 mt-5 pt-4 border-t border-emerald-800">
                    {r.status === 'requested' && (
                      <>
                        <button onClick={() => approve(r)} disabled={busy} className={`${btn} bg-gold text-emerald-950 hover:bg-gold-light`}>
                          ✓ Approve
                        </button>
                        <button onClick={() => reject(r)} disabled={busy} className={`${btn} border border-kumkum-light/60 text-kumkum-light hover:bg-kumkum/15`}>
                          Reject
                        </button>
                      </>
                    )}
                    {r.status === 'approved' && (
                      <>
                        <button onClick={() => received(r)} disabled={busy} className={`${btn} bg-gold text-emerald-950 hover:bg-gold-light`}>
                          📦 Item received
                        </button>
                        <button onClick={() => reject(r)} disabled={busy} className={`${btn} border border-kumkum-light/60 text-kumkum-light hover:bg-kumkum/15`}>
                          Reject
                        </button>
                      </>
                    )}
                    {r.status === 'received' &&
                      (r.resolution === 'refund' ? (
                        <button onClick={() => refund(r)} disabled={busy} className={`${btn} bg-gold text-emerald-950 hover:bg-gold-light`}>
                          {o?.payment_method === 'online' && o.razorpay_payment_id
                            ? `↩ Refund ${formatINR(r.amount)} via Razorpay`
                            : `Mark ${formatINR(r.amount)} refunded (UPI / bank)`}
                        </button>
                      ) : (
                        <button onClick={() => replaced(r)} disabled={busy} className={`${btn} bg-gold text-emerald-950 hover:bg-gold-light`}>
                          🚚 Replacement sent
                        </button>
                      ))}
                    {busy && <span className="text-xs text-cream/50 self-center">Working…</span>}
                  </div>
                )}
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
