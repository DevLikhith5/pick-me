"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const ping_router_1 = __importDefault(require("./ping.router"));
const match_router_1 = __importDefault(require("./match.router"));
const driver_router_1 = __importDefault(require("./driver.router"));
const v1Router = express_1.default.Router();
v1Router.use('/ping', ping_router_1.default);
v1Router.use('/match', match_router_1.default);
v1Router.use('/driver', driver_router_1.default);
exports.default = v1Router;
