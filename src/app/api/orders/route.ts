import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { portalEvents } from "@/lib/events";
import {
  getAuthenticatedUser,
  getAuthenticatedAdmin,
  getAuthenticatedDelivery,
} from "@/lib/session";
import { mapUiStatusToDb } from "@/lib/orderStatus";
import {
  sanitizeCustomerOrderData,
  mapInternalToCustomerStatus,
} from "@/lib/orderStatusMapping";
import { enforceRateLimit } from "@/lib/rateLimit";
import { validateOrderItems, sanitizeText } from "@/lib/validators";
import { checkIdempotency, startIdempotency, completeIdempotency } from "@/lib/idempotency";
import { logAudit } from "@/lib/auditLogger";
import { safeErrorResponse } from "@/lib/errorHandler";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const admin = await getAuthenticatedAdmin(req);
    const user = await getAuthenticatedUser(req);

    // Privacy Safeguard: Require authentication to access orders. For unauthenticated guests, return empty list.
    if (!admin && !user) {
      return NextResponse.json({
        success: true,
        orders: [],
        count: 0,
        message: "Sign in required to view personal orders",
      });
    }

    let whereClause: Record<string, unknown> = {};
    if (!admin && user && user.role === "CUSTOMER") {
      const cleanPhone = (user.phone || "").replace(/\D/g, "").slice(-10);
      whereClause = {
        OR: [
          user.customerProfile?.id ? { customerProfileId: user.customerProfile.id } : {},
          user.phone ? { customerPhone: user.phone } : {},
          cleanPhone ? { customerPhone: { contains: cleanPhone } } : {},
        ],
      };
    }

    const dbOrders = await prisma.order.findMany({
      where: whereClause,
      include: {
        items: true,
        history: true,
        transaction: true,
        commission: true,
        deliveryInfo: true,
      },
      orderBy: { createdAt: "desc" },
    });

    const formatted = dbOrders.map((o) => {
      const mapped = mapInternalToCustomerStatus(o.status);
      const sanitized = sanitizeCustomerOrderData(o);

      const parsedItems = o.items.map((it) => {
        let photos: string[] = [];
        let isHamper = false;
        let hamperData = null;
        if (it.customizationDetails) {
          try {
            const details = JSON.parse(it.customizationDetails);
            photos = details.photos || [];
            isHamper =
              !!details.isHamper ||
              (typeof it.name === "string" && it.name.toLowerCase().includes("hamper"));
            hamperData = details.hamperData || null;
          } catch {
            photos = [];
          }
        }
        return {
          id: it.id,
          name: it.name,
          size: it.size || "Standard",
          quantity: it.quantity,
          price: it.price,
          image: it.image || "/images/wooden_frame_main.png",
          photos,
          isHamper,
          hamperData,
        };
      });

      return {
        id: o.id,
        orderId: o.id,
        orderNumber: o.id,
        date: o.createdAt.toISOString().split("T")[0],
        createdAt: o.createdAt.toISOString(),
        totalAmount: o.totalAmount,
        total: o.totalAmount,
        status: typeof mapped === "object" && mapped?.customerStatus ? mapped.customerStatus : (typeof mapped === "string" ? mapped : o.status),
        customerStatusInfo: mapped,
        internalStatus: o.status,
        customerName: o.customerName,
        customerPhone: o.customerPhone,
        shippingAddress: o.shippingAddress,
        deliveryAddress: o.shippingAddress,
        items: parsedItems,
        deliveryInfo: sanitized?.deliveryInfo || {
          deliveryProvider: o.deliveryInfo?.deliveryProvider || o.deliveryInfo?.deliveryPartnerName || "Delhivery",
          trackingId: o.deliveryInfo?.trackingId || o.deliveryInfo?.awbNumber || null,
          awbNumber: o.deliveryInfo?.awbNumber || o.deliveryInfo?.trackingId || null,
          estimatedDeliveryDate: o.deliveryInfo?.estimatedDelivery || null,
          shippedAt: o.deliveryInfo?.shippedAt ? new Date(o.deliveryInfo.shippedAt).toISOString() : null,
          outForDeliveryAt: o.deliveryInfo?.outForDeliveryAt ? new Date(o.deliveryInfo.outForDeliveryAt).toISOString() : null,
          deliveredAt: o.deliveryInfo?.deliveredAt ? new Date(o.deliveryInfo.deliveredAt).toISOString() : null,
          trackingUrl: o.deliveryInfo?.trackingUrl || null,
        },
        deliveryPartner: o.deliveryInfo?.deliveryProvider || o.deliveryInfo?.deliveryPartnerName || "Delhivery",
        trackingUrl: o.deliveryInfo?.trackingUrl || null,
        waybill: o.deliveryInfo?.awbNumber || o.deliveryInfo?.trackingId || null,
        trackingAwb: o.deliveryInfo?.awbNumber || o.deliveryInfo?.trackingId || null,
        referralCode: o.referralCode || undefined,
        referralDiscount: o.referralDiscount || undefined,
        isSurpriseGift: Boolean(o.isSurpriseGift),
        surpriseGiftMessage: o.surpriseGiftMessage || null,
        paymentMethod: o.transaction?.paymentMethod || "COD",
        deliveryType: (o.deliveryType as any) || "Shipping",
      };
    });

    return NextResponse.json({ success: true, orders: formatted });
  } catch (error: any) {
    return safeErrorResponse(error, 500, "Error fetching orders");
  }
}

