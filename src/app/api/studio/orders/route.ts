import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const orders = await prisma.order.findMany({
      include: {
        items: true,
        history: true,
        transaction: true,
      },
      orderBy: { createdAt: "desc" },
    });

    const formatted = orders.map((o) => ({
      id: o.id,
      customerName: o.customerName,
      customerPhone: o.customerPhone,
      date: o.createdAt.toISOString().split("T")[0],
      totalAmount: o.totalAmount,
      status: o.status,
      assignedStudio: o.assignedStudio || "Studio Alpha (Central Powai Branch)",
      shippingAddress: o.shippingAddress,
      items: o.items.map((it) => {
        let photos = [];
        if (it.customizationDetails) {
          try {
            photos = JSON.parse(it.customizationDetails).photos || [];
          } catch (e) {}
        }
        return {
          name: it.name,
          size: it.size,
          quantity: it.quantity,
          price: it.price,
          image: it.image || "/images/wooden_frame_main.png",
          photos,
        };
      }),
      history: o.history,
    }));

    return NextResponse.json({ success: true, orders: formatted });
  } catch (error: any) {
    console.error("Error fetching studio orders:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
