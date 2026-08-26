import { Schema, model } from "mongoose";

const NGOSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, unique: true },
    type: {
      type: String,
      enum: ["ORPHANAGE", "OLD_AGE_HOME", "SHELTER", "SCHOOL", "OTHER"],
      required: true,
    },
    location: {
      type: {
        type: String,
        enum: ["Point"],
        required: true,
      },
      coordinates: {
        type: [Number], // [longitude, latitude]
        required: true,
      },
    },
    capacity: { type: Number, required: true },
    targetCaloriesPerDay: { type: Number, required: true },
    targetProteinPerDay: { type: Number, required: true },
  },
  { timestamps: true }
);

NGOSchema.index({ location: "2dsphere" });

export const NGO = model("NGO", NGOSchema);
