import { NextResponse } from "next/server";
import { syncDelhiveryTracking, syncAllActiveShipments } from "@/lib/delhivery";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const { waybill, orderId } = body;

    if (waybill || orderId) {
      const result = await syncDelhiveryTracking(waybill || orderId);
      return NextResponse.json({
        success: true,
        tracking: result,
        timestamp: result.lastSyncedAt,
        message: "Successfully synchronized order with Delhivery One.",
      });
    }

    const allSync = await syncAllActiveShipments();
    return NextResponse.json({
      success: true,
      syncedCount: allSync.syncedCount,
      timestamp: allSync.timestamp,
      message: `Successfully synchronized ${allSync.syncedCount} active shipments with Delhivery One.`,
    });
  } catch (error: any) {
    console.error("Delhivery synchronization API error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
