"use client";

import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from "react";

export interface OrderItem {
  id?: string;
  name: string;
  size: string;
  quantity: number;
  price: number;
  image: string;
  photos?: string[];
  customizationDetails?: string;
}

export type OrderStatus = 
  | "Processing" 
  | "Printing" 
  | "Packed" 
  | "Ready for Delivery"
  | "Delivery Picked Up" 
  | "Out for Delivery" 
  | "Delivered" 
  | "Cancelled"
  | "Out of Stock (Refill Pending)" 
  | "Replacement Requested";

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
    if (isFetchingRef.current) return;
    isFetchingRef.current = true;

    if (isInitial) {
      setLoading(true);
    }

    try {
      const headers: Record<string, string> = {};
      let isAdmin = false;

      if (typeof window !== "undefined") {
        const adminToken = localStorage.getItem("pixello_admin_token");
        const customerToken = localStorage.getItem("pixello_auth_token");
        const isAdminPath = window.location.pathname.startsWith("/admin");

        if (adminToken || isAdminPath) {
          headers["Authorization"] = `Bearer ${adminToken || customerToken || ""}`;
          isAdmin = true;
        } else if (customerToken) {
          headers["Authorization"] = `Bearer ${customerToken}`;
        }
      }

      const endpoint = isAdmin ? "/api/admin/orders?limit=100" : "/api/orders";
      let res = await fetch(endpoint, { headers });
      let data = await res.json().catch(() => ({ success: false }));

      // If admin endpoint is unauthorized or fails, gracefully fallback to universal orders
      if (!data.success && isAdmin) {
        res = await fetch("/api/orders", { headers });
        data = await res.json().catch(() => ({ success: false }));
      }

      if (data.success && Array.isArray(data.orders)) {
        setOrders(data.orders);
        if (data.metrics) {
          setMetrics(data.metrics);
        }
      }
    } catch (err) {
      console.warn("Error fetching orders from database API:", err);
    } finally {
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
    }, 300);
  }, [fetchOrdersFromBackend]);

  useEffect(() => {
    fetchOrdersFromBackend(true);

    let eventSource: EventSource | null = null;
    try {
      eventSource = new EventSource("/api/events");
      eventSource.addEventListener("order_update", () => {
        triggerDebouncedFetch();
      });
      eventSource.addEventListener("order_change", () => {
        triggerDebouncedFetch();
      });
      eventSource.addEventListener("notification_update", () => {
        triggerDebouncedFetch();
      });
      eventSource.addEventListener("notification_change", () => {
        triggerDebouncedFetch();
      });
    } catch {
      // ignore event source error
    }

    const handleStorageUpdate = () => {
      triggerDebouncedFetch();
    };

    // Auto-sync polling every 3 seconds for 100% reliable cross-portal live sync
    const autoSyncInterval = setInterval(() => {
      fetchOrdersFromBackend(false);
    }, 3000);

    window.addEventListener("pixello_orders_updated", handleStorageUpdate);
    window.addEventListener("pixello_order_created", handleStorageUpdate);
    window.addEventListener("auth_change", handleStorageUpdate);
    window.addEventListener("storage", handleStorageUpdate);

    return () => {
      if (eventSource) eventSource.close();
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
      if (typeof window !== "undefined") {
        const adminToken = localStorage.getItem("pixello_admin_token") || localStorage.getItem("pixello_auth_token");
        if (adminToken) headers["Authorization"] = `Bearer ${adminToken}`;
      }

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
    } catch (err) {
      console.error("Error updating order status on backend:", err);
    }
  };

  const updateOrderDetails = async (orderId: string, details: Partial<Order>) => {
    setOrders((prev) => prev.map((o) => (o.id === orderId ? { ...o, ...details } : o)));

    try {
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (typeof window !== "undefined") {
        const adminToken = localStorage.getItem("pixello_admin_token") || localStorage.getItem("pixello_auth_token");
        if (adminToken) headers["Authorization"] = `Bearer ${adminToken}`;
      }

      await fetch(`/api/admin/orders/${encodeURIComponent(orderId)}/status`, {
        method: "PATCH",
        headers,
        body: JSON.stringify({
          estimatedDeliveryDate: details.deliveryInfo?.estimatedDeliveryDate || (details as Record<string, unknown>).estimatedDeliveryDate || (details as Record<string, unknown>).estimatedDelivery,
          deliveryProvider: details.deliveryPartner || details.deliveryInfo?.deliveryProvider,
          trackingId: details.trackingAwb || details.waybill,
          awbNumber: details.trackingAwb || details.waybill,
          trackingUrl: details.trackingUrl || details.deliveryInfo?.trackingUrl,
        }),
      });
      await fetchOrdersFromBackend(false);
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
