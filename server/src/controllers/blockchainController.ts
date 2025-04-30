import { Request, Response } from "express";
import { ethers } from "ethers";
import BlockchainIdentity from "../models/blockchain-identity";

interface AuthenticatedRequest extends Request {
  userId?: string; // Added by authenticate middleware
}

/**
 * Generate a DID and wallet address for the user
 */
export const createBlockchainIdentity = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    // Check if user already has blockchain identity
    const existingIdentity = await BlockchainIdentity.findOne({
      userId: req.userId,
    });

    if (existingIdentity) {
      res
        .status(400)
        .json({ message: "Blockchain identity already exists for this user" });
      return;
    }

    // Generate new wallet
    const wallet = ethers.Wallet.createRandom();

    // Create DID (did:ethr:address format)
    const did = `did:ethr:${wallet.address}`;

    // Create blockchain identity in database
    const blockchainIdentity = new BlockchainIdentity({
      userId: req.userId,
      identityHash: did, // Using identityHash from the model instead of didIdentifier
      blockchainAddress: wallet.address, // Using blockchainAddress from the model instead of walletAddress
      privateKey: wallet.privateKey, // NOTE: This might need to be added to the model
      verified: false,
    });

    await blockchainIdentity.save();

    // Return identity (without private key)
    res.status(201).json({
      success: true,
      message: "Blockchain identity created successfully",
      identity: {
        identityHash: did,
        blockchainAddress: wallet.address,
        verified: false,
      },
    });
  } catch (error) {
    console.error("Error creating blockchain identity:", error);
    res.status(500).json({ message: "Server error" });
  }
};

/**
 * Get user's blockchain identity
 */
export const getBlockchainIdentity = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const identity = await BlockchainIdentity.findOne({
      userId: req.userId,
    }).select("-privateKey");

    if (!identity) {
      res.status(404).json({ message: "Blockchain identity not found" });
      return;
    }

    res.status(200).json({
      success: true,
      identity,
    });
  } catch (error) {
    console.error("Error fetching blockchain identity:", error);
    res.status(500).json({ message: "Server error" });
  }
};

/**
 * Verify a user's blockchain identity (admin only)
 */
export const verifyBlockchainIdentity = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const { userId } = req.body;

    const identity = await BlockchainIdentity.findOne({ userId });

    if (!identity) {
      res.status(404).json({ message: "Blockchain identity not found" });
      return;
    }

    // Update verification status
    identity.verified = true;

    await identity.save();

    // TODO: Update verification status on blockchain

    res.status(200).json({
      success: true,
      message: "Blockchain identity verified successfully",
      identity: {
        identityHash: identity.identityHash,
        blockchainAddress: identity.blockchainAddress,
        verified: identity.verified,
      },
    });
  } catch (error) {
    console.error("Error verifying blockchain identity:", error);
    res.status(500).json({ message: "Server error" });
  }
};

/**
 * Update blockchain identity
 */
export const updateBlockchainIdentity = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const identity = await BlockchainIdentity.findOne({ userId: req.userId });

    if (!identity) {
      res.status(404).json({ message: "Blockchain identity not found" });
      return;
    }

    // For this example, we won't update any identity-specific fields
    // as the model doesn't have additionalData or metadata fields

    // We can update the verified status if needed
    const { verified } = req.body;
    if (verified !== undefined) {
      identity.verified = verified;
    }

    await identity.save();

    // TODO: Update identity information on blockchain

    res.status(200).json({
      success: true,
      message: "Blockchain identity updated successfully",
      identity: {
        identityHash: identity.identityHash,
        blockchainAddress: identity.blockchainAddress,
        verified: identity.verified,
        createdAt: identity.createdAt,
        updatedAt: identity.updatedAt,
      },
    });
  } catch (error) {
    console.error("Error updating blockchain identity:", error);
    res.status(500).json({ message: "Server error" });
  }
};

/**
 * Revoke blockchain identity
 */
export const revokeBlockchainIdentity = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const identity = await BlockchainIdentity.findOne({ userId: req.userId });

    if (!identity) {
      res.status(404).json({ message: "Blockchain identity not found" });
      return;
    }

    // Set verified to false to revoke the identity
    // since there's no explicit revoked field in the model
    identity.verified = false;

    await identity.save();

    // TODO: Update revocation status on blockchain

    res.status(200).json({
      success: true,
      message: "Blockchain identity revoked successfully",
    });
  } catch (error) {
    console.error("Error revoking blockchain identity:", error);
    res.status(500).json({ message: "Server error" });
  }
};
