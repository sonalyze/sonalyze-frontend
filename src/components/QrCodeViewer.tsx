import { View, Text, TouchableOpacity, Image } from 'react-native'
import { FC } from 'react'
import QRCode from 'react-native-qrcode-svg';
import Card from './Card';
import Icon from '@react-native-vector-icons/lucide';
import { copyToClipboard } from '../tools/clipboardAccess';

/**
 * Props for QrCodeViewer.
 */
type QrCodeViewerProps = {
    /**
     * Type to identify the purpose of the QR code, such as an account ID or a share ID.
     * 
     * Used by QrCodeScanner to check whether a scanned QR code is of the expected type.
     */
    type: string;

    /**
     * Data to be encoded in the QR code.
     * 
     * This is the actual information that will be converted into the QR code.
     */
    data: string;
};

/**
 * Component to display a QR code with a copy button.
 * 
 * Generates a QR code from the provided type and data, and provides a button to copy the QR code value to the clipboard.
 */
const QrCodeViewer: FC<QrCodeViewerProps> = (props: QrCodeViewerProps) => {
    const value = `${props.type}:${props.data}`;

    return (
        <Card>
            <View className="items-center">
                {/* QR Code */}
                <View className="bg-white rounded-md p-3">
                    <QRCode
                        value={value}
                        size={160}
                    />
                </View>
                {/* Copy Button */}
                <TouchableOpacity className="pt-2 flex-row items-center" onPress={() => copyToClipboard(value)}>
                    <Icon name="link" />
                    <Text className="pl-1 text-sm">Copy Code to Clipboard</Text>
                </TouchableOpacity>
            </View>
        </Card>
    );
}

export default QrCodeViewer;