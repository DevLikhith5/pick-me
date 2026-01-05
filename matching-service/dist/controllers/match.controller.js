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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.matchHandler = void 0;
const geoHash_1 = require("../utils/geoHash");
const redis_config_1 = require("../config/redis.config");
const redis_config_2 = require("../config/redis.config");
const logger_config_1 = __importDefault(require("../config/logger.config"));
const eta_1 = require("../utils/eta");
const matchHandler = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { lat, lng } = req.body;
    const { userGeoHash, prefixes } = (0, geoHash_1.getGeohashPrefixes)(lat, lng);
    const distanceCandidates = [];
    const MAX_DISTANCE_CANDIDATES = 15;
    const MAX_ETA_CANDIDATES = 5;
    const MAX_ATTEMPTS = 40;
    for (const prefix of prefixes) {
        const drivers = yield redis_config_1.redis.smembers(`drivers:${prefix}`);
        if (drivers.length === 0)
            continue;
        let attempts = 0;
        for (const driverId of drivers) {
            if (attempts++ >= MAX_ATTEMPTS)
                break;
            if (distanceCandidates.length >= MAX_DISTANCE_CANDIDATES)
                break;
            const loc = yield redis_config_1.redis.get(`driver:${driverId}`);
            if (!loc)
                continue;
            const { lat: dLat, lng: dLng } = JSON.parse(loc);
            const distKm = (0, geoHash_1.distance)(lat, lng, dLat, dLng);
            distanceCandidates.push({ driverId, distKm });
        }
        if (distanceCandidates.length > 0)
            break;
    }
    if (distanceCandidates.length === 0) {
        res.json({ status: "NO_DRIVER", driverId: null });
        return;
    }
    distanceCandidates.sort((a, b) => a.distKm - b.distKm);
    const etaCandidates = [];
    for (const d of distanceCandidates.slice(0, MAX_ETA_CANDIDATES)) {
        const loc = yield redis_config_1.redis.get(`driver:${d.driverId}`);
        if (!loc)
            continue;
        const { lat: dLat, lng: dLng } = JSON.parse(loc);
        const cacheKey = `eta:${d.driverId}:${userGeoHash}`;
        let etaMinutes;
        let source;
        const cached = yield redis_config_1.redis.get(cacheKey);
        if (cached) {
            etaMinutes = Number(cached);
            source = "cache";
        }
        else {
            const result = yield (0, eta_1.estimateETA)(lat, lng, dLat, dLng);
            etaMinutes = result.etaMinutes;
            source = result.source;
            yield redis_config_1.redis.set(cacheKey, etaMinutes.toString(), "EX", 15);
        }
        if (source === "fallback") {
            logger_config_1.default.warn("OSRM failed, using fallback ETA");
        }
        else if (source === "osrm") {
            logger_config_1.default.info(`ETA for ${d.driverId}: ${etaMinutes} minutes`);
        }
        else if (source == "cache") {
            logger_config_1.default.info(`ETA for ${d.driverId}: ${etaMinutes} minutes (cached)`);
        }
        etaCandidates.push({ driverId: d.driverId, etaMinutes });
    }
    if (etaCandidates.length === 0) {
        res.json({ status: "NO_DRIVER", driverId: null });
        return;
    }
    etaCandidates.sort((a, b) => a.etaMinutes - b.etaMinutes);
    const orderedDrivers = etaCandidates.map(c => c.driverId);
    const matchedDriver = yield redis_config_1.redis.eval(redis_config_2.MATCH_AND_LOCK_LUA, 0, ...orderedDrivers);
    if (matchedDriver) {
        res.json({
            status: "MATCHED",
            driverId: matchedDriver,
        });
        return;
    }
    res.json({ status: "NO_DRIVER", driverId: null });
});
exports.matchHandler = matchHandler;
