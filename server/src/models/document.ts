import mongoose, { Document, Schema } from "mongoose";

export interface IDocument extends Document {
  userId: mongoose.Types.ObjectId;
  documentType: string;
  ipfsHash: string;
  ipfsUrl?: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  isVerified: boolean;
  uploadedAt: Date;
  verifiedAt?: Date;
  verifiedBy?: mongoose.Types.ObjectId;
  submittedForVerification?: boolean;
  submissionDate?: Date;
  blockchainTxHash?: string; // Transaction hash when stored on blockchain
  verificationTxHash?: string; // Transaction hash when verified on blockchain
  feedback?: string;
  onBlockchain?: boolean; // Helper field to indicate if document is on blockchain

  // Multi-signature verification fields
  requiresMultiSig: boolean;
  requiredSignatures: number;
  multiSigPaymentTx?: string;
  multiSigPaymentFrom?: string; // User's wallet address
  multiSigPaymentAmount?: string; // Amount in ETH
  adminSignatures: {
    adminId: mongoose.Types.ObjectId;
    signedAt: Date;
    signature?: string;
    txHash?: string;
  }[];
  isMultiSigComplete: boolean;
}

const documentSchema = new Schema<IDocument>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    documentType: {
      type: String,
      required: true,
      enum: [
        "Passport",
        "Driver's License",
        "National ID",
        "Birth Certificate",
        "Proof of Address",
        "Utility Bill",
        "Bank Statement",
        "Other",
      ],
    },
    ipfsHash: {
      type: String,
      required: true,
    },
    ipfsUrl: {
      type: String,
    },
    fileName: {
      type: String,
      required: true,
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
      type: Schema.Types.ObjectId,
      ref: "User",
    },
    submittedForVerification: {
      type: Boolean,
      default: false,
    },
    submissionDate: {
      type: Date,
    },
    blockchainTxHash: {
      type: String,
      // Only set when document is stored on blockchain (after verification)
    },
    verificationTxHash: {
      type: String,
      // Only set when document is verified on blockchain
    },
    feedback: {
      type: String,
    },

    // Multi-signature verification fields
    requiresMultiSig: {
      type: Boolean,
      default: false,
    },
    requiredSignatures: {
      type: Number,
      default: 1,
      min: 1,
      max: 5,
    },
    multiSigPaymentTx: {
      type: String,
    },
    multiSigPaymentFrom: {
      type: String, // User's wallet address
    },
    multiSigPaymentAmount: {
      type: String, // Amount in ETH
    },
    adminSignatures: [
      {
        adminId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
          required: true,
        },
        signedAt: {
          type: Date,
          default: Date.now,
        },
        signature: String,
        txHash: String,
      },
    ],
    isMultiSigComplete: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

// Virtual field to check if document is on blockchain
documentSchema.virtual("onBlockchain").get(function () {
  return !!this.blockchainTxHash;
});

// Ensure virtual fields are included in JSON output
documentSchema.set("toJSON", { virtuals: true });

export default mongoose.model<IDocument>("Document", documentSchema);
