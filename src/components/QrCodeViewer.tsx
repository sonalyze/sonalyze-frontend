import { View } from 'react-native';
import { FC } from 'react';
import QRCode from 'react-native-qrcode-svg';
import Card from './Card';
import { copyToClipboard } from '../tools/clipboardAccess';
import Button from './Button';
import { useTranslation } from 'react-i18next';
import { Link } from 'lucide-react-native';

type QrCodeViewerProps = {
	type: string;
	payload: string;
	allowCopy: boolean;
	onCopy: (result: 'success' | 'inaccessible-clipboard') => void;
};

const QrCodeViewer: FC<QrCodeViewerProps> = (props: QrCodeViewerProps) => {
	const { t } = useTranslation();

	const value = `${props.type}:${props.payload}`;

	// Callback for the "Copy to Clipboard" button.
	async function onCopyCode() {
		const success = await copyToClipboard(value);
		props.onCopy(success ? 'success' : 'inaccessible-clipboard');
	}

	return (
		<Card>
			<View className="self-center items-center">
				{/* QR Code */}
				<View className="bg-white rounded-xl p-3">
					<QRCode value={value} size={240} />
				</View>

				{/* Copy Button */}
				{props.allowCopy && (
					<Button
						leadingIcon={<Link size={18}  />}
						label={t('copyToClipboard')}
						onPress={onCopyCode}
						extend={false}
						className="mt-3"
					/>
				)}
			</View>
		</Card>
	);
};

export default QrCodeViewer;
