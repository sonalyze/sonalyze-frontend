import { axiosClient } from '../tools/helpers';

/**
 * Get general information about the rooms associated with the user
 * @returns List of general room information
 */
async function getRooms(): Promise<Room[]> {
	const data = await axiosClient.get<Room[]>('/rooms');
	return data.data;
}

/**
 * Delete the room with the given sharedId
 * @param id - The id of the room to delete
 */
export async function deleteRoom(id: string): Promise<void> {
	await axiosClient.delete(`/rooms/${id}`);
}

/**
 * Create a new room with the given name and scene data
 * @param name - The name of the room to create
 * @param scene - The scene data of the room to create
 * @returns General information about the created room
 */
export async function createRoom(
	name: string,
	scene: RoomScene
): Promise<Room> {
	const data = await axiosClient.post<Room>('/rooms', {
		name,
		scene,
	});
	return data.data;
}

/**
 * Update the name of the room with the given id
 * @param id - The sharedId of the room to update
 * @param name - The new name of the room
 */
export async function updateRoom(id: string, name: string): Promise<void> {
	await axiosClient.put(`/rooms/${id}`, {
		name,
	});
}

/**
 * Get the scene data of the room with the given id
 * @param id - The sharedId of the room to get
 * @returns The scene data of the room
 */
async function getRoomScene(id: string): Promise<RoomScene> {
	const data = await axiosClient.get<RoomScene>(`/rooms/${id}/scene`);
	return data.data;
}

/**
 * Update the scene data of the room with the given id
 * @param id - The sharedId of the room to update
 * @param scene - The new scene data of the room
 */
async function updateRoomScene(id: string, scene: RoomScene): Promise<void> {
	await axiosClient.put(`/rooms/${id}/scene`, {
		scene,
	});
}

/**
 * Import room owned by another user
 * @param id - The id of the room to import
 * @returns The room information
 */
async function importRoom(id: string): Promise<Room> {
	const res = await axiosClient.get(`/rooms/imported/${id}`);

	return res.data;
}

/**
 * Remove subscription to an imported room
 * @param id - The id of the room to remove
 */
async function removeImportedMeasurement(id: string): Promise<void> {
	await axiosClient.delete<Measurement>(`/rooms/imported/${id}`);
}
