import { FC } from 'react';
import { View, Text } from 'react-native';
import Card from './Card';
import { formatWithOptions } from 'date-fns/fp/formatWithOptions';
import { enUS, de, fr, tr, it, es } from 'date-fns/locale';
import { useTranslation } from 'react-i18next';


type Props = {
  item: Measurement;
  type?: 'slim' | 'default';
};

// Derive the correct locale type from one of the actual locale objects
type DFLocale = typeof enUS;

const HistoryItem: FC<Props> = ({ item, type = 'default' }) => {
  const { i18n } = useTranslation();

  const localeMap: Record<string, DFLocale> = {
    en: enUS,
    de,
    fr,
    tr,
    it,
    es,
  };

  const formatDate = (date: Date) => {
    if (i18n.language === 'de') {
      const fmtDe = formatWithOptions(
        { locale: de },
        "d. MMMM yyyy 'um' HH:mm 'Uhr'"
      );
      return fmtDe(date);
    }
    const fmt = formatWithOptions(
      { locale: localeMap[i18n.language] || enUS },
      'PPPp'
    );
    return fmt(date);
  };

  const date = formatDate(new Date(item.createdAt));

  const avg = (arr: number[]) =>
    arr.length
      ? (arr.reduce((a, b) => a + b, 0) / arr.length).toFixed(2)
      : '–';

  const summary = item.values?.[0]?.[0];

  if (type === 'slim') {
    return (
      <Card className="mb-2 bg-white">
        <View>
          <Text className="text-base font-medium mb-2">{item.name}</Text>
          {summary && (
            <View className="flex-row justify-between">
              <View className="items-center flex-1">
                <Text className="text-xs font-semibold">RT60</Text>
                <Text className="text-sm">{avg(summary.rt60)}</Text>
              </View>
              <View className="items-center flex-1">
                <Text className="text-xs font-semibold">C50</Text>
                <Text className="text-sm">{avg(summary.c50)}</Text>
              </View>
              <View className="items-center flex-1">
                <Text className="text-xs font-semibold">C80</Text>
                <Text className="text-sm">{avg(summary.c80)}</Text>
              </View>
              <View className="items-center flex-1">
                <Text className="text-xs font-semibold">D50</Text>
                <Text className="text-sm">{avg(summary.d50)}</Text>
              </View>
              <View className="items-center flex-1">
                <Text className="text-xs font-semibold">G</Text>
                <Text className="text-sm">{avg(summary.g)}</Text>
              </View>
            </View>
          )}
        </View>
      </Card>
    );
  }

  return (
    <Card className="mb-2">
      <View>
        <Text className="text-lg font-medium">{item.name}</Text>
        <Text className="text-sm text-muted">{date}</Text>
      </View>

      {summary && (
        <View className="mt-2">
          <Text className="text-sm">RT60: {avg(summary.rt60)}</Text>
          <Text className="text-sm">C50: {avg(summary.c50)}</Text>
          <Text className="text-sm">C80: {avg(summary.c80)}</Text>
          <Text className="text-sm">D50: {avg(summary.d50)}</Text>
          <Text className="text-sm">G: {avg(summary.g)}</Text>
        </View>
      )}
    </Card>
  );
};

export default HistoryItem;
