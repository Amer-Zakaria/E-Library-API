import devLogger from "./dev-logger.js";
import { Logger } from "winston";

export default function buildLogger() {
  let logger: Logger;
  logger = devLogger();

  return logger;
}
