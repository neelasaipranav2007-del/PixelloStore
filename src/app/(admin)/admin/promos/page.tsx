"use client";

import { useState, useEffect } from "react";
import { Plus, Search, Edit, Trash2, X, CheckCircle2, Ticket, Percent, IndianRupee, Sparkles, Tag, ShieldCheck, Power, AlertCircle, Users, AlertTriangle, Check, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { sharedSSE } from "@/lib/sseClient";
import {
  getWelcomePromoConfig,
  saveWelcomePromoConfig,
  WelcomePromoBannerConfig,
  DEFAULT_WELCOME_PROMO_CONFIG,
} from "@/lib/spotlightConfig";

export interface PromoCodeItem {
  id: string;
  code: string;
  type: "percentage" | "flat";
  value: number; // e.g. 20 for 20% or 100 for ₹100
  minOrder: number;
  maxCustomerLimit?: number | null; // Limit on number of customers/uses allowed (e.g. 50, 100, 200)
  category: string;
  status: "Active" | "Inactive";
  usageCount: number;
  description: string;
  createdBy: string;
}

const DEFAULT_INITIAL_PROMOS: PromoCodeItem[] = [
  {
    id: "PRM-101",
    code: "PIXELLO20",
    type: "percentage",
    value: 20,
    minOrder: 0,
    maxCustomerLimit: 200,
    category: "All Categories",
    status: "Active",
    usageCount: 142,
    description: "Official Store Launch Offer • 20% OFF on Total Order Amount",
    createdBy: "Admin Pranav",
  },
  {
    id: "PRM-102",
    code: "SAIROHAN10",
    type: "percentage",
    value: 10,
    minOrder: 0,
    maxCustomerLimit: 100,
    category: "All Categories",
    status: "Active",
    usageCount: 89,
    description: "Campus Ambassador Referral Code (Sai Rohan - Aurora University)",
    createdBy: "Admin Pranav",
  },
  {
    id: "PRM-103",
    code: "VYSHU10",
    type: "percentage",
    value: 10,
    minOrder: 0,
    maxCustomerLimit: 100,
    category: "All Categories",
    status: "Active",
    usageCount: 64,
    description: "Campus Ambassador Referral Code (Vyshu - Sreenidhii Engineering)",
    createdBy: "Admin Pranav",
  },
  {
    id: "PRM-104",
    code: "WELCOME100",
    type: "flat",
    value: 100,
    minOrder: 0,
    maxCustomerLimit: 300,
    category: "All Categories",
    status: "Active",
    usageCount: 215,
    description: "First Time Customer Welcome Bonus • Flat ₹100 Instant Discount",
    createdBy: "Admin Pranav",
  },
  {
    id: "PRM-105",
    code: "FESTIVE15",
    type: "percentage",
    value: 15,
    minOrder: 0,
    maxCustomerLimit: 50,
    category: "Frames",
    status: "Active",
    usageCount: 38,
    description: "Festive Season Discount • 15% OFF on Total Order Amount",
    createdBy: "Admin Pranav",
  },
];

const STORAGE_KEY = "pixello_promo_codes_directory_v1";
const DELETED_KEY = "pixello_deleted_promos";
const INIT_FLAG_KEY = "pixello_promos_initialized_v3";

function getDeletedCodesList(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const saved = localStorage.getItem(DELETED_KEY);
    return saved ? JSON.parse(saved) : [];
  } catch {
    return [];
  }
}

