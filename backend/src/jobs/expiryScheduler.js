import cron from "node-cron";
import { expirePendingDonations } from "../services/donationExpiryService.js";
export function startExpiryScheduler(expression) {
  let running = false;
  return cron.schedule(expression, async () => {
    if (running) return;
    running = true;
    try { const result = await expirePendingDonations(); if (result.expiredCount) console.log(`Expired ${result.expiredCount} pending donation(s)`); }
    catch (error) { console.error("Donation expiry job failed:", error.message); }
    finally { running = false; }
  }, { timezone: "Asia/Kolkata" });
}
