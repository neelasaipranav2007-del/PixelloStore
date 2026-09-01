import { NextResponse } from "next/server";
import { syncDelhiveryTracking } from "@/lib/delhivery";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const waybill = searchParams.get("waybill") || searchParams.get("orderId") || "";

    if (!waybill) {
      return NextResponse.json({ success: false, error: "Missing waybill or orderId parameter" }, { status: 400 });
    }

    const tracking = await syncDelhiveryTracking(waybill);
    return NextResponse.json({ success: true, tracking });
  } catch (error: any) {
    console.error("Delhivery tracking error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
