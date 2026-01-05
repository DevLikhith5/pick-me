"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const ping_router_1 = __importDefault(require("./ping.router"));
const geo_address_validator_1 = require("../../validators/geo-address.validator");
const validation_middleware_1 = require("../../middlewares/validation.middleware");
const match_controller_1 = require("../../controllers/match.controller");
const matchRouter = express_1.default.Router();
matchRouter.use('/ping', ping_router_1.default);
matchRouter.post('/', (0, validation_middleware_1.validate)(geo_address_validator_1.geoAddressValidator), match_controller_1.matchHandler);
exports.default = matchRouter;
