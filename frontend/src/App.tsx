import { useState, useCallback } from 'react';
import { Map } from './components/Map';
import { SocketProvider } from './context/SocketContext';
import { DriverView } from './components/DriverView';
import { RiderView } from './components/RiderView';

function App() {
  const [role, setRole] = useState<'user' | 'driver' | null>(null);
  const [riderLocation, setRiderLocation] = useState<{ lat: number; lng: number }>({ lat: 12.9716, lng: 77.5946 });
  const [driverLocation, setDriverLocation] = useState<{ lat: number; lng: number }>({ lat: 12.9750, lng: 77.6000 }); // Slightly offset

  // Stable handler to prevent DriverView re-renders/interval resets
  const handleDriverLocationUpdate = useCallback((lat: number, lng: number) => {
    setDriverLocation({ lat, lng });
  }, []);

  // Persistent IDs to keep session valid during role switch for demo
  const [driverId] = useState(`driver_${Math.floor(Math.random() * 1000)}`);
  const [riderId] = useState(`rider_${Math.floor(Math.random() * 1000)}`);

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      <header className="bg-slate-900 text-white p-4 shadow-md flex justify-between items-center">
        <h1 className="text-xl font-bold tracking-tight">Pick Me Simulator</h1>
        <div className="text-xs text-gray-400">
          D: {driverId} | R: {riderId}
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Controls Panel */}
        <div className="w-[400px] bg-white border-r shadow-xl z-20 flex flex-col">

          {/* Role Switcher */}
          <div className="p-4 bg-slate-100 border-b flex gap-2">
            <button
              onClick={() => setRole('user')}
              className={`flex-1 py-2 text-sm font-bold rounded ${role === 'user' ? 'bg-blue-600 text-white shadow' : 'bg-white text-gray-600 border hover:bg-gray-50'}`}
            >
              Rider Mode
            </button>
            <button
              onClick={() => setRole('driver')}
              className={`flex-1 py-2 text-sm font-bold rounded ${role === 'driver' ? 'bg-green-600 text-white shadow' : 'bg-white text-gray-600 border hover:bg-gray-50'}`}
            >
              Driver Mode
            </button>
          </div>

          {/* Role Content */}
          <div className="flex-1 overflow-y-auto p-6">
            {!role && (
              <div className="text-center text-gray-400 mt-20">
                Select a role above to begin simulation.
              </div>
            )}

            <div style={{ display: role === 'driver' ? 'block' : 'none' }}>
              <SocketProvider>
                <DriverView
                  driverId={driverId}
                  location={driverLocation}
                  onLocationUpdate={handleDriverLocationUpdate}
                />
              </SocketProvider>
            </div>

            <div style={{ display: role === 'user' ? 'block' : 'none' }}>
              <SocketProvider>
                <RiderView
                  riderId={riderId}
                  location={riderLocation}
                  onDriverLocationUpdate={handleDriverLocationUpdate}
                />
              </SocketProvider>
            </div>
          </div>

          {/* Location Debugger */}
          <div className="p-4 border-t bg-gray-50 text-sm">
            <div className="font-bold mb-2 text-gray-500">Global Location Override</div>
            <div className="flex gap-2">
              <input
                type="number"
                value={role === 'driver' ? driverLocation.lat : riderLocation.lat}
                onChange={(e) => {
                  const val = parseFloat(e.target.value);
                  if (role === 'driver') setDriverLocation({ ...driverLocation, lat: val });
                  else setRiderLocation({ ...riderLocation, lat: val });
                }}
                className="border rounded px-2 py-1 w-24"
              />
              <input
                type="number"
                value={role === 'driver' ? driverLocation.lng : riderLocation.lng}
                onChange={(e) => {
                  const val = parseFloat(e.target.value);
                  if (role === 'driver') setDriverLocation({ ...driverLocation, lng: val });
                  else setRiderLocation({ ...riderLocation, lng: val });
                }}
                className="border rounded px-2 py-1 w-24"
              />
            </div>
            <p className="text-xs text-gray-400 mt-1">This sets the "current" location for whichever role is active.</p>
          </div>

        </div>

        {/* Map Area */}
        <div className="flex-1 bg-gray-200 relative">
          <Map
            userLocation={riderLocation}
            driverLocation={driverLocation}
            onLocationSelect={(lat, lng) => {
              if (role === 'driver') setDriverLocation({ lat, lng });
              else setRiderLocation({ lat, lng });
            }}
          />
        </div>
      </div>
    </div>
  );
}

export default App;

