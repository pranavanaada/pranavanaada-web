// Order confirmations: email (Resend) + WhatsApp (Meta WhatsApp Cloud API),
// to both the customer and the admin. Each channel is skipped quietly until its
// secrets are set (see README → Order notifications), and every attempt is
// recorded in orders.notifications so the admin can see what went out.
import type { SupabaseClient } from 'npm:@supabase/supabase-js@2';

interface OrderItem {
  type: 'product' | 'combo';
  name: string;
  variant?: string | null;
  size?: string | null;
  includes?: string;
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
  preferred_delivery_date: string | null;
  notes: string | null;
  gstin: string | null;
  language: string | null;
  items: OrderItem[];
  subtotal: number;
  shipping_fee: number;
  total: number;
  payment_method: 'online' | 'cod';
  payment_status: string;
}

interface Attempt {
  channel: 'email' | 'whatsapp';
  to: 'customer' | 'admin';
  ok: boolean;
  detail: string;
  at: string;
}

export const optEnv = (name: string) => Deno.env.get(name)?.trim() || '';

const inr = (n: number) => `₹${Number(n).toLocaleString('en-IN')}`;

export const esc = (s: unknown) =>
  String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!);

const formatDate = (d: string | null) =>
  d ? new Date(`${d}T00:00:00`).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' }) : '—';

const itemText = (i: OrderItem) => `${i.name}${i.variant ? ` · ${i.variant}` : ''} × ${i.qty}`;

/** Indian mobile → 91XXXXXXXXXX (WhatsApp format). */
function waNumber(phone: string) {
  const d = phone.replace(/\D/g, '');
  if (d.length === 10) return `91${d}`;
  if (d.length === 12 && d.startsWith('91')) return d;
  if (d.length === 11 && d.startsWith('0')) return `91${d.slice(1)}`;
  return d;
}

// ---- Copy ------------------------------------------------------------------

const COPY = {
  en: {
    subject: (n: string) => `Your Pranavanaada order ${n} is confirmed`,
    greeting: (name: string) => `Namaste ${name},`,
    intro: 'Thank you for your order. Each bell is made and tuned with care — we will call or WhatsApp you to confirm the delivery date.',
    orderNumber: 'Order number',
    payment: 'Payment',
    paidOnline: 'Paid online ✓',
    cod: (amount: string) => `Pay ${amount} on delivery (cash or UPI)`,
    deliverTo: 'Delivering to',
    preferred: 'Preferred delivery date',
    subtotal: 'Subtotal',
    delivery: 'Delivery',
    free: 'Free',
    total: 'Total',
    questions: 'Questions? Reply to this email or WhatsApp us on',
  },
  kn: {
    subject: (n: string) => `ನಿಮ್ಮ ಪ್ರಣವನಾದ ಆರ್ಡರ್ ${n} ಖಚಿತವಾಗಿದೆ`,
    greeting: (name: string) => `ನಮಸ್ಕಾರ ${name},`,
    intro: 'ನಿಮ್ಮ ಆರ್ಡರ್‌ಗೆ ಧನ್ಯವಾದಗಳು. ಪ್ರತಿ ಘಂಟೆಯನ್ನು ಶ್ರದ್ಧೆಯಿಂದ ತಯಾರಿಸಲಾಗುತ್ತದೆ — ವಿತರಣಾ ದಿನಾಂಕ ಖಚಿತಪಡಿಸಲು ನಾವು ನಿಮಗೆ ಕರೆ ಅಥವಾ WhatsApp ಮಾಡುತ್ತೇವೆ.',
    orderNumber: 'ಆರ್ಡರ್ ಸಂಖ್ಯೆ',
    payment: 'ಪಾವತಿ',
    paidOnline: 'ಆನ್‌ಲೈನ್ ಪಾವತಿ ಸ್ವೀಕರಿಸಲಾಗಿದೆ ✓',
    cod: (amount: string) => `ವಿತರಣೆಯ ಸಮಯದಲ್ಲಿ ${amount} ಪಾವತಿಸಿ (ನಗದು ಅಥವಾ UPI)`,
    deliverTo: 'ವಿತರಣಾ ವಿಳಾಸ',
    preferred: 'ನಿಮಗೆ ಬೇಕಾದ ವಿತರಣಾ ದಿನಾಂಕ',
    subtotal: 'ಉಪಮೊತ್ತ',
    delivery: 'ವಿತರಣಾ ಶುಲ್ಕ',
    free: 'ಉಚಿತ',
    total: 'ಒಟ್ಟು',
    questions: 'ಪ್ರಶ್ನೆಗಳಿವೆಯೇ? ಈ ಇಮೇಲ್‌ಗೆ ಉತ್ತರಿಸಿ ಅಥವಾ WhatsApp ಮಾಡಿ:',
  },
};

