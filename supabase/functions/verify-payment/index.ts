// verify-payment — called by the browser after Razorpay Checkout succeeds.
// Checks Razorpay's signature (proof the payment is genuine) before marking
// the order paid. The webhook (razorpay-webhook) does the same independently,
// in case the visitor closes the page before this call happens.
import { adminClient, corsHeaders, env, hmacHex, json, PUBLIC_ORDER_FIELDS, safeEqual } from '../_shared/common.ts';
import { notifyInBackground } from '../_shared/notify.ts';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405);

  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = await req.json();
    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return json({ error: 'missing_fields' }, 400);
    }

    const expected = await hmacHex(env('RAZORPAY_KEY_SECRET'), `${razorpay_order_id}|${razorpay_payment_id}`);
    if (!safeEqual(expected, String(razorpay_signature))) return json({ error: 'invalid_signature' }, 400);

    const db = adminClient();
    const now = new Date().toISOString();
    // Skip the update if the webhook already recorded this payment (so an admin's
    // later status change isn't overwritten).
    await db
      .from('orders')
      .update({ payment_status: 'paid', razorpay_payment_id, paid_at: now, status: 'placed', updated_at: now })
      .eq('razorpay_order_id', razorpay_order_id)
      .neq('payment_status', 'paid');

    const { data: order, error } = await db
      .from('orders')
      .select(`id, ${PUBLIC_ORDER_FIELDS}`)
      .eq('razorpay_order_id', razorpay_order_id)
      .single();
    if (error || !order) return json({ error: 'order_not_found' }, 404);

    // Paid — send confirmations (only once, even if the webhook also fires).
    const { id, ...summary } = order;
    await notifyInBackground(db, id);
    return json({ order: summary });
  } catch (e) {
    console.error(e);
    return json({ error: 'server_error' }, 500);
  }
});
