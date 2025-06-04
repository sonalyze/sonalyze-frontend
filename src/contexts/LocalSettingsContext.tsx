import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { LocalSettings } from '../types/LocalSettings';
import uuid from 'react-native-uuid';
import { readLocalSettings, writeLocalSettings } from '../tools/localSettingsAccess';
import i18n from '../i18n';

type LocalSettingsContextType = {
    settings: LocalSettings;
    updateSettings: (newSettings: Partial<LocalSettings>) => Promise<void>;
};

export const LocalSettingsContext = createContext<LocalSettingsContextType | undefined>(undefined);

type LocalSettingsProviderProps = {
    children: ReactNode;
};

export const LocalSettingsProvider: React.FC<LocalSettingsProviderProps> = (props: LocalSettingsProviderProps) => {
    // Generate a unique user token.
    const [settings, setSettings] = useState<LocalSettings>({
        userToken: uuid.v4(),
        locale: "en",
    });

    useEffect(() => {
        readLocalSettings().then((loadedSettings) => {
            if (loadedSettings) {
                setSettings(loadedSettings);
                i18n.changeLanguage(loadedSettings.locale);
            }
            else {
                writeLocalSettings(settings);   
            }
        });
    // eslint-disable-next-line react-hooks/exhaustive-deps
    },[]);

    const updateLocalSettings = async (newSettings: Partial<LocalSettings>)  => {
        const updatedSettings = { ...settings, ...newSettings };

        await writeLocalSettings(
            updatedSettings,
        );

        // Update i18n language if locale is changed
        if (newSettings.locale && newSettings.locale !== settings.locale) {
            i18n.changeLanguage(newSettings.locale);
        }

        setSettings(updatedSettings);
    }

    return (
        <LocalSettingsContext.Provider value={{
            settings: settings,
            updateSettings: updateLocalSettings
        }}>
            {props.children}
        </LocalSettingsContext.Provider>
    );
};

export const useLocalSettings = () => {
    const context = useContext(LocalSettingsContext);

    if (context === undefined) {
        throw new Error('useLocalSettings must be used within a LocalSettingsProvider');
    }
    
    return context;
};