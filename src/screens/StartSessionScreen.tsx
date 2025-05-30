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


type StartSessionScreenNavigationProp = NativeStackNavigationProp<
    RootStackParamList,
    'StartSessionScreen'
>;

type StartSessionScreenProps = {
    navigation: StartSessionScreenNavigationProp;
};

const StartSessionScreen: FC<StartSessionScreenProps> = (props: StartSessionScreenProps) => {
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
                title="Start Session"
                onBack={() => props.navigation.pop()}
            />

            {/* Content */}
            <ScrollView className="p-4 flex-grow">
                <Text className="text-center text-lg font-medium">
                    You are connected as microphone.
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
                    1 Microphone, 0 Speakers
                </Text>
                <Text className="text-center text-base">
                    You need at least one microphone and one speaker to start a measurement.
                    Use the QR code above to invite other devices to this session.
                </Text>
                <Button
                    label="Start Measurement"
                    onPress={() => { }}
                    className="mt-6"
                />
            </ScrollView>
        </SafeAreaView>
    );
};

export default StartSessionScreen;
