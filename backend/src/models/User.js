import { Schema, model } from "mongoose";

const UserSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    phone: { type: String, required: true, unique: true, trim: true },
    email: { type: String, required: true, unique: true, trim: true, lowercase: true },
    passwordHash: { type: String, required: true },
    role: {
      type: String,
      enum: ["DONOR", "NGO", "ADMIN"],
      required: true,
    },
    organization: { type: String },
  },
  { timestamps: true }
);

export const User = model("User", UserSchema);
