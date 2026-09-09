"use client";

import React, { createContext, useContext, useState, useEffect } from "react";

export interface FrameSizeConfig {
  label: string;
  name: string;
  dimensions: string;
  originalPrice: number;
  discountPct: number;
  gsm180Price: number;
  gsm260Price: number;
}

export interface FrameColorConfig {
  label: string;
  colorClass: string;
  borderClass: string;
  hex: string;
}

export interface ProductVariant {
  id?: string;
  name: string;
  price: number;
  originalPrice?: number;
  description?: string;
  discountTag?: string;
}

export interface PolaroidSizeConfig {
  label: string;
  name: string;
  priceEach: number;
  minOrderQty: number;
  description: string;
}

export interface Product {
  id: string;
  name: string;
  category: string;
  price: number;
  originalPrice?: number;
  description?: string;
  badgeTag?: string;
  rating: number;
  reviews: number;
  image: string;
  images?: string[];
  badge?: string;
  stock?: number;
  status: "Active" | "Low Stock" | "Out of Stock" | "Inactive";
  variants?: ProductVariant[];
  frameSizes?: FrameSizeConfig[];
  frameColors?: FrameColorConfig[];
  polaroidSizes?: PolaroidSizeConfig[];
}

const DEFAULT_PRODUCTS: Product[] = [
  { 
    id: "PRD-01", 
    name: "Premium Wooden Frame", 
    category: "Frames", 
    price: 149, 
    originalPrice: 199, 
    description: "Personalized Premium Wooden Frame crafted with premium quality materials. Perfect for home, office & gifting.", 
    badgeTag: "25% OFF OPENING OFFER", 
    rating: 4.8, 
    reviews: 124, 
    image: "/images/wooden_frame_main.png", 
    badge: "Bestseller", 
    stock: 150, 
    status: "Active",
    frameSizes: [
      { label: "4x6 INCH", name: "4x6 INCH", dimensions: "4 x 6 Inches (10.1 x 15.2 cm)", originalPrice: 199, discountPct: 25, gsm180Price: 149, gsm260Price: 159 },
      { label: "5x7 INCH", name: "5x7 INCH", dimensions: "5 x 7 Inches (12.7 x 17.7 cm)", originalPrice: 249, discountPct: 32, gsm180Price: 169, gsm260Price: 179 },
      { label: "6x8 INCH", name: "6x8 INCH", dimensions: "6 x 8 Inches (15.2 x 20.3 cm)", originalPrice: 299, discountPct: 40, gsm180Price: 179, gsm260Price: 189 },
      { label: "A4 SIZE", name: "A4 SIZE (21 x 29.7 cm)", dimensions: "A4 Size (21.0 x 29.7 cm)", originalPrice: 359, discountPct: 45, gsm180Price: 199, gsm260Price: 229 },
    ],
    frameColors: [
      { label: "Black", colorClass: "bg-black text-white", borderClass: "border-black", hex: "#000000" },
      { label: "Brown", colorClass: "bg-[#5A3A28] text-white", borderClass: "border-[#5A3A28]", hex: "#5A3A28" },
      { label: "White", colorClass: "bg-white text-[#3A2B24]", borderClass: "border-[#EFE6DD]", hex: "#FFFFFF" },
    ]
  },
  { id: "PRD-02", name: "Classic Custom Polaroid Set (24 prints)", category: "Polaroids", price: 8, originalPrice: 12, description: "Tiny prints, big memories! Transform digital photos into retro-style aesthetic polaroid prints with premium photo paper quality.", badgeTag: "ONLY AT ₹399 • POPULAR", rating: 4.9, reviews: 342, image: "/images/polaroid_set.png", badge: "Trending", stock: 500, status: "Active",
    polaroidSizes: [
      { label: "SMALL", name: "Small Polaroid", priceEach: 8, minOrderQty: 10, description: "Tiny prints • Min order 10 prints" },
      { label: "MEDIUM", name: "Medium Polaroid", priceEach: 15, minOrderQty: 12, description: "Classic polaroid size • Min order 12 prints" },
      { label: "LARGE", name: "Large Polaroid", priceEach: 25, minOrderQty: 4, description: "Jumbo aesthetic print • Min order 4 prints" },
    ]
  },
  { 
    id: "PRD-03", 
    name: "Custom Magic Photo Mug", 
    category: "Gifts", 
    price: 349, 
    originalPrice: 499, 
    description: "Enjoy hot drinks with your favorite memories! High-grade ceramic mug printed with rich vibrant colors that reveal upon filling hot beverages.", 
    badgeTag: "ONLY AT ₹349 • NEW", 
    rating: 4.8, 
    reviews: 142, 
    image: "/images/custom_mug.png", 
    badge: "Trending", 
    stock: 120, 
    status: "Active",
    variants: [
      {
        id: "mug-v1",
        name: "Magic Black (Heat-Activated Color Reveal)",
        price: 349,
        originalPrice: 499,
        description: "Appears black when cold • Reveals full HD photo when hot beverage is added",
        discountTag: "30% OFF"
      },
      {
        id: "mug-v2",
        name: "Glossy Classic White Ceramic Mug",
        price: 299,
        originalPrice: 399,
        description: "Crisp white 330ml ceramic with permanently printed vibrant photo wrap",
        discountTag: "25% OFF"
      },
      {
        id: "mug-v3",
        name: "Heart-Handle Romantic Magic Mug",
        price: 399,
        originalPrice: 599,
        description: "Special heart-shaped ergonomic handle + heat reveal effect for loved ones",
        discountTag: "33% OFF"
      }
    ]
  },
  { id: "PRD-04", name: "LED Acrylic Photo Lamp", category: "LED", price: 1299, originalPrice: 1999, description: "Illuminate your special moments with custom laser-engraved LED acrylic lamps. Features 7 warm light modes with solid wood base.", badgeTag: "ONLY AT ₹1299 • TOP RATED", rating: 4.9, reviews: 215, image: "/images/led_acrylic_lamp.png", badge: "Popular", stock: 45, status: "Active" },
  { id: "PRD-05", name: "Spotify Acrylic Music Plaque", category: "Gifts", price: 799, originalPrice: 1199, description: "Scan & Play! Custom acrylic plaque printed with your favorite song waveform, album cover, and scannable Spotify code.", badgeTag: "ONLY AT ₹799 • LIMITED", rating: 4.5, reviews: 156, image: "/images/wooden_frame_angle.png", stock: 80, status: "Active" },
  { id: "PRD-06", name: "Lighting Panda", category: "Gifts", price: 89, originalPrice: 199, description: "Light up your CUTE MOMENTS! Moss Panda Lamp featuring soft warm glow, energy-efficient LED, and adorable room decor design.", badgeTag: "ONLY AT ₹89 • SPECIAL DEAL", rating: 4.9, reviews: 28, image: "/images/led_acrylic_lamp.png", stock: 20, status: "Active", badge: "New" },
  { id: "PRD-07", name: "Collage Wall Photo Frame Set", category: "Frames", price: 1499, originalPrice: 2499, description: "Transform your empty walls into a gallery of memories with our multi-frame wall collage set.", badgeTag: "ONLY AT ₹1499 • BEST VALUE", rating: 4.9, reviews: 402, image: "/images/wooden_frame_wall.png", stock: 80, status: "Active" },
  { 
    id: "PRD-08", 
    name: "Paper Weight", 
    category: "Gifts", 
    price: 229, 
    originalPrice: 399, 
    description: "Hold your FOREVER US PAPER WEIGHT! A keepsake that lasts forever. Beautifully crafted with crystal clear design, romantic resin figurines, and ambient LED light.", 
    badgeTag: "ONLY AT ₹229 • BEST QUALITY ♥", 
    rating: 5.0, 
    reviews: 1, 
    image: "/images/led_acrylic_lamp.png", 
    badge: "Best Quality", 
    stock: 65, 
    status: "Active",
    variants: [
      {
        id: "v1",
        name: "FOREVER US PAPER WEIGHT (STANDARD)",
        price: 229,
        originalPrice: 399,
        description: "Crystal clear acrylic • Couple figurine with warm LED glow",
        discountTag: "42% OFF"
      },
      {
        id: "v2",
        name: "FOREVER US PAPER WEIGHT + GIFT WRAP BOX",
        price: 269,
        originalPrice: 499,
        description: "Includes gift box + Personalized message card",
        discountTag: "46% OFF"
      }
    ]
  },
];

