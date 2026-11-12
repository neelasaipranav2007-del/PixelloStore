import { NextResponse } from "next/server";
import { getAdminSecurityConfig, saveAdminSecurityConfig } from "@/lib/adminSecurity";
import { getAuthenticatedAdmin } from "@/lib/session";
import { prisma } from "@/lib/db";
import { logAudit } from "@/lib/auditLogger";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const config = await getAdminSecurityConfig();

    return NextResponse.json({
      success: true,
      credentials: {
        hasPassword: Boolean(config.loginPassword),
        securityPin: config.securityPin || "1234",
        privacyPassword: config.privacyPassword || "privacy@2026",
        updatedAt: config.updatedAt,
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: "Failed to fetch credentials status" },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const admin = await getAuthenticatedAdmin(req);
    const body = await req.json();
    const { loginPassword, securityPin, privacyPassword, name, email, phone } = body;

    const updates: any = {};
    if (typeof loginPassword === "string" && loginPassword.trim()) {
      updates.loginPassword = loginPassword.trim();
    }

    if (typeof privacyPassword === "string" && privacyPassword.trim()) {
      updates.privacyPassword = privacyPassword.trim();
    }

    if (securityPin !== undefined) {
      const cleanPin = securityPin.toString().replace(/\D/g, "").slice(0, 4);
      if (cleanPin.length !== 4) {
        return NextResponse.json(
          { success: false, error: "Security PIN must be exactly 4 digits." },
          { status: 400 }
        );
      }
      updates.securityPin = cleanPin;
    }

    const updatedConfig = await saveAdminSecurityConfig(updates);

    // Update in database admin user if available
    if (admin?.user?.id) {
      await prisma.user.update({
        where: { id: admin.user.id },
        data: {
          ...(updates.loginPassword ? { password: updates.loginPassword } : {}),
          ...(name ? { name } : {}),
          ...(email ? { email } : {}),
          ...(phone ? { phone: `+91 ${phone.replace(/\D/g, "").slice(-10)}` } : {}),
        },
      }).catch(() => {});

      logAudit({
        userId: admin.user.id,
        actorRole: "ADMIN",
        action: "ADMIN_CREDENTIALS_UPDATED",
        details: JSON.stringify({
          passwordUpdated: Boolean(updates.loginPassword),
          pinUpdated: Boolean(updates.securityPin),
        }),
        req,
      }).catch(() => {});
    }

    return NextResponse.json({
      success: true,
      message: "Admin Login Password, 4-Digit Security PIN & Privacy Password saved successfully!",
      credentials: {
        hasPassword: true,
        securityPin: updatedConfig.securityPin,
        privacyPassword: updatedConfig.privacyPassword,
        updatedAt: updatedConfig.updatedAt,
      },
    });
  } catch (error: any) {
    console.error("Credentials update error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to update admin credentials" },
      { status: 500 }
    );
  }
}
