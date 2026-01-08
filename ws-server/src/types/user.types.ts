
import type { WebSocket } from "ws";

export type UserId = string;

export type UserSocket = WebSocket;

export type UserSocketMap = Map<UserId, WebSocket>;
