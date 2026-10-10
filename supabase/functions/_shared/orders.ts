// Customer order page rules + the emails for dispatch, delivery, cancellation and returns.
import type { SupabaseClient } from 'npm:@supabase/supabase-js@2';
import { esc, optEnv, sendEmail, shell } from './notify.ts';

export const RETURN_WINDOW_DAYS = 3;
const IST_OFFSET_MS = 330 * 60 * 1000;
const DAY_MS = 24 * 60 * 60 * 1000;

// deno-lint-ignore no-explicit-any
export type Row = Record<string, any>;

export const siteUrl = () => (optEnv('SITE_URL') || 'https://www.pranavanaada.com').replace(/\/$/, '');
export const adminEmailTo = () => optEnv('ADMIN_EMAIL') || 'pranavanaadaa@gmail.com';
export const whatsappDisplay = () => optEnv('WHATSAPP_DISPLAY') || '+91 8050124365';
export const returnAddress = () =>
  optEnv('RETURN_ADDRESS') ||
  'Pranavanaada, 1006, Kalahasti Nagar, Prashanth Nagar, T. Dasarahalli, Bengaluru, Karnataka 560057. Phone: +91 8050124365';

export const orderLink = (o: Row) => `${siteUrl()}/order/${encodeURIComponent(o.order_number)}?t=${o.access_token}`;
export const inr = (n: number) => `₹${Number(n).toLocaleString('en-IN')}`;

/** Customers can cancel until the order is dispatched. */
export const canCancel = (o: Row) => o.status === 'placed' || o.status === 'confirmed';

/** Last moment to report a problem: end of the 3rd day after delivery (India time). */
export function returnDeadline(o: Row): Date | null {
  if (o.status !== 'delivered' || !o.delivered_at) return null;
  const india = new Date(Date.parse(o.delivered_at) + IST_OFFSET_MS);
  const endOfDay = Date.UTC(india.getUTCFullYear(), india.getUTCMonth(), india.getUTCDate() + RETURN_WINDOW_DAYS, 23, 59, 59);
  return new Date(endOfDay - IST_OFFSET_MS);
}
export const canReturn = (o: Row) => {
  const d = returnDeadline(o);
  return !!d && Date.now() <= d.getTime();
};

const fmtDate = (d: Date | string, kn = false) =>
  new Date(d).toLocaleDateString(kn ? 'kn-IN' : 'en-IN', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'Asia/Kolkata' });

const itemsList = (items: Row[]) =>
  items.map((i) => `${esc(i.name)}${i.variant ? ` · ${esc(i.variant)}` : ''} × ${i.qty}`).join('<br>');

const button = (href: string, label: string) =>
  `<p style="margin:22px 0 0;"><a href="${esc(href)}" style="background:#c9a24b;color:#0b2e28;text-decoration:none;padding:11px 20px;border-radius:6px;font-weight:bold;display:inline-block;">${esc(label)}</a></p>`;

const para = (text: string) => `<p style="margin:0 0 14px;line-height:1.6;color:#4a4332;">${text}</p>`;
const box = (inner: string) => `<div style="background:#faf6ea;border-radius:8px;padding:12px 16px;margin:6px 0 16px;font-size:14px;line-height:1.6;">${inner}</div>`;

// ---- Copy (customer emails in English or Kannada) -----------------------------

