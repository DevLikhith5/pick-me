import { Request, Response } from "express";
import { driverService } from "../services/driver.service";

export const driverHeartbeatHandler = async (req: Request, res: Response) => {
  const { driverId, lat, lng } = req.body;

  try {
    await driverService.updateHeartbeat(driverId, lat, lng);
    return res.json({ status: "OK" });
  } catch (error) {
    console.error("Heartbeat error:", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
};

export const driverAcceptHandler = async (req: Request, res: Response) => {
  const { driverId, tripId } = req.body;

  try {
    await driverService.acceptTrip(driverId, tripId);
    return res.json({ status: "ON_TRIP" });
  } catch (error: any) {
    if (error.message === "Invalid or expired assignment") {
      return res.status(400).json({ error: error.message });
    }
    console.error("Accept trip error:", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
};


export const driverCurrentJobEndedHandler = async (
  req: Request,
  res: Response
) => {
  const { driverId } = req.body;

  try {
    await driverService.endTrip(driverId);
    return res.json({ status: "OK" });
  } catch (error: any) {
    if (error.message === "Driver not on trip") {
      return res.status(400).json({ error: error.message });
    }
    console.error("End trip error:", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
};
