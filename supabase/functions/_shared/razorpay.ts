// Razorpay refunds (server only — uses the secret key).
import { env } from './common.ts';

/** Refund (part of) a captured payment to the customer's original payment method. Returns the refund id. */
export async function refundPayment(paymentId: string, amountRupees: number, notes: Record<string, string>) {
  const auth = btoa(`${env('RAZORPAY_KEY_ID')}:${env('RAZORPAY_KEY_SECRET')}`);
  const res = await fetch(`https://api.razorpay.com/v1/payments/${encodeURIComponent(paymentId)}/refund`, {
    method: 'POST',
    headers: { Authorization: `Basic ${auth}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ amount: Math.round(amountRupees * 100), speed: 'normal', notes }),
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok || !body?.id) throw new Error(body?.error?.description ?? `Razorpay refund failed (HTTP ${res.status})`);
  return String(body.id);
}
