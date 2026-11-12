import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { WHATSAPP_WA_LINK } from '../config/contact';
import { isSupabaseConfigured } from '../lib/supabaseConfig';
import { submitInquiry } from '../lib/inquiry';
import Honeypot from './Honeypot';
import { Reveal } from './motion';
import { useLang } from '../i18n/useLang';

const inputClass =
  'w-full bg-emerald-950/80 border border-emerald-700 rounded-md px-3 py-2.5 text-sm text-cream outline-none focus:border-gold transition-colors placeholder:text-cream/30';

const INTEREST_OPTIONS = [
  { value: '', label: 'What are you interested in?' },
  { value: 'Pooja hand bell', label: 'Pooja hand bell' },
  { value: 'Temple hanging bell', label: 'Temple hanging bell' },
  { value: 'Jayagante', label: 'Jayagante' },
  { value: 'Help me choose a bell', label: 'Help me choose a bell' },
  { value: 'Other enquiry', label: 'Other enquiry' },
];

export default function HomeEnquirySection() {
  const { lang } = useLang();
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

    const contact = email ? `${phone} | ${email}` : phone;
    const fullMessage = interest ? `[${interest}]\n${message}` : message;

    if (!isSupabaseConfigured) {
      navigate('/thank-you-enquiry');
      return;
    }

    const ok = await submitInquiry({ name, contact, message: fullMessage, language: lang, website });
    if (ok) {
      navigate('/thank-you-enquiry');
    } else {
      setStatus('error');
    }
  }

  return (
    <section className="w-full bg-emerald-900/60 border-t border-emerald-700">
      <div className="max-w-5xl mx-auto px-5 py-16">
        <Reveal className="text-center mb-10">
          <p className="text-xs uppercase tracking-[0.2em] text-gold-light mb-3">Get in touch</p>
          <h2 className="font-heading text-gold text-2xl md:text-3xl mb-3">
            Enquire About Panchaloha Bells
          </h2>
          <p className="text-cream/60 max-w-lg mx-auto text-sm leading-relaxed">
            Looking for a bell for your home or temple? Tell us what you're interested in and our team will help you with sizes, prices and availability.
          </p>
        </Reveal>

        <div className="grid md:grid-cols-2 gap-8 items-start">
          {/* Left: trust points */}
          <Reveal className="space-y-5">
            {[
              {
                icon: '🔔',
                title: 'Expert guidance',
                desc: 'Not sure which bell suits your space? We help you choose based on your needs.',
              },
              {
                icon: '📦',
                title: 'Pan-India shipping',
                desc: 'Safely packaged and shipped to any address across India.',
              },
              {
                icon: '🤝',
                title: 'Custom & bulk orders',
                desc: 'Custom sizes, engravings and temple bulk orders — just ask.',
              },
              {
                icon: '⚡',
                title: 'Quick response',
                desc: 'We reply within one business day, often much sooner on WhatsApp.',
              },
            ].map((item) => (
              <div key={item.title} className="flex items-start gap-4">
                <span className="w-10 h-10 rounded-full bg-gold/10 border border-gold/20 flex items-center justify-center text-lg shrink-0">
                  {item.icon}
                </span>
                <div>
                  <div className="text-cream/90 text-sm font-semibold mb-0.5">{item.title}</div>
                  <div className="text-cream/50 text-xs leading-relaxed">{item.desc}</div>
                </div>
              </div>
            ))}
          </Reveal>

          {/* Right: form */}
          <Reveal delay={0.1}>
            <form
              onSubmit={handleSubmit}
              className="bg-emerald-800/60 border border-emerald-700 rounded-xl p-6 space-y-4"
            >
              <Honeypot value={website} onChange={setWebsite} />

              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-cream/50 mb-1.5 uppercase tracking-wider">
                    Your Name <span className="text-gold">*</span>
                  </label>
                  <input
                    required
                    placeholder="Ramesh Kumar"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className={inputClass}
                  />
                </div>
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
              </div>

              <div>
                <label className="block text-xs text-cream/50 mb-1.5 uppercase tracking-wider">
                  E-Mail <span className="text-cream/30 normal-case">(optional)</span>
                </label>
                <input
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={inputClass}
                />
              </div>

              <div>
                <label className="block text-xs text-cream/50 mb-1.5 uppercase tracking-wider">
                  Interested In <span className="text-gold">*</span>
                </label>
                <select
                  required
                  value={interest}
                  onChange={(e) => setInterest(e.target.value)}
                  className={`${inputClass} appearance-none cursor-pointer`}
                  style={{
                    backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 20 20' fill='%23c9a24b'%3E%3Cpath fill-rule='evenodd' d='M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z' clip-rule='evenodd'/%3E%3C/svg%3E")`,
                    backgroundRepeat: 'no-repeat',
                    backgroundPosition: 'right 12px center',
                    backgroundSize: '18px',
                    paddingRight: '36px',
                  }}
                >
                  {INTEREST_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value} disabled={o.value === ''} className="bg-emerald-950">
                      {o.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs text-cream/50 mb-1.5 uppercase tracking-wider">
                  Your Message <span className="text-cream/30 normal-case">(optional)</span>
                </label>
                <textarea
                  placeholder="Any details — occasion, temple size, specific weight…"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  rows={3}
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
                  className="text-gold text-xs underline underline-offset-4 hover:text-gold-light"
                >
                  Prefer WhatsApp? Message us directly →
                </a>
              </p>
            </form>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
