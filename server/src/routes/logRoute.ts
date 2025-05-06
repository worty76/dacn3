import express from "express";
import { logAccess, getAccessLogs } from "../controllers/logController";
import { authenticate, isAdmin } from "../middleware/auth";

const router = express.Router();

// Access log routes
router.post("/", authenticate, logAccess);
router.get("/", authenticate, isAdmin, getAccessLogs);

export default router;
