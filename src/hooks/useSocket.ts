import { useEffect, useState, useCallback } from 'react';
import { useSocketContext } from '../contexts/SocketContext';

type UseSocketOptions = {
	onConnect?: () => void;
	onDisconnect?: (reason: string) => void;
	onError?: (err: Error) => void;
};

export const useSocket = (
	namespace: string,
	onMessage: (data: any) => void, // @TODO typings
	options: UseSocketOptions = {}
) => {
	const { socket } = useSocketContext();
	const [connected, setConnected] = useState(false);

	const emit = useCallback(
		(event: string, payload?: any) => {
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

		socket.on(namespace, onMessage);

		return () => {
			socket.off('connect', handleConnect);
			socket.off('disconnect', handleDisconnect);
			socket.off('connect_error', handleError);
			socket.off(namespace, onMessage);
		};
	}, [namespace, onMessage, options, socket]);

	return { connected, emit };
};
