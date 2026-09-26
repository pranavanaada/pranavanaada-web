import { WHATSAPP_WA_LINK } from '../config/contact';
import { useLang } from '../i18n/useLang';

export default function FloatingWhatsApp() {
  const { t } = useLang();
  return (
    <a
      href={WHATSAPP_WA_LINK(t('waFloatText'))}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={t('chatOnWhatsApp')}
      className="fixed z-40 right-5 w-14 h-14 rounded-full bg-[#25D366] text-white flex items-center justify-center text-2xl shadow-lg shadow-black/30 hover:scale-105 transition-transform"
      style={{ bottom: 'calc(env(safe-area-inset-bottom, 0px) + 20px)' }}
    >
      💬
    </a>
  );
}
