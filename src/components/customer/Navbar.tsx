"use client";

import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { 
  Search, 
  ShoppingCart, 
  Heart, 
  User, 
  Menu, 
  Sparkles, 
  LogIn, 
  LogOut, 
  X, 
  Camera, 
  ArrowRight, 
  Gift 
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useCart } from "@/context/CartContext";
import { useWishlist } from "@/context/WishlistContext";
import { useHamper } from "@/context/HamperContext";
import { useProducts } from "@/context/ProductContext";
import { getHamperConfig, DEFAULT_HAMPER_CONFIG, HamperStoreConfig } from "@/lib/hamperConfig";
import { getSearchableText, isFuzzyMatch } from "@/lib/catalogSearch";
import { useRouter } from "next/navigation";
import { usePixelloTransition } from "@/components/customer/PixelloPageTransition";
import { 
  useMobileNotifications, 
  MobileNotificationToast, 
  CompactNotificationCenter 
} from "@/components/common/MobileNotificationSystem";
import VisualSearchModal from "@/components/customer/VisualSearchModal";

const FALLBACK_SEARCH_PRODUCTS = [
  { id: "PRD-01", name: "Premium Wooden Frame", category: "Frames", price: 149, image: "/images/wooden_frame_main.png" },
  { id: "PRD-02", name: "Classic Custom Polaroid Set (24 prints)", category: "Polaroids", price: 399, image: "/images/polaroid_set.png" },
  { id: "PRD-03", name: "Custom Magic Photo Mug", category: "Gifts", price: 349, image: "/images/custom_mug.png" },
  { id: "PRD-04", name: "LED Acrylic Photo Lamp", category: "LED", price: 1299, image: "/images/led_acrylic_lamp.png" },
  { id: "PRD-05", name: "Spotify Acrylic Music Plaque", category: "Gifts", price: 799, image: "/images/wooden_frame_angle.png" },
  { id: "PRD-07", name: "Collage Wall Photo Frame Set", category: "Frames", price: 1499, image: "/images/wooden_frame_wall.png" },
];

