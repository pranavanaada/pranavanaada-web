import { useState } from 'react';
import { useLang } from '../i18n/useLang';
import { Link } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import type { Product, ProductVariant } from '../types/product';
import { useCart } from '../hooks/useCart';
import {
  firstAvailableIndex,
  formatINR,
  getVariants,
  isProductAvailable,
  isVariantAvailable,
  hasVariants,
  productBadge,
  productDescription,
  productName,
  sizeLabel,
} from '../lib/productUtils';
import { fadeUp } from './motion';
import ImageLightbox from './ImageLightbox';
import VariantPicker from './VariantPicker';

interface Props {
  product: Product;
  onEnquire: (product: Product, variant?: ProductVariant) => void;
  /** Load the image immediately (for cards visible on first paint). */
  priority?: boolean;
}

/** Warm the browser cache with the full-size image before the detail page opens. */
function preloadImage(src: string) {
  const img = new Image();
  img.decoding = 'async';
  img.src = src;
}

export default function ProductCard({ product, onEnquire, priority = false }: Props) {
  const { t, lang } = useLang();
  const [loaded, setLoaded] = useState(false);
  const [zoomOpen, setZoomOpen] = useState(false);
  const cart = useCart();
  const variants = getVariants(product);
  const multi = hasVariants(product);
  // Start on the first weight that's in stock
  const [selected, setSelected] = useState(() => firstAvailableIndex(product));
  const variant = variants[Math.min(selected, variants.length - 1)];
  // "In list" reflects the currently selected weight
  const inCart = cart.has(product.id, multi ? variant : undefined);
  const name = productName(product, lang);
  const badge = productBadge(product, lang);
  const soldOut = !isProductAvailable(product);
  const available = isVariantAvailable(product, multi ? variant : undefined);

  return (
    <motion.div
      variants={fadeUp}
      whileHover={{ y: -6 }}
      transition={{ type: 'spring', stiffness: 300, damping: 24 }}
      className="group w-full bg-gradient-to-b from-emerald-800 to-emerald-900 border border-emerald-700 rounded-xl overflow-hidden hover:border-gold/60 hover:shadow-[0_18px_40px_-18px_rgba(201,162,75,0.45)] transition-[border-color,box-shadow] duration-300 flex flex-col"
    >
      <div className="relative aspect-square overflow-hidden bg-emerald-950">
        {/* Shimmer placeholder while the image loads */}
        {!loaded && <div className="absolute inset-0 shimmer" aria-hidden />}
        <Link
          to={`/shop/${product.id}`}
          onMouseEnter={() => preloadImage(product.image)}
          onFocus={() => preloadImage(product.image)}
          className="relative block w-full h-full"
        >
          {/* Photos are portrait (3:4) but the box is square: show the whole bell,
              and fill the sides with a blurred copy so the cloth continues. */}
          <img
            src={product.thumb || product.image}
            alt=""
            aria-hidden
            loading={priority ? 'eager' : 'lazy'}
            decoding="async"
            className={`absolute inset-0 w-full h-full object-cover scale-125 blur-2xl brightness-90 transition-opacity duration-700 ${
              loaded ? 'opacity-100' : 'opacity-0'
            }`}
          />
          <img
            src={product.thumb || product.image}
            alt={name}
            loading={priority ? 'eager' : 'lazy'}
            decoding="async"
            onLoad={() => setLoaded(true)}
            className={`relative w-full h-full object-contain transition-[transform,opacity] duration-700 ease-out group-hover:scale-105 ${
              soldOut ? 'grayscale-[60%] brightness-75' : ''
            } ${
              loaded ? 'opacity-100' : 'opacity-0'
            }`}
          />
        </Link>
        {soldOut && (
          <span className="absolute inset-x-0 bottom-0 bg-emerald-950/85 backdrop-blur text-cream text-xs font-semibold uppercase tracking-widest text-center py-2 pointer-events-none">
            {t('outOfStock')}
          </span>
        )}
        {badge && (
          <span className="absolute top-2 left-2 sm:top-3 sm:left-3 bg-emerald-950/85 backdrop-blur text-gold-light border border-gold/40 text-[9px] sm:text-[10px] font-bold uppercase tracking-wider px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-full pointer-events-none">
            {badge}
          </span>
        )}
        <button
          type="button"
          onClick={() => setZoomOpen(true)}
          aria-label={t('zoomProduct', { name })}
          className="absolute top-2 right-2 sm:top-3 sm:right-3 w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-emerald-950/70 backdrop-blur border border-emerald-700 text-cream flex items-center justify-center opacity-100 md:opacity-0 md:translate-y-1 group-hover:opacity-100 group-hover:translate-y-0 hover:border-gold hover:text-gold transition-all duration-300"
        >
          <ZoomIcon />
        </button>
      </div>
      <div className="p-2.5 sm:p-4 flex flex-col flex-1">
        <Link to={`/shop/${product.id}`} className="font-medium text-[13px] sm:text-sm leading-snug mb-1 line-clamp-2 hover:text-gold transition-colors">
          {name}
        </Link>
        {/* Price follows the chosen weight */}
        <div className="flex items-baseline gap-2 mb-1">
          <AnimatePresence mode="popLayout" initial={false}>
            <motion.span
              key={variant.price}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
              className="text-gold font-semibold"
            >
              {formatINR(variant.price)}
            </motion.span>
          </AnimatePresence>
        </div>
        {/* Description is on the product page; hidden on phones to keep cards compact */}
        <p className="hidden sm:block text-xs text-cream/60 leading-relaxed mb-3 flex-1 line-clamp-2">{productDescription(product, lang)}</p>
        <div className="flex-1 sm:hidden" aria-hidden />
        {multi && (
          <div className="mb-2.5 sm:mb-4">
            <VariantPicker
              variants={variants}
              selected={selected}
              onSelect={setSelected}
              layoutGroup={product.id}
            />
            {variant.size && <div className="hidden sm:block text-[11px] text-cream/40 mt-1.5">{sizeLabel(variant.size, lang)}</div>}
          </div>
        )}
        <div className="flex gap-1.5 sm:gap-2">
          {!available ? (
            <button
              type="button"
              disabled
              title={multi ? t('weightOutOfStock') : t('outOfStock')}
              className="flex-1 text-center leading-tight text-[10px] sm:text-xs font-semibold uppercase sm:tracking-wide py-2 sm:py-2.5 rounded-md border border-emerald-700 text-cream/40 cursor-not-allowed"
            >
              {t('outOfStock')}
            </button>
          ) : (
          <motion.button
            whileTap={{ scale: 0.96 }}
            onClick={() => (inCart ? cart.open() : cart.add(product, multi ? variant : undefined))}
            className={`flex-1 flex items-center justify-center gap-1.5 text-center leading-tight text-[11px] sm:text-xs font-semibold uppercase sm:tracking-wide py-2 sm:py-2.5 rounded-md transition-colors ${
              inCart
                ? 'border border-gold text-gold hover:bg-gold/10'
                : 'bg-gold text-emerald-950 hover:bg-gold-light'
            }`}
          >
            <AnimatePresence mode="wait" initial={false}>
              <motion.span
                key={inCart ? 'in' : 'add'}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.15 }}
              >
                {inCart ? (
                  `✓ ${t('inList')}`
                ) : (
                  <>
                    {/* Short label on phones where cards are narrow */}
                    <span className="sm:hidden">+ {t('addShort')}</span>
                    <span className="hidden sm:inline">+ {t('addToEnquiry')}</span>
                  </>
                )}
              </motion.span>
            </AnimatePresence>
          </motion.button>
          )}
          {/* Quick single-product enquiry */}
          <button
            onClick={() => onEnquire(product, multi ? variant : undefined)}
            aria-label={`${available ? t('enquireNow') : t('askAvailability')}: ${name}`}
            title={available ? t('enquireNow') : t('askAvailability')}
            className="shrink-0 w-8 sm:w-10 flex items-center justify-center rounded-md border border-emerald-700 text-cream/70 hover:border-gold hover:text-gold transition-colors"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4" aria-hidden>
              <path d="M21 12a8 8 0 0 1-11.6 7.1L4 20l1-4.6A8 8 0 1 1 21 12z" />
            </svg>
          </button>
        </div>
      </div>

      <ImageLightbox open={zoomOpen} src={product.image} alt={name} onClose={() => setZoomOpen(false)} />
    </motion.div>
  );
}

export function ZoomIcon({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className={className} aria-hidden>
      <circle cx="11" cy="11" r="7" />
      <path d="M21 21l-4.35-4.35M11 8v6M8 11h6" />
    </svg>
  );
}
