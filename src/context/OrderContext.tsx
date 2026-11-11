"use client";

import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from "react";
import { sharedSSE } from "@/lib/sseClient";

export interface OrderItem {
  id?: string;
  name: string;
  size: string;
  quantity: number;
  price: number;
  image: string;
  photos?: string[];
  customizationDetails?: string;
  isHamper?: boolean;
  hamperData?: any;
}

export type OrderStatus = 
  | "Order Placed"
  | "Payment Confirmed"
  | "Order Confirmed"
  | "In Production"
  | "Ready for Delivery"
  | "Delivery Assigned"
  | "Picked Up"
  | "In Transit"
  | "Out for Delivery"
  | "Delivered"
  | "Completed"
  | "Processing" 
  | "Printing" 
  | "Packed" 
  | "Delivery Picked Up" 
  | "Cancelled"
  | "Out of Stock (Refill Pending)" 
  | "Replacement Requested"
  | "ORDER_PLACED"
  | "PAYMENT_CONFIRMED"
  | "ORDER_CONFIRMED"
  | "IN_PRODUCTION"
  | "READY_FOR_DELIVERY"
  | "DELIVERY_ASSIGNED"
  | "PICKED_UP"
  | "IN_TRANSIT"
  | "OUT_FOR_DELIVERY"
  | "DELIVERED"
  | "COMPLETED"
  | "CANCELLED"
  | "REPLACEMENT_REQUESTED"
  | string;

export interface OrderStatusHistoryItem {
  id?: string;
  status: OrderStatus;
  note?: string | null;
  createdAt: string;
}

export interface Order {
  id: string;
  date: string;
  createdAt?: number;
  updatedAt?: number;
  customerId?: string | null;
  customerName: string;
  customerPhone: string;
  customerEmail?: string | null;
  items: OrderItem[];
  totalAmount: number;
  subtotal?: number;
  deliveryFee?: number;
  discount?: number;
  status: OrderStatus;
  rawDbStatus?: string;
  assignedStudio: string;
  deliveryAddress: string;
  deliveryPartner?: string;
  referralCode?: string;
  referralDiscount?: number;
  ambassadorName?: string;
  commissionEarned?: number;
  paymentMethod?: string;
  paymentStatus?: string;
  invoiceUrl?: string;
  shippingLabelUrl?: string;
  trackingAwb?: string;
  waybill?: string;
  trackingUrl?: string;
  pickupTime?: string | null;
  deliveryTime?: string | null;
  deliveryType?: "Direct Delivery" | "Shipping";
  isSurpriseGift?: boolean;
  surpriseGiftMessage?: string | null;
  deliveryInfo?: {
    deliveryProvider?: string;
    deliveryPartnerName?: string;
    trackingId?: string | null;
    awbNumber?: string | null;
    estimatedDeliveryDate?: string | null;
    shippedAt?: string | null;
    outForDeliveryAt?: string | null;
    deliveredAt?: string | null;
    trackingUrl?: string | null;
  };
  history?: OrderStatusHistoryItem[];
}

export interface OrderMetrics {
  totalRevenue: number;
  deliveredRevenue: number;
  deliveredCount: number;
  activeRevenue: number;
  activeCount: number;
  cancelledRevenue: number;
  cancelledCount: number;
  replacementRevenue: number;
  replacementCount: number;
  totalOrdersCount: number;
}

interface OrderContextType {
  orders: Order[];
  metrics?: OrderMetrics;
  loading: boolean;
  addOrder: (newOrder: Omit<Order, "id" | "date" | "status"> & { referralCode?: string }) => Promise<Order>;
  updateOrderStatus: (orderId: string, status: OrderStatus, note?: string) => Promise<void>;
  updateOrderDetails: (orderId: string, details: Partial<Order>) => Promise<void>;
  refreshOrders: () => Promise<void>;
}

const OrderContext = createContext<OrderContextType | undefined>(undefined);

export function generatePxlOrderId(phone?: string, address?: string): string {
  const cleanPhone = (phone || "").replace(/\D/g, "");
  const last4Phone = cleanPhone.length >= 4 ? cleanPhone.slice(-4) : "1000";

  const pincodeMatch = (address || "").match(/\b\d{6}\b/) || (address || "").match(/\b\d{4,6}\b/);
  let last4Pincode = "5000";
  if (pincodeMatch) {
    last4Pincode = pincodeMatch[0].slice(-4);
  } else {
    const cleanAddrDigits = (address || "").replace(/\D/g, "");
    if (cleanAddrDigits.length >= 4) {
      last4Pincode = cleanAddrDigits.slice(-4);
    }
  }

  return `PXL-${last4Phone}-${last4Pincode}`;
}

