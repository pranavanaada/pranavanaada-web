import { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useLang } from '../i18n/useLang';
import { LANGUAGES } from '../i18n/i18n';
import { AnimatePresence, motion } from 'framer-motion';
import { prefetchRoute } from '../pages/lazy';
import { useCart } from '../hooks/useCart';
import { BagIcon } from './CartDrawer';

function CartButton() {
  const { count, open } = useCart();
  const { t } = useLang();
  return (
    <motion.button
      onClick={open}
      aria-label={t('cartAria', { count })}
      whileTap={{ scale: 0.92 }}
      className="relative w-10 h-10 rounded-full border border-emerald-700 text-cream flex items-center justify-center hover:border-gold hover:text-gold transition-colors"
    >
      <BagIcon />
      <AnimatePresence>
        {count > 0 && (
          <motion.span
            key="badge"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0 }}
            className="absolute -top-1 -right-1"
          >
            {/* Re-keyed on every change so the badge pops when items are added */}
            <motion.span
              key={count}
              initial={{ scale: 0.4 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 500, damping: 15 }}
              className="min-w-[20px] h-5 px-1 rounded-full bg-gold text-emerald-950 text-[11px] font-bold flex items-center justify-center"
            >
              {count}
            </motion.span>
          </motion.span>
        )}
      </AnimatePresence>
    </motion.button>
  );
}

/** EN | ಕನ್ನಡ toggle with a gold highlight that slides to the active language. */
function LanguageSwitcher() {
  const { t, lang, i18n } = useLang();
  return (
    <div
      role="radiogroup"
      aria-label={t('language')}
      className="flex items-center rounded-full border border-emerald-700 p-0.5 text-xs"
    >
      {LANGUAGES.map((l) => {
        const active = lang === l.code;
        return (
          <button
            key={l.code}
            role="radio"
            aria-checked={active}
            lang={l.code}
            onClick={() => i18n.changeLanguage(l.code)}
            className={`relative px-2.5 py-1 rounded-full font-semibold transition-colors ${
              active ? 'text-emerald-950' : 'text-cream/70 hover:text-gold'
            }`}
          >
            {active && (
              <motion.span
                layoutId="lang-pill"
                className="absolute inset-0 rounded-full bg-gold"
                transition={{ type: 'spring', stiffness: 500, damping: 35 }}
              />
            )}
            <span className="relative">{l.label}</span>
          </button>
        );
      })}
    </div>
  );
}

export default function Navbar() {
  const { t } = useLang();
  const { pathname } = useLocation();
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => setOpen(false), [pathname]);

  const links = [
    { to: '/', label: t('home') },
    { to: '/shop', label: t('shop') },
    { to: '/about', label: t('about') },
    { to: '/reviews', label: t('reviews') },
    { to: '/videos', label: t('videos') },
    { to: '/contact', label: t('contact') },
  ];

  const isActive = (to: string) => (to === '/' ? pathname === '/' : pathname.startsWith(to));

  return (
    <motion.header
      initial={{ y: -64, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      className={`sticky top-0 z-40 backdrop-blur border-b pt-[env(safe-area-inset-top,0px)] transition-[background-color,box-shadow,border-color] duration-300 ${
        scrolled
          ? 'bg-emerald-950/95 border-emerald-700 shadow-[0_8px_30px_-12px_rgba(0,0,0,0.6)]'
          : 'bg-emerald-950/70 border-emerald-800'
      }`}
    >
      <nav
        className={`max-w-6xl mx-auto flex items-center justify-between gap-4 px-5 transition-[padding] duration-300 ${
          scrolled ? 'py-3' : 'py-4'
        }`}
      >
        <Link to="/" className="font-heading text-gold text-xl tracking-wide font-semibold">
          {t('brand')}
        </Link>

        <div className="hidden lg:flex items-center gap-5 xl:gap-7 text-sm text-cream/80">
          {links.map((l) => (
            <Link
              key={l.to}
              to={l.to}
              onMouseEnter={() => prefetchRoute(l.to)}
              className={`relative py-1 transition-colors ${isActive(l.to) ? 'text-gold font-medium' : 'hover:text-gold'}`}
            >
              {l.label}
              {isActive(l.to) && (
                <motion.span
                  layoutId="nav-underline"
                  className="absolute left-0 right-0 -bottom-0.5 h-px bg-gold"
                  transition={{ type: 'spring', stiffness: 400, damping: 34 }}
                />
              )}
            </Link>
          ))}
        </div>

        <div className="flex items-center gap-3">
          <LanguageSwitcher />
          <CartButton />
          <button
            className="lg:hidden text-cream text-2xl leading-none w-8 h-8 flex items-center justify-center"
            aria-label={t('toggleMenu')}
            aria-expanded={open}
            onClick={() => setOpen((o) => !o)}
          >
            <motion.span key={open ? 'x' : 'menu'} initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }}>
              {open ? '✕' : '☰'}
            </motion.span>
          </button>
        </div>
      </nav>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            key="mobile-menu"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            className="lg:hidden overflow-hidden"
          >
            <motion.div
              className="flex flex-col items-center gap-4 pb-5 text-cream/80 text-sm"
              initial="hidden"
              animate="show"
              variants={{ hidden: {}, show: { transition: { staggerChildren: 0.05, delayChildren: 0.05 } } }}
            >
              {links.map((l) => (
                <motion.div
                  key={l.to}
                  variants={{ hidden: { opacity: 0, y: -8 }, show: { opacity: 1, y: 0 } }}
                >
                  <Link
                    to={l.to}
                    onClick={() => setOpen(false)}
                    className={isActive(l.to) ? 'text-gold font-medium' : 'hover:text-gold'}
                  >
                    {l.label}
                  </Link>
                </motion.div>
              ))}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.header>
  );
}
