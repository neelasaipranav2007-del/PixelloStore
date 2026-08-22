"use client";

import { useState, useEffect, useMemo } from "react";
import { Trophy, Medal, Award, TrendingUp, Sparkles, GraduationCap, Check, Info, RefreshCw, UserCheck } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";

export interface LeaderboardEntry {
  id: string;
  rank: number;
  name: string;
  college: string;
  tier: string;
  rankBadge: string;
  referrals: number;
  isCurrentUser: boolean;
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

export default function AmbassadorLeaderboardPage() {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchLeaderboard = async () => {
    try {
      setLoading(true);
      const token = typeof window !== "undefined" ? localStorage.getItem("pixello_ambassador_token") : null;
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
      console.error("Leaderboard fetch error:", e);
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

  const currentUserEntry = leaderboard.find((item) => item.isCurrentUser);

  return (
    <div className="flex flex-col gap-6 bg-[#F8F3EE] p-6 rounded-3xl min-h-screen">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="font-serif-brand text-3xl font-bold text-[#3A2B24]">Ambassador Leaderboard</h2>
          <p className="text-xs text-[#6C5C54] mt-1">Real-time verified campus rankings across all universities.</p>
        </div>
        <div className="flex items-center gap-3">
          <Button 
            onClick={fetchLeaderboard}
            variant="outline" 
            size="sm"
            className="rounded-xl border-[#EFE6DD] text-xs font-bold text-[#3A2B24] hover:bg-white flex items-center gap-1.5"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
          <div className="flex items-center gap-2 bg-[#3A2B24] text-white px-4 py-2 rounded-2xl shadow-2xs">
            <Trophy className="h-4 w-4 text-[#D89A86]" />
            <span className="text-xs font-bold">
              Your Rank: {currentUserEntry ? <strong className="text-[#D89A86]">#{currentUserEntry.rank}</strong> : "Active"}
            </span>
          </div>
        </div>
      </div>

      {/* Top 3 Podium Cards */}
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
              } ${item.isCurrentUser ? "ring-2 ring-[#D89A86]" : ""}`}
            >
              {item.isCurrentUser && (
                <div className="absolute top-0 right-0 bg-[#D89A86] text-white text-[10px] font-bold px-3 py-0.5 rounded-bl-xl uppercase tracking-wider flex items-center gap-1">
                  <UserCheck className="h-3 w-3" /> You
                </div>
              )}
              <CardContent className="p-6 flex flex-col items-center text-center">
                <div className="relative mb-3">
                  <Avatar className="h-16 w-16 border-2 border-[#D89A86] shadow-sm">
                    <AvatarFallback className="bg-[#FFF8F2] text-[#3A2B24] font-bold text-lg">
                      {item.name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase()}
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
                <p className={`text-xs mt-0.5 max-w-[200px] truncate ${isFirst ? "text-[#EFE6DD]/80" : "text-[#6C5C54]"}`}>
                  {item.college}
                </p>

                <div className="flex items-center gap-2 mt-3">
                  <Badge className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${tier.color}`}>
                    {tier.icon} {tier.name}
                  </Badge>
                </div>

                <div className="mt-4 pt-4 border-t border-[#EFE6DD]/20 w-full flex justify-around text-xs">
                  <div>
                    <span className={`block text-[10px] uppercase font-bold tracking-wider ${isFirst ? "text-[#EFE6DD]/60" : "text-[#6C5C54]"}`}>
                      Orders
                    </span>
                    <strong className="text-base font-bold">{item.referrals}</strong>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Full Leaderboard Table */}
      <Card className="border border-[#EFE6DD] shadow-sm bg-white rounded-3xl overflow-hidden">
        <CardHeader className="p-6 border-b border-[#EFE6DD]">
          <CardTitle className="font-serif-brand text-lg font-bold text-[#3A2B24] flex items-center gap-2">
            <Trophy className="h-5 w-5 text-[#D89A86]" /> Full Campus Leaderboard Rankings
          </CardTitle>
          <CardDescription className="text-xs text-[#6C5C54] mt-1">
            Rankings are based on verified customer orders placed with each ambassador's referral code.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#FFF8F2] text-[#6C5C54] font-semibold border-b border-[#EFE6DD]">
                <tr>
                  <th className="p-4 pl-6 w-16">Rank</th>
                  <th className="p-4">Ambassador</th>
                  <th className="p-4">University / College</th>
                  <th className="p-4">Cohort Tier</th>
                  <th className="p-4 pr-6 text-right">Referred Orders</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#EFE6DD]">
                {leaderboard.map((item) => {
                  const tier = getTierInfo(item.referrals);
                  return (
                    <tr
                      key={item.id}
                      className={`transition-colors ${
                        item.isCurrentUser
                          ? "bg-amber-50/80 font-semibold"
                          : "hover:bg-[#FFF8F2]/50"
                      }`}
                    >
                      <td className="p-4 pl-6 font-bold text-sm">
                        {item.rank === 1 ? (
                          <span className="text-amber-500 font-extrabold text-base">🥇 #1</span>
                        ) : item.rank === 2 ? (
                          <span className="text-slate-500 font-bold">🥈 #2</span>
                        ) : item.rank === 3 ? (
                          <span className="text-amber-700 font-bold">🥉 #3</span>
                        ) : (
                          <span className="text-[#6C5C54]">#{item.rank}</span>
                        )}
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-2.5">
                          <Avatar className="h-8 w-8 border border-[#EFE6DD]">
                            <AvatarFallback className="bg-[#FFF8F2] text-[#3A2B24] text-xs font-bold">
                              {item.name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <span className="font-bold text-[#3A2B24] flex items-center gap-1.5">
                              {item.name}
                              {item.isCurrentUser && (
                                <Badge className="bg-[#3A2B24] text-[#EFE6DD] text-[9px] px-1.5 py-0 h-4">YOU</Badge>
                              )}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="p-4 text-[#6C5C54]">{item.college}</td>
                      <td className="p-4">
                        <Badge className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${tier.color}`}>
                          {tier.icon} {tier.name}
                        </Badge>
                      </td>
                      <td className="p-4 pr-6 text-right font-bold text-sm text-[#3A2B24]">
                        {item.referrals} orders
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
