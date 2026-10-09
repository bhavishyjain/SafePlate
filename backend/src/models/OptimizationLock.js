import { Schema, model } from "mongoose";

const OptimizationLockSchema = new Schema({
  _id: { type: String },
  owner: { type: String, required: true },
  lockedUntil: { type: Date, required: true },
});

export const OptimizationLock = model("OptimizationLock", OptimizationLockSchema);
