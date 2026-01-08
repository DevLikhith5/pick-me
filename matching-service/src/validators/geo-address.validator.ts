import { z } from "zod";

export const geoAddressValidator = z.object({
    lat: z.number().min(-90).max(90),
    lng: z.number().min(-180).max(180),
    riderId: z.string().min(1)
});
