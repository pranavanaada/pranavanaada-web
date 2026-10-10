import type { CartItem } from '../hooks/useCart';
import { isSupabaseConfigured } from './supabaseConfig';

export interface StoreSettings {
  cod_enabled: boolean;
  cod_max_total: number;
  online_enabled: boolean;
  shipping_fee: number;
  free_shipping_above: number;
  min_delivery_days: number;
}

export const DEFAULT_SETTINGS: StoreSettings = {
  cod_enabled: true,
  cod_max_total: 25000,
  online_enabled: true,
  shipping_fee: 0,
  free_shipping_above: 0,
  min_delivery_days: 7,
};

export interface CheckoutCustomer {
  name: string;
  email: string;
  phone: string;
  altPhone: string;
  address1: string;
  address2: string;
  landmark: string;
  city: string;
  state: string;
  pincode: string;
  addressType: string;
  notes: string;
  gstin: string;
}

export type PaymentMethod = 'online' | 'cod';

/** What the confirmation page shows (returned by the Edge Functions). */
export interface PlacedOrder {
  order_number: string;
  customer_name: string;
  email: string;
  phone: string;
  address_line1: string;
  address_line2?: string | null;
  landmark?: string | null;
  city: string;
  state: string;
  pincode: string;
  /** Private link token for the customer's order page (/order/PN-…?t=…) */
  access_token?: string;
  /** Expected delivery window (set by the server from the address) */
  delivery_from?: string | null;
  preferred_delivery_date?: string | null;
  items: {
    type: 'product' | 'combo';
    name: string;
    variant?: string | null;
    includes?: string;
    image?: string;
    unit_price: number;
    qty: number;
    line_total: number;
  }[];
  subtotal: number;
  shipping_fee: number;
  total: number;
  payment_method: PaymentMethod;
  payment_status: string;
  status: string;
  created_at: string;
}

export const INDIAN_STATES = [
  'Andaman and Nicobar Islands', 'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chandigarh',
  'Chhattisgarh', 'Dadra and Nagar Haveli and Daman and Diu', 'Delhi', 'Goa', 'Gujarat', 'Haryana',
  'Himachal Pradesh', 'Jammu and Kashmir', 'Jharkhand', 'Karnataka', 'Kerala', 'Ladakh', 'Lakshadweep',
  'Madhya Pradesh', 'Maharashtra', 'Manipur', 'Meghalaya', 'Mizoram', 'Nagaland', 'Odisha', 'Puducherry',
  'Punjab', 'Rajasthan', 'Sikkim', 'Tamil Nadu', 'Telangana', 'Tripura', 'Uttar Pradesh', 'Uttarakhand',
  'West Bengal',
];

/** Delivery charge for a subtotal under the current settings. */
export function shippingFor(subtotal: number, s: StoreSettings) {
  return s.free_shipping_above > 0 && subtotal >= s.free_shipping_above ? 0 : s.shipping_fee;
}

/** Earliest allowed delivery date as YYYY-MM-DD (local time). */
export function earliestDeliveryDate(days: number) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

/** Cart → what the server needs to re-price the order (ids, weights, quantities only — never prices). */
export function toOrderLines(items: CartItem[]) {
  return items.map((i) =>
    i.key.startsWith('combo::')
      ? { type: 'combo' as const, combo_id: i.id, qty: i.qty }
      : { type: 'product' as const, product_id: i.id, variant: i.variant ?? '', qty: i.qty }
  );
}

export async function fetchStoreSettings(): Promise<StoreSettings> {
  if (!isSupabaseConfigured) return DEFAULT_SETTINGS;
  const { supabase } = await import('./supabaseClient');
  const { data } = await supabase.from('store_settings').select('*').eq('id', 1).maybeSingle();
  if (!data) return DEFAULT_SETTINGS;
  return {
    cod_enabled: !!data.cod_enabled,
    cod_max_total: Number(data.cod_max_total) || 0,
    online_enabled: !!data.online_enabled,
    shipping_fee: Number(data.shipping_fee) || 0,
    free_shipping_above: Number(data.free_shipping_above) || 0,
    min_delivery_days: Number(data.min_delivery_days) || 0,
  };
}

export class CheckoutError extends Error {
  constructor(
    public code: string,
    public details: Record<string, unknown> = {}
  ) {
    super(code);
  }
}

