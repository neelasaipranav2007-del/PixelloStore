import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getAuthenticatedUser } from "@/lib/session";
import { createRazorpayOrder, getRazorpayKeys } from "@/lib/razorpay";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const user = await getAuthenticatedUser(req);
    if (!user) {
      return NextResponse.json(
        { success: false, error: "Authentication required. Please sign in to proceed to payment." },
        { status: 401 }
      );
    }

    const body = await req.json();
    const { items, deliveryAddress, promoCode, deliveryType, notes } = body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { success: false, error: "Cart is empty. Please add items before checking out." },
        { status: 400 }
      );
    }

    if (!deliveryAddress || typeof deliveryAddress !== "string" || deliveryAddress.trim().length < 5) {
      return NextResponse.json(
        { success: false, error: "Valid delivery address is required." },
        { status: 400 }
      );
    }

    // 1. Authoritative Price Calculation from Database
    let calculatedSubtotal = 0;
    const validatedItems = [];

    for (const item of items) {
      let itemPrice = Number(item.price) || 0;
      const quantity = Math.max(1, Number(item.quantity) || 1);

      // Verify product price from Database if productId is available
      if (item.productId) {
        const dbProduct = await prisma.product.findUnique({
          where: { id: item.productId },
        });
        if (dbProduct) {
          itemPrice = dbProduct.basePrice;
        }
      }

      calculatedSubtotal += itemPrice * quantity;

      validatedItems.push({
        name: item.name || "Custom Frame",
        size: item.size || "Standard",
        quantity,
        price: itemPrice,
        image: item.image || "/images/wooden_frame_main.png",
        photos: Array.isArray(item.photos) && item.photos.length > 0 ? item.photos : [item.image || "/images/wooden_frame_main.png"],
      });
    }

    // 2. Validate Promo / Referral Discount
    let discountAmount = 0;
    let validReferralCode: string | null = null;

    if (promoCode && typeof promoCode === "string") {
      const cleanCode = promoCode.trim().toUpperCase();

      // Check Coupon model in DB
      const dbCoupon = await prisma.coupon.findUnique({
        where: { code: cleanCode },
      });

      if (dbCoupon && dbCoupon.status === "Active") {
        if (dbCoupon.type === "percentage") {
          discountAmount = Math.round(calculatedSubtotal * (dbCoupon.value / 100));
        } else {
          discountAmount = dbCoupon.value;
        }
        validReferralCode = cleanCode;
      } else {
        // Check Ambassador Profile referralCode in DB
        const dbAmbassador = await prisma.ambassadorProfile.findUnique({
          where: { referralCode: cleanCode },
        });
        if (dbAmbassador) {
          discountAmount = Math.round(calculatedSubtotal * 0.10); // Standard 10% ambassador discount
          validReferralCode = cleanCode;
        }
      }
    }

    // Cap discount to subtotal
    discountAmount = Math.min(discountAmount, calculatedSubtotal);

    // 3. Calculate Delivery Fee
    const deliveryFee = calculatedSubtotal >= 999 ? 0 : 49;

    // 4. Calculate Final Authoritative Total Amount
    const finalTotalAmount = Math.max(1, calculatedSubtotal - discountAmount + deliveryFee);

    // 5. Generate Receipt ID
    const cleanPhone = (user.phone || "").replace(/\D/g, "").slice(-10) || "1000";
    const receipt = `rcpt_${cleanPhone}_${Date.now()}`;

    // 6. Create Razorpay Order
    const amountInPaisa = Math.round(finalTotalAmount * 100);
    const { keyId } = getRazorpayKeys();
    const razorpayOrder = await createRazorpayOrder({
      amountInPaisa,
      currency: "INR",
      receipt,
      notes: {
        userId: user.id,
        customerName: user.name || "Customer",
        customerPhone: user.phone || "",
        promoCode: validReferralCode || "",
        ...(notes || {}),
      },
    });

    return NextResponse.json({
      success: true,
      razorpayOrderId: razorpayOrder.id,
      isOfficial: razorpayOrder.isOfficial,
      amount: razorpayOrder.amount, // in paise
      amountInRupees: finalTotalAmount,
      currency: razorpayOrder.currency,
      keyId: keyId,
      customer: {
        id: user.id,
        name: user.name || "Customer",
        phone: user.phone || "",
        email: user.email || "",
      },
      summary: {
        subtotal: calculatedSubtotal,
        discount: discountAmount,
        deliveryFee,
        totalAmount: finalTotalAmount,
        referralCode: validReferralCode,
      },
      validatedItems,
      deliveryAddress,
      deliveryType: deliveryType || "Shipping",
    });
  } catch (error: any) {
    console.error("Error in /api/payment/create-order:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to initialize payment gateway order." },
      { status: 500 }
    );
  }
}
