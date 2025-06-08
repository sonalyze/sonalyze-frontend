import { axiosClient } from '../tools/helpers';

/**
 * Create a new user and return the created user information
 * @returns Created user information
 */
export async function register(): Promise<CreatedUser> {
	const res = await axiosClient.get<CreatedUser>(`/users/register`);
	return res.data;
}

/**
 * Migrate the current user to another user using the provided token
 * @param token - The of the other user to migrate to
 */
export async function migrateUser(token: string): Promise<void> {
	await axiosClient.put<void>(`/users/migrate`, { token });
}
