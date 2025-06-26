import React from 'react';
import { View, Text } from 'react-native';
import { useTranslation } from 'react-i18next';
import Button from './Button';
import { getSimulationResult } from '../api/simulationRequests';
import { useQuery } from '@tanstack/react-query';

type RoomDetailProps = {
	roomId: string;
	hasSimulation: boolean;
	handleSimulation: () => void;
	handleViewExistingSimulation: () => void;
};

const RoomDetail: React.FC<RoomDetailProps> = ({
	roomId,
	hasSimulation,
	handleSimulation,
	handleViewExistingSimulation,
}) => {
	const { t } = useTranslation();

	const simulationQuery = useQuery<Simulation, Error>({
		queryKey: ['simulation', roomId],
		queryFn: () => getSimulationResult(roomId),
	});

	return (
		<View className="mb-4">
			<Text className="text-lg font-semibold ml-1 px-2 py-2">
				{t('room')}
			</Text>
			<View className="w-full h-[200px] rounded-xl bg-gray-200 justify-center items-center mb-2">
				<Text className="text-base">{t('roomView')}</Text>
			</View>

			<Text className="text-lg font-semibold ml-1 px-2 py-2 ">
				{t('simulation')}
			</Text>
			<Button
				label={
					hasSimulation
						? t('rerunSimulation')
						: t('createNewSimulation')
				}
				onPress={handleSimulation}
				type="primary"
				expand
			/>

			{simulationQuery.isSuccess && (
				<Button
					label="View Existing Simulation"
					onPress={handleViewExistingSimulation}
					className="mt-2"
					type="primary"
					expand
				/>
			)}
		</View>
	);
};

export default RoomDetail;
