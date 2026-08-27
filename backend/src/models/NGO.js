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
        validate: {
          validator: (coordinates) =>
            coordinates.length === 2 &&
            coordinates[0] >= -180 &&
            coordinates[0] <= 180 &&
            coordinates[1] >= -90 &&
            coordinates[1] <= 90,
          message: "Coordinates must be [longitude, latitude] within valid ranges",
        },
      },
    },
    beneficiaryGroups: {
      type: [
        {
          category: {
            type: String,
            enum: ["CHILD_1_TO_5", "CHILD_6_TO_9", "CHILD_10_TO_12", "TEEN_13_TO_15", "TEEN_16_TO_18", "ADULT_19_TO_29", "ADULT_30_TO_59", "OLDER_ADULT_60_PLUS"],
            required: true,
          },
          count: { type: Number, required: true, min: 1 },
        },
      ],
      validate: { validator: (groups) => groups.length > 0, message: "At least one beneficiary group is required" },
    },
    capacity: { type: Number, required: true, min: 1 },
    calculatedNutrition: {
      caloriesPerDay: { type: Number, required: true, min: 1 },
      proteinGramsPerDay: { type: Number, required: true, min: 1 },
      referenceVersion: { type: String, required: true },
    },
    nutritionOverride: {
      caloriesPerDay: { type: Number, min: 1 },
      proteinGramsPerDay: { type: Number, min: 1 },
      reason: { type: String, trim: true },
      setBy: { type: Schema.Types.ObjectId, ref: "User" },
      setAt: { type: Date },
    },
  },
  { timestamps: true }
);

NGOSchema.index({ location: "2dsphere" });
NGOSchema.index({ type: 1 });

export const NGO = model("NGO", NGOSchema);
