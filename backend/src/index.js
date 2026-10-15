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
  let expiryTask;
  const server = app.listen(config.port, () => {
    expiryTask = startExpiryScheduler(config.expiryCron);
    console.log(`SafePlate Backend API running on port ${config.port}`);
  });
  server.on("error", async (error) => {
    console.error(error.code === "EADDRINUSE" ? `Port ${config.port} is already in use. Set PORT to a free port and update EXPO_PUBLIC_API_URL to match.` : `SafePlate API could not listen: ${error.message}`);
    await disconnectDB();
    process.exitCode = 1;
  });

  async function shutdown(signal) {
    console.log(`${signal} received; shutting down`);
    server.close(async () => {
      expiryTask?.stop();
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
