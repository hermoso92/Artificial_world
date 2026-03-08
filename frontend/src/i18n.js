import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

import es from './locales/es/translation.json';
import en from './locales/en/translation.json';
import fr from './locales/fr/translation.json';
import de from './locales/de/translation.json';
import pt from './locales/pt/translation.json';

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      es: { translation: es },
      en: { translation: en },
      fr: { translation: fr },
      de: { translation: de },
      pt: { translation: pt },
    },
    fallbackLng: 'es',
    supportedLngs: ['es', 'en', 'fr', 'de', 'pt'],
    detection: {
      order: ['localStorage', 'navigator', 'htmlTag'],
      caches: ['localStorage'],
      lookupLocalStorage: 'aw_language',
    },
    interpolation: {
      escapeValue: false,
    },
  });

export default i18n;
