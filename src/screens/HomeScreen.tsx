import { Text, ScrollView, TouchableOpacity, View } from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../App';
import { FC } from 'react';
import Icon from '@react-native-vector-icons/lucide';
import Button from '../components/Button';
import Card from '../components/Card';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import HistoryItem from '../components/HistoryItem';

//Verlauf Beispieldaten
import { sampleHistory } from '../data/sampleHistory';

type HomeScreenNavigationProp = NativeStackNavigationProp<
	RootStackParamList,
	'HomeScreen'
>;

type HomeScreenProps = {
	navigation: HomeScreenNavigationProp;
};

const HomeScreen: FC<HomeScreenProps> = (props: HomeScreenProps) => {
	const { t } = useTranslation();

	return (
		<SafeAreaView className="flex-1 bg-background">
			{/* Header */}
			<View className="relative h-[60px] flex-row items-center justify-between px-5 py-3 bg-card">
				<Text className="text-2xl font-semibold text-foreground">
					Sonalyze
				</Text>
				<TouchableOpacity
					onPress={() => props.navigation.push('SettingsScreen')}
					hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
					style={{ padding: 8 }}
				>
					<Icon name="settings" size={24} color="#000000" />
				</TouchableOpacity>
			</View>

			{/* Page Content */}
			<ScrollView className="m-2">
				<Card
					title={t('cooperativeTitle')}
					subtitle={t('cooperativeSubtitle')}
				>
					<View className="flex-row gap-2">
						<View className="flex-1">
							<Button
								label={t('start')}
								onPress={() =>
									props.navigation.push('StartSessionScreen')
								}
							/>
						</View>
						<View className="flex-1">
							<Button
								label={t('join')}
								onPress={() =>
									props.navigation.push('JoinSessionScreen')
								}
							/>
						</View>
					</View>
				</Card>
				<View className="h-2" />
				<Card
					title={t('simulationTitle')}
					subtitle={t('simulationSubtitle')}
				>
					<View className="flex-row">
						<Button label={t('start')} onPress={() => {}} />
					</View>
				</Card>
				<View className="h-2" />
				<Card title={t('historyTitle')} subtitle={t('historySubtitle')}>
					{sampleHistory.length > 0 && (<View className="my-2">
						{[...sampleHistory]
							.sort(
								(a, b) =>
									new Date(b.createdAt).getTime() -
									new Date(a.createdAt).getTime()
							)
							.slice(0, 3)
							.map((item) => (
								<TouchableOpacity
									key={item.id}
									onPress={() =>
										props.navigation.push(
											'HistoryDetailScreen',
											{ item }
										)
									}
									activeOpacity={0.8}
								>
									<HistoryItem item={item} type="slim" />
								</TouchableOpacity>
							))}
					</View>)}

					<View className="flex-row">
						<Button
							label={t('viewAll')}
							onPress={() =>
								props.navigation.push('HistoryScreen')
							}
						/>
					</View>
				</Card>
			</ScrollView>
		</SafeAreaView>
	);
};

export default HomeScreen;
