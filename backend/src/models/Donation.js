import { Schema, model } from "mongoose";

const DonationSchema = new Schema(
  {
    donorId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    items: {
      type: [
        {
          name: { type: String, required: true, trim: true },
          quantityGrams: { type: Number, required: true, min: 250 },
          nutritionPer100g: {
            calories: { type: Number, required: true, min: 0 },
            proteinGrams: { type: Number, required: true, min: 0 },
          },
          baseShelfLifeHours: { type: Number, required: true, min: 0.1 },
          nutritionSource: { type: String, enum: ["CATALOG", "GEMINI_ESTIMATE", "ADMIN_OVERRIDE"], required: true },
          donorConfirmed: { type: Boolean, required: true, validate: (value) => value === true },
          catalogItemId: { type: Schema.Types.ObjectId, ref: "NutritionCatalogItem" },
        },
      ],
      validate: { validator: (items) => items.length > 0, message: "At least one food item is required" },
    },
    quantityKg: { type: Number, required: true, min: 0.25 },
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
    packagingType: {
      type: String,
      enum: ["SEALED_PACKAGED", "CLOSED_CONTAINER", "OPEN_OR_BULK"],
      required: true,
    },
    storageCondition: {
      type: String,
      enum: ["ROOM_TEMPERATURE", "REFRIGERATED", "FROZEN"],
      required: true,
    },
    status: {
      type: String,
      enum: ["PENDING", "ASSIGNED", "PICKED_UP", "DELIVERED", "DISCARDED"],
      default: "PENDING",
      required: true,
    },
    riskScore: { type: Number, default: 0, min: 0, max: 1 },
    discardReason: { type: String, trim: true },
  },
  { timestamps: true }
);

DonationSchema.pre("validate", function validateDonationDates() {
  if (this.items?.length) {
    this.quantityKg = this.items.reduce((total, item) => total + item.quantityGrams, 0) / 1000;
  }
  if (this.preparedAt && this.pickupDeadline && this.preparedAt >= this.pickupDeadline) {
    this.invalidate("pickupDeadline", "Pickup deadline must be after prepared time");
  }
});

DonationSchema.index({ location: "2dsphere" });
DonationSchema.index({ status: 1, pickupDeadline: 1 });
DonationSchema.index({ donorId: 1, createdAt: -1 });

export const Donation = model("Donation", DonationSchema);
