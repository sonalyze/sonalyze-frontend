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

	// Hook lädt Messungen + Räume, liefert Items, Loading, Error & Refetch
	const { isLoading, error, items: combined, refetch } = useUnifiedHistory();

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
			refetch();
		} catch (err: any) {
			console.error('[Import] failed:', err);
			const status = err.response?.status;
			if (status === 404) toast.error(t('notFoundError'));
			else if (status === 422) toast.error(t('invalidIdError'));
			else toast.error(t('genericError'));
		}
	};

	return (
		<SafeAreaView className="flex-1 bg-background">
			<SecondaryHeader
				title={t('historyTitle')}
				onBack={() => navigation.pop()}
				rightIconName="plus"
				rightIconId="import"
				onRightIconPress={() => setShowModal(true)}
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
				<FlatList
					contentContainerStyle={{ padding: 8 }}
					data={combined}
					keyExtractor={(item) =>
						`${item.id}-${item.createdAt}-${item.type}`
					}
					refreshControl={
						<RefreshControl
							refreshing={isLoading}
							onRefresh={refetch}
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
