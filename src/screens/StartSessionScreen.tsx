import { ActivityIndicator, Alert, ScrollView, Text, View } from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../App';
import { FC, useEffect, useState } from 'react';
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
import Icon from '@react-native-vector-icons/lucide';

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
	const [isConnecting, setIsConnecting] = useState(true);
	const [isCreating, setIsCreating] = useState(false);
	const [hasIndexConflict, setHasIndexConflict] = useState(false);
	const [lobby, setLobby] = useState<string | undefined>(undefined);
	const [microphones, setMicrophones] = useState<number[] | undefined>(
		undefined
	);
	const [speakers, setSpeakers] = useState<number[] | undefined>(undefined);
	const [index, setIndex] = useState<number | undefined>(undefined);

	const socket = useSocket(
		[
			// After creating the lobby, this device must be a microphone with index zero.
			{
				event: 'create_lobby_res',
				handler: async (data) => {
					const { lobbyId } = data as { lobbyId: string };
					await new Promise((resolve) => setTimeout(resolve, 200));
					setLobby(lobbyId);
					setMicrophones([0]);
					setSpeakers([]);
					setIndex(0);
					setIsCreating(false);
				},
			},
			// After receiving updated device choices, update the state and determine any index misconfigurations.
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

					setHasIndexConflict(hasMicConflic || hasSpeakerConflict);
					setMicrophones(microphones);
					setSpeakers(speakers);
				},
			},
			// After the measurement has been successfully started, navigate to the measurement screen.
			{
				event: 'start_measurement',
				handler: () => {
					props.navigation.replace('MeasurementScreen');
				},
			},
			// If the measurement could not be started, show an error toast.
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
			// After connecting to the socket server, create lobby.
			onConnect: async () => {
				await new Promise((resolve) => setTimeout(resolve, 200));
				setIsConnecting(false);
				setIsCreating(true);
				socket.emit('create_lobby');
			},
			// If the connection is lost.
			onDisconnect: async () => {
				setIsConnecting(true);
				setIsCreating(false);
				setLobby(undefined);
				setMicrophones(undefined);
				setSpeakers(undefined);
				setIndex(undefined);
			},
			// Upon any error, cancel measurement.
			onError: () => {
				showHapticErrorToast(t('connectionLost'));
				props.navigation.pop();
			},
		}
	);

	useEffect(
		() => {
			// Ensure the connection is closed whenever the screen is popped.
			props.navigation.addListener('beforeRemove', (args) => {
				if (args.data.action.type === 'POP') {
					socket.disconnect();
				}
			});
		},
		// eslint-disable-next-line react-hooks/exhaustive-deps
		[]
	);

	// Event handler for the "start measurement" button.
	function onStartMeasurement() {
		const distances: Record<number, Record<number, number>> = {
			0: { 0: 1 },
		};

		socket.emit('start_measurement', {
			repetitions: 1,
			delay: 0.0,
			distances: distances,
		});
	}

	// Event handler for the "copy to clipboard" button.
	function onCopy(result: 'success' | 'inaccessible-clipboard') {
		switch (result) {
			case 'success':
				showHapticSuccessToast(t('copySuccess'));
				break;
			case 'inaccessible-clipboard':
				showHapticErrorToast(t('copyError'));
				break;
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

	return (
		<SafeAreaView className="flex-1 bg-background">
			{/* Header. */}
			<SecondaryHeader title={t('startSession')} onBack={onBack} />

			{/* Loading Indicator. */}
			{isConnecting || isCreating ? (
				<View className="flex-1 items-center justify-center m-10 mb-24">
					<ActivityIndicator size="large" />
					<Text className="text-center text-lg pt-2">
						{t(isConnecting ? 'connecting' : 'creating')}
					</Text>
				</View>
			) : null}

			{/* Page Content. */}
			{!isCreating && !isConnecting ? (
				<>
					{lobby === undefined ||
					index === undefined ||
					microphones === undefined ||
					speakers === undefined ? (
						<View className="flex-1 items-center justify-center m-10 mb-24">
							<Icon name="triangle-alert" size={48} />
							<Text className="text-center text-lg pt-2">
								{t('unknownError')}
							</Text>
							<Text className="text-center pt-2 pb-4">
								{t('unknownErrorInfo')}
							</Text>
						</View>
					) : (
						<ScrollView className="p-4 flex-grow">
							<Text className="text-center text-lg font-medium">
								{t('connectedAs')}
							</Text>
							<Text className="text-center text-xl font-medium">
								{t('micNo', { number: index + 1 })}
							</Text>
							<View className="py-4 items-center">
								<QrCodeViewer
									type="lobby-token"
									payload={lobby}
									allowCopy={true}
									onCopy={onCopy}
								/>
							</View>
							{hasIndexConflict && (
								<Text className="text-red-500 text-center mb-4">
									{t('numberConflict')}
								</Text>
							)}
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
					)}
				</>
			) : null}
		</SafeAreaView>
	);
};

export default StartSessionScreen;
