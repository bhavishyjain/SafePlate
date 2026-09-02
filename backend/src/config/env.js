const DEVELOPMENT_JWT_SECRET = "safeplate-development-secret-change-before-production";

function parsePositiveInteger(value, fallback, name) {
  const parsed = Number.parseInt(value ?? String(fallback), 10);
  if (!Number.isInteger(parsed) || parsed <= 0) {
    throw new Error(`${name} must be a positive integer`);
  }
  return parsed;
}

export function getConfig(env = process.env) {
  const nodeEnv = env.NODE_ENV || "development";
  const isProduction = nodeEnv === "production";
  const jwtSecret = env.JWT_SECRET || (isProduction ? "" : DEVELOPMENT_JWT_SECRET);
  const mongoUri = env.MONGODB_URI || (isProduction ? "" : "mongodb://localhost:27017/safeplate");

  if (!jwtSecret || jwtSecret.length < 32) {
    throw new Error("JWT_SECRET must contain at least 32 characters");
  }
  if (!mongoUri) {
    throw new Error("MONGODB_URI is required");
  }

  return Object.freeze({
    nodeEnv,
    isProduction,
    port: parsePositiveInteger(env.PORT, 5000, "PORT"),
    mongoUri,
    jwtSecret,
    accessTokenExpiresIn: env.ACCESS_TOKEN_EXPIRES_IN || "15m",
    refreshTokenDays: parsePositiveInteger(env.REFRESH_TOKEN_DAYS, 30, "REFRESH_TOKEN_DAYS"),
    passwordResetMinutes: parsePositiveInteger(
      env.PASSWORD_RESET_MINUTES,
      15,
      "PASSWORD_RESET_MINUTES"
    ),
    resendApiKey: env.RESEND_API_KEY || "",
    resendFrom: env.RESEND_FROM || "",
    appBaseUrl: env.APP_BASE_URL || "http://localhost:8081",
    geminiApiKey: env.GEMINI_API_KEY || "",
    geminiModel: env.GEMINI_MODEL || "gemini-2.5-flash",
    operationalTimeZone: "Asia/Kolkata",
    expiryCron: env.EXPIRY_CRON || "*/5 * * * *",
    corsOrigins: (env.CORS_ORIGINS || "*")
      .split(",")
      .map((origin) => origin.trim())
      .filter(Boolean),
    jsonLimit: env.JSON_LIMIT || "1mb",
  });
}
