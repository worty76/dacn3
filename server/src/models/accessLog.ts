import mongoose, { Document as MongooseDocument } from "mongoose";

// Define the interface for Access Log
export interface IAccessLog extends MongooseDocument {
  userId?: mongoose.Types.ObjectId;
  resourceType: string; // document, identity, etc.
  resourceId: string;
  action: string; // view, download, verify, etc.
  accessedBy: string; // user, admin, third-party
  ipAddress?: string;
  userAgent?: string;
  timestamp: Date;
}

// Create the schema for Access Log
const AccessLogSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: false, // Optional for anonymous access
    },
    resourceType: {
      type: String,
      required: true,
    },
    resourceId: {
      type: String,
      required: true,
    },
    action: {
      type: String,
      required: true,
    },
    accessedBy: {
      type: String,
      required: true,
      enum: ["user", "admin", "third-party"],
    },
    ipAddress: {
      type: String,
    },
    userAgent: {
      type: String,
    },
    timestamp: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: false, // We're using our own timestamp field
  }
);

// Create and export the Access Log model
const AccessLog = mongoose.model<IAccessLog>("AccessLog", AccessLogSchema);

export default AccessLog;