// ---- Email HTML (inline styles — email clients ignore <style> tags) ----------

function itemsTable(o: Order, t: (typeof COPY)['en']) {
  const rows = o.items
    .map(
      (i) => `<tr>
        <td style="padding:8px 0;border-bottom:1px solid #eee4cf;">
          ${esc(i.name)}${i.variant ? ` <span style="color:#8a7a55;">· ${esc(i.variant)}</span>` : ''}
          ${i.includes ? `<div style="font-size:12px;color:#8a7a55;">${esc(i.includes)}</div>` : ''}
          <div style="font-size:12px;color:#8a7a55;">${inr(i.unit_price)} × ${i.qty}</div>
        </td>
        <td style="padding:8px 0;border-bottom:1px solid #eee4cf;text-align:right;white-space:nowrap;">${inr(i.line_total)}</td>
      </tr>`
    )
    .join('');
  return `<table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;font-size:14px;">
    ${rows}
    <tr><td style="padding:6px 0;color:#6b6250;">${t.subtotal}</td><td style="text-align:right;">${inr(o.subtotal)}</td></tr>
    <tr><td style="padding:2px 0;color:#6b6250;">${t.delivery}</td><td style="text-align:right;">${o.shipping_fee ? inr(o.shipping_fee) : t.free}</td></tr>
    <tr><td style="padding:8px 0;font-weight:bold;font-size:16px;">${t.total}</td><td style="text-align:right;font-weight:bold;font-size:16px;color:#8a6a22;">${inr(o.total)}</td></tr>
  </table>`;
}

function addressHtml(o: Order) {
  return [
    esc(o.customer_name),
    esc(o.address_line1) + (o.address_line2 ? `, ${esc(o.address_line2)}` : ''),
    o.landmark ? esc(o.landmark) : '',
    `${esc(o.city)}, ${esc(o.state)} – ${esc(o.pincode)}`,
    esc(o.phone),
  ]
    .filter(Boolean)
    .join('<br>');
}

export function shell(inner: string) {
  return `<!doctype html><html><body style="margin:0;background:#f4efe3;font-family:Arial,Helvetica,sans-serif;color:#2b2618;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4efe3;padding:24px 12px;"><tr><td align="center">
    <table width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border-radius:12px;overflow:hidden;">
      <tr><td style="background:#0b2e28;padding:20px 24px;color:#c9a24b;font-size:22px;font-family:Georgia,serif;letter-spacing:1px;">Pranavanaada</td></tr>
      <tr><td style="padding:24px;">${inner}</td></tr>
    </table>
  </td></tr></table></body></html>`;
}

function customerEmail(o: Order, whatsappDisplay: string) {
  const t = o.language === 'kn' ? COPY.kn : COPY.en;
  const paid = o.payment_status === 'paid';
  const html = shell(`
    <p style="font-size:16px;margin:0 0 12px;">${esc(t.greeting(o.customer_name))}</p>
    <p style="margin:0 0 20px;line-height:1.6;color:#4a4332;">${esc(t.intro)}</p>
    <table width="100%" style="background:#faf6ea;border-radius:8px;padding:12px 16px;margin-bottom:20px;font-size:14px;">
      <tr><td style="color:#6b6250;">${t.orderNumber}</td><td style="text-align:right;font-weight:bold;">${esc(o.order_number)}</td></tr>
      <tr><td style="color:#6b6250;padding-top:6px;">${t.payment}</td><td style="text-align:right;padding-top:6px;">${esc(paid ? t.paidOnline : t.cod(inr(o.total)))}</td></tr>
    </table>
    ${itemsTable(o, t)}
    <table width="100%" style="margin-top:20px;font-size:14px;line-height:1.6;">
      <tr>
        <td valign="top" style="padding-right:12px;"><div style="color:#6b6250;font-size:12px;">${t.deliverTo}</div>${addressHtml(o)}</td>
        <td valign="top"><div style="color:#6b6250;font-size:12px;">${t.preferred}</div>${esc(formatDate(o.preferred_delivery_date))}</td>
      </tr>
    </table>
    <p style="margin:24px 0 0;font-size:13px;color:#6b6250;">${esc(t.questions)} ${esc(whatsappDisplay)}</p>
  `);
  return { subject: t.subject(o.order_number), html };
}

