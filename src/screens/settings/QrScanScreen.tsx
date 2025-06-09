import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Text, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FC } from 'react';
import { RootStackParamList } from '../../App';
import { useLocalSettings } from '../../contexts/LocalSettingsContext';
import SecondaryHeader from '../../components/SecondaryHeader';
import QrCodeScanner from '../../components/QrCodeScanner';
import { toast } from 'sonner-native';
import * as Haptics from 'expo-haptics';
import { useTranslation } from 'react-i18next';

type QrScanScreenNavigationProp = NativeStackNavigationProp<
	RootStackParamList,
	'QrScanScreen'
>;

type QrScanScreenProps = {
	navigation: QrScanScreenNavigationProp;
};

const QrScanScreen: FC<QrScanScreenProps> = (props: QrScanScreenProps) => {
	const { updateSettings } = useLocalSettings();
	const { t } = useTranslation();

	async function onInputCode(code: string) {
		// Ensure that the provided code is a valid UUID v4.
		if (
			RegExp(
				/^[0-9A-F]{8}-[0-9A-F]{4}-4[0-9A-F]{3}-[89AB][0-9A-F]{3}-[0-9A-F]{12}$/i
			).test(code)
		) {
			await updateSettings({
				userToken: code,
			});

			toast.success(t('scanSuccess'));

			Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

			props.navigation.popTo('HomeScreen');
		} else {
			onError('invalid-code');
		}
	}

	function onError(error: 'empty-inaccessible-clipboard' | 'invalid-code') {
		switch (error) {
			case 'empty-inaccessible-clipboard':
				toast.error(t('clipboardError'));
				break;
			case 'invalid-code':
				toast.error(t('invalidAccount'));
				break;
		}

		Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
	}

	return (
		<SafeAreaView className="flex-1 bg-background">
			{/* Header */}
			<SecondaryHeader
				title={t('scanQrTitle')}
				onBack={() => props.navigation.pop()}
			/>

			{/* Content */}
			<ScrollView className="p-4 flex-grow">
				<Text className="mb-3 text-center text-base font-medium">
					{t('scanQrDescription')}
				</Text>

				<QrCodeScanner
					type="user-token"
					allowPaste={true}
					onScan={onInputCode}
					onError={onError}
				/>
				<Text className="pt-4 text-base text-center">
					{t('scanQrExplanation')}
				</Text>
			</ScrollView>
		</SafeAreaView>
	);
};

export default QrScanScreen;
