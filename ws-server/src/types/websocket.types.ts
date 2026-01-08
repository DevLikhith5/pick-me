import type { WebSocket } from "ws";

export type ClientWebSocket = WebSocket & {
    isAlive: boolean;
}
    