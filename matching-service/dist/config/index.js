"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.serverConfig = void 0;
// This file contains all the basic configuration logic for the app server to work
const dotenv_1 = __importDefault(require("dotenv"));
function loadEnv() {
    dotenv_1.default.config();
    console.log(`Environment variables loaded`);
}
loadEnv();
exports.serverConfig = {
    PORT: Number(process.env.PORT) || 3000,
    REDIS_URL: process.env.REDIS_URL || "localhost:6379"
};
