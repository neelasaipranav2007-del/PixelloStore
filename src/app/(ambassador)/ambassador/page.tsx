"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Users, Wallet, Target, Link2, Copy, Check, QrCode, TrendingUp, Medal, Sparkles, ArrowRight, Share2, Award } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";

export default function AmbassadorDashboard() {
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);
  const [loading, setLoading] = useState(true);

  const [dashboardData, setDashboardData] = useState<{
    ambassador: {
      name: string;
      college: string;
      referralCode: string;
      rank: string;
      tier: string;
      commissionRate: string;
      walletBalance: number;
      pendingBalance: number;
      totalEarned: number;
      totalPaid: number;
    };
    metrics: {
      totalReferrals: number;
      deliveredCount: number;
      totalOrderVolume: string;
      conversionRate: string;
      progressPercent: number;
      currentTierName: string;
      nextTierName: string;
      targetOrders: number;
      ordersRemaining: number;
    };
    recentOrders: Array<{
      id: string;
      customerName: string;
      totalAmount: string;
      commission: string;
      status: string;
      date: string;
    }>;
    rewards: Array<{
      id: string;
      title: string;
      badge: string;
      description: string;
    }>;
  }>({
    ambassador: {
      name: "Campus Ambassador",
      college: "Campus Partner",
      referralCode: "AMB10",
      rank: "GOLD",
      tier: "Gold Tier",
      commissionRate: "10%",
      walletBalance: 0,
      pendingBalance: 0,
      totalEarned: 0,
      totalPaid: 0,
    },
    metrics: {
      totalReferrals: 0,
      deliveredCount: 0,
      totalOrderVolume: "₹0",
      conversionRate: "0%",
      progressPercent: 0,
      currentTierName: "Bronze Tier",
      nextTierName: "Silver Tier",
      targetOrders: 15,
      ordersRemaining: 15,
    },
    recentOrders: [],
    rewards: [],
  });

  const fetchDashboard = async () => {
    try {
      setLoading(true);
      const token = typeof window !== "undefined" ? localStorage.getItem("pixello_ambassador_token") : null;
      const headers: Record<string, string> = {};
      if (token) headers["Authorization"] = `Bearer ${token}`;

      const res = await fetch("/api/ambassador/dashboard", { headers });
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          setDashboardData(data);
        }
      }
    } catch (e) {
      console.error("Dashboard fetch error:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();

    const handleSync = () => fetchDashboard();
    window.addEventListener("pixello_ambassador_profile_updated", handleSync);
    window.addEventListener("pixello_payout_requested", handleSync);
    window.addEventListener("pixello_orders_updated", handleSync);
    return () => {
      window.removeEventListener("pixello_ambassador_profile_updated", handleSync);
      window.removeEventListener("pixello_payout_requested", handleSync);
      window.removeEventListener("pixello_orders_updated", handleSync);
    };
  }, []);

  const origin = typeof window !== "undefined" ? window.location.origin : "https://pixellostore.com";
  const referralCode = dashboardData.ambassador.referralCode || "AMB10";
  const referralLink = `${origin}/ref/${referralCode}`;

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
      {/* Welcome Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-6 md:p-8 bg-[#3A2B24] text-white rounded-3xl gap-4 shadow-sm border border-[#4E3D35]">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-bold uppercase tracking-wider text-[#D89A86] bg-[#FFF8F2]/10 px-2.5 py-0.5 rounded-full border border-[#D89A86]/30">
              {dashboardData.metrics.currentTierName}
            </span>
            <span className="text-xs text-[#EFE6DD]/70">• {dashboardData.ambassador.college}</span>
          </div>
          <h2 className="font-serif-brand text-2xl font-bold">Welcome back, {dashboardData.ambassador.name}! 👋</h2>
          <p className="text-xs text-[#EFE6DD]/80 mt-1">Here is your live personal workspace, student referrals, and wallet balance.</p>
        </div>
        <div className="flex items-center gap-3">
          <Link 
            href="/ambassador/wallet" 
            className="px-5 h-10 bg-[#FFF8F2] text-[#3A2B24] hover:bg-[#EFE6DD] transition-all font-bold text-xs rounded-full flex items-center gap-2 shadow-sm"
          >
            <Wallet className="h-4 w-4 text-[#D89A86]" />
            <span>₹{dashboardData.ambassador.walletBalance.toLocaleString("en-IN")} Available</span>
          </Link>
          <Link 
            href="/ambassador/links" 
            className="btn-pixello-primary px-5 h-10 flex items-center justify-center text-xs font-bold whitespace-nowrap shadow-sm rounded-full"
          >
            Get QR Poster →
          </Link>
        </div>
      </div>

      {/* Top 3 Live Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Card 1: Total Earnings */}
        <Card className="border border-[#EFE6DD] shadow-sm bg-gradient-to-br from-[#3A2B24] to-[#4E3D35] text-white rounded-3xl">
          <CardContent className="p-6 md:p-7">
            <div className="flex justify-between items-start mb-4">
              <h3 className="font-medium text-[#EFE6DD]">Total Commission Earned</h3>
              <Wallet className="h-5 w-5 text-[#D89A86]" />
            </div>
            <p className="text-4xl font-bold mb-1 text-white">₹{dashboardData.ambassador.totalEarned.toLocaleString("en-IN")}</p>
            <div className="flex items-center justify-between text-xs text-[#EFE6DD]/80 mt-3 pt-3 border-t border-white/10">
              <span>Available: <strong className="text-emerald-300 font-bold">₹{dashboardData.ambassador.walletBalance.toLocaleString("en-IN")}</strong></span>
              <span>Rate: <strong className="text-[#D89A86] font-bold">{dashboardData.ambassador.commissionRate} Flat</strong></span>
            </div>
          </CardContent>
        </Card>

        {/* Card 2: Student Referrals */}
        <Card className="border border-[#EFE6DD] shadow-sm bg-white rounded-3xl">
          <CardContent className="p-6 md:p-7">
            <div className="flex justify-between items-start mb-4">
              <h3 className="font-medium text-[#6C5C54]">Referred Orders</h3>
              <Users className="h-5 w-5 text-[#D89A86]" />
            </div>
            <p className="text-4xl font-bold text-[#3A2B24] mb-1">{dashboardData.metrics.totalReferrals}</p>
            <div className="flex items-center justify-between text-xs text-[#6C5C54] mt-3 pt-3 border-t border-[#EFE6DD]">
              <span>Volume: <strong className="text-[#3A2B24] font-bold">{dashboardData.metrics.totalOrderVolume}</strong></span>
              <span>Delivered: <strong className="text-emerald-600 font-bold">{dashboardData.metrics.deliveredCount}</strong></span>
            </div>
          </CardContent>
        </Card>

        {/* Card 3: Target Progress */}
        <Card className="border border-[#EFE6DD] shadow-sm bg-white rounded-3xl">
          <CardContent className="p-6 md:p-7">
            <div className="flex justify-between items-start mb-3">
              <div>
                <h3 className="font-medium text-[#6C5C54]">Cohort Target</h3>
                <p className="text-xs text-[#D89A86] font-bold mt-0.5">{dashboardData.metrics.currentTierName} → {dashboardData.metrics.nextTierName}</p>
              </div>
              <Medal className="h-5 w-5 text-[#D89A86]" />
            </div>
            <div className="flex items-baseline justify-between mb-2">
              <span className="text-2xl font-bold text-[#3A2B24]">{dashboardData.metrics.totalReferrals} / {dashboardData.metrics.targetOrders}</span>
              <span className="text-xs font-bold text-[#D89A86]">{dashboardData.metrics.progressPercent}%</span>
            </div>
            <Progress value={dashboardData.metrics.progressPercent} className="h-2 bg-[#F8F3EE]" />
            <p className="text-[11px] text-[#6C5C54] mt-2.5 font-medium">
              {dashboardData.metrics.ordersRemaining > 0 ? `${dashboardData.metrics.ordersRemaining} more orders to unlock ${dashboardData.metrics.nextTierName}` : `Target achieved! You are in ${dashboardData.metrics.currentTierName}`}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Unique Referral Link & Code Card */}
      <Card className="border border-[#EFE6DD] shadow-sm bg-white rounded-3xl overflow-hidden">
        <CardHeader className="bg-[#FFF8F2] border-b border-[#EFE6DD] p-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <CardTitle className="font-serif-brand text-lg font-bold text-[#3A2B24] flex items-center gap-2">
                <Link2 className="h-5 w-5 text-[#D89A86]" /> Your Exclusive Referral Link & Promo Code
              </CardTitle>
              <CardDescription className="text-xs text-[#6C5C54] mt-1">
                Share this link or coupon code with fellow students. They receive 10% instant discount; you earn flat 10% cash commission.
              </CardDescription>
            </div>
            <Badge className="bg-[#3A2B24] text-[#EFE6DD] self-start sm:self-center font-bold px-3 py-1 rounded-full text-xs">
              Code: {referralCode}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Promo Code Box */}
            <div className="flex flex-col gap-2 p-5 bg-[#F8F3EE] rounded-2xl border border-[#EFE6DD]">
              <label className="text-xs font-bold text-[#3A2B24] uppercase tracking-wider">Your Referral Promo Code</label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Input 
                    value={referralCode} 
                    readOnly 
                    className="bg-white border-[#EFE6DD] text-[#3A2B24] font-mono font-bold tracking-widest text-lg h-12 rounded-xl"
                  />
                </div>
                <Button 
                  onClick={copyPromoCode}
                  className="bg-[#3A2B24] hover:bg-[#2E201A] text-white font-bold h-12 px-5 rounded-xl shadow-xs"
                >
                  {copiedCode ? <Check className="h-4 w-4 text-emerald-300" /> : <Copy className="h-4 w-4" />}
                  <span className="ml-2 hidden sm:inline">{copiedCode ? "Copied!" : "Copy"}</span>
                </Button>
              </div>
            </div>

            {/* Direct Referral URL Box */}
            <div className="flex flex-col gap-2 p-5 bg-[#F8F3EE] rounded-2xl border border-[#EFE6DD]">
              <label className="text-xs font-bold text-[#3A2B24] uppercase tracking-wider">Direct Auto-Discount Link</label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Input 
                    value={referralLink} 
                    readOnly 
                    className="bg-white border-[#EFE6DD] text-[#3A2B24] text-xs font-mono h-12 rounded-xl pr-3 truncate"
                  />
                </div>
                <Button 
                  onClick={copyReferralLink}
                  className="bg-[#D89A86] hover:bg-[#C28573] text-white font-bold h-12 px-5 rounded-xl shadow-xs"
                >
                  {copiedLink ? <Check className="h-4 w-4 text-white" /> : <Copy className="h-4 w-4" />}
                  <span className="ml-2 hidden sm:inline">{copiedLink ? "Copied!" : "Copy Link"}</span>
                </Button>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-4 mt-6 pt-6 border-t border-[#EFE6DD]">
            <p className="text-xs text-[#6C5C54]">
              💡 <strong>Pro-Tip:</strong> Share your direct link on WhatsApp college groups or hostel stories for instant 10% auto-applied discount!
            </p>
            <div className="flex items-center gap-3">
              <Button 
                onClick={shareToWhatsApp}
                className="bg-[#25D366] hover:bg-[#1EBE5D] text-white font-bold text-xs h-10 px-5 rounded-full shadow-xs"
              >
                <Share2 className="h-4 w-4 mr-2" /> Share on WhatsApp
              </Button>
              <Link href="/ambassador/links">
                <Button variant="outline" className="border-[#D89A86] text-[#3A2B24] hover:bg-[#FFF8F2] font-bold text-xs h-10 px-5 rounded-full">
                  <QrCode className="h-4 w-4 mr-2 text-[#D89A86]" /> Download QR Poster
                </Button>
              </Link>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Recent Referred Orders (Strictly Isolated to Authenticated Ambassador) */}
      <Card className="border border-[#EFE6DD] shadow-sm bg-white rounded-3xl overflow-hidden">
        <CardHeader className="p-6 border-b border-[#EFE6DD] flex flex-row items-center justify-between">
          <div>
            <CardTitle className="font-serif-brand text-lg font-bold text-[#3A2B24]">Recent Referred Customer Orders</CardTitle>
            <CardDescription className="text-xs text-[#6C5C54] mt-1">Orders placed with your referral code ({referralCode}).</CardDescription>
          </div>
          <Link href="/ambassador/referrals" className="text-xs font-bold text-[#D89A86] hover:underline flex items-center gap-1">
            View All ({dashboardData.metrics.totalReferrals}) <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </CardHeader>
        <CardContent className="p-0">
          {dashboardData.recentOrders.length === 0 ? (
            <div className="p-12 text-center text-[#6C5C54]">
              <Users className="h-10 w-10 text-[#D89A86]/50 mx-auto mb-3" />
              <p className="font-bold text-sm text-[#3A2B24]">No referred orders yet</p>
              <p className="text-xs mt-1">Share your promo code <strong className="text-[#D89A86]">{referralCode}</strong> with your batchmates to earn your first commission!</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#FFF8F2] text-[#6C5C54] font-semibold border-b border-[#EFE6DD]">
                  <tr>
                    <th className="p-4 pl-6">Order ID</th>
                    <th className="p-4">Customer</th>
                    <th className="p-4">Order Value</th>
                    <th className="p-4">Your Commission</th>
                    <th className="p-4">Status</th>
                    <th className="p-4 pr-6 text-right">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#EFE6DD]">
                  {dashboardData.recentOrders.map((order) => (
                    <tr key={order.id} className="hover:bg-[#FFF8F2]/50 transition-colors">
                      <td className="p-4 pl-6 font-mono font-bold text-[#3A2B24]">{order.id}</td>
                      <td className="p-4 font-medium text-[#3A2B24]">{order.customerName}</td>
                      <td className="p-4 font-bold text-[#3A2B24]">{order.totalAmount}</td>
                      <td className="p-4 font-bold text-emerald-600">{order.commission}</td>
                      <td className="p-4">
                        <Badge 
                          className={
                            order.status === "PAID"
                              ? "bg-emerald-100 text-emerald-800 border-emerald-200"
                              : order.status === "CANCELLED"
                              ? "bg-rose-100 text-rose-800 border-rose-200"
                              : "bg-amber-100 text-amber-800 border-amber-200"
                          }
                        >
                          {order.status}
                        </Badge>
                      </td>
                      <td className="p-4 pr-6 text-right text-[#6C5C54]">{order.date}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Rewards & Unlocked Badges */}
      {dashboardData.rewards.length > 0 && (
        <Card className="border border-[#EFE6DD] shadow-sm bg-white rounded-3xl overflow-hidden">
          <CardHeader className="p-6 border-b border-[#EFE6DD]">
            <CardTitle className="font-serif-brand text-lg font-bold text-[#3A2B24] flex items-center gap-2">
              <Award className="h-5 w-5 text-[#D89A86]" /> Unlocked Milestones & Badges
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {dashboardData.rewards.map((reward) => (
                <div key={reward.id} className="flex items-start gap-3.5 p-4 bg-[#FFF8F2] rounded-2xl border border-[#EFE6DD]">
                  <div className="text-2xl">{reward.badge.split(" ")[0]}</div>
                  <div>
                    <h4 className="text-sm font-bold text-[#3A2B24]">{reward.title}</h4>
                    <p className="text-xs text-[#6C5C54] mt-0.5">{reward.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}