"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.geoAddressValidator = void 0;
const zod_1 = require("zod");
exports.geoAddressValidator = zod_1.z.object({
    lat: zod_1.z.number().min(-90).max(90),
    lng: zod_1.z.number().min(-180).max(180),
});
