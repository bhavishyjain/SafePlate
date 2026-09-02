import { Schema, model } from "mongoose";

const NgoNutritionLogSchema = new Schema(
  {
    ngoId: { type: Schema.Types.ObjectId, ref: "NGO", required: true },
    date: { type: Date, required: true },
    deliveredCalories: { type: Number, default: 0, min: 0 },
    deliveredProtein: { type: Number, default: 0, min: 0 },
  },
  { timestamps: true }
);

NgoNutritionLogSchema.index({ ngoId: 1, date: 1 }, { unique: true });

export const NgoNutritionLog = model("NgoNutritionLog", NgoNutritionLogSchema);
