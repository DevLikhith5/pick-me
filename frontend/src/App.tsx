import { useState } from 'react';
import { Map } from './components/Map';
import { matchService, driverService } from './services/api';

function App() {
  const [role, setRole] = useState<'user' | 'driver' | null>(null);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number }>({ lat: 12.9716, lng: 77.5946 });
  const [driverLocation, setDriverLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [driverId] = useState(`driver-${Math.floor(Math.random() * 10000)}`);
  const [status, setStatus] = useState<string>('');

  const handleFindMatch = async () => {
    setStatus('Looking for a driver...');
    try {
      const result = await matchService.findMatch(userLocation.lat, userLocation.lng);
      if (result.status === 'MATCHED') {
        setStatus(`Matched with driver ${result.driverId}! OTA: ${result.etaMinutes} mins`);
        // Ideally we would fetch driver location here, but for now we just show user
      } else {
        setStatus('No driver found.');
      }
    } catch (error) {
      console.error(error);
      setStatus('Error finding match.');
    }
  };

  const handleDriverHeartbeat = async () => {
    setStatus('Sending heartbeat...');
    try {
      await driverService.heartbeat(driverId, userLocation.lat, userLocation.lng);
      setStatus('Heartbeat sent. You are active.');
      setDriverLocation(userLocation); // Show self on map
    } catch (error) {
      console.error(error);
      setStatus('Error sending heartbeat.');
    }
  };

  const handleTripEnded = async () => {
    setStatus('Ending trip...');
    try {
      await driverService.tripEnded(driverId);
      setStatus('Trip ended.');
    } catch (error) {
      console.error(error);
      setStatus('Error ending trip');
    }
  }

  return (
    <div className="flex flex-col h-screen bg-gray-100">
      <header className="bg-blue-600 text-white p-4 shadow-md">
        <h1 className="text-2xl font-bold">Pick Me App</h1>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar / Controls */}
        <div className="w-1/3 p-6 bg-white shadow-lg z-10 flex flex-col gap-6 overflow-y-auto">
          {!role ? (
            <div className="flex flex-col gap-4">
              <h2 className="text-xl font-semibold text-center">Choose your role</h2>
              <button
                onClick={() => setRole('user')}
                className="bg-blue-500 hover:bg-blue-600 text-white py-3 rounded-lg font-medium transition"
              >
                I'm a Rider
              </button>
              <button
                onClick={() => setRole('driver')}
                className="bg-green-500 hover:bg-green-600 text-white py-3 rounded-lg font-medium transition"
              >
                I'm a Driver
              </button>
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              <button onClick={() => setRole(null)} className="text-sm text-gray-500 hover:underline self-start">
                &larr; Back to Role Selection
              </button>
              <h2 className="text-xl font-bold border-b pb-2">
                {role === 'user' ? 'Rider Mode' : 'Driver Mode'}
              </h2>

              {/* Location Inputs (Simulated) */}
              <div className="bg-gray-50 p-4 rounded-md border">
                <h3 className="font-medium mb-2">Current Location</h3>
                <div className="flex gap-2 mb-2">
                  <label className="text-sm">Lat:</label>
                  <input
                    type="number"
                    value={userLocation.lat}
                    onChange={(e) => setUserLocation({ ...userLocation, lat: parseFloat(e.target.value) })}
                    className="border rounded px-2 py-1 w-full"
                  />
                </div>
                <div className="flex gap-2">
                  <label className="text-sm">Lng:</label>
                  <input
                    type="number"
                    value={userLocation.lng}
                    onChange={(e) => setUserLocation({ ...userLocation, lng: parseFloat(e.target.value) })}
                    className="border rounded px-2 py-1 w-full"
                  />
                </div>
              </div>

              {/* Actions */}
              {role === 'user' ? (
                <button
                  onClick={handleFindMatch}
                  className="bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg font-bold shadow-md"
                >
                  Find a Ride
                </button>
              ) : (
                <>
                  <div className="text-sm text-gray-600 mb-2">Driver ID: {driverId}</div>
                  <button
                    onClick={handleDriverHeartbeat}
                    className="bg-green-600 hover:bg-green-700 text-white py-3 rounded-lg font-bold shadow-md"
                  >
                    Go Online (Heartbeat)
                  </button>
                  <button
                    onClick={handleTripEnded}
                    className="bg-red-600 hover:bg-red-700 text-white py-3 rounded-lg font-bold shadow-md"
                  >
                    End Trip
                  </button>
                </>
              )}

              {/* Status & Results */}
              {status && (
                <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded text-yellow-800">
                  {status}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Map Area */}
        <div className="flex-1">
          <Map
            userLocation={userLocation}
            driverLocation={driverLocation}
            onLocationSelect={(lat, lng) => setUserLocation({ lat, lng })}
          />
        </div>
      </div>
    </div>
  );
}

export default App;
