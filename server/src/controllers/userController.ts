import { Request, Response } from "express";
import User from "../models/user";

interface AuthenticatedRequest extends Request {
  userId?: string; // Added by authenticate middleware
}

/**
 * Get user profile
 */
export const getProfile = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    // Now req.user is an optional property from the extended Express.Request
    console.log(req.userId);
    if (!req.userId) {
      res.status(401).json({ message: "Not authenticated" });
      return;
    }

    const user = await User.findById(req.userId).select("-password");

    if (!user) {
      res.status(404).json({ message: "User not found" });
      return;
    }

    res.status(200).json({
      success: true,
      user,
    });
  } catch (error) {
    console.error("Get profile error:", error);
    res.status(500).json({ message: "Server error while getting profile" });
  }
};

/**
 * Update user profile
 */
export const updateProfile = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    if (!req.userId) {
      res.status(401).json({ message: "Not authenticated" });
      return;
    }

    const { name, email, phone } = req.body;

    // Find and update user
    const user = await User.findByIdAndUpdate(
      req.userId,
      { name, email, phone },
      { new: true }
    ).select("-password");

    if (!user) {
      res.status(404).json({ message: "User not found" });
      return;
    }

    res.status(200).json({
      success: true,
      message: "Profile updated successfully",
      user,
    });
  } catch (error) {
    console.error("Update profile error:", error);
    res.status(500).json({ message: "Server error while updating profile" });
  }
};
