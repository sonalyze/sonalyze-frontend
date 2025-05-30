import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { View, Text, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FC } from 'react';
import { RootStackParamList } from '../../App';
import { useLocalSettings } from '../../contexts/LocalSettingsContext';
import QrCodeViewer from '../../components/QrCodeViewer';
import SecondaryHeader from '../../components/SecondaryHeader';
import { toast } from 'sonner-native';
import * as Haptics from 'expo-haptics';

type QrViewScreenNavigationProp = NativeStackNavigationProp<
	RootStackParamList,
	'QrViewScreen'
>;

type QrViewScreenProps = {
	navigation: QrViewScreenNavigationProp;
};

const QrViewScreen: FC<QrViewScreenProps> = (props: QrViewScreenProps) => {
	const { settings } = useLocalSettings();

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
			{/* Header */}
			<SecondaryHeader
				title="Your Account QR-Code"
				onBack={() => props.navigation.pop()}
			/>

			{/* Content */}
			<ScrollView className="p-4 flex-grow">
				<Text className="text-center text-lg font-medium">
					Scan this QR code with another device running Sonalyze to transfer your account.
				</Text>
				<View className="py-6 items-center">
					<QrCodeViewer
						type="user-token"
						payload={settings.userToken}
						allowCopy={true}
						onCopy={onCopy}
					/>
				</View>
				<Text className="text-center text-base">
					After scanning, your rooms and measurement history will be accessible on the new device.
					Alternatively, you can copy your Account ID to clipboard and handle the distribution manually.
				</Text>
			</ScrollView>
		</SafeAreaView>
	);
};

export default QrViewScreen;
