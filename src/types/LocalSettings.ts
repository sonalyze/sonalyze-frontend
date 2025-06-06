/**
 * The application settings stored locally on the user's device.
 */
export type LocalSettings = Readonly<{
	/**
	 * The token to authenticate the user with the server and used as owner token for their data.
	 */
	userToken: string | undefined;

	/**
	 * The language code of the selected locale.
	 */
	locale: string;

	/**
	 * List of servers the user can connect to.
	 * This is used to allow devs to witch between different servers for testing purposes.
	 */
	servers: string[];

	/**
	 * The currently selected server.
	 */
	currentServer: string;
}>;
