import { NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/session";
import { prisma } from "@/lib/db";
import { CURRENT_TERMS_VERSION } from "@/lib/termsData";

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

    return NextResponse.json({
      success: true,
      authenticated: true,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        mobile: (user.phone || "").replace(/\D/g, "").slice(-10),
        role: user.role,
        customerProfileId: user.customerProfile?.id,
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
