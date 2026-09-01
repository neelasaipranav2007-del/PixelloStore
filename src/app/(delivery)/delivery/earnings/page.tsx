"use client";

import { useState, useEffect } from "react";
import { useOrders } from "@/context/OrderContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Wallet, TrendingUp, CheckCircle2, ArrowUpRight, IndianRupee, CreditCard, ShieldCheck, X, AlertCircle } from "lucide-react";

interface WithdrawalRecord {
  id: string;
  amount: number;
  date: string;
  upiId: string;
  status: string;
  remainingBalance: number;
}

const DEFAULT_WITHDRAWAL_LOGS: WithdrawalRecord[] = [
  { id: "WDR-891724", amount: 1377.00, date: "Today, 07:18 PM", upiId: "ramesh.kumar@okicici", status: "Settled to UPI Bank", remainingBalance: 0.00 },
  { id: "WDR-542109", amount: 500.00, date: "Yesterday, 06:45 PM", upiId: "ramesh.kumar@okicici", status: "Settled to UPI Bank", remainingBalance: 850.00 },
  { id: "WDR-310948", amount: 1000.00, date: "05 Aug 2026", upiId: "ramesh.kumar@okicici", status: "Settled to UPI Bank", remainingBalance: 420.00 }
];

export default function DeliveryEarningsPage() {
  const { orders } = useOrders();
  const deliveredCount = orders.filter((o) => o.status === "Delivered").length;
  const [totalEarnings, setTotalEarnings] = useState(1377);
  const [withdrawalLogs, setWithdrawalLogs] = useState<WithdrawalRecord[]>([]);
  const [payoutSuccessMsg, setPayoutSuccessMsg] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [withdrawInput, setWithdrawInput] = useState<string>("");
  const [withdrawError, setWithdrawError] = useState<string | null>(null);

  useEffect(() => {
    try {
      const saved = localStorage.getItem("pixello_rider_earnings");
      if (saved) {
        setTotalEarnings(parseFloat(saved));
      } else {
        const calculated = deliveredCount * 85 + 782;
        setTotalEarnings(calculated);
        localStorage.setItem("pixello_rider_earnings", String(calculated));
      }

      const savedLogs = localStorage.getItem("pixello_rider_withdrawals");
      if (savedLogs) {
        setWithdrawalLogs(JSON.parse(savedLogs));
      } else {
        setWithdrawalLogs(DEFAULT_WITHDRAWAL_LOGS);
        localStorage.setItem("pixello_rider_withdrawals", JSON.stringify(DEFAULT_WITHDRAWAL_LOGS));
      }
    } catch (e) {
      console.error(e);
    }
  }, []);

  const handleOpenModal = () => {
    setWithdrawInput(String(totalEarnings.toFixed(0)));
    setWithdrawError(null);
    setIsModalOpen(true);
  };

  const handleConfirmWithdrawal = () => {
    setWithdrawError(null);
    const amt = parseFloat(withdrawInput);
    if (isNaN(amt) || amt <= 0) {
      setWithdrawError("Please enter a valid withdrawal amount (greater than ₹0).");
      return;
    }
    if (amt > totalEarnings) {
      setWithdrawError(`Withdrawal amount cannot exceed your available balance of ₹${totalEarnings.toFixed(2)}.`);
      return;
    }

    const remaining = totalEarnings - amt;
    setTotalEarnings(remaining);

    const nowTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const newLog: WithdrawalRecord = {
      id: `WDR-${Math.floor(100000 + Math.random() * 900000)}`,
      amount: amt,
      date: `Today, ${nowTime}`,
      upiId: "ramesh.kumar@okicici",
      status: "Settled to UPI Bank",
      remainingBalance: remaining
    };

    const updatedLogs = [newLog, ...withdrawalLogs];
    setWithdrawalLogs(updatedLogs);

    try {
      localStorage.setItem("pixello_rider_earnings", String(remaining));
      localStorage.setItem("pixello_rider_withdrawals", JSON.stringify(updatedLogs));
      window.dispatchEvent(new Event("storage"));
    } catch (e) {
      console.error(e);
    }

    setIsModalOpen(false);
    setPayoutSuccessMsg(`✓ ₹${amt.toFixed(2)} transferred successfully to UPI Bank Account! Remaining Balance: ₹${remaining.toFixed(2)}`);
    setTimeout(() => setPayoutSuccessMsg(null), 6000);
  };

  const numInputVal = parseFloat(withdrawInput) || 0;
  const calculatedRemaining = Math.max(0, totalEarnings - numInputVal);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif-brand text-2xl font-bold text-[#3A2B24]">Earnings & Instant Payouts</h1>
        <p className="text-xs text-[#6C5C54] mt-0.5">Track daily earnings, weekly payout history, and transfer funds directly to your UPI bank account.</p>
      </div>

      {payoutSuccessMsg && (
        <div className="p-4 bg-emerald-600 text-white rounded-2xl text-sm font-bold shadow-lg flex items-center justify-between animate-in fade-in">
          <span>{payoutSuccessMsg}</span>
          <CheckCircle2 className="h-5 w-5" />
        </div>
      )}

      {/* PC Widescreen 2-Column Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Balance Card & Payout Action (5 Cols on PC) */}
        <div className="lg:col-span-5 space-y-6">
          <Card className="bg-[#3A2B24] text-white border-none rounded-3xl shadow-xl p-6 relative overflow-hidden">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-xs text-[#EFE6DD] font-semibold uppercase tracking-wider">Total Available Balance</p>
                <h2 className="text-4xl font-black text-white mt-1">₹{totalEarnings.toFixed(2)}</h2>
              </div>
              <div className="h-12 w-12 bg-white/10 rounded-2xl flex items-center justify-center border border-white/20">
                <Wallet className="h-6 w-6 text-[#D89A86]" />
              </div>
            </div>

            <div className="mt-6 pt-5 border-t border-[#4E3D35] flex items-center justify-between text-xs">
              <span className="text-[#EFE6DD]">Instant Payout Status: <strong className={totalEarnings > 0 ? "text-emerald-400" : "text-amber-400"}>{totalEarnings > 0 ? "Ready" : "Zero Balance"}</strong></span>
              <Button 
                onClick={handleOpenModal}
                disabled={totalEarnings <= 0}
                className="bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold text-xs rounded-full px-5 h-9 shadow-md cursor-pointer flex items-center gap-1.5"
              >
                <ArrowUpRight className="h-4 w-4" /> Withdraw to UPI
              </Button>
            </div>
          </Card>

          <Card className="border border-[#EFE6DD] bg-white rounded-3xl p-6 shadow-xs space-y-4">
            <h3 className="font-bold text-sm text-[#3A2B24] flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-emerald-600" /> Linked Payout Account
            </h3>
            <div className="p-3.5 bg-[#FFF8F2] border border-[#EFE6DD] rounded-2xl text-xs space-y-1">
              <p className="text-[#6C5C54]">UPI ID: <strong className="text-[#3A2B24]">ramesh.kumar@okicici</strong></p>
              <p className="text-[#6C5C54]">Account Name: <strong className="text-[#3A2B24]">Ramesh Kumar</strong></p>
              <p className="text-[10px] text-emerald-700 font-bold mt-1">✓ Instant Settlement Enabled</p>
            </div>
          </Card>
        </div>

        {/* Right Column: Earnings Analytics & Trip Logs (7 Cols on PC) */}
        <div className="lg:col-span-7 space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <Card className="bg-white border border-[#EFE6DD] rounded-3xl p-5 shadow-xs">
              <p className="text-xs font-semibold text-[#6C5C54]">Completed Deliveries</p>
              <h3 className="text-2xl font-bold text-[#3A2B24] mt-1">12 Orders</h3>
              <p className="text-xs text-emerald-600 font-bold mt-1">↑ 100% Customer Satisfaction</p>
            </Card>

            <Card className="bg-white border border-[#EFE6DD] rounded-3xl p-5 shadow-xs">
              <p className="text-xs font-semibold text-[#6C5C54]">Average Payout / Order</p>
              <h3 className="text-2xl font-bold text-[#3A2B24] mt-1">₹70.83</h3>
              <p className="text-xs text-[#6C5C54] mt-1">Base Delivery Fee + Tips</p>
            </Card>
          </div>

          {/* Card 1: Recent Withdrawal History Log */}
          <Card className="border border-[#EFE6DD] bg-white rounded-3xl shadow-xs overflow-hidden">
            <CardHeader className="bg-[#FFF8F2] border-b border-[#EFE6DD] p-5 flex flex-row items-center justify-between">
              <div>
                <CardTitle className="font-serif-brand text-lg font-bold text-[#3A2B24]">Recent Withdrawal History</CardTitle>
                <p className="text-xs text-[#6C5C54] mt-0.5">Records of all payout transfers sent to your UPI Bank Account</p>
              </div>
              <Badge className="bg-emerald-100 text-emerald-800 border-none font-bold text-[10px] px-2.5 py-1 rounded-full">
                {withdrawalLogs.length} Records
              </Badge>
            </CardHeader>
            <CardContent className="p-5">
              {withdrawalLogs.length === 0 ? (
                <p className="text-xs text-[#6C5C54] italic text-center py-4">No withdrawal records found yet.</p>
              ) : (
                <div className="space-y-3 text-xs">
                  {withdrawalLogs.map((log) => (
                    <div key={log.id} className="p-4 bg-white border border-[#EFE6DD] rounded-2xl flex items-center justify-between hover:bg-[#FFF8F2]/40 transition-colors">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <p className="font-bold text-sm text-[#3A2B24]">{log.id}</p>
                          <span className="text-[10px] font-bold bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full border border-emerald-200">
                            ✓ {log.status}
                          </span>
                        </div>
                        <p className="text-xs text-[#6C5C54]">
                          {log.date} • Sent to <strong className="text-[#3A2B24]">{log.upiId}</strong>
                        </p>
                        <p className="text-[10px] text-[#6C5C54]">
                          Remaining Balance after transfer: <strong className="text-[#3A2B24]">₹{log.remainingBalance.toFixed(2)}</strong>
                        </p>
                      </div>
                      <div className="text-right">
                        <span className="font-black text-lg text-rose-600">- ₹{log.amount.toFixed(2)}</span>
                        <p className="text-[10px] font-bold text-emerald-700 mt-0.5">UPI Settled</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="border border-[#EFE6DD] bg-white rounded-3xl shadow-xs overflow-hidden">
            <CardHeader className="bg-[#FFF8F2] border-b border-[#EFE6DD] p-5">
              <CardTitle className="font-serif-brand text-lg font-bold text-[#3A2B24]">Recent Delivery Payout Log</CardTitle>
            </CardHeader>
            <CardContent className="p-5">
              <div className="space-y-3 text-xs">
                {[
                  { id: "ORD-94646187", time: "Today, 04:15 PM", amount: "₹85.00", dist: "3.2 km", area: "Powai, Mumbai" },
                  { id: "ORD-59709430", time: "Today, 02:30 PM", amount: "₹65.00", dist: "2.1 km", area: "Hiranandani Gardens" },
                  { id: "ORD-10928471", time: "Today, 11:45 AM", amount: "₹95.00", dist: "4.8 km", area: "Chandivali, Mumbai" },
                ].map((trip) => (
                  <div key={trip.id} className="p-4 bg-white border border-[#EFE6DD] rounded-2xl flex items-center justify-between hover:bg-[#FFF8F2]/40 transition-colors">
                    <div>
                      <p className="font-bold text-sm text-[#3A2B24]">{trip.id}</p>
                      <p className="text-xs text-[#6C5C54] mt-0.5">{trip.time} • {trip.dist} • {trip.area}</p>
                    </div>
                    <span className="font-extrabold text-base text-emerald-600">{trip.amount}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

      </div>

      {/* Interactive Withdrawal Amount Prompt Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-[#EFE6DD] space-y-5 animate-in zoom-in-95">
            <div className="flex justify-between items-center border-b border-[#EFE6DD] pb-3">
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-full bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold">
                  ₹
                </div>
                <h3 className="font-serif-brand font-bold text-lg text-[#3A2B24]">Withdraw Funds to UPI</h3>
              </div>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="h-8 w-8 rounded-full hover:bg-slate-100 flex items-center justify-center text-slate-500 cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Current Balance Notice */}
            <div className="p-4 bg-[#FFF8F2] border border-[#EFE6DD] rounded-2xl flex items-center justify-between">
              <div>
                <p className="text-[11px] font-semibold text-[#6C5C54] uppercase tracking-wider">Total Available Balance</p>
                <p className="text-2xl font-black text-[#3A2B24]">₹{totalEarnings.toFixed(2)}</p>
              </div>
              <Badge className="bg-emerald-100 text-emerald-800 border-none font-bold text-[10px] px-2.5 py-1 rounded-full">
                Instant UPI
              </Badge>
            </div>

            {/* Amount Input */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-[#3A2B24]">Enter Amount to Withdraw (₹)</label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 font-bold text-[#3A2B24] text-lg">₹</span>
                <input 
                  type="number"
                  min="1"
                  max={totalEarnings}
                  value={withdrawInput}
                  onChange={(e) => setWithdrawInput(e.target.value)}
                  placeholder="Enter amount"
                  className="w-full h-12 pl-9 pr-4 rounded-xl border border-[#EFE6DD] bg-white font-black text-xl text-[#3A2B24] focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>

            {/* Quick Selection Chips */}
            <div className="space-y-1.5">
              <p className="text-[11px] font-semibold text-[#6C5C54]">Quick Amount Selection:</p>
              <div className="flex flex-wrap gap-2">
                {[100, 500, 1000].map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    disabled={preset > totalEarnings}
                    onClick={() => setWithdrawInput(String(preset))}
                    className="px-3.5 py-1.5 rounded-full text-xs font-bold border border-[#EFE6DD] bg-slate-50 hover:bg-emerald-50 hover:border-emerald-300 hover:text-emerald-700 disabled:opacity-40 transition-colors cursor-pointer"
                  >
                    ₹{preset}
                  </button>
                ))}
                <button
                  type="button"
                  onClick={() => setWithdrawInput(String(totalEarnings.toFixed(0)))}
                  className="px-3.5 py-1.5 rounded-full text-xs font-bold border border-emerald-300 bg-emerald-50 text-emerald-800 hover:bg-emerald-100 transition-colors cursor-pointer"
                >
                  Full Balance (₹{totalEarnings.toFixed(0)})
                </button>
              </div>
            </div>

            {/* Calculation Preview */}
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs flex items-center justify-between text-slate-700">
              <span>Remaining Balance After Payout:</span>
              <strong className="font-bold text-[#3A2B24] text-sm">₹{calculatedRemaining.toFixed(2)}</strong>
            </div>

            {/* Error Banner */}
            {withdrawError && (
              <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold rounded-xl flex items-center gap-2">
                <AlertCircle className="h-4 w-4 flex-shrink-0" />
                <span>{withdrawError}</span>
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-3 pt-2">
              <Button 
                variant="outline"
                onClick={() => setIsModalOpen(false)}
                className="flex-1 h-11 rounded-xl border-[#EFE6DD] font-bold text-xs cursor-pointer"
              >
                Cancel
              </Button>
              <Button 
                onClick={handleConfirmWithdrawal}
                className="flex-[2] h-11 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md cursor-pointer flex items-center justify-center gap-1.5"
              >
                <CheckCircle2 className="h-4 w-4" /> Confirm & Withdraw ₹{numInputVal > 0 ? numInputVal.toFixed(0) : "0"}
              </Button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
