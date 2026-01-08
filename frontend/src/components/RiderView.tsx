import { useEffect, useState } from 'react';
import { useSocket } from '../context/SocketContext';
import { matchService } from '../services/api';

interface RiderViewProps {
    riderId: string;
    location: { lat: number; lng: number };
    onDriverLocationUpdate: (lat: number, lng: number) => void;
}

export function RiderView({ riderId, location, onDriverLocationUpdate }: RiderViewProps) {
    const { connect, disconnect, lastMessage, isConnected } = useSocket();
    const [status, setStatus] = useState('IDLE'); // IDLE, SEARCHING, MATCHED, ON_TRIP
    const [tripInfo, setTripInfo] = useState<any>(null);
    const [logs, setLogs] = useState<string[]>([]);

    useEffect(() => {
        connect('user', riderId);
        return () => disconnect();
    }, [riderId]);

    const addLog = (msg: string) => {
        setLogs(prev => [msg, ...prev].slice(0, 5));
    };

    useEffect(() => {
        if (!lastMessage) return;

        if (lastMessage.type === 'DRIVER_ACCEPTED') {
            setStatus('MATCHED');
            setTripInfo(lastMessage);
            addLog(`Driver ${lastMessage.driverId} accepted your trip!`);
        }

        if (lastMessage.type === 'LOCATION_UPDATE') {
            const { lat, lng } = lastMessage;
            addLog(`Driver moved to: ${lat.toFixed(4)}, ${lng.toFixed(4)}`);
            onDriverLocationUpdate(lat, lng);
        }

        if (lastMessage.type === 'TRIP_COMPLETED') {
            setStatus('IDLE');
            setTripInfo(null);
            addLog('Trip Completed!');
            alert('Your trip has ended!');
        }
    }, [lastMessage]);

    const handleRequest = async () => {
        setStatus('SEARCHING');
        try {
            const res = await matchService.findMatch(riderId, location.lat, location.lng);
            if (res.status === 'MATCHED') {
                addLog(`Wait for driver acceptance... (Trip: ${res.tripId})`);
            } else {
                setStatus('IDLE');
                addLog('No driver found');
            }
        } catch (e) {
            console.error(e);
            setStatus('IDLE');
            addLog('Request failed');
        }
    };

    return (
        <div className="flex flex-col gap-4">
            <div className="bg-gray-100 p-4 rounded border">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="font-bold text-lg">Rider Panel ({riderId})</h2>
                    <span className={`px-2 py-1 rounded text-sm font-bold ${isConnected ? 'bg-green-200 text-green-800' : 'bg-red-200 text-red-800'}`}>
                        {isConnected ? 'WS CONNECTED' : 'WS DISCONNECTED'}
                    </span>
                </div>

                <div className="p-4 bg-white rounded shadow-sm mb-4">
                    <div className="text-gray-500 text-sm">Status</div>
                    <div className="text-xl font-bold">{status}</div>
                </div>

                {status === 'IDLE' && (
                    <button
                        onClick={handleRequest}
                        className="bg-blue-600 hover:bg-blue-700 text-white w-full py-3 rounded-lg font-bold shadow"
                    >
                        Request Ride
                    </button>
                )}

                {status === 'SEARCHING' && (
                    <div className="text-center py-4 text-gray-500 italic animate-pulse">
                        Looking for nearby drivers...
                    </div>
                )}
            </div>

            <div className="bg-gray-800 text-green-400 p-4 rounded font-mono text-xs h-40 overflow-y-auto">
                <div className="text-gray-500 mb-2 border-b border-gray-700 pb-1">Activity Log</div>
                {logs.map((log, i) => (
                    <div key={i} className="mb-1">{`> ${log}`}</div>
                ))}
            </div>
        </div>
    );
}
