import { View, Text, TouchableOpacity, ScrollView } from 'react-native'
import { FC } from 'react'
import { RootStackParamList } from '../App';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from '@react-native-vector-icons/lucide';
import Tile from '../components/Tile';

type SettingsScreenNavigationProp = NativeStackNavigationProp<
    RootStackParamList,
    'SettingsScreen'
>;

type SettingsScreenProps = {
    navigation: SettingsScreenNavigationProp;
};

const SettingsScreen: FC<SettingsScreenProps> = (props: SettingsScreenProps) => {
    return (
        <SafeAreaView className="flex-1 bg-background">
            {/* Header */}
            <View className="px-2 py-2 h-25 flex-row items-center">
                <TouchableOpacity onPress={() => props.navigation.pop()}>
                    <Icon name="chevron-left" size={24} />
                </TouchableOpacity>
                <Text className="text-2xl ml-3 color-foreground">Settings</Text>
            </View>

            {/* Page Content */}
            <ScrollView className="m-2 flex-grow">
                <Tile
                    title="Show Account QR Code"
                    subtitle="Show a QR code on this device to transfer your account to another device."
                    trailingIcon="qr-code"
                    onPress={() => props.navigation.push('QrViewScreen')}
                />
                <View className="h-3" />
                <Tile
                    title="Scan Account QR Code"
                    subtitle="Scan a QR code from another device to transfer the account to this device."
                    trailingIcon="camera"
                />
            </ScrollView>
        </SafeAreaView>
    );
}

export default SettingsScreen;