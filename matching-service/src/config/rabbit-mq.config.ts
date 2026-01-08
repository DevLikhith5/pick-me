import * as amqp from "amqplib";
import type { ChannelModel } from "amqplib";
import logger from "./logger.config";

export const RABBITMQ_URL = process.env.RABBITMQ_URL || "amqp://localhost:5672";

const getRabbitMQConnection = (() => {
    let connection: ChannelModel | null = null;

    return async (): Promise<ChannelModel> => {
        if (connection) return connection;

        const url = RABBITMQ_URL;
        if (!url) {
            throw new Error("RABBITMQ_URL not defined");
        }

        connection = await amqp.connect(url);

        logger.info("[rabbitmq] connected");

        connection.on("error", (err) => {
            logger.error("[rabbitmq] error", err);
        });

        connection.on("close", () => {
            logger.warn("[rabbitmq] connection closed");
            connection = null;
        });

        return connection;
    };
})();

export const rabbitMQ = getRabbitMQConnection;
