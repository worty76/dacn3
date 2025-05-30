import { ethers } from "ethers";
import dotenv from "dotenv";

dotenv.config();

const provider = new ethers.JsonRpcProvider(
  process.env.BLOCKCHAIN_RPC_URL ||
    "https://sepolia.infura.io/v3/b2c29ad1b3ee4fa9a6fa18171127e201"
);

export interface PaymentResult {
  hash: string;
  amount: string;
  from: string;
  to: string;
  success: boolean;
}

/**
 * Verify a payment transaction on blockchain
 */
export const verifyPaymentTransaction = async (
  txHash: string,
  expectedAmount: string,
  expectedFrom?: string
): Promise<{
  verified: boolean;
  actualAmount: string;
  from: string;
  to: string;
}> => {
  try {
    const txReceipt = await provider.getTransactionReceipt(txHash);
    const tx = await provider.getTransaction(txHash);

    if (!txReceipt || !tx) {
      throw new Error("Transaction not found or not confirmed");
    }

    const actualAmount = ethers.formatEther(tx.value);
    const expectedAmountNum = parseFloat(expectedAmount);
    const actualAmountNum = parseFloat(actualAmount);

    // Verify amount (allow 1% tolerance)
    const amountMatches = actualAmountNum >= expectedAmountNum * 0.99;

    // Verify sender if provided
    const senderMatches =
      !expectedFrom || tx.from.toLowerCase() === expectedFrom.toLowerCase();

    return {
      verified: amountMatches && senderMatches && txReceipt.status === 1,
      actualAmount,
      from: tx.from,
      to: tx.to || "",
    };
  } catch (error) {
    console.error("Error verifying payment transaction:", error);
    throw new Error(
      `Failed to verify payment: ${
        error instanceof Error ? error.message : "Unknown error"
      }`
    );
  }
};

/**
 * Get user wallet from blockchain identity
 */
export const getUserWallet = async (userId: string): Promise<string> => {
  const BlockchainIdentity = require("../models/blockchain-identity").default;

  const identity = await BlockchainIdentity.findOne({
    userId: new (require("mongoose").Types.ObjectId)(userId),
  });

  if (!identity) {
    throw new Error(
      "User blockchain identity not found. Please complete identity setup first."
    );
  }

  if (!identity.privateKey) {
    throw new Error(
      "User wallet private key not found in blockchain identity."
    );
  }

  return identity.privateKey;
};

/**
 * Get user wallet balance
 */
export const getUserWalletBalance = async (userId: string): Promise<string> => {
  try {
    const userPrivateKey = await getUserWallet(userId);
    const userWallet = new ethers.Wallet(userPrivateKey, provider);
    const balance = await provider.getBalance(userWallet.address);
    return ethers.formatEther(balance);
  } catch (error) {
    console.error("Error getting user wallet balance:", error);
    throw new Error(
      `Failed to get wallet balance: ${
        error instanceof Error ? error.message : "Unknown error"
      }`
    );
  }
};

/**
 * Get user wallet address
 */
export const getUserWalletAddress = async (userId: string): Promise<string> => {
  try {
    const userPrivateKey = await getUserWallet(userId);
    const userWallet = new ethers.Wallet(userPrivateKey, provider);
    return userWallet.address;
  } catch (error) {
    console.error("Error getting user wallet address:", error);
    throw new Error(
      `Failed to get wallet address: ${
        error instanceof Error ? error.message : "Unknown error"
      }`
    );
  }
};
