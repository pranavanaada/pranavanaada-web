import { useLang } from '../i18n/useLang';
import { Link } from 'react-router-dom';
import { motion, useScroll, useTransform } from 'framer-motion';
import { lazy, Suspense, useRef, useState } from 'react';
import { useProducts } from '../hooks/useProducts';
import { useScreenPaging } from '../hooks/useScreenPaging';
import ProductCard from '../components/ProductCard';
import InquiryModal from '../components/InquiryModal';
import { WhyChoose, JourneyCta } from '../components/HomeSections';
import RingTheBell from '../components/RingTheBell';
import HeroBells from '../components/HeroBells';
import CombosSection from '../components/CombosSection';
// Below the fold, and carries all review text + avatars — loaded as its own
// chunk so it doesn't slow the first paint of the home page.
const ReviewsSection = lazy(() => import('../components/ReviewsSection'));
const VideosSection = lazy(() => import('../components/VideosSection'));
import { Reveal, fadeUp, riseIn, stagger } from '../components/motion';
import { prefetchRoute } from './lazy';
import type { Product, ProductVariant } from '../types/product';
import { nameWithVariant } from '../lib/productUtils';
import { useSeo, organizationJsonLd, websiteJsonLd } from '../lib/seo';
import SEO_PAGES from '../seo-pages.json';

const iconProps = {
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 2,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
  className: 'w-5 h-5',
  'aria-hidden': true,
};

const BellIcon = () => (
  <svg {...iconProps}>
    <path d="M6 16V11a6 6 0 1 1 12 0v5l1.5 2h-15L6 16z" />
    <path d="M10 20a2 2 0 0 0 4 0M12 3v2" />
  </svg>
);

const FEATURES = [
  {
    key: 'featHandcrafted',
    icon: (
      <svg {...iconProps}>
        <path d="M18 11V6a2 2 0 0 0-4 0v5M14 10V4a2 2 0 0 0-4 0v6M10 10.5V6a2 2 0 0 0-4 0v8" />
        <path d="M18 8a2 2 0 1 1 4 0v6a8 8 0 0 1-8 8h-2c-2.8 0-4.5-.86-5.99-2.34l-3.6-3.6a2 2 0 0 1 2.83-2.82L7 15" />
      </svg>
    ),
  },
  {
    key: 'featPanchaloha',
    icon: (
      <svg {...iconProps}>
        <path d="M12 3l2.6 5.3 5.9.9-4.3 4.1 1 5.8L12 16.4l-5.2 2.7 1-5.8-4.3-4.1 5.9-.9L12 3z" />
      </svg>
    ),
  },
  { key: 'featCasting', icon: <BellIcon /> },
  {
    key: 'featShipping',
    icon: (
      <svg {...iconProps}>
        <path d="M3 6h11v10H3zM14 10h4l3 3v3h-7" />
        <circle cx="7" cy="17.5" r="1.8" />
        <circle cx="17" cy="17.5" r="1.8" />
      </svg>
    ),
  },
];

const CATEGORY_CHIPS = [
  {
    to: '/shop',
    labelKey: 'allProducts',
    icon: (
      <svg {...iconProps} className="w-4 h-4">
        <rect x="3" y="3" width="7" height="7" rx="1.5" />
        <rect x="14" y="3" width="7" height="7" rx="1.5" />
        <rect x="3" y="14" width="7" height="7" rx="1.5" />
        <rect x="14" y="14" width="7" height="7" rx="1.5" />
      </svg>
    ),
  },
  {
    to: '/shop?category=hand-bell',
    labelKey: 'handBells',
    icon: (
      <svg {...iconProps} className="w-4 h-4">
        <path d="M12 2v6M9.5 5h5M7 19l1-6a4 4 0 0 1 8 0l1 6H7zM11 22h2" />
      </svg>
    ),
  },
  {
    to: '/shop?category=hanging-bell',
    labelKey: 'hangingBells',
    icon: (
      <svg {...iconProps} className="w-4 h-4">
        <path d="M12 1v4M6 17V12a6 6 0 1 1 12 0v5l1.5 2h-15L6 17zM10 21a2 2 0 0 0 4 0" />
      </svg>
    ),
  },
  {
    to: '/shop?category=jayagante',
    labelKey: 'jayagante',
    icon: (
      <svg {...iconProps} className="w-4 h-4">
        <circle cx="12" cy="12" r="8" />
        <circle cx="12" cy="12" r="3" />
      </svg>
    ),
  },
];

