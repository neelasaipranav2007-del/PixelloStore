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

    // Fetch ONLY orders referred by this ambassador
    const orders = await prisma.order.findMany({
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

    const referrals = orders.map((o) => {
      const commAmount = o.commissionEarned || (o.commission?.amount) || Math.round((o.totalAmount || 0) * (ambassador.commissionRate || 0.10));
      return {
        id: o.id,
        customerName: o.customerName,
        customerPhone: o.customerPhone ? o.customerPhone.slice(0, 4) + "••••" + o.customerPhone.slice(-2) : "••••",
        orderValue: Math.round(o.totalAmount || 0),
        commission: Math.round(commAmount),
        code: o.referralCode || ambassador.referralCode,
        status: o.status === "DELIVERED" ? "PAID" : (o.status === "CANCELLED" ? "CANCELLED" : "PENDING"),
        orderStatus: o.status,
        date: new Date(o.createdAt).toLocaleDateString("en-IN", { month: "short", day: "numeric", year: "numeric" }),
      };
    });

    const totalCount = referrals.length;
    const totalCommissions = referrals.reduce((sum, r) => sum + (r.status !== "CANCELLED" ? r.commission : 0), 0);
    const paidCommissions = referrals.filter((r) => r.status === "PAID").reduce((sum, r) => sum + r.commission, 0);

    return NextResponse.json({
      success: true,
      referrals,
      summary: {
        totalCount,
        totalCommissions,
        paidCommissions,
        activeCode: ambassador.referralCode,
      },
    });
  } catch (error: any) {
    console.error("GET /api/ambassador/referrals error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
