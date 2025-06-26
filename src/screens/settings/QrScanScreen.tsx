import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Text, ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FC } from 'react';
import { RootStackParamList } from '../../App';
import { useLocalSettings } from '../../contexts/LocalSettingsContext';
import SecondaryHeader from '../../components/SecondaryHeader';
import QrCodeScanner from '../../components/QrCodeScanner';
import { useTranslation } from 'react-i18next';
import {
	showHapticErrorToast,
	showHapticSuccessToast,
} from '../../tools/hapticToasts';
import { migrateUser } from '../../api/userRequests';

type QrScanScreenNavigationProp = NativeStackNavigationProp<
	RootStackParamList,
	'QrScanScreen'
>;

type QrScanScreenProps = {
	navigation: QrScanScreenNavigationProp;
};

const QrScanScreen: FC<QrScanScreenProps> = (props: QrScanScreenProps) => {
	const { t } = useTranslation();
	const { updateSettings } = useLocalSettings();

	async function onInputCode(code: string) {
		// Ensure that the provided code is a valid user token.
		const validToken = RegExp(/\b[a-f0-9]{24}\b/g).test(code);

		if (validToken) {
			await migrateUser(code);
			await updateSettings({
				userToken: code,
			});

			showHapticSuccessToast(t('scanSuccess'));
			props.navigation.popTo('HomeScreen');
			return;
		}

		onError('invalid-code');
	}

	function onError(error: 'empty-inaccessible-clipboard' | 'invalid-code') {
		switch (error) {
			case 'empty-inaccessible-clipboard':
				showHapticErrorToast(t('clipboardError'));
				break;
			case 'invalid-code':
				showHapticErrorToast(t('invalidAccount'));
				break;
		}
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
				<Text className="text-center text-lg font-medium">
					{t('scanQrDescription')}
				</Text>

				<View className="py-4">
					<QrCodeScanner
						type="user-token"
						allowPaste={true}
						onScan={onInputCode}
						onError={onError}
					/>
				</View>

				<Text className="text-center text-base">
					{t('scanQrExplanation')}
				</Text>
			</ScrollView>
		</SafeAreaView>
	);
};

export default QrScanScreen;
