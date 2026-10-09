import dotenv from "dotenv";
import bcrypt from "bcryptjs";
import mongoose from "mongoose";
import { connectDB, disconnectDB } from "../config/db.js";
import { getConfig } from "../config/env.js";
import { User } from "../models/User.js";
import { NGO } from "../models/NGO.js";
import { Donation } from "../models/Donation.js";
import { Allocation } from "../models/Allocation.js";
import { NgoNutritionLog } from "../models/NgoNutritionLog.js";
import { NutritionCatalogItem } from "../models/NutritionCatalogItem.js";
import { nutritionCatalogSeedData } from "../seeds/nutritionCatalog.js";
import { calculateNgoNutrition } from "../services/ngoNutritionService.js";
import { donationNutrition } from "../engines/AllocationEngine.js";
import { startOfOperationalDay } from "../utils/date.js";

dotenv.config();

const DEMO_PASSWORD = "SafePlate123!";
const HOUR = 60 * 60 * 1000;
const DAY = 24 * HOUR;

const donationIds = Array.from(
  { length: 8 },
  (_, index) => new mongoose.Types.ObjectId(`64f00000000000000000000${index + 1}`),
);
const allocationIds = Array.from(
  { length: 6 },
  (_, index) => new mongoose.Types.ObjectId(`65f00000000000000000000${index + 1}`),
);

function at(now, offset) {
  return new Date(now.getTime() + offset);
}

async function upsertUser(data, passwordHash) {
  return User.findOneAndUpdate(
    { email: data.email },
    { $set: { ...data, passwordHash } },
    { upsert: true, new: true, runValidators: true, setDefaultsOnInsert: true },
  );
}

async function upsertNgo({ userId, type, location, beneficiaryGroups, nutritionOverride }) {
  const calculated = calculateNgoNutrition(beneficiaryGroups);
  const update = {
    $set: {
      type,
      location,
      beneficiaryGroups,
      capacity: calculated.capacity,
      calculatedNutrition: {
        caloriesPerDay: calculated.caloriesPerDay,
        proteinGramsPerDay: calculated.proteinGramsPerDay,
        referenceVersion: calculated.referenceVersion,
      },
      ...(nutritionOverride ? { nutritionOverride } : {}),
    },
  };
  if (!nutritionOverride) update.$unset = { nutritionOverride: 1 };
  return NGO.findOneAndUpdate(
    { userId },
    update,
    { upsert: true, new: true, runValidators: true, setDefaultsOnInsert: true },
  );
}

function foodItem(catalogByName, name, quantityGrams, source = "CATALOG") {
  const catalog = catalogByName.get(name);
  if (!catalog) throw new Error(`Missing nutrition catalog item: ${name}`);
  return {
    name,
    quantityGrams,
    nutritionPer100g: {
      calories: catalog.caloriesPer100g,
      proteinGrams: catalog.proteinPer100g,
    },
    nutritionSource: source,
    donorConfirmed: true,
    catalogItemId: catalog._id,
  };
}

function donation({ _id, donorId, items, preparedAt, pickupDeadline, coordinates, packagingType, status, discardReason, createdAt }) {
  return {
    _id,
    donorId,
    items,
    quantityKg: items.reduce((sum, item) => sum + item.quantityGrams, 0) / 1000,
    preparedAt,
    pickupDeadline,
    location: { type: "Point", coordinates },
    packagingType,
    status,
    ...(discardReason ? { discardReason } : {}),
    createdAt,
    updatedAt: createdAt,
  };
}

function scoreSnapshot(donationRecord, evaluatedAt, distanceKm, remainingCalories = 42000, remainingProtein = 1200) {
  const nutrition = donationNutrition(donationRecord.items);
  const nutritionScore = Math.min(1, ((nutrition.calories / remainingCalories) + (nutrition.proteinGrams / remainingProtein)) / 2);
  const distanceScore = Math.max(0, 1 - distanceKm / 25);
  return {
    donationCalories: nutrition.calories,
    donationProteinGrams: nutrition.proteinGrams,
    remainingCaloriesBeforeAssignment: remainingCalories,
    remainingProteinGramsBeforeAssignment: remainingProtein,
    nutritionScore,
    distanceKm,
    distanceScore,
    nutritionWeight: 0.7,
    distanceWeight: 0.3,
    maximumPickupRadiusKm: 25,
    algorithmVersion: "SAFEPLATE_ALLOCATION_V1",
    evaluatedAt,
  };
}

