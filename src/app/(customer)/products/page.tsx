"use client";

import React, { useState, useEffect, useMemo, Suspense } from "react";
import Link from "next/link";
import { Filter, Star, ShoppingCart, Heart, Search, RefreshCw, SlidersHorizontal, ArrowUpDown } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { useSearchParams } from "next/navigation";
import { useWishlist } from "@/context/WishlistContext";
import { useProducts } from "@/context/ProductContext";

// Levenshtein Edit Distance calculation for fuzzy typo matching
function levenshteinDistance(a: string, b: string): number {
  if (a.length === 0) return b.length;
  if (b.length === 0) return a.length;

  const matrix = Array.from({ length: a.length + 1 }, () => Array(b.length + 1).fill(0));

  for (let i = 0; i <= a.length; i++) matrix[i][0] = i;
  for (let j = 0; j <= b.length; j++) matrix[0][j] = j;

  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1,
        matrix[i][j - 1] + 1,
        matrix[i - 1][j - 1] + cost
      );
    }
  }

  return matrix[a.length][b.length];
}

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

function isFuzzyMatch(productStr: string, queryInput: string): boolean {
  const cleanTarget = productStr.toLowerCase();
  const cleanInput = queryInput.toLowerCase().trim();

  if (!cleanInput) return true;

  // 1. Direct Substring Check
  if (cleanTarget.includes(cleanInput)) return true;

  // 2. Map known typos
  const normalizedInput = TYPO_MAP[cleanInput] || cleanInput;
  if (cleanTarget.includes(normalizedInput)) return true;

  // 3. Word-by-word Levenshtein distance check
  const inputWords = cleanInput.split(/\s+/);
  const targetWords = cleanTarget.split(/\s+/);

  for (const iWord of inputWords) {
    const normIWord = TYPO_MAP[iWord] || iWord;
    if (normIWord.length < 3) continue;

    for (const tWord of targetWords) {
      if (tWord.includes(normIWord) || normIWord.includes(tWord)) return true;

      const maxAllowedDistance = normIWord.length >= 5 ? 2 : 1;
      if (levenshteinDistance(normIWord, tWord) <= maxAllowedDistance) {
        return true;
      }
    }
  }

  return false;
}

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

  return {
    typeCategory: product.category || "Custom Gift",
    typeLabel: "Personalized Studio Gift",
    accentBorder: "hover:border-[#D89A86]/50 hover:shadow-stone-900/10",
    accentBg: "bg-white",
    badgeBg: "bg-[#3A2B24] text-white",
    specs: ["Premium Craftsmanship", "Studio Quality", "Custom Photo Print"],
    buttonText: "Customize",
    unit: "",
    highlightPill: "✨ Studio Crafted",
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

  useEffect(() => {
    const q = searchParams.get("search");
    const cat = searchParams.get("category");

    if (q !== null && q.trim() !== "") {
      setSearchQuery(q.trim());
      setSelectedCategory("All");
    } else if (cat !== null && cat.trim() !== "") {
      const trimmedCat = cat.trim();
      const matched = dynamicCategories.find((c) => c.toLowerCase() === trimmedCat.toLowerCase());
      setSelectedCategory(matched || trimmedCat);
      setSearchQuery("");
    } else {
      setSelectedCategory("All");
      setSearchQuery("");
    }
  }, [searchParams, dynamicCategories]);

  // Helper for dynamic category count calculation
  const getCategoryCount = (catName: string) => {
    if (catName === "All") return products.length;
    return products.filter((p) => p.category.toLowerCase() === catName.toLowerCase()).length;
  };

  // Filtering Logic
  const filteredProducts = useMemo(() => {
    return products.filter((product) => {
      // 1. Search Query Filter (if active)
      if (searchQuery.trim()) {
        const query = searchQuery.trim();
        const fullProductText = `${product.name} ${product.category} ${product.badge || ""}`;
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
            className="relative w-full md:w-80"
          >
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#6C5C54]" />
            <Input 
              type="text" 
              placeholder="Search frames, polaroids..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 rounded-full border-[#EFE6DD] bg-white text-sm focus-visible:ring-[#D89A86]"
            />
          </form>
        </div>

        <div className="flex flex-col lg:flex-row gap-8">
          
          {/* Sidebar Filters */}
          <div className="w-full lg:w-64 flex-shrink-0">
            <div className="sticky top-24 bg-white border border-[#EFE6DD] rounded-3xl p-6 shadow-xs">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2 font-serif-brand font-bold text-lg text-[#3A2B24]">
                  <Filter className="h-4 w-4 text-[#D89A86]" /> Filters
                </div>
                {isFilterActive && (
                  <button 
                    onClick={handleResetFilters}
                    className="text-xs text-[#D89A86] hover:text-[#3A2B24] flex items-center gap-1 font-semibold transition-colors cursor-pointer"
                  >
                    <RefreshCw className="h-3 w-3" /> Reset
                  </button>
                )}
              </div>
              
              <Separator className="my-4 bg-[#EFE6DD]" />
              
              {/* Dynamic Category Filter */}
              <h3 className="font-serif-brand font-bold mb-3 text-sm text-[#3A2B24]">Category</h3>
              <div className="flex flex-col gap-2.5">
                {dynamicCategories.map((cat) => {
                  const count = getCategoryCount(cat);
                  return (
                    <label 
                      key={cat} 
                      onClick={() => handleCategoryChange(cat)}
                      className={cn(
                        "flex items-center justify-between text-sm px-3 py-2 rounded-xl cursor-pointer transition-all",
                        selectedCategory === cat 
                          ? "bg-[#FFF8F2] text-[#D89A86] font-bold border border-[#D89A86]/30" 
                          : "text-[#6C5C54] hover:bg-[#F8F3EE] hover:text-[#3A2B24]"
                      )}
                    >
                      <div className="flex items-center gap-2.5">
                        <input 
                          type="radio" 
                          name="categoryFilter" 
                          checked={selectedCategory === cat && !searchQuery} 
                          onChange={() => handleCategoryChange(cat)}
                          className="text-[#D89A86] focus:ring-[#D89A86]" 
                        />
                        <span>{cat === "All" ? "All Products" : cat}</span>
                      </div>
                      <span className="text-[11px] text-[#6C5C54] font-medium">
                        ({count})
                      </span>
                    </label>
                  );
                })}
              </div>

              <Separator className="my-5 bg-[#EFE6DD]" />
              
              {/* Price Range Filter */}
              <h3 className="font-serif-brand font-bold mb-3 text-sm text-[#3A2B24]">Price Range</h3>
              <div className="flex flex-col gap-2.5 text-sm text-[#6C5C54]">
                <label className={cn(
                  "flex items-center gap-2.5 px-3 py-2 rounded-xl cursor-pointer transition-all",
                  selectedPriceRange === "all" ? "bg-[#FFF8F2] text-[#D89A86] font-bold border border-[#D89A86]/30" : "hover:bg-[#F8F3EE]"
                )}>
                  <input 
                    type="radio" 
                    name="price" 
                    checked={selectedPriceRange === "all"}
                    onChange={() => setSelectedPriceRange("all")}
                    className="text-[#D89A86] focus:ring-[#D89A86]" 
                  /> 
                  <span>All Prices</span>
                </label>
                
                <label className={cn(
                  "flex items-center gap-2.5 px-3 py-2 rounded-xl cursor-pointer transition-all",
                  selectedPriceRange === "under500" ? "bg-[#FFF8F2] text-[#D89A86] font-bold border border-[#D89A86]/30" : "hover:bg-[#F8F3EE]"
                )}>
                  <input 
                    type="radio" 
                    name="price" 
                    checked={selectedPriceRange === "under500"}
                    onChange={() => setSelectedPriceRange("under500")}
                    className="text-[#D89A86] focus:ring-[#D89A86]" 
                  /> 
                  <span>Under ₹500</span>
                </label>
                
                <label className={cn(
                  "flex items-center gap-2.5 px-3 py-2 rounded-xl cursor-pointer transition-all",
                  selectedPriceRange === "500-1000" ? "bg-[#FFF8F2] text-[#D89A86] font-bold border border-[#D89A86]/30" : "hover:bg-[#F8F3EE]"
                )}>
                  <input 
                    type="radio" 
                    name="price" 
                    checked={selectedPriceRange === "500-1000"}
                    onChange={() => setSelectedPriceRange("500-1000")}
                    className="text-[#D89A86] focus:ring-[#D89A86]" 
                  /> 
                  <span>₹500 - ₹1,000</span>
                </label>

                <label className={cn(
                  "flex items-center gap-2.5 px-3 py-2 rounded-xl cursor-pointer transition-all",
                  selectedPriceRange === "over1000" ? "bg-[#FFF8F2] text-[#D89A86] font-bold border border-[#D89A86]/30" : "hover:bg-[#F8F3EE]"
                )}>
                  <input 
                    type="radio" 
                    name="price" 
                    checked={selectedPriceRange === "over1000"}
                    onChange={() => setSelectedPriceRange("over1000")}
                    className="text-[#D89A86] focus:ring-[#D89A86]" 
                  /> 
                  <span>Over ₹1,000</span>
                </label>
              </div>

            </div>
          </div>

          {/* Product Grid Area */}
          <div className="flex-1">
            
            {/* Top Toolbar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 bg-white border border-[#EFE6DD] rounded-2xl p-4 shadow-xs">
              <div className="text-xs font-semibold text-[#6C5C54]">
                Showing <span className="text-[#3A2B24] font-bold">{filteredProducts.length}</span> products
                {searchQuery && (
                  <span> for "<span className="text-[#D89A86] font-bold">{searchQuery}</span>"</span>
                )}
              </div>

              <div className="flex items-center gap-3">
                <span className="text-xs text-[#6C5C54] font-medium flex items-center gap-1.5">
                  <ArrowUpDown className="h-3.5 w-3.5 text-[#D89A86]" /> Sort by:
                </span>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="text-xs font-bold text-[#3A2B24] bg-[#FFF8F2] border border-[#EFE6DD] rounded-xl px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-[#D89A86] cursor-pointer"
                >
                  <option value="featured">Featured</option>
                  <option value="price-low">Price: Low to High</option>
                  <option value="price-high">Price: High to Low</option>
                  <option value="rating">Highest Rated</option>
                </select>
              </div>
            </div>

            {/* Product Cards Grid */}
            {filteredProducts.length === 0 ? (
              <div className="bg-white border border-[#EFE6DD] rounded-3xl p-12 text-center shadow-xs">
                <div className="h-16 w-16 bg-[#FFF8F2] text-[#D89A86] rounded-full flex items-center justify-center mx-auto mb-4 border border-[#EFE6DD]">
                  <Search className="h-8 w-8" />
                </div>
                <h3 className="font-serif-brand font-bold text-xl text-[#3A2B24]">Item is not found</h3>
                <p className="text-xs text-[#6C5C54] mt-1.5 max-w-sm mx-auto">
                  We couldn't find any products matching "{searchQuery}". Try checking for spelling or search for another item!
                </p>
                <Button 
                  onClick={handleResetFilters}
                  className="mt-5 btn-pixello-primary text-xs font-bold rounded-full px-6 h-10 shadow-xs"
                >
                  View All Catalog Items
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
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
                      <div>
                        {/* Product Image & Badges */}
                        <Link href={`/product/${product.id}`} className="block relative aspect-square overflow-hidden bg-[#FFF8F2] w-full">
                          <img 
                            src={product.image} 
                            alt={product.name}
                            className={cn(
                              "object-cover w-full h-full group-hover:scale-105 transition-transform duration-500",
                              isOutOfStock && "grayscale opacity-80"
                            )}
                          />
                          
                          {/* Top Badges */}
                          <div className="absolute top-3.5 left-3.5 flex flex-col gap-1.5 z-10">
                            {product.badge && (
                              <Badge className={cn("text-[10px] font-extrabold px-2.5 py-0.5 rounded-full border-none shadow-xs", meta.badgeBg)}>
                                {product.badge}
                              </Badge>
                            )}
                          </div>

                          {/* Bottom Highlight Pill on Image */}
                          <div className="absolute bottom-3 left-3 z-10">
                            <span className="backdrop-blur-md bg-black/60 text-white text-[10px] font-semibold px-2.5 py-1 rounded-full shadow-xs flex items-center gap-1">
                              {meta.highlightPill}
                            </span>
                          </div>

                          {isOutOfStock && (
                            <Badge className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-rose-600/95 text-white text-xs font-extrabold px-4 py-1.5 rounded-full border-none shadow-lg z-10 flex items-center gap-1 backdrop-blur-xs">
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
                              "absolute top-3.5 right-3.5 h-8 w-8 rounded-full flex items-center justify-center transition-all shadow-sm cursor-pointer z-10",
                              isInWishlist(product.id)
                                ? "bg-rose-50 text-rose-500 border border-rose-200"
                                : "bg-white/85 text-[#6C5C54] hover:bg-white hover:text-rose-500 backdrop-blur-xs"
                            )}
                          >
                            <Heart className={cn("h-4 w-4", isInWishlist(product.id) && "fill-rose-500")} />
                          </button>
                        </Link>

                        {/* Card Content */}
                        <CardContent className="p-5">
                          {/* Category & Rating */}
                          <div className="flex items-center justify-between text-xs text-[#6C5C54] mb-1.5">
                            <span className="font-bold text-[#D89A86] tracking-wide uppercase text-[10px]">
                              {meta.typeCategory}
                            </span>
                            <span className="flex items-center gap-1 font-bold text-[#3A2B24] text-xs">
                              <Star className="h-3.5 w-3.5 text-amber-400 fill-amber-400" /> {product.rating} ({product.reviews})
                            </span>
                          </div>

                          {/* Model / Type Label */}
                          <div className="text-[11px] font-bold text-[#6C5C54] flex items-center gap-1 mb-1">
                            <span className="text-[#3A2B24] font-semibold">{meta.typeLabel}</span>
                          </div>

                          {/* Product Title */}
                          <Link href={`/product/${product.id}`}>
                            <h4 className="font-bold text-base text-[#3A2B24] group-hover:text-[#D89A86] transition-colors line-clamp-1">
                              {product.name}
                            </h4>
                          </Link>

                          {/* Key Specs Pills */}
                          <div className="flex flex-wrap gap-1.5 mt-3">
                            {meta.specs.map((spec) => (
                              <span 
                                key={spec} 
                                className="bg-white/80 text-[#6C5C54] text-[10px] font-semibold px-2 py-0.5 rounded-lg border border-[#EFE6DD]"
                              >
                                {spec}
                              </span>
                            ))}
                          </div>
                        </CardContent>
                      </div>

                      {/* Footer / Buy Action */}
                      <div className="p-5 pt-0 flex items-center justify-between border-t border-[#EFE6DD]/50 mt-1">
                        <div>
                          <span className="text-[9px] text-[#6C5C54] uppercase tracking-wider block font-bold">
                            {meta.priceLabel}
                          </span>
                          <div className="flex items-baseline gap-1">
                            <span className="text-lg font-extrabold text-[#3A2B24]">₹{product.price}</span>
                            {meta.unit && <span className="text-[10px] text-[#6C5C54] font-medium">{meta.unit}</span>}
                            {product.originalPrice && product.originalPrice > product.price && (
                              <span className="text-xs text-[#8C7A70] line-through ml-1">₹{product.originalPrice}</span>
                            )}
                          </div>
                        </div>

                        <Link href={`/product/${product.id}`}>
                          {isOutOfStock ? (
                            <Button className="bg-rose-100 text-rose-800 hover:bg-rose-200 border border-rose-200 text-xs font-extrabold rounded-full px-3.5 h-9 shadow-2xs flex items-center gap-1 cursor-pointer">
                              ❌ Out of Stock
                            </Button>
                          ) : (
                            <Button className="btn-pixello-primary text-xs font-bold rounded-full px-4 h-9 shadow-xs flex items-center gap-1.5 cursor-pointer">
                              <span>{meta.buttonText}</span> <ShoppingCart className="h-3.5 w-3.5" />
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
