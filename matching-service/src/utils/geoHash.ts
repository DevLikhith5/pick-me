import geohash from "ngeohash";

export function getGeohashPrefixes(
    lat: number,
    lng: number
): string[] {
    const hash = geohash.encode(lat, lng, 6);

    return [
        hash.slice(0, 6),
        hash.slice(0, 5),
        hash.slice(0, 4),
    ];
}



export const distance = (lat1: number, lng1: number, lat2: number, lng2: number) => {
    const R = 6371; // Radius of the Earth in kilometers
    const dLat = (lat2 - lat1) * (Math.PI / 180);
    const dLng = (lng2 - lng1) * (Math.PI / 180);
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1 * (Math.PI / 180)) *
        Math.cos(lat2 * (Math.PI / 180)) *
        Math.sin(dLng / 2) *
        Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
};



export function estimateETAFromDistance(
  userLat: number,
  userLng: number,
  driverLat: number,
  driverLng: number,
  avgSpeedKmph = 25
): number {
  const km = distance(userLat, userLng, driverLat, driverLng);
  return (km / avgSpeedKmph) * 60;
}