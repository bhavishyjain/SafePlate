import { optimizeAllocations } from "../services/allocationService.js";

export async function optimize(req, res, next) {
  try {
    const result = await optimizeAllocations({ performedBy: req.user.id });
    return res.json({ message: "Allocation engine executed successfully", ...result });
  } catch (error) { return next(error); }
}
