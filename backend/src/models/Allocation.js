import { Schema, model } from "mongoose";

const ScoreSnapshotSchema = new Schema(
  {
    donationCalories: { type: Number, required: true, min: 0 },
    donationProteinGrams: { type: Number, required: true, min: 0 },
    remainingCaloriesBeforeAssignment: { type: Number, required: true, min: 0 },
    remainingProteinGramsBeforeAssignment: { type: Number, required: true, min: 0 },
    nutritionScore: { type: Number, required: true, min: 0, max: 1 },
    distanceKm: { type: Number, required: true, min: 0 },
    distanceScore: { type: Number, required: true, min: 0, max: 1 },
    nutritionWeight: { type: Number, required: true, min: 0, max: 1 },
    distanceWeight: { type: Number, required: true, min: 0, max: 1 },
    maximumPickupRadiusKm: { type: Number, required: true, min: 0.1 },
    algorithmVersion: { type: String, required: true },
    evaluatedAt: { type: Date, required: true },
  },
  { _id: false }
);

const HistoryEventSchema = new Schema(
  {
    event: {
      type: String,
      enum: ["ASSIGNED", "PICKED_UP", "DELIVERED", "REJECTED", "CANCELLED", "REASSIGNED"],
      required: true,
    },
    fromNgoId: { type: Schema.Types.ObjectId, ref: "NGO" },
    toNgoId: { type: Schema.Types.ObjectId, ref: "NGO" },
    performedBy: { type: Schema.Types.ObjectId, ref: "User" },
    reason: {
      type: String,
      trim: true,
      required() {
        return ["REJECTED", "CANCELLED", "REASSIGNED"].includes(this.event);
      },
    },
    at: { type: Date, default: Date.now, required: true },
  },
  { _id: false }
);

const DeliveryNutritionSnapshotSchema = new Schema(
  {
    calories: { type: Number, required: true, min: 0 },
    proteinGrams: { type: Number, required: true, min: 0 },
    operationalDate: { type: Date, required: true },
  },
  { _id: false }
);

const AllocationSchema = new Schema(
  {
    donationId: { type: Schema.Types.ObjectId, ref: "Donation", required: true, unique: true },
    ngoId: { type: Schema.Types.ObjectId, ref: "NGO", required: true },
    status: {
      type: String,
      enum: ["ASSIGNED", "PICKED_UP", "DELIVERED", "REJECTED", "CANCELLED"],
      default: "ASSIGNED",
      required: true,
    },
    matchScore: { type: Number, required: true, min: 0, max: 1 },
    scoreSnapshot: { type: ScoreSnapshotSchema, required: true },
    rejectedNgoIds: [{ type: Schema.Types.ObjectId, ref: "NGO" }],
    history: { type: [HistoryEventSchema], default: [] },
    assignedAt: { type: Date, default: Date.now },
    pickupConfirmedAt: { type: Date },
    deliveredConfirmedAt: { type: Date },
    deliveryNutritionSnapshot: { type: DeliveryNutritionSnapshotSchema },
  },
  { timestamps: true }
);

AllocationSchema.index({ ngoId: 1, assignedAt: -1 });
AllocationSchema.index({ status: 1, assignedAt: -1 });

export const Allocation = model("Allocation", AllocationSchema);
