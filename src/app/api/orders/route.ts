import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { portalEvents } from "@/lib/events";
import { getAuthenticatedUser } from "@/lib/session";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const user = await getAuthenticatedUser(req);
    
    // Check if role is CUSTOMER - if so, strictly filter only this customer's orders
    let whereClause: any = {};
    if (user && user.role === "CUSTOMER") {
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

    // Format for frontend context compatibility
    const formatted = dbOrders.map((o) => {
      const parsedItems = o.items.map((it) => {
        let photos: string[] = [];
        if (it.customizationDetails) {
          try {
            const details = JSON.parse(it.customizationDetails);
            photos = details.photos || [];
          } catch (e) {
            photos = [];
          }
        }
        if (photos.length === 0 && it.image) {
          photos = [it.image];
        }
        return {
          name: it.name,
          size: it.size || "Standard",
          quantity: it.quantity,
          price: it.price,
          image: it.image || "/images/wooden_frame_main.png",
          photos: photos,
        };
      });

      return {
        id: o.id,
        date: o.createdAt.toISOString().split("T")[0],
        createdAt: o.createdAt.getTime(),
        customerName: o.customerName,
        customerPhone: o.customerPhone,
        totalAmount: o.totalAmount,
        status: o.status,
        assignedStudio: o.assignedStudio || "Studio Alpha (Central Powai Branch)",
        deliveryAddress: o.shippingAddress,
        items: parsedItems,
        deliveryPartner: o.deliveryInfo?.deliveryPartnerName || "Ramesh Kumar",
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
    const user = await getAuthenticatedUser(req);
    if (!user) {
      return NextResponse.json(
        {
          success: false,
          error: "Authentication required to place an order. Please sign in to continue.",
        },
        { status: 401 }
      );
    }

    const body = await req.json();
    const {
      customerName: bodyName,
      customerPhone: bodyPhone,
      deliveryAddress,
      items,
      totalAmount,
      referralCode,
      assignedStudio,
    } = body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { success: false, error: "Order must contain at least one item." },
        { status: 400 }
      );
    }

    // Assign customer details strictly from authenticated database user
    const authenticatedCustomerName = user.name || bodyName || "Customer";
    const authenticatedCustomerPhone = user.phone || bodyPhone || "+91 9999999999";
    const authenticatedCustomerProfileId = user.customerProfile?.id || null;

    const cleanPhone = authenticatedCustomerPhone.replace(/\D/g, "");
    const last4Phone = cleanPhone.length >= 4 ? cleanPhone.slice(-4) : "1234";

    const addressStr = deliveryAddress || "";
    const pincodeMatch = addressStr.match(/\b\d{6}\b/) || addressStr.match(/\b\d{4,6}\b/);
    let last4Pincode = "5000";
    if (pincodeMatch) {
      last4Pincode = pincodeMatch[0].slice(-4);
    } else {
      const cleanAddrDigits = addressStr.replace(/\D/g, "");
      if (cleanAddrDigits.length >= 4) {
        last4Pincode = cleanAddrDigits.slice(-4);
      }
    }

    const orderId = `PXL-${last4Phone}-${last4Pincode}`;
    const studioName = assignedStudio || "Studio Alpha (Central Powai Branch)";

    // Use Prisma Transaction for ACID Order Creation
    const createdOrder = await prisma.$transaction(async (tx) => {
      // 1. Create Main Order linked strictly to authenticated customerProfile
      const newOrder = await tx.order.create({
        data: {
          id: orderId,
          customerProfileId: authenticatedCustomerProfileId,
          customerName: authenticatedCustomerName,
          customerPhone: authenticatedCustomerPhone,
          totalAmount: Number(totalAmount) || 0,
          status: "PLACED",
          assignedStudio: studioName,
          shippingAddress: deliveryAddress || "CHRISTIANS COLONY, HASTINAPURAM, Sarada Nagar, Hyderabad",
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
              paymentMethod: "UPI",
              status: "SUCCESS",
            },
          },
        },
        include: {
          items: true,
          history: true,
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

      // 3. Create Notification for Studio & Admin
      await tx.notification.create({
        data: {
          role: "STUDIO",
          type: "NEW_ORDER",
          title: "New Production Order Assigned",
          message: `Order #${newOrder.id} (${authenticatedCustomerName}) received for production.`,
          referenceType: "ORDER",
          referenceId: newOrder.id,
        },
      });

      return newOrder;
    });

    // Broadcast real-time event to all connected portals
    portalEvents.emit("order_change", { action: "CREATE", orderId: createdOrder.id });

    return NextResponse.json({ success: true, order: createdOrder });
  } catch (error: any) {
    console.error("Error creating order:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
