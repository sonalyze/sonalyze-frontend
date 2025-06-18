import React, { FC, useState } from 'react';
import {
	Text,
	TouchableOpacity,
	View,
	ActivityIndicator,
	FlatList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { toast } from 'sonner-native';

import { RootStackParamList } from '../App';
import SecondaryHeader from '../components/SecondaryHeader';
import HistoryItem from '../components/HistoryItem';
import ImportModal from '../components/ImportModal';
import { getMeasurements, importMeasurement } from '../api/measurementRequests';
import { getRooms, importRoom } from '../api/roomRequests';


type HistoryScreenNavigationProps = NativeStackNavigationProp<
	RootStackParamList,
	'HistoryScreen'
>;

type HistoryScreenProps = {
	navigation: HistoryScreenNavigationProps;
};

type UnifiedItem = {
	id: string;
	name: string;
	isOwner: boolean;
	createdAt: string;
	type: 'measurement' | 'room';
	raw: Measurement | Room;
};

const HistoryScreen: FC<HistoryScreenProps> = ({ navigation }) => {
	const { t } = useTranslation();
	const [showModal, setShowModal] = useState(false);

	// Messungen
	const measurementsQuery = useQuery<Measurement[], Error>({
		queryKey: ['measurements'],
		queryFn: getMeasurements,
		retry: false,
	});

	// Räume
	const roomsQuery = useQuery<Room[], Error>({
		queryKey: ['rooms'],
		queryFn: getRooms,
		retry: false,
	});

	const {
		data: measurements = [],
		isLoading: loadingMeasurements,
		error: errorMeasurements,
		refetch: refetchMeasurements,
	} = measurementsQuery;

	const {
		data: rooms = [],
		isLoading: loadingRooms,
		error: errorRooms,
		refetch: refetchRooms,
	} = roomsQuery;

	const isLoading = loadingMeasurements || loadingRooms;
	const error = errorMeasurements || errorRooms;

	const handleImport = async (id: string, type: 'measurement' | 'room') => {
		if (!id.trim()) {
			toast.error(t('invalidIdError'));
			return;
		}

		try {
			if (type === 'measurement') {
				await importMeasurement(id);
				refetchMeasurements();
			} else {
				// room → importRoom
				await importRoom(id);
				refetchRooms();
			}

			toast.success(t('importSuccess'));
			setShowModal(false);
		} catch (err: any) {
			console.error('[Import] failed:', err);
			const status = err.response?.status;
			if (status === 404) toast.error(t('notFoundError'));
			else if (status === 422) toast.error(t('invalidIdError'));
			else toast.error(t('genericError'));
		}
	};

	const combined: UnifiedItem[] = [
		...measurements.map((m) => ({
			id: m.id,
			name: m.name,
			isOwner: m.isOwner,
			createdAt: m.createdAt,
			type: 'measurement' as const,
			raw: m,
		})),
		...rooms.map((r) => ({
			id: r.id,
			name: r.name,
			isOwner: r.isOwner,
			createdAt: r.lastUpdatedAt,
			type: 'room' as const,
			raw: r,
		})),
	].sort(
		(a, b) =>
			new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
	);

	return (
		<SafeAreaView className="flex-1 bg-background">
			<SecondaryHeader
				title={t('historyTitle')}
				onBack={() => navigation.pop()}
				rightIconName="plus"
				rightIconId="import"
				onRightIconPress={() => setShowModal(true)}
			/>

			{isLoading && (
				<View className="flex-1 justify-center items-center">
					<ActivityIndicator size="large" />
				</View>
			)}

			{!isLoading && error && (
				<Text className="text-red-500 text-center p-4">
					{t('history.errorLoad')}
				</Text>
			)}

			{!isLoading && !error && (
				<FlatList
					contentContainerStyle={{ padding: 8 }}
					data={combined}
					keyExtractor={(item) =>
						`${item.id}-${item.createdAt}-${item.type}`
					}
					renderItem={({ item }) => {
						const displayItem =
							item.type === 'room'
								? {
										...(item.raw as Room),
										createdAt: item.createdAt,
									}
								: (item.raw as Measurement);
						return (
							<TouchableOpacity
								className="active-opacity-80"
								onPress={() =>
									navigation.push('HistoryDetailScreen', {
										item: item.raw,
									})
								}
							>
								<HistoryItem item={displayItem} />
							</TouchableOpacity>
						);
					}}
				/>
			)}

			<ImportModal
				visible={showModal}
				onClose={() => setShowModal(false)}
				onImport={handleImport}
			/>
		</SafeAreaView>
	);
};

export default HistoryScreen;
