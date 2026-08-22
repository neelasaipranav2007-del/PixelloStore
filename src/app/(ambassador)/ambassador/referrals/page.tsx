"use client";

import { useState, useEffect, useMemo } from "react";
import { Users, Search, Wallet, ArrowUpRight, Ticket, CheckCircle2, Clock, ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";

export default function AmbassadorReferralsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [referralsData, setReferralsData] = useState<{
    referrals: Array<{
      id: string;
      customerName: string;
      customerPhone: string;
      orderValue: number;
      commission: number;
      code: string;
      status: string;
      orderStatus: string;
      date: string;
    }>;
    summary: {
      totalCount: number;
      totalCommissions: number;
      paidCommissions: number;
      activeCode: string;
    };
  }>({
    referrals: [],
    summary: {
      totalCount: 0,
      totalCommissions: 0,
      paidCommissions: 0,
      activeCode: "...",
    },
  });

  const fetchReferrals = async () => {
    try {
      setLoading(true);
      const token = typeof window !== "undefined" ? localStorage.getItem("pixello_ambassador_token") : null;
      const headers: Record<string, string> = {};
      if (token) headers["Authorization"] = `Bearer ${token}`;

      const res = await fetch("/api/ambassador/referrals", { headers });
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          setReferralsData(data);
        }
      }
    } catch (e) {
      console.error("Error fetching referrals:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReferrals();

    const handleSync = () => fetchReferrals();
    window.addEventListener("pixello_orders_updated", handleSync);
    window.addEventListener("pixello_ambassador_profile_updated", handleSync);
    return () => {
      window.removeEventListener("pixello_orders_updated", handleSync);
      window.removeEventListener("pixello_ambassador_profile_updated", handleSync);
    };
  }, []);

  const filteredReferrals = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return referralsData.referrals;
    return referralsData.referrals.filter(
      (r) =>
        r.customerName.toLowerCase().includes(q) ||
        r.id.toLowerCase().includes(q) ||
        r.code.toLowerCase().includes(q)
    );
  }, [referralsData.referrals, searchQuery]);

  return (
    <div className="flex flex-col gap-6 bg-[#F8F3EE] p-6 rounded-3xl min-h-screen">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="font-serif-brand text-3xl font-bold text-[#3A2B24]">My Referrals</h2>
          <p className="text-xs text-[#6C5C54] mt-1">Track all orders placed using your ambassador code & promo links.</p>
        </div>
        <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 px-4 py-2 rounded-2xl shadow-2xs">
          <Ticket className="h-4 w-4 text-emerald-600" />
          <span className="text-xs font-bold text-emerald-900">
            Active Ambassador Code: <strong className="font-mono text-emerald-700 uppercase">{referralsData.summary.activeCode}</strong>
          </span>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <Card className="border border-[#EFE6DD] bg-white rounded-3xl shadow-xs">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-[#6C5C54] uppercase tracking-wider">Total Referred Students</p>
              <p className="text-3xl font-extrabold text-[#3A2B24] mt-1">{referralsData.summary.totalCount}</p>
            </div>
            <div className="h-10 w-10 rounded-2xl bg-[#FFF8F2] border border-[#EFE6DD] flex items-center justify-center text-[#D89A86]">
              <Users className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="border border-[#EFE6DD] bg-white rounded-3xl shadow-xs">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-[#6C5C54] uppercase tracking-wider">Commission Generated</p>
              <p className="text-3xl font-extrabold text-emerald-600 mt-1">₹{referralsData.summary.totalCommissions.toLocaleString("en-IN")}</p>
            </div>
            <div className="h-10 w-10 rounded-2xl bg-[#FFF8F2] border border-[#EFE6DD] flex items-center justify-center text-[#D89A86]">
              <Wallet className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="border border-[#EFE6DD] bg-white rounded-3xl shadow-xs">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-[#6C5C54] uppercase tracking-wider">Paid Out / Eligible</p>
              <p className="text-3xl font-extrabold text-[#3A2B24] mt-1">₹{referralsData.summary.paidCommissions.toLocaleString("en-IN")}</p>
            </div>
            <div className="h-10 w-10 rounded-2xl bg-[#FFF8F2] border border-[#EFE6DD] flex items-center justify-center text-[#D89A86]">
              <CheckCircle2 className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Referrals Search & List */}
      <Card className="border border-[#EFE6DD] shadow-sm bg-white rounded-3xl overflow-hidden">
        <div className="p-5 border-b border-[#EFE6DD] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="relative w-full sm:w-80">
            <Search className="h-4 w-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#6C5C54]" />
            <Input 
              placeholder="Search by student name or order ID..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 bg-[#F8F3EE] border-[#EFE6DD] text-xs h-10 rounded-xl"
            />
          </div>
          <p className="text-xs text-[#6C5C54] font-medium">
            Showing <strong>{filteredReferrals.length}</strong> of <strong>{referralsData.summary.totalCount}</strong> referred orders
          </p>
        </div>

        <CardContent className="p-0">
          {filteredReferrals.length === 0 ? (
            <div className="p-12 text-center text-[#6C5C54]">
              <Users className="h-10 w-10 text-[#D89A86]/50 mx-auto mb-3" />
              <p className="font-bold text-sm text-[#3A2B24]">No matching referrals found</p>
              <p className="text-xs mt-1">When students place orders with your code, they will automatically appear here.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#FFF8F2] text-[#6C5C54] font-semibold border-b border-[#EFE6DD]">
                  <tr>
                    <th className="p-4 pl-6">Order ID</th>
                    <th className="p-4">Customer Name</th>
                    <th className="p-4">Phone</th>
                    <th className="p-4">Order Value</th>
                    <th className="p-4">Commission (10%)</th>
                    <th className="p-4">Code Used</th>
                    <th className="p-4">Payout Status</th>
                    <th className="p-4 pr-6 text-right">Order Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#EFE6DD]">
                  {filteredReferrals.map((r) => (
                    <tr key={r.id} className="hover:bg-[#FFF8F2]/50 transition-colors">
                      <td className="p-4 pl-6 font-mono font-bold text-[#3A2B24]">{r.id}</td>
                      <td className="p-4 font-bold text-[#3A2B24]">{r.customerName}</td>
                      <td className="p-4 font-mono text-[#6C5C54]">{r.customerPhone}</td>
                      <td className="p-4 font-bold text-[#3A2B24]">₹{r.orderValue.toLocaleString("en-IN")}</td>
                      <td className="p-4 font-bold text-emerald-600">₹{r.commission.toLocaleString("en-IN")}</td>
                      <td className="p-4">
                        <Badge variant="outline" className="font-mono text-[10px] bg-white border-[#D89A86] text-[#3A2B24]">
                          {r.code}
                        </Badge>
                      </td>
                      <td className="p-4">
                        <Badge 
                          className={
                            r.status === "PAID"
                              ? "bg-emerald-100 text-emerald-800 border-emerald-200"
                              : r.status === "CANCELLED"
                              ? "bg-rose-100 text-rose-800 border-rose-200"
                              : "bg-amber-100 text-amber-800 border-amber-200"
                          }
                        >
                          {r.status}
                        </Badge>
                      </td>
                      <td className="p-4 pr-6 text-right text-[#6C5C54] font-medium">{r.date}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
