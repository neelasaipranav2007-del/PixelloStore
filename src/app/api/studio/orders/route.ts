import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json({
    success: true,
    orders: [],
    message: "Photo Studio API is retired. Orders and production are managed centrally via Admin Portal API (/api/admin/orders).",
  });
}

export async function POST() {
  return NextResponse.json({
    success: false,
    error: "Photo Studio API is retired. Please use Admin Portal API for order status updates.",
  }, { status: 410 });
}
