// The customer's order page talks to the order-portal Edge Function with plain fetch
// (no Supabase SDK needed). The private token from the email link authorises each call.
import { supabaseAnonKey, supabaseUrl } from './supabaseConfig';

export interface PortalItem {
  name: string;
  variant?: string | null;
  includes?: string;
  unit_price: number;
  qty: number;
  line_total: number;
  image?: string;
}

export interface PortalOrder {
  order_number: string;
  customer_name: string;
  phone: string;
  email: string;
  address_line1: string;
  address_line2: string | null;
  landmark: string | null;
  city: string;
  state: string;
  pincode: string;
  items: PortalItem[];
  subtotal: number;
  shipping_fee: number;
  total: number;
  payment_method: 'online' | 'cod';
  payment_status: string;
  status: 'awaiting_payment' | 'placed' | 'confirmed' | 'shipped' | 'delivered' | 'cancelled';
  created_at: string;
  delivery_from: string | null;
  preferred_delivery_date: string | null;
  shipped_at: string | null;
  delivered_at: string | null;
  cancelled_at: string | null;
  courier: string | null;
  tracking_number: string | null;
  return_until: string | null;
  can_cancel: boolean;
  can_return: boolean;
}

export interface PortalReturn {
  id: string;
  created_at: string;
  items: { index: number; name: string; variant: string | null; qty: number; unit_price: number }[];
  reason: 'damaged' | 'defective';
  resolution: 'refund' | 'replacement';
  amount: number;
  status: 'requested' | 'approved' | 'rejected' | 'received' | 'refunded' | 'replaced';
  note: string | null;
}

export interface PortalView {
  order: PortalOrder;
  returns: PortalReturn[];
  refund?: 'started' | 'pending' | 'none';
}

export class PortalError extends Error {
  constructor(public code: string, public fields: string[] = []) {
    super(code);
  }
}

async function call<T>(body: Record<string, unknown>): Promise<T> {
  let res: Response;
  try {
    res = await fetch(`${supabaseUrl}/functions/v1/order-portal`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', apikey: supabaseAnonKey, Authorization: `Bearer ${supabaseAnonKey}` },
      body: JSON.stringify(body),
    });
  } catch {
    throw new PortalError('network');
  }
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new PortalError(String(data?.error ?? 'server_error'), data?.fields ?? []);
  return data as T;
}

export const getOrder = (number: string, token: string) => call<PortalView>({ action: 'get', number, token });
export const cancelOrder = (number: string, token: string) => call<PortalView>({ action: 'cancel', number, token });

export interface ReturnForm {
  items: { index: number; qty: number }[];
  reason: 'damaged' | 'defective';
  resolution: 'refund' | 'replacement';
  details: string;
  refundUpi: string;
  videoOnWhatsApp: boolean;
}

/** Upload the files (reporting overall progress 0–1), then send the request. */
export async function requestReturn(number: string, token: string, form: ReturnForm, files: File[], onProgress: (p: number) => void) {
  let media: string[] = [];
  if (files.length) {
    const { uploads } = await call<{ uploads: { path: string; url: string }[] }>({
      action: 'upload-urls',
      number,
      token,
      files: files.map((f) => ({ type: f.type, size: f.size })),
    });
    const total = files.reduce((t, f) => t + f.size, 0);
    const done = new Array(files.length).fill(0);
    await Promise.all(
      files.map((file, i) =>
        uploadFile(uploads[i].url, file, (loaded) => {
          done[i] = loaded;
          onProgress(done.reduce((a, b) => a + b, 0) / total);
        })
      )
    );
    media = uploads.map((u) => u.path);
  }
  return call<PortalView>({ action: 'request-return', number, token, ...form, media });
}

/** PUT to a one-time signed upload link (the same request supabase-js makes), with progress. */
function uploadFile(url: string, file: File, onLoaded: (bytes: number) => void) {
  return new Promise<void>((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('PUT', url);
    xhr.setRequestHeader('x-upsert', 'false');
    xhr.upload.onprogress = (e) => e.lengthComputable && onLoaded(e.loaded);
    xhr.onload = () => (xhr.status >= 200 && xhr.status < 300 ? (onLoaded(file.size), resolve()) : reject(new PortalError('upload_failed')));
    xhr.onerror = () => reject(new PortalError('upload_failed'));
    const body = new FormData();
    body.append('cacheControl', '3600');
    body.append('', file);
    xhr.send(body);
  });
}
