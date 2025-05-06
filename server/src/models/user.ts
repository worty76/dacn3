import mongoose, { Schema, Document } from "mongoose";

// Define the interface for User document
export interface IUser extends Document {
  name: string;
  email: string;
  password: string;
  phone?: string;
  did?: string;
  walletAddress?: string;
  isAdmin?: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Create the schema for User
const UserSchema: Schema = new Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
      // Simple regex for email validation
      match: [
        /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
        "Please provide a valid email address",
      ],
    },
    password: {
      type: String,
      required: true,
      minlength: 6,
    },
    phone: {
      type: String,
      required: false,
      trim: true,
    },
    // Fields for blockchain integration (to be implemented later)
    did: {
      type: String,
      default: null,
    },
    walletAddress: {
      type: String,
      default: null,
    },
    isAdmin: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true, // Adds createdAt and updatedAt fields automatically
  }
);

// Create and export the User model
const User = mongoose.model<IUser>("User", UserSchema);

export default User;
