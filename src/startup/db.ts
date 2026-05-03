import { connect } from "mongoose";
import { logger } from "../index.js";

const FULL_URI = process.env.URI! + process.env.DB_BASE!;

export default function db() {
  connect(FULL_URI)
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
