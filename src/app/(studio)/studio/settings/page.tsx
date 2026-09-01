"use client";

import React, { useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Store, ArrowRight, ShoppingBag } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function StudioRetiredPage() {
  const router = useRouter();

  useEffect(() => {
    const timer = setTimeout(() => {
      router.replace("/admin");
    }, 4000);
    return () => clearTimeout(timer);
  }, [router]);

  return (
    <div className="max-w-md w-full bg-white border border-[#EFE6DD] rounded-3xl p-8 shadow-xl text-center space-y-6 animate-in fade-in zoom-in-95">
      <div className="h-16 w-16 rounded-full bg-[#FFF8F2] border border-[#EFE6DD] flex items-center justify-center mx-auto text-[#D89A86] shadow-inner">
        <Store className="h-8 w-8 text-[#D89A86]" />
      </div>

      <div className="space-y-2">
        <span className="text-[11px] font-extrabold uppercase tracking-widest text-[#D89A86] bg-[#FFF8F2] px-3 py-1 rounded-full border border-[#D89A86]/20">
          Portal Retired
        </span>
        <h2 className="font-serif-brand text-2xl font-bold text-[#3A2B24]">
          Photo Studio Portal Has Been Retired
        </h2>
        <p className="text-xs text-[#6C5C54] leading-relaxed">
          All custom print production, order management, and carrier dispatches are now managed centrally through the Pixello Admin Portal.
        </p>
      </div>

      <div className="p-3 bg-[#FFF8F2]/80 border border-[#EFE6DD] rounded-2xl text-[11px] text-[#6C5C54] font-medium">
        Redirecting you to Admin Portal in <strong className="text-[#3A2B24]">4 seconds...</strong>
      </div>

      <div className="flex flex-col gap-2.5 pt-2">
        <Link href="/admin">
          <Button className="w-full btn-pixello-primary rounded-full text-xs font-bold h-11 flex items-center justify-center gap-2 shadow-xs cursor-pointer">
            Go to Admin Central <ArrowRight className="h-4 w-4" />
          </Button>
        </Link>
        <Link href="/">
          <Button variant="outline" className="w-full rounded-full border-[#EFE6DD] text-xs font-bold h-10 text-[#3A2B24] hover:bg-[#FFF8F2] cursor-pointer">
            <ShoppingBag className="h-4 w-4 mr-1.5 text-[#D89A86]" /> Go to Storefront
          </Button>
        </Link>
      </div>
    </div>
  );
}
