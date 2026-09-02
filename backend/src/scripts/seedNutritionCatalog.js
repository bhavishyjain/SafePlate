import dotenv from "dotenv";
import { connectDB, disconnectDB } from "../config/db.js";
import { getConfig } from "../config/env.js";
import { NutritionCatalogItem } from "../models/NutritionCatalogItem.js";
import { nutritionCatalogSeedData } from "../seeds/nutritionCatalog.js";

dotenv.config();
async function run() {
  await connectDB(getConfig().mongoUri);
  const result = await NutritionCatalogItem.bulkWrite(nutritionCatalogSeedData.map((item) => ({ updateOne: { filter: { name: item.name }, update: { $set: item }, upsert: true } })));
  console.log(`Nutrition catalog seeded: ${result.upsertedCount} created, ${result.modifiedCount} updated`);
}
run().catch((error) => { console.error(error.message); process.exitCode = 1; }).finally(() => disconnectDB());
