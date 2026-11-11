import { NextResponse } from "next/server";
import { getAuthenticatedUser, createCustomerToken } from "@/lib/session";
import { prisma } from "@/lib/db";
import { CURRENT_TERMS_VERSION } from "@/lib/termsData";
import { portalEvents } from "@/lib/events";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const user = await getAuthenticatedUser(req);
    if (!user) {
      return NextResponse.json({ success: false, authenticated: false, error: "Unauthenticated" }, { status: 401 });
    }

    // Check if user has accepted the required terms version
    const termsRecord = await prisma.termsAcceptance.findFirst({
      where: {
        userId: user.id,
        version: CURRENT_TERMS_VERSION,
      },
      orderBy: { acceptedAt: "desc" },
    });

    // Check for college / birthday / loved ones / extra customer metadata
    let college = "";
    let birthday = "";
    let lovedOnes: any[] = [];
    try {
      const meta = await prisma.systemSetting.findUnique({
        where: { key: `customer_meta_${user.id}` },
      });
      if (meta?.value) {
        const parsedMeta = JSON.parse(meta.value);
        college = parsedMeta.college || "";
        birthday = parsedMeta.birthday || "";
        lovedOnes = Array.isArray(parsedMeta.lovedOnes) ? parsedMeta.lovedOnes : [];
      }
    } catch (e) {}

    // Check if email is an auto-generated dummy or a real email set once by customer
    const isDummyEmail = !user.email || user.email.endsWith("@pixello.store");
    const cleanEmail = isDummyEmail ? "" : user.email;
    const isEmailLocked = !isDummyEmail;

    return NextResponse.json({
      success: true,
      authenticated: true,
      user: {
        id: user.id,
        name: user.name,
        email: cleanEmail,
        isEmailLocked,
        phone: user.phone,
        mobile: (user.phone || "").replace(/\D/g, "").slice(-10),
        role: user.role,
        customerProfileId: user.customerProfile?.id,
        college,
        birthday,
        lovedOnes,
      },
      termsAccepted: !!termsRecord,
      termsAcceptedAt: termsRecord?.acceptedAt ?? null,
      currentTermsVersion: CURRENT_TERMS_VERSION,
    });
  } catch (error: any) {
    console.error("Error in /api/auth/me:", error);
    return NextResponse.json({ success: false, authenticated: false, error: error.message }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const user = await getAuthenticatedUser(req);
    if (!user) {
      return NextResponse.json({ success: false, error: "Unauthenticated" }, { status: 401 });
    }

    const body = await req.json();
    const { name, email, phone, mobile, college, birthday, lovedOnes } = body;

    const cleanMobile = (mobile || phone || "").replace(/\D/g, "").slice(-10);
    const cleanPhone = cleanMobile ? `+91 ${cleanMobile}` : user.phone;

    // Check if phone is in use by another user
    if (cleanPhone && cleanPhone !== user.phone) {
      const conflict = await prisma.user.findFirst({
        where: {
          phone: cleanPhone,
          id: { not: user.id },
        },
      });
      if (conflict) {
        return NextResponse.json({ success: false, error: "Phone number already in use by another account." }, { status: 400 });
      }
    }

    // One-Time Email Writing:
    // Only allow setting email if existing email was empty or an auto-generated dummy @pixello.store
    const existingIsDummy = !user.email || user.email.endsWith("@pixello.store");
    let resolvedEmail = user.email;

    if (existingIsDummy && email && typeof email === "string") {
      const cleanInputEmail = email.trim().toLowerCase();
      if (cleanInputEmail && !cleanInputEmail.endsWith("@pixello.store") && cleanInputEmail.includes("@")) {
        // Check if email already in use by another user
        const conflict = await prisma.user.findFirst({
          where: {
            email: cleanInputEmail,
            id: { not: user.id },
          },
        });
        if (conflict) {
          return NextResponse.json({ success: false, error: "This email address is already registered to another account." }, { status: 400 });
        }
        resolvedEmail = cleanInputEmail;
      }
    } else if (existingIsDummy && (!email || email.trim().endsWith("@pixello.store"))) {
      resolvedEmail = null;
    }

    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: {
        name: name !== undefined ? (name ? name.trim() : null) : user.name,
        email: resolvedEmail,
        phone: user.phone || cleanPhone,
      },
      include: { customerProfile: true },
    });

    // Save extra metadata like college, birthday, and loved ones in systemSetting
    let savedLovedOnes = [];
    if (college !== undefined || birthday !== undefined || lovedOnes !== undefined) {
      try {
        const existing = await prisma.systemSetting.findUnique({
          where: { key: `customer_meta_${user.id}` },
        });
        const parsedMeta = existing?.value ? JSON.parse(existing.value) : {};
        if (college !== undefined) parsedMeta.college = college ? college.trim() : "";
        if (birthday !== undefined) parsedMeta.birthday = birthday ? birthday.trim() : "";
        if (lovedOnes !== undefined) parsedMeta.lovedOnes = Array.isArray(lovedOnes) ? lovedOnes : [];
        savedLovedOnes = parsedMeta.lovedOnes || [];

        await prisma.systemSetting.upsert({
          where: { key: `customer_meta_${user.id}` },
          create: {
            key: `customer_meta_${user.id}`,
            value: JSON.stringify(parsedMeta),
          },
          update: {
            value: JSON.stringify(parsedMeta),
          },
        });
      } catch (e) {
        console.warn("Failed to persist customer meta:", e);
      }
    }

    // Update customerName across orders so past/active orders reflect new name
    if (name && name.trim()) {
      try {
        const orConditions: Array<{ customerProfileId?: string; customerPhone?: string }> = [];
        if (updatedUser.customerProfile?.id) {
          orConditions.push({ customerProfileId: updatedUser.customerProfile.id });
        }
        if (cleanPhone) {
          orConditions.push({ customerPhone: cleanPhone });
        }

        if (orConditions.length > 0) {
          await prisma.order.updateMany({
            where: {
              OR: orConditions,
            },
            data: {
              customerName: name.trim(),
            },
          });
        }
      } catch (err) {
        console.warn("Failed to sync order customerName:", err);
      }
    }

    portalEvents.emit("customer_change", { action: "UPDATE", user: updatedUser });

    // Generate fresh auth token
    const newToken = createCustomerToken({
      userId: updatedUser.id,
      role: updatedUser.role,
      phone: updatedUser.phone,
      email: updatedUser.email,
      name: updatedUser.name,
    });

    const isNewEmailLocked = !!(resolvedEmail && !resolvedEmail.endsWith("@pixello.store"));
    const safeReturnedEmail = isNewEmailLocked ? resolvedEmail : "";

    const response = NextResponse.json({
      success: true,
      user: {
        id: updatedUser.id,
        name: updatedUser.name,
        email: safeReturnedEmail,
        isEmailLocked: isNewEmailLocked,
        phone: updatedUser.phone,
        mobile: cleanMobile,
        role: updatedUser.role,
        customerProfileId: updatedUser.customerProfile?.id,
        college: college !== undefined ? college : "",
        birthday: birthday !== undefined ? birthday : "",
        lovedOnes: savedLovedOnes,
      },
      token: newToken,
    });

    response.cookies.set("pixello_auth_token", newToken, {
      path: "/",
      maxAge: 30 * 24 * 60 * 60,
      sameSite: "lax",
    });

    return response;
  } catch (error: any) {
    console.error("Error updating profile in /api/auth/me:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
