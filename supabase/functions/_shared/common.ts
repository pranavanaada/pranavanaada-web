// Shared helpers for the checkout Edge Functions (Deno runtime).
import { createClient } from 'npm:@supabase/supabase-js@2';

export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

export function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

/** Service-role client: bypasses row-level security, so only use it server-side. */
export function adminClient() {
  return createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!, {
    auth: { persistSession: false },
  });
}

export function env(name: string) {
  const v = Deno.env.get(name);
  if (!v) throw new Error(`Missing secret ${name} — see README.md → Payments`);
  return v;
}

/** HMAC-SHA256 hex digest (Razorpay signatures). */
export async function hmacHex(secret: string, message: string) {
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const sig = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(message));
  return Array.from(new Uint8Array(sig))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

/** Constant-time string comparison, so signature checks don't leak timing. */
export function safeEqual(a: string, b: string) {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

/** Fields the customer's confirmation page is allowed to see. */
export const PUBLIC_ORDER_FIELDS =
  'order_number, customer_name, email, phone, address_line1, address_line2, landmark, city, state, pincode, delivery_from, preferred_delivery_date, items, subtotal, shipping_fee, total, payment_method, payment_status, status, created_at, access_token';
