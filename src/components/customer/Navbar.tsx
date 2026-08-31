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
import { 
  useMobileNotifications, 
  MobileNotificationToast, 
  CompactNotificationCenter 
} from "@/components/common/MobileNotificationSystem";

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

  const [currentUser, setCurrentUser] = useState<any>(null);

  // Real Database Notifications System for Customer Portal
  const {
    notifications: dbNotifications,
    unreadCount,
    activeToast,
    dismissToast,
    markAsRead,
    markAllAsRead,
    clearAll,
  } = useMobileNotifications("CUSTOMER", currentUser?.id);

  useEffect(() => {
    setMounted(true);
  }, []);

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
            {/* Real Database Connected Compact Notification Center */}
            <CompactNotificationCenter
              role="CUSTOMER"
              notifications={dbNotifications}
              unreadCount={unreadCount}
              onMarkRead={markAsRead}
              onMarkAllRead={markAllAsRead}
              onClearAll={clearAll}
              onNavigateOrder={() => {
                window.location.href = "/profile?tab=orders";
              }}
            />

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

      {/* MOBILE-STYLE ONE-LINE FLOATING POPUP TOAST */}
      <MobileNotificationToast
        toast={activeToast}
        onDismiss={dismissToast}
        onClick={(toast) => {
          markAsRead(toast.id);
          dismissToast();
          window.location.href = "/profile?tab=orders";
        }}
      />
    </nav>
  );
}
