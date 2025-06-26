import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../App';
import { FC, useEffect, useRef, useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import SecondaryHeader from '../components/SecondaryHeader';
import { useTranslation } from 'react-i18next';
import { useSocket } from '../hooks/useSocket';
import { showHapticErrorToast } from '../tools/hapticToasts';
import {
	ActivityIndicator,
	Alert,
	EmitterSubscription,
	View,
} from 'react-native';
import SoundPlayer from 'react-native-sound-player';
import { RouteProp } from '@react-navigation/native';
import { Text } from 'react-native';
import { Mic, Volume2 } from 'lucide-react-native';
import NativeAudio from '../../modules/native-audio';

type MeasurementScreenRouteProp = RouteProp<
	RootStackParamList,
	'MeasurementScreen'
>;

type MeasurementScreenNavigationProp = NativeStackNavigationProp<
	RootStackParamList,
	'MeasurementScreen'
>;

type MeasurementScreenProps = {
	route: MeasurementScreenRouteProp;
	navigation: MeasurementScreenNavigationProp;
};

const MeasurementScreen: FC<MeasurementScreenProps> = (
	props: MeasurementScreenProps
) => {
	const { t } = useTranslation();
	const [isLoading, setIsLoading] = useState(false);
	const [isPlaying, setIsPlaying] = useState(false);
	const [isRecording, setIsRecording] = useState(false);
	const playSubRef = useRef<EmitterSubscription | undefined>(undefined);
	const loadSubRef = useRef<EmitterSubscription | undefined>(undefined);
	const deviceType = props.route.params.deviceType;

	const socket = useSocket(
		[
			{
				event: 'play_sound',
				handler: () => {
					setIsPlaying(true);
					SoundPlayer.play();
				},
			},
			{
				event: 'start_recording',
				handler: async () => {
					try {
						const result = await NativeAudio.fileStartRecording(
							`recording-${Date.now()}.wav`
						);

						if (result.success) {
							setIsRecording(true);
							return;
						}

						throw result.error;
					} catch (error) {
						showHapticErrorToast(
							`Failed to start recording: ${error}`
						);
						props.navigation.pop();
					}
				},
			},
			{
				event: 'end_recording',
				handler: async () => {
					try {
						setIsRecording(false);
						const result = await NativeAudio.fileStopRecording();

						if (!result.success) {
							throw result.error;
						}

						if (!result.path) {
							throw 'No recording path returned.';
						}

						if (result.path) {
							sendRecording(result.path);
						}
					} catch (error) {
						showHapticErrorToast(
							`Failed to stop recording: ${error} `
						);
						props.navigation.pop();
					}
				},
			},
			{
				event: 'end_measurement',
				handler: () => {
					console.log('Ending Measurement.');
				},
			},
			{
				event: 'results',
				handler: (data) => {
					const { results, id, name } = data as {
						results: AcousticParameters[][];
						id: string;
						name: string;
					};

					props.navigation.replace('MeasurementDetailScreen', {
						item: {
							values: results,
							id: id,
							name: name,
							createdAt: `${Date.now()}`,
							isOwner: false,
						},
					});
				},
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

	async function sendRecording(filename: string) {
		try {
			const result = await NativeAudio.getRecordingData(filename);

			if (!result.success || !result.data) {
				showHapticErrorToast(
					result.error || 'Failed to get recording data'
				);
				return;
			}

			socket.emit('send_record_data', {
				recording: result.data,
			});

			NativeAudio.deleteRecording(filename);
		} catch (err) {
			const errorMessage =
				err instanceof Error
					? err.message
					: 'Unknown error sending recording';
			showHapticErrorToast(`Error sending recording: ${errorMessage}`);
		}
	}

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

	useEffect(
		() => {
			// If this device is a speaker, load the sound file from server.
			if (deviceType === 'speaker') {
				setIsLoading(true);

				SoundPlayer.loadUrl(
					'https://cloud.lukasengel.net/public.php/dav/files/sBk9HoNM86HmMcA/'
				);

				loadSubRef.current = SoundPlayer.addEventListener(
					'FinishedLoading',
					async (data) => {
						await new Promise((resolve) =>
							setTimeout(resolve, 200)
						);

						setIsLoading(false);
					}
				);

				playSubRef.current = SoundPlayer.addEventListener(
					'FinishedPlaying',
					async (data) => {
						setIsPlaying(false);
					}
				);
			}
		},
		// eslint-disable-next-line react-hooks/exhaustive-deps
		[]
	);

	useEffect(() => {
		const unsubscribe = props.navigation.addListener('beforeRemove', () => {
			SoundPlayer.stop();
			socket.disconnect();
			loadSubRef.current?.remove();
			playSubRef.current?.remove();
		});

		return unsubscribe;
	}, [props.navigation, socket]);

	return (
		<SafeAreaView className="flex-1 bg-background">
			<SecondaryHeader title={t('ongoingMeasurement')} onBack={onBack} />

			{/* Loading Indicator. */}
			{isLoading ? (
				<View className="flex-1 items-center justify-center m-10 mb-24">
					<ActivityIndicator size="large" />
					<Text className="text-center text-lg pt-2">
						{t('loading')}
					</Text>
				</View>
			) : null}

			{/* Loading Indicator. */}
			{isPlaying ? (
				<View className="flex-1 items-center justify-center m-10 mb-24">
					<Volume2 size={48} />
					<Text className="text-center text-lg pt-2">
						{t('playing')}
					</Text>
				</View>
			) : null}

			{/* Recording Indicator. */}
			{isRecording ? (
				<View className="flex-1 items-center justify-center m-10 mb-24">
					<Mic size={48} />
					<Text className="text-center text-lg pt-2">
						{t('recording')}
					</Text>
				</View>
			) : null}

			{/* Measurement Content */}
			{!isLoading && !isPlaying && !isRecording ? (
				<View className="flex-1 items-center justify-center m-10 mb-24">
					<ActivityIndicator size="large" />
					<Text className="text-center text-lg pt-2">
						{t('measurementActive')}
					</Text>
				</View>
			) : null}
		</SafeAreaView>
	);
};

export default MeasurementScreen;
