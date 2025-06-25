import axios from 'axios';
import { io, Socket } from 'socket.io-client';

export const axiosClient = axios.create({
	baseURL: 'https://api.dev.sonalyze.de',
	headers: {
		'Content-Type': 'application/json',
		"Authorization": `Bearer 6850270166bd13f76669e32c`,
	},
});

/**
 * Creates a new Socket.IO client instance.
 * @param url The base URL of the Socket.IO server.
 * @param userToken The user token for authentication.
 * @returns Socket instance.
 */
export function createSocket(url: string, userToken: string): Socket {
	return io(url, {
		transports: ['polling'],
		autoConnect: false,
		reconnectionAttempts: 5,
		reconnectionDelay: 1000,
		auth: { token: userToken },
	});
}

export function haveSameKeys(a: object, b: object): boolean {
	const aKeys = Object.keys(a).sort();
	const bKeys = Object.keys(b).sort();
	return (
		aKeys.length === bKeys.length &&
		aKeys.every((key, i) => key === bKeys[i])
	);
}
