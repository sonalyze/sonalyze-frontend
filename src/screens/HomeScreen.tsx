import { FC } from 'react';
import { Text, ScrollView, View, ActivityIndicator } from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import Icon from '@react-native-vector-icons/lucide';
import { useQuery } from '@tanstack/react-query';
import * as Progress from 'react-native-progress';

import { RootStackParamList } from '../App';
import Button from '../components/Button';
import Card from '../components/Card';
import HistoryItem from '../components/HistoryItem';
import { getMeasurements } from '../api/measurementRequests';
import { TouchableOpacity } from 'react-native';


type HomeScreenNavigationProp = NativeStackNavigationProp<
	RootStackParamList,
	'HomeScreen'
>;

type HomeScreenProps = {
	navigation: HomeScreenNavigationProp;
};

const HomeScreen: FC<HomeScreenProps> = ({ navigation }) => {
	const { t } = useTranslation();
	const {
		data: history = [],
		isLoading,
		isFetching,
		error,
		refetch,
	} = useQuery<Measurement[], Error>({
		queryKey: ['measurements'],
		queryFn: getMeasurements,

		retry: 2,
		retryDelay: (
			attemptIndex 
		) => Math.min(1000 * 2 ** attemptIndex, 30000),

		refetchOnReconnect: true,

		refetchOnMount: 'always',
	});

	return (
		<SafeAreaView className="flex-1 bg-background">
			{/* Header */}
			<View className="relative h-[60px] flex-row items-center justify-between px-5 py-3 bg-card">
				<Text className="text-2xl font-semibold text-foreground">
					Sonalyze
				</Text>
				<Icon
					name="settings"
					size={24}
					color="#000"
					onPress={() => navigation.push('SettingsScreen')}
					style={{ padding: 8 }}
				/>
			</View>

			{isLoading && (
				<Progress.Bar
					indeterminate
					width={null}
					color={'#C3E7FF'}
					unfilledColor={'#F9FAFB'}
					height={4}
					borderWidth={0}
				/>
			)}

			{/* Page Content */}
			<ScrollView className="m-2">
				{/* Cooperative Card */}
				<Card
					title={t('cooperativeTitle')}
					subtitle={t('cooperativeSubtitle')}
				>
					<View className="flex-row gap-2">
						<View className="flex-1">
							<Button
								label={t('start')}
								onPress={() =>
									navigation.push('StartSessionScreen')
								}
							/>
						</View>
						<View className="flex-1">
							<Button
								label={t('join')}
								onPress={() =>
									navigation.push('JoinSessionScreen')
								}
							/>
						</View>
					</View>
				</Card>

				<View className="h-2" />

				{/* Simulation Card */}
				<Card
					title={t('simulationTitle')}
					subtitle={t('simulationSubtitle')}
				>
					<Button label={t('start')} onPress={() => {}} />
				</Card>

				<View className="h-2" />

				{/* History Card */}
				<Card title={t('historyTitle')} subtitle={t('historySubtitle')}>
					{error && (
						<Text className="text-center">
							{t('history.errorLoad')}
						</Text>
					)}

					{!isLoading && history.length > 0 && (
						<View>
							{history.slice(0, 3).map((item) => (
								<TouchableOpacity
									key={item.id}
									activeOpacity={0.8}
									onPress={() =>
										navigation.navigate(
											'HistoryDetailScreen',
											{ item }
										)
									}
								>
									<HistoryItem item={item} type="slim" />
								</TouchableOpacity>
							))}
						</View>
					)}

					<View className="flex-row">
						<Button
							label={t('viewAll')}
							onPress={() => navigation.push('HistoryScreen')}
						/>
					</View>
				</Card>
			</ScrollView>
		</SafeAreaView>
	);
};

export default HomeScreen;
