import React, {
	createContext,
	useContext,
	useState,
	ReactNode,
	useEffect,
} from 'react';
import { LocalSettings } from '../types/LocalSettings';
import {
	readLocalSettings,
	writeLocalSettings,
} from '../tools/localSettingsAccess';
import i18n from '../i18n';
import { haveSameKeys } from '../tools/helpers';
import AsyncStorage from '@react-native-async-storage/async-storage';

type LocalSettingsContextType = {
	settings: LocalSettings;
	updateSettings: (newSettings: Partial<LocalSettings>) => Promise<void>;
	initial: boolean;
};

export const LocalSettingsContext = createContext<
	LocalSettingsContextType | undefined
>(undefined);

type LocalSettingsProviderProps = {
	children: ReactNode;
};

export const LocalSettingsProvider: React.FC<LocalSettingsProviderProps> = (
	props: LocalSettingsProviderProps
) => {
	const [isInitial, setInitial] = useState(true);
	const [settings, setSettings] = useState<LocalSettings>({
		userToken: '',
		locale: 'en',
		servers: ['https://api.sonalyze.de', 'https://api.dev.sonalyze.de'],
		// @TODO for now dev api is default
		currentServer: 'https://api.dev.sonalyze.de',
	});

	useEffect(() => {
		readLocalSettings().then(async (loadedSettings) => {
			// If the settings have changed, clear storage and apply defaults.
			if (!loadedSettings || !haveSameKeys(loadedSettings, settings)) {
				await AsyncStorage.clear();
				const newSettings = { ...settings };
				writeLocalSettings(newSettings);
				setSettings(newSettings);
				return;
			}

			console.log(loadedSettings);

			setInitial(false);
			setSettings(loadedSettings);
			i18n.changeLanguage(loadedSettings.locale);
		});
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);

	const updateLocalSettings = async (newSettings: Partial<LocalSettings>) => {
		const updatedSettings = { ...settings, ...newSettings };

		await writeLocalSettings(updatedSettings);
		setSettings(updatedSettings);

		// Update i18n language if locale is changed
		if (settings.locale !== updatedSettings.locale) {
			i18n.changeLanguage(updatedSettings.locale);
		}
	};

	return (
		<LocalSettingsContext.Provider
			value={{
				settings: settings,
				updateSettings: updateLocalSettings,
				initial: isInitial,
			}}
		>
			{props.children}
		</LocalSettingsContext.Provider>
	);
};

export const useLocalSettings = () => {
	const context = useContext(LocalSettingsContext);

	if (context === undefined) {
		throw new Error(
			'useLocalSettings must be used within a LocalSettingsProvider'
		);
	}

	return context;
};
