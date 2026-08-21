"use client";

import { useState, useEffect } from "react";
import { Link2, Copy, Check, QrCode, Share2, Sparkles, Download, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";

export default function AmbassadorLinksPage() {
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);

  // Live Admin Promo Code & Referral Link Configurations
  const [promoConfig, setPromoConfig] = useState(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("pixello_ambassador_promo_config");
      if (saved) {
        try {
          return JSON.parse(saved);
        } catch (e) {
          console.error(e);
        }
      }
    }
    return {
      promoCode: "ARYAN20",
      baseUrl: "https://pixellostore.com/ref/",
      discountPercent: "10%",
      commissionPercent: "10%",
    };
  });

  useEffect(() => {
    const syncConfig = () => {
      const saved = localStorage.getItem("pixello_ambassador_promo_config");
      if (saved) {
        try {
          setPromoConfig(JSON.parse(saved));
        } catch (e) {
          console.error(e);
        }
      }
    };
    syncConfig();
    window.addEventListener("pixello_promo_config_updated", syncConfig);
    window.addEventListener("pixello_ambassador_profile_updated", syncConfig);
    window.addEventListener("pixello_ambassadors_updated", syncConfig);
    window.addEventListener("storage", syncConfig);
    return () => {
      window.removeEventListener("pixello_promo_config_updated", syncConfig);
      window.removeEventListener("pixello_ambassador_profile_updated", syncConfig);
      window.removeEventListener("pixello_ambassadors_updated", syncConfig);
      window.removeEventListener("storage", syncConfig);
    };
  }, []);

  const referralCode = promoConfig.promoCode || "ARYAN20";
  const referralLink = `${promoConfig.baseUrl || "https://pixellostore.com/ref/"}${referralCode}`;
  const discountText = promoConfig.discountPercent.includes("%") ? promoConfig.discountPercent : `${promoConfig.discountPercent}% OFF`;
  const commissionText = promoConfig.commissionPercent.includes("%") ? promoConfig.commissionPercent : `${promoConfig.commissionPercent}%`;

  const copyReferralLink = () => {
    navigator.clipboard.writeText(referralLink);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const copyPromoCode = () => {
    navigator.clipboard.writeText(referralCode);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  return (
    <div className="flex flex-col gap-6 bg-[#F8F3EE] p-6 rounded-3xl min-h-screen">
      <div>
        <h2 className="font-serif-brand text-3xl font-bold text-[#3A2B24]">Promo Links & QR Code</h2>
        <p className="text-xs text-[#6C5C54] mt-1">Share your custom referral link, promo code, and QR poster to earn {commissionText} commission.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Referral Link Tool */}
        <Card className="border border-[#EFE6DD] bg-white rounded-3xl shadow-xs">
          <CardContent className="p-6 flex flex-col justify-between h-full">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <div className="h-9 w-9 rounded-2xl bg-[#FFF8F2] border border-[#EFE6DD] flex items-center justify-center text-[#D89A86]">
                  <Link2 className="h-5 w-5" />
                </div>
                <h3 className="font-serif-brand font-bold text-lg text-[#3A2B24]">Unique Referral Link</h3>
              </div>
              <p className="text-xs text-[#6C5C54] mb-4">Paste this link in your Instagram bio, WhatsApp status, or campus chat groups.</p>
              
              <div className="flex gap-2 bg-[#FFF8F2] p-3 rounded-2xl border border-[#EFE6DD] mb-3">
                <Input 
                  value={referralLink} 
                  readOnly 
                  className="bg-white border-[#EFE6DD] text-xs font-mono font-bold text-[#3A2B24] flex-1 min-w-0" 
                />
                <Button 
                  onClick={copyReferralLink} 
                  className="btn-pixello-primary text-xs font-bold rounded-xl px-4 h-10 shrink-0 flex items-center gap-1.5 shadow-2xs cursor-pointer"
                >
                  {copiedLink ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                  {copiedLink ? "Copied" : "Copy Link"}
                </Button>
              </div>
            </div>
            <p className="text-[11px] text-[#6C5C54] font-medium mt-4">✓ Auto-applies {discountText} discount to customer cart.</p>
          </CardContent>
        </Card>

        {/* Promo Code Tool */}
        <Card className="border border-[#EFE6DD] bg-white rounded-3xl shadow-xs">
          <CardContent className="p-6 flex flex-col justify-between h-full">
            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div className="h-9 w-9 rounded-2xl bg-[#FFF8F2] border border-[#EFE6DD] flex items-center justify-center text-[#D89A86]">
                    <QrCode className="h-5 w-5" />
                  </div>
                  <h3 className="font-serif-brand font-bold text-lg text-[#3A2B24]">Personal Coupon Code</h3>
                </div>
                <Badge className="bg-emerald-100 text-emerald-800 border border-emerald-200 text-xs font-bold px-3 py-0.5 rounded-full">
                  {discountText}
                </Badge>
              </div>
              <p className="text-xs text-[#6C5C54] mb-4">Students type this code during checkout to get {discountText} off instantly.</p>
              
              <div className="flex gap-2 bg-[#FFF8F2] p-3 rounded-2xl border border-[#EFE6DD] mb-3">
                <div className="flex-1 border-2 border-dashed border-[#D89A86]/50 rounded-xl flex items-center justify-center font-mono font-bold text-lg bg-white h-10 tracking-widest text-[#3A2B24]">
                  {referralCode}
                </div>
                <Button 
                  onClick={copyPromoCode} 
                  className="btn-pixello-secondary text-xs font-bold rounded-xl px-4 h-10 shrink-0 flex items-center gap-1.5 shadow-2xs cursor-pointer"
                >
                  {copiedCode ? <Check className="h-3.5 w-3.5 text-[#3A2B24]" /> : <Copy className="h-3.5 w-3.5 text-[#3A2B24]" />}
                  {copiedCode ? "Copied" : "Copy Code"}
                </Button>
              </div>
            </div>
            <p className="text-[11px] text-[#6C5C54] font-medium mt-4">
              ✓ Customers get {discountText}. You earn {commissionText} commission on final order amount.
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Campus Print Flyer QR Poster Card */}
      <Card className="border border-[#EFE6DD] bg-white rounded-3xl shadow-xs overflow-hidden">
        <CardContent className="p-6 md:p-8 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="h-16 w-16 rounded-3xl bg-[#3A2B24] text-white flex items-center justify-center font-bold shadow-md flex-shrink-0">
              <QrCode className="h-8 w-8 text-[#D89A86]" />
            </div>
            <div>
              <h3 className="font-serif-brand text-xl font-bold text-[#3A2B24]">Download Campus Printable Poster (PDF)</h3>
              <p className="text-xs text-[#6C5C54] mt-1">High-res A4 poster pre-embedded with your QR code ({referralCode}) for college noticeboards & hostel doors.</p>
            </div>
          </div>
          <Button className="btn-pixello-primary text-xs font-bold rounded-full px-6 h-11 shadow-xs flex items-center gap-2 shrink-0 cursor-pointer">
            <Download className="h-4 w-4 text-white" /> Download Poster PDF
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
