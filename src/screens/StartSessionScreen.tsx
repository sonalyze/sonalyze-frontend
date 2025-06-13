import { ActivityIndicator, ScrollView, Text, View } from 'react-native';
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

					setMicrophones(microphones);
					setSpeakers(speakers);
				},
			},
			{
				event: 'start_measurement',
				handler: () => props.navigation.replace('MeasurementScreen'),
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
			onDisconnect: () => {
				setLobby(undefined);
				console.log('Disconnected.');
			},
			onError: (error) => {
				setLobby(undefined);
				setLoading(false);
				socket.disconnect();
				props.navigation.pop();
			},
		}
	);

	useEffect(() => {
		if (!isLoading && !lobby) {
			setLoading(true);
			socket.emit('create_lobby');
		}
	}, [socket, lobby, isLoading]);

	function onStartMeasurement() {
		socket.emit('start_measurement');
	}

	// Function to handle the copy action from the QR code viewer.
	function onCopy(result: 'success' | 'inaccessible-clipboard') {
		if (result === 'success') {
			showHapticSuccessToast(t('copySuccess'));
		} else {
			showHapticErrorToast(t('copyError'));
		}
	}

	// Function to handle the back button press.
	function onBack() {
		socket.disconnect();
		props.navigation.pop();
	}

	return (
		<SafeAreaView className="flex-1 bg-background">
			<SecondaryHeader title={t('startSession')} onBack={onBack} />

			{/* Loading Indicator. */}
			{isLoading && (
				<View className="flex-1 items-center justify-center m-10 mb-24">
					<ActivityIndicator size="large" />
					<Text className="text-center text-lg pt-2">
						{t('connecting')}
					</Text>
				</View>
			)}

			{/* Page Content. */}
			{!isLoading && lobby && (
				<ScrollView className="p-4 flex-grow">
					<Text className="text-center text-lg font-medium">
						{t('connectedAsMic')}
					</Text>
					<Text className="text-center text-xl font-medium">
						{t('number', { number: ownIndex! + 1 })}
					</Text>
					<View className="py-6 items-center">
						<QrCodeViewer
							type="lobby-token"
							payload={lobby}
							allowCopy={true}
							onCopy={onCopy}
						/>
					</View>
					<Text className="text-center text-lg font-medium">
						{t('deviceCount', {
							microphones: microphones.length,
							speakers: speakers.length,
						})}
					</Text>
					<Text className="text-center text-base">
						{t('startHint')}
					</Text>
					<Center>
						<Button
							label={t('startMeasurement')}
							onPress={onStartMeasurement}
							className="mt-6"
							expand={false}
						/>
					</Center>
				</ScrollView>
			)}
		</SafeAreaView>
	);
};

export default StartSessionScreen;
