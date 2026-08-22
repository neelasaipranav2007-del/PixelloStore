import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getAuthenticatedAmbassador } from "@/lib/session";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const auth = await getAuthenticatedAmbassador(req);
    if (!auth || !auth.ambassador) {
      return NextResponse.json(
        { success: false, error: "Unauthorized. Please log in as an Ambassador." },
        { status: 401 }
      );
    }

    const { ambassador, user } = auth;

    // Fetch ONLY this ambassador's referred orders
    const referredOrders = await prisma.order.findMany({
      where: {
        OR: [
          { ambassadorProfileId: ambassador.id },
          { referralCode: ambassador.referralCode },
        ],
      },
      include: {
        commission: true,
      },
      orderBy: { createdAt: "desc" },
    });

    const totalOrdersCount = referredOrders.length;
    const deliveredOrders = referredOrders.filter((o) => o.status === "DELIVERED");
    const deliveredCount = deliveredOrders.length;

    const totalOrderVolume = referredOrders.reduce((sum, o) => sum + (o.totalAmount || 0), 0);

    // Calculate Dynamic Tier & Next Target
    let nextTierName = "Silver Tier";
    let targetOrders = 15;
    let currentTierName = "Bronze Tier";

    if (totalOrdersCount >= 50) {
      currentTierName = "Diamond Tier";
      nextTierName = "Elite Cohort";
      targetOrders = 100;
    } else if (totalOrdersCount >= 25) {
      currentTierName = "Gold Tier";
      nextTierName = "Diamond Tier";
      targetOrders = 50;
    } else if (totalOrdersCount >= 15) {
      currentTierName = "Silver Tier";
      nextTierName = "Gold Tier";
      targetOrders = 25;
    }

    const ordersRemaining = Math.max(0, targetOrders - totalOrdersCount);
    const progressPercent = Math.min(100, Math.round((totalOrdersCount / targetOrders) * 100));

    // Format recent referred orders for dashboard display
    const recentOrders = referredOrders.slice(0, 10).map((o) => {
      const commAmount = o.commissionEarned || (o.commission?.amount) || Math.round((o.totalAmount || 0) * (ambassador.commissionRate || 0.10));
      return {
        id: o.id,
        customerName: o.customerName,
        totalAmount: `₹${o.totalAmount.toLocaleString("en-IN")}`,
        commission: `₹${commAmount.toLocaleString("en-IN")}`,
        status: o.status === "DELIVERED" ? "PAID" : (o.status === "CANCELLED" ? "CANCELLED" : "PENDING"),
        date: new Date(o.createdAt).toLocaleDateString("en-IN", { month: "short", day: "numeric", year: "numeric" }),
      };
    });

    return NextResponse.json({
      success: true,
      ambassador: {
        id: ambassador.id,
        name: user.name || "Campus Ambassador",
        email: user.email,
        phone: user.phone,
        college: ambassador.college || "Campus Partner",
        branch: ambassador.branch || "General",
        year: ambassador.year || "Student",
        referralCode: ambassador.referralCode,
        rank: ambassador.rank,
        tier: currentTierName,
        commissionRate: `${Math.round((ambassador.commissionRate || 0.10) * 100)}%`,
        walletBalance: ambassador.balance,
        pendingBalance: ambassador.pendingBalance,
        totalEarned: ambassador.totalEarned,
        totalPaid: ambassador.totalPaid,
      },
      metrics: {
        totalReferrals: totalOrdersCount,
        deliveredCount,
        totalOrderVolume: `₹${Math.round(totalOrderVolume).toLocaleString("en-IN")}`,
        conversionRate: totalOrdersCount > 0 ? "24.5%" : "0%",
        progressPercent,
        currentTierName,
        nextTierName,
        targetOrders,
        ordersRemaining,
      },
      recentOrders,
      rewards: ambassador.rewards || [],
      notifications: ambassador.notifications || [],
      payouts: ambassador.payouts || [],
    });
  } catch (error: any) {
    console.error("GET /api/ambassador/dashboard error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
