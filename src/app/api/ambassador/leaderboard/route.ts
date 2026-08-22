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

    // Count real orders for each ambassador
    const leaderboardData = await Promise.all(
      allAmbassadors.map(async (amb) => {
        const orderCount = await prisma.order.count({
          where: {
            OR: [
              { ambassadorProfileId: amb.id },
              { referralCode: amb.referralCode },
            ],
          },
        });

        // Determine tier
        let tierName = "Bronze Tier";
        if (orderCount >= 50) tierName = "Diamond Tier";
        else if (orderCount >= 25) tierName = "Gold Tier";
        else if (orderCount >= 15) tierName = "Silver Tier";

        return {
          id: amb.id,
          name: amb.user.name || "Campus Ambassador",
          college: amb.college || "Campus Partner",
          tier: tierName,
          rankBadge: amb.rank,
          referrals: orderCount,
          isCurrentUser: amb.id === currentAmbassadorId,
        };
      })
    );

    // Sort descending by referrals
    leaderboardData.sort((a, b) => b.referrals - a.referrals);

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
