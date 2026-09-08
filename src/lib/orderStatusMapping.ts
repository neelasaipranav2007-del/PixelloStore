/**
 * PixelloStore - Centralized Order Workflow & Status Mapping Utility
 * 
 * Provides:
 * 1. Admin-controlled 11-stage order workflow definitions
 * 2. Customer-friendly status mapping (hides internal operational states)
 * 3. Customer data sanitization (strips internal API tokens, credentials, & private notes)
 */

export const ADMIN_ORDER_STAGES = [
  { id: "ORDER_PLACED", label: "Order Placed", symbol: "📝", group: "Initial" },
  { id: "PAYMENT_CONFIRMED", label: "Payment Confirmed", symbol: "💳", group: "Initial" },
  { id: "ORDER_CONFIRMED", label: "Order Confirmed", symbol: "✅", group: "Production" },
  { id: "IN_PRODUCTION", label: "In Production", symbol: "🖨️", group: "Production" },
  { id: "READY_FOR_DELIVERY", label: "Ready for Delivery", symbol: "📦", group: "Fulfillment" },
  { id: "DELIVERY_ASSIGNED", label: "Delivery Assigned", symbol: "📋", group: "Fulfillment" },
  { id: "PICKED_UP", label: "Picked Up", symbol: "🛵", group: "Transit" },
  { id: "IN_TRANSIT", label: "In Transit", symbol: "🚚", group: "Transit" },
  { id: "OUT_FOR_DELIVERY", label: "Out for Delivery", symbol: "🚀", group: "Transit" },
  { id: "DELIVERED", label: "Delivered", symbol: "🎉", group: "Completed" },
  { id: "COMPLETED", label: "Completed", symbol: "🏁", group: "Completed" },
] as const;

export interface CustomerStatusMapping {
  customerStatus: string;
  stageIndex: number; // 1 to 6
  stepTitle: string;
  stepDesc: string;
  badgeClass: string;
}

export function mapInternalToCustomerStatus(internalStatus?: string): CustomerStatusMapping {
  if (!internalStatus) {
    return {
      customerStatus: "Order Placed",
      stageIndex: 1,
      stepTitle: "Order Placed",
      stepDesc: "Order received successfully",
      badgeClass: "bg-[#FFF8F2] text-[#D89A86] border border-[#D89A86]/30",
    };
  }

  const clean = internalStatus.trim().toUpperCase().replace(/\s+/g, "_");

  switch (clean) {
    case "ORDER_PLACED":
    case "PLACED":
      return {
        customerStatus: "Order Placed",
        stageIndex: 1,
        stepTitle: "Order Placed",
        stepDesc: "Order placed successfully and payment verified",
        badgeClass: "bg-[#FFF8F2] text-[#D89A86] border border-[#D89A86]/30",
      };

    case "PAYMENT_CONFIRMED":
      return {
        customerStatus: "Payment Confirmed",
        stageIndex: 2,
        stepTitle: "Payment Verified",
        stepDesc: "Payment verified successfully",
        badgeClass: "bg-emerald-50 text-emerald-800 border border-emerald-200",
      };

    case "ORDER_CONFIRMED":
    case "ASSIGNED_STUDIO":
    case "ACCEPTED_BY_STUDIO":
    case "DESIGNING":
      return {
        customerStatus: "Order Confirmed",
        stageIndex: 2,
        stepTitle: "Order Confirmed",
        stepDesc: "Order confirmed & verified by photo crafting team",
        badgeClass: "bg-emerald-100 text-emerald-900 border border-emerald-300",
      };

    case "IN_PRODUCTION":
    case "PRINTING":
    case "FRAMING":
    case "QUALITY_CHECK":
      return {
        customerStatus: "Preparing Your Order",
        stageIndex: 3,
        stepTitle: "Preparing Your Order",
        stepDesc: "High-definition archival photo printing & solid wood frame assembly",
        badgeClass: "bg-amber-100 text-amber-900 border border-amber-300",
      };

    case "READY_FOR_DELIVERY":
    case "READY_FOR_PICKUP":
      return {
        customerStatus: "Ready for Delivery",
        stageIndex: 4,
        stepTitle: "Ready for Delivery",
        stepDesc: "Quality inspected, double bubble-wrapped & sealed for delivery dispatch",
        badgeClass: "bg-sky-100 text-sky-900 border border-sky-300",
      };

    case "DELIVERY_ASSIGNED":
    case "ASSIGNED_DELIVERY":
    case "PICKED_UP":
    case "IN_TRANSIT":
      return {
        customerStatus: "Shipped",
        stageIndex: 5,
        stepTitle: "Shipped",
        stepDesc: "Dispatched & currently in transit with delivery partner",
        badgeClass: "bg-blue-100 text-blue-900 border border-blue-300",
      };

    case "OUT_FOR_DELIVERY":
      return {
        customerStatus: "Out for Delivery",
        stageIndex: 6,
        stepTitle: "Out for Delivery",
        stepDesc: "Rider is out for express doorstep delivery today",
        badgeClass: "bg-indigo-100 text-indigo-900 border border-indigo-300",
      };

    case "DELIVERED":
    case "COMPLETED":
      return {
        customerStatus: "Delivered",
        stageIndex: 7,
        stepTitle: "Delivered Successfully",
        stepDesc: "Handed over to customer. Enjoy your Pixello memories!",
        badgeClass: "bg-emerald-100 text-emerald-900 border border-emerald-300",
      };

    case "CANCELLED":
    case "CANCELED":
      return {
        customerStatus: "Cancelled",
        stageIndex: 0,
        stepTitle: "Order Cancelled",
        stepDesc: "This order has been cancelled",
        badgeClass: "bg-rose-100 text-rose-900 border border-rose-300",
      };

    case "REPLACEMENT_REQUESTED":
    case "REPLACEMENT":
      return {
        customerStatus: "Replacement Requested",
        stageIndex: 0,
        stepTitle: "Replacement Requested",
        stepDesc: "24-Hour free replacement request registered",
        badgeClass: "bg-purple-100 text-purple-900 border border-purple-300",
      };

    default:
      return {
        customerStatus: "Order Confirmed",
        stageIndex: 2,
        stepTitle: "Order Confirmed",
        stepDesc: "Order confirmed & in queue",
        badgeClass: "bg-[#FFF8F2] text-[#D89A86] border border-[#D89A86]/30",
      };
  }
}

