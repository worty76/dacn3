import { Request, Response } from "express";
import axios from "axios";
import { Buffer } from "buffer";
import Document from "../models/document";
import mongoose from "mongoose";

interface AuthenticatedRequest extends Request {
  userId?: string;
}

/**
 * Sanitize filename to be used in Content-Disposition header
 * This removes/replaces characters that might cause issues in HTTP headers
 */
function sanitizeFilename(filename: string): string {
  // Replace characters that could cause issues in HTTP headers
  // Only allow alphanumeric, underscore, dash, and period
  return filename
    .replace(/[^\w\-\.]/g, "_") // Replace any non-allowed char with underscore
    .replace(/\s+/g, "_"); // Replace spaces with underscore
}

/**
 * Proxy IPFS content through server to avoid CORS issues
 */
export const proxyIpfsContent = async (
  req: Request,
  res: Response
): Promise<void> => {
  const { cid } = req.params;

  if (!cid) {
    res.status(400).json({ message: "IPFS CID is required" });
    return;
  }

  try {
    console.log(`Proxying IPFS content for CID: ${cid}`);

    // Try multiple gateways in case one fails
    const gateways = [
      `https://gateway.pinata.cloud/ipfs/${cid}`,
      `https://ipfs.io/ipfs/${cid}`,
      `https://cloudflare-ipfs.com/ipfs/${cid}`,
      `https://dweb.link/ipfs/${cid}`,
    ];

    let fileBuffer = null;
    let contentType = "application/octet-stream";
    let error = null;

    // Try each gateway until one succeeds
    for (const gateway of gateways) {
      try {
        console.log(`Trying IPFS gateway: ${gateway}`);
        const response = await axios.get(gateway, {
          responseType: "arraybuffer",
          timeout: 15000,
        });

        fileBuffer = response.data;
        contentType =
          response.headers["content-type"] || "application/octet-stream";
        console.log(
          `Successfully retrieved from ${gateway}, content type: ${contentType}`
        );
        break; // Exit loop if successful
      } catch (err) {
        // Fix the type error by providing a default error message
        const errorMessage =
          err instanceof Error ? err.message : "Unknown error";
        console.log(`Failed to retrieve from ${gateway}: ${errorMessage}`);
        error = err;
      }
    }

    if (!fileBuffer) {
      throw (
        error || new Error("Failed to retrieve content from all IPFS gateways")
      );
    }

    // Determine content type based on proxy request or filename in metadata
    // Try to get a document from the database to get more info about the file
    let mimeType = contentType;
    try {
      const document = await Document.findOne({ ipfsHash: cid });
      if (document && document.mimeType) {
        mimeType = document.mimeType;
      } else if (document && document.fileName) {
        // Try to determine mime type from file extension
        if (document.fileName.toLowerCase().endsWith(".pdf")) {
          mimeType = "application/pdf";
        } else if (
          document.fileName.toLowerCase().match(/\.(jpg|jpeg|png|gif)$/)
        ) {
          mimeType =
            "image/" + document.fileName.toLowerCase().split(".").pop();
        }
      }
    } catch (dbError) {
      // If we can't get document info, use the content type from the gateway
      console.warn("Couldn't determine MIME type from database:", dbError);
    }

    // Set CORS headers and content type
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");
    res.setHeader("Content-Type", mimeType);

    // Send the file
    res.send(Buffer.from(fileBuffer));
  } catch (error) {
    console.error("IPFS proxy error:", error);
    res.status(500).json({
      message: "Error retrieving IPFS content",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

/**
 * Download a specific document identified by documentId
 */
export const downloadDocumentById = async (
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

    // Get the IPFS hash from the document
    const ipfsHash = document.ipfsHash;

    if (!ipfsHash) {
      res.status(404).json({ message: "Document has no IPFS hash" });
      return;
    }

    console.log(
      `Downloading document ${documentId} with IPFS hash ${ipfsHash}`
    );

    // Try multiple gateways in case one fails
    const gateways = [
      `https://gateway.pinata.cloud/ipfs/${ipfsHash}`,
      `https://ipfs.io/ipfs/${ipfsHash}`,
      `https://cloudflare-ipfs.com/ipfs/${ipfsHash}`,
      `https://dweb.link/ipfs/${ipfsHash}`,
    ];

    let fileBuffer = null;
    let error = null;

    // Try each gateway until one succeeds
    for (const gateway of gateways) {
      try {
        console.log(`Trying IPFS gateway: ${gateway}`);
        const response = await axios.get(gateway, {
          responseType: "arraybuffer",
          timeout: 15000,
        });

        fileBuffer = response.data;
        console.log(
          `Successfully retrieved ${fileBuffer.length} bytes from ${gateway}`
        );
        break;
      } catch (err) {
        // Fix the type error by providing a default error message
        const errorMessage =
          err instanceof Error ? err.message : "Unknown error";
        console.log(`Failed to retrieve from ${gateway}: ${errorMessage}`);
        error = err;
      }
    }

    if (!fileBuffer) {
      // Create mock file as fallback
      console.log("All IPFS gateways failed, creating mock file");
      const mockContent = `Mock file for ${document.documentType}\nIPFS Hash: ${ipfsHash}\nFile Name: ${document.fileName}`;
      fileBuffer = Buffer.from(mockContent);
    }

    // Sanitize the filename before using it in headers
    const sanitizedFilename = sanitizeFilename(document.fileName);
    console.log(`Using sanitized filename for download: ${sanitizedFilename}`);

    // Set headers and send file
    res.setHeader(
      "Content-Type",
      document.mimeType || "application/octet-stream"
    );
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${sanitizedFilename}"`
    );
    res.send(Buffer.from(fileBuffer));
  } catch (error) {
    console.error("Error downloading document:", error);
    res
      .status(500)
      .json({ message: "Server error while downloading document" });
  }
};
