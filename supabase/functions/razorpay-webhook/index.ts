// razorpay-webhook — Razorpay calls this directly (server to server) when a
// payment is captured or fails. It's the safety net for visitors who pay and
// then close the browser before the confirmation page loads.
// Deploy with --no-verify-jwt (Razorpay doesn't send a Supabase token); the
// X-Razorpay-Signature header is verified instead.
import { adminClient, env, hmacHex, safeEqual } from '../_shared/common.ts';
import { notifyOrder } from '../_shared/notify.ts';

Deno.serve(async (req) => {
  if (req.method !== 'POST') return new Response('Method not allowed', { status: 405 });

  const raw = await req.text();
  const signature = req.headers.get('x-razorpay-signature') ?? '';
  const expected = await hmacHex(env('RAZORPAY_WEBHOOK_SECRET'), raw);
  if (!safeEqual(expected, signature)) return new Response('Invalid signature', { status: 400 });

  const event = JSON.parse(raw);
  const payment = event?.payload?.payment?.entity;
  const rzpOrderId: string | undefined = payment?.order_id;
  if (!rzpOrderId) return new Response('ok'); // not an order payment — ignore

  const db = adminClient();
  const now = new Date().toISOString();

  if (event.event === 'payment.captured' || event.event === 'order.paid') {
    // Marks it paid and gives the order its PN number (no-op if already paid)
    const { error: paidError } = await db.rpc('mark_order_paid', { p_rzp_order_id: rzpOrderId, p_payment_id: payment.id });
    if (paidError) throw paidError;
    // Covers customers who paid but closed the page before verify-payment ran.
    const { data: paidOrder } = await db
      .from('orders')
      .select('id')
      .eq('razorpay_order_id', rzpOrderId)
      .eq('payment_status', 'paid')
      .maybeSingle();
    if (paidOrder) await notifyOrder(db, paidOrder.id);
  } else if (event.event === 'payment.failed') {
    // Only mark failed if it wasn't paid by a later retry.
    await db
      .from('orders')
      .update({ payment_status: 'failed', updated_at: now })
      .eq('razorpay_order_id', rzpOrderId)
      .eq('payment_status', 'pending');
  }

  return new Response('ok');
});
