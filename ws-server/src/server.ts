import { WebSocketServer } from "ws";
import { handleDriverConnection } from "./services/driver.service";
import { consumeRealtimeExchange } from "./queue/rabbitmq/realtime.exchange";
import logger from "./config/logger.config";
import { handleUserConnection } from "./services/user.service";
import { Request } from "express";

async function startServer(port: number) {
  const wss = new WebSocketServer({ port });

  wss.on("connection", (ws, req:Request) => {
    const url = new URL(req.url!, `http://${req.headers.host}`);

    if (url.pathname === "/driver") {
      handleDriverConnection(ws, req);
      return;
    }

    if (url.pathname === "/user") {
      handleUserConnection(ws, req);
      return;
    }

    ws.close();
  });

  await consumeRealtimeExchange();

  logger.info(`WS server running on ${port}`);
}

startServer(Number(process.env.WS_PORT || 8080)).catch((err) => {
  logger.error(err);
  process.exit(1);
});