import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../App';
import { FC, useEffect, useRef, useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import SecondaryHeader from '../components/SecondaryHeader';
import { useTranslation } from 'react-i18next';
import { useSocket } from '../hooks/useSocket';
import {
	ActivityIndicator,
	FlatList,
	ScrollView,
	Text,
	View,
} from 'react-native';
import { showHapticErrorToast } from '../tools/hapticToasts';
import QrCodeScanner from '../components/QrCodeScanner';
import Button from '../components/Button';

type JoinSessionScreenNavigationProp = NativeStackNavigationProp<
	RootStackParamList,
	'JoinSessionScreen'
>;

type JoinSessionScreenProps = {
	navigation: JoinSessionScreenNavigationProp;
};

type DeviceChoice = {
	deviceType: 'microphone' | 'speaker';
	index: number;
};

const JoinSessionScreen: FC<JoinSessionScreenProps> = (
	props: JoinSessionScreenProps
) => {
	const { t } = useTranslation();
	const [isLoading, setLoading] = useState(false);
	const [isJoining, setJoining] = useState(false);
	const [hasIndexConflict, setIndexConflict] = useState(false);
	const autoDisconnect = useRef(true);

	const [lobby, setLobby] = useState<string | undefined>(undefined);
	const [microphones, setMicrophones] = useState<number[]>([]);
	const [speakers, setSpeakers] = useState<number[]>([]);

	const [deviceChoice, setDeviceChoice] = useState<DeviceChoice | undefined>(
		undefined
	);

	const socket = useSocket(
		[
			{
				event: 'join_lobby_success',
				handler: (data) => {
					setJoining(false);
					setDeviceChoice(data as DeviceChoice);
					setLobby('thisIsTotalPfusch');
				},
			},
			{
				event: 'join_lobby_fail',
				handler: (data) => {
					setJoining(false);
					const { reason } = data as { reason: string };
					showHapticErrorToast(t('joinError', { reason: reason }));
				},
			},
			{
				event: 'device_choices',
				handler: (data) => {
					const { microphones, speakers } = data as {
						microphones: number[];
						speakers: number[];
					};

					const hasMicConflic =
						deviceChoice?.deviceType === 'microphone' &&
						microphones.filter(
							(item) => item === deviceChoice?.index
						).length > 1;

					const hasSpeakerConflict =
						deviceChoice?.deviceType === 'speaker' &&
						speakers.filter((item) => item === deviceChoice?.index)
							.length > 1;

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
			onConnect: () => {
				setLoading(false);
			},
			onError: () => {
				showHapticErrorToast(t('connectionLost'));
				props.navigation.pop();
			},
		}
	);

	function onSelectDeviceType(newDeviceType: 'microphone' | 'speaker') {
		if (deviceChoice?.deviceType === newDeviceType) {
			return;
		}

		const newIndex =
			newDeviceType === 'microphone'
				? microphones.length
				: speakers.length;

		const newSpeakers = speakers;
		const newMicrophones = microphones;

		if (newDeviceType === 'microphone') {
			newMicrophones.push(newIndex);

			// remove from speakers if it was a speaker
			newSpeakers.splice(newSpeakers.indexOf(deviceChoice?.index || 0));
		} else {
			newSpeakers.push(newIndex);

			// remove from microphones if it was a microphone
			newMicrophones.splice(
				newMicrophones.indexOf(deviceChoice?.index || 0)
			);
		}

		socket.emit('chose_device_type', {
			device: newDeviceType,
			index: newIndex,
		});

		setMicrophones(newMicrophones);
		setSpeakers(newSpeakers);
		setDeviceChoice({ deviceType: newDeviceType, index: newIndex });
	}

	function onSelectIndex(index: number): void {
		if (deviceChoice?.index === index) {
			return;
		}

		socket.emit('chose_device_type', {
			device: deviceChoice!.deviceType,
			index: index,
		});

		setDeviceChoice({
			deviceType: deviceChoice!.deviceType,
			index: index,
		});
	}

	async function onScanCode(code: string) {
		setJoining(true);
		socket.emit('join_lobby', { lobbyId: code });
	}

	function onScanError(
		error: 'empty-inaccessible-clipboard' | 'invalid-code'
	) {
		switch (error) {
			case 'empty-inaccessible-clipboard':
				showHapticErrorToast(t('clipboardError'));
				break;
			case 'invalid-code':
				showHapticErrorToast(t('invalidLobby'));
				break;
		}
	}

	// Ensure the connection is closed whenever the screen is popped.
	useEffect(() => {
		props.navigation.addListener('beforeRemove', () => {
			if (autoDisconnect.current) {
				socket.disconnect();
			}
		});
	}, [props.navigation, autoDisconnect, socket]);

	return (
		<SafeAreaView className="flex-1 bg-background">
			<SecondaryHeader
				title={t('joinSession')}
				onBack={() => props.navigation.pop()}
			/>

			{/* Loading Indicator. */}
			{isLoading || isJoining ? (
				<View className="flex-1 items-center justify-center m-10 mb-24">
					<ActivityIndicator size="large" />
					<Text className="text-center text-lg pt-2">
						{t(isJoining ? 'joining' : 'connecting')}
					</Text>
				</View>
			) : null}

			{/* QR Code Scanner */}
			{!isLoading && !isJoining && !lobby ? (
				<ScrollView className="p-4 flex-grow">
					<Text className="text-center text-lg font-medium">
						{t('joinTitle')}
					</Text>
					<View className="py-6 items-center">
						<QrCodeScanner
							type="lobby-token"
							allowPaste={true}
							onScan={onScanCode}
							onError={onScanError}
						/>
					</View>
					<Text className="text-center text-base">
						{t('joinHint')}
					</Text>
				</ScrollView>
			) : null}

			{!isLoading && !isJoining && lobby && deviceChoice ? (
				<ScrollView className="p-4 flex-grow">
					<Text className="text-center text-lg font-medium">
						{t('connectedAs')}
					</Text>
					<Text className="text-center text-xl font-medium">
						{t(
							deviceChoice.deviceType === 'microphone'
								? 'micNo'
								: 'speakerNo',
							{ number: deviceChoice.index + 1 }
						)}
					</Text>

					<View className="my-6">
						{/* Role Selection */}
						<Text className="text-center text-lg font-medium mb-2">
							{t('selectRole')}
						</Text>

						<View className="flex-row items-center justify-center">
							<Button
								type={
									deviceChoice.deviceType === 'speaker'
										? 'primary'
										: 'secondary'
								}
								leadingIcon="volume-2"
								label={t('speaker')}
								onPress={() => onSelectDeviceType('speaker')}
								expand={false}
								className="flex-1"
							/>
							<View className="w-2" />
							<Button
								type={
									deviceChoice.deviceType === 'microphone'
										? 'primary'
										: 'secondary'
								}
								leadingIcon="mic"
								label={t('microphone')}
								onPress={() => onSelectDeviceType('microphone')}
								expand={false}
								className="flex-1"
							/>
						</View>

						<View className="h-4" />

						{/* Device Number Selection */}
						<Text className="text-center text-lg font-medium mb-2">
							{t('selectNumber')}
						</Text>

						<FlatList
							data={Array.from({
								length:
									deviceChoice?.deviceType === 'microphone'
										? microphones.length
										: speakers.length,
							})}
							renderItem={({ item, index }) => (
								<>
									<Button
										type={
											deviceChoice.index === index
												? 'primary'
												: 'secondary'
										}
										label={`${index + 1}`}
										onPress={() => onSelectIndex(index)}
										expand={false}
									/>
									{index <
										(deviceChoice?.deviceType ===
										'microphone'
											? microphones.length
											: speakers.length) -
											1 && <View className="w-2" />}
								</>
							)}
							keyExtractor={(item, index) => index.toString()}
							horizontal={true}
							contentContainerStyle={{
								flexGrow: 1,
								justifyContent: 'center',
							}}
						/>
						{hasIndexConflict ? (
							<Text className="text-red-500 text-center mt-4">
								{t('currentNumberConflict')}
							</Text>
						) : null}
					</View>

					<Text className="text-center text-lg font-medium">
						{t('connectedDevices')}
					</Text>
					<Text className="text-center text-xl font-medium">
						{t('deviceCount', {
							microphones: microphones.length,
							speakers: speakers.length,
						})}
					</Text>

					<Text className="text-center py-4">
						{t('waitingForHost')}
					</Text>
				</ScrollView>
			) : null}
		</SafeAreaView>
	);
};

export default JoinSessionScreen;
