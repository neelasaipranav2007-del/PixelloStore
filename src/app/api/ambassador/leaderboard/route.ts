import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getAuthenticatedAmbassador } from "@/lib/session";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const auth = await getAuthenticatedAmbassador(req);
    const currentAmbassadorId = auth?.ambassador?.id;

    // Fetch all approved ambassadors
    const allAmbassadors = await prisma.ambassadorProfile.findMany({
      where: {
        status: "APPROVED",
      },
      include: {
        user: true,
      },
    });

    // Count real orders and calculate sales for each ambassador
    const leaderboardData = await Promise.all(
      allAmbassadors.map(async (amb) => {
        const ambassadorOrders = await prisma.order.findMany({
          where: {
            OR: [
              { ambassadorProfileId: amb.id },
              { referralCode: amb.referralCode },
            ],
          },
          select: {
            totalAmount: true,
            status: true,
          },
        });

        const orderCount = ambassadorOrders.length;
        const totalSales = ambassadorOrders.reduce((sum, o) => sum + (o.totalAmount || 0), 0);

        // Determine tier
        let tierName = "Bronze Tier";
        if (orderCount >= 50) tierName = "Diamond Tier";
        else if (orderCount >= 25) tierName = "Gold Tier";
        else if (orderCount >= 15) tierName = "Silver Tier";

        return {
          id: amb.id,
          name: amb.user.name || "Campus Ambassador",
          phone: amb.user.phone || "N/A",
          email: amb.user.email || "N/A",
          college: amb.college || "Campus Partner",
          promoCode: amb.referralCode,
          tier: tierName,
          rankBadge: amb.rank,
          referrals: orderCount,
          totalSales: totalSales,
          balance: amb.balance || 0,
          totalEarned: amb.totalEarned || 0,
          isCurrentUser: amb.id === currentAmbassadorId,
        };
      })
    );

    // Sort descending by referrals, then by totalSales
    leaderboardData.sort((a, b) => {
      if (b.referrals !== a.referrals) return b.referrals - a.referrals;
      return b.totalSales - a.totalSales;
    });

    // Assign rank numbers
    const rankedLeaderboard = leaderboardData.map((item, index) => ({
      ...item,
      rank: index + 1,
    }));

    return NextResponse.json({
      success: true,
      leaderboard: rankedLeaderboard,
      currentAmbassadorId,
    });
  } catch (error: any) {
    console.error("GET /api/ambassador/leaderboard error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
