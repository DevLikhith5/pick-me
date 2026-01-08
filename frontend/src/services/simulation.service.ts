import { driverService } from './api';

type Location = { lat: number; lng: number };
type UpdateCallback = (lat: number, lng: number) => void;

class SimulationService {
    //@ts-ignore
    private interval: NodeJS.Timeout | null = null;
    private currentLocation: Location | null = null;
    private angle = 0;
    private driverId: string | null = null;
    private onUpdate: UpdateCallback | null = null;

    start(driverId: string, initialLocation: Location, onUpdate: UpdateCallback) {
        if (this.interval) return; // Already running

        this.driverId = driverId;
        // Only set start location if we don't have one (resume)
        if (!this.currentLocation) {
            this.currentLocation = initialLocation;
        }
        this.onUpdate = onUpdate;

        console.log('[SimulationService] Started');

        this.interval = setInterval(() => {
            if (!this.currentLocation || !this.driverId) return;

            // Simple circular motion
            this.angle += 0.1; // rad per tick
            const radius = 0.0005; // ~50m per tick (small realistic moves)

            // Calculate delta
            const latChange = Math.sin(this.angle) * radius;
            const lngChange = Math.cos(this.angle) * radius;

            // Apply to PERSISTENT location
            this.currentLocation.lat += latChange;
            this.currentLocation.lng += lngChange;

            const { lat, lng } = this.currentLocation;

            console.log(`[Simulation] Moved to ${lat.toFixed(6)}, ${lng.toFixed(6)}`);

            // Notify UI
            if (this.onUpdate) this.onUpdate(lat, lng);

            // Notify Backend
            driverService.heartbeat(this.driverId, lat, lng).catch(console.error);

        }, 2000);
    }

    stop() {
        if (this.interval) {
            clearInterval(this.interval);
            this.interval = null;
            console.log('[SimulationService] Stopped');
        }
    }

    // Allow updating 'real' location if user drags map manually
    updateLocation(lat: number, lng: number) {
        this.currentLocation = { lat, lng };
    }
}

export const simulationService = new SimulationService();
