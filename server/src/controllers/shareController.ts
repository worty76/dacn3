import { Request, Response } from "express";
import Document from "../models/document";
import User from "../models/user";
import VerificationShare from "../models/verificationShare";
import mongoose from "mongoose";
import { IUser } from "../models/user";
import crypto from "crypto"; // Use Node's built-in crypto instead of uuid

interface AuthenticatedRequest extends Request {
  userId?: string;
}

/**
 * Create a shareable verification link
 */
export const createShareableLink = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    if (!req.userId) {
      res.status(401).json({ success: false, message: "Not authenticated" });
      return;
    }

    const {
      documentIds,
      expiresInDays = 7,
      includeDetails = false,
      showDocuments = true,
    } = req.body;

    if (
      !documentIds ||
      !Array.isArray(documentIds) ||
      documentIds.length === 0
    ) {
      res
        .status(400)
        .json({ success: false, message: "No documents selected to share" });
      return;
    }

    // Verify all documents belong to user
    const documents = await Document.find({
      _id: { $in: documentIds },
      userId: req.userId,
    });

    if (documents.length !== documentIds.length) {
      res.status(400).json({
        success: false,
        message: "Some documents are invalid or don't belong to you",
      });
      return;
    }

    // Generate a random code for the verification link (using crypto instead of uuid)
    const code = crypto.randomBytes(6).toString("hex");

    // Calculate expiration date
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + parseInt(expiresInDays.toString()));

    // Create verification share entry
    const verificationShare = new VerificationShare({
      code,
      userId: req.userId,
      documentIds,
      expiresAt,
      includeDetails,
      showDocuments, // Add this field
    });

    await verificationShare.save();

    // Build URL (this would be your frontend URL in production)
    const verificationUrl = `http://localhost:3000/verify?code=${code}&expires=${expiresAt.getTime()}&details=${
      includeDetails ? "1" : "0"
    }`;

    res.status(200).json({
      success: true,
      verificationUrl,
      expiresAt,
      code,
    });
  } catch (error) {
    console.error("Error creating shareable link:", error);
    res.status(500).json({
      success: false,
      message: "Server error while creating shareable link",
    });
  }
};

/**
 * Get shared verification data
 */
export const getSharedVerification = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { code } = req.query;

    if (!code || typeof code !== "string") {
      res
        .status(400)
        .json({ success: false, message: "Invalid verification code" });
      return;
    }

    // Find the verification share by code
    const verificationShare = await VerificationShare.findOne({ code });

    if (!verificationShare) {
      res.status(404).json({
        success: false,
        message: "Verification link not found or has expired",
      });
      return;
    }

    // Check if expired
    if (new Date() > verificationShare.expiresAt) {
      res.status(400).json({
        success: false,
        message: "Verification link has expired",
      });
      return;
    }

    // Get user info
    const user = await User.findById(verificationShare.userId).select(
      "name email"
    );

    // Get documents with populated verifiedBy and adminSignatures
    const documents = await Document.find({
      _id: { $in: verificationShare.documentIds },
    })
      .populate<{ verifiedBy: IUser }>("verifiedBy", "name")
      .populate("adminSignatures.adminId", "name");

    // Transform documents for response with document preview URLs
    const documentData = await Promise.all(
      documents.map(async (doc) => {
        // Get user who submitted the document
        const submitter = await User.findById(doc.userId).select("name");

        // Create a proxy URL for document preview
        const previewUrl = verificationShare.showDocuments
          ? `http://localhost:8000/api/ipfs/content/${doc.ipfsHash}`
          : undefined;

        // Handle verification information based on verification type
        let verificationInfo = {};

        if (verificationShare.includeDetails && doc.isVerified) {
          if (doc.requiresMultiSig && doc.adminSignatures?.length > 0) {
            // Multi-signature verification - show all signing admins as an array of strings
            const signingAdmins = doc.adminSignatures.map(
              (sig: any) => sig.adminId?.name || "Admin"
            );
            //   doc.adminSignatures.length === index - 1? sig.adminId?.name + "," : sig.adminId?.name || "Admin"
            verificationInfo = {
              verificationType: "multi-signature",
              verifiedBy: signingAdmins, // Array of admin names (strings)
              verifiedByDetails: doc.adminSignatures.map((sig: any) => ({
                name: sig.adminId?.name || "Admin",
                signedAt: sig.signedAt,
              })), // Separate field for detailed info
              requiredSignatures: doc.requiredSignatures || 2,
              currentSignatures: doc.adminSignatures.length,
              isMultiSigComplete: doc.isMultiSigComplete || false,
            };
          } else {
            // Single admin verification - keep as array of strings for consistency
            const adminName = doc.verifiedBy
              ? typeof doc.verifiedBy === "object" && "name" in doc.verifiedBy
                ? doc.verifiedBy.name
                : "Admin"
              : "Admin";

            verificationInfo = {
              verificationType: "single-admin",
              verifiedBy: [adminName],
              verifiedByDetails: [
                {
                  name: adminName,
                  signedAt: doc.verifiedAt,
                },
              ],
            };
          }
        }

        return {
          id: doc._id,
          documentType: doc.documentType,
          fileName: doc.fileName,
          uploadedAt: doc.uploadedAt,
          isVerified: doc.isVerified,
          verifiedAt: doc.verifiedAt,
          submittedBy: submitter?.name || "Document Owner",
          ipfsHash: verificationShare.includeDetails ? doc.ipfsHash : undefined,
          previewUrl: previewUrl,
          requiresMultiSig: doc.requiresMultiSig || false,
          ...verificationInfo,
        };
      })
    );

    res.status(200).json({
      success: true,
      user: {
        name: user?.name || "User",
      },
      documents: documentData,
      expiresAt: verificationShare.expiresAt,
      includeDetails: verificationShare.includeDetails,
      showDocuments: verificationShare.showDocuments,
    });
  } catch (error) {
    console.error("Error in getSharedVerification:", error);
    res.status(500).json({
      success: false,
      message: "Server error while fetching verification",
    });
  }
};
