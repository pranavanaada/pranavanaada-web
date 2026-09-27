import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ADDRESS_LINES,
  BUSINESS_HOURS,
  BUSINESS_NAME,
  EMAIL,
  PHONE_TEL,
  SOCIAL_LINKS,
  WHATSAPP_DISPLAY,
  WHATSAPP_WA_LINK,
} from '../config/contact';
import { useLang } from '../i18n/useLang';
import { useCart } from '../hooks/useCart';
import { useProducts } from '../hooks/useProducts';
import { productName, productPath } from '../lib/productUtils';
import { fadeUp, stagger } from './motion';

const icon = {
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.8,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
  className: 'w-[18px] h-[18px]',
  'aria-hidden': true,
};

const SOCIALS = [
  {
    key: 'instagram',
    label: 'Instagram',
    href: SOCIAL_LINKS.instagram,
    svg: (
      <svg {...icon}>
        <rect x="3" y="3" width="18" height="18" rx="5" />
        <circle cx="12" cy="12" r="4" />
        <circle cx="17.5" cy="6.5" r="0.6" fill="currentColor" />
      </svg>
    ),
  },
  {
    key: 'facebook',
    label: 'Facebook',
    href: SOCIAL_LINKS.facebook,
    svg: (
      <svg {...icon}>
        <path d="M15 3h-2.5A3.5 3.5 0 0 0 9 6.5V9H6.5v3.5H9V21h3.5v-8.5h2.7l.5-3.5h-3.2V7a1 1 0 0 1 1-1H15z" />
      </svg>
    ),
  },
  {
    key: 'youtube',
    label: 'YouTube',
    href: SOCIAL_LINKS.youtube,
    svg: (
      <svg {...icon}>
        <rect x="2.5" y="5.5" width="19" height="13" rx="4" />
        <path d="M10.5 9.5v5l4.3-2.5z" fill="currentColor" />
      </svg>
    ),
  },
].filter((s) => s.href);

function Heading({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="font-heading text-gold text-base mb-4 relative pb-2 after:absolute after:left-0 after:bottom-0 after:w-8 after:h-px after:bg-gold/60">
      {children}
    </h3>
  );
}

const linkClass = 'text-cream/60 hover:text-gold transition-colors inline-flex items-center gap-1.5 group';
const Arrow = () => (
  <span className="text-gold/0 -ml-3 group-hover:text-gold/80 group-hover:ml-0 transition-all duration-300" aria-hidden>
    ›
  </span>
);

