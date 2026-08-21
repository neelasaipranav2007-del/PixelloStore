"use client";

import { useState, useEffect, useMemo } from "react";
import { Trophy, Medal, Award, TrendingUp, Sparkles, GraduationCap, Check, Info, RefreshCw } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useOrders } from "@/context/OrderContext";

export interface LeaderboardAmbassador {
  id?: string;
  rank?: number;
  name: string;
  college: string;
  referrals: number;
  earnings: string;
  status?: string;
  promoCode?: string;
}

export const INITIAL_LEADERBOARD_AMBASSADORS: LeaderboardAmbassador[] = [
  { id: "AMB-201", name: "Sree Charani Grandhe", college: "Aurora Deemed To Be A University", referrals: 32, earnings: "₹6,400", status: "APPROVED", promoCode: "SREE20" },
  { id: "AMB-202", name: "Ananya Sharma", college: "St. Xavier's Mumbai", referrals: 28, earnings: "₹5,600", status: "APPROVED", promoCode: "ANANYA10" },
  { id: "AMB-203", name: "Siddharth Malhotra", college: "NMIMS Mumbai", referrals: 24, earnings: "₹4,800", status: "APPROVED", promoCode: "SID20" },
  { id: "AMB-204", name: "Pooja Hegde", college: "DU (SRCC)", referrals: 22, earnings: "₹4,400", status: "APPROVED", promoCode: "POOJA10" },
  { id: "AMB-205", name: "Rohan Kapoor", college: "BITS Pilani", referrals: 19, earnings: "₹3,800", status: "APPROVED", promoCode: "ROHAN10" },
  { id: "AMB-206", name: "Neha Gupta", college: "Christ University", referrals: 14, earnings: "₹2,800", status: "APPROVED", promoCode: "NEHA10" },
];

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

