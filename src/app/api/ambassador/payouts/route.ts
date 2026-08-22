import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getAuthenticatedAmbassador } from "@/lib/session";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const auth = await getAuthenticatedAmbassador(req);
    if (!auth || !auth.ambassador) {
      return NextResponse.json(
        { success: false, error: "Unauthorized. Please log in as an Ambassador." },
        { status: 401 }
      );
    }

    const { ambassador, user } = auth;

    const body = await req.json();
    const { amount, upiId, accountNumber, paymentMethod } = body;

    const reqAmount = Number(amount);
    if (!reqAmount || reqAmount < 500) {
      return NextResponse.json(
        { success: false, error: "Minimum payout request amount is ₹500." },
        { status: 400 }
      );
    }

    // Refresh fresh balance from database
    const freshProfile = await prisma.ambassadorProfile.findUnique({
      where: { id: ambassador.id },
      include: {
        payouts: {
          where: { status: "PENDING" },
        },
      },
    });

    if (!freshProfile) {
      return NextResponse.json({ success: false, error: "Ambassador profile not found." }, { status: 404 });
    }

    if (freshProfile.payouts.length > 0) {
      return NextResponse.json(
        {
          success: false,
          error: "You already have a pending payout request under review. Please wait for admin approval.",
        },
        { status: 400 }
      );
    }

    if (freshProfile.balance < reqAmount) {
      return NextResponse.json(
        {
          success: false,
          error: `Insufficient available balance. Your balance is ₹${freshProfile.balance}.`,
        },
        { status: 400 }
      );
    }

    const targetUpi = upiId || freshProfile.upiId || "";
    const targetAccount = accountNumber || freshProfile.accountNumber || "";

    if (!targetUpi && !targetAccount) {
      return NextResponse.json(
        { success: false, error: "Please provide a valid UPI ID or Bank Account Number for transfer." },
        { status: 400 }
      );
    }

    const payoutId = `PAY-${Math.floor(100000 + Math.random() * 900000)}`;

    // Perform balance update & payout creation
    const newBalance = freshProfile.balance - reqAmount;
    const newPending = (freshProfile.pendingBalance || 0) + reqAmount;

    await prisma.ambassadorProfile.update({
      where: { id: ambassador.id },
      data: {
        balance: newBalance,
        pendingBalance: newPending,
        upiId: targetUpi || freshProfile.upiId,
        accountNumber: targetAccount || freshProfile.accountNumber,
      },
    });

    const newPayout = await prisma.ambassadorPayout.create({
      data: {
        id: payoutId,
        ambassadorProfileId: ambassador.id,
        amount: reqAmount,
        status: "PENDING",
        paymentMethod: paymentMethod || (targetUpi ? "UPI" : "BANK_TRANSFER"),
        upiId: targetUpi,
        accountNumber: targetAccount,
      },
    });

    // Create notification
    await prisma.ambassadorNotification.create({
      data: {
        ambassadorProfileId: ambassador.id,
        title: "Payout Request Submitted",
        message: `Your payout request for ₹${reqAmount.toLocaleString("en-IN")} has been submitted for admin approval.`,
        type: "PAYOUT",
        referenceId: payoutId,
      },
    });

    return NextResponse.json({
      success: true,
      message: `Payout request for ₹${reqAmount.toLocaleString("en-IN")} submitted successfully!`,
      payout: newPayout,
      balance: newBalance,
      pendingBalance: newPending,
    });
  } catch (error: any) {
    console.error("POST /api/ambassador/payouts error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
