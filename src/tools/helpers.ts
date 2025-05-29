import axios from 'axios';
import { io, Socket } from 'socket.io-client';

// @TODO replace with backend url
export const axiosClient = axios.create({
	baseURL: 'https://jsonplaceholder.typicode.com',
	headers: {
		'Content-Type': 'application/json',
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
