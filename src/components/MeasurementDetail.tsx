import React from 'react';
import { View, Text, Dimensions } from 'react-native';
import { LineChart } from 'react-native-chart-kit';
import { useTranslation } from 'react-i18next';
import tailwindConfig from '../../tailwind.config';

// Hex-to-RGBA Helper (für Chart-Integration)
const hexToRgba = (hex: string, alpha = 1) => {
  const sanitized = hex.replace('#', '');
  const intVal = parseInt(sanitized, 16);
  const r = (intVal >> 16) & 255;
  const g = (intVal >> 8) & 255;
  const b = intVal & 255;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

// Tailwind-Theme-Farben abrufen (Typcasting nötig da Config kein Typ definiert)
const tailwindCfgAny = tailwindConfig as any;
const themeExtend = tailwindCfgAny.theme?.extend;
const colors = themeExtend?.colors ?? {};

// Chart-Konfiguration
const screenWidth = Dimensions.get('window').width;
const chartConfig = {
  backgroundGradientFrom: colors.background,
  backgroundGradientTo: colors.background,
  color: (opacity = 1) => hexToRgba(colors.editForeground, opacity),
  labelColor: () => colors.tileForeground,
  strokeWidth: 2,
  decimalPlaces: 2,
  propsForDots: { r: '3', strokeWidth: '1', stroke: colors.editForeground },
};

type MeasurementDetailProps = {
  summary: Record<string, number[]> | null;
};

const MeasurementDetail: React.FC<MeasurementDetailProps> = ({ summary }) => {
  const { t } = useTranslation();
  if (!summary) return <Text>{t('noData')}</Text>;

  const keys = ['rt60', 'c50', 'c80', 'd50', 'g'] as const;
  return (
    <>
      {keys.map((key) => (
        <View key={key} className="mb-6">
          <Text className="text-sm font-semibold mb-2">
            {key.toUpperCase()}
          </Text>
          <LineChart
            data={{
              labels: summary[key].map((_, i) => `${i + 1}`),
              datasets: [{ data: summary[key] }],
            }}
            width={screenWidth - 32}
            height={180}
            chartConfig={chartConfig}
            bezier
            style={{ borderRadius: 8 }}
          />
        </View>
      ))}
    </>
  );
};

export default MeasurementDetail;