function adminEmail(o: Order, siteUrl: string) {
  const paid = o.payment_status === 'paid';
  const html = shell(`
    <p style="font-size:18px;margin:0 0 4px;font-weight:bold;">New order ${esc(o.order_number)} — ${inr(o.total)}</p>
    <p style="margin:0 0 16px;color:${paid ? '#2f7a3a' : '#8a6a22'};font-weight:bold;">
      ${paid ? 'PAID ONLINE' : 'PAY ON DELIVERY — collect ' + inr(o.total)}
    </p>
    ${itemsTable(o, COPY.en)}
    <table width="100%" style="margin-top:20px;font-size:14px;line-height:1.6;">
      <tr><td valign="top">
        <div style="color:#6b6250;font-size:12px;">Customer</div>
        ${esc(o.customer_name)}<br>
        <a href="tel:${esc(o.phone)}">${esc(o.phone)}</a>${o.alt_phone ? ` / ${esc(o.alt_phone)}` : ''}<br>
        <a href="mailto:${esc(o.email)}">${esc(o.email)}</a>
        ${o.gstin ? `<br>GSTIN: ${esc(o.gstin)}` : ''}
      </td></tr>
      <tr><td valign="top" style="padding-top:12px;"><div style="color:#6b6250;font-size:12px;">Deliver to</div>${addressHtml(o)}</td></tr>
      <tr><td style="padding-top:12px;"><div style="color:#6b6250;font-size:12px;">Preferred delivery</div>${esc(formatDate(o.preferred_delivery_date))}</td></tr>
      ${o.notes ? `<tr><td style="padding-top:12px;"><div style="color:#6b6250;font-size:12px;">Customer note</div>${esc(o.notes)}</td></tr>` : ''}
      ${o.language === 'kn' ? `<tr><td style="padding-top:12px;color:#6b6250;font-size:12px;">Customer used the Kannada site</td></tr>` : ''}
    </table>
    <p style="margin:24px 0 0;">
      <a href="${esc(siteUrl)}/admin/orders" style="background:#c9a24b;color:#0b2e28;text-decoration:none;padding:10px 18px;border-radius:6px;font-weight:bold;">Open in admin panel</a>
      &nbsp;
      <a href="https://wa.me/${waNumber(o.phone)}" style="color:#25D366;">WhatsApp customer</a>
    </p>
  `);
  return { subject: `🔔 New order ${o.order_number} — ${inr(o.total)} (${paid ? 'paid' : 'COD'})`, html };
}

// ---- Senders -----------------------------------------------------------------

export async function sendEmail(to: string, subject: string, html: string, replyTo?: string): Promise<string> {
  const key = optEnv('RESEND_API_KEY');
  const from = optEnv('EMAIL_FROM');
  if (!key || !from) throw new Skip('email not configured');
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ from, to: [to], subject, html, ...(replyTo ? { reply_to: replyTo } : {}) }),
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(body?.message ?? `Resend HTTP ${res.status}`);
  return `sent (${body?.id ?? 'ok'})`;
}

/**
 * WhatsApp business-initiated messages must use a template approved by Meta.
 * Templates and their {{1}}… placeholders are documented in README.md.
 */
async function sendWhatsAppTemplate(to: string, template: string, lang: string, params: string[]): Promise<string> {
  const token = optEnv('WHATSAPP_TOKEN');
  const phoneId = optEnv('WHATSAPP_PHONE_NUMBER_ID');
  if (!token || !phoneId || !template) throw new Skip('WhatsApp not configured');
  const res = await fetch(`https://graph.facebook.com/v21.0/${phoneId}/messages`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      messaging_product: 'whatsapp',
      to: waNumber(to),
      type: 'template',
      template: {
        name: template,
        language: { code: lang },
        components: [
          {
            type: 'body',
            // Template variables may not contain newlines or tabs.
            parameters: params.map((text) => ({ type: 'text', text: text.replace(/\s+/g, ' ').slice(0, 900) })),
          },
        ],
      },
    }),
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(body?.error?.message ?? `WhatsApp HTTP ${res.status}`);
  return `sent (${body?.messages?.[0]?.id ?? 'ok'})`;
}

