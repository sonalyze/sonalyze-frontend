import { FC } from 'react';
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

import { RootStackParamList } from '../App';
import SecondaryHeader from '../components/SecondaryHeader';
import HistoryItem from '../components/HistoryItem';
import { getMeasurements } from '../api/measurementRequests';


type HistoryScreenNavigationProps = NativeStackNavigationProp<
  RootStackParamList,
  'HistoryScreen'
>;

type HistoryScreenProps = {
   navigation: HistoryScreenNavigationProps;
};

const HistoryScreen: FC<HistoryScreenProps> = ({ navigation }) => {
  const { t } = useTranslation();

  const historyQuery = useQuery<Measurement[], Error>({
    queryKey: ['measurements'],
    queryFn: getMeasurements,
    retry: false,
  });

  const {
    data: history = [],
    isLoading,
    error,
  } = historyQuery;

  return (
    <SafeAreaView className="flex-1 bg-background">
      <SecondaryHeader
        title={t('historyTitle')}
        onBack={() => navigation.pop()}
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
          className="p-2"
          data={[...history].sort(
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
          ListEmptyComponent={null}
        />
      )}
    </SafeAreaView>
  );
};

export default HistoryScreen;