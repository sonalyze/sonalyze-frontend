import { FC } from 'react';
import {
	View,
	Text,
	Dimensions,
	ScrollView,
	TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { formatWithOptions } from 'date-fns/fp';
import { enUS, de, fr, tr, it, es } from 'date-fns/locale';
import { useTranslation } from 'react-i18next';
import { LineChart } from 'react-native-chart-kit';
import { toast } from 'sonner-native';
import { RootStackParamList } from '../App';
import SecondaryHeader from '../components/SecondaryHeader';
import { useQueryClient } from '@tanstack/react-query';
import {
	deleteMeasurement,
	removeImportedMeasurement,
} from '../api/measurementRequests';
import { deleteRoom, removeImportedRoom } from '../api/roomRequests';
import Icon from '@react-native-vector-icons/lucide';
import { copyToClipboard } from '../tools/clipboardAccess';

// Define route props
type ScreenRouteProp = RouteProp<RootStackParamList, 'HistoryDetailScreen'>;
type ScreenNavigationProp = NativeStackNavigationProp<
	RootStackParamList,
	'HistoryDetailScreen'
>;

const screenWidth = Dimensions.get('window').width;

// Chart config for measurements
const chartConfig = {
	backgroundGradientFrom: '#ffffff',
	backgroundGradientTo: '#ffffff',
	color: (opacity = 1) => `rgba(59, 130, 246, ${opacity})`,
	labelColor: () => '#6b7280',
	strokeWidth: 2,
	decimalPlaces: 2,
	propsForDots: { r: '3', strokeWidth: '1', stroke: '#3B82F6' },
};

const HistoryDetailScreen: FC<{
	route: ScreenRouteProp;
	navigation: ScreenNavigationProp;
}> = ({ route, navigation }) => {
	const { t, i18n } = useTranslation();
	const queryClient = useQueryClient();
	const item = route.params.item as Measurement | Room;
	const isMeasurement = (item as Measurement).values !== undefined;
	const isOwner = item.isOwner;

	// Unified delete handler
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
				// Room case
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

	// Date field selection
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

				{/* Measurement chunk */}
				{isMeasurement ? (
					summary ? (
						(
							['rt60', 'c50', 'c80', 'd50', 'g'] as Array<
								keyof typeof summary
							>
						).map((key) => (
							<View key={key} className="mb-6">
								<Text className="text-sm font-semibold mb-2">
									{key.toUpperCase()}
								</Text>
								<LineChart
									data={{
										labels: summary[key].map(
											(_, i) => `${i + 1}`
										),
										datasets: [{ data: summary[key] }],
									}}
									width={screenWidth - 32}
									height={180}
									chartConfig={chartConfig}
									bezier
									style={{ borderRadius: 8 }}
								/>
							</View>
						))
					) : (
						<Text>{t('noData')}</Text>
					)
				) : (
					// Room details
					<View>
						<View className="mb-4">
							<Text className="text-sm font-semibold mb-1">
								{t('simulation')}
							</Text>
							<Text className="text-base">
								{(item as Room).hasSimulation
									? t('yes')
									: t('no')}
							</Text>
						</View>
					</View>
				)}
			</ScrollView>
		</SafeAreaView>
	);
};

export default HistoryDetailScreen;
