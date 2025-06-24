import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../App';
import { FC, useEffect } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import SecondaryHeader from '../components/SecondaryHeader';
import { useTranslation } from 'react-i18next';
import { useSocket } from '../hooks/useSocket';
import { showHapticErrorToast } from '../tools/hapticToasts';
import { Alert } from 'react-native';

type MeasurementScreenNavigationProp = NativeStackNavigationProp<
	RootStackParamList,
	'MeasurementScreen'
>;

type MeasurementScreenProps = {
	navigation: MeasurementScreenNavigationProp;
};

const MeasurementScreen: FC<MeasurementScreenProps> = (
	props: MeasurementScreenProps
) => {
	const { t } = useTranslation();

	const socket = useSocket(
		[
			{
				event: 'play_sound',
				handler: () => {
					console.log('Playing Sound.');
				},
			},
			{
				event: 'start_recording',
				handler: () => {
					console.log('Starting Recording.');
				},
			},
			{
				event: 'end_recording',
				handler: () => {
					console.log('Ending Recording.');
				},
			},
			{
				event: 'end_measurement',
				handler: () => {
					console.log('Ending Measurement.');
				},
			},
			{
				event: 'result',
				handler: (data) => {},
			},
			{
				event: 'cancel_measurement',
				handler: (data) => {
					const { reason } = data as { reason: string };
					showHapticErrorToast(
						t('measurementCancelled', { reason: reason })
					);
					props.navigation.pop();
				},
			},
		],
		{
			onError: () => {
				showHapticErrorToast(t('connectionLost'));
				props.navigation.pop();
			},
		}
	);

	// Event handler for the back button.
	function onBack() {
		Alert.alert(t('popWarningTitle'), t('popWarningDescr'), [
			{
				text: t('cancel'),
				style: 'cancel',
			},
			{
				text: t('proceed'),
				style: 'destructive',
				onPress: async () => {
					props.navigation.pop();
				},
			},
		]);
	}

	useEffect(() => {
		props.navigation.addListener('beforeRemove', () => {
			socket.disconnect();
		});
	}, [props.navigation, socket]);

	return (
		<SafeAreaView className="flex-1 bg-background">
			<SecondaryHeader title={t('ongoingMeasurement')} onBack={onBack} />
		</SafeAreaView>
	);
};

export default MeasurementScreen;
