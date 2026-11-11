import { OrderStatus } from "@prisma/client";

/**
 * Maps database enum status to human-readable UI label
 * Synchronized with Admin Delivery Statuses
 */
export function mapDbStatusToUi(dbStatus?: string | null): string {
  if (!dbStatus) return "Order Placed";
  const s = dbStatus.trim().toUpperCase().replace(/\s+/g, "_");

  switch (s) {
    case "COMPLETED":
    case "DELIVERED":
      return "Delivered";
    case "CANCELLED":
    case "CANCELED":
      return "Cancelled";
    case "OUT_FOR_DELIVERY":
      return "Out for Delivery";
    case "IN_TRANSIT":
    case "SHIPPED":
      return "In Transit";
    case "PICKED_UP":
    case "DELIVERY_PICKED_UP":
      return "Picked Up";
    case "DELIVERY_ASSIGNED":
    case "ASSIGNED_DELIVERY":
      return "Delivery Assigned";
    case "READY_FOR_DELIVERY":
    case "READY_FOR_PICKUP":
      return "Ready for Delivery";
    case "IN_PRODUCTION":
    case "PRINTING":
    case "PRODUCT_PREPARATION":
    case "FRAMING":
    case "QUALITY_CHECK":
    case "PACKED":
    case "PROCESSING":
      return "In Production";
    case "ORDER_CONFIRMED":
    case "ACCEPTED_BY_STUDIO":
    case "STUDIO_ACCEPTED":
    case "ASSIGNED_STUDIO":
    case "DESIGNING":
      return "Order Confirmed";
    case "PAYMENT_CONFIRMED":
      return "Payment Confirmed";
    case "REPLACEMENT_REQUESTED":
    case "REPLACEMENT":
      return "Replacement Requested";
    case "REFUNDED":
      return "Refunded";
    case "REFUND_REQUESTED":
      return "Refund Requested";
    case "ORDER_PLACED":
    case "PLACED":
    default:
      return "Order Placed";
  }
}

/**
 * Maps UI label to Prisma OrderStatus enum
 */
export function mapUiStatusToDb(uiStatus?: string | null): OrderStatus {
  if (!uiStatus) return "ORDER_PLACED";
  const s = uiStatus.trim().toUpperCase().replace(/\s+/g, "_");

  switch (s) {
    case "COMPLETED":
      return "COMPLETED";
    case "DELIVERED":
      return "DELIVERED";
    case "CANCELLED":
    case "CANCELED":
      return "CANCELLED";
    case "OUT_FOR_DELIVERY":
      return "OUT_FOR_DELIVERY";
    case "IN_TRANSIT":
    case "SHIPPED":
      return "IN_TRANSIT";
    case "PICKED_UP":
    case "DELIVERY_PICKED_UP":
      return "PICKED_UP";
    case "DELIVERY_ASSIGNED":
    case "ASSIGNED_DELIVERY":
      return "DELIVERY_ASSIGNED";
    case "READY_FOR_DELIVERY":
    case "READY_FOR_PICKUP":
      return "READY_FOR_DELIVERY";
    case "IN_PRODUCTION":
    case "PRINTING":
    case "PRODUCT_PREPARATION":
    case "FRAMING":
    case "QUALITY_CHECK":
    case "PACKED":
    case "PROCESSING":
      return "IN_PRODUCTION";
    case "ORDER_CONFIRMED":
    case "ACCEPTED_BY_STUDIO":
    case "STUDIO_ACCEPTED":
    case "ASSIGNED_STUDIO":
    case "DESIGNING":
      return "ORDER_CONFIRMED";
    case "PAYMENT_CONFIRMED":
      return "PAYMENT_CONFIRMED";
    case "REPLACEMENT":
    case "REPLACEMENT_REQUESTED":
      return "REPLACEMENT_REQUESTED";
    case "REFUNDED":
      return "REFUNDED";
    case "REFUND_REQUESTED":
      return "REFUND_REQUESTED";
    case "ORDER_PLACED":
    case "PLACED":
    default:
      return "ORDER_PLACED";
  }
}
