"use client";

import React from "react";
import { Badge } from "@/components/ui/badge";
import { Clock, PackageCheck, Truck, CheckCircle2, AlertTriangle, RefreshCw, Sparkles, XCircle } from "lucide-react";

export function OrderStatusBadge({ status, isReplacement }: { status: string; isReplacement?: boolean }) {
  const normalized = (status || "").toLowerCase().trim();
  const isRep = isReplacement || normalized.includes("replacement");

  // Replacement Specific Stage Badges
  if (isRep) {
    if (normalized.includes("processing") || normalized.includes("printing")) {
      return (
        <Badge className="bg-purple-100 hover:bg-purple-200 text-purple-950 border border-purple-300 font-bold text-xs px-3 py-1 rounded-full flex items-center gap-1.5 shadow-2xs">
          <RefreshCw className="h-3 w-3 text-purple-700 animate-spin" style={{ animationDuration: "3s" }} />
          <span>🔄 Replacement: In Processing</span>
        </Badge>
      );
    }
    if (normalized.includes("packed")) {
      return (
        <Badge className="bg-purple-100 hover:bg-purple-200 text-purple-950 border border-purple-300 font-bold text-xs px-3 py-1 rounded-full flex items-center gap-1.5 shadow-2xs">
          <PackageCheck className="h-3 w-3 text-purple-700" />
          <span>📦 Replacement: Packed & QA Passed</span>
        </Badge>
      );
    }
    if (normalized.includes("picked up") || normalized.includes("out for delivery")) {
      return (
        <Badge className="bg-purple-100 hover:bg-purple-200 text-purple-950 border border-purple-300 font-bold text-xs px-3 py-1 rounded-full flex items-center gap-1.5 shadow-2xs">
          <Truck className="h-3 w-3 text-purple-700" />
          <span>🚚 Replacement: Out for Delivery</span>
        </Badge>
      );
    }
    if (normalized.includes("delivered")) {
      return (
        <Badge className="bg-emerald-100 hover:bg-emerald-200 text-emerald-950 border border-emerald-300 font-bold text-xs px-3 py-1 rounded-full flex items-center gap-1.5 shadow-2xs">
          <CheckCircle2 className="h-3 w-3 text-emerald-700" />
          <span>✅ Replacement Delivered</span>
        </Badge>
      );
    }
    return (
      <Badge className="bg-[#6D28D9] hover:bg-[#5B21B6] text-white border border-[#5B21B6] font-bold text-xs px-3 py-1 rounded-full flex items-center gap-1.5 shadow-xs">
        <RefreshCw className="h-3 w-3 text-white animate-spin" style={{ animationDuration: "4s" }} />
        <span>🔄 Replacement Requested</span>
      </Badge>
    );
  }

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

  // 5. Cancelled (Soft Rose pill)
  if (normalized.includes("cancelled") || normalized.includes("canceled")) {
    return (
      <Badge className="bg-rose-100 hover:bg-rose-200 text-rose-800 border border-rose-300 font-bold text-xs px-3 py-1 rounded-full flex items-center gap-1.5 shadow-2xs">
        <XCircle className="h-3 w-3 text-rose-600" /> Cancelled
      </Badge>
    );
  }

  // 6. Out of Stock / Yet to refill (Solid Deep Crimson Red pill)
  if (normalized.includes("out of stock") || normalized.includes("refill")) {
    return (
      <Badge className="bg-[#B91C1C] hover:bg-[#991B1B] text-white border border-[#991B1B] font-bold text-xs px-3 py-1 rounded-full flex items-center gap-1.5 shadow-xs">
        <AlertTriangle className="h-3 w-3 text-white" /> Out of Stock (Refill Pending)
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
