// src/screens/HistoryDetailScreen.tsx
import { FC } from 'react';
import { View, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { formatWithOptions } from 'date-fns/fp';
import { enUS, de, fr, tr, it, es } from 'date-fns/locale';  
import { useTranslation } from 'react-i18next';

import { RootStackParamList } from '../App';
import SecondaryHeader from '../components/SecondaryHeader';

type ScreenRouteProp = RouteProp<RootStackParamList, 'HistoryDetailScreen'>;
type ScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  'HistoryDetailScreen'
>;

type Props = {
  route: ScreenRouteProp;
  navigation: ScreenNavigationProp;
};

const HistoryDetailScreen: FC<Props> = ({ route, navigation }) => {
  const { t, i18n } = useTranslation();
  const item = route.params.item as Measurement;

  // Durchschnitt
  const avg = (arr: number[]) =>
    arr.length
      ? (arr.reduce((a, b) => a + b, 0) / arr.length).toFixed(2)
      : '–';

  const summary = item.values?.[0]?.[0];

  // Keine explizite Locale-Annotation nötig
  const localeMap: Record<string, typeof enUS> = {
    en: enUS,
    de,
    fr,
    tr,
    it,
    es,
  };
  const locale = localeMap[i18n.language] || enUS;

  // Datum formatieren
const formatLocale = formatWithOptions({ locale: localeMap[i18n.language] || enUS });

const formattedDate =
  i18n.language === 'de'
    // d. MMMM yyyy 'um' HH:mm 'Uhr'
    ? formatLocale("d. MMMM yyyy 'um' HH:mm 'Uhr'", new Date(item.createdAt))
    // PPPp
    : formatLocale('PPPp', new Date(item.createdAt));

  return (
    <SafeAreaView className="flex-1 bg-background">
      <SecondaryHeader title={item.name} onBack={() => navigation.pop()} />
      <View className="p-4">
        <Text className="text-base text-muted mb-4">{formattedDate}</Text>

        {summary && (
          <View className="gap-2">
            <Text className="text-sm">RT60: {avg(summary.rt60)}</Text>
            <Text className="text-sm">C50: {avg(summary.c50)}</Text>
            <Text className="text-sm">C80: {avg(summary.c80)}</Text>
            <Text className="text-sm">D50: {avg(summary.d50)}</Text>
            <Text className="text-sm">G: {avg(summary.g)}</Text>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
};

export default HistoryDetailScreen;
