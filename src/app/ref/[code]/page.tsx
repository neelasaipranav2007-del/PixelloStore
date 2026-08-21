"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { CheckCircle2, Sparkles, ArrowRight, ShoppingBag, Gift } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function ReferralLandingPage() {
  const params = useParams();
  const router = useRouter();
  const rawCode = (params?.code as string) || "ARYAN24";
  const referralCode = rawCode.toUpperCase();
  const [redirecting, setRedirecting] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      // Auto-redirect to catalog after 2.5 seconds
      const timer = setTimeout(() => {
        setRedirecting(true);
        router.push("/products");
      }, 2500);

      return () => clearTimeout(timer);
    }
  }, [referralCode, router]);

  return (
    <div className="min-h-screen bg-[#F8F3EE] flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-3xl p-8 border border-[#EFE6DD] shadow-lg text-center flex flex-col items-center">
        {/* Animated Badge */}
        <div className="h-16 w-16 rounded-full bg-[#FFF8F2] border-2 border-[#D89A86] flex items-center justify-center text-[#D89A86] mb-6 animate-bounce shadow-sm">
          <Gift className="h-8 w-8" />
        </div>

        <span className="bg-[#D89A86]/10 text-[#D89A86] border border-[#D89A86]/30 text-xs font-extrabold px-3 py-1 rounded-full uppercase tracking-wider mb-3">
          Ambassador VIP Offer
        </span>

        <h1 className="font-serif-brand text-2xl md:text-3xl font-bold text-[#3A2B24] mb-2">
          10% Discount Code
        </h1>

        <p className="text-xs text-[#6C5C54] mb-6 leading-relaxed font-medium">
          Your official ambassador coupon code is <strong className="text-[#3A2B24] font-bold font-mono">"{referralCode}"</strong>. 
          Enter or paste this code at checkout to unlock your 10% discount!
        </p>

        {/* Highlight Box */}
        <div className="w-full bg-[#FFF8F2] border border-[#D89A86]/40 rounded-2xl p-4 mb-6 flex items-center gap-3 text-left">
          <CheckCircle2 className="h-6 w-6 text-emerald-600 shrink-0" />
          <div>
            <p className="text-xs font-bold text-[#3A2B24]">Ambassador Promo Code: <span className="font-mono text-[#D89A86]">{referralCode}</span></p>
            <p className="text-[11px] text-[#6C5C54]">Paste "{referralCode}" in the promo code box at checkout to get 10% OFF.</p>
          </div>
        </div>

        {/* Action Button */}
        <Button
          onClick={() => router.push("/products")}
          className="w-full h-12 btn-pixello-primary text-xs font-bold rounded-2xl flex items-center justify-center gap-2 shadow-md cursor-pointer"
        >
          {redirecting ? (
            <span>Redirecting to Catalog...</span>
          ) : (
            <>
              <ShoppingBag className="h-4 w-4" /> Start Shopping Now <ArrowRight className="h-4 w-4" />
            </>
          )}
        </Button>

        <p className="text-[11px] text-[#6C5C54] mt-4">
          Redirecting to catalog in 2 seconds...
        </p>
      </div>
    </div>
  );
}
