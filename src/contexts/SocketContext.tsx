import React, { createContext, FC, ReactNode, useContext } from 'react';
import { Socket } from 'socket.io-client';
import { createSocket } from '../tools/helpers';

type SocketContextType = {
	socket: Socket;
};

type SocketProviderProps = {
	children: ReactNode;
};

const SocketContext = createContext<SocketContextType | undefined>(undefined);

export const SocketProvider: FC<SocketProviderProps> = ({ children }) => {
	const socket = React.useMemo(() => createSocket(), []);
	return (
		<SocketContext.Provider value={{ socket }}>
			{children}
		</SocketContext.Provider>
	);
};

export const useSocketContext = (): SocketContextType => {
	const ctx = useContext(SocketContext);
	if (ctx == null) {
		throw new Error('useSocketContext must be in SocketProvider');
	}
	return ctx;
};
