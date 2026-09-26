import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { useLang } from '../i18n/useLang';
import { thumbnail, type Video } from '../data/videos';

// youtube-nocookie avoids YouTube tracking cookies until the visitor presses play.
const embedUrl = (id: string) => `https://www.youtube-nocookie.com/embed/${id}?autoplay=1&rel=0&modestbranding=1`;
export const watchUrl = (id: string) => `https://www.youtube.com/watch?v=${id}`;

function PlayIcon({ className = 'w-14 h-14' }: { className?: string }) {
  return (
    <span
      className={`${className} rounded-full bg-emerald-950/75 backdrop-blur border-2 border-gold/80 text-gold flex items-center justify-center shadow-xl transition-transform duration-300 group-hover:scale-110`}
      aria-hidden
    >
      <svg viewBox="0 0 24 24" className="w-1/2 h-1/2 translate-x-[8%]" fill="currentColor">
        <path d="M8 5v14l11-7z" />
      </svg>
    </span>
  );
}

/**
 * Lightweight inline player: shows the thumbnail and only loads YouTube's
 * iframe (≈1 MB of scripts) once the visitor presses play.
 */
export function LitePlayer({ video }: { video: Video }) {
  const { t } = useLang();
  const [playing, setPlaying] = useState(false);

  return (
    <div className="relative aspect-video rounded-xl overflow-hidden border border-emerald-700 bg-black shadow-2xl">
      {playing ? (
        <iframe
          src={embedUrl(video.id)}
          title={video.title}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          className="absolute inset-0 w-full h-full"
        />
      ) : (
        <button
          type="button"
          onClick={() => setPlaying(true)}
          aria-label={t('playVideo', { title: video.title })}
          className="group absolute inset-0 w-full h-full"
        >
          <img
            src={thumbnail(video.id, 'sd')}
            alt=""
            loading="lazy"
            decoding="async"
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
          />
          <span className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
          <span className="absolute inset-0 flex items-center justify-center">
            <PlayIcon className="w-16 h-16 md:w-20 md:h-20" />
          </span>
          <span className="absolute left-4 right-4 bottom-3 text-left text-sm md:text-base text-cream line-clamp-2 drop-shadow">
            {video.title}
          </span>
        </button>
      )}
    </div>
  );
}

/** Thumbnail card that opens the video in a pop-up player. */
export function VideoCard({ video, onPlay }: { video: Video; onPlay: (v: Video) => void }) {
  const { t } = useLang();
  return (
    <button
      type="button"
      onClick={() => onPlay(video)}
      aria-label={t('playVideo', { title: video.title })}
      className="group w-full text-left rounded-xl overflow-hidden border border-emerald-700 bg-emerald-800/40 hover:border-gold/60 hover:-translate-y-1 hover:shadow-[0_18px_40px_-18px_rgba(201,162,75,0.45)] transition-all duration-300"
    >
      <div className="relative aspect-video bg-black overflow-hidden">
        <img
          src={thumbnail(video.id, 'mq')}
          alt=""
          loading="lazy"
          decoding="async"
          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
        />
        <span className="absolute inset-0 flex items-center justify-center bg-black/10 group-hover:bg-black/0 transition-colors">
          <PlayIcon className="w-11 h-11" />
        </span>
      </div>
      <div className="p-3">
        <div className="text-sm text-cream leading-snug line-clamp-2">{video.title}</div>
        <div className="text-xs text-cream/45 mt-1 truncate">{video.channel}</div>
      </div>
    </button>
  );
}

/** Pop-up YouTube player. */
export function VideoModal({ video, onClose }: { video: Video | null; onClose: () => void }) {
  const { t } = useLang();
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => {
    if (!video) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onCloseRef.current();
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener('keydown', onKey);
    };
  }, [video]);

  return createPortal(
    <AnimatePresence>
      {video && (
        <motion.div
          className="fixed inset-0 z-[60] bg-black/85 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={onClose}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label={video.title}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-4xl"
            initial={{ opacity: 0, scale: 0.94 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.96 }}
            transition={{ type: 'spring', stiffness: 360, damping: 30 }}
          >
            <div className="flex items-start justify-between gap-4 mb-3">
              <div className="min-w-0">
                <div className="text-cream text-sm md:text-base leading-snug line-clamp-2">{video.title}</div>
                <div className="text-xs text-cream/50 mt-0.5">{video.channel}</div>
              </div>
              <button
                onClick={onClose}
                aria-label={t('close')}
                className="shrink-0 w-10 h-10 rounded-full bg-emerald-900/80 border border-emerald-700 text-cream flex items-center justify-center hover:border-gold hover:text-gold transition-colors"
              >
                ✕
              </button>
            </div>
            <div className="relative aspect-video rounded-xl overflow-hidden bg-black shadow-2xl">
              <iframe
                src={embedUrl(video.id)}
                title={video.title}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                className="absolute inset-0 w-full h-full"
              />
            </div>
            <a
              href={watchUrl(video.id)}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block mt-3 text-xs text-gold underline underline-offset-4"
            >
              {t('watchOnYouTube')} ↗
            </a>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  );
}
