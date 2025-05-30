import { ethers } from "ethers";
import BlockchainIdentity from "../models/blockchain-identity";
import dotenv from "dotenv";
import mongoose from "mongoose";

dotenv.config();

// Define interface for BlockchainIdentity model - Updated to match MongoDB document
interface IBlockchainIdentity {
  userId: mongoose.Types.ObjectId | string;
  identityHash: string;
  blockchainAddress: string;
  privateKey: string;
  verified: boolean;
  _id?: mongoose.Types.ObjectId;
  createdAt?: Date;
  updatedAt?: Date;
}

// ABI for DocumentVerification contract
const DOCUMENT_VERIFICATION_ABI = [
  "function addDocument(string documentId, string ipfsHash) returns (bool)",
  "function verifyDocument(string documentId) returns (bool)",
  "function isDocumentVerified(string documentId) view returns (bool)",
  "function getDocument(string documentId) view returns (string, string, address, bool, uint256, uint256, address)",
  "function addAdminSignature(string documentId, string signature) returns (bool)",
  "function getAdminSignatures(string documentId) view returns (address[], string[], uint256[])",
  "function isMultiSigComplete(string documentId, uint256 requiredSigs) view returns (bool)",
];

// ABI for IdentityRegistry contract
const IDENTITY_REGISTRY_ABI = [
  "function registerIdentity(string did) returns (bool)",
  "function verifyIdentity(string did) returns (bool)",
  "function isIdentityVerified(string did) view returns (bool)",
  "function getIdentity(string did) view returns (string, address, bool, uint256, uint256, address, bool)",
];

// Connect to Ethereum provider using your RPC URL
const provider = new ethers.JsonRpcProvider(
  process.env.BLOCKCHAIN_RPC_URL ||
    "https://sepolia.infura.io/v3/b2c29ad1b3ee4fa9a6fa18171127e201"
);

// Create wallet instance using your private key
const wallet = new ethers.Wallet(
  process.env.BLOCKCHAIN_PRIVATE_KEY || "",
  provider
);

// Contract instances
const documentVerificationContract = new ethers.Contract(
  process.env.DOCUMENT_VERIFICATION_ADDRESS || "",
  DOCUMENT_VERIFICATION_ABI,
  wallet
);

const identityRegistryContract = new ethers.Contract(
  process.env.IDENTITY_REGISTRY_ADDRESS || "",
  IDENTITY_REGISTRY_ABI,
  wallet
);

/**
 * Store document hash on blockchain using DocumentVerification contract
 */
export const storeDocumentHash = async (
  userId: string,
  ipfsHash: string,
  documentId: string
): Promise<string> => {
  try {
    console.log(
      `Storing document on blockchain: ${documentId}, IPFS: ${ipfsHash}`
    );

    // Check if user has blockchain identity, if not create one
    let identity = await BlockchainIdentity.findOne({
      userId: new mongoose.Types.ObjectId(userId),
    });

    if (!identity) {
      console.log("Creating new blockchain identity for user");
      // Generate new wallet for user
      const userWallet = ethers.Wallet.createRandom();
      const did = `did:ethr:${userWallet.address}`;

      // Create blockchain identity in database - Remove type assertion
      identity = await BlockchainIdentity.create({
        userId: new mongoose.Types.ObjectId(userId),
        identityHash: did,
        blockchainAddress: userWallet.address,
        privateKey: userWallet.privateKey,
        verified: false,
      });
    }

    // Store document hash on blockchain using the admin wallet (since users might not have gas)
    const tx = await documentVerificationContract.addDocument(
      documentId,
      ipfsHash
    );

    console.log("Transaction sent:", tx.hash);

    // Wait for transaction to be mined
    const receipt = await tx.wait();

    if (!receipt) {
      throw new Error("Transaction receipt is null");
    }

    console.log("Document stored on blockchain successfully:", receipt.hash);
    return receipt.hash;
  } catch (error) {
    console.error("Blockchain storage error:", error);
    throw new Error(
      `Failed to store document hash on blockchain: ${
        error instanceof Error ? error.message : "Unknown error"
      }`
    );
  }
};

/**
 * Verify document on blockchain
 */
export const verifyDocumentOnBlockchain = async (
  documentId: string
): Promise<string> => {
  try {
    console.log(`Verifying document on blockchain: ${documentId}`);

    // Check if contract is properly initialized
    if (!process.env.DOCUMENT_VERIFICATION_ADDRESS) {
      throw new Error("Document verification contract address not configured");
    }

    if (!process.env.BLOCKCHAIN_PRIVATE_KEY) {
      throw new Error("Blockchain private key not configured");
    }

    // Call verifyDocument function on the contract
    const tx = await documentVerificationContract.verifyDocument(documentId);

    console.log("Verification transaction sent:", tx.hash);

    // Wait for transaction to be mined
    const receipt = await tx.wait();

    if (!receipt) {
      throw new Error("Transaction receipt is null");
    }

    console.log("Document verified on blockchain successfully:", receipt.hash);
    return receipt.hash;
  } catch (error) {
    console.error("Blockchain verification error:", error);

    // Log more details about the error
    if (error instanceof Error) {
      console.error("Error message:", error.message);
      console.error("Error stack:", error.stack);
    }

    throw new Error(
      `Failed to verify document on blockchain: ${
        error instanceof Error ? error.message : "Unknown error"
      }`
    );
  }
};

