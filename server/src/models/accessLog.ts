import mongoose, { Schema, Document, Types } from "mongoose";
import { IUser } from "./user";

// Define the interface for Access Log
export interface IAccessLog extends Document {
  userId?: Types.ObjectId | IUser;
  resourceType: string;
  resourceId?: string;
  action: string;
  accessedBy: string; // user, admin, or third-party
  ipAddress: string;
  userAgent: string;
  timestamp: Date;
}

// Create the schema for Access Log
const AccessLogSchema: Schema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
    resourceType: {
      type: String,
      required: true,
      trim: true,
    },
    resourceId: {
      type: String,
      trim: true,
    },
    action: {
      type: String,
      required: true,
      trim: true,
    },
    accessedBy: {
      type: String,
      enum: ["user", "admin", "third-party"],
      default: "user",
    },
    ipAddress: {
      type: String,
      trim: true,
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
    timestamps: true,
  }
);

// Create index for common query patterns
AccessLogSchema.index({ userId: 1, timestamp: -1 });
AccessLogSchema.index({ resourceType: 1, resourceId: 1 });
AccessLogSchema.index({ timestamp: -1 });

// Create and export the Access Log model
const AccessLog = mongoose.model<IAccessLog>("AccessLog", AccessLogSchema);

export default AccessLog;
