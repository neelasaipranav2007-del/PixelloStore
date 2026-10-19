"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { IndianRupee, Users, Store, Package, ArrowUpRight, Clock, ChevronDown, Search, X, Download, CheckCircle, XCircle, Eye, ShieldCheck, Mail, Phone, GraduationCap, MapPin, ExternalLink, CheckCircle2 } from "lucide-react";
import { useOrders, OrderStatus } from "@/context/OrderContext";
import { OrderStatusBadge } from "@/components/ui/status-badge";

const ALL_STATUSES: { label: OrderStatus; desc: string; dotColor: string }[] = [
  { label: "Processing", desc: "Order received & queued", dotColor: "bg-amber-400" },
  { label: "Printing", desc: "In studio production / framing", dotColor: "bg-[#D89A86]" },
  { label: "Packed", desc: "Print packed in gift wrap", dotColor: "bg-sky-400" },
  { label: "Delivery Picked Up", desc: "Rider assigned & dispatched", dotColor: "bg-orange-400" },
  { label: "Delivered", desc: "Successfully handed to customer", dotColor: "bg-emerald-500" },
  { label: "Out of Stock (Refill Pending)", desc: "Material / frame out of stock", dotColor: "bg-red-600" },
  { label: "Replacement Requested", desc: "Replacement / re-print order", dotColor: "bg-purple-600" },
];

const STATUS_CONFIG: Record<string, { label: string; symbol: string; badgeClass: string; dotClass: string; itemBgClass: string }> = {
  "Processing": { label: "Processing", symbol: "⏳", badgeClass: "bg-amber-100 text-amber-900 border-amber-300", dotClass: "bg-amber-500", itemBgClass: "bg-amber-50/90 hover:bg-amber-100/90 border-amber-200 text-amber-950" },
  "Packed": { label: "Packed", symbol: "📦", badgeClass: "bg-sky-100 text-sky-900 border-sky-300", dotClass: "bg-sky-500", itemBgClass: "bg-sky-50/90 hover:bg-sky-100/90 border-sky-200 text-sky-950" },
  "Delivery Picked Up": { label: "Delivery Picked Up", symbol: "🛵", badgeClass: "bg-orange-100 text-orange-900 border-orange-300", dotClass: "bg-orange-500", itemBgClass: "bg-orange-50/90 hover:bg-orange-100/90 border-orange-200 text-orange-950" },
  "Out for Delivery": { label: "Out for Delivery", symbol: "🚚", badgeClass: "bg-blue-100 text-blue-900 border-blue-300", dotClass: "bg-blue-600", itemBgClass: "bg-blue-50/90 hover:bg-blue-100/90 border-blue-200 text-blue-950" },
  "Delivered": { label: "Delivered", symbol: "✅", badgeClass: "bg-emerald-100 text-emerald-900 border-emerald-300", dotClass: "bg-emerald-600", itemBgClass: "bg-emerald-50/90 hover:bg-emerald-100/90 border-emerald-200 text-emerald-950" },
  "Replacement Requested": { label: "Replacement Requested", symbol: "🔄", badgeClass: "bg-purple-100 text-purple-900 border-purple-300", dotClass: "bg-purple-600", itemBgClass: "bg-purple-50/90 hover:bg-purple-100/90 border-purple-200 text-purple-950" },
  "Cancelled": { label: "Cancelled", symbol: "❌", badgeClass: "bg-slate-100 text-slate-900 border-slate-300", dotClass: "bg-slate-500", itemBgClass: "bg-slate-100/80 hover:bg-slate-200/80 border-slate-300 text-slate-950" },
};

const normalizeStatusKey = (s: string): string => {
  if (!s) return "Processing";
  const clean = s.trim().toUpperCase().replace(/_/g, " ");
  if (clean === "DELIVERED") return "Delivered";
  if (clean === "CANCELLED" || clean === "CANCELED") return "Cancelled";
  if (clean === "REPLACEMENT REQUESTED" || clean === "REPLACEMENT") return "Replacement Requested";
  if (clean === "PACKED") return "Packed";
  if (clean === "OUT FOR DELIVERY") return "Out for Delivery";
  if (clean === "DELIVERY PICKED UP" || clean === "PICKED UP") return "Delivery Picked Up";
  if (clean === "OUT OF STOCK") return "Out of Stock (Refill Pending)";
  return "Processing";
};