/** Call a checkout Edge Function; turns its error responses into CheckoutError. */
async function callFunction<T>(name: string, body: Record<string, unknown>): Promise<T> {
  if (!isSupabaseConfigured) throw new CheckoutError('not_setup');
  const { supabase } = await import('./supabaseClient');
  const { data, error } = await supabase.functions.invoke(name, { body });
  if (error) {
    // Non-2xx: the function's JSON body is on error.context (a Response).
    let payload: Record<string, unknown> = {};
    try {
      payload = await (error as { context?: Response }).context?.json();
    } catch {
      // Function not deployed / network error
      throw new CheckoutError('not_setup');
    }
    throw new CheckoutError(String(payload?.error ?? 'server_error'), payload ?? {});
  }
  return data as T;
}

export function createOrder(payload: {
  items: ReturnType<typeof toOrderLines>;
  /** deliveryBy: the expected date shown to the customer (the server keeps it if still valid) */
  customer: CheckoutCustomer & { language: string; deliveryBy: string };
  paymentMethod: PaymentMethod;
}) {
  return callFunction<{
    order?: PlacedOrder;
    order_number?: string;
    razorpay?: { key: string; order_id: string; amount: number; currency: string };
  }>('create-order', payload);
}

export function verifyPayment(payload: {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
}) {
  return callFunction<{ order: PlacedOrder }>('verify-payment', payload);
}

// ---- Razorpay Checkout (their hosted payment window) -----------------------

interface RazorpayResponse {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
}

interface RazorpayInstance {
  open: () => void;
  on: (event: 'payment.failed', cb: (res: { error?: { description?: string } }) => void) => void;
}

declare global {
  interface Window {
    Razorpay?: new (options: Record<string, unknown>) => RazorpayInstance;
  }
}

let scriptPromise: Promise<void> | null = null;

/** Load Razorpay's checkout script only when someone actually pays. */
export function loadRazorpay() {
  if (window.Razorpay) return Promise.resolve();
  scriptPromise ??= new Promise<void>((resolve, reject) => {
    const s = document.createElement('script');
    s.src = 'https://checkout.razorpay.com/v1/checkout.js';
    s.onload = () => resolve();
    s.onerror = () => {
      scriptPromise = null;
      reject(new CheckoutError('razorpay_load_failed'));
    };
    document.body.appendChild(s);
  });
  return scriptPromise;
}

/** Open the Razorpay payment window; resolves with the signed response, rejects on cancel/failure. */
export function openRazorpay(opts: {
  key: string;
  orderId: string;
  amount: number;
  customer: CheckoutCustomer;
  orderNumber: string;
}) {
  return new Promise<RazorpayResponse>((resolve, reject) => {
    if (!window.Razorpay) return reject(new CheckoutError('razorpay_load_failed'));
    const rzp = new window.Razorpay({
      key: opts.key,
      order_id: opts.orderId,
      amount: opts.amount,
      currency: 'INR',
      name: 'Pranavanaada',
      description: `Order ${opts.orderNumber}`,
      prefill: { name: opts.customer.name, email: opts.customer.email, contact: opts.customer.phone },
      notes: { order_number: opts.orderNumber },
      theme: { color: '#c9a24b' },
      handler: (res: RazorpayResponse) => resolve(res),
      modal: { ondismiss: () => reject(new CheckoutError('payment_cancelled')) },
    });
    rzp.on('payment.failed', (res) =>
      reject(new CheckoutError('payment_failed', { reason: res.error?.description ?? '' }))
    );
    rzp.open();
  });
}

// ---- Remember the customer's details for next time (this browser only) ------

const DETAILS_KEY = 'pranavanaada-checkout-details';
const LAST_ORDER_KEY = 'pranavanaada-last-order';

export function loadSavedDetails(): Partial<CheckoutCustomer> {
  try {
    return JSON.parse(localStorage.getItem(DETAILS_KEY) || '{}');
  } catch {
    return {};
  }
}

export function saveDetails(c: CheckoutCustomer) {
  try {
    // Notes are per-order, so they aren't remembered.
    const { notes: _n, ...keep } = c;
    localStorage.setItem(DETAILS_KEY, JSON.stringify(keep));
  } catch {
    // ignore
  }
}

export function rememberOrder(order: PlacedOrder) {
  try {
    sessionStorage.setItem(LAST_ORDER_KEY, JSON.stringify(order));
  } catch {
    // ignore
  }
}

export function recallOrder(): PlacedOrder | null {
  try {
    return JSON.parse(sessionStorage.getItem(LAST_ORDER_KEY) || 'null');
  } catch {
    return null;
  }
}
