import express from "express";
import {
  getSharedVerification,
  createShareableLink,
} from "../controllers/shareController";
import { authenticate } from "../middleware/auth";

const router = express.Router();

// Get verification data from shared link
router.get("/share", getSharedVerification);

// Create a shareable verification link (requires authentication)
router.post("/create-share", authenticate, createShareableLink);

export default router;