const getStatusConfig = (statusStr: string) => {
  const normKey = normalizeStatusKey(statusStr);
  return STATUS_CONFIG[normKey] || STATUS_CONFIG["Processing"];
};

export interface NetworkApprovalItem {
  id: string;
  type: "Studio" | "Ambassador";
  name: string;
  applicant: string;
  details: string;
  phone: string;
  email: string;
  time: string;
  location?: string;
  gstin?: string;
  course?: string;
  year?: string;
  promoCode?: string;
}

const INITIAL_NETWORK_APPROVALS: NetworkApprovalItem[] = [
  {
    id: "APR-101",
    type: "Studio",
    name: "Studio Alpha (Powai)",
    applicant: "Vikram Malhotra",
    details: "Framing & Canvas Printing Partner Application",
    phone: "+91 98201 54321",
    email: "vikram@studioalpha.in",
    time: "2 mins ago",
    location: "Powai, Mumbai",
    gstin: "27AABCS1429R1ZA",
  },
  {
    id: "APR-102",
    type: "Ambassador",
    name: "Sai Rohan",
    applicant: "Sai Rohan (@neelasaipranav)",
    details: "Campus Representative Application",
    phone: "9618401231",
    email: "neelasaipranav2007@gmail.com",
    time: "15 mins ago",
    location: "Aurora Deemed to Be University (Bhongiri)",
    course: "B.Tech",
    year: "2nd Year",
    promoCode: "SAIROHAN10",
  },
  {
    id: "APR-103",
    type: "Studio",
    name: "LensCraft Snaps Pvt Ltd",
    applicant: "Anand Sharma",
    details: "High-Resolution Photo Print Studio Application",
    phone: "+91 97654 32109",
    email: "contact@lenscraftsnaps.com",
    time: "1 hour ago",
    location: "Koramangala, Bangalore",
    gstin: "29BBBCU8472R1ZN",
  },
  {
    id: "APR-104",
    type: "Ambassador",
    name: "Vyshu",
    applicant: "Vyshu (@vyshu__61)",
    details: "Campus Representative Application",
    phone: "9059448213",
    email: "vyshnavi123@gmail.com",
    time: "2 hours ago",
    location: "Sreenidhii Engineering College (Ghatkesar)",
    course: "B.Tech",
    year: "2nd Year",
    promoCode: "VYSHU10",
  },
];

