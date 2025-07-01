import { View, Text, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner-native';
import { useQueryClient } from '@tanstack/react-query';
import { copyToClipboard } from '../tools/clipboardAccess';
import { Copy } from 'lucide-react-native';
import { Trash2 } from 'lucide-react-native';
import SecondaryHeader from '../components/SecondaryHeader';
import {
	deleteMeasurement,
	removeImportedMeasurement,
} from '../api/measurementRequests';
import { RootStackParamList } from '../App';
import MeasurementDetail from '../components/MeasurementDetail';
import {
	showHapticErrorToast,
	showHapticSuccessToast,
} from '../tools/hapticToasts';

type MeasurementDetailScreenRouteProp = RouteProp<
	RootStackParamList,
	'MeasurementDetailScreen'
>;

type MeasurementDetailScreenNavigationProp = NativeStackNavigationProp<
	RootStackParamList,
	'MeasurementDetailScreen'
>;

type MeasurementDetailScreenProps = {
	route: MeasurementDetailScreenRouteProp;
	navigation: MeasurementDetailScreenNavigationProp;
};

const MeasurementDetailScreen = (props: MeasurementDetailScreenProps) => {
	const { t } = useTranslation();
	const queryClient = useQueryClient();
	const item = props.route.params.item;

	function confirmDelete() {
		Alert.alert(t('confirmDeletionTitle'), t('confirmDeletionMessage'), [
			{ text: t('cancel'), style: 'cancel' },
			{
				text: t('confirm'),
				style: 'destructive',
				onPress: () => handleDelete(item.id),
			},
		]);
	}

	const handleDelete = async (id: string) => {
		try {
			if (!item.isOwner) {
				await removeImportedMeasurement(id);
				toast.success(t('removeImportedSuccess'));
			} else {
				await deleteMeasurement(id);
				toast.success(t('deleteSuccess'));
			}

			await queryClient.invalidateQueries({ queryKey: ['measurements'] });
			await queryClient.invalidateQueries({ queryKey: ['rooms'] });
			props.navigation.goBack();
		} catch (err: unknown) {
			console.error('[Delete] failed:', err);
			let status: number | undefined;
			if (typeof err === 'object' && err !== null && 'response' in err) {
				const resp = (err as any).response;
				if (resp && typeof resp.status === 'number')
					status = resp.status;
			}
			if (status === 401) toast.error(t('unauthorizedError'));
			else if (status === 404) toast.error(t('notFoundError'));
			else if (status === 422) toast.error(t('invalidIdError'));
			else toast.error(t('genericError'));
		}
	};

	async function onCopy() {
		const success = await copyToClipboard(item.id);

		if (success) {
			showHapticSuccessToast(t('copySuccess'));
		} else {
			showHapticErrorToast(t('copyError'));
		}
	}

	// @TODO: Format date!
	const date = new Date(item.createdAt);

	return (
		<SafeAreaView className="flex-1 bg-background">
			<SecondaryHeader
				title={item.name}
				onBack={() => props.navigation.pop()}
				suffix={
					<TouchableOpacity onPress={confirmDelete}>
						<Trash2 size={24} />
					</TouchableOpacity>
				}
			/>

			<ScrollView className="p-4">
				<View className="flex-row items-center mb-2">
					<Text className="text-base text-muted">ID: {item.id}</Text>
					<TouchableOpacity onPress={onCopy} className="ml-2">
						<Copy size={18} />
					</TouchableOpacity>
				</View>

				<Text className="text-base text-muted font-medium mb-2">
					{t('dateFormat', { datetime: date })}
				</Text>
				<Text className="text-base text-muted font-medium mb-4">
					{item.isOwner ? 'Owner' : 'Imported'}
				</Text>

				<MeasurementDetail values={item.values} />
			</ScrollView>
		</SafeAreaView>
	);
};

export default MeasurementDetailScreen;
