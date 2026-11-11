"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Gift,
  Plus,
  Trash2,
  Save,
  CheckCircle2,
  Eye,
  ExternalLink,
  Sparkles,
  Package,
  Layers,
  ArrowRight,
  Edit,
  X,
  Image as ImageIcon,
  Check,
  Upload,
  RotateCcw,
  Minus,
} from "lucide-react";
import {
  getHamperConfig,
  saveHamperConfig,
  DEFAULT_HAMPER_CONFIG,
  HamperStoreConfig,
  HamperPackagingConfig,
  HamperBoxAddonConfig,
} from "@/lib/hamperConfig";

const PRESET_BOX_IMAGES = [
  { label: "Signature Luxe", url: "https://images.unsplash.com/photo-1549465220-1a8b9238cd48?w=800&q=80" },
  { label: "Wooden Crate", url: "https://images.unsplash.com/photo-1513519245088-0e12902e5a38?w=800&q=80" },
  { label: "Velvet Heart", url: "https://images.unsplash.com/photo-1513151233558-d860c5398176?w=800&q=80" },
  { label: "Eco Kraft", url: "https://images.unsplash.com/photo-1607344645866-009c320c5ab8?w=800&q=80" },
  { label: "Black Luxe", url: "https://images.unsplash.com/photo-1512909006721-3d6018887383?w=800&q=80" },
  { label: "Pastel Gift", url: "https://images.unsplash.com/photo-1513885535751-8b9238bd345a?w=800&q=80" },
];

