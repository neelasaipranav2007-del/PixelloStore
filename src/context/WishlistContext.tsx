"use client";

import React, { createContext, useContext, useState, useEffect } from "react";

export interface WishlistItem {
  id: string;
  name: string;
  category: string;
  price: number;
  image: string;
}

interface WishlistContextType {
  wishlist: WishlistItem[];
  toggleWishlist: (item: any) => boolean; // returns true if added, false if removed
  isInWishlist: (id: string) => boolean;
  wishlistCount: number;
}

const WishlistContext = createContext<WishlistContextType | undefined>(undefined);

const DEFAULT_CATALOG: Record<string, WishlistItem> = {
  "1": { id: "1", name: "Premium Wooden Frame", category: "Frames", price: 499, image: "/images/wooden_frame_main.png" },
  "PRD-01": { id: "PRD-01", name: "Premium Wooden Frame", category: "Frames", price: 499, image: "/images/wooden_frame_main.png" },
  "2": { id: "2", name: "Classic Custom Polaroid Set", category: "Polaroids", price: 399, image: "/images/polaroid_set.png" },
  "PRD-02": { id: "PRD-02", name: "Classic Custom Polaroid Set", category: "Polaroids", price: 399, image: "/images/polaroid_set.png" },
  "3": { id: "3", name: "Custom Magic Photo Mug", category: "Custom Mugs", price: 349, image: "/images/custom_mug.png" },
  "PRD-03": { id: "PRD-03", name: "Custom Magic Photo Mug", category: "Custom Mugs", price: 349, image: "/images/custom_mug.png" },
  "4": { id: "4", name: "LED Acrylic Photo Lamp", category: "LED Frames", price: 1299, image: "/images/led_acrylic_lamp.png" },
  "PRD-04": { id: "PRD-04", name: "LED Acrylic Photo Lamp", category: "LED Frames", price: 1299, image: "/images/led_acrylic_lamp.png" },
  "PRD-06": { id: "PRD-06", name: "Lighting Panda", category: "Gifts", price: 99, image: "/images/led_acrylic_lamp.png" },
  "PRD-08": { id: "PRD-08", name: "Forever Us Paper Weight", category: "Gifts", price: 229, image: "/images/led_acrylic_lamp.png" },
};

function sanitizeWishlistItem(item: any): WishlistItem {
  if (typeof item === "string") {
    return DEFAULT_CATALOG[item] || {
      id: item,
      name: "Custom Memory Frame",
      category: "Frames",
      price: 499,
      image: "/images/wooden_frame_main.png",
    };
  }

  const id = item?.id || "PRD-01";
  const catalogMatch = DEFAULT_CATALOG[id];

  return {
    id,
    name: item?.name || catalogMatch?.name || "Custom Memory Frame",
    category: item?.category || catalogMatch?.category || "Frames",
    price: item?.price !== undefined ? item.price : (catalogMatch?.price || 499),
    image: item?.image || catalogMatch?.image || "/images/wooden_frame_main.png",
  };
}

function getCurrentUserWishlistKey(): string {
  if (typeof window === "undefined") return "pixello_wishlist_guest";
  try {
    const isLoggedOut = localStorage.getItem("pixello_logged_out");
    if (isLoggedOut === "true") return "pixello_wishlist_guest";
    const savedUser = localStorage.getItem("pixello_user");
    if (savedUser) {
      const parsed = JSON.parse(savedUser);
      const mobile = (parsed.mobile || "").replace(/\D/g, "").slice(-10);
      if (mobile) return `pixello_wishlist_${mobile}`;
    }
  } catch (e) {
    console.error(e);
  }
  return "pixello_wishlist_guest";
}

export function WishlistProvider({ children }: { children: React.ReactNode }) {
  const [wishlist, setWishlist] = useState<WishlistItem[]>([]);

  const fetchWishlistFromBackend = async () => {
    try {
      const key = getCurrentUserWishlistKey();
      const res = await fetch(`/api/wishlist?sessionId=${encodeURIComponent(key)}`);
      const data = await res.json();
      if (data.success && Array.isArray(data.wishlist) && data.wishlist.length > 0) {
        const cleaned = data.wishlist.map(sanitizeWishlistItem);
        setWishlist(cleaned);
        if (typeof window !== "undefined") {
          try {
            localStorage.setItem(key, JSON.stringify(cleaned));
          } catch (e) {}
        }
        return;
      }
    } catch (err) {
      console.warn("Could not fetch wishlist from backend:", err);
    }

    // Local fallback if offline
    try {
      const key = getCurrentUserWishlistKey();
      const saved = localStorage.getItem(key);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          setWishlist(parsed.map(sanitizeWishlistItem));
        }
      }
    } catch (e) {}
  };

  useEffect(() => {
    fetchWishlistFromBackend();

    const handleAuthOrStorageChange = () => {
      fetchWishlistFromBackend();
    };

    window.addEventListener("auth_change", handleAuthOrStorageChange);
    window.addEventListener("storage", handleAuthOrStorageChange);
    return () => {
      window.removeEventListener("auth_change", handleAuthOrStorageChange);
      window.removeEventListener("storage", handleAuthOrStorageChange);
    };
  }, []);

  const saveWishlist = async (newWishlist: WishlistItem[], itemToSync?: any, isAdded?: boolean) => {
    const cleaned = newWishlist.map(sanitizeWishlistItem);
    setWishlist(cleaned);
    try {
      const key = getCurrentUserWishlistKey();
      localStorage.setItem(key, JSON.stringify(cleaned));

      if (itemToSync) {
        await fetch("/api/wishlist", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ...itemToSync,
            sessionId: key,
          }),
        });
      }
    } catch (e) {
      console.error(e);
    }
  };

  const isInWishlist = (idOrItem: any) => {
    const targetId = typeof idOrItem === "string" ? idOrItem : idOrItem?.id;
    return wishlist.some((item) => item.id === targetId);
  };

  const toggleWishlist = (itemOrId: any): boolean => {
    const itemId = typeof itemOrId === "string" ? itemOrId : itemOrId?.id;
    if (!itemId) return false;

    const exists = wishlist.some((w) => w.id === itemId);
    if (exists) {
      const updated = wishlist.filter((w) => w.id !== itemId);
      saveWishlist(updated, typeof itemOrId === "object" ? itemOrId : { id: itemId }, false);
      return false;
    } else {
      const sanitized = sanitizeWishlistItem(itemOrId);
      const updated = [...wishlist, sanitized];
      saveWishlist(updated, sanitized, true);
      return true;
    }
  };

  return (
    <WishlistContext.Provider
      value={{
        wishlist,
        toggleWishlist,
        isInWishlist,
        wishlistCount: wishlist.length,
      }}
    >
      {children}
    </WishlistContext.Provider>
  );
}

export function useWishlist() {
  const context = useContext(WishlistContext);
  if (!context) {
    throw new Error("useWishlist must be used within a WishlistProvider");
  }
  return context;
}
