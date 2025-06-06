type Locale = {
	name: string;
	nativeName: string;
};

type LocaleList = {
	[key: string]: Locale;
};

export const locales: LocaleList = {
	//de: { name: "German", nativeName: "Deutsch" },
	en: { name: 'English', nativeName: 'English' },
	//fr: { name: "French", nativeName: "Français" },
	//tr: { name: "Turkish", nativeName: "Türkçe" },
};
