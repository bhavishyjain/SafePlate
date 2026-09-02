import test from "node:test";
import assert from "node:assert/strict";
import { generateOpaqueToken, hashToken } from "../src/services/tokenService.js";
import { assertLoginAllowed, clearLoginFailures, recordLoginFailure } from "../src/services/loginRateLimitService.js";

test("opaque tokens are random and stored through deterministic hashes", () => {
  const first = generateOpaqueToken();
  const second = generateOpaqueToken();
  assert.notEqual(first, second);
  assert.equal(hashToken(first), hashToken(first));
  assert.notEqual(hashToken(first), first);
});

test("login limiter blocks the sixth attempt in a 15-minute window", () => {
  const email = `rate-${Date.now()}@example.org`;
  const ip = "127.0.0.99";
  for (let attempt = 0; attempt < 5; attempt += 1) {
    assert.doesNotThrow(() => assertLoginAllowed(email, ip));
    recordLoginFailure(email, ip);
  }
  assert.throws(() => assertLoginAllowed(email, ip), (error) => error.statusCode === 429);
  clearLoginFailures(email, ip);
  assert.doesNotThrow(() => assertLoginAllowed(email, ip));
});
