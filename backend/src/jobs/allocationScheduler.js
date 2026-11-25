import cron from "node-cron";
import { optimizeAllocations } from "../services/allocationService.js";

export function startAllocationScheduler(expression) {
  let running = false;
  return cron.schedule(expression, async () => {
    if (running) return;
    running = true;
    try {
      const result = await optimizeAllocations();
      if (result.allocationsCreatedCount) console.log(`Automatically assigned ${result.allocationsCreatedCount} pending donation(s)`);
    } catch (error) {
      if (error.code !== "OPTIMIZATION_IN_PROGRESS") console.error("Automatic allocation job failed:", error.message);
    } finally {
      running = false;
    }
  }, { timezone: "Asia/Kolkata" });
}
