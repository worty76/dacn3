import { Request, Response } from "express";
import mongoose from "mongoose";
import Document from "../models/document";
import formidable from "formidable"; // Changed import syntax
import * as fs from "fs";
import * as path from "path";

interface AuthenticatedRequest extends Request {
  userId?: string;
}

/**
 * Upload identity document to IPFS and store hash on blockchain
 */
export const uploadDocument = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    // Create the form parser with the correct formidable version syntax - fixed constructor call
    const form = formidable({
      multiples: true,
      keepExtensions: true,
    });

    // Parse the form
    const [fields, files] = await new Promise<[any, any]>((resolve, reject) => {
      form.parse(req, (err, fields, files) => {
        if (err) return reject(err);
        resolve([fields, files]);
      });
    });

    // Extract the document type from fields
    const documentType = fields.documentType
      ? Array.isArray(fields.documentType)
        ? fields.documentType[0]
        : fields.documentType
      : null;

    // Validate request
    if (!files.document || !documentType) {
      res.status(400).json({ message: "Document file and type are required" });
      return;
    }

    // Make sure userId exists
    if (!req.userId) {
      res.status(401).json({ message: "Not authenticated" });
      return;
    }

    // Get the file object
    const documentFile = Array.isArray(files.document)
      ? files.document[0]
      : files.document;

    // Generate mock IPFS hash instead of calling external service
    const mockIpfsHash =
      "Qm" +
      [...Array(44)]
        .map(() => Math.floor(Math.random() * 16).toString(16))
        .join("");

    // Get file metadata
    const fileName =
      documentFile.originalFilename || path.basename(documentFile.filepath);
    const fileSize = documentFile.size;
    const mimeType = documentFile.mimetype || "";

    // Store document metadata in database
    const documentData = {
      userId: new mongoose.Types.ObjectId(req.userId),
      documentType,
      ipfsHash: mockIpfsHash, // Use mock IPFS hash
      fileName,
      fileSize,
      mimeType,
      isVerified: false,
      uploadedAt: new Date(),
    };

    const document = await Document.create(documentData);
    const documentId = document._id.toString();

    // Generate mock blockchain transaction hash instead of calling external service
    const mockTxHash =
      "0x" +
      [...Array(64)]
        .map(() => Math.floor(Math.random() * 16).toString(16))
        .join("");
    document.blockchainTxHash = mockTxHash;
    await document.save();

    // Cleanup - delete the temp file
    try {
      fs.unlinkSync(documentFile.filepath);
    } catch (cleanupError) {
      console.error("Error cleaning up temp file:", cleanupError);
    }

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
    document.verifiedBy = new mongoose.Types.ObjectId(req.userId);

    await document.save();

    // Generate mock verification transaction hash instead of calling external service
    const mockVerificationTxHash =
      "0x" +
      [...Array(64)]
        .map(() => Math.floor(Math.random() * 16).toString(16))
        .join("");
    document.verificationTxHash = mockVerificationTxHash;
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

/**
 * Submit documents for verification
 */
export const submitForVerification = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    if (!req.userId) {
      res.status(401).json({ message: "Not authenticated" });
      return;
    }

    const { documentIds } = req.body;

    if (
      !documentIds ||
      !Array.isArray(documentIds) ||
      documentIds.length === 0
    ) {
      res.status(400).json({ message: "Document IDs are required" });
      return;
    }

    // Update all documents to mark them as submitted for verification
    const updateResult = await Document.updateMany(
      {
        _id: { $in: documentIds },
        userId: new mongoose.Types.ObjectId(req.userId),
      },
      {
        $set: {
          submittedForVerification: true,
          submissionDate: new Date(),
        },
      }
    );

    if (updateResult.matchedCount === 0) {
      res.status(404).json({ message: "No matching documents found" });
      return;
    }

    // Create a verification request entry (if you have a separate collection for this)
    // This part is optional but recommended for tracking verification requests
    // const verificationRequest = new VerificationRequest({
    //   userId: req.userId,
    //   documentIds,
    //   status: "pending",
    //   submittedAt: new Date()
    // });
    // await verificationRequest.save();

    res.status(200).json({
      success: true,
      message: "Documents submitted for verification successfully",
      updatedCount: updateResult.modifiedCount,
    });
  } catch (error) {
    console.error("Error submitting documents for verification:", error);
    res.status(500).json({
      message: "Server error while submitting documents for verification",
    });
  }
};

/**
 * Download a document file
 */
export const downloadDocument = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const { documentId } = req.params;

    if (!req.userId) {
      res.status(401).json({ message: "Not authenticated" });
      return;
    }

    // Find the document in the database
    const document = await Document.findOne({
      _id: documentId,
      userId: new mongoose.Types.ObjectId(req.userId),
    });

    if (!document) {
      res.status(404).json({ message: "Document not found" });
      return;
    }

    // Log this access
    // You could use your logAccess function here if needed

    // Since we're mocking IPFS, we'll generate a sample file
    // In a real implementation, you would fetch the file from IPFS using the ipfsHash
    const mockFileContent = `This is a mock file for ${document.documentType}\nIPFS Hash: ${document.ipfsHash}\nFile Name: ${document.fileName}`;
    const fileBuffer = Buffer.from(mockFileContent);

    // Set response headers
    res.setHeader(
      "Content-Type",
      document.mimeType || "application/octet-stream"
    );
    res.setHeader(
      "Content-Disposition",
      `attachment; filename=${document.fileName}`
    );

    // Send the file
    res.send(fileBuffer);
  } catch (error) {
    console.error("Error downloading document:", error);
    res
      .status(500)
      .json({ message: "Server error while downloading document" });
  }
};
