"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { Search, ShoppingCart, Heart, User, Menu, Sparkles, LogIn, LogOut, X, Phone, Camera } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useCart } from "@/context/CartContext";
import { useWishlist } from "@/context/WishlistContext";
import { useRouter } from "next/navigation";
import { usePixelloTransition } from "@/components/customer/PixelloPageTransition";
import { motion } from "framer-motion";

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
    const syncUserSession = () => {
      if (typeof window !== "undefined") {
        const isLoggedOut = localStorage.getItem("pixello_logged_out") === "true";
        if (isLoggedOut) {
          setCurrentUser(null);
          return;
        }
        const savedUser = localStorage.getItem("pixello_user");
        if (savedUser) {
          try {
            const parsed = JSON.parse(savedUser);
            if (parsed && parsed.isLoggedIn !== false && parsed.name) {
              setCurrentUser(parsed);
            } else {
              setCurrentUser(null);
            }
          } catch (e) {
            setCurrentUser(null);
          }
        } else {
          setCurrentUser(null);
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

  return (
    <nav className="sticky top-0 z-50 w-full border-b border-[#EFE6DD] bg-white/95 backdrop-blur-md shadow-xs">
      <div className="container mx-auto flex h-20 items-center justify-between px-4 md:px-6 gap-3">
        <div className="flex items-center gap-4 lg:gap-8">
          <Link href="/" className="flex items-center gap-2.5 group flex-shrink-0">
            <div className="h-10 w-10 md:h-12 md:w-12 rounded-full overflow-hidden border border-[#D89A86]/30 shadow-sm group-hover:scale-105 transition-transform bg-white">
              <img src="/images/pixello_logo.png" alt="Pixello Logo" className="h-full w-full object-cover" />
            </div>
            <div className="flex flex-col">
              <span className="font-serif-brand text-xl md:text-2xl font-bold tracking-tight text-[#3A2B24]">
                Pixello
              </span>
              <span className="text-[9px] md:text-[10px] font-medium tracking-widest text-[#D89A86] uppercase -mt-1">
                Thoughtfully Yours
              </span>
            </div>
          </Link>

          <div className="hidden lg:flex gap-6 text-sm font-medium">
            <Link href="/products" className="transition-colors text-[#3A2B24] hover:text-[#D89A86]">
              All Products
            </Link>
            <Link href="/products?category=Gifts" className="transition-colors text-[#3A2B24] hover:text-[#D89A86]">
              Gifts
            </Link>
            <Link href="/products?category=Frames" className="transition-colors text-[#3A2B24] hover:text-[#D89A86]">
              Frames
            </Link>
            <Link href="/products?category=Polaroids" className="transition-colors text-[#3A2B24] hover:text-[#D89A86]">
              Polaroids
            </Link>
          </div>
        </div>

        <div className="flex flex-1 items-center justify-end gap-2 sm:gap-4">
          {/* Header Live Search Bar with Dropdown Popover (Visible on Mobile & Desktop) */}
          <div ref={searchContainerRef} className="relative flex-1 max-w-[200px] sm:max-w-xs md:max-w-sm">
            <form 
              onSubmit={(e) => {
                e.preventDefault();
                handleExecuteSearch(searchQuery);
              }} 
              className="relative flex items-center"
            >
              <Search className="absolute left-3.5 top-3 h-4 w-4 text-[#6C5C54] z-10" />
              <Input
                type="text"
                value={searchQuery}
                onFocus={() => setIsSearchOpen(true)}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setIsSearchOpen(true);
                }}
                placeholder="Search frames, polaroids, gifts..."
                className="w-full rounded-full bg-[#FFF8F2] border-[#EFE6DD] pl-10 pr-8 focus-visible:ring-[#D89A86] text-xs sm:text-sm text-[#3A2B24] h-10"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery("");
                    setIsSearchOpen(false);
                  }}
                  className="absolute right-3 text-[#6C5C54] hover:text-[#3A2B24] z-10"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </form>

            {/* LIVE SEARCH DROPDOWN POPOVER */}
            {isSearchOpen && searchQuery.trim().length > 0 && (
              <div 
                className="absolute top-full left-0 right-0 mt-2 bg-white border border-[#EFE6DD] rounded-2xl shadow-2xl z-50 overflow-hidden text-left animate-in fade-in"
              >
                {matchingSearchResults.length > 0 ? (
                  <div className="p-2 flex flex-col gap-1 max-h-80 overflow-y-auto">
                    <div className="px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider text-[#6C5C54] bg-[#FFF8F2] rounded-xl flex justify-between items-center">
                      <span>Matching Items ({matchingSearchResults.length})</span>
                      <span className="text-[10px] text-[#D89A86] font-semibold">Press Enter ↵</span>
                    </div>

                    {matchingSearchResults.map((item) => (
                      <Link 
                        key={item.id}
                        href={`/product/${item.id}`}
                        onClick={() => {
                          setIsSearchOpen(false);
                          setSearchQuery("");
                        }}
                        className="flex items-center gap-3 p-2 hover:bg-[#FFF8F2] rounded-xl transition-colors group cursor-pointer"
                      >
                        <div className="h-10 w-10 rounded-lg overflow-hidden bg-[#F8F3EE] border border-[#EFE6DD] flex-shrink-0">
                          <img src={item.image} alt={item.name} className="h-full w-full object-cover group-hover:scale-105 transition-transform" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-bold text-[#3A2B24] truncate group-hover:text-[#D89A86] transition-colors">{item.name}</p>
                          <span className="text-[10px] text-[#6C5C54] font-medium">{item.category}</span>
                        </div>
                        <span className="text-xs font-bold text-[#D89A86] flex-shrink-0">₹{item.price}</span>
                      </Link>
                    ))}

                    <button
                      onClick={() => handleExecuteSearch(searchQuery)}
                      className="w-full text-center py-2 text-xs font-bold text-[#D89A86] hover:bg-[#FFF8F2] rounded-xl transition-colors border-t border-[#EFE6DD] mt-1 cursor-pointer"
                    >
                      View all results for "{searchQuery}" →
                    </button>
                  </div>
                ) : (
                  <div className="p-5 text-center flex flex-col items-center justify-center">
                    <Search className="h-6 w-6 text-[#D89A86] mb-2" />
                    <p className="font-bold text-xs text-[#3A2B24] mb-1">Item is not found</p>
                    <p className="text-[11px] text-[#6C5C54]">No store products matching "{searchQuery}"</p>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="flex items-center gap-1.5 sm:gap-3 flex-shrink-0">
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
                  onClick={() => setShowSignOutModal(true)}
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
                onClick={async () => {
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
                    window.dispatchEvent(new Event("auth_change"));
                    window.dispatchEvent(new Event("storage"));
                  }
                  setCurrentUser(null);
                  setShowSignOutModal(false);
                  startTransitionTo("/login", "signing-out", "EXITING PIXELLO...");
                }}
              >
                Yes, Sign Out
              </Button>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}
