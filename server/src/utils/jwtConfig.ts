import dotenv from "dotenv";
import jwt from "jsonwebtoken";

// Load environment variables
dotenv.config();

// Use a consistent secret across the application
export const JWT_SECRET =
  process.env.JWT_SECRET || "your_blockchain_identity_secret";
export const JWT_EXPIRES_IN = "24h";

// Export a consistent token generation function
export const generateToken = (userId: string): string => {
  return jwt.sign({ id: userId }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
};
