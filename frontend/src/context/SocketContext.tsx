import React, { createContext, useContext, useEffect, useState } from 'react';

type Role = 'driver' | 'user';

interface SocketContextType {
    socket: WebSocket | null;
    connect: (role: Role, id: string) => void;
    disconnect: () => void;
    isConnected: boolean;
    lastMessage: any;
}

const SocketContext = createContext<SocketContextType | undefined>(undefined);

export const SocketProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [socket, setSocket] = useState<WebSocket | null>(null);
    const [isConnected, setIsConnected] = useState(false);
    const [lastMessage, setLastMessage] = useState<any>(null);

    const connect = (role: Role, id: string) => {
        if (socket) {
            socket.close();
        }

        const wsUrl = `ws://localhost:8080/${role}?${role === 'driver' ? 'driverId' : 'userId'}=${id}`;
        const newSocket = new WebSocket(wsUrl);

        newSocket.onopen = () => {
            console.log(`[WS] Connected as ${role}`);
            setIsConnected(true);
        };

        newSocket.onclose = () => {
            console.log(`[WS] Disconnected`);
            setIsConnected(false);
        };

        newSocket.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data);
                console.log('[WS] Received:', data);
                setLastMessage(data);
            } catch (e) {
                console.error('[WS] Parse error', e);
            }
        };

        setSocket(newSocket);
    };

    const disconnect = () => {
        if (socket) {
            socket.close();
            setSocket(null);
            setIsConnected(false);
        }
    };

    return (
        <SocketContext.Provider value={{ socket, connect, disconnect, isConnected, lastMessage }}>
            {children}
        </SocketContext.Provider>
    );
};

export const useSocket = () => {
    const context = useContext(SocketContext);
    if (!context) {
        throw new Error('useSocket must be used within a SocketProvider');
    }
    return context;
};
