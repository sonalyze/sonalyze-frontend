import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../App';
import { FC, useEffect, useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import SecondaryHeader from '../components/SecondaryHeader';
import { useTranslation } from 'react-i18next';
import { useSocket } from '../hooks/useSocket';
import { ActivityIndicator, ScrollView, Text, View } from 'react-native';
import {
	showHapticErrorToast,
	showHapticSuccessToast,
} from '../tools/hapticToasts';
import QrCodeScanner from '../components/QrCodeScanner';

type JoinSessionScreenNavigationProp = NativeStackNavigationProp<
	RootStackParamList,
	'JoinSessionScreen'
>;

type JoinSessionScreenProps = {
	navigation: JoinSessionScreenNavigationProp;
};

const JoinSessionScreen: FC<JoinSessionScreenProps> = (
	props: JoinSessionScreenProps
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
				event: 'join_lobby_success',
				handler: (data) => {
					const { deviceType, index } = data as {
						deviceType: 'microphone' | 'speaker';
						index: number;
					};
				},
			},
			{
				event: 'join_lobby_fail',
				handler: (data) => {
					const { reason } = data as { reason: string };
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
		],
		{
			onDisconnect: () => {},
			onError: (error) => {},
		}
	);

	async function onScanCode(code: string) {}

	function onScanError(
		error: 'empty-inaccessible-clipboard' | 'invalid-code'
	) {}

	useEffect(() => {}, [socket, lobby, isLoading]);

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
			<SecondaryHeader title={t('joinSession')} onBack={onBack} />

			{/* Loading Indicator. */}
			{isLoading && (
				<View className="flex-1 items-center justify-center m-10 mb-24">
					<ActivityIndicator size="large" />
					<Text className="text-center text-lg pt-2">
						{t('connecting')}
					</Text>
				</View>
			)}

			{/* QR Code Scanner */}
			{!isLoading && !lobby && (
				<ScrollView className="p-4 flex-grow">
					<Text className="text-center text-lg font-medium">
						Scan QR code to join a session.
					</Text>
					<View className="py-6 items-center">
						<QrCodeScanner
							type="lobby-token"
							allowPaste={true}
							onScan={onScanCode}
							onError={onScanError}
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
				</ScrollView>
			)}
		</SafeAreaView>
	);
};

export default JoinSessionScreen;
