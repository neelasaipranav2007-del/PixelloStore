"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  ChevronLeft,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Package,
  IndianRupee,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Shield,
  Search,
  ExternalLink,
  Camera,
  Store,
  Truck,
  Users,
  CreditCard,
  Eye,
  RefreshCw,
  X,
  Sparkles,
  ChevronRight,
  BadgePercent,
  Check,
  RotateCcw
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

interface CustomerData {
  id: string;
  displayId: string;
  name: string;
  email: string;
  phone: string;
  mobile: string;
  role: string;
  status: "Active" | "Inactive";
  createdAt: string;
  registrationDate: string;
  primaryAddress: string;
  addresses: {
    id: string;
    label: string;
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  }[];
  stats: {
    totalOrders: number;
    totalSpent: number;
    completedOrders: number;
    pendingOrders: number;
    cancelledOrders: number;
  };
}

interface OrderItemData {
  id: string;
  name: string;
  size: string;
  quantity: number;
  price: number;
  image: string;
  photos: string[];
  customizationDetails?: string | null;
}

interface OrderData {
  id: string;
  date: string;
  formattedDate: string;
  createdAt: string;
  updatedAt: string;
  customerName: string;
  customerPhone: string;
  customerEmail: string | null;
  shippingAddress: string;
  deliveryType: string;
  totalAmount: number;
  discount: number;
  status: string;
  rawDbStatus: string;
  items: OrderItemData[];
  totalQuantity: number;
  studio: {
    assigned: boolean;
    name: string;
    id: string;
    location: string;
    productionStatus: string;
    assignedDate: string;
  };
  delivery: {
    assigned: boolean;
    agentName: string;
    agentId: string;
    agentPhone: string;
    awb: string;
    shipmentStatus: string;
    pickupTime: string | null;
    deliveryTime: string | null;
    estimatedDelivery: string;
  };
  ambassador: {
    isReferred: boolean;
    name: string;
    id: string;
    referralCode: string;
    commissionStatus: string;
    commissionAmount: number;
  };
  payment: {
    status: string;
    method: string;
    paymentId: string;
    razorpayOrderId: string;
    amount: number;
    date: string;
  };
  history: {
    id: string;
    status: string;
    rawStatus: string;
    note?: string | null;
    createdAt: string;
  }[];
}

const TIMELINE_STAGES = [
  { step: 1, label: "Order Placed", key: "PLACED" },
  { step: 2, label: "Payment Confirmed", key: "PAYMENT_CONFIRMED" },
  { step: 3, label: "Sent to Photo Studio", key: "ASSIGNED_STUDIO" },
  { step: 4, label: "Studio Accepted", key: "ACCEPTED_BY_STUDIO" },
  { step: 5, label: "Customization / Design", key: "DESIGNING" },
  { step: 6, label: "Printing / Production", key: "PRINTING" },
  { step: 7, label: "Ready for Pickup", key: "READY_FOR_PICKUP" },
  { step: 8, label: "Delivery Assigned", key: "ASSIGNED_DELIVERY" },
  { step: 9, label: "Picked Up", key: "PICKED_UP" },
  { step: 10, label: "In Transit", key: "IN_TRANSIT" },
  { step: 11, label: "Out for Delivery", key: "OUT_FOR_DELIVERY" },
  { step: 12, label: "Delivered", key: "DELIVERED" },
];

function getStageProgress(order: OrderData): {
  currentStep: number;
  isCancelled: boolean;
} {
  const status = (order.rawDbStatus || "").toUpperCase();
  if (status === "CANCELLED" || status === "REFUNDED") {
    return { currentStep: 1, isCancelled: true };
  }

  switch (status) {
    case "DELIVERED":
      return { currentStep: 12, isCancelled: false };
    case "OUT_FOR_DELIVERY":
      return { currentStep: 11, isCancelled: false };
    case "PICKED_UP":
      return { currentStep: 9, isCancelled: false };
    case "ASSIGNED_DELIVERY":
      return { currentStep: 8, isCancelled: false };
    case "READY_FOR_PICKUP":
      return { currentStep: 7, isCancelled: false };
    case "QUALITY_CHECK":
    case "FRAMING":
    case "PRINTING":
      return { currentStep: 6, isCancelled: false };
    case "DESIGNING":
      return { currentStep: 5, isCancelled: false };
    case "ACCEPTED_BY_STUDIO":
      return { currentStep: 4, isCancelled: false };
    case "ASSIGNED_STUDIO":
      return { currentStep: 3, isCancelled: false };
    case "PLACED":
    default:
      if (order.payment.status === "SUCCESS") {
        return { currentStep: 2, isCancelled: false };
      }
      return { currentStep: 1, isCancelled: false };
  }
}

