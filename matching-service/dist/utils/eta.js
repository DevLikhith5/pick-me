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
exports.estimateETA = estimateETA;
const logger_config_1 = __importDefault(require("../config/logger.config"));
const geoHash_1 = require("./geoHash");
const OSRM_BASE_URL = "https://router.project-osrm.org";
const OSRM_TIMEOUT_MS = 2500;
const FALLBACK_SPEED_KMPH = 25;
function estimateETA(userLat, userLng, driverLat, driverLng) {
    return __awaiter(this, void 0, void 0, function* () {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), OSRM_TIMEOUT_MS);
        try {
            const url = `${OSRM_BASE_URL}/route/v1/driving/${driverLng},${driverLat};${userLng},${userLat}?overview=false`;
            const res = yield fetch(url, { signal: controller.signal });
            if (!res.ok)
                throw new Error("OSRM HTTP error");
            const data = yield res.json();
            if (!data ||
                !Array.isArray(data.routes) ||
                data.routes.length === 0 ||
                typeof data.routes[0].duration !== "number") {
                throw new Error("Invalid OSRM response");
            }
            return {
                etaMinutes: Math.max(1, Math.round(data.routes[0].duration / 60)),
                source: "osrm",
            };
        }
        catch (err) {
            logger_config_1.default.error("OSRM error", err);
            return {
                etaMinutes: (0, geoHash_1.estimateETAFromDistance)(userLat, userLng, driverLat, driverLng, FALLBACK_SPEED_KMPH),
                source: "fallback",
            };
        }
        finally {
            clearTimeout(timeout);
        }
    });
}
