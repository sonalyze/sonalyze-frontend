import { View } from 'react-native';
import { FC } from 'react';
import QRCode from 'react-native-qrcode-svg';
import Card from './Card';
import { copyToClipboard } from '../tools/clipboardAccess';
import Button from './Button';
import { useTranslation } from 'react-i18next';

type QrCodeViewerProps = {
	type: string;
	payload: string;
	allowCopy: boolean;
	onCopy: (result: 'success' | 'inaccessible-clipboard') => void;
};

const QrCodeViewer: FC<QrCodeViewerProps> = (props: QrCodeViewerProps) => {
	const { t } = useTranslation();

	// @TODO: Proper state.
	const value = `${props.type}:${props.payload}`;

	// Callback for the "Copy to Clipboard" button.
	async function onCopyCode() {
		const success = await copyToClipboard(value);
		props.onCopy(success ? 'success' : 'inaccessible-clipboard');
	}

	return (
		<Card className="self-center items-center">
			{/* QR Code */}
			<View className="bg-white rounded-xl p-3">
				<QRCode value={value} size={240} />
			</View>

			{/* Copy Button */}
			{props.allowCopy && (
				<Button
					leadingIcon="link"
					label={t('copyToClipboard')}
					onPress={onCopyCode}
					expand={false}
					className="mt-3"
				/>
			)}
		</Card>
	);
};

export default QrCodeViewer;
