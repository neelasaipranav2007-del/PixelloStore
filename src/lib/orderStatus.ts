import { OrderStatus } from "@prisma/client";

/**
 * Maps database enum status to human-readable UI label
 */
export function mapDbStatusToUi(dbStatus?: string | null): string {
  if (!dbStatus) return "Order Placed";
  const s = dbStatus.trim().toUpperCase();

  switch (s) {
    case "COMPLETED":
    case "DELIVERED":
      return "Delivered";
    case "CANCELLED":
    case "CANCELED":
      return "Cancelled";
    case "OUT_FOR_DELIVERY":
    case "OUT FOR DELIVERY":
      return "Out for Delivery";
    case "SHIPPED":
    case "IN_TRANSIT":
    case "IN TRANSIT":
    case "PICKED_UP":
    case "DELIVERY_PICKED_UP":
    case "DELIVERY PICKED UP":
    case "DELIVERY_ASSIGNED":
    case "ASSIGNED_DELIVERY":
      return "Shipped";
    case "READY_FOR_DELIVERY":
    case "READY_FOR_PICKUP":
    case "READY FOR PICKUP":
    case "READY FOR DELIVERY":
      return "Ready for Delivery";
    case "QUALITY_CHECK":
    case "PACKED":
      return "Quality Check & Packed";
    case "PRINTING":
    case "PRODUCT_PREPARATION":
    case "FRAMING":
      return "Printing & Product Preparation";
    case "IN_PRODUCTION":
    case "PROCESSING":
    case "ORDER_CONFIRMED":
    case "ACCEPTED_BY_STUDIO":
    case "STUDIO_ACCEPTED":
    case "ASSIGNED_STUDIO":
    case "DESIGNING":
      return "Preparing Your Order";
    case "PAYMENT_CONFIRMED":
      return "Payment Confirmed";
    case "REPLACEMENT_REQUESTED":
    case "REPLACEMENT REQUESTED":
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
    case "SHIPPED":
    case "IN_TRANSIT":
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
    case "QUALITY_CHECK":
    case "PACKED":
    case "PRINTING":
    case "PRODUCT_PREPARATION":
    case "FRAMING":
    case "IN_PRODUCTION":
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
