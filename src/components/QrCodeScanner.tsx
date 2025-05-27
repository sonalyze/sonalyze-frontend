import { FC, useEffect, useState } from 'react';
import Card from './Card';
import { BarcodeScanningResult, CameraView, useCameraPermissions } from 'expo-camera';
import { Text, View } from 'react-native';
import Icon from '@react-native-vector-icons/lucide';
import Button from './Button';
import { getFromClipboard } from '../tools/clipboardAccess';

type QrCodeScannerProps = {
    type: string,
    allowPaste: boolean,
    onScan: (payload: string) => void,
    onError: (error: "empty-clipboard" | "invalid-code") => void,
};

const QrCodeScanner: FC<QrCodeScannerProps> = (props: QrCodeScannerProps) => {
    const [permission, requestPermission] = useCameraPermissions();
    const [isCameraActive, setIsCameraActive] = useState(false);
    const [shouldScan, setShouldScan] = useState(false);

    // Ask for camera permission, if required and if possible.
    useEffect(() => {
        if (permission?.granted !== true && permission?.canAskAgain === true) {
            requestPermission();
        }
    }, [permission, requestPermission]);

    // Callback for the "Scan QR Code" button.
    async function onScanCode() {
        setShouldScan(true);
        setIsCameraActive(true);
    }

    // Callback for the "Paste from Clipboard" button.
    async function onPasteCode() {
        const input = await getFromClipboard();

        if (input) {
            handleInput(input);
        }
        else {
            props.onError("empty-clipboard");
        }
    }

    // Callback for the "Cancel" button.
    function onCancel() {
        setIsCameraActive(false);
    }

    // Handler for when a QR code is scanned.
    function handleScanned(result: BarcodeScanningResult) {
        // This flag is necessary, since the CameraView might invoke this handler multiple times at once.
        if (shouldScan) {
            setShouldScan(false);
            handleInput(result.data);
            setIsCameraActive(false);
        }
    }

    // Handler for when input is received, either by scanning or pasting.
    function handleInput(input: string) {
        const split = input.split(":");
        const type = split.at(0);
        const payload = split.at(1);

        if (type === props.type && payload) {
            props.onScan(payload);
        }
        else {
            props.onError("invalid-code");
        }
    }

    return (
        <Card className="items-center">
            {/* Missing Camera Permission */}
            {permission?.granted !== true && (<>
                <Icon name="camera-off" size={64} />
                <Text className="text-lg text-center font-medium">
                    Missing Camera Permission
                </Text>

                {/* If the app cannot ask again, ask the user to go to their settings. */}
                {permission?.canAskAgain !== true && (
                    <Text className="text-base text-center">
                        Sonalyze does not have permission to access your camera.
                        Open your device settings to enable camera access.
                    </Text>
                )}
            </>)}

            {/* Camera Permission Granted */}
            {permission?.granted === true && (<>
                {isCameraActive ? (
                    <View className='items-center'>
                        <CameraView
                            barcodeScannerSettings={{
                                barcodeTypes: ["qr"],
                            }}
                            style={{
                                height: 200,
                                width: 200,
                                marginBottom: 8,
                                borderRadius: 15,
                                backgroundColor: "black",
                                overflow: "hidden"
                            }}
                            onBarcodeScanned={handleScanned}
                        />
                        <Button label="Cancel" onPress={onCancel} />
                    </View>
                ) : (<Button label="Scan QR Code" onPress={onScanCode} />)}
            </>)}

            {/* Allow Paste */}
            {props.allowPaste && !isCameraActive && (<>
                <Text className="text-base my-2">or</Text>
                <Button label="Paste from Clipboard" onPress={onPasteCode} />
            </>)}
        </Card>
    );
};

export default QrCodeScanner;