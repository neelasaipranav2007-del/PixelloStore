"use client";

import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useOrders, OrderStatus, Order } from "@/context/OrderContext";
import { OrderStatusBadge } from "@/components/ui/status-badge";
import { ChevronDown, Search, X, Eye, Download, FileText, Image as ImageIcon, MessageCircle, Upload, Package, Check, Paperclip, Truck, Bike, Gift, User, Phone, Store, Calendar, MapPin, RefreshCw } from "lucide-react";

const STATUS_CONFIG: Record<string, { label: string; symbol: string; badgeClass: string; dotClass: string; itemBgClass: string }> = {
  "Processing": { label: "Processing", symbol: "⏳", badgeClass: "bg-amber-100 text-amber-900 border-amber-300", dotClass: "bg-amber-500", itemBgClass: "bg-amber-50/90 hover:bg-amber-100/90 border-amber-200 text-amber-950" },
  "Packed": { label: "Packed", symbol: "📦", badgeClass: "bg-sky-100 text-sky-900 border-sky-300", dotClass: "bg-sky-500", itemBgClass: "bg-sky-50/90 hover:bg-sky-100/90 border-sky-200 text-sky-950" },
  "Out for Delivery": { label: "Out for Delivery", symbol: "🚚", badgeClass: "bg-blue-100 text-blue-900 border-blue-300", dotClass: "bg-blue-600", itemBgClass: "bg-blue-50/90 hover:bg-blue-100/90 border-blue-200 text-blue-950" },
  "Delivered": { label: "Delivered", symbol: "✅", badgeClass: "bg-emerald-100 text-emerald-900 border-emerald-300", dotClass: "bg-emerald-600", itemBgClass: "bg-emerald-50/90 hover:bg-emerald-100/90 border-emerald-200 text-emerald-950" },
  "Replacement Requested": { label: "Replacement Requested", symbol: "🔄", badgeClass: "bg-purple-100 text-purple-900 border-purple-300", dotClass: "bg-purple-600", itemBgClass: "bg-purple-50/90 hover:bg-purple-100/90 border-purple-200 text-purple-950" },
  "Cancelled": { label: "Cancelled", symbol: "❌", badgeClass: "bg-slate-100 text-slate-900 border-slate-300", dotClass: "bg-slate-500", itemBgClass: "bg-slate-100/80 hover:bg-slate-200/80 border-slate-300 text-slate-950" },
};

const normalizeStatus = (status?: string): string => {
  if (!status) return "Processing";
  const s = status.trim().toUpperCase();
  if (s === "CANCELLED" || s === "CANCELED") return "Cancelled";
  if (s === "DELIVERED") return "Delivered";
  if (s === "REPLACEMENT REQUESTED" || s === "REPLACEMENT" || s === "REPLACEMENT_REQUESTED") return "Replacement Requested";
  if (s === "PACKED" || s === "QUALITY_CHECK") return "Packed";
  if (s === "OUT FOR DELIVERY" || s === "OUT_FOR_DELIVERY" || s === "DELIVERY PICKED UP" || s === "PICKED_UP") return "Out for Delivery";
  if (s === "PROCESSING" || s === "PLACED" || s === "PRINTING" || s === "OUT OF STOCK" || s === "OUT_OF_STOCK") return "Processing";

  const match = Object.keys(STATUS_CONFIG).find((k) => k.toUpperCase() === s);
  return match || "Processing";
};

const getStatusConfig = (status: string) => {
  const norm = normalizeStatus(status);
  return STATUS_CONFIG[norm] || STATUS_CONFIG["Processing"];
};

const STATUS_TABS: { id: string; label: string; symbol: string; activeClass: string }[] = [
  { id: "ALL", label: "All Orders", symbol: "📊", activeClass: "bg-[#3A2B24] text-white" },
  { id: "Processing", label: "Processing", symbol: "⏳", activeClass: "bg-amber-600 text-white" },
  { id: "Packed", label: "Packed", symbol: "📦", activeClass: "bg-sky-600 text-white" },
  { id: "Out for Delivery", label: "Out for Delivery", symbol: "🚚", activeClass: "bg-blue-600 text-white" },
  { id: "Delivered", label: "Delivered", symbol: "✅", activeClass: "bg-emerald-600 text-white" },
  { id: "Replacement Requested", label: "Replacement", symbol: "🔄", activeClass: "bg-purple-600 text-white" },
  { id: "Cancelled", label: "Cancelled", symbol: "❌", activeClass: "bg-slate-700 text-white" },
];

const getItemPhotosList = (item: { image?: string; photos?: string[]; quantity?: number; name?: string; size?: string }) => {
  // If item has explicit custom uploaded photos from customer
  if (item?.photos && Array.isArray(item.photos) && item.photos.length > 0) {
    const customPhotos = item.photos.filter((p: any) => typeof p === "string" && (p.startsWith("data:") || p.startsWith("blob:") || (p.startsWith("http") && !p.includes("images.unsplash.com"))));
    if (customPhotos.length > 0) {
      return { photos: customPhotos, isCustomUploaded: true };
    }
  }

  // If item image is a custom user upload (data URL or blob)
  if (item?.image && (item.image.startsWith("data:") || item.image.startsWith("blob:"))) {
    return { photos: [item.image], isCustomUploaded: true };
  }

  // Standard gift / catalog item without uploaded custom photos
  const defaultImage = item?.image || "https://images.unsplash.com/photo-1513519245088-0e12902e5a38?w=800&q=80";
  return { photos: [defaultImage], isCustomUploaded: false };
};

