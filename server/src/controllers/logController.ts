import { Request, Response } from "express";
import AccessLog from "../models/accessLog";

interface AuthenticatedRequest extends Request {
  userId?: string; // Added by authenticate middleware
}

/**
 * Log an access event
 */
export const logAccess = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const { resourceType, resourceId, action, accessedBy } = req.body;

    // Create access log
    const accessLog = new AccessLog({
      userId: req.userId,
      resourceType,
      resourceId,
      action,
      accessedBy: accessedBy || "user", // user, admin, or third-party
      ipAddress: req.ip,
      userAgent: req.headers["user-agent"],
      timestamp: new Date(),
    });

    await accessLog.save();

    res.status(201).json({
      success: true,
      message: "Access logged successfully",
      logId: accessLog._id,
    });
  } catch (error) {
    console.error("Error logging access:", error);
    res.status(500).json({ message: "Server error" });
  }
};

/**
 * Get access logs (admin only)
 */
export const getAccessLogs = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const {
      userId,
      resourceType,
      startDate,
      endDate,
      page = 1,
      limit = 20,
    } = req.query;

    // Build query
    const query: any = {};

    if (userId) query.userId = userId;
    if (resourceType) query.resourceType = resourceType;

    if (startDate || endDate) {
      query.timestamp = {};
      if (startDate) query.timestamp.$gte = new Date(startDate as string);
      if (endDate) query.timestamp.$lte = new Date(endDate as string);
    }

    // Pagination
    const skip = (Number(page) - 1) * Number(limit);

    // Get logs
    const logs = await AccessLog.find(query)
      .sort({ timestamp: -1 })
      .skip(skip)
      .limit(Number(limit));

    // Get total count
    const total = await AccessLog.countDocuments(query);

    res.status(200).json({
      success: true,
      total,
      page: Number(page),
      limit: Number(limit),
      totalPages: Math.ceil(total / Number(limit)),
      logs,
    });
  } catch (error) {
    console.error("Error fetching access logs:", error);
    res.status(500).json({ message: "Server error" });
  }
};
