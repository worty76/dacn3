import mongoose, { Schema, Document } from "mongoose";

export interface IVerificationShare extends Document {
  code: string;
  userId: mongoose.Types.ObjectId;
  documentIds: mongoose.Types.ObjectId[];
  expiresAt: Date;
  createdAt: Date;
  includeDetails: boolean;
  showDocuments: boolean; // Add this property to control document visibility
}

const VerificationShareSchema: Schema = new Schema(
  {
    code: {
      type: String,
      required: true,
      unique: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    documentIds: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Document",
      },
    ],
    expiresAt: {
      type: Date,
      required: true,
    },
    includeDetails: {
      type: Boolean,
      default: false,
    },
    showDocuments: {
      type: Boolean,
      default: true, // By default, show the documents
    },
  },
  {
    timestamps: true,
  }
);

// Create and export the VerificationShare model
const VerificationShare = mongoose.model<IVerificationShare>(
  "VerificationShare",
  VerificationShareSchema
);

export default VerificationShare;
