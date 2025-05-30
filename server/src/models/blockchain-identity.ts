import mongoose, { Document as MongooseDocument } from "mongoose";

// Define the interface for Blockchain Identity document
export interface IBlockchainIdentity extends MongooseDocument {
  userId: mongoose.Types.ObjectId;
  identityHash: string; // DID
  blockchainAddress: string; // Ethereum address
  privateKey: string; // Private key (encrypted in production)
  verified: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Create the schema for Blockchain Identity
const BlockchainIdentitySchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },
    identityHash: {
      type: String,
      required: true,
      unique: true,
    },
    blockchainAddress: {
      type: String,
      required: true,
      unique: true,
    },
    privateKey: {
      type: String,
      required: true,
    },
    verified: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true, // Adds createdAt and updatedAt fields automatically
  }
);

// Create and export the Blockchain Identity model
const BlockchainIdentity = mongoose.model<IBlockchainIdentity>(
  "BlockchainIdentity",
  BlockchainIdentitySchema
);

export default BlockchainIdentity;
