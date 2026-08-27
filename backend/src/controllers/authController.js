import bcrypt from "bcryptjs";
import { User } from "../models/User.js";
import { PasswordResetToken } from "../models/PasswordResetToken.js";
import { AppError } from "../middleware/errors.js";
import { getConfig } from "../config/env.js";
import { generateOpaqueToken, hashToken, issueSession, revokeAllUserTokens, revokeToken, rotateSession } from "../services/tokenService.js";
import { assertLoginAllowed, clearLoginFailures, recordLoginFailure } from "../services/loginRateLimitService.js";
import { sendPasswordResetEmail } from "../services/emailService.js";

export async function register(req, res, next) {
  try {
    const { name, phone, email, password, role, organization } = req.body;
    const normalizedEmail = email.trim().toLowerCase();
    const normalizedPhone = phone.trim();
    const existingUser = await User.findOne({ $or: [{ email: normalizedEmail }, { phone: normalizedPhone }] });
    if (existingUser) return next(new AppError(409, "Email or phone already exists", "USER_ALREADY_EXISTS"));
    const user = await User.create({ name: name.trim(), phone: normalizedPhone, email: normalizedEmail, passwordHash: await bcrypt.hash(password, 10), role, organization });
    return res.status(201).json({ id: user._id, message: "User registered successfully" });
  } catch (error) { return next(error); }
}

export async function login(req, res, next) {
  const { email, password, role } = req.body;
  const normalizedEmail = email.trim().toLowerCase();
  try {
    assertLoginAllowed(normalizedEmail, req.ip);
    const query = { email: normalizedEmail };
    if (role) query.role = role;
    const user = await User.findOne(query);
    if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
      recordLoginFailure(normalizedEmail, req.ip);
      return next(new AppError(401, "Invalid credentials", "INVALID_CREDENTIALS"));
    }
    clearLoginFailures(normalizedEmail, req.ip);
    const session = await issueSession(user, req.ip);
    return res.json({ id: user._id, name: user.name, email: user.email, role: user.role, auth_token: session.accessToken, ...session });
  } catch (error) { return next(error); }
}

export async function refresh(req, res, next) {
  try { return res.json(await rotateSession(req.body.refreshToken, req.ip, (id) => User.findById(id))); }
  catch (error) { return next(error); }
}

export async function logout(req, res, next) {
  try { await revokeToken(req.body.refreshToken, req.ip); return res.json({ message: "Logged out successfully" }); }
  catch (error) { return next(error); }
}

export async function logoutAll(req, res, next) {
  try { await revokeAllUserTokens(req.user.id, req.ip); return res.json({ message: "Logged out from all devices" }); }
  catch (error) { return next(error); }
}

export async function forgotPassword(req, res, next) {
  const genericResponse = { message: "If an account exists for that email, a password reset link has been sent" };
  try {
    const user = await User.findOne({ email: req.body.email.trim().toLowerCase() });
    if (!user) return res.json(genericResponse);
    await PasswordResetToken.deleteMany({ userId: user._id, usedAt: { $exists: false } });
    const rawToken = generateOpaqueToken();
    const config = getConfig();
    const record = await PasswordResetToken.create({ userId: user._id, tokenHash: hashToken(rawToken), expiresAt: new Date(Date.now() + config.passwordResetMinutes * 60 * 1000) });
    try { await sendPasswordResetEmail({ to: user.email, name: user.name, resetToken: rawToken }); }
    catch (emailError) { await PasswordResetToken.deleteOne({ _id: record._id }); console.error("Password reset email could not be sent:", emailError.message); }
    return res.json(genericResponse);
  } catch (error) { return next(error); }
}

export async function resetPassword(req, res, next) {
  try {
    const record = await PasswordResetToken.findOne({ tokenHash: hashToken(req.body.token), usedAt: { $exists: false }, expiresAt: { $gt: new Date() } });
    if (!record) return next(new AppError(400, "Reset token is invalid or expired", "INVALID_RESET_TOKEN"));
    const user = await User.findById(record.userId);
    if (!user) return next(new AppError(400, "Reset token is invalid or expired", "INVALID_RESET_TOKEN"));
    user.passwordHash = await bcrypt.hash(req.body.password, 10);
    await user.save();
    record.usedAt = new Date();
    await record.save();
    await revokeAllUserTokens(user._id, req.ip);
    return res.json({ message: "Password reset successfully" });
  } catch (error) { return next(error); }
}

export async function me(req, res, next) {
  try {
    const user = await User.findById(req.user.id).select("-passwordHash");
    if (!user) return next(new AppError(404, "User not found", "USER_NOT_FOUND"));
    return res.json(user);
  } catch (error) { return next(error); }
}