function allocation({ _id, donationRecord, ngoId, status, performedBy, assignedAt, pickupAt, deliveredAt, history, rejectedNgoIds = [] }) {
  const score = scoreSnapshot(donationRecord, assignedAt, 2.4);
  const nutrition = donationNutrition(donationRecord.items);
  return {
    _id,
    donationId: donationRecord._id,
    ngoId,
    status,
    matchScore: 0.7 * score.nutritionScore + 0.3 * score.distanceScore,
    scoreSnapshot: score,
    rejectedNgoIds,
    history: history ?? [
      { event: "ASSIGNED", toNgoId: ngoId, performedBy, at: assignedAt },
      ...(pickupAt ? [{ event: "PICKED_UP", performedBy, at: pickupAt }] : []),
      ...(deliveredAt ? [{ event: "DELIVERED", performedBy, at: deliveredAt }] : []),
    ],
    assignedAt,
    ...(pickupAt ? { pickupConfirmedAt: pickupAt } : {}),
    ...(deliveredAt ? {
      deliveredConfirmedAt: deliveredAt,
      deliveryNutritionSnapshot: {
        calories: nutrition.calories,
        proteinGrams: nutrition.proteinGrams,
        operationalDate: startOfOperationalDay(deliveredAt),
      },
    } : {}),
    createdAt: assignedAt,
    updatedAt: deliveredAt ?? pickupAt ?? assignedAt,
  };
}

