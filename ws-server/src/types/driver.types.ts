


import WebSocket from "ws";

export type DriverId = string;

export type DriverSocket = WebSocket;

export type DriverSocketMap = Map<DriverId, WebSocket>;
