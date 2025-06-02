import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import de from '../locales/de.json';
import en from '../locales/en.json';

export const languageResources = {
    de: { translation: de },
    en: { translation: en },
};

i18n.use(initReactI18next).init({
    compatibilityJSON: 'v4',
    lng: 'en',
    fallbackLng: 'en',
    resources: languageResources,
});

export default i18n;