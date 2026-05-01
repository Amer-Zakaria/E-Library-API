import { connect } from "mongoose";
import { logger } from "../index.js";

const FULL_URI = process.env.URI! + process.env.DB_BASE!;

export default function db() {
  connect(FULL_URI, {
    family: 4,
    maxPoolSize: 5, // Reduced from 100 to avoid overloading the database resources
    minPoolSize: 1, // keep one up and ready
    maxIdleTimeMS: 30000, // Close idle connections quickly
    socketTimeoutMS: 120000, // Increase to 2 minutes for 200MB uploads
    retryWrites: true,
    w: "majority",
  })
    .then((mongoose) => {
      logger.info(`\nConnected to MongoDB "${FULL_URI}"`);

      mongoose.connection.on("error", (err) => {
        logger.error(`MongoDB runtime error: ${err.message}`);
      });
    })
    .catch((err) => {
      logger.error(`DB failed to connect, err: ${err}`);
    });
}
