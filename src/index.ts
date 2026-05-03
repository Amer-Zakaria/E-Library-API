import "dotenv/config";
import express from "express";
import buildLogger from "./startup/logger.js";
import validation from "./startup/validation.js";
import middlewares from "./startup/middleware.js";
import db from "./startup/db.js";
import routes from "./startup/routes.js";
import makeServerStayAlive from "./startup/makeServerStayAlive.js";

const app = express();

//Startups
export const logger = buildLogger();
validation();
middlewares(app);
db();
routes(app);
makeServerStayAlive();

export const isErrorWithStack: boolean = true;

logger.info(`Environment: ${process.env.NODE_ENV}`);
logger.info(`Name: ${process.env.PROJECT_NAME}`);

//Publishing
const port = process.env.PORT || 3001;
const server = app.listen(port, () => {
  logger.info(`\nlistening at port ${port}, any incoming requests?!`);
});
server.timeout = 15 * 60 * 1000; // 15min for 200MB uploads
server.keepAliveTimeout = 65000; // 65 seconds
server.headersTimeout = 66000; // 66 seconds (slightly higher than keepAlive)
