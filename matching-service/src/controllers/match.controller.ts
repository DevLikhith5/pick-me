import { Request, Response } from "express";
import { distance, getGeohashPrefixes } from "../utils/geoHash";
import { redis } from "../config/redis.config";
import { MATCH_AND_LOCK_LUA } from "../config/redis.config";
import logger from "../config/logger.config";
import { estimateETA } from "../utils/eta";

interface Candidate {
    driverId: string;
    etaMinutes: number;
}

export const matchHandler = async (req: Request, res: Response) => {
    const { lat, lng } = req.body;
    const prefixes = getGeohashPrefixes(lat, lng);

    const candidates: Candidate[] = [];
    const MAX_CANDIDATES = 10;
    const MAX_ATTEMPTS = 30;

    for (const prefix of prefixes) {
        let drivers = await redis.smembers(`drivers:${prefix}`);
        if (drivers.length === 0) continue;


        drivers.sort(() => Math.random() - 0.5);

        let attempts = 0;

        for (const driverId of drivers) {
            if (attempts++ >= MAX_ATTEMPTS) break;
            if (candidates.length >= MAX_CANDIDATES) break;

            const loc = await redis.get(`driver:${driverId}`);
            if (!loc) continue;

            const { lat: dLat, lng: dLng } = JSON.parse(loc);
            const { etaMinutes, source } = await estimateETA(
                lat,
                lng,
                dLat,
                dLng
            );
            
            if (source === "fallback") {
                logger.warn("OSRM failed, using fallback ETA");
            }else{
                logger.info(`ETA for ${driverId}: ${etaMinutes} minutes`);
            }

            candidates.push({ driverId, etaMinutes });
        }


        if (candidates.length > 0) break;
    }

    if (candidates.length === 0) {
        res.json({ status: "NO_DRIVER", driverId: null });
        return;
    }


    candidates.sort((a, b) => a.etaMinutes - b.etaMinutes);

    const orderedDrivers = candidates.map(c => c.driverId);

    const matchedDriver = await redis.eval(
        MATCH_AND_LOCK_LUA,
        0,
        ...orderedDrivers
    );

    if (matchedDriver) {
        res.json({
            status: "MATCHED",
            driverId: matchedDriver,
        });
        return
    }

    res.json({ status: "NO_DRIVER", driverId: null });
};
