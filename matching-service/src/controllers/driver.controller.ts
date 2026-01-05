import { Request, Response } from "express";
import { redis } from "../config/redis.config";
import { getGeohashPrefixes } from "../utils/geoHash";

export const driverHeartbeatHandler = async (req: Request, res: Response) => {
  const { driverId, lat, lng } = req.body;

  const prefixes = getGeohashPrefixes(lat, lng);
  const statusKey = `driver:status:${driverId}`;

  // 1️⃣ READ FIRST
  const currentStatus = await redis.get(statusKey);

  // 2️⃣ PIPELINE WRITES
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

  if (!currentStatus) {
    pipe.set(statusKey, "AVAILABLE", "EX", 30);
  }

  await pipe.exec();

  return res.json({ status: "OK" });
};

export const driverCurrentJobEndedHandler = async (
  req: Request,
  res: Response
) => {
  const { driverId } = req.body;

  const statusKey = `driver:status:${driverId}`;

  const currentStatus = await redis.get(statusKey);

  if (currentStatus !== "BUSY") {
    return res.status(400).json({ error: "Driver not busy" });
  }

  await redis.set(statusKey, "AVAILABLE", "EX", 30);

  return res.json({ status: "OK" });
};
