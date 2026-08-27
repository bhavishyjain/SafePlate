import test from "node:test";
import assert from "node:assert/strict";
import { canTransitionDonation } from "../src/domain/donationStatus.js";
import { isExpired, startOfOperationalDay } from "../src/utils/date.js";
import { nutritionCatalogSeedData } from "../src/seeds/nutritionCatalog.js";
import { calculateNgoNutrition } from "../src/services/ngoNutritionService.js";

test("donation status transitions enforce the lifecycle", () => {
  assert.equal(canTransitionDonation("PENDING", "ASSIGNED"), true);
  assert.equal(canTransitionDonation("PENDING", "DISCARDED"), true);
  assert.equal(canTransitionDonation("ASSIGNED", "PICKED_UP"), true);
  assert.equal(canTransitionDonation("PICKED_UP", "DELIVERED"), true);
  assert.equal(canTransitionDonation("DELIVERED", "PENDING"), false);
  assert.equal(canTransitionDonation("DISCARDED", "ASSIGNED"), false);
});

test("operational day boundaries use Asia/Kolkata", () => {
  assert.equal(
    startOfOperationalDay("2026-08-27T23:30:00+05:30").toISOString(),
    "2026-08-26T18:30:00.000Z"
  );
  assert.throws(() => startOfOperationalDay("invalid"), /valid date/);
});

test("deadline expiration accepts a deterministic evaluation time", () => {
  const evaluatedAt = "2026-08-27T12:00:00.000Z";
  assert.equal(isExpired("2026-08-27T11:59:59.000Z", evaluatedAt), true);
  assert.equal(isExpired("2026-08-27T12:00:00.000Z", evaluatedAt), true);
  assert.equal(isExpired("2026-08-27T12:00:01.000Z", evaluatedAt), false);
});

test("nutrition catalog seed data is unique and valid", () => {
  const names = nutritionCatalogSeedData.map((catalogItem) => catalogItem.name);
  assert.equal(new Set(names).size, names.length);
  assert.ok(nutritionCatalogSeedData.length >= 10);
  for (const catalogItem of nutritionCatalogSeedData) {
    assert.ok(catalogItem.caloriesPer100g >= 0);
    assert.ok(catalogItem.proteinPer100g >= 0);
    assert.ok(catalogItem.baseShelfLifeHours > 0);
  }
});

test("NGO nutrition is calculated from beneficiary groups", () => {
  const result = calculateNgoNutrition([{ category: "CHILD_1_TO_5", count: 10 }, { category: "OLDER_ADULT_60_PLUS", count: 2 }]);
  assert.equal(result.capacity, 12);
  assert.equal(result.caloriesPerDay, 15800);
  assert.equal(result.proteinGramsPerDay, 278);
});
