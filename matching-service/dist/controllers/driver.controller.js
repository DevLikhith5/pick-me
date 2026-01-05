"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.driverCurrentJobEndedHandler = exports.driverHeartbeatHandler = void 0;
const redis_config_1 = require("../config/redis.config");
const geoHash_1 = require("../utils/geoHash");
const driverHeartbeatHandler = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { driverId, lat, lng } = req.body;
    const { prefixes } = (0, geoHash_1.getGeohashPrefixes)(lat, lng);
    const statusKey = `driver:status:${driverId}`;
    // 1️⃣ READ FIRST
    const currentStatus = yield redis_config_1.redis.get(statusKey);
    // 2️⃣ PIPELINE WRITES
    const pipe = redis_config_1.redis.pipeline();
    pipe.set(`driver:${driverId}`, JSON.stringify({ lat, lng }), "EX", 15);
    for (const p of prefixes) {
        pipe.sadd(`drivers:${p}`, driverId);
    }
    if (!currentStatus) {
        pipe.set(statusKey, "AVAILABLE", "EX", 30);
    }
    yield pipe.exec();
    return res.json({ status: "OK" });
});
exports.driverHeartbeatHandler = driverHeartbeatHandler;
const driverCurrentJobEndedHandler = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { driverId } = req.body;
    const statusKey = `driver:status:${driverId}`;
    const currentStatus = yield redis_config_1.redis.get(statusKey);
    if (currentStatus !== "BUSY") {
        return res.status(400).json({ error: "Driver not busy" });
    }
    yield redis_config_1.redis.set(statusKey, "AVAILABLE", "EX", 30);
    return res.json({ status: "OK" });
});
exports.driverCurrentJobEndedHandler = driverCurrentJobEndedHandler;
