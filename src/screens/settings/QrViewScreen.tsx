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
import { useTranslation } from 'react-i18next';

type QrViewScreenNavigationProp = NativeStackNavigationProp<
	RootStackParamList,
	'QrViewScreen'
>;

type QrViewScreenProps = {
	navigation: QrViewScreenNavigationProp;
};

const QrViewScreen: FC<QrViewScreenProps> = (props: QrViewScreenProps) => {
	const { t } = useTranslation();
	const { settings } = useLocalSettings();

	// Function to handle the copy action from the QR code viewer.
	function onCopy(result: 'success' | 'inaccessible-clipboard') {
		switch (result) {
			case 'success':
				toast.success(t('copySuccess'));
				Haptics.notificationAsync(
					Haptics.NotificationFeedbackType.Success
				);
				break;
			case 'inaccessible-clipboard':
				toast.error(t('copyError'));
				Haptics.notificationAsync(
					Haptics.NotificationFeedbackType.Error
				);
				break;
		}
	}

	return (
		<SafeAreaView className="flex-1 xl:max-w-3xl lg:mx-auto bg-background">
			{/* Header */}
			<SecondaryHeader
				title={t('yourAccountQr')}
				onBack={() => props.navigation.pop()}
			/>

			{/* Content */}
			<ScrollView className="p-4 flex-grow">
				<Text className="text-center text-lg font-medium">
					{t('qrInstruction1')}
				</Text>

				<View className="py-4">
					<QrCodeViewer
						type="user-token"
						payload={settings.userToken ?? ''}
						allowCopy={true}
						onCopy={onCopy}
					/>
				</View>

				<Text className="text-center text-base">
					{t('qrInstruction2')}
				</Text>
			</ScrollView>
		</SafeAreaView>
	);
};

export default QrViewScreen;
