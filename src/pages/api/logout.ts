import type { NextApiRequest, NextApiResponse } from "next";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // Only allow POST requests
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  try {
    // Clear cookies on the server side
    res.setHeader("Set-Cookie", [
      `token=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT`,
      `role=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT`,
    ]);

    // If you have a backend logout endpoint, you can call it here
    // const token = req.cookies.token;
    // if (token) {
    //   await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/logout`, {
    //     method: 'POST',
    //     headers: {
    //       'Authorization': `Bearer ${token}`,
    //       'Content-Type': 'application/json',
    //     }
    //   });
    // }

    return res
      .status(200)
      .json({ success: true, message: "Logged out successfully" });
  } catch (error) {
    console.error("Logout error:", error);
    return res.status(500).json({ message: "Error during logout process" });
  }
}
