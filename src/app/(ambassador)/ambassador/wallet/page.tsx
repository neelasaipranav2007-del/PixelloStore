"use client";

import { useState, useEffect, useMemo } from "react";
import { Wallet, ArrowDownRight, ArrowUpRight, CheckCircle2, Clock, CreditCard, Building, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { useOrders } from "@/context/OrderContext";

export default function AmbassadorWalletPage() {
  const { orders } = useOrders();
  const [payoutRequested, setPayoutRequested] = useState(false);

  const [payoutHistory, setPayoutHistory] = useState<any[]>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("pixello_ambassador_payouts_v1");
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed)) return parsed;
        } catch (e) {
          console.error(e);
        }
      }
    }
    return [];
  });

  useEffect(() => {
    const syncPayouts = () => {
      if (typeof window !== "undefined") {
        const saved = localStorage.getItem("pixello_ambassador_payouts_v1");
        if (saved) {
          try {
            setPayoutHistory(JSON.parse(saved));
          } catch (e) {
            console.error(e);
          }
        }
      }
    };
    window.addEventListener("pixello_payout_requested", syncPayouts);
    window.addEventListener("storage", syncPayouts);
    return () => {
      window.removeEventListener("pixello_payout_requested", syncPayouts);
      window.removeEventListener("storage", syncPayouts);
    };
  }, []);

  const {
    liveCommissionTotal,
    pendingHoldTotal,
    settledPayoutsTotal,
    pendingPayoutsTotal,
    hasPendingPayout,
    availableBalance,
    totalLifetimeSettled,
    allTransactions,
  } = useMemo(() => {
    const liveReferred = (orders || []).filter((o) => Boolean(o.referralCode));

    const liveComm = liveReferred.reduce((sum, o) => {
      if (o.status === "Cancelled") return sum;
      return sum + Math.round((o.totalAmount || 0) * 0.10);
    }, 0);

    const pendingHold = liveReferred.reduce((sum, o) => {
      if (o.status !== "Delivered" && o.status !== "Cancelled") {
        return sum + Math.round((o.totalAmount || 0) * 0.10);
      }
      return sum;
    }, 0);

    const settledTotal = payoutHistory
      .filter((p) => p.status === "SETTLED")
      .reduce((sum, p) => sum + (Number(p.amount) || 0), 0);

    const pendingTotal = payoutHistory
      .filter((p) => p.status === "PENDING")
      .reduce((sum, p) => sum + (Number(p.amount) || 0), 0);

    const hasPending = payoutHistory.some((p) => p.status === "PENDING");
    const availBal = Math.max(0, 4250 + liveComm - settledTotal - pendingTotal);
    const lifetimeSettled = 14998 + settledTotal;

    const liveTxns = liveReferred.map((o) => {
      const comm = Math.round((o.totalAmount || 0) * 0.10);
      return {
        id: `TXN-${o.id}`,
        date: o.date || "2026-08-14",
        type: `Commission Credit (${o.referralCode || "Ref Code"})`,
        amount: `+₹${comm}`,
        status: o.status === "Delivered" ? "COMPLETED" : (o.status === "Cancelled" ? "CANCELLED" : "PENDING"),
        isLive: true,
      };
    });

    const userPayoutTxns = payoutHistory.map((p) => ({
      id: `TXN-${p.id}`,
      date: p.requestedAt,
      type: p.status === "SETTLED" ? `Instant Bank Payout Transfer (${p.settledRef || "HDFC NEFT"})` : "Instant Bank Payout Transfer",
      amount: `-₹${Number(p.amount).toLocaleString("en-IN")}`,
      status: p.status === "SETTLED" ? "COMPLETED" : "PENDING APPROVAL",
      isLive: true,
    }));

    const BASE_TRANSACTIONS = [
      { id: "TXN-PXL-8012-5000", date: "Aug 08, 2026", type: "Commission Credit (SREE20)", amount: "+₹120", status: "COMPLETED", isLive: false },
      { id: "TXN-[#HDFC-PAYOUT-902]", date: "Aug 05, 2026", type: "Bank Payout Transfer", amount: "-₹3,000", status: "COMPLETED", isLive: false },
      { id: "TXN-PXL-8034-3000", date: "Aug 04, 2026", type: "Commission Credit (SREE20)", amount: "+₹150", status: "COMPLETED", isLive: false },
      { id: "TXN-PXL-8056-1000", date: "Aug 02, 2026", type: "Commission Credit (SREE20)", amount: "+₹80", status: "COMPLETED", isLive: false },
    ];

    return {
      liveCommissionTotal: liveComm,
      pendingHoldTotal: pendingHold,
      settledPayoutsTotal: settledTotal,
      pendingPayoutsTotal: pendingTotal,
      hasPendingPayout: hasPending,
      availableBalance: availBal,
      totalLifetimeSettled: lifetimeSettled,
      allTransactions: [...userPayoutTxns, ...liveTxns, ...BASE_TRANSACTIONS],
    };
  }, [orders, payoutHistory]);

  const handleRequestPayout = () => {
    if (availableBalance <= 0 || hasPendingPayout) return;

    const requestAmount = availableBalance;
    const newPayout = {
      id: `PAYOUT-${Math.floor(1000 + Math.random() * 9000)}`,
      ambassadorName: "Sree Charani Grandhe",
      college: "Aurora Deemed To Be A University",
      promoCode: "SREE20",
      upiId: "sreecharani@okhdfcbank",
      accountNumber: "50100482910482 (HDFC Bank)",
      amount: requestAmount,
      requestedAt: "Aug 19, 2026",
      status: "PENDING",
    };

    const updatedPayouts = [newPayout, ...payoutHistory];
    setPayoutHistory(updatedPayouts);

    if (typeof window !== "undefined") {
      localStorage.setItem("pixello_ambassador_payouts_v1", JSON.stringify(updatedPayouts));

      // Push notification to Admin Notification System
      try {
        const savedNotifs = localStorage.getItem("pixello_admin_notifications_v3");
        let notifList = savedNotifs ? JSON.parse(savedNotifs) : [];
        if (!Array.isArray(notifList)) notifList = [];

        const payoutNotif = {
          id: `notif-payout-${Date.now()}`,
          title: "Ambassador Payout Requested",
          desc: `Sree Charani Grandhe (SREE20) requested ₹${requestAmount.toLocaleString("en-IN")} bank payout settlement`,
          time: "Just now",
          read: false,
          type: "ambassador",
          link: "/admin/ambassadors",
        };
        const newNotifs = [payoutNotif, ...notifList];
        localStorage.setItem("pixello_admin_notifications_v3", JSON.stringify(newNotifs));
      } catch (e) {
        console.error(e);
      }

      window.dispatchEvent(new Event("storage"));
      window.dispatchEvent(new Event("pixello_payout_requested"));
    }

    setPayoutRequested(true);
    setTimeout(() => setPayoutRequested(false), 4000);
  };

  return (
    <div className="flex flex-col gap-6 bg-[#F8F3EE] p-6 rounded-3xl min-h-screen">
      {/* Toast Banner */}
      {payoutRequested && (
        <div className="fixed top-20 right-8 z-50 bg-[#3A2B24] text-white px-5 py-3 rounded-2xl shadow-xl border border-[#D89A86]/40 flex items-center gap-2.5 animate-in fade-in slide-in-from-top-4 duration-300">
          <CheckCircle2 className="h-5 w-5 text-[#D89A86]" />
          <span className="text-xs font-bold">Payout request submitted to bank settlement team!</span>
        </div>
      )}

      <div>
        <h2 className="font-serif-brand text-3xl font-bold text-[#3A2B24]">Wallet & Payout Settlement</h2>
        <p className="text-xs text-[#6C5C54] mt-1">Request instant bank payouts and view real-time commission settlement statements.</p>
      </div>

      {/* Wallet Balance Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="border border-[#EFE6DD] bg-gradient-to-br from-[#3A2B24] to-[#4E3D35] text-white rounded-3xl shadow-sm">
          <CardContent className="p-6 flex flex-col justify-between h-full">
            <div>
              <span className="text-xs font-bold text-[#EFE6DD] uppercase tracking-wider block mb-1">Available Payout Balance</span>
              <span suppressHydrationWarning className="text-4xl font-extrabold text-white">₹{availableBalance.toLocaleString("en-IN")}</span>
            </div>
            {hasPendingPayout ? (
              <div className="mt-6 bg-amber-500/20 border border-amber-400/40 text-amber-200 text-xs font-bold rounded-2xl p-3 flex items-center gap-2">
                <Clock className="h-4 w-4 shrink-0 text-amber-300 animate-pulse" />
                <span>₹{pendingPayoutsTotal.toLocaleString("en-IN")} Payout Pending Admin Settlement</span>
              </div>
            ) : (
              <Button 
                onClick={handleRequestPayout}
                disabled={availableBalance <= 0}
                className="mt-6 btn-pixello-primary text-xs font-bold rounded-full h-11 w-full shadow-xs cursor-pointer disabled:opacity-50"
              >
                <Wallet className="h-4 w-4 mr-2 text-white" /> Request Instant Payout
              </Button>
            )}
          </CardContent>
        </Card>

        <Card className="border border-[#EFE6DD] bg-white rounded-3xl shadow-xs">
          <CardContent className="p-6 flex flex-col justify-between h-full">
            <div>
              <span className="text-xs font-bold text-[#6C5C54] uppercase tracking-wider block mb-1">Total Lifetime Settled</span>
              <span suppressHydrationWarning className="text-3xl font-extrabold text-emerald-600">₹{totalLifetimeSettled.toLocaleString("en-IN")}</span>
            </div>
            <p className="text-xs text-[#6C5C54] mt-4 font-medium">✓ Auto-settled directly to verified UPI / HDFC Bank A/C.</p>
          </CardContent>
        </Card>

        <Card className="border border-[#EFE6DD] bg-white rounded-3xl shadow-xs">
          <CardContent className="p-6 flex flex-col justify-between h-full">
            <div>
              <span className="text-xs font-bold text-[#6C5C54] uppercase tracking-wider block mb-1">Pending Uncollected Hold</span>
              <span suppressHydrationWarning className="text-3xl font-extrabold text-amber-600">₹{(325 + pendingHoldTotal).toLocaleString("en-IN")}</span>
            </div>
            <p className="text-xs text-[#6C5C54] mt-4 font-medium">Under 7-day customer return policy hold.</p>
          </CardContent>
        </Card>
      </div>

      {/* Transaction History Table */}
      <Card className="border border-[#EFE6DD] bg-white rounded-3xl shadow-xs overflow-hidden">
        <CardContent className="p-6">
          <h3 className="font-serif-brand text-xl font-bold text-[#3A2B24] mb-4">Payout & Commission Transactions</h3>

          <div className="overflow-hidden border border-[#EFE6DD] rounded-2xl">
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="text-[11px] font-bold text-[#6C5C54] uppercase tracking-wider bg-[#FFF8F2] border-b border-[#EFE6DD]">
                  <tr>
                    <th className="px-4 py-3.5">Txn ID</th>
                    <th className="px-4 py-3.5">Date</th>
                    <th className="px-4 py-3.5">Transaction Type</th>
                    <th className="px-4 py-3.5">Amount</th>
                    <th className="px-4 py-3.5">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#EFE6DD]">
                  {allTransactions.map((txn, idx) => (
                    <tr key={`${txn.id}-${idx}`} className={`hover:bg-[#FFF8F2]/50 transition-colors ${txn.isLive ? 'bg-emerald-50/40 font-semibold' : ''}`}>
                      <td className="px-4 py-4 text-xs font-bold text-[#3A2B24] flex items-center gap-1.5">
                        {txn.id}
                        {txn.isLive && (
                          <span className="text-[10px] font-extrabold bg-emerald-100 text-emerald-800 border border-emerald-300 px-2 py-0.5 rounded-full">
                            LIVE
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-4 text-xs font-medium text-[#6C5C54]">{txn.date}</td>
                      <td className="px-4 py-4 font-bold text-[#3A2B24]">{txn.type}</td>
                      <td className={`px-4 py-4 font-extrabold ${txn.amount.startsWith("+") ? "text-emerald-600" : txn.amount.startsWith("-") ? "text-rose-600" : "text-[#3A2B24]"}`}>
                        {txn.amount}
                      </td>
                      <td className="px-4 py-4">
                        <Badge className={`text-xs px-3 py-0.5 rounded-full font-bold ${
                          txn.status === "COMPLETED" 
                            ? "bg-emerald-100 text-emerald-800 border-emerald-200" 
                            : txn.status.includes("PENDING") 
                            ? "bg-amber-100 text-amber-800 border-amber-200 animate-pulse" 
                            : "bg-rose-100 text-rose-800 border-rose-200"
                        }`}>
                          {txn.status}
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
