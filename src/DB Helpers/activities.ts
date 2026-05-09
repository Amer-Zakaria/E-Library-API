import type IPagination from "../Interfaces/IPagination.js";
import { Activity } from "../models/activity.js";

export async function getUserActivities(pagination: IPagination) {
  const pageNumber = +(pagination.pageNumber ?? 1);
  const pageSize = +(pagination.pageSize ?? 10);

  const UserActivitiesPromise = Activity.aggregate([
    {
      $group: {
        _id: "$browserId",
        lastSeen: {
          $max: {
            $cond: [{ $eq: ["$type", "session"] }, "$createdAt", null],
          },
        },
        numberOfSessions: {
          $sum: { $cond: [{ $eq: ["$type", "session"] }, 1, 0] },
        },
        sumOfDownloads: {
          $sum: { $cond: [{ $eq: ["$type", "download"] }, 1, 0] },
        },
        sumOfViews: {
          $sum: { $cond: [{ $eq: ["$type", "view"] }, 1, 0] },
        },
      },
    },
    {
      $sort: { lastSeen: -1 },
    },
    {
      $skip: (pageNumber - 1) * pageSize,
    },
    {
      $limit: pageSize,
    },
  ]);

  const UserActivitiesCountPromise = Activity.aggregate([
    {
      $group: {
        _id: "$browserId",
      },
    },
    {
      $count: "count",
    },
  ]);

  return Promise.all([UserActivitiesPromise, UserActivitiesCountPromise]).then(
    (result) => {
      const offset = (pageNumber - 1) * pageSize;
      const activities = result[0].map((activity, index) => ({
        ...activity,
        userLabel: `User ${offset + index + 1}`,
      }));
      const totalItems = result[1][0]?.count ?? 0;

      return {
        activities,
        paginationInfo: {
          totalItems,
          totalPages: Math.ceil(totalItems / pageSize),
          pageSize,
          pageNumber,
        },
      };
    },
  );
}
