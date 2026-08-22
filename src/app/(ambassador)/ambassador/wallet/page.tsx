"use client";

import { useState, useEffect } from "react";
import { Wallet, ArrowDownRight, ArrowUpRight, CheckCircle2, Clock, CreditCard, Building, Check, AlertCircle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";

export default function AmbassadorWalletPage() {
  const [loading, setLoading] = useState(true);
  const [isPayoutModalOpen, setIsPayoutModalOpen] = useState(false);
  const [payoutAmount, setPayoutAmount] = useState("");
  const [upiIdInput, setUpiIdInput] = useState("");
  const [accountNumberInput, setAccountNumberInput] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [payoutError, setPayoutError] = useState("");
  const [payoutSuccess, setPayoutSuccess] = useState("");

  const [walletData, setWalletData] = useState<{
    wallet: {
      availableBalance: number;
      pendingBalance: number;
      totalEarned: number;
      totalPaid: number;
      upiId: string;
      accountNumber: string;
      hasPendingPayout: boolean;
    };
    payouts: Array<{
      id: string;
      amount: number;
      status: string;
      paymentMethod: string;
      upiId?: string;
      accountNumber?: string;
      requestedAt: string;
      processedAt?: string;
      transactionRef?: string;
    }>;
    transactions: Array<{
      id: string;
      date: string;
      type: string;
      amount: string;
      status: string;
      isCredit: boolean;
    }>;
  }>({
    wallet: {
      availableBalance: 0,
      pendingBalance: 0,
      totalEarned: 0,
      totalPaid: 0,
      upiId: "",
      accountNumber: "",
      hasPendingPayout: false,
    },
    payouts: [],
    transactions: [],
  });

  const fetchWallet = async () => {
    try {
      setLoading(true);
      const token = typeof window !== "undefined" ? localStorage.getItem("pixello_ambassador_token") : null;
      const headers: Record<string, string> = {};
      if (token) headers["Authorization"] = `Bearer ${token}`;

      const res = await fetch("/api/ambassador/wallet", { headers });
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          setWalletData(data);
          setUpiIdInput(data.wallet.upiId || "");
          setAccountNumberInput(data.wallet.accountNumber || "");
        }
      }
    } catch (e) {
      console.error("Wallet fetch error:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWallet();

    const handleSync = () => fetchWallet();
    window.addEventListener("pixello_payout_requested", handleSync);
    window.addEventListener("pixello_orders_updated", handleSync);
    return () => {
      window.removeEventListener("pixello_payout_requested", handleSync);
      window.removeEventListener("pixello_orders_updated", handleSync);
    };
  }, []);

  const handleOpenPayoutModal = () => {
    setPayoutError("");
    setPayoutSuccess("");
    setPayoutAmount(String(walletData.wallet.availableBalance));
    setIsPayoutModalOpen(true);
  };

  const handleConfirmPayout = async () => {
    const amt = Number(payoutAmount);
    if (!amt || amt < 500) {
      setPayoutError("Minimum payout request amount is ₹500.");
      return;
    }
    if (amt > walletData.wallet.availableBalance) {
      setPayoutError(`Amount exceeds your available balance of ₹${walletData.wallet.availableBalance}.`);
      return;
    }
    if (!upiIdInput.trim() && !accountNumberInput.trim()) {
      setPayoutError("Please enter your UPI ID or Bank Account Number.");
      return;
    }

    try {
      setIsSubmitting(true);
      setPayoutError("");
      const token = typeof window !== "undefined" ? localStorage.getItem("pixello_ambassador_token") : null;
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (token) headers["Authorization"] = `Bearer ${token}`;

      const res = await fetch("/api/ambassador/payouts", {
        method: "POST",
        headers,
        body: JSON.stringify({
          amount: amt,
          upiId: upiIdInput.trim(),
          accountNumber: accountNumberInput.trim(),
          paymentMethod: upiIdInput.trim() ? "UPI" : "BANK_TRANSFER",
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        setPayoutError(data.error || "Failed to submit payout request.");
        return;
      }

      setPayoutSuccess(data.message || "Payout request submitted successfully!");
      setTimeout(() => {
        setIsPayoutModalOpen(false);
        fetchWallet();
        window.dispatchEvent(new Event("pixello_payout_requested"));
      }, 1500);
    } catch (err: any) {
      setPayoutError(err.message || "An unexpected error occurred.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col gap-6 bg-[#F8F3EE] p-6 rounded-3xl min-h-screen">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="font-serif-brand text-3xl font-bold text-[#3A2B24]">Wallet & Payouts</h2>
          <p className="text-xs text-[#6C5C54] mt-1">Manage your ambassador commissions, cash balances, and payout requests.</p>
        </div>
        <div className="flex items-center gap-3">
          <Button 
            onClick={fetchWallet}
            variant="outline" 
            size="sm"
            className="rounded-xl border-[#EFE6DD] text-xs font-bold text-[#3A2B24] hover:bg-white flex items-center gap-1.5"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
          <Button
            onClick={handleOpenPayoutModal}
            disabled={walletData.wallet.availableBalance < 500 || walletData.wallet.hasPendingPayout}
            className="btn-pixello-primary px-6 h-11 rounded-full text-xs font-bold shadow-sm flex items-center gap-2"
          >
            <Wallet className="h-4 w-4" />
            {walletData.wallet.hasPendingPayout ? "Payout Under Review" : "Request Payout →"}
          </Button>
        </div>
      </div>

      {/* 4 Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <Card className="border border-[#EFE6DD] bg-white rounded-3xl shadow-xs">
          <CardContent className="p-5">
            <div className="flex justify-between items-start mb-3">
              <span className="text-xs font-bold text-[#6C5C54] uppercase tracking-wider">Available Balance</span>
              <div className="h-8 w-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <Wallet className="h-4 w-4" />
              </div>
            </div>
            <p className="text-3xl font-extrabold text-[#3A2B24]">₹{walletData.wallet.availableBalance.toLocaleString("en-IN")}</p>
            <p className="text-[11px] text-emerald-600 font-bold mt-1">Ready for withdrawal</p>
          </CardContent>
        </Card>

        <Card className="border border-[#EFE6DD] bg-white rounded-3xl shadow-xs">
          <CardContent className="p-5">
            <div className="flex justify-between items-start mb-3">
              <span className="text-xs font-bold text-[#6C5C54] uppercase tracking-wider">Pending Hold</span>
              <div className="h-8 w-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                <Clock className="h-4 w-4" />
              </div>
            </div>
            <p className="text-3xl font-extrabold text-amber-600">₹{walletData.wallet.pendingBalance.toLocaleString("en-IN")}</p>
            <p className="text-[11px] text-[#6C5C54] font-medium mt-1">Unsettled orders</p>
          </CardContent>
        </Card>

        <Card className="border border-[#EFE6DD] bg-white rounded-3xl shadow-xs">
          <CardContent className="p-5">
            <div className="flex justify-between items-start mb-3">
              <span className="text-xs font-bold text-[#6C5C54] uppercase tracking-wider">Total Earned</span>
              <div className="h-8 w-8 rounded-xl bg-[#FFF8F2] text-[#D89A86] flex items-center justify-center">
                <ArrowUpRight className="h-4 w-4" />
              </div>
            </div>
            <p className="text-3xl font-extrabold text-[#3A2B24]">₹{walletData.wallet.totalEarned.toLocaleString("en-IN")}</p>
            <p className="text-[11px] text-[#6C5C54] font-medium mt-1">Lifetime commissions</p>
          </CardContent>
        </Card>

        <Card className="border border-[#EFE6DD] bg-white rounded-3xl shadow-xs">
          <CardContent className="p-5">
            <div className="flex justify-between items-start mb-3">
              <span className="text-xs font-bold text-[#6C5C54] uppercase tracking-wider">Total Settled</span>
              <div className="h-8 w-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <CheckCircle2 className="h-4 w-4" />
              </div>
            </div>
            <p className="text-3xl font-extrabold text-[#3A2B24]">₹{walletData.wallet.totalPaid.toLocaleString("en-IN")}</p>
            <p className="text-[11px] text-[#6C5C54] font-medium mt-1">Transferred to bank</p>
          </CardContent>
        </Card>
      </div>

      {/* Payout History Table */}
      {walletData.payouts.length > 0 && (
        <Card className="border border-[#EFE6DD] shadow-sm bg-white rounded-3xl overflow-hidden">
          <CardHeader className="p-6 border-b border-[#EFE6DD]">
            <CardTitle className="font-serif-brand text-lg font-bold text-[#3A2B24]">Payout Requests & Settlements</CardTitle>
            <CardDescription className="text-xs text-[#6C5C54] mt-1">History of your payout requests and administrative bank transfers.</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#FFF8F2] text-[#6C5C54] font-semibold border-b border-[#EFE6DD]">
                  <tr>
                    <th className="p-4 pl-6">Payout ID</th>
                    <th className="p-4">Amount</th>
                    <th className="p-4">Method & Account</th>
                    <th className="p-4">Status</th>
                    <th className="p-4">Transaction Ref</th>
                    <th className="p-4 pr-6 text-right">Requested Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#EFE6DD]">
                  {walletData.payouts.map((p) => (
                    <tr key={p.id} className="hover:bg-[#FFF8F2]/50 transition-colors">
                      <td className="p-4 pl-6 font-mono font-bold text-[#3A2B24]">{p.id}</td>
                      <td className="p-4 font-bold text-base text-[#3A2B24]">₹{p.amount.toLocaleString("en-IN")}</td>
                      <td className="p-4 text-[#6C5C54]">
                        <span className="font-bold text-[#3A2B24]">{p.paymentMethod}: </span>
                        {p.upiId || p.accountNumber || "Direct Transfer"}
                      </td>
                      <td className="p-4">
                        <Badge 
                          className={
                            p.status === "SETTLED" || p.status === "APPROVED"
                              ? "bg-emerald-100 text-emerald-800 border-emerald-200"
                              : p.status === "REJECTED"
                              ? "bg-rose-100 text-rose-800 border-rose-200"
                              : "bg-amber-100 text-amber-800 border-amber-200"
                          }
                        >
                          {p.status}
                        </Badge>
                      </td>
                      <td className="p-4 font-mono text-[#6C5C54]">{p.transactionRef || "Processing..."}</td>
                      <td className="p-4 pr-6 text-right text-[#6C5C54] font-medium">
                        {new Date(p.requestedAt).toLocaleDateString("en-IN", { month: "short", day: "numeric", year: "numeric" })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Unified Transactions Ledger */}
      <Card className="border border-[#EFE6DD] shadow-sm bg-white rounded-3xl overflow-hidden">
        <CardHeader className="p-6 border-b border-[#EFE6DD]">
          <CardTitle className="font-serif-brand text-lg font-bold text-[#3A2B24]">Activity & Commission Ledger</CardTitle>
          <CardDescription className="text-xs text-[#6C5C54] mt-1">Detailed history of incoming referral credits and outgoing payouts.</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {walletData.transactions.length === 0 ? (
            <div className="p-12 text-center text-[#6C5C54]">
              <Wallet className="h-10 w-10 text-[#D89A86]/50 mx-auto mb-3" />
              <p className="font-bold text-sm text-[#3A2B24]">No transaction records found</p>
              <p className="text-xs mt-1">Transactions will be recorded here as orders and payouts occur.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#FFF8F2] text-[#6C5C54] font-semibold border-b border-[#EFE6DD]">
                  <tr>
                    <th className="p-4 pl-6">Reference ID</th>
                    <th className="p-4">Transaction Details</th>
                    <th className="p-4">Amount</th>
                    <th className="p-4">Status</th>
                    <th className="p-4 pr-6 text-right">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#EFE6DD]">
                  {walletData.transactions.map((txn, idx) => (
                    <tr key={`${txn.id}-${idx}`} className="hover:bg-[#FFF8F2]/50 transition-colors">
                      <td className="p-4 pl-6 font-mono font-bold text-[#3A2B24]">{txn.id}</td>
                      <td className="p-4 font-medium text-[#3A2B24] flex items-center gap-2">
                        {txn.isCredit ? (
                          <div className="h-6 w-6 rounded-md bg-emerald-50 text-emerald-600 flex items-center justify-center flex-shrink-0">
                            <ArrowDownRight className="h-3.5 w-3.5" />
                          </div>
                        ) : (
                          <div className="h-6 w-6 rounded-md bg-rose-50 text-rose-600 flex items-center justify-center flex-shrink-0">
                            <ArrowUpRight className="h-3.5 w-3.5" />
                          </div>
                        )}
                        <span>{txn.type}</span>
                      </td>
                      <td className={`p-4 font-bold ${txn.isCredit ? "text-emerald-600" : "text-rose-600"}`}>
                        {txn.amount}
                      </td>
                      <td className="p-4">
                        <Badge 
                          className={
                            txn.status === "COMPLETED"
                              ? "bg-emerald-100 text-emerald-800 border-emerald-200"
                              : txn.status === "CANCELLED" || txn.status === "REJECTED"
                              ? "bg-rose-100 text-rose-800 border-rose-200"
                              : "bg-amber-100 text-amber-800 border-amber-200"
                          }
                        >
                          {txn.status}
                        </Badge>
                      </td>
                      <td className="p-4 pr-6 text-right text-[#6C5C54] font-medium">{txn.date}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Request Payout Dialog */}
      <Dialog open={isPayoutModalOpen} onOpenChange={setIsPayoutModalOpen}>
        <DialogContent className="sm:max-w-md bg-white rounded-3xl p-6 border border-[#EFE6DD]">
          <DialogHeader>
            <DialogTitle className="font-serif-brand text-xl font-bold text-[#3A2B24] flex items-center gap-2">
              <Wallet className="h-5 w-5 text-[#D89A86]" /> Request Commission Payout
            </DialogTitle>
            <DialogDescription className="text-xs text-[#6C5C54]">
              Available withdrawable balance: <strong className="text-emerald-600 font-bold">₹{walletData.wallet.availableBalance.toLocaleString("en-IN")}</strong>
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-col gap-4 py-4">
            {payoutError && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs flex items-center gap-2">
                <AlertCircle className="h-4 w-4 flex-shrink-0" />
                <span>{payoutError}</span>
              </div>
            )}
            {payoutSuccess && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-700 text-xs flex items-center gap-2">
                <Check className="h-4 w-4 flex-shrink-0" />
                <span>{payoutSuccess}</span>
              </div>
            )}

            <div>
              <label className="text-xs font-bold text-[#3A2B24] block mb-1.5">Withdrawal Amount (₹)</label>
              <Input
                type="number"
                min="500"
                max={walletData.wallet.availableBalance}
                value={payoutAmount}
                onChange={(e) => setPayoutAmount(e.target.value)}
                placeholder="Enter amount (min ₹500)"
                className="bg-[#F8F3EE] border-[#EFE6DD] text-[#3A2B24] font-bold text-base h-11 rounded-xl"
              />
              <span className="text-[10px] text-[#6C5C54] mt-1 block">Minimum payout is ₹500. Maximum is your available balance.</span>
            </div>

            <div>
              <label className="text-xs font-bold text-[#3A2B24] block mb-1.5">UPI ID (e.g. mobile@okhdfcbank)</label>
              <Input
                type="text"
                value={upiIdInput}
                onChange={(e) => setUpiIdInput(e.target.value)}
                placeholder="e.g. yourname@upi"
                className="bg-[#F8F3EE] border-[#EFE6DD] text-xs h-10 rounded-xl"
              />
            </div>

            <div className="text-center text-xs text-[#6C5C54] font-bold uppercase tracking-wider">— OR —</div>

            <div>
              <label className="text-xs font-bold text-[#3A2B24] block mb-1.5">Bank Account & IFSC</label>
              <Input
                type="text"
                value={accountNumberInput}
                onChange={(e) => setAccountNumberInput(e.target.value)}
                placeholder="Account No + Bank Name (e.g. 50100482910482 HDFC)"
                className="bg-[#F8F3EE] border-[#EFE6DD] text-xs h-10 rounded-xl"
              />
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsPayoutModalOpen(false)}
              className="rounded-xl border-[#EFE6DD] text-xs"
            >
              Cancel
            </Button>
            <Button
              type="button"
              disabled={isSubmitting}
              onClick={handleConfirmPayout}
              className="btn-pixello-primary rounded-xl text-xs font-bold"
            >
              {isSubmitting ? "Submitting..." : "Submit Payout Request"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
