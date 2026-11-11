import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { createCustomerToken } from "@/lib/session";
import { enforceRateLimit } from "@/lib/rateLimit";
import {
  recordSecurityFailure,
  clearSecurityFailures,
  isSecurityLocked,
} from "@/lib/securityMonitor";
import { safeErrorResponse } from "@/lib/errorHandler";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    // 1. Rate Limiting Check
    const rateLimitRes = enforceRateLimit(req, "auth");
    if (rateLimitRes) return rateLimitRes;

    const body = await req.json();
    const { mobile, phone, pin, password, action, termsAccepted } = body;

    const rawMobile = mobile || phone || "";
    const cleanMobile = rawMobile.replace(/\D/g, "").slice(-10);
    const cleanPhone = cleanMobile ? `+91 ${cleanMobile}` : "";

    if (!cleanMobile) {
      return NextResponse.json(
        { success: false, error: "Please enter a valid 10-digit mobile number." },
        { status: 400 }
      );
    }

    // 2. Suspicious Login Brute-force Lockout Check
    const lockStatus = isSecurityLocked(cleanMobile, "customer_auth");
    if (lockStatus.locked) {
      return NextResponse.json(
        {
          success: false,
          error: `Account temporarily locked due to multiple failed login attempts. Please wait ${lockStatus.remainingSec} seconds.`,
          locked: true,
          remainingSec: lockStatus.remainingSec,
        },
        { status: 429 }
      );
    }

    // Check if customer account is marked Inactive by Admin in system settings
    const statusSetting = await prisma.systemSetting.findUnique({
      where: { key: "customer_statuses" },
    });
    let statusMap: Record<string, string> = {};
    if (statusSetting?.value) {
      try {
        statusMap = JSON.parse(statusSetting.value);
      } catch (e) {}
    }

    // 3. Handle Forgot / Reset PIN Action
    if (action === "forgot_pin" || action === "reset_pin") {
      let existingUser = await prisma.user.findFirst({
        where: {
          OR: [
            { phone: cleanPhone },
            { phone: cleanMobile },
            { phone: { contains: cleanMobile } },
            { email: `${cleanMobile}@pixello.store` },
          ],
        },
      });

      if (!existingUser) {
        const matchedOrder = await prisma.order.findFirst({
          where: {
            customerPhone: { contains: cleanMobile },
          },
        });

        if (matchedOrder) {
          existingUser = await prisma.user.create({
            data: {
              name: matchedOrder.customerName || "Customer",
              phone: cleanPhone,
              email: null,
              password: "1234",
              role: "CUSTOMER",
              customerProfile: { create: {} },
            },
          });
        }
      }

      if (!existingUser) {
        return NextResponse.json(
          {
            success: false,
            notRegistered: true,
            error: `❌ Mobile number +91 ${cleanMobile} is not registered! Please switch to the 'Register' tab to create an account.`,
          },
          { status: 404 }
        );
      }

      // Reset PIN to default temporary PIN 1234
      await prisma.user.update({
        where: { id: existingUser.id },
        data: { password: "1234" },
      });

      clearSecurityFailures(cleanMobile, "customer_auth");

      return NextResponse.json({
        success: true,
        message: `✓ Temporary PIN (1234) set for +91 ${cleanMobile}. Click 'Continue to Store' to sign in!`,
        pin: "1234",
      });
    }

    // 4. Standard Sign In Flow
    const submittedPin = (pin || password || "").toString().trim();
    if (!submittedPin) {
      return NextResponse.json(
        { success: false, error: "Please enter your 4-digit security PIN." },
        { status: 400 }
      );
    }

    let user = await prisma.user.findFirst({
      where: {
        OR: [
          { phone: cleanPhone },
          { phone: cleanMobile },
          { phone: { contains: cleanMobile } },
          { email: `${cleanMobile}@pixello.store` },
        ],
      },
      include: {
        customerProfile: true,
      },
    });

    // Check account status
    if (
      (user && statusMap[user.id] === "Inactive") ||
      (cleanMobile && statusMap[cleanMobile] === "Inactive")
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            "❌ This customer account is INACTIVE / SUSPENDED by Admin. Please contact customer support.",
        },
        { status: 403 }
      );
    }

    if (!user) {
      const pastOrder = await prisma.order.findFirst({
        where: {
          customerPhone: { contains: cleanMobile },
        },
        orderBy: { createdAt: "desc" },
      });

      if (pastOrder) {
        user = await prisma.user.create({
          data: {
            name: pastOrder.customerName || `Customer (${cleanMobile.slice(-4)})`,
            phone: cleanPhone,
            email: null,
            password: submittedPin,
            role: "CUSTOMER",
            customerProfile: { create: {} },
          },
          include: { customerProfile: true },
        });

        if (user.customerProfile?.id) {
          await prisma.order.updateMany({
            where: {
              customerPhone: { contains: cleanMobile },
              customerProfileId: null,
            },
            data: {
              customerProfileId: user.customerProfile.id,
            },
          });
        }
      } else {
        return NextResponse.json(
          {
            success: false,
            notRegistered: true,
            error:
              "❌ Mobile number not registered! Please switch to 'Register' tab to create your account.",
          },
          { status: 404 }
        );
      }
    }

    // 5. Strict Credential Validation
    const storedPin = user.password;
    const isValidPin = !storedPin || storedPin === submittedPin;

    if (!isValidPin) {
      recordSecurityFailure(cleanMobile, "customer_auth", req);
      return NextResponse.json(
        {
          success: false,
          error:
            "❌ Incorrect 4-digit Security PIN! Please enter your registered PIN or click 'Forgot PIN?'.",
        },
        { status: 401 }
      );
    }

    // Clear failed attempts on valid login
    clearSecurityFailures(cleanMobile, "customer_auth");

    if (!user.password) {
      await prisma.user.update({
        where: { id: user.id },
        data: { password: submittedPin },
      });
    }

    if (!user.customerProfile) {
      const profile = await prisma.customerProfile.create({
        data: { userId: user.id },
      });
      user.customerProfile = profile;
    }

    // Terms validation
    const existingTermsAcceptance = await prisma.termsAcceptance.findFirst({
      where: {
        userId: user.id,
        version: "v1.0",
      },
    });

    const isExplicitlyAccepted = termsAccepted === true || termsAccepted === "true";
    if (!existingTermsAcceptance && !isExplicitlyAccepted) {
      return NextResponse.json(
        {
          success: false,
          error: "Please accept the Terms & Conditions to continue.",
          termsRequired: true,
        },
        { status: 400 }
      );
    }

    if (isExplicitlyAccepted) {
      try {
        await prisma.termsAcceptance.create({
          data: {
            userId: user.id,
            version: "v1.0",
            policyVersion: "v1.0",
            context: "AUTH_SIGNIN",
            acceptedAt: new Date(),
          },
        });
      } catch (err) {}
    }

    const rawEmail = (user.email || "").trim();
    const cleanUserEmail = rawEmail.endsWith("@pixello.store") ? "" : rawEmail;
    const isEmailLocked = !!cleanUserEmail;

    const token = createCustomerToken({
      userId: user.id,
      role: user.role,
      phone: user.phone || cleanPhone,
      email: cleanUserEmail,
      name: user.name || "Customer",
    });

    const response = NextResponse.json({
      success: true,
      user: {
        id: user.id,
        name: user.name || "Customer",
        email: cleanUserEmail,
        isEmailLocked,
        phone: user.phone || cleanPhone,
        mobile: cleanMobile,
        role: user.role,
        customerProfileId: user.customerProfile?.id,
      },
      token,
    });

    response.cookies.set("pixello_auth_token", token, {
      path: "/",
      maxAge: 30 * 24 * 60 * 60,
      sameSite: "lax",
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
    });

    return response;
  } catch (error: any) {
    return safeErrorResponse(error, 500, "Failed to authenticate customer.");
  }
}
