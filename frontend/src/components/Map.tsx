import { MapContainer, TileLayer, Marker, Popup, useMap, useMapEvents } from 'react-leaflet';
import { useEffect } from 'react';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix for default marker icon in Leaflet with webpack/vite
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
    iconUrl: icon,
    shadowUrl: iconShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41]
});

L.Marker.prototype.options.icon = DefaultIcon;

interface MapProps {
    userLocation: { lat: number; lng: number } | null;
    driverLocation: { lat: number; lng: number } | null;
    onLocationSelect?: (lat: number, lng: number) => void;
}

function ChangeView({ center }: { center: { lat: number; lng: number } }) {
    const map = useMap();
    useEffect(() => {
        map.setView([center.lat, center.lng]);
    }, [center, map]);
    return null;
}

function LocationMarker({ onLocationSelect }: { onLocationSelect: (lat: number, lng: number) => void }) {
    useMapEvents({
        click(e) {
            onLocationSelect(e.latlng.lat, e.latlng.lng);
        },
    });
    return null;
}

export function Map({ userLocation, driverLocation, onLocationSelect }: MapProps) {
    const center = userLocation || { lat: 12.9716, lng: 77.5946 }; // Default to Bangalore

    return (
        <MapContainer center={[center.lat, center.lng]} zoom={13} scrollWheelZoom={true} className="h-full w-full rounded-lg shadow-lg">
            <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            {userLocation && <ChangeView center={userLocation} />}

            {onLocationSelect && <LocationMarker onLocationSelect={onLocationSelect} />}

            {userLocation && (
                <Marker position={[userLocation.lat, userLocation.lng]}>
                    <Popup>
                        You are here
                    </Popup>
                </Marker>
            )}

            {driverLocation && (
                <Marker position={[driverLocation.lat, driverLocation.lng]}>
                    <Popup>
                        Driver is here
                    </Popup>
                </Marker>
            )}
        </MapContainer>
    );
}
