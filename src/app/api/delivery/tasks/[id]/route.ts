import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { portalEvents } from "@/lib/events";
import { OrderStatus } from "@prisma/client";
import { isDeliveryPortalEnabled } from "@/lib/deliveryConfig";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!isDeliveryPortalEnabled()) {
    return NextResponse.json(
      { 
        success: false, 
        error: "Delivery operations are temporarily closed.",
        closed: true 
      },
      { status: 403 }
    );
  }

  try {
    const { id } = await params;
    const body = await req.json();
    const { status, partnerName } = body;

    let dbStatus: OrderStatus = status as OrderStatus;
    if (status === "Accepted" || status === "PICKED_UP" || status === "Delivery Picked Up") dbStatus = "PICKED_UP";
    if (status === "Out for Delivery" || status === "OUT_FOR_DELIVERY") dbStatus = "OUT_FOR_DELIVERY";
    if (status === "Delivered" || status === "DELIVERED") dbStatus = "DELIVERED";

    const updated = await prisma.$transaction(async (tx) => {
      const order = await tx.order.update({
        where: { id },
        data: { status: dbStatus },
      });

      await tx.deliveryInfo.upsert({
        where: { orderId: id },
        update: {
          deliveryPartnerName: partnerName || "Ramesh Kumar",
          ...(dbStatus === "PICKED_UP" ? { pickupTime: new Date() } : {}),
          ...(dbStatus === "DELIVERED" ? { deliveryTime: new Date() } : {}),
        },
        create: {
          orderId: id,
          deliveryPartnerName: partnerName || "Ramesh Kumar",
          ...(dbStatus === "PICKED_UP" ? { pickupTime: new Date() } : {}),
          ...(dbStatus === "DELIVERED" ? { deliveryTime: new Date() } : {}),
        },
      });

      await tx.orderStatusHistory.create({
        data: {
          orderId: id,
          status: dbStatus,
          note: `Delivery status updated to ${status} by ${partnerName || "Delivery Partner"}`,
        },
      });

      return order;
    });

    portalEvents.emit("order_change", { action: "STATUS_UPDATE", orderId: id, status: dbStatus });
    return NextResponse.json({ success: true, task: updated });
  } catch (error: any) {
    console.error("Error updating delivery task:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
