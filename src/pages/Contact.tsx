import { useState } from 'react';
import { WHATSAPP_DISPLAY, WHATSAPP_WA_LINK, EMAIL } from '../config/contact';
import { isSupabaseConfigured } from '../lib/supabaseConfig';
import { submitInquiry } from '../lib/inquiry';
import Honeypot from '../components/Honeypot';
import { Reveal } from '../components/motion';
import { useLang } from '../i18n/useLang';

const inputClass =
  'w-full bg-emerald-950 border border-emerald-700 rounded-md px-3 py-2.5 text-sm outline-none focus:border-gold transition-colors';

const POINTS = ['pointQuick', 'pointSecure', 'pointSupport'];

export default function Contact() {
  const { t, lang } = useLang();
  const [website, setWebsite] = useState('');
  const [name, setName] = useState('');
  const [contact, setContact] = useState('');
  const [message, setMessage] = useState('');
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus('sending');
    if (!isSupabaseConfigured) {
      setStatus('error');
      return;
    }
    // Saves the enquiry and emails the admin (see src/lib/inquiry.ts).
    const ok = await submitInquiry({ name, contact, message, language: lang, website });
    setStatus(ok ? 'sent' : 'error');
  }

  return (
    <div className="max-w-4xl mx-auto px-5 py-16">
      <Reveal className="text-center mb-10">
        <h1 className="font-heading text-gold text-3xl mb-3">{t('contactTitle')}</h1>
        <p className="text-cream/70 max-w-xl mx-auto mb-2">{t('contactIntro')}</p>
        <p className="text-cream/50 text-sm max-w-xl mx-auto">{t('contactSub')}</p>
      </Reveal>

      <div className="grid md:grid-cols-[1fr_1.3fr] gap-6">
        <Reveal className="space-y-4">
          <a
            href={WHATSAPP_WA_LINK(t('waContactText'))}
            target="_blank"
            rel="noopener noreferrer"
            className="block rounded-xl border border-emerald-700 bg-emerald-800/40 p-5 hover:border-gold/60 transition-colors"
          >
            <div className="text-xs text-cream/50 mb-1">{t('whatsappPhone')}</div>
            <div className="text-lg text-cream">{WHATSAPP_DISPLAY}</div>
          </a>
          <a
            href={`mailto:${EMAIL}`}
            className="block rounded-xl border border-emerald-700 bg-emerald-800/40 p-5 hover:border-gold/60 transition-colors"
          >
            <div className="text-xs text-cream/50 mb-1">{t('email')}</div>
            <div className="text-lg text-cream break-all">{EMAIL}</div>
          </a>
          <ul className="space-y-2 pt-2">
            {POINTS.map((p) => (
              <li key={p} className="flex items-center gap-2 text-sm text-cream/70">
                <span className="w-5 h-5 rounded-full bg-gold/15 text-gold text-xs flex items-center justify-center">✓</span>
                {t(p)}
              </li>
            ))}
          </ul>
        </Reveal>

        <Reveal delay={0.1}>
          {status === 'sent' ? (
            <div className="h-full flex items-center justify-center text-center text-cream/70 py-10 rounded-xl border border-emerald-700 bg-emerald-800/40 px-6">
              {t('thankYouMessage')}
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="relative space-y-4 bg-emerald-800/50 border border-emerald-700 rounded-xl p-6">
              <Honeypot value={website} onChange={setWebsite} />
              <div>
                <label className="block text-xs text-cream/50 mb-1">{t('yourName')}</label>
                <input required value={name} onChange={(e) => setName(e.target.value)} className={inputClass} />
              </div>
              <div>
                <label className="block text-xs text-cream/50 mb-1">{t('contactDetails')}</label>
                <input required value={contact} onChange={(e) => setContact(e.target.value)} className={inputClass} />
              </div>
              <div>
                <label className="block text-xs text-cream/50 mb-1">{t('yourMessage')}</label>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  rows={4}
                  className={`${inputClass} resize-none`}
                />
              </div>
              {status === 'error' && <p className="text-xs text-red-400">{t('contactError')}</p>}
              <button
                type="submit"
                disabled={status === 'sending'}
                className="w-full bg-gold text-emerald-950 py-3 rounded-md text-sm font-semibold uppercase tracking-wide hover:bg-gold-light transition-colors disabled:opacity-60"
              >
                {status === 'sending' ? t('sending') : t('submit')}
              </button>
              <p className="text-center">
                <a
                  href={WHATSAPP_WA_LINK(t('waContactText'))}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gold text-sm underline underline-offset-4"
                >
                  {t('messageOnWhatsApp')}
                </a>
              </p>
            </form>
          )}
        </Reveal>
      </div>
    </div>
  );
}
