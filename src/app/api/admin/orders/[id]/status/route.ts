import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { portalEvents } from "@/lib/events";
import { getAuthenticatedAdmin } from "@/lib/session";
import { OrderStatus } from "@prisma/client";

export const dynamic = "force-dynamic";

function mapUiStatusToDb(uiStatus: string): OrderStatus {
  const s = (uiStatus || "").trim().toUpperCase();
  if (s === "DELIVERED") return "DELIVERED";
  if (s === "CANCELLED" || s === "CANCELED") return "CANCELLED";
  if (s === "OUT FOR DELIVERY" || s === "OUT_FOR_DELIVERY") return "OUT_FOR_DELIVERY";
  if (s === "DELIVERY PICKED UP" || s === "PICKED_UP" || s === "PICKED UP") return "PICKED_UP";
  if (s === "PACKED" || s === "QUALITY_CHECK") return "QUALITY_CHECK";
  if (s === "PRINTING") return "PRINTING";
  if (s === "REPLACEMENT" || s === "REPLACEMENT REQUESTED" || s === "REPLACEMENT_REQUESTED") return "REPLACEMENT_REQUESTED";
  return "PLACED";
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const admin = await getAuthenticatedAdmin(req);
    if (!admin) {
      return NextResponse.json(
        { success: false, error: "Unauthorized. Admin privileges required." },
        { status: 401 }
      );
    }

    const { id: rawOrderId } = await params;
    const orderId = decodeURIComponent(rawOrderId);
    const body = await req.json();
    const { status, note, deliveryPartnerName } = body;

    if (!status) {
      return NextResponse.json(
        { success: false, error: "Missing required status field" },
        { status: 400 }
      );
    }

    const dbStatus = mapUiStatusToDb(status);

    const updatedOrder = await prisma.$transaction(async (tx) => {
      // 1. Find Order by exact ID or case-insensitive match
      let targetOrder = await tx.order.findUnique({
        where: { id: orderId },
      });

      if (!targetOrder) {
        targetOrder = await tx.order.findFirst({
          where: {
            OR: [
              { id: orderId.toUpperCase() },
              { id: orderId.toLowerCase() },
              { id: { contains: orderId } },
            ],
          },
        });
      }

      if (!targetOrder) {
        return null;
      }

      // 2. Update Order Status
      const order = await tx.order.update({
        where: { id: targetOrder.id },
        data: {
          status: dbStatus,
        },
      });

      // 3. Append OrderStatusHistory Entry
      await tx.orderStatusHistory.create({
        data: {
          orderId: order.id,
          status: dbStatus,
          note: note || `Order status updated to ${status} by Admin`,
        },
      });

      // 4. Update Delivery partner assignment if applicable
      const riderName = deliveryPartnerName || "Ramesh Kumar";
      if (dbStatus === "PICKED_UP" || dbStatus === "OUT_FOR_DELIVERY" || dbStatus === "DELIVERED") {
        await tx.deliveryInfo.upsert({
          where: { orderId: order.id },
          update: {
            deliveryPartnerName: riderName,
            ...(dbStatus === "PICKED_UP" ? { pickupTime: new Date() } : {}),
            ...(dbStatus === "DELIVERED" ? { deliveryTime: new Date() } : {}),
          },
          create: {
            orderId: order.id,
            deliveryPartnerName: riderName,
            ...(dbStatus === "PICKED_UP" ? { pickupTime: new Date() } : {}),
            ...(dbStatus === "DELIVERED" ? { deliveryTime: new Date() } : {}),
          },
        });
      }

      return order;
    });

    if (!updatedOrder) {
      return NextResponse.json(
        { success: false, error: `Order #${orderId} not found in database` },
        { status: 404 }
      );
    }

    // Broadcast real-time update to all listeners
    portalEvents.emit("order_change", { action: "STATUS_UPDATE", orderId: updatedOrder.id, status: dbStatus });
    portalEvents.emit("order_update", { action: "STATUS_UPDATE", orderId: updatedOrder.id, status: dbStatus });

    return NextResponse.json({ success: true, order: updatedOrder });
  } catch (error: any) {
    console.error("Admin order status update error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
