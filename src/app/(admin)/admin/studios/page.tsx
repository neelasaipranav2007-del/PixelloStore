"use client";

import React from "react";
import Link from "next/link";
import { Store, ArrowRight, ShieldCheck, MapPin, Package, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function AdminStudiosPage() {
  const fulfillmentHubs = [
    { id: "HUB-MUMBAI", name: "Pixello Central Powai Hub", location: "Powai, Mumbai (400076)", type: "Primary Print & Dispatch Center", status: "ACTIVE" },
    { id: "HUB-HYD", name: "Pixello Hyderabad Hub", location: "Hastinapuram, Hyderabad (500070)", type: "Regional Fulfillment Center", status: "ACTIVE" },
  ];

  return (
    <div className="space-y-8 animate-in fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#EFE6DD] pb-6">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="font-serif-brand font-bold text-3xl text-[#3A2B24]">Fulfillment Centers & Locations</h1>
            <Badge className="bg-blue-100 text-blue-900 border-blue-300 font-bold text-xs rounded-full">
              Direct Admin Managed
            </Badge>
          </div>
          <p className="text-xs text-[#6C5C54] mt-1 font-medium">
            Photo Studio Portal has been retired. All order crafting, production, and carrier dispatches are managed centrally.
          </p>
        </div>

        <Link 
          href="/admin/orders"
          className="btn-pixello-primary rounded-full text-xs font-bold h-11 px-6 flex items-center gap-2 shadow-xs cursor-pointer"
        >
          <FileText className="h-4 w-4" /> Manage All Orders
        </Link>
      </div>

      {/* Notice Banner */}
      <div className="p-5 bg-gradient-to-r from-[#FFF8F2] to-[#FAF7F4] border border-[#EFE6DD] rounded-3xl flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-2xs">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-[#D89A86]/10 text-[#D89A86] rounded-2xl flex-shrink-0">
            <ShieldCheck className="h-7 w-7" />
          </div>
          <div>
            <h3 className="font-bold text-sm text-[#3A2B24]">Direct Fulfillment Architecture Active</h3>
            <p className="text-xs text-[#6C5C54] mt-0.5 max-w-xl">
              Orders now flow directly: Customer Checkout ➔ Razorpay Payment ➔ Admin Processing ➔ Express Delivery Fleet ➔ Customer Doorstep.
            </p>
          </div>
        </div>

        <Link 
          href="/admin/orders"
          className="rounded-full border border-[#EFE6DD] text-xs font-bold h-10 px-5 text-[#3A2B24] hover:bg-white flex items-center gap-1.5 flex-shrink-0 transition-colors cursor-pointer"
        >
          View Live Order Queue <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>

      {/* Active Warehouses Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {fulfillmentHubs.map((hub) => (
          <Card key={hub.id} className="border border-[#EFE6DD] bg-white rounded-3xl shadow-xs overflow-hidden">
            <CardContent className="p-6 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 bg-[#FFF8F2] text-[#D89A86] rounded-xl border border-[#EFE6DD]">
                    <Store className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-base text-[#3A2B24]">{hub.name}</h3>
                    <span className="text-[11px] text-[#6C5C54] font-medium flex items-center gap-1 mt-0.5">
                      <MapPin className="h-3.5 w-3.5 text-[#D89A86]" /> {hub.location}
                    </span>
                  </div>
                </div>
                <Badge className="bg-emerald-100 text-emerald-900 border-emerald-300 font-bold text-[10px] rounded-full">
                  {hub.status}
                </Badge>
              </div>

              <div className="p-3 bg-[#FAF7F4] border border-[#EFE6DD] rounded-2xl text-xs text-[#6C5C54] flex items-center justify-between">
                <span>Hub Type: <strong className="text-[#3A2B24]">{hub.type}</strong></span>
                <span className="text-emerald-700 font-bold">Express Hub Active</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
