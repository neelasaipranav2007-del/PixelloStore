import React from "react";
import Link from "next/link";
import { Filter, Star, ShoppingCart, Heart, ChevronRight } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

// Mock Products Data
const MOCK_PRODUCTS = [
  { id: "1", name: "Premium Wooden Frame", category: "Frames", slugCategory: "photo-frames", price: 999, rating: 4.8, reviews: 124, image: "/images/wooden_frame_main.png" },
  { id: "2", name: "Classic Polaroid Set (24 prints)", category: "Polaroids", slugCategory: "polaroid-prints", price: 499, rating: 4.9, reviews: 342, image: "/images/polaroid_set.png" },
  { id: "3", name: "Magic Color-Changing Mug", category: "Gifts", slugCategory: "custom-mugs", price: 599, rating: 4.6, reviews: 89, image: "/images/custom_mug.png" },
  { id: "4", name: "LED Acrylic Lamp", category: "LED", slugCategory: "led-frames", price: 1299, rating: 4.7, reviews: 211, image: "/images/led_acrylic_lamp.png" },
  { id: "5", name: "Spotify Plaque", category: "Gifts", slugCategory: "custom-mugs", price: 799, rating: 4.5, reviews: 156, image: "/images/wooden_frame_angle.png" },
  { id: "6", name: "Collage Photo Frame", category: "Frames", slugCategory: "photo-frames", price: 1499, rating: 4.9, reviews: 402, image: "/images/wooden_frame_wall.png" },
];

export default async function CategoryPage({ params }: { params: Promise<{ name: string }> }) {
  const { name } = await params;
  
  // Format slug name to readable Title (e.g. photo-frames -> Photo Frames)
  const categoryTitle = name.split("-").map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(" ");
  
  // Filter products by slug or broad matching
  const filteredProducts = MOCK_PRODUCTS.filter(p => 
    p.slugCategory.toLowerCase() === name.toLowerCase() || 
    p.category.toLowerCase().includes(name.toLowerCase().replace("photo-", "").replace("custom-", ""))
  );

  const displayProducts = filteredProducts.length > 0 ? filteredProducts : MOCK_PRODUCTS;

  return (
    <div className="container mx-auto px-4 md:px-6 py-8">
      {/* Breadcrumbs */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground mb-6">
        <Link href="/" className="hover:text-primary">Home</Link>
        <ChevronRight className="h-4 w-4" />
        <Link href="/products" className="hover:text-primary">Categories</Link>
        <ChevronRight className="h-4 w-4" />
        <span className="text-foreground font-semibold">{categoryTitle}</span>
      </div>

      {/* Category Header */}
      <div className="mb-8 flex flex-col gap-2 bg-gradient-to-r from-blue-50 to-indigo-50 p-8 rounded-2xl border border-blue-100">
        <Badge className="w-fit bg-primary text-primary-foreground">Category</Badge>
        <h1 className="text-4xl font-extrabold tracking-tight">{categoryTitle}</h1>
        <p className="text-muted-foreground">Explore our top-rated personalized {categoryTitle.toLowerCase()} handcrafted and delivered with express tracking.</p>
      </div>

      {/* Product Grid */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {displayProducts.map((product) => (
          <div key={product.id} className="group overflow-hidden border border-[#EFE6DD] bg-white rounded-3xl shadow-xs hover:shadow-md transition-all duration-300 flex flex-col justify-between">
            <Link href={`/product/${product.id}`} className="block relative aspect-square overflow-hidden cursor-pointer w-full">
              <img 
                src={product.image} 
                alt={product.name}
                className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-500"
              />
              <Badge className="absolute top-3 left-3 bg-white/95 text-[#3A2B24] border border-[#EFE6DD] font-semibold text-xs backdrop-blur-sm shadow-2xs pointer-events-none">
                {product.category}
              </Badge>
            </Link>
            <CardContent className="p-4 relative">
              <Button 
                variant="ghost" 
                size="icon" 
                className="absolute -top-12 right-3 z-10 bg-white/70 hover:bg-white hover:text-red-500 backdrop-blur-sm rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <Heart className="h-4 w-4" />
              </Button>
              <div className="flex items-center gap-1 mb-2">
                <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                <span className="text-sm font-medium">{product.rating}</span>
                <span className="text-xs text-muted-foreground">({product.reviews})</span>
              </div>
              <Link href={`/product/${product.id}`} className="hover:underline">
                <h3 className="font-semibold text-lg line-clamp-1">{product.name}</h3>
              </Link>
              <div className="flex items-center justify-between mt-4">
                <span className="text-xl font-bold">₹{product.price}</span>
                <Link 
                  href={`/product/${product.id}`}
                  className={cn(buttonVariants({ size: "sm" }), "rounded-full")}
                >
                  <ShoppingCart className="h-4 w-4 mr-2" /> Add
                </Link>
              </div>
            </CardContent>
          </div>
        ))}
      </div>
    </div>
  );
}
