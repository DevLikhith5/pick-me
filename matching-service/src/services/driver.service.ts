import { redis } from "../config/redis.config";
import { getGeohashPrefixes } from "../utils/geoHash";
import { publishToRealtimeExchange } from "../queues/exchanges/realtime.exchange";

export class DriverService {
    async updateHeartbeat(driverId: string, lat: number, lng: number) {
        const { prefixes } = getGeohashPrefixes(lat, lng);
        const pipe = redis.pipeline();


        pipe.set(
            `driver:${driverId}`,
            JSON.stringify({ lat, lng }),
            "EX",
            15
        );


        for (const p of prefixes) {
            pipe.sadd(`drivers:${p}`, driverId);
        }

        const stateKey = `driver:state:${driverId}`;
        const state = await redis.get(stateKey);

        if (state === "ON_TRIP") {
            const tripId = await redis.get(`driver:trip:${driverId}`);
            if (tripId) {
                const riderId = await redis.get(`trip:rider:${tripId}`);
                if (riderId) {
                    await publishToRealtimeExchange({
                        target: "USER",
                        userId: riderId,
                        payload: {
                            type: "LOCATION_UPDATE",
                            lat,
                            lng
                        }
                    });
                }
            }
        }

        if (!state || state === "AVAILABLE") {
            pipe.set(stateKey, "AVAILABLE", "EX", 60);
        }

        await pipe.exec();
    }

    async acceptTrip(driverId: string, tripId: string) {
        const stateKey = `driver:state:${driverId}`;
        const assignKey = `driver:assign:${driverId}`;

        const [state, assignedTripId] = await redis.mget(stateKey, assignKey);

        if (state !== "ASSIGNED" || assignedTripId !== tripId) {
            throw new Error("Invalid or expired assignment");
        }

        await redis.multi()
            .del(assignKey)
            .set(stateKey, "ON_TRIP")
            .set(`driver:trip:${driverId}`, tripId)
            .exec();

        const riderId = await redis.get(`trip:rider:${tripId}`);
        console.log(`[DriverService] Accepting trip ${tripId}, found riderId: ${riderId}`);
        if (riderId) {
            console.log(`[DriverService] Publishing DRIVER_ACCEPTED for rider ${riderId}`);
            await publishToRealtimeExchange({
                target: "USER",
                userId: riderId,
                payload: {
                    type: "DRIVER_ACCEPTED",
                    tripId,
                    driverId
                }
            });
        } else {
            console.warn(`[DriverService] No rider found for trip ${tripId}`);
        }
    }

    async endTrip(driverId: string) {
        const stateKey = `driver:state:${driverId}`;
        const state = await redis.get(stateKey);

        if (state !== "ON_TRIP") {
            throw new Error("Driver not on trip");
        }

        const tripId = await redis.get(`driver:trip:${driverId}`);
        if (!tripId) {

            await redis.set(stateKey, "AVAILABLE");
            return;
        }

        const riderId = await redis.get(`trip:rider:${tripId}`);

        await redis.multi()
            .set(stateKey, "AVAILABLE")
            .del(`driver:trip:${driverId}`)
            .del(`trip:rider:${tripId}`)
            .exec();

        if (riderId) {
            await publishToRealtimeExchange({
                target: "USER",
                userId: riderId,
                payload: {
                    type: "TRIP_COMPLETED",
                    driverId
                }
            });
        }
    }
}

export const driverService = new DriverService();
