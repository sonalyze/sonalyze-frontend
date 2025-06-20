import { FC } from 'react';
import {
	View,
	Text,
	Dimensions,
	ScrollView,
	TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import Icon from '@react-native-vector-icons/lucide';
import { LineChart } from 'react-native-chart-kit';
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

// Types for navigation & route
type ScreenRouteProp = RouteProp<RootStackParamList, 'HistoryDetailScreen'>;
type ScreenNavigationProp = NativeStackNavigationProp<
	RootStackParamList,
	'HistoryDetailScreen'
>;

type Props = {
	route: ScreenRouteProp;
	navigation: ScreenNavigationProp;
};

type Measurement = {
	id: string;
	name: string;
	createdAt: string;
	values?: Array<
		Array<Record<'rt60' | 'c50' | 'c80' | 'd50' | 'g', number[]>>
	>;
	isOwner: boolean;
};

type Room = {
	id: string;
	name: string;
	lastUpdatedAt: string;
	hasSimulation: boolean;
	isOwner: boolean;
};

// Chart config
const screenWidth = Dimensions.get('window').width;
const chartConfig = {
	backgroundGradientFrom: '#ffffff',
	backgroundGradientTo: '#ffffff',
	color: (opacity = 1) => `rgba(59, 130, 246, ${opacity})`,
	labelColor: () => '#6b7280',
	strokeWidth: 2,
	decimalPlaces: 2,
	propsForDots: { r: '3', strokeWidth: '1', stroke: '#3B82F6' },
};

// Subcomponent: Measurement Details
const MeasurementDetail: FC<{ summary: Record<string, number[]> | null }> = ({
	summary,
}) => {
	const { t } = useTranslation();
	if (!summary) return <Text>{t('noData')}</Text>;

	const keys = ['rt60', 'c50', 'c80', 'd50', 'g'] as const;
	return (
		<>
			{keys.map((key) => (
				<View key={key} className="mb-6">
					<Text className="text-sm font-semibold mb-2">
						{key.toUpperCase()}
					</Text>
					<LineChart
						data={{
							labels: summary[key].map((_, i) => `${i + 1}`),
							datasets: [{ data: summary[key] }],
						}}
						width={screenWidth - 32}
						height={180}
						chartConfig={chartConfig}
						bezier
						style={{ borderRadius: 8 }}
					/>
				</View>
			))}
		</>
	);
};

// Subcomponent: Room Details
const RoomDetail: FC<{ hasSimulation: boolean }> = ({ hasSimulation }) => {
	const { t } = useTranslation();
	return (
		<View>
			<View className="mb-4">
				<Text className="text-sm font-semibold mb-1">
					{t('simulation')}
				</Text>
				<Text className="text-base">
					{hasSimulation ? t('yes') : t('no')}
				</Text>
			</View>
		</View>
	);
};

const HistoryDetailScreen: FC<Props> = ({ route, navigation }) => {
	const { t, i18n } = useTranslation();
	const queryClient = useQueryClient();

	const item = route.params.item as Measurement | Room;
	const isMeasurement = (item as Measurement).values !== undefined;
	const isOwner = item.isOwner;

	// Delete handler
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
		} catch (err: any) {
			console.error('[Delete] failed:', err);
			const status = err.response?.status;
			if (status === 401) toast.error(t('unauthorizedError'));
			else if (status === 404) toast.error(t('notFoundError'));
			else if (status === 422) toast.error(t('invalidIdError'));
			else toast.error(t('genericError'));
		}
	};

	// Date formatting
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

	// Summary for measurement
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
				onRightIconPress={() => handleDelete(item.id)}
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