const T = {
  en: {
    hi: (n: string) => `Namaste ${n},`,
    view: 'View your order',
    questions: `Questions? Reply to this email or WhatsApp us on ${whatsappDisplay()}.`,
    shippedSubject: (n: string) => `Your order ${n} is on its way`,
    shipped: (n: string) => `Good news — your order <b>${esc(n)}</b> has been dispatched.`,
    tracking: 'Tracking',
    deliveredSubject: (n: string) => `Your order ${n} has been delivered`,
    delivered: (n: string) => `Your order <b>${esc(n)}</b> has been delivered. We hope its sound brings peace to your home.`,
    deliveredReturn: (d: string) =>
      `If anything arrived damaged or defective, report it with your unboxing video by <b>${esc(d)}</b> using "Report a problem" on your order page.`,
    cancelledSubject: (n: string) => `Your order ${n} has been cancelled`,
    cancelled: (n: string) => `Your order <b>${esc(n)}</b> has been cancelled.`,
    cancelRefund: (a: string) => `A refund of <b>${esc(a)}</b> has been started to your original payment method. It usually shows in 5–7 working days.`,
    cancelRefundLater: (a: string) => `Your refund of <b>${esc(a)}</b> will be sent to your original payment method shortly — we will email you when it is done.`,
    returnSubject: (n: string) => `We've received your request for order ${n}`,
    returnReceived: 'We have received your request and will review your unboxing video. We usually reply within 1–2 working days.',
    youAsked: (r: string) => `You asked for: <b>${r === 'refund' ? 'a refund' : 'a replacement'}</b>`,
    approvedSubject: (n: string) => `Your request for order ${n} is approved — please send the item back`,
    approved: 'Your request has been approved. Please send the item(s) back to:',
    approvedSteps:
      'Pack the item securely with all its parts (including the striker stick), put a note with your order number inside, and send it by a trackable courier. Return shipping is at your cost. Please reply with the courier tracking number once sent.',
    approvedNext: (r: string, a: string) =>
      r === 'refund'
        ? `Once it reaches us and we have checked it, we will refund <b>${esc(a)}</b>.`
        : 'Once it reaches us and we have checked it, we will send your replacement.',
    rejectedSubject: (n: string) => `About your request for order ${n}`,
    rejected: 'We are sorry — we could not approve your request.',
    reason: 'Reason',
    receivedSubject: (n: string) => `We've received your return for order ${n}`,
    received: 'Your returned item has reached us. We are checking it now and will update you shortly.',
    refundedSubject: (n: string) => `Refund sent for order ${n}`,
    refundedOnline: (a: string) => `We have refunded <b>${esc(a)}</b> to your original payment method. It usually shows in 5–7 working days.`,
    refundedManual: (a: string) => `We have sent your refund of <b>${esc(a)}</b>.`,
    reference: 'Reference',
    replacedSubject: (n: string) => `Your replacement for order ${n} is on its way`,
    replaced: 'Your replacement has been dispatched.',
  },
  kn: {
    hi: (n: string) => `ನಮಸ್ಕಾರ ${n},`,
    view: 'ನಿಮ್ಮ ಆರ್ಡರ್ ನೋಡಿ',
    questions: `ಪ್ರಶ್ನೆಗಳಿವೆಯೇ? ಈ ಇಮೇಲ್‌ಗೆ ಉತ್ತರಿಸಿ ಅಥವಾ ${whatsappDisplay()} ಗೆ WhatsApp ಮಾಡಿ.`,
    shippedSubject: (n: string) => `ನಿಮ್ಮ ಆರ್ಡರ್ ${n} ರವಾನೆಯಾಗಿದೆ`,
    shipped: (n: string) => `ಸಂತೋಷದ ಸುದ್ದಿ — ನಿಮ್ಮ ಆರ್ಡರ್ <b>${esc(n)}</b> ರವಾನೆಯಾಗಿದೆ.`,
    tracking: 'ಟ್ರ್ಯಾಕಿಂಗ್',
    deliveredSubject: (n: string) => `ನಿಮ್ಮ ಆರ್ಡರ್ ${n} ವಿತರಣೆಯಾಗಿದೆ`,
    delivered: (n: string) => `ನಿಮ್ಮ ಆರ್ಡರ್ <b>${esc(n)}</b> ವಿತರಣೆಯಾಗಿದೆ. ಅದರ ನಾದ ನಿಮ್ಮ ಮನೆಗೆ ಶಾಂತಿ ತರಲಿ.`,
    deliveredReturn: (d: string) =>
      `ಏನಾದರೂ ಹಾನಿಗೊಂಡು ಅಥವಾ ದೋಷದೊಂದಿಗೆ ತಲುಪಿದ್ದರೆ, <b>${esc(d)}</b> ರೊಳಗೆ ಅನ್‌ಬಾಕ್ಸಿಂಗ್ ವಿಡಿಯೋದೊಂದಿಗೆ ಆರ್ಡರ್ ಪುಟದಲ್ಲಿನ "ಸಮಸ್ಯೆ ತಿಳಿಸಿ" ಬಳಸಿ ತಿಳಿಸಿ.`,
    cancelledSubject: (n: string) => `ನಿಮ್ಮ ಆರ್ಡರ್ ${n} ರದ್ದಾಗಿದೆ`,
    cancelled: (n: string) => `ನಿಮ್ಮ ಆರ್ಡರ್ <b>${esc(n)}</b> ರದ್ದಾಗಿದೆ.`,
    cancelRefund: (a: string) => `<b>${esc(a)}</b> ಮರುಪಾವತಿಯನ್ನು ನಿಮ್ಮ ಮೂಲ ಪಾವತಿ ವಿಧಾನಕ್ಕೆ ಆರಂಭಿಸಲಾಗಿದೆ. ಸಾಮಾನ್ಯವಾಗಿ 5–7 ಕೆಲಸದ ದಿನಗಳಲ್ಲಿ ಕಾಣುತ್ತದೆ.`,
    cancelRefundLater: (a: string) => `<b>${esc(a)}</b> ಮರುಪಾವತಿಯನ್ನು ಶೀಘ್ರದಲ್ಲೇ ನಿಮ್ಮ ಮೂಲ ಪಾವತಿ ವಿಧಾನಕ್ಕೆ ಕಳುಹಿಸುತ್ತೇವೆ — ಆದಾಗ ಇಮೇಲ್ ಮಾಡುತ್ತೇವೆ.`,
    returnSubject: (n: string) => `ಆರ್ಡರ್ ${n} ಕುರಿತ ನಿಮ್ಮ ವಿನಂತಿ ತಲುಪಿದೆ`,
    returnReceived: 'ನಿಮ್ಮ ವಿನಂತಿ ತಲುಪಿದೆ, ಅನ್‌ಬಾಕ್ಸಿಂಗ್ ವಿಡಿಯೋ ಪರಿಶೀಲಿಸುತ್ತೇವೆ. ಸಾಮಾನ್ಯವಾಗಿ 1–2 ಕೆಲಸದ ದಿನಗಳಲ್ಲಿ ಉತ್ತರಿಸುತ್ತೇವೆ.',
    youAsked: (r: string) => `ನೀವು ಕೇಳಿರುವುದು: <b>${r === 'refund' ? 'ಮರುಪಾವತಿ' : 'ಬದಲಿ'}</b>`,
    approvedSubject: (n: string) => `ಆರ್ಡರ್ ${n} ಕುರಿತ ವಿನಂತಿ ಅನುಮೋದನೆಯಾಗಿದೆ — ವಸ್ತುವನ್ನು ಹಿಂದಕ್ಕೆ ಕಳುಹಿಸಿ`,
    approved: 'ನಿಮ್ಮ ವಿನಂತಿ ಅನುಮೋದನೆಯಾಗಿದೆ. ದಯವಿಟ್ಟು ವಸ್ತುವನ್ನು ಈ ವಿಳಾಸಕ್ಕೆ ಹಿಂದಕ್ಕೆ ಕಳುಹಿಸಿ:',
    approvedSteps:
      'ಎಲ್ಲಾ ಭಾಗಗಳೊಂದಿಗೆ (ಕೋಲು ಸೇರಿ) ಸುರಕ್ಷಿತವಾಗಿ ಪ್ಯಾಕ್ ಮಾಡಿ, ಆರ್ಡರ್ ಸಂಖ್ಯೆಯ ಚೀಟಿ ಒಳಗಿಟ್ಟು, ಟ್ರ್ಯಾಕ್ ಮಾಡಬಹುದಾದ ಕೊರಿಯರ್ ಮೂಲಕ ಕಳುಹಿಸಿ. ಹಿಂತಿರುಗಿಸುವ ಸಾಗಣೆ ವೆಚ್ಚ ನಿಮ್ಮದು. ಕಳುಹಿಸಿದ ನಂತರ ಟ್ರ್ಯಾಕಿಂಗ್ ಸಂಖ್ಯೆಯನ್ನು ಉತ್ತರವಾಗಿ ಕಳುಹಿಸಿ.',
    approvedNext: (r: string, a: string) =>
      r === 'refund'
        ? `ಅದು ನಮಗೆ ತಲುಪಿ ಪರಿಶೀಲಿಸಿದ ನಂತರ <b>${esc(a)}</b> ಮರುಪಾವತಿಸುತ್ತೇವೆ.`
        : 'ಅದು ನಮಗೆ ತಲುಪಿ ಪರಿಶೀಲಿಸಿದ ನಂತರ ಬದಲಿ ವಸ್ತುವನ್ನು ಕಳುಹಿಸುತ್ತೇವೆ.',
    rejectedSubject: (n: string) => `ಆರ್ಡರ್ ${n} ಕುರಿತ ನಿಮ್ಮ ವಿನಂತಿ`,
    rejected: 'ಕ್ಷಮಿಸಿ — ನಿಮ್ಮ ವಿನಂತಿಯನ್ನು ಅನುಮೋದಿಸಲು ಸಾಧ್ಯವಾಗಲಿಲ್ಲ.',
    reason: 'ಕಾರಣ',
    receivedSubject: (n: string) => `ಆರ್ಡರ್ ${n} ಹಿಂತಿರುಗಿಸಿದ ವಸ್ತು ತಲುಪಿದೆ`,
    received: 'ನೀವು ಹಿಂತಿರುಗಿಸಿದ ವಸ್ತು ನಮಗೆ ತಲುಪಿದೆ. ಈಗ ಪರಿಶೀಲಿಸುತ್ತಿದ್ದೇವೆ, ಶೀಘ್ರದಲ್ಲೇ ತಿಳಿಸುತ್ತೇವೆ.',
    refundedSubject: (n: string) => `ಆರ್ಡರ್ ${n} ಮರುಪಾವತಿ ಕಳುಹಿಸಲಾಗಿದೆ`,
    refundedOnline: (a: string) => `<b>${esc(a)}</b> ಅನ್ನು ನಿಮ್ಮ ಮೂಲ ಪಾವತಿ ವಿಧಾನಕ್ಕೆ ಮರುಪಾವತಿಸಲಾಗಿದೆ. ಸಾಮಾನ್ಯವಾಗಿ 5–7 ಕೆಲಸದ ದಿನಗಳಲ್ಲಿ ಕಾಣುತ್ತದೆ.`,
    refundedManual: (a: string) => `<b>${esc(a)}</b> ಮರುಪಾವತಿಯನ್ನು ಕಳುಹಿಸಲಾಗಿದೆ.`,
    reference: 'ಉಲ್ಲೇಖ',
    replacedSubject: (n: string) => `ಆರ್ಡರ್ ${n} ಬದಲಿ ವಸ್ತು ರವಾನೆಯಾಗಿದೆ`,
    replaced: 'ನಿಮ್ಮ ಬದಲಿ ವಸ್ತು ರವಾನೆಯಾಗಿದೆ.',
  },
};
const copy = (o: Row) => (o.language === 'kn' ? T.kn : T.en);

