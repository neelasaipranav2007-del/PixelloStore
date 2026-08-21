import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const orders = await prisma.order.findMany({
      include: {
        items: true,
        deliveryInfo: true,
      },
      orderBy: { createdAt: "desc" },
    });

    const tasks = orders.map((o) => ({
      id: o.id,
      orderId: o.id,
      customerName: o.customerName,
      customerPhone: o.customerPhone,
      address: o.shippingAddress,
      totalAmount: o.totalAmount,
      status: o.status,
      assignedPartner: o.deliveryInfo?.deliveryPartnerName || "Ramesh Kumar",
      pickupTime: o.deliveryInfo?.pickupTime,
      deliveryTime: o.deliveryInfo?.deliveryTime,
      items: o.items.map((it) => ({
        name: it.name,
        size: it.size,
        quantity: it.quantity,
      })),
    }));

    return NextResponse.json({ success: true, tasks });
  } catch (error: any) {
    console.error("Error fetching delivery tasks:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
