import React, { createContext, useContext } from 'react';
import io from 'socket.io-client';

const socket = io('http://localhost:5001'); // The address of the backend server
const SocketContext = createContext(socket);

export const useSocket = () => {
    return useContext(SocketContext);
};

export const SocketProvider = ({ children }) => {
    return (
        <SocketContext.Provider value={socket}>
            {children}
        </SocketContext.Provider>
    );
};
