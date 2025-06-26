import React, { useState } from 'react';
import { View, Text, ScrollView, ActivityIndicator } from 'react-native';
import { useTranslation } from 'react-i18next';
import Button from './Button';
import { getSimulationResult, simulateRoom } from '../api/simulationRequests';
import { useQuery, useQueryClient } from '@tanstack/react-query';

type RoomDetailProps = {
	roomId: string;
	hasSimulation: boolean;
};

const RoomDetail: React.FC<RoomDetailProps> = ({ roomId, hasSimulation }) => {
	const { t } = useTranslation();
	const [running, setRunning] = useState(false);

	const simulationQuery = useQuery<Simulation, Error>({
		queryKey: ['simulation', roomId],
		queryFn: () => getSimulationResult(roomId),
	});
	const queryClient = useQueryClient();

	// Handler für “Create / Rerun Simulation”
	const handleCreateSimulation = async () => {
		setRunning(true);
		try {
			await simulateRoom(roomId);
			console.log('Simulation completed');
			queryClient.invalidateQueries({ queryKey: ['simulation', roomId] });
		} finally {
			setRunning(false);
		}
	};

	return (
		<View className="mb-4">
			{/* Überschrift + Rechteck */}
			<Text className="text-lg font-semibold ml-1 px-2 py-2">
				{t('room')}
			</Text>
			<View className="w-full h-[200px] bg-gray-200 justify-center items-center mb-2">
				<Text className="text-base">{t('roomView')}</Text>
			</View>

			{/* Simulation-Header & Button */}
			<Text className="text-lg font-semibold ml-1 px-2 py-2 ">
				{t('simulation')}
			</Text>
			<Button
				label={
					hasSimulation
						? t('rerunSimulation')
						: t('createNewSimulation')
				}
				onPress={handleCreateSimulation}
				type="primary"
				expand
				disabled={running}
			/>

			{/* Lade-Indikator */}
			{(simulationQuery.isLoading || running) && (
				<ActivityIndicator size="small" className="mt-4" />
			)}

			{/* Simulationsergebnis */}
			{simulationQuery.data && (
				<View className="mt-4">
					<Text className="text-sm font-semibold mb-2">
						{t('simulationResult')}
					</Text>

					<ScrollView
						horizontal
						showsHorizontalScrollIndicator={false}
						className="flex-row"
					>
						{simulationQuery.data.values.map(
							(row: AcousticParameters[], rowIndex) => (
								<View key={rowIndex} className="flex-col mr-4">
									{row.map((param, colIndex) => (
										<View
											key={colIndex}
											className="w-[140px] border border-gray-300 p-2 rounded mb-2"
										>
											<Text className="text-xs font-semibold mb-1">
												{`${t('cell')} [${rowIndex},${colIndex}]`}
											</Text>
											<Text className="text-xs">
												{`${t('rt60')}: [${param.rt60.join(', ')}]`}
											</Text>
											<Text className="text-xs">
												{`${t('c50')}: [${param.c50.join(', ')}]`}
											</Text>
											<Text className="text-xs">
												{`${t('c80')}: [${param.c80.join(', ')}]`}
											</Text>
											<Text className="text-xs">
												{`${t('g')}: [${param.g.join(', ')}]`}
											</Text>
											<Text className="text-xs">
												{`${t('d50')}: [${param.d50.join(', ')}]`}
											</Text>
										</View>
									))}
								</View>
							)
						)}
					</ScrollView>
				</View>
			)}
		</View>
	);
};

export default RoomDetail;
