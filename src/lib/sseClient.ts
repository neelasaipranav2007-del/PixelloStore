/**
 * Shared Singleton SSE Client for Pixello Store
 * Prevents socket exhaustion (Chrome limits 6 connections per host)
 * and defers connection until after page load to stop Chrome tab spinner.
 */

type EventHandler = (data: any) => void;

class SharedSSEManager {
  private eventSource: EventSource | null = null;
  private listeners: Map<string, Set<EventHandler>> = new Map();
  private isConnecting = false;
  private retryTimeout: NodeJS.Timeout | null = null;

  public subscribe(event: string, handler: EventHandler): () => void {
    if (typeof window === "undefined") {
      return () => {};
    }

    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(handler);

    this.ensureConnected();

    return () => {
      const handlers = this.listeners.get(event);
      if (handlers) {
        handlers.delete(handler);
        if (handlers.size === 0) {
          this.listeners.delete(event);
        }
      }
    };
  }

  private ensureConnected() {
    if (this.eventSource || this.isConnecting || typeof window === "undefined") {
      return;
    }

    this.isConnecting = true;

    const connect = () => {
      if (this.eventSource) return;

      try {
        const es = new EventSource("/api/events");
        this.eventSource = es;
        this.isConnecting = false;

        const allKnownEvents = [
          "order_update",
          "order_change",
          "promo_update",
          "promo_change",
          "commission_update",
          "commission_change",
          "product_update",
          "product_change",
          "inventory_update",
          "inventory_change",
          "customer_update",
          "customer_change",
          "cart_update",
          "cart_change",
          "notification_update",
          "notification_change",
          "ping",
        ];

        allKnownEvents.forEach((eventName) => {
          es.addEventListener(eventName, (e: MessageEvent) => {
            const handlers = this.listeners.get(eventName);
            if (handlers && handlers.size > 0) {
              let parsedData = null;
              try {
                parsedData = e.data ? JSON.parse(e.data) : null;
              } catch {
                parsedData = e.data;
              }
              handlers.forEach((h) => {
                try {
                  h(parsedData);
                } catch (err) {
                  console.error("SSE handler error:", err);
                }
              });
            }
          });
        });

        es.onerror = () => {
          this.disconnect();
          if (!this.retryTimeout) {
            this.retryTimeout = setTimeout(() => {
              this.retryTimeout = null;
              if (this.listeners.size > 0) {
                this.ensureConnected();
              }
            }, 10000);
          }
        };
      } catch (err) {
        this.isConnecting = false;
      }
    };

    // Defer SSE initialization until after page load has completely finished
    // This stops the Chrome browser tab spinner from running indefinitely
    if (document.readyState === "complete") {
      setTimeout(connect, 1500);
    } else {
      const handleLoad = () => {
        window.removeEventListener("load", handleLoad);
        setTimeout(connect, 1500);
      };
      window.addEventListener("load", handleLoad);
    }
  }

  private disconnect() {
    if (this.eventSource) {
      try {
        this.eventSource.close();
      } catch {}
      this.eventSource = null;
    }
    this.isConnecting = false;
  }
}

export const sharedSSE = new SharedSSEManager();