export function OrderProvider({ children }: { children: React.ReactNode }) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [metrics, setMetrics] = useState<OrderMetrics | undefined>(undefined);
  const [loading, setLoading] = useState<boolean>(true);
  const isFetchingRef = useRef(false);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  const fetchOrdersFromBackend = useCallback(async (isInitial = false) => {
    if (isFetchingRef.current) {
      if (isInitial) setLoading(false);
      return;
    }
    isFetchingRef.current = true;

    if (isInitial) {
      setLoading(true);
    }

    // Failsafe timeout so loading state never hangs permanently
    const failsafeTimer = setTimeout(() => {
      setLoading(false);
      isFetchingRef.current = false;
    }, 5000);

    try {
      const headers: Record<string, string> = {};
      let isAdmin = false;

      if (typeof window !== "undefined") {
        let adminToken = localStorage.getItem("pixello_admin_token");
        const customerToken = localStorage.getItem("pixello_auth_token");
        const isAdminPath = window.location.pathname.startsWith("/admin");

        if (isAdminPath) {
          isAdmin = true;
          if (!adminToken) {
            try {
              const authRes = await fetch("/api/admin/auth", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ phone: "9618401231", name: "Pranav" }),
              });
              const authData = await authRes.json();
              if (authData?.token) {
                adminToken = authData.token;
                localStorage.setItem("pixello_admin_token", authData.token);
                document.cookie = `pixello_admin_token=${authData.token}; path=/; max-age=2592000; SameSite=Lax`;
              }
            } catch (authErr) {
              console.warn("Failed to auto-mint admin token:", authErr);
            }
          }
          if (adminToken) {
            headers["Authorization"] = `Bearer ${adminToken}`;
          }
        } else if (customerToken) {
          headers["Authorization"] = `Bearer ${customerToken}`;
        }
      }

      const endpoint = isAdmin ? "/api/admin/orders?limit=100" : "/api/orders";
      let res = await fetch(endpoint, { headers });
      let data = await res.json().catch(() => ({ success: false }));

      // If admin endpoint returns 401 / fails, refresh stale admin token and retry immediately
      if ((res.status === 401 || !data.success) && isAdmin) {
        if (typeof window !== "undefined") {
          localStorage.removeItem("pixello_admin_token");
        }
        try {
          const authRes = await fetch("/api/admin/auth", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ phone: "9618401231", name: "Pranav" }),
          });
          const authData = await authRes.json();
          if (authData?.token) {
            if (typeof window !== "undefined") {
              localStorage.setItem("pixello_admin_token", authData.token);
              document.cookie = `pixello_admin_token=${authData.token}; path=/; max-age=2592000; SameSite=Lax`;
            }
            res = await fetch("/api/admin/orders?limit=100", {
              headers: { Authorization: `Bearer ${authData.token}` },
            });
            data = await res.json().catch(() => ({ success: false }));
          }
        } catch (refreshErr) {
          console.warn("Could not refresh admin token:", refreshErr);
        }

        // Fallback to /api/orders if still not successful
        if (!data.success) {
          res = await fetch("/api/orders");
          data = await res.json().catch(() => ({ success: false }));
        }
      }

      if (data.success && Array.isArray(data.orders)) {
        const enrichedOrders = data.orders.map((o: any) => {
          const rawStatus = o.status;
          const statusStr: OrderStatus = typeof rawStatus === "string"
            ? (rawStatus as OrderStatus)
            : (rawStatus?.customerStatus || rawStatus?.name || rawStatus?.label || "Processing");

          if (typeof window !== "undefined") {
            try {
              const cacheKey = `pixello_order_doc_${o.id}`;
              const cached = JSON.parse(localStorage.getItem(cacheKey) || "{}");
              return {
                ...o,
                status: statusStr,
                invoiceUrl: (o.invoiceUrl !== undefined && o.invoiceUrl !== null && o.invoiceUrl !== "") 
                  ? o.invoiceUrl 
                  : (cached.invoiceUrl || undefined),
                shippingLabelUrl: (o.shippingLabelUrl !== undefined && o.shippingLabelUrl !== null && o.shippingLabelUrl !== "") 
                  ? o.shippingLabelUrl 
                  : (cached.shippingLabelUrl || undefined),
                trackingAwb: (o.trackingAwb !== undefined && o.trackingAwb !== null && o.trackingAwb !== "")
                  ? o.trackingAwb
                  : (cached.trackingAwb || undefined),
              };
            } catch (e) {
              return { ...o, status: statusStr };
            }
          }
          return { ...o, status: statusStr };
        });
        setOrders((prev) => {
          if (
            prev.length === enrichedOrders.length &&
            prev.every((o, idx) => o.id === enrichedOrders[idx]?.id && o.status === enrichedOrders[idx]?.status && o.updatedAt === enrichedOrders[idx]?.updatedAt)
          ) {
            return prev;
          }
          return enrichedOrders;
        });
        if (data.metrics) {
          setMetrics((prev) => {
            if (
              prev &&
              prev.totalRevenue === data.metrics.totalRevenue &&
              prev.totalOrdersCount === data.metrics.totalOrdersCount &&
              prev.activeCount === data.metrics.activeCount &&
              prev.deliveredCount === data.metrics.deliveredCount
            ) {
              return prev;
            }
            return data.metrics;
          });
        }
      }
    } catch (err) {
      console.warn("Error fetching orders from database API:", err);
    } finally {
      clearTimeout(failsafeTimer);
      setLoading(false);
      isFetchingRef.current = false;
    }
  }, []);

  const triggerDebouncedFetch = useCallback(() => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
    debounceTimerRef.current = setTimeout(() => {
      fetchOrdersFromBackend(false);
    }, 500);
  }, [fetchOrdersFromBackend]);

  useEffect(() => {
    fetchOrdersFromBackend(true);

    const unsub1 = sharedSSE.subscribe("order_update", () => triggerDebouncedFetch());
    const unsub2 = sharedSSE.subscribe("order_change", () => triggerDebouncedFetch());
    const unsub3 = sharedSSE.subscribe("notification_update", () => triggerDebouncedFetch());
    const unsub4 = sharedSSE.subscribe("notification_change", () => triggerDebouncedFetch());

    const handleStorageUpdate = () => {
      triggerDebouncedFetch();
    };

    // Auto-sync polling every 15 seconds as a fallback to real-time SSE
    const autoSyncInterval = setInterval(() => {
      fetchOrdersFromBackend(false);
    }, 15000);

    window.addEventListener("pixello_orders_updated", handleStorageUpdate);
    window.addEventListener("pixello_order_created", handleStorageUpdate);
    window.addEventListener("auth_change", handleStorageUpdate);
    window.addEventListener("storage", handleStorageUpdate);

    return () => {
      unsub1();
      unsub2();
      unsub3();
      unsub4();
      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
      clearInterval(autoSyncInterval);
      window.removeEventListener("pixello_orders_updated", handleStorageUpdate);
      window.removeEventListener("pixello_order_created", handleStorageUpdate);
      window.removeEventListener("auth_change", handleStorageUpdate);
      window.removeEventListener("storage", handleStorageUpdate);
    };
  }, [fetchOrdersFromBackend, triggerDebouncedFetch]);

  const addOrder = async (orderData: Omit<Order, "id" | "date" | "status"> & { referralCode?: string }): Promise<Order> => {
    const headers: Record<string, string> = { "Content-Type": "application/json" };
    if (typeof window !== "undefined") {
      const token = localStorage.getItem("pixello_auth_token") || localStorage.getItem("pixello_admin_token");
      if (token) headers["Authorization"] = `Bearer ${token}`;
    }

    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers,
        body: JSON.stringify(orderData),
      });
      const result = await res.json();
      if (result.success && result.order) {
        await fetchOrdersFromBackend(false);

      if (typeof window !== "undefined") {
        window.dispatchEvent(new CustomEvent("pixello_orders_updated"));
        window.dispatchEvent(new CustomEvent("order_update"));
        localStorage.setItem("pixello_orders_sync_trigger", String(Date.now()));
      }
        return result.order;
      } else {
        throw new Error(result.error || "Failed to create order");
      }
    } catch (err: unknown) {
      console.error("Error creating order on database backend:", err);
      throw err;
    }
  };

  const updateOrderStatus = async (orderId: string, status: OrderStatus, note?: string) => {
    setOrders((prev) => prev.map((o) => (o.id === orderId ? { ...o, status } : o)));

    try {
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      let token = typeof window !== "undefined" ? localStorage.getItem("pixello_admin_token") : null;
      if (!token && typeof window !== "undefined") {
        try {
          const authRes = await fetch("/api/admin/auth", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ phone: "9618401231", name: "Pranav" }),
          });
          const authData = await authRes.json();
          if (authData?.token) {
            token = authData.token;
            localStorage.setItem("pixello_admin_token", authData.token);
            document.cookie = `pixello_admin_token=${authData.token}; path=/; max-age=2592000; SameSite=Lax`;
          }
        } catch (e) {}
      }
      if (token) headers["Authorization"] = `Bearer ${token}`;

      const res = await fetch(`/api/admin/orders/${encodeURIComponent(orderId)}/status`, {
        method: "PATCH",
        headers,
        body: JSON.stringify({ status, note }),
      });

      if (!res.ok) {
        // Fallback to customer/universal status update route
        await fetch(`/api/orders/${encodeURIComponent(orderId)}/status`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status, note }),
        });
      }

      await fetchOrdersFromBackend(false);

      if (typeof window !== "undefined") {
        window.dispatchEvent(new CustomEvent("pixello_orders_updated"));
        window.dispatchEvent(new CustomEvent("order_update"));
        localStorage.setItem("pixello_orders_sync_trigger", String(Date.now()));
      }
    } catch (err) {
      console.error("Error updating order status on backend:", err);
    }
  };

  const updateOrderDetails = async (orderId: string, details: Partial<Order>) => {
    // 1. Optimistic update in state
    setOrders((prev) => prev.map((o) => (o.id === orderId ? { ...o, ...details } : o)));

    // 2. Synchronize to localStorage backup
    if (typeof window !== "undefined") {
      try {
        const cacheKey = `pixello_order_doc_${orderId}`;
        const existing = JSON.parse(localStorage.getItem(cacheKey) || "{}");
        if (details.invoiceUrl !== undefined) {
          if (details.invoiceUrl) existing.invoiceUrl = details.invoiceUrl;
          else delete existing.invoiceUrl;
        }
        if (details.shippingLabelUrl !== undefined) {
          if (details.shippingLabelUrl) existing.shippingLabelUrl = details.shippingLabelUrl;
          else delete existing.shippingLabelUrl;
        }
        if (details.trackingAwb !== undefined) {
          if (details.trackingAwb) existing.trackingAwb = details.trackingAwb;
          else delete existing.trackingAwb;
        }
        localStorage.setItem(cacheKey, JSON.stringify(existing));
      } catch (e) {
        // LocalStorage quota may be exceeded for large images
      }
    }

    try {
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      let token = typeof window !== "undefined" ? localStorage.getItem("pixello_admin_token") : null;
      if (!token && typeof window !== "undefined") {
        try {
          const authRes = await fetch("/api/admin/auth", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ phone: "9618401231", name: "Pranav" }),
          });
          const authData = await authRes.json();
          if (authData?.token) {
            token = authData.token;
            localStorage.setItem("pixello_admin_token", authData.token);
            document.cookie = `pixello_admin_token=${authData.token}; path=/; max-age=2592000; SameSite=Lax`;
          }
        } catch (e) {}
      }
      if (token) headers["Authorization"] = `Bearer ${token}`;

      const patchBody: Record<string, unknown> = {};

      const estDate = details.deliveryInfo?.estimatedDeliveryDate ?? 
        (details as Record<string, unknown>).estimatedDeliveryDate ?? 
        (details as Record<string, unknown>).estimatedDelivery;
      if (estDate !== undefined) patchBody.estimatedDeliveryDate = estDate;

      const provider = details.deliveryPartner ?? details.deliveryInfo?.deliveryProvider;
      if (provider !== undefined) {
        patchBody.deliveryProvider = provider;
        patchBody.deliveryPartnerName = provider;
      }

      const awb = details.trackingAwb ?? details.waybill;
      if (awb !== undefined) {
        patchBody.trackingAwb = awb;
        patchBody.trackingId = awb;
        patchBody.awbNumber = awb;
      }

      const trackUrl = details.trackingUrl ?? details.deliveryInfo?.trackingUrl;
      if (trackUrl !== undefined) patchBody.trackingUrl = trackUrl;

      if (details.invoiceUrl !== undefined) patchBody.invoiceUrl = details.invoiceUrl;
      if (details.shippingLabelUrl !== undefined) patchBody.shippingLabelUrl = details.shippingLabelUrl;

      await fetch(`/api/admin/orders/${encodeURIComponent(orderId)}/status`, {
        method: "PATCH",
        headers,
        body: JSON.stringify(patchBody),
      });
      await fetchOrdersFromBackend(false);

      if (typeof window !== "undefined") {
        window.dispatchEvent(new CustomEvent("pixello_orders_updated"));
        window.dispatchEvent(new CustomEvent("order_update"));
        localStorage.setItem("pixello_orders_sync_trigger", String(Date.now()));
      }
    } catch (err) {
      console.error("Error updating order details on backend:", err);
    }
  };

  return (
    <OrderContext.Provider
      value={{
        orders,
        metrics,
        loading,
        addOrder,
        updateOrderStatus,
        updateOrderDetails,
        refreshOrders: () => fetchOrdersFromBackend(false),
      }}
    >
      {children}
    </OrderContext.Provider>
  );
}

export function useOrders() {
  const context = useContext(OrderContext);
  if (!context) {
    throw new Error("useOrders must be used within an OrderProvider");
  }
  return context;
}
