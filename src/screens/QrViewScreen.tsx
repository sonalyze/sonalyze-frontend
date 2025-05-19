import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { View, Text, SafeAreaView, TouchableOpacity, ScrollView, Image } from 'react-native'
import { RootStackParamList } from '../App';
import { FC } from 'react';
import Icon from '@react-native-vector-icons/lucide';
import QrCodeViewer from '../components/QrCodeViewer';

type QrViewScreenNavigationProp = NativeStackNavigationProp<
    RootStackParamList,
    'QrViewScreen'
>;

type QrViewScreenProps = {
    navigation: QrViewScreenNavigationProp;
};

const QrViewScreen: FC<QrViewScreenProps> = (props: QrViewScreenProps) => {
    return (
        <SafeAreaView className="flex-1 bg-background">
            {/* Header */}
            <View className="px-2 py-2 h-25 flex-row items-center">
                <TouchableOpacity onPress={() => props.navigation.pop()}>
                    <Icon name="chevron-left" size={24} />
                </TouchableOpacity>
                <Text className="text-2xl ml-3 color-foreground">Your Account ID QR Code</Text>
            </View>

            {/* Page Content */}
            <ScrollView className="m-2 flex-grow">
                <View className="mx-10 items-center">
                    <Text className="text-center text-base font-medium">
                        Scan this QR code on another device running Sonalyze to transfer your account:
                    </Text>
                    <View className="py-6">
                        <QrCodeViewer
                            type='user-token'
                            data='Auf der Heide blüht ein kleines Blümelein - und das heißt: Erika!'
                        />
                    </View>
                </View>
                <Text className="text-center text-sm">
                    After scanning, your rooms and measurement history will be accessible on the new device.
                    Alternatively, you can copy your account code to clipboard and handle the distribution manually.
                </Text>
                <Text className="text-center text-sm font-medium pt-2">
                    Important Note: All existing data on the new device will be overwritten during the transfer!
                </Text>
            </ScrollView>
        </SafeAreaView>
    );
}

export default QrViewScreen;