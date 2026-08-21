"use client";

import { useState, useEffect, useMemo } from "react";
import { Users, Search, Wallet, ArrowUpRight, Ticket, CheckCircle2, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { useOrders } from "@/context/OrderContext";

export default function AmbassadorReferralsPage() {
  const { orders } = useOrders();
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCode, setActiveCode] = useState<string>("SREE20");

  useEffect(() => {
    const syncActiveCode = () => {
      if (typeof window !== "undefined") {
        const savedConfig = localStorage.getItem("pixello_ambassador_promo_config");
        if (savedConfig) {
          try {
            const parsed = JSON.parse(savedConfig);
            if (parsed.promoCode) {
              setActiveCode(parsed.promoCode);
              return;
            }
          } catch (e) {
            console.error(e);
          }
        }
        const savedProfile = localStorage.getItem("pixello_ambassador_profile");
        if (savedProfile) {
          try {
            const parsed = JSON.parse(savedProfile);
            if (parsed.promoCode) {
              setActiveCode(parsed.promoCode);
              return;
            }
          } catch (e) {}
        }
      }
    };

    syncActiveCode();
    window.addEventListener("pixello_promo_config_updated", syncActiveCode);
    window.addEventListener("pixello_ambassador_profile_updated", syncActiveCode);
    window.addEventListener("pixello_ambassadors_updated", syncActiveCode);
    window.addEventListener("storage", syncActiveCode);
    return () => {
      window.removeEventListener("pixello_promo_config_updated", syncActiveCode);
      window.removeEventListener("pixello_ambassador_profile_updated", syncActiveCode);
      window.removeEventListener("pixello_ambassadors_updated", syncActiveCode);
      window.removeEventListener("storage", syncActiveCode);
    };
  }, []);

  const INITIAL_SAMPLE_REFERRALS = useMemo(() => [
    { id: "PXL-8012-5000", name: "Rahul Sharma", date: "Aug 08, 2026", orderValue: 1200, commission: 120, code: activeCode || "SREE20", status: "PAID", isLive: false },
    { id: "PXL-8023-4000", name: "Sneha Kapoor", date: "Aug 07, 2026", orderValue: 850, commission: 85, code: activeCode || "SREE20", status: "PENDING", isLive: false },
    { id: "PXL-8034-3000", name: "Priya Singh", date: "Aug 06, 2026", orderValue: 2400, commission: 240, code: activeCode || "SREE20", status: "PENDING", isLive: false },
    { id: "PXL-8045-2000", name: "Amit Verma", date: "Aug 05, 2026", orderValue: 1499, commission: 150, code: activeCode || "SREE20", status: "PAID", isLive: false },
    { id: "PXL-8056-1000", name: "Kavya Reddy", date: "Aug 04, 2026", orderValue: 799, commission: 80, code: activeCode || "SREE20", status: "PAID", isLive: false },
    { id: "PXL-8067-0050", name: "Vikram Malhotra", date: "Aug 02, 2026", orderValue: 399, commission: 40, code: activeCode || "SREE20", status: "PAID", isLive: false },
  ], [activeCode]);

  const { allReferrals, totalReferredCount, totalCommissionEarned, filteredReferrals } = useMemo(() => {
    const liveReferredOrders = (orders || [])
      .filter((order) => Boolean(order.referralCode))
      .map((order) => {
        const orderVal = order.totalAmount || 0;
        const comm = Math.round(orderVal * 0.10);
        const isCancelled = order.status === "Cancelled";
        const isDelivered = order.status === "Delivered";

        let formattedDate = order.date || "Aug 14, 2026";
        if (order.date && order.date.includes("-")) {
          const parts = order.date.split("-");
          if (parts.length === 3) {
            const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
            const monthIdx = parseInt(parts[1], 10) - 1;
            const monthStr = months[monthIdx] || "Aug";
            formattedDate = `${monthStr} ${parts[2]}, ${parts[0]}`;
          }
        }

        return {
          id: order.id,
          name: order.customerName || "Sai Pranav",
          date: formattedDate,
          orderValue: Math.round(orderVal),
          commission: comm,
          code: order.referralCode || activeCode || "SREE20",
          status: isCancelled ? "CANCELLED" : (isDelivered ? "PAID" : "PENDING"),
          isLive: true,
        };
      });

    const liveOrderIds = new Set(liveReferredOrders.map((o) => o.id));
    const filteredSamples = INITIAL_SAMPLE_REFERRALS.filter((s) => !liveOrderIds.has(s.id));
    const combined = [...liveReferredOrders, ...filteredSamples];

    const q = searchQuery.toLowerCase().trim();
    const filtered = !q
      ? combined
      : combined.filter(
          (r) =>
            r.name.toLowerCase().includes(q) ||
            r.id.toLowerCase().includes(q) ||
            r.code.toLowerCase().includes(q)
        );

    return {
      allReferrals: combined,
      totalReferredCount: combined.length,
      totalCommissionEarned: combined.reduce(
        (sum, r) => sum + (r.status !== "CANCELLED" ? r.commission : 0),
        0
      ),
      filteredReferrals: filtered,
    };
  }, [orders, activeCode, INITIAL_SAMPLE_REFERRALS, searchQuery]);

  return (
    <div className="flex flex-col gap-6 bg-[#F8F3EE] p-6 rounded-3xl min-h-screen">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="font-serif-brand text-3xl font-bold text-[#3A2B24]">My Referrals</h2>
          <p className="text-xs text-[#6C5C54] mt-1">Track all live orders placed using your ambassador code & promo links.</p>
        </div>
        <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 px-4 py-2 rounded-2xl shadow-2xs">
          <Ticket className="h-4 w-4 text-emerald-600" />
          <span className="text-xs font-bold text-emerald-900">Active Ambassador Code: <strong className="font-mono text-emerald-700 uppercase">{activeCode}</strong></span>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <Card className="border border-[#EFE6DD] bg-white rounded-3xl shadow-xs">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-[#6C5C54] uppercase tracking-wider">Total Referred Students</p>
              <p suppressHydrationWarning className="text-3xl font-extrabold text-[#3A2B24] mt-1">{totalReferredCount}</p>
            </div>
            <div className="h-10 w-10 rounded-2xl bg-[#FFF8F2] border border-[#EFE6DD] flex items-center justify-center text-[#D89A86]">
              <Users className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="border border-[#EFE6DD] bg-white rounded-3xl shadow-xs">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-[#6C5C54] uppercase tracking-wider">Total Commission Earned</p>
              <p suppressHydrationWarning className="text-3xl font-extrabold text-emerald-600 mt-1">₹{totalCommissionEarned.toLocaleString("en-IN")}</p>
            </div>
            <div className="h-10 w-10 rounded-2xl bg-[#FFF8F2] border border-[#EFE6DD] flex items-center justify-center text-[#D89A86]">
              <Wallet className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="border border-[#EFE6DD] bg-white rounded-3xl shadow-xs">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-[#6C5C54] uppercase tracking-wider">Commission Rate</p>
              <p className="text-3xl font-extrabold text-[#D89A86] mt-1">10%</p>
            </div>
            <div className="h-10 w-10 rounded-2xl bg-[#FFF8F2] border border-[#EFE6DD] flex items-center justify-center text-[#D89A86]">
              <ArrowUpRight className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Referrals List Table */}
      <Card className="border border-[#EFE6DD] bg-white rounded-3xl shadow-xs overflow-hidden">
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <h3 className="font-serif-brand text-xl font-bold text-[#3A2B24]">Referred Orders History</h3>
            <div className="relative w-full sm:w-72">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#6C5C54]" />
              <Input 
                placeholder="Search by customer name or code..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 rounded-full border-[#EFE6DD] bg-[#FFF8F2] text-xs font-medium text-[#3A2B24]" 
              />
            </div>
          </div>

          <div className="overflow-hidden border border-[#EFE6DD] rounded-2xl">
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="text-[11px] font-bold text-[#6C5C54] uppercase tracking-wider bg-[#FFF8F2] border-b border-[#EFE6DD]">
                  <tr>
                    <th className="px-4 py-3.5">Ref / Order ID</th>
                    <th className="px-4 py-3.5">Customer Name</th>
                    <th className="px-4 py-3.5">Date</th>
                    <th className="px-4 py-3.5">Ambassador Code</th>
                    <th className="px-4 py-3.5">Order Amount</th>
                    <th className="px-4 py-3.5">Your Commission (10%)</th>
                    <th className="px-4 py-3.5">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#EFE6DD]">
                  {filteredReferrals.map((item, idx) => (
                    <tr key={`${item.id}-${idx}`} className={`hover:bg-[#FFF8F2]/50 transition-colors ${item.isLive ? 'bg-emerald-50/40 font-semibold' : ''}`}>
                      <td className="px-4 py-4 text-xs font-bold text-[#3A2B24] flex items-center gap-1.5">
                        {item.id}
                        {item.isLive && (
                          <span className="text-[10px] font-extrabold bg-emerald-100 text-emerald-800 border border-emerald-300 px-2 py-0.5 rounded-full">
                            LIVE
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-4 font-bold text-[#3A2B24]">{item.name}</td>
                      <td className="px-4 py-4 text-xs font-medium text-[#6C5C54]">{item.date}</td>
                      <td className="px-4 py-4 text-xs font-mono font-bold text-emerald-800">{item.code}</td>
                      <td className="px-4 py-4 font-extrabold text-[#3A2B24]">₹{item.orderValue.toLocaleString("en-IN")}</td>
                      <td className="px-4 py-4 font-extrabold text-emerald-600">₹{item.commission.toLocaleString("en-IN")}</td>
                      <td className="px-4 py-4">
                        <Badge 
                          className={
                            item.status === "PAID" 
                              ? "bg-emerald-100 text-emerald-800 border-emerald-200 text-xs px-3 py-0.5 rounded-full font-bold" 
                              : (item.status === "CANCELLED"
                                ? "bg-rose-100 text-rose-800 border-rose-200 text-xs px-3 py-0.5 rounded-full font-bold"
                                : "bg-amber-100 text-amber-800 border-amber-200 text-xs px-3 py-0.5 rounded-full font-bold")
                          }
                        >
                          {item.status}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
