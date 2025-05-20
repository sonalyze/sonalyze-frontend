import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import {
	View,
	Text,
	SafeAreaView,
	TouchableOpacity,
	ScrollView,
} from 'react-native';
import { FC } from 'react';
import Icon from '@react-native-vector-icons/lucide';
import { RootStackParamList } from '../../App';
import QrCodeViewer from '../../components/QrCodeViewer';
import { useLocalSettings } from '../../contexts/LocalSettingsContext';
import { useCameraPermissions } from 'expo-camera';
import Button from '../../components/Button';
import { toast } from 'sonner-native';
import { getFromClipboard } from '../../tools/clipboardAccess';

import SecondaryHeader from '../../components/SecondaryHeader';

type QrScanScreenNavigationProp = NativeStackNavigationProp<
	RootStackParamList,
	'QrScanScreen'
>;

type QrScanScreenProps = {
	navigation: QrScanScreenNavigationProp;
};

const QrScanScreen: FC<QrScanScreenProps> = (props: QrScanScreenProps) => {
	const { settings, updateSettings } = useLocalSettings();

	const [permission, requestPermission] = useCameraPermissions();

	console.log(settings);

	function handleCodeInput(code: string) {
		if (code.startsWith('user-token:')) {
			const userToken = code.split(':')[1];
			updateSettings({ userToken: userToken });

			toast.success('Account ID successfully transferred.', {
				duration: 1000,
			});
			return;
		}

		toast('Not a valid Account ID.', {
			duration: 1000,
		});
	}

	return (
		<SafeAreaView className="flex-1 bg-background">
			<SecondaryHeader
				title="Scan Account QR-Code"
				onBack={() => props.navigation.pop()}
			/>

			{/* Page Content */}
			<ScrollView className="m-2 flex-grow">
				{/* Missing Camera Permission */}
				{permission?.granted !== true && (
					<View>
						<View className="items-center">
							<Icon name="camera-off" size={64}></Icon>
						</View>
						<Text className="mb-1 text-center text-base font-medium">
							Missing Camera Permission
						</Text>
						<Text className="text-center text-sm">
							Sonalyze does not have permission to access the
							camera.
						</Text>

						{/* If the app cannot ask again */}
						{permission?.canAskAgain !== true && (
							<Text className="text-center text-sm">
								Open your device settings to enable camera
								access.
							</Text>
						)}

						{/* If the app can ask again */}
						{permission?.canAskAgain === true && (
							<View className="pt-2">
								<Button
									label="Request Permission"
									onPress={() => requestPermission()}
								/>
							</View>
						)}
					</View>
				)}

				<View className="mb-3 items-center">
					{/* Camera Permission Granted */}
					{permission?.granted === true && (
						<View className="mx-10 items-center">
							<Text className="mb-3 text-center text-base font-medium">
								Scan the QR code from your other devices to
								transfer your account to this device:
							</Text>
							<TouchableOpacity
								className="justify-center flex-row items-center px-3 py-2 rounded-lg bg-primary"
								onPress={() => {}}
							>
								<Icon name="scan-qr-code" />
								<Text className="pl-1 text-sm">
									Scan QR Code
								</Text>
							</TouchableOpacity>
							<Text className="my-2 self-center">or</Text>
						</View>
					)}

					{/* Pasting should be available, regardless of whether camera permission is available. */}
					<TouchableOpacity
						className="justify-center flex-row items-center px-3 py-2 rounded-lg bg-primary"
						onPress={async () => {
							const input = await getFromClipboard();

							if (input) {
								handleCodeInput(input);
							}
						}}
					>
						<Icon name="clipboard-paste" />
						<Text className="pl-1 text-sm">
							Paste from Clipboard
						</Text>
					</TouchableOpacity>
				</View>

				<Text className="text-center text-sm">
					After scanning, your rooms and measurement history will be
					accessible on this device. Alternatively, you can paste your
					Account ID from clipboard and handle the distribution
					manually.
				</Text>
			</ScrollView>
		</SafeAreaView>
	);
};

export default QrScanScreen;
