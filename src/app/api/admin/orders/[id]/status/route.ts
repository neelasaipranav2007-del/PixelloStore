import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { portalEvents } from "@/lib/events";
import { getAuthenticatedAdmin } from "@/lib/session";
import { mapUiStatusToDb } from "@/lib/orderStatus";
import { isDeliveryPortalEnabled } from "@/lib/deliveryConfig";
import { createDatabaseNotification } from "@/lib/notifications";
import { logAudit } from "@/lib/auditLogger";
import { safeErrorResponse } from "@/lib/errorHandler";

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
      trackingAwb,
      estimatedDeliveryDate, 
      trackingUrl,
      invoiceUrl,
      shippingLabelUrl,
    } = body;

    const updatedOrder = await prisma.$transaction(async (tx) => {
      // 1. Find Order by exact ID or case-insensitive match
      let targetOrder = await tx.order.findUnique({
        where: { id: orderId },
        include: { customerProfile: true },
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
          include: { customerProfile: true },
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
      const awb = trackingAwb !== undefined ? trackingAwb : (awbNumber !== undefined ? awbNumber : (trackingId !== undefined ? trackingId : null));
      const trackId = trackingId !== undefined ? trackingId : (trackingAwb !== undefined ? trackingAwb : (awbNumber !== undefined ? awbNumber : null));

      let estDate: Date | null = null;
      let estString: string | null = null;
      if (estimatedDeliveryDate !== undefined && estimatedDeliveryDate !== null) {
        if (typeof estimatedDeliveryDate === "string") {
          estString = estimatedDeliveryDate;
          const parsed = new Date(estimatedDeliveryDate);
          if (!isNaN(parsed.getTime())) {
            estDate = parsed;
          }
        } else if (estimatedDeliveryDate instanceof Date) {
          estDate = estimatedDeliveryDate;
          estString = estimatedDeliveryDate.toISOString();
        }
      }

      const now = new Date();

      const deliveryUpdatePayload: Record<string, unknown> = {
        deliveryPartnerName: provider,
        deliveryProvider: provider,
        ...(awb !== null ? { awbNumber: awb, waybill: awb } : (trackingAwb === "" ? { awbNumber: null, waybill: null } : {})),
        ...(trackId !== null ? { trackingId: trackId } : (trackingId === "" ? { trackingId: null } : {})),
        ...(estDate ? { estimatedDeliveryDate: estDate } : {}),
        ...(estString !== null ? { estimatedDelivery: estString } : {}),
        ...(trackingUrl !== undefined ? { trackingUrl: trackingUrl || null } : (awb ? { trackingUrl: `https://www.delhivery.com/track/package/${awb}` } : {})),
        ...(invoiceUrl !== undefined ? { notes: invoiceUrl || null } : {}),
        ...(shippingLabelUrl !== undefined ? { labelUrl: shippingLabelUrl || null } : {}),
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

      return { ...order, customerProfile: targetOrder.customerProfile };
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

    // Notify Customer Portal in Real-Time when shipping documents or tracking are attached
    const customerUserId = updatedOrder.customerProfile?.userId || null;

    if (invoiceUrl && typeof invoiceUrl === "string" && invoiceUrl.length > 0) {
      await createDatabaseNotification({
        role: "CUSTOMER",
        userId: customerUserId,
        type: "INVOICE_ATTACHED",
        title: "🧾 Order Invoice Attached",
        message: `Official invoice for Order #${updatedOrder.id} is now available in your portal.`,
        referenceType: "ORDER",
        referenceId: updatedOrder.id,
      });
    }

    if (shippingLabelUrl && typeof shippingLabelUrl === "string" && shippingLabelUrl.length > 0) {
      await createDatabaseNotification({
        role: "CUSTOMER",
        userId: customerUserId,
        type: "SHIPPING_LABEL_ATTACHED",
        title: "🏷️ Shipping Label Attached",
        message: `Shipping label for Order #${updatedOrder.id} has been generated and attached.`,
        referenceType: "ORDER",
        referenceId: updatedOrder.id,
      });
    }

    if (awbNumber || trackingAwb) {
      const awbVal = trackingAwb || awbNumber;
      await createDatabaseNotification({
        role: "CUSTOMER",
        userId: customerUserId,
        type: "TRACKING_UPDATED",
        title: "📦 Tracking Details Assigned",
        message: `Courier Tracking AWB #${awbVal} has been assigned to Order #${updatedOrder.id}.`,
        referenceType: "ORDER",
        referenceId: updatedOrder.id,
      });
    }

    logAudit({
      userId: admin.user.id,
      actorRole: "ADMIN",
      action: "ADMIN_ORDER_STATUS_CHANGED",
      targetId: updatedOrder.id,
      details: { status, deliveryPartnerName, awbNumber },
      req,
    }).catch(() => {});

    return NextResponse.json({ success: true, order: updatedOrder });
  } catch (error: unknown) {
    return safeErrorResponse(error, 500, "Admin order status update error");
  }
}