function customerMail(o: Row, subject: string, body: string) {
  const t = copy(o);
  const html = shell(`
    <p style="font-size:16px;margin:0 0 12px;">${esc(t.hi(o.customer_name))}</p>
    ${body}
    ${button(orderLink(o), t.view)}
    <p style="margin:24px 0 0;font-size:13px;color:#6b6250;">${esc(t.questions)}</p>
  `);
  return sendEmail(o.email, subject, html, adminEmailTo());
}

function adminMail(subject: string, body: string) {
  const html = shell(`${body}${button(`${siteUrl()}/admin/returns`, 'Open in admin panel')}`);
  return sendEmail(adminEmailTo(), subject, html);
}

/** Send and log, never throw — an email problem mustn't undo the action that triggered it. */
async function safe(label: string, task: () => Promise<unknown>) {
  try {
    await task();
  } catch (e) {
    console.error(`email "${label}" failed:`, e);
  }
}

// ---- Order events --------------------------------------------------------------

export function emailShipped(o: Row) {
  const t = copy(o);
  const tracking = [o.courier, o.tracking_number].filter(Boolean).join(' · ');
  return safe('shipped', () =>
    customerMail(o, t.shippedSubject(o.order_number), para(t.shipped(o.order_number)) + (tracking ? box(`${t.tracking}: <b>${esc(tracking)}</b>`) : ''))
  );
}

