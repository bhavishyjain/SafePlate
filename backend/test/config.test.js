import test from "node:test";
import assert from "node:assert/strict";
import { getConfig } from "../src/config/env.js";

test("development configuration has safe local defaults", () => {
  const config = getConfig({ NODE_ENV: "test" });
  assert.equal(config.port, 5000);
  assert.equal(config.mongoUri, "mongodb://localhost:27017/safeplate");
  assert.ok(config.jwtSecret.length >= 32);
  assert.equal(config.maximumPickupRadiusKm, 25);
  assert.equal(config.nutritionWeight, 0.7);
  assert.equal(config.distanceWeight, 0.3);
  assert.equal(config.maximumPageSize, 100);
});

test("production configuration requires explicit secrets and database", () => {
  assert.throws(() => getConfig({ NODE_ENV: "production" }), /JWT_SECRET/);
  assert.throws(
    () => getConfig({ NODE_ENV: "production", JWT_SECRET: "x".repeat(32) }),
    /MONGODB_URI/
  );
});

test("configuration validates positive port values", () => {
  assert.throws(() => getConfig({ NODE_ENV: "test", PORT: "0" }), /PORT/);
  assert.throws(() => getConfig({ NODE_ENV: "test", PORT: "abc" }), /PORT/);
});

test("allocation weights must total one", () => {
  assert.throws(() => getConfig({ NODE_ENV: "test", ALLOCATION_NUTRITION_WEIGHT: "0.8", ALLOCATION_DISTANCE_WEIGHT: "0.3" }), /total 1/);
});
