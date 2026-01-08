// @ts-ignore
import WebSocket from 'ws';
import crypto from 'crypto';

const DRIVER_ID = 'driver_' + crypto.randomUUID().substring(0, 8);
const RIDER_ID = 'rider_' + crypto.randomUUID().substring(0, 8);
const WS_URL = 'ws://localhost:8080';
const API_URL = 'http://localhost:3000/api/v1';

// Locations (Bangalore area, close enough to match)
const DRIVER_LOC = { lat: 12.9716, lng: 77.5946 };
const RIDER_LOC = { lat: 12.9718, lng: 77.5948 };

let currentDriverLoc = { ...DRIVER_LOC };


let driverWs: WebSocket;
let riderWs: WebSocket;
let tripId: string;

function log(prefix: string, msg: any) {
    console.log(`[${prefix}]`, typeof msg === 'object' ? JSON.stringify(msg) : msg);
}

async function start() {
    try {
        log('SYSTEM', 'Starting simulation...');
        log('SYSTEM', `Driver ID: ${DRIVER_ID}`);
        log('SYSTEM', `Rider ID: ${RIDER_ID}`);

        // 1. Connect Driver WS
        driverWs = new WebSocket(`${WS_URL}/driver?driverId=${DRIVER_ID}`);
        await new Promise<void>((resolve) => {
            driverWs.on('open', () => {
                log('DRIVER', 'WebSocket Connected');
                resolve();
            });
            driverWs.on('message', async (data: any) => {
                const msg = JSON.parse(data.toString());
                log('DRIVER', `Received: ${JSON.stringify(msg)}`);

                if (msg.type === 'NEW_TRIP_ASSIGNED') {
                    tripId = msg.tripId;
                    log('DRIVER', `Assigning Trip: ${tripId}`);

                    // Accept the trip
                    await acceptTrip();
                }
            });
        });

        // 2. Connect Rider WS
        riderWs = new WebSocket(`${WS_URL}/user?userId=${RIDER_ID}`);
        await new Promise<void>((resolve) => {
            riderWs.on('open', () => {
                log('RIDER', 'WebSocket Connected');
                resolve();
            });
            riderWs.on('message', (data: any) => {
                const msg = JSON.parse(data.toString());
                log('RIDER', `Received: ${JSON.stringify(msg)}`);

                if (msg.type === 'DRIVER_ACCEPTED') {
                    log('RIDER', 'Driver has accepted the request!');
                }
                if (msg.type === 'LOCATION_UPDATE') {
                    log('RIDER', 'Received Driver Location Update!');
                }
            });
        });

        // 3. Make Driver Available (Heartbeat Loop)
        log('DRIVER', 'Sending Heartbeats...');
        setInterval(async () => {
            try {
                if (tripId) {
                    // Move 10% closer to rider
                    currentDriverLoc.lat += (RIDER_LOC.lat - currentDriverLoc.lat) * 0.1;
                    currentDriverLoc.lng += (RIDER_LOC.lng - currentDriverLoc.lng) * 0.1;
                }

                const res = await fetch(`${API_URL}/driver/status/available`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        driverId: DRIVER_ID,
                        lat: currentDriverLoc.lat,
                        lng: currentDriverLoc.lng
                    })
                });
                const data = await res.json();
                log('DRIVER', `Heartbeat sent (at ${currentDriverLoc.lat.toFixed(4)}, ${currentDriverLoc.lng.toFixed(4)}): ${JSON.stringify(data)}`);
            } catch (e) {
                console.error(e);
            }
        }, 2000);

        // Wait a bit for driver to be registered in Redis
        await new Promise(r => setTimeout(r, 5000));

        // 4. Rider Request Match
        log('RIDER', 'Requesting Match...');
        const matchRes = await fetch(`${API_URL}/match`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                riderId: RIDER_ID,
                lat: RIDER_LOC.lat,
                lng: RIDER_LOC.lng
            })
        });
        const matchData = await matchRes.json();
        log('RIDER', `Match Response: ${JSON.stringify(matchData)}`);

    } catch (error) {
        console.error('Simulation Failed:', error);
        process.exit(1);
    }
}

async function acceptTrip() {
    log('DRIVER', `Accepting Trip ${tripId}...`);
    const res = await fetch(`${API_URL}/driver/accept`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            driverId: DRIVER_ID,
            tripId: tripId
        })
    });
    const data = await res.json();
    log('DRIVER', `Accept Response: ${JSON.stringify(data)}`);
}

start();
