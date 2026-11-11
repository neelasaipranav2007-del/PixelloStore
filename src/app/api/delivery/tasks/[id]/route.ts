import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { portalEvents } from "@/lib/events";
import { OrderStatus } from "@prisma/client";
import { isDeliveryPortalEnabled } from "@/lib/deliveryConfig";
import { getAuthenticatedDelivery, getAuthenticatedAdmin } from "@/lib/session";
import { safeErrorResponse } from "@/lib/errorHandler";
import { logAudit } from "@/lib/auditLogger";

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
    // RBAC: Require Delivery Partner or Admin authorization
    const delivery = await getAuthenticatedDelivery(req);
    const admin = await getAuthenticatedAdmin(req);

    if (!delivery && !admin) {
      return NextResponse.json(
        { success: false, error: "Unauthorized. Delivery partner privileges required." },
        { status: 401 }
      );
    }

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
          deliveryPartnerName: partnerName || (delivery?.user?.name || "Ramesh Kumar"),
          ...(dbStatus === "PICKED_UP" ? { pickupTime: new Date() } : {}),
          ...(dbStatus === "DELIVERED" ? { deliveryTime: new Date() } : {}),
        },
        create: {
          orderId: id,
          deliveryPartnerName: partnerName || (delivery?.user?.name || "Ramesh Kumar"),
          ...(dbStatus === "PICKED_UP" ? { pickupTime: new Date() } : {}),
          ...(dbStatus === "DELIVERED" ? { deliveryTime: new Date() } : {}),
        },
      });

      await tx.orderStatusHistory.create({
        data: {
          orderId: id,
          status: dbStatus,
          note: `Delivery status updated to ${status} by ${partnerName || delivery?.user?.name || "Delivery Partner"}`,
        },
      });

      return order;
    });

    logAudit({
      userId: delivery?.user?.id || admin?.user?.id,
      actorRole: delivery ? "DELIVERY" : "ADMIN",
      action: "DELIVERY_TASK_STATUS_UPDATED",
      targetId: id,
      details: { status: dbStatus },
      req,
    }).catch(() => {});

    portalEvents.emit("order_change", { action: "STATUS_UPDATE", orderId: id, status: dbStatus });

    return NextResponse.json({ success: true, order: updated });
  } catch (error: any) {
    return safeErrorResponse(error, 500, "Error updating delivery task");
  }
}
