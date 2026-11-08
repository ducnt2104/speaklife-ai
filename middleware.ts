/**
 * SpeakLife AI — Next.js Edge Middleware
 * Protects private routes and enforces authentication.
 * Runs at the edge before any API route or page handler.
 */

import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";

const SESSION_COOKIE_NAME = "speaklife_session";

// Routes that require authentication
const PROTECTED_ROUTES = [
  "/dashboard",
  "/practice",
  "/profile",
  "/settings",
  "/history",
];

// API routes that require authentication
const PROTECTED_API_ROUTES = [
  "/api/dashboard",
  "/api/practice",
  "/api/session",
  "/api/report/save",
  "/api/settings",
  "/api/judge",
];

// Routes that should redirect to dashboard if already logged in
const AUTH_ROUTES = ["/login", "/register"];

function getJwtSecret(): Uint8Array {
  const secret = process.env.JWT_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error("JWT_SECRET environment variable is required");
  }
  return new TextEncoder().encode(secret);
}

async function verifyToken(token: string): Promise<boolean> {
  try {
    await jwtVerify(token, getJwtSecret(), { issuer: "speaklife-ai" });
    return true;
  } catch {
    return false;
  }
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const token = req.cookies.get(SESSION_COOKIE_NAME)?.value;
  const isAuthenticated = token ? await verifyToken(token) : false;

  // Redirect authenticated users away from login/register pages
  if (AUTH_ROUTES.some((route) => pathname.startsWith(route))) {
    if (isAuthenticated) {
      const callback = req.nextUrl.searchParams.get("callbackUrl");
      const target = callback && callback.startsWith("/") ? callback : "/dashboard";
      return NextResponse.redirect(new URL(target, req.url));
    }
    return NextResponse.next();
  }

  // Protect private page routes
  if (PROTECTED_ROUTES.some((route) => pathname.startsWith(route))) {
    if (!isAuthenticated) {
      const loginUrl = new URL("/login", req.url);
      loginUrl.searchParams.set("callbackUrl", pathname);
      return NextResponse.redirect(loginUrl);
    }
    return NextResponse.next();
  }

  // Protect private API routes — return 401 JSON instead of redirect
  if (PROTECTED_API_ROUTES.some((route) => pathname.startsWith(route))) {
    if (!isAuthenticated) {
      return NextResponse.json(
        { success: false, error: { code: "UNAUTHORIZED", message: "Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại." } },
        { status: 401 }
      );
    }
    return NextResponse.next();
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    // Match all protected routes and API routes
    "/dashboard/:path*",
    "/practice/:path*",
    "/rehearse/:path*",
    "/report/:path*",
    "/setup/:path*",
    "/settings/:path*",
    "/history/:path*",
    "/login",
    "/register",
    "/api/dashboard/:path*",
    "/api/practice/:path*",
    "/api/session/:path*",
    "/api/report/save/:path*",
    "/api/settings/:path*",
    "/api/judge/:path*",
  ],
};