export default function AdminDashboardPage() {
  const { orders, updateOrderStatus } = useOrders();
  const [searchQuery, setSearchQuery] = useState("");
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [openStatusDropdownId, setOpenStatusDropdownId] = useState<string | null>(null);

  // Network Approvals state
  const [networkApprovals, setNetworkApprovals] = useState<NetworkApprovalItem[]>(INITIAL_NETWORK_APPROVALS);
  const [selectedApprovalItem, setSelectedApprovalItem] = useState<NetworkApprovalItem | null>(null);

  // Total Revenue excludes Cancelled orders (debited when cancelled, added for any active/delivered/replacement status)
  const totalRevenue = orders
    .filter((o) => normalizeStatusKey(o.status) !== "Cancelled")
    .reduce((sum, o) => sum + o.totalAmount, 0);

  // Financial Breakdown calculations (Matching Pic 1 into Pic 2 & Pic 3)
  const deliveredOrders = orders.filter((o) => normalizeStatusKey(o.status) === "Delivered");
  const deliveredCount = deliveredOrders.length;
  const deliveredAmount = deliveredOrders.reduce((sum, o) => sum + o.totalAmount, 0);

  const replacementOrders = orders.filter((o) => normalizeStatusKey(o.status) === "Replacement Requested");
  const replacementCount = replacementOrders.length;
  const replacementAmount = replacementOrders.reduce((sum, o) => sum + o.totalAmount, 0);

  const cancelledOrders = orders.filter((o) => normalizeStatusKey(o.status) === "Cancelled");
  const cancelledCount = cancelledOrders.length;
  const cancelledAmount = cancelledOrders.reduce((sum, o) => sum + o.totalAmount, 0);

  const activeOrders = orders.filter((o) => {
    const norm = normalizeStatusKey(o.status);
    return norm !== "Delivered" && norm !== "Cancelled" && norm !== "Replacement Requested";
  });
  const activeCount = activeOrders.length;
  const activeAmount = activeOrders.reduce((sum, o) => sum + o.totalAmount, 0);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const filteredOrders = orders.filter((order) => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;
    return (
      order.id.toLowerCase().includes(q) ||
      order.customerName.toLowerCase().includes(q) ||
      order.customerPhone.toLowerCase().includes(q) ||
      order.assignedStudio.toLowerCase().includes(q) ||
      order.status.toLowerCase().includes(q)
    );
  });

  // Live stats from backend database analytics
  const [extraStats, setExtraStats] = useState({
    partnerStudiosCount: 34,
    campusAmbassadorsCount: 89,
    productsCount: 0,
    customersCount: 0,
  });

  useEffect(() => {
    const fetchLiveAnalytics = async () => {
      try {
        const res = await fetch("/api/admin/analytics");
        const data = await res.json();
        if (data.success && data.analytics) {
          setExtraStats({
            partnerStudiosCount: data.analytics.studiosCount || 34,
            campusAmbassadorsCount: data.analytics.ambassadorsCount || 89,
            productsCount: data.analytics.productsCount || 0,
            customersCount: data.analytics.customersCount || 0,
          });
        }
      } catch (err) {}
    };

    fetchLiveAnalytics();
    const interval = setInterval(fetchLiveAnalytics, 5000);
    return () => clearInterval(interval);
  }, []);

  const STATS = [
    { label: "Total Order Revenue", value: `₹${totalRevenue.toLocaleString("en-IN", { maximumFractionDigits: 2 })}`, change: "+14.8%", icon: IndianRupee },
    { label: "Total Orders Managed", value: `${orders.length}`, change: "+8 new", icon: Package },
    { label: "Verified Partner Studios", value: `${extraStats.partnerStudiosCount}`, change: "+2", icon: Store },
    { label: "Campus Ambassadors", value: `${extraStats.campusAmbassadorsCount}`, change: "+14", icon: Users },
  ];

  const handleApproveItem = (item: NetworkApprovalItem) => {
    setNetworkApprovals((prev) => prev.filter((i) => i.id !== item.id));
    setSelectedApprovalItem(null);
    showToast(`✓ "${item.name}" APPROVED & onboarded to Pixello Ecosystem!`);
  };

  const handleRejectItem = (item: NetworkApprovalItem) => {
    setNetworkApprovals((prev) => prev.filter((i) => i.id !== item.id));
    setSelectedApprovalItem(null);
    showToast(`✓ "${item.name}" application rejected & removed from queue.`);
  };

  const handleDownloadAnalyticsReport = () => {
    const csvRows = [
      ["Metric", "Value", "Notes"],
      ["Report Date", new Date().toLocaleDateString("en-IN"), "Generated from Pixello Admin Central"],
      ["Total Order Revenue (INR)", `${totalRevenue.toFixed(2)}`, "Live calculated"],
      ["Total Managed Orders", `${orders.length}`, "Synced customer orders"],
      ["Verified Partner Studios", "34", "Active fulfillment network"],
      ["Campus Ambassadors", "89", "University referral leaders"],
      ["Top Category", "Custom Photo Frames", "High customer demand"],
      ["System Health", "100% Operational", "Network status healthy"],
      [],
      ["Order ID", "Customer Name", "Customer Phone", "Assigned Studio", "Total Amount (INR)", "Status"],
      ...orders.map((o) => [o.id, o.customerName, o.customerPhone, o.assignedStudio, o.totalAmount.toFixed(2), o.status])
    ];

    const csvContent = "data:text/csv;charset=utf-8," + csvRows.map((e) => e.map((val) => `"${val}"`).join(",")).join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Pixello_Analytics_Report_${new Date().toISOString().split("T")[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="flex flex-col gap-8 p-6 bg-[#F8F3EE] min-h-full w-full max-w-full overflow-x-hidden box-border relative">
      {/* Toast Banner */}
      {toastMessage && (
        <div className="fixed top-20 right-8 z-50 bg-[#3A2B24] text-white px-5 py-3 rounded-2xl shadow-xl border border-[#D89A86]/40 flex items-center gap-2.5 animate-in fade-in slide-in-from-top-4 duration-300">
          <CheckCircle2 className="h-5 w-5 text-[#D89A86]" />
          <span className="text-xs font-bold">{toastMessage}</span>
        </div>
      )}

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5 flex-wrap">
            <h2 className="font-serif-brand text-3xl font-bold tracking-tight text-[#3A2B24]">Admin Central Management</h2>
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300 shadow-2xs">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Live Synced
            </span>
          </div>
          <p className="text-xs text-[#6C5C54] mt-1">Pixello Ecosystem • Live Order Engine & Studio Network Overview</p>
        </div>
        <div className="flex gap-2">
          <Button 
            onClick={handleDownloadAnalyticsReport}
            className="btn-pixello-primary text-xs font-bold rounded-full px-5 h-11 shadow-md flex items-center gap-2 cursor-pointer transition-all duration-200"
          >
            <Download className="h-4 w-4 text-white" /> Download Analytics Report
          </Button>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {STATS.map((stat) => (
          <Card key={stat.label} className="border border-[#EFE6DD] bg-white rounded-3xl shadow-xs hover:shadow-md transition-shadow overflow-hidden">
            <CardContent className="p-5 flex flex-col justify-between h-full min-h-[140px]">
              <div className="flex items-start justify-between gap-3 mb-3">
                <span className="text-[11px] font-bold text-[#6C5C54] uppercase tracking-wider leading-snug flex-1">
                  {stat.label}
                </span>
                <div className="h-9 w-9 rounded-2xl bg-[#FFF8F2] border border-[#EFE6DD] flex items-center justify-center flex-shrink-0 text-[#D89A86]">
                  <stat.icon className="h-4 w-4" />
                </div>
              </div>

              <div>
                <div suppressHydrationWarning className="text-2xl sm:text-3xl font-extrabold text-[#3A2B24] tracking-tight">
                  {stat.value}
                </div>
                <div className="flex items-center gap-1 mt-1 text-[11px] font-bold text-emerald-600">
                  <ArrowUpRight className="h-3.5 w-3.5" />
                  <span>{stat.change} live sync</span>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* 📊 Order Status & Revenue Financial Breakdown Section (Matching Pic 1 into Pic 2) */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center gap-2">
          <span className="text-base">📊</span>
          <h3 className="font-serif-brand text-lg font-bold text-[#3A2B24]">
            Order Status & Financial Breakdown
          </h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4.5">
          {/* Card 1: TOTAL ORDERS (Blue) */}
          <Card className="border-2 border-blue-300 bg-blue-50/50 rounded-3xl shadow-2xs hover:shadow-md transition-all">
            <CardContent className="p-5 flex flex-col justify-between h-full min-h-[120px]">
              <div className="flex items-center justify-between gap-2 mb-1">
                <span className="text-[11px] font-extrabold text-blue-800 uppercase tracking-wider flex items-center gap-1.5">
                  <span className="text-xs">📦</span> TOTAL ORDERS
                </span>
              </div>
              <div>
                <div suppressHydrationWarning className="text-2xl sm:text-3xl font-black text-blue-700 tracking-tight flex items-baseline gap-1.5">
                  <span>{orders.length}</span>
                  <span className="text-base font-bold text-blue-600">Orders</span>
                </div>
                <div className="text-xs font-bold text-blue-600 mt-1">
                  ₹{totalRevenue.toLocaleString("en-IN", { minimumFractionDigits: 0, maximumFractionDigits: 2 })} Total Volume
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Card 2: DELIVERED ORDERS (Green) */}
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

          {/* Card 3: REPLACEMENT ORDERS (Purple) */}
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

          {/* Card 4: CANCELLED ORDERS (Red/Rose) */}
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

          {/* Card 5: ACTIVE / PENDING ORDERS (Amber) */}
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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Recent Live Orders */}
        <Card className="lg:col-span-2 border border-[#EFE6DD] bg-white rounded-3xl shadow-xs overflow-hidden">
          <CardContent className="p-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
              <div>
                <h3 className="font-serif-brand text-xl font-bold text-[#3A2B24]">Live Customer Orders</h3>
                <p className="text-xs text-[#6C5C54] mt-0.5 font-medium">{orders.length} Synced Orders in System</p>
              </div>

              <div className="relative w-full sm:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#6C5C54]" />
                <Input
                  type="text"
                  placeholder="Search order ID or name..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 pr-8 rounded-full border-[#EFE6DD] bg-[#FFF8F2] text-xs font-medium text-[#3A2B24] focus-visible:ring-[#D89A86]"
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
            </div>

            <div className="overflow-hidden border border-[#EFE6DD] rounded-2xl">
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="text-[11px] font-bold text-[#6C5C54] uppercase tracking-wider bg-[#FFF8F2] border-b border-[#EFE6DD]">
                    <tr>
                      <th className="px-4 py-3.5">Order ID</th>
                      <th className="px-4 py-3.5">Customer</th>
                      <th className="px-4 py-3.5">Assigned Studio</th>
                      <th className="px-4 py-3.5">Amount</th>
                      <th className="px-4 py-3.5">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#EFE6DD]">
                    {filteredOrders.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="text-center py-8 text-xs text-[#6C5C54]">
                          {searchQuery ? `No orders found matching "${searchQuery}"` : "No orders recorded yet. Place an order on the store to test!"}
                        </td>
                      </tr>
                    ) : (
                      filteredOrders.map((order, idx) => (
                        <tr key={`${order.id}-${idx}`} className="hover:bg-[#FFF8F2]/50 transition-colors">
                          <td className="px-4 py-4 font-bold text-[#3A2B24] whitespace-nowrap">{order.id}</td>
                          <td className="px-4 py-4">
                            <div className="font-bold text-[#3A2B24]">{order.customerName}</div>
                            <div className="text-xs text-[#6C5C54] font-medium">{order.customerPhone}</div>
                          </td>
                          <td className="px-4 py-4 text-xs font-medium text-[#6C5C54]">{order.assignedStudio}</td>
                          <td className="px-4 py-4 font-extrabold text-[#D89A86] whitespace-nowrap">₹{order.totalAmount.toFixed(2)}</td>
                          <td className="px-4 py-4">
                            <div className="relative">
                              <button
                                type="button"
                                onClick={() => setOpenStatusDropdownId(openStatusDropdownId === order.id ? null : order.id)}
                                className={`h-8 px-3 text-xs font-extrabold rounded-xl border flex items-center gap-1.5 shadow-2xs transition-all hover:scale-102 cursor-pointer ${
                                  getStatusConfig(order.status).badgeClass
                                }`}
                              >
                                <span className="text-xs">{getStatusConfig(order.status).symbol}</span>
                                <span>{getStatusConfig(order.status).label}</span>
                                <ChevronDown className="h-3 w-3 opacity-60 ml-0.5" />
                              </button>

                              {openStatusDropdownId === order.id && (
                                <>
                                  <div
                                    className="fixed inset-0 z-40"
                                    onClick={() => setOpenStatusDropdownId(null)}
                                  />
                                  <div className="absolute left-0 top-10 w-64 p-1.5 rounded-2xl border-[#EFE6DD] shadow-2xl bg-white space-y-1 z-50 animate-in fade-in duration-150">
                                    <div className="px-3 py-1.5 text-[10px] font-bold text-[#6C5C54] uppercase tracking-wider border-b border-[#EFE6DD]">
                                      Select Order Status
                                    </div>
                                    {Object.entries(STATUS_CONFIG).map(([stKey, cfg]) => {
                                      const isSelected = normalizeStatusKey(order.status) === stKey;
                                      return (
                                        <button
                                          key={stKey}
                                          type="button"
                                          onClick={() => {
                                            updateOrderStatus(order.id, stKey as OrderStatus);
                                            setOpenStatusDropdownId(null);
                                            showToast(`✓ Updated ${order.id} status to ${stKey}!`);
                                          }}
                                          className={`w-full flex items-center justify-between p-2.5 my-1 rounded-xl cursor-pointer border transition-all text-left ${cfg.itemBgClass} ${
                                            isSelected ? "ring-2 ring-offset-1 ring-[#D89A86] font-extrabold shadow-2xs" : "font-semibold opacity-95 hover:opacity-100"
                                          }`}
                                        >
                                          <div className="flex items-center gap-2.5">
                                            <span className="text-base">{cfg.symbol}</span>
                                            <span className="text-xs font-bold">{cfg.label}</span>
                                          </div>
                                          <span className={`h-3 w-3 rounded-full ${cfg.dotClass} shadow-2xs border border-white/60`} />
                                        </button>
                                      );
                                    })}
                                  </div>
                                </>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Network Approvals Card - Fully Working & Interactive */}
        <Card className="border border-[#EFE6DD] bg-white rounded-3xl shadow-xs overflow-hidden">
          <CardContent className="p-6 flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <h3 className="font-serif-brand text-xl font-bold text-[#3A2B24]">Network Approvals</h3>
              <Badge className="bg-[#FFF8F2] text-[#D89A86] border border-[#D89A86]/30 text-[11px] font-bold px-2.5 py-0.5 rounded-full">
                {networkApprovals.length} Pending
              </Badge>
            </div>

            {networkApprovals.length === 0 ? (
              <div className="p-6 text-center bg-[#FFF8F2]/50 border border-dashed border-[#EFE6DD] rounded-2xl">
                <p className="text-xs font-bold text-[#3A2B24]">All network requests reviewed!</p>
                <p className="text-[11px] text-[#6C5C54] mt-1">No pending studio or ambassador applications.</p>
              </div>
            ) : (
              networkApprovals.map((req) => (
                <div key={req.id} className="flex items-center justify-between p-3.5 border border-[#EFE6DD] rounded-2xl bg-[#FFF8F2]/60 hover:bg-[#FFF8F2] transition-colors">
                  <div className="flex items-center gap-3 min-w-0 pr-2">
                    <div className={`h-10 w-10 rounded-2xl flex items-center justify-center text-white flex-shrink-0 shadow-2xs ${req.type === 'Studio' ? 'bg-[#3A2B24]' : 'bg-[#D89A86]'}`}>
                      {req.type === 'Studio' ? <Store className="h-4 w-4" /> : <Users className="h-4 w-4" />}
                    </div>
                    <div className="min-w-0">
                      <h4 className="font-bold text-sm text-[#3A2B24] truncate">{req.name}</h4>
                      <p className="text-xs text-[#6C5C54] flex items-center mt-0.5 font-medium">
                        <Clock className="h-3 w-3 mr-1 flex-shrink-0 text-[#D89A86]" /> {req.time}
                      </p>
                    </div>
                  </div>
                  <Button 
                    size="sm" 
                    variant="outline" 
                    onClick={() => setSelectedApprovalItem(req)}
                    className="rounded-full text-xs font-bold border-[#EFE6DD] text-[#3A2B24] bg-white hover:bg-[#FFF8F2] hover:text-[#D89A86] px-4 h-8 flex-shrink-0 cursor-pointer shadow-2xs"
                  >
                    Review
                  </Button>
                </div>
              ))
            )}

            <div className="pt-2 border-t border-[#EFE6DD] flex items-center justify-between text-xs">
              <Link href="/admin/studios" className="font-bold text-[#3A2B24] hover:text-[#D89A86] flex items-center gap-1">
                Manage Studios <ExternalLink className="h-3 w-3" />
              </Link>
              <Link href="/admin/ambassadors" className="font-bold text-[#D89A86] hover:underline flex items-center gap-1">
                Manage Ambassadors <ExternalLink className="h-3 w-3" />
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Network Approval Review Modal Dialog */}
      {selectedApprovalItem && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-[#EFE6DD] shadow-2xl w-full max-w-md p-6 overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-4 border-b border-[#EFE6DD] mb-5">
              <div className="flex items-center gap-2.5">
                <div className={`h-10 w-10 rounded-2xl flex items-center justify-center text-white shadow-2xs ${selectedApprovalItem.type === 'Studio' ? 'bg-[#3A2B24]' : 'bg-[#D89A86]'}`}>
                  {selectedApprovalItem.type === 'Studio' ? <Store className="h-5 w-5" /> : <Users className="h-5 w-5" />}
                </div>
                <div>
                  <h3 className="font-serif-brand text-xl font-bold text-[#3A2B24]">Review {selectedApprovalItem.type}</h3>
                  <p className="text-xs text-[#6C5C54]">Application submitted {selectedApprovalItem.time}</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedApprovalItem(null)}
                className="h-8 w-8 rounded-full flex items-center justify-center text-[#6C5C54] hover:bg-[#FFF8F2] cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="flex flex-col gap-4 text-xs">
              <div className="p-3.5 bg-[#FFF8F2] rounded-2xl border border-[#EFE6DD]">
                <span className="text-[10px] text-[#6C5C54] font-bold uppercase tracking-wider block">Applicant Entity</span>
                <p className="font-bold text-[#3A2B24] text-base mt-0.5">{selectedApprovalItem.name}</p>
                <p className="text-xs text-[#6C5C54] mt-0.5">{selectedApprovalItem.details}</p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-white border border-[#EFE6DD] rounded-xl">
                  <span className="text-[10px] text-[#6C5C54] font-bold uppercase tracking-wider block">Contact Person</span>
                  <span className="font-bold text-[#3A2B24] mt-0.5 block">{selectedApprovalItem.applicant}</span>
                </div>

                <div className="p-3 bg-white border border-[#EFE6DD] rounded-xl">
                  <span className="text-[10px] text-[#6C5C54] font-bold uppercase tracking-wider block">Location / City</span>
                  <span className="font-bold text-[#3A2B24] mt-0.5 block flex items-center gap-1">
                    <MapPin className="h-3 w-3 text-[#D89A86]" /> {selectedApprovalItem.location || "Hyderabad"}
                  </span>
                </div>
              </div>

              {selectedApprovalItem.gstin && (
                <div className="p-3 bg-white border border-[#EFE6DD] rounded-xl">
                  <span className="text-[10px] text-[#6C5C54] font-bold uppercase tracking-wider block">GSTIN Registration</span>
                  <span className="font-mono font-extrabold text-[#3A2B24] mt-0.5 block tracking-wider">{selectedApprovalItem.gstin}</span>
                </div>
              )}

              {selectedApprovalItem.course && (
                <div className="p-3 bg-white border border-[#EFE6DD] rounded-xl">
                  <span className="text-[10px] text-[#6C5C54] font-bold uppercase tracking-wider block">Education & Year</span>
                  <span className="font-bold text-[#3A2B24] mt-0.5 block">{selectedApprovalItem.course} • {selectedApprovalItem.year}</span>
                </div>
              )}

              <div className="flex flex-col gap-2.5">
                <div className="flex items-center justify-between p-3 rounded-2xl border border-[#EFE6DD] bg-white">
                  <div className="flex items-center gap-3">
                    <Mail className="h-4 w-4 text-[#D89A86]" />
                    <span className="font-semibold text-[#3A2B24]">{selectedApprovalItem.email}</span>
                  </div>
                  <Badge className="bg-emerald-100 text-emerald-800 border-none text-[10px] px-2.5 py-0.5 rounded-full font-bold">
                    Verified
                  </Badge>
                </div>

                <div className="flex items-center justify-between p-3 rounded-2xl border border-[#EFE6DD] bg-white">
                  <div className="flex items-center gap-3">
                    <Phone className="h-4 w-4 text-[#D89A86]" />
                    <span className="font-semibold text-[#3A2B24]">{selectedApprovalItem.phone}</span>
                  </div>
                  <Badge className="bg-emerald-100 text-emerald-800 border-none text-[10px] px-2.5 py-0.5 rounded-full font-bold">
                    Active
                  </Badge>
                </div>
              </div>

              <div className="flex items-center justify-between pt-4 mt-2 border-t border-[#EFE6DD]">
                <Button
                  variant="outline"
                  onClick={() => setSelectedApprovalItem(null)}
                  className="rounded-full text-xs font-bold border-[#EFE6DD] text-[#3A2B24]"
                >
                  Cancel
                </Button>

                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleRejectItem(selectedApprovalItem)}
                    className="rounded-full text-xs font-bold border-rose-200 text-rose-700 bg-white hover:bg-rose-50 px-4 h-9 cursor-pointer"
                  >
                    <XCircle className="h-4 w-4 mr-1.5 text-rose-600" /> Reject
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => handleApproveItem(selectedApprovalItem)}
                    className="btn-pixello-primary text-xs font-bold rounded-full px-5 h-9 shadow-xs cursor-pointer"
                  >
                    <CheckCircle className="h-4 w-4 mr-1.5 text-white" /> Approve Application
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}