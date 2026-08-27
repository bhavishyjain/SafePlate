import express from "express";
import cors from "cors";
import authRoutes from "./routes/auth.js";
import donationRoutes from "./routes/donations.js";
import ngoRoutes from "./routes/ngos.js";
import optimizeRoutes from "./routes/optimize.js";
import allocationRoutes from "./routes/allocations.js";
import dashboardRoutes from "./routes/dashboard.js";
import nutritionRoutes from "./routes/nutrition.js";
import { requestContext } from "./middleware/requestContext.js";
import { errorHandler, notFoundHandler } from "./middleware/errors.js";

const routeGroups = [
  ["/auth", authRoutes],
  ["/donations", donationRoutes],
  ["/ngos", ngoRoutes],
  ["/optimize", optimizeRoutes],
  ["/allocations", allocationRoutes],
  ["/dashboard", dashboardRoutes],
  ["/nutrition", nutritionRoutes],
];

function buildCorsOptions(corsOrigins) {
  if (corsOrigins.includes("*")) {
    return { origin: true };
  }
  return {
    origin(origin, callback) {
      if (!origin || corsOrigins.includes(origin)) {
        return callback(null, true);
      }
      return callback(new Error("Origin is not allowed by CORS"));
    },
  };
}

export function createApp(config) {
  const app = express();

  app.disable("x-powered-by");
  app.use(requestContext);
  app.use(cors(buildCorsOptions(config.corsOrigins)));
  app.use(express.json({ limit: config.jsonLimit }));

  const healthHandler = (_req, res) => res.json({ status: "OK", service: "SafePlate API" });
  app.get("/api/v1/health", healthHandler);

  for (const [path, router] of routeGroups) {
    app.use(`/api/v1${path}`, router);
  }

  app.use(notFoundHandler);
  app.use(errorHandler);
  return app;
}
