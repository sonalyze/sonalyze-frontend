import { FC } from 'react';
import { Text, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../App';
import SecondaryHeader from '../components/SecondaryHeader';
import { useTranslation } from 'react-i18next';
import HistoryItem from '../components/HistoryItem';
import { FlatList } from 'react-native';

import { sampleHistory } from '../data/sampleHistory'; // Testdaten

type HistoryScreenNavigationProp = NativeStackNavigationProp<
	RootStackParamList,
	'HistoryScreen'
>;

type Props = {
	navigation: HistoryScreenNavigationProp;
};

const HistoryScreen: FC<Props> = ({ navigation }) => {
	const { t } = useTranslation();

	return (
		<SafeAreaView className="flex-1 bg-background">
			<SecondaryHeader
				title={t('historyTitle')}
				onBack={() => navigation.pop()}
			/>

			<FlatList
				className="p-2"
				data={[...sampleHistory].sort(
					(a, b) =>
						new Date(b.createdAt).getTime() -
						new Date(a.createdAt).getTime()
				)}
				keyExtractor={(item) => item.id}
				renderItem={({ item }) => (
					<TouchableOpacity
						onPress={() =>
							navigation.push('HistoryDetailScreen', { item })
						}
						activeOpacity={0.8}
					>
						<HistoryItem item={item} />
					</TouchableOpacity>
				)}
				ListEmptyComponent={
					<Text className="text-base text-muted p-4">
						{t('noHistoryText')}
					</Text>
				}
			/>
		</SafeAreaView>
	);
};

export default HistoryScreen;
