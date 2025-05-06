import type { NextApiRequest, NextApiResponse } from "next";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // Only allow POST method
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  try {
    const { email, password } = req.body;

    // Call your backend API
    const apiUrl = `${
      process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api"
    }/login`;

    const response = await fetch(apiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email, password }),
    });

    const data = await response.json();

    if (!response.ok) {
      return res.status(response.status).json(data);
    }

    // Add isAdmin flag based on email domain or explicit flag from backend
    // You can modify this logic based on how you determine admin status
    const isAdmin =
      email.includes("admin") ||
      email === "admin@example.com" ||
      (data.user && data.user.isAdmin === true);

    // Return the adjusted response
    return res.status(200).json({
      success: true,
      message: "Login successful",
      token: data.token,
      user: {
        id: data.user.id,
        email: data.user.email,
        name: data.user.name || data.user.email.split("@")[0],
        isAdmin: isAdmin,
      },
    });
  } catch (error) {
    console.error("Login API error:", error);
    return res
      .status(500)
      .json({ message: "Failed to connect to authentication service" });
  }
}
