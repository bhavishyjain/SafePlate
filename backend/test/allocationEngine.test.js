import test from "node:test";
import assert from "node:assert/strict";
import { donationNutrition, haversineDistanceKm, runHeuristicAllocation } from "../src/engines/AllocationEngine.js";

const item = (calories = 100, proteinGrams = 10, quantityGrams = 1000) => ({ quantityGrams, nutritionPer100g: { calories, proteinGrams } });
const donation = (id, longitude, deadline) => ({ _id: id, location: { type: "Point", coordinates: [longitude, 0] }, pickupDeadline: deadline, createdAt: "2026-09-24T08:00:00Z", items: [item()] });
const ngo = (id, longitude, caloriesPerDay = 5000, proteinGramsPerDay = 500) => ({ _id: id, location: { type: "Point", coordinates: [longitude, 0] }, calculatedNutrition: { caloriesPerDay, proteinGramsPerDay } });

test("donation nutrition uses confirmed per-100g snapshots", () => {
  assert.deepEqual(donationNutrition([item(130, 2.7, 500)]), { calories: 650, proteinGrams: 13.5 });
});

test("Haversine distance is deterministic and measured in kilometres", () => {
  const distance = haversineDistanceKm({ coordinates: [0, 0] }, { coordinates: [0.1, 0] });
  assert.ok(distance > 11 && distance < 11.2);
});

test("allocation excludes NGOs beyond 25km and prioritizes nutrition need", () => {
  const proposals = runHeuristicAllocation(
    [donation("donation-1", 0, "2026-09-24T12:00:00Z")],
    [ngo("near-met", 0.01), ngo("needs-food", 0.1), ngo("too-far", 0.3)],
    new Map([["near-met", { calories: 5000, proteinGrams: 500 }]]),
    { evaluatedAt: new Date("2026-09-24T09:00:00Z") }
  );
  assert.equal(proposals[0].ngoId, "needs-food");
  assert.equal(proposals[0].scoreSnapshot.maximumPickupRadiusKm, 25);
});

test("closest NGO wins when every eligible NGO has met its target", () => {
  const delivered = new Map([["closest", { calories: 5000, proteinGrams: 500 }], ["farther", { calories: 5000, proteinGrams: 500 }]]);
  const proposals = runHeuristicAllocation([donation("donation-1", 0, "2026-09-24T12:00:00Z")], [ngo("farther", 0.1), ngo("closest", 0.01)], delivered);
  assert.equal(proposals[0].ngoId, "closest");
});

test("nutrition score uses only nutrients that still have a gap", () => {
  const proposals = runHeuristicAllocation(
    [donation("donation-1", 0, "2026-09-24T12:00:00Z")],
    [ngo("protein-gap", 0.01, 1000, 500)],
    new Map([["protein-gap", { calories: 1000, proteinGrams: 400 }]])
  );
  assert.equal(proposals[0].scoreSnapshot.nutritionScore, 1);
});

test("rejected NGO exclusions and earliest deadlines are respected", () => {
  const proposals = runHeuristicAllocation(
    [donation("later", 0, "2026-09-24T14:00:00Z"), donation("urgent", 0, "2026-09-24T10:00:00Z")],
    [ngo("excluded", 0.01), ngo("available", 0.02)],
    new Map(),
    { excludedNgoIdsByDonation: new Map([["urgent", ["excluded"]]]) }
  );
  assert.equal(proposals[0].donationId, "urgent");
  assert.equal(proposals[0].ngoId, "available");
});

test("allocation weights must total one", () => {
  assert.throws(() => runHeuristicAllocation([], [], new Map(), { nutritionWeight: 0.7, distanceWeight: 0.2 }), /total 1/);
});
