"use client";

import { useState, useEffect } from "react";
import { 
  Search, 
  Mail, 
  Phone, 
  RefreshCw, 
  Download, 
  CheckCircle2, 
  ChevronDown, 
  X, 
  Trash2, 
  Lock, 
  KeyRound, 
  Eye, 
  EyeOff, 
  AlertTriangle, 
  Loader2, 
  ShieldAlert 
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useOrders } from "@/context/OrderContext";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { sharedSSE } from "@/lib/sseClient";

export interface CustomerRecord {
  id: string;
  name: string;
  email: string;
  phone: string;
  orders: number;
  totalSpent: number;
  status: "Active" | "Inactive";
}

export default function AdminCustomersPage() {
  const { orders } = useOrders();
  const [searchQuery, setSearchQuery] = useState("");
  const [customers, setCustomers] = useState<CustomerRecord[]>([]);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // 2FA Customer Deletion Modal States
  const [deleteTarget, setDeleteTarget] = useState<CustomerRecord | null>(null);
  const [deletePassword, setDeletePassword] = useState("");
  const [deletePin, setDeletePin] = useState("");
  const [showDeletePassword, setShowDeletePassword] = useState(false);
  const [showDeletePin, setShowDeletePin] = useState(false);
  const [isDeletingCustomer, setIsDeletingCustomer] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Dynamically aggregate real registered customer profiles from Customer Portal & Orders Context
  useEffect(() => {
    const syncCustomers = async () => {
      const customerMap: Record<string, CustomerRecord> = {};
      let idCounter = 1001;

      // Load local overrides
      let statusOverrides: Record<string, "Active" | "Inactive"> = {};
      if (typeof window !== "undefined") {
        try {
          const saved = localStorage.getItem("pixello_customer_status_overrides");
          if (saved) statusOverrides = JSON.parse(saved);
        } catch (e) {}
      }

      // 1. Fetch from Database API
      try {
        const res = await fetch("/api/customers");
        const data = await res.json();
        if (data.success && Array.isArray(data.customers)) {
          data.customers.forEach((c: any) => {
            const cleanMob = (c.mobile || c.phone || "").replace(/\D/g, "").slice(-10);
            if (cleanMob) {
              const currentStatus = statusOverrides[cleanMob] || statusOverrides[c.id] || c.status || "Active";
              customerMap[cleanMob] = {
                id: c.id ? `CUST-${c.id.slice(-4)}` : `CUST-${idCounter++}`,
                name: c.name || "Customer",
                email: c.email || `${cleanMob}@pixello.store`,
                phone: c.phone || `+91 ${cleanMob}`,
                orders: c.orderCount || 0,
                totalSpent: c.totalSpent || 0,
                status: currentStatus,
              };
            }
          });
        }
      } catch (err) {
        console.warn("Could not fetch customers from database:", err);
      }

      // 2. Scan registered customers list from localStorage fallback
      try {
        const registeredListStr = localStorage.getItem("pixello_registered_customers");
        if (registeredListStr) {
          const list = JSON.parse(registeredListStr);
          if (Array.isArray(list)) {
            list.forEach((c) => {
              const cleanMob = (c.mobile || c.phone || "").replace(/\D/g, "").slice(-10);
              if (cleanMob && !customerMap[cleanMob]) {
                const currentStatus = statusOverrides[cleanMob] || c.status || "Active";
                customerMap[cleanMob] = {
                  id: `CUST-${idCounter++}`,
                  name: c.name || "Customer",
                  email: c.email || `${cleanMob}@pixello.store`,
                  phone: c.phone || `+91 ${cleanMob}`,
                  orders: 0,
                  totalSpent: 0,
                  status: currentStatus,
                };
              }
            });
          }
        }
      } catch (e) {}

      // 3. Scan active logged in user from localStorage
      try {
        const activeUserStr = localStorage.getItem("pixello_user");
        if (activeUserStr) {
          const activeUser = JSON.parse(activeUserStr);
          const cleanMob = (activeUser.mobile || activeUser.phone || "").replace(/\D/g, "").slice(-10);
          if (cleanMob) {
            const currentStatus = statusOverrides[cleanMob] || "Active";
            if (!customerMap[cleanMob]) {
              customerMap[cleanMob] = {
                id: `CUST-${idCounter++}`,
                name: activeUser.name || "Customer",
                email: activeUser.email || `${cleanMob}@pixello.store`,
                phone: activeUser.phone || `+91 ${cleanMob}`,
                orders: 0,
                totalSpent: 0,
                status: currentStatus,
              };
            } else if (activeUser.name && activeUser.name !== "Customer") {
              customerMap[cleanMob].name = activeUser.name;
              if (activeUser.email) customerMap[cleanMob].email = activeUser.email;
              customerMap[cleanMob].status = currentStatus;
            }
          }
        }
      } catch (e) {}

      // 4. Enhance with dynamic orders from OrderContext
      const orderCountByPhone: Record<string, number> = {};
      const orderSpentByPhone: Record<string, number> = {};
      const orderNameByPhone: Record<string, string> = {};

      orders.forEach((o) => {
        const rawPhone = o.customerPhone || "";
        const cleanPhone = rawPhone.replace(/\D/g, "").slice(-10);
        if (cleanPhone) {
          orderCountByPhone[cleanPhone] = (orderCountByPhone[cleanPhone] || 0) + 1;
          orderSpentByPhone[cleanPhone] = (orderSpentByPhone[cleanPhone] || 0) + Number(o.totalAmount || 0);
          if (o.customerName && o.customerName !== "Customer") {
            orderNameByPhone[cleanPhone] = o.customerName;
          }
        }
      });

      Object.keys(orderCountByPhone).forEach((cleanPhone) => {
        const currentStatus = statusOverrides[cleanPhone] || "Active";
        const ctxCount = orderCountByPhone[cleanPhone];
        const ctxSpent = orderSpentByPhone[cleanPhone];
        const ctxName = orderNameByPhone[cleanPhone] || "Customer";

        if (!customerMap[cleanPhone]) {
          customerMap[cleanPhone] = {
            id: `CUST-${idCounter++}`,
            name: ctxName,
            email: `${cleanPhone}@pixello.store`,
            phone: `+91 ${cleanPhone}`,
            orders: ctxCount,
            totalSpent: ctxSpent,
            status: currentStatus,
          };
        } else {
          if (ctxCount > (customerMap[cleanPhone].orders || 0)) {
            customerMap[cleanPhone].orders = ctxCount;
            customerMap[cleanPhone].totalSpent = ctxSpent;
          }
          if (ctxName && ctxName !== "Customer") {
            customerMap[cleanPhone].name = ctxName;
          }
        }
      });

      const aggregated = Object.values(customerMap);
      if (aggregated.length > 0) {
        setCustomers(aggregated);
      }
    };

    syncCustomers();

    const unsubCust = sharedSSE.subscribe("customer_update", () => syncCustomers());
    const unsubOrder = sharedSSE.subscribe("order_update", () => syncCustomers());

    window.addEventListener("auth_change", syncCustomers);
    window.addEventListener("storage", syncCustomers);
    window.addEventListener("order_change", syncCustomers);

    return () => {
      unsubCust();
      unsubOrder();
      window.removeEventListener("auth_change", syncCustomers);
      window.removeEventListener("storage", syncCustomers);
      window.removeEventListener("order_change", syncCustomers);
    };
  }, [orders]);

  const updateCustomerStatus = async (id: string, name: string, newStatus: "Active" | "Inactive") => {
    // 1. Instant UI update
    setCustomers((prev) =>
      prev.map((c) => (c.id === id ? { ...c, status: newStatus } : c))
    );

    const targetCustomer = customers.find((c) => c.id === id);
    const cleanMob = (targetCustomer?.phone || "").replace(/\D/g, "").slice(-10);

    // 2. Persist to localStorage overrides
    if (typeof window !== "undefined") {
      try {
        const saved = localStorage.getItem("pixello_customer_status_overrides");
        const parsed = saved ? JSON.parse(saved) : {};
        if (cleanMob) parsed[cleanMob] = newStatus;
        if (id) parsed[id] = newStatus;
        localStorage.setItem("pixello_customer_status_overrides", JSON.stringify(parsed));

        // Update in registered customers list
        const regStr = localStorage.getItem("pixello_registered_customers");
        if (regStr) {
          const list = JSON.parse(regStr);
          if (Array.isArray(list)) {
            const updatedList = list.map((c) => {
              const cMob = (c.mobile || c.phone || "").replace(/\D/g, "").slice(-10);
              if (cMob === cleanMob) return { ...c, status: newStatus };
              return c;
            });
            localStorage.setItem("pixello_registered_customers", JSON.stringify(updatedList));
          }
        }

        // If currently logged in user is being marked Inactive, log them out immediately!
        const activeUserStr = localStorage.getItem("pixello_user");
        if (activeUserStr) {
          const activeUser = JSON.parse(activeUserStr);
          const activeMob = (activeUser.mobile || activeUser.phone || "").replace(/\D/g, "").slice(-10);
          if (activeMob === cleanMob && newStatus === "Inactive") {
            localStorage.removeItem("pixello_user");
            localStorage.setItem("pixello_logged_out", "true");
          }
        }

        window.dispatchEvent(new Event("auth_change"));
        window.dispatchEvent(new Event("storage"));
      } catch (e) {
        console.error(e);
      }
    }

    // 3. Persist to database via API
    try {
      await fetch("/api/customers", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, mobile: cleanMob, status: newStatus }),
      });
    } catch (err) {
      console.error("Failed to update status in backend:", err);
    }

    showToast(`Customer "${name}" status changed to ${newStatus}.`);
  };

  const handleExportCSV = () => {
    const rows = [
      ["Customer ID", "Name", "Email", "Phone", "Total Orders", "Total Spent (INR)", "Status"],
      ...customers.map((c) => [c.id, c.name, c.email, c.phone, c.orders, c.totalSpent.toFixed(2), c.status]),
    ];
    const csvContent = "data:text/csv;charset=utf-8," + rows.map((e) => e.map((val) => `"${val}"`).join(",")).join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Pixello_Customer_Directory_${new Date().toISOString().split("T")[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleConfirmDeleteCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!deleteTarget) return;

    setDeleteError(null);

    const cleanPass = deletePassword.trim();
    const cleanPin = deletePin.replace(/\D/g, "").slice(0, 4);

    if (!cleanPass) {
      setDeleteError("Please enter your Admin Login Password.");
      return;
    }

    if (cleanPin.length !== 4) {
      setDeleteError("Please enter your exact 4-Digit Security PIN.");
      return;
    }

    setIsDeletingCustomer(true);

    try {
      const res = await fetch("/api/customers", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: deleteTarget.id,
          phone: deleteTarget.phone,
          password: cleanPass,
          securityPin: cleanPin,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        setDeleteError(data.error || "Security authentication failed. Customer was not deleted.");
        setIsDeletingCustomer(false);
        return;
      }

      // Remove from state
      const targetPhoneClean = (deleteTarget.phone || "").replace(/\D/g, "").slice(-10);
      setCustomers((prev) => prev.filter((c) => c.id !== deleteTarget.id && (!targetPhoneClean || !c.phone.includes(targetPhoneClean))));

      // Clean local cache
      if (typeof window !== "undefined") {
        try {
          const regStr = localStorage.getItem("pixello_registered_customers");
          if (regStr) {
            const list = JSON.parse(regStr);
            if (Array.isArray(list)) {
              const updated = list.filter((c) => {
                const mob = (c.mobile || c.phone || "").replace(/\D/g, "").slice(-10);
                return mob !== targetPhoneClean && c.id !== deleteTarget.id;
              });
              localStorage.setItem("pixello_registered_customers", JSON.stringify(updated));
            }
          }

          const activeUserStr = localStorage.getItem("pixello_user");
          if (activeUserStr) {
            const activeUser = JSON.parse(activeUserStr);
            const activeMob = (activeUser.mobile || activeUser.phone || "").replace(/\D/g, "").slice(-10);
            if (activeMob === targetPhoneClean) {
              localStorage.removeItem("pixello_user");
              localStorage.setItem("pixello_logged_out", "true");
            }
          }

          window.dispatchEvent(new Event("auth_change"));
          window.dispatchEvent(new Event("storage"));
        } catch (e) {}
      }

      showToast(`✓ Customer "${deleteTarget.name}" permanently deleted from database.`);
      setDeleteTarget(null);
      setDeletePassword("");
      setDeletePin("");
      setDeleteError(null);
    } catch (err: any) {
      console.error("Delete customer error:", err);
      setDeleteError(err.message || "Network error. Could not delete customer.");
    } finally {
      setIsDeletingCustomer(false);
    }
  };

  const filteredCustomers = customers.filter((c) => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;
    return (
      c.name.toLowerCase().includes(q) ||
      c.email.toLowerCase().includes(q) ||
      c.phone.toLowerCase().includes(q) ||
      c.id.toLowerCase().includes(q) ||
      c.status.toLowerCase().includes(q)
    );
  });

  return (
    <div className="flex flex-col gap-6 p-6 bg-[#F8F3EE] min-h-screen relative">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-20 right-8 z-50 bg-[#3A2B24] text-white px-5 py-3 rounded-2xl shadow-xl border border-[#D89A86]/40 flex items-center gap-2.5 animate-in fade-in slide-in-from-top-4 duration-300">
          <CheckCircle2 className="h-5 w-5 text-[#D89A86]" />
          <span className="text-xs font-bold">{toastMessage}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="font-serif-brand text-3xl font-bold tracking-tight text-[#3A2B24]">Customer Management</h2>
          <p className="text-xs text-[#6C5C54] mt-1">Manage customer account statuses (Active / Inactive) live.</p>
        </div>
        <Button 
          onClick={handleExportCSV}
          className="btn-pixello-primary text-xs font-bold rounded-full px-5 h-11 shadow-xs flex items-center gap-2 cursor-pointer"
        >
          <Download className="h-4 w-4 text-white" /> Export CSV
        </Button>
      </div>

      <Card className="border border-[#EFE6DD] bg-white rounded-3xl shadow-xs overflow-hidden">
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <div>
              <h3 className="font-serif-brand text-xl font-bold text-[#3A2B24]">Registered Customers</h3>
              <p className="text-xs text-[#6C5C54] mt-0.5">{customers.length} Customer Accounts Recorded</p>
            </div>
            <div className="relative w-full sm:w-72">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#6C5C54]" />
              <Input 
                placeholder="Search by name, email or phone..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 pr-8 rounded-full border-[#EFE6DD] bg-[#FFF8F2] text-xs font-medium text-[#3A2B24] focus-visible:ring-[#D89A86]" 
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-[#6C5C54] hover:text-[#3A2B24] p-0.5"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          </div>

          <div className="overflow-hidden border border-[#EFE6DD] rounded-2xl">
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="text-[11px] font-bold text-[#6C5C54] uppercase tracking-wider bg-[#FFF8F2] border-b border-[#EFE6DD]">
                  <tr>
                    <th className="px-4 py-3.5">Customer</th>
                    <th className="px-4 py-3.5">Contact Info</th>
                    <th className="px-4 py-3.5">Total Orders</th>
                    <th className="px-4 py-3.5">Total Spent</th>
                    <th className="px-4 py-3.5">Account Status</th>
                    <th className="px-4 py-3.5 text-right">Quick Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#EFE6DD]">
                  {filteredCustomers.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="text-center py-10 text-xs text-[#6C5C54]">
                        {searchQuery ? `No customers found matching "${searchQuery}"` : "No registered customers found."}
                      </td>
                    </tr>
                  ) : (
                    filteredCustomers.map((customer) => (
                      <tr key={customer.id} className="hover:bg-[#FFF8F2]/50 transition-colors">
                        <td className="px-4 py-4">
                          <div className="flex items-center gap-3">
                            <Avatar className="h-9 w-9 border border-[#EFE6DD] bg-[#FFF8F2]">
                              <AvatarFallback className="font-bold text-[#D89A86] bg-[#FFF8F2]">
                                {customer.name.charAt(0).toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <div className="font-bold text-[#3A2B24]">{customer.name}</div>
                              <div className="text-xs text-[#6C5C54] font-medium">{customer.id}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-4">
                          <div className="text-xs text-[#3A2B24] font-semibold flex items-center gap-1.5">
                            <Mail className="h-3.5 w-3.5 text-[#D89A86]" /> {customer.email}
                          </div>
                          <div className="text-xs text-[#6C5C54] flex items-center gap-1.5 mt-0.5 font-medium">
                            <Phone className="h-3.5 w-3.5 text-[#6C5C54]" /> {customer.phone}
                          </div>
                        </td>
                        <td className="px-4 py-4 font-bold text-[#3A2B24]">{customer.orders} orders</td>
                        <td className="px-4 py-4 font-extrabold text-[#D89A86]">₹{customer.totalSpent.toLocaleString("en-IN", { maximumFractionDigits: 2 })}</td>
                        
                        {/* Interactive Status Badge Dropdown */}
                        <td className="px-4 py-4">
                          <DropdownMenu>
                            <DropdownMenuTrigger className="cursor-pointer group flex items-center gap-1 focus:outline-none bg-transparent border-none p-0">
                              <Badge 
                                className={
                                  customer.status === "Active" 
                                    ? "bg-emerald-100 text-emerald-800 border-emerald-200 text-xs px-3 py-1 rounded-full font-bold shadow-2xs"
                                    : "bg-rose-100 text-rose-800 border-rose-200 text-xs px-3 py-1 rounded-full font-bold shadow-2xs"
                                }
                              >
                                {customer.status}
                              </Badge>
                              <ChevronDown className="h-3 w-3 text-[#6C5C54] opacity-50 group-hover:opacity-100 transition-opacity" />
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="start" className="w-48 rounded-2xl border-[#EFE6DD] p-2 shadow-xl bg-white">
                              <div className="px-3 py-1.5 text-xs font-bold text-[#3A2B24] border-b border-[#EFE6DD]">
                                Set Customer Status
                              </div>
                              <div className="py-1 flex flex-col gap-1">
                                <DropdownMenuItem
                                  onClick={() => updateCustomerStatus(customer.id, customer.name, "Active")}
                                  className={`flex items-center gap-2 p-2 rounded-xl cursor-pointer ${
                                    customer.status === "Active" ? "bg-[#FFF8F2] font-bold text-emerald-700" : "hover:bg-slate-50 text-[#3A2B24]"
                                  }`}
                                >
                                  <span className="h-2.5 w-2.5 rounded-full bg-emerald-500 flex-shrink-0" />
                                  <span className="text-xs">Active</span>
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => updateCustomerStatus(customer.id, customer.name, "Inactive")}
                                  className={`flex items-center gap-2 p-2 rounded-xl cursor-pointer ${
                                    customer.status === "Inactive" ? "bg-rose-50 font-bold text-rose-700" : "hover:bg-slate-50 text-[#3A2B24]"
                                  }`}
                                >
                                  <span className="h-2.5 w-2.5 rounded-full bg-rose-600 flex-shrink-0" />
                                  <span className="text-xs">Inactive</span>
                                </DropdownMenuItem>
                              </div>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </td>

                        {/* Quick Actions (Status Toggle & 2FA Delete) */}
                        <td className="px-4 py-4 text-right whitespace-nowrap">
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() =>
                                updateCustomerStatus(
                                  customer.id,
                                  customer.name,
                                  customer.status === "Active" ? "Inactive" : "Active"
                                )
                              }
                              className={`rounded-full text-xs font-bold px-3.5 h-8 border flex items-center gap-1.5 cursor-pointer shadow-2xs ${
                                customer.status === "Active"
                                  ? "border-rose-200 text-rose-700 bg-white hover:bg-rose-50"
                                  : "border-emerald-200 text-emerald-700 bg-emerald-50 hover:bg-emerald-100"
                              }`}
                            >
                              <RefreshCw className="h-3 w-3 text-[#D89A86]" /> Make {customer.status === "Active" ? "Inactive" : "Active"}
                            </Button>

                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setDeleteTarget(customer);
                                setDeletePassword("");
                                setDeletePin("");
                                setDeleteError(null);
                              }}
                              className="rounded-full text-xs font-bold px-3 h-8 border border-rose-300 text-rose-700 bg-rose-50/70 hover:bg-rose-100 flex items-center gap-1 cursor-pointer transition-colors"
                              title="Delete Customer from Database"
                            >
                              <Trash2 className="h-3.5 w-3.5 text-rose-600" /> Delete
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ========================================================================= */}
      {/* 🔐 2-FACTOR AUTHENTICATION CUSTOMER DELETION MODAL */}
      {/* ========================================================================= */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl border border-[#EFE6DD] shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="p-6 pb-4 border-b border-[#EFE6DD] flex items-center justify-between bg-rose-50/50">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-2xl bg-rose-100 border border-rose-200 flex items-center justify-center text-rose-600">
                  <ShieldAlert className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-serif-brand text-lg font-bold text-rose-950">
                    Delete Customer from Database
                  </h3>
                  <p className="text-xs text-rose-800/80 mt-0.5">2-Factor Authentication Security Verification</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setDeleteTarget(null)}
                className="p-1.5 rounded-xl text-[#6C5C54] hover:bg-white/80 cursor-pointer transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Modal Body Form */}
            <form onSubmit={handleConfirmDeleteCustomer} className="p-6 flex flex-col gap-4">
              <div className="p-3.5 bg-rose-50 border border-rose-200/80 rounded-2xl text-xs text-rose-950 flex flex-col gap-1.5">
                <div className="font-bold flex items-center gap-1.5 text-rose-900">
                  <AlertTriangle className="h-4 w-4 text-rose-600 flex-shrink-0" /> Permanent Database Deletion
                </div>
                <p className="text-[11px] leading-relaxed text-rose-900/90">
                  You are about to permanently delete <strong>{deleteTarget.name}</strong> ({deleteTarget.phone}) from the database. All saved addresses, cart items, customer portal logins, and data will be removed.
                </p>
              </div>

              {deleteError && (
                <div className="p-3 bg-red-100 border border-red-300 rounded-2xl text-xs font-bold text-red-900 flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-red-600 flex-shrink-0" />
                  <span>{deleteError}</span>
                </div>
              )}

              {/* 1. Admin Login Password */}
              <div>
                <label className="text-xs font-bold text-[#3A2B24] mb-1.5 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <Lock className="h-3.5 w-3.5 text-[#D89A86]" /> Admin Login Password *
                  </span>
                  <span className="text-[10px] text-[#6C5C54] font-medium">Factor 1 of 2</span>
                </label>
                <div className="relative flex items-center">
                  <Input
                    type={showDeletePassword ? "text" : "password"}
                    value={deletePassword}
                    onChange={(e) => {
                      setDeletePassword(e.target.value);
                      if (deleteError) setDeleteError(null);
                    }}
                    placeholder="Enter your login password"
                    className="rounded-xl border-[#EFE6DD] text-xs font-bold text-[#3A2B24] bg-[#FFF8F2]/40 h-11 pr-11 focus-visible:ring-rose-500"
                    required
                    autoFocus
                  />
                  <button
                    type="button"
                    onClick={() => setShowDeletePassword(!showDeletePassword)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-[#6C5C54] hover:text-[#3A2B24] cursor-pointer"
                  >
                    {showDeletePassword ? <EyeOff className="h-4 w-4 text-[#D89A86]" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              {/* 2. 4-Digit Security PIN */}
              <div>
                <label className="text-xs font-bold text-[#3A2B24] mb-1.5 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <KeyRound className="h-3.5 w-3.5 text-[#D89A86]" /> 4-Digit Security PIN *
                  </span>
                  <span className="text-[10px] text-[#6C5C54] font-medium">Factor 2 (Security Key)</span>
                </label>
                <div className="relative flex items-center">
                  <Input
                    type={showDeletePin ? "text" : "password"}
                    maxLength={4}
                    value={deletePin}
                    onChange={(e) => {
                      const val = e.target.value.replace(/\D/g, "").slice(0, 4);
                      setDeletePin(val);
                      if (deleteError) setDeleteError(null);
                    }}
                    placeholder="• • • •"
                    className="rounded-xl border-[#EFE6DD] text-center font-mono font-bold tracking-widest text-sm text-[#3A2B24] bg-[#FFF8F2]/40 h-11 pr-11 focus-visible:ring-rose-500"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowDeletePin(!showDeletePin)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-[#6C5C54] hover:text-[#3A2B24] cursor-pointer"
                  >
                    {showDeletePin ? <EyeOff className="h-4 w-4 text-[#D89A86]" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                <p className="text-[10px] text-[#6C5C54] mt-1 italic">
                  💡 Default PIN is 1234 (can be configured in Settings &gt; Admin Credentials &amp; PIN).
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-[#EFE6DD]">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setDeleteTarget(null)}
                  disabled={isDeletingCustomer}
                  className="rounded-xl text-xs font-bold h-10 px-4 border-[#EFE6DD] text-[#6C5C54] hover:bg-[#FFF8F2] cursor-pointer"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isDeletingCustomer || !deletePassword || deletePin.length !== 4}
                  className="rounded-xl text-xs font-bold h-10 px-5 bg-rose-600 hover:bg-rose-700 text-white flex items-center gap-1.5 cursor-pointer shadow-md disabled:opacity-50"
                >
                  {isDeletingCustomer ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin text-white" /> Deleting...
                    </>
                  ) : (
                    <>
                      <Trash2 className="h-4 w-4 text-white" /> Permanently Delete Customer
                    </>
                  )}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
