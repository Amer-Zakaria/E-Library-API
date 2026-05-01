import type { Express } from "express";
import mongoose from "mongoose";
import error from "../middleware/error.js";
import destinations from "../routes/destinations.js";
import projects from "../routes/projects.js";
import signin from "../routes/signin.js";

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

  app.use("/api/signin", signin);
  app.use("/api/projects", projects);
  app.use("/api/destinations", destinations);

  app.use(error);
}
