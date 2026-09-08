import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getAuthenticatedUser } from "@/lib/session";
import { sanitizeCustomerOrderData, mapInternalToCustomerStatus } from "@/lib/orderStatusMapping";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const user = await getAuthenticatedUser(req);
    if (!user) {
      return NextResponse.json(
        { success: false, error: "Authentication required to view your orders." },
        { status: 401 }
      );
    }

    const cleanPhone = (user.phone || "").replace(/\D/g, "").slice(-10);

    const dbOrders = await prisma.order.findMany({
      where: {
        OR: [
          user.customerProfile?.id ? { customerProfileId: user.customerProfile.id } : {},
          user.phone ? { customerPhone: user.phone } : {},
          cleanPhone ? { customerPhone: { contains: cleanPhone } } : {},
        ],
      },
      include: {
        items: true,
        history: {
          orderBy: { createdAt: "asc" },
        },
        deliveryInfo: true,
        transaction: true,
      },
      orderBy: { createdAt: "desc" },
    });

    const orders = dbOrders.map((o) => {
      const sanitized = sanitizeCustomerOrderData(o);
      const mapped = mapInternalToCustomerStatus(o.status);

      const parsedItems = o.items.map((it) => {
        let photos: string[] = [];
        if (it.customizationDetails) {
          try {
            const details = JSON.parse(it.customizationDetails);
            photos = details.photos || [];
          } catch {
            photos = [];
          }
        }
        if (photos.length === 0 && it.image) {
          photos = [it.image];
        }
        return {
          id: it.id,
          name: it.name,
          size: it.size || "Standard",
          quantity: it.quantity,
          price: it.price,
          image: it.image || "/images/wooden_frame_main.png",
          photos,
        };
      });

      return {
        id: o.id,
        date: o.createdAt.toISOString().split("T")[0],
        createdAt: o.createdAt.getTime(),
        updatedAt: o.updatedAt.getTime(),
        customerName: o.customerName,
        customerPhone: o.customerPhone,
        totalAmount: o.totalAmount,
        subtotal: o.totalAmount,
        discount: o.referralDiscount || 0,
        status: mapped.customerStatus,
        rawStatus: o.status,
        stageIndex: mapped.stageIndex,
        stepTitle: mapped.stepTitle,
        stepDesc: mapped.stepDesc,
        badgeClass: mapped.badgeClass,
        assignedStudio: o.assignedStudio || "Studio Alpha (Central Powai Branch)",
        deliveryAddress: o.shippingAddress,
        deliveryInfo: sanitized?.deliveryInfo || {
          deliveryProvider: o.deliveryInfo?.deliveryProvider || o.deliveryInfo?.deliveryPartnerName || "Delhivery",
          trackingId: o.deliveryInfo?.trackingId || o.deliveryInfo?.awbNumber || null,
          awbNumber: o.deliveryInfo?.awbNumber || o.deliveryInfo?.trackingId || null,
          estimatedDeliveryDate: o.deliveryInfo?.estimatedDeliveryDate ? new Date(o.deliveryInfo.estimatedDeliveryDate).toISOString().split("T")[0] : null,
          shippedAt: o.deliveryInfo?.shippedAt ? new Date(o.deliveryInfo.shippedAt).toISOString() : null,
          outForDeliveryAt: o.deliveryInfo?.outForDeliveryAt ? new Date(o.deliveryInfo.outForDeliveryAt).toISOString() : null,
          deliveredAt: o.deliveryInfo?.deliveredAt ? new Date(o.deliveryInfo.deliveredAt).toISOString() : null,
          trackingUrl: o.deliveryInfo?.trackingUrl || (o.deliveryInfo?.awbNumber ? `https://www.delhivery.com/track/package/${o.deliveryInfo.awbNumber}` : null),
        },
        deliveryPartner: o.deliveryInfo?.deliveryProvider || o.deliveryInfo?.deliveryPartnerName || "Delhivery",
        deliveryType: o.deliveryType || "Shipping",
        paymentMethod: o.transaction?.paymentMethod || "COD",
        referralCode: o.referralCode || undefined,
        referralDiscount: o.referralDiscount || undefined,
        items: parsedItems,
        history: (o.history || []).map((h) => {
          const hMapped = mapInternalToCustomerStatus(h.status);
          return {
            status: hMapped.customerStatus,
            note: hMapped.stepDesc,
            createdAt: h.createdAt.toISOString(),
          };
        }),
      };
    });

    return NextResponse.json({ success: true, orders });
  } catch (error: unknown) {
    const err = error as Error;
    console.error("GET /api/customer/orders error:", err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
