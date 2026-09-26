import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import en from './en';
import kn from './kn';

export const LANGUAGES = [
  { code: 'en', label: 'EN' },
  { code: 'kn', label: 'ಕನ್ನಡ' },
] as const;
export type Lang = (typeof LANGUAGES)[number]['code'];

const STORAGE_KEY = 'pranavanaada-lang';

function initialLanguage(): Lang {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved === 'en' || saved === 'kn') return saved;
  } catch {
    // Storage unavailable — fall through to the browser language.
  }
  return navigator.language?.toLowerCase().startsWith('kn') ? 'kn' : 'en';
}

i18n.use(initReactI18next).init({
  resources: { en: { translation: en }, kn: { translation: kn } },
  lng: initialLanguage(),
  fallbackLng: 'en',
  interpolation: { escapeValue: false },
});

// Keep <html lang> in sync (drives Kannada fonts in index.css) and remember the choice.
function applyLanguage(lng: string) {
  document.documentElement.lang = lng;
  try {
    localStorage.setItem(STORAGE_KEY, lng);
  } catch {
    // ignore
  }
}
applyLanguage(i18n.language);
i18n.on('languageChanged', applyLanguage);

export default i18n;
