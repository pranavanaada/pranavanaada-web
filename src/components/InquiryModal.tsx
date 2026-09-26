import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useLang } from '../i18n/useLang';
import { AnimatePresence, motion } from 'framer-motion';
import { isSupabaseConfigured } from '../lib/supabaseConfig';
import { submitInquiry } from '../lib/inquiry';
import Honeypot from './Honeypot';

interface Props {
  open: boolean;
  productName?: string | null;
  onClose: () => void;
}

export default function InquiryModal({ open, productName, onClose }: Props) {
  const { t, lang } = useLang();
  const [website, setWebsite] = useState('');
  const [name, setName] = useState('');
  const [contact, setContact] = useState('');
  const [message, setMessage] = useState('');
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle');
  // Callers pass an inline onClose; keep it in a ref so a parent re-render
  // doesn't re-run the effect below and wipe the form mid-typing.
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => {
    if (!open) return;
    setStatus('idle');
    setName('');
    setContact('');
    setMessage('');

    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onCloseRef.current();
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener('keydown', onKey);
    };
  }, [open]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus('sending');
    if (!isSupabaseConfigured) {
      setStatus('error');
      return;
    }
    // Saves the enquiry and emails the admin (see src/lib/inquiry.ts).
    const ok = await submitInquiry({ name, contact, message, productName, language: lang, website });
    setStatus(ok ? 'sent' : 'error');
  }

  return createPortal(
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-5"
          onClick={onClose}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
        >
          <motion.div
            className="relative bg-emerald-800 border border-emerald-700 rounded-xl max-w-md w-full p-6 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            initial={{ opacity: 0, y: 24, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.98 }}
            transition={{ type: 'spring', stiffness: 380, damping: 30 }}
          >
            <button
              className="absolute top-4 right-5 text-cream/60 hover:text-cream text-lg"
              onClick={onClose}
              aria-label={t('close')}
            >
              ✕
            </button>
            <h3 className="font-heading text-gold text-xl mb-1">{t('sendEnquiry')}</h3>
            <p className="text-xs text-cream/50 mb-4">{productName || t('generalEnquiry')}</p>

            {status === 'sent' ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="py-6 text-center text-cream/80 text-sm"
              >
                {t('thankYouEnquiry')}
              </motion.div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-3 relative">
                <Honeypot value={website} onChange={setWebsite} />
                <div>
                  <label className="block text-xs text-cream/50 mb-1">{t('yourName')}</label>
                  <input
                    required
                    autoFocus
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full bg-emerald-950 border border-emerald-700 rounded-md px-3 py-2 text-sm outline-none focus:border-gold transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-xs text-cream/50 mb-1">{t('contactDetails')}</label>
                  <input
                    required
                    value={contact}
                    onChange={(e) => setContact(e.target.value)}
                    className="w-full bg-emerald-950 border border-emerald-700 rounded-md px-3 py-2 text-sm outline-none focus:border-gold transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-xs text-cream/50 mb-1">{t('yourMessage')}</label>
                  <textarea
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    rows={3}
                    className="w-full bg-emerald-950 border border-emerald-700 rounded-md px-3 py-2 text-sm outline-none focus:border-gold resize-none transition-colors"
                  />
                </div>
                {status === 'error' && (
                  <p className="text-xs text-red-400">
                    {t('enquiryError')}
                  </p>
                )}
                <div className="flex gap-2 pt-2">
                  <button
                    type="button"
                    onClick={onClose}
                    className="flex-1 py-2.5 rounded-md border border-gold text-gold text-xs font-semibold uppercase tracking-wide hover:bg-gold/10 transition-colors"
                  >
                    {t('cancel')}
                  </button>
                  <button
                    type="submit"
                    disabled={status === 'sending'}
                    className="flex-1 py-2.5 rounded-md bg-gold text-emerald-950 text-xs font-semibold uppercase tracking-wide hover:bg-gold-light transition-colors disabled:opacity-60"
                  >
                    {status === 'sending' ? '...' : t('submit')}
                  </button>
                </div>
              </form>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  );
}
