"use client";

import React from "react";
import { Badge } from "@/components/ui/badge";
import { 
  Clock, 
  PackageCheck, 
  Truck, 
  CheckCircle2, 
  AlertTriangle, 
  RefreshCw, 
  Sparkles, 
  XCircle,
  CreditCard,
  Check,
  Package,
  ClipboardList,
  Bike,
  Rocket
} from "lucide-react";

export function OrderStatusBadge({ status, isReplacement }: { status: any; isReplacement?: boolean }) {
  const str = typeof status === "string" 
    ? status 
    : (status?.customerStatus || status?.label || status?.name || (status ? String(status) : ""));
  const normalized = str.toLowerCase().trim().replace(/_/g, " ");
  const isRep = isReplacement || normalized.includes("replacement");

  // Replacement Specific Stage Badges
  if (isRep) {
    if (normalized.includes("delivered") || normalized.includes("completed")) {
      return (
        <Badge className="bg-emerald-100 hover:bg-emerald-200 text-emerald-950 border border-emerald-300 font-bold text-xs px-3 py-1 rounded-full flex items-center gap-1.5 shadow-2xs">
          <CheckCircle2 className="h-3 w-3 text-emerald-700" />
          <span>✅ Replacement Delivered</span>
        </Badge>
      );
    }
    if (normalized.includes("out for delivery")) {
      return (
        <Badge className="bg-purple-100 hover:bg-purple-200 text-purple-950 border border-purple-300 font-bold text-xs px-3 py-1 rounded-full flex items-center gap-1.5 shadow-2xs">
          <Rocket className="h-3 w-3 text-purple-700" />
          <span>🚀 Replacement: Out for Delivery</span>
        </Badge>
      );
    }
    if (normalized.includes("in transit") || normalized.includes("shipped") || normalized.includes("picked up")) {
      return (
        <Badge className="bg-blue-100 hover:bg-blue-200 text-blue-950 border border-blue-300 font-bold text-xs px-3 py-1 rounded-full flex items-center gap-1.5 shadow-2xs">
          <Truck className="h-3 w-3 text-blue-700" />
          <span>🚚 Replacement: In Transit</span>
        </Badge>
      );
    }
    if (normalized.includes("ready for delivery") || normalized.includes("packed")) {
      return (
        <Badge className="bg-sky-100 hover:bg-sky-200 text-sky-950 border border-sky-300 font-bold text-xs px-3 py-1 rounded-full flex items-center gap-1.5 shadow-2xs">
          <PackageCheck className="h-3 w-3 text-sky-700" />
          <span>📦 Replacement: Ready for Delivery</span>
        </Badge>
      );
    }
    return (
      <Badge className="bg-purple-100 hover:bg-purple-200 text-purple-950 border border-purple-300 font-bold text-xs px-3 py-1 rounded-full flex items-center gap-1.5 shadow-xs">
        <RefreshCw className="h-3 w-3 text-purple-700 animate-spin" style={{ animationDuration: "3s" }} />
        <span>🔄 Replacement In Progress</span>
      </Badge>
    );
  }

  // 1. Order Placed
  if (normalized === "order placed" || normalized === "placed") {
    return (
      <Badge className="bg-[#FFF8F2] hover:bg-[#F2C8B5]/30 text-[#D89A86] border border-[#D89A86]/40 font-bold text-xs px-3 py-1 rounded-full flex items-center gap-1.5 shadow-2xs">
        <span className="text-xs">📝</span> Order Placed
      </Badge>
    );
  }

  // 2. Payment Confirmed
  if (normalized.includes("payment confirmed")) {
    return (
      <Badge className="bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 font-bold text-xs px-3 py-1 rounded-full flex items-center gap-1.5 shadow-2xs">
        <CreditCard className="h-3 w-3 text-emerald-600" /> Payment Confirmed
      </Badge>
    );
  }

  // 3. Order Confirmed
  if (normalized.includes("order confirmed")) {
    return (
      <Badge className="bg-emerald-100 hover:bg-emerald-200 text-emerald-900 border border-emerald-300 font-bold text-xs px-3 py-1 rounded-full flex items-center gap-1.5 shadow-2xs">
        <Check className="h-3 w-3 text-emerald-700 stroke-[3]" /> Order Confirmed
      </Badge>
    );
  }

  // 4. In Production
  if (
    normalized.includes("in production") || 
    normalized.includes("processing") || 
    normalized.includes("printing") ||
    normalized.includes("preparing")
  ) {
    return (
      <Badge className="bg-amber-100 hover:bg-amber-200 text-amber-900 border border-amber-300 font-bold text-xs px-3 py-1 rounded-full flex items-center gap-1.5 shadow-2xs">
        <span className="text-xs">🖨️</span> In Production
      </Badge>
    );
  }

  // 5. Ready for Delivery
  if (normalized.includes("ready for delivery") || normalized.includes("ready for pickup") || normalized.includes("packed")) {
    return (
      <Badge className="bg-sky-100 hover:bg-sky-200 text-sky-900 border border-sky-300 font-bold text-xs px-3 py-1 rounded-full flex items-center gap-1.5 shadow-2xs">
        <Package className="h-3 w-3 text-sky-600" /> Ready for Delivery
      </Badge>
    );
  }

  // 6. Delivery Assigned
  if (normalized.includes("delivery assigned") || normalized.includes("assigned delivery")) {
    return (
      <Badge className="bg-indigo-100 hover:bg-indigo-200 text-indigo-900 border border-indigo-300 font-bold text-xs px-3 py-1 rounded-full flex items-center gap-1.5 shadow-2xs">
        <ClipboardList className="h-3 w-3 text-indigo-600" /> Delivery Assigned
      </Badge>
    );
  }

  // 7. Picked Up
  if (normalized.includes("picked up")) {
    return (
      <Badge className="bg-orange-100 hover:bg-orange-200 text-orange-900 border border-orange-300 font-bold text-xs px-3 py-1 rounded-full flex items-center gap-1.5 shadow-2xs">
        <Bike className="h-3 w-3 text-orange-600" /> Picked Up
      </Badge>
    );
  }

  // 8. In Transit / Shipped
  if (normalized.includes("in transit") || normalized.includes("shipped")) {
    return (
      <Badge className="bg-blue-100 hover:bg-blue-200 text-blue-900 border border-blue-300 font-bold text-xs px-3 py-1 rounded-full flex items-center gap-1.5 shadow-2xs">
        <Truck className="h-3 w-3 text-blue-600" /> In Transit
      </Badge>
    );
  }

  // 9. Out for Delivery
  if (normalized.includes("out for delivery")) {
    return (
      <Badge className="bg-purple-100 hover:bg-purple-200 text-purple-900 border border-purple-300 font-bold text-xs px-3 py-1 rounded-full flex items-center gap-1.5 shadow-2xs">
        <Rocket className="h-3 w-3 text-purple-600" /> Out for Delivery
      </Badge>
    );
  }

  // 10. Delivered / Completed
  if (normalized.includes("delivered") || normalized.includes("completed")) {
    return (
      <Badge className="bg-emerald-100 hover:bg-emerald-200 text-emerald-900 border border-emerald-300 font-bold text-xs px-3 py-1 rounded-full flex items-center gap-1.5 shadow-2xs">
        <CheckCircle2 className="h-3 w-3 text-emerald-600" /> Delivered
      </Badge>
    );
  }

  // Cancelled
  if (normalized.includes("cancelled") || normalized.includes("canceled")) {
    return (
      <Badge className="bg-rose-100 hover:bg-rose-200 text-rose-800 border border-rose-300 font-bold text-xs px-3 py-1 rounded-full flex items-center gap-1.5 shadow-2xs">
        <XCircle className="h-3 w-3 text-rose-600" /> Cancelled
      </Badge>
    );
  }

  // Default fallback to Order Placed
  return (
    <Badge className="bg-[#FFF8F2] hover:bg-[#F2C8B5]/30 text-[#D89A86] border border-[#D89A86]/40 font-bold text-xs px-3 py-1 rounded-full flex items-center gap-1.5 shadow-2xs">
      <span className="text-xs">📝</span> {str || "Order Placed"}
    </Badge>
  );
}
