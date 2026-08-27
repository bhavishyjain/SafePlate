import { Schema, model } from "mongoose";

const RefreshTokenSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    tokenHash: { type: String, required: true, unique: true },
    familyId: { type: String, required: true, index: true },
    expiresAt: { type: Date, required: true, index: { expires: 0 } },
    revokedAt: { type: Date },
    replacedByHash: { type: String },
    createdByIp: { type: String },
    revokedByIp: { type: String },
  },
  { timestamps: true }
);

export const RefreshToken = model("RefreshToken", RefreshTokenSchema);
