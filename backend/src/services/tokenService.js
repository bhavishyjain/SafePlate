import { createHash, randomBytes, randomUUID } from "node:crypto";
import jwt from "jsonwebtoken";
import { RefreshToken } from "../models/RefreshToken.js";
import { getConfig } from "../config/env.js";
import { AppError } from "../middleware/errors.js";

export const hashToken = (token) => createHash("sha256").update(token).digest("hex");
export const generateOpaqueToken = () => randomBytes(48).toString("base64url");

function signAccessToken(user) {
  const config = getConfig();
  return jwt.sign(
    { id: user._id, email: user.email, role: user.role },
    config.jwtSecret,
    { expiresIn: config.accessTokenExpiresIn }
  );
}

async function createRefreshToken(userId, ip, familyId = randomUUID()) {
  const config = getConfig();
  const rawToken = generateOpaqueToken();
  const tokenHash = hashToken(rawToken);
  const expiresAt = new Date(Date.now() + config.refreshTokenDays * 24 * 60 * 60 * 1000);
  await RefreshToken.create({ userId, tokenHash, familyId, expiresAt, createdByIp: ip });
  return { rawToken, tokenHash, familyId, expiresAt };
}

export async function issueSession(user, ip) {
  const refresh = await createRefreshToken(user._id, ip);
  return {
    accessToken: signAccessToken(user),
    refreshToken: refresh.rawToken,
    refreshTokenExpiresAt: refresh.expiresAt,
  };
}

export async function rotateSession(rawToken, ip, loadUser) {
  const tokenHash = hashToken(rawToken);
  const stored = await RefreshToken.findOne({ tokenHash });
  if (!stored) {
    throw new AppError(401, "Invalid refresh token", "INVALID_REFRESH_TOKEN");
  }
  if (stored.revokedAt) {
    await RefreshToken.updateMany(
      { familyId: stored.familyId, revokedAt: { $exists: false } },
      { $set: { revokedAt: new Date(), revokedByIp: ip } }
    );
    throw new AppError(401, "Refresh token reuse detected", "REFRESH_TOKEN_REUSE");
  }
  if (stored.expiresAt <= new Date()) {
    stored.revokedAt = new Date();
    stored.revokedByIp = ip;
    await stored.save();
    throw new AppError(401, "Refresh token expired", "REFRESH_TOKEN_EXPIRED");
  }

  const user = await loadUser(stored.userId);
  if (!user) {
    throw new AppError(401, "Token owner no longer exists", "INVALID_REFRESH_TOKEN");
  }
  const replacement = await createRefreshToken(user._id, ip, stored.familyId);
  stored.revokedAt = new Date();
  stored.revokedByIp = ip;
  stored.replacedByHash = replacement.tokenHash;
  await stored.save();

  return {
    accessToken: signAccessToken(user),
    refreshToken: replacement.rawToken,
    refreshTokenExpiresAt: replacement.expiresAt,
  };
}

export async function revokeToken(rawToken, ip) {
  await RefreshToken.findOneAndUpdate(
    { tokenHash: hashToken(rawToken), revokedAt: { $exists: false } },
    { $set: { revokedAt: new Date(), revokedByIp: ip } }
  );
}

export async function revokeAllUserTokens(userId, ip) {
  await RefreshToken.updateMany(
    { userId, revokedAt: { $exists: false } },
    { $set: { revokedAt: new Date(), revokedByIp: ip } }
  );
}
