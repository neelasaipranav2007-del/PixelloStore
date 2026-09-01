import { NextResponse } from "next/server";
import { isDelhiveryConfigured, getMaskedToken } from "@/lib/delhivery";

export const dynamic = "force-dynamic";

export async function GET() {
  const configured = isDelhiveryConfigured();
  const masked = getMaskedToken();

  return NextResponse.json({
    success: true,
    configured,
    maskedToken: masked,
    carrierName: "Delhivery One B2C Express",
    serviceTypes: ["Surface", "Express", "SameDay"],
    status: configured ? "CONNECTED_ACTIVE" : "PENDING_TOKEN_SETUP",
    message: configured
      ? "Delhivery One API is connected and ready for live AWB generation & tracking."
      : "DELHIVERY_API_TOKEN is not yet set in .env.local. Please paste your token in .env.local.",
  });
}
