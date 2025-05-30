import express from "express";
import { authenticate, isAdmin } from "../middleware/auth";
import {
  uploadDocument,
  getDocuments,
  verifyDocument,
  downloadDocument,
  submitForVerification,
  getPendingDocuments,
  adminVerifyDocument,
  enableMultiSigVerification,
  adminSignDocument,
} from "../controllers/documentController";

const router = express.Router();

// User routes
router.post("/upload", authenticate, uploadDocument);
router.get("/", authenticate, getDocuments);
router.post("/submit-verification", authenticate, submitForVerification);
router.get("/download/:documentId", authenticate, downloadDocument);

// Premium multi-signature routes (user)
router.post("/enable-multisig", authenticate, enableMultiSigVerification);

// Admin routes
router.get("/pending", authenticate, isAdmin, getPendingDocuments);
router.post("/verify/:documentId", authenticate, isAdmin, verifyDocument);
router.post(
  "/admin-verify/:documentId",
  authenticate,
  isAdmin,
  adminVerifyDocument
);
router.post(
  "/admin-sign/:documentId",
  authenticate,
  isAdmin,
  adminSignDocument
);

export default router;
