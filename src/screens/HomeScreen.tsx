import { FC } from 'react';
import { Text, ScrollView, View, TouchableOpacity } from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import * as Progress from 'react-native-progress';

import { RootStackParamList } from '../App';
import Button from '../components/Button';
import Card from '../components/Card';
import HistoryItem from '../components/HistoryItem';
import { Settings } from 'lucide-react-native';

import { useUnifiedHistory } from '../hooks/useUnifiedHistory';

//Props
type HomeScreenNavigationProp = NativeStackNavigationProp<
	RootStackParamList,
	'HomeScreen'
>;
type HomeScreenProps = {
	navigation: HomeScreenNavigationProp;
};

const HomeScreen: FC<HomeScreenProps> = (props) => {
	const { navigation } = props;
	const { t } = useTranslation();
	const { isLoading, error, items: recent } = useUnifiedHistory(3);

	return (
		<SafeAreaView className="flex-1 bg-background">
			{/* Header */}
			<View className="relative h-[60px] flex-row items-center justify-between px-5 py-3 bg-card">
				<Text className="text-2xl font-semibold text-foreground">
					Sonalyze
				</Text>
				<Settings
					size={24}
					color="#000"
					onPress={() => navigation.push('SettingsScreen')}
					
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

					{!isLoading &&
						recent.length > 0 &&
						recent.map((item) => (
							<TouchableOpacity
								key={`${item.id}-${item.createdAt}-${item.type}`}
								onPress={() =>
									navigation.navigate('HistoryDetailScreen', {
										item: item.raw,
									})
								}
							>
								<HistoryItem
									item={
										item.type === 'room'
											? ({
													...(item.raw as Room),
													createdAt: item.createdAt,
												} as any)
											: (item.raw as Measurement)
									}
								/>
							</TouchableOpacity>
						))}

					<Button
						label={t('viewAll')}
						onPress={() => navigation.push('HistoryScreen')}
					/>
				</Card>
			</ScrollView>
		</SafeAreaView>
	);
};

export default HomeScreen;
