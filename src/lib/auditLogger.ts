import { prisma } from "@/lib/db";

export interface AuditLogParams {
  userId?: string | null;
  actorRole?: string;
  action: string;
  targetId?: string | null;
  details?: Record<string, any> | string | null;
  req?: Request;
}

const REDACTED_KEYS = new Set([
  "password",
  "secret",
  "token",
  "razorpaySignature",
  "razorpay_signature",
  "keySecret",
  "webhookSecret",
  "adminKey",
  "pin",
  "cvv",
]);

/**
 * Sanitizes details object by redacting sensitive secrets
 */
function sanitizeDetails(data: any): any {
  if (!data) return null;
  if (typeof data === "string") {
    return data.slice(0, 2000);
  }
  if (typeof data !== "object") {
    return data;
  }

  const sanitized: Record<string, any> = {};
  for (const [key, val] of Object.entries(data)) {
    if (REDACTED_KEYS.has(key.toLowerCase())) {
      sanitized[key] = "[REDACTED]";
    } else if (typeof val === "object" && val !== null) {
      sanitized[key] = sanitizeDetails(val);
    } else {
      sanitized[key] = val;
    }
  }
  return sanitized;
}

/**
 * Records an administrative or security-sensitive activity to the central AuditLog table
 */
export async function logAudit({
  userId,
  actorRole = "ADMIN",
  action,
  targetId,
  details,
  req,
}: AuditLogParams): Promise<void> {
  try {
    const ip = req
      ? req.headers.get("x-forwarded-for")?.split(",")[0].trim() ||
        req.headers.get("x-real-ip") ||
        "127.0.0.1"
      : undefined;

    const payload = {
      actorRole,
      targetId: targetId || null,
      ip,
      data: sanitizeDetails(details),
    };

    await prisma.auditLog.create({
      data: {
        userId: userId || null,
        action,
        details: JSON.stringify(payload),
      },
    });
  } catch (err) {
    console.warn("Failed to record audit log:", err);
  }
}
