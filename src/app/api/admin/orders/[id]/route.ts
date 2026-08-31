import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getAuthenticatedAdmin } from "@/lib/session";
import { mapDbStatusToUi } from "@/lib/orderStatus";

export const dynamic = "force-dynamic";

export async function GET(
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

    const { id: rawId } = await params;
    const orderId = decodeURIComponent(rawId || "").trim();

    if (!orderId) {
      return NextResponse.json(
        { success: false, error: "Order ID is required." },
        { status: 400 }
      );
    }

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        items: {
          include: {
            product: true,
          },
        },
        transaction: true,
        deliveryInfo: {
          include: {
            deliveryProfile: {
              include: {
                user: true,
              },
            },
          },
        },
        studioProfile: {
          include: {
            user: true,
          },
        },
        ambassadorProfile: {
          include: {
            user: true,
          },
        },
        commission: true,
        customerProfile: {
          include: {
            user: true,
            addresses: true,
          },
        },
        history: {
          orderBy: { createdAt: "asc" },
        },
      },
    });

    if (!order) {
      return NextResponse.json(
        { success: false, error: "Order not found." },
        { status: 404 }
      );
    }

    const parsedItems = order.items.map((it) => {
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
        customizationDetails: it.customizationDetails,
      };
    });

    // Studio
    const studioName =
      order.studioProfile?.businessName ||
      order.studioProfile?.user?.name ||
      order.assignedStudio ||
      null;
    const studioId = order.studioProfileId || (order.studioProfile?.id ? `STU-${order.studioProfile.id.slice(-4)}` : null);
    const studioLocation = order.studioProfile?.address || null;

    // Delivery
    const deliveryAgentName =
      order.deliveryInfo?.deliveryPartnerName ||
      order.deliveryInfo?.deliveryProfile?.user?.name ||
      null;
    const deliveryAgentId = order.deliveryInfo?.deliveryProfileId
      ? `DEL-${order.deliveryInfo.deliveryProfileId.slice(-4)}`
      : null;
    const deliveryAgentPhone = order.deliveryInfo?.deliveryProfile?.user?.phone || null;
    const awbNumber = order.deliveryInfo?.trackingUrl || null;
    const pickupTime = order.deliveryInfo?.pickupTime ? order.deliveryInfo.pickupTime.toISOString() : null;
    const deliveryTime = order.deliveryInfo?.deliveryTime ? order.deliveryInfo.deliveryTime.toISOString() : null;

    // Ambassador
    const ambassadorName =
      order.ambassadorProfile?.user?.name ||
      (order.referralCode ? `Ambassador (${order.referralCode})` : null);
    const ambassadorId = order.ambassadorProfileId
      ? `AMB-${order.ambassadorProfileId.slice(-4)}`
      : null;
    const commissionAmount = order.commission?.amount ?? order.commissionEarned ?? 0;
    const commissionStatus = order.commission?.status || "PENDING";

    // Payment
    const paymentStatus = order.transaction?.status || "SUCCESS";
    const paymentMethod = order.transaction?.paymentMethod || "UPI";
    const paymentId = order.transaction?.razorpayPaymentId || order.transaction?.id || null;
    const razorpayOrderId = order.transaction?.razorpayOrderId || null;
    const paymentDate = order.transaction?.createdAt ? order.transaction.createdAt.toISOString() : order.createdAt.toISOString();

    const formattedOrder = {
      id: order.id,
      date: order.createdAt.toISOString().split("T")[0],
      formattedDate: order.createdAt.toLocaleDateString("en-IN", {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      }),
      createdAt: order.createdAt.toISOString(),
      updatedAt: order.updatedAt.toISOString(),
      customerId: order.customerProfile?.userId || (order.customerProfileId ? `CUST-${order.customerProfileId.slice(-4)}` : null),
      customerName: order.customerName,
      customerPhone: order.customerPhone,
      customerEmail: order.customerProfile?.user?.email || null,
      shippingAddress: order.shippingAddress,
      deliveryType: order.deliveryType || "Shipping",
      totalAmount: order.totalAmount,
      discount: order.referralDiscount || 0,
      status: mapDbStatusToUi(order.status),
      rawDbStatus: order.status,
      items: parsedItems,
      totalQuantity: parsedItems.reduce((sum, item) => sum + item.quantity, 0),

      // Studio
      studio: {
        assigned: !!studioName,
        name: studioName || "Studio Not Assigned",
        id: studioId || "Not assigned",
        location: studioLocation || "Location not specified",
        productionStatus: mapDbStatusToUi(order.status),
        assignedDate: order.createdAt.toISOString(),
      },

      // Delivery
      delivery: {
        assigned: !!deliveryAgentName || !!awbNumber,
        agentName: deliveryAgentName || "Delivery Agent Not Assigned",
        agentId: deliveryAgentId || "Not assigned",
        agentPhone: deliveryAgentPhone || "Not available",
        awb: awbNumber || "Not generated yet",
        shipmentStatus: mapDbStatusToUi(order.status),
        pickupTime,
        deliveryTime,
        estimatedDelivery: new Date(new Date(order.createdAt).getTime() + 2 * 24 * 60 * 60 * 1000).toLocaleDateString("en-IN", {
          year: "numeric",
          month: "short",
          day: "numeric",
        }),
      },

      // Ambassador
      ambassador: {
        isReferred: !!(order.referralCode || order.ambassadorProfileId),
        name: ambassadorName || "Organic Order",
        id: ambassadorId || "N/A",
        referralCode: order.referralCode || "None",
        commissionStatus: order.referralCode ? commissionStatus : "N/A",
        commissionAmount: order.referralCode ? commissionAmount : 0,
      },

      // Payment
      payment: {
        status: paymentStatus,
        method: paymentMethod,
        paymentId: paymentId || "N/A",
        razorpayOrderId: razorpayOrderId || "N/A",
        amount: order.totalAmount,
        date: paymentDate,
      },

      // History
      history: (order.history || []).map((h) => ({
        id: h.id,
        status: mapDbStatusToUi(h.status),
        rawStatus: h.status,
        note: h.note,
        createdAt: h.createdAt.toISOString(),
      })),
    };

    return NextResponse.json({
      success: true,
      order: formattedOrder,
    });
  } catch (error: any) {
    console.error("GET /api/admin/orders/[id] error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to fetch order details." },
      { status: 500 }
    );
  }
}
