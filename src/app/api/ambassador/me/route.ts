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

    // Calculate real orders and real totals dynamically
    const orderCount = await prisma.order.count({
      where: {
        OR: [
          { ambassadorProfileId: ambassador.id },
          { referralCode: ambassador.referralCode },
        ],
      },
    });

    // Auto calculate Tier dynamically
    let calculatedRank: "BRONZE" | "SILVER" | "GOLD" | "DIAMOND" = "BRONZE";
    if (orderCount >= 50) calculatedRank = "DIAMOND";
    else if (orderCount >= 25) calculatedRank = "GOLD";
    else if (orderCount >= 15) calculatedRank = "SILVER";

    // Update if tier upgraded
    if (ambassador.rank !== calculatedRank && (calculatedRank === "GOLD" || calculatedRank === "DIAMOND")) {
      await prisma.ambassadorProfile.update({
        where: { id: ambassador.id },
        data: { rank: calculatedRank },
      });
      ambassador.rank = calculatedRank;
    }

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
      },
      ambassador: {
        id: ambassador.id,
        userId: user.id,
        name: user.name,
        phone: user.phone,
        email: user.email,
        college: ambassador.college || "Campus Partner",
        branch: ambassador.branch || "General",
        year: ambassador.year || "Student",
        bio: ambassador.bio || "",
        instagramHandle: ambassador.instagramHandle || "",
        referralCode: ambassador.referralCode,
        rank: ambassador.rank,
        tier: ambassador.rank,
        commissionRate: ambassador.commissionRate || 0.10,
        balance: ambassador.balance,
        pendingBalance: ambassador.pendingBalance,
        totalEarned: ambassador.totalEarned,
        totalPaid: ambassador.totalPaid,
        upiId: ambassador.upiId || "",
        accountNumber: ambassador.accountNumber || "",
        status: ambassador.status,
        orderCount,
        rewards: ambassador.rewards || [],
        notifications: ambassador.notifications || [],
        payouts: ambassador.payouts || [],
      },
    });
  } catch (error: any) {
    console.error("GET /api/ambassador/me error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