async function run() {
  const config = getConfig();
  if (config.isProduction) throw new Error("Development demo data cannot be seeded in production");
  await connectDB(config.mongoUri);

  await NutritionCatalogItem.bulkWrite(
    nutritionCatalogSeedData.map((item) => ({
      updateOne: { filter: { name: item.name }, update: { $set: { ...item, active: true } }, upsert: true },
    })),
  );
  const catalog = await NutritionCatalogItem.find({ name: { $in: nutritionCatalogSeedData.map((item) => item.name) } });
  const catalogByName = new Map(catalog.map((item) => [item.name, item]));

  const passwordHash = await bcrypt.hash(DEMO_PASSWORD, 10);
  const [donor, secondDonor, ngoUser, partnerNgoUser, admin, disabledUser] = await Promise.all([
    upsertUser({ name: "Aarav Donor", phone: "+919000000001", email: "donor@safeplate.dev", role: "DONOR", organization: "Aarav Foods", isActive: true }, passwordHash),
    upsertUser({ name: "Meera Donor", phone: "+919000000002", email: "donor.partner@safeplate.dev", role: "DONOR", organization: "Community Kitchen", isActive: true }, passwordHash),
    upsertUser({ name: "Anaya NGO Coordinator", phone: "+919000000003", email: "ngo@safeplate.dev", role: "NGO", organization: "Hope Community Centre", isActive: true }, passwordHash),
    upsertUser({ name: "Kabir NGO Coordinator", phone: "+919000000004", email: "ngo.partner@safeplate.dev", role: "NGO", organization: "Sunrise Shelter", isActive: true }, passwordHash),
    upsertUser({ name: "SafePlate Administrator", phone: "+919000000005", email: "admin@safeplate.dev", role: "ADMIN", organization: "SafePlate", isActive: true }, passwordHash),
    upsertUser({ name: "Disabled Demo User", phone: "+919000000006", email: "disabled@safeplate.dev", role: "DONOR", organization: "Archived Partner", isActive: false }, passwordHash),
  ]);

  const now = new Date();
  const [primaryNgo, partnerNgo] = await Promise.all([
    upsertNgo({
      userId: ngoUser._id,
      type: "SHELTER",
      location: { type: "Point", coordinates: [77.6033, 12.9767] },
      beneficiaryGroups: [
        { category: "CHILD_6_TO_9", count: 12 },
        { category: "ADULT_19_TO_29", count: 18 },
        { category: "OLDER_ADULT_60_PLUS", count: 8 },
      ],
      nutritionOverride: {
        caloriesPerDay: 76000,
        proteinGramsPerDay: 2550,
        reason: "Demo override reflecting the centre's current meal plan",
        setBy: admin._id,
        setAt: at(now, -2 * DAY),
      },
    }),
    upsertNgo({
      userId: partnerNgoUser._id,
      type: "ORPHANAGE",
      location: { type: "Point", coordinates: [77.6162, 12.9668] },
      beneficiaryGroups: [
        { category: "CHILD_1_TO_5", count: 10 },
        { category: "CHILD_10_TO_12", count: 15 },
        { category: "TEEN_13_TO_15", count: 10 },
      ],
    }),
  ]);

  const records = [
    donation({ _id: donationIds[0], donorId: donor._id, items: [foodItem(catalogByName, "Cooked Rice", 5000), foodItem(catalogByName, "Dal", 2500)], preparedAt: at(now, -HOUR), pickupDeadline: at(now, 8 * HOUR), coordinates: [77.5946, 12.9716], packagingType: "CLOSED_CONTAINER", status: "PENDING", createdAt: at(now, -30 * 60 * 1000) }),
    donation({ _id: donationIds[1], donorId: donor._id, items: [foodItem(catalogByName, "Chapati", 4000), foodItem(catalogByName, "Mixed Vegetable Curry", 3000)], preparedAt: at(now, -2 * HOUR), pickupDeadline: at(now, 7 * HOUR), coordinates: [77.5901, 12.9698], packagingType: "SEALED_PACKAGED", status: "ASSIGNED", createdAt: at(now, -90 * 60 * 1000) }),
    donation({ _id: donationIds[2], donorId: donor._id, items: [foodItem(catalogByName, "Khichdi", 6500)], preparedAt: at(now, -5 * HOUR), pickupDeadline: at(now, 3 * HOUR), coordinates: [77.6060, 12.9780], packagingType: "CLOSED_CONTAINER", status: "PICKED_UP", createdAt: at(now, -5 * HOUR) }),
    donation({ _id: donationIds[3], donorId: donor._id, items: [foodItem(catalogByName, "Idli", 5000), foodItem(catalogByName, "Fresh Fruit", 2500)], preparedAt: at(now, -9 * HOUR), pickupDeadline: at(now, -3 * HOUR), coordinates: [77.5975, 12.9730], packagingType: "SEALED_PACKAGED", status: "DELIVERED", createdAt: at(now, -9 * HOUR) }),
    donation({ _id: donationIds[4], donorId: donor._id, items: [foodItem(catalogByName, "Bread", 3000), foodItem(catalogByName, "Milk", 3000)], preparedAt: at(now, -2 * DAY), pickupDeadline: at(now, -2 * DAY + 5 * HOUR), coordinates: [77.5880, 12.9650], packagingType: "SEALED_PACKAGED", status: "DISCARDED", discardReason: "Pickup deadline expired before a volunteer was available", createdAt: at(now, -2 * DAY) }),
    donation({ _id: donationIds[5], donorId: donor._id, items: [foodItem(catalogByName, "Packaged Meal", 4500)], preparedAt: at(now, -3 * HOUR), pickupDeadline: at(now, 10 * HOUR), coordinates: [77.5920, 12.9700], packagingType: "SEALED_PACKAGED", status: "PENDING", createdAt: at(now, -3 * HOUR) }),
    donation({ _id: donationIds[6], donorId: donor._id, items: [foodItem(catalogByName, "Cooked Rice", 3500), foodItem(catalogByName, "Mixed Vegetable Curry", 2500)], preparedAt: at(now, -4 * HOUR), pickupDeadline: at(now, 9 * HOUR), coordinates: [77.6000, 12.9680], packagingType: "OPEN_OR_BULK", status: "PENDING", createdAt: at(now, -4 * HOUR) }),
    donation({ _id: donationIds[7], donorId: secondDonor._id, items: [foodItem(catalogByName, "Chapati", 5000), foodItem(catalogByName, "Dal", 4000)], preparedAt: at(now, -DAY - 8 * HOUR), pickupDeadline: at(now, -DAY - 2 * HOUR), coordinates: [77.6120, 12.9690], packagingType: "CLOSED_CONTAINER", status: "DELIVERED", createdAt: at(now, -DAY - 8 * HOUR) }),
  ];

  await Allocation.deleteMany({ _id: { $in: allocationIds } });
  await Donation.deleteMany({ _id: { $in: donationIds } });
  await Donation.insertMany(records);

  const allocations = [
    allocation({ _id: allocationIds[0], donationRecord: records[1], ngoId: primaryNgo._id, status: "ASSIGNED", performedBy: admin._id, assignedAt: at(now, -70 * 60 * 1000) }),
    allocation({ _id: allocationIds[1], donationRecord: records[2], ngoId: primaryNgo._id, status: "PICKED_UP", performedBy: ngoUser._id, assignedAt: at(now, -4 * HOUR), pickupAt: at(now, -2 * HOUR) }),
    allocation({ _id: allocationIds[2], donationRecord: records[3], ngoId: primaryNgo._id, status: "DELIVERED", performedBy: ngoUser._id, assignedAt: at(now, -8 * HOUR), pickupAt: at(now, -6 * HOUR), deliveredAt: at(now, -4 * HOUR) }),
    allocation({ _id: allocationIds[3], donationRecord: records[5], ngoId: primaryNgo._id, status: "CANCELLED", performedBy: admin._id, assignedAt: at(now, -2.5 * HOUR), history: [
      { event: "ASSIGNED", toNgoId: primaryNgo._id, performedBy: admin._id, at: at(now, -2.5 * HOUR) },
      { event: "CANCELLED", fromNgoId: primaryNgo._id, performedBy: admin._id, reason: "Volunteer vehicle became unavailable", at: at(now, -2 * HOUR) },
    ] }),
    allocation({ _id: allocationIds[4], donationRecord: records[6], ngoId: partnerNgo._id, status: "REJECTED", performedBy: partnerNgoUser._id, assignedAt: at(now, -3.5 * HOUR), rejectedNgoIds: [partnerNgo._id], history: [
      { event: "ASSIGNED", toNgoId: partnerNgo._id, performedBy: admin._id, at: at(now, -3.5 * HOUR) },
      { event: "REJECTED", fromNgoId: partnerNgo._id, performedBy: partnerNgoUser._id, reason: "Insufficient refrigerated transport capacity", at: at(now, -3 * HOUR) },
    ] }),
    allocation({ _id: allocationIds[5], donationRecord: records[7], ngoId: partnerNgo._id, status: "DELIVERED", performedBy: partnerNgoUser._id, assignedAt: at(now, -DAY - 7 * HOUR), pickupAt: at(now, -DAY - 5 * HOUR), deliveredAt: at(now, -DAY - 3 * HOUR) }),
  ];
  await Allocation.insertMany(allocations);

  const primaryDelivered = donationNutrition(records[3].items);
  const partnerDelivered = donationNutrition(records[7].items);
  await NgoNutritionLog.bulkWrite([
    { updateOne: { filter: { ngoId: primaryNgo._id, date: startOfOperationalDay(now) }, update: { $set: { deliveredCalories: primaryDelivered.calories, deliveredProtein: primaryDelivered.proteinGrams } }, upsert: true } },
    { updateOne: { filter: { ngoId: partnerNgo._id, date: startOfOperationalDay(at(now, -DAY)) }, update: { $set: { deliveredCalories: partnerDelivered.calories, deliveredProtein: partnerDelivered.proteinGrams } }, upsert: true } },
  ]);

  console.log("SafePlate development demo data seeded successfully");
  console.table([
    { role: "DONOR", email: donor.email, password: DEMO_PASSWORD },
    { role: "NGO", email: ngoUser.email, password: DEMO_PASSWORD },
    { role: "ADMIN", email: admin.email, password: DEMO_PASSWORD },
  ]);
  console.log(`Created/refreshed: 6 users, 2 NGO profiles, ${records.length} donations, ${allocations.length} allocations, 2 nutrition logs, and ${catalog.length} catalog items.`);
  console.log(`Disabled account for admin testing: ${disabledUser.email}`);
}

run()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => disconnectDB());
