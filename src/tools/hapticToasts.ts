import { toast } from "sonner-native";
import * as Haptics from 'expo-haptics';

export async function showHapticSuccessToast(message: string) {
    toast.success(message);
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
}

export async function showHapticErrorToast(message: string) {
    toast.error(message);
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
}