export default function AdminPromosPage() {
  const [activeTabFilter, setActiveTabFilter] = useState<"ALL" | "ACTIVE" | "EXHAUSTED" | "INACTIVE">("ALL");
  const [promos, setPromos] = useState<PromoCodeItem[]>(() => {
    if (typeof window !== "undefined") {
      const deletedList = getDeletedCodesList();
      const isInitialized = localStorage.getItem(INIT_FLAG_KEY);
      const saved = localStorage.getItem(STORAGE_KEY);

      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed)) {
            return parsed.filter((p: PromoCodeItem) => !deletedList.includes(p.code));
          }
        } catch (e) {}
      }

      if (!isInitialized) {
        localStorage.setItem(INIT_FLAG_KEY, "true");
        const initList = DEFAULT_INITIAL_PROMOS.filter(d => !deletedList.includes(d.code));
        try { localStorage.setItem(STORAGE_KEY, JSON.stringify(initList)); } catch (e) {}
        return initList;
      }

      return [];
    }
    return DEFAULT_INITIAL_PROMOS;
  });

  const fetchPromosFromBackend = async () => {
    try {
      const deletedList = getDeletedCodesList();
      const res = await fetch("/api/promos");
      const data = await res.json();
      if (data.success && Array.isArray(data.promos)) {
        const backendMapped: PromoCodeItem[] = data.promos
          .filter((p: any) => !deletedList.includes(p.code))
          .map((p: any) => ({
            id: p.id,
            code: p.code,
            type: p.type as "percentage" | "flat",
            value: p.value,
            minOrder: p.minOrder,
            maxCustomerLimit: p.maxCustomerLimit,
            category: p.category,
            status: p.status as "Active" | "Inactive",
            usageCount: p.usageCount || 0,
            description: p.description || "",
            createdBy: p.createdBy || "Admin Pranav",
          }));

        let localList: PromoCodeItem[] = [];
        if (typeof window !== "undefined") {
          const saved = localStorage.getItem(STORAGE_KEY);
          if (saved) {
            try {
              const parsed = JSON.parse(saved);
              if (Array.isArray(parsed)) localList = parsed;
            } catch (e) {}
          }
        }

        const mergedMap = new Map<string, PromoCodeItem>();
        localList.forEach((p) => {
          if (p && p.code && !deletedList.includes(p.code)) {
            mergedMap.set(p.code.toUpperCase(), p);
          }
        });
        backendMapped.forEach((p) => {
          if (p && p.code) {
            mergedMap.set(p.code.toUpperCase(), p);
          }
        });

        const merged = Array.from(mergedMap.values());
        if (merged.length > 0) {
          setPromos(merged);
          if (typeof window !== "undefined") {
            try {
              localStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
            } catch (e) {}
          }
        }
      }
    } catch (e) {
      console.warn("API promo sync offline, using local storage:", e);
    }
  };

  useEffect(() => {
    fetchPromosFromBackend();

    const unsubPromo = sharedSSE.subscribe("promo_update", () => {
      fetchPromosFromBackend();
    });

    const syncFromStorage = () => {
      if (typeof window !== "undefined") {
        const deletedList = getDeletedCodesList();
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
          try {
            const parsed = JSON.parse(saved);
            if (Array.isArray(parsed)) {
              setPromos(parsed.filter((p: PromoCodeItem) => !deletedList.includes(p.code)));
            }
          } catch (e) {}
        }
      }
    };

    window.addEventListener("pixello_promos_updated", syncFromStorage);
    window.addEventListener("storage", syncFromStorage);

    setWelcomeForm(getWelcomePromoConfig());
    fetch("/api/settings/spotlight")
      .then((r) => r.json())
      .then((data) => {
        if (data.success && data.banners?.welcomePromo) {
          setWelcomeForm(data.banners.welcomePromo);
        }
      })
      .catch(() => {});

    return () => {
      unsubPromo();
      window.removeEventListener("pixello_promos_updated", syncFromStorage);
      window.removeEventListener("storage", syncFromStorage);
    };
  }, []);

  const [searchQuery, setSearchQuery] = useState("");
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Modal states
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isWelcomeModalOpen, setIsWelcomeModalOpen] = useState(false);
  const [welcomeForm, setWelcomeForm] = useState<WelcomePromoBannerConfig>(getWelcomePromoConfig);
  const [editingPromo, setEditingPromo] = useState<PromoCodeItem | null>(null);
  const [deleteConfirmModal, setDeleteConfirmModal] = useState<PromoCodeItem | null>(null);
  const [quickLimitModal, setQuickLimitModal] = useState<{
    isOpen: boolean;
    promo: PromoCodeItem | null;
    limitInput: number | "";
  }>({
    isOpen: false,
    promo: null,
    limitInput: 100,
  });

  // Form states
  const [formData, setFormData] = useState({
    code: "",
    type: "percentage" as "percentage" | "flat",
    value: 10,
    minOrder: 299,
    maxCustomerLimit: 100 as number | "",
    category: "All Categories",
    status: "Active" as "Active" | "Inactive",
    description: "",
  });

  const savePromos = (newPromos: PromoCodeItem[]) => {
    setPromos(newPromos);
    if (typeof window !== "undefined") {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(newPromos));
        localStorage.setItem(INIT_FLAG_KEY, "true");
        window.dispatchEvent(new Event("pixello_promos_updated"));
        window.dispatchEvent(new Event("storage"));
      } catch (e) {
        console.error(e);
      }
    }
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleSaveWelcomeBanner = async () => {
    saveWelcomePromoConfig(welcomeForm);
    try {
      await fetch("/api/settings/spotlight", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ banners: { welcomePromo: welcomeForm } }),
      });
    } catch {}
    setIsWelcomeModalOpen(false);
    showToast("✓ Homepage Welcome Promo banner updated & synced live!");
  };

  const handleOpenAddModal = () => {
    setFormData({
      code: "",
      type: "percentage",
      value: 10,
      minOrder: 299,
      maxCustomerLimit: 100,
      category: "All Categories",
      status: "Active",
      description: "",
    });
    setEditingPromo(null);
    setIsAddModalOpen(true);
  };

  const handleOpenEditModal = (item: PromoCodeItem) => {
    setEditingPromo(item);
    setFormData({
      code: item.code,
      type: item.type,
      value: item.value,
      minOrder: item.minOrder,
      maxCustomerLimit: item.maxCustomerLimit ?? "",
      category: item.category,
      status: item.status,
      description: item.description,
    });
    setIsAddModalOpen(true);
  };

  const handleCreatePromo = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanCode = formData.code.trim().toUpperCase();
    if (!cleanCode) {
      alert("Please enter a valid Promo Code name!");
      return;
    }

    if (promos.some((p) => p.code.toUpperCase() === cleanCode)) {
      alert(`Promo Code "${cleanCode}" already exists!`);
      return;
    }

    // Remove from deleted list if re-adding
    if (typeof window !== "undefined") {
      try {
        const deletedList = getDeletedCodesList().filter(c => c !== cleanCode);
        localStorage.setItem(DELETED_KEY, JSON.stringify(deletedList));
      } catch (e) {}
    }

    const limitVal = formData.maxCustomerLimit === "" ? null : Number(formData.maxCustomerLimit);

    try {
      const res = await fetch("/api/promos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code: cleanCode,
          type: formData.type,
          value: Number(formData.value) || 10,
          minOrder: Number(formData.minOrder) || 0,
          maxCustomerLimit: limitVal,
          category: formData.category,
          status: formData.status,
          description: formData.description.trim() || `${formData.value}${formData.type === "percentage" ? "%" : " ₹"} discount`,
        }),
      });
      const data = await res.json();
      if (data.success && data.promo) {
        const created: PromoCodeItem = {
          id: data.promo.id,
          code: data.promo.code,
          type: data.promo.type,
          value: data.promo.value,
          minOrder: data.promo.minOrder,
          maxCustomerLimit: data.promo.maxCustomerLimit,
          category: data.promo.category,
          status: data.promo.status,
          usageCount: data.promo.usageCount || 0,
          description: data.promo.description || "",
          createdBy: "Admin Pranav",
        };
        const updated = [created, ...promos];
        savePromos(updated);
        setIsAddModalOpen(false);
        showToast(`✓ Promo Code "${cleanCode}" created successfully!`);
        return;
      }
    } catch (err) {}

    // Fallback: local only
    const newItem: PromoCodeItem = {
      id: `PRM-${Date.now().toString().slice(-4)}`,
      code: cleanCode,
      type: formData.type,
      value: Number(formData.value) || 10,
      minOrder: Number(formData.minOrder) || 0,
      maxCustomerLimit: limitVal,
      category: formData.category,
      status: formData.status,
      usageCount: 0,
      description: formData.description.trim() || `${formData.value}${formData.type === "percentage" ? "%" : " ₹"} discount`,
      createdBy: "Admin Pranav",
    };
    const updated = [newItem, ...promos];
    savePromos(updated);
    setIsAddModalOpen(false);
    showToast(`✓ Promo Code "${cleanCode}" created!`);
  };

  const handleUpdatePromo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPromo) return;
    const cleanCode = formData.code.trim().toUpperCase();
    const limitVal = formData.maxCustomerLimit === "" ? null : Number(formData.maxCustomerLimit);

    try {
      await fetch("/api/promos", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: editingPromo.id,
          code: cleanCode,
          type: formData.type,
          value: Number(formData.value) || 10,
          minOrder: Number(formData.minOrder) || 0,
          maxCustomerLimit: limitVal,
          category: formData.category,
          status: formData.status,
          description: formData.description.trim(),
        }),
      });
    } catch (err) {}

    const updated = promos.map((p) => {
      if (p.id === editingPromo.id) {
        return {
          ...p,
          code: cleanCode,
          type: formData.type,
          value: Number(formData.value) || 10,
          minOrder: Number(formData.minOrder) || 0,
          maxCustomerLimit: limitVal,
          category: formData.category,
          status: formData.status,
          description: formData.description.trim(),
        };
      }
      return p;
    });

    savePromos(updated);
    setEditingPromo(null);
    setIsAddModalOpen(false);
    showToast(`✓ Promo Code "${cleanCode}" updated & synced live!`);
  };

  const handleToggleStatus = async (item: PromoCodeItem) => {
    const nextStatus: "Active" | "Inactive" = item.status === "Active" ? "Inactive" : "Active";
    try {
      await fetch("/api/promos", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: item.id, status: nextStatus }),
      });
    } catch (err) {}
    const updated: PromoCodeItem[] = promos.map((p) => (p.id === item.id ? { ...p, status: nextStatus } : p));
    savePromos(updated);
    showToast(`✓ Promo Code "${item.code}" set to ${nextStatus.toUpperCase()}!`);
  };

  const handleDeletePromo = (item: PromoCodeItem) => {
    setDeleteConfirmModal(item);
  };

  const confirmDeletePromo = async () => {
    if (!deleteConfirmModal) return;
    const code = deleteConfirmModal.code;
    const id = deleteConfirmModal.id;

    // 1. Immediately delete from local state and update localStorage
    const updated = promos.filter((p) => p.id !== id && p.code !== code);
    savePromos(updated);

    // 2. Track permanently in deleted codes registry so it never regenerates
    if (typeof window !== "undefined") {
      try {
        const deletedList = getDeletedCodesList();
        if (!deletedList.includes(code)) {
          deletedList.push(code);
        }
        localStorage.setItem(DELETED_KEY, JSON.stringify(deletedList));
      } catch (e) {}
    }

    // 3. Call backend API to delete from database
    try {
      await fetch(`/api/promos?id=${encodeURIComponent(id)}&code=${encodeURIComponent(code)}`, { method: "DELETE" });
    } catch (e) {
      console.warn("Backend promo delete call finished:", e);
    }

    showToast(`✓ Promo Code "${code}" permanently deleted.`);
    setDeleteConfirmModal(null);
  };

  // Status Filter Helpers
  const isLimitReached = (p: PromoCodeItem) => {
    return Boolean(p.maxCustomerLimit && p.maxCustomerLimit > 0 && (p.usageCount || 0) >= p.maxCustomerLimit);
  };

  const filteredPromos = promos.filter((p) => {
    // 1. Tab filter
    const limitReached = isLimitReached(p);
    if (activeTabFilter === "ACTIVE") {
      if (p.status !== "Active" || limitReached) return false;
    } else if (activeTabFilter === "EXHAUSTED") {
      if (!limitReached) return false;
    } else if (activeTabFilter === "INACTIVE") {
      if (p.status !== "Inactive") return false;
    }

    // 2. Search query
    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;
    return (
      p.code.toLowerCase().includes(q) ||
      p.description.toLowerCase().includes(q) ||
      p.category.toLowerCase().includes(q)
    );
  });

  const activeLiveCount = promos.filter(p => p.status === "Active" && !isLimitReached(p)).length;
  const exhaustedCount = promos.filter(p => isLimitReached(p)).length;
  const inactiveCount = promos.filter(p => p.status === "Inactive").length;

  return (
    <div className="flex flex-col gap-6 p-6 bg-[#F8F3EE] min-h-screen relative">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-20 right-8 z-50 bg-[#3A2B24] text-white px-5 py-3 rounded-2xl shadow-xl border border-[#D89A86]/40 flex items-center gap-2.5 animate-in fade-in slide-in-from-top-4 duration-300">
          <CheckCircle2 className="h-5 w-5 text-[#D89A86]" />
          <span className="text-xs font-bold">{toastMessage}</span>
        </div>
      )}

      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="font-serif-brand text-3xl font-bold text-[#3A2B24]">Store Promo Codes &amp; Discounts</h2>
          <p className="text-xs text-[#6C5C54] mt-1">Manage coupon codes, set max customer redemption limits, percentage &amp; flat discounts.</p>
        </div>
        <div className="flex items-center gap-2.5 flex-wrap">
          <Button 
            onClick={() => setIsWelcomeModalOpen(true)}
            variant="outline"
            className="border-[#D89A86] bg-white text-[#D89A86] hover:bg-[#FFF8F2] hover:text-[#C58572] text-xs font-bold rounded-full px-4 h-11 shadow-xs flex items-center gap-1.5 cursor-pointer transition-all duration-200"
          >
            <Sparkles className="h-4 w-4 text-[#D89A86]" /> Edit Welcome Banner
          </Button>
          <Button 
            onClick={handleOpenAddModal}
            className="btn-pixello-primary text-xs font-bold rounded-full px-6 h-11 shadow-sm flex items-center gap-2 cursor-pointer self-start sm:self-auto"
          >
            <Plus className="h-4 w-4" /> Create New Promo Code
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border border-[#EFE6DD] bg-white rounded-3xl shadow-2xs">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-bold text-[#6C5C54] uppercase tracking-wider">Active &amp; Live Codes</p>
              <h3 className="font-serif-brand text-2xl font-black text-emerald-700 mt-1">
                {activeLiveCount}
              </h3>
              <p className="text-[10px] text-emerald-600 mt-0.5 font-medium">Visible to customers</p>
            </div>
            <div className="h-11 w-11 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600">
              <Tag className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="border border-[#EFE6DD] bg-white rounded-3xl shadow-2xs">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-bold text-[#6C5C54] uppercase tracking-wider">Limit Reached / Disappeared</p>
              <h3 className="font-serif-brand text-2xl font-black text-rose-700 mt-1">
                {exhaustedCount}
              </h3>
              <p className="text-[10px] text-rose-600 mt-0.5 font-medium">Auto-hidden from store</p>
            </div>
            <div className="h-11 w-11 rounded-2xl bg-rose-50 border border-rose-200 flex items-center justify-center text-rose-600">
              <EyeOff className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="border border-[#EFE6DD] bg-white rounded-3xl shadow-2xs">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-bold text-[#6C5C54] uppercase tracking-wider">Total Redemptions</p>
              <h3 className="font-serif-brand text-2xl font-black text-[#3A2B24] mt-1">
                {promos.reduce((sum, p) => sum + (p.usageCount || 0), 0)}
              </h3>
              <p className="text-[10px] text-[#6C5C54] mt-0.5 font-medium">Successful checkouts</p>
            </div>
            <div className="h-11 w-11 rounded-2xl bg-[#FFF8F2] border border-[#EFE6DD] flex items-center justify-center text-[#D89A86]">
              <Sparkles className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="border border-[#EFE6DD] bg-white rounded-3xl shadow-2xs">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-bold text-[#6C5C54] uppercase tracking-wider">Total Registered</p>
              <h3 className="font-serif-brand text-2xl font-black text-[#3A2B24] mt-1">
                {promos.length}
              </h3>
              <p className="text-[10px] text-[#6C5C54] mt-0.5 font-medium">Coupons in system</p>
            </div>
            <div className="h-11 w-11 rounded-2xl bg-[#3A2B24] text-[#D89A86] flex items-center justify-center">
              <Ticket className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Table Card */}
      <Card className="border border-[#EFE6DD] bg-white rounded-3xl shadow-xs overflow-hidden">
        <CardContent className="p-0">
          <div className="p-5 border-b border-[#EFE6DD] flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#FAF7F4]">
            {/* Tab Filter Pills */}
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => setActiveTabFilter("ALL")}
                className={`text-xs font-bold px-3.5 py-1.5 rounded-full transition-all cursor-pointer ${
                  activeTabFilter === "ALL"
                    ? "bg-[#3A2B24] text-white shadow-2xs"
                    : "bg-white text-[#6C5C54] border border-[#EFE6DD] hover:bg-[#FFF8F2]"
                }`}
              >
                All Coupons ({promos.length})
              </button>
              <button
                type="button"
                onClick={() => setActiveTabFilter("ACTIVE")}
                className={`text-xs font-bold px-3.5 py-1.5 rounded-full transition-all cursor-pointer ${
                  activeTabFilter === "ACTIVE"
                    ? "bg-emerald-700 text-white shadow-2xs"
                    : "bg-emerald-50 text-emerald-800 border border-emerald-200 hover:bg-emerald-100"
                }`}
              >
                🟢 Active &amp; Live ({activeLiveCount})
              </button>
              <button
                type="button"
                onClick={() => setActiveTabFilter("EXHAUSTED")}
                className={`text-xs font-bold px-3.5 py-1.5 rounded-full transition-all cursor-pointer ${
                  activeTabFilter === "EXHAUSTED"
                    ? "bg-rose-700 text-white shadow-2xs"
                    : "bg-rose-50 text-rose-800 border border-rose-200 hover:bg-rose-100"
                }`}
              >
                🚫 Limit Reached ({exhaustedCount})
              </button>
              <button
                type="button"
                onClick={() => setActiveTabFilter("INACTIVE")}
                className={`text-xs font-bold px-3.5 py-1.5 rounded-full transition-all cursor-pointer ${
                  activeTabFilter === "INACTIVE"
                    ? "bg-slate-700 text-white shadow-2xs"
                    : "bg-slate-50 text-slate-700 border border-slate-200 hover:bg-slate-100"
                }`}
              >
                ⚪ Inactive ({inactiveCount})
              </button>
            </div>
            
            <div className="relative w-full sm:w-72">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#6C5C54]" />
              <Input
                placeholder="Search promo code or offer..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 rounded-2xl border-[#EFE6DD] bg-white text-xs text-[#3A2B24] h-10 focus-visible:ring-[#D89A86]"
              />
            </div>
          </div>

          <div className="p-0">
            <div className="overflow-x-auto custom-scrollbar">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-[#EFE6DD] bg-[#FAF7F4]/60 text-[11px] font-bold text-[#6C5C54] uppercase tracking-wider">
                    <th className="px-4 py-3.5">Promo Code</th>
                    <th className="px-4 py-3.5">Discount Offer</th>
                    <th className="px-4 py-3.5">Min Order</th>
                    <th className="px-4 py-3.5">Category</th>
                    <th className="px-4 py-3.5">Redemptions</th>
                    <th className="px-4 py-3.5">Customer Visibility</th>
                    <th className="px-4 py-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#EFE6DD]">
                  {filteredPromos.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="text-center py-10 text-xs text-[#6C5C54]">
                        {searchQuery ? `No promo codes found matching "${searchQuery}"` : "No promo codes listed in this section. Click '+ Create New Promo Code' to add one!"}
                      </td>
                    </tr>
                  ) : (
                    filteredPromos.map((item) => {
                      const limitReached = isLimitReached(item);
                      return (
                        <tr key={item.id} className="hover:bg-[#FFF8F2]/50 transition-colors">
                          <td className="px-4 py-4">
                            <div className="flex items-center gap-2">
                              <Badge className="font-mono font-extrabold text-xs bg-[#3A2B24] text-white px-3 py-1 rounded-xl shadow-2xs border-none tracking-wider">
                                {item.code}
                              </Badge>
                            </div>
                            <p className="text-[11px] text-[#6C5C54] font-medium mt-1 max-w-xs truncate">{item.description}</p>
                          </td>

                          <td className="px-4 py-4 font-bold text-[#D89A86]">
                            {item.type === "percentage" ? `${item.value}% OFF` : `₹${item.value} Flat OFF`}
                          </td>

                          <td className="px-4 py-4 text-xs font-bold text-[#3A2B24]">
                            ₹{item.minOrder}
                          </td>

                          <td className="px-4 py-4 text-xs font-semibold text-[#6C5C54]">
                            {item.category}
                          </td>

                          <td className="px-4 py-4 text-xs font-bold text-[#3A2B24]">
                            {item.maxCustomerLimit && item.maxCustomerLimit > 0 ? (
                              <div>
                                <div className="flex items-center gap-1.5">
                                  <span className={limitReached ? "text-rose-700 font-extrabold text-xs" : "text-[#3A2B24] font-bold text-xs"}>
                                    {item.usageCount} / {item.maxCustomerLimit} users
                                  </span>
                                </div>
                                {limitReached ? (
                                  <span className="inline-block text-[9px] font-extrabold bg-rose-100 text-rose-900 border border-rose-300 px-2 py-0.5 rounded-full mt-0.5">
                                    🚫 Max Limit Reached
                                  </span>
                                ) : (
                                  <span className="inline-block text-[9px] font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-full mt-0.5">
                                    {item.maxCustomerLimit - item.usageCount} spots left
                                  </span>
                                )}
                                
                                {/* Quick Edit Customer Limit Button */}
                                <button
                                  type="button"
                                  onClick={() => setQuickLimitModal({
                                    isOpen: true,
                                    promo: item,
                                    limitInput: item.maxCustomerLimit || 100
                                  })}
                                  className="text-[10px] text-emerald-900 bg-emerald-100/80 hover:bg-emerald-200 border border-emerald-300 px-2 py-1 rounded-lg flex items-center gap-1 font-extrabold mt-1.5 cursor-pointer transition-all shadow-2xs"
                                >
                                  <Users className="h-3 w-3 text-emerald-700" /> Assign Limit
                                </button>
                              </div>
                            ) : (
                              <div>
                                <span>{item.usageCount} uses</span>
                                <span className="block text-[9px] text-[#6C5C54] font-medium mt-0.5">Unlimited Uses</span>
                                <button
                                  type="button"
                                  onClick={() => setQuickLimitModal({
                                    isOpen: true,
                                    promo: item,
                                    limitInput: 100
                                  })}
                                  className="text-[10px] text-emerald-900 bg-emerald-100/80 hover:bg-emerald-200 border border-emerald-300 px-2 py-1 rounded-lg flex items-center gap-1 font-extrabold mt-1.5 cursor-pointer transition-all shadow-2xs"
                                >
                                  <Users className="h-3 w-3 text-emerald-700" /> Set User Limit
                                </button>
                              </div>
                            )}
                          </td>

                          {/* Visibility & Status Badge */}
                          <td className="px-4 py-4">
                            {limitReached ? (
                              <Badge className="bg-rose-100 text-rose-800 border-rose-300 text-xs px-3 py-1 rounded-full font-bold shadow-2xs">
                                <EyeOff className="h-3 w-3 mr-1 inline text-rose-600" /> Disappeared (Limit Met)
                              </Badge>
                            ) : (
                              <button
                                onClick={() => handleToggleStatus(item)}
                                title="Click to toggle Active / Inactive"
                                className="cursor-pointer"
                              >
                                <Badge
                                  className={
                                    item.status === "Active"
                                      ? "bg-emerald-100 text-emerald-800 hover:bg-emerald-200 border-none text-xs px-3 py-0.5 rounded-full font-bold transition-colors"
                                      : "bg-slate-100 text-slate-700 hover:bg-slate-200 border-none text-xs px-3 py-0.5 rounded-full font-bold transition-colors"
                                  }
                                >
                                  <Power className="h-3 w-3 mr-1 inline" />
                                  {item.status === "Active" ? "Active (Live)" : "Inactive"}
                                </Badge>
                              </button>
                            )}
                          </td>

                          <td className="px-4 py-4 text-right whitespace-nowrap">
                            <div className="flex items-center justify-end gap-2">
                              <Button 
                                size="sm" 
                                variant="outline" 
                                onClick={() => handleOpenEditModal(item)}
                                className="rounded-full text-xs font-bold border-[#EFE6DD] text-[#3A2B24] bg-white hover:bg-[#FFF8F2] hover:text-[#D89A86] px-3.5 h-8 flex items-center gap-1.5 cursor-pointer shadow-2xs"
                              >
                                <Edit className="h-3.5 w-3.5 text-[#D89A86]" /> Edit Code
                              </Button>
                              <Button 
                                size="sm" 
                                variant="outline" 
                                onClick={() => handleDeletePromo(item)}
                                className="rounded-full text-xs font-bold border-rose-200 text-rose-600 bg-white hover:bg-rose-50 px-3.5 h-8 flex items-center gap-1.5 cursor-pointer shadow-2xs"
                              >
                                <Trash2 className="h-3.5 w-3.5 text-rose-600" /> Delete
                              </Button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quick Customer Limit Edit Modal */}
      {quickLimitModal.isOpen && quickLimitModal.promo && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-[#EFE6DD] shadow-2xl w-full max-w-sm p-6 overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-[#EFE6DD] mb-4">
              <div className="flex items-center gap-2">
                <Users className="h-5 w-5 text-emerald-600" />
                <h3 className="font-serif-brand text-lg font-bold text-[#3A2B24]">
                  Assign Customer Limit
                </h3>
              </div>
              <button
                onClick={() => setQuickLimitModal({ isOpen: false, promo: null, limitInput: 100 })}
                className="h-8 w-8 rounded-full flex items-center justify-center text-[#6C5C54] hover:bg-[#FFF8F2]"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form
              onSubmit={async (e) => {
                e.preventDefault();
                if (!quickLimitModal.promo) return;
                const targetPromo = quickLimitModal.promo;
                const limitVal = quickLimitModal.limitInput === "" ? null : Number(quickLimitModal.limitInput);

                try {
                  await fetch("/api/promos", {
                    method: "PATCH",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                      id: targetPromo.id,
                      code: targetPromo.code,
                      maxCustomerLimit: limitVal,
                    }),
                  });
                } catch (err) {}

                const updated = promos.map((p) => {
                  if (p.id === targetPromo.id) {
                    return { ...p, maxCustomerLimit: limitVal };
                  }
                  return p;
                });

                savePromos(updated);
                setQuickLimitModal({ isOpen: false, promo: null, limitInput: 100 });
                showToast(`✓ Limit updated for ${targetPromo.code}: ${limitVal ? `${limitVal} users` : "Unlimited"}`);
              }}
              className="space-y-4"
            >
              <div>
                <p className="text-xs text-[#6C5C54] mb-2 font-medium">
                  Set the maximum number of customer redemptions for <strong className="text-[#3A2B24] font-mono">{quickLimitModal.promo.code}</strong>:
                </p>
                <Input
                  type="number"
                  min="1"
                  placeholder="e.g. 50, 100, 200 (or leave empty for unlimited)"
                  value={quickLimitModal.limitInput}
                  onChange={(e) => setQuickLimitModal({
                    ...quickLimitModal,
                    limitInput: e.target.value === "" ? "" : Number(e.target.value)
                  })}
                  className="rounded-2xl border-[#EFE6DD] bg-[#FFF8F2]/60 text-sm font-bold text-[#3A2B24] h-12"
                />
              </div>

              {/* Quick Preset Limit Pills */}
              <div className="flex flex-wrap gap-2 pt-1">
                {[50, 100, 200, 300, 500].map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => setQuickLimitModal({ ...quickLimitModal, limitInput: preset })}
                    className={`text-xs font-bold px-3 py-1 rounded-xl border transition-all cursor-pointer ${
                      quickLimitModal.limitInput === preset
                        ? "bg-[#3A2B24] text-white border-[#3A2B24] shadow-2xs"
                        : "bg-white text-[#6C5C54] border-[#EFE6DD] hover:bg-[#FFF8F2]"
                    }`}
                  >
                    {preset} users
                  </button>
                ))}
                <button
                  type="button"
                  onClick={() => setQuickLimitModal({ ...quickLimitModal, limitInput: "" })}
                  className={`text-xs font-bold px-3 py-1 rounded-xl border transition-all cursor-pointer ${
                    quickLimitModal.limitInput === ""
                      ? "bg-[#3A2B24] text-white border-[#3A2B24] shadow-2xs"
                      : "bg-white text-[#6C5C54] border-[#EFE6DD] hover:bg-[#FFF8F2]"
                  }`}
                >
                  Unlimited
                </button>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-[#EFE6DD]">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setQuickLimitModal({ isOpen: false, promo: null, limitInput: 100 })}
                  className="rounded-full text-xs font-bold border-[#EFE6DD]"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  className="btn-pixello-primary rounded-full text-xs font-bold px-5"
                >
                  Save Limit
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add / Edit Promo Code Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-[#EFE6DD] shadow-2xl w-full max-w-lg p-6 sm:p-7 overflow-y-auto max-h-[90vh] animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-4 border-b border-[#EFE6DD] mb-5">
              <div className="flex items-center gap-2.5">
                <div className="h-9 w-9 rounded-xl bg-[#FFF8F2] border border-[#EFE6DD] flex items-center justify-center text-[#D89A86]">
                  <Tag className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-serif-brand text-lg font-bold text-[#3A2B24]">
                    {editingPromo ? "Edit Promo Code" : "Create New Promo Code"}
                  </h3>
                  <p className="text-xs text-[#6C5C54] mt-0.5">
                    {editingPromo ? "Update code properties & user limits" : "Define coupon rules & discount parameters"}
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  setIsAddModalOpen(false);
                  setEditingPromo(null);
                }}
                className="h-8 w-8 rounded-full flex items-center justify-center text-[#6C5C54] hover:bg-[#FFF8F2]"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={editingPromo ? handleUpdatePromo : handleCreatePromo} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-[#3A2B24] mb-1 block">Promo Coupon Code *</label>
                <Input
                  placeholder="e.g. SUMMER25, FESTIVE50"
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                  className="rounded-xl border-[#EFE6DD] bg-white text-xs font-mono font-bold uppercase tracking-wider text-[#3A2B24]"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-[#3A2B24] mb-1 block">Discount Type</label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value as "percentage" | "flat" })}
                    className="w-full h-10 rounded-xl border border-[#EFE6DD] bg-white text-xs font-semibold text-[#3A2B24] px-3 focus:outline-none focus:ring-2 focus:ring-[#D89A86] cursor-pointer"
                  >
                    <option value="percentage" className="bg-white text-[#3A2B24]">Percentage (% OFF)</option>
                    <option value="flat" className="bg-white text-[#3A2B24]">Flat Amount (₹ OFF)</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-[#3A2B24] mb-1 block">
                    Discount Value {formData.type === "percentage" ? "(%)" : "(₹)"} *
                  </label>
                  <Input
                    type="number"
                    min="1"
                    placeholder={formData.type === "percentage" ? "15" : "100"}
                    value={formData.value}
                    onChange={(e) => setFormData({ ...formData, value: Number(e.target.value) || 0 })}
                    className="rounded-xl border-[#EFE6DD] bg-white text-xs font-bold text-[#3A2B24]"
                    required
                  />
                </div>
              </div>

              {/* Customer User Limit Selection */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-bold text-[#3A2B24] flex items-center gap-1.5">
                    <Users className="h-3.5 w-3.5 text-emerald-600" /> Max Customer Redemption Limit
                  </label>
                  <span className="text-[10px] text-[#6C5C54]">Leave empty for Unlimited</span>
                </div>
                <Input
                  type="number"
                  min="1"
                  placeholder="e.g. 50, 100, 200 users (empty = Unlimited)"
                  value={formData.maxCustomerLimit}
                  onChange={(e) => setFormData({ ...formData, maxCustomerLimit: e.target.value === "" ? "" : Number(e.target.value) })}
                  className="rounded-xl border-[#EFE6DD] bg-white text-xs font-semibold text-[#3A2B24]"
                />
                <div className="flex flex-wrap gap-1.5 mt-1.5">
                  {[50, 100, 200, 300, 500].map((num) => (
                    <button
                      key={num}
                      type="button"
                      onClick={() => setFormData({ ...formData, maxCustomerLimit: num })}
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-md border transition-all cursor-pointer ${
                        formData.maxCustomerLimit === num
                          ? "bg-[#3A2B24] text-white border-[#3A2B24] shadow-2xs"
                          : "bg-white text-[#6C5C54] border-[#EFE6DD] hover:bg-[#FFF8F2]"
                      }`}
                    >
                      {num}
                    </button>
                  ))}
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, maxCustomerLimit: "" })}
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-md border transition-all cursor-pointer ${
                      formData.maxCustomerLimit === ""
                        ? "bg-slate-800 text-white border-slate-900 shadow-2xs"
                        : "bg-white text-slate-700 border-slate-200 hover:bg-slate-100"
                    }`}
                  >
                    Unlimited
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-[#3A2B24] mb-1 block">Minimum Order Amount (₹)</label>
                  <Input
                    type="number"
                    min="0"
                    placeholder="299"
                    value={formData.minOrder}
                    onChange={(e) => setFormData({ ...formData, minOrder: Number(e.target.value) || 0 })}
                    className="rounded-xl border-[#EFE6DD] bg-white text-xs font-semibold text-[#3A2B24]"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-[#3A2B24] mb-1 block">Applicable Category</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full h-10 rounded-xl border border-[#EFE6DD] bg-white text-xs font-medium text-[#3A2B24] px-3 focus:outline-none focus:ring-2 focus:ring-[#D89A86] cursor-pointer"
                  >
                    <option value="All Categories" className="bg-white text-[#3A2B24]">All Categories</option>
                    <option value="Frames" className="bg-white text-[#3A2B24]">Frames</option>
                    <option value="Polaroids" className="bg-white text-[#3A2B24]">Polaroids</option>
                    <option value="Gifts" className="bg-white text-[#3A2B24]">Gifts</option>
                    <option value="LED" className="bg-white text-[#3A2B24]">LED</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-[#3A2B24] mb-1 block">Offer Description / Notes</label>
                <Input
                  placeholder="e.g. Special offer for campus students"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="rounded-xl border-[#EFE6DD] bg-white text-xs font-medium text-[#3A2B24]"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-[#3A2B24] mb-1 block">Promo Status</label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value as "Active" | "Inactive" })}
                  className="w-full h-10 rounded-xl border border-[#EFE6DD] bg-white text-xs font-bold text-[#3A2B24] px-3 focus:outline-none focus:ring-2 focus:ring-[#D89A86] cursor-pointer"
                >
                  <option value="Active" className="bg-white text-emerald-700">Active (Live for Customers)</option>
                  <option value="Inactive" className="bg-white text-rose-700">Inactive (Disabled)</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 mt-2 border-t border-[#EFE6DD] bg-white sticky bottom-0 z-10">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setIsAddModalOpen(false);
                    setEditingPromo(null);
                  }}
                  className="rounded-full text-xs font-bold border-[#EFE6DD] text-[#3A2B24] px-5 h-10"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  className="btn-pixello-primary text-xs font-bold rounded-full px-6 h-10 shadow-xs"
                >
                  {editingPromo ? "Save Changes & Sync" : "Create Promo Code"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Custom Delete Confirmation Modal */}
      {deleteConfirmModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl border border-rose-100 shadow-2xl w-full max-w-md p-6 overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="flex flex-col items-center text-center">
              <div className="h-14 w-14 rounded-full bg-rose-100 border border-rose-200 flex items-center justify-center text-rose-600 mb-4 shadow-2xs">
                <AlertTriangle className="h-7 w-7" />
              </div>
              <h3 className="font-serif-brand text-xl font-bold text-[#3A2B24]">
                Delete Promo Code?
              </h3>
              <p className="text-xs text-[#6C5C54] mt-2 leading-relaxed max-w-xs">
                Are you sure you want to permanently delete promo code{" "}
                <strong className="font-mono text-[#3A2B24] bg-[#FFF8F2] px-2 py-0.5 rounded-md border border-[#EFE6DD] inline-block font-extrabold">
                  {deleteConfirmModal.code}
                </strong>
                ? Customers will no longer be able to redeem this coupon at checkout.
              </p>
              
              <div className="w-full bg-[#FFF8F2] rounded-xl p-3 border border-[#EFE6DD] mt-4 text-left text-xs space-y-1">
                <div className="flex justify-between">
                  <span className="text-[#6C5C54]">Offer:</span>
                  <span className="font-bold text-[#D89A86]">{deleteConfirmModal.type === "percentage" ? `${deleteConfirmModal.value}% OFF` : `₹${deleteConfirmModal.value} Flat OFF`}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#6C5C54]">Redemptions so far:</span>
                  <span className="font-bold text-[#3A2B24]">{deleteConfirmModal.usageCount} uses</span>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-5 mt-4 border-t border-[#EFE6DD]">
              <Button
                type="button"
                variant="outline"
                onClick={() => setDeleteConfirmModal(null)}
                className="rounded-full text-xs font-bold border-[#EFE6DD] text-[#3A2B24] px-5 h-10"
              >
                Cancel
              </Button>
              <Button
                type="button"
                onClick={confirmDeletePromo}
                className="bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-full px-6 h-10 shadow-xs flex items-center gap-1.5 cursor-pointer"
              >
                <Trash2 className="h-4 w-4" /> Yes, Delete Code
              </Button>
            </div>
          </div>
        </div>
      )}
      {/* WELCOME PROMO BANNER EDIT MODAL */}
      {isWelcomeModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-200">
          <div className="bg-white border border-[#EFE6DD] rounded-3xl max-w-2xl w-full shadow-2xl flex flex-col max-h-[90vh] overflow-hidden animate-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="p-6 pb-4 border-b border-[#EFE6DD] flex items-center justify-between bg-[#FFF8F2]">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-2xl bg-white border border-[#EFE6DD] flex items-center justify-center text-[#D89A86] shadow-2xs">
                  <Sparkles className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-serif-brand text-xl font-bold text-[#3A2B24]">
                    Edit Homepage Welcome Promo Banner
                  </h3>
                  <p className="text-xs text-[#6C5C54]">
                    Featured on the customer landing page at <span className="font-bold text-[#3A2B24]">/</span>.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsWelcomeModalOpen(false)}
                className="h-8 w-8 rounded-full bg-white border border-[#EFE6DD] flex items-center justify-center text-[#6C5C54] hover:text-[#3A2B24] cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Content Form */}
            <div className="p-6 overflow-y-auto space-y-4">
              {/* Banner Visibility */}
              <div className="flex items-center justify-between p-3.5 bg-[#FFFDFB] rounded-2xl border border-[#F2C8B5]/60">
                <div>
                  <span className="text-xs font-bold text-[#3A2B24] block">Welcome Banner Visibility</span>
                  <span className="text-[11px] text-[#6C5C54]">Turn ON to display on the homepage</span>
                </div>
                <button
                  type="button"
                  onClick={() => setWelcomeForm({ ...welcomeForm, enabled: !welcomeForm.enabled })}
                  className={cn(
                    "text-xs font-extrabold px-4 py-1.5 rounded-full cursor-pointer transition-all border",
                    welcomeForm.enabled
                      ? "bg-emerald-100 text-emerald-800 border-emerald-300"
                      : "bg-rose-100 text-rose-800 border-rose-300"
                  )}
                >
                  {welcomeForm.enabled ? "✓ Visible / Active" : "✕ Hidden"}
                </button>
              </div>

              {/* Quick Select from existing active promos */}
              <div className="p-3 bg-[#FFF8F2]/70 rounded-xl border border-[#EFE6DD]">
                <label className="text-[11px] font-bold text-[#6C5C54] mb-1 block">
                  ⚡ Autofill code &amp; discount from existing promo:
                </label>
                <select
                  defaultValue=""
                  onChange={(e) => {
                    const promo = promos.find((p) => p.code === e.target.value);
                    if (promo) {
                      const discountStr = promo.type === "percentage" ? `${promo.value}% OFF` : `₹${promo.value} OFF`;
                      setWelcomeForm({
                        ...welcomeForm,
                        code: promo.code,
                        discountLabel: discountStr,
                        description: promo.description || welcomeForm.description,
                      });
                      showToast(`Autofilled welcome promo from "${promo.code}" (${discountStr})`);
                    }
                  }}
                  className="w-full text-xs rounded-xl border-[#EFE6DD] bg-white p-2 font-medium text-[#3A2B24] focus:ring-[#D89A86]"
                >
                  <option value="" disabled>Select a promo code to auto-populate...</option>
                  {promos.filter(p => p.status === "Active").map((p) => (
                    <option key={p.id} value={p.code}>
                      {p.code} ({p.type === "percentage" ? `${p.value}% OFF` : `₹${p.value} Flat`} • {p.description})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-[#3A2B24] mb-1 block">Special Badge</label>
                  <Input
                    value={welcomeForm.badge}
                    onChange={(e) => setWelcomeForm({ ...welcomeForm, badge: e.target.value })}
                    placeholder="Special Offer"
                    className="rounded-xl border-[#EFE6DD] text-xs bg-white h-10"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-[#3A2B24] mb-1 block">Verified Badge</label>
                  <Input
                    value={welcomeForm.verifiedBadge}
                    onChange={(e) => setWelcomeForm({ ...welcomeForm, verifiedBadge: e.target.value })}
                    placeholder="Verified Deal"
                    className="rounded-xl border-[#EFE6DD] text-xs bg-white h-10"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-[#3A2B24] mb-1 block">Offer Title *</label>
                <Input
                  value={welcomeForm.title}
                  onChange={(e) => setWelcomeForm({ ...welcomeForm, title: e.target.value })}
                  placeholder="Exclusive Pixello Welcome Offer"
                  className="rounded-xl border-[#EFE6DD] text-xs font-bold text-[#3A2B24] bg-white h-10"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="text-xs font-bold text-[#3A2B24] mb-1 block">Discount Label *</label>
                  <Input
                    value={welcomeForm.discountLabel}
                    onChange={(e) => setWelcomeForm({ ...welcomeForm, discountLabel: e.target.value })}
                    placeholder="10% OFF"
                    className="rounded-xl border-[#EFE6DD] text-xs font-bold text-[#D89A86] bg-white h-10"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-[#3A2B24] mb-1 block">Coupon Promo Code *</label>
                  <Input
                    value={welcomeForm.code}
                    onChange={(e) => setWelcomeForm({ ...welcomeForm, code: e.target.value.toUpperCase().replace(/\s+/g, '') })}
                    placeholder="WELCOME10"
                    className="rounded-xl border-[#EFE6DD] text-xs font-mono font-bold text-[#3A2B24] bg-white h-10"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-[#3A2B24] mb-1 block">Claim Button Text</label>
                  <Input
                    value={welcomeForm.buttonText}
                    onChange={(e) => setWelcomeForm({ ...welcomeForm, buttonText: e.target.value })}
                    placeholder="Claim & Copy Code"
                    className="rounded-xl border-[#EFE6DD] text-xs font-semibold text-[#3A2B24] bg-white h-10"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-[#3A2B24] mb-1 block">Description</label>
                <Input
                  value={welcomeForm.description}
                  onChange={(e) => setWelcomeForm({ ...welcomeForm, description: e.target.value })}
                  placeholder="Offer details..."
                  className="rounded-xl border-[#EFE6DD] text-xs text-[#3A2B24] bg-white h-10"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-[#3A2B24] mb-1 block">Shop Button Link</label>
                <Input
                  value={welcomeForm.shopLink}
                  onChange={(e) => setWelcomeForm({ ...welcomeForm, shopLink: e.target.value })}
                  placeholder="/products"
                  className="rounded-xl border-[#EFE6DD] text-xs font-mono text-[#3A2B24] bg-white h-10"
                />
              </div>

              {/* Live Preview */}
              <div className="p-3 bg-[#FFFDFB] rounded-xl border border-[#EFE6DD] space-y-1.5">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#6C5C54]">Preview:</span>
                <div className="p-3.5 rounded-xl bg-gradient-to-br from-white via-[#FFF9F5] to-[#FFF4ED] border border-[#F2C8B5] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                  <div className="space-y-1 max-w-sm">
                    <div className="flex items-center gap-1.5">
                      <span className="inline-flex items-center gap-1 rounded-full bg-[#D89A86]/15 px-2 py-0.5 text-[9px] font-extrabold text-[#D89A86] border border-[#D89A86]/30">
                        ✨ {welcomeForm.badge || "Special Offer"}
                      </span>
                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[9px] font-bold text-emerald-700 border border-emerald-200">
                        🛡️ {welcomeForm.verifiedBadge || "Verified Deal"}
                      </span>
                    </div>
                    <div className="font-serif-brand text-sm font-bold text-[#3A2B24]">
                      {welcomeForm.title} — <span className="text-[#D89A86]">{welcomeForm.discountLabel}</span>
                    </div>
                    <p className="text-[11px] text-[#6C5C54] line-clamp-1">{welcomeForm.description}</p>
                  </div>
                  <div className="flex flex-col sm:items-end gap-1.5 shrink-0">
                    <div className="flex items-center gap-1 rounded-lg border-2 border-dashed border-[#D89A86] bg-white px-2.5 py-1">
                      <span className="font-mono text-xs font-black tracking-widest text-[#3A2B24]">
                        {welcomeForm.code}
                      </span>
                    </div>
                    <span className="btn-pixello-primary text-[11px] font-bold rounded-full px-3 py-1">
                      {welcomeForm.buttonText || "Claim & Copy Code"}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer Buttons */}
            <div className="p-4 border-t border-[#EFE6DD] flex items-center justify-end gap-2.5 bg-[#FFF8F2]/50">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsWelcomeModalOpen(false)}
                className="rounded-full border-[#EFE6DD] text-xs font-bold h-10 px-5 text-[#3A2B24] hover:bg-white"
              >
                Cancel
              </Button>
              <Button
                type="button"
                onClick={handleSaveWelcomeBanner}
                className="btn-pixello-primary rounded-full text-xs font-bold h-10 px-6 shadow-sm flex items-center gap-2"
              >
                <Sparkles className="h-4 w-4 text-white" />
                <span>Save Welcome Banner &amp; Sync</span>
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
