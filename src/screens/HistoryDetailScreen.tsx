import { FC } from 'react';
import { View, Text, Dimensions, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { formatWithOptions } from 'date-fns/fp';
import { enUS, de, fr, tr, it, es } from 'date-fns/locale';  
import { useTranslation } from 'react-i18next';

// Neu:
import { LineChart } from 'react-native-chart-kit';

import { RootStackParamList } from '../App';
import SecondaryHeader from '../components/SecondaryHeader';

type ScreenRouteProp = RouteProp<RootStackParamList, 'HistoryDetailScreen'>;
type ScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  'HistoryDetailScreen'
>;

const screenWidth = Dimensions.get('window').width;

const chartConfig = {
  backgroundGradientFrom: '#ffffff',
  backgroundGradientTo: '#ffffff',
  color: (opacity = 1) => `rgba(59, 130, 246, ${opacity})`, // primary-Farbe
  labelColor: () => '#6b7280',
  strokeWidth: 2,
  decimalPlaces: 2,
  propsForDots: {
    r: '3',
    strokeWidth: '1',
    stroke: '#3B82F6',
  },
};

type Props = {
  route: ScreenRouteProp;
  navigation: ScreenNavigationProp;
};

const HistoryDetailScreen: FC<Props> = ({ route, navigation }) => {
  const { t, i18n } = useTranslation();
  const item = route.params.item as Measurement;

  // Hilfsfunktion Mittelwert
  const avg = (arr: number[]) =>
    arr.length
      ? arr.reduce((a, b) => a + b, 0) / arr.length
      : 0;

  const summary = item.values?.[0]?.[0];
  // Wenn summary fehlt, zeigen wir nur den Header & Datum:
  if (!summary) {
    return (
      <SafeAreaView className="flex-1 bg-background">
        <SecondaryHeader title={item.name} onBack={() => navigation.pop()} />
        <View className="p-4">
          <Text>{t('noData')}</Text>
        </View>
      </SafeAreaView>
    );
  }

  // Daten für das Chart: wir nehmen hier einfach die Array-Werte,
  const datasets = [
    { label: 'RT60', data: summary.rt60 },
    { label: 'C50', data: summary.c50 },
    { label: 'C80', data: summary.c80 },
    { label: 'D50', data: summary.d50 },
    { label: 'G', data: summary.g },
  ];

  // Formatierung Datum (unverändert)
  const localeMap: Record<string, typeof enUS> = { en: enUS, de, fr, tr, it, es };
  const formatLocale = formatWithOptions({ locale: localeMap[i18n.language] || enUS });
  const formattedDate =
    i18n.language === 'de'
      ? formatLocale("d. MMMM yyyy 'um' HH:mm 'Uhr'", new Date(item.createdAt))
      : formatLocale('PPPp', new Date(item.createdAt));

  return (
    <SafeAreaView className="flex-1 bg-background">
      <SecondaryHeader title={item.name} onBack={() => navigation.pop()} />

      <ScrollView className="p-4">
        <Text className="text-base text-muted mb-4">{formattedDate}</Text>

        {datasets.map(({ label, data }) => (
          <View key={label} className="mb-6">
            <Text className="text-sm font-semibold mb-2">{label}</Text>
            <LineChart
              data={{ labels: data.map((_, i) => `${i + 1}`), datasets: [{ data }] }}
              width={screenWidth - 32}    // Padding 16px links/rechts
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
