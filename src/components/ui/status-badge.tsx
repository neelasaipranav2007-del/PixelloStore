"use client";

import React from "react";
import { Badge } from "@/components/ui/badge";
import { Clock, PackageCheck, Truck, CheckCircle2, AlertTriangle, RefreshCw, Sparkles } from "lucide-react";

export function OrderStatusBadge({ status }: { status: string }) {
  const normalized = (status || "").toLowerCase().trim();

  // 1. Processing (Amber / Soft Yellow pill)
  if (normalized.includes("processing")) {
    return (
      <Badge className="bg-[#FEF3C7] hover:bg-[#FDE68A] text-[#92400E] border border-[#FDE68A] font-bold text-xs px-3 py-1 rounded-full flex items-center gap-1.5 shadow-2xs">
        <Clock className="h-3 w-3 text-[#B45309]" /> Processing
      </Badge>
    );
  }

  // 2. Packed (Soft Sky Blue pill)
  if (normalized.includes("packed")) {
    return (
      <Badge className="bg-[#E0F2FE] hover:bg-[#BAE6FD] text-[#0369A1] border border-[#BAE6FD] font-bold text-xs px-3 py-1 rounded-full flex items-center gap-1.5 shadow-2xs">
        <PackageCheck className="h-3 w-3 text-[#0284C7]" /> Packed
      </Badge>
    );
  }

  // 3. Delivery Picked Up / Out for Delivery (Peach / Light Orange pill)
  if (normalized.includes("picked up") || normalized.includes("out for delivery")) {
    return (
      <Badge className="bg-[#FFEDD5] hover:bg-[#FED7AA] text-[#C2410C] border border-[#FED7AA] font-bold text-xs px-3 py-1 rounded-full flex items-center gap-1.5 shadow-2xs">
        <Truck className="h-3 w-3 text-[#EA580C]" /> Delivery Picked Up
      </Badge>
    );
  }

  // 4. Delivered (Soft Light Green pill)
  if (normalized.includes("delivered")) {
    return (
      <Badge className="bg-[#DCFCE7] hover:bg-[#BBF7D0] text-[#15803D] border border-[#BBF7D0] font-bold text-xs px-3 py-1 rounded-full flex items-center gap-1.5 shadow-2xs">
        <CheckCircle2 className="h-3 w-3 text-[#16A34A]" /> Delivered
      </Badge>
    );
  }

  // 5. Out of Stock / Yet to refill (Solid Deep Crimson Red pill)
  if (normalized.includes("out of stock") || normalized.includes("refill")) {
    return (
      <Badge className="bg-[#B91C1C] hover:bg-[#991B1B] text-white border border-[#991B1B] font-bold text-xs px-3 py-1 rounded-full flex items-center gap-1.5 shadow-xs">
        <AlertTriangle className="h-3 w-3 text-white" /> Out of Stock (Refill Pending)
      </Badge>
    );
  }

  // 6. Replacement / Replacement Requested (Solid Deep Royal Purple pill)
  if (normalized.includes("replacement")) {
    return (
      <Badge className="bg-[#6D28D9] hover:bg-[#5B21B6] text-white border border-[#5B21B6] font-bold text-xs px-3 py-1 rounded-full flex items-center gap-1.5 shadow-xs">
        <RefreshCw className="h-3 w-3 text-white animate-spin-slow" /> Replacement Requested
      </Badge>
    );
  }

  // Default: Printing (Warm Rose Gold pill)
  return (
    <Badge className="bg-[#FFF8F2] hover:bg-[#F2C8B5]/30 text-[#D89A86] border border-[#D89A86]/40 font-bold text-xs px-3 py-1 rounded-full flex items-center gap-1.5 shadow-2xs">
      <Sparkles className="h-3 w-3 text-[#D89A86]" /> Printing
    </Badge>
  );
}
