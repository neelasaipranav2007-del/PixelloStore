import { NextResponse } from "next/server";
import { syncDelhiveryTracking } from "@/lib/delhivery";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const rawBody = await req.json().catch(() => ({}));
    console.log("Delhivery webhook payload received:", JSON.stringify(rawBody));

    // Delhivery Webhook can send AWB, waybill, or Shipment object
    const waybill = rawBody.AWB || rawBody.waybill || rawBody.Shipment?.AWB || rawBody.refnum || rawBody.order;

    if (waybill) {
      const result = await syncDelhiveryTracking(String(waybill));
      return NextResponse.json({ success: true, processedWaybill: waybill, status: result.currentStatus });
    }

    return NextResponse.json({ success: true, message: "Webhook received but no recognized waybill in payload." });
  } catch (error: any) {
    console.error("Delhivery webhook processing error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
