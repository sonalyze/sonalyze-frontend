import { View, Text, TouchableOpacity } from 'react-native';
import { FC } from 'react';
import QRCode from 'react-native-qrcode-svg';
import Card from './Card';
import Icon from '@react-native-vector-icons/lucide';
import { copyToClipboard } from '../tools/clipboardAccess';

type QrCodeViewerProps = {
	type: string;
	payload: string;
};

const QrCodeViewer: FC<QrCodeViewerProps> = (props: QrCodeViewerProps) => {
	const value = `${props.type}:${props.payload}`;

	return (
		<Card>
			<View className="items-center">
				{/* QR Code */}
				<View className="bg-white rounded-md p-3">
					<QRCode value={value} size={200} />
				</View>

				{/* Copy Button */}
				<TouchableOpacity className="pt-2 flex-row items-center" onPress={() => copyToClipboard(value)}>
					<Icon name="link" size={16}/>
					<Text className="pl-2 text-base">Copy to Clipboard</Text>
				</TouchableOpacity>
			</View>
		</Card>
	);
};

export default QrCodeViewer;
