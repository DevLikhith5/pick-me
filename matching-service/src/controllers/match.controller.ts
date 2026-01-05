import { Request, Response } from "express";
import { getGeohashPrefixes } from "../utils/geoHash";
import { LOCK_DRIVER_LUA, redis } from "../config/redis.config";

export const matchHandler = async (req: Request, res: Response) => {
    const { lat, lng } = req.body;

    const prefixes = getGeohashPrefixes(lat, lng);

    for (const prefix of prefixes) {
        const drivers = await redis.smembers(`drivers:${prefix}`);

        for (const driverId of drivers) {
            const statusKey = `driver:status:${driverId}`;

            const locked = await redis.eval(
                LOCK_DRIVER_LUA,
                1,
                statusKey
            );

            if (locked === 1) {
                res.json({
                    status: "MATCHED",
                    driverId,
                });
                return;
            }
        }
    }
    res.json({
        status: "NO_DRIVER",
        driverId: null,
    });
}
