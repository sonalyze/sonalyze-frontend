import React, {
	createContext,
	useContext,
	useState,
	useEffect,
	ReactNode,
} from 'react';
import { LocalSettings } from '../types/LocalSettings';
import {
	readLocalSettings,
	writeLocalSettings,
} from '../tools/localSettingsAccess';
import i18n from '../i18n';
import { axiosClient, haveSameKeys } from '../tools/helpers';
import { register } from '../api/userRequests';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Haptics from 'expo-haptics';
import { toast } from 'sonner-native';
import { useTranslation } from 'react-i18next';

type LocalSettingsContextType = {
	settings: LocalSettings;
	updateSettings: (newSettings: Partial<LocalSettings>) => Promise<void>;
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
	const [settings, setSettings] = useState<LocalSettings>({
		userToken: '',
		locale: 'en',
		servers: ['https://api.dev.sonalyze.de', 'https://api.sonalyze.de'],
		currentServer: 'https://api.dev.sonalyze.de', // @TODO for now dev api is default
	});
	const { t } = useTranslation();

	useEffect(() => {
		readLocalSettings().then(async (loadedSettings) => {
			if (loadedSettings && haveSameKeys(loadedSettings, settings)) {
				setSettings(loadedSettings);
				i18n.changeLanguage(loadedSettings.locale);
				axiosClient.defaults.headers.common['Authorization'] =
					`Bearer ${loadedSettings.userToken}`;
				axiosClient.defaults.baseURL = loadedSettings.currentServer;
			} else {
				AsyncStorage.clear();
				const res = await register();
				const newSettings = { ...settings, ...{ userToken: res.id } };
				axiosClient.defaults.headers.common['Authorization'] =
					`Bearer ${res.id}`;
				writeLocalSettings(newSettings);
				setSettings(newSettings);
				console.log(newSettings);
			}
		});
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);

	const updateLocalSettings = async (newSettings: Partial<LocalSettings>) => {
		const updatedSettings = { ...settings, ...newSettings };

		await writeLocalSettings(updatedSettings);

		// Update i18n language if locale is changed
		if (newSettings.locale && newSettings.locale !== settings.locale) {
			i18n.changeLanguage(newSettings.locale);
		}

		if (
			newSettings.currentServer &&
			newSettings.currentServer !== settings.currentServer
		) {
			axiosClient.defaults.baseURL = newSettings.currentServer;
			try {
				const res = await register();
				updatedSettings.userToken = res.id;
				axiosClient.defaults.headers.common['Authorization'] =
					`Bearer ${res.id}`;
			} catch (err) {
				console.error(err);
				updatedSettings.currentServer = settings.currentServer;
				toast.error(t('serverMigrationError'));
				Haptics.notificationAsync(
					Haptics.NotificationFeedbackType.Error
				);
			}
		}

		if (
			newSettings.servers &&
			!newSettings.servers.includes(settings.currentServer)
		) {
			updatedSettings.currentServer = newSettings.servers[0];
		}

		setSettings(updatedSettings);
	};

	return (
		<LocalSettingsContext.Provider
			value={{
				settings: settings,
				updateSettings: updateLocalSettings,
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
