"use client";

import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { Search, ShoppingCart, Heart, User, Menu, Sparkles, LogIn, LogOut, X, Phone, Camera, ArrowRight, Bell, MessageSquareQuote, Check, CheckCheck, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { useCart } from "@/context/CartContext";
import { useWishlist } from "@/context/WishlistContext";
import { useRouter } from "next/navigation";
import { usePixelloTransition } from "@/components/customer/PixelloPageTransition";
import { motion } from "framer-motion";

export interface CustomerNotification {
  id: string;
  title: string;
  desc: string;
  time: string;
  read: boolean;
  type: "reply" | "order" | "promo";
  adminReply?: string;
  productName?: string;
  orderId?: string;
}

const MOCK_SEARCH_PRODUCTS = [
  { id: "1", name: "Premium Wooden Frame", category: "Frames", price: 499, image: "/images/wooden_frame_main.png" },
  { id: "2", name: "Classic Custom Polaroid Prints (24 prints)", category: "Polaroids", price: 399, image: "/images/polaroid_set.png" },
  { id: "3", name: "Custom Magic Photo Mug", category: "Gifts", price: 349, image: "/images/custom_mug.png" },
  { id: "4", name: "LED Acrylic Photo Lamp", category: "LED", price: 1299, image: "/images/led_acrylic_lamp.png" },
  { id: "5", name: "Spotify Acrylic Music Plaque", category: "Gifts", price: 799, image: "/images/wooden_frame_angle.png" },
  { id: "6", name: "Collage Wall Photo Frame Set", category: "Frames", price: 1499, image: "/images/wooden_frame_wall.png" },
];

const TYPO_MAP: Record<string, string> = {
  poloroid: "polaroid",
  poloroids: "polaroid",
  polroid: "polaroid",
  polroids: "polaroid",
  plaroid: "polaroid",
  fraem: "frame",
  freme: "frame",
  fram: "frame",
  mugg: "mug",
  spotifi: "spotify",
  spotfy: "spotify",
  colage: "collage",
};

function isNavbarFuzzyMatch(targetStr: string, queryInput: string): boolean {
  const cleanTarget = targetStr.toLowerCase();
  const cleanInput = queryInput.toLowerCase().trim();
  if (!cleanInput) return true;
  if (cleanTarget.includes(cleanInput)) return true;
  const normalizedInput = TYPO_MAP[cleanInput] || cleanInput;
  if (cleanTarget.includes(normalizedInput)) return true;

  const inputWords = cleanInput.split(/\s+/);
  const targetWords = cleanTarget.split(/\s+/);

  for (const iWord of inputWords) {
    const norm = TYPO_MAP[iWord] || iWord;
    for (const tWord of targetWords) {
      if (tWord.includes(norm) || norm.includes(tWord)) return true;
    }
  }
  return false;
}

export default function Navbar() {
  const router = useRouter();
  const { startTransitionTo, isTransitioning } = usePixelloTransition();
  const { cartCount } = useCart();
  const { wishlistCount } = useWishlist();
  const [showSignOutModal, setShowSignOutModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const searchContainerRef = useRef<HTMLDivElement>(null);

  // Customer Notifications State
  const [customerNotifications, setCustomerNotifications] = useState<CustomerNotification[]>(() => {
    if (typeof window !== "undefined") {
      try {
        const saved = localStorage.getItem("pixello_customer_notifications_v1");
        if (saved) return JSON.parse(saved);
      } catch (e) {}
    }
    return [
      {
        id: "notif-welcome",
        title: "Welcome to Pixello!",
        desc: "Handcrafted personalized frames and polaroids delivered right to your doorstep.",
        time: "1d ago",
        read: true,
        type: "promo",
      }
    ];
  });

  const [liveReplyPopOver, setLiveReplyPopOver] = useState<CustomerNotification | null>(null);

  const unreadCount = customerNotifications.filter((n) => !n.read).length;

  const handleMarkAllNotifsAsRead = (e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    const updated = customerNotifications.map((n) => ({ ...n, read: true }));
    setCustomerNotifications(updated);
    if (typeof window !== "undefined") {
      localStorage.setItem("pixello_customer_notifications_v1", JSON.stringify(updated));
    }
  };

  const handleMarkNotifAsRead = (id: string, e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    const updated = customerNotifications.map((n) => (n.id === id ? { ...n, read: true } : n));
    setCustomerNotifications(updated);
    if (typeof window !== "undefined") {
      localStorage.setItem("pixello_customer_notifications_v1", JSON.stringify(updated));
    }
  };

  const handleClearNotifs = (e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    if (typeof window !== "undefined") {
      try {
        const currentIds = customerNotifications.map((n) => n.id);
        const existingCleared = JSON.parse(localStorage.getItem("pixello_cleared_notif_ids") || "[]");
        const updatedCleared = Array.from(new Set([...existingCleared, ...currentIds]));
        localStorage.setItem("pixello_cleared_notif_ids", JSON.stringify(updatedCleared));
        localStorage.setItem("pixello_customer_notifications_v1", JSON.stringify([]));
      } catch (err) {}
    }
    setCustomerNotifications([]);
  };

  // Sync official studio responses from /api/reviews
  useEffect(() => {
    const syncStudioReplies = async () => {
      try {
        const res = await fetch("/api/reviews");
        const data = await res.json();
        if (data.success && Array.isArray(data.reviews)) {
          const repliedReviews = data.reviews.filter((r: any) => r.adminReply && r.adminReply.trim().length > 0);
          
          if (repliedReviews.length > 0) {
            const clearedIds = new Set(
              typeof window !== "undefined"
                ? JSON.parse(localStorage.getItem("pixello_cleared_notif_ids") || "[]")
                : []
            );

            setCustomerNotifications((prev) => {
              const existingIds = new Set(prev.map((n) => n.id));
              const newNotifs: CustomerNotification[] = [];

              repliedReviews.forEach((r: any) => {
                const notifId = `reply-rev-${r.id}`;
                if (!existingIds.has(notifId) && !clearedIds.has(notifId)) {
                  const itemNotif: CustomerNotification = {
                    id: notifId,
                    title: `Official Store Response from Pixello`,
                    desc: r.adminReply,
                    time: "Just now",
                    read: false,
                    type: "reply",
                    adminReply: r.adminReply,
                    productName: r.productName,
                    orderId: r.orderId,
                  };
                  newNotifs.push(itemNotif);

                  // Trigger live popover toast
                  const seenPopovers = JSON.parse(sessionStorage.getItem("pixello_seen_reply_popovers") || "[]");
                  if (!seenPopovers.includes(notifId)) {
                    setLiveReplyPopOver(itemNotif);
                    sessionStorage.setItem("pixello_seen_reply_popovers", JSON.stringify([...seenPopovers, notifId]));
                  }
                }
              });

              if (newNotifs.length > 0) {
                const combined = [...newNotifs, ...prev];
                if (typeof window !== "undefined") {
                  localStorage.setItem("pixello_customer_notifications_v1", JSON.stringify(combined));
                }
                return combined;
              }
              return prev;
            });
          }
        }
      } catch (err) {
        console.error("Error syncing customer notifications:", err);
      }
    };

    syncStudioReplies();
    window.addEventListener("pixello_admin_reviews_updated", syncStudioReplies);
    window.addEventListener("storage", syncStudioReplies);
    const interval = setInterval(syncStudioReplies, 10000);
    return () => {
      window.removeEventListener("pixello_admin_reviews_updated", syncStudioReplies);
      window.removeEventListener("storage", syncStudioReplies);
      clearInterval(interval);
    };
  }, []);

  useEffect(() => {
    setMounted(true);
  }, []);

  const [currentUser, setCurrentUser] = useState<any>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(event.target as Node)) {
        setIsSearchOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    const syncUserSession = async () => {
      if (typeof window !== "undefined") {
        const isLoggedOut = localStorage.getItem("pixello_logged_out") === "true";
        const token = localStorage.getItem("pixello_auth_token");
        if (isLoggedOut || !token) {
          localStorage.removeItem("pixello_user");
          setCurrentUser(null);
          return;
        }

        try {
          const res = await fetch("/api/auth/me", {
            headers: { Authorization: `Bearer ${token}` },
          });
          const data = await res.json();
          if (data.success && data.user) {
            setCurrentUser(data.user);
            localStorage.setItem("pixello_user", JSON.stringify(data.user));
          } else {
            localStorage.removeItem("pixello_user");
            localStorage.removeItem("pixello_auth_token");
            setCurrentUser(null);
          }
        } catch (e) {
          const savedUser = localStorage.getItem("pixello_user");
          if (savedUser) {
            try {
              const parsed = JSON.parse(savedUser);
              if (parsed && parsed.isLoggedIn !== false && parsed.name) {
                setCurrentUser(parsed);
              } else {
                setCurrentUser(null);
              }
            } catch (err) {
              setCurrentUser(null);
            }
          } else {
            setCurrentUser(null);
          }
        }
      }
    };

    syncUserSession();
    window.addEventListener("auth_change", syncUserSession);
    window.addEventListener("storage", syncUserSession);
    return () => {
      window.removeEventListener("auth_change", syncUserSession);
      window.removeEventListener("storage", syncUserSession);
    };
  }, []);

  const matchingSearchResults = searchQuery.trim() 
    ? MOCK_SEARCH_PRODUCTS.filter(p => isNavbarFuzzyMatch(`${p.name} ${p.category} polaroid frame mug gift lamp`, searchQuery))
    : [];

  const handleExecuteSearch = (queryVal: string) => {
    if (!queryVal.trim()) return;
    setIsSearchOpen(false);
    const targetUrl = `/products?search=${encodeURIComponent(queryVal.trim())}`;
    if (typeof window !== "undefined") {
      window.location.href = targetUrl;
    }
  };

  const handleSignOut = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } catch (e) {}

    if (typeof window !== "undefined") {
      localStorage.removeItem("pixello_user");
      localStorage.removeItem("pixello_auth_token");
      localStorage.removeItem("pixello_customer_orders_v5");
      localStorage.removeItem("pixello_customer_orders_v3");
      localStorage.removeItem("pixello_addresses_default");
      localStorage.setItem("pixello_logged_out", "true");
      document.cookie = "pixello_auth_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT;";
      document.cookie = "pixello_customer_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT;";
      document.cookie = "pixello_user=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT;";
      window.dispatchEvent(new Event("auth_change"));
      window.dispatchEvent(new Event("storage"));
    }
    setCurrentUser(null);
    setShowSignOutModal(false);
    window.location.href = "/login";
  };

  return (
    <nav className="sticky top-0 z-50 w-full border-b border-[#EFE6DD] bg-white/95 backdrop-blur-md shadow-xs">
      <div className="container mx-auto flex h-20 items-center justify-between px-4 md:px-6 gap-3">
        <div className="flex items-center gap-4 lg:gap-8">
          <Link href="/" className="flex items-center gap-2.5 group flex-shrink-0">
            <div className="h-10 w-10 md:h-12 md:w-12 rounded-full overflow-hidden border border-[#D89A86]/30 shadow-sm group-hover:scale-105 transition-transform bg-white">
              <img src="/images/pixello_logo.png" alt="Pixello Logo" className="h-full w-full object-cover" />
            </div>
            <div className="flex flex-col">
              <span className="font-serif-brand text-xl sm:text-2xl font-bold tracking-tight text-[#3A2B24]">
                Pixello
              </span>
              <span className="text-[10px] font-bold text-[#D89A86] tracking-widest uppercase -mt-1">
                Thoughtfully Yours
              </span>
            </div>
          </Link>

          <div className="hidden lg:flex items-center gap-6">
            <Link 
              href="/products" 
              className="text-sm font-semibold transition-colors hover:text-[#D89A86] text-[#6C5C54]"
            >
              All Products
            </Link>
            <Link 
              href="/products?category=Gifts" 
              className="text-sm font-semibold transition-colors hover:text-[#D89A86] text-[#6C5C54]"
            >
              Gifts
            </Link>
            <Link 
              href="/products?category=Frames" 
              className="text-sm font-semibold transition-colors hover:text-[#D89A86] text-[#6C5C54]"
            >
              Frames
            </Link>
            <Link 
              href="/products?category=Polaroids" 
              className="text-sm font-semibold transition-colors hover:text-[#D89A86] text-[#6C5C54]"
            >
              Polaroids
            </Link>
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-4 flex-1 justify-end max-w-2xl">
          {/* SEARCH BAR WITH INTELLIGENT AUTOCOMPLETE */}
          <div ref={searchContainerRef} className="relative flex-1 max-w-md hidden md:block">
            <div className="relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#6C5C54]/60" />
              <Input
                type="search"
                placeholder="Search frames, polaroids, gifts..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setIsSearchOpen(true);
                }}
                onFocus={() => setIsSearchOpen(true)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    handleExecuteSearch(searchQuery);
                  }
                }}
                className="w-full pl-10 pr-4 h-10 rounded-full bg-[#FFF8F2]/60 border-[#EFE6DD] focus:border-[#D89A86] focus:bg-white text-xs transition-all shadow-2xs"
              />
            </div>

            {/* FLOATING PREDICTIVE RESULTS DROPDOWN */}
            {isSearchOpen && searchQuery.trim().length > 0 && matchingSearchResults.length > 0 && (
              <div className="absolute top-12 left-0 right-0 z-50 bg-white/95 backdrop-blur-md border border-[#EFE6DD] rounded-2xl shadow-xl overflow-hidden animate-in fade-in slide-in-from-top-2 duration-150">
                <div className="p-2 border-b border-[#EFE6DD] bg-[#FFF8F2]/40 flex items-center justify-between px-3">
                  <span className="text-[11px] font-bold text-[#6C5C54] uppercase tracking-wider">Matching Products</span>
                  <span className="text-[10px] text-[#D89A86] font-medium">{matchingSearchResults.length} found</span>
                </div>
                <div className="max-h-72 overflow-y-auto divide-y divide-[#EFE6DD]/50">
                  {matchingSearchResults.map((prod) => (
                    <div
                      key={prod.id}
                      onClick={() => handleExecuteSearch(prod.name)}
                      className="p-2.5 hover:bg-[#FFF8F2] flex items-center gap-3 transition-colors cursor-pointer group"
                    >
                      <div className="h-10 w-10 rounded-lg overflow-hidden bg-[#F8F3EE] flex-shrink-0 border border-[#EFE6DD]">
                        <img src={prod.image} alt={prod.name} className="h-full w-full object-cover group-hover:scale-105 transition-transform" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-bold text-[#3A2B24] truncate group-hover:text-[#D89A86] transition-colors">{prod.name}</p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-[10px] bg-[#FFF8F2] text-[#6C5C54] px-1.5 py-0.2 rounded border border-[#EFE6DD] font-medium">{prod.category}</span>
                          <span className="text-xs font-bold text-[#D89A86]">₹{prod.price}</span>
                        </div>
                      </div>
                      <ArrowRight className="h-3.5 w-3.5 text-[#D89A86] opacity-0 group-hover:opacity-100 -translate-x-1 group-hover:translate-x-0 transition-all flex-shrink-0 mr-1" />
                    </div>
                  ))}
                </div>
                <div 
                  onClick={() => handleExecuteSearch(searchQuery)}
                  className="p-2.5 bg-[#FFF8F2] hover:bg-[#F2C8B5]/30 text-center border-t border-[#EFE6DD] cursor-pointer transition-colors"
                >
                  <span className="text-xs font-bold text-[#3A2B24] hover:underline flex items-center justify-center gap-1">
                    See all results for "{searchQuery}" <ArrowRight className="h-3 w-3 text-[#D89A86]" />
                  </span>
                </div>
              </div>
            )}
          </div>

          <div className="flex items-center gap-1.5 sm:gap-3 flex-shrink-0">
            {/* Customer Notifications Dropdown Bell */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  aria-label="Notifications" 
                  className="relative hover:bg-[#FFF8F2] text-[#3A2B24] rounded-full h-9 w-9 sm:h-10 sm:w-10 cursor-pointer"
                >
                  <Bell className="h-4 w-4 sm:h-5 sm:w-5 text-[#3A2B24]" />
                  {mounted && unreadCount > 0 && (
                    <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-[#D89A86] text-[10px] font-extrabold text-white shadow-xs animate-pulse">
                      {unreadCount}
                    </span>
                  )}
                </Button>
              </DropdownMenuTrigger>

              <DropdownMenuContent align="end" className="w-[94vw] sm:w-[680px] md:w-[740px] rounded-3xl border border-[#EFE6DD] p-0 shadow-2xl bg-[#FFFDFB] overflow-hidden z-50 animate-in fade-in-50 zoom-in-95 duration-200">
                <div className="flex flex-col sm:flex-row items-stretch">
                  {/* Left Landscape Control Panel */}
                  <div className="sm:w-56 bg-[#2E201A] text-white p-5 flex flex-col justify-between flex-shrink-0 border-b sm:border-b-0 sm:border-r border-[#443228]">
                    <div>
                      <div className="flex items-center gap-2.5 mb-3">
                        <div className="h-8 w-8 rounded-xl bg-white/10 flex items-center justify-center text-amber-300 border border-white/10 shadow-xs">
                          <Bell className="h-4.5 w-4.5" />
                        </div>
                        <h4 className="font-bold text-xs font-serif-brand tracking-wider uppercase text-[#EFE6DD]">Notifications</h4>
                      </div>
                      <p className="text-[11px] text-[#EFE6DD]/70 leading-snug mb-3">
                        Studio responses &amp; real-time order updates.
                      </p>
                      {unreadCount > 0 ? (
                        <div className="inline-flex items-center gap-1.5 bg-[#D89A86]/20 border border-[#D89A86]/40 text-[#F2C8B5] px-2.5 py-1 rounded-full text-[10px] font-extrabold mb-3">
                          <span className="h-1.5 w-1.5 rounded-full bg-amber-400 animate-pulse" />
                          <span>{unreadCount} Unread Updates</span>
                        </div>
                      ) : (
                        <span className="text-[10px] font-medium text-white/50 block mb-3">All caught up</span>
                      )}
                    </div>

                    <div className="flex flex-col gap-2 pt-3 border-t border-white/10">
                      {unreadCount > 0 && (
                        <button 
                          type="button"
                          onPointerDown={(e) => e.stopPropagation()}
                          onClick={handleMarkAllNotifsAsRead} 
                          className="text-[11px] bg-white/10 hover:bg-white/20 text-white font-semibold py-1.5 px-3 rounded-xl transition-colors cursor-pointer flex items-center justify-center gap-1.5 text-center"
                        >
                          <Check className="h-3.5 w-3.5 text-amber-300" />
                          <span>Mark all read</span>
                        </button>
                      )}
                      <div className="flex items-center justify-between gap-2">
                        {customerNotifications.length > 0 && (
                          <button 
                            type="button"
                            onPointerDown={(e) => e.stopPropagation()}
                            onClick={handleClearNotifs} 
                            className="text-[11px] text-white/60 hover:text-red-300 font-medium flex items-center gap-1 cursor-pointer transition-colors"
                          >
                            <Trash2 className="h-3 w-3" /> Clear
                          </button>
                        )}
                        <button 
                          type="button"
                          onPointerDown={(e) => e.stopPropagation()}
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            window.location.href = "/profile?tab=orders";
                          }}
                          className="text-[11px] font-bold text-amber-300 hover:text-amber-200 flex items-center gap-1 transition-colors ml-auto cursor-pointer"
                        >
                          <span>View Orders</span>
                          <ArrowRight className="h-3 w-3" />
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Right Horizontal Notifications Stream */}
                  <div className="flex-1 p-3.5 sm:p-4.5 bg-[#FAF6F0] flex flex-col gap-2.5 max-h-[340px] sm:max-h-[380px] overflow-y-auto">
                    {customerNotifications.length === 0 ? (
                      <div className="p-10 text-center text-xs text-[#6C5C54] bg-white rounded-2xl border border-[#EFE6DD] my-auto">
                        <Bell className="h-6 w-6 text-[#D89A86] mx-auto mb-2 opacity-60" />
                        <p className="font-bold text-[#3A2B24]">No Notifications</p>
                        <p className="text-[11px] text-[#6C5C54] mt-0.5">You have no unread studio updates.</p>
                      </div>
                    ) : (
                      customerNotifications.map((notif) => (
                        <div 
                          key={notif.id}
                          onPointerDown={(e) => e.stopPropagation()}
                          onClick={(e) => {
                            handleMarkNotifAsRead(notif.id, e);
                            if (notif.type === "reply" || notif.orderId) {
                              window.location.href = "/profile?tab=orders";
                            }
                          }}
                          className={`p-3 sm:p-3.5 rounded-2xl border transition-all cursor-pointer shadow-xs hover:shadow-md flex items-start gap-3 relative group overflow-hidden ${
                            !notif.read 
                              ? 'bg-white border-[#D89A86]/60 shadow-amber-900/5 ring-1 ring-[#D89A86]/20' 
                              : 'bg-white/95 border-[#EFE6DD] hover:border-[#D89A86]/40'
                          }`}
                        >
                          {/* Unread Indicator Bar */}
                          {!notif.read && (
                            <span className="absolute left-0 top-2 bottom-2 w-1 bg-[#D89A86] rounded-r-full" />
                          )}

                          {/* Left App Icon */}
                          <div className="h-10 w-10 rounded-xl bg-[#3A2B24] border border-[#4E3D35] flex items-center justify-center flex-shrink-0 shadow-2xs overflow-hidden mt-0.5">
                            <img src="/images/pixello_logo.png" alt="Pixello" className="h-7 w-7 rounded-full object-cover" />
                          </div>

                          {/* Horizontal Phone Notification Body */}
                          <div className="flex-1 min-w-0 pr-1">
                            {/* Top Row: App Name • Timestamp */}
                            <div className="flex items-center justify-between gap-1 mb-0.5">
                              <div className="flex items-center gap-1.5 min-w-0">
                                <span className="font-bold text-[11px] text-[#3A2B24] tracking-tight uppercase">Pixello</span>
                                <span className="text-[10px] text-[#6C5C54]">·</span>
                                <span className="text-[9px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200/60 px-1.5 py-0.2 rounded-md">Verified</span>
                              </div>
                              <span className="text-[10px] font-medium text-[#6C5C54] whitespace-nowrap">{notif.time}</span>
                            </div>

                            {/* Title */}
                            <h5 className="font-bold text-xs text-[#3A2B24] truncate">
                              {notif.type === "reply" ? "Pixello Studio Team" : notif.title}
                            </h5>

                            {/* Message Text */}
                            <p className="text-xs text-[#54433A] font-medium leading-snug line-clamp-2 mt-0.5">
                              {notif.type === "reply" ? `"${notif.adminReply || notif.desc}"` : notif.desc}
                            </p>

                            {/* Sub-tag Row */}
                            {notif.orderId && (
                              <div className="mt-1 flex items-center gap-2 text-[10px] text-[#6C5C54]">
                                <span className="font-semibold text-[#D89A86]">#{notif.orderId}</span>
                                {notif.productName && <span>· {notif.productName}</span>}
                              </div>
                            )}
                          </div>

                          {/* Right Action Arrow */}
                          <div className="flex flex-col items-center justify-center self-center text-[#6C5C54] group-hover:text-[#D89A86] transition-colors pl-1">
                            <ArrowRight className="h-3.5 w-3.5 opacity-60 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all" />
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </DropdownMenuContent>
            </DropdownMenu>

            <Link href="/profile?tab=wishlist">
              <Button variant="ghost" size="icon" aria-label="Wishlist" className="relative hover:bg-[#FFF8F2] text-[#3A2B24] rounded-full h-9 w-9 sm:h-10 sm:w-10">
                <Heart className="h-4 w-4 sm:h-5 sm:w-5 text-[#3A2B24] hover:text-[#F48A8A] transition-colors" />
                {mounted && wishlistCount > 0 && (
                  <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-[#F48A8A] text-[10px] font-bold text-white shadow-sm">
                    {wishlistCount}
                  </span>
                )}
              </Button>
            </Link>
            <Link href="/cart">
              <Button variant="ghost" size="icon" className="relative hover:bg-[#FFF8F2] text-[#3A2B24] rounded-full h-9 w-9 sm:h-10 sm:w-10" aria-label="Cart">
                <ShoppingCart className="h-4 w-4 sm:h-5 sm:w-5 text-[#3A2B24]" />
                {mounted && cartCount > 0 && (
                  <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-[#D89A86] text-[10px] font-bold text-white shadow-sm">
                    {cartCount}
                  </span>
                )}
              </Button>
            </Link>
            
            {mounted && currentUser ? (
              <div className="flex items-center gap-1.5">
                <Link 
                  href="/profile"
                  className="hover:bg-[#FFF8F2] text-[#3A2B24] rounded-full px-2.5 sm:px-3.5 py-1.5 flex items-center gap-1.5 border border-[#EFE6DD] bg-[#FFF8F2]/60 shadow-2xs h-9 sm:h-10 transition-colors cursor-pointer"
                >
                  <User className="h-4 w-4 text-[#D89A86]" />
                  <span className="text-xs font-bold truncate max-w-[80px] sm:max-w-[120px]">
                    {currentUser.name || "My Profile"}
                  </span>
                </Link>

                <button 
                  type="button"
                  className="text-red-600 hover:text-red-700 hover:bg-red-50 rounded-full text-xs font-bold flex items-center gap-1 border border-red-200 px-2.5 h-9 transition-colors cursor-pointer shadow-2xs"
                  onClick={handleSignOut}
                >
                  <LogOut className="h-3.5 w-3.5 text-red-600" />
                  <span className="hidden sm:inline">Sign Out</span>
                </button>
              </div>
            ) : (
              <Link
                href="/login"
                className="btn-pixello-primary text-xs px-3 sm:px-5 h-9 rounded-full font-bold flex items-center gap-1.5 shadow-xs cursor-pointer hover:opacity-95 transition-opacity"
              >
                <LogIn className="h-3.5 w-3.5" /> <span className="hidden sm:inline">Sign In</span>
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* CUSTOM SIGN OUT CONFIRMATION MODAL */}
      {showSignOutModal && (
        <div 
          className="fixed inset-0 top-0 left-0 w-screen h-screen z-[9999] bg-black/75 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in"
          onClick={() => setShowSignOutModal(false)}
        >
          <div 
            className="bg-white border border-[#EFE6DD] rounded-3xl p-6 max-w-sm w-full shadow-2xl relative text-center animate-in zoom-in-95 my-auto"
            onClick={e => e.stopPropagation()}
          >
            <div className="h-14 w-14 rounded-full bg-rose-50 border border-rose-100 flex items-center justify-center mx-auto mb-4">
              <LogOut className="h-7 w-7 text-rose-600" />
            </div>

            <h3 className="font-serif-brand text-xl font-bold text-[#3A2B24] mb-1">
              Sign Out of Pixello?
            </h3>
            <p className="text-xs text-[#6C5C54] mb-6 font-medium leading-relaxed">
              Are you sure you want to end your current session? You can sign back in anytime with your mobile number.
            </p>

            <div className="flex items-center gap-3">
              <Button 
                variant="outline" 
                className="flex-1 rounded-full border-[#EFE6DD] text-xs font-semibold text-[#3A2B24] hover:bg-[#FFF8F2] h-10"
                onClick={() => setShowSignOutModal(false)}
              >
                Cancel
              </Button>
              <Button 
                className="flex-1 rounded-full bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold h-10 shadow-xs cursor-pointer"
                onClick={handleSignOut}
              >
                Yes, Sign Out
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* LIVE SMARTPHONE PUSH NOTIFICATION (TOP-CENTER HORIZONTAL PHONE BANNER) */}
      {mounted && liveReplyPopOver && typeof document !== "undefined" && createPortal(
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[999999] w-[92vw] sm:w-[460px] max-w-[500px] bg-[#2E201A]/95 text-white backdrop-blur-2xl border border-white/15 rounded-[24px] shadow-[0_20px_50px_rgba(0,0,0,0.35)] p-3.5 sm:p-4 animate-in slide-in-from-top-6 duration-300 pointer-events-auto flex items-start gap-3.5 group">
          {/* App Icon */}
          <div className="h-10 w-10 rounded-2xl bg-white/10 border border-white/15 flex items-center justify-center flex-shrink-0 shadow-sm mt-0.5 overflow-hidden">
            <img src="/images/pixello_logo.png" alt="Pixello" className="h-7 w-7 rounded-full object-cover" />
          </div>

          {/* Middle Content */}
          <div className="flex-1 min-w-0 pr-1">
            {/* App Title & Time */}
            <div className="flex items-center justify-between gap-1 mb-0.5">
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-[11px] tracking-wide uppercase text-amber-300">Pixello Store</span>
                <span className="text-[10px] text-white/50">·</span>
                <span className="text-[10px] text-white/70">Just now</span>
              </div>
              <button 
                onClick={() => setLiveReplyPopOver(null)}
                className="h-6 w-6 rounded-full bg-white/10 hover:bg-white/20 text-white/70 hover:text-white flex items-center justify-center text-xs font-bold transition-colors cursor-pointer"
                title="Dismiss"
              >
                ✕
              </button>
            </div>

            {/* Notification Title */}
            <h4 className="font-bold text-xs text-white leading-tight">
              Official Studio Response {liveReplyPopOver.orderId ? `• #${liveReplyPopOver.orderId}` : ""}
            </h4>

            {/* Notification Body Text */}
            <p className="text-xs text-white/90 leading-snug line-clamp-2 mt-1 italic">
              “{liveReplyPopOver.adminReply || liveReplyPopOver.desc}”
            </p>

            {/* Action Buttons */}
            <div className="flex items-center gap-2 mt-2.5 pt-2 border-t border-white/10">
              <button
                type="button"
                onClick={() => {
                  handleMarkAllNotifsAsRead();
                  setLiveReplyPopOver(null);
                  window.location.href = "/profile?tab=orders";
                }}
                className="bg-amber-400 hover:bg-amber-300 text-[#2E201A] font-bold text-[11px] px-3.5 py-1 rounded-full transition-all flex items-center gap-1 cursor-pointer shadow-xs"
              >
                <span>View Order</span>
                <ArrowRight className="h-3 w-3" />
              </button>
              <button
                type="button"
                onClick={() => {
                  handleMarkAllNotifsAsRead();
                  setLiveReplyPopOver(null);
                }}
                className="text-white/70 hover:text-white text-[11px] font-semibold px-2 py-1 transition-colors cursor-pointer"
              >
                Mark as Read
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </nav>
  );
}
