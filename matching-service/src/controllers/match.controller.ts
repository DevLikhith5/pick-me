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

interface DistanceCandidate {
  driverId: string;
  distKm: number;
}

export const matchHandler = async (req: Request, res: Response) => {
  const { lat, lng } = req.body;
  const {userGeoHash,prefixes} = getGeohashPrefixes(lat, lng);

  const distanceCandidates: DistanceCandidate[] = [];
  const MAX_DISTANCE_CANDIDATES = 15;
  const MAX_ETA_CANDIDATES = 5;
  const MAX_ATTEMPTS = 40;

  for (const prefix of prefixes) {
    const drivers = await redis.smembers(`drivers:${prefix}`);
    if (drivers.length === 0) continue;

    let attempts = 0;

    for (const driverId of drivers) {
      if (attempts++ >= MAX_ATTEMPTS) break;
      if (distanceCandidates.length >= MAX_DISTANCE_CANDIDATES) break;

      const loc = await redis.get(`driver:${driverId}`);
      if (!loc) continue;

      const { lat: dLat, lng: dLng } = JSON.parse(loc);
      const distKm = distance(lat, lng, dLat, dLng);

      distanceCandidates.push({ driverId, distKm });
    }

    if (distanceCandidates.length > 0) break;
  }

  if (distanceCandidates.length === 0) {
    res.json({ status: "NO_DRIVER", driverId: null });
    return;
  }

  distanceCandidates.sort((a, b) => a.distKm - b.distKm);

  const etaCandidates: Candidate[] = [];
for (const d of distanceCandidates.slice(0, MAX_ETA_CANDIDATES)) {
  const loc = await redis.get(`driver:${d.driverId}`);
  if (!loc) continue;

  const { lat: dLat, lng: dLng } = JSON.parse(loc);

  const cacheKey = `eta:${d.driverId}:${userGeoHash}`;

  let etaMinutes: number;
  let source: "cache" | "osrm" | "fallback";

  const cached = await redis.get(cacheKey);

  if (cached) {
    etaMinutes = Number(cached);
    source = "cache";
  } else {
    const result = await estimateETA(lat, lng, dLat, dLng);
    etaMinutes = result.etaMinutes;
    source = result.source;

    await redis.set(cacheKey, etaMinutes.toString(), "EX", 15);
  }

  if (source === "fallback") {
    logger.warn("OSRM failed, using fallback ETA");
  } else if (source === "osrm") {
    logger.info(`ETA for ${d.driverId}: ${etaMinutes} minutes`);
  }else if(source == "cache"){
    logger.info(`ETA for ${d.driverId}: ${etaMinutes} minutes (cached)`);
  }

  etaCandidates.push({ driverId: d.driverId, etaMinutes });
}


  if (etaCandidates.length === 0) {
    res.json({ status: "NO_DRIVER", driverId: null });
    return;
  }

  etaCandidates.sort((a, b) => a.etaMinutes - b.etaMinutes);

  const orderedDrivers = etaCandidates.map(c => c.driverId);

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
    return;
  }

  res.json({ status: "NO_DRIVER", driverId: null });
};
