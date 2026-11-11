import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { verifyWebhookSignature } from "@/lib/razorpay";
import { portalEvents } from "@/lib/events";
import { registerWebhookEvent } from "@/lib/idempotency";
import { logAudit } from "@/lib/auditLogger";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const rawBody = await req.text();
    const signature = req.headers.get("x-razorpay-signature") || "";

    // 1. Mandatory Webhook Signature Verification
    if (!signature || !verifyWebhookSignature({ bodyString: rawBody, signature })) {
      return NextResponse.json(
        { success: false, error: "Unauthorized. Missing or invalid webhook cryptographic signature." },
        { status: 401 }
      );
    }

    const event = JSON.parse(rawBody);
    const eventType = event.event;
    const payload = event.payload;
    const eventId = event.id || payload?.payment?.entity?.id || `evt_${Date.now()}`;

    // 2. Idempotency Check: prevent duplicate webhook replay processing
    const isNewEvent = registerWebhookEvent(eventId);
    if (!isNewEvent) {
      return NextResponse.json({
        success: true,
        message: "Duplicate webhook event acknowledged without re-processing.",
        duplicate: true,
      });
    }

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
            data: {
              status: "SUCCESS",
              razorpayPaymentId,
              razorpayOrderId: razorpayOrderId || transaction.razorpayOrderId,
            },
          });

          if (transaction.order && transaction.order.status === "PLACED") {
            await prisma.order.update({
              where: { id: transaction.order.id },
              data: { status: "PAYMENT_CONFIRMED" },
            });

            await prisma.orderStatusHistory.create({
              data: {
                orderId: transaction.order.id,
                status: "PAYMENT_CONFIRMED",
                note: `Payment captured via Razorpay Webhook (${razorpayPaymentId})`,
              },
            });

            portalEvents.emit("order_change", {
              action: "UPDATE",
              orderId: transaction.order.id,
              status: "PAYMENT_CONFIRMED",
            });
          }
        }

        // Record audit log
        logAudit({
          action: "WEBHOOK_PAYMENT_CAPTURED",
          targetId: razorpayPaymentId,
          details: { eventType, eventId, razorpayOrderId },
          req,
        }).catch(() => {});
      }
    }

    return NextResponse.json({ success: true, received: true });
  } catch (err: any) {
    console.error("Webhook processing error:", err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
