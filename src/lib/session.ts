import { prisma } from "@/lib/db";
import crypto from "crypto";

const SESSION_SECRET = process.env.NEXTAUTH_SECRET || "pixello-super-secret-auth-key-2026";

export interface SessionPayload {
  userId: string;
  role: string;
  phone?: string | null;
  email?: string | null;
  name?: string | null;
  issuedAt: number;
}

/**
 * Creates a secure signed token for authenticated customer session
 */
export function createCustomerToken(payload: Omit<SessionPayload, "issuedAt">): string {
  const data: SessionPayload = {
    ...payload,
    issuedAt: Date.now(),
  };
  const json = JSON.stringify(data);
  const base64Data = Buffer.from(json, "utf8").toString("base64url");
  const signature = crypto
    .createHmac("sha256", SESSION_SECRET)
    .update(base64Data)
    .digest("base64url");
  return `${base64Data}.${signature}`;
}

/**
 * Verifies and decodes a signed customer session token
 */
export function verifyCustomerToken(tokenString?: string | null): SessionPayload | null {
  if (!tokenString || typeof tokenString !== "string") return null;
  const parts = tokenString.split(".");
  if (parts.length !== 2) return null;

  const [base64Data, signature] = parts;
  const expectedSig = crypto
    .createHmac("sha256", SESSION_SECRET)
    .update(base64Data)
    .digest("base64url");

  if (signature !== expectedSig) return null;

  try {
    const json = Buffer.from(base64Data, "base64url").toString("utf8");
    const payload = JSON.parse(json) as SessionPayload;
    // Token valid for 30 days
    if (Date.now() - payload.issuedAt > 30 * 24 * 60 * 60 * 1000) {
      return null;
    }
    return payload;
  } catch (e) {
    return null;
  }
}

/**
 * Extracts and verifies the authenticated user directly from incoming Next.js Request
 */
export async function getAuthenticatedUser(req?: Request) {
  let token: string | null = null;

  if (req) {
    // 1. Check Authorization header
    const authHeader = req.headers.get("authorization");
    if (authHeader && authHeader.startsWith("Bearer ")) {
      token = authHeader.slice(7).trim();
    }

    // 2. Check cookies
    if (!token) {
      const cookieHeader = req.headers.get("cookie") || "";
      const match = cookieHeader.match(/pixello_auth_token=([^;]+)/);
      if (match) {
        token = match[1];
      }
    }
  }

  if (!token) return null;

  const payload = verifyCustomerToken(token);
  if (!payload || !payload.userId) return null;

  try {
    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      include: {
        customerProfile: true,
      },
    });

    if (!user) return null;

    // Auto create CustomerProfile if missing
    if (!user.customerProfile && user.role === "CUSTOMER") {
      const profile = await prisma.customerProfile.create({
        data: { userId: user.id },
      });
      user.customerProfile = profile;
    }

    return user;
  } catch (err) {
    console.error("Error finding authenticated user:", err);
    return null;
  }
}

/**
 * Extracts and verifies the authenticated ambassador directly from incoming Next.js Request
 * Returns { user, ambassador } or null
 */
export async function getAuthenticatedAmbassador(req?: Request) {
  let token: string | null = null;

  if (req) {
    // 1. Check Authorization header
    const authHeader = req.headers.get("authorization");
    if (authHeader && authHeader.startsWith("Bearer ")) {
      token = authHeader.slice(7).trim();
    }

    // 2. Check cookies
    if (!token) {
      const cookieHeader = req.headers.get("cookie") || "";
      const match =
        cookieHeader.match(/pixello_ambassador_token=([^;]+)/) ||
        cookieHeader.match(/pixello_auth_token=([^;]+)/);
      if (match) {
        token = match[1];
      }
    }
  }

  if (!token) return null;

  const payload = verifyCustomerToken(token);
  if (!payload || !payload.userId) return null;

  try {
    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      include: {
        ambassadorProfile: true,
      },
    });

    if (!user || !user.ambassadorProfile) return null;

    return {
      user,
      ambassador: user.ambassadorProfile,
    };
  } catch (err) {
    console.error("Error finding authenticated ambassador:", err);
    return null;
  }
}
