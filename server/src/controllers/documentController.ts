import { Request, Response } from "express";
import mongoose from "mongoose";
import Document from "../models/document";
import { uploadToIPFS } from "../utils/ipfsService";
import { storeDocumentHash } from "../utils/blockchainService";
import formidable, { Fields, Files } from "formidable";

interface AuthenticatedRequest extends Request {
  userId?: string; // Added by authenticate middleware
}

// Define interfaces for the file structure
interface DocumentFile {
  name: string;
  size: number;
  mimetype: string;
  // Add other properties as needed
}

interface ParsedForm {
  document?: DocumentFile | DocumentFile[];
  // Add other form fields as needed
  [key: string]: unknown;
}

/**
 * Upload identity document to IPFS and store hash on blockchain
 */
export const uploadDocument = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const files = await doSomethingWithNodeRequest(req);

    // Validate request
    if (!files || !req.body.documentType) {
      res.status(400).json({ message: "Document file and type are required" });
      return;
    }

    // Make sure userId exists
    if (!req.userId) {
      res.status(401).json({ message: "Not authenticated" });
      return;
    }

    // Upload file to IPFS
    const file: DocumentFile = Array.isArray(files.document)
      ? files.document[0]
      : (files.document as DocumentFile);
    const ipfsResult = await uploadToIPFS(file);
    const ipfsHash = ipfsResult.path;

    // Store document metadata in database
    const documentData = {
      userId: new mongoose.Types.ObjectId(req.userId),
      documentType: req.body.documentType,
      ipfsHash,
      fileName: file.name,
      fileSize: file.size,
      mimeType: file.mimetype,
      isVerified: false,
      uploadedAt: new Date(),
    };

    const document = await Document.create(documentData);
    const documentId = document._id.toString(); // Extract ID as string

    // Store document hash on blockchain
    const txHash = await storeDocumentHash(req.userId, ipfsHash, documentId);

    // Update document with transaction hash
    document.blockchainTxHash = txHash;
    await document.save();

    res.status(201).json({
      success: true,
      message: "Document uploaded successfully",
      document: {
        id: document._id,
        documentType: document.documentType,
        ipfsHash: document.ipfsHash,
        fileName: document.fileName,
        isVerified: document.isVerified,
        blockchainTxHash: document.blockchainTxHash,
      },
    });
  } catch (error) {
    console.error("Error uploading document:", error);
    res.status(500).json({ message: "Server error while uploading document" });
  }
};

/**
 * Get all documents for a user
 */
export const getDocuments = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    if (!req.userId) {
      res.status(401).json({ message: "Not authenticated" });
      return;
    }

    const documents = await Document.find({
      userId: new mongoose.Types.ObjectId(req.userId),
    });

    res.status(200).json({
      success: true,
      documents: documents.map((doc) => ({
        id: doc._id,
        documentType: doc.documentType,
        ipfsHash: doc.ipfsHash,
        fileName: doc.fileName,
        isVerified: doc.isVerified,
        uploadedAt: doc.uploadedAt,
        verifiedAt: doc.verifiedAt,
      })),
    });
  } catch (error) {
    console.error("Error fetching documents:", error);
    res.status(500).json({ message: "Server error" });
  }
};

/**
 * Verify a document (admin only)
 */
export const verifyDocument = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const { documentId } = req.params;

    if (!req.userId) {
      res.status(401).json({ message: "Not authenticated" });
      return;
    }

    const document = await Document.findById(documentId);

    if (!document) {
      res.status(404).json({ message: "Document not found" });
      return;
    }

    // Update verification status
    document.isVerified = true;
    document.verifiedAt = new Date();
    document.verifiedBy = new mongoose.Types.ObjectId(req.userId); // Convert string to ObjectId

    await document.save();

    // Update verification status on blockchain
    // Ensure userId is a string for the blockchain service
    const txHash = await updateDocumentVerification(
      document.userId.toString(), // Convert ObjectId to string if needed
      document.ipfsHash,
      true
    );
    document.verificationTxHash = txHash;
    await document.save();

    res.status(200).json({
      success: true,
      message: "Document verified successfully",
      document: {
        id: document._id,
        documentType: document.documentType,
        ipfsHash: document.ipfsHash,
        isVerified: document.isVerified,
        verifiedAt: document.verifiedAt,
        verificationTxHash: document.verificationTxHash,
      },
    });
  } catch (error) {
    console.error("Error verifying document:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Function to update document verification status on blockchain
async function updateDocumentVerification(
  userId: string,
  ipfsHash: string,
  isVerified: boolean
): Promise<string> {
  // TODO: Implement blockchain interaction to update verification status
  // This is a placeholder that would be replaced with actual blockchain code
  return "0x" + Math.random().toString(16).substring(2, 34); // Fake transaction hash
}

/**
 * Parse a request with formidable
 */
function doSomethingWithNodeRequest(
  req: Request
): Promise<Record<string, unknown>> {
  return new Promise((resolve, reject) => {
    const form = formidable({ multiples: true });

    form.parse(req, (error: Error | null, fields: Fields, files: Files) => {
      if (error) {
        reject(error);
        return;
      }

      // Return both fields and files directly without type conversion
      resolve({
        ...fields,
        ...files,
      });
    });
  });
}
