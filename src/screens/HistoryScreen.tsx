import { FC, useState } from 'react';
import {
	View,
	Text,
	FlatList,
	TouchableOpacity,
	ActivityIndicator,
	RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner-native';
import axios from 'axios';
import { useQueryClient } from '@tanstack/react-query';
import { Plus } from 'lucide-react-native';

import { RootStackParamList } from '../App';
import SecondaryHeader from '../components/SecondaryHeader';
import HistoryItem from '../components/HistoryItem';
import ImportModal from '../components/ImportModal';
import { importMeasurement } from '../api/measurementRequests';
import { importRoom } from '../api/roomRequests';
import { useUnifiedHistory } from '../hooks/useUnifiedHistory';

type HistoryScreenNavigationProps = NativeStackNavigationProp<
	RootStackParamList,
	'HistoryScreen'
>;

type HistoryScreenProps = {
	navigation: HistoryScreenNavigationProps;
};

const HistoryScreen: FC<HistoryScreenProps> = ({ navigation }) => {
	const { t } = useTranslation();
	const [showModal, setShowModal] = useState(false);
	const [selected, setSelected] = useState<'all' | 'room' | 'measurement'>(
		'all'
	);
	const queryClient = useQueryClient();

	// Hook lädt Messungen + Räume, liefert Items, Loading, Error
	const { isLoading, error, items: combined } = useUnifiedHistory();

	// Funktion zum Invalidate der Queries
	const refresh = () => {
		queryClient.invalidateQueries({ queryKey: ['measurements'] });
		queryClient.invalidateQueries({ queryKey: ['rooms'] });
	};

	// Import-Handler
	const handleImport = async (id: string, type: 'measurement' | 'room') => {
		if (!id.trim()) {
			toast.error(t('invalidIdError'));
			return;
		}
		try {
			if (type === 'measurement') {
				await importMeasurement(id);
			} else {
				await importRoom(id);
			}
			toast.success(t('importSuccess'));
			setShowModal(false);
			refresh();
		} catch (err: unknown) {
			if (axios.isAxiosError(err)) {
				const status = err.response?.status;
				if (status === 404) toast.error(t('notFoundError'));
				else if (status === 422) toast.error(t('invalidIdError'));
				else toast.error(t('genericError'));
			} else {
				toast.error(t('genericError'));
			}
			console.error('[Import] failed:', err);
		}
	};

	return (
		<SafeAreaView className="flex-1 bg-background">
			<SecondaryHeader
				title={t('historyTitle')}
				onBack={() => navigation.pop()}
				suffix={
					<TouchableOpacity onPress={() => setShowModal(true)}>
						<Plus size={24} />
					</TouchableOpacity>
				}
			/>

			{/* Loading Indicator */}
			{isLoading && (
				<View className="flex-1 justify-center items-center">
					<ActivityIndicator size="large" />
				</View>
			)}

			{/* Error Message */}
			{!isLoading && error && (
				<Text className="text-red-500 text-center p-4">
					{t('history.errorLoad')}
				</Text>
			)}

			{/* List */}
			{!isLoading && !error && (
				<>
					<View className="flex flex-row items-center justify-center gap-2 p-4">
						<TouchableOpacity
							onPress={() => setSelected('all')}
							className={`text-center p-2 px-8 ${selected === 'all' ? 'bg-primary text-primaryForeground' : 'bg-white border border-gray-300'}  rounded-xl`}
						>
							<Text
								className={`${selected === 'all' ? ' text-primaryForeground' : ''}`}
							>
								All
							</Text>
						</TouchableOpacity>
						<TouchableOpacity
							onPress={() => setSelected('room')}
							className={`text-center p-2 px-4 ${selected === 'room' ? 'bg-primary text-primaryForeground' : 'bg-white border border-gray-300'}  rounded-xl`}
						>
							<Text
								className={`${selected === 'room' ? ' text-primaryForeground' : ''}`}
							>
								Rooms
							</Text>
						</TouchableOpacity>
						<TouchableOpacity
							onPress={() => setSelected('measurement')}
							className={`text-center p-2 ${selected === 'measurement' ? 'bg-primary text-primaryForeground' : 'bg-white border border-gray-300'}  rounded-xl`}
						>
							<Text
								className={`${selected === 'measurement' ? ' text-primaryForeground' : ''}`}
							>
								Measurements
							</Text>
						</TouchableOpacity>
					</View>
					<FlatList
						contentContainerStyle={{ padding: 8 }}
						data={combined}
						keyExtractor={(item) =>
							`${item.id}-${item.createdAt}-${item.type}`
						}
						refreshControl={
							<RefreshControl
								refreshing={isLoading}
								onRefresh={refresh}
							/>
						}
						renderItem={({ item }) => {
							const displayItem =
								item.type === 'room'
									? {
											...(item.raw as Room),
											createdAt: item.createdAt,
										}
									: (item.raw as Measurement);

							if (selected === 'all' || selected === item.type) {
								return (
									<TouchableOpacity
										className="active-opacity-80"
										onPress={() => {
											if (item.type === 'measurement') {
												navigation.push(
													'MeasurementDetailScreen',
													{
														item: item.raw as Measurement,
													}
												);
											} else {
												navigation.push(
													'RoomDetailScreen',
													{
														roomId: (
															item.raw as Room
														).id,
													}
												);
											}
										}}
									>
										<HistoryItem
											type={item.type}
											item={displayItem}
										/>
									</TouchableOpacity>
								);
							}
							return <></>;
						}}
					/>
				</>
			)}

			{/* Import Modal */}
			<ImportModal
				visible={showModal}
				onClose={() => setShowModal(false)}
				onImport={handleImport}
			/>
		</SafeAreaView>
	);
};

export default HistoryScreen;