export function emailDelivered(o: Row) {
  const t = copy(o);
  const deadline = returnDeadline(o);
  return safe('delivered', () =>
    customerMail(
      o,
      t.deliveredSubject(o.order_number),
      para(t.delivered(o.order_number)) + (deadline ? para(t.deliveredReturn(fmtDate(deadline, o.language === 'kn'))) : '')
    )
  );
}

export function emailCancelled(o: Row, refund: 'started' | 'pending' | 'none', by: 'customer' | 'admin') {
  const t = copy(o);
  const amount = inr(o.total);
  const refundText = refund === 'started' ? para(t.cancelRefund(amount)) : refund === 'pending' ? para(t.cancelRefundLater(amount)) : '';
  return Promise.all([
    safe('cancelled (customer)', () => customerMail(o, t.cancelledSubject(o.order_number), para(t.cancelled(o.order_number)) + refundText)),
    by === 'customer'
      ? safe('cancelled (admin)', () =>
          adminMail(
            `❌ Order ${o.order_number} cancelled by the customer`,
            para(`<b>${esc(o.customer_name)}</b> (${esc(o.phone)}) cancelled order <b>${esc(o.order_number)}</b> — ${inr(o.total)}.`) +
              para(
                refund === 'started'
                  ? 'The online payment was refunded automatically through Razorpay.'
                  : refund === 'pending'
                    ? '<b style="color:#a33">The automatic refund did not go through — please refund it from the Razorpay dashboard and mark it refunded in the admin panel.</b>'
                    : 'Pay on delivery — nothing to refund.'
              ) +
              box(itemsList(o.items))
          )
        )
      : Promise.resolve(),
  ]);
}

