import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { Link, useNavigate } from 'react-router-dom';
import { useLang } from '../i18n/useLang';
import { AnimatePresence, motion } from 'framer-motion';
import { useCart, formatINR, describeItems, itemLabel, type CartItem } from '../hooks/useCart';
import { productPath, sizeLabel, weightLabel, type Lang } from '../lib/productUtils';
import { isSupabaseConfigured } from '../lib/supabaseConfig';
import { submitInquiry } from '../lib/inquiry';
import Honeypot from './Honeypot';
import { WHATSAPP_WA_LINK } from '../config/contact';

type Step = 'list' | 'form' | 'sent';

const localName = (item: CartItem, lang: Lang) => (lang === 'kn' && item.name_kn) || item.name;
const itemPath = (item: CartItem) => (item.combo ? '/shop?category=combos' : productPath(item));

const inputClass =
  'w-full bg-emerald-950 border border-emerald-700 rounded-md px-3 py-2.5 text-sm outline-none focus:border-gold transition-colors';

export default function CartDrawer() {
  const { t, lang } = useLang();
  const navigate = useNavigate();
  const cart = useCart();
  const [step, setStep] = useState<Step>('list');
  const [name, setName] = useState('');
  const [contact, setContact] = useState('');
  const [message, setMessage] = useState('');
  const [status, setStatus] = useState<'idle' | 'sending' | 'error'>('idle');
  const [website, setWebsite] = useState('');

  const { isOpen, close } = cart;

  // Reset to the item list each time the drawer opens (unless just sent).
  useEffect(() => {
    if (!isOpen) return;
    setStep((s) => (s === 'sent' ? 'list' : s));
    setStatus('idle');
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && close();
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener('keydown', onKey);
    };
  }, [isOpen, close]);

  // If the last item is removed while on the form, go back to the (empty) list.
  useEffect(() => {
    if (cart.items.length === 0 && step === 'form') setStep('list');
  }, [cart.items.length, step]);

  const itemSummary = cart.items.map((i) => `${itemLabel(i)} ×${i.qty}`).join(', ');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus('sending');
    if (!isSupabaseConfigured) {
      setStatus('error');
      return;
    }
    const fullMessage = `${describeItems(cart.items)}${message.trim() ? `\n\n${message.trim()}` : ''}`;
    // Saves the enquiry and emails the admin (see src/lib/inquiry.ts).
    const ok = await submitInquiry({
      name,
      contact,
      message: fullMessage,
      productName: itemSummary,
      language: lang,
      website,
    });
    if (!ok) {
      setStatus('error');
      return;
    }
    cart.clear();
    setMessage('');
    setStep('sent');
    setStatus('idle');
  }

  const whatsappText =
    `${t('waListIntro')}\n\n${describeItems(cart.items, lang, t('estimatedTotal'))}` +
    (name ? `\n\n${t('waName')}: ${name}` : '') +
    (message.trim() ? `\n\n${message.trim()}` : '');

  return createPortal(
    <>
      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div
              key="cart-backdrop"
              className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
              onClick={close}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            />
            <motion.aside
              key="cart-panel"
              role="dialog"
              aria-modal="true"
              aria-label={t('enquiryList')}
              className="fixed top-0 right-0 bottom-0 z-50 w-full max-w-md bg-emerald-900 border-l border-emerald-700 shadow-2xl flex flex-col"
              style={{ paddingTop: 'env(safe-area-inset-top, 0px)', paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', stiffness: 380, damping: 38 }}
            >
              {/* Header */}
              <div className="flex items-center justify-between px-5 py-4 border-b border-emerald-800">
                <div className="flex items-center gap-3">
                  {step === 'form' && (
                    <button onClick={() => setStep('list')} aria-label={t('back')} className="text-cream/60 hover:text-gold">
                      ←
                    </button>
                  )}
                  <h2 className="font-heading text-gold text-lg">
                    {step === 'form' ? t('yourDetails') : t('enquiryList')}
                  </h2>
                  {step === 'list' && cart.count > 0 && (
                    <span className="text-xs bg-gold/15 text-gold rounded-full px-2 py-0.5">{cart.count}</span>
                  )}
                </div>
                <button onClick={close} aria-label={t('close')} className="text-cream/60 hover:text-cream text-lg">
                  ✕
                </button>
              </div>

              <AnimatePresence mode="wait" initial={false}>
                {step === 'sent' ? (
                  <motion.div
                    key="sent"
                    className="flex-1 flex flex-col items-center justify-center text-center px-8"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0 }}
                  >
                    <motion.div
                      className="w-16 h-16 rounded-full bg-gold/15 text-gold flex items-center justify-center text-3xl mb-5"
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: 'spring', stiffness: 300, damping: 15, delay: 0.1 }}
                    >
                      ✓
                    </motion.div>
                    <p className="text-cream/80 mb-6">
                      {t('thankYouEnquiry')}
                    </p>
                    <button onClick={close} className="text-gold text-sm underline underline-offset-4">
                      {t('continueBrowsing')}
                    </button>
                  </motion.div>
                ) : cart.items.length === 0 ? (
                  <motion.div
                    key="empty"
                    className="flex-1 flex flex-col items-center justify-center text-center px-8"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                  >
                    <BagIcon className="w-14 h-14 text-cream/20 mb-4" />
                    <p className="text-cream/60 mb-5">{t('emptyList')}</p>
                    <Link
                      to="/shop"
                      onClick={close}
                      className="border border-gold text-gold text-xs font-semibold uppercase tracking-widest px-6 py-3 rounded-md hover:bg-gold hover:text-emerald-950 transition-colors"
                    >
                      {t('exploreCollection')}
                    </Link>
                  </motion.div>
                ) : step === 'list' ? (
                  <motion.div
                    key="list"
                    className="flex-1 flex flex-col min-h-0"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.2 }}
                  >
                    <ul className="flex-1 overflow-y-auto px-5 py-3 divide-y divide-emerald-800">
                      <AnimatePresence initial={false}>
                        {cart.items.map((item) => (
                          <motion.li
                            key={item.key}
                            layout
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0, transition: { duration: 0.2 } }}
                            className="overflow-hidden"
                          >
                            <div className="flex gap-3 py-3">
                              <Link to={itemPath(item)} onClick={close} className="shrink-0">
                                <img
                                  src={item.thumb}
                                  alt={localName(item, lang)}
                                  className="w-16 h-16 rounded-lg object-cover bg-emerald-950 border border-emerald-800"
                                />
                              </Link>
                              <div className="flex-1 min-w-0">
                                <div className="flex justify-between gap-2">
                                  <Link
                                    to={itemPath(item)}
                                    onClick={close}
                                    className="text-sm font-medium truncate hover:text-gold"
                                  >
                                    {localName(item, lang)}
                                  </Link>
                                  <button
                                    onClick={() => cart.remove(item.key)}
                                    aria-label={t('removeItem', { name: localName(item, lang) })}
                                    className="text-cream/40 hover:text-red-400 text-xs shrink-0"
                                  >
                                    {t('remove')}
                                  </button>
                                </div>
                                {item.combo && (
                                  <div className="text-[11px] text-cream/50 mt-0.5 leading-snug">
                                    <span className="bg-gold/15 text-gold rounded px-1.5 py-0.5 font-medium mr-1.5">
                                      {t('combo')}
                                    </span>
                                    {lang === 'kn' ? item.combo.includes_kn : item.combo.includes}
                                  </div>
                                )}
                                {item.variant && (
                                  <div className="flex flex-wrap items-center gap-x-2 text-xs mt-0.5">
                                    <span className="bg-gold/15 text-gold rounded px-1.5 py-0.5 font-medium">{weightLabel(item.variant, lang)}</span>
                                    {item.size && <span className="text-cream/40">{sizeLabel(item.size, lang)}</span>}
                                  </div>
                                )}
                                <div className="text-xs text-cream/50 mt-1 mb-2">{t('each', { price: formatINR(item.price) })}</div>
                                <div className="flex items-center justify-between">
                                  <QtyStepper value={item.qty} onChange={(q) => cart.setQty(item.key, q)} />
                                  <span className="text-gold text-sm font-semibold">{formatINR(item.price * item.qty)}</span>
                                </div>
                              </div>
                            </div>
                          </motion.li>
                        ))}
                      </AnimatePresence>
                    </ul>

                    <div className="border-t border-emerald-800 px-5 py-4 space-y-3 bg-emerald-950/40">
                      <div className="flex justify-between text-sm">
                        <span className="text-cream/60">{t('estimatedTotal')}</span>
                        <span className="text-gold font-semibold text-base">{formatINR(cart.total)}</span>
                      </div>
                      <p className="text-[11px] text-cream/40">
                        {t('noPaymentNote')}
                      </p>
                      <motion.button
                        whileTap={{ scale: 0.98 }}
                        onClick={() => {
                          close();
                          navigate('/checkout');
                        }}
                        className="w-full bg-gold text-emerald-950 py-3 rounded-md text-sm font-semibold uppercase tracking-wide hover:bg-gold-light transition-colors"
                      >
                        {t('buyNow')} · {formatINR(cart.total)}
                      </motion.button>
                      <button
                        onClick={() => setStep('form')}
                        className="w-full border border-gold text-gold py-2.5 rounded-md text-xs font-semibold uppercase tracking-wide hover:bg-gold/10 transition-colors"
                      >
                        {t('enquireAll')} ({cart.count})
                      </button>
                      <a
                        href={WHATSAPP_WA_LINK(whatsappText)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-full flex items-center justify-center gap-2 border border-[#25D366]/60 text-[#25D366] py-2.5 rounded-md text-xs font-semibold uppercase tracking-wide hover:bg-[#25D366]/10 transition-colors"
                      >
                        {t('enquireOnWhatsApp')}
                      </a>
                    </div>
                  </motion.div>
                ) : (
                  <motion.form
                    key="form"
                    onSubmit={handleSubmit}
                    className="relative flex-1 flex flex-col min-h-0"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    transition={{ duration: 0.2 }}
                  >
                    <Honeypot value={website} onChange={setWebsite} />
                    <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
                      <div className="rounded-lg border border-emerald-800 bg-emerald-950/50 p-3">
                        <div className="text-[11px] uppercase tracking-wider text-cream/40 mb-2">
                          {t('enquiringAbout', { count: cart.count })}
                        </div>
                        <ul className="space-y-1 text-sm">
                          {cart.items.map((i) => (
                            <li key={i.key} className="flex justify-between gap-3">
                              <span className="truncate text-cream/80">
                                {itemLabel(i, lang)} <span className="text-cream/40">× {i.qty}</span>
                              </span>
                              <span className="text-cream/60 shrink-0">{formatINR(i.price * i.qty)}</span>
                            </li>
                          ))}
                        </ul>
                        <div className="flex justify-between border-t border-emerald-800 mt-2 pt-2 text-sm">
                          <span className="text-cream/60">{t('estimatedTotal')}</span>
                          <span className="text-gold font-semibold">{formatINR(cart.total)}</span>
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs text-cream/50 mb-1">{t('yourName')}</label>
                        <input required autoFocus value={name} onChange={(e) => setName(e.target.value)} className={inputClass} />
                      </div>
                      <div>
                        <label className="block text-xs text-cream/50 mb-1">{t('contactDetails')}</label>
                        <input required value={contact} onChange={(e) => setContact(e.target.value)} className={inputClass} />
                      </div>
                      <div>
                        <label className="block text-xs text-cream/50 mb-1">{t('yourMessage')} {t('optional')}</label>
                        <textarea
                          value={message}
                          onChange={(e) => setMessage(e.target.value)}
                          rows={3}
                          placeholder={t('messagePlaceholder')}
                          className={`${inputClass} resize-none placeholder:text-cream/25`}
                        />
                      </div>
                      {status === 'error' && (
                        <p className="text-xs text-red-400">{t('listSendError')}</p>
                      )}
                    </div>

                    <div className="border-t border-emerald-800 px-5 py-4 space-y-3 bg-emerald-950/40">
                      <motion.button
                        whileTap={{ scale: 0.98 }}
                        type="submit"
                        disabled={status === 'sending'}
                        className="w-full bg-gold text-emerald-950 py-3 rounded-md text-sm font-semibold uppercase tracking-wide hover:bg-gold-light transition-colors disabled:opacity-60"
                      >
                        {status === 'sending' ? t('sending') : t('sendEnquiry')}
                      </motion.button>
                      <a
                        href={WHATSAPP_WA_LINK(whatsappText)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-full flex items-center justify-center gap-2 border border-[#25D366]/60 text-[#25D366] py-2.5 rounded-md text-xs font-semibold uppercase tracking-wide hover:bg-[#25D366]/10 transition-colors"
                      >
                        {t('enquireOnWhatsApp')}
                      </a>
                    </div>
                  </motion.form>
                )}
              </AnimatePresence>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      <AddedToast />
    </>,
    document.body
  );
}

