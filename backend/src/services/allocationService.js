import { randomUUID } from "node:crypto";
import mongoose from "mongoose";
import { Allocation } from "../models/Allocation.js";
import { Donation } from "../models/Donation.js";
import { NGO } from "../models/NGO.js";
import { NgoNutritionLog } from "../models/NgoNutritionLog.js";
import { OptimizationLock } from "../models/OptimizationLock.js";
import { AppError } from "../middleware/errors.js";
import { getConfig } from "../config/env.js";
import { runHeuristicAllocation, donationNutrition } from "../engines/AllocationEngine.js";
import { effectiveNgoNutrition } from "./ngoNutritionService.js";
import { expirePendingDonations } from "./donationExpiryService.js";
import { startOfOperationalDay } from "../utils/date.js";

const LOCK_ID = "allocation-optimization";

function sessionOption(session) {
  return session ? { session } : {};
}

function transactionsUnsupported(error) {
  return error?.code === 20 || error?.code === 251 || /transaction numbers are only allowed|replica set/i.test(error?.message ?? "");
}

async function atomic(work) {
  const session = await mongoose.startSession();
  try {
    let result;
    await session.withTransaction(async () => { result = await work(session); });
    return result;
  } catch (error) {
    if (!transactionsUnsupported(error)) throw error;
    return work(null);
  } finally {
    await session.endSession();
  }
}

async function acquireOptimizationLock() {
  const owner = randomUUID();
  const now = new Date();
  try {
    const lock = await OptimizationLock.findOneAndUpdate(
      { _id: LOCK_ID, $or: [{ lockedUntil: { $lte: now } }, { owner }] },
      { $set: { owner, lockedUntil: new Date(now.getTime() + 2 * 60 * 1000) } },
      { upsert: true, new: true }
    );
    return lock.owner === owner ? owner : null;
  } catch (error) {
    if (error?.code === 11000) return null;
    throw error;
  }
}

async function releaseOptimizationLock(owner) {
  await OptimizationLock.deleteOne({ _id: LOCK_ID, owner });
}

async function allocationInputs(evaluatedAt, donationIds) {
  const donationFilter = { status: "PENDING", pickupDeadline: { $gt: evaluatedAt } };
  if (donationIds?.length) donationFilter._id = { $in: donationIds };
  const [donations, ngos, logs, existingAllocations] = await Promise.all([
    Donation.find(donationFilter).lean(),
    NGO.find().lean(),
    NgoNutritionLog.find({ date: startOfOperationalDay(evaluatedAt) }).lean(),
    Allocation.find({ status: { $in: ["REJECTED", "CANCELLED"] } }).select("donationId rejectedNgoIds").lean(),
  ]);
  const deliveredByNgo = new Map(logs.map((log) => [String(log.ngoId), { calories: log.deliveredCalories, proteinGrams: log.deliveredProtein }]));
  const excludedNgoIdsByDonation = new Map(existingAllocations.map((allocation) => [String(allocation.donationId), allocation.rejectedNgoIds.map(String)]));
  const preparedNgos = ngos.map((ngo) => ({ ...ngo, effectiveNutrition: effectiveNgoNutrition(ngo) }));
  return { donations, ngos: preparedNgos, deliveredByNgo, excludedNgoIdsByDonation };
}

async function persistProposal(proposal, performedBy) {
  return atomic(async (session) => {
    const options = { new: true, ...sessionOption(session) };
    const claimed = await Donation.findOneAndUpdate(
      { _id: proposal.donationId, status: "PENDING", pickupDeadline: { $gt: proposal.scoreSnapshot.evaluatedAt } },
      { $set: { status: "ASSIGNED" }, $unset: { discardReason: 1 } },
      options
    );
    if (!claimed) return null;
    try {
      return await Allocation.findOneAndUpdate(
        { donationId: proposal.donationId },
        {
          $set: { ngoId: proposal.ngoId, status: "ASSIGNED", matchScore: proposal.matchScore, scoreSnapshot: proposal.scoreSnapshot, assignedAt: new Date(), pickupConfirmedAt: null, deliveredConfirmedAt: null },
          $push: { history: { event: "ASSIGNED", toNgoId: proposal.ngoId, performedBy, at: new Date() } },
        },
        { upsert: true, new: true, runValidators: true, ...sessionOption(session) }
      );
    } catch (error) {
      if (!session) await Donation.updateOne({ _id: claimed._id, status: "ASSIGNED" }, { $set: { status: "PENDING" } });
      throw error;
    }
  });
}

