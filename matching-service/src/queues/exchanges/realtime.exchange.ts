import { rabbitMQ } from "../../config/rabbit-mq.config";

const FANOUT_REALTIME_EXCHANGE = "realtime.fanout"

export const createRealtimeExchange = async () => {
    const connection = await rabbitMQ();
    const channel = await connection.createChannel();
    await channel.assertExchange(FANOUT_REALTIME_EXCHANGE, "fanout", { durable: true });
}

export const publishToRealtimeExchange = async (message: object) => {
    const connection = await rabbitMQ();
    const channel = await connection.createChannel();
    await channel.assertExchange(FANOUT_REALTIME_EXCHANGE, "fanout", { durable: true });
    channel.publish(FANOUT_REALTIME_EXCHANGE, "", Buffer.from(JSON.stringify(message)));
    await channel.close();
}