export default function CustomerDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const rawId = (params?.id as string) || "";
  const customerId = decodeURIComponent(rawId);

  const [customer, setCustomer] = useState<CustomerData | null>(null);
  const [orders, setOrders] = useState<OrderData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [selectedOrder, setSelectedOrder] = useState<OrderData | null>(null);
  const [photoModalUrl, setPhotoModalUrl] = useState<string | null>(null);
  const [isTogglingStatus, setIsTogglingStatus] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const fetchData = async () => {
    if (!customerId) return;
    setIsLoading(true);
    setError(null);

    try {
      const headers: Record<string, string> = {
        "x-admin-key": "pixello_admin_master_secret_2026",
      };
      if (typeof window !== "undefined") {
        const token =
          localStorage.getItem("pixello_admin_token") ||
          localStorage.getItem("pixello_auth_token");
        if (token) {
          headers["Authorization"] = `Bearer ${token}`;
        }
      }

      // 1. Fetch customer profile from dedicated API
      let loadedCustomer: CustomerData | null = null;
      try {
        const custRes = await fetch(`/api/admin/customers/${encodeURIComponent(customerId)}`, { headers });
        const custData = await custRes.json();
        if (custRes.ok && custData.success && custData.customer) {
          loadedCustomer = custData.customer;
        }
      } catch (e) {
        console.warn("Primary customer fetch failed, trying fallback directory:", e);
      }

      // 1b. Fallback: Search in /api/customers if not directly returned
      if (!loadedCustomer) {
        const allRes = await fetch("/api/customers");
        const allData = await allRes.json();
        if (allData.success && Array.isArray(allData.customers)) {
          const cleanSuffix = customerId.replace(/^CUST-/i, "").toLowerCase();
          const cleanQ = customerId.replace(/\D/g, "").slice(-10);

          const matched = allData.customers.find((c: any) => {
            const cClean = (c.mobile || c.phone || "").replace(/\D/g, "").slice(-10);
            return (
              c.id === customerId ||
              (c.displayId && c.displayId.toLowerCase() === customerId.toLowerCase()) ||
              (c.id && c.id.toLowerCase().endsWith(cleanSuffix)) ||
              (cleanQ && cClean === cleanQ) ||
              (c.name && c.name.toLowerCase() === customerId.toLowerCase())
            );
          });

          if (matched) {
            const addrList = matched.addresses || [];
            let primaryAddr = "Not available";
            if (addrList.length > 0) {
              const p = addrList[0];
              primaryAddr = `${p.street || ""}, ${p.city || ""}, ${p.state || ""} - ${p.zipCode || ""}`.replace(/^,\s*/, "");
            }
            loadedCustomer = {
              id: matched.id,
              displayId: matched.displayId || `CUST-${matched.id.slice(-4)}`,
              name: matched.name || "Customer",
              email: matched.email || "Not available",
              phone: matched.phone || "Not available",
              mobile: matched.mobile || "Not available",
              role: "CUSTOMER",
              status: matched.status || "Active",
              createdAt: matched.createdAt || new Date().toISOString(),
              registrationDate: matched.createdAt ? new Date(matched.createdAt).toLocaleDateString("en-IN", { year: "numeric", month: "short", day: "numeric" }) : "Not available",
              primaryAddress: primaryAddr,
              addresses: addrList,
              stats: {
                totalOrders: matched.orderCount || 0,
                totalSpent: matched.totalSpent || 0,
                completedOrders: 0,
                pendingOrders: matched.orderCount || 0,
                cancelledOrders: 0,
              },
            };
          }
        }
      }

      if (!loadedCustomer) {
        throw new Error("Customer not found.");
      }

      setCustomer(loadedCustomer);

      // 2. Fetch customer orders
      try {
        const ordersRes = await fetch(`/api/admin/customers/${encodeURIComponent(customerId)}/orders`, { headers });
        const ordersData = await ordersRes.json();

        if (ordersRes.ok && ordersData.success && Array.isArray(ordersData.orders)) {
          setOrders(ordersData.orders);
          
          // Refine stats with order breakdown if available
          const totalOrders = ordersData.orders.length;
          const totalSpent = ordersData.orders.reduce((sum: number, o: any) => sum + (o.totalAmount || 0), 0);
          const completedOrders = ordersData.orders.filter((o: any) => o.rawDbStatus === "DELIVERED").length;
          const cancelledOrders = ordersData.orders.filter((o: any) => o.rawDbStatus === "CANCELLED" || o.rawDbStatus === "REFUNDED").length;
          const pendingOrders = totalOrders - completedOrders - cancelledOrders;

          setCustomer((prev) => prev ? {
            ...prev,
            stats: {
              totalOrders,
              totalSpent,
              completedOrders,
              pendingOrders,
              cancelledOrders,
            }
          } : null);
        } else {
          setOrders([]);
        }
      } catch (orderErr) {
        console.warn("Could not load customer orders:", orderErr);
        setOrders([]);
      }
    } catch (err: any) {
      console.error("Error fetching customer details:", err);
      setError(err.message || "Unable to load customer information. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [customerId]);

  const handleToggleStatus = async () => {
    if (!customer) return;
    setIsTogglingStatus(true);
    const newStatus = customer.status === "Active" ? "Inactive" : "Active";

    try {
      const res = await fetch("/api/customers", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: customer.id,
          mobile: customer.mobile,
          status: newStatus,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setCustomer({ ...customer, status: newStatus });
        showToast(`Customer account marked as ${newStatus}.`);
      } else {
        throw new Error(data.error || "Failed to update status.");
      }
    } catch (err: any) {
      alert(err.message || "Failed to update customer status.");
    } finally {
      setIsTogglingStatus(false);
    }
  };

  const filteredOrders = orders.filter((o) => {
    const q = searchQuery.toLowerCase().trim();
    const matchesSearch =
      !q ||
      o.id.toLowerCase().includes(q) ||
      o.items.some((item) => item.name.toLowerCase().includes(q)) ||
      o.shippingAddress.toLowerCase().includes(q);

    if (!matchesSearch) return false;

    if (statusFilter === "ALL") return true;
    if (statusFilter === "DELIVERED") return o.rawDbStatus === "DELIVERED";
    if (statusFilter === "CANCELLED") return o.rawDbStatus === "CANCELLED" || o.rawDbStatus === "REFUNDED";
    if (statusFilter === "ACTIVE") return o.rawDbStatus !== "DELIVERED" && o.rawDbStatus !== "CANCELLED";

    return true;
  });

  if (isLoading) {
    return (
      <div className="flex flex-col gap-6 p-6 md:p-8 bg-[#F8F3EE] min-h-screen">
        <div className="flex items-center gap-3">
          <div className="h-9 w-24 bg-gray-200 animate-pulse rounded-full" />
          <div className="h-6 w-48 bg-gray-200 animate-pulse rounded-md" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="h-72 bg-white rounded-3xl border border-[#EFE6DD] animate-pulse p-6" />
          <div className="h-72 md:col-span-2 bg-white rounded-3xl border border-[#EFE6DD] animate-pulse p-6" />
        </div>
        <div className="h-96 bg-white rounded-3xl border border-[#EFE6DD] animate-pulse p-6" />
      </div>
    );
  }

  if (error || !customer) {
    return (
      <div className="flex flex-col items-center justify-center p-8 bg-[#F8F3EE] min-h-screen text-center">
        <div className="h-16 w-16 rounded-full bg-rose-50 border border-rose-200 flex items-center justify-center text-rose-600 mb-4 shadow-sm">
          <AlertCircle className="h-8 w-8" />
        </div>
        <h2 className="font-serif-brand text-2xl font-bold text-[#3A2B24] mb-2">
          {error || "Customer Not Found"}
        </h2>
        <p className="text-xs text-[#6C5C54] max-w-md mb-6 leading-relaxed">
          We couldn't retrieve the customer record from the database. The customer may have been removed or the identifier is invalid.
        </p>
        <div className="flex items-center gap-3">
          <Link href="/admin/customers">
            <Button className="btn-pixello-primary rounded-full px-6 h-11 text-xs font-bold shadow-xs">
              <ChevronLeft className="h-4 w-4 mr-1.5" /> Back to Registered Customers
            </Button>
          </Link>
          <Button
            variant="outline"
            onClick={fetchData}
            className="rounded-full px-5 h-11 text-xs font-bold border-[#EFE6DD] bg-white hover:bg-[#FFF8F2]"
          >
            <RefreshCw className="h-4 w-4 mr-1.5 text-[#D89A86]" /> Try Again
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 p-6 md:p-8 bg-[#F8F3EE] min-h-screen">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-20 right-8 z-50 bg-[#3A2B24] text-white px-5 py-3 rounded-2xl shadow-xl border border-[#D89A86]/40 flex items-center gap-2.5 animate-in fade-in slide-in-from-top-4 duration-300">
          <CheckCircle2 className="h-5 w-5 text-[#D89A86]" />
          <span className="text-xs font-bold">{toastMessage}</span>
        </div>
      )}

      {/* Top Header & Breadcrumb */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs text-[#6C5C54] mb-1.5 font-medium">
            <Link href="/admin" className="hover:text-[#3A2B24] transition-colors">Admin</Link>
            <ChevronRight className="h-3.5 w-3.5" />
            <Link href="/admin/customers" className="hover:text-[#3A2B24] transition-colors">Customers</Link>
            <ChevronRight className="h-3.5 w-3.5" />
            <span className="text-[#3A2B24] font-bold">{customer.name}</span>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/admin/customers">
              <Button
                variant="outline"
                size="sm"
                className="h-9 px-3 rounded-full border-[#EFE6DD] bg-white hover:bg-[#FFF8F2] text-xs font-bold text-[#3A2B24]"
              >
                <ChevronLeft className="h-4 w-4 mr-1 text-[#D89A86]" /> Back
              </Button>
            </Link>
            <h1 className="font-serif-brand text-2xl md:text-3xl font-bold text-[#3A2B24] tracking-tight">
              Customer Details
            </h1>
            <Badge className="bg-[#FFF8F2] text-[#3A2B24] border-[#D89A86]/40 font-mono font-bold text-xs px-2.5 py-0.5 rounded-full">
              {customer.displayId}
            </Badge>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            onClick={fetchData}
            className="rounded-full border-[#EFE6DD] bg-white text-xs font-bold h-10 px-4 hover:bg-[#FFF8F2] text-[#3A2B24]"
          >
            <RefreshCw className="h-3.5 w-3.5 mr-1.5 text-[#D89A86]" /> Refresh Data
          </Button>
          <Button
            onClick={handleToggleStatus}
            disabled={isTogglingStatus}
            className={cn(
              "rounded-full text-xs font-bold h-10 px-5 shadow-xs transition-all cursor-pointer",
              customer.status === "Active"
                ? "bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200"
                : "bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200"
            )}
          >
            <RotateCcw className="h-3.5 w-3.5 mr-1.5" />
            Make {customer.status === "Active" ? "Inactive" : "Active"}
          </Button>
        </div>
      </div>

      {/* Customer Profile & Statistics Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Profile Card */}
        <Card className="border border-[#EFE6DD] bg-white rounded-3xl shadow-xs overflow-hidden">
          <CardContent className="p-6 flex flex-col justify-between h-full gap-5">
            <div>
              <div className="flex items-start justify-between gap-3 pb-4 border-b border-[#EFE6DD]">
                <div className="flex items-center gap-3.5">
                  <Avatar className="h-14 w-14 border-2 border-[#D89A86]/30 bg-[#FFF8F2] shadow-sm">
                    <AvatarFallback className="font-serif-brand font-bold text-xl text-[#D89A86] bg-[#FFF8F2]">
                      {customer.name.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h2 className="font-serif-brand text-lg font-bold text-[#3A2B24]">
                      {customer.name}
                    </h2>
                    <p className="text-xs font-mono text-[#6C5C54] font-medium mt-0.5">
                      {customer.displayId} <span className="text-[10px] text-gray-400">({customer.id})</span>
                    </p>
                  </div>
                </div>
                <Badge
                  className={cn(
                    "text-xs px-3 py-1 rounded-full font-bold shadow-2xs",
                    customer.status === "Active"
                      ? "bg-emerald-100 text-emerald-800 border-emerald-200"
                      : "bg-rose-100 text-rose-800 border-rose-200"
                  )}
                >
                  {customer.status}
                </Badge>
              </div>

              <div className="flex flex-col gap-3.5 mt-4">
                <div className="flex items-center gap-2.5 text-xs text-[#3A2B24]">
                  <Mail className="h-4 w-4 text-[#D89A86] flex-shrink-0" />
                  <span className="font-semibold truncate">{customer.email || "Not available"}</span>
                </div>
                <div className="flex items-center gap-2.5 text-xs text-[#3A2B24]">
                  <Phone className="h-4 w-4 text-[#D89A86] flex-shrink-0" />
                  <span className="font-semibold">{customer.phone || "Not available"}</span>
                </div>
                <div className="flex items-center gap-2.5 text-xs text-[#3A2B24]">
                  <Calendar className="h-4 w-4 text-[#D89A86] flex-shrink-0" />
                  <span className="font-medium text-[#6C5C54]">
                    Registered: <strong className="text-[#3A2B24]">{customer.registrationDate}</strong>
                  </span>
                </div>
                <div className="flex items-center gap-2.5 text-xs text-[#3A2B24]">
                  <Shield className="h-4 w-4 text-[#D89A86] flex-shrink-0" />
                  <span className="font-medium text-[#6C5C54]">
                    Account Role: <strong className="text-[#3A2B24]">{customer.role}</strong>
                  </span>
                </div>
              </div>
            </div>

            {/* Saved Delivery Address */}
            <div className="p-3.5 bg-[#FFF8F2] rounded-2xl border border-[#EFE6DD]">
              <span className="text-[10px] font-bold text-[#6C5C54] uppercase tracking-wider block mb-1 flex items-center gap-1">
                <MapPin className="h-3 w-3 text-[#D89A86]" /> Primary Saved Delivery Address
              </span>
              <p className="text-xs text-[#3A2B24] font-semibold leading-relaxed">
                {customer.primaryAddress}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Statistics Cards */}
        <div className="lg:col-span-2 grid grid-cols-2 sm:grid-cols-3 gap-4">
          <Card className="border border-[#EFE6DD] bg-white rounded-3xl shadow-xs p-5 flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-[#6C5C54] uppercase tracking-wider">Total Orders</span>
              <div className="h-8 w-8 rounded-xl bg-[#FFF8F2] border border-[#EFE6DD] flex items-center justify-center text-[#D89A86]">
                <Package className="h-4 w-4" />
              </div>
            </div>
            <div className="mt-3">
              <h3 className="font-serif-brand text-2xl font-bold text-[#3A2B24]">
                {customer.stats.totalOrders}
              </h3>
              <p className="text-[11px] text-[#6C5C54] font-medium mt-0.5">Orders recorded in DB</p>
            </div>
          </Card>

          <Card className="border border-[#EFE6DD] bg-white rounded-3xl shadow-xs p-5 flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-[#6C5C54] uppercase tracking-wider">Total Spent</span>
              <div className="h-8 w-8 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-700">
                <IndianRupee className="h-4 w-4" />
              </div>
            </div>
            <div className="mt-3">
              <h3 className="font-serif-brand text-2xl font-bold text-emerald-700">
                ₹{customer.stats.totalSpent.toLocaleString("en-IN", { maximumFractionDigits: 2 })}
              </h3>
              <p className="text-[11px] text-[#6C5C54] font-medium mt-0.5">Authoritative revenue</p>
            </div>
          </Card>

          <Card className="border border-[#EFE6DD] bg-white rounded-3xl shadow-xs p-5 flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-[#6C5C54] uppercase tracking-wider">Completed</span>
              <div className="h-8 w-8 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-700">
                <CheckCircle2 className="h-4 w-4" />
              </div>
            </div>
            <div className="mt-3">
              <h3 className="font-serif-brand text-2xl font-bold text-emerald-800">
                {customer.stats.completedOrders}
              </h3>
              <p className="text-[11px] text-[#6C5C54] font-medium mt-0.5">Delivered to customer</p>
            </div>
          </Card>

          <Card className="border border-[#EFE6DD] bg-white rounded-3xl shadow-xs p-5 flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-[#6C5C54] uppercase tracking-wider">Pending / Active</span>
              <div className="h-8 w-8 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-700">
                <Clock className="h-4 w-4" />
              </div>
            </div>
            <div className="mt-3">
              <h3 className="font-serif-brand text-2xl font-bold text-amber-800">
                {customer.stats.pendingOrders}
              </h3>
              <p className="text-[11px] text-[#6C5C54] font-medium mt-0.5">In production / transit</p>
            </div>
          </Card>

          <Card className="border border-[#EFE6DD] bg-white rounded-3xl shadow-xs p-5 flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-[#6C5C54] uppercase tracking-wider">Cancelled</span>
              <div className="h-8 w-8 rounded-xl bg-rose-50 border border-rose-200 flex items-center justify-center text-rose-700">
                <XCircle className="h-4 w-4" />
              </div>
            </div>
            <div className="mt-3">
              <h3 className="font-serif-brand text-2xl font-bold text-rose-700">
                {customer.stats.cancelledOrders}
              </h3>
              <p className="text-[11px] text-[#6C5C54] font-medium mt-0.5">Cancelled / refunded</p>
            </div>
          </Card>

          <Card className="border border-[#EFE6DD] bg-white rounded-3xl shadow-xs p-5 flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-[#6C5C54] uppercase tracking-wider">Avg Order Value</span>
              <div className="h-8 w-8 rounded-xl bg-[#FFF8F2] border border-[#EFE6DD] flex items-center justify-center text-[#D89A86]">
                <Sparkles className="h-4 w-4" />
              </div>
            </div>
            <div className="mt-3">
              <h3 className="font-serif-brand text-2xl font-bold text-[#3A2B24]">
                ₹{customer.stats.totalOrders > 0 ? Math.round(customer.stats.totalSpent / customer.stats.totalOrders).toLocaleString("en-IN") : "0"}
              </h3>
              <p className="text-[11px] text-[#6C5C54] font-medium mt-0.5">Per order average</p>
            </div>
          </Card>
        </div>
      </div>

      {/* Orders Section */}
      <Card className="border border-[#EFE6DD] bg-white rounded-3xl shadow-xs overflow-hidden">
        <CardContent className="p-6 md:p-8 flex flex-col gap-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#EFE6DD]">
            <div>
              <h2 className="font-serif-brand text-xl font-bold text-[#3A2B24]">
                All Orders for {customer.name}
              </h2>
              <p className="text-xs text-[#6C5C54] mt-0.5 font-medium">
                {orders.length} Total orders fetched from Prisma database
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-3">
              {/* Search */}
              <div className="relative w-full sm:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[#6C5C54]" />
                <Input
                  placeholder="Search order ID or product..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 rounded-full border-[#EFE6DD] bg-[#FFF8F2] text-xs font-medium text-[#3A2B24] focus-visible:ring-[#D89A86] h-9"
                />
              </div>

              {/* Status Filter Tabs */}
              <div className="flex items-center gap-1 bg-[#FFF8F2] p-1 rounded-full border border-[#EFE6DD]">
                {[
                  { label: "All", value: "ALL" },
                  { label: "Active", value: "ACTIVE" },
                  { label: "Delivered", value: "DELIVERED" },
                  { label: "Cancelled", value: "CANCELLED" },
                ].map((tab) => (
                  <button
                    key={tab.value}
                    onClick={() => setStatusFilter(tab.value)}
                    className={cn(
                      "px-3 py-1 rounded-full text-xs font-bold transition-all cursor-pointer",
                      statusFilter === tab.value
                        ? "bg-[#3A2B24] text-white shadow-2xs"
                        : "text-[#6C5C54] hover:text-[#3A2B24]"
                    )}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Orders Table */}
          <div className="overflow-hidden border border-[#EFE6DD] rounded-2xl">
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="text-[11px] font-bold text-[#6C5C54] uppercase tracking-wider bg-[#FFF8F2] border-b border-[#EFE6DD]">
                  <tr>
                    <th className="px-4 py-3.5">Order ID &amp; Date</th>
                    <th className="px-4 py-3.5">Products / Items</th>
                    <th className="px-4 py-3.5">Total Amount</th>
                    <th className="px-4 py-3.5">Payment</th>
                    <th className="px-4 py-3.5">Order Status</th>
                    <th className="px-4 py-3.5">Photo Studio</th>
                    <th className="px-4 py-3.5">Delivery Agent</th>
                    <th className="px-4 py-3.5 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#EFE6DD]">
                  {filteredOrders.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="text-center py-12 text-xs text-[#6C5C54]">
                        {searchQuery || statusFilter !== "ALL"
                          ? "No orders match your filter criteria."
                          : "No orders found for this customer."}
                      </td>
                    </tr>
                  ) : (
                    filteredOrders.map((order) => (
                      <tr
                        key={order.id}
                        onClick={() => setSelectedOrder(order)}
                        className="hover:bg-[#FFF8F2]/60 transition-colors cursor-pointer group"
                      >
                        {/* Order ID & Date */}
                        <td className="px-4 py-4">
                          <span className="font-mono font-bold text-xs text-[#3A2B24] group-hover:text-[#D89A86] transition-colors">
                            {order.id}
                          </span>
                          <span className="text-[11px] text-[#6C5C54] font-medium block mt-0.5">
                            {order.formattedDate}
                          </span>
                        </td>

                        {/* Products / Items */}
                        <td className="px-4 py-4">
                          <div className="flex items-center gap-2">
                            {order.items.slice(0, 2).map((item, idx) => (
                              <div
                                key={idx}
                                className="h-9 w-9 rounded-xl border border-[#EFE6DD] bg-white overflow-hidden flex-shrink-0 shadow-2xs"
                              >
                                <img
                                  src={item.image || "/images/wooden_frame_main.png"}
                                  alt={item.name}
                                  className="h-full w-full object-cover"
                                />
                              </div>
                            ))}
                            <div className="min-w-0 max-w-[160px]">
                              <p className="font-bold text-xs text-[#3A2B24] truncate">
                                {order.items[0]?.name || "Custom Frame"}
                              </p>
                              <span className="text-[10px] text-[#6C5C54]">
                                {order.totalQuantity} items total
                              </span>
                            </div>
                          </div>
                        </td>

                        {/* Total Amount */}
                        <td className="px-4 py-4 font-extrabold text-sm text-[#D89A86]">
                          ₹{order.totalAmount.toLocaleString("en-IN")}
                        </td>

                        {/* Payment */}
                        <td className="px-4 py-4">
                          <Badge
                            className={cn(
                              "text-[10px] font-bold px-2 py-0.5 rounded-md",
                              order.payment.status === "SUCCESS"
                                ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                                : "bg-amber-50 text-amber-800 border-amber-200"
                            )}
                          >
                            {order.payment.method} • {order.payment.status}
                          </Badge>
                        </td>

                        {/* Order Status */}
                        <td className="px-4 py-4">
                          <Badge
                            className={cn(
                              "text-xs px-2.5 py-0.5 rounded-full font-bold shadow-2xs",
                              order.rawDbStatus === "DELIVERED"
                                ? "bg-emerald-100 text-emerald-800 border-emerald-200"
                                : order.rawDbStatus === "CANCELLED" || order.rawDbStatus === "REFUNDED"
                                ? "bg-rose-100 text-rose-800 border-rose-200"
                                : "bg-amber-100 text-amber-900 border-amber-200"
                            )}
                          >
                            {order.status}
                          </Badge>
                        </td>

                        {/* Photo Studio */}
                        <td className="px-4 py-4 text-xs text-[#3A2B24] font-medium truncate max-w-[140px]">
                          {order.studio.name}
                        </td>

                        {/* Delivery Agent */}
                        <td className="px-4 py-4 text-xs text-[#3A2B24] font-medium truncate max-w-[140px]">
                          {order.delivery.agentName}
                        </td>

                        {/* Action */}
                        <td className="px-4 py-4 text-right">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedOrder(order);
                            }}
                            className="rounded-full text-xs font-bold px-3.5 h-8 border-[#EFE6DD] bg-white hover:bg-[#FFF8F2] text-[#3A2B24] cursor-pointer shadow-2xs group-hover:border-[#D89A86]"
                          >
                            View Order <ChevronRight className="h-3.5 w-3.5 ml-1 text-[#D89A86]" />
                          </Button>
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

      {/* Complete Order Details Modal & Visual 12-Stage Timeline */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-200">
          <div className="bg-white border border-[#EFE6DD] rounded-3xl shadow-2xl max-w-4xl w-full max-h-[90vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200 my-auto">
            {/* Modal Header */}
            <div className="p-5 md:p-6 bg-[#3A2B24] text-white flex items-center justify-between flex-shrink-0">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-2xl bg-[#FFF8F2]/15 border border-[#D89A86]/40 flex items-center justify-center text-[#D89A86]">
                  <Package className="h-5 w-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-serif-brand font-bold text-lg text-white">
                      Order {selectedOrder.id}
                    </h3>
                    <Badge className="bg-[#D89A86] text-white border-none text-[10px] font-bold px-2 py-0.5 rounded-full">
                      {selectedOrder.status}
                    </Badge>
                  </div>
                  <p className="text-[11px] text-[#EFE6DD]/80 mt-0.5">
                    Placed on {selectedOrder.formattedDate}
                  </p>
                </div>
              </div>

              <button
                onClick={() => setSelectedOrder(null)}
                className="h-9 w-9 rounded-full bg-[#FFF8F2]/10 hover:bg-[#FFF8F2]/25 text-white flex items-center justify-center cursor-pointer transition-colors border border-white/20"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto flex flex-col gap-6 bg-[#FAF6F2]">
              {/* 1. VISUAL 12-STAGE ORDER TIMELINE */}
              <div className="p-5 bg-white border border-[#EFE6DD] rounded-3xl shadow-2xs">
                <div className="flex items-center justify-between mb-4 pb-2 border-b border-[#EFE6DD]">
                  <span className="font-serif-brand text-base font-bold text-[#3A2B24] flex items-center gap-2">
                    <Clock className="h-4 w-4 text-[#D89A86]" /> Order Stage Timeline (12 Stages)
                  </span>
                  <Badge
                    className={cn(
                      "text-xs px-3 py-0.5 rounded-full font-bold",
                      selectedOrder.rawDbStatus === "DELIVERED"
                        ? "bg-emerald-100 text-emerald-800 border-emerald-200"
                        : selectedOrder.rawDbStatus === "CANCELLED" || selectedOrder.rawDbStatus === "REFUNDED"
                        ? "bg-rose-100 text-rose-800 border-rose-200"
                        : "bg-amber-100 text-amber-900 border-amber-200"
                    )}
                  >
                    Current: {selectedOrder.status}
                  </Badge>
                </div>

                {/* Stepper Grid */}
                {(() => {
                  const { currentStep, isCancelled } = getStageProgress(selectedOrder);

                  if (isCancelled) {
                    return (
                      <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl text-rose-900 flex items-center gap-3">
                        <XCircle className="h-6 w-6 text-rose-600 flex-shrink-0" />
                        <div>
                          <h4 className="font-bold text-xs">Order Cancelled</h4>
                          <p className="text-[11px] text-rose-700 mt-0.5">
                            This order was cancelled / refunded on {selectedOrder.formattedDate}. Production and delivery halted.
                          </p>
                        </div>
                      </div>
                    );
                  }

                  return (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5">
                      {TIMELINE_STAGES.map((stage) => {
                        const isPassed = stage.step < currentStep;
                        const isCurrent = stage.step === currentStep;
                        const isPending = stage.step > currentStep;

                        return (
                          <div
                            key={stage.step}
                            className={cn(
                              "p-2.5 rounded-2xl border transition-all flex items-start gap-2",
                              isCurrent
                                ? "border-[#D89A86] bg-[#FFF8F2] ring-2 ring-[#D89A86]/30 shadow-xs"
                                : isPassed
                                ? "border-emerald-200 bg-emerald-50/60 text-emerald-950"
                                : "border-[#EFE6DD] bg-white opacity-60"
                            )}
                          >
                            <div
                              className={cn(
                                "h-6 w-6 rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0 mt-0.5",
                                isCurrent
                                  ? "bg-[#3A2B24] text-white"
                                  : isPassed
                                  ? "bg-emerald-600 text-white"
                                  : "bg-[#EFE6DD] text-[#6C5C54]"
                              )}
                            >
                              {isPassed ? <Check className="h-3.5 w-3.5" /> : stage.step}
                            </div>
                            <div className="min-w-0">
                              <p
                                className={cn(
                                  "text-[11px] font-bold leading-tight",
                                  isCurrent ? "text-[#3A2B24]" : isPassed ? "text-emerald-900" : "text-[#6C5C54]"
                                )}
                              >
                                {stage.label}
                              </p>
                              <span className="text-[9px] font-semibold block mt-0.5 text-[#D89A86]">
                                {isCurrent ? "Active Stage" : isPassed ? "Completed" : "Pending"}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  );
                })()}
              </div>

              {/* 2. ORDER ITEMS & CUSTOM PHOTO UPLOADS */}
              <div className="p-5 bg-white border border-[#EFE6DD] rounded-3xl shadow-2xs">
                <span className="font-serif-brand text-base font-bold text-[#3A2B24] block mb-3 pb-2 border-b border-[#EFE6DD]">
                  Order Products &amp; Uploaded Photos ({selectedOrder.items.length} Unique Items)
                </span>

                <div className="flex flex-col gap-3">
                  {selectedOrder.items.map((item, idx) => (
                    <div
                      key={idx}
                      className="p-3.5 rounded-2xl border border-[#EFE6DD] bg-[#FFF8F2]/50 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3"
                    >
                      <div className="flex items-center gap-3">
                        <div className="h-14 w-14 rounded-2xl border border-[#EFE6DD] bg-white overflow-hidden flex-shrink-0 shadow-2xs">
                          <img
                            src={item.image || "/images/wooden_frame_main.png"}
                            alt={item.name}
                            className="h-full w-full object-cover"
                          />
                        </div>
                        <div>
                          <h4 className="font-bold text-xs text-[#3A2B24]">{item.name}</h4>
                          <span className="text-[11px] text-[#D89A86] font-semibold block">
                            Size / Model: {item.size}
                          </span>
                          <span className="text-[11px] text-[#6C5C54]">
                            Qty: <strong>{item.quantity}</strong> × ₹{item.price} ={" "}
                            <strong className="text-[#3A2B24]">₹{item.quantity * item.price}</strong>
                          </span>
                        </div>
                      </div>

                      {/* Custom Photos Preview */}
                      {item.photos && item.photos.length > 0 && (
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-bold text-[#6C5C54] uppercase tracking-wider">
                            Uploaded Photos ({item.photos.length}):
                          </span>
                          <div className="flex items-center gap-1.5">
                            {item.photos.slice(0, 3).map((photoUrl, pIdx) => (
                              <div
                                key={pIdx}
                                onClick={() => setPhotoModalUrl(photoUrl)}
                                className="h-10 w-10 rounded-xl border-2 border-[#D89A86] overflow-hidden cursor-pointer hover:scale-105 transition-transform shadow-xs relative group"
                                title="Click to view full photo"
                              >
                                <img src={photoUrl} alt="Uploaded" className="h-full w-full object-cover" />
                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                                  <Eye className="h-3.5 w-3.5 text-white" />
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* 3. FOUR KEY PILLARS (Customer, Payment, Studio, Delivery) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Customer Info */}
                <div className="p-4 bg-white border border-[#EFE6DD] rounded-2xl">
                  <span className="text-xs font-bold text-[#3A2B24] uppercase tracking-wider mb-2 block flex items-center gap-1.5">
                    <Users className="h-3.5 w-3.5 text-[#D89A86]" /> Customer Information
                  </span>
                  <div className="text-xs text-[#6C5C54] flex flex-col gap-1.5">
                    <p>Name: <strong className="text-[#3A2B24]">{selectedOrder.customerName}</strong></p>
                    <p>Phone: <strong className="text-[#3A2B24]">{selectedOrder.customerPhone}</strong></p>
                    <p>Email: <strong className="text-[#3A2B24]">{selectedOrder.customerEmail || "Not available"}</strong></p>
                    <p className="leading-tight">Address: <strong className="text-[#3A2B24]">{selectedOrder.shippingAddress}</strong></p>
                  </div>
                </div>

                {/* Payment Info */}
                <div className="p-4 bg-white border border-[#EFE6DD] rounded-2xl">
                  <span className="text-xs font-bold text-[#3A2B24] uppercase tracking-wider mb-2 block flex items-center gap-1.5">
                    <CreditCard className="h-3.5 w-3.5 text-[#D89A86]" /> Payment &amp; Razorpay Gateway
                  </span>
                  <div className="text-xs text-[#6C5C54] flex flex-col gap-1.5">
                    <p>Status: <strong className="text-emerald-700">{selectedOrder.payment.status}</strong></p>
                    <p>Method: <strong className="text-[#3A2B24]">{selectedOrder.payment.method}</strong></p>
                    <p className="truncate">Payment ID: <strong className="text-[#3A2B24] font-mono">{selectedOrder.payment.paymentId}</strong></p>
                    <p>Amount Paid: <strong className="text-[#D89A86] text-sm font-bold">₹{selectedOrder.payment.amount}</strong></p>
                  </div>
                </div>

                {/* Photo Studio Info */}
                <div className="p-4 bg-white border border-[#EFE6DD] rounded-2xl">
                  <span className="text-xs font-bold text-[#3A2B24] uppercase tracking-wider mb-2 block flex items-center gap-1.5">
                    <Store className="h-3.5 w-3.5 text-[#D89A86]" /> Photo Studio Assignment
                  </span>
                  <div className="text-xs text-[#6C5C54] flex flex-col gap-1.5">
                    <p>Studio Name: <strong className="text-[#3A2B24]">{selectedOrder.studio.name}</strong></p>
                    <p>Studio ID: <strong className="text-[#3A2B24] font-mono">{selectedOrder.studio.id}</strong></p>
                    <p>Production Status: <strong className="text-[#3A2B24]">{selectedOrder.studio.productionStatus}</strong></p>
                    <p>Location: <strong className="text-[#3A2B24]">{selectedOrder.studio.location}</strong></p>
                  </div>
                </div>

                {/* Delivery & Tracking Info */}
                <div className="p-4 bg-white border border-[#EFE6DD] rounded-2xl">
                  <span className="text-xs font-bold text-[#3A2B24] uppercase tracking-wider mb-2 block flex items-center gap-1.5">
                    <Truck className="h-3.5 w-3.5 text-[#D89A86]" /> Delivery &amp; Tracking
                  </span>
                  <div className="text-xs text-[#6C5C54] flex flex-col gap-1.5">
                    <p>Delivery Agent: <strong className="text-[#3A2B24]">{selectedOrder.delivery.agentName}</strong></p>
                    <p>Agent Contact: <strong className="text-[#3A2B24]">{selectedOrder.delivery.agentPhone}</strong></p>
                    <p>AWB / Tracking: <strong className="text-[#3A2B24] font-mono">{selectedOrder.delivery.awb}</strong></p>
                    <p>Estimated Delivery: <strong className="text-[#3A2B24]">{selectedOrder.delivery.estimatedDelivery}</strong></p>
                  </div>
                </div>
              </div>

              {/* Ambassador Referral Bar */}
              <div className="p-3.5 bg-[#FFF8F2] border border-[#EFE6DD] rounded-2xl flex items-center justify-between text-xs text-[#3A2B24]">
                <div className="flex items-center gap-2">
                  <BadgePercent className="h-4 w-4 text-[#D89A86]" />
                  <span>
                    Ambassador Referral: <strong>{selectedOrder.ambassador.name}</strong>{" "}
                    {selectedOrder.ambassador.referralCode !== "None" && (
                      <span className="font-mono text-[#D89A86]">({selectedOrder.ambassador.referralCode})</span>
                    )}
                  </span>
                </div>
                {selectedOrder.ambassador.isReferred && (
                  <Badge className="bg-[#3A2B24] text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                    Commission: ₹{selectedOrder.ambassador.commissionAmount} ({selectedOrder.ambassador.commissionStatus})
                  </Badge>
                )}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-white border-t border-[#EFE6DD] flex items-center justify-end gap-3 flex-shrink-0">
              <Button
                variant="outline"
                onClick={() => setSelectedOrder(null)}
                className="rounded-full px-6 text-xs font-bold border-[#EFE6DD]"
              >
                Close
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Pop-up Full Image View Modal */}
      {photoModalUrl && (
        <div
          onClick={() => setPhotoModalUrl(null)}
          className="fixed inset-0 z-[60] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 cursor-pointer animate-in fade-in"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="max-w-2xl max-h-[85vh] bg-white rounded-3xl p-2 overflow-hidden shadow-2xl relative"
          >
            <button
              onClick={() => setPhotoModalUrl(null)}
              className="absolute top-4 right-4 h-9 w-9 rounded-full bg-black/60 text-white flex items-center justify-center cursor-pointer hover:bg-black/80 transition-colors z-10"
            >
              <X className="h-4 w-4" />
            </button>
            <img src={photoModalUrl} alt="Full resolution" className="max-h-[80vh] w-auto object-contain rounded-2xl" />
          </div>
        </div>
      )}
    </div>
  );
}
