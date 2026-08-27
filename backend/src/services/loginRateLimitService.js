import { AppError } from "../middleware/errors.js";

const WINDOW_MILLISECONDS = 15 * 60 * 1000;
const MAX_FAILURES = 5;
const attempts = new Map();

function keyFor(email, ip) {
  return `${String(email).trim().toLowerCase()}|${ip || "unknown"}`;
}

function currentEntry(email, ip) {
  const key = keyFor(email, ip);
  const entry = attempts.get(key);
  if (entry && entry.resetAt > Date.now()) return { key, entry };
  attempts.delete(key);
  return { key, entry: { failures: 0, resetAt: Date.now() + WINDOW_MILLISECONDS } };
}

export function assertLoginAllowed(email, ip) {
  const { entry } = currentEntry(email, ip);
  if (entry.failures >= MAX_FAILURES) {
    throw new AppError(429, "Too many failed login attempts; try again later", "LOGIN_RATE_LIMITED", {
      retryAfterSeconds: Math.ceil((entry.resetAt - Date.now()) / 1000),
    });
  }
}

export function recordLoginFailure(email, ip) {
  const { key, entry } = currentEntry(email, ip);
  entry.failures += 1;
  attempts.set(key, entry);
}

export function clearLoginFailures(email, ip) {
  attempts.delete(keyFor(email, ip));
}

export const loginRateLimitPolicy = Object.freeze({
  maxFailures: MAX_FAILURES,
  windowMilliseconds: WINDOW_MILLISECONDS,
});
