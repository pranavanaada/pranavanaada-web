// create-order — validates the checkout form, recalculates every price from the
// database (the browser's prices are never trusted), checks stock, saves the
// order, and for "Pay Now" creates the matching Razorpay order.
import { adminClient, corsHeaders, env, json, PUBLIC_ORDER_FIELDS } from '../_shared/common.ts';
import { notifyInBackground } from '../_shared/notify.ts';

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

function validateCustomer(c: Record<string, unknown>, minDays: number) {
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
    preferred_delivery_date: clean(c.deliveryDate, 10) || null,
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
  if (out.preferred_delivery_date) {
    const earliest = new Date();
    earliest.setHours(0, 0, 0, 0);
    earliest.setDate(earliest.getDate() + minDays);
    const chosen = new Date(`${out.preferred_delivery_date}T00:00:00`);
    if (isNaN(chosen.getTime()) || chosen < earliest) errors.push('deliveryDate');
  } else {
    errors.push('deliveryDate');
  }
  return { customer: out, errors };
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

    const { customer, errors } = validateCustomer(body.customer ?? {}, Number(s.min_delivery_days) || 0);
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

    // ---- Save the order -------------------------------------------------------
    const { data: order, error: insertError } = await db
      .from('orders')
      .insert({
        ...customer,
        items,
        subtotal,
        shipping_fee: shipping,
        total,
        payment_method: paymentMethod,
        payment_status: paymentMethod === 'cod' ? 'cod_pending' : 'pending',
        status: paymentMethod === 'cod' ? 'placed' : 'awaiting_payment',
      })
      .select('id, order_number')
      .single();
    if (insertError || !order) throw insertError ?? new Error('Could not save order');

    if (paymentMethod === 'cod') {
      // Pay-on-delivery orders are final now: send confirmations (email + WhatsApp).
      await notifyInBackground(db, order.id);
      const { data: summary } = await db.from('orders').select(PUBLIC_ORDER_FIELDS).eq('id', order.id).single();
      return json({ order: summary });
    }

    // ---- Create the Razorpay order (amount in paise) --------------------------
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
        receipt: order.order_number,
        notes: { order_id: order.id, order_number: order.order_number },
      }),
    });
    const rzpOrder = await rzp.json();
    if (!rzp.ok) {
      await db.from('orders').update({ payment_status: 'failed', admin_notes: 'Razorpay order creation failed' }).eq('id', order.id);
      throw new Error(rzpOrder?.error?.description ?? 'Razorpay order creation failed');
    }
    await db.from('orders').update({ razorpay_order_id: rzpOrder.id }).eq('id', order.id);

    return json({
      razorpay: {
        key: keyId,
        order_id: rzpOrder.id,
        amount: rzpOrder.amount,
        currency: 'INR',
      },
      order_number: order.order_number,
    });
  } catch (e) {
    console.error(e);
    return json({ error: 'server_error', message: e instanceof Error ? e.message : String(e) }, 500);
  }
});
