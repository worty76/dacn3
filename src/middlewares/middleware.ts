import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;
  const isPublicPath = path === "/";
  const token = request.cookies.get("token")?.value || "";
  const userRole = request.cookies.get("role")?.value || "";

  console.log(isPublicPath);

  if (path === "/dashboard") {
    if (!token || userRole !== "admin") {
      return NextResponse.redirect(new URL("/", request.url));
    }
  }

  if (path === "/" && token && userRole === "admin") {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/", "/dashboard"],
};