/**
 * Check if document is verified on blockchain
 */
export const isDocumentVerifiedOnBlockchain = async (
  documentId: string
): Promise<boolean> => {
  try {
    console.log(`Checking document verification status: ${documentId}`);

    const isVerified = await documentVerificationContract.isDocumentVerified(
      documentId
    );
    return isVerified;
  } catch (error) {
    console.error("Blockchain query error:", error);
    throw new Error(
      `Failed to check document verification on blockchain: ${
        error instanceof Error ? error.message : "Unknown error"
      }`
    );
  }
};

/**
 * Register user identity on blockchain
 */
export const registerIdentityOnBlockchain = async (
  userId: string
): Promise<string> => {
  try {
    let identity = await BlockchainIdentity.findOne({
      userId: new mongoose.Types.ObjectId(userId),
    });

    if (!identity) {
      throw new Error("Blockchain identity not found");
    }

    // Register identity on blockchain
    const tx = await identityRegistryContract.registerIdentity(
      identity.identityHash
    );

    console.log("Identity registration transaction sent:", tx.hash);

    const receipt = await tx.wait();

    if (!receipt) {
      throw new Error("Transaction receipt is null");
    }

    console.log(
      "Identity registered on blockchain successfully:",
      receipt.hash
    );
    return receipt.hash;
  } catch (error) {
    console.error("Blockchain identity registration error:", error);
    throw new Error(
      `Failed to register identity on blockchain: ${
        error instanceof Error ? error.message : "Unknown error"
      }`
    );
  }
};

/**
 * Verify user's identity on blockchain (admin function)
 */
export const verifyIdentityOnBlockchain = async (
  userId: string
): Promise<string> => {
  try {
    const identity = await BlockchainIdentity.findOne({
      userId: new mongoose.Types.ObjectId(userId),
    });

    if (!identity) {
      throw new Error("Blockchain identity not found");
    }

    // Verify identity on blockchain using admin wallet
    const tx = await identityRegistryContract.verifyIdentity(
      identity.identityHash
    );

    console.log("Identity verification transaction sent:", tx.hash);

    const receipt = await tx.wait();

    if (!receipt) {
      throw new Error("Transaction receipt is null");
    }

    console.log("Identity verified on blockchain successfully:", receipt.hash);
    return receipt.hash;
  } catch (error) {
    console.error("Blockchain identity verification error:", error);
    throw new Error(
      `Failed to verify identity on blockchain: ${
        error instanceof Error ? error.message : "Unknown error"
      }`
    );
  }
};

/**
 * Get document details from blockchain
 */
export const getDocumentFromBlockchain = async (
  documentId: string
): Promise<any> => {
  try {
    const documentData = await documentVerificationContract.getDocument(
      documentId
    );

    return {
      documentId: documentData[0],
      ipfsHash: documentData[1],
      owner: documentData[2],
      isVerified: documentData[3],
      timestamp: documentData[4],
      verifiedAt: documentData[5],
      verifiedBy: documentData[6],
    };
  } catch (error) {
    console.error("Error getting document from blockchain:", error);
    throw new Error(
      `Failed to get document from blockchain: ${
        error instanceof Error ? error.message : "Unknown error"
      }`
    );
  }
};

/**
 * Add admin signature to blockchain for multi-sig verification
 */
export const addAdminSignatureOnBlockchain = async (
  documentId: string,
  adminAddress: string,
  signature: string
): Promise<string> => {
  try {
    console.log(`Adding admin signature for document: ${documentId}`);

    const tx = await documentVerificationContract.addAdminSignature(
      documentId,
      signature
    );

    console.log("Admin signature transaction sent:", tx.hash);

    const receipt = await tx.wait();

    if (!receipt) {
      throw new Error("Transaction receipt is null");
    }

    console.log("Admin signature added successfully:", receipt.hash);
    return receipt.hash;
  } catch (error) {
    console.error("Blockchain admin signature error:", error);
    throw new Error(
      `Failed to add admin signature on blockchain: ${
        error instanceof Error ? error.message : "Unknown error"
      }`
    );
  }
};

/**
 * Check if multi-signature verification is complete on blockchain
 */
export const isMultiSigCompleteOnBlockchain = async (
  documentId: string,
  requiredSignatures: number
): Promise<boolean> => {
  try {
    const isComplete = await documentVerificationContract.isMultiSigComplete(
      documentId,
      requiredSignatures
    );
    return isComplete;
  } catch (error) {
    console.error("Blockchain multi-sig check error:", error);
    throw new Error(
      `Failed to check multi-sig completion on blockchain: ${
        error instanceof Error ? error.message : "Unknown error"
      }`
    );
  }
};

/**
 * Get admin signatures from blockchain
 */
export const getAdminSignaturesFromBlockchain = async (
  documentId: string
): Promise<{
  addresses: string[];
  signatures: string[];
  timestamps: number[];
}> => {
  try {
    const [addresses, signatures, timestamps] =
      await documentVerificationContract.getAdminSignatures(documentId);

    return {
      addresses,
      signatures,
      timestamps: timestamps.map((t: any) => Number(t)),
    };
  } catch (error) {
    console.error("Error getting admin signatures from blockchain:", error);
    throw new Error(
      `Failed to get admin signatures from blockchain: ${
        error instanceof Error ? error.message : "Unknown error"
      }`
    );
  }
};
