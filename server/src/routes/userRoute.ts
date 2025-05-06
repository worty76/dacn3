import express from "express";
import { register, login } from "../controllers/authController";
import { getProfile, updateProfile } from "../controllers/userController";
import {
  createBlockchainIdentity,
  getBlockchainIdentity,
  verifyBlockchainIdentity,
  updateBlockchainIdentity,
  revokeBlockchainIdentity,
} from "../controllers/blockchainController";
import {
  uploadDocument,
  getDocuments,
  verifyDocument,
} from "../controllers/documentController";
import { getAccessLogs, logAccess } from "../controllers/logController";
import { authenticate, isAdmin } from "../middleware/auth"; // Fixed import path

// Create router instance
const router = express.Router();

// Authentication routes
router.post("/login", login);
router.post("/register", register);

// Profile routes
router.get("/profile", authenticate, getProfile);
router.put("/profile", authenticate, updateProfile);

// Blockchain identity routes
router.post("/blockchain-identity", authenticate, createBlockchainIdentity);
router.get("/blockchain-identity", authenticate, getBlockchainIdentity);
router.put(
  "/blockchain-identity/verify",
  authenticate,
  isAdmin, // Added admin check
  verifyBlockchainIdentity
);
router.put(
  "/blockchain-identity/update",
  authenticate,
  updateBlockchainIdentity
);
router.delete(
  "/blockchain-identity/revoke",
  authenticate,
  revokeBlockchainIdentity
);

// Document upload & KYC routes
router.post("/documents", authenticate, uploadDocument);
router.get("/documents", authenticate, getDocuments);
router.put("/documents/verify", authenticate, verifyDocument);

// Access logs routes
router.get("/access-logs", authenticate, getAccessLogs);
router.post("/access-logs", authenticate, logAccess);

export default router;
