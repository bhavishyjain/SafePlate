import { Schema, model } from "mongoose";

const FoodTypeSchema = new Schema({
  name: { type: String, required: true, unique: true },
  caloriesPer100g: { type: Number, required: true },
  proteinPer100g: { type: Number, required: true },
  baseShelfLifeHours: { type: Number, required: true },
});

export const FoodType = model("FoodType", FoodTypeSchema);
