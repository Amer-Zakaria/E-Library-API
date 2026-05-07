import { Activity } from "../models/activity.js";
import type { NextFunction, Request, Response } from "express";

export default async function trackViewMiddleware(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    await Activity.create({
      type: "view",
      contentId: req.params.id,
      browserId:
        req.headers["x-browser-id"] ||
        req.headers["browserId"] ||
        req.body.browserId ||
        req.query.browserId,
    });
  } catch {}

  next();
}
