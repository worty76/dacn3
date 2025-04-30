import { ethers } from "ethers";
import BlockchainIdentity from "../models/blockchain-identity";

// Define interface for BlockchainIdentity model
interface IBlockchainIdentity {
  userId: string;
  did: string;
  privateKey: string;
  publicKey: string;
  // Add any other properties your model has
}

interface IdentityContract extends ethers.BaseContract {
  addDocument(
    did: string,
    ipfsHash: string,
    documentId: string | Uint8Array
  ): Promise<ethers.TransactionResponse>;
  verifyIdentity(did: string): Promise<ethers.TransactionResponse>;
  isIdentityVerified(did: string): Promise<boolean>;
}
// ABI of your smart contract
const CONTRACT_ABI = [
  // Identity management functions
  "function addDocument(string did, string ipfsHash, bytes32 documentId) returns (bool)",
  "function verifyIdentity(string did) returns (bool)",
  "function isIdentityVerified(string did) view returns (bool)",
  // Add other functions your contract has
];

// Connect to Ethereum provider
const provider = new ethers.JsonRpcProvider(
  process.env.ETHEREUM_RPC_URL || "http://localhost:8545"
);

// Contract address
const CONTRACT_ADDRESS =
  process.env.IDENTITY_CONTRACT_ADDRESS ||
  "0x0000000000000000000000000000000000000000";

// Get contract instance
const contract = new ethers.Contract(
  CONTRACT_ADDRESS,
  CONTRACT_ABI,
  provider
) as unknown as IdentityContract;

/**
 * Store document hash on blockchain
 */
export const storeDocumentHash = async (
  userId: string,
  ipfsHash: string,
  documentId: string
): Promise<string> => {
  try {
    // Get user's blockchain identity to use their wallet
    const identity = (await BlockchainIdentity.findOne({
      userId,
    })) as unknown as IBlockchainIdentity;

    if (!identity) {
      throw new Error("Blockchain identity not found");
    }

    // Create wallet instance with user's private key
    const wallet = new ethers.Wallet(identity.privateKey, provider);

    // Create contract instance connected to user's wallet
    const connectedContract = contract.connect(wallet) as IdentityContract;

    // Store document hash on blockchain
    const tx = await connectedContract.addDocument(
      identity.did,
      ipfsHash,
      ethers.encodeBytes32String(documentId) // Updated from ethers.utils.formatBytes32String
    );

    // Wait for transaction to be mined
    const receipt = await tx.wait();

    if (!receipt) {
      throw new Error("Transaction receipt is null");
    }

    // In ethers v6, use the hash property instead of transactionHash
    return receipt.hash;
  } catch (error) {
    console.error("Blockchain storage error:", error);
    throw new Error("Failed to store document hash on blockchain");
  }
};

/**
 * Verify user's identity on blockchain
 */
export const verifyIdentityOnBlockchain = async (
  did: string,
  adminUserId: string
): Promise<string> => {
  try {
    // Get admin blockchain identity
    const adminIdentity = (await BlockchainIdentity.findOne({
      userId: adminUserId,
    })) as unknown as IBlockchainIdentity;

    if (!adminIdentity) {
      throw new Error("Admin blockchain identity not found");
    }

    // Create wallet instance with admin's private key
    const wallet = new ethers.Wallet(adminIdentity.privateKey, provider);

    // Create contract instance connected to admin's wallet
    const connectedContract = contract.connect(wallet) as IdentityContract;

    // Verify identity on blockchain
    const tx = await connectedContract.verifyIdentity(did);

    // Wait for transaction to be mined
    const receipt = await tx.wait();

    if (!receipt) {
      throw new Error("Transaction receipt is null");
    }

    // In ethers v6, use the hash property instead of transactionHash
    return receipt.hash;
  } catch (error) {
    console.error("Blockchain verification error:", error);
    throw new Error("Failed to verify identity on blockchain");
  }
};

/**
 * Check if identity is verified on blockchain
 */
export const isIdentityVerified = async (did: string): Promise<boolean> => {
  try {
    // Call view function on contract
    const isVerified = await contract.isIdentityVerified(did);
    return isVerified;
  } catch (error) {
    console.error("Blockchain query error:", error);
    throw new Error("Failed to check identity verification on blockchain");
  }
};