export async function POST(req: Request) {
  try {
    // 1. Rate Limiting Check
    const rateLimitRes = enforceRateLimit(req, "checkout");
    if (rateLimitRes) return rateLimitRes;

    let user = await getAuthenticatedUser(req);
    const body = await req.json();
    const {
      customerName: bodyName,
      customerPhone: bodyPhone,
      deliveryAddress,
      items,
      totalAmount,
      referralCode,
      paymentMethod,
      deliveryType,
      idempotencyKey,
      isSurpriseGift,
      surpriseGiftMessage,
    } = body;

    // 2. Idempotency Check
    if (idempotencyKey) {
      const idem = checkIdempotency(idempotencyKey);
      if (idem.isDuplicate && idem.cachedResponse) {
        return NextResponse.json(idem.cachedResponse);
      }
      startIdempotency(idempotencyKey);
    }

    // 3. Input Validation
    const itemValidation = validateOrderItems(items);
    if (!itemValidation.valid) {
      return NextResponse.json(
        { success: false, error: itemValidation.error },
        { status: 400 }
      );
    }

    const rawPhone = (user?.phone || bodyPhone || "").trim();
    const cleanPhoneDigits = rawPhone.replace(/\D/g, "").slice(-10);
    const authenticatedCustomerName = sanitizeText(user?.name || bodyName || `Customer (${cleanPhoneDigits.slice(-4)})`, 100);
    const authenticatedCustomerPhone = user?.phone || (cleanPhoneDigits ? `+91 ${cleanPhoneDigits}` : "Customer");
    const sanitizedAddress = sanitizeText(deliveryAddress || "Direct Delivery Address", 500);

    // Auto find or create User & CustomerProfile if token was not passed
    let customerProfileId = user?.customerProfile?.id;
    if (!customerProfileId && cleanPhoneDigits) {
      try {
        let existingUser = await prisma.user.findFirst({
          where: {
            OR: [
              { phone: `+91 ${cleanPhoneDigits}` },
              { phone: cleanPhoneDigits },
              { phone: { contains: cleanPhoneDigits } },
            ],
          },
          include: { customerProfile: true },
        });

        if (!existingUser) {
          existingUser = await prisma.user.create({
            data: {
              name: authenticatedCustomerName,
              phone: `+91 ${cleanPhoneDigits}`,
              email: `${cleanPhoneDigits}@pixello.store`,
              role: "CUSTOMER",
              customerProfile: { create: {} },
            },
            include: { customerProfile: true },
          });
        } else if (!existingUser.customerProfile) {
          const profile = await prisma.customerProfile.create({
            data: { userId: existingUser.id },
          });
          existingUser.customerProfile = profile;
        }

        customerProfileId = existingUser.customerProfile?.id;
      } catch (err) {
        console.warn("Auto profile creation note:", err);
      }
    }

    // 4. Authoritative Database Price Calculation (Never trust frontend price)
    let authoritativeTotal = 0;
    const validatedItems: any[] = [];

    for (const item of items) {
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

    const calculatedTotal = authoritativeTotal > 0 ? authoritativeTotal : Number(totalAmount) || 0;

    // 5. Generate Order ID
    const last4Phone = cleanPhoneDigits.length >= 4 ? cleanPhoneDigits.slice(-4) : "1000";
    const pincodeMatch = sanitizedAddress.match(/\b\d{6}\b/) || sanitizedAddress.match(/\b\d{4,6}\b/);
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

    const cleanReferral = referralCode ? referralCode.trim().toUpperCase() : null;

    let customerProfileConnect: any = undefined;
    if (customerProfileId) {
      try {
        const cp = await prisma.customerProfile.findUnique({ where: { id: customerProfileId } });
        if (cp) customerProfileConnect = { connect: { id: customerProfileId } };
      } catch {}
    }

    // 6. Atomic Database Transaction
    const createdOrder = await prisma.$transaction(async (tx) => {
      const orderCreateData: any = {
        id: generatedOrderId,
        customerName: authenticatedCustomerName,
        customerPhone: authenticatedCustomerPhone,
        totalAmount: calculatedTotal,
        status: "PLACED",
        deliveryType: deliveryType || "Shipping",
        assignedStudio: "Studio Alpha (Central Powai Branch)",
        shippingAddress: sanitizedAddress,
        referralCode: cleanReferral,
        isSurpriseGift: Boolean(isSurpriseGift),
        surpriseGiftMessage: surpriseGiftMessage ? String(surpriseGiftMessage).trim() : null,
        ...(customerProfileConnect ? { customerProfile: customerProfileConnect } : {}),
        items: {
          create: validatedItems.map((it: any) => {
            let parsedExisting: any = {};
            if (it.customizationDetails) {
              try {
                parsedExisting = typeof it.customizationDetails === "string" ? JSON.parse(it.customizationDetails) : it.customizationDetails;
              } catch {}
            }
            return {
              name: it.name || "Custom Frame",
              size: it.size || "Standard",
              quantity: it.quantity,
              price: it.price,
              image: it.image || "/images/wooden_frame_main.png",
              customizationDetails: JSON.stringify({
                ...parsedExisting,
                photos: it.photos || parsedExisting.photos || [it.image],
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
            note: `Order placed successfully by ${authenticatedCustomerName}`,
          },
        },
        transaction: {
          create: {
            amount: calculatedTotal,
            paymentMethod: paymentMethod || "COD",
            status: paymentMethod === "ONLINE" ? "PENDING" : "SUCCESS",
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
          },
        });
      } catch (err: any) {
        if (err?.message?.includes("isSurpriseGift") || err?.message?.includes("Unknown argument")) {
          delete orderCreateData.isSurpriseGift;
          delete orderCreateData.surpriseGiftMessage;
          delete orderCreateData.customerProfile;
          newOrder = await tx.order.create({
            data: orderCreateData,
            include: {
              items: true,
              history: true,
              transaction: true,
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

      // Ambassador Commission
      if (cleanReferral) {
        const ambassador = await tx.ambassadorProfile.findUnique({
          where: { referralCode: cleanReferral },
        });

        if (ambassador) {
          const commissionAmount = Math.round(calculatedTotal * 0.1);
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

      // Notifications
      await tx.notification.create({
        data: {
          role: "ADMIN",
          type: "NEW_ORDER",
          title: "New Order Received",
          message: `Order #${newOrder.id} placed by ${authenticatedCustomerName} — ₹${newOrder.totalAmount.toFixed(2)}`,
          referenceType: "ORDER",
          referenceId: newOrder.id,
        },
      });

      return newOrder;
    });

    portalEvents.emit("order_change", { action: "CREATE", orderId: createdOrder.id });

    logAudit({
      userId: user?.id,
      action: "ORDER_CREATED_COD",
      targetId: createdOrder.id,
      details: { totalAmount: calculatedTotal, paymentMethod: paymentMethod || "COD" },
      req,
    }).catch(() => {});

    const responseData = { success: true, order: createdOrder };
    if (idempotencyKey) {
      completeIdempotency(idempotencyKey, responseData);
    }

    return NextResponse.json(responseData);
  } catch (error: any) {
    return safeErrorResponse(error, 500, "Error creating order");
  }
}

export async function PATCH(req: Request) {
  try {
    // RBAC Check: Order status mutation requires Admin, Delivery, or Studio authentication
    const admin = await getAuthenticatedAdmin(req);
    const delivery = await getAuthenticatedDelivery(req);

    if (!admin && !delivery) {
      return NextResponse.json(
        { success: false, error: "Unauthorized. Admin or Delivery credentials required to update order status." },
        { status: 401 }
      );
    }

    const body = await req.json();
    const { orderId, id, status, note } = body;
    const targetId = orderId || id;

    if (!targetId || !status) {
      return NextResponse.json(
        { success: false, error: "Missing orderId or status" },
        { status: 400 }
      );
    }

    const dbStatus = mapUiStatusToDb(status);

    const updated = await prisma.$transaction(async (tx) => {
      let targetOrder = await tx.order.findUnique({
        where: { id: targetId },
      });

      if (!targetOrder) {
        targetOrder = await tx.order.findFirst({
          where: {
            OR: [
              { id: targetId.toUpperCase() },
              { id: targetId.toLowerCase() },
              { id: { contains: targetId } },
            ],
          },
        });
      }

      if (!targetOrder) {
        return null;
      }

      const order = await tx.order.update({
        where: { id: targetOrder.id },
        data: { status: dbStatus },
      });

      await tx.orderStatusHistory.create({
        data: {
          orderId: order.id,
          status: dbStatus,
          note: note || `Order status updated to ${status} by ${admin ? "Admin" : "Delivery Partner"}`,
        },
      });

      return order;
    });

    if (!updated) {
      return NextResponse.json({ success: false, error: "Order not found" }, { status: 404 });
    }

    logAudit({
      userId: admin?.user?.id || delivery?.user?.id,
      actorRole: admin ? "ADMIN" : "DELIVERY",
      action: "ORDER_STATUS_UPDATED",
      targetId: updated.id,
      details: { newStatus: dbStatus, previousStatus: updated.status },
      req,
    }).catch(() => {});

    portalEvents.emit("order_change", { action: "STATUS_UPDATE", orderId: updated.id, status: dbStatus });

    return NextResponse.json({ success: true, order: updated });
  } catch (error: any) {
    return safeErrorResponse(error, 500, "Error updating order status");
  }
}
