import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { connectDB } from "./config/db.js";

// Routes
import authRoutes from "./routes/auth.js";
import donationRoutes from "./routes/donations.js";
import ngoRoutes from "./routes/ngos.js";
import optimizeRoutes from "./routes/optimize.js";
import allocationRoutes from "./routes/allocations.js";
import dashboardRoutes from "./routes/dashboard.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Connect to MongoDB
connectDB();

// Middleware
app.use(cors());
app.use(express.json());

// Base Health Check
app.get("/health", (req, res) => {
  res.json({ status: "OK", service: "SafePlate API" });
});

// Register Routes
app.use("/auth", authRoutes);
app.use("/donations", donationRoutes);
app.use("/ngos", ngoRoutes);
app.use("/optimize", optimizeRoutes);
app.use("/allocations", allocationRoutes);
app.use("/dashboard", dashboardRoutes);

app.listen(PORT, () => {
  console.log(`SafePlate Backend API running on port ${PORT}`);
});