export async function optimizeAllocations({ performedBy, donationIds } = {}) {
  const lockOwner = await acquireOptimizationLock();
  if (!lockOwner) throw new AppError(409, "Allocation optimization is already running", "OPTIMIZATION_IN_PROGRESS");
  const evaluatedAt = new Date();
  try {
    const expired = await expirePendingDonations(evaluatedAt);
    const inputs = await allocationInputs(evaluatedAt, donationIds);
    const config = getConfig();
    const proposals = runHeuristicAllocation(inputs.donations, inputs.ngos, inputs.deliveredByNgo, {
      evaluatedAt,
      excludedNgoIdsByDonation: inputs.excludedNgoIdsByDonation,
      maximumPickupRadiusKm: config.maximumPickupRadiusKm,
      nutritionWeight: config.nutritionWeight,
      distanceWeight: config.distanceWeight,
    });
    const allocations = [];
    for (const proposal of proposals) {
      const allocation = await persistProposal(proposal, performedBy);
      if (allocation) allocations.push(allocation);
    }
    return { evaluatedAt, expiredDonationsDiscarded: expired.expiredCount, allocationsCreatedCount: allocations.length, unmatchedDonationsCount: inputs.donations.length - allocations.length, allocations };
  } finally {
    await releaseOptimizationLock(lockOwner);
  }
}

async function loadAuthorizedAllocation(allocationId, actor) {
  const allocation = await Allocation.findById(allocationId);
  if (!allocation) throw new AppError(404, "Allocation not found", "ALLOCATION_NOT_FOUND");
  if (actor.role === "ADMIN") return allocation;
  const ngo = await NGO.findOne({ userId: actor.id }).select("_id");
  if (!ngo || String(ngo._id) !== String(allocation.ngoId)) throw new AppError(403, "You cannot update this allocation", "FORBIDDEN");
  return allocation;
}

export async function confirmAllocationPickup(allocationId, actor) {
  const current = await loadAuthorizedAllocation(allocationId, actor);
  if (["PICKED_UP", "DELIVERED"].includes(current.status)) return current;
  if (current.status !== "ASSIGNED") throw new AppError(409, "Only an assigned donation can be picked up", "INVALID_STATUS_TRANSITION");
  return atomic(async (session) => {
    const now = new Date();
    const allocation = await Allocation.findOneAndUpdate({ _id: current._id, status: "ASSIGNED" }, { $set: { status: "PICKED_UP", pickupConfirmedAt: now }, $push: { history: { event: "PICKED_UP", performedBy: actor.id, at: now } } }, { new: true, ...sessionOption(session) });
    if (!allocation) return Allocation.findById(current._id);
    const donation = await Donation.findOneAndUpdate({ _id: allocation.donationId, status: "ASSIGNED" }, { $set: { status: "PICKED_UP" } }, { new: true, ...sessionOption(session) });
    if (!donation) throw new AppError(409, "Donation is not in the assigned state", "INVALID_STATUS_TRANSITION");
    return allocation;
  });
}

export async function confirmAllocationDelivery(allocationId, actor) {
  const current = await loadAuthorizedAllocation(allocationId, actor);
  if (current.status === "DELIVERED") return current;
  if (current.status !== "PICKED_UP") throw new AppError(409, "Pickup must be confirmed before delivery", "INVALID_STATUS_TRANSITION");
  return atomic(async (session) => {
    const donation = await Donation.findById(current.donationId, null, sessionOption(session));
    if (!donation || donation.status !== "PICKED_UP") throw new AppError(409, "Donation is not ready for delivery", "INVALID_STATUS_TRANSITION");
    const nutrition = donationNutrition(donation.items);
    const operationalDate = startOfOperationalDay();
    const now = new Date();
    const allocation = await Allocation.findOneAndUpdate(
      { _id: current._id, status: "PICKED_UP" },
      { $set: { status: "DELIVERED", deliveredConfirmedAt: now, deliveryNutritionSnapshot: { calories: nutrition.calories, proteinGrams: nutrition.proteinGrams, operationalDate } }, $push: { history: { event: "DELIVERED", performedBy: actor.id, at: now } } },
      { new: true, ...sessionOption(session) }
    );
    if (!allocation) return Allocation.findById(current._id);
    const updated = await Donation.findOneAndUpdate({ _id: donation._id, status: "PICKED_UP" }, { $set: { status: "DELIVERED" } }, { ...sessionOption(session) });
    if (!updated) throw new AppError(409, "Donation delivery was already processed", "DELIVERY_ALREADY_PROCESSED");
    await NgoNutritionLog.findOneAndUpdate({ ngoId: allocation.ngoId, date: operationalDate }, { $inc: { deliveredCalories: nutrition.calories, deliveredProtein: nutrition.proteinGrams } }, { upsert: true, new: true, ...sessionOption(session) });
    return allocation;
  });
}

