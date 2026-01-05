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


export const MATCH_AND_LOCK_LUA = `
-- KEYS = []
-- ARGV = [driverId1, driverId2, driverId3, ...]

for i = 1, #ARGV do
  local statusKey = "driver:status:" .. ARGV[i]

  if redis.call("GET", statusKey) == "AVAILABLE" then
    redis.call("SET", statusKey, "BUSY", "EX", 30)
    return ARGV[i]
  end
end

return nil
`;
