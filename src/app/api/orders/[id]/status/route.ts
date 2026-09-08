import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { portalEvents } from "@/lib/events";
import { mapUiStatusToDb } from "@/lib/orderStatus";
import { isDeliveryPortalEnabled } from "@/lib/deliveryConfig";

export const dynamic = "force-dynamic";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
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
      // 1. Find Order by exact ID or flexible match
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
          note: note || `Order status updated to ${status}`,
        },
      });

      // 4. Create or update Delivery assignment when PICKED_UP / OUT_FOR_DELIVERY / DELIVERED
      if (dbStatus === "PICKED_UP" || dbStatus === "OUT_FOR_DELIVERY" || dbStatus === "DELIVERED") {
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

      // 5. Create Portal-Specific Notifications based on status change
      let statusTitle = `Order Update: ${status}`;
      let customerMsg = `Order #${order.id} status updated to ${status}.`;
      let adminMsg = `Order #${order.id} updated to ${status}.`;

      if (dbStatus === "ACCEPTED_BY_STUDIO") {
        statusTitle = "Studio Accepted Order";
        customerMsg = `Studio accepted Order #${order.id} and has begun craft preparation.`;
        adminMsg = `Studio accepted Order #${order.id}.`;
      } else if (dbStatus === "PRINTING" || dbStatus === "FRAMING" || dbStatus === "DESIGNING" || dbStatus === "QUALITY_CHECK") {
        statusTitle = "Production Update";
        customerMsg = `Order #${order.id} is currently in ${status.toLowerCase().replace(/_/g, " ")}.`;
        adminMsg = `Order #${order.id} is now ${status.toLowerCase().replace(/_/g, " ")}.`;
      } else if (dbStatus === "READY_FOR_PICKUP") {
        statusTitle = "Ready for Pickup";
        if (isDeliveryPortalEnabled()) {
          customerMsg = `Order #${order.id} is handcrafted & packed, waiting for delivery pickup.`;
          adminMsg = `Order #${order.id} is ready for pickup at studio.`;

          // Notify Delivery Rider
          await tx.notification.create({
            data: {
              role: "DELIVERY",
              type: "PICKUP_AVAILABLE",
              title: "Pickup Available",
              message: `Order #${order.id} is ready for pickup at Studio.`,
              referenceType: "ORDER",
              referenceId: order.id,
            },
          });
        } else {
          customerMsg = `Order #${order.id} is handcrafted & ready. Delivery operations are currently paused and delivery will resume once operations reopen.`;
          adminMsg = `Order #${order.id} is ready for pickup (Delivery operations temporarily closed).`;
        }
      } else if (dbStatus === "OUT_FOR_DELIVERY" || dbStatus === "PICKED_UP") {
        statusTitle = "Out for Delivery";
        customerMsg = `Order #${order.id} is on the way with delivery partner Ramesh Kumar! 🚀`;
        adminMsg = `Order #${order.id} is out for doorstep delivery.`;
      } else if (dbStatus === "DELIVERED") {
        statusTitle = "Order Delivered 🎉";
        customerMsg = `Order #${order.id} has been delivered successfully to your doorstep.`;
        adminMsg = `Order #${order.id} successfully delivered.`;
      } else if (dbStatus === "CANCELLED") {
        statusTitle = "Order Cancelled";
        customerMsg = `Order #${order.id} has been cancelled.`;
        adminMsg = `Order #${order.id} was cancelled.`;
      }

      // Notify Admin
      await tx.notification.create({
        data: {
          role: "ADMIN",
          type: `ORDER_${dbStatus}`,
          title: statusTitle,
          message: adminMsg,
          referenceType: "ORDER",
          referenceId: order.id,
        },
      });

      // Notify Customer if customer profile exists
      if (targetOrder.customerProfileId) {
        const profile = await tx.customerProfile.findUnique({
          where: { id: targetOrder.customerProfileId },
        });
        if (profile?.userId) {
          await tx.notification.create({
            data: {
              role: "CUSTOMER",
              userId: profile.userId,
              type: `ORDER_${dbStatus}`,
              title: statusTitle,
              message: customerMsg,
              referenceType: "ORDER",
              referenceId: order.id,
            },
          });
        }
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
    portalEvents.emit("notification_change", { action: "CREATE", orderId: updatedOrder.id, status: dbStatus });

    return NextResponse.json({ success: true, order: updatedOrder });
  } catch (error: any) {
    console.error("Error updating order status:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
