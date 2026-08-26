import mongoose from "mongoose";

export const connectDB = async () => {
  try {
    const connUri = process.env.MONGODB_URI || "mongodb://localhost:27017/safeplate";
    await mongoose.connect(connUri);
    console.log("MongoDB Connected successfully");
  } catch (error) {
    console.error("MongoDB connection error:", error);
    process.exit(1);
  }
};
