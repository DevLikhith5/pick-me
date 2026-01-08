import { Request, Response } from "express";
import { distance, getGeohashPrefixes } from "../utils/geoHash";
import { redis } from "../config/redis.config";
import { MATCH_AND_LOCK_LUA } from "../config/redis.config";
import { estimateETA } from "../utils/eta";
import { publishToRealtimeExchange } from "../queues/exchanges/realtime.exchange";
import crypto from "crypto";

interface Candidate {
  driverId: string;
  etaMinutes: number;
}

interface DistanceCandidate {
  driverId: string;
  distKm: number;
}

export const matchHandler = async (req: Request, res: Response) => {
  const { lat, lng, riderId } = req.body;

  const tripId = crypto.randomUUID(); 
  await redis.set(`trip:rider:${tripId}`, riderId);

  const { userGeoHash, prefixes } = getGeohashPrefixes(lat, lng);

  const distanceCandidates: DistanceCandidate[] = [];
  const MAX_DISTANCE_CANDIDATES = 15;


  for (const prefix of prefixes) {
    const drivers = await redis.smembers(`drivers:${prefix}`);

    for (const driverId of drivers) {
      if (distanceCandidates.length >= MAX_DISTANCE_CANDIDATES) break;

      const loc = await redis.get(`driver:${driverId}`);
      if (!loc) continue; 

      const state = await redis.get(`driver:state:${driverId}`);
      if (state !== "AVAILABLE") continue;

      const { lat: dLat, lng: dLng } = JSON.parse(loc);
      const distKm = distance(lat, lng, dLat, dLng);

      distanceCandidates.push({ driverId, distKm });
    }

    if (distanceCandidates.length > 0) break;
  }

  if (distanceCandidates.length === 0) {
    return res.json({ status: "NO_DRIVER", driverId: null });
  }


  distanceCandidates.sort((a, b) => a.distKm - b.distKm);


  const etaCandidates: Candidate[] = [];

  for (const d of distanceCandidates.slice(0, 5)) {
    const loc = await redis.get(`driver:${d.driverId}`);
    if (!loc) continue;

    const { lat: dLat, lng: dLng } = JSON.parse(loc);

    const cacheKey = `eta:${d.driverId}:${userGeoHash}`;
    const cached = await redis.get(cacheKey);

    let etaMinutes: number;

    if (cached) {
      etaMinutes = Number(cached);
    } else {
      const result = await estimateETA(lat, lng, dLat, dLng);
      etaMinutes = result.etaMinutes;
      await redis.set(cacheKey, etaMinutes.toString(), "EX", 15);
    }

    etaCandidates.push({ driverId: d.driverId, etaMinutes });
  }

  if (etaCandidates.length === 0) {
    return res.json({ status: "NO_DRIVER", driverId: null });
  }

  etaCandidates.sort((a, b) => a.etaMinutes - b.etaMinutes);

  const orderedDrivers = etaCandidates.map(c => c.driverId);


  const matchedDriver = await redis.eval(
    MATCH_AND_LOCK_LUA,
    1,
    tripId,
    ...orderedDrivers
  );

  if (!matchedDriver) {
    return res.json({ status: "NO_DRIVER", driverId: null });
  }

await publishToRealtimeExchange({
  target: "DRIVER",
  driverId: matchedDriver,
  payload: {
    type: "NEW_TRIP_ASSIGNED",
    tripId,
    pickup: { lat, lng },
    userGeoHash
  }
});


  return res.json({
    status: "MATCHED",
    driverId: matchedDriver,
    tripId
  });
};
