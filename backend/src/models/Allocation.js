import { Schema, model } from "mongoose";

const AllocationSchema = new Schema(
  {
    donationId: { type: Schema.Types.ObjectId, ref: "Donation", required: true, unique: true },
    ngoId: { type: Schema.Types.ObjectId, ref: "NGO", required: true },
    matchScore: { type: Number, required: true, min: -1, max: 1 },
    assignedAt: { type: Date, default: Date.now },
    pickupConfirmedAt: { type: Date },
    deliveredConfirmedAt: { type: Date },
  },
  { timestamps: true }
);

AllocationSchema.index({ ngoId: 1, assignedAt: -1 });

export const Allocation = model("Allocation", AllocationSchema);
