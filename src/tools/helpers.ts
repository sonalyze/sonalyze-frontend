import axios from 'axios';
import { io, Socket } from 'socket.io-client';

export const axiosClient = axios.create({
	baseURL: 'https://api.dev.sonalyze.de',
	headers: {
		'Content-Type': 'application/json',
	},
});

export function createSocket(): Socket {
	return io('https://api.dev.sonalyze.de', {
		transports: ['polling'],
		autoConnect: false,
		reconnectionAttempts: 5,
		reconnectionDelay: 1000,
	});
}

export function haveSameKeys(a: object, b: object): boolean {
	const aKeys = Object.keys(a).sort();
	const bKeys = Object.keys(b).sort();
	return aKeys.length === bKeys.length && aKeys.every((key, i) => key === bKeys[i]);
}
