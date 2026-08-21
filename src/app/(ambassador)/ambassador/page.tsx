"use client";

import { useState, useEffect, useMemo } from "react";
import { Users, Wallet, Target, Link2, Copy, Check, QrCode, TrendingUp, Medal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";

import { useOrders } from "@/context/OrderContext";

export default function AmbassadorDashboard() {
  const { orders } = useOrders();
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
      promoCode: "SREE20",
      baseUrl: "https://pixellostore.com/ref/",
      discountPercent: "10%",
      commissionPercent: "10%",
    };
  });

  // Fast memoized live referral metrics calculation
  const { totalEarned, referralCount, recentReferredList } = useMemo(() => {
    const liveReferred = (orders || []).filter((o) => Boolean(o.referralCode));
    const liveItems = liveReferred.map((o) => {
      const comm = Math.round((o.totalAmount || 0) * 0.10);
      return {
        name: `${o.customerName} (${o.id})`,
        val: `₹${o.totalAmount}`,
        comm: `₹${comm}`,
        status: o.status === "Delivered" ? "PAID" : (o.status === "Cancelled" ? "CANCELLED" : "PENDING"),
        isLive: true,
      };
    });

    const sampleBase = [
      { name: "Rahul Verma", val: "₹1,499", comm: "₹150", status: "PAID" },
      { name: "Ananya Sharma", val: "₹899", comm: "₹90", status: "PAID" },
      { name: "Siddharth Rao", val: "₹2,499", comm: "₹250", status: "ELIGIBLE" },
      { name: "Priya Nair", val: "₹1,199", comm: "₹120", status: "PENDING" },
    ];

    const liveEarned = liveReferred.reduce(
      (sum, o) => sum + (o.status !== "Cancelled" ? Math.round((o.totalAmount || 0) * 0.10) : 0),
      0
    );

    return {
      totalEarned: 12450 + liveEarned,
      referralCount: 42 + liveReferred.length,
      recentReferredList: liveItems.length > 0 ? [...liveItems, ...sampleBase] : sampleBase,
    };
  }, [orders]);

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

  const origin = typeof window !== "undefined" ? window.location.origin : "http://localhost:3000";
  const referralCode = promoConfig.promoCode || "ARYAN24";
  const referralLink = `${origin}/ref/${referralCode}`;
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

  const shareToWhatsApp = () => {
    const text = encodeURIComponent(`🎉 Get 10% OFF on custom photo frames & gifts at PixelloStore! Click my ambassador link to apply your 10% discount: ${referralLink}`);
    window.open(`https://wa.me/?text=${text}`, "_blank");
  };

  return (
    <div className="flex flex-col gap-8 bg-[#F8F3EE] p-6 md:p-8 rounded-3xl min-h-screen">
      {/* Registration Form Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-6 md:p-8 bg-[#3A2B24] text-white rounded-3xl gap-4 shadow-sm">
        <div>
          <h2 className="font-serif-brand text-xl font-bold">Campus Ambassador Application</h2>
          <p className="text-xs text-[#EFE6DD]/80 mt-1">Submit your details via the official Google Form to join the ambassador cohort.</p>
        </div>
        <a 
          href="https://docs.google.com/forms/d/e/1FAIpQLSdlvg1_aoq6GwQM3rz8qhmvM5jxo6q-ldWZFgdqb9R5dV6Hrw/viewform?usp=publish-editor"
          target="_blank"
          rel="noopener noreferrer"
          className="btn-pixello-primary px-6 h-11 flex items-center justify-center text-xs font-bold whitespace-nowrap shadow-sm rounded-full"
        >
          Open Official Form →
        </a>
      </div>

      {/* Top Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="border border-[#EFE6DD] shadow-sm bg-gradient-to-br from-[#3A2B24] to-[#4E3D35] text-white rounded-3xl">
          <CardContent className="p-6 md:p-7">
            <div className="flex justify-between items-start mb-4">
              <h3 className="font-medium text-[#EFE6DD]">Total Earnings</h3>
              <Wallet className="h-5 w-5 text-[#D89A86]" />
            </div>
            <p className="text-4xl font-bold mb-1 text-white">₹{totalEarned.toLocaleString()}</p>
            <p className="text-sm text-emerald-300 flex items-center font-semibold">
              <TrendingUp className="h-3.5 w-3.5 mr-1" /> Persistent DB Tracked
            </p>
          </CardContent>
        </Card>
        
        <Card className="border border-[#EFE6DD] bg-white shadow-xs rounded-3xl">
          <CardContent className="p-6 md:p-7">
            <div className="flex justify-between items-start mb-4">
              <h3 className="font-bold text-xs uppercase tracking-wider text-[#6C5C54]">Total Referrals</h3>
              <Users className="h-5 w-5 text-[#D89A86]" />
            </div>
            <p suppressHydrationWarning className="text-3xl font-extrabold text-[#3A2B24] mb-1">{referralCount}</p>
            <p className="text-xs font-bold text-emerald-600">Active users</p>
          </CardContent>
        </Card>

        <Card className="border border-[#EFE6DD] bg-white shadow-xs rounded-3xl">
          <CardContent className="p-6 md:p-7">
            <div className="flex justify-between items-start mb-4">
              <h3 className="font-bold text-xs uppercase tracking-wider text-[#6C5C54]">Conversion Rate</h3>
              <Target className="h-5 w-5 text-[#D89A86]" />
            </div>
            <p className="text-3xl font-extrabold text-[#3A2B24] mb-1">18.5%</p>
            <p className="text-xs font-medium text-[#6C5C54]">Clicks to orders</p>
          </CardContent>
        </Card>
      </div>

      {/* Grid with Equal Stretch Heights & Generous Padding */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-stretch">
        
        {/* Share & Earn Card */}
        <Card className="lg:col-span-2 border border-[#EFE6DD] bg-white rounded-3xl shadow-xs h-full flex flex-col justify-between overflow-hidden">
          <div>
            <CardHeader className="p-6 md:p-8 pb-4">
              <CardTitle className="font-serif-brand text-2xl font-bold text-[#3A2B24]">Share & Earn</CardTitle>
              <CardDescription className="text-xs text-[#6C5C54]">
                Share your unique link or code to earn {commissionText} commission on every order.
              </CardDescription>
            </CardHeader>

            <CardContent className="p-6 md:p-8 pt-0 flex flex-col gap-6">
              <div className="grid md:grid-cols-2 gap-6">
                
                {/* Your Referral Link Box */}
                <div className="flex flex-col gap-3.5 p-6 bg-[#FFF8F2] border border-[#EFE6DD] rounded-2xl">
                  <div className="flex items-center gap-2 font-bold text-xs text-[#3A2B24]">
                    <Link2 className="h-4 w-4 text-[#D89A86]" /> Your Referral Link
                  </div>
                  <div className="flex gap-2">
                    <Input 
                      value={referralLink} 
                      readOnly 
                      className="bg-white border-[#EFE6DD] text-xs font-mono font-semibold text-[#3A2B24] focus-visible:ring-[#D89A86] flex-1 min-w-0 truncate" 
                    />
                    <Button 
                      onClick={copyReferralLink} 
                      className="btn-pixello-primary text-xs font-bold rounded-xl px-4 h-10 shrink-0 flex items-center gap-1.5 shadow-2xs cursor-pointer"
                    >
                      {copiedLink ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                      {copiedLink ? "Copied" : "Copy Link"}
                    </Button>
                    <Button 
                      onClick={shareToWhatsApp} 
                      className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl px-3.5 h-10 shrink-0 flex items-center gap-1.5 shadow-2xs cursor-pointer"
                    >
                      WhatsApp
                    </Button>
                  </div>
                  <p className="text-[11px] text-[#6C5C54] font-medium">1-Click Share on WhatsApp, Instagram Bio & Campus Groups.</p>
                </div>

                {/* Promo Code Box */}
                <div className="flex flex-col gap-3.5 p-6 bg-[#FFF8F2] border border-[#EFE6DD] rounded-2xl">
                  <div className="flex items-center justify-between font-bold text-xs text-[#3A2B24]">
                    <div className="flex items-center gap-2">
                      <QrCode className="h-4 w-4 text-[#D89A86]" /> Promo Code
                    </div>
                    <Badge className="bg-emerald-100 text-emerald-800 border border-emerald-200 text-[10px] font-bold px-2.5 py-0.5 rounded-full">
                      {discountText}
                    </Badge>
                  </div>
                  <div className="flex gap-2">
                    <div className="flex-1 border-2 border-dashed border-[#D89A86]/50 rounded-xl flex items-center justify-center font-mono font-bold text-base bg-white h-10 tracking-widest text-[#3A2B24]">
                      {referralCode}
                    </div>
                    <Button 
                      onClick={copyPromoCode} 
                      className="btn-pixello-secondary text-xs font-bold rounded-xl px-4 h-10 shrink-0 flex items-center gap-1.5 shadow-2xs cursor-pointer"
                    >
                      {copiedCode ? <Check className="h-3.5 w-3.5 text-[#3A2B24]" /> : <Copy className="h-3.5 w-3.5 text-[#3A2B24]" />}
                      {copiedCode ? "Copied" : "Copy"}
                    </Button>
                  </div>
                  <p className="text-[11px] text-[#6C5C54] font-medium">
                    Customers get {discountText}. You get {commissionText} commission.
                  </p>
                </div>

              </div>

              {/* Recent Referred Orders */}
              <div className="pt-2">
                <h3 className="font-serif-brand font-bold text-base text-[#3A2B24] mb-3">Recent Referred Orders</h3>
                <div className="overflow-x-auto border border-[#EFE6DD] rounded-2xl">
                  <table className="w-full text-sm text-left">
                    <thead className="text-[11px] font-bold text-[#6C5C54] uppercase tracking-wider bg-[#FFF8F2] border-b border-[#EFE6DD]">
                      <tr>
                        <th className="px-4 py-3.5">Customer</th>
                        <th className="px-4 py-3.5">Order Value</th>
                        <th className="px-4 py-3.5">Your Commission</th>
                        <th className="px-4 py-3.5">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#EFE6DD]">
                      {recentReferredList.map((ref, i) => (
                        <tr key={i} className="hover:bg-[#FFF8F2]/50 transition-colors">
                          <td className="px-4 py-3.5 font-bold text-[#3A2B24]">{ref.name}</td>
                          <td className="px-4 py-3.5 font-medium text-[#6C5C54]">{ref.val}</td>
                          <td className="px-4 py-3.5 font-extrabold text-emerald-600">{ref.comm}</td>
                          <td className="px-4 py-3.5">
                            <Badge 
                              className={
                                ref.status === "PAID" || ref.status === "ELIGIBLE"
                                  ? "bg-emerald-100 text-emerald-800 border-emerald-200 text-xs px-3 py-0.5 rounded-full font-bold" 
                                  : "bg-amber-100 text-amber-800 border-amber-200 text-xs px-3 py-0.5 rounded-full font-bold"
                              }
                            >
                              {ref.status}
                            </Badge>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </CardContent>
          </div>
        </Card>

        {/* Next Milestone Card (Generous Padding & Fit) */}
        <Card className="border border-[#EFE6DD] bg-white rounded-3xl shadow-xs relative overflow-hidden h-full flex flex-col justify-between">
          <div className="absolute top-0 right-0 p-6 opacity-10 pointer-events-none">
            <Medal className="h-32 w-32 text-[#D89A86]" />
          </div>
          
          <div>
            <CardHeader className="p-6 md:p-8 pb-4">
              <CardTitle className="font-serif-brand text-2xl font-bold text-[#3A2B24]">Next Milestone</CardTitle>
              <CardDescription className="text-xs text-[#6C5C54]">Reach Diamond Tier to unlock 15% commission rate!</CardDescription>
            </CardHeader>
            
            <CardContent className="p-6 md:p-8 pt-0 relative z-10 flex-1 flex flex-col justify-between">
              <div>
                <div className="flex items-end justify-between mb-3">
                  <div>
                    <span className="text-3xl font-extrabold text-[#3A2B24]">42</span>
                    <span className="text-xs font-bold text-[#6C5C54]"> / 50 Orders</span>
                  </div>
                  <Badge className="bg-[#FFF8F2] text-[#D89A86] border border-[#D89A86]/30 text-xs font-bold px-3.5 py-1 rounded-full">
                    Gold Tier
                  </Badge>
                </div>
                
                <Progress value={84} className="h-3 mb-4 bg-[#FFF8F2] border border-[#EFE6DD]" />
                
                <p className="text-xs text-[#6C5C54] mb-6">
                  Just <strong className="text-[#3A2B24]">8 more orders</strong> to upgrade.
                </p>

                <Separator className="mb-6 bg-[#EFE6DD]" />

                <h4 className="font-serif-brand font-bold text-sm text-[#3A2B24] mb-3">Diamond Tier Benefits:</h4>
                <ul className="text-xs text-[#6C5C54] flex flex-col gap-2.5 mb-6 font-medium">
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-emerald-600 font-bold" /> 15% Flat Commission
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-emerald-600 font-bold" /> Early access to new products
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-emerald-600 font-bold" /> PixelloStore Merch Kit
                  </li>
                </ul>
              </div>

              <Button className="w-full btn-pixello-primary text-xs font-bold rounded-2xl h-11 shadow-xs mt-auto cursor-pointer">
                View All Tiers
              </Button>
            </CardContent>
          </div>
        </Card>

      </div>
    </div>
  );
}