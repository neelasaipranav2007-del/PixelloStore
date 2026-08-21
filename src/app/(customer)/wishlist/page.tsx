import Link from "next/link";
import { Heart, ShoppingCart, Star, Trash2 } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export default function WishlistPage() {
  const WISHLIST_ITEMS = [
    { id: "1", name: "Premium Wooden Frame", category: "Frames", price: 999, rating: 4.8, reviews: 124, image: "/images/wooden_frame_main.png" },
    { id: "4", name: "LED Acrylic Lamp", category: "LED", price: 1299, rating: 4.7, reviews: 211, image: "/images/led_acrylic_lamp.png" },
  ];

  return (
    <div className="container mx-auto px-4 md:px-6 py-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">My Wishlist</h1>
          <p className="text-muted-foreground mt-1">Your saved items to order later.</p>
        </div>
        <Badge variant="secondary" className="text-sm px-3 py-1">
          {WISHLIST_ITEMS.length} Items Saved
        </Badge>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {WISHLIST_ITEMS.map((product) => (
          <Card key={product.id} className="group overflow-hidden border-none shadow-sm hover:shadow-lg transition-all duration-300">
            <Link href={`/product/${product.id}`}>
              <div className="relative aspect-square overflow-hidden bg-muted cursor-pointer">
                <img 
                  src={product.image} 
                  alt={product.name}
                  className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-500"
                />
                <Badge className="absolute top-3 left-3 bg-white/90 text-foreground border-none backdrop-blur-sm pointer-events-none">
                  {product.category}
                </Badge>
              </div>
            </Link>
            <CardContent className="p-4 relative">
              <Button 
                variant="ghost" 
                size="icon" 
                className="absolute -top-12 right-3 z-10 bg-white/90 hover:bg-white text-red-500 rounded-full shadow-sm"
              >
                <Trash2 className="h-4 w-4" />
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
                  <ShoppingCart className="h-4 w-4 mr-2" /> View & Order
                </Link>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
