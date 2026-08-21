import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { portalEvents } from "@/lib/events";
import { OrderStatus } from "@prisma/client";

export const dynamic = "force-dynamic";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: orderId } = await params;
    const body = await req.json();
    const { status, note } = body;

    if (!status) {
      return NextResponse.json(
        { success: false, error: "Missing required status field" },
        { status: 400 }
      );
    }

    // Map UI status strings to DB OrderStatus enum if needed
    let dbStatus: OrderStatus = status as OrderStatus;
    if (status === "Processing") dbStatus = "PLACED";
    if (status === "Printing") dbStatus = "PRINTING";
    if (status === "Packed") dbStatus = "QUALITY_CHECK";
    if (status === "Delivery Picked Up") dbStatus = "PICKED_UP";
    if (status === "Out for Delivery") dbStatus = "OUT_FOR_DELIVERY";
    if (status === "Delivered") dbStatus = "DELIVERED";
    if (status === "Cancelled") dbStatus = "CANCELLED";

    const updatedOrder = await prisma.$transaction(async (tx) => {
      // 1. Update Order Status
      const order = await tx.order.update({
        where: { id: orderId },
        data: {
          status: dbStatus,
        },
      });

      // 2. Append OrderStatusHistory Entry
      await tx.orderStatusHistory.create({
        data: {
          orderId: order.id,
          status: dbStatus,
          note: note || `Order status updated to ${status}`,
        },
      });

      // 3. Create or update Delivery assignment when READY_FOR_PICKUP / PICKED_UP
      if (dbStatus === "READY_FOR_PICKUP" || dbStatus === "PICKED_UP" || dbStatus === "OUT_FOR_DELIVERY" || dbStatus === "DELIVERED") {
        await tx.deliveryInfo.upsert({
          where: { orderId: order.id },
          update: {
            deliveryPartnerName: "Ramesh Kumar",
            ...(dbStatus === "PICKED_UP" ? { pickupTime: new Date() } : {}),
            ...(dbStatus === "DELIVERED" ? { deliveryTime: new Date() } : {}),
          },
          create: {
            orderId: order.id,
            deliveryPartnerName: "Ramesh Kumar",
            ...(dbStatus === "PICKED_UP" ? { pickupTime: new Date() } : {}),
            ...(dbStatus === "DELIVERED" ? { deliveryTime: new Date() } : {}),
          },
        });
      }

      return order;
    });

    // Broadcast real-time update
    portalEvents.emit("order_change", { action: "STATUS_UPDATE", orderId: updatedOrder.id, status: dbStatus });

    return NextResponse.json({ success: true, order: updatedOrder });
  } catch (error: any) {
    console.error("Error updating order status:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
