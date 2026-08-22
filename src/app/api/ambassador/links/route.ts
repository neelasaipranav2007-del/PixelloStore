import { NextResponse } from "next/server";
import { getAuthenticatedAmbassador } from "@/lib/session";
import QRCode from "qrcode";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const auth = await getAuthenticatedAmbassador(req);
    if (!auth || !auth.ambassador) {
      return NextResponse.json(
        { success: false, error: "Unauthorized. Please log in as an Ambassador." },
        { status: 401 }
      );
    }

    const { ambassador, user } = auth;

    const baseUrl = process.env.NEXTAUTH_URL || "https://pixellostore.com";
    const referralUrl = `${baseUrl}/ref/${ambassador.referralCode}`;

    // Generate scannable QR Code Data URL
    const qrCodeDataUrl = await QRCode.toDataURL(referralUrl, {
      width: 600,
      margin: 1,
      color: {
        dark: "#3A2B24",
        light: "#FFFFFF",
      },
    });

    return NextResponse.json({
      success: true,
      promoCode: ambassador.referralCode,
      referralUrl,
      discountPercent: "10% OFF",
      commissionPercent: `${Math.round((ambassador.commissionRate || 0.10) * 100)}%`,
      ambassadorName: user.name || "Campus Ambassador",
      college: ambassador.college || "Campus Partner",
      qrCodeDataUrl,
    });
  } catch (error: any) {
    console.error("GET /api/ambassador/links error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
