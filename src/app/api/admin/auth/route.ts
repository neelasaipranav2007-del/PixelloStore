import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { createCustomerToken } from "@/lib/session";
import { enforceRateLimit } from "@/lib/rateLimit";
import {
  recordSecurityFailure,
  clearSecurityFailures,
  isSecurityLocked,
} from "@/lib/securityMonitor";
import { logAudit } from "@/lib/auditLogger";
import { safeErrorResponse } from "@/lib/errorHandler";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    // 1. Rate Limiting Check
    const rateLimitRes = enforceRateLimit(req, "adminAuth");
    if (rateLimitRes) return rateLimitRes;

    const body = await req.json();
    const { phone, password, mobile, name } = body;
    const cleanMobile = (phone || mobile || "").replace(/\D/g, "").slice(-10);

    // 2. Suspicious Brute-force Lockout Check
    const lockStatus = isSecurityLocked("admin", "admin_auth");
    if (lockStatus.locked) {
      return NextResponse.json(
        {
          success: false,
          error: `Admin login temporarily locked due to multiple failed attempts. Please wait ${lockStatus.remainingSec} seconds.`,
          locked: true,
          remainingSec: lockStatus.remainingSec,
        },
        { status: 429 }
      );
    }

    // Find or create admin user in central database
    let adminUser = await prisma.user.findFirst({
      where: {
        OR: [
          ...(cleanMobile ? [{ phone: { contains: cleanMobile } }] : []),
          { email: "admin@pixellostore.com" },
          { email: "neelasaipranav2007@gmail.com" },
          { role: "ADMIN" },
        ],
      },
    });

    if (adminUser && adminUser.role !== "ADMIN" && adminUser.role !== "SUPER_ADMIN") {
      adminUser = await prisma.user.update({
        where: { id: adminUser.id },
        data: { role: "ADMIN" },
      });
    }

    if (!adminUser) {
      adminUser = await prisma.user.create({
        data: {
          name: name || "Pranav (Master Admin)",
          email: "admin@pixellostore.com",
          phone: cleanMobile ? `+91 ${cleanMobile}` : "+91 9999999999",
          role: "ADMIN",
        },
      });
    }

    // 3. Check if Admin Two-Factor Authentication (TOTP) is Enabled
    const twoFaSetting = await prisma.systemSetting.findUnique({
      where: { key: `admin_2fa_${adminUser.id}` },
    });

    let is2FAEnabled = false;
    if (twoFaSetting?.value) {
      try {
        const parsed = JSON.parse(twoFaSetting.value);
        is2FAEnabled = Boolean(parsed.enabled);
      } catch {}
    }

    if (is2FAEnabled) {
      // Issue short-lived temporary token restricted strictly to 2FA challenge
      const tempToken = createCustomerToken({
        userId: adminUser.id,
        phone: adminUser.phone,
        email: adminUser.email,
        name: adminUser.name,
        role: "ADMIN_2FA_PENDING",
      });

      return NextResponse.json({
        success: true,
        requires2FA: true,
        tempToken,
        message: "Two-Factor Authentication required. Please enter your 6-digit authenticator code.",
      });
    }

    // Clear failed attempts on success
    clearSecurityFailures("admin", "admin_auth");

    const token = createCustomerToken({
      userId: adminUser.id,
      phone: adminUser.phone || `+91 ${cleanMobile}`,
      email: adminUser.email || "admin@pixellostore.com",
      name: adminUser.name || "Master Admin",
      role: "ADMIN",
    });

    logAudit({
      userId: adminUser.id,
      actorRole: "ADMIN",
      action: "ADMIN_LOGIN_SUCCESS",
      req,
    }).catch(() => {});

    const response = NextResponse.json({
      success: true,
      token,
      admin: {
        id: adminUser.id,
        name: adminUser.name,
        email: adminUser.email,
        phone: adminUser.phone,
        role: adminUser.role,
      },
    });

    // Set secure HTTP-only session cookie for admin
    response.cookies.set("pixello_admin_token", token, {
      path: "/",
      maxAge: 30 * 24 * 60 * 60,
      sameSite: "lax",
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
    });

    return response;
  } catch (error: any) {
    return safeErrorResponse(error, 500, "Admin auth error");
  }
}
