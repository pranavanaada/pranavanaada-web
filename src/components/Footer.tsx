import { WHATSAPP_DISPLAY, EMAIL } from '../config/contact';
import { useLang } from '../i18n/useLang';

export default function Footer() {
  const { t } = useLang();
  return (
    <footer className="border-t border-emerald-800 mt-20 pb-[calc(env(safe-area-inset-bottom,0px)+24px)]">
      <div className="max-w-6xl mx-auto px-5 py-10 text-center text-sm text-cream/60">
        <div className="font-heading text-gold text-lg mb-2">{t('brand')}</div>
        <p className="mb-3">{t('footerTagline')}</p>
        <p>
          {WHATSAPP_DISPLAY} &nbsp;·&nbsp; {EMAIL}
        </p>
        <p className="mt-6 text-xs text-cream/40">
          © {new Date().getFullYear()} {t('brand')}. {t('rights')}
        </p>
      </div>
    </footer>
  );
}
