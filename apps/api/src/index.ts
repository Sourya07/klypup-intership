import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import authRouter from "./modules/auth/routes";
import orgsRouter from "./modules/organizations/routes";
import researchRouter from "./modules/research/routes";
import watchlistRouter from "./modules/watchlist/routes";
import compareRouter from "./modules/compare/routes";
import { errorHandler } from "./middleware";
import { sendError } from "./utils";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 8000;

app.use(cors());
app.use(express.json());

// Global Health Check Route
app.get("/health", (req, res) => {
  res.status(200).json({ status: "OK", timestamp: new Date().toISOString() });
});

// Mount Routes under both /api and /api/v1
app.use("/api/auth", authRouter);
app.use("/api/v1/auth", authRouter);

app.use("/api/orgs", orgsRouter);
app.use("/api/v1/orgs", orgsRouter);

app.use("/api/research", researchRouter);
app.use("/api/v1/research", researchRouter);

app.use("/api/watchlist", watchlistRouter);
app.use("/api/v1/watchlist", watchlistRouter);

app.use("/api/compare", compareRouter);
app.use("/api/v1/compare", compareRouter);

app.use("/api", (req, res) => {
  sendError(res, 404, `API route not found: ${req.method} ${req.originalUrl}`);
});

// Global Error Handler (must be after all routes)
app.use(errorHandler());

// Start Server
app.listen(PORT, () => {
  console.log(`🚀 API Server is running on port ${PORT}`);
});

export default app;
