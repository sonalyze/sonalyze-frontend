import { axiosClient } from "../tools/helpers";


/**
 * Checks whether the API is reachable.
 * @returns {Promise<boolean>} Whether the server is responding to GET requests.
 */
export async function checkApiReachable(): Promise<boolean> {
    const res = await axiosClient.get(`/`);
    return res.status >= 200 && res.status < 300;
}

