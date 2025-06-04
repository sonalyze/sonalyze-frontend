import { axiosClient } from '../tools/helpers';

/**
 * Create a new user and return the created user information
 * @returns Created user information
 */
async function register(): Promise<CreatedUser> {
	const res = await axiosClient.get<CreatedUser>(`/user/register`);

	return res.data;
}

/**
 * Migrate the current user to another user using the provided token
 * @param token - The of the other user to migrate to
 */
async function migrateUser(token: string): Promise<void> {
	await axiosClient.put<void>(`/user/migrate`, { token });
}
