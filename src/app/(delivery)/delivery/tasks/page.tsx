"use client";

import { useState } from "react";
import { useOrders } from "@/context/OrderContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Truck, Package, Clock, ChevronRight, MapPin, Search } from "lucide-react";
import Link from "next/link";

export default function DeliveryTasksPage() {
  const { orders } = useOrders();
  const [filter, setFilter] = useState<"ALL" | "ACTIVE" | "COMPLETED">("ALL");
  const [searchQuery, setSearchQuery] = useState("");

  const activeDeliveries = orders.filter(o => o.status === "Out for Delivery" || o.status === "Delivery Picked Up" || o.status === "Printing" || o.status === "Packed");
  const completedDeliveries = orders.filter(o => o.status === "Delivered");

  let filteredList = filter === "ACTIVE" 
    ? activeDeliveries 
    : filter === "COMPLETED" 
      ? completedDeliveries 
      : orders;

  if (searchQuery.trim()) {
    const q = searchQuery.toLowerCase();
    filteredList = filteredList.filter(o => o.id.toLowerCase().includes(q) || (o.customerName || "").toLowerCase().includes(q) || (o.deliveryAddress || "").toLowerCase().includes(q));
  }

  return (
    <div className="space-y-6">
      {/* PC Widescreen Header & Controls */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-3xl border border-[#EFE6DD] shadow-xs">
        <div>
          <h1 className="font-serif-brand text-2xl font-bold text-[#3A2B24]">Delivery Tasks & Queue</h1>
          <p className="text-xs text-[#6C5C54] mt-0.5">Track active doorstep dispatches, pickup studio locations & completed tasks.</p>
        </div>

        {/* Filter Pills */}
        <div className="flex bg-[#FFF8F2] p-1.5 rounded-2xl border border-[#EFE6DD] text-xs font-bold w-full sm:w-auto">
          <button 
            onClick={() => setFilter("ALL")} 
            className={`px-4 py-2 rounded-xl transition-all cursor-pointer ${filter === "ALL" ? "bg-[#3A2B24] text-white shadow-xs" : "text-[#6C5C54] hover:text-[#3A2B24]"}`}
          >
            All Tasks ({orders.length})
          </button>
          <button 
            onClick={() => setFilter("ACTIVE")} 
            className={`px-4 py-2 rounded-xl transition-all cursor-pointer ${filter === "ACTIVE" ? "bg-[#3A2B24] text-white shadow-xs" : "text-[#6C5C54] hover:text-[#3A2B24]"}`}
          >
            Active ({activeDeliveries.length})
          </button>
          <button 
            onClick={() => setFilter("COMPLETED")} 
            className={`px-4 py-2 rounded-xl transition-all cursor-pointer ${filter === "COMPLETED" ? "bg-[#3A2B24] text-white shadow-xs" : "text-[#6C5C54] hover:text-[#3A2B24]"}`}
          >
            Completed ({completedDeliveries.length})
          </button>
        </div>
      </div>

      {/* PC Grid of Task Cards (1 col mobile, 2 cols tablet, 3 cols desktop) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredList.length === 0 ? (
          <div className="col-span-full p-12 text-center bg-white rounded-3xl border border-[#EFE6DD] text-xs text-[#6C5C54] space-y-2">
            <Package className="h-12 w-12 text-[#D89A86] mx-auto opacity-50" />
            <h3 className="font-bold text-base text-[#3A2B24]">No delivery tasks found</h3>
            <p>New assigned orders will appear automatically in your queue.</p>
          </div>
        ) : (
          filteredList.map((order) => (
            <Card key={order.id} className="bg-white border border-[#EFE6DD] rounded-3xl shadow-xs hover:shadow-md transition-all overflow-hidden flex flex-col justify-between">
              <CardContent className="p-6 space-y-4">
                <div className="flex justify-between items-start border-b border-[#EFE6DD] pb-3">
                  <div>
                    <Badge className={`border-none px-3 py-0.5 rounded-full text-xs font-bold ${
                      order.status === "Delivered" ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-900 border border-amber-300"
                    }`}>
                      {order.status}
                    </Badge>
                    <h4 className="font-bold text-base text-[#3A2B24] mt-1.5">{order.id}</h4>
                    <p className="text-xs text-[#6C5C54]">Placed on {order.date}</p>
                  </div>
                  <div className="text-right">
                    <span className="font-extrabold text-lg text-emerald-600">₹85.00</span>
                    <p className="text-[10px] text-[#6C5C54]">Rider Payout</p>
                  </div>
                </div>

                <div className="p-3.5 bg-[#FFF8F2]/60 border border-[#EFE6DD] rounded-2xl text-xs space-y-2">
                  <div>
                    <p className="font-bold text-blue-900 text-[10px] uppercase">Pickup Studio</p>
                    <p className="font-semibold text-[#3A2B24] mt-0.5">{order.assignedStudio || "Pixello Central Warehouse, Powai"}</p>
                  </div>
                  <div>
                    <p className="font-bold text-rose-900 text-[10px] uppercase">Dropoff Address</p>
                    <p className="font-semibold text-[#3A2B24] mt-0.5">
                      {(order.deliveryAddress && order.deliveryAddress.trim() !== "" && order.deliveryAddress.trim() !== "-") ? order.deliveryAddress : "Flat 402, Sunshine Heights, Central Powai Road, Mumbai - 400076"}
                    </p>
                  </div>
                </div>
              </CardContent>

              <div className="p-4 bg-[#FFF8F2] border-t border-[#EFE6DD]">
                <Link href="/delivery">
                  <Button variant="outline" className="w-full rounded-2xl text-xs font-bold border-[#EFE6DD] hover:bg-white text-[#3A2B24] h-10">
                    Open Navigation <ChevronRight className="h-4 w-4 ml-1 text-[#D89A86]" />
                  </Button>
                </Link>
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
