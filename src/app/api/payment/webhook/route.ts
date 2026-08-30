import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { verifyWebhookSignature } from "@/lib/razorpay";
import { portalEvents } from "@/lib/events";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const rawBody = await req.text();
    const signature = req.headers.get("x-razorpay-signature") || "";

    // 1. Verify Webhook Signature if signature header is provided
    if (signature && !verifyWebhookSignature({ bodyString: rawBody, signature })) {
      return NextResponse.json({ success: false, error: "Invalid webhook signature" }, { status: 400 });
    }

    const event = JSON.parse(rawBody);
    const eventType = event.event;
    const payload = event.payload;

    if (eventType === "payment.captured" || eventType === "order.paid") {
      const paymentEntity = payload?.payment?.entity;
      const razorpayOrderId = paymentEntity?.order_id;
      const razorpayPaymentId = paymentEntity?.id;

      if (razorpayPaymentId) {
        // Update Transaction status in Prisma DB
        const transaction = await prisma.transaction.findFirst({
          where: {
            OR: [
              { razorpayPaymentId },
              razorpayOrderId ? { razorpayOrderId } : {},
            ],
          },
          include: { order: true },
        });

        if (transaction) {
          await prisma.transaction.update({
            where: { id: transaction.id },
            data: { status: "SUCCESS" },
          });

          portalEvents.emit("order_update", { action: "PAYMENT_CAPTURED", orderId: transaction.orderId });
        }
      }
    } else if (eventType === "payment.failed") {
      const paymentEntity = payload?.payment?.entity;
      const razorpayPaymentId = paymentEntity?.id;
      const razorpayOrderId = paymentEntity?.order_id;

      if (razorpayPaymentId || razorpayOrderId) {
        const transaction = await prisma.transaction.findFirst({
          where: {
            OR: [
              razorpayPaymentId ? { razorpayPaymentId } : {},
              razorpayOrderId ? { razorpayOrderId } : {},
            ],
          },
        });

        if (transaction) {
          await prisma.transaction.update({
            where: { id: transaction.id },
            data: { status: "FAILED" },
          });
        }
      }
    }

    return NextResponse.json({ success: true, received: true });
  } catch (error: any) {
    console.error("Error in /api/payment/webhook:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
