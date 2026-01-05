import logger from "../config/logger.config";
import { estimateETAFromDistance } from "./geoHash";

export interface ETAResult {
  etaMinutes: number;
  source: "osrm" | "fallback";
}

const OSRM_BASE_URL = "https://router.project-osrm.org";
const OSRM_TIMEOUT_MS = 2500;
const FALLBACK_SPEED_KMPH = 25;

export async function estimateETA(
  userLat: number,
  userLng: number,
  driverLat: number,
  driverLng: number
): Promise<ETAResult> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), OSRM_TIMEOUT_MS);

  try {
    const url = `${OSRM_BASE_URL}/route/v1/driving/${driverLng},${driverLat};${userLng},${userLat}?overview=false`;

    const res = await fetch(url, { signal: controller.signal });
    if (!res.ok) throw new Error("OSRM HTTP error");

    const data = await res.json();

    if (
      !data ||
      !Array.isArray(data.routes) ||
      data.routes.length === 0 ||
      typeof data.routes[0].duration !== "number"
    ) {
      throw new Error("Invalid OSRM response");
    }

    return {
      etaMinutes: Math.max(1, Math.round(data.routes[0].duration / 60)),
      source: "osrm",
    };
  } catch(err) {
    logger.error("OSRM error", err);
    return {
      etaMinutes: estimateETAFromDistance(
        userLat,
        userLng,
        driverLat,
        driverLng,
        FALLBACK_SPEED_KMPH
      ),
      source: "fallback",
    };
  } finally {
    clearTimeout(timeout);
  }
}