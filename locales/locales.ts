type Locale = {
    name: string;
    nativeName: string;
}

type LocaleList = {
    [key: string]: Locale;
}

export const locales: LocaleList = {
    de: { name: "German", nativeName: "Deutsch" },
    en: { name: "English", nativeName: "English" },
    es: { name: "Spanish", nativeName: "Español" },
    fr: { name: "French", nativeName: "Français" },
    it: { name: "Italian", nativeName: "Italiano" },
    tr: { name: "Turkish", nativeName: "Türkçe" },
};

