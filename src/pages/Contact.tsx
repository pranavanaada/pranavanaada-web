import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { WHATSAPP_DISPLAY, WHATSAPP_WA_LINK, EMAIL } from '../config/contact';
import { isSupabaseConfigured } from '../lib/supabaseConfig';
import { submitInquiry } from '../lib/inquiry';
import Honeypot from '../components/Honeypot';
import { Reveal } from '../components/motion';
import { useLang } from '../i18n/useLang';
import { useSeo } from '../lib/seo';
import SEO_PAGES from '../seo-pages.json';

const inputClass =
  'w-full bg-emerald-950 border border-emerald-700 rounded-md px-3 py-2.5 text-sm text-cream outline-none focus:border-gold transition-colors placeholder:text-cream/30';

const INTEREST_OPTIONS = [
  { value: '', label: 'Select an option…' },
  { value: 'Pooja hand bell', label: 'Pooja hand bell' },
  { value: 'Temple hanging bell', label: 'Temple hanging bell' },
  { value: 'Jayagante', label: 'Jayagante' },
  { value: 'Help me choose a bell', label: 'Help me choose a bell' },
  { value: 'Other enquiry', label: 'Other enquiry' },
];

export default function Contact() {
  useSeo({ ...SEO_PAGES['/contact'], path: '/contact' });
  const { t, lang } = useLang();
  const navigate = useNavigate();

  const [website, setWebsite] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [interest, setInterest] = useState('');
  const [message, setMessage] = useState('');
  const [status, setStatus] = useState<'idle' | 'sending' | 'error'>('idle');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus('sending');

    // Build contact string: phone + optional email
    const contact = email ? `${phone} | ${email}` : phone;
    // Build full message with interest tag
    const fullMessage = interest ? `[${interest}]\n${message}` : message;

    if (!isSupabaseConfigured) {
      // Dev fallback: redirect anyway so the page can be tested locally
      navigate('/thank-you-enquiry');
      return;
    }

    const ok = await submitInquiry({
      name,
      contact,
      message: fullMessage,
      language: lang,
      website,
    });

    if (ok) {
      navigate('/thank-you-enquiry');
    } else {
      setStatus('error');
    }
  }

  return (
    <div className="max-w-4xl mx-auto px-5 py-16">
      <Reveal className="text-center mb-10">
        <p className="text-xs uppercase tracking-[0.2em] text-gold-light mb-3">Get in touch</p>
        <h1 className="font-heading text-gold text-3xl md:text-4xl mb-4">
          Enquire About Panchaloha Bells
        </h1>
        <p className="text-cream/70 max-w-xl mx-auto leading-relaxed">
          Looking for a bell for your home or temple? Tell us what you're interested in, and our team will help you with sizes, prices and availability.
        </p>
      </Reveal>

      <div className="grid md:grid-cols-[1fr_1.4fr] gap-6 items-start">

        {/* Left: contact info */}
        <Reveal className="space-y-4">
          <a
            href={WHATSAPP_WA_LINK('Hi, I am interested in Pranavanaada bells')}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-4 rounded-xl border border-emerald-700 bg-emerald-800/40 p-5 hover:border-gold/60 transition-colors group"
          >
            <span className="w-10 h-10 rounded-full bg-[#25D366]/15 text-[#25D366] flex items-center justify-center shrink-0">
              <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5" aria-hidden>
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 0 0-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z" />
              </svg>
            </span>
            <div>
              <div className="text-xs text-cream/50 mb-0.5">WhatsApp</div>
              <div className="text-cream font-medium group-hover:text-gold transition-colors">{WHATSAPP_DISPLAY}</div>
            </div>
          </a>

          <a
            href={`mailto:${EMAIL}`}
            className="flex items-center gap-4 rounded-xl border border-emerald-700 bg-emerald-800/40 p-5 hover:border-gold/60 transition-colors group"
          >
            <span className="w-10 h-10 rounded-full bg-gold/15 text-gold flex items-center justify-center shrink-0">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-5 h-5" aria-hidden>
                <rect x="2" y="4" width="20" height="16" rx="2" />
                <path d="m2 7 10 7 10-7" />
              </svg>
            </span>
            <div>
              <div className="text-xs text-cream/50 mb-0.5">Email</div>
              <div className="text-cream font-medium break-all group-hover:text-gold transition-colors">{EMAIL}</div>
            </div>
          </a>

          <div className="rounded-xl border border-emerald-700 bg-emerald-800/40 p-5 space-y-3">
            <div className="text-xs text-cream/50 uppercase tracking-wider mb-2">Why enquire?</div>
            {[
              'Get exact sizes and weights for your space',
              'Custom orders and bulk pricing available',
              'Expert guidance on choosing the right bell',
              'Pan-India shipping, with safe packaging',
            ].map((point) => (
              <div key={point} className="flex items-start gap-2 text-sm text-cream/70">
                <span className="w-5 h-5 rounded-full bg-gold/15 text-gold text-xs flex items-center justify-center shrink-0 mt-0.5">✓</span>
                {point}
              </div>
            ))}
          </div>
        </Reveal>

        {/* Right: enquiry form */}
        <Reveal delay={0.1}>
          <form
            onSubmit={handleSubmit}
            className="relative space-y-4 bg-emerald-800/50 border border-emerald-700 rounded-xl p-6"
          >
            <Honeypot value={website} onChange={setWebsite} />

            {/* Name */}
            <div>
              <label className="block text-xs text-cream/50 mb-1.5 uppercase tracking-wider">
                Your Name <span className="text-gold">*</span>
              </label>
              <input
                required
                placeholder="e.g. Ramesh Kumar"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className={inputClass}
              />
            </div>

            {/* Phone */}
            <div>
              <label className="block text-xs text-cream/50 mb-1.5 uppercase tracking-wider">
                Phone Number <span className="text-gold">*</span>
              </label>
              <input
                required
                type="tel"
                placeholder="+91 98765 43210"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className={inputClass}
              />
            </div>

            {/* Email */}
            <div>
              <label className="block text-xs text-cream/50 mb-1.5 uppercase tracking-wider">
                E-Mail <span className="text-cream/30 normal-case tracking-normal font-normal">(optional)</span>
              </label>
              <input
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={inputClass}
              />
            </div>

            {/* Interest dropdown */}
            <div>
              <label className="block text-xs text-cream/50 mb-1.5 uppercase tracking-wider">
                What are you interested in? <span className="text-gold">*</span>
              </label>
              <select
                required
                value={interest}
                onChange={(e) => setInterest(e.target.value)}
                className={`${inputClass} appearance-none cursor-pointer`}
                style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 20 20' fill='%23c9a24b'%3E%3Cpath fill-rule='evenodd' d='M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z' clip-rule='evenodd'/%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 12px center', backgroundSize: '18px', paddingRight: '36px' }}
              >
                {INTEREST_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value} disabled={o.value === ''} className="bg-emerald-950">
                    {o.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Message */}
            <div>
              <label className="block text-xs text-cream/50 mb-1.5 uppercase tracking-wider">
                Your Message <span className="text-cream/30 normal-case tracking-normal font-normal">(optional)</span>
              </label>
              <textarea
                placeholder="Tell us more — what's the occasion, temple or space it's for, any specific size you have in mind…"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={4}
                className={`${inputClass} resize-none`}
              />
            </div>

            {status === 'error' && (
              <p className="text-xs text-red-400 bg-red-900/20 border border-red-700/30 rounded px-3 py-2">
                Something went wrong. Please try again or reach us on WhatsApp.
              </p>
            )}

            <button
              type="submit"
              disabled={status === 'sending'}
              className="w-full bg-gold text-emerald-950 py-3 rounded-md text-sm font-semibold uppercase tracking-wide hover:bg-gold-light transition-colors disabled:opacity-60"
            >
              {status === 'sending' ? 'Sending…' : 'Send Enquiry'}
            </button>

            <p className="text-center">
              <a
                href={WHATSAPP_WA_LINK('Hi, I am interested in Pranavanaada bells')}
                target="_blank"
                rel="noopener noreferrer"
                className="text-gold text-sm underline underline-offset-4"
              >
                Or message us directly on WhatsApp →
              </a>
            </p>
          </form>
        </Reveal>
      </div>
    </div>
  );
}
