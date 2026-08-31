import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { mapDbStatusToUi } from "@/lib/orderStatus";

export const dynamic = "force-dynamic";

async function findCustomerWithFallback(identifier: string) {
  const cleanMob = identifier.replace(/\D/g, "").slice(-10);
  const cleanId = identifier.trim().toLowerCase();
  const suffix = identifier.replace(/^CUST-/i, "").trim().toLowerCase();

  // 1. Direct match by ID, full Phone, or Email
  let user = await prisma.user.findFirst({
    where: {
      OR: [
        { id: identifier },
        cleanMob.length >= 10 ? { phone: { contains: cleanMob } } : {},
        { email: identifier },
        { customerProfile: { id: identifier } },
      ].filter((c) => Object.keys(c).length > 0),
    },
    include: {
      customerProfile: true,
    },
  });

  // 2. Suffix match (e.g. CUST-i1mo -> cmt2kmpgu000h04dugug4i1mo)
  if (!user && suffix) {
    const allUsers = await prisma.user.findMany({
      include: {
        customerProfile: true,
      },
    });
    user =
      allUsers.find(
        (u) =>
          u.id.toLowerCase().endsWith(suffix) ||
          (u.phone && u.phone.replace(/\D/g, "").slice(-10) === cleanMob) ||
          u.id.toLowerCase() === cleanId
      ) || null;
  }

  // 3. Fallback: Search in Orders table directly if not in User table
  if (!user) {
    const matchedOrder = await prisma.order.findFirst({
      where: {
        OR: [
          cleanMob.length >= 10 ? { customerPhone: { contains: cleanMob } } : {},
          suffix ? { customerProfileId: { endsWith: suffix } } : {},
          { customerName: { contains: identifier } },
        ].filter((c) => Object.keys(c).length > 0),
      },
    });

    if (matchedOrder) {
      const matchedCleanPhone = matchedOrder.customerPhone.replace(/\D/g, "").slice(-10);
      return {
        id: matchedOrder.customerProfileId || `CUST-${matchedCleanPhone.slice(-4) || "0001"}`,
        displayId: `CUST-${matchedCleanPhone.slice(-4) || "0001"}`,
        name: matchedOrder.customerName,
        email: `${matchedCleanPhone}@pixello.store`,
        phone: matchedOrder.customerPhone,
        mobile: matchedCleanPhone,
        customerProfile: {
          id: matchedOrder.customerProfileId || "profile-gen",
        },
      };
    }
  }

  if (user) {
    const userPhoneClean = (user.phone || "").replace(/\D/g, "").slice(-10);
    return {
      id: user.id,
      displayId: `CUST-${user.id.slice(-4)}`,
      name: user.name || "Customer",
      email: user.email || `${userPhoneClean}@pixello.store`,
      phone: user.phone || `+91 ${userPhoneClean}`,
      mobile: userPhoneClean,
      customerProfile: user.customerProfile,
    };
  }

  return null;
}

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: rawId } = await params;
    const identifier = decodeURIComponent(rawId || "").trim();

    if (!identifier) {
      return NextResponse.json(
        { success: false, error: "Customer ID is required." },
        { status: 400 }
      );
    }

    const user = await findCustomerWithFallback(identifier);
    const cleanMob = identifier.replace(/\D/g, "").slice(-10);
    const userPhoneClean = user ? (user.phone || "").replace(/\D/g, "").slice(-10) : cleanMob;
    const suffix = identifier.replace(/^CUST-/i, "").trim();

    // Query all orders belonging strictly to this customer
    const dbOrders = await prisma.order.findMany({
      where: {
        OR: [
          user?.customerProfile?.id ? { customerProfileId: user.customerProfile.id } : {},
          userPhoneClean ? { customerPhone: { contains: userPhoneClean } } : {},
          user?.email ? { customerPhone: user.email } : {},
          suffix ? { customerProfileId: { endsWith: suffix } } : {},
        ].filter((c) => Object.keys(c).length > 0),
      },
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
        history: {
          orderBy: { createdAt: "asc" },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    const formattedOrders = dbOrders.map((o) => {
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
          customizationDetails: it.customizationDetails,
        };
      });

      // Studio Details
      const studioName =
        o.studioProfile?.businessName ||
        o.studioProfile?.user?.name ||
        o.assignedStudio ||
        null;
      const studioId = o.studioProfileId || (o.studioProfile?.id ? `STU-${o.studioProfile.id.slice(-4)}` : null);
      const studioLocation = o.studioProfile?.address || null;

      // Delivery Details
      const deliveryAgentName =
        o.deliveryInfo?.deliveryPartnerName ||
        o.deliveryInfo?.deliveryProfile?.user?.name ||
        null;
      const deliveryAgentId = o.deliveryInfo?.deliveryProfileId
        ? `DEL-${o.deliveryInfo.deliveryProfileId.slice(-4)}`
        : null;
      const deliveryAgentPhone = o.deliveryInfo?.deliveryProfile?.user?.phone || null;
      const awbNumber = o.deliveryInfo?.trackingUrl || null;
      const pickupTime = o.deliveryInfo?.pickupTime ? o.deliveryInfo.pickupTime.toISOString() : null;
      const deliveryTime = o.deliveryInfo?.deliveryTime ? o.deliveryInfo.deliveryTime.toISOString() : null;

      // Ambassador Details
      const ambassadorName =
        o.ambassadorProfile?.user?.name ||
        (o.referralCode ? `Ambassador (${o.referralCode})` : null);
      const ambassadorId = o.ambassadorProfileId
        ? `AMB-${o.ambassadorProfileId.slice(-4)}`
        : null;
      const commissionAmount = o.commission?.amount ?? o.commissionEarned ?? 0;
      const commissionStatus = o.commission?.status || "PENDING";

      // Transaction / Payment Details
      const paymentStatus = o.transaction?.status || "SUCCESS";
      const paymentMethod = o.transaction?.paymentMethod || "UPI";
      const paymentId = o.transaction?.razorpayPaymentId || o.transaction?.id || null;
      const razorpayOrderId = o.transaction?.razorpayOrderId || null;
      const paymentDate = o.transaction?.createdAt ? o.transaction.createdAt.toISOString() : o.createdAt.toISOString();

      return {
        id: o.id,
        date: o.createdAt.toISOString().split("T")[0],
        formattedDate: o.createdAt.toLocaleDateString("en-IN", {
          year: "numeric",
          month: "short",
          day: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        }),
        createdAt: o.createdAt.toISOString(),
        updatedAt: o.updatedAt.toISOString(),
        customerName: o.customerName,
        customerPhone: o.customerPhone,
        customerEmail: user?.email || null,
        shippingAddress: o.shippingAddress,
        deliveryType: o.deliveryType || "Shipping",
        totalAmount: o.totalAmount,
        discount: o.referralDiscount || 0,
        status: mapDbStatusToUi(o.status),
        rawDbStatus: o.status,
        items: parsedItems,
        totalQuantity: parsedItems.reduce((sum, item) => sum + item.quantity, 0),

        // Studio
        studio: {
          assigned: !!studioName,
          name: studioName || "Studio Not Assigned",
          id: studioId || "Not assigned",
          location: studioLocation || "Location not specified",
          productionStatus: mapDbStatusToUi(o.status),
          assignedDate: o.createdAt.toISOString(),
        },

        // Delivery
        delivery: {
          assigned: !!deliveryAgentName || !!awbNumber,
          agentName: deliveryAgentName || "Delivery Agent Not Assigned",
          agentId: deliveryAgentId || "Not assigned",
          agentPhone: deliveryAgentPhone || "Not available",
          awb: awbNumber || "Not generated yet",
          shipmentStatus: mapDbStatusToUi(o.status),
          pickupTime,
          deliveryTime,
          estimatedDelivery: new Date(new Date(o.createdAt).getTime() + 2 * 24 * 60 * 60 * 1000).toLocaleDateString("en-IN", {
            year: "numeric",
            month: "short",
            day: "numeric",
          }),
        },

        // Ambassador
        ambassador: {
          isReferred: !!(o.referralCode || o.ambassadorProfileId),
          name: ambassadorName || "Organic Order",
          id: ambassadorId || "N/A",
          referralCode: o.referralCode || "None",
          commissionStatus: o.referralCode ? commissionStatus : "N/A",
          commissionAmount: o.referralCode ? commissionAmount : 0,
        },

        // Payment
        payment: {
          status: paymentStatus,
          method: paymentMethod,
          paymentId: paymentId || "N/A",
          razorpayOrderId: razorpayOrderId || "N/A",
          amount: o.totalAmount,
          date: paymentDate,
        },

        // History
        history: (o.history || []).map((h) => ({
          id: h.id,
          status: mapDbStatusToUi(h.status),
          rawStatus: h.status,
          note: h.note,
          createdAt: h.createdAt.toISOString(),
        })),
      };
    });

    return NextResponse.json({
      success: true,
      orders: formattedOrders,
      totalOrders: formattedOrders.length,
    });
  } catch (error: any) {
    console.error("GET /api/admin/customers/[id]/orders error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to fetch customer orders." },
      { status: 500 }
    );
  }
}
