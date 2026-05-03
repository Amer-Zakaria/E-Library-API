import keepTheServerAlive from "./../utils/cron.js";
import cron from "node-cron";

export default function makeServerStayAlive() {
  cron.schedule("*/10 * * * *", () => {
    keepTheServerAlive();
  });
}
