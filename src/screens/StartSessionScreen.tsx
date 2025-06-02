import { ScrollView, Text, View } from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../App';
import { FC } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import SecondaryHeader from '../components/SecondaryHeader';
import QrCodeViewer from '../components/QrCodeViewer';
import { toast } from 'sonner-native';
import * as Haptics from 'expo-haptics';
import Button from '../components/Button';
import { useTranslation } from 'react-i18next';



type StartSessionScreenNavigationProp = NativeStackNavigationProp<
    RootStackParamList,
    'StartSessionScreen'
>;

type StartSessionScreenProps = {
    navigation: StartSessionScreenNavigationProp;
};

const StartSessionScreen: FC<StartSessionScreenProps> = (props: StartSessionScreenProps) => {
    const { t } = useTranslation();

    // Function to handle the copy action from the QR code viewer.
    function onCopy(result: 'success' | 'inaccessible-clipboard') {
        if (result === 'success') {
            toast.success("Sucessfully copied to clipboard.");

            Haptics.notificationAsync(
                Haptics.NotificationFeedbackType.Success
            );
        } else {
            toast.error("Clipboard is inaccessible.");

            Haptics.notificationAsync(
                Haptics.NotificationFeedbackType.Error
            );
        }
    }

    return (
        <SafeAreaView className="flex-1 bg-background">
            <SecondaryHeader
                title={t("startSession")}
                onBack={() => props.navigation.pop()}
            />

            {/* Content */}
            <ScrollView className="p-4 flex-grow">
                <Text className="text-center text-lg font-medium">
                    {t("connectedAsMic")}
                </Text>
                <View className="py-6 items-center">
                    <QrCodeViewer
                        type="user-token"
                        payload="Dieses Projekt ist die größte Scheiße. Größte Zeitverschwendung."
                        allowCopy={true}
                        onCopy={onCopy}
                    />
                </View>
                <Text className="text-center text-lg font-medium">
                    {t("deviceCount", { microphones: 1, speakers: 0 })}
                </Text>
                <Text className="text-center text-base">
                    {t("startHint")}
                </Text>
                <Button
                    label={t("startMeasurement")}
                    onPress={() => { }}
                    className="mt-6"
                />
            </ScrollView>
        </SafeAreaView>
    );
};

export default StartSessionScreen;
