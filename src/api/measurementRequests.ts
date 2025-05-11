import { axiosClient } from '../tools/helpers';

/**
 * Get measurement information for the given ids
 * @param ids - The sharedIds of the measurements to get
 * @returns List of measurement information
 */
async function getMeasurements(ids: string[]): Promise<Measurement> {
	const res = await axiosClient.put<Measurement>(`/measurements`, {
		ids,
	});

	return res.data;
}

/**
 * Delete the measurement with the given id
 * @param id - The id of the measurement to delete
 */
async function deleteMeasurement(id: string): Promise<void> {
	await axiosClient.delete(`/measurements/${id}`);
}
