import { Request, Response } from "express";
import { redis } from "../config/redis.config";
import { getGeohashPrefixes } from "../utils/geoHash";
import { publishToRealtimeExchange } from "../queues/exchanges/realtime.exchange";


export const driverHeartbeatHandler = async (req: Request, res: Response) => {
  const { driverId, lat, lng } = req.body;
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

  if (!state) {
    pipe.set(stateKey, "AVAILABLE"); 
  }

  await pipe.exec();
  return res.json({ status: "OK" });
};


export const driverAcceptHandler = async (req: Request, res: Response) => {
  const { driverId, tripId } = req.body;

  const stateKey = `driver:state:${driverId}`;
  const assignKey = `driver:assign:${driverId}`;

  const [state, assignedTripId] = await redis.mget(stateKey, assignKey);

  if (state !== "ASSIGNED" || assignedTripId !== tripId) {
    return res.status(400).json({ error: "Invalid or expired assignment" });
  }

  await redis.multi()
    .del(assignKey)
    .set(stateKey, "ON_TRIP") 
    .exec();
  

   res.json({ status: "ON_TRIP" });

   await publishToRealtimeExchange({
  target: "USER",
  userId: tripId, 
  payload: {
    type: "DRIVER_ACCEPTED",
    tripId,
    driverId
  }
});
};


export const driverCurrentJobEndedHandler = async (
  req: Request,
  res: Response
) => {
  const { driverId } = req.body;

  const stateKey = `driver:state:${driverId}`;
  const state = await redis.get(stateKey);

  if (state !== "ON_TRIP") {
    return res.status(400).json({ error: "Driver not on trip" });
  }

  await redis.set(stateKey, "AVAILABLE"); 
  await publishToRealtimeExchange({
  target: "USER",
  userId: driverId,
  payload: {
    type: "TRIP_COMPLETED",
    driverId
  }
});

return res.json({ status: "OK" });
};
