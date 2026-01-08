// This file contains all the basic configuration logic for the app server to work
import dotenv from 'dotenv';

type ServerConfig = {
    PORT: number,
    REDIS_URL: string,
    RABBITMQ_URL: string,
    WS_URL: string
}

function loadEnv() {
    dotenv.config();
    console.log(`Environment variables loaded`);
}

loadEnv();

export const serverConfig: ServerConfig = {
    PORT: Number(process.env.PORT) || 3001,
    REDIS_URL: process.env.REDIS_URL || "localhost:6379",
    WS_URL: process.env.WS_URL || "ws://localhost:4001",
    RABBITMQ_URL: process.env.RABBITMQ_URL || "amqp://localhost:5672"
};