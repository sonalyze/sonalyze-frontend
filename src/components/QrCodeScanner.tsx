import { FC, useEffect, useRef, useState } from 'react';
import Card from './Card';
import {
	BarcodeScanningResult,
	CameraView,
	useCameraPermissions,
} from 'expo-camera';
import { Text, View } from 'react-native';
import Icon from '@react-native-vector-icons/lucide';
import Button from './Button';
import { getFromClipboard } from '../tools/clipboardAccess';
import { useTranslation } from 'react-i18next';

type QrCodeScannerProps = {
	type: string;
	allowPaste: boolean;
	onScan: (payload: string) => void;
	onError: (error: 'empty-inaccessible-clipboard' | 'invalid-code') => void;
};

const QrCodeScanner: FC<QrCodeScannerProps> = (props: QrCodeScannerProps) => {
	const { t } = useTranslation();
	const [permission, requestPermission] = useCameraPermissions();
	const [isCameraActive, setIsCameraActive] = useState(false);
	const lastScannedTimestampRef = useRef(0);

	// Ask for camera permission, if required and if possible.
	useEffect(() => {
		if (permission?.granted !== true && permission?.canAskAgain === true) {
			requestPermission();
		}
	}, [permission, requestPermission]);

	// Callback for the "Scan QR Code" button.
	async function onScanCode() {
		setIsCameraActive(true);
	}

	// Callback for the "Paste from Clipboard" button.
	async function onPasteCode() {
		const input = await getFromClipboard();

		if (input) {
			handleInput(input);
		} else {
			props.onError('empty-inaccessible-clipboard');
		}
	}

	// Callback for the "Cancel" button.
	function onCancel() {
		setIsCameraActive(false);
	}

	// Handler for when a QR code is scanned.
	function handleScanned(result: BarcodeScanningResult) {
		// This is ugly, but necessary, since the CameraView might invoke this handler multiple times at once.
		// Furthermore, just using `isCameraActive` would not be sufficient, since the handler might be called multiple times before the state is updated.
		// See martom's answer on Stackoverflow: https://stackoverflow.com/questions/77415039/cannot-set-expo-camera-scan-interval
		const currentTimestamp = Date.now();
		const shouldScan =
			isCameraActive &&
			currentTimestamp - lastScannedTimestampRef.current > 1000;

		if (shouldScan) {
			lastScannedTimestampRef.current = currentTimestamp;
			handleInput(result.data);
			setIsCameraActive(false);
		}
	}

	// Handler for when input is received, either by scanning or pasting.
	function handleInput(input: string) {
		const split = input.split(':');
		const type = split.at(0);
		const payload = split.at(1);

		if (type === props.type && payload) {
			props.onScan(payload);
		} else {
			props.onError('invalid-code');
		}
	}

	return (
		<Card className="self-center items-center">
			{/* Missing Camera Permission */}
			{permission?.granted !== true && (
				<>
					<Icon name="camera-off" size={64} />
					<Text className="text-lg text-center font-medium">
						{t('missingCameraPermission')}
					</Text>

					{/* If the app cannot ask again, ask the user to go to their settings. */}
					{permission?.canAskAgain !== true && (
						<Text className="text-base text-center">
							{t('cameraPermissionInfo')}
						</Text>
					)}
				</>
			)}

			{/* Camera Permission Granted */}
			{permission?.granted === true && (
				<>
					{isCameraActive ? (
						<View className="items-center">
							<CameraView
								barcodeScannerSettings={{
									barcodeTypes: ['qr'],
								}}
								style={{
									height: 200,
									width: 200,
									marginBottom: 8,
									borderRadius: 10,
									backgroundColor: 'black',
									overflow: 'hidden',
								}}
								onBarcodeScanned={handleScanned}
							/>
							<Button label={t('cancel')} onPress={onCancel} />
						</View>
					) : (
						<Button
							label={t('scanQrCode')}
							leadingIcon="scan-qr-code"
							onPress={onScanCode}
							extend={false}
						/>
					)}
				</>
			)}

			{/* Paste Button */}
			{props.allowPaste && !isCameraActive && (
				<>
					<Text className="text-base my-2">{t('or')}</Text>
					<Button
						label={t('pasteFromClipboard')}
						leadingIcon="clipboard"
						onPress={onPasteCode}
						extend={false}
					/>
				</>
			)}
		</Card>
	);
};

export default QrCodeScanner;
