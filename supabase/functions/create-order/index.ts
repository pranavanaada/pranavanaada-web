// create-order — validates the checkout form, recalculates every price from the
// database (the browser's prices are never trusted), checks stock, saves the
// order, and for "Pay Now" creates the matching Razorpay order.
import { adminClient, corsHeaders, env, json, PUBLIC_ORDER_FIELDS } from '../_shared/common.ts';
import { esc, notifyInBackground, optEnv, sendEmail, shell } from '../_shared/notify.ts';
import { deliveryEstimate, GRACE_MS } from '../_shared/delivery.ts';

type CartLine =
  | { type: 'product'; product_id: string; variant?: string; qty: number }
  | { type: 'combo'; combo_id: string; qty: number };

interface Variant {
  label: string;
  size?: string;
  price: number;
  in_stock?: boolean;
}

const MAX_LINES = 50;
const MAX_QTY = 99;

const clean = (v: unknown, max = 200) => (typeof v === 'string' ? v.trim().slice(0, max) : '');

function validateCustomer(c: Record<string, unknown>) {
  const out = {
    customer_name: clean(c.name, 100),
    email: clean(c.email, 150).toLowerCase(),
    phone: clean(c.phone, 20).replace(/[^\d+]/g, ''),
    alt_phone: clean(c.altPhone, 20).replace(/[^\d+]/g, '') || null,
    address_line1: clean(c.address1, 200),
    address_line2: clean(c.address2, 200) || null,
    landmark: clean(c.landmark, 120) || null,
    city: clean(c.city, 80),
    state: clean(c.state, 80),
    pincode: clean(c.pincode, 10),
    address_type: clean(c.addressType, 20) || null,
    notes: clean(c.notes, 1000) || null,
    gstin: clean(c.gstin, 20).toUpperCase() || null,
    language: clean(c.language, 5) || 'en',
  };
  const errors: string[] = [];
  if (out.customer_name.length < 2) errors.push('name');
  if (!/^\S+@\S+\.\S+$/.test(out.email)) errors.push('email');
  if (!/^(\+?91)?[6-9]\d{9}$/.test(out.phone)) errors.push('phone');
  if (out.address_line1.length < 5) errors.push('address');
  if (!out.city) errors.push('city');
  if (!out.state) errors.push('state');
  if (!/^[1-9]\d{5}$/.test(out.pincode)) errors.push('pincode');
  if (out.gstin && !/^[0-9A-Z]{15}$/.test(out.gstin)) errors.push('gstin');
  // Expected delivery from the address — Bengaluru same day before 12 pm, Karnataka 1–2 days, elsewhere 3–4
  // Keep the date the customer was shown if it was right a few minutes ago (e.g. "today" seen at 11:59)
  const now = deliveryEstimate(out.state, out.city, out.pincode);
  const earlier = deliveryEstimate(out.state, out.city, out.pincode, Date.now() - GRACE_MS);
  const eta = clean(c.deliveryBy, 10) === earlier.to ? earlier : now;
  return { customer: { ...out, delivery_from: eta.from, preferred_delivery_date: eta.to }, errors };
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405);

  try {
    const body = await req.json();
    const lines: CartLine[] = Array.isArray(body.items) ? body.items.slice(0, MAX_LINES) : [];
    const paymentMethod = body.paymentMethod === 'cod' ? 'cod' : 'online';
    if (!lines.length) return json({ error: 'empty_cart' }, 400);

    const db = adminClient();
    const { data: settings } = await db.from('store_settings').select('*').eq('id', 1).single();
    const s = settings ?? {
      cod_enabled: true,
      cod_max_total: 0,
      online_enabled: true,
      shipping_fee: 0,
      free_shipping_above: 0,
      min_delivery_days: 7,
    };

    const { customer, errors } = validateCustomer(body.customer ?? {});
    if (errors.length) return json({ error: 'invalid_details', fields: errors }, 400);

    // ---- Price every line from the database --------------------------------
    const productIds = new Set<string>();
    const comboIds = new Set<string>();
    for (const l of lines) {
      if (l.type === 'combo') comboIds.add(l.combo_id);
      else productIds.add(l.product_id);
    }
    const { data: combos } = comboIds.size
      ? await db.from('combos').select('*').in('id', [...comboIds]).eq('is_visible', true)
      : { data: [] };
    for (const c of combos ?? []) for (const it of c.items ?? []) productIds.add(it.product_id);
    const { data: products } = productIds.size
      ? await db.from('products').select('*').in('id', [...productIds])
      : { data: [] };
    const productById = new Map((products ?? []).map((p) => [p.id, p]));
    const comboById = new Map((combos ?? []).map((c) => [c.id, c]));

    const pickVariant = (p: { variants?: Variant[]; price: number }, label?: string): Variant | null => {
      const vs: Variant[] = Array.isArray(p.variants) ? p.variants.filter((v) => v?.label) : [];
      if (!vs.length) return { label: '', price: Number(p.price) };
      return vs.find((v) => v.label === label) ?? null;
    };
    const available = (p: { in_stock?: boolean; is_visible?: boolean }, v: Variant) =>
      p.is_visible !== false && p.in_stock !== false && v.in_stock !== false;

    const items: Record<string, unknown>[] = [];
    const problems: string[] = [];
    for (const l of lines) {
      const qty = Math.min(MAX_QTY, Math.max(1, Math.floor(Number(l.qty) || 1)));
      if (l.type === 'combo') {
        const c = comboById.get(l.combo_id);
        if (!c || c.in_stock === false) {
          problems.push(l.combo_id);
          continue;
        }
        const contents = (c.items ?? []).map((it: { product_id: string; variant?: string; qty: number }) => {
          const p = productById.get(it.product_id);
          const v = p ? pickVariant(p, it.variant) : null;
          return { p, v, qty: it.qty };
        });
        if (!contents.length || contents.some((x) => !x.p || !x.v || !available(x.p, x.v))) {
          problems.push(c.name);
          continue;
        }
        items.push({
          type: 'combo',
          id: c.id,
          name: c.name,
          includes: contents.map((x) => `${x.p.name}${x.v.label ? ` · ${x.v.label}` : ''} × ${x.qty}`).join(', '),
          unit_price: Number(c.price),
          qty,
          line_total: Number(c.price) * qty,
        });
      } else {
        const p = productById.get(l.product_id);
        const v = p ? pickVariant(p, l.variant) : null;
        if (!p || !v || !available(p, v)) {
          problems.push(p?.name ?? l.product_id);
          continue;
        }
        items.push({
          type: 'product',
          id: p.id,
          name: p.name,
          variant: v.label || null,
          size: v.size ?? null,
          image: p.thumb || p.image,
          unit_price: v.price,
          qty,
          line_total: v.price * qty,
        });
      }
    }
    if (problems.length) return json({ error: 'unavailable', items: problems }, 409);

    const subtotal = items.reduce((n, i) => n + (i.line_total as number), 0);
    const freeAbove = Number(s.free_shipping_above) || 0;
    const shipping = freeAbove > 0 && subtotal >= freeAbove ? 0 : Number(s.shipping_fee) || 0;
    const total = subtotal + shipping;

    // ---- Payment method rules -------------------------------------------------
    if (paymentMethod === 'cod') {
      const codMax = Number(s.cod_max_total) || 0;
      if (!s.cod_enabled || (codMax > 0 && total > codMax)) return json({ error: 'cod_not_allowed' }, 400);
    } else if (!s.online_enabled) {
      return json({ error: 'online_not_allowed' }, 400);
    }

    const orderRow = { ...customer, items, subtotal, shipping_fee: shipping, total, payment_method: paymentMethod };

    // ---- Pay on delivery: the order is final now ------------------------------
    if (paymentMethod === 'cod') {
      const { data: order, error: insertError } = await db
        .from('orders')
        .insert({ ...orderRow, payment_status: 'cod_pending', status: 'placed' })
        .select('id')
        .single();
      if (insertError || !order) throw insertError ?? new Error('Could not save order');
      await notifyInBackground(db, order.id); // confirmations (email + WhatsApp)
      const { data: summary } = await db.from('orders').select(PUBLIC_ORDER_FIELDS).eq('id', order.id).single();
      return json({ order: summary });
    }

    // ---- Pay online: ask Razorpay first (amount in paise) ----------------------
    // Nothing is saved unless Razorpay accepts, and the order only gets its PN number once
    // the payment succeeds (mark_order_paid) — until then it carries a temporary reference,
    // so failed or abandoned payments don't use up order numbers.
    const paymentRef = `PAY-${crypto.randomUUID().replace(/-/g, '').slice(0, 6).toUpperCase()}`;
    const keyId = env('RAZORPAY_KEY_ID');
    const keySecret = env('RAZORPAY_KEY_SECRET');
    const rzp = await fetch('https://api.razorpay.com/v1/orders', {
      method: 'POST',
      headers: {
        Authorization: `Basic ${btoa(`${keyId}:${keySecret}`)}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        amount: Math.round(total * 100),
        currency: 'INR',
        receipt: paymentRef,
        notes: { payment_ref: paymentRef, customer: customer.customer_name, phone: customer.phone },
      }),
    });
    const rzpOrder = await rzp.json().catch(() => ({}));
    if (!rzp.ok || !rzpOrder?.id) {
      const reason = rzpOrder?.error?.description ?? `HTTP ${rzp.status}`;
      console.error('Razorpay order creation failed:', reason);
      await alertPaymentsDown(reason, customer.customer_name, customer.phone);
      return json({ error: 'payment_unavailable' }, 503);
    }

    const { error: insertError } = await db.from('orders').insert({
      ...orderRow,
      order_number: paymentRef,
      razorpay_order_id: rzpOrder.id,
      payment_status: 'pending',
      status: 'awaiting_payment',
    });
    if (insertError) throw insertError;

    return json({
      razorpay: {
        key: keyId,
        order_id: rzpOrder.id,
        amount: rzpOrder.amount,
        currency: 'INR',
      },
      order_number: paymentRef,
    });
  } catch (e) {
    console.error(e);
    return json({ error: 'server_error', message: e instanceof Error ? e.message : String(e) }, 500);
  }
});

// Tell the owner straight away when Razorpay refuses to start payments (e.g. the API keys
// were regenerated in Razorpay but not updated here). At most one email every 20 minutes.
let lastPaymentsAlert = 0;
async function alertPaymentsDown(reason: string, customerName: string, phone: string) {
  if (Date.now() - lastPaymentsAlert < 20 * 60 * 1000) return;
  lastPaymentsAlert = Date.now();
  try {
    await sendEmail(
      optEnv('ADMIN_EMAIL') || 'pranavanaadaa@gmail.com',
      '⚠️ Online payments are failing on pranavanaada.com',
      shell(`
        <p style="font-size:17px;font-weight:bold;margin:0 0 10px;color:#a33;">Customers cannot pay online right now</p>
        <p style="margin:0 0 12px;line-height:1.6;">Razorpay refused to start a payment. Razorpay's message: <b>${esc(reason)}</b></p>
        <p style="margin:0 0 12px;line-height:1.6;">Customer who just tried: <b>${esc(customerName)}</b> (${esc(phone)}) — they were asked to use Pay on delivery instead.</p>
        <p style="margin:0 0 12px;line-height:1.6;"><b>"Authentication failed"</b> means the Razorpay API keys saved on the website are no longer valid — usually because new keys were generated in the Razorpay dashboard. Save the new keys on the website (run <code>npm run set-razorpay-keys</code> in the project), or switch off "Online payment" in Admin → Settings until it is fixed.</p>
      `)
    );
  } catch (e) {
    console.error('payments-down alert failed', e);
  }
}