/**
 * Strips confidential internal operational data from order payloads sent to customer frontend.
 * Never exposes: Delhivery API tokens, internal API keys, driver personal phone, raw internal payloads.
 */
export function sanitizeCustomerOrderData(order: Record<string, unknown> | null | undefined) {
  if (!order) return null;

  const mapped = mapInternalToCustomerStatus(order.status as string);
  const delivery = (order.deliveryInfo || {}) as Record<string, unknown>;

  // Extract customer-safe delivery details ONLY
  const safeDeliveryInfo = {
    deliveryProvider: (delivery.deliveryProvider || delivery.deliveryPartnerName || "Delhivery") as string,
    trackingId: (delivery.trackingId || delivery.awbNumber || delivery.waybill || null) as string | null,
    awbNumber: (delivery.awbNumber || delivery.trackingId || delivery.waybill || null) as string | null,
    estimatedDeliveryDate: delivery.estimatedDeliveryDate ? new Date(delivery.estimatedDeliveryDate as string | Date).toISOString().split("T")[0] : ((delivery.estimatedDelivery as string) || null),
    shippedAt: delivery.shippedAt ? new Date(delivery.shippedAt as string | Date).toISOString() : ((delivery.pickupTime as string) || null),
    outForDeliveryAt: delivery.outForDeliveryAt ? new Date(delivery.outForDeliveryAt as string | Date).toISOString() : null,
    deliveredAt: delivery.deliveredAt ? new Date(delivery.deliveredAt as string | Date).toISOString() : ((delivery.deliveryTime as string) || null),
    trackingUrl: (delivery.trackingUrl || (delivery.awbNumber || delivery.trackingId ? `https://www.delhivery.com/track/package/${delivery.awbNumber || delivery.trackingId}` : null)) as string | null,
  };

  return {
    id: order.id,
    date: order.date || (order.createdAt ? new Date(order.createdAt as string | number | Date).toISOString().split("T")[0] : ""),
    createdAt: order.createdAt,
    totalAmount: order.totalAmount,
    shippingAddress: order.shippingAddress,
    deliveryType: order.deliveryType || "Shipping",
    referralCode: order.referralCode || null,
    referralDiscount: order.referralDiscount || 0,

    // Customer-friendly mapped status fields
    status: mapped.customerStatus,
    rawStatus: order.status,
    stageIndex: mapped.stageIndex,
    stepTitle: mapped.stepTitle,
    stepDesc: mapped.stepDesc,
    badgeClass: mapped.badgeClass,

    // Order items
    items: Array.isArray(order.items) ? (order.items as Record<string, unknown>[]).map((it) => ({
      id: it.id,
      name: it.name,
      size: it.size,
      quantity: it.quantity,
      price: it.price,
      image: it.image,
      photos: it.photos || (it.customizationDetails ? JSON.parse(it.customizationDetails as string).photos : [it.image]),
    })) : [],

    // Safe customer delivery info
    deliveryInfo: safeDeliveryInfo,

    // Filter history to safe timeline steps
    history: Array.isArray(order.history) ? (order.history as Record<string, unknown>[]).map((h) => {
      const hMapped = mapInternalToCustomerStatus(h.status as string);
      return {
        status: hMapped.customerStatus,
        date: h.createdAt || h.date,
        note: hMapped.stepDesc,
      };
    }) : [],
  };
}
