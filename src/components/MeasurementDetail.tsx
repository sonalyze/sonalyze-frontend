import React from 'react';
import { View, Text, Dimensions } from 'react-native';
import { LineChart } from 'react-native-chart-kit';
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

// Tailwind-Theme-Farben abrufen
const tailwindCfgAny = tailwindConfig as any;
const themeExtend = tailwindCfgAny.theme?.extend;
const colors = themeExtend?.colors ?? {};

// Chart-Konfiguration
let screenWidth = Dimensions.get('window').width;

if (screenWidth > 768) {
	screenWidth = 768; // Maximale Breite für Charts auf größeren Bildschirmen
}

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
	values: AcousticParameters[][];
};

const MeasurementDetail: React.FC<MeasurementDetailProps> = (
	props: MeasurementDetailProps
) => {
	return (
		<>
			{props.values.map((mic, mi) => {
				return mic.map((speaker, si) => {
					return Object.entries(speaker).map(([key, val], index) => {
						if (key === 'ir') {
							return null;
						}

						return (
							<View key={key} className="mb-6">
								<Text className="text-sm font-semibold mb-2">
									{key.toUpperCase() +
										' Mic: ' +
										(mi + 1) +
										' Speaker: ' +
										(si + 1)}
								</Text>
								<LineChart
									data={{
										labels: Array.from(
											val,
											(v, i) => `${i + 1}`
										),
										datasets: [{ data: val }],
									}}
									width={screenWidth - 32}
									height={180}
									chartConfig={chartConfig}
									bezier
									style={{ borderRadius: 8 }}
								/>
							</View>
						);
					});
				});
			})}
		</>
	);
};

export default MeasurementDetail;
