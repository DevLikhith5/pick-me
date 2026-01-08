
import WebSocket from "ws";
import { Redis } from "ioredis";
import * as ngeohash from "ngeohash";
import fetch from "node-fetch";

const redis = new Redis("redis://localhost:6379");

const DRIVER_ID = "driver-test-123";
const WS_URL = "ws://localhost:8080?driverId=" + DRIVER_ID;
const MATCHING_URL = "http://localhost:3000/api/v1/match";

const LOC = {
    lat: 12.9716,
    lng: 77.5946
};

async function simulate() {
    console.log("Starting simulation...");

    // 1. Setup Driver State
    const geohash = ngeohash.encode(LOC.lat, LOC.lng, 4); // low precision for matching logic
    console.log(`Setting up driver ${DRIVER_ID} at ${geohash}`);

    await redis.sadd(`drivers:${geohash}`, DRIVER_ID);
    await redis.set(`driver:${DRIVER_ID}`, JSON.stringify(LOC));
    await redis.set(`driver:state:${DRIVER_ID}`, "AVAILABLE");

    // 2. Connect WebSocket
    console.log(`Connecting WebSocket to ${WS_URL}`);
    const ws = new WebSocket(WS_URL);

    ws.on("open", async () => {
        console.log("WebSocket connected. Waiting for job...");

        // 3. Request Match
        console.log("Sending match request...");
        try {
            const response = await fetch(MATCHING_URL, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(LOC)
            });
            const data = await response.json();
            console.log("Match response:", data);
        } catch (err) {
            console.error("Match request failed:", err);
        }
    });

    ws.on("message", (data) => {
        console.log("RECEIVED MESSAGE:", data.toString());
        console.log("SUCCESS! Driver received notification.");
        process.exit(0);
    });

    ws.on("error", (err) => {
        console.error("WebSocket error:", err);
    });
}

simulate();
