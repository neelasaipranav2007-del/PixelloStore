import { NextResponse } from "next/server";
import { verifyPrivacyPassword } from "@/lib/adminSecurity";
import { clearSecurityFailures } from "@/lib/securityMonitor";
import { logAudit } from "@/lib/auditLogger";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { privacyPassword } = body;

    const isMatch = await verifyPrivacyPassword(privacyPassword);

    if (!isMatch) {
      return NextResponse.json(
        {
          success: false,
          error: "Incorrect Privacy Password. Please enter the valid privacy key.",
        },
        { status: 401 }
      );
    }

    // Clear locked security attempts
    clearSecurityFailures("admin", "admin_auth");

    logAudit({
      userId: "master_admin",
      actorRole: "ADMIN",
      action: "ADMIN_PORTAL_UNLOCKED_WITH_PRIVACY_PASSWORD",
      details: { unlockedAt: new Date().toISOString() },
      req,
    }).catch(() => {});

    return NextResponse.json({
      success: true,
      message: "Admin Portal unlocked successfully! You can now log in.",
    });
  } catch (error: any) {
    console.error("Unlock API error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to process unlock request." },
      { status: 500 }
    );
  }
}
