import * as Clipboard from 'expo-clipboard';
import { toast } from 'sonner-native';

/**
 * Copy a value to the clipboard and show a toast notification upon success or failure.
 */
export async function copyToClipboard(value: string): Promise<void> {
  const success = await Clipboard.setStringAsync(value);

  if (success) {
    toast.success("Successfully copied to clipboard.", {
      duration: 1500,
    });
  }
  else {
    toast.error("Failed to copy to clipboard.", {
      duration: 1500,
    });
  }
}

/**
 * Retrieve a value from the clipboard and show a toast notification upon failure.
 * @returns The value from the clipboard, or undefined if the clipboard is empty.
 */
export async function getFromClipboard(): Promise<string | undefined> {
  const value = await Clipboard.getStringAsync();

  if (value.length < 1) {
    toast.error("Clipboard is empty or inaccessible.", {
      duration: 1500,
    });
  }
  return value;

  return value;
}