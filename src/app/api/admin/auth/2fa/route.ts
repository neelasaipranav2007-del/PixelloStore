import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import {
  generateTotpSecret,
  verifyTotpToken,
  generateRecoveryCodes,
  verifyRecoveryCode,
  getTotpUri,
} from "@/lib/totp";
import {
  getAuthenticatedAdmin,
  createCustomerToken,
  verifyCustomerToken,
} from "@/lib/session";
import { enforceRateLimit } from "@/lib/rateLimit";
import { logAudit } from "@/lib/auditLogger";
import { safeErrorResponse } from "@/lib/errorHandler";

export const dynamic = "force-dynamic";

/**
 * GET /api/admin/auth/2fa
 * Checks whether 2FA is currently enabled for the admin
 */
export async function GET(req: Request) {
  try {
    const admin = await getAuthenticatedAdmin(req);
    if (!admin) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const setting = await prisma.systemSetting.findUnique({
      where: { key: `admin_2fa_${admin.user.id}` },
    });

    let enabled = false;
    if (setting?.value) {
      try {
        const parsed = JSON.parse(setting.value);
        enabled = Boolean(parsed.enabled);
      } catch {}
    }

    return NextResponse.json({
      success: true,
      enabled,
      adminId: admin.user.id,
    });
  } catch (error: any) {
    return safeErrorResponse(error, 500, "Error checking 2FA status");
  }
}

/**
 * POST /api/admin/auth/2fa
 * Handles:
 * - action: "setup" -> Generates secret and recovery codes
 * - action: "verify" -> Verifies code during login or enrollment
 * - action: "disable" -> Disables 2FA with verification
 */
