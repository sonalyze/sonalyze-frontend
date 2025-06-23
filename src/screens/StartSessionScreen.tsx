import { ActivityIndicator, ScrollView, Text, View } from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../App';
import { FC, useEffect, useRef, useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import SecondaryHeader from '../components/SecondaryHeader';
import QrCodeViewer from '../components/QrCodeViewer';
import Button from '../components/Button';
import { useTranslation } from 'react-i18next';
import { useSocket } from '../hooks/useSocket';
import Center from '../components/Center';
import {
	showHapticErrorToast,
	showHapticSuccessToast,
} from '../tools/hapticToasts';

type StartSessionScreenNavigationProp = NativeStackNavigationProp<
	RootStackParamList,
	'StartSessionScreen'
>;

type StartSessionScreenProps = {
	navigation: StartSessionScreenNavigationProp;
};

const StartSessionScreen: FC<StartSessionScreenProps> = (
	props: StartSessionScreenProps
) => {
	const { t } = useTranslation();
	const [isLoading, setLoading] = useState(false);
	const [hasIndexConflict, setIndexConflict] = useState(false);
	const autoDisconnect = useRef(true);

	const [lobby, setLobby] = useState<string | undefined>(undefined);
	const [microphones, setMicrophones] = useState<number[]>([]);
	const [speakers, setSpeakers] = useState<number[]>([]);
	const [ownIndex, setOwnIndex] = useState<number | undefined>(undefined);

	const socket = useSocket(
		[
			{
				event: 'create_lobby_res',
				handler: (data) => {
					const { lobbyId } = data as { lobbyId: string };

					new Promise((resolve) => setTimeout(resolve, 200)).then(
						() => {
							setOwnIndex(0);
							setLobby(lobbyId);
							setMicrophones([0]);
							setLoading(false);
						}
					);
				},
			},
			{
				event: 'device_choices',
				handler: (data) => {
					const { microphones, speakers } = data as {
						microphones: number[];
						speakers: number[];
					};

					const hasMicConflic = microphones.some(
						(item, index) => microphones.indexOf(item) !== index
					);

					const hasSpeakerConflict = speakers.some(
						(item, index) => speakers.indexOf(item) !== index
					);

					setIndexConflict(hasMicConflic || hasSpeakerConflict);
					setMicrophones(microphones);
					setSpeakers(speakers);
				},
			},
			{
				event: 'start_measurement',
				handler: () => {
					autoDisconnect.current = false;
					props.navigation.replace('MeasurementScreen');
				},
			},
			{
				event: 'start_measurement_fail',
				handler: (data) => {
					const { reason } = data as { reason: string };
					showHapticErrorToast(
						t('measurementStartError', { reason: reason })
					);
				},
			},
		],
		{
			onError: () => {
				showHapticErrorToast(t('connectionLost'));
				socket.disconnect();
				props.navigation.pop();
			},
		}
	);

	useEffect(() => {
		// Start the connection to the socket server when the screen is first mounted.
		if (!isLoading && !lobby) {
			setLoading(true);
			socket.emit('create_lobby');
		}

		// Ensure the connection is closed whenever the screen is popped.
		props.navigation.addListener('beforeRemove', () => {
			if (autoDisconnect.current) {
				socket.disconnect();
			}
		});
	}, [socket, lobby, isLoading, props.navigation, autoDisconnect]);

	// Event handler for the "start measurement" button.
	function onStartMeasurement() {
		// @TODO: Args
		socket.emit('start_measurement');
	}

	// Event handler for the "copy to clipboard" button.
	function onCopy(result: 'success' | 'inaccessible-clipboard') {
		if (result === 'success') {
			showHapticSuccessToast(t('copySuccess'));
		} else {
			showHapticErrorToast(t('copyError'));
		}
	}

	return (
		<SafeAreaView className="flex-1 bg-background">
			{/* Header. */}
			<SecondaryHeader
				title={t('startSession')}
				onBack={() => props.navigation.pop()}
			/>

			{/* Loading Indicator. */}
			{isLoading ? (
				<View className="flex-1 items-center justify-center m-10 mb-24">
					<ActivityIndicator size="large" />
					<Text className="text-center text-lg pt-2">
						{t('connecting')}
					</Text>
				</View>
			) : null}

			{/* Page Content. */}
			{!isLoading && lobby && ownIndex !== undefined ? (
				<ScrollView className="p-4 flex-grow">
					<Text className="text-center text-lg font-medium">
						{t('connectedAs')}
					</Text>
					<Text className="text-center text-xl font-medium">
						{t('micNo', { number: ownIndex! + 1 })}
					</Text>
					<View className="py-4 items-center">
						<QrCodeViewer
							type="lobby-token"
							payload={lobby}
							allowCopy={true}
							onCopy={onCopy}
						/>
					</View>
					{hasIndexConflict ? (
						<Text className="text-red-500 text-center mb-4">
							{t('numberConflict')}
						</Text>
					) : null}
					<Text className="text-center text-lg font-medium">
						{t('connectedDevices')}
					</Text>
					<Text className="text-center text-xl font-medium">
						{t('deviceCount', {
							microphones: microphones.length,
							speakers: speakers.length,
						})}
					</Text>
					<Text className="py-4 text-center text-base">
						{t('startHint')}
					</Text>
					<Center>
						<Button
							label={t('startMeasurement')}
							onPress={onStartMeasurement}
							expand={false}
						/>
					</Center>
				</ScrollView>
			) : null}
		</SafeAreaView>
	);
};

export default StartSessionScreen;
