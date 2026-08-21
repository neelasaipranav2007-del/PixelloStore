"use client";

import React, { useState } from "react";
import { useProducts } from "@/context/ProductContext";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Package, Search, Plus, Edit2, AlertTriangle, CheckCircle2 } from "lucide-react";

export default function StudioInventoryPage() {
  const { products, updateProduct } = useProducts();
  const [searchQuery, setSearchQuery] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [newStockVal, setNewStockVal] = useState<number>(0);

  const filteredProducts = products.filter((p) => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;
    return p.name.toLowerCase().includes(q) || p.category.toLowerCase().includes(q) || p.id.toLowerCase().includes(q);
  });

  const handleSaveStock = (id: string) => {
    const autoStatus = newStockVal <= 0 ? "Out of Stock" : (newStockVal <= 5 ? "Low Stock" : "Active");
    updateProduct(id, { stock: newStockVal, status: autoStatus as any });
    setEditingId(null);
  };

  return (
    <div className="flex flex-col gap-6 p-6 bg-[#F8F3EE] min-h-screen">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-serif-brand text-3xl font-bold text-[#3A2B24]">Studio Local Inventory & Materials</h1>
          <p className="text-xs text-[#6C5C54] mt-1">Track photo frame stock, acrylic sheets, mugs, and printing paper levels.</p>
        </div>
        <Badge className="bg-[#FFF8F2] text-[#D89A86] border border-[#D89A86]/30 px-3.5 py-1 text-xs font-bold rounded-full">
          {products.length} Products Tracked
        </Badge>
      </div>

      <Card className="border border-[#EFE6DD] bg-white rounded-3xl shadow-xs overflow-hidden">
        <CardHeader className="border-b border-[#EFE6DD] bg-[#FFF8F2] p-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <CardTitle className="font-serif-brand text-xl font-bold text-[#3A2B24]">Material & Frame Stock Levels</CardTitle>
              <CardDescription className="text-xs text-[#6C5C54]">Update stock quantities directly to reflect studio inventory.</CardDescription>
            </div>
            <div className="relative w-full sm:w-72">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#6C5C54]" />
              <Input
                type="text"
                placeholder="Search products or frames..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 rounded-full border-[#EFE6DD] bg-white text-xs font-medium"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-6">
          <div className="overflow-x-auto border border-[#EFE6DD] rounded-2xl">
            <table className="w-full text-sm text-left">
              <thead className="text-[11px] font-bold text-[#6C5C54] uppercase tracking-wider bg-[#FFF8F2] border-b border-[#EFE6DD]">
                <tr>
                  <th className="px-4 py-3.5">Product ID</th>
                  <th className="px-4 py-3.5">Product Item</th>
                  <th className="px-4 py-3.5">Category</th>
                  <th className="px-4 py-3.5">Price</th>
                  <th className="px-4 py-3.5">Studio Stock</th>
                  <th className="px-4 py-3.5">Stock Status</th>
                  <th className="px-4 py-3.5 text-right">Quick Edit</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#EFE6DD]">
                {filteredProducts.map((product) => (
                  <tr key={product.id} className="hover:bg-[#FFF8F2]/50 transition-colors">
                    <td className="px-4 py-4 font-bold text-[#3A2B24] whitespace-nowrap">{product.id}</td>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-3">
                        <img src={product.image} alt={product.name} className="h-10 w-10 rounded-lg object-cover border border-[#EFE6DD]" />
                        <span className="font-bold text-[#3A2B24]">{product.name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-4 text-xs font-medium text-[#6C5C54]">{product.category}</td>
                    <td className="px-4 py-4 font-extrabold text-[#D89A86]">₹{product.price}</td>
                    <td className="px-4 py-4 font-bold text-[#3A2B24]">
                      {editingId === product.id ? (
                        <Input
                          type="number"
                          value={newStockVal}
                          onChange={(e) => setNewStockVal(parseInt(e.target.value) || 0)}
                          className="w-20 h-8 text-xs rounded-lg border-[#D89A86]"
                        />
                      ) : (
                        <span>{product.stock ?? 0} units</span>
                      )}
                    </td>
                    <td className="px-4 py-4">
                      <Badge className={
                        product.status === "Out of Stock" ? "bg-red-100 text-red-800 border-none text-xs" :
                        product.status === "Low Stock" ? "bg-amber-100 text-amber-800 border-none text-xs" :
                        "bg-emerald-100 text-emerald-800 border-none text-xs"
                      }>
                        {product.status}
                      </Badge>
                    </td>
                    <td className="px-4 py-4 text-right">
                      {editingId === product.id ? (
                        <Button size="sm" onClick={() => handleSaveStock(product.id)} className="btn-pixello-primary text-xs h-8 rounded-full font-bold px-3">
                          Save
                        </Button>
                      ) : (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setEditingId(product.id);
                            setNewStockVal(product.stock ?? 0);
                          }}
                          className="text-xs h-8 rounded-full border-[#EFE6DD] hover:bg-[#FFF8F2]"
                        >
                          Update
                        </Button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
