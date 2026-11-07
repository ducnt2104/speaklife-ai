/**
 * SpeakLife AI — JWT Authentication Service
 * Uses jose for JWT signing/verification with HttpOnly cookie management.
 */

import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { NextRequest } from "next/server";

const SESSION_COOKIE_NAME = "speaklife_session";

function getJwtSecret(): Uint8Array {
  const secret = process.env.JWT_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error("JWT_SECRET must be set in environment variables (min 32 chars)");
  }
  return new TextEncoder().encode(secret);
}

export interface SessionPayload {
  userId: string;
  email: string;
  displayName: string;
  role: string;
}

/**
 * Creates and signs a JWT session token
 */
export async function createSessionToken(payload: SessionPayload): Promise<string> {
  const secret = getJwtSecret();
  const expiry = process.env.JWT_EXPIRY || "24h";
  
  const token = await new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(expiry)
    .setIssuer("speaklife-ai")
    .sign(secret);

  return token;
}

/**
 * Verifies a JWT token and returns the payload
 */
export async function verifySessionToken(token: string): Promise<SessionPayload | null> {
  try {
    const secret = getJwtSecret();
    const { payload } = await jwtVerify(token, secret, {
      issuer: "speaklife-ai",
    });
    return {
      userId: payload.userId as string,
      email: payload.email as string,
      displayName: payload.displayName as string,
      role: payload.role as string,
    };
  } catch {
    return null;
  }
}

/**
 * Sets session cookie after login/register
 */
export async function setSessionCookie(token: string): Promise<void> {
  const cookieStore = await cookies();
  const isProduction = process.env.NODE_ENV === "production";
  
  cookieStore.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    secure: isProduction,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24, // 24 hours
  });
}

/**
 * Clears session cookie on logout
 */
export async function clearSessionCookie(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE_NAME);
}

/**
 * Gets current session from cookie — for use in API routes
 */
export async function getSessionFromCookie(): Promise<SessionPayload | null> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
    if (!token) return null;
    return verifySessionToken(token);
  } catch {
    return null;
  }
}

/**
 * Gets session from request — for use in middleware or when cookies() is not available
 */
export async function getSessionFromRequest(req: NextRequest): Promise<SessionPayload | null> {
  const token = req.cookies.get(SESSION_COOKIE_NAME)?.value;
  if (!token) return null;
  return verifySessionToken(token);
}

/**
 * Requires authentication — returns session or throws 401-appropriate response
 */
export async function requireAuth(): Promise<SessionPayload> {
  const session = await getSessionFromCookie();
  if (!session) {
    throw new Error("UNAUTHORIZED");
  }
  return session;
}
