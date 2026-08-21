"use client";

import React, { createContext, useContext, useState, useEffect } from "react";

export interface OrderItem {
  name: string;
  size: string;
  quantity: number;
  price: number;
  image: string;
  photos?: string[];
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

export interface Order {
  id: string;
  date: string;
  createdAt?: number;
  customerName: string;
  customerPhone: string;
  items: OrderItem[];
  totalAmount: number;
  subtotal?: number;
  deliveryFee?: number;
  status: OrderStatus;
  assignedStudio: string;
  deliveryAddress: string;
  deliveryPartner?: string;
  referralCode?: string;
  referralDiscount?: number;
  ambassadorName?: string;
  paymentMethod?: string;
  invoiceUrl?: string;
  shippingLabelUrl?: string;
  trackingAwb?: string;
  deliveryType?: "Direct Delivery" | "Shipping";
}

interface OrderContextType {
  orders: Order[];
  addOrder: (newOrder: Omit<Order, "id" | "date" | "status"> & { referralCode?: string }) => Promise<Order>;
  updateOrderStatus: (orderId: string, status: OrderStatus) => Promise<void>;
  updateOrderDetails: (orderId: string, details: Partial<Order>) => Promise<void>;
  refreshOrders: () => Promise<void>;
}

const OrderContext = createContext<OrderContextType | undefined>(undefined);

export function generatePxlOrderId(phone?: string, address?: string): string {
  const cleanPhone = (phone || "").replace(/\D/g, "");
  const last4Phone = cleanPhone.length >= 4 ? cleanPhone.slice(-4) : "1234";

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

export const INITIAL_ORDERS: Order[] = [
  {
    id: "PXL-1231-0001",
    date: "2026-08-18",
    customerName: "Sai Pranav",
    customerPhone: "9618401231",
    items: [
      { 
        name: "Premium Wooden Frame", 
        size: "A4 SIZE (260 GSM, Black Frame)", 
        quantity: 10, 
        price: 229, 
        image: "/images/wooden_frame_main.png",
        photos: [
          "/images/wooden_frame_main.png",
          "/images/wooden_frame_angle.png",
          "/images/polaroid_set.png",
          "/images/wooden_frame_main.png",
          "/images/wooden_frame_angle.png",
          "/images/polaroid_set.png",
          "/images/wooden_frame_main.png",
          "/images/wooden_frame_angle.png",
          "/images/polaroid_set.png",
          "/images/wooden_frame_main.png"
        ]
      }
    ],
    totalAmount: 2410.00,
    subtotal: 2290.00,
    deliveryFee: 120.00,
    status: "Delivered",
    assignedStudio: "Pixello Store (Sarada Nagar, Telangana)",
    deliveryAddress: "H.No 3-45/1, Christians Colony, Hastinapuram, Hyderabad, Telangana - 500070",
    paymentMethod: "COD",
    deliveryType: "Shipping",
    trackingAwb: "Delhivery Express - AWB 987123654"
  },
  {
    id: "PXL-1231-0070",
    date: "2026-08-14",
    customerName: "Sai Pranav",
    customerPhone: "9618401231",
    referralCode: "SREE20",
    referralDiscount: 18.00,
    ambassadorName: "Sree",
    items: [
      { name: "Premium Wooden Frame", size: "5x7 INCH (260 GSM, Black Frame)", quantity: 1, price: 179, image: "/images/wooden_frame_main.png" }
    ],
    totalAmount: 161.00,
    subtotal: 179.00,
    deliveryFee: 0,
    status: "Delivered",
    assignedStudio: "Pixello Store (Sarada Nagar, Telangana)",
    deliveryAddress: "CHRISTIANS COLONY, HASTINAPURAM ,, 500070, K.V.Rangareddy, Telangana - 500070",
    paymentMethod: "COD",
    deliveryType: "Shipping",
    invoiceUrl: "invoice_3dc5553c-972.pdf",
    trackingAwb: "Delhivery Express - AWB 123456789"
  },
  {
    id: "PXL-6610-0010",
    date: "2026-08-20",
    customerName: "Harsha",
    customerPhone: "7989856610",
    items: [
      { 
        name: "LED Acrylic Photo Lamp", 
        size: "A4 SIZE (180 GSM, Black Frame)", 
        quantity: 1, 
        price: 199, 
        image: "/images/wooden_frame_angle.png",
        photos: ["/images/wooden_frame_angle.png"]
      }
    ],
    totalAmount: 249.00,
    subtotal: 199.00,
    deliveryFee: 50.00,
    status: "Processing",
    assignedStudio: "Pixello Store (Sarada Nagar, Telangana)",
    deliveryAddress: "Near nepal reddy Motars, Alwal, Hyderabad, Telangana - 500010",
    paymentMethod: "COD",
    deliveryType: "Shipping"
  },
  {
    id: "PXL-9988-5001",
    date: "2026-08-08",
    customerName: "Harsha vardhan",
    customerPhone: "+91 9988112233",
    items: [
      { name: "Classic Polaroid Set (24 prints)", size: "MEDIUM Polaroid (12 Prints)", quantity: 1, price: 638.82, image: "/images/polaroid_set.png" }
    ],
    totalAmount: 638.82,
    subtotal: 638.82,
    deliveryFee: 0,
    status: "Delivered",
    assignedStudio: "Pixello Studio (Sanath Nagar, Hyderabad)",
    deliveryAddress: "Near Nepal reddy motors, Alwal, Hyderabad - 500018",
    paymentMethod: "Razorpay (Online UPI / Card / NetBanking)",
    deliveryType: "Shipping"
  },
  {
    id: "PXL-9618-5015",
    date: "2026-08-05",
    customerName: "Neela Sai Pranav",
    customerPhone: "9618401231",
    items: [
      { name: "Custom Spotify Acrylic Plaque", size: "A5 Acrylic Plaque (Scannable Code)", quantity: 2, price: 1205, image: "/images/wooden_frame_main.png" }
    ],
    totalAmount: 2410.00,
    subtotal: 2410.00,
    deliveryFee: 0,
    status: "Delivered",
    assignedStudio: "Pixello Store (Sarada Nagar, Telangana)",
    deliveryAddress: "Plot No. 42, Alwal Hills, Secunderabad, Telangana - 500015",
    paymentMethod: "Razorpay (Online UPI)",
    deliveryType: "Shipping",
    trackingAwb: "BlueDart Express - AWB 884729103"
  }
];

const STORAGE_KEY = "pixello_customer_orders_v5";
const OVERRIDES_KEY = "pixello_order_status_overrides_v5";

export function OrderProvider({ children }: { children: React.ReactNode }) {
  const [orders, setOrders] = useState<Order[]>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem(STORAGE_KEY) || localStorage.getItem("pixello_customer_orders_v3");
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed) && parsed.length > 0) {
            // Merge with INITIAL_ORDERS to make sure any missing demo orders are included
            const existingIds = new Set(parsed.map(o => o.id));
            const merged = [...parsed];
            for (const initOrder of INITIAL_ORDERS) {
              if (!existingIds.has(initOrder.id)) {
                merged.push(initOrder);
              }
            }
            return merged;
          }
        } catch (e) {
          console.error(e);
        }
      }
    }
    return INITIAL_ORDERS;
  });

  const [statusOverrides, setStatusOverrides] = useState<Record<string, OrderStatus>>(() => {
    if (typeof window === "undefined") return {};
    try {
      const saved = localStorage.getItem(OVERRIDES_KEY) || localStorage.getItem("pixello_order_status_overrides_v2");
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  const applyOverridesAndFormat = (rawOrders: Order[], overrides: Record<string, OrderStatus>): Order[] => {
    return rawOrders.map((o) => {
      const pxlId = o.id || generatePxlOrderId(o.customerPhone, o.deliveryAddress);
      const targetId = o.id || pxlId;
      const overStatus = overrides[targetId] || overrides[pxlId];
      return {
        ...o,
        id: targetId,
        status: overStatus || o.status,
      };
    });
  };

  const safeSaveOrdersToStorage = (ordersList: Order[]) => {
    if (typeof window === "undefined") return;
    try {
      const sanitized = ordersList.map((o) => ({
        ...o,
        items: (o.items || []).map((it) => ({
          ...it,
          image: typeof it.image === "string" && it.image.length > 5000 ? "/images/wooden_frame_main.png" : it.image,
          photos: (it.photos || []).map((p) => (typeof p === "string" && p.length > 5000 ? "/images/wooden_frame_main.png" : p)),
        })),
      }));
      localStorage.setItem(STORAGE_KEY, JSON.stringify(sanitized));
    } catch (e) {
      // Storage quota reached, gracefully continue with database in-memory state
    }
  };

  const fetchOrdersFromBackend = async () => {
    try {
      const headers: Record<string, string> = {};
      if (typeof window !== "undefined") {
        const token = localStorage.getItem("pixello_auth_token");
        if (token) headers["Authorization"] = `Bearer ${token}`;
      }

      const res = await fetch("/api/orders", { headers });
      const data = await res.json();
      if (data.success && Array.isArray(data.orders)) {
        const merged = applyOverridesAndFormat(data.orders, statusOverrides);
        setOrders(merged);
        safeSaveOrdersToStorage(merged);
      }
    } catch (err) {
      console.warn("Backend API offline, using local cache:", err);
    }
  };

  useEffect(() => {
    // Fetch directly from database API on mount
    fetchOrdersFromBackend();

    // Live Server-Sent Events sync across tabs and portals
    let eventSource: EventSource | null = null;
    try {
      eventSource = new EventSource("/api/events");
      eventSource.addEventListener("order_update", () => {
        fetchOrdersFromBackend();
      });
    } catch (e) {}

    const handleStorageUpdate = () => {
      if (typeof window !== "undefined") {
        const isLoggedOut = localStorage.getItem("pixello_logged_out") === "true";
        if (isLoggedOut) {
          setOrders([]);
          return;
        }
      }
      fetchOrdersFromBackend();
    };

    window.addEventListener("pixello_orders_updated", handleStorageUpdate);
    window.addEventListener("auth_change", handleStorageUpdate);
    window.addEventListener("storage", handleStorageUpdate);
    return () => {
      if (eventSource) eventSource.close();
      window.removeEventListener("pixello_orders_updated", handleStorageUpdate);
      window.removeEventListener("auth_change", handleStorageUpdate);
      window.removeEventListener("storage", handleStorageUpdate);
    };
  }, []);

  const addOrder = async (orderData: Omit<Order, "id" | "date" | "status"> & { referralCode?: string }): Promise<Order> => {
    const tempId = generatePxlOrderId(orderData.customerPhone, orderData.deliveryAddress);
    const newOrder: Order = {
      ...orderData,
      id: tempId,
      date: new Date().toISOString().split("T")[0],
      createdAt: Date.now(),
      status: "Processing",
      paymentMethod: orderData.paymentMethod || "COD",
      assignedStudio: orderData.assignedStudio || "Pixello Store (Sarada Nagar, Telangana)"
    };

    const headers: Record<string, string> = { "Content-Type": "application/json" };
    if (typeof window !== "undefined") {
      const token = localStorage.getItem("pixello_auth_token");
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
        setOrders((prev) => {
          const updated = [result.order, ...prev.filter(o => o.id !== result.order.id)];
          safeSaveOrdersToStorage(updated);
          if (typeof window !== "undefined") {
            window.dispatchEvent(new Event("pixello_orders_updated"));
            window.dispatchEvent(new Event("storage"));
          }
          return updated;
        });
        return result.order;
      } else {
        throw new Error(result.error || "Failed to create order");
      }
    } catch (err: any) {
      console.error("Error creating order on backend:", err);
      throw err;
    }
  };

  const updateOrderStatus = async (orderId: string, status: OrderStatus) => {
    // 1. Update local state immediately
    setOrders((prev) => {
      const updated = prev.map((o) => (o.id === orderId ? { ...o, status } : o));
      if (typeof window !== "undefined") {
        try {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
          localStorage.setItem("pixello_customer_orders_v3", JSON.stringify(updated));
          window.dispatchEvent(new Event("pixello_orders_updated"));
          window.dispatchEvent(new Event("storage"));
        } catch (e) {
          console.error(e);
        }
      }
      return updated;
    });

    // 2. Persist in overrides state and localStorage
    setStatusOverrides((prev) => {
      const updated = { ...prev, [orderId]: status };
      try {
        localStorage.setItem(OVERRIDES_KEY, JSON.stringify(updated));
        localStorage.setItem("pixello_order_status_overrides_v2", JSON.stringify(updated));
      } catch (e) {
        console.warn("Could not save status override to localStorage:", e);
      }
      return updated;
    });

    // 3. Send update to API endpoint
    try {
      await fetch(`/api/orders/${orderId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
    } catch (err) {
      console.error("Error updating status on backend:", err);
    }
  };

  const updateOrderDetails = async (orderId: string, details: Partial<Order>) => {
    setOrders((prev) => {
      const updated = prev.map((o) => (o.id === orderId ? { ...o, ...details } : o));
      safeSaveOrdersToStorage(updated);
      if (typeof window !== "undefined") {
        window.dispatchEvent(new Event("pixello_orders_updated"));
        window.dispatchEvent(new Event("storage"));
      }
      return updated;
    });
  };

  return (
    <OrderContext.Provider value={{ orders, addOrder, updateOrderStatus, updateOrderDetails, refreshOrders: fetchOrdersFromBackend }}>
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
