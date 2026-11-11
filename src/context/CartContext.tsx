"use client";

import React, { createContext, useContext, useState, useEffect } from "react";

export interface CartItem {
  id: string;
  name: string;
  size: string;
  price: number;
  quantity: number;
  image: string;
  photos?: string[];
  isHamper?: boolean;
  hamperData?: any;
  frameCustomization?: any;
  customizationDetails?: any;
}

interface CartContextType {
  cartItems: CartItem[];
  cartCount: number;
  addToCart: (item: CartItem) => Promise<void>;
  removeFromCart: (id: string) => Promise<void>;
  updateQuantity: (id: string, delta: number) => Promise<void>;
  clearCart: () => Promise<void>;
  refreshCart: () => Promise<void>;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

function getSessionId(): string {
  if (typeof window === "undefined") return "guest";
  try {
    const isLoggedOut = localStorage.getItem("pixello_logged_out") === "true";
    if (isLoggedOut) {
      localStorage.removeItem("pixello_cart_session_id");
    }
    let sid = localStorage.getItem("pixello_cart_session_id");
    if (!sid) {
      sid = `ses_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
      localStorage.setItem("pixello_cart_session_id", sid);
    }
    return sid;
  } catch (e) {
    return "guest";
  }
}

function getUserId(): string | undefined {
  if (typeof window === "undefined") return undefined;
  try {
    const isLoggedOut = localStorage.getItem("pixello_logged_out") === "true";
    if (isLoggedOut) return undefined;
    const userStr = localStorage.getItem("pixello_user");
    if (userStr) {
      const u = JSON.parse(userStr);
      if (u && u.isLoggedIn !== false) {
        return u.id || u.mobile || undefined;
      }
    }
  } catch (e) {}
  return undefined;
}

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);

  const fetchCartFromBackend = async () => {
    try {
      const isLoggedOut = typeof window !== "undefined" && localStorage.getItem("pixello_logged_out") === "true";
      const userId = isLoggedOut ? undefined : getUserId();
      const sessionId = getSessionId();

      const url = userId ? `/api/cart?userId=${encodeURIComponent(userId)}` : `/api/cart?sessionId=${encodeURIComponent(sessionId)}`;
      const res = await fetch(url);
      const data = await res.json();
      if (data.success && Array.isArray(data.cartItems)) {
        setCartItems(data.cartItems);
      } else {
        setCartItems([]);
      }
    } catch (err) {
      console.warn("Could not fetch cart from backend:", err);
    }
  };

  useEffect(() => {
    fetchCartFromBackend();

    const handleStorageChange = () => {
      fetchCartFromBackend();
    };

    window.addEventListener("storage", handleStorageChange);
    window.addEventListener("auth_change", handleStorageChange);
    window.addEventListener("pixello_cart_updated", handleStorageChange);

    return () => {
      window.removeEventListener("storage", handleStorageChange);
      window.removeEventListener("auth_change", handleStorageChange);
      window.removeEventListener("pixello_cart_updated", handleStorageChange);
    };
  }, []);

  const cartCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);

  const addToCart = async (newItem: CartItem) => {
    // Optimistic UI update
    setCartItems((prev) => {
      const existing = prev.find((i) => i.id === newItem.id);
      if (existing) {
        return prev.map((i) =>
          i.id === newItem.id
            ? {
                ...i,
                quantity: i.quantity + newItem.quantity,
                photos: [...(i.photos || []), ...(newItem.photos || [])],
              }
            : i
        );
      }
      return [...prev, newItem];
    });

    try {
      const userId = getUserId();
      const sessionId = getSessionId();
      await fetch("/api/cart", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...newItem,
          userId,
          sessionId,
        }),
      });
      if (typeof window !== "undefined") {
        window.dispatchEvent(new Event("pixello_cart_updated"));
      }
    } catch (err) {
      console.error("Failed to add to database cart:", err);
    }
  };

  const removeFromCart = async (id: string) => {
    setCartItems((prev) => prev.filter((item) => item.id !== id));

    try {
      await fetch(`/api/cart?id=${encodeURIComponent(id)}`, { method: "DELETE" });
      if (typeof window !== "undefined") {
        window.dispatchEvent(new Event("pixello_cart_updated"));
      }
    } catch (err) {
      console.error("Failed to remove from database cart:", err);
    }
  };

  const updateQuantity = async (id: string, delta: number) => {
    setCartItems((prev) =>
      prev
        .map((item) => {
          if (item.id === id) {
            const newQty = item.quantity + delta;
            return newQty > 0 ? { ...item, quantity: newQty } : null;
          }
          return item;
        })
        .filter(Boolean) as CartItem[]
    );

    try {
      await fetch("/api/cart", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, delta }),
      });
      if (typeof window !== "undefined") {
        window.dispatchEvent(new Event("pixello_cart_updated"));
      }
    } catch (err) {
      console.error("Failed to update cart quantity in database:", err);
    }
  };

  const clearCart = async () => {
    setCartItems([]);

    try {
      const userId = getUserId();
      const sessionId = getSessionId();
      const query = userId ? `userId=${encodeURIComponent(userId)}` : `sessionId=${encodeURIComponent(sessionId)}`;
      await fetch(`/api/cart?${query}`, { method: "DELETE" });
      if (typeof window !== "undefined") {
        window.dispatchEvent(new Event("pixello_cart_updated"));
      }
    } catch (err) {
      console.error("Failed to clear cart in database:", err);
    }
  };

  return (
    <CartContext.Provider
      value={{
        cartItems,
        cartCount,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        refreshCart: fetchCartFromBackend,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
}
