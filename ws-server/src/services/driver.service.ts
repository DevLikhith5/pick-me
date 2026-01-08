
import os from "os";
import WebSocket from "ws";
import { DriverSocketMap } from "../types/driver.types";
import logger from "../config/logger.config";
import { Request } from "express";
import { redis } from "../config/redis.config";

export const SERVER_ID = os.hostname() + "driver1";
const PRESENCE_TTL = 60;


export const drivers: DriverSocketMap = new Map();


export function handleDriverConnection(ws: WebSocket, req: Request) {
    const url = new URL(req.url!, `http://${req.headers.host}`);
    const driverId = url.searchParams.get("driverId");
    if (!driverId) {
        ws.close();
        return;
    }

    drivers.set(driverId, ws);
    redis.set(`ws:driver:${driverId}`, SERVER_ID, "EX", PRESENCE_TTL);
    logger.info(`[driver] ${driverId} connected`);


    const cleanup = () => {
        drivers.delete(driverId);
        redis.del(`ws:driver:${driverId}`);
        logger.info(`[driver] ${driverId} disconnected`);
    }

    ws.on("close", cleanup);
    ws.on("error", cleanup);

}