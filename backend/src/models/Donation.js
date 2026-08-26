import { Schema, model } from "mongoose";

const DonationSchema = new Schema(
  {
    donorId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    foodType: { type: Schema.Types.ObjectId, ref: "FoodType", required: true },
    quantityKg: { type: Number, required: true },
    preparedAt: { type: Date, required: true },
    pickupDeadline: { type: Date, required: true },
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
    packagingType: {
      type: String,
      enum: ["PACKAGED", "COOKED_LOOSE", "COOKED_CONTAINER"],
      required: true,
    },
    storageCondition: {
      type: String,
      enum: ["AMBIENT", "REFRIGERATED", "FROZEN"],
      required: true,
    },
    status: {
      type: String,
      enum: ["PENDING", "ASSIGNED", "PICKED_UP", "DELIVERED", "DISCARDED"],
      default: "PENDING",
      required: true,
    },
    riskScore: { type: Number, default: 0 },
  },
  { timestamps: true }
);

DonationSchema.index({ location: "2dsphere" });

export const Donation = model("Donation", DonationSchema);
