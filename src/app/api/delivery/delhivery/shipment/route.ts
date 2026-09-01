import { NextResponse } from "next/server";
import { createDelhiveryShipment } from "@/lib/delhivery";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { orderId } = body;

    if (!orderId) {
      return NextResponse.json({ success: false, error: "Missing required orderId field" }, { status: 400 });
    }

    const result = await createDelhiveryShipment(orderId);
    return NextResponse.json({ success: true, shipment: result });
  } catch (error: any) {
    console.error("Delhivery shipment creation error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
