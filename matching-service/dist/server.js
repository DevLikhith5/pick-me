"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const config_1 = require("./config");
const index_router_1 = __importDefault(require("./routers/v1/index.router"));
const app = (0, express_1.default)();
app.use(express_1.default.json());
app.use('/api/v1', index_router_1.default);
app.listen(config_1.serverConfig.PORT, () => {
    console.log(`Server is running on http://localhost:${config_1.serverConfig.PORT}`);
});
