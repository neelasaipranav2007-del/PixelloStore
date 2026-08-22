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

    // Fetch this ambassador's payouts
    const payouts = await prisma.ambassadorPayout.findMany({
      where: { ambassadorProfileId: ambassador.id },
      orderBy: { requestedAt: "desc" },
    });

    // Fetch this ambassador's commissions / referred orders
    const orders = await prisma.order.findMany({
      where: {
        OR: [
          { ambassadorProfileId: ambassador.id },
          { referralCode: ambassador.referralCode },
        ],
      },
      orderBy: { createdAt: "desc" },
    });

    // Build ledger transactions
    const commissionTxns = orders.map((o) => {
      const commAmount = o.commissionEarned || Math.round((o.totalAmount || 0) * (ambassador.commissionRate || 0.10));
      return {
        id: `TXN-${o.id}`,
        date: new Date(o.createdAt).toLocaleDateString("en-IN", { month: "short", day: "numeric", year: "numeric" }),
        type: `Commission Credit (${o.referralCode || ambassador.referralCode})`,
        amount: `+₹${commAmount.toLocaleString("en-IN")}`,
        status: o.status === "DELIVERED" ? "COMPLETED" : (o.status === "CANCELLED" ? "CANCELLED" : "PENDING HOLD"),
        isCredit: true,
      };
    });

    const payoutTxns = payouts.map((p) => ({
      id: `TXN-${p.id}`,
      date: new Date(p.requestedAt).toLocaleDateString("en-IN", { month: "short", day: "numeric", year: "numeric" }),
      type: p.status === "SETTLED" ? `Bank Payout Transfer (${p.transactionRef || "NEFT"})` : `Payout Request (${p.paymentMethod})`,
      amount: `-₹${p.amount.toLocaleString("en-IN")}`,
      status: p.status === "SETTLED" ? "COMPLETED" : (p.status === "REJECTED" ? "REJECTED" : "PENDING APPROVAL"),
      isCredit: false,
    }));

    const allTransactions = [...payoutTxns, ...commissionTxns];

    const hasPendingPayout = payouts.some((p) => p.status === "PENDING");

    return NextResponse.json({
      success: true,
      wallet: {
        availableBalance: ambassador.balance,
        pendingBalance: ambassador.pendingBalance,
        totalEarned: ambassador.totalEarned,
        totalPaid: ambassador.totalPaid,
        upiId: ambassador.upiId || "",
        accountNumber: ambassador.accountNumber || "",
        hasPendingPayout,
      },
      payouts,
      transactions: allTransactions,
    });
  } catch (error: any) {
    console.error("GET /api/ambassador/wallet error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
