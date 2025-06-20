import { View, Text, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import Icon from '@react-native-vector-icons/lucide';
import { toast } from 'sonner-native';
import { useQueryClient } from '@tanstack/react-query';
import { copyToClipboard } from '../tools/clipboardAccess';
import SecondaryHeader from '../components/SecondaryHeader';
import {
	deleteMeasurement,
	removeImportedMeasurement,
} from '../api/measurementRequests';
import { deleteRoom, removeImportedRoom } from '../api/roomRequests';
import { formatWithOptions } from 'date-fns/fp';
import { enUS, de, fr, tr, it, es } from 'date-fns/locale';
import { RootStackParamList } from '../App';
import MeasurementDetail from '../components/MeasurementDetail';
import RoomDetail from '../components/RoomDetail';

// Typen für Navigation und Route
type ScreenRouteProp = RouteProp<RootStackParamList, 'HistoryDetailScreen'>;
type ScreenNavigationProp = NativeStackNavigationProp<
	RootStackParamList,
	'HistoryDetailScreen'
>;
type Props = { route: ScreenRouteProp; navigation: ScreenNavigationProp };

const HistoryDetailScreen = ({ route, navigation }: Props) => {
	const { t, i18n } = useTranslation();
	const queryClient = useQueryClient();

	const item = route.params.item as Measurement | Room;
	const isMeasurement = (item as Measurement).values !== undefined;
	const isOwner = item.isOwner;

	// Zeigt ein Bestätigungs-Popup vor dem Löschen
	const confirmDelete = () => {
		Alert.alert(t('confirmDeletionTitle'), t('confirmDeletionMessage'), [
			{ text: t('cancel'), style: 'cancel' },
			{
				text: t('confirm'),
				style: 'destructive',
				onPress: () => handleDelete(item.id),
			},
		]);
	};

	const handleDelete = async (id: string) => {
		try {
			if (isMeasurement) {
				if (!isOwner) {
					await removeImportedMeasurement(id);
					toast.success(t('removeImportedSuccess'));
				} else {
					await deleteMeasurement(id);
					toast.success(t('deleteSuccess'));
				}
			} else {
				if (!isOwner) {
					await removeImportedRoom(id);
					toast.success(t('removeImportedRoomSuccess'));
				} else {
					await deleteRoom(id);
					toast.success(t('deleteRoomSuccess'));
				}
			}
			await queryClient.invalidateQueries({ queryKey: ['measurements'] });
			await queryClient.invalidateQueries({ queryKey: ['rooms'] });
			navigation.goBack();
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

	const dateValue = isMeasurement
		? (item as Measurement).createdAt
		: (item as Room).lastUpdatedAt;
	const localeMap: Record<string, typeof enUS> = {
		en: enUS,
		de,
		fr,
		tr,
		it,
		es,
	};
	const formatLocale = formatWithOptions({
		locale: localeMap[i18n.language] || enUS,
	});
	const formattedDate =
		i18n.language === 'de'
			? formatLocale("d. MMMM yyyy 'um' HH:mm 'Uhr'", new Date(dateValue))
			: formatLocale('PPPp', new Date(dateValue));

	const summary = isMeasurement
		? (item as Measurement).values?.[0]?.[0] || null
		: null;

	return (
		<SafeAreaView className="flex-1 bg-background">
			<SecondaryHeader
				title={item.name}
				onBack={() => navigation.pop()}
				rightIconName="trash-2"
				rightIconId={item.id}
				onRightIconPress={confirmDelete}
			/>

			<ScrollView className="p-4">
				<View className="flex-row items-center mb-2">
					<Text className="text-base text-muted">ID: {item.id}</Text>
					<TouchableOpacity
						onPress={() => {
							copyToClipboard(item.id);
							toast.success(t('copySuccess'));
						}}
						className="ml-2"
					>
						<Icon name="copy" size={18} />
					</TouchableOpacity>
				</View>

				<Text className="text-base text-muted font-medium mb-4">
					{formattedDate}
				</Text>

				{isMeasurement ? (
					<MeasurementDetail summary={summary} />
				) : (
					<RoomDetail hasSimulation={(item as Room).hasSimulation} />
				)}
			</ScrollView>
		</SafeAreaView>
	);
};

export default HistoryDetailScreen;
