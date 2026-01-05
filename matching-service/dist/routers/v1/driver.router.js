"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const driver_controller_1 = require("../../controllers/driver.controller");
const driverRouter = express_1.default.Router();
driverRouter.post('/status/available', driver_controller_1.driverHeartbeatHandler);
driverRouter.post('/trip/ended', driver_controller_1.driverCurrentJobEndedHandler);
exports.default = driverRouter;
