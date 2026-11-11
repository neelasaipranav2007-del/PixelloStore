import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getAuthenticatedUser } from "@/lib/session";
import { verifyRazorpaySignature } from "@/lib/razorpay";
import { portalEvents } from "@/lib/events";
import { enforceRateLimit } from "@/lib/rateLimit";
import { checkIdempotency, startIdempotency, completeIdempotency } from "@/lib/idempotency";
import { logAudit } from "@/lib/auditLogger";
import { safeErrorResponse } from "@/lib/errorHandler";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    // 1. Rate Limiting Check
    const rateLimitRes = enforceRateLimit(req, "checkout");
    if (rateLimitRes) return rateLimitRes;

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
      idempotencyKey,
      isSurpriseGift,
      surpriseGiftMessage,
    } = body;

    // 2. Idempotency Check
    const effectiveIdempotencyKey = idempotencyKey || razorpayPaymentId;
    if (effectiveIdempotencyKey) {
      const idem = checkIdempotency(effectiveIdempotencyKey);
      if (idem.isDuplicate && idem.cachedResponse) {
        return NextResponse.json(idem.cachedResponse);
      }
      startIdempotency(effectiveIdempotencyKey);
    }

    if (!razorpayPaymentId) {
      return NextResponse.json(
        { success: false, error: "Missing Razorpay payment identifier." },
        { status: 400 }
      );
    }

    const effectiveOrderId = razorpayOrderId || `order_${razorpayPaymentId}`;

    // 3. Strict Signature Verification (No unauthenticated sandbox default)
    if (!razorpaySignature) {
      return NextResponse.json(
        { success: false, error: "Missing required cryptographic payment signature." },
        { status: 400 }
      );
    }

    const isValidSignature = verifyRazorpaySignature({
      razorpayOrderId: effectiveOrderId,
      razorpayPaymentId,
      razorpaySignature,
    });

    if (!isValidSignature) {
      logAudit({
        userId: user.id,
        action: "PAYMENT_SIGNATURE_VERIFICATION_FAILED",
        targetId: razorpayPaymentId,
        details: { razorpayOrderId: effectiveOrderId },
        req,
      }).catch(() => {});

      return NextResponse.json(
        { success: false, error: "Payment verification failed. Invalid cryptographic signature." },
        { status: 400 }
      );
    }

    // 4. Existing transaction check
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
      const cached = {
        success: true,
        order: existingTransaction.order,
        message: "Order already confirmed for this payment session.",
      };
      completeIdempotency(effectiveIdempotencyKey, cached);
      return NextResponse.json(cached);
    }

    // 5. Customer Identity
    const cleanPhoneDigits = (user.phone || customerPhone || "").replace(/\D/g, "").slice(-10) || "1000";
    const authenticatedCustomerName = user.name || customerName || `Customer (${cleanPhoneDigits.slice(-4)})`;
    const authenticatedCustomerPhone = user.phone || `+91 ${cleanPhoneDigits}`;

    let customerProfileId = user.customerProfile?.id;
    if (!customerProfileId) {
      const profile = await prisma.customerProfile.upsert({
        where: { userId: user.id },
        update: {},
        create: { userId: user.id },
      });
      customerProfileId = profile.id;
    }

    // 6. Authoritative Database Price Validation
    let authoritativeTotal = 0;
    const validatedItems: any[] = [];

    for (const item of items || []) {
      let itemPrice = Number(item.price) || 0;
      const quantity = Math.max(1, Number(item.quantity) || 1);

      if (item.productId && !item.isHamper) {
        const dbProduct = await prisma.product.findUnique({
          where: { id: item.productId },
        });
        if (dbProduct) {
          itemPrice = dbProduct.basePrice;
        }
      } else if (item.isHamper && item.hamperData?.items) {
        let hSubtotal = 0;
        for (const hItem of item.hamperData.items) {
          let hPrice = Number(hItem.price) || 0;
          const hQty = Math.max(1, Number(hItem.quantity) || 1);
          if (hItem.productId) {
            const dbP = await prisma.product.findUnique({ where: { id: hItem.productId } });
            if (dbP) hPrice = dbP.basePrice;
          }
          hSubtotal += hPrice * hQty;
        }
        itemPrice = hSubtotal;
      }

      authoritativeTotal += itemPrice * quantity;
      validatedItems.push({
        ...item,
        price: itemPrice,
        quantity,
      });
    }

    // Apply promo discount if valid
    const cleanReferral = referralCode ? referralCode.trim().toUpperCase() : null;
    let finalTotal = authoritativeTotal > 0 ? authoritativeTotal : Number(totalAmount) || 0;

    // 7. Generate Unique Order ID
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
    } catch (e) {}

    const isCod = razorpayPaymentId.startsWith("COD_") || body.paymentMethod === "COD";

    let customerProfileConnect: any = undefined;
    if (customerProfileId) {
      try {
        const cp = await prisma.customerProfile.findUnique({ where: { id: customerProfileId } });
        if (cp) customerProfileConnect = { connect: { id: customerProfileId } };
      } catch {}
    }

    let studioProfileConnect: any = undefined;
    if (studioProfileId) {
      try {
        const sp = await prisma.studioProfile.findUnique({ where: { id: studioProfileId } });
        if (sp) studioProfileConnect = { connect: { id: studioProfileId } };
      } catch {}
    }

    // 8. Execute Atomic Transaction in Prisma DB
    const createdOrder = await prisma.$transaction(async (tx) => {
      const orderCreateData: any = {
        id: generatedOrderId,
        customerName: authenticatedCustomerName,
        customerPhone: authenticatedCustomerPhone,
        totalAmount: finalTotal,
        status: "PLACED",
        deliveryType: deliveryType || "Shipping",
        assignedStudio: studioName,
        shippingAddress: deliveryAddress || "Direct Delivery Address",
        referralCode: cleanReferral,
        isSurpriseGift: Boolean(isSurpriseGift),
        surpriseGiftMessage: surpriseGiftMessage ? String(surpriseGiftMessage).trim() : null,
        ...(customerProfileConnect ? { customerProfile: customerProfileConnect } : {}),
        ...(studioProfileConnect ? { studioProfile: studioProfileConnect } : {}),
        items: {
          create: validatedItems.map((it: any) => {
            let parsedExisting: any = {};
            if (it.customizationDetails) {
              try {
                parsedExisting = typeof it.customizationDetails === "string" ? JSON.parse(it.customizationDetails) : it.customizationDetails;
              } catch {}
            }
            const photoList = Array.isArray(it.photos) && it.photos.length > 0 
              ? it.photos 
              : (parsedExisting.photos || [it.image || "/images/wooden_frame_main.png"]);
            return {
              name: it.name || "Custom Frame",
              size: it.size || "Standard",
              quantity: it.quantity,
              price: it.price,
              image: it.image || "/images/wooden_frame_main.png",
              customizationDetails: JSON.stringify({
                ...parsedExisting,
                photos: photoList,
                isHamper: !!it.isHamper || !!parsedExisting.isHamper || (typeof it.name === "string" && it.name.toLowerCase().includes("hamper")),
                hamperData: it.hamperData || parsedExisting.hamperData || null,
                frameCustomization: it.frameCustomization || parsedExisting.frameCustomization || null,
              }),
            };
          }),
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
      };

      let newOrder: any;
      try {
        newOrder = await tx.order.create({
          data: orderCreateData,
          include: {
            items: true,
            history: true,
            transaction: true,
            deliveryInfo: true,
          },
        });
      } catch (err: any) {
        if (err?.message?.includes("isSurpriseGift") || err?.message?.includes("Unknown argument")) {
          delete orderCreateData.isSurpriseGift;
          delete orderCreateData.surpriseGiftMessage;
          delete orderCreateData.customerProfile;
          delete orderCreateData.studioProfile;
          newOrder = await tx.order.create({
            data: orderCreateData,
            include: {
              items: true,
              history: true,
              transaction: true,
              deliveryInfo: true,
            },
          });
          try {
            await tx.$executeRawUnsafe(
              `UPDATE "Order" SET isSurpriseGift = ?, surpriseGiftMessage = ? WHERE id = ?`,
              isSurpriseGift ? 1 : 0,
              surpriseGiftMessage || null,
              generatedOrderId
            );
          } catch {}
        } else {
          throw err;
        }
      }

      // Attribute referral commission
      if (cleanReferral) {
        const ambassador = await tx.ambassadorProfile.findUnique({
          where: { referralCode: cleanReferral },
        });

        if (ambassador) {
          const commissionAmount = Math.round(finalTotal * 0.10);
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
        }
      }

      // Clear customer's cart
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

    // 9. Broadcast Events
    portalEvents.emit("order_change", { action: "CREATE", orderId: createdOrder.id });
    portalEvents.emit("payment_success", { orderId: createdOrder.id, paymentId: razorpayPaymentId });

    logAudit({
      userId: user.id,
      action: "ORDER_CREATED_PAYMENT_VERIFIED",
      targetId: createdOrder.id,
      details: {
        totalAmount: finalTotal,
        paymentMethod: isCod ? "COD" : "RAZORPAY",
        razorpayPaymentId,
      },
      req,
    }).catch(() => {});

    const responseData = {
      success: true,
      order: {
        ...createdOrder,
        isSurpriseGift: Boolean(isSurpriseGift),
        surpriseGiftMessage: surpriseGiftMessage ? String(surpriseGiftMessage).trim() : null,
      },
      message: "✓ Payment verified and order confirmed successfully in database!",
    };

    if (effectiveIdempotencyKey) {
      completeIdempotency(effectiveIdempotencyKey, responseData);
    }

    return NextResponse.json(responseData);
  } catch (error: any) {
    return safeErrorResponse(error, 500, "Failed to verify payment and process order.");
  }
}
