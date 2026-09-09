import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { portalEvents } from "@/lib/events";
import { getAuthenticatedAdmin } from "@/lib/session";
import { mapUiStatusToDb } from "@/lib/orderStatus";
import { isDeliveryPortalEnabled } from "@/lib/deliveryConfig";

export const dynamic = "force-dynamic";

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
    const { 
      status, 
      note, 
      deliveryPartnerName, 
      deliveryProvider, 
      trackingId, 
      awbNumber, 
      estimatedDeliveryDate, 
      trackingUrl 
    } = body;

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

      const dbStatus = status ? mapUiStatusToDb(status) : targetOrder.status;

      if (status && !isDeliveryPortalEnabled() && (dbStatus === "DELIVERY_ASSIGNED" || dbStatus === "ASSIGNED_DELIVERY" || dbStatus === "OUT_FOR_DELIVERY" || dbStatus === "PICKED_UP" || dbStatus === "IN_TRANSIT")) {
        throw new Error("Delivery operations are temporarily closed.");
      }

      // 2. Update Order Status if provided
      const order = status ? await tx.order.update({
        where: { id: targetOrder.id },
        data: {
          status: dbStatus,
        },
      }) : targetOrder;

      // 3. Append OrderStatusHistory Entry if status updated
      if (status) {
        await tx.orderStatusHistory.create({
          data: {
            orderId: order.id,
            status: dbStatus,
            note: note || `Order status updated to ${status} by Admin`,
          },
        });
      }

      // 4. Update DeliveryInfo in Prisma
      const provider = deliveryProvider || deliveryPartnerName || "Delhivery";
      const awb = awbNumber || trackingId || null;
      const trackId = trackingId || awbNumber || null;
      const estDate = estimatedDeliveryDate ? new Date(estimatedDeliveryDate) : null;
      const now = new Date();

      const deliveryUpdatePayload: Record<string, unknown> = {
        deliveryPartnerName: provider,
        deliveryProvider: provider,
        ...(awb ? { awbNumber: awb, waybill: awb } : {}),
        ...(trackId ? { trackingId: trackId } : {}),
        ...(estDate ? { estimatedDeliveryDate: estDate } : {}),
        ...(trackingUrl ? { trackingUrl } : (awb ? { trackingUrl: `https://www.delhivery.com/track/package/${awb}` } : {})),
        ...(dbStatus === "PICKED_UP" || dbStatus === "IN_TRANSIT" || dbStatus === "DELIVERY_ASSIGNED" ? { shippedAt: now, pickupTime: now } : {}),
        ...(dbStatus === "OUT_FOR_DELIVERY" ? { outForDeliveryAt: now } : {}),
        ...(dbStatus === "DELIVERED" || dbStatus === "COMPLETED" ? { deliveredAt: now, deliveryTime: now } : {}),
      };

      await tx.deliveryInfo.upsert({
        where: { orderId: order.id },
        update: deliveryUpdatePayload,
        create: {
          orderId: order.id,
          ...deliveryUpdatePayload,
        },
      });

      return order;
    });

    if (!updatedOrder) {
      return NextResponse.json(
        { success: false, error: `Order #${orderId} not found in database` },
        { status: 404 }
      );
    }

    // Broadcast real-time update to all listeners
    portalEvents.emit("order_change", { action: "STATUS_UPDATE", orderId: updatedOrder.id, status: updatedOrder.status });
    portalEvents.emit("order_update", { action: "STATUS_UPDATE", orderId: updatedOrder.id, status: updatedOrder.status });

    return NextResponse.json({ success: true, order: updatedOrder });
  } catch (error: unknown) {
    const err = error as Error;
    console.error("Admin order status update error:", err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
