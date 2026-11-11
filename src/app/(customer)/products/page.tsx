"use client";

import React, { useState, useMemo, useEffect, Suspense } from "react";
import Link from "next/link";
import { Filter, Star, ShoppingCart, Heart, Search, RefreshCw, ArrowUpDown, LayoutGrid, Sparkles, Camera, Eye, ArrowRight, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { useSearchParams } from "next/navigation";
import { useWishlist } from "@/context/WishlistContext";
import { useProducts } from "@/context/ProductContext";
import { BorderTrail } from "@/components/core/border-trail";
import { BorderTrailCard2 } from "@/components/core/border-trail-card-2";
import { getSpotlightConfig, FeaturedSpotlightConfig } from "@/lib/spotlightConfig";
import { DisclosureCard } from "@/components/DisclosureCard";
import { getSearchableText, isFuzzyMatch } from "@/lib/catalogSearch";

function getProductTypeMeta(product: {
  category: string;
  name: string;
  badge?: string;
  price: number;
  originalPrice?: number;
}) {
  const cat = (product.category || "").toLowerCase();
  const name = (product.name || "").toLowerCase();

  if (cat.includes("frame") || name.includes("frame")) {
    return {
      typeCategory: "Custom Framing",
      typeLabel: "Solid Wood Frame Model",
      accentBorder: "hover:border-[#5A3A28]/50 hover:shadow-amber-900/10",
      accentBg: "bg-gradient-to-b from-[#FFFDFB] to-[#FBF7F2]",
      badgeBg: "bg-[#3A2B24] text-white",
      specs: ["Table & Wall Mount", "3 Frame Colors", "Matte / Glossy Finish"],
      buttonText: "Customize Frame",
      unit: "",
      highlightPill: "🖼️ Handcrafted Pine Wood",
      priceLabel: "Price"
    };
  }

  if (cat.includes("polaroid") || name.includes("polaroid")) {
    return {
      typeCategory: "Aesthetic Prints",
      typeLabel: "Retro 300 GSM Fuji Pack",
      accentBorder: "hover:border-amber-600/50 hover:shadow-orange-950/10",
      accentBg: "bg-gradient-to-b from-[#FFFFFF] to-[#FFF9F2]",
      badgeBg: "bg-gradient-to-r from-amber-700 to-orange-700 text-white",
      specs: ["300 GSM Fuji Paper", "Packs of 10-50", "Smudge-Proof UV"],
      buttonText: "Design Polaroid Pack",
      unit: "/ print",
      highlightPill: "📸 Retro Aesthetic Prints",
      priceLabel: "Starting at"
    };
  }

  if (cat.includes("mug") || name.includes("mug")) {
    return {
      typeCategory: "Magic Drinkware",
      typeLabel: "Heat-Activated Ceramic",
      accentBorder: "hover:border-purple-600/50 hover:shadow-purple-950/10",
      accentBg: "bg-gradient-to-b from-[#FFFFFF] to-[#FAF5FF]",
      badgeBg: "bg-gradient-to-r from-purple-800 to-indigo-900 text-white",
      specs: ["330ml Ceramic", "Heat Color Reveal", "Microwave Safe"],
      buttonText: "Personalize Mug",
      unit: "",
      highlightPill: "✨ Magic Heat Reveal",
      priceLabel: "Price"
    };
  }

  if (cat.includes("led") || name.includes("lamp") || name.includes("panda")) {
    return {
      typeCategory: "Ambient Lighting",
      typeLabel: "Laser Acrylic LED Light",
      accentBorder: "hover:border-yellow-600/50 hover:shadow-yellow-950/10",
      accentBg: "bg-gradient-to-b from-[#FFFFFF] to-[#FFFDF0]",
      badgeBg: "bg-gradient-to-r from-amber-600 to-yellow-600 text-white",
      specs: ["Warm & RGB Modes", "Solid Teak Base", "USB Powered"],
      buttonText: "Customize Lamp",
      unit: "",
      highlightPill: "💡 Warm LED Glow",
      priceLabel: "Price"
    };
  }

  if (name.includes("spotify") || name.includes("plaque")) {
    return {
      typeCategory: "Music Keepsake",
      typeLabel: "Scannable Music Plaque",
      accentBorder: "hover:border-emerald-600/50 hover:shadow-emerald-950/10",
      accentBg: "bg-gradient-to-b from-[#FFFFFF] to-[#F0FDF4]",
      badgeBg: "bg-gradient-to-r from-emerald-800 to-teal-900 text-white",
      specs: ["Scannable Spotify Code", "HD Acrylic Panel", "Wooden Base"],
      buttonText: "Create Plaque",
      unit: "",
      highlightPill: "🎵 Scannable Code",
      priceLabel: "Price"
    };
  }

  if (name.includes("paper weight") || name.includes("crystal")) {
    return {
      typeCategory: "Luxury Keepsake",
      typeLabel: "Crystal Resin Keepsake",
      accentBorder: "hover:border-sky-600/50 hover:shadow-sky-950/10",
      accentBg: "bg-gradient-to-b from-[#FFFFFF] to-[#F0F9FF]",
      badgeBg: "bg-gradient-to-r from-sky-800 to-blue-900 text-white",
      specs: ["Crystal Clear Resin", "Ambient Warm Glow", "Gift Box Wrap"],
      buttonText: "Customize Keepsake",
      unit: "",
      highlightPill: "💎 Crystal Figurine",
      priceLabel: "Price"
    };
  }

  if (name.includes("key chain") || name.includes("keychain") || cat.includes("key chain") || cat.includes("keychain")) {
    return {
      typeCategory: "Pocket Keepsake",
      typeLabel: "Double-Sided HD Keychain",
      accentBorder: "hover:border-pink-600/50 hover:shadow-pink-950/10",
      accentBg: "bg-gradient-to-b from-[#FFFFFF] to-[#FFF5F7]",
      badgeBg: "bg-gradient-to-r from-pink-700 to-rose-700 text-white",
      specs: ["Double-Sided HD", "Scratch-Proof Acrylic", "Stainless Keyring"],
      buttonText: "Personalize Keychain",
      unit: "",
      highlightPill: "🔑 Double-Sided HD",
      priceLabel: "Price"
    };
  }

  return {
    typeCategory: product.category || "Custom Gift",
    typeLabel: "Personalized Handcrafted Gift",
    accentBorder: "hover:border-[#D89A86]/50 hover:shadow-stone-900/10",
    accentBg: "bg-white",
    badgeBg: "bg-[#3A2B24] text-white",
    specs: ["Premium Craftsmanship", "Premium Quality", "Custom Photo Print"],
    buttonText: "Customize",
    unit: "",
    highlightPill: "✨ Master Crafted",
    priceLabel: "Price"
  };
}

function ProductsContent() {
  const searchParams = useSearchParams();
  const { toggleWishlist, isInWishlist } = useWishlist();
  const { products } = useProducts();

  const initialCategoryParam = searchParams.get("category");
  const initialSearchParam = searchParams.get("search");

  // Dynamic Categories from Products Context
  const dynamicCategories = useMemo(() => {
    const catsSet = new Set<string>(["All"]);
    products.forEach((p) => {
      if (p.category) catsSet.add(p.category);
    });
    return Array.from(catsSet);
  }, [products]);

  const [selectedCategory, setSelectedCategory] = useState<string>(
    initialCategoryParam && dynamicCategories.includes(initialCategoryParam) ? initialCategoryParam : "All"
  );
  const [selectedPriceRange, setSelectedPriceRange] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>(initialSearchParam || "");
  const [sortBy, setSortBy] = useState<string>("featured");
  const [viewMode, setViewMode] = useState<"standard" | "disclosure">("standard");
  const [spotlightConfig, setSpotlightConfig] = useState<FeaturedSpotlightConfig>(getSpotlightConfig);

  useEffect(() => {
    const syncSpotlight = () => {
      setSpotlightConfig(getSpotlightConfig());
    };
    syncSpotlight();

    fetch('/api/settings/spotlight')
      .then((r) => r.json())
      .then((data) => {
        if (data.success && data.banners?.spotlight) {
          setSpotlightConfig(data.banners.spotlight);
        }
      })
      .catch(() => {});

    window.addEventListener('pixello_banners_updated', syncSpotlight);
    window.addEventListener('storage', syncSpotlight);
    return () => {
      window.removeEventListener('pixello_banners_updated', syncSpotlight);
      window.removeEventListener('storage', syncSpotlight);
    };
  }, []);

  // Synchronize URL search and category params cleanly without state-during-render loops
  useEffect(() => {
    const urlSearch = searchParams.get("search");
    const urlCategory = searchParams.get("category");

    if (urlSearch !== null && urlSearch !== undefined && urlSearch.trim() !== "") {
      setSearchQuery(urlSearch.trim());
      setSelectedCategory("All");
    } else if (urlCategory !== null && urlCategory !== undefined && urlCategory.trim() !== "") {
      const trimmedCat = urlCategory.trim();
      const matched = dynamicCategories.find((c) => c.toLowerCase() === trimmedCat.toLowerCase());
      setSelectedCategory(matched || trimmedCat);
      setSearchQuery("");
    }
  }, [searchParams, dynamicCategories]);

  // Helper for dynamic category count calculation (reflects active search query)
  const getCategoryCount = (catName: string) => {
    let baseList = products;
    if (searchQuery.trim()) {
      baseList = baseList.filter((p) => isFuzzyMatch(getSearchableText(p), searchQuery.trim()));
    }
    if (catName === "All") return baseList.length;
    return baseList.filter((p) => p.category.toLowerCase() === catName.toLowerCase()).length;
  };

  // Comprehensive Filtering & Ranking Logic
  const filteredProducts = useMemo(() => {
    return products.filter((product) => {
      // 1. Search Query Filter (Fuzzy, typo-tolerant, multi-word keywords)
      if (searchQuery.trim()) {
        const query = searchQuery.trim();
        const fullProductText = getSearchableText(product);
        const matched = isFuzzyMatch(fullProductText, query);
        if (!matched) return false;
      }

      // 2. Category Filter
      if (selectedCategory !== "All" && product.category.toLowerCase() !== selectedCategory.toLowerCase()) {
        return false;
      }

      // 3. Price Range Filter
      if (selectedPriceRange === "under500" && product.price >= 500) {
        return false;
      }
      if (selectedPriceRange === "500-1000" && (product.price < 500 || product.price > 1000)) {
        return false;
      }
      if (selectedPriceRange === "over1000" && product.price <= 1000) {
        return false;
      }

      return true;
    }).sort((a, b) => {
      if (sortBy === "price-low") return a.price - b.price;
      if (sortBy === "price-high") return b.price - a.price;
      if (sortBy === "rating") return b.rating - a.rating;
      return 0;
    });
  }, [products, selectedCategory, selectedPriceRange, searchQuery, sortBy]);

  const handleSearchChange = (newVal: string) => {
    setSearchQuery(newVal);
    // If the customer searches, automatically ensure all categories are searched
    if (newVal.trim() && selectedCategory !== "All") {
      setSelectedCategory("All");
    }
    if (typeof window !== "undefined") {
      const url = newVal.trim()
        ? `/products?search=${encodeURIComponent(newVal.trim())}`
        : (selectedCategory !== "All" ? `/products?category=${encodeURIComponent(selectedCategory)}` : "/products");
      window.history.replaceState(null, "", url);
    }
  };

  const handleClearSearch = () => {
    setSearchQuery("");
    if (typeof window !== "undefined") {
      const url = selectedCategory !== "All" ? `/products?category=${encodeURIComponent(selectedCategory)}` : "/products";
      window.history.replaceState(null, "", url);
    }
  };

  const handleCategoryChange = (cat: string) => {
    setSelectedCategory(cat);
    setSearchQuery(""); // Clear search query when changing categories so All Products tab works instantly!
    if (cat === "All") {
      setSelectedPriceRange("all");
    }
    if (typeof window !== "undefined") {
      window.history.replaceState(null, "", cat === "All" ? "/products" : `/products?category=${encodeURIComponent(cat)}`);
    }
  };

  const handleResetFilters = () => {
    setSelectedCategory("All");
    setSelectedPriceRange("all");
    setSearchQuery("");
    setSortBy("featured");
    if (typeof window !== "undefined") {
      window.history.replaceState(null, "", "/products");
    }
  };

  const isFilterActive = selectedCategory !== "All" || selectedPriceRange !== "all" || searchQuery !== "";

  return (
    <div suppressHydrationWarning className="bg-[#F8F3EE] min-h-screen py-10">
      <div className="container mx-auto px-4 md:px-6">
        
        {/* Header / Breadcrumb */}
        <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="font-serif-brand text-3xl md:text-4xl font-bold tracking-tight text-[#3A2B24]">Personalized Products Catalog</h1>
            <p className="text-sm text-[#6C5C54] mt-1">Handcrafted photo frames, polaroids & memory gifts dispatched in hours.</p>
          </div>

          {/* Search bar */}
          <div className="flex items-center gap-2 w-full md:w-auto">
            <form 
              onSubmit={(e) => {
                e.preventDefault();
                if (searchQuery.trim()) {
                  setSelectedCategory("All");
                  if (typeof window !== "undefined") {
                    window.history.replaceState(null, "", `/products?search=${encodeURIComponent(searchQuery.trim())}`);
                  }
                }
              }} 
              className="relative flex-1 md:w-80"
            >
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#6C5C54]" />
              <Input 
                type="text" 
                placeholder="Search frames, polaroids..." 
                value={searchQuery}
                onChange={(e) => handleSearchChange(e.target.value)}
                className="pl-10 pr-9 rounded-full border-[#D89A86]/50 hover:border-[#D89A86] bg-white text-sm focus-visible:ring-2 focus-visible:ring-[#D89A86]/40 focus-visible:border-[#D89A86] shadow-2xs transition-all"
              />
              {searchQuery.trim() && (
                <button
                  type="button"
                  onClick={handleClearSearch}
                  className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 rounded-full bg-[#FFF8F2] text-[#6C5C54] hover:text-[#3A2B24] hover:bg-[#F2C8B5]/40 flex items-center justify-center transition-colors cursor-pointer"
                  title="Clear search"
                >
                  <X className="h-3 w-3" />
                </button>
              )}
            </form>

            <button
              type="button"
              onClick={() => {
                if (typeof window !== "undefined") {
                  window.dispatchEvent(new CustomEvent("open_visual_search"));
                }
              }}
              className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-full bg-[#FFF8F2] hover:bg-[#F2C8B5]/40 border border-[#D89A86] text-[#D89A86] hover:text-[#c78672] text-xs font-bold shadow-2xs transition-all cursor-pointer whitespace-nowrap shrink-0 group active:scale-95"
              title="Search catalog by photo or camera"
            >
              <Camera className="h-4 w-4 text-[#D89A86] group-hover:scale-110 transition-transform" />
              <span className="hidden sm:inline">Search by Image</span>
              <span className="sm:hidden text-xs">Photo</span>
            </button>
          </div>
        </div>

        {/* Spotlight Featured Product Banner with BorderTrailCard2 */}
        {spotlightConfig.enabled && selectedCategory === "All" && !searchQuery && (
          <div className="mb-6">
            <BorderTrailCard2
              glowColor="pink"
              trailSize={130}
              active={true}
              className="p-5 bg-gradient-to-r from-[#FFF8F2] via-white to-[#FFF4ED] border-[#F2C8B5]"
            >
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="bg-[#D89A86] text-white text-[10px] font-extrabold px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                      {spotlightConfig.tag || "Featured Spotlight"}
                    </span>
                    {spotlightConfig.badgeText && (
                      <span className="text-[11px] font-bold text-[#D89A86]">
                        {spotlightConfig.badgeText}
                      </span>
                    )}
                  </div>
                  <h3 className="font-serif-brand text-lg font-bold text-[#3A2B24]">
                    {spotlightConfig.title}
                  </h3>
                  <p className="text-xs text-[#6C5C54] max-w-lg">
                    {spotlightConfig.description}
                  </p>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <div className="text-right">
                    {spotlightConfig.originalPrice > 0 && (
                      <span className="text-[10px] text-[#6C5C54] block line-through">₹{spotlightConfig.originalPrice}</span>
                    )}
                    <span className="text-lg font-extrabold text-[#3A2B24]">₹{spotlightConfig.price}</span>
                  </div>
                  <Link
                    href={spotlightConfig.productLink || "/product/1"}
                    className="btn-pixello-primary text-xs font-bold rounded-full px-5 py-2.5 shadow-xs flex items-center gap-1.5"
                  >
                    {spotlightConfig.buttonText || "Customize & Order"}
                  </Link>
                </div>
              </div>
            </BorderTrailCard2>
          </div>
        )}

        {/* Compact Horizontal Filters Bar */}
        <div className="bg-white border border-[#EFE6DD] rounded-2xl p-3 sm:px-4 shadow-xs mb-5 space-y-2">
          {/* Row 1: Categories */}
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 scrollbar-none flex-1">
              <span className="flex items-center gap-1 text-[11px] font-extrabold uppercase tracking-wider text-[#3A2B24] shrink-0 mr-1">
                <Filter className="h-3 w-3 text-[#D89A86]" /> Category:
              </span>
              {dynamicCategories.map((cat) => {
                const count = getCategoryCount(cat);
                const isSelected = selectedCategory === cat && !searchQuery;
                return (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => handleCategoryChange(cat)}
                    className={cn(
                      "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] transition-all whitespace-nowrap cursor-pointer border",
                      isSelected
                        ? "bg-[#FFF4ED] text-[#D89A86] font-bold border-[#F2C8B5] shadow-2xs ring-1 ring-[#D89A86]/20"
                        : "bg-[#FFFDFB] text-[#6C5C54] hover:bg-[#F8F3EE] hover:text-[#3A2B24] border-[#EFE6DD]"
                    )}
                  >
                    <span className={cn(
                      "h-1.5 w-1.5 rounded-full shrink-0",
                      isSelected ? "bg-[#D89A86]" : "bg-[#D89A86]/40"
                    )} />
                    <span>{cat === "All" ? "All Products" : cat}</span>
                    <span className={cn(
                      "text-[9px] px-1 rounded-full font-semibold",
                      isSelected ? "bg-[#D89A86] text-white" : "bg-[#F8F3EE] text-[#6C5C54]"
                    )}>
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>

            {isFilterActive && (
              <button 
                type="button"
                onClick={handleResetFilters}
                className="text-[11px] text-[#D89A86] hover:text-[#3A2B24] flex items-center gap-1 font-bold transition-colors cursor-pointer shrink-0 pl-2 border-l border-[#EFE6DD]"
              >
                <RefreshCw className="h-2.5 w-2.5" /> Reset
              </button>
            )}
          </div>

          <Separator className="bg-[#EFE6DD]/60" />

          {/* Row 2: Price Range & Sort */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-0.5">
            {/* Price Range Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 scrollbar-none">
              <span className="text-[11px] font-bold text-[#6C5C54] whitespace-nowrap mr-1">
                Price:
              </span>
              {[
                { id: "all", label: "All Prices" },
                { id: "under500", label: "Under ₹500" },
                { id: "500-1000", label: "₹500 - ₹1,000" },
                { id: "over1000", label: "Over ₹1,000" },
              ].map((p) => {
                const isSelected = selectedPriceRange === p.id;
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => setSelectedPriceRange(p.id)}
                    className={cn(
                      "px-2.5 py-0.5 rounded-full text-[11px] transition-all whitespace-nowrap cursor-pointer border",
                      isSelected
                        ? "bg-[#FFF4ED] text-[#D89A86] font-bold border-[#F2C8B5] shadow-2xs ring-1 ring-[#D89A86]/20"
                        : "bg-[#FFFDFB] text-[#6C5C54] hover:bg-[#F8F3EE] hover:text-[#3A2B24] border-[#EFE6DD]"
                    )}
                  >
                    {p.label}
                  </button>
                );
              })}
            </div>

            {/* Showing items count & Sort Dropdown */}
            <div className="flex items-center gap-2.5 shrink-0 self-end sm:self-auto">
              <span className="text-[11px] text-[#6C5C54] font-medium hidden md:inline">
                Showing <span className="text-[#3A2B24] font-bold">{filteredProducts.length}</span> items
                {searchQuery && (
                  <span> for &ldquo;<span className="text-[#D89A86] font-bold">{searchQuery}</span>&rdquo;</span>
                )}
              </span>

              <div className="flex items-center gap-1.5">
                <span className="text-[11px] text-[#6C5C54] font-medium flex items-center gap-1">
                  <ArrowUpDown className="h-3 w-3 text-[#D89A86]" /> Sort:
                </span>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="text-[11px] font-bold text-[#3A2B24] bg-[#FFF8F2] border border-[#EFE6DD] rounded-lg px-2.5 py-1 focus:outline-none focus:ring-1 focus:ring-[#D89A86] cursor-pointer"
                >
                  <option value="featured">Featured</option>
                  <option value="price-low">Price: Low to High</option>
                  <option value="price-high">Price: High to Low</option>
                  <option value="rating">Highest Rated</option>
                </select>

                {/* View Mode Toggle: Standard Grid vs Interactive Disclosure Cards */}
                <div className="flex items-center rounded-lg border border-[#EFE6DD] bg-[#FFF8F2] p-0.5 ml-1">
                  <button
                    type="button"
                    onClick={() => setViewMode("standard")}
                    title="Standard Catalog Cards"
                    className={cn(
                      "p-1 rounded-md text-[11px] transition-colors cursor-pointer",
                      viewMode === "standard"
                        ? "bg-white text-[#3A2B24] font-bold shadow-2xs"
                        : "text-[#6C5C54] hover:text-[#3A2B24]"
                    )}
                  >
                    <LayoutGrid className="h-3.5 w-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setViewMode("disclosure")}
                    title="Interactive Animated Disclosure Cards"
                    className={cn(
                      "p-1 rounded-md text-[11px] transition-colors cursor-pointer flex items-center gap-1",
                      viewMode === "disclosure"
                        ? "bg-white text-[#D89A86] font-bold shadow-2xs"
                        : "text-[#6C5C54] hover:text-[#D89A86]"
                    )}
                  >
                    <Sparkles className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Product Cards Grid Area (Now Full Viewport Width) */}
        <div>
          {/* Visual Memory Customization Studio Hero Banner */}
          <div className="mb-8 bg-gradient-to-r from-[#FFF5ED] via-[#FFF8F2] to-[#FAF3EC] border border-[#EFE6DD] rounded-3xl p-5 md:p-6 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="h-14 w-14 rounded-2xl bg-[#FFF2EB] border border-[#F3DACF] flex items-center justify-center shrink-0 text-2xl shadow-xs">
                🖼️
              </div>
              <div>
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#FFF2EB] text-[#D89A86] text-[10px] font-extrabold uppercase tracking-wider mb-1">
                  <Sparkles className="h-3 w-3" /> Visual Memory Customization Studio
                </div>
                <h3 className="font-serif-brand font-bold text-lg md:text-xl text-[#3A2B24]">
                  Design Your Framed Masterpiece with Live Photo Preview
                </h3>
                <p className="text-xs text-[#6C5C54] mt-0.5">
                  Upload your favourite snapshot, pick your handcrafted wood finish, and preview archival matting in real time.
                </p>
              </div>
            </div>
            <Link href="/frames" className="shrink-0 w-full md:w-auto">
              <Button className="btn-pixello-primary w-full md:w-auto rounded-full px-6 py-2.5 text-xs font-bold shadow-md flex items-center justify-center gap-2">
                <span>Open Frame Studio</span>
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>

          {filteredProducts.length === 0 ? (
            <div className="bg-white border border-[#EFE6DD] rounded-3xl p-10 sm:p-12 text-center shadow-xs">
              <div className="h-16 w-16 bg-[#FFF8F2] text-[#D89A86] rounded-full flex items-center justify-center mx-auto mb-4 border border-[#EFE6DD]">
                <Search className="h-8 w-8" />
              </div>
              <h3 className="font-serif-brand font-bold text-xl text-[#3A2B24]">No products match &ldquo;{searchQuery}&rdquo;</h3>
              <p className="text-xs text-[#6C5C54] mt-1.5 max-w-sm mx-auto">
                We couldn&apos;t find any items matching your search. Try checking your spelling or try one of these popular searches:
              </p>
              
              <div className="flex flex-wrap items-center justify-center gap-2 mt-4 max-w-md mx-auto">
                {["Frames", "Polaroids", "Photo Mug", "LED Lamp", "Keychain", "Panda", "Spotify Plaque"].map((keyword) => (
                  <button
                    key={keyword}
                    type="button"
                    onClick={() => handleSearchChange(keyword)}
                    className="text-xs bg-[#FFF8F2] hover:bg-[#F2C8B5]/40 text-[#D89A86] border border-[#D89A86]/40 px-3 py-1 rounded-full font-medium transition-all cursor-pointer"
                  >
                    🔍 {keyword}
                  </button>
                ))}
              </div>

              <div className="mt-6 flex items-center justify-center gap-3">
                <Button 
                  onClick={handleResetFilters}
                  className="btn-pixello-primary text-xs font-bold rounded-full px-6 h-10 shadow-xs"
                >
                  View All Catalog Items
                </Button>
              </div>
            </div>
          ) : viewMode === "disclosure" ? (
            <div className="grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-3.5 sm:gap-6">
              {filteredProducts.map((product) => (
                <DisclosureCard key={product.id} product={product} />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-3.5 sm:gap-6">
                {filteredProducts.map((product) => {
                  const meta = getProductTypeMeta(product);
                  const isOutOfStock = product.status === "Out of Stock" || (product.stock !== undefined && product.stock <= 0);

                  return (
                    <Card 
                      key={product.id} 
                      className={cn(
                        "group border border-[#EFE6DD] rounded-3xl shadow-2xs hover:shadow-md transition-all duration-300 overflow-hidden flex flex-col justify-between relative",
                        meta.accentBg,
                        meta.accentBorder
                      )}
                    >
                      {/* Animated border trail for selected featured & best-seller products */}
                      {(product.badge === "Best Seller" || String(product.id) === "1") && (
                        <BorderTrail
                          className="bg-gradient-to-r from-[#F8D2C2] via-[#D89A86] to-[#F8D2C2] shadow-[0_0_12px_rgba(216,154,134,0.6)]"
                          size={110}
                          transition={{
                            ease: [0, 0.5, 0.8, 0.5],
                            duration: 5,
                            repeat: Infinity,
                          }}
                        />
                      )}
                      <div>
                        {/* Product Image & Badges */}
                        <Link href={`/product/${product.id}`} className="block relative aspect-square overflow-hidden bg-[#FFF8F2] w-full">
                          <img 
                            src={product.image} 
                            alt={product.name}
                            className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-500"
                          />
                          
                          {/* Top Badges */}
                          <div className="absolute top-2.5 sm:top-3.5 left-2.5 sm:left-3.5 flex flex-col gap-1.5 z-10">
                            {product.badge && (
                              <Badge className={cn("text-[9px] sm:text-[10px] font-extrabold px-2 sm:px-2.5 py-0.5 rounded-full border-none shadow-xs", meta.badgeBg)}>
                                {product.badge}
                              </Badge>
                            )}
                          </div>

                          {/* Bottom Highlight Pill on Image */}
                          <div className="absolute bottom-2.5 sm:bottom-3 left-2.5 sm:left-3 z-10">
                            <span className="backdrop-blur-md bg-black/60 text-white text-[9px] sm:text-[10px] font-semibold px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-full shadow-xs flex items-center gap-1">
                              {meta.highlightPill}
                            </span>
                          </div>

                          {isOutOfStock && (
                            <Badge className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-rose-600/95 text-white text-xs font-extrabold px-3 sm:px-4 py-1.5 rounded-full border-none shadow-lg z-10 flex items-center gap-1 backdrop-blur-xs">
                              ❌ Out of Stock
                            </Badge>
                          )}

                          <button
                            type="button"
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              toggleWishlist(product.id);
                            }}
                            className={cn(
                              "absolute top-2.5 sm:top-3.5 right-2.5 sm:right-3.5 h-7 w-7 sm:h-8 sm:w-8 rounded-full flex items-center justify-center transition-all shadow-sm cursor-pointer z-10",
                              isInWishlist(product.id)
                                ? "bg-rose-50 text-rose-500 border border-rose-200"
                                : "bg-white/85 text-[#6C5C54] hover:bg-white hover:text-rose-500 backdrop-blur-xs"
                            )}
                          >
                            <Heart className={cn("h-3.5 w-3.5 sm:h-4 sm:w-4", isInWishlist(product.id) && "fill-rose-500")} />
                          </button>
                        </Link>

                        {/* Card Content */}
                        <CardContent className="p-3.5 sm:p-5">
                          {/* Category & Rating */}
                          <div className="flex items-center justify-between text-xs text-[#6C5C54] mb-1.5">
                            <span className="font-bold text-[#D89A86] tracking-wide uppercase text-[9px] sm:text-[10px]">
                              {meta.typeCategory}
                            </span>
                            <span className="flex items-center gap-1 font-bold text-[#3A2B24] text-[11px] sm:text-xs">
                              <Star className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-amber-400 fill-amber-400" /> {product.rating} ({product.reviews})
                            </span>
                          </div>

                          {/* Model / Type Label */}
                          <div className="text-[10px] sm:text-[11px] font-bold text-[#6C5C54] flex items-center gap-1 mb-1">
                            <span className="text-[#3A2B24] font-semibold truncate">{meta.typeLabel}</span>
                          </div>

                          {/* Product Title */}
                          <Link href={`/product/${product.id}`}>
                            <h4 className="font-bold text-sm sm:text-base text-[#3A2B24] group-hover:text-[#D89A86] transition-colors line-clamp-1">
                              {product.name}
                            </h4>
                          </Link>

                          {/* Key Specs Pills */}
                          <div className="flex flex-wrap gap-1 mt-2.5 sm:mt-3">
                            {meta.specs.slice(0, 2).map((spec) => (
                              <span 
                                key={spec} 
                                className="bg-white/80 text-[#6C5C54] text-[9px] sm:text-[10px] font-semibold px-1.5 sm:px-2 py-0.5 rounded-lg border border-[#EFE6DD] truncate max-w-full"
                              >
                                {spec}
                              </span>
                            ))}
                          </div>
                        </CardContent>
                      </div>

                      {/* Footer / Buy Action */}
                      <div className="p-3.5 sm:p-5 pt-0 flex flex-col xs:flex-row items-start xs:items-center justify-between border-t border-[#EFE6DD]/50 mt-1 gap-2">
                        <div>
                          <span className="text-[8px] sm:text-[9px] text-[#6C5C54] uppercase tracking-wider block font-bold">
                            {meta.priceLabel}
                          </span>
                          <div className="flex items-baseline gap-1">
                            <span className="text-base sm:text-lg font-extrabold text-[#3A2B24]">₹{product.price}</span>
                            {meta.unit && <span className="text-[9px] sm:text-[10px] text-[#6C5C54] font-medium">{meta.unit}</span>}
                            {product.originalPrice && product.originalPrice > product.price && (
                              <span className="text-[10px] sm:text-xs text-[#8C7A70] line-through ml-1">₹{product.originalPrice}</span>
                            )}
                          </div>
                        </div>

                        <Link href={`/product/${product.id}`} className="w-full xs:w-auto">
                          {isOutOfStock ? (
                            <Button 
                              variant="outline"
                              className="w-full xs:w-auto border border-[#D89A86] bg-[#FFF8F2] hover:bg-[#F2C8B5]/40 text-[#D89A86] text-[11px] sm:text-xs font-bold rounded-full px-3 sm:px-4 h-8 sm:h-9 shadow-2xs flex items-center justify-center gap-1.5 cursor-pointer"
                            >
                              <span>View</span> <Eye className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                            </Button>
                          ) : (
                            <Button className="btn-pixello-primary w-full xs:w-auto text-[11px] sm:text-xs font-bold rounded-full px-3 sm:px-4 h-8 sm:h-9 shadow-xs flex items-center justify-center gap-1.5 cursor-pointer">
                              <span>Customize</span> <ShoppingCart className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                            </Button>
                          )}
                        </Link>
                      </div>
                    </Card>
                  );
                })}
              </div>
            )}

          </div>

      </div>
    </div>
  );
}

export default function ProductsPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#F8F3EE] flex items-center justify-center p-6 text-xs text-[#6C5C54] font-bold">
        Loading catalog...
      </div>
    }>
      <ProductsContent />
    </Suspense>
  );
}
