"use client";

import { useAuthStore } from "@/stores/useAuthStore";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Cookies from "js-cookie";

// Include admin paths in public paths to prevent redirection for admins
const publicPaths = ["/login", "/register", "/", "/verify"];
const adminPaths = [
  "/admin",
  "/admin/dashboard",
  "/admin/users",
  "/admin/documents",
];

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [isLoading, setIsLoading] = useState(true);
  const [hasCheckedAuth, setHasCheckedAuth] = useState(false); // Add this state
  const { isAuthenticated, token, setIsAuthenticated, user, login } =
    useAuthStore();
  const pathname = usePathname();
  const router = useRouter();

  // Check auth on client-side
  useEffect(() => {
    // Try to get auth from cookie
    const authCookie = Cookies.get("auth-storage");
    console.log("Auth cookie found:", !!authCookie);

    // If no auth in store but cookie exists
    if (!token && authCookie) {
      try {
        const parsedCookie = JSON.parse(decodeURIComponent(authCookie));
        console.log("Parsed cookie state:", parsedCookie?.state);

        if (parsedCookie?.state?.token) {
          // Check for user data in the cookie
          if (parsedCookie?.state?.user) {
            // Make sure the user object has isAdmin property (could be missing or undefined)
            const userWithAdmin = {
              ...parsedCookie.state.user,
              isAdmin: !!parsedCookie.state.user.isAdmin,
            };

            // Use the complete user object from the cookie with guaranteed isAdmin property
            login(userWithAdmin, parsedCookie.state.token);
            console.log(
              "Auth restored from cookie with user:",
              userWithAdmin,
              "isAdmin:",
              userWithAdmin.isAdmin
            );
          }
          // If we only have isAdmin flag but no user object
          else if (parsedCookie?.state?.isAdmin !== undefined) {
            // Create a minimal user object with isAdmin property
            const userData = {
              id: "unknown",
              email: "admin@example.com",
              name: "Admin User",
              isAdmin: parsedCookie.state.isAdmin,
            };

            login(userData, parsedCookie.state.token);
            console.log(
              "Auth restored from cookie with admin status:",
              userData.isAdmin
            );
          } else {
            // Just set authenticated status if no admin info or user data
            setIsAuthenticated(true);
            console.log("Auth restored from cookie (minimal info)");
          }
        }
      } catch (e) {
        console.error("Failed to parse auth cookie:", e);
      }
    }

    // Mark that we've checked auth from cookies
    setHasCheckedAuth(true);
  }, []); // Only run once on mount

  // Separate effect for handling redirects after auth is checked
  useEffect(() => {
    // Don't handle redirects until we've checked auth from cookies
    if (!hasCheckedAuth) {
      return;
    }

    // Handle auth redirects
    const isPublicPath = publicPaths.some(
      (path) => pathname === path || pathname.startsWith("/verify/")
    );

    // Check if the current path is an admin path
    const isAdminPath = pathname.startsWith("/admin");

    // Get admin status - log the full user object to debug
    console.log("Current user in store:", user);
    const isAdmin = user?.isAdmin === true; // Strict boolean check

    console.log(
      "Current path:",
      pathname,
      "Is admin:",
      isAdmin,
      "Is admin path:",
      isAdminPath,
      "User admin flag type:",
      typeof user?.isAdmin
    );

    // For debugging: log the full condition check
    console.log("Auth check condition:", {
      isAuthenticated,
      isPublicPath,
      isAdminPath,
      isAdmin,
      redirectToLogin: !isAuthenticated && !isPublicPath,
      redirectFromAdmin: isAuthenticated && isAdminPath && !isAdmin,
    });

    // Modify the redirection logic to allow admins to access admin paths
    if (!isAuthenticated && !isPublicPath) {
      console.log("Not authenticated, redirecting to login");
      router.push("/login");
    } else if (isAuthenticated && isAdminPath && !isAdmin) {
      // Only redirect if trying to access admin paths WITHOUT being admin
      console.log("Not authorized for admin dashboard, redirecting to home");
      router.push("/");
    } else {
      console.log("Authentication check passed, allowing navigation");

      // Special handling for admins trying to access admin pages
      if (isAdmin && pathname === "/login") {
        console.log("Admin at login page, redirecting to admin dashboard");
        router.push("/admin/dashboard");
      }
    }

    setIsLoading(false);
  }, [
    pathname,
    isAuthenticated,
    token,
    router,
    setIsAuthenticated,
    user,
    hasCheckedAuth, // Add this dependency
  ]);

  if (isLoading || !hasCheckedAuth) {
    // Update loading condition
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return <>{children}</>;
}
