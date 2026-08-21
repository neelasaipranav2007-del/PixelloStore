import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const [orders, customersCount, productsCount, studiosCount, ambassadorsCount] = await Promise.all([
      prisma.order.findMany({
        include: { items: true, transaction: true },
      }),
      prisma.user.count({ where: { role: "CUSTOMER" } }),
      prisma.product.count(),
      prisma.studioProfile.count(),
      prisma.ambassadorProfile.count(),
    ]);

    const totalRevenue = orders
      .filter((o) => o.status !== "CANCELLED")
      .reduce((sum, o) => sum + o.totalAmount, 0);

    const deliveredOrders = orders.filter((o) => o.status === "DELIVERED");
    const deliveredRevenue = deliveredOrders.reduce((sum, o) => sum + o.totalAmount, 0);

    const activeOrders = orders.filter((o) => o.status !== "DELIVERED" && o.status !== "CANCELLED");

    return NextResponse.json({
      success: true,
      analytics: {
        totalOrders: orders.length,
        totalRevenue,
        deliveredRevenue,
        deliveredCount: deliveredOrders.length,
        activeOrdersCount: activeOrders.length,
        cancelledCount: orders.filter((o) => o.status === "CANCELLED").length,
        customersCount,
        productsCount,
        studiosCount,
        ambassadorsCount,
      },
    });
  } catch (error: any) {
    console.error("Error computing analytics:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
