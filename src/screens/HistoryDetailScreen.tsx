import React, { FC } from 'react';
import { View, Text, Dimensions, ScrollView, TouchableOpacity } from 'react-native';
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
import { deleteMeasurement, removeImportedMeasurement } from '../api/measurementRequests';
import Icon from '@react-native-vector-icons/lucide';
import { copyToClipboard } from '../tools/clipboardAccess';

type ScreenRouteProp = RouteProp<RootStackParamList, 'HistoryDetailScreen'>;
type ScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  'HistoryDetailScreen'
>;

const screenWidth = Dimensions.get('window').width;

const chartConfig = {
  backgroundGradientFrom: '#ffffff',
  backgroundGradientTo: '#ffffff',
  color: (opacity = 1) => `rgba(59, 130, 246, ${opacity})`,
  labelColor: () => '#6b7280',
  strokeWidth: 2,
  decimalPlaces: 2,
  propsForDots: {
    r: '3',
    strokeWidth: '1',
    stroke: '#3B82F6',
  },
};

type HistoryDetailScreenProps = {
  route: ScreenRouteProp;
  navigation: ScreenNavigationProp;
};

const HistoryDetailScreen: FC<HistoryDetailScreenProps> = ({ route, navigation }) => {
  const { t, i18n } = useTranslation();
  const item = route.params.item as Measurement;

  const isImported = !item.isOwner;

  // Handler for delete action
  const handleDelete = async (id: string) => {
    try {
      if (isImported) {
        await removeImportedMeasurement(id);
        toast.success(t('removeImportedSuccess'));
      } else {
        await deleteMeasurement(id);
        toast.success(t('deleteSuccess'));
      }
      navigation.goBack();
    } catch (err: any) {
      console.error('[Delete] failed:', err);
      const status = err.response?.status;
      if (status === 401) {
        toast.error(t('unauthorizedError'));
      } else if (status === 404) {
        toast.error(t('notFoundError'));
      } else if (status === 422) {
        toast.error(t('invalidIdError'));
      } else {
        toast.error(t('genericError'));
      }
    }
  };

  const summary = item.values?.[0]?.[0];
  if (!summary) {
    return (
      <SafeAreaView className="flex-1 bg-background">
        <SecondaryHeader
          title={item.name}
          onBack={() => navigation.pop()}
          rightIconName="trash-2"
          rightIconId={item.id}
          onRightIconPress={handleDelete}
        />
        <View className="p-4">
          <Text>{t('noData')}</Text>
        </View>
      </SafeAreaView>
    );
  }

  const datasets = [
    { label: 'RT60', data: summary.rt60 },
    { label: 'C50', data: summary.c50 },
    { label: 'C80', data: summary.c80 },
    { label: 'D50', data: summary.d50 },
    { label: 'G', data: summary.g },
  ];

  const localeMap: Record<string, typeof enUS> = { en: enUS, de, fr, tr, it, es };
  const formatLocale = formatWithOptions({ locale: localeMap[i18n.language] || enUS });
  const formattedDate =
    i18n.language === 'de'
      ? formatLocale("d. MMMM yyyy 'um' HH:mm 'Uhr'", new Date(item.createdAt))
      : formatLocale('PPPp', new Date(item.createdAt));

  return (
    <SafeAreaView className="flex-1 bg-background">
      <SecondaryHeader
        title={item.name}
        onBack={() => navigation.pop()}
        rightIconName="trash-2"
        rightIconId={item.id}
        onRightIconPress={handleDelete}
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

        <Text className="text-base text-muted font-medium mb-4">{formattedDate}</Text>

        {datasets.map(({ label, data }) => (
          <View key={label} className="mb-6">
            <Text className="text-sm font-semibold mb-2">{label}</Text>
            <LineChart
              data={{ labels: data.map((_, i) => `${i + 1}`), datasets: [{ data }] }}
              width={screenWidth - 32}
              height={180}
              chartConfig={chartConfig}
              bezier
              style={{ borderRadius: 8 }}
            />
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
};

export default HistoryDetailScreen;
