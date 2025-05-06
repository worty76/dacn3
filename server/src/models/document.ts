import mongoose, { Document as MongooseDocument } from "mongoose";

export interface IDocument extends MongooseDocument {
  _id: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  documentType: string;
  ipfsHash: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  isVerified: boolean;
  uploadedAt: Date;
  verifiedAt?: Date;
  verifiedBy?: mongoose.Types.ObjectId;
  blockchainTxHash?: string;
  verificationTxHash?: string;
  submittedForVerification?: boolean;
  submissionDate?: Date;
}

// Create the schema for Document
const DocumentSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    documentType: {
      type: String,
      required: true,
      trim: true,
    },
    ipfsHash: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    fileName: {
      type: String,
      required: true,
      trim: true,
    },
    fileSize: {
      type: Number,
      required: true,
    },
    mimeType: {
      type: String,
      required: true,
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
    uploadedAt: {
      type: Date,
      default: Date.now,
    },
    verifiedAt: {
      type: Date,
    },
    verifiedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    blockchainTxHash: {
      type: String,
      trim: true,
    },
    verificationTxHash: {
      type: String,
      trim: true,
    },
    submittedForVerification: {
      type: Boolean,
      default: false,
    },
    submissionDate: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

// Create and export the Document model
const Document = mongoose.model<IDocument>("Document", DocumentSchema);

export default Document;
