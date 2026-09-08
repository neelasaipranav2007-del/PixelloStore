/**
 * PixelloStore - Delivery Portal Master Feature Flag Utility
 * Controls temporary closure and reopening of the Delivery Portal.
 * 
 * Configured via .env.local:
 * DELIVERY_PORTAL_ENABLED=false (or true)
 * NEXT_PUBLIC_DELIVERY_PORTAL_ENABLED=false (or true)
 */

export function isDeliveryPortalEnabled(): boolean {
  // Read server or client environment variable
  const serverFlag = process.env.DELIVERY_PORTAL_ENABLED;
  const publicFlag = process.env.NEXT_PUBLIC_DELIVERY_PORTAL_ENABLED;

  const val = serverFlag ?? publicFlag;

  if (val !== undefined && String(val).trim().toLowerCase() === "false") {
    return false;
  }

  return true;
}