// ---- Return events ---------------------------------------------------------------

export function emailReturnRequested(o: Row, r: Row) {
  const t = copy(o);
  return Promise.all([
    safe('return requested (customer)', () =>
      customerMail(o, t.returnSubject(o.order_number), para(t.returnReceived) + box(`${itemsList(r.items)}<br><br>${t.youAsked(r.resolution)}`))
    ),
    safe('return requested (admin)', () =>
      adminMail(
        `↩️ Return request for ${o.order_number} — ${r.reason === 'damaged' ? 'damaged' : 'defective'}, wants ${r.resolution}`,
        para(`<b>${esc(o.customer_name)}</b> (${esc(o.phone)}) reported a problem with order <b>${esc(o.order_number)}</b>.`) +
          box(
            `${itemsList(r.items)}<br><br>Reason: <b>${r.reason === 'damaged' ? 'Damaged in transit' : 'Defective'}</b><br>` +
              `Wants: <b>${r.resolution === 'refund' ? `Refund of ${inr(r.amount)}` : 'Replacement'}</b><br>` +
              `Paid: ${o.payment_method === 'online' ? 'online' : 'on delivery'}${r.refund_upi ? `<br>Refund to: ${esc(r.refund_upi)}` : ''}<br><br>` +
              `“${esc(r.details)}”` +
              (r.video_on_whatsapp ? '<br><br><b>Unboxing video: customer will send it on WhatsApp.</b>' : `<br><br>${r.media.length} file(s) attached — view them in the admin panel.`)
          )
      )
    ),
  ]);
}

export function emailReturnUpdate(o: Row, r: Row) {
  const t = copy(o);
  const n = o.order_number;
  const note = r.admin_note ? box(esc(r.admin_note)) : '';
  switch (r.status) {
    case 'approved':
      return safe('return approved', () =>
        customerMail(
          o,
          t.approvedSubject(n),
          para(t.approved) + box(`<b>${esc(returnAddress())}</b>`) + para(t.approvedSteps) + box(itemsList(r.items)) + para(t.approvedNext(r.resolution, inr(r.amount))) + note
        )
      );
    case 'rejected':
      return safe('return rejected', () =>
        customerMail(o, t.rejectedSubject(n), para(t.rejected) + (r.admin_note ? box(`${t.reason}: ${esc(r.admin_note)}`) : ''))
      );
    case 'received':
      return safe('return received', () => customerMail(o, t.receivedSubject(n), para(t.received)));
    case 'refunded':
      return safe('return refunded', () =>
        customerMail(
          o,
          t.refundedSubject(n),
          para(r.razorpay_refund_id ? t.refundedOnline(inr(r.amount)) : t.refundedManual(inr(r.amount))) +
            (r.razorpay_refund_id || r.admin_note ? box(`${t.reference}: ${esc(r.razorpay_refund_id || r.admin_note)}`) : '')
        )
      );
    case 'replaced':
      return safe('return replaced', () => customerMail(o, t.replacedSubject(n), para(t.replaced) + note));
    default:
      return Promise.resolve();
  }
}

/** Append a status change to a return's history. */
export const historyEntry = (status: string, note?: string | null) => ({ status, at: new Date().toISOString(), ...(note ? { note } : {}) });

/** Run after the response when the runtime supports it. */
export function inBackground(task: Promise<unknown>) {
  // deno-lint-ignore no-explicit-any
  const runtime = (globalThis as any).EdgeRuntime;
  if (runtime?.waitUntil) runtime.waitUntil(task);
  else return task;
}

export async function loadOrder(db: SupabaseClient, by: { id?: string; number?: string }) {
  const q = db.from('orders').select('*');
  const { data } = await (by.id ? q.eq('id', by.id) : q.eq('order_number', by.number ?? '')).maybeSingle();
  return data as Row | null;
}