export default function Navbar() {
  const router = useRouter();
  const { startTransitionTo } = usePixelloTransition();
  const { cartCount } = useCart();
  const { wishlistCount } = useWishlist();
  const { itemCount: hamperItemCount } = useHamper();
  const { products } = useProducts();
  const [showSignOutModal, setShowSignOutModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isVisualSearchOpen, setIsVisualSearchOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const searchContainerRef = useRef<HTMLDivElement>(null);

  const activeCatalog = products && products.length > 0 ? products : FALLBACK_SEARCH_PRODUCTS;

  const [currentUser, setCurrentUser] = useState<any>(null);
  const [hamperConfig, setHamperConfig] = useState<HamperStoreConfig>(DEFAULT_HAMPER_CONFIG);

  // Real Database Notifications System for Customer Portal
  const {
    notifications: dbNotifications,
    unreadCount,
    activeToast,
    dismissToast,
    markAsRead,
    markAllAsRead,
    clearAll,
    deleteNotification,
  } = useMobileNotifications("CUSTOMER", currentUser?.id);

  useEffect(() => {
    setMounted(true);
    setHamperConfig(getHamperConfig());

    fetch("/api/settings/hamper")
      .then((r) => r.json())
      .then((d) => {
        if (d.success && d.config) setHamperConfig(d.config);
      })
      .catch(() => {});

    const handleHamperConfigUpdate = () => {
      setHamperConfig(getHamperConfig());
    };

    const handleOpenVisualSearch = () => {
      setIsVisualSearchOpen(true);
    };

    window.addEventListener("open_visual_search", handleOpenVisualSearch);
    window.addEventListener("open_pixello_visual_search", handleOpenVisualSearch);
    window.addEventListener("pixello_hamper_config_updated", handleHamperConfigUpdate);
    window.addEventListener("storage", handleHamperConfigUpdate);
    return () => {
      window.removeEventListener("open_visual_search", handleOpenVisualSearch);
      window.removeEventListener("open_pixello_visual_search", handleOpenVisualSearch);
      window.removeEventListener("pixello_hamper_config_updated", handleHamperConfigUpdate);
      window.removeEventListener("storage", handleHamperConfigUpdate);
    };
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
    ? activeCatalog.filter(p => isFuzzyMatch(getSearchableText(p), searchQuery)).slice(0, 8)
    : [];

  const handleExecuteSearch = (queryVal: string) => {
    if (!queryVal.trim()) return;
    setIsSearchOpen(false);
    setIsMobileMenuOpen(false);
    const targetUrl = `/products?search=${encodeURIComponent(queryVal.trim())}`;
    router.push(targetUrl);
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
      <div className="w-full max-w-[1536px] mx-auto flex h-20 items-center justify-between px-3 sm:px-4 md:px-6 gap-2 sm:gap-3">
        {/* LEFT BRAND & NAVIGATION LINKS */}
        <div className="flex items-center gap-2 sm:gap-4 lg:gap-5 xl:gap-7 shrink-0 min-w-0">
          {/* MOBILE HAMBURGER MENU BUTTON (VISIBLE ON < LG) */}
          <button
            type="button"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="lg:hidden p-2 rounded-xl text-[#3A2B24] hover:bg-[#FFF8F2] transition-colors border border-[#EFE6DD] flex items-center justify-center shrink-0 cursor-pointer"
            aria-label="Open Navigation Menu"
          >
            {isMobileMenuOpen ? <X className="h-5 w-5 text-[#D89A86]" /> : <Menu className="h-5 w-5 text-[#3A2B24]" />}
          </button>

          <Link href="/" className="flex items-center gap-2 group shrink-0">
            <div className="h-9 w-9 sm:h-10 sm:w-10 md:h-11 md:w-11 rounded-full overflow-hidden border border-[#D89A86]/30 shadow-sm group-hover:scale-105 transition-transform bg-white shrink-0">
              <img src="/images/pixello_logo.png" alt="Pixello Logo" className="h-full w-full object-cover" />
            </div>
            <div className="flex flex-col shrink-0">
              <span className="font-serif-brand text-base sm:text-lg md:text-xl font-bold tracking-tight text-[#3A2B24] leading-tight">
                Pixello
              </span>
              <span className="hidden xs:block text-[9px] sm:text-[10px] font-bold text-[#D89A86] tracking-widest uppercase">
                Thoughtfully Yours
              </span>
            </div>
          </Link>

          {/* DESKTOP NAV LINKS WITH GUARANTEED SHRINK-0 & NO-WRAP */}
          <div className="hidden lg:flex items-center gap-2.5 xl:gap-4.5 shrink-0">
            <Link 
              href="/products" 
              className="text-xs xl:text-sm font-semibold transition-colors hover:text-[#D89A86] text-[#6C5C54] shrink-0 whitespace-nowrap px-1"
            >
              All Products
            </Link>
            {hamperConfig.nav.enabled && (
              <Link 
                href={hamperConfig.nav.url || "/hamper"} 
                className="text-xs xl:text-sm font-bold transition-all hover:text-[#D89A86] text-[#3A2B24] flex items-center gap-1.5 px-2.5 py-1 xl:px-3 xl:py-1.5 rounded-full bg-[#FFF8F2] border border-[#D89A86]/30 shadow-2xs hover:shadow-xs group shrink-0 whitespace-nowrap"
              >
                <Gift className="h-3.5 w-3.5 text-[#D89A86] group-hover:scale-110 transition-transform" />
                <span>{hamperConfig.nav.label || "Build a Hamper"}</span>
                {hamperConfig.nav.showBadge && (
                  <span className="text-[9px] font-extrabold bg-[#D89A86] text-white px-1.5 py-0.5 rounded-full uppercase tracking-wider">
                    {mounted && hamperItemCount > 0 ? `${hamperItemCount}` : (hamperConfig.nav.badgeText || 'New')}
                  </span>
                )}
              </Link>
            )}
            <Link 
              href="/products?category=Gifts" 
              className="text-xs xl:text-sm font-semibold transition-colors hover:text-[#D89A86] text-[#6C5C54] shrink-0 whitespace-nowrap px-1"
            >
              Gifts
            </Link>
            <Link 
              href="/frames" 
              className="text-xs xl:text-sm font-semibold transition-colors hover:text-[#D89A86] text-[#6C5C54] shrink-0 whitespace-nowrap px-1"
            >
              Frames
            </Link>
            <Link 
              href="/products?category=Polaroids" 
              className="text-xs xl:text-sm font-semibold transition-colors hover:text-[#D89A86] text-[#6C5C54] shrink-0 whitespace-nowrap px-1"
            >
              Polaroids
            </Link>
          </div>
        </div>

        {/* RIGHT ACTION BAR: SEARCH + NOTIFICATIONS + CART + PROFILE */}
        <div className="flex items-center gap-1.5 sm:gap-2.5 xl:gap-3 shrink-0 ml-auto justify-end">
          {/* SEARCH BAR WITH RESPONSIVE SCALING */}
          <div ref={searchContainerRef} className="relative hidden md:block w-28 sm:w-36 lg:w-40 xl:w-56 2xl:w-64 shrink min-w-0">
            <div className="relative flex items-center">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[#6C5C54]/60" />
              <Input
                type="search"
                placeholder="Search catalog..."
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
                className="w-full pl-8 pr-3 h-9 sm:h-10 rounded-full bg-[#FFF8F2]/60 border-[#EFE6DD] focus:border-[#D89A86] focus:bg-white text-xs transition-all shadow-2xs"
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
                      onClick={() => {
                        setIsSearchOpen(false);
                        router.push(`/product/${prod.id}`);
                      }}
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

          {/* DEDICATED STANDALONE VISUAL SEARCH BUTTON WITH CAMERA */}
          <button
            type="button"
            onClick={() => setIsVisualSearchOpen(true)}
            className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-full bg-[#FFF8F2] hover:bg-[#FCEEE5] border border-[#D89A86] text-[#3A2B24] hover:text-[#D89A86] transition-all text-xs font-bold shadow-2xs group cursor-pointer shrink-0 active:scale-95"
            title="Search products by uploading an image or using camera"
          >
            <div className="h-5 w-5 sm:h-6 sm:w-6 rounded-full bg-[#D89A86] text-white flex items-center justify-center group-hover:scale-110 transition-transform shadow-2xs shrink-0">
              <Camera className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
            </div>
            <span className="whitespace-nowrap font-bold text-[11px] sm:text-xs">Search by Image</span>
          </button>

          <div className="flex items-center gap-1 sm:gap-2.5 flex-shrink-0">
            {/* Real Database Connected Compact Notification Center */}
            <CompactNotificationCenter
              role="CUSTOMER"
              notifications={dbNotifications}
              unreadCount={unreadCount}
              onMarkRead={markAsRead}
              onMarkAllRead={markAllAsRead}
              onClearAll={clearAll}
              onDeleteSingle={deleteNotification}
              onNavigateOrder={(orderId) => {
                if (orderId) {
                  router.push(`/profile?tab=orders&highlight=${encodeURIComponent(orderId)}`);
                } else {
                  router.push("/profile?tab=orders");
                }
              }}
            />

            <Link 
              href="/profile?tab=wishlist"
              aria-label="Wishlist" 
              className="relative hover:bg-[#FFF8F2] text-[#3A2B24] rounded-full h-9 w-9 sm:h-10 sm:w-10 flex items-center justify-center transition-colors cursor-pointer"
            >
              <Heart className="h-4 w-4 sm:h-5 sm:w-5 text-[#3A2B24] hover:text-[#F48A8A] transition-colors" />
              {mounted && wishlistCount > 0 && (
                <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-[#F48A8A] text-[10px] font-bold text-white shadow-sm">
                  {wishlistCount}
                </span>
              )}
            </Link>
            <Link 
              href="/cart"
              aria-label="Cart" 
              className="relative hover:bg-[#FFF8F2] text-[#3A2B24] rounded-full h-9 w-9 sm:h-10 sm:w-10 flex items-center justify-center transition-colors cursor-pointer"
            >
              <ShoppingCart className="h-4 w-4 sm:h-5 sm:w-5 text-[#3A2B24]" />
              {mounted && cartCount > 0 && (
                <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-[#D89A86] text-[10px] font-bold text-white shadow-sm">
                  {cartCount}
                </span>
              )}
            </Link>
            
            {/* User Profile / Sign In Pill */}
            {mounted && currentUser ? (
              <Link 
                href="/profile"
                className="hover:bg-[#FFF8F2] text-[#3A2B24] rounded-full px-3 py-1.5 flex items-center gap-1.5 border border-[#EFE6DD] bg-[#FFF8F2]/60 shadow-2xs h-9 sm:h-10 transition-colors cursor-pointer shrink-0"
              >
                <User className="h-4 w-4 text-[#D89A86]" />
                <span className="text-xs font-bold truncate max-w-[70px] sm:max-w-[110px]">
                  {currentUser.name || "My Profile"}
                </span>
              </Link>
            ) : (
              <Link
                href="/login"
                className="flex btn-pixello-primary text-xs px-3 sm:px-4 h-9 rounded-full font-bold items-center gap-1.5 shadow-xs cursor-pointer hover:opacity-95 transition-opacity shrink-0"
              >
                <LogIn className="h-3.5 w-3.5" /> <span>Sign In</span>
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* MOBILE NAVIGATION DRAWER & BACKDROP (SLIDES DOWN ON < LG) */}
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 top-20 z-40 bg-black/50 backdrop-blur-xs lg:hidden animate-in fade-in duration-150"
          onClick={() => setIsMobileMenuOpen(false)}
        >
          <div
            className="w-full max-w-md bg-white border-b border-[#EFE6DD] shadow-2xl p-5 flex flex-col gap-4 animate-in slide-in-from-top-2 duration-200 max-h-[calc(100vh-80px)] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Mobile Search Input */}
            <div className="relative flex items-center">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#6C5C54]/60" />
              <Input
                type="search"
                placeholder="Search catalog (frames, polaroids)..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    handleExecuteSearch(searchQuery);
                    setIsMobileMenuOpen(false);
                  }
                }}
                className="w-full pl-10 pr-3 h-11 rounded-2xl bg-[#FFF8F2]/60 border-[#EFE6DD] text-xs font-medium"
              />
            </div>

            {/* Mobile Navigation Links */}
            <div className="flex flex-col divide-y divide-[#EFE6DD]/50">
              <Link
                href="/products"
                onClick={() => setIsMobileMenuOpen(false)}
                className="py-3 text-sm font-bold text-[#3A2B24] hover:text-[#D89A86] flex items-center justify-between"
              >
                <span>All Products</span>
                <ArrowRight className="h-4 w-4 text-[#D89A86]" />
              </Link>
              {hamperConfig.nav.enabled && (
                <Link
                  href={hamperConfig.nav.url || "/hamper"}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="py-3 text-sm font-bold text-[#D89A86] flex items-center justify-between"
                >
                  <span className="flex items-center gap-2">
                    <Gift className="h-4 w-4 text-[#D89A86]" />
                    {hamperConfig.nav.label || "Build a Hamper"}
                  </span>
                  <span className="text-[10px] bg-[#D89A86] text-white px-2 py-0.5 rounded-full font-extrabold uppercase">
                    {mounted && hamperItemCount > 0 ? `${hamperItemCount}` : (hamperConfig.nav.badgeText || 'New')}
                  </span>
                </Link>
              )}
              <Link
                href="/frames"
                onClick={() => setIsMobileMenuOpen(false)}
                className="py-3 text-sm font-bold text-[#3A2B24] hover:text-[#D89A86] flex items-center justify-between"
              >
                <span>Visual Memory Frames Studio</span>
                <ArrowRight className="h-4 w-4 text-[#D89A86]" />
              </Link>
              <Link
                href="/products?category=Polaroids"
                onClick={() => setIsMobileMenuOpen(false)}
                className="py-3 text-sm font-bold text-[#3A2B24] hover:text-[#D89A86] flex items-center justify-between"
              >
                <span>Polaroid Prints</span>
                <ArrowRight className="h-4 w-4 text-[#D89A86]" />
              </Link>
              <Link
                href="/products?category=Gifts"
                onClick={() => setIsMobileMenuOpen(false)}
                className="py-3 text-sm font-bold text-[#3A2B24] hover:text-[#D89A86] flex items-center justify-between"
              >
                <span>Gifts &amp; Keepsakes</span>
                <ArrowRight className="h-4 w-4 text-[#D89A86]" />
              </Link>
              <Link
                href="#campus-ambassador"
                onClick={() => setIsMobileMenuOpen(false)}
                className="py-3 text-sm font-bold text-[#6C5C54] hover:text-[#D89A86] flex items-center justify-between"
              >
                <span>Campus Ambassador Program</span>
                <ArrowRight className="h-4 w-4 text-[#D89A86]" />
              </Link>
            </div>
          </div>
        </div>
      )}

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
          router.push("/profile?tab=orders");
        }}
      />

      {/* AI VISUAL SEARCH MODAL - MOUNTED DIRECTLY TO BODY VIA PORTAL */}
      {mounted && typeof document !== "undefined" && createPortal(
        <VisualSearchModal
          isOpen={isVisualSearchOpen}
          onClose={() => setIsVisualSearchOpen(false)}
        />,
        document.body
      )}
    </nav>
  );
}
