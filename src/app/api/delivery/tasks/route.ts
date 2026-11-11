import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { mapDbStatusToUi } from "@/lib/orderStatus";
import { isDeliveryPortalEnabled } from "@/lib/deliveryConfig";
import { getAuthenticatedDelivery, getAuthenticatedAdmin } from "@/lib/session";
import { safeErrorResponse } from "@/lib/errorHandler";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  if (!isDeliveryPortalEnabled()) {
    return NextResponse.json(
      { 
        success: false, 
        error: "Delivery operations are temporarily closed.",
        closed: true
      },
      { status: 503 }
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

    const orders = await prisma.order.findMany({
      include: {
        items: true,
        deliveryInfo: true,
      },
      orderBy: { createdAt: "desc" },
    });

    const tasks = orders.map((o) => {
      const waybill = o.deliveryInfo?.trackingUrl?.match(/DLV\w+/)?.[0] || null;
      return {
        id: o.id,
        orderId: o.id,
        date: o.createdAt.toISOString().split("T")[0],
        customerName: o.customerName,
        customerPhone: o.customerPhone,
        address: o.shippingAddress,
        deliveryAddress: o.shippingAddress,
        totalAmount: o.totalAmount,
        status: mapDbStatusToUi(o.status),
        rawDbStatus: o.status,
        assignedStudio: o.assignedStudio || "Studio Alpha (Central Powai Branch)",
        assignedPartner: o.deliveryInfo?.deliveryPartnerName || "Pixello Express",
        deliveryPartner: o.deliveryInfo?.deliveryPartnerName || "Pixello Express",
        trackingUrl: o.deliveryInfo?.trackingUrl || null,
        waybill: waybill,
        pickupTime: o.deliveryInfo?.pickupTime ? o.deliveryInfo.pickupTime.toISOString() : null,
        deliveryTime: o.deliveryInfo?.deliveryTime ? o.deliveryInfo.deliveryTime.toISOString() : null,
        items: o.items.map((it) => ({
          name: it.name,
          size: it.size || "Standard",
          quantity: it.quantity,
          price: it.price,
          image: it.image,
        })),
      };
    });

    return NextResponse.json({ success: true, tasks, count: tasks.length });
  } catch (error: any) {
    return safeErrorResponse(error, 500, "Error fetching delivery tasks");
  }
}
