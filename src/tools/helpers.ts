import axios from 'axios';
import { io, Socket } from 'socket.io-client';

export const axiosClient = axios.create({
	baseURL: 'https://api.dev.sonalyze.de',
	headers: {
		'Content-Type': 'application/json',
		'Authorization': `Bearer 6850270166bd13f76669e32c`, //for development purposes only
	},
});

export function createSocket(): Socket {
	return io('ws://localhost:8000', {
		transports: ['websocket'],
		autoConnect: false,
		reconnectionAttempts: 5,
		reconnectionDelay: 1000,
	});
}

export function haveSameKeys(a: object, b: object): boolean {
	const aKeys = Object.keys(a).sort();
	const bKeys = Object.keys(b).sort();
	if (aKeys.length !== bKeys.length) return false;
	return aKeys.every((key, i) => key === bKeys[i]);
}
