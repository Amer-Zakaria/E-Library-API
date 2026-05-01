import { logger } from "../index.js";

export default () => {
  if (!process.env.JWT_PRIVATE_TOKEN) {
    logger.error("FATAL ERROR: jwtPrivateKey is not defined.");
    process.exit(1);
  }
  if (!process.env.URI) {
    logger.error("FATAL ERROR: DB URI is not defined.");
    process.exit(1);
  }
  if (!process.env.PASS) {
    logger.error("FATAL ERROR: Password isn't defined.");
    process.exit(1);
  }
};
