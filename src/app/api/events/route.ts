import { NextResponse } from "next/server";
import { portalEvents } from "@/lib/events";

export const dynamic = "force-dynamic";

export async function GET() {
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    start(controller) {
      let isClosed = false;

      const sendEvent = (event: string, data: any) => {
        if (isClosed) return;
        try {
          const payload = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
          controller.enqueue(encoder.encode(payload));
        } catch (err) {
          isClosed = true;
        }
      };

      const handleOrderEvent = (data: any) => sendEvent("order_update", data);
      const handlePromoEvent = (data: any) => sendEvent("promo_update", data);
      const handleCommissionEvent = (data: any) => sendEvent("commission_update", data);
      const handleProductEvent = (data: any) => sendEvent("product_update", data);
      const handleInventoryEvent = (data: any) => sendEvent("inventory_update", data);
      const handleCustomerEvent = (data: any) => sendEvent("customer_update", data);
      const handleCartEvent = (data: any) => sendEvent("cart_update", data);
      const handleNotificationEvent = (data: any) => sendEvent("notification_update", data);

      portalEvents.on("order_change", handleOrderEvent);
      portalEvents.on("promo_change", handlePromoEvent);
      portalEvents.on("commission_change", handleCommissionEvent);
      portalEvents.on("product_change", handleProductEvent);
      portalEvents.on("inventory_change", handleInventoryEvent);
      portalEvents.on("customer_change", handleCustomerEvent);
      portalEvents.on("cart_change", handleCartEvent);
      portalEvents.on("notification_change", handleNotificationEvent);

      // Send initial connection heartbeat
      sendEvent("ping", { time: new Date().toISOString() });

      const heartbeat = setInterval(() => {
        if (isClosed) {
          clearInterval(heartbeat);
          return;
        }
        sendEvent("ping", { time: new Date().toISOString() });
      }, 15000);

      // Clean up on disconnect
      return () => {
        isClosed = true;
        clearInterval(heartbeat);
        portalEvents.off("order_change", handleOrderEvent);
        portalEvents.off("promo_change", handlePromoEvent);
        portalEvents.off("commission_change", handleCommissionEvent);
        portalEvents.off("product_change", handleProductEvent);
        portalEvents.off("inventory_change", handleInventoryEvent);
        portalEvents.off("customer_change", handleCustomerEvent);
        portalEvents.off("cart_change", handleCartEvent);
        portalEvents.off("notification_change", handleNotificationEvent);
      };
    },
  });

  return new NextResponse(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}
