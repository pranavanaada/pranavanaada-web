import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { WHATSAPP_WA_LINK, WHATSAPP_DISPLAY } from '../config/contact';
import { useSeo } from '../lib/seo';

export default function ThankYouEnquiry() {
  useSeo({ title: 'Enquiry received | Pranavanaada', path: '/thank-you-enquiry', noindex: true });

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-5 py-16">
      <div className="max-w-lg w-full text-center">

        {/* Animated bell icon */}
        <motion.div
          className="w-24 h-24 mx-auto rounded-full bg-gold/15 border-2 border-gold flex items-center justify-center mb-8"
          initial={{ scale: 0, rotate: -20 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: 'spring', stiffness: 240, damping: 16 }}
        >
          <motion.span
            className="text-4xl select-none"
            animate={{ rotate: [0, -18, 18, -10, 10, 0] }}
            transition={{ delay: 0.6, duration: 1.2, ease: 'easeInOut' }}
            aria-hidden
          >
            🔔
          </motion.span>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <h1 className="font-heading text-gold text-3xl md:text-4xl mb-3">
            Thank You!
          </h1>
          <p className="text-cream/80 text-lg mb-2">
            We've received your enquiry.
          </p>
          <p className="text-cream/55 text-sm max-w-md mx-auto mb-10 leading-relaxed">
            Our team will get back to you within one business day with details on sizes, prices and availability. If you need a faster reply, feel free to reach us on WhatsApp.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="rounded-xl border border-emerald-700 bg-emerald-800/40 p-6 mb-8 text-left space-y-4"
        >
          <div className="flex items-start gap-3">
            <span className="w-8 h-8 rounded-full bg-gold/15 text-gold flex items-center justify-center shrink-0 text-sm mt-0.5">✓</span>
            <div>
              <div className="text-cream/90 text-sm font-medium">Enquiry saved</div>
              <div className="text-cream/50 text-xs">We've noted your interest and will prepare the best options for you.</div>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <span className="w-8 h-8 rounded-full bg-gold/15 text-gold flex items-center justify-center shrink-0 text-sm mt-0.5">✉</span>
            <div>
              <div className="text-cream/90 text-sm font-medium">Confirmation email sent</div>
              <div className="text-cream/50 text-xs">Check your inbox (and spam folder) for a copy of your enquiry.</div>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="space-y-4"
        >
          <a
            href={WHATSAPP_WA_LINK('Hi, I just submitted an enquiry on your website and would like to know more.')}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 w-full bg-[#25D366] text-white py-3 rounded-md text-sm font-semibold hover:bg-[#1db954] transition-colors"
          >
            <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5" aria-hidden>
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 0 0-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z" />
            </svg>
            Chat on WhatsApp · {WHATSAPP_DISPLAY}
          </a>

          <div className="flex gap-3">
            <Link
              to="/shop"
              className="flex-1 py-3 rounded-md border border-gold text-gold text-sm font-semibold text-center hover:bg-gold/10 transition-colors"
            >
              Browse Bells
            </Link>
            <Link
              to="/"
              className="flex-1 py-3 rounded-md border border-emerald-600 text-cream/70 text-sm font-semibold text-center hover:border-gold hover:text-cream transition-colors"
            >
              Back to Home
            </Link>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
