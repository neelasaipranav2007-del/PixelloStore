import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { portalEvents } from "@/lib/events";
import { mapUiStatusToDb } from "@/lib/orderStatus";
import { isDeliveryPortalEnabled } from "@/lib/deliveryConfig";
import { getAuthenticatedAdmin, getAuthenticatedDelivery } from "@/lib/session";
import { logAudit } from "@/lib/auditLogger";
import { safeErrorResponse } from "@/lib/errorHandler";

export const dynamic = "force-dynamic";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // 1. RBAC Check: Require Admin or Delivery Partner authorization
    const admin = await getAuthenticatedAdmin(req);
    const delivery = await getAuthenticatedDelivery(req);

    if (!admin && !delivery) {
      return NextResponse.json(
        { success: false, error: "Unauthorized. Admin or Delivery credentials required to update order status." },
        { status: 401 }
      );
    }

    const { id: rawOrderId } = await params;
    const orderId = decodeURIComponent(rawOrderId);
    const body = await req.json();
    const { status, note } = body;

    if (!status) {
      return NextResponse.json(
        { success: false, error: "Missing required status field" },
        { status: 400 }
      );
    }

    const dbStatus = mapUiStatusToDb(status);

    if (!isDeliveryPortalEnabled() && (dbStatus === "ASSIGNED_DELIVERY" || dbStatus === "OUT_FOR_DELIVERY" || dbStatus === "PICKED_UP")) {
      return NextResponse.json(
        { success: false, error: "Delivery operations are temporarily closed." },
        { status: 400 }
      );
    }

    const updatedOrder = await prisma.$transaction(async (tx) => {
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

      const order = await tx.order.update({
        where: { id: targetOrder.id },
        data: { status: dbStatus },
      });

      await tx.orderStatusHistory.create({
        data: {
          orderId: order.id,
          status: dbStatus,
          note: note || `Order status updated to ${status} by ${admin ? "Admin" : "Delivery Partner"}`,
        },
      });

      return order;
    });

    if (!updatedOrder) {
      return NextResponse.json({ success: false, error: "Order not found" }, { status: 404 });
    }

    logAudit({
      userId: admin?.user?.id || delivery?.user?.id,
      actorRole: admin ? "ADMIN" : "DELIVERY",
      action: "ORDER_STATUS_CHANGED",
      targetId: updatedOrder.id,
      details: { newStatus: dbStatus },
      req,
    }).catch(() => {});

    portalEvents.emit("order_change", { action: "STATUS_UPDATE", orderId: updatedOrder.id, status: dbStatus });

    return NextResponse.json({ success: true, order: updatedOrder });
  } catch (error: any) {
    return safeErrorResponse(error, 500, "Failed to update order status");
  }
}
