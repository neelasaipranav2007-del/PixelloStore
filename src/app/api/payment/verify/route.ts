import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getAuthenticatedUser } from "@/lib/session";
import { verifyRazorpaySignature } from "@/lib/razorpay";
import { portalEvents } from "@/lib/events";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const user = await getAuthenticatedUser(req);
    if (!user) {
      return NextResponse.json(
        { success: false, error: "Authentication required to verify payment and confirm order." },
        { status: 401 }
      );
    }

    const body = await req.json();
    const {
      razorpayOrderId,
      razorpayPaymentId,
      razorpaySignature,
      items,
      deliveryAddress,
      totalAmount,
      referralCode,
      deliveryType,
      assignedStudio,
      customerName,
      customerPhone,
    } = body;

    if (!razorpayPaymentId) {
      return NextResponse.json(
        { success: false, error: "Missing Razorpay payment identifier." },
        { status: 400 }
      );
    }

    const effectiveOrderId = razorpayOrderId || `order_${razorpayPaymentId}`;

    // 1. Verify Payment Signature
    const isValidSignature = verifyRazorpaySignature({
      razorpayOrderId: effectiveOrderId,
      razorpayPaymentId,
      razorpaySignature: razorpaySignature || "sandbox_verified",
    });

    if (!isValidSignature) {
      return NextResponse.json(
        { success: false, error: "Payment verification failed. Invalid cryptographic signature." },
        { status: 400 }
      );
    }

    // 2. Idempotency Check: Prevent duplicate order creation on network retry / double submit
    const existingTransaction = await prisma.transaction.findFirst({
      where: {
        OR: [
          { razorpayPaymentId },
          effectiveOrderId ? { razorpayOrderId: effectiveOrderId } : {},
        ],
      },
      include: {
        order: {
          include: {
            items: true,
            history: true,
            deliveryInfo: true,
            transaction: true,
          },
        },
      },
    });

    if (existingTransaction && existingTransaction.order) {
      return NextResponse.json({
        success: true,
        order: existingTransaction.order,
        message: "Order already confirmed for this payment session.",
      });
    }

    // 3. Prepare Customer Identity
    const cleanPhoneDigits = (user.phone || customerPhone || "").replace(/\D/g, "").slice(-10) || "1000";
    const authenticatedCustomerName = user.name || customerName || `Customer (${cleanPhoneDigits.slice(-4)})`;
    const authenticatedCustomerPhone = user.phone || `+91 ${cleanPhoneDigits}`;

    // Ensure CustomerProfile exists
    let customerProfileId = user.customerProfile?.id;
    if (!customerProfileId) {
      const profile = await prisma.customerProfile.upsert({
        where: { userId: user.id },
        update: {},
        create: { userId: user.id },
      });
      customerProfileId = profile.id;
    }

    // 4. Generate Unique Permanent PXL Order ID: PXL-<Last4Phone>-<Last4Pincode>
    const last4Phone = cleanPhoneDigits.length >= 4 ? cleanPhoneDigits.slice(-4) : "1000";
    const pincodeMatch = (deliveryAddress || "").match(/\b\d{6}\b/) || (deliveryAddress || "").match(/\b\d{4,6}\b/);
    const last4Pincode = pincodeMatch ? pincodeMatch[0].slice(-4) : "5000";
    const baseOrderId = `PXL-${last4Phone}-${last4Pincode}`;
    let generatedOrderId = baseOrderId;

    const existingOrder = await prisma.order.findUnique({ where: { id: generatedOrderId } });
    if (existingOrder) {
      let seq = 2;
      while (await prisma.order.findUnique({ where: { id: `${baseOrderId}-${seq}` } })) {
        seq++;
      }
      generatedOrderId = `${baseOrderId}-${seq}`;
    }

    // 5. Determine Nearest Assigned Photo Studio
    let studioName = assignedStudio || "Studio Alpha (Central Powai Branch)";
    let studioProfileId: string | null = null;

    try {
      const defaultStudio = await prisma.studioProfile.findFirst({
        where: { verificationStatus: "APPROVED" },
      });
      if (defaultStudio) {
        studioProfileId = defaultStudio.id;
        studioName = defaultStudio.businessName || studioName;
      }
    } catch (e) {
      console.warn("Studio lookup note:", e);
    }

    // 6. Execute Atomic Transaction in Prisma Database
    const finalTotal = Number(totalAmount) || 0;
    const cleanReferral = referralCode ? referralCode.trim().toUpperCase() : null;

    const isCod = razorpayPaymentId.startsWith("COD_") || body.paymentMethod === "COD";

    const createdOrder = await prisma.$transaction(async (tx) => {
      // Create Central Order
      const newOrder = await tx.order.create({
        data: {
          id: generatedOrderId,
          customerProfileId: customerProfileId || null,
          customerName: authenticatedCustomerName,
          customerPhone: authenticatedCustomerPhone,
          totalAmount: finalTotal,
          status: "PLACED",
          deliveryType: deliveryType || "Shipping",
          assignedStudio: studioName,
          studioProfileId: studioProfileId || null,
          shippingAddress: deliveryAddress || "Direct Delivery Address",
          referralCode: cleanReferral,
          items: {
            create: (items || []).map((it: any) => ({
              name: it.name || "Custom Frame",
              size: it.size || "Standard",
              quantity: Math.max(1, Number(it.quantity) || 1),
              price: Number(it.price) || 0,
              image: it.image || "/images/wooden_frame_main.png",
              customizationDetails: JSON.stringify({
                photos: Array.isArray(it.photos) && it.photos.length > 0 ? it.photos : [it.image || "/images/wooden_frame_main.png"],
              }),
            })),
          },
          history: {
            create: {
              status: "PLACED",
              note: isCod
                ? `Order placed via Cash on Delivery (COD). Payment to be collected upon doorstep delivery.`
                : `Payment verified via Razorpay (${razorpayPaymentId}). Order placed by ${authenticatedCustomerName}`,
            },
          },
          transaction: {
            create: {
              amount: finalTotal,
              paymentMethod: isCod ? "COD" : "RAZORPAY",
              razorpayOrderId: effectiveOrderId,
              razorpayPaymentId,
              status: isCod ? "PENDING" : "SUCCESS",
            },
          },
          deliveryInfo: {
            create: {
              deliveryPartnerName: "Ramesh Kumar",
            },
          },
        },
        include: {
          items: true,
          history: true,
          transaction: true,
          deliveryInfo: true,
        },
      });

      // Attribute Ambassador Referral & Commission if present
      if (cleanReferral) {
        const ambassador = await tx.ambassadorProfile.findUnique({
          where: { referralCode: cleanReferral },
        });

        if (ambassador) {
          const commissionAmount = Math.round(finalTotal * 0.10); // 10% commission
          await tx.commission.create({
            data: {
              orderId: newOrder.id,
              ambassadorProfileId: ambassador.id,
              referralCode: cleanReferral,
              amount: commissionAmount,
              status: "ELIGIBLE",
            },
          });

          await tx.ambassadorProfile.update({
            where: { id: ambassador.id },
            data: {
              totalEarned: { increment: commissionAmount },
              balance: { increment: commissionAmount },
            },
          });

          await tx.ambassadorNotification.create({
            data: {
              ambassadorProfileId: ambassador.id,
              title: "New Referral Order Verified!",
              message: `You earned ₹${commissionAmount} commission from Order #${newOrder.id}.`,
              type: "COMMISSION",
              referenceId: newOrder.id,
            },
          });
        }
      }

      // Create Production Notification for Photo Studio & Admin
      await tx.notification.create({
        data: {
          role: "STUDIO",
          type: "NEW_ORDER",
          title: "New Production Order Assigned",
          message: `Order #${newOrder.id} (${authenticatedCustomerName}) is ready for production.`,
          referenceType: "ORDER",
          referenceId: newOrder.id,
        },
      });

      // Clear customer's active database Cart
      await tx.cartItem.deleteMany({
        where: {
          OR: [
            { userId: user.id },
            { userId: cleanPhoneDigits },
          ],
        },
      });

      return newOrder;
    });

    // 7. Broadcast Real-Time Events to Connected Portals (Admin, Studio, Delivery, Customer)
    portalEvents.emit("order_change", { action: "CREATE", orderId: createdOrder.id });
    portalEvents.emit("order_update", { action: "CREATE", orderId: createdOrder.id });
    portalEvents.emit("payment_success", { orderId: createdOrder.id, paymentId: razorpayPaymentId });

    return NextResponse.json({
      success: true,
      order: createdOrder,
      message: "✓ Payment verified and order confirmed successfully in database!",
    });
  } catch (error: any) {
    console.error("Error in /api/payment/verify:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to verify payment." },
      { status: 500 }
    );
  }
}
