import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getAuthenticatedUser, getAuthenticatedAdmin } from "@/lib/session";
import { sanitizeCustomerOrderData, mapInternalToCustomerStatus } from "@/lib/orderStatusMapping";
import { safeErrorResponse } from "@/lib/errorHandler";

export const dynamic = "force-dynamic";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    if (!id) {
      return NextResponse.json({ success: false, error: "Order ID is required." }, { status: 400 });
    }

    const authUser = await getAuthenticatedUser(req);
    const authAdmin = await getAuthenticatedAdmin(req);

    // Retrieve order with all items, transaction, and delivery details
    const order = await prisma.order.findUnique({
      where: { id },
      include: {
        items: true,
        history: {
          orderBy: { createdAt: "asc" },
        },
        deliveryInfo: true,
        transaction: true,
      },
    });

    if (!order) {
      return NextResponse.json({ success: false, error: "Order not found." }, { status: 404 });
    }

    // Ownership & RBAC check: Only the owning customer or authorized Admin can view order details
    if (!authAdmin) {
      if (!authUser) {
        return NextResponse.json(
          { success: false, error: "Unauthorized. Please sign in to view this order." },
          { status: 401 }
        );
      }

      const cleanUserPhone = (authUser.phone || "").replace(/\D/g, "").slice(-10);
      const cleanOrderPhone = (order.customerPhone || "").replace(/\D/g, "").slice(-10);

      const isOwnerByProfile =
        authUser.customerProfile?.id && order.customerProfileId === authUser.customerProfile.id;
      const isOwnerByPhone =
        cleanUserPhone && cleanOrderPhone && cleanUserPhone === cleanOrderPhone;

      if (!isOwnerByProfile && !isOwnerByPhone) {
        return NextResponse.json(
          { success: false, error: "Forbidden. You do not have permission to view this order." },
          { status: 403 }
        );
      }
    }

    // Parse customization details on items
    const parsedItems = order.items.map((it) => {
      let parsedCustomization: any = null;
      let photos: string[] = [];
      let isHamper = false;
      let hamperData = null;

      if (it.customizationDetails) {
        try {
          parsedCustomization = JSON.parse(it.customizationDetails);
          photos = parsedCustomization.photos || [];
          isHamper =
            !!parsedCustomization.isHamper ||
            (typeof it.name === "string" && it.name.toLowerCase().includes("hamper"));
          hamperData = parsedCustomization.hamperData || null;
        } catch {
          parsedCustomization = null;
        }
      }

      return {
        id: it.id,
        productId: it.productId,
        name: it.name,
        size: it.size,
        quantity: it.quantity,
        price: it.price,
        image: it.image,
        photos,
        isHamper,
        hamperData,
        customizationDetails: parsedCustomization,
      };
    });

    const sanitizedOrder = sanitizeCustomerOrderData(order);
    const mappedStatus = mapInternalToCustomerStatus(order.status);

    return NextResponse.json({
      success: true,
      order: {
        ...sanitizedOrder,
        isSurpriseGift: Boolean(order.isSurpriseGift),
        surpriseGiftMessage: order.surpriseGiftMessage || null,
        status: typeof mappedStatus === "object" && mappedStatus?.customerStatus ? mappedStatus.customerStatus : (typeof mappedStatus === "string" ? mappedStatus : order.status),
        customerStatusInfo: mappedStatus,
        rawStatus: order.status,
        items: parsedItems,
        deliveryInfo: order.deliveryInfo
          ? {
              deliveryPartnerName: order.deliveryInfo.deliveryPartnerName,
              deliveryStatus: order.deliveryInfo.deliveryStatus,
              awbNumber: order.deliveryInfo.awbNumber,
              estimatedDeliveryDate: order.deliveryInfo.estimatedDeliveryDate,
              trackingUrl: order.deliveryInfo.trackingUrl,
            }
          : null,
        transaction: order.transaction
          ? {
              paymentMethod: order.transaction.paymentMethod,
              status: order.transaction.status,
              amount: order.transaction.amount,
            }
          : null,
      },
    });
  } catch (error: unknown) {
    return safeErrorResponse(error, 500, "Error retrieving order details");
  }
}
