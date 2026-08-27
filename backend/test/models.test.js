import test from "node:test";
import assert from "node:assert/strict";
import mongoose from "mongoose";
import { Donation } from "../src/models/Donation.js";
import { NGO } from "../src/models/NGO.js";

const objectId = () => new mongoose.Types.ObjectId();

function validDonation(overrides = {}) {
  return new Donation({
    donorId: objectId(),
    items: [{ name: "Cooked Rice", quantityGrams: 5000, nutritionPer100g: { calories: 130, proteinGrams: 2.7 }, baseShelfLifeHours: 6, nutritionSource: "CATALOG", donorConfirmed: true }],
    preparedAt: "2026-08-27T08:00:00.000Z",
    pickupDeadline: "2026-08-27T12:00:00.000Z",
    location: { type: "Point", coordinates: [77.59, 12.97] },
    packagingType: "SEALED_PACKAGED",
    storageCondition: "REFRIGERATED",
    ...overrides,
  });
}

test("donation schema rejects reversed dates", async () => {
  const donation = validDonation({ pickupDeadline: "2026-08-27T07:00:00.000Z" });
  await assert.rejects(() => donation.validate(), /Pickup deadline must be after prepared time/);
});

test("donation schema rejects out-of-range coordinates", async () => {
  const donation = validDonation({ location: { type: "Point", coordinates: [200, 12.97] } });
  await assert.rejects(() => donation.validate(), /Coordinates/);
});

test("NGO schema rejects invalid coordinates", async () => {
  const ngo = new NGO({
    userId: objectId(),
    type: "SHELTER",
    location: { type: "Point", coordinates: [77.59, 100] },
    beneficiaryGroups: [{ category: "ADULT_19_TO_29", count: 20 }],
    capacity: 20,
    calculatedNutrition: { caloriesPerDay: 46000, proteinGramsPerDay: 1080, referenceVersion: "SAFEPLATE_INDIA_V1" },
  });
  await assert.rejects(() => ngo.validate(), /Coordinates/);
});