/** Small confirmation that pops up bottom-centre whenever something is added. */
function AddedToast() {
  const { lastAdded, open, isOpen } = useCart();
  const { t, lang } = useLang();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!lastAdded) return;
    setVisible(true);
    const timer = setTimeout(() => setVisible(false), 2800);
    return () => clearTimeout(timer);
  }, [lastAdded]);

  useEffect(() => {
    if (isOpen) setVisible(false);
  }, [isOpen]);

  return (
    <AnimatePresence>
      {visible && lastAdded && (
        <motion.div
          key={lastAdded.key}
          role="status"
          className="fixed z-[45] left-1/2 bottom-6 w-[calc(100%-2rem)] max-w-sm"
          initial={{ opacity: 0, y: 30, x: '-50%' }}
          animate={{ opacity: 1, y: 0, x: '-50%' }}
          exit={{ opacity: 0, y: 20, x: '-50%' }}
          transition={{ type: 'spring', stiffness: 400, damping: 30 }}
          style={{ marginBottom: 'env(safe-area-inset-bottom, 0px)' }}
        >
          <div className="flex items-center gap-3 bg-emerald-800 border border-gold/40 rounded-xl p-3 shadow-2xl">
            <img src={lastAdded.item.thumb} alt="" className="w-11 h-11 rounded-md object-cover" />
            <div className="flex-1 min-w-0">
              <div className="text-xs text-gold">{t('addedToList')}</div>
              <div className="text-sm truncate">{itemLabel(lastAdded.item, lang)}</div>
            </div>
            <button
              onClick={open}
              className="shrink-0 text-xs font-semibold uppercase tracking-wide bg-gold text-emerald-950 px-3 py-2 rounded-md hover:bg-gold-light transition-colors"
            >
              {t('view')}
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export function QtyStepper({
  value,
  onChange,
  min = 1,
  size = 'sm',
}: {
  value: number;
  onChange: (qty: number) => void;
  min?: number;
  size?: 'sm' | 'md';
}) {
  const { t } = useLang();
  const btn = size === 'md' ? 'w-10 h-10 text-lg' : 'w-7 h-7 text-sm';
  return (
    <div className="inline-flex items-center border border-emerald-700 rounded-md overflow-hidden">
      <button
        type="button"
        aria-label={t('decreaseQty')}
        onClick={() => onChange(value - 1)}
        disabled={value <= min && min > 0}
        className={`${btn} text-cream/70 hover:bg-emerald-800 hover:text-gold disabled:opacity-30 transition-colors`}
      >
        −
      </button>
      <span className={`${size === 'md' ? 'w-10 text-base' : 'w-8 text-sm'} text-center tabular-nums`}>{value}</span>
      <button
        type="button"
        aria-label={t('increaseQty')}
        onClick={() => onChange(value + 1)}
        disabled={value >= 99}
        className={`${btn} text-cream/70 hover:bg-emerald-800 hover:text-gold disabled:opacity-30 transition-colors`}
      >
        +
      </button>
    </div>
  );
}

export function BagIcon({ className = 'w-5 h-5' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden>
      <path d="M6 7h12l-1 13H7L6 7z" />
      <path d="M9 7V6a3 3 0 0 1 6 0v1" />
    </svg>
  );
}
