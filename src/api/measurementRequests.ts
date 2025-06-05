import { axiosClient } from '../tools/helpers';

/**
 * Get measurement information associated with the user
 * @returns List of measurement information
 */
async function getMeasurements(): Promise<Measurement> {
	const res = await axiosClient.get<Measurement>(`/measurements`);

	return res.data;
}

/**
 * Delete the measurement with the given id
 * @param id - The id of the measurement to delete
 */
async function deleteMeasurement(id: string): Promise<void> {
	await axiosClient.delete(`/measurements/${id}`);
}

/**
 * Import measurement owned by another user
 * @param id - The id of the measurement to import
 * @returns The measurement information
 */
async function importMeasurement(id: string): Promise<Measurement> {
	const res = await axiosClient.get<Measurement>(
		`/measurements/imported/${id}`
	);

	return res.data;
}

/**
 * Remove subscription to an imported measurement
 * @param id - The id of the measurement to remove
 */
async function removeImportedMeasurement(id: string): Promise<void> {
	await axiosClient.delete<Measurement>(`/measurements/imported/${id}`);
}