export async function rejectAllocation(allocationId, actor, reason) {
  const current = await loadAuthorizedAllocation(allocationId, actor);
  if (actor.role !== "NGO") throw new AppError(403, "Only the assigned NGO can reject an assignment", "FORBIDDEN");
  if (current.status !== "ASSIGNED") throw new AppError(409, "Only an active assignment can be rejected", "INVALID_STATUS_TRANSITION");
  await atomic(async (session) => {
    const now = new Date();
    const allocation = await Allocation.findOneAndUpdate({ _id: current._id, status: "ASSIGNED" }, { $set: { status: "REJECTED" }, $addToSet: { rejectedNgoIds: current.ngoId }, $push: { history: { event: "REJECTED", fromNgoId: current.ngoId, performedBy: actor.id, reason, at: now } } }, { new: true, ...sessionOption(session) });
    if (!allocation) throw new AppError(409, "Assignment was already updated", "ALLOCATION_CONFLICT");
    const donation = await Donation.findOneAndUpdate({ _id: current.donationId, status: "ASSIGNED" }, { $set: { status: "PENDING" } }, { ...sessionOption(session) });
    if (!donation) throw new AppError(409, "Donation is not assigned", "INVALID_STATUS_TRANSITION");
  });
  try {
    const result = await optimizeAllocations({ performedBy: actor.id, donationIds: [current.donationId] });
    return { rejected: true, replacement: result.allocations.find((allocation) => String(allocation.donationId) === String(current.donationId)) ?? null };
  } catch (error) {
    if (error.code !== "OPTIMIZATION_IN_PROGRESS") throw error;
    return { rejected: true, replacement: null };
  }
}

export async function cancelAllocation(allocationId, actor, reason) {
  const current = await loadAuthorizedAllocation(allocationId, actor);
  if (actor.role !== "ADMIN") throw new AppError(403, "Only an admin can cancel an assignment", "FORBIDDEN");
  if (current.status !== "ASSIGNED") throw new AppError(409, "Only an active assignment can be cancelled", "INVALID_STATUS_TRANSITION");
  return atomic(async (session) => {
    const now = new Date();
    const allocation = await Allocation.findOneAndUpdate({ _id: current._id, status: "ASSIGNED" }, { $set: { status: "CANCELLED" }, $push: { history: { event: "CANCELLED", fromNgoId: current.ngoId, performedBy: actor.id, reason, at: now } } }, { new: true, ...sessionOption(session) });
    const donation = await Donation.findOneAndUpdate({ _id: current.donationId, status: "ASSIGNED" }, { $set: { status: "PENDING" } }, { ...sessionOption(session) });
    if (!allocation || !donation) throw new AppError(409, "Allocation changed during cancellation", "ALLOCATION_CONFLICT");
    return allocation;
  });
}

export async function reassignAllocation(allocationId, actor, ngoId, reason) {
  const current = await loadAuthorizedAllocation(allocationId, actor);
  if (actor.role !== "ADMIN") throw new AppError(403, "Only an admin can reassign a donation", "FORBIDDEN");
  if (!['ASSIGNED', 'REJECTED', 'CANCELLED'].includes(current.status)) throw new AppError(409, "This allocation cannot be reassigned", "INVALID_STATUS_TRANSITION");
  if (String(current.ngoId) === String(ngoId)) throw new AppError(400, "Choose a different NGO", "SAME_NGO_REASSIGNMENT");
  if (current.rejectedNgoIds.map(String).includes(String(ngoId))) throw new AppError(409, "The selected NGO previously rejected this donation", "NGO_PREVIOUSLY_REJECTED");
  const [donation, ngo, delivered] = await Promise.all([
    Donation.findById(current.donationId).lean(),
    NGO.findById(ngoId).lean(),
    NgoNutritionLog.findOne({ ngoId, date: startOfOperationalDay() }).lean(),
  ]);
  if (!donation) throw new AppError(404, "Donation not found", "DONATION_NOT_FOUND");
  if (!ngo) throw new AppError(404, "NGO profile not found", "NGO_NOT_FOUND");
  const deliveredByNgo = new Map([[String(ngoId), { calories: delivered?.deliveredCalories ?? 0, proteinGrams: delivered?.deliveredProtein ?? 0 }]]);
  const proposal = runHeuristicAllocation([donation], [{ ...ngo, effectiveNutrition: effectiveNgoNutrition(ngo) }], deliveredByNgo, { ...getConfig(), evaluatedAt: new Date() })[0];
  if (!proposal) throw new AppError(409, "The selected NGO is outside the pickup radius", "NGO_OUTSIDE_PICKUP_RADIUS");
  return atomic(async (session) => {
    const now = new Date();
    const allocation = await Allocation.findOneAndUpdate({ _id: current._id, status: current.status }, { $set: { ngoId, status: "ASSIGNED", matchScore: proposal.matchScore, scoreSnapshot: proposal.scoreSnapshot, assignedAt: now, pickupConfirmedAt: null, deliveredConfirmedAt: null }, $push: { history: { event: "REASSIGNED", fromNgoId: current.ngoId, toNgoId: ngoId, performedBy: actor.id, reason, at: now } } }, { new: true, runValidators: true, ...sessionOption(session) });
    const donationUpdate = await Donation.findOneAndUpdate({ _id: current.donationId, status: { $in: ["PENDING", "ASSIGNED"] } }, { $set: { status: "ASSIGNED" } }, { ...sessionOption(session) });
    if (!allocation || !donationUpdate) throw new AppError(409, "Allocation changed during reassignment", "ALLOCATION_CONFLICT");
    return allocation;
  });
}
