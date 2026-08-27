import test from "node:test";
import assert from "node:assert/strict";
import { isEmail, isGeoPoint, isPositiveNumber, isValidDate } from "../src/middleware/validate.js";

test("GeoJSON validation enforces coordinate order and ranges", () => {
  assert.equal(isGeoPoint({ type: "Point", coordinates: [77.59, 12.97] }), true);
  assert.equal(isGeoPoint({ type: "Point", coordinates: [181, 12.97] }), false);
  assert.equal(isGeoPoint({ type: "Point", coordinates: [77.59, -91] }), false);
  assert.equal(isGeoPoint({ coordinates: [77.59, 12.97] }), false);
});

test("primitive request validators reject invalid values", () => {
  assert.equal(isEmail("ngo@example.org"), true);
  assert.equal(isEmail("not-an-email"), false);
  assert.equal(isPositiveNumber(0.1), true);
  assert.equal(isPositiveNumber(0), false);
  assert.equal(isValidDate("2026-08-27T10:00:00.000Z"), true);
  assert.equal(isValidDate("invalid"), false);
});
