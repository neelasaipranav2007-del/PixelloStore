/**
 * PixelloStore - Centralized Order Workflow & Status Mapping Utility
 * 
 * Provides:
 * 1. Founders & Admin internal order workflow stages
 * 2. Customer-friendly status mapping (8 clean customer stages, zero Studio terminology)
 * 3. Customer data sanitization (strips confidential internal API tokens, credentials, & private notes)
 */

export const ADMIN_ORDER_STAGES = [
  { id: "ORDER_PLACED", label: "Order Placed", symbol: "📝", group: "Initial" },
  { id: "PAYMENT_CONFIRMED", label: "Payment Confirmed", symbol: "💳", group: "Initial" },
  { id: "ORDER_CONFIRMED", label: "Order Confirmed", symbol: "✅", group: "Production" },
  { id: "PROCESSING", label: "Preparing Order", symbol: "⚙️", group: "Production" },
  { id: "PRINTING", label: "Printing", symbol: "🖨️", group: "Production" },
  { id: "PRODUCT_PREPARATION", label: "Product Preparation", symbol: "✂️", group: "Production" },
  { id: "QUALITY_CHECK", label: "Quality Check", symbol: "🔍", group: "Production" },
  { id: "PACKED", label: "Packed", symbol: "📦", group: "Fulfillment" },
  { id: "READY_FOR_DELIVERY", label: "Ready for Delivery", symbol: "🚀", group: "Fulfillment" },
  { id: "DELIVERY_ASSIGNED", label: "Delivery Assigned", symbol: "📋", group: "Fulfillment" },
  { id: "PICKED_UP", label: "Picked Up", symbol: "🛵", group: "Transit" },
  { id: "IN_TRANSIT", label: "In Transit", symbol: "🚚", group: "Transit" },
  { id: "OUT_FOR_DELIVERY", label: "Out for Delivery", symbol: "📍", group: "Transit" },
  { id: "DELIVERED", label: "Delivered", symbol: "🎉", group: "Completed" },
  { id: "COMPLETED", label: "Completed", symbol: "🏁", group: "Completed" },
] as const;

export interface CustomerStatusMapping {
  customerStatus: string;
  stageIndex: number; // 1 to 8
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
      stepDesc: "Your order has been received and payment is confirmed.",
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
        stepDesc: "Your order has been received and payment is confirmed.",
        badgeClass: "bg-[#FFF8F2] text-[#D89A86] border border-[#D89A86]/30",
      };

    case "PAYMENT_CONFIRMED":
    case "ORDER_CONFIRMED":
    case "PROCESSING":
    case "IN_PRODUCTION":
    case "ASSIGNED_STUDIO":
    case "ACCEPTED_BY_STUDIO":
    case "DESIGNING":
      return {
        customerStatus: "Preparing Your Order",
        stageIndex: 2,
        stepTitle: "Order Being Prepared",
        stepDesc: "Our team is preparing your personalized order.",
        badgeClass: "bg-emerald-50 text-emerald-800 border border-emerald-200",
      };

    case "PRINTING":
    case "PRODUCT_PREPARATION":
    case "FRAMING":
      return {
        customerStatus: "Printing & Product Preparation",
        stageIndex: 3,
        stepTitle: "Printing & Product Preparation",
        stepDesc: "Your personalized product is being printed and prepared.",
        badgeClass: "bg-amber-100 text-amber-900 border border-amber-300",
      };

    case "QUALITY_CHECK":
    case "PACKED":
      return {
        customerStatus: "Quality Check & Packed",
        stageIndex: 4,
        stepTitle: "Quality Check & Packed",
        stepDesc: "Your order has passed quality checking and has been securely packed.",
        badgeClass: "bg-purple-100 text-purple-900 border border-purple-300",
      };

    case "READY_FOR_DELIVERY":
    case "READY_FOR_PICKUP":
      return {
        customerStatus: "Ready for Delivery",
        stageIndex: 5,
        stepTitle: "Ready for Delivery",
        stepDesc: "Your order is ready and will be handed over for delivery.",
        badgeClass: "bg-sky-100 text-sky-900 border border-sky-300",
      };

    case "SHIPPED":
    case "DELIVERY_ASSIGNED":
    case "ASSIGNED_DELIVERY":
    case "PICKED_UP":
    case "DELIVERY_PICKED_UP":
    case "IN_TRANSIT":
      return {
        customerStatus: "Shipped",
        stageIndex: 6,
        stepTitle: "Shipped",
        stepDesc: "Your order has been picked up by the delivery partner.",
        badgeClass: "bg-blue-100 text-blue-900 border border-blue-300",
      };

    case "OUT_FOR_DELIVERY":
      return {
        customerStatus: "Out for Delivery",
        stageIndex: 7,
        stepTitle: "Out for Delivery",
        stepDesc: "Your order is out for delivery.",
        badgeClass: "bg-indigo-100 text-indigo-900 border border-indigo-300",
      };

    case "DELIVERED":
    case "COMPLETED":
      return {
        customerStatus: "Delivered",
        stageIndex: 8,
        stepTitle: "Delivered",
        stepDesc: "Your order has been delivered successfully.",
        badgeClass: "bg-emerald-100 text-emerald-900 border border-emerald-300",
      };

    case "CANCELLED":
    case "CANCELED":
      return {
        customerStatus: "Cancelled",
        stageIndex: 0,
        stepTitle: "Order Cancelled",
        stepDesc: "This order has been cancelled.",
        badgeClass: "bg-rose-100 text-rose-900 border border-rose-300",
      };

    case "REPLACEMENT_REQUESTED":
    case "REPLACEMENT":
      return {
        customerStatus: "Replacement Requested",
        stageIndex: 0,
        stepTitle: "Replacement Requested",
        stepDesc: "Replacement request registered and queued for preparation.",
        badgeClass: "bg-amber-100 text-amber-900 border border-amber-300",
      };

    default:
      return {
        customerStatus: "Preparing Your Order",
        stageIndex: 2,
        stepTitle: "Order Being Prepared",
        stepDesc: "Our team is preparing your personalized order.",
        badgeClass: "bg-[#FFF8F2] text-[#D89A86] border border-[#D89A86]/30",
      };
  }
}

/**
 * Strips confidential internal operational data from order payloads sent to customer frontend.
 * Never exposes: Delivery One / Delhivery API tokens, internal API keys, driver personal credentials, raw internal payloads.
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

    // Filter history to safe customer timeline steps
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
