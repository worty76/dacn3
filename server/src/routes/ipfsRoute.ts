import express from "express";
import {
  proxyIpfsContent,
  downloadDocumentById,
} from "../controllers/ipfsController";
import { authenticate } from "../middleware/auth";

const router = express.Router();

// Public route to access IPFS content by CID
router.get("/content/:cid", proxyIpfsContent);

// Authenticated route to download documents by ID
router.get("/download/:documentId", authenticate, downloadDocumentById);

export default router;