export default function AmbassadorLeaderboardPage() {
  const { orders } = useOrders();

  // Compute live referral stats from OrderContext
  const liveReferred = orders.filter((o) => Boolean(o.referralCode));
  const liveCount = liveReferred.length;
  const liveCommTotal = liveReferred.reduce((sum, o) => {
    if (o.status === "Cancelled") return sum;
    return sum + Math.round((o.totalAmount || 0) * 0.10);
  }, 0);

  const [ambassadors, setAmbassadors] = useState<LeaderboardAmbassador[]>(() => {
    if (typeof window !== "undefined") {
      const savedProfile = localStorage.getItem("pixello_ambassador_profile");
      const base = INITIAL_LEADERBOARD_AMBASSADORS;
      if (savedProfile) {
        try {
          const parsedProf = JSON.parse(savedProfile);
          if (parsedProf.name) {
            base[0] = { ...base[0], name: parsedProf.name, college: parsedProf.college || base[0].college };
          }
        } catch (e) {
          console.error(e);
        }
      }

      const saved = localStorage.getItem("pixello_ambassadors_directory_v3");
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed) && parsed.length > 0) {
            return parsed.filter((a: any) => a.status !== "REJECTED");
          }
        } catch (e) {
          console.error(e);
        }
      }
      return base;
    }
    return INITIAL_LEADERBOARD_AMBASSADORS;
  });

  useEffect(() => {
    const syncAmbassadors = () => {
      let currentBase = [...INITIAL_LEADERBOARD_AMBASSADORS];
      if (typeof window !== "undefined") {
        const savedProfile = localStorage.getItem("pixello_ambassador_profile");
        if (savedProfile) {
          try {
            const parsedProf = JSON.parse(savedProfile);
            if (parsedProf.name) {
              currentBase[0] = { ...currentBase[0], name: parsedProf.name, college: parsedProf.college || currentBase[0].college };
            }
          } catch (e) {
            console.error(e);
          }
        }

        const saved = localStorage.getItem("pixello_ambassadors_directory_v3");
        if (saved) {
          try {
            const parsed = JSON.parse(saved);
            if (Array.isArray(parsed) && parsed.length > 0) {
              setAmbassadors(parsed.filter((a: any) => a.status !== "REJECTED"));
              return;
            }
          } catch (e) {
            console.error(e);
          }
        }
      }
      setAmbassadors(currentBase);
    };

    window.addEventListener("pixello_ambassadors_updated", syncAmbassadors);
    window.addEventListener("pixello_ambassador_profile_updated", syncAmbassadors);
    window.addEventListener("storage", syncAmbassadors);
    return () => {
      window.removeEventListener("pixello_ambassadors_updated", syncAmbassadors);
      window.removeEventListener("pixello_ambassador_profile_updated", syncAmbassadors);
      window.removeEventListener("storage", syncAmbassadors);
    };
  }, []);

  // Fast memoized sorting and ranking
  const sortedAmbassadors = useMemo(() => {
    const updatedAmbassadors = ambassadors.map((amb, idx) => {
      if (idx === 0) {
        const updatedReferrals = (amb.referrals || 32) + liveCount;
        const baseEarned = 6400;
        const totalEarned = baseEarned + liveCommTotal;
        return {
          ...amb,
          referrals: updatedReferrals,
          earnings: `₹${totalEarned.toLocaleString("en-IN")}`,
        };
      }
      return amb;
    });

    return [...updatedAmbassadors]
      .sort((a, b) => (b.referrals || 0) - (a.referrals || 0))
      .map((amb, index) => ({
        ...amb,
        rank: index + 1,
      }));
  }, [ambassadors, liveCount, liveCommTotal]);

  const TIER_RULES = [
    { name: "Diamond Tier", min: 50, comm: "15% Flat", badge: "💎 Diamond", desc: "Unlocked at 50+ referrals. Includes 15% commission + Pixello Merch Kit." },
    { name: "Gold Tier", min: 25, comm: "10% Flat", badge: "🥇 Gold", desc: "Unlocked at 25–49 referrals. Includes Gold Badge & Priority 24h Payouts." },
    { name: "Silver Tier", min: 15, comm: "10% Flat", badge: "🥈 Silver", desc: "Unlocked at 15–24 referrals. Includes Official Campus Certificate." },
    { name: "Bronze Tier", min: 0, comm: "10% Flat", badge: "🥉 Bronze", desc: "Default starting tier for 0–14 referrals." },
  ];

  return (
    <div className="flex flex-col gap-6 bg-[#F8F3EE] p-6 rounded-3xl min-h-screen">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="font-serif-brand text-3xl font-bold text-[#3A2B24]">Campus Leaderboard</h2>
          <p className="text-xs text-[#6C5C54] mt-1">Live synchronized rankings between Admin Portal & Ambassador Portal.</p>
        </div>
        <Badge className="bg-emerald-100 text-emerald-800 border border-emerald-200 text-xs px-3 py-1.5 rounded-full font-bold w-fit flex items-center gap-1.5 shadow-2xs">
          <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" /> Admin Portal Live Synced
        </Badge>
      </div>

      {/* Tier Calculation Rules Card */}
      <Card className="border border-[#EFE6DD] bg-white rounded-3xl shadow-xs overflow-hidden">
        <CardHeader className="p-6 pb-3 border-b border-[#EFE6DD] bg-[#FFF8F2]">
          <div className="flex items-center gap-2">
            <Info className="h-5 w-5 text-[#D89A86]" />
            <div>
              <CardTitle className="font-serif-brand text-lg font-bold text-[#3A2B24]">How Tier Badges Are Calculated</CardTitle>
              <CardDescription className="text-xs text-[#6C5C54]">Tiers upgrade automatically based on total referred orders.</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {TIER_RULES.map((tier) => (
            <div key={tier.name} className="p-4 bg-[#FFF8F2]/60 rounded-2xl border border-[#EFE6DD]">
              <div className="flex items-center justify-between mb-1.5">
                <span className="font-bold text-xs text-[#3A2B24]">{tier.badge}</span>
                <span className="text-[10px] font-extrabold text-[#D89A86]">{tier.min}+ Orders</span>
              </div>
              <p className="text-[11px] text-[#6C5C54] leading-relaxed">{tier.desc}</p>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Top 3 Podium Highlights */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {sortedAmbassadors.slice(0, 3).map((amb: LeaderboardAmbassador, idx: number) => {
          const tier = getTierInfo(amb.referrals || 0);
          return (
            <Card 
              key={amb.id || amb.name} 
              className={`border rounded-3xl overflow-hidden shadow-xs relative ${
                idx === 0 ? "border-[#D89A86] bg-[#FFF8F2]" : "border-[#EFE6DD] bg-white"
              }`}
            >
              <CardContent className="p-6 flex flex-col items-center text-center relative">
                <div className="absolute top-4 right-4">
                  <Badge className={
                    idx === 0 ? "bg-amber-400 text-amber-950 font-bold" : idx === 1 ? "bg-slate-200 text-slate-800 font-bold" : "bg-amber-700 text-white font-bold"
                  }>
                    Rank #{amb.rank}
                  </Badge>
                </div>

                <Avatar className="h-16 w-16 mb-3 border-2 border-[#D89A86] bg-white shadow-xs">
                  <AvatarFallback className="font-bold text-[#D89A86] text-xl bg-[#FFF8F2]">
                    {amb.name.charAt(0)}
                  </AvatarFallback>
                </Avatar>

                <h3 className="font-serif-brand font-bold text-lg text-[#3A2B24]">{amb.name}</h3>
                <p className="text-xs text-[#6C5C54] font-medium flex items-center gap-1 mt-0.5">
                  <GraduationCap className="h-3.5 w-3.5 text-[#D89A86]" /> {amb.college}
                </p>

                <div className="flex items-center gap-2 mt-3">
                  <Badge className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full ${tier.color}`}>
                    {tier.icon} {tier.name}
                  </Badge>
                </div>

                <div className="grid grid-cols-2 gap-3 w-full mt-5 pt-4 border-t border-[#EFE6DD]">
                  <div>
                    <span className="text-[10px] text-[#6C5C54] font-bold uppercase tracking-wider block">Referrals</span>
                    <span className="font-extrabold text-[#3A2B24] text-sm">{amb.referrals} Orders</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-[#6C5C54] font-bold uppercase tracking-wider block">Commission</span>
                    <span className="font-extrabold text-[#D89A86] text-sm">{amb.earnings}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Overall Leaderboard Standings Table */}
      <Card className="border border-[#EFE6DD] bg-white rounded-3xl shadow-xs overflow-hidden">
        <CardHeader className="p-6 pb-3 border-b border-[#EFE6DD] bg-[#FFF8F2]">
          <CardTitle className="font-serif-brand text-xl font-bold text-[#3A2B24]">Overall Leaderboard Standings</CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="overflow-hidden border border-[#EFE6DD] rounded-2xl">
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="text-[11px] font-bold text-[#6C5C54] uppercase tracking-wider bg-[#FFF8F2] border-b border-[#EFE6DD]">
                  <tr>
                    <th className="px-5 py-3.5">Rank</th>
                    <th className="px-5 py-3.5">Ambassador</th>
                    <th className="px-5 py-3.5">College</th>
                    <th className="px-5 py-3.5">Referrals</th>
                    <th className="px-5 py-3.5">Total Commission</th>
                    <th className="px-5 py-3.5">Calculated Tier Badge</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#EFE6DD]">
                  {sortedAmbassadors.map((amb: LeaderboardAmbassador) => {
                    const tier = getTierInfo(amb.referrals || 0);
                    return (
                      <tr key={amb.id || amb.name} className="hover:bg-[#FFF8F2]/50 transition-colors">
                        <td className="px-5 py-4 font-bold text-[#3A2B24]">#{amb.rank}</td>
                        <td className="px-5 py-4 font-bold text-[#3A2B24]">{amb.name}</td>
                        <td className="px-5 py-4 text-xs font-medium text-[#6C5C54]">{amb.college}</td>
                        <td className="px-5 py-4 font-bold text-[#3A2B24]">{amb.referrals} Referrals</td>
                        <td className="px-5 py-4 font-extrabold text-emerald-700">{amb.earnings}</td>
                        <td className="px-5 py-4">
                          <Badge className={`text-xs font-bold px-3 py-1 rounded-full ${tier.color}`}>
                            {tier.icon} {tier.name}
                          </Badge>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
