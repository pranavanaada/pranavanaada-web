import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useLang } from '../i18n/useLang';
import { videos, FEATURED_VIDEO_ID, type Video } from '../data/videos';
import { LitePlayer, VideoCard, VideoModal } from './Video';
import { Reveal, fadeUp, stagger } from './motion';
import RingTheBell from './RingTheBell';

/** Home page: "Experience the Divine Sound" — a featured video plus a few more. */
export default function VideosSection() {
  const { t } = useLang();
  const [playing, setPlaying] = useState<Video | null>(null);
  const featured = videos.find((v) => v.id === FEATURED_VIDEO_ID) ?? videos[0];
  const more = videos.filter((v) => v.category === 'bell' && v.id !== featured.id).slice(0, 4);

  return (
    <section className="border-t border-emerald-800 bg-gradient-to-b from-emerald-950/50 to-transparent">
      <div className="max-w-6xl mx-auto px-5 py-16">
        <Reveal className="text-center mb-10">
          <h2 className="font-heading text-gold text-2xl md:text-3xl mb-3">{t('soundTitle')}</h2>
          <p className="text-cream/60 max-w-2xl mx-auto leading-relaxed mb-8">{t('soundText')}</p>
          <RingTheBell variant="compact" />
        </Reveal>

        <Reveal className="max-w-4xl mx-auto mb-8">
          <LitePlayer video={featured} />
        </Reveal>

        <motion.div
          className="grid grid-cols-2 lg:grid-cols-4 gap-4"
          variants={stagger(0.08)}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: '0px 0px -60px 0px' }}
        >
          {more.map((v) => (
            <motion.div key={v.id} variants={fadeUp}>
              <VideoCard video={v} onPlay={setPlaying} />
            </motion.div>
          ))}
        </motion.div>

        <div className="text-center mt-8">
          <Link to="/videos" className="group text-gold text-sm underline underline-offset-4 hover:text-gold-light">
            {t('watchAllVideos', { count: videos.length })}{' '}
            <span className="inline-block transition-transform duration-300 group-hover:translate-x-1">→</span>
          </Link>
        </div>
      </div>

      <VideoModal video={playing} onClose={() => setPlaying(null)} />
    </section>
  );
}
