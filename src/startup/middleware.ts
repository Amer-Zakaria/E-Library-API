import helmet from "helmet";
import express, { type Express } from "express";
import "express-async-errors";
import cors from "cors";
import rateLimit from "express-rate-limit";

export default function (app: Express) {
  app.use(express.json({ limit: "10mb" }));

  app.use(express.static("uploads"));

  app.use(
    cors({
      origin: [
        process.env.DASHBOARD_URL as string,
        process.env.CUSTOMER_UI_URL as string,
      ],
      allowedHeaders: ["x-auth-token", "Content-Type"],
      exposedHeaders: ["x-auth-token"],
      preflightContinue: true,
      methods: ["GET", "PUT", "POST", "PATCH", "DELETE"],
    }),
  );

  // Rate limiting
  const limiter = rateLimit({
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS!) || 60 * 60 * 1000, // 1 hour
    max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS!) || 3000, // limit each IP to 3000 requests per windowMs
    skip: (req) => req.method === "OPTIONS",
    handler: (req, res) => {
      res.status(429).json({
        success: false,
        message: "Too many requests from this IP, please try again later.",
      });
    },
    standardHeaders: true,
    legacyHeaders: false,
  });
  app.use("/api", limiter);

  app.use(helmet());
}
