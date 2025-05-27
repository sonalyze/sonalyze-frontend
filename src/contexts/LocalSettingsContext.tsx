import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { LocalSettings } from '../types/LocalSettings';
import uuid from 'react-native-uuid';
import { readLocalSettings, writeLocalSettings } from '../tools/localSettingsAccess';

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
    });

    useEffect(() => {
        readLocalSettings().then((loadedSettings) => {
            if (loadedSettings) {
                setSettings(loadedSettings);
            }

            else {
                writeLocalSettings(settings);   
            }
        });
    },[]);

    const updateLocalSettings = async (newSettings: Partial<LocalSettings>)  => {
        const updatedSettings = { ...settings, ...newSettings };

        await writeLocalSettings(
            updatedSettings,
        );

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