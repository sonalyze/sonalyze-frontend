import { useEffect, useState, useCallback } from 'react';
import { useSocketContext } from '../contexts/SocketContext';

type UseSocketOptions = {
	onConnect?: () => void;
	onDisconnect?: (reason: string) => void;
	onError?: (err: Error) => void;
};

type EventHandler = { event: string; handler: (data: object) => void };

/**
 * Custom hook to manage socket connections and events
 * @description This hook connects to a socket server, listens for specified events,
 * emits events, and provides connection status.
 * It also handles connection and disconnection events, as well as errors.
 * @param events - An array of event handlers, each containing an event name and a handler function.
 * @param options - Optional configuration for connection and error handling.
 */
export const useSocket = (
	events: EventHandler[],
	options: UseSocketOptions = {}
) => {
	const { socket } = useSocketContext();
	const [connected, setConnected] = useState(false);

	const emit = useCallback(
		(event: string, payload?: object) => {
			socket.emit(event, payload);
		},
		[socket]
	);

	useEffect(() => {
		if (!socket.connected) {
			socket.connect();
		}

		const handleConnect = () => {
			setConnected(true);
			options.onConnect?.();
		};
		const handleDisconnect = (reason: string) => {
			setConnected(false);
			options.onDisconnect?.(reason);
		};
		const handleError = (err: Error) => {
			options.onError?.(err);
		};

		socket.on('connect', handleConnect);
		socket.on('disconnect', handleDisconnect);
		socket.on('connect_error', handleError);

		events.forEach(({ event, handler }) => {
			socket.on(event, handler);
		});

		return () => {
			socket.off('connect', handleConnect);
			socket.off('disconnect', handleDisconnect);
			socket.off('connect_error', handleError);
			events.forEach(({ event, handler }) => {
				socket.off(event, handler);
			});
		};
	}, [events, options, socket]);

	return { connected, emit };
};
