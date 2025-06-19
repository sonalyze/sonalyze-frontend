import { axiosClient } from '../tools/helpers';

/**
 * Get general information about the rooms associated with the user
 * @returns List of general room information
 */
export async function getRooms(): Promise<Room[]> {
	const res = await axiosClient.get<Room[]>('/room/');
	return res.data;
}

/**
 * Delete the room with the given sharedId
 * @param id - The id of the room to delete
 */
export async function deleteRoom(id: string): Promise<void> {
	await axiosClient.delete(`/room/${id}`);
}

/**
 * Import room owned by another user
 * @param id - The id of the room to import
 * @returns The room information
 */
export async function importRoom(id: string): Promise<Room> {
	const res = await axiosClient.get<Room>(`/room/imported/${id}`);
	return res.data;
}

/**
 * Remove subscription to an imported room
 * @param id - The id of the room to remove
 */
export async function removeImportedRoom(id: string): Promise<void> {
	await axiosClient.delete<Measurement>(`/room/imported/${id}`);
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
	const data = await axiosClient.post<Room>('/room', {
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
	await axiosClient.put(`/room/${id}`, {
		name,
	});
}

/**
 * Get the scene data of the room with the given id
 * @param id - The sharedId of the room to get
 * @returns The scene data of the room
 */
export async function getRoomScene(id: string): Promise<RoomScene> {
	const data = await axiosClient.get<RoomScene>(`/room/${id}/scene`);
	return data.data;
}

/**
 * Update the scene data of the room with the given id
 * @param id - The sharedId of the room to update
 * @param scene - The new scene data of the room
 */
export async function updateRoomScene(
	id: string,
	scene: RoomScene
): Promise<void> {
	await axiosClient.put(`/room/${id}/scene`, {
		scene,
	});
}
