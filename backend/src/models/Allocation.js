import { Schema, model } from "mongoose";

const AllocationSchema = new Schema({
  donationId: { type: Schema.Types.ObjectId, ref: "Donation", required: true, unique: true },
  ngoId: { type: Schema.Types.ObjectId, ref: "NGO", required: true },
  matchScore: { type: Number, required: true },
  assignedAt: { type: Date, default: Date.now },
  pickupConfirmedAt: { type: Date },
  deliveredConfirmedAt: { type: Date },
});

export const Allocation = model("Allocation", AllocationSchema);
