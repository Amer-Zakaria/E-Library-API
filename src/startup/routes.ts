import type { Express } from "express";
import mongoose from "mongoose";
import error from "../middleware/error.js";
import categories from "../routes/categories.js";
import contents from "../routes/contents.js";
import signin from "../routes/signin.js";
import uploaders from "../routes/uploaders.js";
import track from "../routes/track.js";

export default function (app: Express) {
  app.get("/", (req, res) => res.json(`Hello from the home page!!`));

  // Health check endpoint
  app.get("/health", (req, res) => {
    res.json({
      name: process.env.PROJECT_NAME,
      success: true,
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV,
      database:
        mongoose.connection.readyState === 1 ? "connected" : "disconnected",
    });
  });

  app.use("/api/uploaders", uploaders);
  app.use("/api/signin", signin);
  app.use("/api/contents", contents);
  app.use("/api/categories", categories);
  app.use("/api/track", track);

  app.use(error);
}
