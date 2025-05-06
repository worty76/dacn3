import express from "express";
import {
  uploadDocument,
  getDocuments,
  verifyDocument,
  submitForVerification,
  downloadDocument,
} from "../controllers/documentController";
import { authenticate, isAdmin } from "../middleware/auth";

const router = express.Router();

// Document routes
router.post("/upload", authenticate, uploadDocument);
router.get("/", authenticate, getDocuments);
router.put("/verify/:documentId", authenticate, isAdmin, verifyDocument);
router.post("/submit-verification", authenticate, submitForVerification);
router.get("/download/:documentId", authenticate, downloadDocument);

export default router;