export default function AdminOrdersPage() {
  const { orders, updateOrderStatus, updateOrderDetails } = useOrders();
  const [searchQuery, setSearchQuery] = useState("");
  const [activeStatusTab, setActiveStatusTab] = useState<string>("ALL");
  const [orderDeliveryTypes, setOrderDeliveryTypes] = useState<Record<string, "Direct Delivery" | "Shipping">>(() => {
    if (typeof window !== "undefined") {
      try {
        const saved = localStorage.getItem("pixello_order_delivery_types_v3");
        if (saved) return JSON.parse(saved);
      } catch (e) {
        console.error(e);
      }
    }
    return {};
  });
  const [openStatusDropdownId, setOpenStatusDropdownId] = useState<string | null>(null);

  useEffect(() => {
    const syncDeliveryTypes = () => {
      if (typeof window !== "undefined") {
        try {
          const saved = localStorage.getItem("pixello_order_delivery_types_v3");
          if (saved) setOrderDeliveryTypes(JSON.parse(saved));
        } catch (e) {
          console.error(e);
        }
      }
    };
    window.addEventListener("pixello_orders_updated", syncDeliveryTypes);
    window.addEventListener("storage", syncDeliveryTypes);
    return () => {
      window.removeEventListener("pixello_orders_updated", syncDeliveryTypes);
      window.removeEventListener("storage", syncDeliveryTypes);
    };
  }, []);

  // Financial Breakdown calculations (Matching Pic 1 into Pic 2)
  const deliveredOrders = orders.filter((o) => normalizeStatus(o.status) === "Delivered");
  const deliveredCount = deliveredOrders.length;
  const deliveredAmount = deliveredOrders.reduce((sum, o) => sum + o.totalAmount, 0);

  const replacementOrders = orders.filter((o) => normalizeStatus(o.status) === "Replacement Requested");
  const replacementCount = replacementOrders.length;
  const replacementAmount = replacementOrders.reduce((sum, o) => sum + o.totalAmount, 0);

  const cancelledOrders = orders.filter((o) => normalizeStatus(o.status) === "Cancelled");
  const cancelledCount = cancelledOrders.length;
  const cancelledAmount = cancelledOrders.reduce((sum, o) => sum + o.totalAmount, 0);

  const activeOrders = orders.filter((o) => {
    const norm = normalizeStatus(o.status);
    return norm !== "Delivered" && norm !== "Cancelled" && norm !== "Replacement Requested";
  });
  const activeCount = activeOrders.length;
  const activeAmount = activeOrders.reduce((sum, o) => sum + o.totalAmount, 0);

  const getDeliveryType = (order: Order): "Direct Delivery" | "Shipping" => {
    if (orderDeliveryTypes[order.id]) {
      return orderDeliveryTypes[order.id];
    }
    if (order.deliveryType) {
      return order.deliveryType;
    }
    return "Direct Delivery";
  };

  const handleSelectDeliveryType = (orderId: string, type: "Direct Delivery" | "Shipping") => {
    setOrderDeliveryTypes((prev) => {
      const updated = { ...prev, [orderId]: type };
      if (typeof window !== "undefined") {
        try {
          localStorage.setItem("pixello_order_delivery_types_v3", JSON.stringify(updated));
        } catch (e) {
          console.error(e);
        }
      }
      return updated;
    });
    updateOrderDetails(orderId, { deliveryType: type });
  };

  const handleStatusChange = (orderId: string, newStatus: OrderStatus) => {
    const order = orders.find(o => o.id === orderId);
    const isRep = order?.status === "Replacement Requested" || (order?.history && order.history.some((h: any) => h.status === "Replacement Requested" || (h.note && h.note.includes("Replacement"))));
    
    let note = `Status updated to ${newStatus}`;
    if (isRep) {
      if (newStatus === "Processing") note = "Replacement in Production / Re-Printing in Studio";
      else if (newStatus === "Packed") note = "Replacement Quality Check Passed & Protective Packed";
      else if (newStatus === "Out for Delivery") note = "Replacement Out for Doorstep Handover";
      else if (newStatus === "Delivered") note = "Replacement Delivered Successfully to Customer";
      else if (newStatus === "Replacement Requested") note = "Replacement Requested by Admin / Customer";
    }
    updateOrderStatus(orderId, newStatus, note);
  };

  const [previewModal, setPreviewModal] = useState<{
    isOpen: boolean;
    orderId: string;
    customerName: string;
    customerPhone: string;
    itemName: string;
    itemSize: string;
    photos: string[];
    activePhotoIdx: number;
    assignedStudio: string;
  } | null>(null);

  const filteredOrders = orders.filter((order) => {
    const normOrderStatus = normalizeStatus(order.status);
    const q = searchQuery.toLowerCase().trim();

    // 1. Search Query filter (matches across all orders regardless of status tab)
    if (q) {
      const cleanQ = q.replace(/[^a-zA-Z0-9]/g, "");
      const cleanId = (order.id || "").toLowerCase().replace(/[^a-zA-Z0-9]/g, "");
      const cleanPhone = (order.customerPhone || "").replace(/\D/g, "");
      const cleanQDigits = q.replace(/\D/g, "");

      const matchesSearch =
        order.id.toLowerCase().includes(q) ||
        (cleanQ.length > 0 && cleanId.includes(cleanQ)) ||
        order.customerName.toLowerCase().includes(q) ||
        order.customerPhone.toLowerCase().includes(q) ||
        (cleanQDigits.length > 0 && cleanPhone.includes(cleanQDigits)) ||
        order.assignedStudio.toLowerCase().includes(q) ||
        order.status.toLowerCase().includes(q) ||
        (order.deliveryAddress && order.deliveryAddress.toLowerCase().includes(q)) ||
        (order.trackingAwb && order.trackingAwb.toLowerCase().includes(q)) ||
        (order.items && order.items.some((it: any) => it.name?.toLowerCase().includes(q) || it.size?.toLowerCase().includes(q)));

      return matchesSearch;
    }

    // 2. Filter by Status Tab Section (when no search query is typed)
    if (activeStatusTab !== "ALL") {
      const normTabStatus = normalizeStatus(activeStatusTab);
      if (normOrderStatus !== normTabStatus) return false;
    }

    return true;
  });

  const handleFileUpload = (orderId: string, field: "invoiceUrl" | "shippingLabelUrl", event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      updateOrderDetails(orderId, {
        [field]: result.startsWith("data:") ? file.name : result,
      });
    };
    reader.readAsDataURL(file);
  };

  const handleSendMessageWhatsApp = (order: Order) => {
    const cleanPhone = order.customerPhone.replace(/[^0-9]/g, "");
    const formattedPhone = cleanPhone.startsWith("91") ? cleanPhone : `91${cleanPhone}`;
    const statusText = order.status;
    const trackingInfo = order.trackingAwb ? `\nTracking AWB: ${order.trackingAwb}` : "";
    const msg = encodeURIComponent(
      `Hello ${order.customerName},\n\nYour Pixello Order *#${order.id}* status has been updated to: *${statusText}*!${trackingInfo}\n\nTotal Amount: ₹${order.totalAmount.toFixed(2)}\nDelivery Address: ${order.deliveryAddress}\n\nThank you for choosing Pixello Store! ✨`
    );
    window.open(`https://wa.me/${formattedPhone}?text=${msg}`, "_blank");
  };

  return (
    <div className="flex flex-col gap-6 p-6 bg-[#F8F3EE] min-h-screen">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="font-serif-brand text-3xl font-bold text-[#3A2B24]">Orders Management</h2>
          <p className="text-xs text-[#6C5C54] mt-1">Real-time status tracking, shipping labels, invoices & customer notifications.</p>
        </div>
        <div className="flex items-center gap-3">
          {/* Search Bar */}
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#6C5C54]" />
            <Input
              type="text"
              placeholder="Search order ID, name, AWB..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                if (e.target.value.trim() && activeStatusTab !== "ALL") {
                  setActiveStatusTab("ALL");
                }
              }}
              className="pl-9 pr-8 rounded-full border-[#EFE6DD] bg-white text-xs font-medium text-[#3A2B24] focus-visible:ring-[#D89A86]"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-[#6C5C54] hover:text-[#3A2B24] p-0.5"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
          <Badge className="bg-[#FFF8F2] text-[#D89A86] border border-[#D89A86]/30 px-3.5 py-1.5 text-xs font-bold rounded-full whitespace-nowrap shadow-2xs">
            {orders.length} Total Orders
          </Badge>
        </div>
      </div>

      {/* 📊 Order Status & Revenue Financial Breakdown Section (Matching Pic 1 into Pic 2) */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center gap-2">
          <span className="text-base">📊</span>
          <h3 className="font-serif-brand text-lg font-bold text-[#3A2B24]">
            Order Status &amp; Revenue Financial Breakdown
          </h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {/* Card 1: DELIVERED ORDERS (Green) */}
          <Card className="border-2 border-emerald-300 bg-emerald-50/50 rounded-3xl shadow-2xs hover:shadow-md transition-all">
            <CardContent className="p-5 flex flex-col justify-between h-full min-h-[120px]">
              <div className="flex items-center justify-between gap-2 mb-1">
                <span className="text-[11px] font-extrabold text-emerald-800 uppercase tracking-wider flex items-center gap-1.5">
                  <span className="text-xs">✅</span> DELIVERED ORDERS
                </span>
              </div>
              <div>
                <div suppressHydrationWarning className="text-2xl sm:text-3xl font-black text-emerald-700 tracking-tight">
                  ₹{deliveredAmount.toLocaleString("en-IN", { minimumFractionDigits: 0, maximumFractionDigits: 2 })}
                </div>
                <div className="text-xs font-bold text-emerald-600 mt-1">
                  {deliveredCount} {deliveredCount === 1 ? "Order Delivered" : "Orders Delivered"}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Card 2: REPLACEMENT ORDERS (Purple) */}
          <Card className="border-2 border-purple-300 bg-purple-50/50 rounded-3xl shadow-2xs hover:shadow-md transition-all">
            <CardContent className="p-5 flex flex-col justify-between h-full min-h-[120px]">
              <div className="flex items-center justify-between gap-2 mb-1">
                <span className="text-[11px] font-extrabold text-purple-800 uppercase tracking-wider flex items-center gap-1.5">
                  <span className="text-xs">🔄</span> REPLACEMENT ORDERS
                </span>
              </div>
              <div>
                <div suppressHydrationWarning className="text-2xl sm:text-3xl font-black text-purple-700 tracking-tight">
                  ₹{replacementAmount.toLocaleString("en-IN", { minimumFractionDigits: 0, maximumFractionDigits: 2 })}
                </div>
                <div className="text-xs font-bold text-purple-600 mt-1">
                  {replacementCount} {replacementCount === 1 ? "Order Replaced" : "Orders Replaced"}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Card 3: CANCELLED ORDERS (Red/Rose) */}
          <Card className="border-2 border-rose-300 bg-rose-50/50 rounded-3xl shadow-2xs hover:shadow-md transition-all">
            <CardContent className="p-5 flex flex-col justify-between h-full min-h-[120px]">
              <div className="flex items-center justify-between gap-2 mb-1">
                <span className="text-[11px] font-extrabold text-rose-800 uppercase tracking-wider flex items-center gap-1.5">
                  <span className="text-xs">❌</span> CANCELLED ORDERS
                </span>
              </div>
              <div>
                <div suppressHydrationWarning className="text-2xl sm:text-3xl font-black text-rose-700 tracking-tight">
                  ₹{cancelledAmount.toLocaleString("en-IN", { minimumFractionDigits: 0, maximumFractionDigits: 2 })}
                </div>
                <div className="text-xs font-bold text-rose-600 mt-1">
                  {cancelledCount} {cancelledCount === 1 ? "Order Cancelled" : "Orders Cancelled"}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Card 4: ACTIVE / PENDING ORDERS (Amber) */}
          <Card className="border-2 border-amber-300 bg-amber-50/50 rounded-3xl shadow-2xs hover:shadow-md transition-all">
            <CardContent className="p-5 flex flex-col justify-between h-full min-h-[120px]">
              <div className="flex items-center justify-between gap-2 mb-1">
                <span className="text-[11px] font-extrabold text-amber-800 uppercase tracking-wider flex items-center gap-1.5">
                  <span className="text-xs">⏳</span> ACTIVE / PENDING ORDERS
                </span>
              </div>
              <div>
                <div suppressHydrationWarning className="text-2xl sm:text-3xl font-black text-amber-700 tracking-tight">
                  ₹{activeAmount.toLocaleString("en-IN", { minimumFractionDigits: 0, maximumFractionDigits: 2 })}
                </div>
                <div className="text-xs font-bold text-amber-600 mt-1">
                  {activeCount} {activeCount === 1 ? "Order In Progress" : "Orders In Progress"}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Sticky Status Sections Segmented Bar */}
      <div className="sticky top-0 z-30 bg-[#F8F3EE]/95 backdrop-blur-md py-2.5 -my-2.5">
        <div className="bg-white p-1.5 rounded-2xl border border-[#EFE6DD] shadow-sm flex items-center justify-between gap-1 w-full overflow-hidden">
          {STATUS_TABS.map((tab) => {
            let count = 0;
            if (tab.id === "ALL") {
              count = orders.length;
            } else {
              const normTab = normalizeStatus(tab.id);
              count = orders.filter((o) => normalizeStatus(o.status) === normTab).length;
            }

            const isActive = activeStatusTab === tab.id;

            return (
              <button
                key={tab.id}
                onClick={() => setActiveStatusTab(tab.id)}
                className={`flex-1 py-2 px-2 rounded-xl text-xs font-bold transition-all duration-200 flex items-center justify-center gap-1.5 whitespace-nowrap cursor-pointer ${
                  isActive
                    ? "bg-[#3A2B24] text-white shadow-sm font-extrabold"
                    : "text-[#6C5C54] hover:text-[#3A2B24] hover:bg-[#FAF7F4]"
                }`}
              >
                <span className="text-sm leading-none flex-shrink-0">{tab.symbol}</span>
                <span className="text-[11px] sm:text-xs font-bold">{tab.label}</span>
                <span
                  className={`px-1.5 py-0.5 rounded-full text-[10px] font-black flex-shrink-0 ${
                    isActive
                      ? "bg-[#D89A86] text-white"
                      : "bg-[#F8F3EE] text-[#6C5C54] border border-[#EFE6DD]"
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Orders List Container - PIC 1 ORDER CARDS FORMAT */}
      <div className="flex flex-col gap-6">
        {filteredOrders.length === 0 ? (
          <div className="bg-white rounded-3xl border border-[#EFE6DD] p-12 text-center flex flex-col items-center justify-center gap-2">
            <Package className="h-10 w-10 text-[#D89A86]/60 mb-2" />
            <h3 className="font-serif-brand font-bold text-lg text-[#3A2B24]">No Orders Found</h3>
            <p className="text-xs text-[#6C5C54] max-w-md">
              {searchQuery
                ? `No orders match your search term "${searchQuery}". Try clearing search.`
                : "No customer orders have been placed yet."}
            </p>
            {searchQuery && (
              <Button
                variant="outline"
                onClick={() => setSearchQuery("")}
                className="mt-3 rounded-full text-xs font-bold border-[#EFE6DD] text-[#3A2B24]"
              >
                Clear Search Query
              </Button>
            )}
          </div>
        ) : (
          filteredOrders.map((order, idx) => (
            <div
              key={`${order.id}-${idx}`}
              className="bg-white rounded-3xl border border-[#EFE6DD] shadow-sm p-6 flex flex-col gap-5 hover:shadow-md transition-shadow"
            >
              {/* ORDER HEADER (Matching Pic 1: Order # ID, Method, Amount, Status Dropdown) */}
              {(() => {
                const isReplacementOrder = order.status === "Replacement Requested" || (order.history && order.history.some((h: any) => h.status === "Replacement Requested" || (h.note && h.note.includes("Replacement"))));
                return (
                  <div className="flex flex-col gap-3 pb-4 border-b border-[#EFE6DD]">
                    {isReplacementOrder && (
                      <div className="w-full p-2.5 bg-purple-50 border border-purple-200 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-2 shadow-2xs">
                        <div className="flex items-center gap-2">
                          <RefreshCw className="h-4 w-4 text-purple-700 animate-spin" style={{ animationDuration: "3s" }} />
                          <span className="text-xs font-black text-purple-950">
                            🔄 REPLACEMENT ORDER ACTIVE
                          </span>
                          <span className="text-[10px] font-extrabold text-purple-900 bg-purple-100/90 border border-purple-300 px-2 py-0.5 rounded-full">
                            Current Stage: {order.status}
                          </span>
                        </div>
                        <span className="text-[10px] text-purple-700 font-semibold italic">
                          Progressing through fresh re-fulfillment &amp; doorstep delivery
                        </span>
                      </div>
                    )}

                    <div className="flex flex-wrap items-center justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <h3 className="font-sans font-extrabold text-lg sm:text-xl text-[#3A2B24]">
                          Order #{order.id}
                        </h3>
                        <span className="text-xs font-medium text-[#6C5C54]">
                          Method: <span className="font-bold text-[#3A2B24]">{order.paymentMethod || "COD"}</span>
                        </span>
                      </div>

                      <div className="flex flex-wrap items-center gap-3">
                        {/* Delivery Mode Toggle (Direct Delivery vs Shipping) */}
                        <div className="flex items-center gap-1 p-1 bg-[#FFF8F2] border border-[#EFE6DD] rounded-full text-xs font-bold shadow-2xs">
                          <button
                            type="button"
                            onClick={() => handleSelectDeliveryType(order.id, "Direct Delivery")}
                            className={`px-3.5 py-1.5 rounded-full flex items-center gap-1.5 transition-all cursor-pointer ${
                              getDeliveryType(order) === "Direct Delivery"
                                ? "bg-[#D96B00] text-white shadow-xs font-bold"
                                : "text-[#6C5C54] hover:text-[#3A2B24] hover:bg-white/60 font-semibold"
                            }`}
                          >
                            <Bike className="h-3.5 w-3.5" />
                            <span>Direct Delivery</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => handleSelectDeliveryType(order.id, "Shipping")}
                            className={`px-3.5 py-1.5 rounded-full flex items-center gap-1.5 transition-all cursor-pointer ${
                              getDeliveryType(order) === "Shipping"
                                ? "bg-[#D96B00] text-white shadow-xs font-bold"
                                : "text-[#6C5C54] hover:text-[#3A2B24] hover:bg-white/60 font-semibold"
                            }`}
                          >
                            <Truck className="h-3.5 w-3.5" />
                            <span>Shipping</span>
                          </button>
                        </div>

                        {/* Order Total Price */}
                        <span className="font-extrabold text-xl text-pink-600">
                          ₹{order.totalAmount.toLocaleString("en-IN", { minimumFractionDigits: 0, maximumFractionDigits: 2 })}
                        </span>

                        {/* Custom Order Status Select Dropdown with Direct Buttons & Popover */}
                        <div className="relative">
                          <button
                            type="button"
                            onClick={() => setOpenStatusDropdownId(openStatusDropdownId === order.id ? null : order.id)}
                            className={`h-9 px-3 text-xs font-extrabold rounded-xl border flex items-center gap-2 shadow-2xs transition-all hover:scale-102 cursor-pointer ${
                              isReplacementOrder ? "bg-purple-100 text-purple-950 border-purple-300" : getStatusConfig(order.status).badgeClass
                            }`}
                          >
                            <span className="text-sm">{isReplacementOrder ? "🔄" : getStatusConfig(order.status).symbol}</span>
                            <span>{isReplacementOrder ? `Replacement: ${order.status}` : getStatusConfig(order.status).label}</span>
                            <ChevronDown className="h-3.5 w-3.5 opacity-60 ml-0.5" />
                          </button>

                          {openStatusDropdownId === order.id && (
                            <>
                              <div
                                className="fixed inset-0 z-40"
                                onClick={() => setOpenStatusDropdownId(null)}
                              />
                              <div className="absolute right-0 top-11 w-68 p-1.5 rounded-2xl border-[#EFE6DD] shadow-2xl bg-white space-y-1 z-50 animate-in fade-in duration-150">
                                <div className="px-3 py-1.5 text-[10px] font-bold text-[#6C5C54] uppercase tracking-wider border-b border-[#EFE6DD]">
                                  {isReplacementOrder ? "🔄 Update Replacement Stage" : "Select Order Status"}
                                </div>
                                {Object.entries(STATUS_CONFIG).map(([stKey, cfg]) => {
                                  const isSelected = normalizeStatus(order.status) === stKey;
                                  let stageDisplayLabel = cfg.label;
                                  if (isReplacementOrder) {
                                    if (stKey === "Processing") stageDisplayLabel = "Replacement: In Processing";
                                    else if (stKey === "Packed") stageDisplayLabel = "Replacement: Packed (QA Passed)";
                                    else if (stKey === "Out for Delivery") stageDisplayLabel = "Replacement: Out for Delivery";
                                    else if (stKey === "Delivered") stageDisplayLabel = "Replacement: Delivered";
                                  }

                                  return (
                                    <button
                                      key={stKey}
                                      type="button"
                                      onClick={() => {
                                        handleStatusChange(order.id, stKey as OrderStatus);
                                        setOpenStatusDropdownId(null);
                                      }}
                                      className={`w-full flex items-center justify-between p-2.5 my-1 rounded-xl cursor-pointer border transition-all text-left ${cfg.itemBgClass} ${
                                        isSelected ? "ring-2 ring-offset-1 ring-[#D89A86] font-extrabold shadow-2xs" : "font-semibold opacity-95 hover:opacity-100"
                                      }`}
                                    >
                                      <div className="flex items-center gap-2.5">
                                        <span className="text-base">{cfg.symbol}</span>
                                        <span className="text-xs font-bold">{stageDisplayLabel}</span>
                                      </div>
                                      <span className={`h-3 w-3 rounded-full ${cfg.dotClass} shadow-2xs border border-white/60`} />
                                    </button>
                                  );
                                })}
                              </div>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })()}

              {/* ORDERED ITEMS SECTION */}
              <div className="flex flex-col gap-2.5">
                <span className="text-xs font-bold text-[#6C5C54]">Ordered Items / Photos:</span>
                <div className="flex flex-col gap-2.5">
                  {order.items.map((item, idx) => {
                    const { photos: photoList, isCustomUploaded } = getItemPhotosList(item);
                    return (
                      <div
                        key={idx}
                        className="p-3 bg-[#FAF7F4] border border-[#EFE6DD] rounded-2xl flex items-center justify-between gap-4 shadow-2xs"
                      >
                        <div className="flex items-center gap-3.5 min-w-0">
                          {/* Thumbnail preview */}
                          <div
                            onClick={() =>
                              setPreviewModal({
                                isOpen: true,
                                orderId: order.id,
                                customerName: order.customerName,
                                customerPhone: order.customerPhone,
                                itemName: item.name,
                                itemSize: item.size,
                                photos: photoList,
                                activePhotoIdx: 0,
                                assignedStudio: order.assignedStudio,
                              })
                            }
                            className="relative h-14 w-14 rounded-xl overflow-hidden border border-[#EFE6DD] bg-white flex-shrink-0 cursor-pointer group shadow-2xs"
                          >
                            <img src={photoList[0]} alt={item.name} className="h-full w-full object-cover group-hover:scale-105 transition-transform" />
                            <div className="absolute inset-0 bg-black/25 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                              <Eye className="h-4 w-4 text-white drop-shadow-sm" />
                            </div>
                          </div>

                          <div className="min-w-0">
                            <h4 className="font-bold text-sm text-[#3A2B24] truncate">{item.name}</h4>
                            <p className="text-xs text-[#6C5C54] font-medium truncate mt-0.5">Category / Size: {item.size}</p>
                            
                            {/* Photo list pills */}
                            <div className="flex flex-wrap gap-1 mt-1.5">
                              {isCustomUploaded ? (
                                photoList.map((_, pIdx) => (
                                  <button
                                    key={pIdx}
                                    type="button"
                                    onClick={() =>
                                      setPreviewModal({
                                        isOpen: true,
                                        orderId: order.id,
                                        customerName: order.customerName,
                                        customerPhone: order.customerPhone,
                                        itemName: item.name,
                                        itemSize: item.size,
                                        photos: photoList,
                                        activePhotoIdx: pIdx,
                                        assignedStudio: order.assignedStudio,
                                      })
                                    }
                                    className="text-[9px] font-bold text-emerald-800 bg-emerald-100 hover:bg-emerald-200 border border-emerald-300 px-2 py-0.5 rounded-full inline-flex items-center gap-1 cursor-pointer transition-colors"
                                  >
                                    <ImageIcon className="h-2.5 w-2.5 text-emerald-600" /> Photo #{pIdx + 1}
                                  </button>
                                ))
                              ) : (
                                <span className="text-[10px] font-medium text-[#6C5C54] bg-[#FFF8F2] border border-[#EFE6DD] px-2 py-0.5 rounded-full inline-flex items-center gap-1">
                                  <Gift className="h-3 w-3 text-[#D89A86]" /> Standard Gift (No Custom Photo)
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Quantity x Price */}
                        <div className="text-right flex-shrink-0">
                          <span className="font-extrabold text-sm text-[#3A2B24]">
                            {item.quantity} × ₹{item.price ? item.price.toFixed(0) : "0"}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* 📦 SHIPPING DOCUMENTS & TRACKING CARD (Shown ONLY when Delivery Type is "Shipping") */}
              {getDeliveryType(order) === "Shipping" && (
                <div className="p-4 bg-[#FAF7F4] border border-[#EFE6DD] rounded-2xl flex flex-col gap-3 animate-in fade-in duration-150">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                    <span className="text-xs font-bold text-[#3A2B24] flex items-center gap-1.5">
                      <Package className="h-4 w-4 text-[#D89A86]" /> Shipping Documents &amp; Tracking
                    </span>
                    <span className="text-[10px] text-[#6C5C54] italic">
                      Upload documents to auto-attach in customer WhatsApp messages
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {/* Order Invoice Box */}
                    <div className="p-3 bg-white border border-[#EFE6DD] rounded-xl flex flex-col gap-1.5">
                      <span className="text-[11px] font-bold text-[#6C5C54]">Order Invoice (PDF / Image)</span>
                      {order.invoiceUrl ? (
                        <div className="p-2 bg-emerald-50 border border-emerald-200 rounded-lg flex items-center justify-between gap-2">
                          <span className="text-xs font-bold text-emerald-800 truncate flex items-center gap-1 max-w-[170px]">
                            <FileText className="h-3.5 w-3.5 text-emerald-600 flex-shrink-0" />
                            {order.invoiceUrl.startsWith("data:") ? "Invoice Document Attached" : order.invoiceUrl}
                          </span>
                          <div className="flex items-center gap-2 flex-shrink-0">
                            <button
                              type="button"
                              onClick={() => {
                                if (order.invoiceUrl?.startsWith("data:") || order.invoiceUrl?.startsWith("http")) {
                                  const w = window.open("");
                                  if (w) {
                                    w.document.write(`<img src="${order.invoiceUrl}" style="max-width:100%;height:auto;"/>`);
                                  }
                                } else {
                                  alert(`Invoice file: ${order.invoiceUrl}`);
                                }
                              }}
                              className="text-xs font-bold text-[#3A2B24] hover:underline cursor-pointer"
                            >
                              View
                            </button>
                            <label className="text-xs font-bold text-[#6C5C54] hover:underline cursor-pointer">
                              Change
                              <input
                                type="file"
                                accept="image/*,.pdf"
                                className="hidden"
                                onChange={(e) => handleFileUpload(order.id, "invoiceUrl", e)}
                              />
                            </label>
                            <button
                              type="button"
                              onClick={() => updateOrderDetails(order.id, { invoiceUrl: "" })}
                              className="text-xs font-bold text-rose-600 hover:underline cursor-pointer"
                            >
                              Remove
                            </button>
                          </div>
                        </div>
                      ) : (
                        <label className="border border-dashed border-[#EFE6DD] bg-[#FFF8F2] hover:bg-[#FFF3E8] p-2.5 rounded-lg flex items-center justify-center gap-1.5 text-xs font-bold text-[#3A2B24] cursor-pointer transition-colors">
                          <Paperclip className="h-3.5 w-3.5 text-[#D89A86]" />
                          <span>Upload Order Invoice</span>
                          <input
                            type="file"
                            accept="image/*,.pdf"
                            className="hidden"
                            onChange={(e) => handleFileUpload(order.id, "invoiceUrl", e)}
                          />
                        </label>
                      )}
                    </div>

                    {/* Shipping Label Box */}
                    <div className="p-3 bg-white border border-[#EFE6DD] rounded-xl flex flex-col gap-1.5">
                      <span className="text-[11px] font-bold text-[#6C5C54]">Shipping Label (PDF / Image)</span>
                      {order.shippingLabelUrl ? (
                        <div className="p-2 bg-emerald-50 border border-emerald-200 rounded-lg flex items-center justify-between gap-2">
                          <span className="text-xs font-bold text-emerald-800 truncate flex items-center gap-1 max-w-[170px]">
                            <FileText className="h-3.5 w-3.5 text-emerald-600 flex-shrink-0" />
                            {order.shippingLabelUrl.startsWith("data:") ? "Shipping Label Attached" : order.shippingLabelUrl}
                          </span>
                          <div className="flex items-center gap-2 flex-shrink-0">
                            <button
                              type="button"
                              onClick={() => {
                                if (order.shippingLabelUrl?.startsWith("data:") || order.shippingLabelUrl?.startsWith("http")) {
                                  const w = window.open("");
                                  if (w) {
                                    w.document.write(`<img src="${order.shippingLabelUrl}" style="max-width:100%;height:auto;"/>`);
                                  }
                                } else {
                                  alert(`Shipping Label file: ${order.shippingLabelUrl}`);
                                }
                              }}
                              className="text-xs font-bold text-[#3A2B24] hover:underline cursor-pointer"
                            >
                              View
                            </button>
                            <label className="text-xs font-bold text-[#6C5C54] hover:underline cursor-pointer">
                              Change
                              <input
                                type="file"
                                accept="image/*,.pdf"
                                className="hidden"
                                onChange={(e) => handleFileUpload(order.id, "shippingLabelUrl", e)}
                              />
                            </label>
                            <button
                              type="button"
                              onClick={() => updateOrderDetails(order.id, { shippingLabelUrl: "" })}
                              className="text-xs font-bold text-rose-600 hover:underline cursor-pointer"
                            >
                              Remove
                            </button>
                          </div>
                        </div>
                      ) : (
                        <label className="border border-dashed border-[#EFE6DD] bg-white hover:bg-[#FFF8F2] p-2.5 rounded-lg flex items-center justify-center gap-1.5 text-xs font-bold text-[#3A2B24] cursor-pointer transition-colors">
                          <Truck className="h-3.5 w-3.5 text-amber-600" />
                          <span>🏷️ Attach Shipping Label</span>
                          <input
                            type="file"
                            accept="image/*,.pdf"
                            className="hidden"
                            onChange={(e) => handleFileUpload(order.id, "shippingLabelUrl", e)}
                          />
                        </label>
                      )}
                    </div>
                  </div>

                  {/* Courier Partner & Tracking AWB # Input Field */}
                  <div className="flex flex-col gap-1">
                    <label className="text-[11px] font-bold text-[#6C5C54]">Courier Partner &amp; Tracking AWB #</label>
                    <Input
                      placeholder="e.g. Delhivery Express - AWB 123456789"
                      value={order.trackingAwb || ""}
                      onChange={(e) => updateOrderDetails(order.id, { trackingAwb: e.target.value })}
                      className="rounded-xl border-[#EFE6DD] bg-white text-xs font-medium text-[#3A2B24] focus-visible:ring-[#D89A86] h-9"
                    />
                  </div>
                </div>
              )}

              {/* CUSTOMER & FULFILLMENT STRUCTURED INFO GRID */}
              <div className="pt-3 border-t border-[#EFE6DD] flex flex-col gap-3">
                {/* 3-Column Modern Information Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                  {/* Card 1: Customer Contact Info */}
                  <div className="p-3 bg-[#FAF7F4] border border-[#EFE6DD] rounded-2xl flex flex-col gap-1 shadow-2xs">
                    <div className="flex items-center gap-1.5 text-[10px] font-extrabold text-[#6C5C54] uppercase tracking-wider">
                      <User className="h-3.5 w-3.5 text-[#D89A86]" /> Customer
                    </div>
                    <div className="font-extrabold text-sm text-[#3A2B24]">
                      {order.customerName}
                    </div>
                    <a
                      href={`tel:${order.customerPhone}`}
                      className="inline-flex items-center gap-1 text-xs font-semibold text-[#D89A86] hover:underline w-fit"
                    >
                      <Phone className="h-3 w-3" /> {order.customerPhone}
                    </a>
                  </div>

                  {/* Card 2: Delivery & Shipping Address */}
                  <div className="p-3 bg-[#FAF7F4] border border-[#EFE6DD] rounded-2xl flex flex-col gap-1 shadow-2xs">
                    <div className="flex items-center gap-1.5 text-[10px] font-extrabold text-[#6C5C54] uppercase tracking-wider">
                      <MapPin className="h-3.5 w-3.5 text-[#D89A86]" /> Shipping Address
                    </div>
                    <p className="text-xs text-[#3A2B24] font-medium leading-relaxed line-clamp-2">
                      {order.deliveryAddress || "Standard Delivery Address"}
                    </p>
                  </div>

                  {/* Card 3: Fulfillment Studio & Date */}
                  <div className="p-3 bg-[#FAF7F4] border border-[#EFE6DD] rounded-2xl flex flex-col justify-between gap-1 shadow-2xs">
                    <div>
                      <div className="flex items-center gap-1.5 text-[10px] font-extrabold text-[#6C5C54] uppercase tracking-wider mb-0.5">
                        <Store className="h-3.5 w-3.5 text-[#D89A86]" /> Studio &amp; Date
                      </div>
                      <div className="text-xs text-[#3A2B24] font-bold truncate">
                        {order.assignedStudio}
                      </div>
                      <div className="text-[11px] text-[#6C5C54] flex items-center gap-1 mt-0.5">
                        <Calendar className="h-3 w-3 text-[#9C8C84]" /> {order.date}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Bottom Row: Ambassador Code Badge & WhatsApp Action */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
                  <div>
                    {order.referralCode ? (
                      <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-purple-50 text-purple-900 border border-purple-200 rounded-xl text-xs font-bold shadow-2xs flex-wrap">
                        <span className="flex items-center gap-1.5">
                          <span>🎟️</span>
                          <span>Ambassador Code: <strong className="font-mono bg-white px-2 py-0.5 rounded-lg border border-purple-200 text-purple-950 font-black">{order.referralCode}</strong></span>
                        </span>
                        {order.ambassadorName && (
                          <span className="text-purple-700 font-semibold">• Partner: {order.ambassadorName}</span>
                        )}
                        {order.referralDiscount && (
                          <span className="text-emerald-700 font-extrabold bg-emerald-100/80 px-2 py-0.5 rounded-md">• Discount: -₹{order.referralDiscount.toFixed(2)}</span>
                        )}
                      </div>
                    ) : (
                      <span className="text-[11px] text-[#6C5C54] font-medium italic">Direct Organic Customer Order</span>
                    )}
                  </div>

                  {/* GREEN MESSAGE CUSTOMER BUTTON */}
                  <Button
                    type="button"
                    onClick={() => handleSendMessageWhatsApp(order)}
                    className="bg-[#25D366] hover:bg-[#1DA851] text-white font-bold text-xs rounded-xl h-10 px-5 shadow-sm flex items-center gap-2 cursor-pointer flex-shrink-0"
                  >
                    <MessageCircle className="h-4 w-4 fill-white text-[#25D366]" />
                    <span>Message Customer</span>
                  </Button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Customer Uploaded High-Res Photo Modal (Multi-Photo Gallery) */}
      {previewModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-2xl w-full border border-[#EFE6DD] shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
            <div className="p-5 bg-[#FFF8F2] border-b border-[#EFE6DD] flex items-center justify-between">
              <div>
                <Badge className="bg-emerald-600 text-white border-none text-xs font-bold px-3 py-0.5 rounded-full mb-1">
                  HD Customer Photo #{previewModal.activePhotoIdx + 1} of {previewModal.photos.length}
                </Badge>
                <h3 className="font-serif-brand font-bold text-lg text-[#3A2B24]">
                  {previewModal.orderId} • {previewModal.customerName}
                </h3>
                <p className="text-xs text-[#6C5C54]">
                  Item: <span className="font-bold text-[#3A2B24]">{previewModal.itemName}</span> ({previewModal.itemSize})
                </p>
              </div>
              <button
                onClick={() => setPreviewModal(null)}
                className="h-9 w-9 rounded-full bg-white border border-[#EFE6DD] flex items-center justify-center text-[#6C5C54] hover:text-[#3A2B24] hover:bg-[#FFF8F2] transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-6 bg-slate-900/5 flex-1 overflow-y-auto flex flex-col items-center justify-center min-h-[300px]">
              <div className="relative rounded-2xl overflow-hidden border border-[#EFE6DD] shadow-lg max-h-[45vh] bg-slate-900/5">
                <img
                  src={previewModal.photos[previewModal.activePhotoIdx]}
                  alt={`Customer Photo ${previewModal.activePhotoIdx + 1}`}
                  className="max-h-[45vh] max-w-full object-contain rounded-2xl"
                />
              </div>

              {/* Photo Selector Thumbnails Carousel */}
              {previewModal.photos.length > 1 && (
                <div className="w-full mt-4 flex items-center gap-2 overflow-x-auto pb-1 px-1 justify-center">
                  {previewModal.photos.map((pUrl, pIdx) => (
                    <button
                      key={pIdx}
                      onClick={() => setPreviewModal({ ...previewModal, activePhotoIdx: pIdx })}
                      className={`relative h-12 w-12 rounded-xl overflow-hidden border-2 flex-shrink-0 cursor-pointer transition-all ${
                        pIdx === previewModal.activePhotoIdx
                          ? "border-emerald-600 scale-105 shadow-md"
                          : "border-[#EFE6DD] opacity-60 hover:opacity-100"
                      }`}
                    >
                      <img src={pUrl} alt={`Photo ${pIdx + 1}`} className="h-full w-full object-cover" />
                      <span className="absolute bottom-0 right-0 bg-black/70 text-white text-[8px] font-bold px-1 rounded-tl-sm">
                        #{pIdx + 1}
                      </span>
                    </button>
                  ))}
                </div>
              )}

              <p className="text-xs font-semibold text-[#6C5C54] mt-3">
                Assigned Dispatch Studio: <span className="font-bold text-[#D89A86]">{previewModal.assignedStudio}</span>
              </p>
            </div>

            <div className="p-4 bg-[#FFF8F2] border-t border-[#EFE6DD] flex items-center justify-between flex-wrap gap-2">
              <span className="text-xs text-[#6C5C54] font-medium">Customer Phone: {previewModal.customerPhone}</span>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  onClick={() => setPreviewModal(null)}
                  className="rounded-full text-xs font-bold border-[#EFE6DD] px-4"
                >
                  Close
                </Button>
                <Button
                  onClick={() => {
                    const link = document.createElement("a");
                    link.href = previewModal.photos[previewModal.activePhotoIdx];
                    link.download = `Pixello_${previewModal.orderId}_Photo_${previewModal.activePhotoIdx + 1}.jpg`;
                    link.click();
                  }}
                  className="btn-pixello-primary rounded-full text-xs font-bold px-4"
                >
                  <Download className="h-4 w-4 mr-1.5" /> Download Photo #{previewModal.activePhotoIdx + 1}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
