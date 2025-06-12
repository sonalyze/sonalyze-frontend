import * as Clipboard from 'expo-clipboard';

/**
 * Copy a value to the clipboard and show a toast notification upon success or failure.
 */
export  function copyToClipboard(value: string): Promise<boolean> {
  return  Clipboard.setStringAsync(value);
}

/**
 * Retrieve a value from the clipboard and show a toast notification upon failure.
 * @returns The value from the clipboard, or undefined if the clipboard is empty.
 */
export async function getFromClipboard(): Promise<string | undefined> {
  const value = await Clipboard.getStringAsync();
  return value.length > 1 ? value : undefined;
}