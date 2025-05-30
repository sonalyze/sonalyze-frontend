import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Text, SafeAreaView, ScrollView } from 'react-native';
import { FC } from 'react';
import { RootStackParamList } from '../../App';
import { useLocalSettings } from '../../contexts/LocalSettingsContext';
import SecondaryHeader from '../../components/SecondaryHeader';
import QrCodeScanner from '../../components/QrCodeScanner';
import { toast } from 'sonner-native';
import * as Haptics from 'expo-haptics';

type QrScanScreenNavigationProp = NativeStackNavigationProp<
    RootStackParamList,
    'QrScanScreen'
>;

type QrScanScreenProps = {
    navigation: QrScanScreenNavigationProp;
};

const QrScanScreen: FC<QrScanScreenProps> = (props: QrScanScreenProps) => {
    const { updateSettings } = useLocalSettings();

    async function onInputCode(code: string) {
        // Ensure that the provided code is a valid UUID v4.
        if (RegExp(/^[0-9A-F]{8}-[0-9A-F]{4}-4[0-9A-F]{3}-[89AB][0-9A-F]{3}-[0-9A-F]{12}$/i).test(code)) {
            await updateSettings({
                userToken: code,
            });

            toast.success(
                "Successfully transferred account."
            );

            Haptics.notificationAsync(
                Haptics.NotificationFeedbackType.Success
            );

            props.navigation.popTo("HomeScreen");
        }
        else {
            onError("invalid-code");
        }
    }

    function onError(error: "empty-inaccessible-clipboard" | "invalid-code") {
        switch (error) {
            case "empty-inaccessible-clipboard":
                toast.error("Clipboard is empty or inaccessible.");
                break;
            case "invalid-code":
                toast.error("Not a valid Account ID.")
                break;
        }

        Haptics.notificationAsync(
            Haptics.NotificationFeedbackType.Error
        );
    }

    return (
        <SafeAreaView className="flex-1 bg-background">
            {/* Header */}
            <SecondaryHeader
                title="Scan Account QR-Code"
                onBack={() => props.navigation.pop()}
            />

            {/* Content */}
            <ScrollView className="p-4 flex-grow">
                <Text className="mb-3 text-center text-base font-medium">
                    Scan the QR code from your other devices to
                    transfer your account to this device.
                </Text>
                <QrCodeScanner
                    type='user-token'
                    allowPaste={true}
                    onScan={onInputCode}
                    onError={onError}
                />
                <Text className="pt-4 text-base text-center">
                    After scanning, your rooms and measurement history will be
                    accessible on this device. Alternatively, you can paste your
                    Account ID from clipboard and handle the distribution
                    manually.
                </Text>
            </ScrollView>
        </SafeAreaView>
    );
};

export default QrScanScreen;
