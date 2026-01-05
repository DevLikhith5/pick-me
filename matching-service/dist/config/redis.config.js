"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MATCH_AND_LOCK_LUA = exports.redis = void 0;
const ioredis_1 = __importDefault(require("ioredis"));
const _1 = require(".");
const logger_config_1 = __importDefault(require("./logger.config"));
const getRedisConnection = (() => {
    let connection = null;
    return () => {
        if (connection)
            return connection;
        connection = new ioredis_1.default(_1.serverConfig.REDIS_URL, {
            maxRetriesPerRequest: null,
        });
        connection.on("connect", () => {
            logger_config_1.default.info("[redis] connected");
        });
        connection.on("ready", () => {
            logger_config_1.default.info("[redis] ready");
        });
        connection.on("error", (err) => {
            logger_config_1.default.error("[redis] error", err);
        });
        connection.on("end", () => {
            logger_config_1.default.info("[redis] connection closed");
        });
        return connection;
    };
})();
exports.redis = getRedisConnection();
exports.MATCH_AND_LOCK_LUA = `
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
