import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../App';
import { FC, useEffect, useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import SecondaryHeader from '../components/SecondaryHeader';
import { useTranslation } from 'react-i18next';
import { useSocket } from '../hooks/useSocket';
import {
	ActivityIndicator,
	Alert,
	FlatList,
	ScrollView,
	Text,
	View,
} from 'react-native';
import { showHapticErrorToast } from '../tools/hapticToasts';
import QrCodeScanner from '../components/QrCodeScanner';
import Button from '../components/Button';
import { Mic, TriangleAlert, Volume2 } from 'lucide-react-native';

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
	const [isConnecting, setIsConnecting] = useState(true);
	const [isJoining, setIsJoining] = useState(false);
	const [hasIndexConflict, setHasIndexConflict] = useState(false);
	const [microphones, setMicrophones] = useState<number[] | undefined>(
		undefined
	);
	const [speakers, setSpeakers] = useState<number[] | undefined>(undefined);
	const [deviceType, setDeviceType] = useState<
		'microphone' | 'speaker' | undefined
	>(undefined);
	const [index, setIndex] = useState<number | undefined>(undefined);

	const socket = useSocket(
		[
			{
				event: 'join_lobby_success',
				handler: async (data) => {
					const { deviceType, index } = data as {
						deviceType: 'microphone' | 'speaker';
						index: number;
					};
					await new Promise((resolve) => setTimeout(resolve, 200));
					setDeviceType(deviceType);
					setIndex(index);
					setIsJoining(false);
				},
			},
			{
				event: 'join_lobby_fail',
				handler: async (data) => {
					const { reason } = data as { reason: string };
					await new Promise((resolve) => setTimeout(resolve, 200));
					setIsJoining(false);
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
						deviceType === 'microphone' &&
						microphones.filter((item) => item === index).length > 1;

					const hasSpeakerConflict =
						deviceType === 'speaker' &&
						speakers.filter((item) => item === index).length > 1;

					setHasIndexConflict(hasMicConflic || hasSpeakerConflict);
					setMicrophones(microphones);
					setSpeakers(speakers);
				},
			},
			{
				event: 'start_measurement',
				handler: () => {
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
			onConnect: async () => {
				await new Promise((resolve) => setTimeout(resolve, 200));
				setIsConnecting(false);
			},
			onDisconnect: async () => {
				setIsConnecting(true);
				setIsJoining(false);
				setSpeakers(undefined);
				setMicrophones(undefined);
				setDeviceType(undefined);
				setIndex(undefined);
			},
			onError: () => {
				showHapticErrorToast(t('connectionLost'));
				props.navigation.pop();
			},
		}
	);

	// Event handler for when the device type is selected.
	function onSelectDeviceType(newDeviceType: 'microphone' | 'speaker') {
		if (deviceType !== newDeviceType) {
			const newIndex =
				newDeviceType === 'microphone'
					? microphones!.length
					: speakers!.length;
			const newSpeakers = speakers!;
			const newMicrophones = microphones!;

			if (newDeviceType === 'microphone') {
				newMicrophones.push(newIndex);
				newSpeakers.splice(newSpeakers.indexOf(index || 0));
			} else {
				newSpeakers.push(newIndex);
				newMicrophones.splice(newMicrophones.indexOf(index || 0));
			}

			socket.emit('chose_device_type', {
				device: newDeviceType,
				index: newIndex,
			});

			setMicrophones(newMicrophones);
			setSpeakers(newSpeakers);
			setDeviceType(newDeviceType);
			setIndex(newIndex);
		}
	}

	// Event handler for when a device number is selected.
	function onSelectIndex(newIndex: number) {
		if (newIndex !== index) {
			socket.emit('chose_device_type', {
				device: deviceType,
				index: newIndex,
			});

			setIndex(newIndex);
		}
	}

	// Event handler for when a QR code is scanned.
	async function onScanCode(code: string) {
		setIsJoining(true);
		socket.emit('join_lobby', { lobbyId: code });
	}

	// Event handler for when an error occurs during scanning.
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
			// Ensure the connection is closed whenever the screen is popped.
			const unsubscribe = props.navigation.addListener(
				'beforeRemove',
				(args) => {
					if (args.data.action.type === 'POP') {
						socket.disconnect();
					}
				}
			);

			return unsubscribe;
		},
		// eslint-disable-next-line react-hooks/exhaustive-deps
		[]
	);

	return (
		<SafeAreaView className="flex-1 bg-background">
			<SecondaryHeader title={t('joinSession')} onBack={onBack} />

			{/* Loading Indicator. */}
			{isConnecting || isJoining ? (
				<View className="flex-1 items-center justify-center m-10 mb-24">
					<ActivityIndicator size="large" />
					<Text className="text-center text-lg pt-2">
						{t(isJoining ? 'joining' : 'connecting')}
					</Text>
				</View>
			) : null}

			{/* QR Code Scanner */}
			{!isConnecting && !isJoining && index === undefined ? (
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

			{/* Page Content. */}
			{!isConnecting && !isJoining && index !== undefined ? (
				<>
					{microphones === undefined || speakers === undefined ? (
						<View className="flex-1 items-center justify-center m-10 mb-24">
							<TriangleAlert size={48} />
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
								{t(
									deviceType === 'microphone'
										? 'micNo'
										: 'speakerNo',
									{ number: index + 1 }
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
											deviceType === 'speaker'
												? 'primary'
												: 'secondary'
										}
										leadingIcon={<Volume2 size={24} />}
										label={t('speaker')}
										onPress={() =>
											onSelectDeviceType('speaker')
										}
										expand={false}
										className="flex-1"
									/>
									<View className="w-2" />
									<Button
										type={
											deviceType === 'microphone'
												? 'primary'
												: 'secondary'
										}
										leadingIcon={<Mic size={24} />}
										label={t('microphone')}
										onPress={() =>
											onSelectDeviceType('microphone')
										}
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
											deviceType === 'microphone'
												? microphones.length
												: speakers.length,
									})}
									renderItem={(info) => (
										<>
											<Button
												type={
													index === info.index
														? 'primary'
														: 'secondary'
												}
												label={`${info.index + 1}`}
												onPress={() =>
													onSelectIndex(info.index)
												}
												expand={false}
											/>
											{info.index <
												(deviceType === 'microphone'
													? microphones.length
													: speakers.length) -
													1 && (
												<View className="w-2" />
											)}
										</>
									)}
									keyExtractor={(item, index) =>
										index.toString()
									}
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
					)}
				</>
			) : null}
		</SafeAreaView>
	);
};

export default JoinSessionScreen;
