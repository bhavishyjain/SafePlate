import { User } from "../models/User.js";
import { AppError } from "../middleware/errors.js";
import { revokeAllUserTokens } from "../services/tokenService.js";
import { paginationFromQuery, paginatedResult } from "../utils/pagination.js";

export async function listUsers(req, res, next) {
  try {
    const filter = {};
    if (req.query.role) filter.role = req.query.role;
    if (req.query.active === "true") filter.isActive = { $ne: false };
    if (req.query.active === "false") filter.isActive = false;
    if (req.query.search?.trim()) {
      const escaped = req.query.search.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      filter.$or = [{ name: new RegExp(escaped, "i") }, { email: new RegExp(escaped, "i") }, { phone: new RegExp(escaped, "i") }];
    }
    const page = paginationFromQuery(req.query);
    const [items, total] = await Promise.all([User.find(filter).select("-passwordHash").sort(page.sort).skip(page.skip).limit(page.limit), User.countDocuments(filter)]);
    return res.json(paginatedResult(items, total, page));
  } catch (error) { return next(error); }
}

export async function setUserStatus(req, res, next) {
  try {
    if (req.params.id === req.user.id && req.body.isActive === false) return next(new AppError(409, "You cannot disable your own account", "SELF_DISABLE_FORBIDDEN"));
    const user = await User.findByIdAndUpdate(req.params.id, { $set: { isActive: req.body.isActive } }, { new: true }).select("-passwordHash");
    if (!user) return next(new AppError(404, "User not found", "USER_NOT_FOUND"));
    if (!user.isActive) await revokeAllUserTokens(user._id, req.ip);
    return res.json(user);
  } catch (error) { return next(error); }
}

export async function revokeUserSessions(req, res, next) {
  try {
    const user = await User.findById(req.params.id).select("_id");
    if (!user) return next(new AppError(404, "User not found", "USER_NOT_FOUND"));
    await revokeAllUserTokens(user._id, req.ip);
    return res.json({ message: "All refresh-token sessions revoked" });
  } catch (error) { return next(error); }
}
