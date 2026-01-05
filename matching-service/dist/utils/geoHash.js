"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.distance = void 0;
exports.getGeohashPrefixes = getGeohashPrefixes;
exports.estimateETAFromDistance = estimateETAFromDistance;
const ngeohash_1 = __importDefault(require("ngeohash"));
function getGeohashPrefixes(lat, lng) {
    const hash = ngeohash_1.default.encode(lat, lng, 6);
    return {
        userGeoHash: hash,
        prefixes: [hash.slice(0, 6), hash.slice(0, 5), hash.slice(0, 4)],
    };
}
const distance = (lat1, lng1, lat2, lng2) => {
    const R = 6371; // Radius of the Earth in kilometers
    const dLat = (lat2 - lat1) * (Math.PI / 180);
    const dLng = (lng2 - lng1) * (Math.PI / 180);
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1 * (Math.PI / 180)) *
            Math.cos(lat2 * (Math.PI / 180)) *
            Math.sin(dLng / 2) *
            Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
};
exports.distance = distance;
function estimateETAFromDistance(userLat, userLng, driverLat, driverLng, avgSpeedKmph = 25) {
    const km = (0, exports.distance)(userLat, userLng, driverLat, driverLng);
    return (km / avgSpeedKmph) * 60;
}
