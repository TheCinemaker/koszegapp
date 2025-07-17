import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import hu from './locales/hu/translation.json';
import en from './locales/en/translation.json';
import de from './locales/de/translation.json';

i18n
  .use(initReactI18next)
  .init({
    resources: { hu: { translation: hu }, en: { translation: en }, de: { translation: de } },
    lng: 'hu',
    fallbackLng: 'hu',
    interpolation: { escapeValue: false }
  });

export default i18n;
