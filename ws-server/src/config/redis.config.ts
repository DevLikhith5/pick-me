import IORedis, { Redis } from "ioredis";
import { serverConfig } from ".";
import logger from "./logger.config";

const getRedisConnection = (() => {
    let connection: Redis | null = null;

    return () => {
        if (connection) return connection;

        connection = new IORedis(serverConfig.REDIS_URL, {
            maxRetriesPerRequest: null,
        });

        connection.on("connect", () => {
            logger.info("[redis] connected");
        });

        connection.on("ready", () => {
            logger.info("[redis] ready");
        });

        connection.on("error", (err) => {
            logger.error("[redis] error", err);
        });

        connection.on("end", () => {
            logger.info("[redis] connection closed");
        });

        return connection;
    };
})();

export const redis = getRedisConnection();
