
import { useEffect, useState, useRef } from 'react';
import { useSocket } from '../context/SocketContext';
import { driverService } from '../services/api';
import { simulationService } from '../services/simulation.service';

interface DriverViewProps {
    driverId: string;
    location: { lat: number; lng: number };
    onLocationUpdate: (lat: number, lng: number) => void;
}

export function DriverView({ driverId, location, onLocationUpdate }: DriverViewProps) {
    const { connect, disconnect, lastMessage, isConnected } = useSocket();
    const [status, setStatus] = useState('OFFLINE');
    const [incomingTrip, setIncomingTrip] = useState<any>(null);
    const [activeTrip, setActiveTrip] = useState<any>(null);
    const [autoHeartbeat, setAutoHeartbeat] = useState(false);
    const [autoDrive, setAutoDrive] = useState(false);

    useEffect(() => {
        connect('driver', driverId);
        return () => disconnect();
    }, [driverId]);

    useEffect(() => {
        if (!lastMessage) return;

        if (lastMessage.type === 'NEW_TRIP_ASSIGNED') {
            setIncomingTrip(lastMessage);
            setStatus('ASSIGNED');
        }
    }, [lastMessage]);

    // Sync manual location updates to simulation service
    const instanceId = useRef(Math.random().toString(36).substr(2, 5));

    useEffect(() => {
        if (!autoDrive) {
            simulationService.updateLocation(location.lat, location.lng);
        }
    }, [location, autoDrive]);

    useEffect(() => {
        console.log(`[DriverView:${ instanceId.current }]MOUNTED.AutoDrive: ${ autoDrive }, Status: ${ status } `);
        return () => console.log(`[DriverView:${ instanceId.current }]UNMOUNTED`);
    }, []);

    // Auto-Drive Simulation via Singleton
    useEffect(() => {
        if (autoDrive && status === 'ON_TRIP') {
            simulationService.start(driverId, location, onLocationUpdate);
        } else {
            simulationService.stop();
        }
        
        // Cleanup only on unmount (or if dependencies change)
        return () => {
             // We don't necessarily want to stop on unmount if we want "background" driving, 
             // but for this UI component, stopping is safer to avoid leaks if we switch roles.
             simulationService.stop();
        };
    }, [autoDrive, status, driverId, onLocationUpdate, location]);

    useEffect(() => {
        let interval: ReturnType<typeof setInterval>;

        const sendHeartbeat = async () => {
            try {
                await driverService.heartbeat(driverId, location.lat, location.lng);
                console.log('Heartbeat sent');

                setStatus(prev => prev === 'OFFLINE' ? 'AVAILABLE' : prev);
            } catch (e) {
                console.error('Heartbeat failed', e);
            }
        };

        if (autoHeartbeat && isConnected) {

            if (status === 'OFFLINE') {
                setStatus('AVAILABLE');
            }
            sendHeartbeat();

            interval = setInterval(sendHeartbeat, 5000);
        } else if (!autoHeartbeat && status === 'AVAILABLE') {
            setStatus('OFFLINE');
        }
        return () => clearInterval(interval);
    }, [autoHeartbeat, isConnected, driverId, location, status]);

    const handleAccept = async () => {
        if (!incomingTrip) return;
        try {
            await driverService.acceptTrip(driverId, incomingTrip.tripId);
            setActiveTrip(incomingTrip);
            setIncomingTrip(null);
            setStatus('ON_TRIP');
        } catch (e) {
            console.error(e);
            alert('Failed to accept trip');
        }
    };

    const handleEndTrip = async () => {
        try {
            await driverService.tripEnded(driverId);
            setActiveTrip(null);
            setStatus('AVAILABLE');
        } catch (e) {
            console.error(e);
        }
    };

    return (
        <div className="flex flex-col gap-4">
            <div className="bg-gray-100 p-4 rounded border">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="font-bold text-lg">Driver Panel ({driverId})</h2>
                    <span className={`px - 2 py - 1 rounded text - sm font - bold ${ isConnected ? 'bg-green-200 text-green-800' : 'bg-red-200 text-red-800' } `}>
                        {isConnected ? 'WS CONNECTED' : 'WS DISCONNECTED'}
                    </span>
                </div>

                <div className="flex flex-col gap-2 mb-4">
                    <label className="flex items-center gap-2 cursor-pointer">
                        <input
                            type="checkbox"
                            checked={autoHeartbeat}
                            onChange={(e) => setAutoHeartbeat(e.target.checked)}
                            className="w-5 h-5"
                        />
                        <span>Auto-Heartbeat (5s)</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                        <input
                            type="checkbox"
                            checked={autoDrive}
                            onChange={(e) => setAutoDrive(e.target.checked)}
                            className="w-5 h-5"
                            disabled={status !== 'ON_TRIP'}
                        />
                        <span className={status !== 'ON_TRIP' ? 'text-gray-400' : ''}>
                            Auto-Drive (Simulate Movement)
                        </span>
                    </label>
                </div>

                <div className="p-4 bg-white rounded shadow-sm">
                    <div className="text-gray-500 text-sm">Current Status</div>
                    <div className="text-xl font-bold">{status}</div>
                </div>
            </div>

            {incomingTrip && (
                <div className="bg-yellow-100 border-l-4 border-yellow-500 p-4 animate-pulse">
                    <div className="flex justify-between items-center">
                        <div>
                            <p className="font-bold text-lg">New Trip Request!</p>
                            <p className="text-sm">Pickup: {incomingTrip.pickup.lat}, {incomingTrip.pickup.lng}</p>
                        </div>
                        <button
                            onClick={handleAccept}
                            className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg font-bold shadow"
                        >
                            ACCEPT
                        </button>
                    </div>
                </div>
            )}

            {activeTrip && (
                <div className="bg-blue-50 border border-blue-200 p-4 rounded">
                    <h3 className="font-bold text-lg mb-2">Current Trip</h3>
                    <p className="mb-4">Trip ID: {activeTrip.tripId}</p>
                    <button
                        onClick={handleEndTrip}
                        className="bg-red-600 hover:bg-red-700 text-white w-full py-3 rounded font-bold"
                    >
                        End Trip
                    </button>
                </div>
            )}
        </div>
    );
}
