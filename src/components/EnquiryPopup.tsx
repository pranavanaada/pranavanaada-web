import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { WHATSAPP_WA_LINK } from '../config/contact';
import { isSupabaseConfigured } from '../lib/supabaseConfig';
import { submitInquiry } from '../lib/inquiry';
import Honeypot from './Honeypot';
import { useLang } from '../i18n/useLang';

const STORAGE_KEY = 'prana_popup_dismissed';
const DELAY_MS = 3000;

const INTEREST_OPTIONS = [
  { value: '', label: 'What are you interested in?' },
  { value: 'Pooja hand bell', label: 'Pooja hand bell' },
  { value: 'Temple hanging bell', label: 'Temple hanging bell' },
  { value: 'Jayagante', label: 'Jayagante' },
  { value: 'Help me choose a bell', label: 'Help me choose a bell' },
  { value: 'Other enquiry', label: 'Other enquiry' },
];

const inputClass =
  'w-full bg-emerald-950 border border-emerald-700 rounded-md px-3 py-2 text-sm text-cream outline-none focus:border-gold transition-colors placeholder:text-cream/30';

export default function EnquiryPopup() {
  const { lang } = useLang();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [website, setWebsite] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [interest, setInterest] = useState('');
  const [status, setStatus] = useState<'idle' | 'sending' | 'error'>('idle');
  const onCloseRef = useRef<() => void>(() => {});

  useEffect(() => {
    // Don't show if already dismissed in this session
    if (sessionStorage.getItem(STORAGE_KEY)) return;

    const timer = setTimeout(() => setOpen(true), DELAY_MS);
    return () => clearTimeout(timer);
  }, []);

  function dismiss() {
    sessionStorage.setItem(STORAGE_KEY, '1');
    setOpen(false);
  }

  onCloseRef.current = dismiss;

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onCloseRef.current();
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener('keydown', onKey);
    };
  }, [open]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus('sending');

    if (!isSupabaseConfigured) {
      sessionStorage.setItem(STORAGE_KEY, '1');
      setOpen(false);
      navigate('/thank-you-enquiry');
      return;
    }

    const ok = await submitInquiry({
      name,
      contact: phone,
      message: interest ? `[${interest}] — via homepage popup` : '(via homepage popup)',
      language: lang,
      website,
    });

    if (ok) {
      sessionStorage.setItem(STORAGE_KEY, '1');
      setOpen(false);
      navigate('/thank-you-enquiry');
    } else {
      setStatus('error');
    }
  }

  return createPortal(
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-5"
          onClick={dismiss}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25 }}
        >
          <motion.div
            className="relative bg-emerald-800 border border-emerald-700 rounded-2xl max-w-sm w-full shadow-2xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-label="Enquire about Panchaloha Bells"
            initial={{ opacity: 0, y: 32, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.98 }}
            transition={{ type: 'spring', stiffness: 340, damping: 28 }}
          >
            {/* Gold top bar */}
            <div className="h-1 w-full bg-gradient-to-r from-gold/60 via-gold to-gold/60" />

            <div className="p-6">
              {/* Close */}
              <button
                onClick={dismiss}
                className="absolute top-4 right-5 text-cream/50 hover:text-cream text-xl leading-none transition-colors"
                aria-label="Close"
              >
                ✕
              </button>

              {/* Header */}
              <div className="text-center mb-5">
                <div className="text-2xl mb-2">🔔</div>
                <h2 className="font-heading text-gold text-xl mb-1">
                  Enquire About Our Bells
                </h2>
                <p className="text-cream/55 text-xs leading-relaxed">
                  Tell us what you need — we'll help with sizes, prices and availability.
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-3 relative">
                <Honeypot value={website} onChange={setWebsite} />

                <div>
                  <input
                    required
                    placeholder="Your name *"
                    value={name}
                    autoFocus
                    onChange={(e) => setName(e.target.value)}
                    className={inputClass}
                  />
                </div>

                <div>
                  <input
                    required
                    type="tel"
                    placeholder="Phone number *"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className={inputClass}
                  />
                </div>

                <div>
                  <select
                    value={interest}
                    onChange={(e) => setInterest(e.target.value)}
                    className={`${inputClass} appearance-none cursor-pointer`}
                    style={{
                      backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 20 20' fill='%23c9a24b'%3E%3Cpath fill-rule='evenodd' d='M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z' clip-rule='evenodd'/%3E%3C/svg%3E")`,
                      backgroundRepeat: 'no-repeat',
                      backgroundPosition: 'right 10px center',
                      backgroundSize: '16px',
                      paddingRight: '32px',
                    }}
                  >
                    {INTEREST_OPTIONS.map((o) => (
                      <option key={o.value} value={o.value} disabled={o.value === ''} className="bg-emerald-950">
                        {o.label}
                      </option>
                    ))}
                  </select>
                </div>

                {status === 'error' && (
                  <p className="text-xs text-red-400">Something went wrong. Please try again.</p>
                )}

                <button
                  type="submit"
                  disabled={status === 'sending'}
                  className="w-full bg-gold text-emerald-950 py-2.5 rounded-md text-sm font-semibold uppercase tracking-wide hover:bg-gold-light transition-colors disabled:opacity-60"
                >
                  {status === 'sending' ? 'Sending…' : 'Send Enquiry'}
                </button>

                <div className="flex items-center gap-2 text-cream/30 text-xs">
                  <div className="flex-1 h-px bg-emerald-700" />
                  or
                  <div className="flex-1 h-px bg-emerald-700" />
                </div>

                <a
                  href={WHATSAPP_WA_LINK('Hi, I am interested in Pranavanaada bells')}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={dismiss}
                  className="flex items-center justify-center gap-2 w-full border border-[#25D366]/40 text-[#25D366] py-2.5 rounded-md text-sm font-semibold hover:bg-[#25D366]/10 transition-colors"
                >
                  <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4" aria-hidden>
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 0 0-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z" />
                  </svg>
                  WhatsApp us instead
                </a>
              </form>

              <p className="text-center mt-3">
                <button
                  onClick={dismiss}
                  className="text-cream/30 text-xs hover:text-cream/50 transition-colors"
                >
                  No thanks, just browsing
                </button>
              </p>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  );
}
