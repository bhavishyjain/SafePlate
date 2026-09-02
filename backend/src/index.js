import dotenv from "dotenv";
import { createApp } from "./app.js";
import { connectDB, disconnectDB } from "./config/db.js";
import { getConfig } from "./config/env.js";
import { startExpiryScheduler } from "./jobs/expiryScheduler.js";

dotenv.config();

async function startServer() {
  const config = getConfig();
  await connectDB(config.mongoUri);
  const app = createApp(config);
  const expiryTask = startExpiryScheduler(config.expiryCron);
  const server = app.listen(config.port, () => {
    console.log(`SafePlate Backend API running on port ${config.port}`);
  });

  async function shutdown(signal) {
    console.log(`${signal} received; shutting down`);
    server.close(async () => {
      expiryTask.stop();
      await disconnectDB();
      process.exit(0);
    });
  }

  process.once("SIGINT", () => shutdown("SIGINT"));
  process.once("SIGTERM", () => shutdown("SIGTERM"));
}

startServer().catch((error) => {
  console.error("Failed to start SafePlate API:", error.message);
  process.exit(1);
});
