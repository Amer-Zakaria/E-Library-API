import express from "express";
import type { Request, Response } from "express";
import { Activity } from "../models/activity.js";

const router = express.Router();

router.post("/download", async (req: Request, res: Response) => {
  const { contentId } = req.body;

  const bId = req.headers["x-browser-id"];

  try {
    const activity = await Activity.create({
      type: "download",
      contentId,
      browserId: bId,
    });
    res.status(201).json(activity);
  } catch (error) {}
});

router.post("/session", async (req: Request, res: Response) => {
  const bId = req.headers["x-browser-id"];

  const activity = await Activity.create({
    type: "session",
    browserId: bId,
  });
  res.status(201).json(activity);
});

export default router;
