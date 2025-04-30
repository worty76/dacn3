import mongoose, { Schema, Document, Types } from "mongoose";
import { IUser } from "./user";

// Define the interface for Blockchain Identity document
export interface IBlockchainIdentity extends Document {
  userId: Types.ObjectId | IUser;
  identityHash: string;
  blockchainAddress: string;
  verified: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Create the schema for Blockchain Identity
const BlockchainIdentitySchema: Schema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    identityHash: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    blockchainAddress: {
      type: String,
      required: true,
      trim: true,
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
