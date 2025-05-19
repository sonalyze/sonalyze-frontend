
/**
 * The application settings stored locally on the user's device.
 */
export type LocalSettings = Readonly<{
    /**
     * The token to authenticate the user with the server and used as owner token for their data.
     */
    userToken: string;
}>;