export class Skip extends Error {}

// ---- Entry point ------------------------------------------------------------

/**
 * Send confirmations for an order exactly once. Safe to call from several
 * places (COD placement, payment verification, webhook): the first caller to
 * set notified_at wins, the rest do nothing.
 */
export async function notifyOrder(db: SupabaseClient, orderId: string) {
  const { data: claimed } = await db
    .from('orders')
    .update({ notified_at: new Date().toISOString() })
    .eq('id', orderId)
    .is('notified_at', null)
    .select('*')
    .maybeSingle();
  if (!claimed) return; // already notified (or order missing)
  const o = claimed as Order;

  const adminEmailTo = optEnv('ADMIN_EMAIL') || 'pranavanaadaa@gmail.com';
  const adminWhatsApp = optEnv('WHATSAPP_ADMIN_NUMBER') || '918050124365';
  const whatsappDisplay = optEnv('WHATSAPP_DISPLAY') || '+91 8050124365';
  const siteUrl = (optEnv('SITE_URL') || 'https://pranavanaada.com').replace(/\/$/, '');
  const paid = o.payment_status === 'paid';
  const summary = o.items.map(itemText).join(', ');
  const paymentText = paid ? 'Paid online' : `Pay on delivery ${inr(o.total)}`;
  const kn = o.language === 'kn';

  const jobs: [Attempt['channel'], Attempt['to'], () => Promise<string>][] = [
    ['email', 'customer', () => {
      const m = customerEmail(o, whatsappDisplay);
      return sendEmail(o.email, m.subject, m.html, adminEmailTo);
    }],
    ['email', 'admin', () => {
      const m = adminEmail(o, siteUrl);
      return sendEmail(adminEmailTo, m.subject, m.html, o.email);
    }],
    // order_confirmation: Namaste {{1}}, … order {{2}} … Items: {{3}}. Total {{4}} ({{5}}). … delivery date {{6}} …
    ['whatsapp', 'customer', () =>
      sendWhatsAppTemplate(
        o.phone,
        optEnv('WHATSAPP_TEMPLATE_CUSTOMER') || 'order_confirmation',
        kn ? optEnv('WHATSAPP_LANG_KN') || 'kn' : optEnv('WHATSAPP_LANG_EN') || 'en',
        [o.customer_name, o.order_number, summary, inr(o.total), paymentText, formatDate(o.preferred_delivery_date)]
      )],
    // new_order_alert: New order {{1}} from {{2}} ({{3}}). Items: {{4}}. Total {{5}} – {{6}}. Deliver to {{7}}.
    ['whatsapp', 'admin', () =>
      sendWhatsAppTemplate(
        adminWhatsApp,
        optEnv('WHATSAPP_TEMPLATE_ADMIN') || 'new_order_alert',
        optEnv('WHATSAPP_LANG_EN') || 'en',
        [
          o.order_number,
          o.customer_name,
          o.phone,
          summary,
          inr(o.total),
          paymentText,
          `${o.city}, ${o.state} ${o.pincode}`,
        ]
      )],
  ];

  const attempts: Attempt[] = await Promise.all(
    jobs.map(async ([channel, to, run]) => {
      try {
        return { channel, to, ok: true, detail: await run(), at: new Date().toISOString() };
      } catch (e) {
        const skipped = e instanceof Skip;
        if (!skipped) console.error(`${channel} → ${to} failed for ${o.order_number}:`, e);
        return {
          channel,
          to,
          ok: false,
          detail: skipped ? `skipped: ${(e as Error).message}` : `failed: ${e instanceof Error ? e.message : String(e)}`,
          at: new Date().toISOString(),
        };
      }
    })
  );

  await db.from('orders').update({ notifications: attempts }).eq('id', o.id);
}

/** Run notifications after the response is sent when the runtime supports it. */
export function notifyInBackground(db: SupabaseClient, orderId: string) {
  const task = notifyOrder(db, orderId).catch((e) => console.error('notifyOrder failed', e));
  // deno-lint-ignore no-explicit-any
  const runtime = (globalThis as any).EdgeRuntime;
  if (runtime?.waitUntil) runtime.waitUntil(task);
  else return task;
}
