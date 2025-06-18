import React, { FC, useState } from 'react';
import {
	Modal,
	View,
	Text,
	TextInput,
	TouchableOpacity,
	KeyboardAvoidingView,
	Platform,
	ActivityIndicator,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner-native';
import Button from '../components/Button';

export type ImportType = 'measurement' | 'room';

const IMPORT_OPTIONS: ImportType[] = ['measurement', 'room'];

interface ImportModalProps {
	visible: boolean;
	onClose: () => void;
	onImport: (id: string, type: ImportType) => Promise<void>;
}

const ImportModal: FC<ImportModalProps> = ({ visible, onClose, onImport }) => {
	const { t } = useTranslation();
	const [inputId, setInputId] = useState('');
	const [type, setType] = useState<ImportType>('measurement');
	const [isLoading, setIsLoading] = useState(false);

	const handleCancel = () => {
		if (isLoading) return;
		setInputId(''); 
		onClose();
	};

	const handleConfirm = async () => {
		// Trimmen der ID vor der Validierung
		const trimmedId = inputId.trim();
		if (isLoading || !trimmedId) {
			toast.error(t('invalidIdError'));
			return;
		}

		setIsLoading(true);
		try {
			await onImport(trimmedId, type);

			setInputId('');
		} catch {
		} finally {
			setIsLoading(false);
		}
	};

	return (
		<Modal
			visible={visible}
			transparent
			animationType="slide"
			onRequestClose={handleCancel}
		>
			<View className="flex-1 bg-black/50 justify-center items-center">
				<KeyboardAvoidingView
					behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
					className="w-11/12"
				>
					<View className="bg-white rounded-xl p-6">
						{/* Selector */}
						<View className="flex-row mb-4">
							{IMPORT_OPTIONS.map((opt) => (
								<TouchableOpacity
									key={opt}
									className={`flex-1 py-2 mx-1 rounded-md ${
										type === opt
											? 'bg-blue-500'
											: 'bg-gray-200'
									}`}
									activeOpacity={0.8}
									onPress={() => !isLoading && setType(opt)}
								>
									<Text
										className={`text-center font-semibold ${
											type === opt
												? 'text-white'
												: 'text-gray-700'
										}`}
									>
										{t(opt)}
									</Text>
								</TouchableOpacity>
							))}
						</View>

						{/* Title & Input */}
						<Text className="text-lg font-medium mb-2">
							{type === 'measurement'
								? t('enterMeasurementId')
								: t('enterRoomId')}
						</Text>
						<TextInput
							value={inputId}
							onChangeText={setInputId}
							placeholder={
								type === 'measurement'
									? t('measurementId')
									: t('roomId')
							}
							editable={!isLoading}
							className="border border-gray-300 rounded-md p-2 mb-6"

						/>

						{/* Buttons */}
						<View className="flex-row">
							<View className="flex-1 mr-2">
								<Button
									label={t('cancel')}
									onPress={handleCancel}
									disabled={isLoading}
									type="secondary" 
								/>
							</View>
							<View className="flex-1">
								<Button
									label={
										isLoading ? t('loading') : t('import')
									}
									onPress={handleConfirm}
									disabled={isLoading} 
								/>
							</View>
						</View>

						{/* Loading Overlay */}
						{isLoading && (
							<View className="absolute inset-0 justify-center items-center bg-white/50 rounded-xl">
								<ActivityIndicator size="large" />
							</View>
						)}
					</View>
				</KeyboardAvoidingView>
			</View>
		</Modal>
	);
};

export default ImportModal;
