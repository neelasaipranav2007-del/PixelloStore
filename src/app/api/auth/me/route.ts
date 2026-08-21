import { NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/session";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const user = await getAuthenticatedUser(req);
    if (!user) {
      return NextResponse.json({ success: false, authenticated: false, error: "Unauthenticated" }, { status: 401 });
    }

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
    });
  } catch (error: any) {
    console.error("Error in /api/auth/me:", error);
    return NextResponse.json({ success: false, authenticated: false, error: error.message }, { status: 500 });
  }
}
