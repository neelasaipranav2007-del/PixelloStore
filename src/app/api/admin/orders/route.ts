import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getAuthenticatedAdmin } from "@/lib/session";
import { mapDbStatusToUi, mapUiStatusToDb } from "@/lib/orderStatus";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const admin = await getAuthenticatedAdmin(req);
    if (!admin) {
      return NextResponse.json(
        { success: false, error: "Unauthorized. Admin privileges required." },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(req.url);
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || "50", 10)));
    const search = (searchParams.get("search") || "").trim();
    const statusParam = searchParams.get("status") || "";
    const studioParam = searchParams.get("studio") || "";
    const referralParam = searchParams.get("referralCode") || "";
    const sortBy = searchParams.get("sortBy") || "createdAt";
    const sortOrder = (searchParams.get("sortOrder") || "desc").toLowerCase() === "asc" ? "asc" : "desc";

    // Build Prisma query where clause
    const where: any = {};

    // 1. Status Filter
    if (statusParam && statusParam.toUpperCase() !== "ALL") {
      const dbStatus = mapUiStatusToDb(statusParam);
      if (dbStatus) {
        where.status = dbStatus;
      }
    }

    // 2. Studio Filter
    if (studioParam && studioParam.toUpperCase() !== "ALL") {
      where.assignedStudio = { contains: studioParam };
    }

    // 3. Referral Ambassador Code Filter
    if (referralParam) {
      where.referralCode = referralParam.toUpperCase();
    }

    // 4. Search Filter (Server-side search across ID, Customer Name, Phone, Email, Referral Code, Product Name)
    if (search) {
      const cleanDigits = search.replace(/\D/g, "");
      where.OR = [
        { id: { contains: search } },
        { customerName: { contains: search } },
        { customerPhone: { contains: search } },
        ...(cleanDigits ? [{ customerPhone: { contains: cleanDigits } }] : []),
        { referralCode: { contains: search } },
        { assignedStudio: { contains: search } },
        { shippingAddress: { contains: search } },
        {
          items: {
            some: {
              name: { contains: search },
            },
          },
        },
      ];
    }

    // Execute queries in parallel: Total count, paginated orders, and ecosystem metrics
    const [totalCount, dbOrders, allOrdersForMetrics] = await Promise.all([
      prisma.order.count({ where }),
      prisma.order.findMany({
        where,
        include: {
          items: true,
          history: {
            orderBy: { createdAt: "asc" },
          },
          transaction: true,
          commission: true,
          deliveryInfo: true,
          customerProfile: {
            include: {
              user: true,
            },
          },
        },
        orderBy: {
          [sortBy === "totalAmount" ? "totalAmount" : "createdAt"]: sortOrder,
        },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.order.findMany({
        select: {
          id: true,
          totalAmount: true,
          status: true,
          createdAt: true,
        },
      }),
    ]);

    // Format orders for Admin Table & Details view
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

      const customerEmail = o.customerProfile?.user?.email || null;
      const customerUserId = o.customerProfile?.userId || o.customerProfileId || null;

      return {
        id: o.id,
        date: o.createdAt.toISOString().split("T")[0],
        createdAt: o.createdAt.getTime(),
        updatedAt: o.updatedAt.getTime(),
        customerId: customerUserId,
        customerName: o.customerName,
        customerPhone: o.customerPhone,
        customerEmail,
        totalAmount: o.totalAmount,
        subtotal: o.totalAmount,
        discount: o.referralDiscount || 0,
        status: mapDbStatusToUi(o.status),
        rawDbStatus: o.status,
        assignedStudio: o.assignedStudio || "Studio Alpha (Central Powai Branch)",
        deliveryAddress: o.shippingAddress,
        deliveryPartner: o.deliveryInfo?.deliveryPartnerName || "Pixello Express",
        trackingUrl: o.deliveryInfo?.trackingUrl || null,
        waybill: o.deliveryInfo?.trackingUrl?.match(/(?:DLV|PXL)\w+/)?.[0] || null,
        pickupTime: o.deliveryInfo?.pickupTime ? o.deliveryInfo.pickupTime.toISOString() : null,
        deliveryTime: o.deliveryInfo?.deliveryTime ? o.deliveryInfo.deliveryTime.toISOString() : null,
        deliveryType: o.deliveryType || "Shipping",
        paymentMethod: o.transaction?.paymentMethod || "COD",
        paymentStatus: o.transaction?.status || "SUCCESS",
        referralCode: o.referralCode || undefined,
        referralDiscount: o.referralDiscount || undefined,
        commissionEarned: o.commissionEarned || undefined,
        items: parsedItems,
        history: (o.history || []).map((h) => ({
          id: h.id,
          status: mapDbStatusToUi(h.status),
          note: h.note,
          createdAt: h.createdAt.toISOString(),
        })),
      };
    });

    // Calculate ecosystem metrics directly from central database
    const totalRevenue = allOrdersForMetrics.reduce((sum, o) => sum + (o.totalAmount || 0), 0);
    const deliveredOrders = allOrdersForMetrics.filter((o) => o.status === "DELIVERED");
    const deliveredRevenue = deliveredOrders.reduce((sum, o) => sum + (o.totalAmount || 0), 0);
    
    const activeOrders = allOrdersForMetrics.filter((o) => o.status !== "DELIVERED" && o.status !== "CANCELLED");
    const activeRevenue = activeOrders.reduce((sum, o) => sum + (o.totalAmount || 0), 0);
    
    const cancelledOrders = allOrdersForMetrics.filter((o) => o.status === "CANCELLED");
    const cancelledRevenue = cancelledOrders.reduce((sum, o) => sum + (o.totalAmount || 0), 0);

    const replacementOrders = allOrdersForMetrics.filter((o) => (o.status as any) === "REPLACEMENT" || (o.status as any) === "REPLACEMENT_REQUESTED");
    const replacementRevenue = replacementOrders.reduce((sum, o) => sum + (o.totalAmount || 0), 0);

    const totalPages = Math.ceil(totalCount / limit);

    return NextResponse.json({
      success: true,
      orders,
      pagination: {
        page,
        limit,
        total: totalCount,
        totalPages,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1,
      },
      metrics: {
        totalRevenue,
        deliveredRevenue,
        deliveredCount: deliveredOrders.length,
        activeRevenue,
        activeCount: activeOrders.length,
        cancelledRevenue,
        cancelledCount: cancelledOrders.length,
        replacementRevenue,
        replacementCount: replacementOrders.length,
        totalOrdersCount: allOrdersForMetrics.length,
      },
    });
  } catch (error: any) {
    console.error("GET /api/admin/orders error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
