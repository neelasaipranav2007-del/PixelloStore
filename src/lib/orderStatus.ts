import { OrderStatus } from "@prisma/client";

/**
 * Maps database enum status to human-readable UI label
 */
export function mapDbStatusToUi(dbStatus?: string | null): string {
  if (!dbStatus) return "Processing";
  const s = dbStatus.trim().toUpperCase();

  switch (s) {
    case "DELIVERED":
      return "Delivered";
    case "CANCELLED":
    case "CANCELED":
      return "Cancelled";
    case "OUT_FOR_DELIVERY":
    case "OUT FOR DELIVERY":
      return "Out for Delivery";
    case "PICKED_UP":
    case "DELIVERY_PICKED_UP":
    case "DELIVERY PICKED UP":
      return "Delivery Picked Up";
    case "ASSIGNED_DELIVERY":
    case "READY_FOR_PICKUP":
    case "READY FOR PICKUP":
      return "Ready for Delivery";
    case "QUALITY_CHECK":
    case "PACKED":
      return "Packed";
    case "FRAMING":
      return "Framing";
    case "PRINTING":
      return "Printing";
    case "DESIGNING":
      return "Designing";
    case "ACCEPTED_BY_STUDIO":
    case "STUDIO_ACCEPTED":
      return "Studio Accepted";
    case "ASSIGNED_STUDIO":
      return "Studio Assigned";
    case "REPLACEMENT_REQUESTED":
    case "REPLACEMENT REQUESTED":
    case "REPLACEMENT":
      return "Replacement Requested";
    case "REFUNDED":
      return "Refunded";
    case "REFUND_REQUESTED":
      return "Refund Requested";
    case "OUT_OF_STOCK":
      return "Out of Stock (Refill Pending)";
    case "PLACED":
    default:
      return "Processing";
  }
}

/**
 * Maps UI label to Prisma OrderStatus enum
 */
export function mapUiStatusToDb(uiStatus?: string | null): OrderStatus {
  if (!uiStatus) return "PLACED";
  const s = uiStatus.trim().toUpperCase();

  switch (s) {
    case "DELIVERED":
      return "DELIVERED";
    case "CANCELLED":
    case "CANCELED":
      return "CANCELLED";
    case "OUT_FOR_DELIVERY":
    case "OUT FOR DELIVERY":
      return "OUT_FOR_DELIVERY";
    case "PICKED_UP":
    case "DELIVERY PICKED UP":
    case "DELIVERY_PICKED_UP":
      return "PICKED_UP";
    case "READY FOR PICKUP":
    case "READY_FOR_PICKUP":
    case "READY FOR DELIVERY":
    case "READY_FOR_DELIVERY":
      return "READY_FOR_PICKUP";
    case "ASSIGNED_DELIVERY":
      return "ASSIGNED_DELIVERY";
    case "QUALITY_CHECK":
    case "QUALITY CHECK":
    case "PACKED":
      return "QUALITY_CHECK";
    case "FRAMING":
      return "FRAMING";
    case "PRINTING":
      return "PRINTING";
    case "DESIGNING":
      return "DESIGNING";
    case "ACCEPTED_BY_STUDIO":
    case "STUDIO ACCEPTED":
    case "STUDIO_ACCEPTED":
      return "ACCEPTED_BY_STUDIO";
    case "ASSIGNED_STUDIO":
    case "STUDIO ASSIGNED":
      return "ASSIGNED_STUDIO";
    case "REPLACEMENT":
    case "REPLACEMENT REQUESTED":
    case "REPLACEMENT_REQUESTED":
      return "REPLACEMENT_REQUESTED";
    case "REFUNDED":
      return "REFUNDED";
    case "REFUND_REQUESTED":
      return "REFUND_REQUESTED";
    case "PROCESSING":
    case "PLACED":
    default:
      return "PLACED";
  }
}
