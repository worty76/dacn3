import express from "express";
import {
  createBlockchainIdentity,
  getBlockchainIdentity,
  verifyBlockchainIdentity,
  updateBlockchainIdentity,
  revokeBlockchainIdentity,
} from "../controllers/blockchainController";
import { authenticate, isAdmin } from "../middleware/auth";

const router = express.Router();

// Blockchain identity routes
router.post("/identity", authenticate, createBlockchainIdentity);
router.get("/identity", authenticate, getBlockchainIdentity);
router.put("/identity/verify", authenticate, isAdmin, verifyBlockchainIdentity);
router.put("/identity", authenticate, updateBlockchainIdentity);
router.put("/identity/revoke", authenticate, revokeBlockchainIdentity);

export default router;
