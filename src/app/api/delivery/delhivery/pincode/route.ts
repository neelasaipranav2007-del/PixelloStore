import { NextResponse } from "next/server";
import { checkDelhiveryPincode } from "@/lib/delhivery";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const pincode = searchParams.get("pincode") || "";

    if (!pincode) {
      return NextResponse.json({ success: false, error: "Missing pincode parameter" }, { status: 400 });
    }

    const result = await checkDelhiveryPincode(pincode);
    return NextResponse.json({ success: true, result });
  } catch (error: any) {
    console.error("Delhivery pincode serviceability error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
