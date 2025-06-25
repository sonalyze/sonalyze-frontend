import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, ActivityIndicator } from 'react-native';
import { useTranslation } from 'react-i18next';
import Button from './Button';
import { getSimulationResult, simulateRoom } from '../api/simulationRequests';
import { toast } from 'sonner-native';

type RoomDetailProps = {
	roomId: string;
	hasSimulation: boolean;
	onEdit?: () => void;
};

const RoomDetail: React.FC<RoomDetailProps> = ({
	roomId,
	hasSimulation,
	onEdit = () => {},
}) => {
	const { t } = useTranslation();
	const [simulation, setSimulation] = useState<Simulation | null>(null);
	const [loading, setLoading] = useState(false);
	const [running, setRunning] = useState(false);

	// Debug: prüfen, ob roomId ankommt
	useEffect(() => {
		console.log('RoomDetail received roomId =', roomId);
		if (hasSimulation) {
			setLoading(true);
			getSimulationResult(roomId)
				.then((data) => setSimulation(data))
				.finally(() => setLoading(false));
		}
	}, [hasSimulation, roomId]);

	// Handler für “Create / Rerun Simulation”
	const handleCreateSimulation = async () => {
		setRunning(true);
		try {
			const data = await simulateRoom(roomId);
			console.log('→ simulation result from API:', data);
			setSimulation(data);
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

			{/* Edit-Button */}
			<Button
				label={t('edit')}
				onPress={onEdit}
				type="secondary"
				expand={false}
				className="mb-4"
			/>

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
			{(loading || running) && (
				<ActivityIndicator size="small" className="mt-4" />
			)}

			{/* Simulationsergebnis */}
			{simulation && (
				<View className="mt-4">
					<Text className="text-sm font-semibold mb-2">
						{t('simulationResult')}
					</Text>

					<ScrollView
						horizontal
						showsHorizontalScrollIndicator={false}
						className="flex-row"
					>
						{simulation.values.map(
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