interface ProductContextType {
  products: Product[];
  addProduct: (product: Omit<Product, "rating" | "reviews">) => void;
  updateProduct: (id: string, updated: Partial<Product>) => void;
  deleteProduct: (id: string) => void;
  deductInventory: (orderedItems: { name: string; quantity: number }[]) => void;
}

const ProductContext = createContext<ProductContextType | undefined>(undefined);

const STORAGE_KEY = "pixello_products_sync_v6";

export function ProductProvider({ children }: { children: React.ReactNode }) {
  const [products, setProducts] = useState<Product[]>(DEFAULT_PRODUCTS);

  const fetchProductsFromBackend = async () => {
    try {
      const res = await fetch("/api/products");
      const data = await res.json();
      if (data.success && Array.isArray(data.products) && data.products.length > 0) {
        setProducts(data.products);
        if (typeof window !== "undefined") {
          try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(data.products));
          } catch (e) {}
        }
      }
    } catch (err) {
      console.warn("Could not fetch products from backend:", err);
    }
  };

  useEffect(() => {
    fetchProductsFromBackend();

    // Setup SSE listener for live updates across tabs
    let eventSource: EventSource | null = null;
    try {
      eventSource = new EventSource("/api/events");
      eventSource.addEventListener("product_update", () => {
        fetchProductsFromBackend();
      });
    } catch (e) {}

    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY && e.newValue) {
        try {
          setProducts(JSON.parse(e.newValue));
        } catch (err) {}
      }
    };

    const handleCustomEvent = () => {
      fetchProductsFromBackend();
    };

    window.addEventListener("storage", handleStorageChange);
    window.addEventListener("pixello_products_updated", handleCustomEvent);

    return () => {
      if (eventSource) eventSource.close();
      window.removeEventListener("storage", handleStorageChange);
      window.removeEventListener("pixello_products_updated", handleCustomEvent);
    };
  }, []);

  const saveProductsList = (newList: Product[]) => {
    setProducts(newList);
    if (typeof window !== "undefined") {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(newList));
      } catch (e) {}
    }
  };

  const addProduct = async (newP: Omit<Product, "rating" | "reviews">) => {
    const fullProduct: Product = {
      ...newP,
      rating: 5.0,
      reviews: 1,
      image: newP.image || "/images/led_acrylic_lamp.png",
    };

    // Optimistic update
    const updated = [fullProduct, ...products];
    saveProductsList(updated);

    // Call backend API
    try {
      const res = await fetch("/api/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(fullProduct),
      });
      const data = await res.json();
      if (data.success && data.product) {
        setProducts((prev) => prev.map((p) => (p.id === fullProduct.id ? data.product : p)));
      }
    } catch (err) {
      console.error("Failed to persist product to database:", err);
    }
  };

  const updateProduct = async (id: string, updatedFields: Partial<Product>) => {
    const cleanId = (id || "").trim().toLowerCase();
    const parsedId = parseInt(cleanId.replace(/\D/g, ""), 10);

    let targetId = id;
    const updatedList = products.map((p) => {
      const pClean = (p.id || "").trim().toLowerCase();
      const pParsed = parseInt(pClean.replace(/\D/g, ""), 10);

      const isIdExact = pClean === cleanId;
      const isNumMatch = !isNaN(parsedId) && !isNaN(pParsed) && parsedId === pParsed;
      const isNameMatch = updatedFields.name ? p.name.toLowerCase() === updatedFields.name.toLowerCase() : false;

      if (isIdExact || isNumMatch || isNameMatch) {
        targetId = p.id;
        return { ...p, ...updatedFields };
      }
      return p;
    });

    saveProductsList(updatedList);

    // Persist to backend database
    try {
      await fetch(`/api/products/${targetId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatedFields),
      });
    } catch (err) {
      console.error("Failed to update product in database:", err);
    }
  };

  const deleteProduct = async (id: string) => {
    const updatedList = products.filter((p) => p.id !== id);
    saveProductsList(updatedList);

    // Delete in database
    try {
      await fetch(`/api/products/${id}`, { method: "DELETE" });
    } catch (err) {
      console.error("Failed to delete product in database:", err);
    }
  };

  const deductInventory = async (orderedItems: { name: string; quantity: number }[]) => {
    for (const item of orderedItems) {
      const matched = products.find((p) => p.name.toLowerCase() === item.name.toLowerCase());
      if (matched && matched.stock !== undefined) {
        const newStock = Math.max(0, matched.stock - item.quantity);
        updateProduct(matched.id, {
          stock: newStock,
          status: newStock === 0 ? "Out of Stock" : (newStock <= 5 ? "Low Stock" : "Active"),
        });
      }
    }
  };

  return (
    <ProductContext.Provider value={{ products, addProduct, updateProduct, deleteProduct, deductInventory }}>
      {children}
    </ProductContext.Provider>
  );
}

export function useProducts() {
  const context = useContext(ProductContext);
  if (!context) {
    throw new Error("useProducts must be used within a ProductProvider");
  }
  return context;
}