export default function Home() {
  useSeo({ ...SEO_PAGES['/'], path: '/', jsonLd: [organizationJsonLd(), websiteJsonLd()] });
  const { t, lang } = useLang();
  const { products, loading } = useProducts();
  const [enquiryName, setEnquiryName] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  // Subtle parallax: hero content drifts up and fades as you scroll past it.
  const heroRef = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({ target: heroRef, offset: ['start start', 'end start'] });
  const heroY = useTransform(scrollYProgress, [0, 1], [0, 80]);
  const heroOpacity = useTransform(scrollYProgress, [0, 0.8], [1, 0]);

  // Laptops/desktops: one scroll moves one screen (hero → products → why choose → …)
  useScreenPaging();

  // Products the admin marked as featured; otherwise the first four.
  const flagged = products.filter((p) => p.featured);
  const featured = (flagged.length ? flagged : products).slice(0, 4);

  function openEnquiry(p: Product, v?: ProductVariant) {
    setEnquiryName(nameWithVariant(p, v, lang));
    setModalOpen(true);
  }

  return (
    <>
      {/* Hero — title and bell button on one side, floating bell showcase on the other */}
      <section ref={heroRef} className="snap-section relative overflow-hidden bg-[#013b2c]">
        {/* Soft vignette + warm glow behind the bells */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/25 via-black/5 to-emerald-950/80" aria-hidden />
        <motion.div
          className="absolute right-[-10%] lg:right-[5%] top-1/2 -translate-y-1/2 w-[640px] h-[640px] max-w-[150vw] bg-gold/10 rounded-full blur-3xl pointer-events-none"
          animate={{ scale: [1, 1.12, 1], opacity: [0.6, 1, 0.6] }}
          transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
          aria-hidden
        />

        <div className="relative max-w-6xl mx-auto px-5 pt-10 pb-14 lg:py-16 grid grid-cols-1 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)] gap-6 lg:gap-10 items-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
          className="lg:order-2"
        >
          <HeroBells />
        </motion.div>

        <motion.div
          style={{ y: heroY, opacity: heroOpacity }}
          variants={stagger(0.12, 0.2)}
          initial="hidden"
          animate="show"
          className="relative w-full min-w-0 text-center lg:order-1"
        >
          <motion.div variants={fadeUp} className="text-xs uppercase tracking-[0.25em] text-gold-light mb-5">
            {t('heroEyebrow')}
          </motion.div>
          <motion.h1
            variants={riseIn}
            className="font-heading text-[clamp(1.5rem,calc((100vw-56px)/9.4),3rem)] sm:text-6xl md:text-7xl lg:text-5xl xl:text-6xl font-semibold sm:tracking-wide leading-tight whitespace-nowrap mb-5 text-cream drop-shadow-[0_4px_20px_rgba(0,0,0,0.6)]"
          >
            {t('heroTitle')}
          </motion.h1>
          <motion.p
            variants={riseIn}
            className="text-cream/85 text-base md:text-lg max-w-2xl mx-auto mb-9 leading-relaxed drop-shadow-[0_2px_10px_rgba(0,0,0,0.6)]"
          >
            {t('heroSubtitle')}
          </motion.p>

          {/* Ring the bell — plays the real recording with sound-synced rings */}
          <motion.div variants={fadeUp} className="mb-10">
            <RingTheBell />
          </motion.div>

          {/* Feature badges pill */}
          <motion.ul
            variants={fadeUp}
            className="inline-flex flex-wrap justify-center gap-x-7 gap-y-3 bg-cream/95 backdrop-blur rounded-3xl md:rounded-full px-6 md:px-9 py-4 shadow-[0_20px_50px_-20px_rgba(0,0,0,0.7)]"
          >
            {FEATURES.map((f) => (
              <li key={f.key} className="flex items-center gap-2 text-emerald-900 text-xs md:text-sm font-semibold uppercase tracking-wide">
                <span className="text-gold-dark">{f.icon}</span>
                {t(f.key)}
              </li>
            ))}
          </motion.ul>
        </motion.div>
        </div>
      </section>

      {/* Screen 2 on laptops: category chips + featured products */}
      <div className="snap-section snap-screen">
      {/* Category chips — jump straight into a filtered Shop */}
      <nav aria-label={t('shopByCategory')} className="bg-emerald-800 border-y border-emerald-700">
        <motion.div
          variants={stagger(0.07, 0.5)}
          initial="hidden"
          animate="show"
          className="max-w-5xl mx-auto px-5 py-4 lg:py-3 flex gap-3 overflow-x-auto md:flex-wrap md:justify-center [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          {CATEGORY_CHIPS.map((c) => (
            <motion.div key={c.to} variants={fadeUp} className="shrink-0">
              <Link
                to={c.to}
                onMouseEnter={() => prefetchRoute('/shop')}
                className="flex items-center gap-2 bg-cream text-emerald-900 text-sm font-semibold px-5 py-2.5 rounded-full shadow-md hover:bg-gold-light hover:-translate-y-0.5 hover:shadow-lg transition-all duration-300"
              >
                <span className="text-gold-dark">{c.icon}</span>
                {t(c.labelKey)}
              </Link>
            </motion.div>
          ))}
        </motion.div>
      </nav>

      {/* Featured products */}
      <section className="snap-fill home-featured w-full max-w-6xl mx-auto px-5 py-16 lg:py-5">
        <Reveal>
          <h2 className="font-heading text-gold text-2xl text-center mb-2">{t('products')}</h2>
          <p className="home-sub text-center text-cream/50 text-sm mb-10">{t('productsSubtitle')}</p>
        </Reveal>

        {loading ? (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-5">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="rounded-xl overflow-hidden border border-emerald-800">
                <div className="aspect-square shimmer" />
                <div className="p-4 space-y-2">
                  <div className="h-4 w-3/4 rounded shimmer" />
                  <div className="h-4 w-1/3 rounded shimmer" />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <motion.div
            className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-5"
            variants={stagger(0.1)}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: '0px 0px -60px 0px' }}
          >
            {featured.map((p, i) => (
              <ProductCard key={p.id} product={p} onEnquire={openEnquiry} priority={i < 2} />
            ))}
          </motion.div>
        )}

        <Reveal className="text-center mt-10 lg:mt-6">
          <Link to="/shop" className="group text-gold text-sm underline underline-offset-4 hover:text-gold-light">
            {t('viewFullCollection')}{' '}
            <span className="inline-block transition-transform duration-300 group-hover:translate-x-1">→</span>
          </Link>
        </Reveal>
      </section>
      </div>

      <div className="snap-section">
        <CombosSection
          onEnquire={(name) => {
            setEnquiryName(name);
            setModalOpen(true);
          }}
        />
      </div>

      <div className="snap-section snap-screen">
        <WhyChoose />
      </div>

      {/* Experience the Divine Sound — videos */}
      <div className="snap-section">
        <Suspense fallback={<div className="min-h-[520px]" />}>
          <VideosSection />
        </Suspense>
      </div>

      {/* Testimonials */}
      <div className="snap-section">
        <Suspense fallback={<div className="min-h-[420px]" />}>
          <ReviewsSection />
        </Suspense>
      </div>

      <div className="snap-section">
        <JourneyCta />
      </div>

      <InquiryModal
        open={modalOpen}
        productName={enquiryName}
        onClose={() => setModalOpen(false)}
      />
    </>
  );
}
