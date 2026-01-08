import axios from 'axios';

const api = axios.create({
    baseURL: '/api/v1', // Proxied by Vite to http://localhost:3000
});

export const matchService = {
    findMatch: async (riderId: string, lat: number, lng: number) => {
        const response = await api.post('/match/', { riderId, lat, lng });
        return response.data;
    },
};

export const driverService = {
    heartbeat: async (driverId: string, lat: number, lng: number) => {
        const response = await api.post('/driver/status/available', {
            driverId,
            lat,
            lng,
        });
        return response.data;
    },
    tripEnded: async (driverId: string) => {
        const response = await api.post('/driver/trip/ended', {
            driverId,
        });
        return response.data;
    },
    acceptTrip: async (driverId: string, tripId: string) => {
        const response = await api.post('/driver/accept', {
            driverId,
            tripId,
        });
        return response.data;
    }

};
