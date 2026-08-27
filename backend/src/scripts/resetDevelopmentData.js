import dotenv from "dotenv";
import mongoose from "mongoose";
import { connectDB, disconnectDB } from "../config/db.js";
import { getConfig } from "../config/env.js";

dotenv.config();
async function run() {
  const config = getConfig();
  if (config.isProduction || process.env.CONFIRM_DATABASE_RESET !== "SAFEPLATE_RESET") {
    throw new Error("Development reset requires NODE_ENV != production and CONFIRM_DATABASE_RESET=SAFEPLATE_RESET");
  }
  await connectDB(config.mongoUri);
  const collections = ["allocations", "donations", "ngonutritionlogs", "ngos", "nutritioncatalogitems", "foodtypes", "refreshtokens", "passwordresettokens"];
  for (const name of collections) {
    if ((await mongoose.connection.db.listCollections({ name }).toArray()).length) await mongoose.connection.db.collection(name).deleteMany({});
  }
  console.log("SafePlate development data reset completed; user accounts were preserved");
}
run().catch((error) => { console.error(error.message); process.exitCode = 1; }).finally(() => disconnectDB());
