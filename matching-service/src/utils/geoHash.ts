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
