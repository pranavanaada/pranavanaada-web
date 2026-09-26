import { useTranslation } from 'react-i18next';
import type { Lang } from '../lib/productUtils';

/** Current UI language ('en' | 'kn') plus the i18n `t` function. */
export function useLang() {
  const { t, i18n } = useTranslation();
  const lang: Lang = i18n.language === 'kn' ? 'kn' : 'en';
  return { t, lang, i18n };
}
