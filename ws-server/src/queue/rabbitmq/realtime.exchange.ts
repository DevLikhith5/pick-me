import { rabbitMQ } from "../../config/rabbit-mq.config"
import { redis } from "../../config/redis.config";
import { drivers, SERVER_ID as DRIVER_SERVER_ID } from "../../services/driver.service";
import { users, SERVER_ID as USER_SERVER_ID } from "../../services/user.service";
import WebSocket from "ws";
const FANOUT_REALTIME_EXCHANGE = "realtime.fanout"


export const consumeRealtimeExchange = async () => {
    const connection = await rabbitMQ;
    const channel = await connection.createChannel();

    await channel.assertExchange(FANOUT_REALTIME_EXCHANGE, "fanout", { durable: true });
    const q = await channel.assertQueue("", { exclusive: true });
    await channel.bindQueue(q.queue, FANOUT_REALTIME_EXCHANGE, "");

    channel.consume(q.queue, async (msg) => {
        if (!msg) return;

        try {
            const event = JSON.parse(msg.content.toString());

            if (event.target === "DRIVER") {
                const { driverId, payload } = event;
                const owner = await redis.get(`ws:driver:${driverId}`);

                if (owner === DRIVER_SERVER_ID) {
                    const ws = drivers.get(driverId);
                    if (ws && ws.readyState === WebSocket.OPEN) {
                        ws.send(JSON.stringify(payload));
                    }
                }
            }

            if (event.target === "USER") {
                const { userId, payload } = event;
                const owner = await redis.get(`ws:rider:${userId}`);
                console.log(`[WS-Realtime] Processing USER event for ${userId}. Owner in Redis: ${owner}, Current Server: ${USER_SERVER_ID}`);

                if (owner === USER_SERVER_ID) {
                    const ws = users.get(userId);
                    const isOpen = ws && ws.readyState === WebSocket.OPEN;
                    console.log(`[WS-Realtime] Local socket found? ${!!ws}. Is Open? ${isOpen}`);

                    if (ws && ws.readyState === WebSocket.OPEN) {
                        ws.send(JSON.stringify(payload));
                        console.log(`[WS-Realtime] Sent payload to ${userId}`);
                    } else {
                        console.warn(`[WS-Realtime] Could not send to ${userId} - Socket not ready`);
                    }
                } else {
                    console.log(`[WS-Realtime] Skipping ${userId} - belonged to ${owner}`);
                }
            }

            channel.ack(msg);
        } catch {
            channel.ack(msg);
        }
    });
}