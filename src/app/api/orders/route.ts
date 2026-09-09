import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { portalEvents } from "@/lib/events";
import { getAuthenticatedUser, getAuthenticatedAdmin } from "@/lib/session";
import { mapUiStatusToDb } from "@/lib/orderStatus";
import { sanitizeCustomerOrderData, mapInternalToCustomerStatus } from "@/lib/orderStatusMapping";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const admin = await getAuthenticatedAdmin(req);
    const user = await getAuthenticatedUser(req);
    
    // Privacy Safeguard: Only Admin and the owning Customer can view uploaded photos
    const isAuthorizedForPhotos = Boolean(admin || user);

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

    // Format for frontend context compatibility with safe customer mapping
    const formatted = dbOrders.map((o) => {
      const mapped = mapInternalToCustomerStatus(o.status);
      const sanitized = sanitizeCustomerOrderData(o);
      
      const parsedItems = o.items.map((it) => {
        let photos: string[] = [];
        if (it.customizationDetails) {
          try {
            const details = JSON.parse(it.customizationDetails);
            photos = details.photos || [];
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
          photos: isAuthorizedForPhotos ? photos : [],
        };
      });

      return {
        id: o.id,
        date: o.createdAt.toISOString().split("T")[0],
        createdAt: o.createdAt.getTime(),
        customerName: o.customerName,
        customerPhone: o.customerPhone,
        totalAmount: o.totalAmount,
        subtotal: o.totalAmount,
        status: mapped.customerStatus,
        rawStatus: o.status,
        stageIndex: mapped.stageIndex,
        stepTitle: mapped.stepTitle,
        stepDesc: mapped.stepDesc,
        badgeClass: mapped.badgeClass,
        assignedStudio: o.assignedStudio || "Studio Alpha (Central Powai Branch)",
        deliveryAddress: o.shippingAddress,
        items: parsedItems,
        deliveryInfo: sanitized?.deliveryInfo || {
          deliveryProvider: o.deliveryInfo?.deliveryProvider || o.deliveryInfo?.deliveryPartnerName || "Delhivery",
          trackingId: o.deliveryInfo?.trackingId || o.deliveryInfo?.awbNumber || null,
          awbNumber: o.deliveryInfo?.awbNumber || o.deliveryInfo?.trackingId || null,
          estimatedDeliveryDate: o.deliveryInfo?.estimatedDeliveryDate ? new Date(o.deliveryInfo.estimatedDeliveryDate).toISOString().split("T")[0] : null,
          shippedAt: o.deliveryInfo?.shippedAt ? new Date(o.deliveryInfo.shippedAt).toISOString() : (o.deliveryInfo?.pickupTime ? new Date(o.deliveryInfo.pickupTime).toISOString() : null),
          outForDeliveryAt: o.deliveryInfo?.outForDeliveryAt ? new Date(o.deliveryInfo.outForDeliveryAt).toISOString() : null,
          deliveredAt: o.deliveryInfo?.deliveredAt ? new Date(o.deliveryInfo.deliveredAt).toISOString() : (o.deliveryInfo?.deliveryTime ? new Date(o.deliveryInfo.deliveryTime).toISOString() : null),
          trackingUrl: o.deliveryInfo?.trackingUrl || (o.deliveryInfo?.awbNumber ? `https://www.delhivery.com/track/package/${o.deliveryInfo.awbNumber}` : null),
        },
        deliveryPartner: o.deliveryInfo?.deliveryProvider || o.deliveryInfo?.deliveryPartnerName || "Delhivery",
        trackingUrl: o.deliveryInfo?.trackingUrl || null,
        waybill: o.deliveryInfo?.awbNumber || o.deliveryInfo?.trackingId || null,
        pickupTime: o.deliveryInfo?.pickupTime ? o.deliveryInfo.pickupTime.toISOString() : null,
        deliveryTime: o.deliveryInfo?.deliveryTime ? o.deliveryInfo.deliveryTime.toISOString() : null,
        referralCode: o.referralCode || undefined,
        referralDiscount: o.referralDiscount || undefined,
        paymentMethod: o.transaction?.paymentMethod || "COD",
        deliveryType: (o.deliveryType as any) || "Shipping",
      };
    });

    return NextResponse.json({ success: true, orders: formatted });
  } catch (error: any) {
    console.error("Error fetching orders:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
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
    } = body;

    const rawPhone = (user?.phone || bodyPhone || "").trim();
    const cleanPhoneDigits = rawPhone.replace(/\D/g, "").slice(-10);
    const authenticatedCustomerName = user?.name || bodyName || `Customer (${cleanPhoneDigits.slice(-4)})`;
    const authenticatedCustomerPhone = user?.phone || (cleanPhoneDigits ? `+91 ${cleanPhoneDigits}` : "Customer");

    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { success: false, error: "Cart is empty. Please add items before placing order." },
        { status: 400 }
      );
    }

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
              customerProfile: {
                create: {},
              },
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

    // Generate readable permanent PXL Order ID format: PXL-<Last 4 Phone>-<Last 4 Pincode>
    const last4Phone = cleanPhoneDigits.length >= 4 ? cleanPhoneDigits.slice(-4) : "1000";
    const pincodeMatch = (deliveryAddress || "").match(/\b\d{6}\b/) || (deliveryAddress || "").match(/\b\d{4,6}\b/);
    const last4Pincode = pincodeMatch ? pincodeMatch[0].slice(-4) : "5000";
    const baseOrderId = `PXL-${last4Phone}-${last4Pincode}`;
    let generatedOrderId = baseOrderId;

    // Ensure database primary key uniqueness
    const existingOrder = await prisma.order.findUnique({ where: { id: generatedOrderId } });
    if (existingOrder) {
      let seq = 2;
      while (await prisma.order.findUnique({ where: { id: `${baseOrderId}-${seq}` } })) {
        seq++;
      }
      generatedOrderId = `${baseOrderId}-${seq}`;
    }

    const createdOrder = await prisma.$transaction(async (tx) => {
      // 1. Create main Order in Central DB
      const newOrder = await tx.order.create({
        data: {
          id: generatedOrderId,
          customerProfileId: customerProfileId || null,
          customerName: authenticatedCustomerName,
          customerPhone: authenticatedCustomerPhone,
          totalAmount: Number(totalAmount) || 0,
          status: "PLACED",
          deliveryType: deliveryType || "Shipping",
          assignedStudio: "Studio Alpha (Central Powai Branch)",
          shippingAddress: deliveryAddress || "CHRISTIANS COLONY, HASTINAPURAM, Sarada Nagar, Hyderabad",
          referralCode: referralCode ? referralCode.toUpperCase() : null,
          items: {
            create: items.map((it: any) => ({
              name: it.name || "Custom Frame",
              size: it.size || "Standard",
              quantity: Number(it.quantity) || 1,
              price: Number(it.price) || 0,
              image: it.image || "/images/wooden_frame_main.png",
              customizationDetails: JSON.stringify({ photos: it.photos || [it.image] }),
            })),
          },
          history: {
            create: {
              status: "PLACED",
              note: `Order placed successfully by ${authenticatedCustomerName}`,
            },
          },
          transaction: {
            create: {
              amount: Number(totalAmount) || 0,
              paymentMethod: paymentMethod || "COD",
              status: "SUCCESS",
            },
          },
        },
        include: {
          items: true,
          history: true,
          transaction: true,
        },
      });

      // 2. Attribute Ambassador Commission if referral code passed
      if (referralCode) {
        const ambassador = await tx.ambassadorProfile.findUnique({
          where: { referralCode: referralCode.toUpperCase() },
        });

        if (ambassador) {
          const commissionAmount = Math.round((Number(totalAmount) || 0) * 0.1); // 10% commission
          await tx.commission.create({
            data: {
              orderId: newOrder.id,
              ambassadorProfileId: ambassador.id,
              referralCode: referralCode.toUpperCase(),
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

      // 3. Create Real Database Notifications for Admin, Studio, and Customer
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

      await tx.notification.create({
        data: {
          role: "STUDIO",
          type: "NEW_ORDER",
          title: "New Order Assigned",
          message: `Order #${newOrder.id} (${authenticatedCustomerName}) assigned for studio printing.`,
          referenceType: "ORDER",
          referenceId: newOrder.id,
        },
      });

      if (customerProfileId) {
        const cProfile = await tx.customerProfile.findUnique({
          where: { id: customerProfileId },
        });
        if (cProfile?.userId) {
          await tx.notification.create({
            data: {
              userId: cProfile.userId,
              role: "CUSTOMER",
              type: "ORDER_CONFIRMED",
              title: "Order Confirmed",
              message: `Order #${newOrder.id} is confirmed and sent to studio for preparation.`,
              referenceType: "ORDER",
              referenceId: newOrder.id,
            },
          });
        }
      }

      return newOrder;
    });

    // Broadcast real-time events to all connected portals (Admin, Customer, Studio, Delivery)
    portalEvents.emit("order_change", { action: "CREATE", orderId: createdOrder.id });
    portalEvents.emit("order_update", { action: "CREATE", orderId: createdOrder.id });
    portalEvents.emit("notification_change", { action: "CREATE", orderId: createdOrder.id });

    return NextResponse.json({ success: true, order: createdOrder });
  } catch (error: unknown) {
    const err = error as Error;
    console.error("Error creating order:", err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
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
          note: note || `Order status updated to ${status}`,
        },
      });

      if (dbStatus === "PICKED_UP" || dbStatus === "OUT_FOR_DELIVERY" || dbStatus === "DELIVERED") {
        await tx.deliveryInfo.upsert({
          where: { orderId: order.id },
          update: {
            deliveryPartnerName: "Ramesh Kumar",
            ...(dbStatus === "PICKED_UP" ? { pickupTime: new Date() } : {}),
            ...(dbStatus === "DELIVERED" ? { deliveryTime: new Date() } : {}),
          },
          create: {
            orderId: order.id,
            deliveryPartnerName: "Ramesh Kumar",
            ...(dbStatus === "PICKED_UP" ? { pickupTime: new Date() } : {}),
            ...(dbStatus === "DELIVERED" ? { deliveryTime: new Date() } : {}),
          },
        });
      }

      return order;
    });

    if (!updated) {
      return NextResponse.json({ success: false, error: "Order not found" }, { status: 404 });
    }

    portalEvents.emit("order_change", { action: "STATUS_UPDATE", orderId: updated.id, status: dbStatus });
    portalEvents.emit("order_update", { action: "STATUS_UPDATE", orderId: updated.id, status: dbStatus });

    return NextResponse.json({ success: true, order: updated });
  } catch (error: unknown) {
    const err = error as Error;
    console.error("Error updating order status:", err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
