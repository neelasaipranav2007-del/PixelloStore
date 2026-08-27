import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getAuthenticatedAdmin } from "@/lib/session";
import { OrderStatus } from "@prisma/client";

export const dynamic = "force-dynamic";

function mapDbStatusToUi(dbStatus: string): string {
  const s = (dbStatus || "").trim().toUpperCase();
  if (s === "DELIVERED") return "Delivered";
  if (s === "CANCELLED" || s === "CANCELED") return "Cancelled";
  if (s === "REPLACEMENT" || s === "REPLACEMENT_REQUESTED" || s === "REPLACEMENT REQUESTED") return "Replacement Requested";
  if (s === "OUT_FOR_DELIVERY" || s === "OUT FOR DELIVERY") return "Out for Delivery";
  if (s === "PICKED_UP" || s === "DELIVERY PICKED UP" || s === "DELIVERY_PICKED_UP") return "Out for Delivery";
  if (s === "QUALITY_CHECK" || s === "PACKED") return "Packed";
  if (s === "PRINTING" || s === "FRAMING") return "Printing";
  if (s === "OUT_OF_STOCK") return "Out of Stock (Refill Pending)";
  return "Processing";
}

function mapUiStatusToDb(uiStatus: string): OrderStatus | undefined {
  const s = (uiStatus || "").trim().toUpperCase();
  if (s === "ALL") return undefined;
  if (s === "DELIVERED") return "DELIVERED";
  if (s === "CANCELLED" || s === "CANCELED") return "CANCELLED";
  if (s === "REPLACEMENT" || s === "REPLACEMENT_REQUESTED" || s === "REPLACEMENT REQUESTED") return "REPLACEMENT_REQUESTED";
  if (s === "OUT FOR DELIVERY" || s === "OUT_FOR_DELIVERY") return "OUT_FOR_DELIVERY";
  if (s === "DELIVERY PICKED UP" || s === "PICKED_UP" || s === "PICKED UP") return "PICKED_UP";
  if (s === "PACKED" || s === "QUALITY_CHECK") return "QUALITY_CHECK";
  if (s === "PRINTING") return "PRINTING";
  if (s === "PROCESSING" || s === "PLACED") return "PLACED";
  return undefined;
}

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
        deliveryPartner: o.deliveryInfo?.deliveryPartnerName || "Ramesh Kumar",
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
