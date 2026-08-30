import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getAuthenticatedUser } from "@/lib/session";
import { mapDbStatusToUi } from "@/lib/orderStatus";

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
      const parsedItems = o.items.map((it) => {
        let photos: string[] = [];
        if (it.customizationDetails) {
          try {
            const details = JSON.parse(it.customizationDetails);
            photos = details.photos || [];
          } catch (e) {
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
        status: mapDbStatusToUi(o.status),
        assignedStudio: o.assignedStudio || "Studio Alpha (Central Powai Branch)",
        deliveryAddress: o.shippingAddress,
        deliveryPartner: o.deliveryInfo?.deliveryPartnerName || "Ramesh Kumar",
        deliveryType: o.deliveryType || "Shipping",
        paymentMethod: o.transaction?.paymentMethod || "COD",
        referralCode: o.referralCode || undefined,
        referralDiscount: o.referralDiscount || undefined,
        items: parsedItems,
        history: (o.history || []).map((h) => ({
          status: mapDbStatusToUi(h.status),
          note: h.note,
          createdAt: h.createdAt.toISOString(),
        })),
      };
    });

    return NextResponse.json({ success: true, orders });
  } catch (error: any) {
    console.error("GET /api/customer/orders error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
