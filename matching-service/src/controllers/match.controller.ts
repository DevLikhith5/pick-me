import { Request, Response } from "express";
import { tripService } from "../services/trip.service";

export const matchHandler = async (req: Request, res: Response) => {
    const { lat, lng, riderId } = req.body;

    try {
        const result = await tripService.requestMatch(riderId, lat, lng);
        return res.json(result);
    } catch (error) {
        console.error("Match error:", error);
        return res.status(500).json({ error: "Internal Server Error" });
    }
};
