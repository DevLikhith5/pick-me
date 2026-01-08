import os from "os";
import WebSocket from "ws";

import { redis } from "../config/redis.config";
import { Request } from "express";
import { UserSocketMap } from "../types/user.types";
import logger from "../config/logger.config";

export const SERVER_ID = os.hostname()+"user1";
export const PRESENCE_TTL = 300;

export const users:UserSocketMap = new Map();


export async function handleUserConnection(ws:WebSocket, req:Request) {
    const url = new URL(req.url!,`http://${req.headers.host}`);
    const riderId = url.searchParams.get("userId");
    if (!riderId) {
        ws.close();
        return;
    }

    users.set(riderId,ws);
    redis.set(`ws:rider:${riderId}`,SERVER_ID, "EX", PRESENCE_TTL);
    logger.info(`[user] ${riderId} connected`);


    const cleanup = async() => {
        await redis.del(`ws:rider:${riderId}`);
        users.delete(riderId);
        logger.info(`[user] ${riderId} disconnected`);
    }

    ws.on("close", ()=>{
        logger.info(`closing websocket for ${riderId}`);
        cleanup();
    });
    ws.on("error", ()=>{
        logger.info(`error on websocket for ${riderId}`);
        cleanup();
    });

}
