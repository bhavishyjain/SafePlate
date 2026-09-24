import test from "node:test";
import assert from "node:assert/strict";
import mongoose from "mongoose";
import { Donation } from "../src/models/Donation.js";
import { NGO } from "../src/models/NGO.js";
import { Allocation } from "../src/models/Allocation.js";

const objectId = () => new mongoose.Types.ObjectId();

function validDonation(overrides = {}) {
  return new Donation({
    donorId: objectId(),
    items: [{ name: "Cooked Rice", quantityGrams: 5000, nutritionPer100g: { calories: 130, proteinGrams: 2.7 }, nutritionSource: "CATALOG", donorConfirmed: true }],
    preparedAt: "2026-08-27T08:00:00.000Z",
    pickupDeadline: "2026-08-27T12:00:00.000Z",
    location: { type: "Point", coordinates: [77.59, 12.97] },
    packagingType: "SEALED_PACKAGED",
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

test("allocation stores explainable scores and audit history", async () => {
  const allocation = new Allocation({
    donationId: objectId(),
    ngoId: objectId(),
    matchScore: 0.75,
    scoreSnapshot: {
      donationCalories: 6500,
      donationProteinGrams: 135,
      remainingCaloriesBeforeAssignment: 10000,
      remainingProteinGramsBeforeAssignment: 250,
      nutritionScore: 0.6,
      distanceKm: 5,
      distanceScore: 0.8,
      nutritionWeight: 0.7,
      distanceWeight: 0.3,
      maximumPickupRadiusKm: 25,
      algorithmVersion: "SAFEPLATE_ALLOCATION_V1",
      evaluatedAt: new Date(),
    },
    history: [{ event: "ASSIGNED", toNgoId: objectId() }],
  });
  await assert.doesNotReject(() => allocation.validate());
});

test("allocation audit events require reasons for rejection", async () => {
  const allocation = new Allocation({
    donationId: objectId(), ngoId: objectId(), matchScore: 0.5,
    scoreSnapshot: { donationCalories: 1, donationProteinGrams: 1, remainingCaloriesBeforeAssignment: 1, remainingProteinGramsBeforeAssignment: 1, nutritionScore: 0.5, distanceKm: 1, distanceScore: 0.5, nutritionWeight: 0.7, distanceWeight: 0.3, maximumPickupRadiusKm: 25, algorithmVersion: "SAFEPLATE_ALLOCATION_V1", evaluatedAt: new Date() },
    history: [{ event: "REJECTED", fromNgoId: objectId() }],
  });
  await assert.rejects(() => allocation.validate(), /reason/);
});
