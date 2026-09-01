import Link from "next/link";
import { Camera, Gift, Sparkles, Image as ImageIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function CategoriesPage() {
  const CATEGORIES = [
    { name: "Photo Frames", slug: "photo-frames", icon: Camera, color: "bg-rose-100 text-rose-600", count: "12 products" },
    { name: "Polaroid Prints", slug: "polaroid-prints", icon: ImageIcon, color: "bg-blue-100 text-blue-600", count: "8 products" },
    { name: "Custom Mugs", slug: "custom-mugs", icon: Gift, color: "bg-amber-100 text-amber-600", count: "15 products" },
    { name: "LED Frames", slug: "led-frames", icon: Sparkles, color: "bg-emerald-100 text-emerald-600", count: "6 products" },
  ];

  return (
    <div className="container mx-auto px-4 md:px-6 py-8">
      <div className="mb-8 flex flex-col gap-2">
        <h1 className="text-4xl font-extrabold tracking-tight">All Categories</h1>
        <p className="text-muted-foreground">Browse all product categories available for custom handcrafted framing & polaroids.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {CATEGORIES.map((cat) => (
          <Link key={cat.slug} href={`/category/${cat.slug}`}>
            <Card className="group cursor-pointer hover:shadow-xl transition-all border-none bg-slate-50 hover:bg-white p-2">
              <CardContent className="p-8 flex flex-col items-center text-center gap-4">
                <div className={`p-6 rounded-full ${cat.color} group-hover:scale-110 transition-transform shadow-sm`}>
                  <cat.icon className="h-10 w-10" />
                </div>
                <div>
                  <h3 className="font-bold text-xl mb-1">{cat.name}</h3>
                  <Badge variant="outline" className="text-muted-foreground">{cat.count}</Badge>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
