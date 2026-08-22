"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Trash2, ArrowRight, Minus, Plus, ShieldCheck, ShoppingBag, PlusCircle, CheckCircle2, Ticket, Sparkles, Tag, AlertCircle } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useCart } from "@/context/CartContext";
import { calculateDeliveryFee } from "@/lib/deliveryFee";

export default function CartPage() {
  const { cartItems, removeFromCart, updateQuantity } = useCart();
  const [deliveryConfigVersion, setDeliveryConfigVersion] = useState(0);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    const handleSync = () => setDeliveryConfigVersion((v) => v + 1);
    window.addEventListener("pixello_delivery_config_updated", handleSync);
    window.addEventListener("storage", handleSync);
    return () => {
      window.removeEventListener("pixello_delivery_config_updated", handleSync);
      window.removeEventListener("storage", handleSync);
    };
  }, []);

  const [promoCodeInput, setPromoCodeInput] = useState("");
  const [appliedPromo, setAppliedPromo] = useState<{
    code: string;
    discountAmount: number;
    type: "percentage" | "flat";
    value: number;
  } | null>(null);
  const [promoError, setPromoError] = useState("");
  const [availablePromos, setAvailablePromos] = useState<any[]>([]);

  const refreshAvailablePromos = async () => {
    let deletedList: string[] = [];
    if (typeof window !== "undefined") {
      try {
        const savedDeleted = localStorage.getItem("pixello_deleted_promos");
        if (savedDeleted) deletedList = JSON.parse(savedDeleted);
      } catch (e) {}
    }

    let allPromos: any[] = [];
    // 1. Try local storage first
    if (typeof window !== "undefined") {
      try {
        const saved = localStorage.getItem("pixello_promo_codes_directory_v1");
        if (saved) {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed) && parsed.length > 0) {
            allPromos = parsed;
          }
        }
      } catch (e) {}
    }

    // 2. Fetch from backend API to ensure 100% sync
    try {
      const res = await fetch("/api/promos");
      const data = await res.json();
      if (data.success && Array.isArray(data.promos) && data.promos.length > 0) {
        allPromos = data.promos;
        if (typeof window !== "undefined") {
          try { localStorage.setItem("pixello_promo_codes_directory_v1", JSON.stringify(data.promos)); } catch (e) {}
        }
      }
    } catch (e) {}

    // 3. Filter only active, not deleted, and under max customer limit
    const valid = allPromos.filter((p: any) => {
      if (p.status !== "Active" && p.status !== undefined) return false;
      if (deletedList.includes(p.code)) return false;
      if (p.maxCustomerLimit && p.maxCustomerLimit > 0 && (p.usageCount || 0) >= p.maxCustomerLimit) return false;
      return true;
    });

    setAvailablePromos(valid);
  };

  useEffect(() => {
    refreshAvailablePromos();

    window.addEventListener("pixello_promos_updated", refreshAvailablePromos);
    window.addEventListener("storage", refreshAvailablePromos);

    return () => {
      window.removeEventListener("pixello_promos_updated", refreshAvailablePromos);
      window.removeEventListener("storage", refreshAvailablePromos);
    };
  }, []);

  const subtotal = cartItems.reduce((acc, item) => acc + item.price * item.quantity, 0);
  const tax = 0; // Zero GST
  const calculatedFeeObj = calculateDeliveryFee("", subtotal);
  const delivery = cartItems.length > 0 ? calculatedFeeObj.fee : 0;
  const grossOrderTotal = subtotal + delivery;
  const discountAmount = appliedPromo ? appliedPromo.discountAmount : 0;
  const total = Math.max(0, grossOrderTotal - discountAmount);

  const normalizeCode = (c: string) => (c || "").replace(/\s+/g, "").toUpperCase();

  const handleApplyPromoCode = async (codeToApply?: string) => {
    const rawInput = (codeToApply || promoCodeInput).trim();
    if (!rawInput) return;
    const codeClean = rawInput.toUpperCase();
    const normalizedInput = normalizeCode(rawInput);
    setPromoError("");

    let deletedList: string[] = [];
    try {
      const savedDeleted = localStorage.getItem("pixello_deleted_promos");
      if (savedDeleted) deletedList = JSON.parse(savedDeleted);
    } catch (e) {}

    if (deletedList.some(d => normalizeCode(d) === normalizedInput)) {
      setPromoError("Invalid promo code");
      return;
    }

    let livePromos = availablePromos;
    if (livePromos.length === 0 && typeof window !== "undefined") {
      try {
        const saved = localStorage.getItem("pixello_promo_codes_directory_v1");
        if (saved) livePromos = JSON.parse(saved);
      } catch (e) {}
    }

    // 1. Check store promo codes directory (supports spaces & case variations)
    let found = livePromos.find((p: any) => {
      if (p.status !== "Active" && p.status !== undefined) return false;
      if (deletedList.some(d => normalizeCode(d) === normalizeCode(p.code))) return false;
      return normalizeCode(p.code) === normalizedInput;
    });

    // 2. If not found in local cache, query backend /api/promos endpoint
    if (!found) {
      try {
        const res = await fetch(`/api/promos?code=${encodeURIComponent(normalizedInput)}`);
        if (res.ok) {
          const data = await res.json();
          if (data.success && data.promo) {
            found = data.promo;
          }
        }
      } catch (err) {
        console.warn("Backend promo validation note:", err);
      }
    }

    // 3. Check Ambassador Referral Codes fallback list
    if (!found) {
      const AMBASSADOR_CODES = [
        "SREE20", "SREE10", "ARYAN20", "ARYAN24", "ANANYA10", "SID20", "POOJA10", "ROHAN10", "NEHA10", "SAIROHAN10", "VYSHU10", "ARJUN10"
      ];
      
      let isAmbassador = AMBASSADOR_CODES.some(a => normalizeCode(a) === normalizedInput);
      if (!isAmbassador && typeof window !== "undefined") {
        try {
          const savedAmbassadors = localStorage.getItem("pixello_ambassadors_directory_v3");
          if (savedAmbassadors) {
            const ambList = JSON.parse(savedAmbassadors);
            if (Array.isArray(ambList)) {
              isAmbassador = ambList.some((a: any) => normalizeCode(a.promoCode) === normalizedInput);
            }
          }
          if (!isAmbassador) {
            const savedPromo = localStorage.getItem("pixello_ambassador_promo_config");
            if (savedPromo) {
              const promoObj = JSON.parse(savedPromo);
              if (normalizeCode(promoObj?.promoCode) === normalizedInput) isAmbassador = true;
            }
          }
          if (!isAmbassador) {
            const directCode = localStorage.getItem("pixello_ambassador_promo_code");
            if (directCode && normalizeCode(directCode) === normalizedInput) isAmbassador = true;
          }
        } catch (e) {
          console.error(e);
        }
      }

      if (isAmbassador) {
        found = {
          code: codeClean,
          type: "percentage",
          value: 10,
          status: "Active",
          isAmbassador: true,
        };
      }
    }

    if (!found) {
      setPromoError("Invalid promo code");
      return;
    }

    if (found.isAmbassador) {
      if (typeof window !== "undefined") {
        localStorage.setItem("pixello_referral_code", found.code || codeClean);
        sessionStorage.setItem("pixello_referral_code", found.code || codeClean);
      }
    }

    if (found.maxCustomerLimit && found.maxCustomerLimit > 0 && (found.usageCount || 0) >= found.maxCustomerLimit) {
      setPromoError("Limit exceeded");
      return;
    }

    if (found.minOrder && subtotal < Number(found.minOrder)) {
      setPromoError(`Minimum order amount of ₹${found.minOrder} is required for "${found.code}".`);
      return;
    }

    let discountVal = 0;
    if (found.type === "percentage") {
      discountVal = Math.round(subtotal * (found.value / 100));
    } else {
      discountVal = Number(found.value) || 0;
    }

    const finalDiscount = Math.min(discountVal, subtotal);

    setAppliedPromo({
      code: found.code || codeClean,
      discountAmount: finalDiscount,
      type: found.type || "percentage",
      value: found.value || 10,
    });
    setPromoCodeInput("");
  };

  if (cartItems.length === 0) {
    return (
      <div className="bg-[#F8F3EE] min-h-[calc(100vh-80px)] py-20 flex flex-col items-center justify-center text-center">
        <div className="h-24 w-24 rounded-full bg-[#FFF8F2] border border-[#D89A86]/30 flex items-center justify-center mb-6 shadow-xs">
          <ShoppingBag className="h-10 w-10 text-[#D89A86]" />
        </div>
        <h1 className="font-serif-brand text-3xl font-bold tracking-tight text-[#3A2B24] mb-3">Your Cart is Empty</h1>
        <p className="text-[#6C5C54] mb-8 max-w-md text-sm leading-relaxed">
          You haven't added any custom frames or photo gifts to your order yet. Customize your favorite moments into handcrafted frames now!
        </p>
        <Link href="/products" className="btn-pixello-primary px-8 h-12 flex items-center justify-center">
          Explore Products & Frames <ArrowRight className="ml-2 h-4 w-4" />
        </Link>
      </div>
    );
  }

  return (
    <div className="bg-[#F8F3EE] min-h-[calc(100vh-80px)] py-12">
      <div className="container mx-auto px-4 md:px-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8 gap-4">
          <h1 className="font-serif-brand text-3xl md:text-4xl font-bold tracking-tight text-[#3A2B24]">Your Order Cart ({cartItems.length} item{cartItems.length > 1 ? 's' : ''})</h1>
          <Link 
            href="/product/1" 
            className="text-xs font-semibold text-[#D89A86] hover:text-[#3A2B24] flex items-center gap-1.5 bg-[#FFF8F2] px-4 py-2 rounded-full border border-[#D89A86]/30 transition-colors"
          >
            <PlusCircle className="h-4 w-4 text-[#D89A86]" /> + Add Another Frame / Size
          </Link>
        </div>

        <div className="flex flex-col lg:flex-row gap-8 items-start">
          {/* Cart Item List */}
          <div className="flex-1 w-full flex flex-col gap-4">
            {cartItems.map((item) => (
              <Card key={item.id} className="border border-[#EFE6DD] bg-white rounded-3xl overflow-hidden shadow-xs">
                <div className="flex flex-col sm:flex-row p-6 gap-6 items-center">
                  <div className="relative h-32 w-32 rounded-2xl overflow-hidden bg-[#FFF8F2] border border-[#EFE6DD] flex-shrink-0 shadow-2xs">
                    <img 
                      src={item.image} 
                      alt={item.name} 
                      className="object-cover h-full w-full"
                    />
                  </div>

                  <div className="flex-1 flex flex-col justify-between w-full">
                    <div>
                      <div className="flex justify-between items-start">
                        <div>
                          <span className="text-[10px] font-bold tracking-wider uppercase text-[#D89A86]">HANDCRAFTED PHOTO FRAME</span>
                          <h3 className="font-serif-brand font-bold text-lg text-[#3A2B24]">{item.name}</h3>
                        </div>
                        <span className="font-bold text-lg text-[#D89A86]">₹{(item.price * item.quantity).toFixed(2)}</span>
                      </div>
                      
                      <div className="flex flex-wrap gap-2 text-xs text-[#6C5C54] mt-2 items-center">
                        <span className="bg-[#FFF8F2] border border-[#EFE6DD] px-2.5 py-1 rounded-md font-semibold text-[#3A2B24]">Size: {item.size}</span>
                        <span>•</span>
                        <span>₹{item.price} each</span>
                      </div>

                      {/* Photo Thumbnail Gallery */}
                      <div className="mt-3">
                        {item.photos && item.photos.length > 0 ? (
                          item.photos.map((p, idx) => {
                            const isData = p && (p.startsWith("data:") || p.startsWith("http") || p.startsWith("/"));
                            return (
                              <div key={idx} className="flex items-center gap-2 mt-1">
                                {isData && (
                                  <img 
                                    src={p} 
                                    alt={`Uploaded memory ${idx + 1}`} 
                                    className="h-9 w-9 rounded-lg object-cover border border-[#D89A86]/40 shadow-2xs"
                                  />
                                )}
                                <span className="text-[11px] text-[#6C5C54] font-medium truncate max-w-[200px]">
                                  Memory Photo Attached
                                </span>
                              </div>
                            );
                          })
                        ) : (
                          <div className="text-xs bg-emerald-50 text-emerald-800 px-3 py-1 rounded-full w-fit font-medium flex items-center gap-1.5 border border-emerald-200">
                            <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" /> Photo Uploaded
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center justify-between mt-6 pt-4 border-t border-[#EFE6DD]">
                      <div className="flex items-center border border-[#EFE6DD] bg-white rounded-full p-0.5">
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8 rounded-full"
                          onClick={() => updateQuantity(item.id, -1)}
                        >
                          <Minus className="h-3.5 w-3.5" />
                        </Button>
                        <span className="w-8 text-center text-sm font-semibold text-[#3A2B24]">{item.quantity}</span>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8 rounded-full"
                          onClick={() => updateQuantity(item.id, 1)}
                        >
                          <Plus className="h-3.5 w-3.5" />
                        </Button>
                      </div>

                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="text-red-600 hover:text-red-700 hover:bg-red-50 rounded-full text-xs font-bold"
                        onClick={() => removeFromCart(item.id)}
                      >
                        <Trash2 className="h-4 w-4 mr-1.5 text-red-600" /> Remove
                      </Button>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
            
            <div className="mt-4 flex gap-4">
              <Link href="/product/1" className="btn-pixello-primary px-6 h-12 flex items-center justify-center text-sm">
                + Add Another Frame Size
              </Link>
            </div>
          </div>

          {/* Order Summary */}
          <div className="w-full lg:w-96 flex-shrink-0">
            <Card className="bg-white border border-[#EFE6DD] rounded-3xl shadow-xs sticky top-24">
              <CardContent className="p-6">
                <h2 className="font-serif-brand font-bold text-xl text-[#3A2B24] mb-6">Order Summary</h2>
                
                {/* PROMO CODE SECTION */}
                <div className="mb-6 pb-6 border-b border-[#EFE6DD]">
                  <label className="text-xs font-bold text-[#3A2B24] mb-2 flex items-center justify-between">
                    <span className="flex items-center gap-1.5">
                      <Ticket className="h-4 w-4 text-[#D89A86]" /> Apply Store Promo Code
                    </span>
                    <span className="text-[10px] text-[#D89A86] font-semibold">Special Offer</span>
                  </label>

                  {isMounted && appliedPromo ? (
                    <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center justify-between">
                      <div>
                        <div className="flex items-center gap-1.5">
                          <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                          <span className="font-mono font-extrabold text-xs text-emerald-950">{appliedPromo.code}</span>
                        </div>
                        <p className="text-[10px] text-emerald-700 mt-0.5 font-bold">
                          {appliedPromo.type === "percentage" ? `${appliedPromo.value}% OFF` : `₹${appliedPromo.value} OFF`} applied (-₹{discountAmount.toFixed(2)})
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setAppliedPromo(null);
                          setPromoError("");
                        }}
                        className="text-xs font-bold text-rose-600 hover:underline cursor-pointer"
                      >
                        Remove
                      </button>
                    </div>
                  ) : (
                    <div>
                      <div className="flex gap-2">
                        <Input
                          placeholder="ENTER PROMO CODE"
                          value={promoCodeInput}
                          onChange={(e) => setPromoCodeInput(e.target.value.toUpperCase())}
                          className="rounded-xl border-[#EFE6DD] bg-[#FFF8F2] text-xs font-mono font-bold uppercase tracking-wider text-[#3A2B24]"
                        />
                        <Button
                          type="button"
                          onClick={() => handleApplyPromoCode()}
                          className="btn-pixello-primary text-xs font-bold rounded-xl px-4 h-10 shadow-2xs whitespace-nowrap cursor-pointer"
                        >
                          Apply
                        </Button>
                      </div>

                      {/* Clickable Available Offers Pills */}
                      {availablePromos.length > 0 && (
                        <div className="mt-2.5">
                          <p className="text-[10px] font-bold text-[#6C5C54] mb-1 flex items-center gap-1">
                            <Sparkles className="h-3 w-3 text-[#D89A86]" /> Available Store Offers (Click to apply):
                          </p>
                          <div className="flex flex-wrap gap-1.5">
                            {availablePromos.map((p: any) => (
                              <button
                                key={p.id || p.code}
                                type="button"
                                onClick={() => {
                                  setPromoCodeInput(p.code);
                                  handleApplyPromoCode(p.code);
                                }}
                                className="text-[10px] font-bold bg-[#FFF8F2] hover:bg-[#F8F3EE] text-[#3A2B24] border border-[#D89A86]/50 px-2.5 py-1 rounded-lg flex items-center gap-1 transition-all cursor-pointer shadow-2xs"
                              >
                                <Tag className="h-2.5 w-2.5 text-[#D89A86]" />
                                <span className="font-mono font-extrabold">{p.code}</span>
                                <span className="text-[#D89A86] font-bold">({p.type === "percentage" ? `${p.value}% OFF` : `₹${p.value} OFF`})</span>
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {promoError && (
                    <p className="text-[11px] text-rose-600 font-bold mt-2 flex items-center gap-1">
                      <AlertCircle className="h-3.5 w-3.5 text-rose-600 shrink-0" />
                      <span>{promoError}</span>
                    </p>
                  )}

                </div>

                <div className="flex flex-col gap-3 text-sm mb-6">
                  <div className="flex justify-between">
                    <span className="text-[#6C5C54]">Subtotal</span>
                    <span className="font-medium text-[#3A2B24]">₹{subtotal.toFixed(2)}</span>
                  </div>

                  {isMounted && appliedPromo && (
                    <div className="flex justify-between text-emerald-700 font-bold bg-emerald-50 p-2 rounded-xl border border-emerald-200/60">
                      <span>Promo Discount ({appliedPromo.code})</span>
                      <span>-₹{discountAmount.toFixed(2)}</span>
                    </div>
                  )}

                  <div className="flex justify-between items-center">
                    <span className="text-[#6C5C54]">{calculatedFeeObj.label}</span>
                    <span className="font-medium text-[#3A2B24]">
                      {delivery === 0 ? (
                        <span className="text-emerald-700 font-extrabold">FREE</span>
                      ) : (
                        `₹${delivery.toFixed(2)}`
                      )}
                    </span>
                  </div>
                </div>

                <Separator className="mb-6 bg-[#EFE6DD]" />

                <div className="flex justify-between items-end mb-6">
                  <span className="font-serif-brand font-bold text-lg text-[#3A2B24]">Total Amount</span>
                  <span suppressHydrationWarning className="font-extrabold text-2xl text-[#D89A86]">₹{total.toFixed(2)}</span>
                </div>

                <Link
                  href="/checkout"
                  onClick={() => {
                    if (appliedPromo && typeof window !== "undefined") {
                      localStorage.setItem("pixello_cart_applied_promo", JSON.stringify(appliedPromo));
                    }
                  }}
                >
                  <Button size="lg" className="btn-pixello-primary w-full h-14 text-base rounded-full shadow-md cursor-pointer">
                    Proceed to Checkout <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </Link>

                <p className="text-xs text-center text-[#6C5C54] mt-4 flex items-center justify-center gap-1">
                   <ShieldCheck className="h-3.5 w-3.5 text-[#5AAE7F]" /> Instant production at nearest photo studio
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