export async function POST(req: Request) {
  try {
    // Rate limit 2FA attempts
    const rateLimitRes = enforceRateLimit(req, "totp");
    if (rateLimitRes) return rateLimitRes;

    const body = await req.json();
    const { action, code, tempToken, secret, plainRecoveryCodes } = body;

    // 1. Setup Action (Requires authenticated admin)
    if (action === "setup") {
      const admin = await getAuthenticatedAdmin(req);
      if (!admin) {
        return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
      }

      const newSecret = generateTotpSecret();
      const { plainCodes, hashedCodes } = generateRecoveryCodes(8);
      const uri = getTotpUri(admin.user.email || "admin@pixellostore.com", newSecret);

      return NextResponse.json({
        success: true,
        secret: newSecret,
        otpauthUri: uri,
        recoveryCodes: plainCodes,
        hashedRecoveryCodes: hashedCodes,
        message: "Scan the QR code or enter secret into your authenticator app, then submit a 6-digit code to activate.",
      });
    }

    // 2. Verify Action (During 2FA setup activation OR during login with tempToken)
    if (action === "verify") {
      const cleanCode = (code || "").toString().trim();
      if (!cleanCode) {
        return NextResponse.json({ success: false, error: "Please enter your 6-digit code or recovery code." }, { status: 400 });
      }

      // Case A: Completing 2FA Setup Activation (Admin is already logged in)
      const currentAdmin = await getAuthenticatedAdmin(req);
      if (currentAdmin && secret) {
        const isValid = verifyTotpToken(secret, cleanCode);
        if (!isValid) {
          return NextResponse.json({ success: false, error: "Invalid verification code. Please check your authenticator app." }, { status: 400 });
        }

        // Save enabled 2FA state
        const { hashedCodes } = generateRecoveryCodes(8);
        const configData = {
          enabled: true,
          secret,
          hashedRecoveryCodes: body.hashedRecoveryCodes || hashedCodes,
          activatedAt: new Date().toISOString(),
        };

        await prisma.systemSetting.upsert({
          where: { key: `admin_2fa_${currentAdmin.user.id}` },
          create: {
            key: `admin_2fa_${currentAdmin.user.id}`,
            value: JSON.stringify(configData),
          },
          update: {
            value: JSON.stringify(configData),
          },
        });

        logAudit({
          userId: currentAdmin.user.id,
          actorRole: "ADMIN",
          action: "ADMIN_2FA_ENABLED",
          req,
        }).catch(() => {});

        return NextResponse.json({
          success: true,
          enabled: true,
          message: "✓ Two-Factor Authentication has been successfully enabled for your Admin account!",
        });
      }

      // Case B: 2FA Login Challenge Verification (using tempToken)
      if (tempToken) {
        const payload = verifyCustomerToken(tempToken);
        if (!payload || !payload.userId || payload.role !== "ADMIN_2FA_PENDING") {
          return NextResponse.json({ success: false, error: "Invalid or expired 2FA session. Please log in again." }, { status: 401 });
        }

        const setting = await prisma.systemSetting.findUnique({
          where: { key: `admin_2fa_${payload.userId}` },
        });

        if (!setting?.value) {
          return NextResponse.json({ success: false, error: "2FA configuration not found for admin." }, { status: 400 });
        }

        const config = JSON.parse(setting.value);
        let verified = false;
        let usedRecovery = false;

        // Check TOTP code
        if (cleanCode.length === 6 && /^\d{6}$/.test(cleanCode)) {
          verified = verifyTotpToken(config.secret, cleanCode);
        }

        // Check recovery code if not 6-digit or failed
        if (!verified && config.hashedRecoveryCodes) {
          const recResult = verifyRecoveryCode(cleanCode, config.hashedRecoveryCodes);
          if (recResult.valid) {
            verified = true;
            usedRecovery = true;
            // Update remaining recovery codes
            config.hashedRecoveryCodes = recResult.remainingHashedCodes;
            await prisma.systemSetting.update({
              where: { key: `admin_2fa_${payload.userId}` },
              data: { value: JSON.stringify(config) },
            });
          }
        }

        if (!verified) {
          return NextResponse.json(
            { success: false, error: "Invalid 2FA code or recovery code. Please try again." },
            { status: 401 }
          );
        }

        // Issue Full Admin Token
        const finalToken = createCustomerToken({
          userId: payload.userId,
          phone: payload.phone,
          email: payload.email,
          name: payload.name || "Master Admin",
          role: "ADMIN",
        });

        logAudit({
          userId: payload.userId,
          actorRole: "ADMIN",
          action: usedRecovery ? "ADMIN_LOGIN_2FA_RECOVERY_CODE" : "ADMIN_LOGIN_2FA_SUCCESS",
          req,
        }).catch(() => {});

        const response = NextResponse.json({
          success: true,
          token: finalToken,
          admin: {
            id: payload.userId,
            name: payload.name,
            email: payload.email,
            phone: payload.phone,
            role: "ADMIN",
          },
          usedRecovery,
        });

        response.cookies.set("pixello_admin_token", finalToken, {
          path: "/",
          maxAge: 30 * 24 * 60 * 60,
          sameSite: "lax",
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
        });

        return response;
      }

      return NextResponse.json({ success: false, error: "Invalid request payload." }, { status: 400 });
    }

    // 3. Disable Action
    if (action === "disable") {
      const admin = await getAuthenticatedAdmin(req);
      if (!admin) {
        return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
      }

      const setting = await prisma.systemSetting.findUnique({
        where: { key: `admin_2fa_${admin.user.id}` },
      });

      if (setting?.value) {
        const config = JSON.parse(setting.value);
        const cleanCode = (code || "").toString().trim();
        const isValid = verifyTotpToken(config.secret, cleanCode);
        if (!isValid) {
          return NextResponse.json({ success: false, error: "Invalid current 2FA code." }, { status: 400 });
        }

        await prisma.systemSetting.delete({
          where: { key: `admin_2fa_${admin.user.id}` },
        });

        logAudit({
          userId: admin.user.id,
          actorRole: "ADMIN",
          action: "ADMIN_2FA_DISABLED",
          req,
        }).catch(() => {});
      }

      return NextResponse.json({ success: true, message: "Two-Factor Authentication disabled." });
    }

    return NextResponse.json({ success: false, error: "Unknown action" }, { status: 400 });
  } catch (error: any) {
    return safeErrorResponse(error, 500, "Error in 2FA service");
  }
}
