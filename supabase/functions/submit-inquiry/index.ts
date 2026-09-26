// submit-inquiry — saves an enquiry (Enquire Now, enquiry list, Contact form)
// and emails the admin straight away. If the customer gave an email address,
// they also get a short acknowledgement (in Kannada if they used that site).
import { adminClient, corsHeaders, json } from '../_shared/common.ts';
import { esc, optEnv, sendEmail, shell } from '../_shared/notify.ts';

const clean = (v: unknown, max: number) => (typeof v === 'string' ? v.trim().slice(0, max) : '');
const isEmail = (s: string) => /^\S+@\S+\.\S+$/.test(s);
const phoneDigits = (s: string) => s.replace(/\D/g, '');

function waLink(contact: string) {
  const d = phoneDigits(contact);
  const n = d.length === 10 ? `91${d}` : d.length === 12 && d.startsWith('91') ? d : '';
  return n ? `https://wa.me/${n}` : '';
}

const ACK = {
  en: {
    subject: 'We have received your enquiry — Pranavanaada',
    body: (name: string) =>
      `Namaste ${name},<br><br>Thank you for your enquiry. We have received it and will get back to you shortly.`,
    yours: 'Your enquiry',
  },
  kn: {
    subject: 'ನಿಮ್ಮ ವಿಚಾರಣೆ ನಮಗೆ ತಲುಪಿದೆ — ಪ್ರಣವನಾದ',
    body: (name: string) =>
      `ನಮಸ್ಕಾರ ${name},<br><br>ನಿಮ್ಮ ವಿಚಾರಣೆಗೆ ಧನ್ಯವಾದಗಳು. ಅದು ನಮಗೆ ತಲುಪಿದೆ, ಶೀಘ್ರದಲ್ಲೇ ನಿಮ್ಮನ್ನು ಸಂಪರ್ಕಿಸುತ್ತೇವೆ.`,
    yours: 'ನಿಮ್ಮ ವಿಚಾರಣೆ',
  },
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405);

  try {
    const body = await req.json();

    // Spam trap: a hidden field real visitors never see. Bots that fill it get a
    // normal-looking success so they don't retry, but nothing is saved or sent.
    if (clean(body.website, 200)) return json({ ok: true });

    const name = clean(body.name, 100);
    const contact = clean(body.contact, 150);
    const message = clean(body.message, 4000);
    const productName = clean(body.productName, 500) || null;
    const language = body.language === 'kn' ? 'kn' : 'en';
    if (name.length < 2 || contact.length < 5) return json({ error: 'invalid_details' }, 400);
    // Links are a strong spam signal on a bell shop's enquiry form.
    if ((message.match(/https?:\/\//g) ?? []).length > 2) return json({ ok: true });

    const db = adminClient();
    const { error } = await db.from('inquiries').insert({ name, contact, message, product_name: productName, status: 'new' });
    if (error) throw error;

    const adminTo = optEnv('ADMIN_EMAIL') || 'pranavanaadaa@gmail.com';
    const siteUrl = (optEnv('SITE_URL') || 'https://pranavanaada.com').replace(/\/$/, '');
    const customerEmail = isEmail(contact) ? contact : '';
    const wa = waLink(contact);

    const adminHtml = shell(`
      <p style="font-size:18px;margin:0 0 12px;font-weight:bold;">New enquiry from ${esc(name)}</p>
      ${productName ? `<p style="margin:0 0 12px;"><span style="color:#6b6250;font-size:12px;">About</span><br>${esc(productName)}</p>` : ''}
      <p style="margin:0 0 12px;"><span style="color:#6b6250;font-size:12px;">Contact</span><br>${esc(contact)}</p>
      ${message ? `<div style="background:#faf6ea;border-radius:8px;padding:12px 16px;white-space:pre-line;line-height:1.6;">${esc(message)}</div>` : ''}
      ${language === 'kn' ? `<p style="color:#6b6250;font-size:12px;margin:12px 0 0;">Sent from the Kannada site</p>` : ''}
      <p style="margin:24px 0 0;">
        ${wa ? `<a href="${wa}" style="background:#25D366;color:#fff;text-decoration:none;padding:10px 18px;border-radius:6px;font-weight:bold;">Reply on WhatsApp</a> &nbsp;` : ''}
        ${customerEmail ? `<span style="color:#6b6250;font-size:13px;">or just reply to this email</span> &nbsp;` : ''}
        <a href="${esc(siteUrl)}/admin/inquiries" style="color:#8a6a22;">Open in admin panel</a>
      </p>`);

    const sends: Promise<unknown>[] = [
      sendEmail(adminTo, `💬 New enquiry from ${name}${productName ? ` — ${productName}` : ''}`.slice(0, 200), adminHtml, customerEmail || undefined),
    ];

    if (customerEmail) {
      const t = ACK[language];
      sends.push(
        sendEmail(
          customerEmail,
          t.subject,
          shell(`
            <p style="margin:0 0 16px;line-height:1.6;">${t.body(esc(name))}</p>
            ${
              productName || message
                ? `<div style="background:#faf6ea;border-radius:8px;padding:12px 16px;line-height:1.6;">
                    <div style="color:#6b6250;font-size:12px;">${t.yours}</div>
                    ${productName ? `<div><b>${esc(productName)}</b></div>` : ''}
                    ${message ? `<div style="white-space:pre-line;">${esc(message)}</div>` : ''}
                  </div>`
                : ''
            }
            <p style="margin:20px 0 0;font-size:13px;color:#6b6250;">WhatsApp: ${esc(optEnv('WHATSAPP_DISPLAY') || '+91 8050124365')}</p>`),
          adminTo
        )
      );
    }

    // Email problems must never lose the enquiry — it's already saved above.
    const results = await Promise.allSettled(sends);
    results.forEach((r) => r.status === 'rejected' && console.error('enquiry email failed:', r.reason));

    return json({ ok: true });
  } catch (e) {
    console.error(e);
    return json({ error: 'server_error' }, 500);
  }
});
