import { Request, Response } from "express";
import mongoose from "mongoose";
import Document from "../models/document";
import { IUser } from "../models/user"; // Add this import
import formidable from "formidable"; // Changed import syntax
import * as fs from "fs";
import * as path from "path";
import { uploadToIPFS, getFromIPFS } from "../utils/ipfsService"; // Import IPFS service

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

    // Get file metadata
    const fileName =
      documentFile.originalFilename || path.basename(documentFile.filepath);
    const fileSize = documentFile.size;
    const mimeType = documentFile.mimetype || "";

    // Read file content as buffer
    const fileBuffer = fs.readFileSync(documentFile.filepath);

    let ipfsHash;

    try {
      // Try to upload to Pinata IPFS
      if (process.env.Pinata_API_KEY || process.env.Pinata_JWT) {
        console.log("Using Pinata for IPFS storage");
        const ipfsResult = await uploadToIPFS(fileBuffer);
        ipfsHash = ipfsResult.path;
        const ipfsUrl =
          ipfsResult.url || `https://gateway.pinata.cloud/ipfs/${ipfsHash}`;

        // Store document metadata in database with Pinata URL
        const documentData = {
          userId: new mongoose.Types.ObjectId(req.userId),
          documentType,
          ipfsHash,
          ipfsUrl, // Store the Pinata gateway URL
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
            ipfsUrl:
              document.ipfsUrl ||
              `https://gateway.pinata.cloud/ipfs/${document.ipfsHash}`,
          },
        });
      } else {
        // Fall back to mock hash if no Pinata credentials
        ipfsHash =
          "Qm" +
          [...Array(44)]
            .map(() => Math.floor(Math.random() * 16).toString(16))
            .join("");
      }
    } catch (ipfsError) {
      console.error("IPFS upload failed, using mock hash:", ipfsError);
      // Generate mock hash instead
      ipfsHash =
        "Qm" +
        [...Array(44)]
          .map(() => Math.floor(Math.random() * 16).toString(16))
          .join("");
    }
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
    }).populate<{ verifiedBy?: IUser }>("verifiedBy", "name"); // Populate verifiedBy with user's name

    res.status(200).json({
      success: true,
      documents: documents.map((doc) => ({
        id: doc._id,
        documentType: doc.documentType,
        ipfsHash: doc.ipfsHash,
        ipfsUrl:
          doc.ipfsUrl || `https://gateway.pinata.cloud/ipfs/${doc.ipfsHash}`,
        fileName: doc.fileName,
        isVerified: doc.isVerified,
        uploadedAt: doc.uploadedAt,
        verifiedAt: doc.verifiedAt,
        verifiedBy: doc.verifiedBy ? doc.verifiedBy.name : null, // Add verifier's name
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
    const token =
      req.headers.authorization?.split(" ")[1] || (req.query.token as string);

    // Ensure user is authenticated
    if (!req.userId) {
      res.status(401).json({ message: "Not authenticated" });
      return;
    }

    console.log(
      `Downloading document ID: ${documentId} for user: ${req.userId}`
    );

    // Find the document in the database
    const document = await Document.findOne({
      _id: documentId,
      userId: new mongoose.Types.ObjectId(req.userId),
    });

    if (!document) {
      console.error(`Document not found: ${documentId}`);
      res.status(404).json({ message: "Document not found" });
      return;
    }

    console.log(
      `Found document: ${document.fileName} with IPFS hash: ${document.ipfsHash}`
    );
    console.log(`IPFS URL: ${document.ipfsUrl || "Not available"}`);

    // Ensure there's always an IPFS URL
    const ipfsUrl =
      document.ipfsUrl ||
      `https://gateway.pinata.cloud/ipfs/${document.ipfsHash}`;
    console.log(`Using IPFS URL: ${ipfsUrl}`);

    try {
      // Try to get from IPFS using Pinata gateway
      if (process.env.Pinata_API_KEY || process.env.Pinata_JWT) {
        console.log("Downloading from Pinata IPFS:", document.ipfsHash);

        try {
          // First try: direct fetch from IPFS
          const fileBuffer = await getFromIPFS(document.ipfsHash);
          console.log(
            `Successfully retrieved ${fileBuffer.length} bytes from IPFS`
          );

          // Set response headers and send file
          res.setHeader(
            "Content-Type",
            document.mimeType || "application/octet-stream"
          );
          res.setHeader(
            "Content-Disposition",
            `attachment; filename=${document.fileName}`
          );
          res.send(fileBuffer);
          return;
        } catch (directError) {
          console.error(
            "Direct IPFS retrieval failed, trying gateway URL:",
            directError
          );

          // Second try: fetch from gateway URL if it exists
          if (document.ipfsUrl) {
            try {
              // Use axios to fetch from gateway URL
              const axios = require("axios");
              const response = await axios.get(document.ipfsUrl, {
                responseType: "arraybuffer",
              });

              console.log(
                `Successfully retrieved ${response.data.length} bytes from gateway URL`
              );

              // Set response headers and send file
              res.setHeader(
                "Content-Type",
                document.mimeType || "application/octet-stream"
              );
              res.setHeader(
                "Content-Disposition",
                `attachment; filename=${document.fileName}`
              );
              res.send(Buffer.from(response.data));
              return;
            } catch (gatewayError) {
              console.error("Gateway URL retrieval failed:", gatewayError);
              throw gatewayError; // Re-throw to fall back to mock file
            }
          } else {
            throw directError; // Re-throw to fall back to mock file
          }
        }
      } else {
        throw new Error("Pinata credentials not configured");
      }
    } catch (ipfsError) {
      console.error(
        "All IPFS retrieval methods failed, using mock file:",
        ipfsError
      );

      // Create mock file
      const mockFileContent = `Mock file for ${document.documentType}\nIPFS Hash: ${document.ipfsHash}\nFile Name: ${document.fileName}`;
      const fileBuffer = Buffer.from(mockFileContent);

      // Set response headers
      res.setHeader("Content-Type", "text/plain");
      res.setHeader(
        "Content-Disposition",
        `attachment; filename=${document.fileName}`
      );

      // Send the file
      res.send(fileBuffer);
    }
  } catch (error) {
    console.error("Error downloading document:", error);
    res
      .status(500)
      .json({ message: "Server error while downloading document" });
  }
};

/**
 * Get pending verification documents (admin only)
 */
export const getPendingDocuments = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    // Find documents that are submitted for verification but not yet verified
    const pendingDocuments = await Document.find({
      submittedForVerification: true,
      isVerified: false,
    }).populate<{ userId: IUser }>("userId", "name email"); // Use type assertion for populated field

    res.status(200).json({
      success: true,
      count: pendingDocuments.length,
      documents: pendingDocuments.map((doc) => ({
        id: doc._id,
        documentType: doc.documentType,
        fileName: doc.fileName,
        submittedBy:
          typeof doc.userId !== "string" && "name" in doc.userId
            ? {
                id: doc.userId._id,
                name: doc.userId.name,
                email: doc.userId.email,
              }
            : "Unknown User",
        uploadedAt: doc.uploadedAt,
        submissionDate: doc.submissionDate,
        ipfsUrl:
          doc.ipfsUrl || `https://gateway.pinata.cloud/ipfs/${doc.ipfsHash}`,
        ipfsHash: doc.ipfsHash,
        fileSize: doc.fileSize,
        mimeType: doc.mimeType,
      })),
    });
  } catch (error) {
    console.error("Error fetching pending documents:", error);
    res.status(500).json({
      success: false,
      message: "Server error while fetching pending documents",
    });
  }
};

/**
 * Admin verify/reject document
 */
export const adminVerifyDocument = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const { documentId } = req.params;
    const { action, feedback } = req.body;

    if (!["verify", "reject"].includes(action)) {
      res.status(400).json({
        success: false,
        message: 'Invalid action. Must be "verify" or "reject".',
      });
      return;
    }

    // Find the document
    const document = await Document.findById(documentId);

    if (!document) {
      res.status(404).json({
        success: false,
        message: "Document not found",
      });
      return;
    }

    // Update document based on action
    if (action === "verify") {
      document.isVerified = true;
      document.verifiedAt = new Date();
      document.verifiedBy = new mongoose.Types.ObjectId(req.userId);
      // Use optional chaining to safely access/update the feedback field
      if ("feedback" in document) {
        document.feedback = feedback || "Document verified by admin.";
      } else {
        // If the field doesn't exist in the document, add it using MongoDB syntax
        (document as any).feedback = feedback || "Document verified by admin.";
      }

      // Generate mock verification transaction hash
      const mockVerificationTxHash =
        "0x" +
        [...Array(64)]
          .map(() => Math.floor(Math.random() * 16).toString(16))
          .join("");
      document.verificationTxHash = mockVerificationTxHash;
    } else {
      document.submittedForVerification = false; // Reset submission status
      // Use optional chaining to safely access/update the feedback field
      if ("feedback" in document) {
        document.feedback = feedback || "Document rejected by admin.";
      } else {
        // If the field doesn't exist in the document, add it using MongoDB syntax
        (document as any).feedback = feedback || "Document rejected by admin.";
      }
    }

    await document.save();

    res.status(200).json({
      success: true,
      message:
        action === "verify"
          ? "Document verified successfully"
          : "Document rejected successfully",
      document: {
        id: document._id,
        status: action === "verify" ? "verified" : "rejected",
        feedback: "feedback" in document ? document.feedback : "",
        verifiedAt: document.verifiedAt,
      },
    });
  } catch (error) {
    console.error("Error processing document verification:", error);
    res.status(500).json({
      success: false,
      message: "Server error while processing document verification",
    });
  }
};
