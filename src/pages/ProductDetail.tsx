import { useParams, Link, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { useLang } from '../i18n/useLang';
import { AnimatePresence, motion } from 'framer-motion';
import { useProducts } from '../hooks/useProducts';
import { useCart } from '../hooks/useCart';
import { QtyStepper } from '../components/CartDrawer';
import InquiryModal from '../components/InquiryModal';
import ImageLightbox from '../components/ImageLightbox';
import VariantPicker from '../components/VariantPicker';
import RingTheBell from '../components/RingTheBell';
import { ZoomIcon } from '../components/ProductCard';
import { fadeUp, stagger } from '../components/motion';
import {
  formatINR,
  getGallery,
  getVariants,
  firstAvailableIndex,
  hasVariants,
  isVariantAvailable,
  nameWithVariant,
  productBadge,
  productDescription,
  productName,
  sizeLabel,
  weightLabel,
} from '../lib/productUtils';

export default function ProductDetail() {
  const { id } = useParams();
  const { t, lang } = useLang();
  const { products, loading } = useProducts();
  const [modalOpen, setModalOpen] = useState(false);
  const [zoomOpen, setZoomOpen] = useState(false);
  const [qty, setQty] = useState(1);
  // null until the visitor picks a weight — then we default to the first in-stock one
  const [selectedPick, setSelected] = useState<number | null>(null);
  const [photo, setPhoto] = useState(0);
  const cart = useCart();
  const navigate = useNavigate();

  const product = products.find((p) => p.id === id);

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto px-5 py-14 grid grid-cols-1 md:grid-cols-2 gap-10">
        <div className="aspect-square rounded-xl shimmer" />
        <div className="space-y-4 pt-6">
          <div className="h-8 w-2/3 rounded shimmer" />
          <div className="h-6 w-1/4 rounded shimmer" />
          <div className="h-20 w-full rounded shimmer" />
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="text-center py-24">
        <p className="text-cream/60 mb-4">{t('productNotFound')}</p>
        <Link to="/shop" className="text-gold underline">
          {t('backToShop')}
        </Link>
      </div>
    );
  }

  const variants = getVariants(product);
  const multi = hasVariants(product);
  const selected = selectedPick ?? firstAvailableIndex(product);
  const variant = variants[Math.min(selected, variants.length - 1)];
  const available = isVariantAvailable(product, multi ? variant : undefined);
  const gallery = getGallery(product);
  // The video (if any) sits after the photos: index === gallery.length.
  const showVideo = !!product.video && photo === gallery.length;
  const currentPhoto = gallery[Math.min(photo, gallery.length - 1)];
  // Everything of this product in the list, across all weights
  const inList = cart.items.filter((i) => i.id === product.id);
  const name = productName(product, lang);

  return (
    <div className="max-w-5xl mx-auto px-5 py-14 grid grid-cols-1 md:grid-cols-2 gap-10 items-start">
      <motion.div
        initial={{ opacity: 0, scale: 0.97 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className="md:sticky md:top-24"
      >
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={showVideo ? 'video' : currentPhoto}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            {showVideo && product.video ? (
              // Only downloaded once the visitor picks the video thumbnail.
              <video
                src={product.video}
                poster={product.image}
                autoPlay
                muted
                loop
                playsInline
                // No play/pause bar — it just plays on a loop, like a moving photo
                disablePictureInPicture
                disableRemotePlayback
                preload="auto"
                className="block w-full aspect-[3/4] object-contain rounded-xl border border-emerald-800 bg-[#013b2c]"
                aria-label={t('productVideo', { name })}
              />
            ) : (
              <MagnifyImage
                src={currentPhoto}
                placeholder={currentPhoto === product.image ? product.thumb ?? undefined : undefined}
                alt={name}
                badge={productBadge(product, lang)}
                onOpen={() => setZoomOpen(true)}
              />
            )}
          </motion.div>
        </AnimatePresence>

        {(gallery.length > 1 || product.video) && (
          <div className="flex flex-wrap gap-3 mt-3">
            {gallery.map((src, i) => {
              const active = !showVideo && src === currentPhoto;
              return (
                <button
                  key={src}
                  type="button"
                  onClick={() => setPhoto(i)}
                  aria-label={t('photoOf', { n: i + 1, total: gallery.length })}
                  aria-current={active}
                  className={`w-20 h-20 rounded-lg overflow-hidden border-2 transition-all ${
                    active ? 'border-gold' : 'border-emerald-800 opacity-60 hover:opacity-100'
                  }`}
                >
                  <img src={i === 0 && product.thumb ? product.thumb : src} alt="" className="w-full h-full object-cover" />
                </button>
              );
            })}
            {product.video && (
              <button
                type="button"
                onClick={() => setPhoto(gallery.length)}
                aria-label={t('productVideo', { name })}
                aria-current={showVideo}
                className={`relative w-20 h-20 rounded-lg overflow-hidden border-2 transition-all ${
                  showVideo ? 'border-gold' : 'border-emerald-800 opacity-70 hover:opacity-100'
                }`}
              >
                <img src={product.thumb || product.image} alt="" className="w-full h-full object-cover brightness-75" />
                <span className="absolute inset-0 flex items-center justify-center">
                  <span className="w-8 h-8 rounded-full bg-emerald-950/80 border border-gold text-gold flex items-center justify-center">
                    <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 translate-x-[1px]" fill="currentColor" aria-hidden>
                      <path d="M8 5v14l11-7z" />
                    </svg>
                  </span>
                </span>
              </button>
            )}
          </div>
        )}
      </motion.div>

      <motion.div variants={stagger(0.08, 0.15)} initial="hidden" animate="show">
        <motion.div variants={fadeUp}>
          <Link to="/shop" className="text-xs text-cream/50 hover:text-gold transition-colors">
            {t('backToShop')}
          </Link>
        </motion.div>
        <motion.h1 variants={fadeUp} className="font-heading text-3xl mt-3 mb-2">
          {name}
        </motion.h1>
        <motion.div variants={fadeUp} className="h-9 mb-4 overflow-hidden">
          <AnimatePresence mode="popLayout" initial={false}>
            <motion.div
              key={variant.price}
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -14 }}
              transition={{ duration: 0.2 }}
              className="text-gold text-2xl font-semibold"
            >
              {formatINR(variant.price)}
            </motion.div>
          </AnimatePresence>
        </motion.div>
        <motion.p variants={fadeUp} className="text-cream/70 leading-relaxed mb-7">
          {productDescription(product, lang)}
        </motion.p>
        <motion.div variants={fadeUp} className="mb-7">
          <RingTheBell variant="compact" />
        </motion.div>

        {multi && (
          <motion.div variants={fadeUp} className="mb-6">
            <div className="text-xs uppercase tracking-wider text-cream/50 mb-2">{t('weight')}</div>
            <VariantPicker
              variants={variants}
              selected={selected}
              onSelect={setSelected}
              layoutGroup={`detail-${product.id}`}
              size="md"
            />
            {/* Full size table so all options can be compared at a glance */}
            <table className="w-full mt-4 text-sm border border-emerald-800 rounded-lg overflow-hidden">
              <thead>
                <tr className="bg-emerald-950/60 text-[11px] uppercase tracking-wider text-cream/40 text-left">
                  <th className="px-3 py-2 font-medium">{t('weight')}</th>
                  <th className="px-3 py-2 font-medium">{t('size')}</th>
                  <th className="px-3 py-2 font-medium text-right">{t('price')}</th>
                </tr>
              </thead>
              <tbody>
                {variants.map((v, i) => (
                  <tr
                    key={v.label}
                    onClick={() => setSelected(i)}
                    className={`cursor-pointer border-t border-emerald-800 transition-colors ${
                      i === selected ? 'bg-gold/10 text-cream' : 'text-cream/60 hover:bg-emerald-800/40'
                    }`}
                  >
                    <td className="px-3 py-2 font-medium">{weightLabel(v.label, lang)}</td>
                    <td className="px-3 py-2">{sizeLabel(v.size, lang) || '—'}</td>
                    <td className="px-3 py-2 text-right tabular-nums text-gold">{formatINR(v.price)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </motion.div>
        )}

        <motion.div variants={fadeUp} className="mb-5">
          <div className="text-xs uppercase tracking-wider text-cream/50 mb-2">{t('quantity')}</div>
          <QtyStepper value={qty} onChange={setQty} size="md" />
        </motion.div>
        <motion.div variants={fadeUp} className="flex flex-wrap gap-3">
          {available ? (
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => cart.add(product, multi ? variant : undefined, qty)}
              className="bg-gold text-emerald-950 px-8 py-3.5 rounded-md text-sm font-semibold uppercase tracking-wide hover:bg-gold-light transition-colors shadow-[0_10px_30px_-12px_rgba(201,162,75,0.6)]"
            >
              + {t('addToEnquiry')}
            </motion.button>
          ) : null}
          {available && (
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => {
                cart.add(product, multi ? variant : undefined, qty);
                cart.close();
                navigate('/checkout');
              }}
              className="border border-gold bg-gold/10 text-gold px-8 py-3.5 rounded-md text-sm font-semibold uppercase tracking-wide hover:bg-gold hover:text-emerald-950 transition-colors"
            >
              {t('buyNow')}
            </motion.button>
          )}
          {available ? null : (
            <div className="px-6 py-3.5 rounded-md border border-red-400/40 bg-red-400/10 text-red-200 text-sm font-semibold">
              {multi && product.in_stock !== false ? t('weightOutOfStock') : t('outOfStock')}
            </div>
          )}
          <button
            onClick={() => setModalOpen(true)}
            className="border border-gold text-gold px-8 py-3.5 rounded-md text-sm font-semibold uppercase tracking-wide hover:bg-gold/10 transition-colors"
          >
            {available ? t('enquireNow') : t('askAvailability')}
          </button>
        </motion.div>
        <AnimatePresence>
          {inList.length > 0 && (
            <motion.p
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="text-xs text-cream/60 mt-4"
            >
              {t('inYourList')}{' '}
              {inList.map((i) => `${i.variant ? `${weightLabel(i.variant, lang)} × ` : '× '}${i.qty}`).join(', ')} ·{' '}
              <button onClick={cart.open} className="text-gold underline underline-offset-2">
                {t('viewList')}
              </button>
            </motion.p>
          )}
        </AnimatePresence>
      </motion.div>

      <InquiryModal
        open={modalOpen}
        productName={nameWithVariant(product, multi ? variant : undefined, lang)}
        onClose={() => setModalOpen(false)}
      />
      <ImageLightbox open={zoomOpen} src={currentPhoto} alt={name} onClose={() => setZoomOpen(false)} />
    </div>
  );
}

/**
 * Product image with a hover magnifier on desktop (the image zooms toward the
 * cursor) and click/tap to open the fullscreen zoom viewer.
 */
function MagnifyImage({
  src,
  placeholder,
  alt,
  badge,
  onOpen,
}: {
  src: string;
  placeholder?: string;
  alt: string;
  badge?: string | null;
  onOpen: () => void;
}) {
  const { t } = useLang();
  const [origin, setOrigin] = useState('50% 50%');
  const [hovering, setHovering] = useState(false);
  const [fullLoaded, setFullLoaded] = useState(false);

  function onMove(e: React.PointerEvent<HTMLButtonElement>) {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setOrigin(`${x}% ${y}%`);
  }

  return (
    <button
      type="button"
      onClick={onOpen}
      // Mouse only — on touch screens a tap should open the viewer, not magnify.
      onPointerMove={(e) => e.pointerType === 'mouse' && onMove(e)}
      onPointerEnter={(e) => e.pointerType === 'mouse' && setHovering(true)}
      onPointerLeave={() => setHovering(false)}
      aria-label={t('zoomProduct', { name: alt })}
      className="group relative block w-full aspect-[3/4] rounded-xl overflow-hidden bg-emerald-950 border border-emerald-800 cursor-zoom-in"
    >
      {/* The thumb is usually already cached from the card, so it shows
          instantly (slightly blurred) while the full-size image loads. */}
      {/* Blurred copy fills any space around photos that aren't 3:4 (e.g. the gong on its own) */}
      <img src={placeholder || src} alt="" aria-hidden className="absolute inset-0 w-full h-full object-cover scale-125 blur-2xl brightness-90" />
      {placeholder && !fullLoaded && (
        <img src={placeholder} alt="" aria-hidden className="absolute inset-0 w-full h-full object-contain blur-sm" />
      )}
      <img
        src={src}
        alt={alt}
        decoding="async"
        onLoad={() => setFullLoaded(true)}
        className={`relative w-full h-full object-contain transition-[transform,opacity] duration-300 ease-out ${
          fullLoaded ? 'opacity-100' : 'opacity-0'
        }`}
        style={{ transformOrigin: origin, transform: hovering ? 'scale(2)' : 'scale(1)' }}
      />
      {badge && (
        <span className="absolute top-3 left-3 bg-emerald-950/85 backdrop-blur text-gold-light border border-gold/40 text-[11px] font-bold uppercase tracking-wider px-3 py-1 rounded-full pointer-events-none">
          {badge}
        </span>
      )}
      <span className="absolute bottom-3 right-3 flex items-center gap-1.5 text-[11px] uppercase tracking-wider bg-emerald-950/75 backdrop-blur border border-emerald-700 text-cream/80 px-3 py-1.5 rounded-full pointer-events-none group-hover:opacity-0 transition-opacity">
        <ZoomIcon className="w-3.5 h-3.5" /> {t('tapToZoom')}
      </span>
    </button>
  );
}
