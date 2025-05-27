import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { View, Text, SafeAreaView, ScrollView } from 'react-native';
import { FC } from 'react';
import { RootStackParamList } from '../../App';
import { useLocalSettings } from '../../contexts/LocalSettingsContext';
import QrCodeViewer from '../../components/QrCodeViewer';
import SecondaryHeader from '../../components/SecondaryHeader';

type QrViewScreenNavigationProp = NativeStackNavigationProp<
	RootStackParamList,
	'QrViewScreen'
>;

type QrViewScreenProps = {
	navigation: QrViewScreenNavigationProp;
};

const QrViewScreen: FC<QrViewScreenProps> = (props: QrViewScreenProps) => {
	const { settings } = useLocalSettings();

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
