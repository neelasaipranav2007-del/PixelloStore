"use client";

import React, { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  CheckCircle2,
  Package,
  Calendar,
  MapPin,
  CreditCard,
  Truck,
  ArrowRight,
  ShoppingBag,
  Printer,
  Sparkles,
  Gift,
  ShieldCheck,
  Camera,
  Layers,
  Heart,
  AlertCircle,
  FileText,
  Clock,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface OrderDetailItem {
  id: string;
  productId?: string;
  name: string;
  size: string;
  quantity: number;
  price: number;
  image?: string;
  photos?: string[];
  isHamper?: boolean;
  hamperData?: any;
  customizationDetails?: any;
}

interface OrderDetail {
  id: string;
  customerName: string;
  customerPhone: string;
  shippingAddress: string;
  totalAmount: number;
  status: string;
  rawStatus: string;
  createdAt: string;
  isSurpriseGift?: boolean;
  surpriseGiftMessage?: string | null;
  items: OrderDetailItem[];
  deliveryInfo?: {
    deliveryPartnerName?: string;
    deliveryStatus?: string;
    awbNumber?: string;
    estimatedDeliveryDate?: string;
    trackingUrl?: string;
  } | null;
  transaction?: {
    paymentMethod: string;
    status: string;
    amount: number;
  } | null;
}

function OrderSuccessContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const orderId = searchParams.get("orderId");

  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [fetchError, setFetchError] = useState<string | null>(null);

  useEffect(() => {
    if (!orderId) {
      setFetchError("No order reference provided in URL.");
      setIsLoading(false);
      return;
    }

    const loadOrder = async () => {
      try {
        setIsLoading(true);
        const res = await fetch(`/api/orders/${encodeURIComponent(orderId)}`);
        const data = await res.json();

        if (data.success && data.order) {
          setOrder(data.order);
        } else {
          setFetchError(data.error || "Order not found or access unauthorized.");
        }
      } catch (err: any) {
        setFetchError("Failed to communicate with PixelloStore order server.");
      } finally {
        setIsLoading(false);
      }
    };

    loadOrder();
  }, [orderId]);

  if (isLoading) {
    return (
      <div className="min-h-[70vh] bg-[#FFFBF7] flex flex-col items-center justify-center p-6 text-center">
        <div className="h-16 w-16 rounded-full border-4 border-[#D89A86]/30 border-t-[#D89A86] animate-spin mb-4" />
        <h2 className="font-serif-brand text-xl font-bold text-[#3A2B24]">
          Retrieving Your Memory Archive Order...
        </h2>
        <p className="text-xs text-[#6C5C54] mt-1">Verifying encrypted payment & database records</p>
      </div>
    );
  }

  if (fetchError || !order) {
    return (
      <div className="min-h-[70vh] bg-[#FFFBF7] flex flex-col items-center justify-center p-6 text-center">
        <div className="h-16 w-16 rounded-full bg-rose-50 border border-rose-200 text-rose-600 flex items-center justify-center mb-4">
          <AlertCircle className="h-8 w-8" />
        </div>
        <h2 className="font-serif-brand text-2xl font-bold text-[#3A2B24]">
          Order Verification Notice
        </h2>
        <p className="text-sm text-[#6C5C54] mt-1.5 max-w-md leading-relaxed">
          {fetchError || "We could not find the requested order record in the archive."}
        </p>
        <div className="flex items-center gap-3 mt-6">
          <Link href="/profile?tab=orders">
            <Button className="btn-pixello-primary rounded-full px-6 text-xs font-bold shadow-md">
              View My Orders
            </Button>
          </Link>
          <Link href="/products">
            <Button variant="outline" className="rounded-full text-xs font-bold border-[#EFE6DD]">
              Return to Catalog
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  // Format Order ID for consistent display across tracking, profile, and admin
  const orderIdClean = order.id.replace(/^#/, "");
  const formattedOrderNumber = `#${orderIdClean}`;
  const isCod = order.transaction?.paymentMethod?.toLowerCase().includes("cod") || order.transaction?.paymentMethod?.toLowerCase().includes("delivery");
  const isConfirmed = order.rawStatus === "CONFIRMED" || order.rawStatus === "PAYMENT_CONFIRMED" || order.rawStatus === "ORDER_CONFIRMED" || order.rawStatus === "PLACED";

  return (
    <div className="min-h-screen bg-[#FFFDFB] text-[#3A2B24] pt-8 pb-24 px-4 sm:px-6 lg:px-8">
      {/* Decorative Floating Sparkles Background */}
      <div className="max-w-4xl mx-auto space-y-8">
        {/* ========================================================= */}
        {/* 1. HERO CELEBRATION CARD                                  */}
        {/* ========================================================= */}
        <div className="bg-white rounded-3xl p-6 sm:p-10 border border-[#EFE6DD] shadow-xl text-center relative overflow-hidden">
          {/* Subtle Confetti Top Gradient */}
          <div className="absolute top-0 inset-x-0 h-2 bg-gradient-to-r from-[#D89A86] via-[#B55B68] to-[#D89A86]" />

          {/* Memory Archive Pill Badge */}
          <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-[#FFF2EB] border border-[#F3DACF] text-[#D89A86] text-xs font-extrabold mb-4 shadow-2xs">
            <Sparkles className="h-3.5 w-3.5" />
            <span>Pixello Memory Archive • Order Confirmed</span>
          </div>

          {/* Animated Memory Preservation Illustration */}
          <div className="relative mx-auto h-24 w-24 mb-4 flex items-center justify-center">
            <div className="absolute inset-0 rounded-full bg-[#FFF2EB] animate-pulse" />
            <div className="relative h-18 w-18 rounded-2xl bg-gradient-to-tr from-[#D89A86] to-[#F3DACF] shadow-lg flex items-center justify-center text-white transform hover:scale-105 transition-transform">
              <Gift className="h-9 w-9 text-white stroke-[2]" />
            </div>
            {/* Small floating sparkles */}
            <div className="absolute -top-1 -right-1 h-6 w-6 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center text-xs shadow-xs animate-bounce">
              ✨
            </div>
          </div>

          {/* Heading and Subtitle */}
          <h1 className="font-serif-brand text-3xl sm:text-4xl font-extrabold text-[#3A2B24] tracking-tight">
            Thank You for Trusting PixelloStore!
          </h1>
          <p className="text-sm sm:text-base text-[#6C5C54] mt-2 font-medium max-w-xl mx-auto leading-relaxed">
            Your order has been received. We're preparing your personalized memories with care.
          </p>

          {/* Payment & Order Confirmed Badge */}
          <div className="mt-5 inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-extrabold shadow-2xs">
            <CheckCircle2 className="h-4 w-4 text-emerald-600" />
            <span>
              {isCod ? "Cash on Delivery Order Confirmed" : "Payment & Order Confirmed"}
            </span>
          </div>

          {/* Tracking Order Number Highlight */}
          <div className="mt-8 p-4 sm:p-5 rounded-2xl bg-[#FFF8F2] border border-[#EFE6DD] max-w-md mx-auto flex flex-col items-center shadow-2xs">
            <span className="text-[11px] font-extrabold text-[#6C5C54] uppercase tracking-wider block">
              YOUR TRACKING ORDER NUMBER
            </span>
            <span className="font-mono text-xl sm:text-2xl font-black text-[#D89A86] tracking-wider mt-1">
              {formattedOrderNumber}
            </span>
            <span className="text-[11px] text-[#9E8E84] mt-1 font-mono">
              Order Number: {formattedOrderNumber}
            </span>
          </div>

          {/* SURPRISE GIFT BADGE & LUXURY PACKAGING CARD */}
          {order.isSurpriseGift && (
            <div className="mt-5 p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-[#FFF8F2] to-[#FFF4ED] border border-[#F2C8B5] text-left flex items-start gap-3.5 shadow-2xs max-w-lg mx-auto">
              <div className="h-10 w-10 rounded-xl bg-[#D89A86]/15 border border-[#D89A86]/30 flex items-center justify-center text-lg shrink-0">
                🎁
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-bold text-sm text-[#3A2B24]">Surprise Gift Packaging Active</span>
                  <Badge className="bg-[#D89A86] text-white border-none text-[10px] font-bold">
                    Discreet Luxury Delivery
                  </Badge>
                </div>
                <p className="text-xs text-[#6C5C54] mt-1 leading-relaxed">
                  Price tags and invoice amounts are strictly omitted from the parcel. Packed in discreet luxury gift wrap with our wax-sealed complimentary card.
                </p>
                {order.surpriseGiftMessage && (
                  <div className="mt-2.5 p-3 rounded-xl bg-white/90 border border-[#F2C8B5] text-xs text-[#3A2B24]">
                    <span className="font-bold text-[#D89A86] block text-[11px] mb-0.5">Wax-Sealed Card Message:</span>
                    <span className="italic font-serif text-[#3A2B24]">&ldquo;{order.surpriseGiftMessage}&rdquo;</span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* ========================================================= */}
        {/* 2. ORDER DETAILS & PURCHASED PRODUCTS                     */}
        {/* ========================================================= */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[#EFE6DD] shadow-sm space-y-6">
          <div className="flex items-center justify-between pb-4 border-b border-[#EFE6DD]">
            <h2 className="font-serif-brand text-xl font-bold text-[#3A2B24] flex items-center gap-2">
              <FileText className="h-5 w-5 text-[#D89A86]" />
              Order Summary & Details
            </h2>

            <Button
              variant="outline"
              size="sm"
              onClick={() => window.print()}
              className="rounded-full text-xs font-bold border-[#EFE6DD] text-[#3A2B24] flex items-center gap-1.5"
            >
              <Printer className="h-3.5 w-3.5" />
              <span>Print Receipt</span>
            </Button>
          </div>

          {/* Metadata Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            <div className="p-3.5 rounded-2xl bg-[#FFFBF7] border border-[#EFE6DD]">
              <span className="text-[#6C5C54] block mb-1 font-medium flex items-center gap-1">
                <Calendar className="h-3.5 w-3.5 text-[#D89A86]" /> Order Date:
              </span>
              <strong className="text-[#3A2B24] block">
                {new Date(order.createdAt).toLocaleDateString("en-IN", {
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </strong>
            </div>

            <div className="p-3.5 rounded-2xl bg-[#FFFBF7] border border-[#EFE6DD]">
              <span className="text-[#6C5C54] block mb-1 font-medium flex items-center gap-1">
                <CreditCard className="h-3.5 w-3.5 text-[#D89A86]" /> Payment Method:
              </span>
              <strong className="text-[#3A2B24] block">
                {order.transaction?.paymentMethod || (isCod ? "Cash on Delivery (COD)" : "UPI / Online Payment")}
              </strong>
            </div>

            <div className="p-3.5 rounded-2xl bg-[#FFFBF7] border border-[#EFE6DD]">
              <span className="text-[#6C5C54] block mb-1 font-medium flex items-center gap-1">
                <Truck className="h-3.5 w-3.5 text-[#D89A86]" /> Delivery Method:
              </span>
              <strong className="text-[#3A2B24] block">
                Doorstep Express Shipping
              </strong>
            </div>
          </div>

          {/* Delivery Address */}
          <div className="p-4 rounded-2xl bg-[#FFFBF7] border border-[#EFE6DD] text-xs">
            <span className="text-[#6C5C54] block mb-1 font-medium flex items-center gap-1">
              <MapPin className="h-3.5 w-3.5 text-[#D89A86]" /> Shipping To:
            </span>
            <p className="font-bold text-[#3A2B24]">{order.customerName} • {order.customerPhone}</p>
            <p className="text-[#6C5C54] mt-0.5 leading-relaxed">{order.shippingAddress}</p>
          </div>

          {/* Purchased Items List with Frame & Hamper Customizations */}
          <div className="space-y-3 pt-2">
            <h3 className="text-xs font-extrabold uppercase tracking-wider text-[#6C5C54]">
              Purchased Keepsakes ({order.items.length} items)
            </h3>

            <div className="space-y-3">
              {order.items.map((it, idx) => {
                const customDetails = it.customizationDetails || {};
                const frameCustom = customDetails.frameCustomization || (it as any).frameCustomization;
                const hamperData = customDetails.hamperData || it.hamperData;
                const photoThumbnail = it.photos?.[0] || it.image || "/images/wooden_frame_main.png";

                return (
                  <div
                    key={it.id || idx}
                    className="p-4 rounded-2xl border border-[#EFE6DD] bg-[#FFFDFB] flex flex-col md:flex-row md:items-center justify-between gap-4"
                  >
                    <div className="flex items-start gap-4 min-w-0">
                      {/* Photo or Catalog Thumbnail */}
                      <div className="relative h-16 w-16 rounded-xl overflow-hidden bg-white border border-[#EFE6DD] shrink-0 shadow-xs">
                        <img
                          src={photoThumbnail}
                          alt={it.name}
                          className="w-full h-full object-cover"
                        />
                        {it.photos && it.photos.length > 0 && (
                          <div className="absolute bottom-0 inset-x-0 bg-black/60 text-white text-[8px] font-bold text-center py-0.5">
                            Customer Photo
                          </div>
                        )}
                      </div>

                      <div className="min-w-0">
                        <h4 className="text-sm font-bold text-[#3A2B24]">{it.name}</h4>
                        <span className="text-xs text-[#6C5C54] block mt-0.5 font-medium">
                          Size & Variant: {it.size}
                        </span>

                        {/* If Frame Customization is present */}
                        {frameCustom && (
                          <div className="mt-2 flex flex-wrap gap-1.5">
                            <span className="text-[10px] font-bold bg-[#FFF2EB] text-[#D89A86] px-2 py-0.5 rounded-md border border-[#F3DACF]">
                              Wood: {frameCustom.colorName || "Natural Pine"}
                            </span>
                            <span className="text-[10px] font-bold bg-[#FAF5F0] text-[#6C5C54] px-2 py-0.5 rounded-md border border-[#EFE6DD]">
                              Finish: {frameCustom.gsm || "180 GSM"} Silk
                            </span>
                            {frameCustom.customInscription && (
                              <span className="text-[10px] italic font-semibold text-[#5A463B] bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
                                Inscription: "{frameCustom.customInscription}"
                              </span>
                            )}
                          </div>
                        )}

                        {/* If Hamper Composition is present */}
                        {hamperData && (
                          <div className="mt-2 space-y-1.5 p-2.5 rounded-xl bg-[#FFF8F2] border border-[#EFE6DD] text-[11px]">
                            <span className="font-bold text-[#D89A86] block">
                              Keepsake Box: {hamperData.packaging?.name || "Curated Trunk"}
                            </span>
                            {hamperData.items && Array.isArray(hamperData.items) && (
                              <span className="text-[#6C5C54] block">
                                Contents: {hamperData.items.map((i: any) => i.name).join(", ")}
                              </span>
                            )}
                            {hamperData.giftNote && (
                              <span className="italic text-[#5A463B] block">
                                Note: "{hamperData.giftNote}"
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <span className="text-xs text-[#6C5C54] block">
                        ₹{it.price} × {it.quantity}
                      </span>
                      <span className="text-base font-extrabold text-[#D89A86]">
                        ₹{it.price * it.quantity}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Pricing Total Breakdown */}
          <div className="pt-4 border-t border-[#EFE6DD] flex flex-col items-end gap-1.5 text-xs">
            <div className="flex justify-between w-full sm:w-64 text-[#6C5C54]">
              <span>Subtotal:</span>
              <span className="font-bold text-[#3A2B24]">₹{order.totalAmount}</span>
            </div>
            <div className="flex justify-between w-full sm:w-64 text-[#6C5C54]">
              <span>Express Delivery:</span>
              <span className="font-bold text-emerald-700">FREE</span>
            </div>
            <div className="flex justify-between w-full sm:w-64 pt-2 border-t border-[#EFE6DD] items-baseline">
              <span className="text-sm font-bold text-[#3A2B24]">
                {isCod ? "Amount Due on Delivery:" : "Total Amount Paid:"}
              </span>
              <span className="text-2xl font-extrabold text-[#D89A86]">
                ₹{order.totalAmount}
              </span>
            </div>
          </div>
        </div>

        {/* ========================================================= */}
        {/* 3. CUSTOMER ACTIONS CTA ROW                               */}
        {/* ========================================================= */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3.5 pt-2">
          <Link href="/profile?tab=orders" className="w-full sm:w-auto">
            <Button className="btn-pixello-primary w-full sm:w-auto h-12 rounded-full px-8 font-bold text-sm shadow-md flex items-center justify-center gap-2">
              <Truck className="h-4 w-4" />
              <span>Track My Order</span>
            </Button>
          </Link>

          <Link href="/products" className="w-full sm:w-auto">
            <Button
              variant="outline"
              className="w-full sm:w-auto h-12 rounded-full px-8 font-bold text-sm border-[#EFE6DD] text-[#3A2B24] hover:bg-[#FFF8F2] flex items-center justify-center gap-2"
            >
              <ShoppingBag className="h-4 w-4 text-[#D89A86]" />
              <span>Continue Shopping</span>
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function OrderSuccessPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#FFFBF7] flex items-center justify-center">
          <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-[#D89A86]" />
        </div>
      }
    >
      <OrderSuccessContent />
    </Suspense>
  );
}
