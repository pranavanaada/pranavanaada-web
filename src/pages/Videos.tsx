import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useLang } from '../i18n/useLang';
import { videos, type Video, type VideoCategory } from '../data/videos';
import { VideoCard, VideoModal } from '../components/Video';
import { Reveal } from '../components/motion';

const FILTERS: { key: VideoCategory | 'all'; labelKey: string }[] = [
  { key: 'all', labelKey: 'allVideos' },
  { key: 'bell', labelKey: 'catBell' },
  { key: 'talks', labelKey: 'catTalks' },
];

/** All videos from the original site, filterable by category. */
export default function Videos() {
  const { t } = useLang();
  const [filter, setFilter] = useState<VideoCategory | 'all'>('all');
  const [playing, setPlaying] = useState<Video | null>(null);
  const shown = filter === 'all' ? videos : videos.filter((v) => v.category === filter);

  return (
    <div className="max-w-6xl mx-auto px-5 py-14">
      <Reveal className="text-center mb-8">
        <h1 className="font-heading text-gold text-3xl mb-2">{t('videosTitle')}</h1>
        <p className="text-cream/50 text-sm max-w-xl mx-auto">{t('videosSubtitle')}</p>
      </Reveal>

      <Reveal delay={0.1} className="flex flex-wrap justify-center gap-2.5 mb-10">
        {FILTERS.map((f) => {
          const active = filter === f.key;
          const count = f.key === 'all' ? videos.length : videos.filter((v) => v.category === f.key).length;
          return (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className={`relative text-sm px-5 py-2.5 rounded-full border transition-colors ${
                active ? 'text-emerald-950 border-gold font-semibold' : 'border-emerald-700 text-cream/60 hover:border-gold/50'
              }`}
            >
              {active && (
                <motion.span
                  layoutId="video-filter-pill"
                  className="absolute inset-0 rounded-full bg-gold"
                  transition={{ type: 'spring', stiffness: 400, damping: 32 }}
                />
              )}
              <span className="relative">
                {t(f.labelKey)} <span className="opacity-60">({count})</span>
              </span>
            </button>
          );
        })}
      </Reveal>

      <motion.div layout className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        <AnimatePresence mode="popLayout">
          {shown.map((v, i) => (
            <motion.div
              key={v.id}
              layout
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96 }}
              transition={{ duration: 0.4, delay: Math.min(i, 9) * 0.04, ease: [0.22, 1, 0.36, 1] }}
            >
              <VideoCard video={v} onPlay={setPlaying} />
            </motion.div>
          ))}
        </AnimatePresence>
      </motion.div>

      <VideoModal video={playing} onClose={() => setPlaying(null)} />
    </div>
  );
}
