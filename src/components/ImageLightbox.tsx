import { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { useLang } from '../i18n/useLang';

interface Props {
  open: boolean;
  src: string;
  alt: string;
  onClose: () => void;
}

const MIN_SCALE = 1;
const MAX_SCALE = 4;
const TAP_ZOOM = 2.5;

const clamp = (v: number, min: number, max: number) => Math.min(max, Math.max(min, v));

/**
 * Fullscreen image viewer. Tap/click to zoom in at that point (and again to
 * reset), drag to pan, scroll wheel or pinch to zoom, Esc to close.
 */
export default function ImageLightbox({ open, src, alt, onClose }: Props) {
  const { t } = useLang();
  const imgRef = useRef<HTMLImageElement>(null);
  const [view, setView] = useState({ scale: 1, x: 0, y: 0 });
  const [dragging, setDragging] = useState(false);
  const pointers = useRef(new Map<number, { x: number; y: number }>());
  const gesture = useRef({ moved: false, pinchDist: 0 });

  const reset = useCallback(() => setView({ scale: 1, x: 0, y: 0 }), []);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => {
    if (!open) return;
    reset();
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onCloseRef.current();
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener('keydown', onKey);
    };
  }, [open, reset]);

  // Keep the image from being panned completely out of view.
  const bounded = useCallback((scale: number, x: number, y: number) => {
    const img = imgRef.current;
    if (!img) return { scale, x, y };
    const maxX = (img.offsetWidth * (scale - 1)) / 2;
    const maxY = (img.offsetHeight * (scale - 1)) / 2;
    return { scale, x: clamp(x, -maxX, maxX), y: clamp(y, -maxY, maxY) };
  }, []);

  // Zoom to `nextScale` keeping the screen point (cx, cy) fixed under the cursor.
  const zoomAt = useCallback(
    (nextScale: number, cx: number, cy: number) => {
      setView((v) => {
        const img = imgRef.current;
        if (!img) return v;
        const scale = clamp(nextScale, MIN_SCALE, MAX_SCALE);
        const rect = img.getBoundingClientRect();
        const px = cx - (rect.left + rect.width / 2);
        const py = cy - (rect.top + rect.height / 2);
        const ratio = scale / v.scale;
        return bounded(scale, v.x - px * (ratio - 1), v.y - py * (ratio - 1));
      });
    },
    [bounded]
  );

  function onWheel(e: React.WheelEvent) {
    zoomAt(view.scale * (1 - e.deltaY * 0.0015), e.clientX, e.clientY);
  }

  function onPointerDown(e: React.PointerEvent) {
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    gesture.current.moved = false;
    if (pointers.current.size === 2) {
      const [a, b] = [...pointers.current.values()];
      gesture.current.pinchDist = Math.hypot(a.x - b.x, a.y - b.y);
    }
    setDragging(true);
  }

  function onPointerMove(e: React.PointerEvent) {
    const prev = pointers.current.get(e.pointerId);
    if (!prev) return;
    const dx = e.clientX - prev.x;
    const dy = e.clientY - prev.y;
    if (Math.abs(dx) + Math.abs(dy) > 2) gesture.current.moved = true;
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });

    if (pointers.current.size === 2) {
      const [a, b] = [...pointers.current.values()];
      const dist = Math.hypot(a.x - b.x, a.y - b.y);
      if (gesture.current.pinchDist > 0) {
        zoomAt(view.scale * (dist / gesture.current.pinchDist), (a.x + b.x) / 2, (a.y + b.y) / 2);
      }
      gesture.current.pinchDist = dist;
    } else if (view.scale > 1) {
      setView((v) => bounded(v.scale, v.x + dx, v.y + dy));
    }
  }

  function onPointerUp(e: React.PointerEvent) {
    const wasPinch = pointers.current.size > 1;
    pointers.current.delete(e.pointerId);
    if (pointers.current.size < 2) gesture.current.pinchDist = 0;
    if (pointers.current.size === 0) setDragging(false);

    // A tap (no movement) toggles zoom at the tapped point.
    if (!wasPinch && !gesture.current.moved && pointers.current.size === 0) {
      if (view.scale > 1) reset();
      else zoomAt(TAP_ZOOM, e.clientX, e.clientY);
    }
  }

  // Portal to <body> so `position: fixed` isn't trapped by an animated
  // (transformed) ancestor such as a hovering product card.
  return createPortal(
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[60] bg-black/90 backdrop-blur-sm flex items-center justify-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25 }}
          role="dialog"
          aria-modal="true"
          aria-label={alt}
        >
          {/* Backdrop click closes */}
          <div className="absolute inset-0" onClick={onClose} />

          <motion.div
            className="relative max-w-[92vw] max-h-[85vh] overflow-hidden rounded-lg select-none"
            style={{ touchAction: 'none' }}
            initial={{ scale: 0.92, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            onWheel={onWheel}
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
            onPointerCancel={onPointerUp}
          >
            <img
              ref={imgRef}
              src={src}
              alt={alt}
              draggable={false}
              className="block max-w-[92vw] max-h-[85vh] object-contain"
              style={{
                transform: `translate(${view.x}px, ${view.y}px) scale(${view.scale})`,
                transition: dragging ? 'none' : 'transform 0.3s cubic-bezier(0.22, 1, 0.36, 1)',
                cursor: view.scale > 1 ? (dragging ? 'grabbing' : 'zoom-out') : 'zoom-in',
              }}
            />
          </motion.div>

          {/* Controls */}
          <div className="absolute top-4 right-4 flex gap-2">
            <LightboxButton label={t('zoomOut')} onClick={() => setView((v) => bounded(Math.max(MIN_SCALE, v.scale - 0.75), v.x, v.y))}>
              −
            </LightboxButton>
            <LightboxButton label={t('zoomIn')} onClick={() => setView((v) => bounded(Math.min(MAX_SCALE, v.scale + 0.75), v.x, v.y))}>
              +
            </LightboxButton>
            <LightboxButton label={t('close')} onClick={onClose}>
              ✕
            </LightboxButton>
          </div>
          <p className="absolute bottom-5 left-0 right-0 text-center text-xs text-cream/50 pointer-events-none px-4">
            {t('zoomHint')}
          </p>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  );
}

function LightboxButton({
  label,
  onClick,
  children,
}: {
  label: string;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      aria-label={label}
      onClick={onClick}
      className="w-10 h-10 rounded-full bg-emerald-900/80 border border-emerald-700 text-cream text-lg flex items-center justify-center hover:border-gold hover:text-gold transition-colors"
    >
      {children}
    </button>
  );
}