export default function Footer() {
  const { t, lang } = useLang();
  const cart = useCart();
  const { products } = useProducts();
  const bells = products.slice(0, 6);

  const quickLinks = [
    { to: '/', label: t('home') },
    { to: '/shop', label: t('shop') },
    { to: '/about', label: t('about') },
    { to: '/reviews', label: t('reviews') },
    { to: '/videos', label: t('videos') },
    { to: '/contact', label: t('contact') },
  ];

  return (
    <footer className="mt-20 border-t border-emerald-800 bg-gradient-to-b from-emerald-950/40 to-emerald-950 pb-[env(safe-area-inset-bottom,0px)]">
      <motion.div
        className="max-w-6xl mx-auto px-5 pt-14 pb-10 grid gap-10 sm:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1fr_1.2fr]"
        variants={stagger(0.08)}
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, margin: '0px 0px -40px 0px' }}
      >
        {/* Brand */}
        <motion.div variants={fadeUp}>
          <Link to="/" className="font-heading text-gold text-2xl tracking-wide">
            {t('brand')}
          </Link>
          <p className="text-sm text-cream/60 leading-relaxed mt-3 mb-5 max-w-xs">{t('footerAbout')}</p>
          {SOCIALS.length > 0 && (
            <>
              <div className="text-xs uppercase tracking-wider text-cream/40 mb-2">{t('footerFollow')}</div>
              <div className="flex gap-2.5">
                {SOCIALS.map((s) => (
                  <a
                    key={s.key}
                    href={s.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={s.label}
                    title={s.label}
                    className="w-10 h-10 rounded-full border border-emerald-700 text-cream/70 flex items-center justify-center hover:border-gold hover:text-gold hover:-translate-y-0.5 transition-all duration-300"
                  >
                    {s.svg}
                  </a>
                ))}
              </div>
            </>
          )}
        </motion.div>

        {/* Quick links */}
        <motion.nav variants={fadeUp} aria-label={t('footerQuickLinks')}>
          <Heading>{t('footerQuickLinks')}</Heading>
          <ul className="space-y-2.5 text-sm">
            {quickLinks.map((l) => (
              <li key={l.to}>
                <Link to={l.to} className={linkClass}>
                  <Arrow />
                  {l.label}
                </Link>
              </li>
            ))}
            <li>
              <button onClick={cart.open} className={linkClass}>
                <Arrow />
                {t('enquiryList')}
                {cart.count > 0 && (
                  <span className="text-[11px] bg-gold/20 text-gold rounded-full px-1.5">{cart.count}</span>
                )}
              </button>
            </li>
          </ul>
        </motion.nav>

        {/* Our bells — from the live catalogue */}
        <motion.nav variants={fadeUp} aria-label={t('footerOurBells')}>
          <Heading>{t('footerOurBells')}</Heading>
          <ul className="space-y-2.5 text-sm">
            {bells.map((p) => (
              <li key={p.id}>
                <Link to={productPath(p)} className={linkClass}>
                  <Arrow />
                  {productName(p, lang)}
                </Link>
              </li>
            ))}
            <li>
              <Link to="/shop" className="text-gold/80 hover:text-gold text-sm">
                {t('viewFullCollection')} →
              </Link>
            </li>
          </ul>
        </motion.nav>

        {/* Contact */}
        <motion.div variants={fadeUp}>
          <Heading>{t('footerGetInTouch')}</Heading>
          <div className="space-y-3 text-sm text-cream/70">
            {(BUSINESS_NAME || ADDRESS_LINES.length > 0) && (
              <address className="not-italic leading-relaxed">
                {BUSINESS_NAME && <div className="text-cream">{BUSINESS_NAME}</div>}
                {ADDRESS_LINES.map((line) => (
                  <div key={line}>{line}</div>
                ))}
              </address>
            )}
            <a href={`tel:${PHONE_TEL}`} className="flex items-center gap-2.5 hover:text-gold transition-colors">
              <span className="w-8 h-8 rounded-full bg-emerald-800/60 flex items-center justify-center text-gold" aria-hidden>
                <svg {...icon} className="w-4 h-4">
                  <path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2" />
                </svg>
              </span>
              <span>
                <span className="block text-[11px] text-cream/40">{t('footerCall')}</span>
                {WHATSAPP_DISPLAY}
              </span>
            </a>
            <a
              href={WHATSAPP_WA_LINK(t('waFloatText'))}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2.5 hover:text-[#25D366] transition-colors"
            >
              <span className="w-8 h-8 rounded-full bg-emerald-800/60 flex items-center justify-center text-[#25D366]" aria-hidden>
                <svg {...icon} className="w-4 h-4">
                  <path d="M21 12a8 8 0 0 1-11.6 7.1L4 20l1-4.6A8 8 0 1 1 21 12z" />
                </svg>
              </span>
              <span>
                <span className="block text-[11px] text-cream/40">{t('footerWhatsApp')}</span>
                {WHATSAPP_DISPLAY}
              </span>
            </a>
            <a href={`mailto:${EMAIL}`} className="flex items-center gap-2.5 hover:text-gold transition-colors">
              <span className="w-8 h-8 rounded-full bg-emerald-800/60 flex items-center justify-center text-gold" aria-hidden>
                <svg {...icon} className="w-4 h-4">
                  <rect x="3" y="5" width="18" height="14" rx="2" />
                  <path d="m3 7 9 6 9-6" />
                </svg>
              </span>
              <span className="min-w-0">
                <span className="block text-[11px] text-cream/40">{t('footerEmail')}</span>
                <span className="break-all">{EMAIL}</span>
              </span>
            </a>
            {BUSINESS_HOURS && <p className="text-xs text-cream/45 pt-1">{BUSINESS_HOURS}</p>}
          </div>
        </motion.div>
      </motion.div>

      <div className="border-t border-emerald-800/80">
        <div className="max-w-6xl mx-auto px-5 py-5 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-cream/40">
          <p>
            © {new Date().getFullYear()} {t('brand')}. {t('rights')}
          </p>
          <p>{t('footerTagline')}</p>
        </div>
      </div>
    </footer>
  );
}
