import { prisma } from "@/lib/db";
import crypto from "crypto";
import { NextResponse } from "next/server";

const SESSION_SECRET = process.env.NEXTAUTH_SECRET || "pixello-super-secret-auth-key-2026";

// Revocation registry for logged-out or invalidated tokens (signature based)
const revokedTokenSignatures = new Set<string>();

export interface SessionPayload {
  userId: string;
  role: string;
  phone?: string | null;
  email?: string | null;
  name?: string | null;
  issuedAt: number;
}

/**
 * Marks a session token as revoked (on logout or password change)
 */
export function revokeToken(tokenString?: string | null): void {
  if (!tokenString || typeof tokenString !== "string") return;
  const parts = tokenString.split(".");
  if (parts.length === 2) {
    revokedTokenSignatures.add(parts[1]);
  }
}

/**
 * Checks whether a session token has been revoked
 */
export function isTokenRevoked(tokenString?: string | null): boolean {
  if (!tokenString || typeof tokenString !== "string") return true;
  const parts = tokenString.split(".");
  if (parts.length !== 2) return true;
  return revokedTokenSignatures.has(parts[1]);
}

/**
 * Creates a secure signed token for authenticated customer or admin session
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
 * Verifies and decodes a signed session token
 */
export function verifyCustomerToken(tokenString?: string | null): SessionPayload | null {
  if (!tokenString || typeof tokenString !== "string") return null;
  const parts = tokenString.split(".");
  if (parts.length !== 2) return null;

  const [base64Data, signature] = parts;

  // Check revocation registry
  if (revokedTokenSignatures.has(signature)) {
    return null;
  }

  const expectedSig = crypto
    .createHmac("sha256", SESSION_SECRET)
    .update(base64Data)
    .digest("base64url");

  // Timing safe equal comparison to prevent timing attacks
  const sigBuf = Buffer.from(signature);
  const expBuf = Buffer.from(expectedSig);
  if (sigBuf.length !== expBuf.length || !crypto.timingSafeEqual(sigBuf, expBuf)) {
    return null;
  }

  try {
    const json = Buffer.from(base64Data, "base64url").toString("utf8");
    const payload = JSON.parse(json) as SessionPayload;
    // Token valid for 30 days maximum
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
      const extracted = authHeader.slice(7).trim();
      if (extracted && extracted !== "null" && extracted !== "undefined") {
        token = extracted;
      }
    }

    // 2. Check cookies
    if (!token) {
      const cookieHeader = req.headers.get("cookie") || "";
      const match =
        cookieHeader.match(/pixello_auth_token=([^;]+)/) ||
        cookieHeader.match(/pixello_customer_token=([^;]+)/) ||
        cookieHeader.match(/pixello_admin_token=([^;]+)/) ||
        cookieHeader.match(/pixello_ambassador_token=([^;]+)/);
      if (match && match[1] && match[1] !== "null" && match[1] !== "undefined") {
        token = match[1];
      }
    }
  }

  if (!token) return null;

  const payload = verifyCustomerToken(token);
  if (!payload || !payload.userId) return null;

  try {
    let user = await prisma.user.findUnique({
      where: { id: payload.userId },
      include: {
        customerProfile: true,
      },
    });

    if (!user && (payload.phone || payload.email)) {
      user = await prisma.user.findFirst({
        where: {
          OR: [
            payload.phone ? { phone: payload.phone } : {},
            payload.email ? { email: payload.email } : {},
          ],
        },
        include: {
          customerProfile: true,
        },
      });
    }

    if (!user) return null;

    // Auto create CustomerProfile if missing
    if (!user.customerProfile) {
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
 */
export async function getAuthenticatedAmbassador(req?: Request) {
  let token: string | null = null;

  if (req) {
    const authHeader = req.headers.get("authorization");
    if (authHeader && authHeader.startsWith("Bearer ")) {
      const extracted = authHeader.slice(7).trim();
      if (extracted && extracted !== "null" && extracted !== "undefined") {
        token = extracted;
      }
    }

    if (!token) {
      const cookieHeader = req.headers.get("cookie") || "";
      const match =
        cookieHeader.match(/pixello_ambassador_token=([^;]+)/) ||
        cookieHeader.match(/pixello_auth_token=([^;]+)/);
      if (match && match[1] && match[1] !== "null" && match[1] !== "undefined") {
        token = match[1];
      }
    }
  }

  if (!token) return null;

  const payload = verifyCustomerToken(token);
  if (!payload || !payload.userId) return null;

  try {
    let user = await prisma.user.findUnique({
      where: { id: payload.userId },
      include: {
        ambassadorProfile: {
          include: {
            rewards: true,
            notifications: {
              orderBy: { createdAt: "desc" },
              take: 10,
            },
            payouts: {
              orderBy: { requestedAt: "desc" },
            },
          },
        },
      },
    });

    if (!user && (payload.phone || payload.email)) {
      const cleanPhone = (payload.phone || "").replace(/\D/g, "").slice(-10);
      user = await prisma.user.findFirst({
        where: {
          OR: [
            payload.phone ? { phone: payload.phone } : {},
            cleanPhone ? { phone: { contains: cleanPhone } } : {},
            payload.email ? { email: payload.email } : {},
          ],
        },
        include: {
          ambassadorProfile: {
            include: {
              rewards: true,
              notifications: {
                orderBy: { createdAt: "desc" },
                take: 10,
              },
              payouts: {
                orderBy: { requestedAt: "desc" },
              },
            },
          },
        },
      });
    }

    if (!user) return null;

    if (!user.ambassadorProfile) {
      const cleanPhone = (user.phone || "").replace(/\D/g, "").slice(-4) || "10";
      const code = `AMB${cleanPhone}`;
      const existing = await prisma.ambassadorProfile.findUnique({
        where: { referralCode: code },
      });
      const finalCode = existing ? `AMB${cleanPhone}_${Math.floor(Math.random() * 90 + 10)}` : code;
      const ambProfile = await prisma.ambassadorProfile.create({
        data: {
          userId: user.id,
          referralCode: finalCode,
          college: "Campus Partner",
          rank: "GOLD",
          totalEarned: 6400,
          balance: 4250,
          status: "APPROVED",
        },
        include: {
          rewards: true,
          notifications: true,
          payouts: true,
        },
      });
      user.ambassadorProfile = ambProfile as any;
    }

    return {
      user,
      ambassador: user.ambassadorProfile,
    };
  } catch (err) {
    console.error("Error finding authenticated ambassador:", err);
    return null;
  }
}

/**
 * Extracts and verifies the authenticated admin directly from incoming Next.js Request
 */
export async function getAuthenticatedAdmin(req?: Request) {
  let token: string | null = null;

  if (req) {
    const authHeader = req.headers.get("authorization");
    if (authHeader && authHeader.startsWith("Bearer ")) {
      const extracted = authHeader.slice(7).trim();
      if (extracted && extracted !== "null" && extracted !== "undefined") {
        token = extracted;
      }
    }

    if (!token) {
      const cookieHeader = req.headers.get("cookie") || "";
      const match =
        cookieHeader.match(/pixello_admin_token=([^;]+)/) ||
        cookieHeader.match(/pixello_auth_token=([^;]+)/);
      if (match && match[1] && match[1] !== "null" && match[1] !== "undefined") {
        token = match[1];
      }
    }

    // Only allow x-admin-key if explicitly configured in environment variables and matches via timingSafeEqual
    if (!token) {
      const adminKey = req.headers.get("x-admin-key");
      const configuredKey = process.env.ADMIN_SECRET_KEY;
      if (adminKey && configuredKey && configuredKey.length >= 16) {
        const keyBuf = Buffer.from(adminKey);
        const confBuf = Buffer.from(configuredKey);
        if (keyBuf.length === confBuf.length && crypto.timingSafeEqual(keyBuf, confBuf)) {
          return {
            user: { id: "admin_master", name: "Pixello Master Admin", role: "ADMIN" as const },
            role: "ADMIN" as const,
          };
        }
      }
    }
  }

  if (token) {
    const payload = verifyCustomerToken(token);
    if (!payload || !payload.userId) return null;

    if (payload.role === "ADMIN" || payload.role === "SUPER_ADMIN") {
      return {
        user: {
          id: payload.userId,
          name: payload.name || "Admin",
          email: payload.email,
          phone: payload.phone,
          role: payload.role as any,
        },
        role: payload.role as any,
      };
    }

    try {
      const user = await prisma.user.findUnique({
        where: { id: payload.userId },
      });

      if (user && (user.role === "ADMIN" || user.role === "SUPER_ADMIN")) {
        return { user, role: user.role };
      }
    } catch (err) {
      console.error("Error verifying admin user:", err);
    }

    return null;
  }

  return null;
}

/**
 * Extracts and verifies delivery partner authentication
 */
export async function getAuthenticatedDelivery(req?: Request) {
  let token: string | null = null;

  if (req) {
    const authHeader = req.headers.get("authorization");
    if (authHeader && authHeader.startsWith("Bearer ")) {
      const extracted = authHeader.slice(7).trim();
      if (extracted && extracted !== "null" && extracted !== "undefined") {
        token = extracted;
      }
    }

    if (!token) {
      const cookieHeader = req.headers.get("cookie") || "";
      const match =
        cookieHeader.match(/pixello_delivery_token=([^;]+)/) ||
        cookieHeader.match(/pixello_auth_token=([^;]+)/) ||
        cookieHeader.match(/pixello_admin_token=([^;]+)/);
      if (match && match[1] && match[1] !== "null" && match[1] !== "undefined") {
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
        deliveryProfile: true,
      },
    });

    if (
      user &&
      (user.role === "DELIVERY" || user.role === "ADMIN" || user.role === "SUPER_ADMIN")
    ) {
      return { user, deliveryProfile: user.deliveryProfile };
    }
  } catch (err) {
    console.error("Error verifying delivery partner:", err);
  }

  return null;
}

/**
 * Centralized authorization enforcement helpers for API endpoints
 */
export async function requireCustomerAuth(req: Request) {
  const user = await getAuthenticatedUser(req);
  if (!user) {
    return {
      user: null,
      response: NextResponse.json(
        { success: false, error: "Unauthorized. Customer authentication required." },
        { status: 401 }
      ),
    };
  }
  return { user, response: null };
}

export async function requireAdminAuth(req: Request) {
  const admin = await getAuthenticatedAdmin(req);
  if (!admin) {
    return {
      admin: null,
      response: NextResponse.json(
        { success: false, error: "Forbidden. Admin privileges required." },
        { status: 401 }
      ),
    };
  }
  return { admin, response: null };
}

export async function requireAmbassadorAuth(req: Request) {
  const amb = await getAuthenticatedAmbassador(req);
  if (!amb) {
    return {
      amb: null,
      response: NextResponse.json(
        { success: false, error: "Unauthorized. Ambassador authentication required." },
        { status: 401 }
      ),
    };
  }
  return { amb, response: null };
}

export async function requireDeliveryAuth(req: Request) {
  const del = await getAuthenticatedDelivery(req);
  if (!del) {
    return {
      del: null,
      response: NextResponse.json(
        { success: false, error: "Unauthorized. Delivery privileges required." },
        { status: 401 }
      ),
    };
  }
  return { del, response: null };
}
