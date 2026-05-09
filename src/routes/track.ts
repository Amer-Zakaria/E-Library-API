import express from "express";
import type { Request, Response } from "express";
import { Activity } from "../models/activity.js";
import { authz } from "../middleware/authz.js";
import { admin } from "../middleware/admin.js";
import { getUserActivities } from "../DB Helpers/activities.js";
import validateReq from "../middleware/validateReq.js";
import paginationValidation from "../utils/paginationValidation.js";

const router = express.Router();

router.get(
  "/users",
  [authz, admin, validateReq(paginationValidation, "query")],
  async (req: Request, res: Response) => {
    const activities = await getUserActivities(req.query);
    res.json(activities);
  },
);

router.get("/stats", [authz, admin], async (req: Request, res: Response) => {
  const stats = await Activity.aggregate([
    {
      $facet: {
        totalViews: [{ $match: { type: "view" } }, { $count: "count" }],
        totalDownloads: [{ $match: { type: "download" } }, { $count: "count" }],
        totalSessions: [{ $match: { type: "session" } }, { $count: "count" }],
        mostViewed: [
          { $match: { type: "view", contentId: { $exists: true } } },
          { $group: { _id: "$contentId", frequency: { $sum: 1 } } },
          { $sort: { frequency: -1 } },
          { $limit: 1 },
          {
            $lookup: {
              from: "contents",
              localField: "_id",
              foreignField: "_id",
              as: "content",
            },
          },
          { $unwind: "$content" },
          {
            $project: {
              _id: 0,
              name: "$content.title",
              frequency: 1,
            },
          },
        ],
      },
    },
    {
      $project: {
        totalViews: {
          $ifNull: [{ $arrayElemAt: ["$totalViews.count", 0] }, 0],
        },
        totalDownloads: {
          $ifNull: [{ $arrayElemAt: ["$totalDownloads.count", 0] }, 0],
        },
        totalSessions: {
          $ifNull: [{ $arrayElemAt: ["$totalSessions.count", 0] }, 0],
        },
        mostViewed: { $ifNull: [{ $arrayElemAt: ["$mostViewed", 0] }, null] },
      },
    },
  ]);

  res.json(stats[0]);
});

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
