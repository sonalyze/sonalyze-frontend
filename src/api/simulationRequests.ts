import { axiosClient } from '../tools/helpers';

/**
 * Get existing simulation results for the given room id
 * @param id - The id of the room to get the simulation result for
 * @returns The simulation results of the room
 */
async function getSimulationResult(id: string): Promise<Simulation> {
	const res = await axiosClient.get<Simulation>(
		`/rooms/${id}/simulation/result`
	);

	return res.data;
}

/**
 * Run a simulation for the given room id
 * @param id - The id of the room to create the simulation for
 * @param scene - The scene data of the room to create the simulation for
 * @returns The simulation results
 */
async function simulateRoom(id: string): Promise<Simulation> {
	const res = await axiosClient.post<Simulation>(`/rooms/${id}/simulation`);

	return res.data;
}
