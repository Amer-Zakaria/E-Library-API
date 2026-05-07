import mongoose, { model } from "mongoose";
import type IActivitySchema from "../Interfaces/IActivitySchema.js";

const activitySchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: ["view", "download", "session"],
      required: true,
    },

    browserId: {
      type: String,
    },

    contentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Content",
    },

    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  { versionKey: false },
);

export const Activity = model<IActivitySchema>("Activities", activitySchema);
