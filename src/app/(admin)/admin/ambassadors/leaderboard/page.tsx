"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { Trophy, Medal, Award, TrendingUp, Sparkles, GraduationCap, Check, Info, RefreshCw, UserCheck, Search, Users, Wallet, Ticket, FileSpreadsheet, Download, ExternalLink, MessageCircle, ArrowUpRight, Phone, Mail, Building, ArrowLeft } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export interface AdminLeaderboardEntry {
  id: string;
  rank: number;
  name: string;
  phone: string;
  email: string;
  college: string;
  promoCode?: string;
  tier: string;
  rankBadge: string;
  referrals: number;
  totalSales: number;
  balance: number;
  totalEarned: number;
  isCurrentUser?: boolean;
}

export function getInitials(name?: string) {
  if (!name) return "AM";
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2 && parts[0] && parts[1]) {
    return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
}

export function getTierInfo(referrals: number) {
  if (referrals >= 50) {
    return { name: "Diamond Tier", color: "bg-[#3A2B24] text-white border border-[#4E3D35]", comm: "15%", icon: "💎" };
  } else if (referrals >= 25) {
    return { name: "Gold Tier", color: "bg-[#FFF8F2] text-[#D89A86] border border-[#D89A86]/40", comm: "10%", icon: "🥇" };
  } else if (referrals >= 15) {
    return { name: "Silver Tier", color: "bg-slate-100 text-slate-700 border border-slate-300", comm: "10%", icon: "🥈" };
  } else {
    return { name: "Bronze Tier", color: "bg-amber-50 text-amber-800 border border-amber-200", comm: "10%", icon: "🥉" };
  }
}

