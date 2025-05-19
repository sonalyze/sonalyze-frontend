import * as Clipboard from 'expo-clipboard';
import { toast } from 'sonner-native';

/**
 * Copy a value to the clipboard and show a toast notification upon success or failure.
 */
export async function copyToClipboard(value: string): Promise<void> {
  const success = await Clipboard.setStringAsync(value);

  toast(success ? "Successfully copied to clipboard." : "Failed to copy to clipboard.", {
    duration: 1000,
  });
}