export default function AdminHamperSettingsPage() {
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [hamperConfig, setHamperConfig] = useState<HamperStoreConfig>(DEFAULT_HAMPER_CONFIG);
  const [isSaving, setIsSaving] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    setHamperConfig(getHamperConfig());

    fetch("/api/settings/hamper")
      .then((r) => r.json())
      .then((data) => {
        if (data.success && data.config) {
          setHamperConfig(data.config);
        }
      })
      .catch(() => {});
  }, []);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const [editingBox, setEditingBox] = useState<HamperPackagingConfig | null>(null);
  const [editingBoxIndex, setEditingBoxIndex] = useState<number | null>(null);
  const [previewBoxIndex, setPreviewBoxIndex] = useState<number>(0);

  const handleOpenEditBoxModal = (pkg: HamperPackagingConfig, index: number) => {
    setEditingBox({
      ...pkg,
      maxCapacity: pkg.maxCapacity !== undefined ? Number(pkg.maxCapacity) : 6,
    });
    setEditingBoxIndex(index);
  };

  const handleSaveEditedBox = async () => {
    if (!editingBox || editingBoxIndex === null) return;
    const updated = [...(hamperConfig.packagingOptions || [])];
    const maxCap = editingBox.maxCapacity !== undefined ? Number(editingBox.maxCapacity) : 6;
    updated[editingBoxIndex] = {
      ...editingBox,
      maxCapacity: maxCap > 0 ? maxCap : 6,
    };
    const updatedConfig = { ...hamperConfig, packagingOptions: updated };
    setHamperConfig(updatedConfig);
    saveHamperConfig(updatedConfig);
    try {
      await fetch("/api/settings/hamper", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ config: updatedConfig }),
      });
      showToast(`✓ Updated packaging box "${editingBox.name}" with ${maxCap} empty slots!`);
    } catch {
      showToast(`✓ Updated packaging box "${editingBox.name}" locally!`);
    }
    setEditingBox(null);
    setEditingBoxIndex(null);
  };

  const handleSaveSingleBox = async (pIdx: number) => {
    const pkg = hamperConfig.packagingOptions[pIdx];
    saveHamperConfig(hamperConfig);
    try {
      await fetch("/api/settings/hamper", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ config: hamperConfig }),
      });
      showToast(`✓ Saved "${pkg.name}" packaging box settings!`);
    } catch {
      showToast(`✓ Saved "${pkg.name}" locally!`);
    }
  };

  const boxFileInputRef = useRef<HTMLInputElement>(null);
  const cardFileInputRef = useRef<HTMLInputElement>(null);
  const activeCardIndexRef = useRef<number | null>(null);

  const compressImageFile = (file: File, callback: (compressed: string) => void) => {
    const reader = new FileReader();
    reader.onload = (evt) => {
      const src = evt.target?.result as string;
      if (!src) return;
      const img = new window.Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        let width = img.width;
        let height = img.height;
        const maxDim = 800;

        if (width > maxDim || height > maxDim) {
          if (width > height) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          } else {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        ctx?.drawImage(img, 0, 0, width, height);
        const compressed = canvas.toDataURL("image/jpeg", 0.85);
        callback(compressed);
      };
      img.src = src;
    };
    reader.readAsDataURL(file);
  };

  const handleModalFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && editingBox) {
      compressImageFile(file, (compressed) => {
        setEditingBox({ ...editingBox, image: compressed });
        showToast("✓ Custom hamper box image uploaded from computer!");
      });
    }
  };

  const handleTriggerUploadForCard = (index: number) => {
    activeCardIndexRef.current = index;
    cardFileInputRef.current?.click();
  };

  const handleCardFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    const index = activeCardIndexRef.current;
    if (file && index !== null && hamperConfig.packagingOptions[index]) {
      compressImageFile(file, (compressed) => {
        const updated = [...hamperConfig.packagingOptions];
        updated[index] = { ...updated[index], image: compressed };
        const updatedConfig = { ...hamperConfig, packagingOptions: updated };
        setHamperConfig(updatedConfig);
        saveHamperConfig(updatedConfig);
        fetch("/api/settings/hamper", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ config: updatedConfig }),
        }).catch(() => {});
        showToast(`✓ Uploaded custom photo for "${updated[index].name}" and synced to customer store!`);
      });
    }
  };

  const handleSaveAll = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setIsSaving(true);
    try {
      saveHamperConfig(hamperConfig);
      await fetch("/api/settings/hamper", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ config: hamperConfig }),
      });
      // Also keep PRD-111 product in sync
      await fetch("/api/products/PRD-111", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          aboutTitle: hamperConfig.aboutTitle || "ABOUT HAMPER",
          aboutPoints: hamperConfig.aboutPoints || DEFAULT_HAMPER_CONFIG.aboutPoints,
        }),
      }).catch(() => {});
      showToast("✓ Hamper settings, about points & packaging boxes updated live!");
    } catch (err) {
      console.error(err);
      showToast("✓ Saved locally and applied to customer storefront.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleAddPackagingBox = () => {
    const newId = `box-${Date.now().toString(36)}`;
    const newBox: HamperPackagingConfig = {
      id: newId,
      name: "Deluxe Keepsake Gift Box",
      price: 199,
      originalPrice: 299,
      tagline: "Satin Ribbon • Magnetic Closure",
      capacityText: "Capacity: Up to 6 handcrafted gifts",
      maxCapacity: 6,
      description: "Rigid luxury keepsake presentation box with premium satin lining and bow ribbon.",
      image: "https://images.unsplash.com/photo-1549465220-1a8b9238cd48?w=800&q=80",
      badge: "Custom Edition",
      enabled: true,
    };
    const updatedOptions = [...(hamperConfig.packagingOptions || []), newBox];
    const updatedConfig = { ...hamperConfig, packagingOptions: updatedOptions };
    setHamperConfig(updatedConfig);
    saveHamperConfig(updatedConfig);
    fetch("/api/settings/hamper", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ config: updatedConfig }),
    }).catch(() => {});
    showToast("✨ Added new hamper packaging box style! You can now customize its name and fee.");
  };

  const handleDeletePackagingBox = (id: string, name: string) => {
    if ((hamperConfig.packagingOptions || []).length <= 1) {
      alert("⚠️ You must have at least one hamper packaging box option available.");
      return;
    }
    if (!window.confirm(`Are you sure you want to delete "${name || id}" from hamper packaging options?`)) {
      return;
    }
    const updatedOptions = (hamperConfig.packagingOptions || []).filter((b) => b.id !== id);
    const updatedConfig = { ...hamperConfig, packagingOptions: updatedOptions };
    setHamperConfig(updatedConfig);
    saveHamperConfig(updatedConfig);
    fetch("/api/settings/hamper", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ config: updatedConfig }),
    }).catch(() => {});
    showToast(`🗑️ Deleted "${name || id}" from packaging options!`);
  };

  const handleAddBoxAddon = () => {
    const newId = `addon-${Date.now().toString(36)}`;
    const newAddon: HamperBoxAddonConfig = {
      id: newId,
      name: "Scented Botanical Potpourri",
      price: 49,
      description: "Fragrant dried rose & lavender petals layered in the box",
      icon: "🌿",
      enabled: true,
    };
    const currentList = hamperConfig.boxAddons || DEFAULT_HAMPER_CONFIG.boxAddons || [];
    const updated = [...currentList, newAddon];
    const updatedConfig = { ...hamperConfig, boxAddons: updated };
    setHamperConfig(updatedConfig);
    saveHamperConfig(updatedConfig);
    fetch("/api/settings/hamper", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ config: updatedConfig }),
    }).catch(() => {});
    showToast("✨ Added new luxury box extra! Customers can select this in Step 2.");
  };

  const handleDeleteBoxAddon = (id: string, name: string) => {
    if (!window.confirm(`Are you sure you want to delete "${name || id}" from box add-ons?`)) return;
    const currentList = hamperConfig.boxAddons || DEFAULT_HAMPER_CONFIG.boxAddons || [];
    const updated = currentList.filter((a) => a.id !== id);
    const updatedConfig = { ...hamperConfig, boxAddons: updated };
    setHamperConfig(updatedConfig);
    saveHamperConfig(updatedConfig);
    fetch("/api/settings/hamper", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ config: updatedConfig }),
    }).catch(() => {});
    showToast(`🗑️ Deleted "${name || id}" from box extras!`);
  };

  const aboutPointsList = hamperConfig.aboutPoints && hamperConfig.aboutPoints.length > 0
    ? hamperConfig.aboutPoints
    : (DEFAULT_HAMPER_CONFIG.aboutPoints || [
        "Master studio handcrafted finish",
        "High-definition vibrant color reproduction",
        "Durable premium materials built to last",
        "Printed & dispatched by verified local studio",
        "Safe packaging & doorstep express delivery",
      ]);

  const handleAddAboutPoint = () => {
    const updatedPoints = [...aboutPointsList, "Verified local studio craftsmanship"];
    const updatedConfig = { ...hamperConfig, aboutPoints: updatedPoints };
    setHamperConfig(updatedConfig);
    saveHamperConfig(updatedConfig);
  };

  const handleUpdateAboutPoint = (index: number, val: string) => {
    const updatedPoints = [...aboutPointsList];
    updatedPoints[index] = val;
    const updatedConfig = { ...hamperConfig, aboutPoints: updatedPoints };
    setHamperConfig(updatedConfig);
    saveHamperConfig(updatedConfig);
  };

  const handleDeleteAboutPoint = (index: number) => {
    if (aboutPointsList.length <= 1) {
      alert("⚠️ You must have at least one highlight point.");
      return;
    }
    const updatedPoints = aboutPointsList.filter((_, i) => i !== index);
    const updatedConfig = { ...hamperConfig, aboutPoints: updatedPoints };
    setHamperConfig(updatedConfig);
    saveHamperConfig(updatedConfig);
  };

  const handleResetAboutHamper = () => {
    const updatedConfig = {
      ...hamperConfig,
      aboutTitle: "ABOUT HAMPER",
      aboutPoints: [
        "Master studio handcrafted finish",
        "High-definition vibrant color reproduction",
        "Durable premium materials built to last",
        "Printed & dispatched by verified local studio",
        "Safe packaging & doorstep express delivery",
      ],
    };
    setHamperConfig(updatedConfig);
    saveHamperConfig(updatedConfig);
    showToast("↺ Reset 'About Hamper' title and points to studio defaults! Click Save to apply.");
  };

  const handleSaveAboutHamperOnly = async () => {
    setIsSaving(true);
    try {
      saveHamperConfig(hamperConfig);
      await fetch("/api/settings/hamper", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ config: hamperConfig }),
      });
      await fetch("/api/products/PRD-111", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          aboutTitle: hamperConfig.aboutTitle || "ABOUT HAMPER",
          aboutPoints: aboutPointsList,
        }),
      }).catch(() => {});
      showToast("✓ 'About Hamper' title & points saved & synced live to customer store!");
    } catch {
      showToast("✓ Saved locally and applied to customer storefront.");
    } finally {
      setIsSaving(false);
    }
  };

  if (!isMounted) {
    return (
      <div className="flex flex-col gap-6 p-6 md:p-8 bg-[#F8F3EE] min-h-screen relative max-w-5xl">
        <h2 className="font-serif-brand text-3xl font-bold text-[#3A2B24]">
          Hamper Settings &amp; Configuration
        </h2>
        <p className="text-xs text-[#6C5C54]">Loading settings...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 p-6 md:p-8 bg-[#F8F3EE] min-h-screen relative max-w-5xl">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-20 right-8 z-50 bg-[#3A2B24] text-white px-5 py-3 rounded-2xl shadow-xl border border-[#D89A86]/40 flex items-center gap-2.5 animate-in fade-in slide-in-from-top-4 duration-300">
          <CheckCircle2 className="h-5 w-5 text-[#D89A86]" />
          <span className="text-xs font-bold">{toastMessage}</span>
        </div>
      )}

      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="h-10 w-10 rounded-2xl bg-[#D89A86]/20 border border-[#D89A86]/40 flex items-center justify-center text-xl">
              🎁
            </div>
            <h2 className="font-serif-brand text-2xl sm:text-3xl font-bold text-[#3A2B24]">
              Hamper Settings &amp; Configuration
            </h2>
          </div>
          <p className="text-xs text-[#6C5C54] mt-1">
            Customize the &ldquo;Build a Hamper [NEW]&rdquo; button in the customer navbar, homepage showcase, and packaging box catalog with live add/delete.
          </p>
        </div>

        <div className="flex items-center gap-2.5 self-start sm:self-auto">
          <Link
            href="/hamper"
            target="_blank"
            className="h-9 px-3.5 rounded-xl border border-[#EFE6DD] bg-white text-[#3A2B24] hover:bg-[#FFF8F2] text-xs font-bold flex items-center gap-1.5 shadow-2xs transition-colors"
          >
            <ExternalLink className="h-3.5 w-3.5 text-[#D89A86]" /> View Live Hamper Page
          </Link>
          <Button
            type="button"
            onClick={() => handleSaveAll()}
            disabled={isSaving}
            className="btn-pixello-primary text-xs font-bold rounded-xl px-5 h-9 shadow-md flex items-center gap-1.5 cursor-pointer"
          >
            <Save className="h-4 w-4 text-white" />
            {isSaving ? "Saving..." : "Save Settings"}
          </Button>
        </div>
      </div>

      {/* Quick Overview Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 bg-white rounded-2xl border border-[#EFE6DD] shadow-2xs flex items-center gap-3.5">
          <div className="h-11 w-11 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 flex items-center justify-center text-xl">
            📦
          </div>
          <div>
            <span className="text-[10px] uppercase font-bold text-[#6C5C54] tracking-wider block">Packaging Styles</span>
            <span className="text-lg font-black text-[#3A2B24]">
              {hamperConfig.packagingOptions?.length || 0} Boxes Available
            </span>
          </div>
        </div>

        <div className="p-4 bg-white rounded-2xl border border-[#EFE6DD] shadow-2xs flex items-center gap-3.5">
          <div className="h-11 w-11 rounded-xl bg-[#FFF8F2] border border-[#D89A86]/30 text-[#D89A86] flex items-center justify-center text-xl">
            🏷️
          </div>
          <div>
            <span className="text-[10px] uppercase font-bold text-[#6C5C54] tracking-wider block">Navbar Pill</span>
            <span className="text-lg font-black text-[#3A2B24]">
              {hamperConfig.nav.enabled ? `"${hamperConfig.nav.label}"` : "Hidden (Disabled)"}
            </span>
          </div>
        </div>

        <div className="p-4 bg-white rounded-2xl border border-[#EFE6DD] shadow-2xs flex items-center gap-3.5">
          <div className="h-11 w-11 rounded-xl bg-sky-50 border border-sky-200 text-sky-700 flex items-center justify-center text-xl">
            🏡
          </div>
          <div>
            <span className="text-[10px] uppercase font-bold text-[#6C5C54] tracking-wider block">Homepage Banner</span>
            <span className="text-lg font-black text-[#3A2B24]">
              {hamperConfig.homepage.enabled ? "Active on Homepage" : "Disabled"}
            </span>
          </div>
        </div>
      </div>

      <form onSubmit={handleSaveAll} className="flex flex-col gap-6">

        {/* ========================================================================= */}
        {/* CARD 1: TOP NAVBAR BUTTON & PILL CONFIGURATION */}
        {/* ========================================================================= */}
        <Card className="border border-[#EFE6DD] bg-white rounded-3xl shadow-sm overflow-hidden">
          <CardContent className="p-6 md:p-8 flex flex-col gap-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-[#EFE6DD] gap-3">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-2xl bg-[#FFF8F2] border border-[#EFE6DD] flex items-center justify-center text-[#D89A86] shadow-2xs">
                  <Gift className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-serif-brand text-xl font-bold text-[#3A2B24]">
                    Customer Navbar Button Options
                  </h3>
                  <p className="text-xs text-[#6C5C54] mt-0.5 font-medium">
                    Customize the pill button displayed in the customer storefront header.
                  </p>
                </div>
              </div>
              <Badge className="bg-[#FFF8F2] text-[#D89A86] border-[#D89A86]/40 text-xs font-bold px-3 py-1 rounded-full self-start sm:self-auto">
                <Sparkles className="h-3 w-3 mr-1 text-[#D89A86]" /> Storefront Header
              </Badge>
            </div>

            {/* LIVE NAVBAR PILL VISUAL PREVIEW */}
            <div className="p-5 bg-gradient-to-br from-[#FFF8F2] via-[#FAF3EC] to-[#F5ECE3] rounded-2xl border-2 border-[#D89A86]/30 flex flex-col gap-3 shadow-2xs">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-[#6C5C54] uppercase tracking-wider flex items-center gap-1.5">
                  <Eye className="h-3.5 w-3.5 text-[#D89A86]" /> Live Storefront Navbar Preview:
                </span>
                <span className="text-[10px] font-bold text-[#D89A86] bg-white px-2.5 py-0.5 rounded-full border border-[#D89A86]/30">
                  {hamperConfig.nav.enabled ? "Visible in Navbar" : "Hidden from Navbar"}
                </span>
              </div>

              {/* Exact Preview Replicating Customer Header */}
              <div className="bg-white/95 p-4 rounded-xl border border-[#EFE6DD] flex items-center justify-center sm:justify-start gap-4">
                <span className="text-xs text-[#6C5C54] font-medium hidden sm:inline">Top Navigation Item:</span>

                {hamperConfig.nav.enabled ? (
                  <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#FFF8F2] border border-[#D89A86]/40 shadow-2xs select-none">
                    <Gift className="h-4 w-4 text-[#D89A86]" />
                    <span className="text-sm font-bold text-[#3A2B24]">
                      {hamperConfig.nav.label || "Build a Hamper"}
                    </span>
                    {hamperConfig.nav.showBadge && (
                      <span className="text-[9px] font-extrabold bg-[#D89A86] text-white px-1.5 py-0.5 rounded-full uppercase tracking-wider">
                        {hamperConfig.nav.badgeText || "NEW"}
                      </span>
                    )}
                  </div>
                ) : (
                  <div className="text-xs font-semibold text-rose-600 bg-rose-50 border border-rose-200 px-3 py-1.5 rounded-full flex items-center gap-1.5">
                    🚫 Navigation pill is currently disabled and hidden from customer header.
                  </div>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {/* Toggle Show/Hide in Navbar */}
              <div className="p-4 bg-[#FAF7F4] rounded-2xl border border-[#EFE6DD] flex flex-col justify-between gap-3">
                <div>
                  <label className="text-xs font-bold text-[#3A2B24] block">Show in Customer Navbar</label>
                  <p className="text-[10px] text-[#6C5C54] mt-0.5">Toggle visibility of the &ldquo;Build a Hamper&rdquo; pill in top navigation.</p>
                </div>
                <Button
                  type="button"
                  onClick={() => setHamperConfig({
                    ...hamperConfig,
                    nav: { ...hamperConfig.nav, enabled: !hamperConfig.nav.enabled },
                  })}
                  className={`h-9 px-4 rounded-xl text-xs font-bold cursor-pointer transition-all ${
                    hamperConfig.nav.enabled
                      ? "bg-emerald-600 hover:bg-emerald-700 text-white"
                      : "bg-slate-200 hover:bg-slate-300 text-slate-700"
                  }`}
                >
                  {hamperConfig.nav.enabled ? "✓ Enabled (Visible)" : "✕ Disabled (Hidden)"}
                </Button>
              </div>

              {/* Navbar Button Label */}
              <div>
                <label className="text-xs font-bold text-[#3A2B24] mb-1.5 block">
                  Button Label Text *
                </label>
                <Input
                  value={hamperConfig.nav.label}
                  onChange={(e) => setHamperConfig({
                    ...hamperConfig,
                    nav: { ...hamperConfig.nav, label: e.target.value },
                  })}
                  placeholder="e.g. Build a Hamper"
                  className="rounded-xl border-[#EFE6DD] text-xs font-bold text-[#3A2B24] bg-white h-11"
                  required
                />
                <p className="text-[10px] text-[#6C5C54] mt-1">Default: &ldquo;Build a Hamper&rdquo;</p>
              </div>

              {/* Badge Text */}
              <div>
                <label className="text-xs font-bold text-[#3A2B24] mb-1.5 block">
                  Pill Badge Text
                </label>
                <Input
                  value={hamperConfig.nav.badgeText}
                  onChange={(e) => setHamperConfig({
                    ...hamperConfig,
                    nav: { ...hamperConfig.nav, badgeText: e.target.value },
                  })}
                  placeholder="e.g. NEW, HOT, GIFT, 20% OFF"
                  className="rounded-xl border-[#EFE6DD] text-xs font-extrabold text-[#D89A86] bg-white h-11"
                />
                <p className="text-[10px] text-[#6C5C54] mt-1">Displayed in the pink badge pill (e.g. &ldquo;NEW&rdquo;)</p>
              </div>

              {/* Toggle Show Badge */}
              <div className="p-4 bg-[#FAF7F4] rounded-2xl border border-[#EFE6DD] flex flex-col justify-between gap-3">
                <div>
                  <label className="text-xs font-bold text-[#3A2B24] block">Show Badge Pill</label>
                  <p className="text-[10px] text-[#6C5C54] mt-0.5">Show or hide the small badge (e.g. &ldquo;NEW&rdquo;) beside the label.</p>
                </div>
                <Button
                  type="button"
                  onClick={() => setHamperConfig({
                    ...hamperConfig,
                    nav: { ...hamperConfig.nav, showBadge: !hamperConfig.nav.showBadge },
                  })}
                  className={`h-9 px-4 rounded-xl text-xs font-bold cursor-pointer transition-all ${
                    hamperConfig.nav.showBadge
                      ? "bg-[#D89A86] hover:bg-[#c78672] text-white"
                      : "bg-slate-200 hover:bg-slate-300 text-slate-700"
                  }`}
                >
                  {hamperConfig.nav.showBadge ? "✓ Badge Shown" : "✕ Badge Hidden"}
                </Button>
              </div>

              {/* Target URL */}
              <div>
                <label className="text-xs font-bold text-[#3A2B24] mb-1.5 block">
                  Target Page Link (URL) *
                </label>
                <Input
                  value={hamperConfig.nav.url}
                  onChange={(e) => setHamperConfig({
                    ...hamperConfig,
                    nav: { ...hamperConfig.nav, url: e.target.value },
                  })}
                  placeholder="e.g. /hamper"
                  className="rounded-xl border-[#EFE6DD] text-xs font-mono font-medium text-[#3A2B24] bg-white h-11"
                  required
                />
                <p className="text-[10px] text-[#6C5C54] mt-1">Default: &ldquo;/hamper&rdquo;</p>
              </div>

              {/* Quick Access Icon on Top Right */}
              <div className="p-4 bg-[#FAF7F4] rounded-2xl border border-[#EFE6DD] flex flex-col justify-between gap-3">
                <div>
                  <label className="text-xs font-bold text-[#3A2B24] block">Top Right Header Gift Icon</label>
                  <p className="text-[10px] text-[#6C5C54] mt-0.5">Quick access round gift button beside wishlist &amp; cart.</p>
                </div>
                <Button
                  type="button"
                  onClick={() => setHamperConfig({
                    ...hamperConfig,
                    nav: { ...hamperConfig.nav, showQuickAccessIcon: !hamperConfig.nav.showQuickAccessIcon },
                  })}
                  className={`h-9 px-4 rounded-xl text-xs font-bold cursor-pointer transition-all ${
                    hamperConfig.nav.showQuickAccessIcon
                      ? "bg-emerald-600 hover:bg-emerald-700 text-white"
                      : "bg-slate-200 hover:bg-slate-300 text-slate-700"
                  }`}
                >
                  {hamperConfig.nav.showQuickAccessIcon ? "✓ Icon Visible" : "✕ Icon Hidden"}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* ========================================================================= */}
        {/* CARD 2: HAMPER PRESENTATION BOXES & PACKAGING PRICING (WITH ADD & DELETE) */}
        {/* ========================================================================= */}
        <Card className="border border-[#EFE6DD] bg-white rounded-3xl shadow-sm overflow-hidden">
          <CardContent className="p-6 md:p-8 flex flex-col gap-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-[#EFE6DD] gap-3">
              <div>
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-2xl bg-[#FFF8F2] border border-[#EFE6DD] flex items-center justify-center text-[#D89A86] shadow-2xs">
                    <Package className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-serif-brand text-xl font-bold text-[#3A2B24]">
                      Hamper Presentation Boxes &amp; Packaging Pricing
                    </h3>
                    <p className="text-xs text-[#6C5C54] mt-0.5 font-medium">
                      Add new packaging box styles, delete unused ones, and set individual box fees.
                    </p>
                  </div>
                </div>
              </div>

              <Button
                type="button"
                onClick={handleAddPackagingBox}
                className="h-10 px-4.5 rounded-xl bg-[#D89A86] hover:bg-[#c78672] text-white text-xs font-bold flex items-center gap-1.5 shadow-xs cursor-pointer transition-all self-start sm:self-auto"
              >
                <Plus className="h-4 w-4" /> Add New Packaging Box
              </Button>
            </div>

            {hamperConfig.packagingOptions && hamperConfig.packagingOptions.length > 0 ? (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4.5">
                {hamperConfig.packagingOptions.map((pkg, pIdx) => (
                  <div
                    key={pkg.id || pIdx}
                    className="p-4 bg-[#FAF7F4] rounded-2xl border border-[#EFE6DD] flex flex-col justify-between gap-3 relative shadow-2xs hover:shadow-xs transition-shadow"
                  >
                    {/* Card Top Row with Title, Badge, ID and Actions */}
                    <div className="flex items-center justify-between pb-2.5 border-b border-[#EFE6DD] gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="text-base flex-shrink-0">🎁</span>
                        <span className="text-xs font-bold text-[#3A2B24] truncate">{pkg.name || "Untitled Box"}</span>
                        {pkg.badge && (
                          <span className="text-[9px] font-extrabold bg-[#D89A86] text-white px-2 py-0.5 rounded-full flex-shrink-0">
                            {pkg.badge}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-1.5 flex-shrink-0">
                        <span className="text-[10px] font-mono font-bold text-[#6C5C54] bg-white px-2 py-0.5 rounded-md border border-[#EFE6DD]">
                          {pkg.id}
                        </span>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => handleOpenEditBoxModal(pkg, pIdx)}
                          className="h-7 px-2.5 bg-[#FFF8F2] border-[#D89A86] text-[#D89A86] hover:bg-[#F2C8B5]/40 rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer transition-colors shadow-2xs"
                          title="Open full edit options modal for this packaging box"
                        >
                          <Edit className="h-3 w-3" /> Edit
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          onClick={() => handleSaveSingleBox(pIdx)}
                          className="h-7 px-2.5 bg-[#3A2B24] hover:bg-[#523d33] text-white rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer transition-colors shadow-2xs"
                          title="Save changes to this box"
                        >
                          <Save className="h-3 w-3" /> Save
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeletePackagingBox(pkg.id, pkg.name)}
                          className="h-7 px-2 text-rose-600 hover:text-rose-700 hover:bg-rose-50 rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer transition-colors"
                          title="Delete this hamper packaging box"
                        >
                          <Trash2 className="h-3.5 w-3.5" /> Delete
                        </Button>
                      </div>
                    </div>

                    {/* Card Body with Thumbnail & Editable Fields */}
                    <div className="flex gap-3 items-start">
                      <div className="flex flex-col items-center gap-1 shrink-0">
                        <div
                          onClick={() => handleTriggerUploadForCard(pIdx)}
                          className="h-16 w-16 rounded-xl overflow-hidden bg-white border border-[#EFE6DD] cursor-pointer group relative shadow-2xs hover:border-[#D89A86]"
                          title="Click to upload custom box photo from your computer"
                        >
                          <img
                            src={pkg.image || "https://images.unsplash.com/photo-1549465220-1a8b9238cd48?w=800&q=80"}
                            alt={pkg.name}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                          />
                          <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center transition-opacity text-[9px] text-white font-bold p-1 text-center">
                            <Upload className="h-3.5 w-3.5 mb-0.5 text-white" />
                            Upload
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleTriggerUploadForCard(pIdx)}
                          className="text-[10px] font-bold text-[#D89A86] hover:underline cursor-pointer flex items-center gap-0.5"
                        >
                          <Upload className="h-2.5 w-2.5" /> Upload
                        </button>
                      </div>

                      <div className="flex-1 grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                        <div className="sm:col-span-2">
                          <label className="text-[10px] font-bold text-[#6C5C54] mb-1 block">Display Name</label>
                          <Input
                            value={pkg.name}
                            onChange={(e) => {
                              const updated = [...hamperConfig.packagingOptions];
                              updated[pIdx] = { ...updated[pIdx], name: e.target.value };
                              setHamperConfig({ ...hamperConfig, packagingOptions: updated });
                            }}
                            placeholder="e.g. Signature Luxe Hardbox"
                            className="rounded-xl border-[#EFE6DD] text-xs font-bold text-[#3A2B24] bg-white h-8"
                          />
                        </div>

                        <div>
                          <label className="text-[10px] font-bold text-[#6C5C54] mb-1 block">Box Fee (₹)</label>
                          <div className="relative">
                            <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs font-bold text-[#6C5C54]">₹</span>
                            <Input
                              type="number"
                              min="0"
                              value={pkg.price}
                              onChange={(e) => {
                                const updated = [...hamperConfig.packagingOptions];
                                updated[pIdx] = { ...updated[pIdx], price: Number(e.target.value) || 0 };
                                setHamperConfig({ ...hamperConfig, packagingOptions: updated });
                              }}
                              className="pl-6 rounded-xl border-[#EFE6DD] text-xs font-extrabold text-[#3A2B24] bg-white h-8"
                            />
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                      <div>
                        <label className="text-[10px] font-bold text-[#6C5C54] mb-1 block">Badge Tag (Optional)</label>
                        <Input
                          value={pkg.badge || ""}
                          onChange={(e) => {
                            const updated = [...hamperConfig.packagingOptions];
                            updated[pIdx] = { ...updated[pIdx], badge: e.target.value };
                            setHamperConfig({ ...hamperConfig, packagingOptions: updated });
                          }}
                          placeholder="e.g. Most Popular"
                          className="rounded-xl border-[#EFE6DD] text-xs text-[#D89A86] font-bold bg-white h-8"
                        />
                      </div>

                      <div className="sm:col-span-2">
                        <label className="text-[10px] font-bold text-[#6C5C54] mb-1 block">Description</label>
                        <Input
                          value={pkg.description}
                          onChange={(e) => {
                            const updated = [...hamperConfig.packagingOptions];
                            updated[pIdx] = { ...updated[pIdx], description: e.target.value };
                            setHamperConfig({ ...hamperConfig, packagingOptions: updated });
                          }}
                          placeholder="e.g. Rigid magnetic-close gift box with satin ribbon..."
                          className="rounded-xl border-[#EFE6DD] text-xs text-[#6C5C54] bg-white h-8"
                        />
                      </div>
                    </div>

                    {/* EMPTY SLOTS CONTROLLER FOR THIS PACKAGING BOX */}
                    <div className="flex flex-wrap items-center justify-between gap-2 p-2.5 bg-[#FFFBF7] rounded-xl border border-[#EFE6DD]">
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] font-bold text-[#3A2B24] flex items-center gap-1">
                          <span>📦 Empty Slots in Box:</span>
                        </span>
                        <span className="bg-[#FFF2EB] text-[#D89A86] border border-[#F3DACF] font-extrabold text-[11px] px-2 py-0.5 rounded-full">
                          {pkg.maxCapacity || 6} Slots
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        {/* Stepper controls */}
                        <div className="flex items-center border border-[#EFE6DD] rounded-lg bg-white overflow-hidden shadow-2xs h-7">
                          <button
                            type="button"
                            onClick={() => {
                              const updated = [...hamperConfig.packagingOptions];
                              const newCap = Math.max(1, (updated[pIdx].maxCapacity || 6) - 1);
                              updated[pIdx] = {
                                ...updated[pIdx],
                                maxCapacity: newCap,
                                capacityText: `Capacity: Up to ${newCap} handcrafted gifts`
                              };
                              setHamperConfig({ ...hamperConfig, packagingOptions: updated });
                            }}
                            className="px-2 h-full hover:bg-[#FFF8F2] text-[#3A2B24] font-bold text-xs border-r border-[#EFE6DD] cursor-pointer"
                            title="Decrease empty slot count"
                          >
                            -
                          </button>
                          <input
                            type="number"
                            min="1"
                            max="30"
                            value={pkg.maxCapacity || 6}
                            onChange={(e) => {
                              const val = Math.max(1, parseInt(e.target.value) || 1);
                              const updated = [...hamperConfig.packagingOptions];
                              updated[pIdx] = {
                                ...updated[pIdx],
                                maxCapacity: val,
                                capacityText: `Capacity: Up to ${val} handcrafted gifts`
                              };
                              setHamperConfig({ ...hamperConfig, packagingOptions: updated });
                            }}
                            className="w-10 text-center font-extrabold text-xs text-[#3A2B24] outline-none"
                          />
                          <button
                            type="button"
                            onClick={() => {
                              const updated = [...hamperConfig.packagingOptions];
                              const newCap = (updated[pIdx].maxCapacity || 6) + 1;
                              updated[pIdx] = {
                                ...updated[pIdx],
                                maxCapacity: newCap,
                                capacityText: `Capacity: Up to ${newCap} handcrafted gifts`
                              };
                              setHamperConfig({ ...hamperConfig, packagingOptions: updated });
                            }}
                            className="px-2 h-full hover:bg-[#FFF8F2] text-[#3A2B24] font-bold text-xs border-l border-[#EFE6DD] cursor-pointer"
                            title="Increase empty slot count"
                          >
                            +
                          </button>
                        </div>

                        {/* + Add Empty Slot Button */}
                        <button
                          type="button"
                          onClick={() => {
                            const updated = [...hamperConfig.packagingOptions];
                            const newCap = (updated[pIdx].maxCapacity || 6) + 1;
                            updated[pIdx] = {
                              ...updated[pIdx],
                              maxCapacity: newCap,
                              capacityText: `Capacity: Up to ${newCap} handcrafted gifts`
                            };
                            setHamperConfig({ ...hamperConfig, packagingOptions: updated });
                            showToast(`✨ Added empty slot to "${pkg.name}"! Now configured with ${newCap} slots.`);
                          }}
                          className="h-7 px-2.5 bg-[#FFF2EB] hover:bg-[#ffe5d9] text-[#D89A86] border border-[#F3DACF] rounded-lg text-[10px] font-bold flex items-center gap-1 transition-colors cursor-pointer"
                        >
                          <Plus className="h-3 w-3" /> + Add Empty Slot
                        </button>
                      </div>
                    </div>

                    {/* Card Footer Quick Action */}
                    <div className="flex items-center justify-between pt-2 border-t border-[#EFE6DD]/70 text-[11px] text-[#6C5C54]">
                      <span className="flex items-center gap-1">
                        <span>📦 {pkg.capacityText || "Holds curated gifts"}</span>
                        <span>•</span>
                        <span>MRP: ₹{pkg.originalPrice || pkg.price + 100}</span>
                      </span>
                      <button
                        type="button"
                        onClick={() => handleOpenEditBoxModal(pkg, pIdx)}
                        className="text-xs font-bold text-[#D89A86] hover:underline cursor-pointer flex items-center gap-1"
                      >
                        <Edit className="h-3 w-3" /> Full Edit Modal →
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* LIVE KEEPSAKE BOX EMPTY SLOTS PREVIEW & SIMULATOR */}
              {hamperConfig.packagingOptions && hamperConfig.packagingOptions.length > 0 && (() => {
                const currentPreviewBox = hamperConfig.packagingOptions[previewBoxIndex] || hamperConfig.packagingOptions[0];
                const currentSlots = currentPreviewBox?.maxCapacity || 6;

                return (
                  <div className="mt-6 pt-6 border-t border-[#EFE6DD] bg-[#FCF8F5] p-5 md:p-6 rounded-3xl border border-[#EAE0D5] flex flex-col gap-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-[11px] font-extrabold uppercase tracking-widest text-[#D89A86]">
                            Customer Storefront Simulation
                          </span>
                          <Badge className="bg-[#E8F5E9] text-[#2E7D32] border-[#C8E6C9] text-[10px] font-bold">
                            Live Sync Active
                          </Badge>
                        </div>
                        <h4 className="font-serif-brand text-lg font-bold text-[#3A2B24]">
                          Live Keepsake Box Empty Slots Preview
                        </h4>
                        <p className="text-xs text-[#6C5C54]">
                          This is the exact interactive box preview displayed on the customer&apos;s screen at <code className="bg-white px-1.5 py-0.5 rounded text-[11px] font-mono border">/hamper</code>. Click <strong>+ Add Empty Slot</strong> below to immediately add slots to this box.
                        </p>
                      </div>

                      {/* Switch box preview selector */}
                      <div className="flex items-center gap-2 self-start sm:self-auto">
                        <label className="text-xs font-bold text-[#6C5C54]">Preview Box:</label>
                        <select
                          value={previewBoxIndex}
                          onChange={(e) => setPreviewBoxIndex(Number(e.target.value))}
                          className="bg-white border border-[#EFE6DD] rounded-xl px-3 py-1.5 text-xs font-bold text-[#3A2B24] outline-none shadow-2xs cursor-pointer"
                        >
                          {hamperConfig.packagingOptions.map((b, idx) => (
                            <option key={b.id || idx} value={idx}>
                              {b.name} ({b.maxCapacity || 6} Slots)
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    {/* Storefront Visual Box Card Simulation */}
                    <div className="max-w-xl mx-auto w-full bg-white rounded-3xl p-5 md:p-6 shadow-sm border border-[#EAE0D5] space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <span className="text-[10px] font-extrabold text-[#D89A86] tracking-wider uppercase block">
                            LIVE KEEPSAKE BOX PREVIEW
                          </span>
                          <h3 className="font-serif-brand text-lg font-bold text-[#3A2B24]">
                            {currentPreviewBox.name}
                          </h3>
                        </div>
                        <Badge className="bg-[#FFF2EB] text-[#D89A86] border-[#F3DACF] font-bold text-xs px-2.5 py-1">
                          0 / {currentSlots} Slots Filled
                        </Badge>
                      </div>

                      {/* Visual Keepsake Box Container */}
                      <div className="bg-[#B98875] p-3 md:p-4 rounded-2xl shadow-inner relative">
                        {/* Box Lid Ribbon Badge */}
                        <div className="flex justify-center mb-3">
                          <span className="bg-[#FCD34D] text-[#78350F] text-[10px] font-black px-3 py-0.5 rounded-full shadow-xs flex items-center gap-1 uppercase tracking-wider">
                            ★ Magnetic Closure • Wax Seal
                          </span>
                        </div>

                        {/* Empty Slots Grid matching customer storefront */}
                        <div className="grid grid-cols-2 gap-2.5 bg-white/20 p-3 rounded-xl backdrop-blur-2xs max-h-72 overflow-y-auto">
                          {Array.from({ length: currentSlots }).map((_, i) => (
                            <div
                              key={`live-slot-${i}`}
                              className="border-2 border-dashed border-white/60 bg-white/40 rounded-xl p-3 flex flex-col items-center justify-center text-center h-14 transition-colors hover:bg-white/60"
                            >
                              <Plus className="h-3.5 w-3.5 text-[#3A2B24]" />
                              <span className="text-[10px] font-bold text-[#3A2B24]">
                                + Empty Slot ({i + 1} of {currentSlots})
                              </span>
                            </div>
                          ))}
                        </div>

                        {/* Box Bottom Accent */}
                        <div className="mt-3 pt-2 border-t border-black/10 flex items-center justify-between text-[10px] text-white/90 font-medium">
                          <span>Bedding: Blush Rose &amp; Gold</span>
                          <span className="font-bold">Wax Sealed Archival Box</span>
                        </div>
                      </div>

                      {/* Interactive Admin Controls for this Box */}
                      <div className="pt-2 flex flex-wrap items-center justify-between gap-3 border-t border-[#EFE6DD]">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-[#3A2B24]">Manage Slots:</span>
                          <div className="flex items-center border border-[#EFE6DD] rounded-xl bg-white overflow-hidden shadow-2xs h-8">
                            <button
                              type="button"
                              onClick={() => {
                                const updated = [...hamperConfig.packagingOptions];
                                const newCap = Math.max(1, (updated[previewBoxIndex].maxCapacity || 6) - 1);
                                updated[previewBoxIndex] = {
                                  ...updated[previewBoxIndex],
                                  maxCapacity: newCap,
                                  capacityText: `Capacity: Up to ${newCap} handcrafted gifts`
                                };
                                setHamperConfig({ ...hamperConfig, packagingOptions: updated });
                              }}
                              className="px-3 h-full hover:bg-[#FFF8F2] text-[#3A2B24] font-bold text-xs border-r border-[#EFE6DD] cursor-pointer"
                              title="Remove slot"
                            >
                              -
                            </button>
                            <span className="w-10 text-center font-extrabold text-xs text-[#3A2B24]">
                              {currentSlots}
                            </span>
                            <button
                              type="button"
                              onClick={() => {
                                const updated = [...hamperConfig.packagingOptions];
                                const newCap = (updated[previewBoxIndex].maxCapacity || 6) + 1;
                                updated[previewBoxIndex] = {
                                  ...updated[previewBoxIndex],
                                  maxCapacity: newCap,
                                  capacityText: `Capacity: Up to ${newCap} handcrafted gifts`
                                };
                                setHamperConfig({ ...hamperConfig, packagingOptions: updated });
                              }}
                              className="px-3 h-full hover:bg-[#FFF8F2] text-[#3A2B24] font-bold text-xs border-l border-[#EFE6DD] cursor-pointer"
                              title="Add slot"
                            >
                              +
                            </button>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <Button
                            type="button"
                            onClick={() => {
                              const updated = [...hamperConfig.packagingOptions];
                              const newCap = (updated[previewBoxIndex].maxCapacity || 6) + 1;
                              updated[previewBoxIndex] = {
                                ...updated[previewBoxIndex],
                                maxCapacity: newCap,
                                capacityText: `Capacity: Up to ${newCap} handcrafted gifts`
                              };
                              setHamperConfig({ ...hamperConfig, packagingOptions: updated });
                              showToast(`✨ Added empty slot to "${currentPreviewBox.name}"! Total slots: ${newCap}`);
                            }}
                            className="h-8 px-3.5 bg-[#FFF2EB] hover:bg-[#ffe5d9] text-[#D89A86] border border-[#F3DACF] rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                          >
                            <Plus className="h-3.5 w-3.5" /> + Add Empty Slot
                          </Button>

                          <Button
                            type="button"
                            onClick={() => handleSaveSingleBox(previewBoxIndex)}
                            className="h-8 px-4 bg-[#D89A86] hover:bg-[#c78672] text-white text-xs font-bold rounded-xl shadow-2xs flex items-center gap-1.5 cursor-pointer"
                          >
                            <CheckCircle2 className="h-3.5 w-3.5" /> Save Changes Live
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })()}
              </>
            ) : (
              <div className="p-8 text-center bg-[#FAF7F4] border-2 border-dashed border-[#EFE6DD] rounded-2xl flex flex-col items-center justify-center gap-3">
                <span className="text-3xl">📦</span>
                <p className="text-xs font-bold text-[#3A2B24]">No Hamper Packaging Boxes Configured</p>
                <Button
                  type="button"
                  onClick={handleAddPackagingBox}
                  className="h-9 px-4 rounded-xl bg-[#D89A86] text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                >
                  <Plus className="h-4 w-4" /> Add First Packaging Box
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* ========================================================================= */}
        {/* CARD 3: LUXURY BOX EXTRAS & ADD-ONS IN THE SAME HAMPER BOX */}
        {/* ========================================================================= */}
        <Card className="border border-[#EFE6DD] bg-white rounded-3xl shadow-sm overflow-hidden">
          <CardContent className="p-6 md:p-8 flex flex-col gap-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-[#EFE6DD] gap-3">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-2xl bg-[#FFF8F2] border border-[#EFE6DD] flex items-center justify-center text-[#D89A86] shadow-2xs">
                  <Sparkles className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-serif-brand text-xl font-bold text-[#3A2B24]">
                    Luxury Box Extras &amp; Options in Same Hamper Box
                  </h3>
                  <p className="text-xs text-[#6C5C54] mt-0.5 font-medium">
                    Manage the festive accents and extras customers can add and pack inside their hamper box.
                  </p>
                </div>
              </div>

              <Button
                type="button"
                onClick={handleAddBoxAddon}
                className="h-10 px-4.5 rounded-xl bg-[#D89A86] hover:bg-[#c78672] text-white text-xs font-bold flex items-center gap-1.5 shadow-xs cursor-pointer transition-all self-start sm:self-auto"
              >
                <Plus className="h-4 w-4" /> Add Box Extra Option
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {(hamperConfig.boxAddons || DEFAULT_HAMPER_CONFIG.boxAddons || []).map((addon, aIdx) => (
                <div
                  key={addon.id || aIdx}
                  className="p-4 bg-[#FAF7F4] rounded-2xl border border-[#EFE6DD] flex flex-col gap-3 shadow-2xs hover:shadow-xs transition-shadow"
                >
                  <div className="flex items-center justify-between pb-2 border-b border-[#EFE6DD]">
                    <div className="flex items-center gap-2">
                      <span className="text-xl">{addon.icon || "✨"}</span>
                      <span className="text-xs font-bold text-[#3A2B24]">{addon.name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-mono font-bold text-[#6C5C54] bg-white px-2 py-0.5 rounded-md border border-[#EFE6DD]">
                        {addon.id}
                      </span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteBoxAddon(addon.id, addon.name)}
                        className="h-7 px-2 text-rose-600 hover:text-rose-700 hover:bg-rose-50 rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer"
                      >
                        <Trash2 className="h-3.5 w-3.5" /> Delete
                      </Button>
                    </div>
                  </div>

                  <div className="grid grid-cols-4 gap-2.5">
                    <div className="col-span-1">
                      <label className="text-[10px] font-bold text-[#6C5C54] mb-1 block">Icon</label>
                      <Input
                        value={addon.icon || ""}
                        onChange={(e) => {
                          const currentList = [...(hamperConfig.boxAddons || DEFAULT_HAMPER_CONFIG.boxAddons || [])];
                          currentList[aIdx] = { ...currentList[aIdx], icon: e.target.value };
                          setHamperConfig({ ...hamperConfig, boxAddons: currentList });
                        }}
                        placeholder="💡"
                        className="rounded-xl border-[#EFE6DD] text-center text-sm font-bold bg-white h-9"
                      />
                    </div>
                    <div className="col-span-2">
                      <label className="text-[10px] font-bold text-[#6C5C54] mb-1 block">Option Name</label>
                      <Input
                        value={addon.name}
                        onChange={(e) => {
                          const currentList = [...(hamperConfig.boxAddons || DEFAULT_HAMPER_CONFIG.boxAddons || [])];
                          currentList[aIdx] = { ...currentList[aIdx], name: e.target.value };
                          setHamperConfig({ ...hamperConfig, boxAddons: currentList });
                        }}
                        placeholder="e.g. Warm Fairy Lights"
                        className="rounded-xl border-[#EFE6DD] text-xs font-bold text-[#3A2B24] bg-white h-9"
                      />
                    </div>
                    <div className="col-span-1">
                      <label className="text-[10px] font-bold text-[#6C5C54] mb-1 block">Price (₹)</label>
                      <Input
                        type="number"
                        min="0"
                        value={addon.price}
                        onChange={(e) => {
                          const currentList = [...(hamperConfig.boxAddons || DEFAULT_HAMPER_CONFIG.boxAddons || [])];
                          currentList[aIdx] = { ...currentList[aIdx], price: Number(e.target.value) || 0 };
                          setHamperConfig({ ...hamperConfig, boxAddons: currentList });
                        }}
                        className="rounded-xl border-[#EFE6DD] text-xs font-extrabold text-[#D89A86] bg-white h-9 text-right"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-[#6C5C54] mb-1 block">Customer Description</label>
                    <Input
                      value={addon.description}
                      onChange={(e) => {
                        const currentList = [...(hamperConfig.boxAddons || DEFAULT_HAMPER_CONFIG.boxAddons || [])];
                        currentList[aIdx] = { ...currentList[aIdx], description: e.target.value };
                        setHamperConfig({ ...hamperConfig, boxAddons: currentList });
                      }}
                      placeholder="e.g. Glowing battery-powered copper string lights..."
                      className="rounded-xl border-[#EFE6DD] text-xs text-[#6C5C54] bg-white h-9"
                    />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* ========================================================================= */}
        {/* CARD 4: "ABOUT HAMPER" HIGHLIGHTS & QUALITY GUARANTEES EDITOR */}
        {/* ========================================================================= */}
        <Card className="border border-[#EFE6DD] bg-white rounded-3xl shadow-sm overflow-hidden">
          <CardContent className="p-6 md:p-8 flex flex-col gap-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-[#EFE6DD] gap-3">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-2xl bg-[#FFF8F2] border border-[#EFE6DD] flex items-center justify-center text-[#D89A86] shadow-2xs">
                  <Sparkles className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-serif-brand text-xl font-bold text-[#3A2B24]">
                    ✨ &quot;About Hamper&quot; Highlights &amp; Quality Guarantees
                  </h3>
                  <p className="text-xs text-[#6C5C54] mt-0.5 font-medium">
                    Edit the &ldquo;ABOUT HAMPER&rdquo; title and bullet points displayed on the customer product page (/product/PRD-111).
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 self-start sm:self-auto flex-wrap">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleResetAboutHamper}
                  className="h-9 px-3 rounded-xl border-[#EFE6DD] text-xs font-bold text-[#6C5C54] hover:text-[#3A2B24] hover:bg-[#FFF8F2] flex items-center gap-1.5 cursor-pointer"
                  title="Reset title and points back to studio defaults"
                >
                  <RotateCcw className="h-3.5 w-3.5" /> Reset Defaults
                </Button>
                <Button
                  type="button"
                  onClick={handleAddAboutPoint}
                  className="h-9 px-3.5 rounded-xl bg-[#FFF8F2] border border-[#D89A86] text-[#D89A86] hover:bg-[#F2C8B5]/40 text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                >
                  <Plus className="h-3.5 w-3.5" /> Add Point
                </Button>
                <Button
                  type="button"
                  onClick={handleSaveAboutHamperOnly}
                  disabled={isSaving}
                  className="h-9 px-4 rounded-xl bg-[#3A2B24] hover:bg-[#523d33] text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-2xs"
                >
                  <Save className="h-3.5 w-3.5 text-white" />
                  {isSaving ? "Saving..." : "Save Highlights"}
                </Button>
              </div>
            </div>

            {/* LIVE CUSTOMER STOREFRONT PREVIEW (Exact match to customer portal) */}
            <div className="p-5 bg-gradient-to-br from-[#FFF8F2] via-[#FAF3EC] to-[#F5ECE3] rounded-2xl border-2 border-[#D89A86]/30 flex flex-col gap-3 shadow-2xs">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-[#6C5C54] uppercase tracking-wider flex items-center gap-1.5">
                  <Eye className="h-3.5 w-3.5 text-[#D89A86]" /> Live Customer Storefront Preview (/product/PRD-111):
                </span>
                <span className="text-[10px] font-bold text-emerald-800 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                  ✓ Live on Storefront
                </span>
              </div>

              {/* Exact Box Rendered on /product/PRD-111 */}
              <div className="bg-white p-5 rounded-2xl border border-[#EFE6DD] shadow-2xs max-w-xl">
                <h4 className="font-serif-brand font-bold text-base text-[#3A2B24] mb-3 flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-[#D89A86]" />
                  <span>{hamperConfig.aboutTitle || "ABOUT HAMPER"}</span>
                </h4>
                <ul className="flex flex-col gap-2 text-xs text-[#6C5C54]">
                  {aboutPointsList.map((pt, pIdx) => (
                    <li key={pIdx} className="flex items-center gap-2 font-medium">
                      <CheckCircle2 className="h-4 w-4 text-emerald-600 flex-shrink-0" />
                      <span>{pt}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* EDITABLE SECTION TITLE */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-[#3A2B24] block">
                Section Headline / Title *
              </label>
              <Input
                value={hamperConfig.aboutTitle || "ABOUT HAMPER"}
                onChange={(e) => setHamperConfig({ ...hamperConfig, aboutTitle: e.target.value })}
                placeholder="e.g. ABOUT HAMPER"
                className="rounded-xl border-[#EFE6DD] text-xs font-bold text-[#3A2B24] bg-white h-11"
                required
              />
              <p className="text-[10px] text-[#6C5C54]">
                The header title shown above the bullet points (e.g. &ldquo;ABOUT HAMPER&rdquo;, &ldquo;WHY CHOOSE OUR LUXURY HAMPER&rdquo;).
              </p>
            </div>

            {/* EDITABLE BULLET POINTS LIST */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-[#3A2B24] block">
                  Quality Points &amp; Guarantees ({aboutPointsList.length} Points)
                </label>
                <span className="text-[10px] text-[#6C5C54]">
                  Each point displays with a verified green checkmark on the customer page.
                </span>
              </div>

              <div className="flex flex-col gap-2.5">
                {aboutPointsList.map((point, ptIdx) => (
                  <div
                    key={ptIdx}
                    className="p-3 bg-[#FAF7F4] rounded-2xl border border-[#EFE6DD] flex items-center gap-3 shadow-2xs hover:border-[#D89A86]/50 transition-colors"
                  >
                    <div className="h-8 w-8 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-600 flex items-center justify-center shrink-0">
                      <CheckCircle2 className="h-4 w-4" />
                    </div>
                    <span className="text-[10px] font-mono font-bold text-[#6C5C54] shrink-0 bg-white px-2 py-1 rounded-md border border-[#EFE6DD]">
                      Point #{ptIdx + 1}
                    </span>
                    <Input
                      value={point}
                      onChange={(e) => handleUpdateAboutPoint(ptIdx, e.target.value)}
                      placeholder="e.g. Master studio handcrafted finish"
                      className="rounded-xl border-[#EFE6DD] text-xs font-medium text-[#3A2B24] bg-white h-9 flex-1"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteAboutPoint(ptIdx)}
                      className="h-8 px-2 text-rose-600 hover:text-rose-700 hover:bg-rose-50 rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer shrink-0"
                      title="Delete this point"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                ))}
              </div>

              <div className="flex items-center justify-between pt-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleAddAboutPoint}
                  className="rounded-xl border-dashed border-[#D89A86] text-[#D89A86] hover:bg-[#FFF8F2] text-xs font-bold h-9 px-4 cursor-pointer flex items-center gap-1.5"
                >
                  <Plus className="h-4 w-4" /> Add Another Highlight Point
                </Button>

                <Button
                  type="button"
                  onClick={handleSaveAboutHamperOnly}
                  disabled={isSaving}
                  className="btn-pixello-primary text-xs font-bold rounded-xl px-5 h-9 shadow-xs flex items-center gap-1.5 cursor-pointer"
                >
                  <Save className="h-3.5 w-3.5 text-white" />
                  {isSaving ? "Saving..." : "Save About Hamper Points"}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* ========================================================================= */}
        {/* CARD 5: HOMEPAGE HAMPER SHOWCASE BANNER SETTINGS */}
        {/* ========================================================================= */}
        <Card className="border border-[#EFE6DD] bg-white rounded-3xl shadow-sm overflow-hidden">
          <CardContent className="p-6 md:p-8 flex flex-col gap-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-[#EFE6DD] gap-3">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-2xl bg-[#FFF8F2] border border-[#EFE6DD] flex items-center justify-center text-[#D89A86] shadow-2xs">
                  <Layers className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-serif-brand text-xl font-bold text-[#3A2B24]">
                    Homepage Showcase Banner Settings
                  </h3>
                  <p className="text-xs text-[#6C5C54] mt-0.5 font-medium">
                    Configure the large custom hamper marketing banner featured on the customer homepage.
                  </p>
                </div>
              </div>

              <Button
                type="button"
                size="sm"
                onClick={() => setHamperConfig({
                  ...hamperConfig,
                  homepage: { ...hamperConfig.homepage, enabled: !hamperConfig.homepage.enabled },
                })}
                className={`h-9 px-4 rounded-xl text-xs font-bold cursor-pointer transition-all self-start sm:self-auto ${
                  hamperConfig.homepage.enabled
                    ? "bg-emerald-600 text-white hover:bg-emerald-700"
                    : "bg-slate-200 text-slate-700 hover:bg-slate-300"
                }`}
              >
                {hamperConfig.homepage.enabled ? "✓ Showcase Enabled on Homepage" : "✕ Showcase Disabled"}
              </Button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              <div>
                <label className="text-xs font-bold text-[#3A2B24] mb-1.5 block">Top Small Tag</label>
                <Input
                  value={hamperConfig.homepage.tag}
                  onChange={(e) => setHamperConfig({
                    ...hamperConfig,
                    homepage: { ...hamperConfig.homepage, tag: e.target.value },
                  })}
                  placeholder="e.g. EXCLUSIVE CUSTOM GIFTING"
                  className="rounded-xl border-[#EFE6DD] text-xs font-bold text-[#3A2B24] bg-white h-11"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-[#3A2B24] mb-1.5 block">Headline Prefix</label>
                <Input
                  value={hamperConfig.homepage.headline}
                  onChange={(e) => setHamperConfig({
                    ...hamperConfig,
                    homepage: { ...hamperConfig.homepage, headline: e.target.value },
                  })}
                  placeholder="e.g. Build Your Own"
                  className="rounded-xl border-[#EFE6DD] text-xs font-bold text-[#3A2B24] bg-white h-11"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-[#3A2B24] mb-1.5 block">Headline Highlight (Pink)</label>
                <Input
                  value={hamperConfig.homepage.highlightText}
                  onChange={(e) => setHamperConfig({
                    ...hamperConfig,
                    homepage: { ...hamperConfig.homepage, highlightText: e.target.value },
                  })}
                  placeholder="e.g. Custom Gift Hamper"
                  className="rounded-xl border-[#EFE6DD] text-xs font-extrabold text-[#D89A86] bg-white h-11"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="text-xs font-bold text-[#3A2B24] mb-1.5 block">Subtitle / Marketing Description</label>
                <textarea
                  rows={2}
                  value={hamperConfig.homepage.subtitle}
                  onChange={(e) => setHamperConfig({
                    ...hamperConfig,
                    homepage: { ...hamperConfig.homepage, subtitle: e.target.value },
                  })}
                  placeholder="Describe how customers can combine multiple gifts into a single hamper..."
                  className="w-full rounded-xl border border-[#EFE6DD] text-xs text-[#3A2B24] bg-white p-3 focus:outline-none focus:ring-1 focus:ring-[#D89A86]"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-[#3A2B24] mb-1.5 block">CTA Button Label</label>
                <Input
                  value={hamperConfig.homepage.buttonText}
                  onChange={(e) => setHamperConfig({
                    ...hamperConfig,
                    homepage: { ...hamperConfig.homepage, buttonText: e.target.value },
                  })}
                  placeholder="e.g. Create Your Hamper"
                  className="rounded-xl border-[#EFE6DD] text-xs font-bold text-[#3A2B24] bg-white h-11"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* BOTTOM SAVE BAR */}
        <div className="flex justify-end pt-2 pb-8">
          <Button
            type="submit"
            disabled={isSaving}
            className="btn-pixello-primary text-xs font-bold rounded-full px-9 h-11 shadow-md flex items-center gap-2 cursor-pointer"
          >
            <Save className="h-4 w-4 text-white" />
            {isSaving ? "Saving Settings..." : "Save All Hamper Settings"}
          </Button>
        </div>

      </form>

      {/* Hidden Card File Input for Direct Upload from Packaging Cards */}
      <input
        type="file"
        ref={cardFileInputRef}
        accept="image/*"
        onChange={handleCardFileUpload}
        className="hidden"
      />

      {/* ========================================================================= */}
      {/* EDIT PACKAGING BOX MODAL */}
      {/* ========================================================================= */}
      {editingBox && editingBoxIndex !== null && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl border border-[#EFE6DD] max-w-2xl w-full p-6 sm:p-7 shadow-2xl space-y-5 animate-in fade-in zoom-in-95 duration-150 my-8">
            <div className="flex items-start justify-between border-b border-[#EFE6DD] pb-4">
              <div>
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#D89A86]">
                  Hamper Packaging Box Editor
                </span>
                <h3 className="font-serif-brand font-bold text-xl text-[#3A2B24]">
                  Edit Packaging Box: {editingBox.name}
                </h3>
                <p className="text-xs text-[#6C5C54] mt-0.5">
                  Update box photo, fee, capacity text, badges, and presentation details.
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setEditingBox(null);
                  setEditingBoxIndex(null);
                }}
                className="text-[#6C5C54] hover:text-[#3A2B24] p-1 cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* LIVE CUSTOMER PREVIEW PLAQUE */}
            <div className="p-4 rounded-2xl bg-[#FFF8F2] border border-[#D89A86]/30 flex flex-col sm:flex-row items-center gap-4">
              <div className="h-20 w-20 rounded-xl overflow-hidden bg-white border border-[#EFE6DD] shrink-0 shadow-2xs">
                <img
                  src={editingBox.image || "https://images.unsplash.com/photo-1549465220-1a8b9238cd48?w=800&q=80"}
                  alt={editingBox.name}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="flex-1 min-w-0 text-center sm:text-left">
                <div className="flex items-center justify-center sm:justify-start gap-2 flex-wrap">
                  <h4 className="font-bold text-sm text-[#3A2B24]">{editingBox.name || "Untitled Box"}</h4>
                  {editingBox.badge && (
                    <span className="text-[9px] font-extrabold bg-[#D89A86] text-white px-2 py-0.5 rounded-full">
                      {editingBox.badge}
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-[#D89A86] font-semibold mt-0.5">
                  {editingBox.tagline || "Luxury gift presentation box"}
                </p>
                <p className="text-xs text-[#6C5C54] line-clamp-1 mt-1">{editingBox.description}</p>
                <div className="flex items-center justify-center sm:justify-start gap-3 mt-1.5 text-xs">
                  <span className="font-extrabold text-base text-[#D89A86]">₹{editingBox.price}</span>
                  {editingBox.originalPrice && editingBox.originalPrice > editingBox.price && (
                    <span className="text-[#6C5C54] line-through text-xs">₹{editingBox.originalPrice}</span>
                  )}
                  <span className="text-[10px] font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-md">
                    📦 {editingBox.capacityText || "Ideal for curated gifts"}
                  </span>
                </div>
              </div>
            </div>

            {/* UPLOAD CUSTOM PHOTO AREA (COMPUTER / PHONE) */}
            <div className="p-4 rounded-2xl border-2 border-dashed border-[#D89A86]/50 bg-[#FFF8F2]/60 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-xl bg-white border border-[#EFE6DD] flex items-center justify-center text-[#D89A86] shrink-0 shadow-2xs">
                  <Upload className="h-6 w-6" />
                </div>
                <div>
                  <h4 className="font-bold text-xs sm:text-sm text-[#3A2B24]">Upload Custom Box Image from Computer</h4>
                  <p className="text-[11px] text-[#6C5C54]">
                    Select any JPG, PNG, or WEBP photo from your computer to show in the customer portal.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="file"
                  ref={boxFileInputRef}
                  accept="image/*"
                  onChange={handleModalFileUpload}
                  className="hidden"
                />
                <Button
                  type="button"
                  onClick={() => boxFileInputRef.current?.click()}
                  className="btn-pixello-primary text-xs font-bold rounded-xl px-4 h-9 shadow-xs flex items-center gap-1.5 cursor-pointer"
                >
                  <Upload className="h-3.5 w-3.5 text-white" />
                  <span>Choose Image File</span>
                </Button>
              </div>
            </div>

            {/* PRESET LUXURY BOX PHOTOS (1-CLICK SELECTOR) */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-[#3A2B24] block">
                Choose Box Photo (Click to select preset, or enter custom URL below)
              </label>
              <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                {PRESET_BOX_IMAGES.map((preset) => (
                  <button
                    key={preset.label}
                    type="button"
                    onClick={() => setEditingBox({ ...editingBox, image: preset.url })}
                    className={`p-1.5 rounded-xl border text-center transition-all cursor-pointer group flex flex-col items-center gap-1 ${
                      editingBox.image === preset.url
                        ? "border-[#D89A86] bg-[#FFF8F2] ring-2 ring-[#D89A86]/40 shadow-xs"
                        : "border-[#EFE6DD] hover:bg-[#FAF7F4]"
                    }`}
                  >
                    <div className="h-10 w-10 rounded-lg overflow-hidden bg-white shrink-0">
                      <img src={preset.url} alt={preset.label} className="w-full h-full object-cover" />
                    </div>
                    <span className="text-[9px] font-bold text-[#3A2B24] truncate w-full">{preset.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* FORM INPUTS */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold text-[#3A2B24] mb-1 block">Display Name</label>
                <Input
                  value={editingBox.name}
                  onChange={(e) => setEditingBox({ ...editingBox, name: e.target.value })}
                  placeholder="e.g. Signature Luxe Hardbox"
                  className="rounded-xl border-[#EFE6DD] text-xs font-bold bg-white h-10"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-[#3A2B24] mb-1 block">Badge Tag (Optional)</label>
                <Input
                  value={editingBox.badge || ""}
                  onChange={(e) => setEditingBox({ ...editingBox, badge: e.target.value })}
                  placeholder="e.g. Most Popular, Artisanal, Special"
                  className="rounded-xl border-[#EFE6DD] text-xs font-bold text-[#D89A86] bg-white h-10"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-[#3A2B24] mb-1 block">Box Fee / Selling Price (₹)</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-[#6C5C54]">₹</span>
                  <Input
                    type="number"
                    min="0"
                    value={editingBox.price}
                    onChange={(e) => setEditingBox({ ...editingBox, price: Number(e.target.value) || 0 })}
                    className="pl-7 rounded-xl border-[#EFE6DD] text-xs font-extrabold text-[#3A2B24] bg-white h-10"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-[#3A2B24] mb-1 block">Original Strikethrough Price (₹)</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-[#6C5C54]">₹</span>
                  <Input
                    type="number"
                    min="0"
                    value={editingBox.originalPrice || ""}
                    onChange={(e) => setEditingBox({ ...editingBox, originalPrice: Number(e.target.value) || 0 })}
                    placeholder="e.g. 249"
                    className="pl-7 rounded-xl border-[#EFE6DD] text-xs font-bold text-[#6C5C54] bg-white h-10"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-[#3A2B24] mb-1 block">Tagline / Subtitle</label>
                <Input
                  value={editingBox.tagline || ""}
                  onChange={(e) => setEditingBox({ ...editingBox, tagline: e.target.value })}
                  placeholder="e.g. Magnetic Closure • Gold Foil Crest"
                  className="rounded-xl border-[#EFE6DD] text-xs font-medium text-[#3A2B24] bg-white h-10"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-[#3A2B24] mb-1 block">Capacity Text</label>
                <Input
                  value={editingBox.capacityText || ""}
                  onChange={(e) => setEditingBox({ ...editingBox, capacityText: e.target.value })}
                  placeholder="e.g. Ideal for 3 to 6 gifts"
                  className="rounded-xl border-[#EFE6DD] text-xs font-medium text-[#3A2B24] bg-white h-10"
                />
              </div>

              {/* EMPTY SLOTS CONFIGURATION & LIVE SIMULATOR IN MODAL */}
              <div className="sm:col-span-2 bg-[#FFFBF7] p-4 rounded-2xl border border-[#EFE6DD] space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <label className="text-xs font-bold text-[#3A2B24] block">
                      Empty Slots in Box (Live Box Preview Capacity)
                    </label>
                    <p className="text-[11px] text-[#6C5C54]">
                      Controls the total empty cushion slots rendered for this box on the customer storefront.
                    </p>
                  </div>
                  <Badge className="bg-[#FFF2EB] text-[#D89A86] border-[#F3DACF] font-bold text-xs px-3 py-1 self-start sm:self-auto">
                    {editingBox.maxCapacity || 6} Empty Slots
                  </Badge>
                </div>

                <div className="flex flex-wrap items-center gap-2 pt-1">
                  {/* Stepper */}
                  <div className="flex items-center border border-[#EFE6DD] rounded-xl bg-white overflow-hidden shadow-2xs h-9">
                    <button
                      type="button"
                      onClick={() => setEditingBox({
                        ...editingBox,
                        maxCapacity: Math.max(1, (editingBox.maxCapacity || 6) - 1),
                        capacityText: `Ideal for 1 to ${Math.max(1, (editingBox.maxCapacity || 6) - 1)} handcrafted gifts`
                      })}
                      className="px-3 h-full hover:bg-[#FFF8F2] text-[#3A2B24] font-bold text-sm border-r border-[#EFE6DD] cursor-pointer"
                      title="Decrease slot count"
                    >
                      -
                    </button>
                    <input
                      type="number"
                      min="1"
                      max="30"
                      value={editingBox.maxCapacity || 6}
                      onChange={(e) => {
                        const val = Math.max(1, parseInt(e.target.value) || 1);
                        setEditingBox({
                          ...editingBox,
                          maxCapacity: val,
                          capacityText: `Ideal for 1 to ${val} handcrafted gifts`
                        });
                      }}
                      className="w-14 text-center font-extrabold text-xs text-[#3A2B24] outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => setEditingBox({
                        ...editingBox,
                        maxCapacity: (editingBox.maxCapacity || 6) + 1,
                        capacityText: `Ideal for 1 to ${(editingBox.maxCapacity || 6) + 1} handcrafted gifts`
                      })}
                      className="px-3 h-full hover:bg-[#FFF8F2] text-[#3A2B24] font-bold text-sm border-l border-[#EFE6DD] cursor-pointer"
                      title="Increase slot count"
                    >
                      +
                    </button>
                  </div>

                  {/* + Add Empty Slot Button */}
                  <button
                    type="button"
                    onClick={() => setEditingBox({
                      ...editingBox,
                      maxCapacity: (editingBox.maxCapacity || 6) + 1,
                      capacityText: `Ideal for 1 to ${(editingBox.maxCapacity || 6) + 1} handcrafted gifts`
                    })}
                    className="h-9 px-3.5 bg-[#FFF2EB] hover:bg-[#ffe5d9] text-[#D89A86] border border-[#F3DACF] rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <Plus className="h-3.5 w-3.5" /> + Add Empty Slot
                  </button>

                  {/* Slot Presets */}
                  <div className="flex items-center gap-1 text-[11px] font-bold text-[#6C5C54] ml-auto">
                    <span>Quick:</span>
                    {[4, 6, 8, 10].map(cnt => (
                      <button
                        key={cnt}
                        type="button"
                        onClick={() => setEditingBox({
                          ...editingBox,
                          maxCapacity: cnt,
                          capacityText: `Ideal for 1 to ${cnt} handcrafted gifts`
                        })}
                        className={`px-2 py-0.5 rounded-md border text-[10px] cursor-pointer transition-colors ${
                          (editingBox.maxCapacity || 6) === cnt
                            ? "bg-[#D89A86] text-white border-[#D89A86]"
                            : "bg-white text-[#6C5C54] border-[#EFE6DD] hover:bg-[#FFF8F2]"
                        }`}
                      >
                        {cnt} Slots
                      </button>
                    ))}
                  </div>
                </div>

                {/* Miniature Empty Slots Grid Simulator inside Modal */}
                <div className="mt-2 pt-2 border-t border-[#EFE6DD]/70">
                  <p className="text-[10px] font-bold text-[#6C5C54] uppercase tracking-wider mb-2">
                    Live Keepsake Box Empty Slots Simulator ({editingBox.maxCapacity || 6} Slots)
                  </p>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 bg-[#FAF5EE] p-3 rounded-xl border border-[#EAE0D5] max-h-48 overflow-y-auto">
                    {Array.from({ length: editingBox.maxCapacity || 6 }).map((_, i) => (
                      <div
                        key={`modal-slot-${i}`}
                        className="border-2 border-dashed border-[#D89A86]/40 rounded-lg p-2 flex flex-col items-center justify-center text-center bg-white/70 h-12"
                      >
                        <span className="text-[10px] text-[#D89A86] font-bold flex items-center gap-0.5">
                          + Empty Slot
                        </span>
                        <span className="text-[9px] text-[#6C5C54]">
                          ({i + 1} of {editingBox.maxCapacity || 6})
                        </span>
                      </div>
                    ))}
                    <button
                      type="button"
                      onClick={() => setEditingBox({
                        ...editingBox,
                        maxCapacity: (editingBox.maxCapacity || 6) + 1,
                        capacityText: `Ideal for 1 to ${(editingBox.maxCapacity || 6) + 1} handcrafted gifts`
                      })}
                      className="border-2 border-dashed border-[#D89A86] rounded-lg p-2 flex flex-col items-center justify-center text-center bg-[#FFF2EB]/70 hover:bg-[#FFF2EB] transition-colors h-12 cursor-pointer"
                      title="Add another empty slot"
                    >
                      <Plus className="h-3.5 w-3.5 text-[#D89A86]" />
                      <span className="text-[9px] font-bold text-[#D89A86]">+ Add Slot</span>
                    </button>
                  </div>
                </div>
              </div>

              <div className="sm:col-span-2">
                <label className="text-xs font-bold text-[#3A2B24] mb-1 block">Custom Image URL</label>
                <Input
                  value={editingBox.image}
                  onChange={(e) => setEditingBox({ ...editingBox, image: e.target.value })}
                  placeholder="https://... image URL"
                  className="rounded-xl border-[#EFE6DD] text-xs text-[#6C5C54] bg-white h-10"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="text-xs font-bold text-[#3A2B24] mb-1 block">Full Description</label>
                <textarea
                  rows={2}
                  value={editingBox.description}
                  onChange={(e) => setEditingBox({ ...editingBox, description: e.target.value })}
                  placeholder="Describe the material, lining, closure, and presentation..."
                  className="w-full rounded-xl border border-[#EFE6DD] text-xs text-[#3A2B24] bg-white p-3 focus:outline-none focus:ring-1 focus:ring-[#D89A86]"
                />
              </div>
            </div>

            <div className="pt-3 border-t border-[#EFE6DD] flex items-center justify-between gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setEditingBox(null);
                  setEditingBoxIndex(null);
                }}
                className="h-10 px-5 rounded-xl text-xs font-bold border-[#EFE6DD] cursor-pointer"
              >
                Cancel
              </Button>
              <Button
                type="button"
                onClick={handleSaveEditedBox}
                className="h-10 px-6 rounded-xl bg-[#D89A86] hover:bg-[#c78672] text-white text-xs font-bold shadow-xs cursor-pointer flex items-center gap-1.5"
              >
                <CheckCircle2 className="h-4 w-4" /> Save &amp; Update Packaging Box
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
