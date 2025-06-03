import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import de from '../locales/de.json';
import en from '../locales/en.json';
import fr from '../locales/fr.json';
import tr from '../locales/tr.json';
import es from '../locales/es.json';
import it from '../locales/it.json';


export const languageResources = {
  de: { translation: de },
  en: { translation: en },
  fr: { translation: fr },
  tr: { translation: tr },
  es: { translation: es },
  it: { translation: it },
};


i18n.use(initReactI18next).init({
  compatibilityJSON: 'v4',
  lng: 'en',
  fallbackLng: 'en',
  resources: languageResources,
  interpolation: {
    escapeValue: false,
  },
});

export default i18n;