export default function AdminAmbassadorLeaderboardPage() {
  const [leaderboard, setLeaderboard] = useState<AdminLeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTierFilter, setSelectedTierFilter] = useState<string>("ALL");

  const fetchLeaderboard = async () => {
    try {
      setLoading(true);
      const token = typeof window !== "undefined" ? localStorage.getItem("pixello_admin_token") || localStorage.getItem("pixello_ambassador_token") : null;
      const headers: Record<string, string> = {};
      if (token) headers["Authorization"] = `Bearer ${token}`;

      const res = await fetch("/api/ambassador/leaderboard", { headers });
      if (res.ok) {
        const data = await res.json();
        if (data.success && Array.isArray(data.leaderboard)) {
          setLeaderboard(data.leaderboard);
        }
      }
    } catch (e) {
      console.error("Admin Leaderboard fetch error:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeaderboard();

    const handleSync = () => fetchLeaderboard();
    window.addEventListener("pixello_orders_updated", handleSync);
    window.addEventListener("pixello_ambassador_profile_updated", handleSync);
    return () => {
      window.removeEventListener("pixello_orders_updated", handleSync);
      window.removeEventListener("pixello_ambassador_profile_updated", handleSync);
    };
  }, []);

  const totalReferrals = useMemo(() => {
    return leaderboard.reduce((acc, curr) => acc + (curr.referrals || 0), 0);
  }, [leaderboard]);

  const totalSales = useMemo(() => {
    return leaderboard.reduce((acc, curr) => acc + (curr.totalSales || 0), 0);
  }, [leaderboard]);

  const totalCommissions = useMemo(() => {
    return leaderboard.reduce((acc, curr) => acc + (curr.totalEarned || curr.balance || 0), 0);
  }, [leaderboard]);

  const filteredLeaderboard = useMemo(() => {
    let list = leaderboard;
    const q = searchQuery.toLowerCase().trim();

    if (q) {
      list = list.filter(
        (item) =>
          item.name.toLowerCase().includes(q) ||
          item.college.toLowerCase().includes(q) ||
          (item.promoCode && item.promoCode.toLowerCase().includes(q)) ||
          (item.phone && item.phone.toLowerCase().includes(q)) ||
          (item.email && item.email.toLowerCase().includes(q))
      );
    }

    if (selectedTierFilter !== "ALL") {
      list = list.filter((item) => {
        const tier = getTierInfo(item.referrals);
        return tier.name.toUpperCase().includes(selectedTierFilter.toUpperCase());
      });
    }

    return list;
  }, [leaderboard, searchQuery, selectedTierFilter]);

  const handleExportToExcel = () => {
    if (!leaderboard || leaderboard.length === 0) {
      alert("No leaderboard data available to export.");
      return;
    }

    const headers = [
      "Leaderboard Rank",
      "Ambassador Name",
      "University / College",
      "Active Promo Code",
      "Cohort Tier",
      "Total Referred Orders",
      "Total Sales Generated (INR)",
      "Commission Earned (INR)",
      "Phone Number",
      "Email Address"
    ];

    const rows = leaderboard.map((item) => {
      const tier = getTierInfo(item.referrals);
      return [
        `#${item.rank}`,
        item.name,
        item.college,
        item.promoCode || "N/A",
        tier.name,
        item.referrals,
        (item.totalSales || 0).toFixed(2),
        (item.totalEarned || item.balance || 0).toFixed(2),
        item.phone || "N/A",
        item.email || "N/A"
      ];
    });

    const escapeCsv = (val: any) => {
      if (val === null || val === undefined) return '""';
      const str = String(val).replace(/"/g, '""');
      return `"${str}"`;
    };

    const csvContent = "\uFEFF" + [
      headers.map(escapeCsv).join(","),
      ...rows.map(row => row.map(escapeCsv).join(","))
    ].join("\r\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    const todayStr = new Date().toISOString().split("T")[0];
    const fileName = `Pixello_Ambassador_Leaderboard_${todayStr}.csv`;
    link.setAttribute("href", url);
    link.setAttribute("download", fileName);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex flex-col gap-6 bg-[#F8F3EE] p-6 rounded-3xl min-h-screen">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Link href="/admin/ambassadors" className="text-xs text-[#6C5C54] hover:text-[#3A2B24] flex items-center gap-1 font-semibold">
              <ArrowLeft className="h-3.5 w-3.5" /> Back to Ambassadors
            </Link>
          </div>
          <h2 className="font-serif-brand text-3xl font-bold text-[#3A2B24] mt-1 flex items-center gap-2.5">
            <span>🏆 Leaderboard of Ambassadors</span>
          </h2>
          <p className="text-xs text-[#6C5C54] mt-1">
            Real-time verified campus rankings across all universities, ordered by customer conversions and sales revenue.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <Button 
            onClick={fetchLeaderboard}
            variant="outline" 
            size="sm"
            className="rounded-full border-[#EFE6DD] text-xs font-bold text-[#3A2B24] hover:bg-white flex items-center gap-1.5 h-9 px-3.5 shadow-2xs cursor-pointer"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
            <span>Refresh</span>
          </Button>

          <Button
            type="button"
            onClick={handleExportToExcel}
            className="bg-[#107C41] hover:bg-[#0E6C38] text-white font-bold text-xs h-9 px-4 rounded-full shadow-2xs flex items-center gap-1.5 cursor-pointer transition-all hover:scale-102"
            title="Download leaderboard as Excel / CSV"
          >
            <FileSpreadsheet className="h-4 w-4" />
            <span>Export Excel</span>
          </Button>

          <Link 
            href="/admin/ambassadors"
            className="rounded-full border border-[#D89A86] text-[#D89A86] hover:bg-[#FFF8F2] font-bold text-xs h-9 px-4 shadow-2xs flex items-center gap-1.5 cursor-pointer transition-colors"
          >
            <Users className="h-3.5 w-3.5" />
            <span>Manage Ambassadors</span>
          </Link>
        </div>
      </div>

      {/* Top 4 Performance Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border border-[#EFE6DD] bg-white rounded-3xl shadow-xs">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-[#6C5C54] uppercase tracking-wider">Total Active Ambassadors</p>
              <p className="text-3xl font-extrabold text-[#3A2B24] mt-1">{leaderboard.length}</p>
            </div>
            <div className="h-11 w-11 rounded-2xl bg-[#FFF8F2] border border-[#EFE6DD] flex items-center justify-center text-[#D89A86]">
              <Users className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="border border-[#EFE6DD] bg-white rounded-3xl shadow-xs">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-[#6C5C54] uppercase tracking-wider">Total Referred Orders</p>
              <p className="text-3xl font-extrabold text-emerald-700 mt-1">{totalReferrals}</p>
            </div>
            <div className="h-11 w-11 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600">
              <Trophy className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="border border-[#EFE6DD] bg-white rounded-3xl shadow-xs">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-[#6C5C54] uppercase tracking-wider">Referred Sales Volume</p>
              <p className="text-3xl font-extrabold text-[#3A2B24] mt-1">₹{totalSales.toLocaleString("en-IN")}</p>
            </div>
            <div className="h-11 w-11 rounded-2xl bg-[#FFF8F2] border border-[#EFE6DD] flex items-center justify-center text-[#D89A86]">
              <TrendingUp className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="border border-[#EFE6DD] bg-white rounded-3xl shadow-xs">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-[#6C5C54] uppercase tracking-wider">Commissions Distributed</p>
              <p className="text-3xl font-extrabold text-purple-700 mt-1">₹{totalCommissions.toLocaleString("en-IN")}</p>
            </div>
            <div className="h-11 w-11 rounded-2xl bg-purple-50 border border-purple-200 flex items-center justify-center text-purple-600">
              <Wallet className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Top 3 Podium Cards (Matching User Screenshot) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {leaderboard.slice(0, 3).map((item) => {
          const tier = getTierInfo(item.referrals);
          const isFirst = item.rank === 1;

          return (
            <Card
              key={item.id}
              className={`border rounded-3xl shadow-sm relative overflow-hidden transition-all ${
                isFirst
                  ? "bg-gradient-to-br from-[#3A2B24] to-[#4E3D35] text-white border-[#4E3D35] md:-translate-y-1 shadow-md"
                  : "bg-white border-[#EFE6DD] text-[#3A2B24]"
              }`}
            >
              <CardContent className="p-6 flex flex-col items-center text-center">
                <div className="relative mb-3">
                  <Avatar className="h-16 w-16 border-2 border-[#D89A86] shadow-sm">
                    <AvatarFallback className="bg-[#FFF8F2] text-[#3A2B24] font-bold text-lg">
                      {getInitials(item.name)}
                    </AvatarFallback>
                  </Avatar>
                  <div
                    className={`absolute -bottom-2 -right-1 h-7 w-7 rounded-full flex items-center justify-center font-bold text-xs shadow-sm ${
                      item.rank === 1
                        ? "bg-amber-400 text-amber-950 ring-2 ring-white"
                        : item.rank === 2
                        ? "bg-slate-300 text-slate-800 ring-2 ring-white"
                        : "bg-amber-700 text-amber-100 ring-2 ring-white"
                    }`}
                  >
                    #{item.rank}
                  </div>
                </div>

                <h3 className={`font-bold text-base mt-2 ${isFirst ? "text-white" : "text-[#3A2B24]"}`}>{item.name}</h3>
                <p className={`text-xs mt-0.5 max-w-[240px] truncate font-medium ${isFirst ? "text-[#EFE6DD]/80" : "text-[#6C5C54]"}`}>
                  {item.college}
                </p>

                <div className="flex items-center gap-2 mt-3">
                  <Badge className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${tier.color}`}>
                    {tier.icon} {tier.name}
                  </Badge>
                  {item.promoCode && (
                    <Badge className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full border ${isFirst ? "bg-white/10 text-white border-white/20" : "bg-[#FFF8F2] text-[#D89A86] border-[#D89A86]/30"}`}>
                      {item.promoCode}
                    </Badge>
                  )}
                </div>

                <div className="mt-4 pt-4 border-t border-[#EFE6DD]/20 w-full flex justify-around text-xs">
                  <div>
                    <span className={`block text-[10px] uppercase font-bold tracking-wider ${isFirst ? "text-[#EFE6DD]/60" : "text-[#6C5C54]"}`}>
                      Orders
                    </span>
                    <strong className="text-base font-bold">{item.referrals}</strong>
                  </div>
                  <div>
                    <span className={`block text-[10px] uppercase font-bold tracking-wider ${isFirst ? "text-[#EFE6DD]/60" : "text-[#6C5C54]"}`}>
                      Sales Vol.
                    </span>
                    <strong className="text-base font-bold">₹{item.totalSales.toLocaleString("en-IN")}</strong>
                  </div>
                  <div>
                    <span className={`block text-[10px] uppercase font-bold tracking-wider ${isFirst ? "text-[#EFE6DD]/60" : "text-[#6C5C54]"}`}>
                      Earned
                    </span>
                    <strong className={`text-base font-bold ${isFirst ? "text-emerald-300" : "text-emerald-700"}`}>
                      ₹{(item.totalEarned || item.balance || 0).toLocaleString("en-IN")}
                    </strong>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Full Leaderboard Table Section */}
      <Card className="border border-[#EFE6DD] shadow-sm bg-white rounded-3xl overflow-hidden">
        <CardHeader className="p-6 border-b border-[#EFE6DD] flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <CardTitle className="font-serif-brand text-lg font-bold text-[#3A2B24] flex items-center gap-2">
              <Trophy className="h-5 w-5 text-[#D89A86]" /> Full Campus Leaderboard Rankings
            </CardTitle>
            <CardDescription className="text-xs text-[#6C5C54] mt-1">
              Rankings are based on verified customer orders placed with each ambassador's referral code.
            </CardDescription>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {/* Search Input */}
            <div className="relative w-full sm:w-64">
              <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#6C5C54]" />
              <Input
                placeholder="Search ambassador, college, code..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 pr-3 rounded-full border-[#EFE6DD] text-xs h-9 bg-[#F8F3EE]"
              />
            </div>

            {/* Tier Filters */}
            <div className="flex items-center gap-1 p-1 bg-[#FFF8F2] border border-[#EFE6DD] rounded-full text-xs font-bold shadow-2xs">
              {["ALL", "Diamond", "Gold", "Silver", "Bronze"].map((tierKey) => (
                <button
                  key={tierKey}
                  type="button"
                  onClick={() => setSelectedTierFilter(tierKey)}
                  className={`px-3 py-1 rounded-full text-[11px] font-bold transition-all cursor-pointer ${
                    selectedTierFilter === tierKey
                      ? "bg-[#3A2B24] text-white shadow-xs"
                      : "text-[#6C5C54] hover:text-[#3A2B24] hover:bg-white/60"
                  }`}
                >
                  {tierKey === "ALL" ? "All Tiers" : tierKey}
                </button>
              ))}
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#FFF8F2] text-[#6C5C54] font-semibold border-b border-[#EFE6DD]">
                <tr>
                  <th className="p-4 pl-6 w-16">Rank</th>
                  <th className="p-4">Ambassador</th>
                  <th className="p-4">University / College</th>
                  <th className="p-4">Promo Code</th>
                  <th className="p-4">Cohort Tier</th>
                  <th className="p-4 text-center">Referred Orders</th>
                  <th className="p-4 text-right">Sales Volume</th>
                  <th className="p-4 text-right">Commission Earned</th>
                  <th className="p-4 pr-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#EFE6DD]">
                {filteredLeaderboard.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="p-8 text-center text-xs font-medium text-[#6C5C54]">
                      No ambassadors match your search or filter criteria.
                    </td>
                  </tr>
                ) : (
                  filteredLeaderboard.map((item) => {
                    const tier = getTierInfo(item.referrals);
                    const cleanPhone = (item.phone || "").replace(/\D/g, "");
                    const waPhone = cleanPhone.startsWith("91") ? cleanPhone : `91${cleanPhone}`;

                    return (
                      <tr
                        key={item.id}
                        className="transition-colors hover:bg-[#FFF8F2]/50"
                      >
                        <td className="p-4 pl-6 font-bold text-sm">
                          {item.rank === 1 ? (
                            <span className="text-amber-500 font-extrabold text-base">🥇 #1</span>
                          ) : item.rank === 2 ? (
                            <span className="text-slate-500 font-bold">🥈 #2</span>
                          ) : item.rank === 3 ? (
                            <span className="text-amber-700 font-bold">🥉 #3</span>
                          ) : (
                            <span className="text-[#6C5C54] font-bold">#{item.rank}</span>
                          )}
                        </td>
                        <td className="p-4">
                          <div className="flex items-center gap-2.5">
                            <Avatar className="h-8 w-8 border border-[#EFE6DD]">
                              <AvatarFallback className="bg-[#FFF8F2] text-[#3A2B24] text-xs font-bold">
                                {getInitials(item.name)}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <span className="font-bold text-[#3A2B24] flex items-center gap-1.5">
                                {item.name}
                              </span>
                              <span className="text-[10px] text-[#6C5C54] block font-medium">
                                {item.phone || item.email || "No contact"}
                              </span>
                            </div>
                          </div>
                        </td>
                        <td className="p-4 text-[#6C5C54] font-medium">{item.college}</td>
                        <td className="p-4">
                          {item.promoCode ? (
                            <span className="font-mono font-bold text-[11px] text-[#D89A86] bg-[#FFF8F2] border border-[#D89A86]/30 px-2 py-0.5 rounded-full">
                              {item.promoCode}
                            </span>
                          ) : (
                            <span className="text-[#6C5C54] text-[11px]">-</span>
                          )}
                        </td>
                        <td className="p-4">
                          <Badge className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${tier.color}`}>
                            {tier.icon} {tier.name}
                          </Badge>
                        </td>
                        <td className="p-4 text-center font-bold text-sm text-[#3A2B24]">
                          {item.referrals} orders
                        </td>
                        <td className="p-4 text-right font-extrabold text-xs text-[#3A2B24]">
                          ₹{item.totalSales.toLocaleString("en-IN")}
                        </td>
                        <td className="p-4 text-right font-extrabold text-xs text-emerald-700">
                          ₹{(item.totalEarned || item.balance || 0).toLocaleString("en-IN")}
                        </td>
                        <td className="p-4 pr-6 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {cleanPhone.length >= 10 && (
                              <a
                                href={`https://wa.me/${waPhone}?text=${encodeURIComponent(`Hello ${item.name}! Congratulations on your performance as Pixello Campus Ambassador! ✨`)}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="h-8 w-8 rounded-full bg-emerald-50 hover:bg-emerald-100 text-emerald-700 flex items-center justify-center border border-emerald-200 transition-colors shadow-2xs"
                                title="Chat on WhatsApp"
                              >
                                <MessageCircle className="h-3.5 w-3.5" />
                              </a>
                            )}
                            <Link 
                              href="/admin/ambassadors"
                              className="h-8 px-2.5 rounded-full text-[11px] font-bold border border-[#EFE6DD] text-[#3A2B24] hover:bg-[#FFF8F2] flex items-center justify-center transition-colors cursor-pointer"
                            >
                              View
                            </Link>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
