import AsyncStorage from '@react-native-async-storage/async-storage';
import { LocalSettings } from '../types/LocalSettings';

/**
 * Read the local application settings from device storage.
 * @returns The local application settings or undefined if not found.
 */
export async function readLocalSettings(): Promise<LocalSettings | undefined> {
    const localSettings = await AsyncStorage.getItem('localSettings');
    return localSettings ? JSON.parse(localSettings) : undefined;
}

/**
 * Write the local application settings to device storage.
 * @param localSettings - The local application settings to write.
 */
export function writeLocalSettings(localSettings: LocalSettings): Promise<void> {
    return AsyncStorage.setItem('localSettings', JSON.stringify(localSettings));
}
