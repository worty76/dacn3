import express, { Request, Response, Application } from "express";
import dotenv from "dotenv";
import mongoose from "mongoose";
import cors from "cors";
import userRoutes from "./src/routes/userRoute";
import documentRoutes from "./src/routes/documentRoute";
import blockchainRoutes from "./src/routes/blockchainRoute";
import logRoutes from "./src/routes/logRoute";
import ipfsRoutes from "./src/routes/ipfsRoute";
import shareRoutes from "./src/routes/shareRoute";

// For env File
dotenv.config();

const app: Application = express();
const port = process.env.PORT || 8000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const MONGO_URI =
  process.env.MONGO_URI || "mongodb://localhost:27017/blockchain-app";
mongoose
  .connect(MONGO_URI)
  .then(() => {
    console.log("Connected to MongoDB");
  })
  .catch((err) => {
    console.error("MongoDB connection error:", err);
  });

// Health check endpoint
app.get("/api/health", (req: Request, res: Response) => {
  res.status(200).json({
    success: true,
    message: "Server is running",
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || "development",
  });
});

// Routes
app.get("/", (req: Request, res: Response) => {
  res.send("Welcome to Express & TypeScript Server");
});

// API Routes
app.use("/api/auth", userRoutes);
app.use("/api/documents", documentRoutes);
app.use("/api/blockchain", blockchainRoutes);
app.use("/api/logs", logRoutes);
app.use("/api/ipfs", ipfsRoutes);
app.use("/api/verify", shareRoutes);

app.listen(port, () => {
  console.log(`Server is running at http://localhost:${port}`);
});
