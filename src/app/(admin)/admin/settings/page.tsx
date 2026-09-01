"use client";

import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { 
  User, 
  Shield, 
  Mail, 
  Phone, 
  Save, 
  CheckCircle2, 
  Server, 
  Headphones, 
  MessageSquare, 
  Truck, 
  MapPin, 
  Plus, 
  Trash2,
  Lock,
  KeyRound,
  Eye,
  EyeOff,
  ShieldCheck,
  Award,
  Sparkles,
  Star
} from "lucide-react";
import { cn } from "@/lib/utils";
import { getDeliveryConfig, saveDeliveryConfig, DEFAULT_DELIVERY_CONFIG, DeliveryConfig } from "@/lib/deliveryFee";
import { getHomepageStats, saveHomepageStats, DEFAULT_HOMEPAGE_STATS, HomepageStatsConfig, HomepageBadgeItem } from "@/lib/homepageStats";

const DEFAULT_ADMIN_PROFILE = {
  name: "Pranav",
  email: "neelasaipranav2007@gmail.com",
  username: "admin",
  password: "admin123",
  phone: "+91 96184 01231",
  role: "Super Administrator",
  platformName: "Pixello Store",
  studioCommission: "70%",
  ambassadorCommission: "10%",
  storeMobilePhone: "+91 98765 43210",
  storeWhatsAppNumber: "+91 8074589949",
  storeSupportEmail: "neelasaipranav2007@gmail.com",
};

export default function AdminSettingsPage() {
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [deliveryConfig, setDeliveryConfigState] = useState<DeliveryConfig>(DEFAULT_DELIVERY_CONFIG);
  const [adminProfile, setAdminProfile] = useState(DEFAULT_ADMIN_PROFILE);
  const [homepageStats, setHomepageStats] = useState<HomepageStatsConfig>(DEFAULT_HOMEPAGE_STATS);
  const [isMounted, setIsMounted] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [newCustomPin, setNewCustomPin] = useState("");
  const [newCustomFee, setNewCustomFee] = useState<number | "">("");
  const [newCustomLabel, setNewCustomLabel] = useState("");

  useEffect(() => {
    setIsMounted(true);
    setDeliveryConfigState(getDeliveryConfig());
    setHomepageStats(getHomepageStats());
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("pixello_admin_settings");
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          setAdminProfile({
            ...DEFAULT_ADMIN_PROFILE,
            ...parsed,
            username: parsed.username || DEFAULT_ADMIN_PROFILE.username || "admin",
            password: parsed.password || DEFAULT_ADMIN_PROFILE.password || "admin123",
          });
        } catch (e) {}
      }
    }
  }, []);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleAddBadge = () => {
    const newBadgeId = `badge-${Date.now()}`;
    const updatedBadges: HomepageBadgeItem[] = [
      ...(homepageStats.badges || []),
      { id: newBadgeId, value: "100%", label: "Satisfaction Guarantee" }
    ];
    const updatedStats: HomepageStatsConfig = {
      ...homepageStats,
      badges: updatedBadges
    };
    setHomepageStats(updatedStats);
    saveHomepageStats(updatedStats);
    showToast("✨ Added new trust badge! Remember to click Save Changes.");
  };

  const handleRemoveBadge = (id: string) => {
    const updatedBadges = (homepageStats.badges || []).filter(b => b.id !== id);
    const updatedStats: HomepageStatsConfig = {
      ...homepageStats,
      badges: updatedBadges
    };
    setHomepageStats(updatedStats);
    saveHomepageStats(updatedStats);
    showToast("🗑️ Removed trust badge! Remember to click Save Changes.");
  };

  const handleUpdateBadge = (id: string, field: "value" | "label", val: string) => {
    const updatedBadges = (homepageStats.badges || []).map(b => {
      if (b.id === id) {
        return { ...b, [field]: val };
      }
      return b;
    });
    const updatedStats: HomepageStatsConfig = {
      ...homepageStats,
      badges: updatedBadges
    };
    setHomepageStats(updatedStats);
    saveHomepageStats(updatedStats);
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const cleanPhone = (adminProfile.phone || "").replace(/\D/g, "").slice(-10) || "9618401231";
      const profileToSave = {
        ...adminProfile,
        phone: cleanPhone,
        password: adminProfile.password || "admin123",
      };

      localStorage.setItem("pixello_admin_settings", JSON.stringify(profileToSave));
      localStorage.setItem("pixello_admin_credentials", JSON.stringify({ 
        phone: cleanPhone, 
        password: profileToSave.password,
        name: profileToSave.name, 
        email: profileToSave.email,
        username: profileToSave.username || "admin"
      }));
      localStorage.setItem("pixello_admin_profile", JSON.stringify(profileToSave));
      saveDeliveryConfig(deliveryConfig);
      saveHomepageStats(homepageStats);

      try {
        await fetch("/api/settings/homepage-stats", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ stats: homepageStats }),
        });
      } catch (err) {}

      window.dispatchEvent(new Event("pixello_admin_profile_updated"));
      window.dispatchEvent(new Event("pixello_homepage_stats_updated"));
      window.dispatchEvent(new Event("storage"));
    } catch (err) {
      console.error(err);
    }
    showToast(`✓ Admin settings & homepage trust badges saved successfully!`);
  };

  const handleAddCustomPincodeRule = () => {
    const cleanPin = newCustomPin.replace(/\D/g, "").slice(0, 6);
    if (!cleanPin || cleanPin.length !== 6) {
      alert("Please enter a valid 6-digit Pincode!");
      return;
    }
    const feeNum = Number(newCustomFee) || 0;
    const updated = {
      ...deliveryConfig,
      customPincodeRates: [
        ...deliveryConfig.customPincodeRates.filter((c) => c.pincode !== cleanPin),
        { pincode: cleanPin, fee: feeNum, label: newCustomLabel.trim() || `Special Rate for Pincode ${cleanPin}` },
      ],
    };
    setDeliveryConfigState(updated);
    saveDeliveryConfig(updated);
    setNewCustomPin("");
    setNewCustomFee("");
    setNewCustomLabel("");
    showToast(`✓ Custom rule added for Pincode ${cleanPin} (₹${feeNum})!`);
  };

  const handleRemoveCustomPincodeRule = (pin: string) => {
    const updated = {
      ...deliveryConfig,
      customPincodeRates: deliveryConfig.customPincodeRates.filter((c) => c.pincode !== pin),
    };
    setDeliveryConfigState(updated);
    saveDeliveryConfig(updated);
    showToast(`✓ Removed custom rate rule for Pincode ${pin}`);
  };

  return (
    <div className="flex flex-col gap-6 p-6 bg-[#F8F3EE] min-h-screen relative max-w-5xl">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-20 right-8 z-50 bg-[#3A2B24] text-white px-5 py-3 rounded-2xl shadow-xl border border-[#D89A86]/40 flex items-center gap-2.5 animate-in fade-in slide-in-from-top-4 duration-300">
          <CheckCircle2 className="h-5 w-5 text-[#D89A86]" />
          <span className="text-xs font-bold">{toastMessage}</span>
        </div>
      )}

      <div>
        <h2 className="font-serif-brand text-3xl font-bold text-[#3A2B24]">Admin Platform &amp; Account Settings</h2>
        <p className="text-xs text-[#6C5C54] mt-1">Manage administrator login credentials, delivery rates matrix, WhatsApp, Email &amp; platform commissions.</p>
      </div>

      <form onSubmit={handleSaveSettings} className="flex flex-col gap-6">
        
        {/* ========================================================================= */}
        {/* 🔐 ADMIN LOGIN CREDENTIALS & SECURITY CARD */}
        {/* ========================================================================= */}
        <Card className="border border-[#EFE6DD] bg-white rounded-3xl shadow-sm overflow-hidden">
          <CardContent className="p-6 md:p-8 flex flex-col gap-5">
            <div className="flex items-center justify-between pb-4 border-b border-[#EFE6DD]">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-2xl bg-[#3A2B24] text-[#D89A86] flex items-center justify-center">
                  <KeyRound className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-serif-brand text-xl font-bold text-[#3A2B24]">Admin Login &amp; Security Credentials</h3>
                  <p className="text-xs text-[#6C5C54] mt-0.5 font-medium">Edit email, username, and password required to sign in at <strong className="text-[#3A2B24]">/admin/login</strong>.</p>
                </div>
              </div>
              <Badge className="bg-[#3A2B24] text-[#D89A86] border-[#D89A86]/40 text-xs font-extrabold px-3.5 py-1 rounded-full shadow-2xs">
                <ShieldCheck className="h-3.5 w-3.5 mr-1 text-emerald-400" /> Superadmin Protected
              </Badge>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {/* Admin Display Name */}
              <div>
                <label className="text-xs font-bold text-[#3A2B24] mb-1.5 flex items-center gap-1.5">
                  <User className="h-3.5 w-3.5 text-[#D89A86]" /> Admin Display Name *
                </label>
                <Input 
                  value={adminProfile.name} 
                  onChange={(e) => setAdminProfile({ ...adminProfile, name: e.target.value })}
                  placeholder="e.g. Pranav"
                  className="rounded-xl border-[#EFE6DD] text-xs font-semibold text-[#3A2B24] bg-[#FFF8F2]/40 h-11 focus-visible:ring-[#D89A86]" 
                  required
                />
              </div>

              {/* Admin Login Mobile Number */}
              <div>
                <label className="text-xs font-bold text-[#3A2B24] mb-1.5 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <Phone className="h-3.5 w-3.5 text-[#D89A86]" /> Admin Login Mobile Number *
                  </span>
                  <span className="text-[10px] text-[#6C5C54] font-medium">10 Digits</span>
                </label>
                <div className="relative">
                  <div className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-[#3A2B24] border-r border-[#EFE6DD] pr-2 flex items-center gap-1">
                    <span className="text-[10px] font-bold text-[#6C5C54]">IN</span> +91
                  </div>
                  <Input 
                    type="tel"
                    maxLength={10}
                    value={(adminProfile.phone || "").replace(/\D/g, "").slice(-10)} 
                    onChange={(e) => {
                      const clean = e.target.value.replace(/\D/g, "");
                      setAdminProfile({ ...adminProfile, phone: clean });
                    }}
                    placeholder="96184 01231"
                    className="pl-18 rounded-xl border-[#EFE6DD] text-xs font-bold text-[#3A2B24] bg-[#FFF8F2]/40 h-11 focus-visible:ring-[#D89A86]" 
                    required
                  />
                </div>
              </div>

              {/* Admin Login Password */}
              <div>
                <label className="text-xs font-bold text-[#3A2B24] mb-1.5 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <Lock className="h-3.5 w-3.5 text-[#D89A86]" /> Admin Password / Key *
                  </span>
                  <span className="text-[10px] text-[#D89A86] font-bold">Portal Access Key</span>
                </label>
                <div className="relative flex items-center">
                  <Input 
                    type={showPassword ? "text" : "password"}
                    value={adminProfile.password || ""} 
                    onChange={(e) => setAdminProfile({ ...adminProfile, password: e.target.value })}
                    placeholder="Enter admin password"
                    className="rounded-xl border-[#EFE6DD] text-xs font-mono font-bold text-[#3A2B24] bg-[#FFF8F2]/40 h-11 pr-11 focus-visible:ring-[#D89A86]" 
                    required
                  />
                  <button
                    type="button"
                    tabIndex={-1}
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setShowPassword((prev) => !prev);
                    }}
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-lg text-[#6C5C54] hover:text-[#3A2B24] hover:bg-[#EFE6DD]/40 cursor-pointer z-10 transition-colors"
                    title={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4 text-[#D89A86]" />
                    ) : (
                      <Eye className="h-4 w-4 text-[#6C5C54]" />
                    )}
                  </button>
                </div>
              </div>

              {/* Admin Notification / Support Email */}
              <div>
                <label className="text-xs font-bold text-[#3A2B24] mb-1.5 flex items-center gap-1.5">
                  <Mail className="h-3.5 w-3.5 text-[#D89A86]" /> Notification Email Address
                </label>
                <Input 
                  type="email"
                  value={adminProfile.email} 
                  onChange={(e) => setAdminProfile({ ...adminProfile, email: e.target.value })}
                  placeholder="admin@pixello.store"
                  className="rounded-xl border-[#EFE6DD] text-xs font-semibold text-[#3A2B24] bg-[#FFF8F2]/40 h-11 focus-visible:ring-[#D89A86]" 
                />
              </div>

              {/* Access Role */}
              <div>
                <label className="text-xs font-bold text-[#3A2B24] mb-1.5 flex items-center gap-1.5">
                  <Shield className="h-3.5 w-3.5 text-[#D89A86]" /> Access Role
                </label>
                <Input 
                  disabled
                  value={adminProfile.role} 
                  className="rounded-xl border-[#EFE6DD] text-xs font-bold text-[#3A2B24] bg-[#FFF8F2] h-11 cursor-not-allowed" 
                />
              </div>
            </div>

            <div className="p-3 bg-amber-50/70 border border-amber-200/80 rounded-2xl text-[11px] text-amber-900 flex items-center justify-between">
              <span>💡 <strong>Live Security Sync:</strong> Saving changes will immediately update the login credentials on <strong>/admin/login</strong>.</span>
              <Button
                type="submit"
                size="sm"
                className="bg-[#3A2B24] hover:bg-[#2E201A] text-white text-xs font-bold rounded-xl h-8 px-4 flex items-center gap-1.5 cursor-pointer shadow-2xs"
              >
                <Save className="h-3.5 w-3.5 text-[#D89A86]" /> Save Credentials
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* ========================================================================= */}
        {/* 🌟 HOMEPAGE TRUST METRICS & HERO BADGES (DYNAMIC ADD/REMOVE BY ADMIN) */}
        {/* ========================================================================= */}
        <Card className="border border-[#EFE6DD] bg-white rounded-3xl shadow-sm overflow-hidden">
          <CardContent className="p-6 md:p-8 flex flex-col gap-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-[#EFE6DD] gap-3">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-2xl bg-[#FFF8F2] border border-[#EFE6DD] flex items-center justify-center text-[#D89A86]">
                  <Award className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-serif-brand text-xl font-bold text-[#3A2B24]">Homepage Trust Metrics &amp; Badges</h3>
                  <p className="text-xs text-[#6C5C54] mt-0.5 font-medium">Add, edit, or remove the hero statistics shown below the main headline on the customer landing page.</p>
                </div>
              </div>
              <div className="flex items-center gap-2.5 self-start sm:self-auto">
                <Button 
                  type="button" 
                  onClick={handleAddBadge}
                  className="h-9 px-4 rounded-xl bg-[#D89A86] hover:bg-[#c78672] text-white text-xs font-bold flex items-center gap-1.5 shadow-xs cursor-pointer transition-all"
                >
                  <Plus className="h-4 w-4" /> Add New Badge
                </Button>
                <Badge className="bg-[#FFF8F2] text-[#D89A86] border-[#D89A86]/40 text-xs font-bold px-3 py-1 rounded-full">
                  <Sparkles className="h-3 w-3 mr-1 text-[#D89A86]" /> Live Customer Storefront
                </Badge>
              </div>
            </div>

            {/* Dynamic Metric Editing Columns */}
            {homepageStats.badges && homepageStats.badges.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {homepageStats.badges.map((badge, idx) => (
                  <div key={badge.id || idx} className="p-4 bg-[#FFF8F2]/70 rounded-2xl border border-[#EFE6DD] flex flex-col gap-3 relative group transition-all hover:shadow-xs">
                    <div className="flex items-center justify-between pb-1 border-b border-[#EFE6DD]/80">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-extrabold text-[#3A2B24] uppercase tracking-wider">Badge #{idx + 1}</span>
                        <span className="text-[10px] text-[#6C5C54] font-medium bg-white px-2 py-0.5 rounded-md border border-[#EFE6DD]">Position {idx + 1}</span>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveBadge(badge.id)}
                        className="h-7 px-2 text-rose-600 hover:text-rose-700 hover:bg-rose-50 rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer transition-colors"
                        title="Remove this badge"
                      >
                        <Trash2 className="h-3.5 w-3.5" /> Remove
                      </Button>
                    </div>

                    <div>
                      <label className="text-[11px] font-bold text-[#6C5C54] mb-1 block">Value / Counter</label>
                      <Input 
                        value={badge.value} 
                        onChange={(e) => handleUpdateBadge(badge.id, "value", e.target.value)}
                        placeholder="e.g. 50K+, 2 Hours, 4.9★, 100%"
                        className="rounded-xl border-[#EFE6DD] text-sm font-bold text-[#3A2B24] bg-white h-10" 
                      />
                    </div>

                    <div>
                      <label className="text-[11px] font-bold text-[#6C5C54] mb-1 block">Description Label</label>
                      <Input 
                        value={badge.label} 
                        onChange={(e) => handleUpdateBadge(badge.id, "label", e.target.value)}
                        placeholder="e.g. Memories Framed, Customer Happiness"
                        className="rounded-xl border-[#EFE6DD] text-xs font-medium text-[#3A2B24] bg-white h-10" 
                      />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-8 text-center bg-[#FFF8F2]/40 border-2 border-dashed border-[#EFE6DD] rounded-2xl flex flex-col items-center justify-center gap-3">
                <Award className="h-8 w-8 text-[#D89A86] opacity-60" />
                <div>
                  <p className="text-sm font-bold text-[#3A2B24]">No Trust Badges Configured</p>
                  <p className="text-xs text-[#6C5C54] mt-0.5">Click the button below to add your first customer landing page trust metric.</p>
                </div>
                <Button 
                  type="button" 
                  onClick={handleAddBadge}
                  className="h-9 px-4 rounded-xl bg-[#D89A86] hover:bg-[#c78672] text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-xs"
                >
                  <Plus className="h-3.5 w-3.5" /> Add First Badge
                </Button>
              </div>
            )}

            {/* Live Visual Preview */}
            <div className="p-5 bg-gradient-to-br from-[#FFF8F2] to-[#F8F3EE] rounded-2xl border border-[#EFE6DD]">
              <div className="flex items-center justify-between mb-3">
                <span className="text-[11px] font-bold text-[#6C5C54] uppercase tracking-wider block">
                  ✨ Live Storefront Preview (as seen by customers):
                </span>
                <span className="text-[10px] text-[#6C5C54] font-semibold">
                  {homepageStats.badges?.length || 0} active badge(s)
                </span>
              </div>

              {homepageStats.badges && homepageStats.badges.length > 0 ? (
                <div className={cn(
                  "gap-6 text-center mx-auto pt-3 border-t border-[#EFE6DD]/70",
                  homepageStats.badges.length === 1 ? "flex justify-center max-w-xs" :
                  homepageStats.badges.length === 2 ? "grid grid-cols-2 max-w-sm" :
                  homepageStats.badges.length === 3 ? "grid grid-cols-3 max-w-md" :
                  homepageStats.badges.length === 4 ? "grid grid-cols-2 sm:grid-cols-4 max-w-xl" :
                  "flex flex-wrap justify-center gap-6 max-w-2xl"
                )}>
                  {homepageStats.badges.map((b, idx) => (
                    <div key={b.id || idx} className="min-w-[100px] px-2">
                      <div className="font-bold text-2xl text-[#3A2B24]">{b.value || "—"}</div>
                      <div className="text-xs text-[#6C5C54] mt-0.5">{b.label || "—"}</div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="pt-3 border-t border-[#EFE6DD]/70 text-center text-xs text-[#6C5C54] italic">
                  (No trust badges will be displayed on the customer landing page)
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* ========================================================================= */}
        {/* 🚚 DELIVERY RATES & PINCODE MATRIX SETTINGS (ADMIN ONLY) */}
        {/* ========================================================================= */}
        <Card className="border border-[#EFE6DD] bg-white rounded-3xl shadow-xs overflow-hidden">
          <CardContent className="p-6 md:p-8 flex flex-col gap-5">
            <div className="flex items-center justify-between pb-4 border-b border-[#EFE6DD]">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-700">
                  <Truck className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-serif-brand text-xl font-bold text-[#3A2B24]">Delivery Rates &amp; Pincode Distance Matrix</h3>
                  <p className="text-xs text-[#6C5C54] mt-0.5 font-medium">Dynamic fee calculation based on customer pincode &amp; distance from Base Pincode 500010.</p>
                </div>
              </div>
              <Badge className="bg-amber-100 text-amber-900 border-amber-300 text-xs font-extrabold px-3 py-1 rounded-full">
                Admin Exclusive Control
              </Badge>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              <div>
                <label className="text-xs font-bold text-[#3A2B24] mb-1.5 flex items-center gap-1.5">
                  <MapPin className="h-3.5 w-3.5 text-[#D89A86]" /> Base Central Hub Pincode *
                </label>
                <Input 
                  value={deliveryConfig.basePincode}
                  onChange={(e) => setDeliveryConfigState({ ...deliveryConfig, basePincode: e.target.value.replace(/\D/g, "").slice(0, 6) })}
                  className="rounded-xl border-[#EFE6DD] text-xs font-mono font-extrabold text-[#3A2B24] bg-[#FFF8F2] h-11" 
                />
                <p className="text-[10px] text-[#6C5C54] mt-1 font-medium">Central Hub: Alwal, Hyderabad (500010)</p>
              </div>

              <div>
                <label className="text-xs font-bold text-[#3A2B24] mb-1.5 block">
                  Local Express Delivery Fee (Within ~5 km)
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-[#6C5C54]">₹</span>
                  <Input 
                    type="number"
                    min="0"
                    value={deliveryConfig.localFee} 
                    onChange={(e) => setDeliveryConfigState({ ...deliveryConfig, localFee: Number(e.target.value) || 0 })}
                    className="pl-7 rounded-xl border-emerald-300 bg-emerald-50/50 text-xs font-extrabold text-emerald-900 h-11" 
                  />
                </div>
                <p className="text-[10px] text-emerald-700 mt-1 font-medium">Pincodes 500010, 500011, 500015, 500070</p>
              </div>

              <div>
                <label className="text-xs font-bold text-[#3A2B24] mb-1.5 block">
                  City Delivery Fee (Hyderabad 500001–500099)
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-[#6C5C54]">₹</span>
                  <Input 
                    type="number"
                    min="0"
                    value={deliveryConfig.cityFee} 
                    onChange={(e) => setDeliveryConfigState({ ...deliveryConfig, cityFee: Number(e.target.value) || 0 })}
                    className="pl-7 rounded-xl border-[#EFE6DD] text-xs font-bold text-[#3A2B24] bg-white h-11" 
                  />
                </div>
                <p className="text-[10px] text-[#6C5C54] mt-1 font-medium">Standard Hyderabad city routes</p>
              </div>

              <div>
                <label className="text-xs font-bold text-[#3A2B24] mb-1.5 block">
                  Regional State Delivery Fee (Telangana 500xxx–509xxx)
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-[#6C5C54]">₹</span>
                  <Input 
                    type="number"
                    min="0"
                    value={deliveryConfig.regionalFee} 
                    onChange={(e) => setDeliveryConfigState({ ...deliveryConfig, regionalFee: Number(e.target.value) || 0 })}
                    className="pl-7 rounded-xl border-[#EFE6DD] text-xs font-bold text-[#3A2B24] bg-white h-11" 
                  />
                </div>
                <p className="text-[10px] text-[#6C5C54] mt-1 font-medium">Telangana State / Outer Districts</p>
              </div>

              <div>
                <label className="text-xs font-bold text-[#3A2B24] mb-1.5 block">
                  National / Out-of-State Delivery Fee
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-[#6C5C54]">₹</span>
                  <Input 
                    type="number"
                    min="0"
                    value={deliveryConfig.outstationFee} 
                    onChange={(e) => setDeliveryConfigState({ ...deliveryConfig, outstationFee: Number(e.target.value) || 0 })}
                    className="pl-7 rounded-xl border-[#EFE6DD] text-xs font-bold text-[#3A2B24] bg-white h-11" 
                  />
                </div>
                <p className="text-[10px] text-[#6C5C54] mt-1 font-medium">Rest of India pincodes</p>
              </div>

              <div>
                <label className="text-xs font-bold text-[#3A2B24] mb-1.5 block">
                  Free Delivery Cart Threshold
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-[#6C5C54]">₹</span>
                  <Input 
                    type="number"
                    min="0"
                    value={deliveryConfig.freeDeliveryThreshold ?? 5000} 
                    onChange={(e) => setDeliveryConfigState({ ...deliveryConfig, freeDeliveryThreshold: Number(e.target.value) || 0 })}
                    className="pl-7 rounded-xl border-[#EFE6DD] text-xs font-bold text-[#3A2B24] bg-white h-11" 
                  />
                </div>
                <p className="text-[10px] text-[#6C5C54] mt-1 font-medium">Orders above this qualify for ₹0 Free Delivery</p>
              </div>
            </div>

            {/* Custom Specific Pincode Rules */}
            <div className="mt-2 p-4 bg-[#FFF8F2]/60 rounded-2xl border border-[#EFE6DD]">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold text-[#3A2B24] flex items-center gap-1.5">
                  <MapPin className="h-3.5 w-3.5 text-[#D89A86]" /> Custom Specific Pincode Rules:
                </span>
                <span className="text-[10px] text-[#6C5C54]">Override standard tier for specific pincodes</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-4 gap-2 mb-3">
                <Input 
                  placeholder="6-digit Pincode (e.g. 500081)" 
                  value={newCustomPin}
                  onChange={(e) => setNewCustomPin(e.target.value.replace(/\D/g, "").slice(0, 6))}
                  className="rounded-xl border-[#EFE6DD] text-xs bg-white h-9"
                />
                <Input 
                  type="number"
                  placeholder="Custom Fee (₹) e.g. 20" 
                  value={newCustomFee}
                  onChange={(e) => setNewCustomFee(e.target.value === "" ? "" : Number(e.target.value))}
                  className="rounded-xl border-[#EFE6DD] text-xs bg-white h-9"
                />
                <Input 
                  placeholder="Note e.g. Hitech City Discount" 
                  value={newCustomLabel}
                  onChange={(e) => setNewCustomLabel(e.target.value)}
                  className="rounded-xl border-[#EFE6DD] text-xs bg-white h-9"
                />
                <Button 
                  type="button" 
                  onClick={handleAddCustomPincodeRule}
                  className="btn-pixello-primary text-xs font-bold rounded-xl h-9 flex items-center justify-center gap-1 cursor-pointer"
                >
                  <Plus className="h-3.5 w-3.5" /> Add
                </Button>
              </div>

              {/* Active Custom Rules List */}
              <div className="flex flex-wrap gap-2">
                {deliveryConfig.customPincodeRates && deliveryConfig.customPincodeRates.length > 0 ? (
                  deliveryConfig.customPincodeRates.map((rule) => (
                    <div 
                      key={rule.pincode} 
                      className="flex items-center gap-2 px-3 py-1.5 bg-white border border-[#EFE6DD] rounded-xl text-xs shadow-2xs"
                    >
                      <span className="font-mono font-bold text-[#3A2B24]">{rule.pincode}:</span>
                      <span className="font-bold text-emerald-700">₹{rule.fee}</span>
                      {rule.label && <span className="text-[10px] text-[#6C5C54]">({rule.label})</span>}
                      <button 
                        type="button" 
                        onClick={() => handleRemoveCustomPincodeRule(rule.pincode)}
                        className="text-rose-500 hover:text-rose-700 ml-1 cursor-pointer"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </div>
                  ))
                ) : (
                  <span className="text-[11px] text-[#6C5C54] italic">No custom pincode overrides yet.</span>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Platform & Commission Settings */}
        <Card className="border border-[#EFE6DD] bg-white rounded-3xl shadow-xs overflow-hidden">
          <CardContent className="p-6 md:p-8 flex flex-col gap-5">
            <div className="flex items-center justify-between pb-4 border-b border-[#EFE6DD]">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-2xl bg-[#FFF8F2] border border-[#EFE6DD] flex items-center justify-center text-[#D89A86]">
                  <Server className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-serif-brand text-xl font-bold text-[#3A2B24]">Platform &amp; Commission Settings</h3>
                  <p className="text-xs text-[#6C5C54] mt-0.5 font-medium">Default production allocation &amp; ambassador commission rates.</p>
                </div>
              </div>
              <Badge className="bg-[#FFF8F2] text-[#3A2B24] border-[#EFE6DD] text-xs font-bold px-3 py-1 rounded-full">
                Global Rules
              </Badge>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
              <div>
                <label className="text-xs font-bold text-[#3A2B24] mb-1.5 block">Store Platform Name</label>
                <Input 
                  value={adminProfile.platformName} 
                  onChange={(e) => setAdminProfile({ ...adminProfile, platformName: e.target.value })}
                  className="rounded-xl border-[#EFE6DD] text-xs font-semibold text-[#3A2B24] bg-white h-11" 
                />
              </div>

              <div>
                <label className="text-xs font-bold text-[#3A2B24] mb-1.5 block">Production Payout Pct (%)</label>
                <Input 
                  value={adminProfile.studioCommission} 
                  onChange={(e) => setAdminProfile({ ...adminProfile, studioCommission: e.target.value })}
                  className="rounded-xl border-[#EFE6DD] text-xs font-bold text-[#3A2B24] bg-white h-11" 
                />
              </div>

              <div>
                <label className="text-xs font-bold text-[#3A2B24] mb-1.5 block">Ambassador Commission (%)</label>
                <Input 
                  value={adminProfile.ambassadorCommission} 
                  onChange={(e) => setAdminProfile({ ...adminProfile, ambassadorCommission: e.target.value })}
                  className="rounded-xl border-[#EFE6DD] text-xs font-bold text-[#3A2B24] bg-white h-11" 
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Store Customer Support Channels */}
        <Card className="border border-[#EFE6DD] bg-white rounded-3xl shadow-xs overflow-hidden">
          <CardContent className="p-6 md:p-8 flex flex-col gap-5">
            <div className="flex items-center justify-between pb-4 border-b border-[#EFE6DD]">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-2xl bg-[#FFF8F2] border border-[#EFE6DD] flex items-center justify-center text-[#D89A86]">
                  <Headphones className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-serif-brand text-xl font-bold text-[#3A2B24]">Store Customer Support Channels</h3>
                  <p className="text-xs text-[#6C5C54] mt-0.5 font-medium">Public contacts displayed to store customers for order inquiries.</p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
              <div>
                <label className="text-xs font-bold text-[#3A2B24] mb-1.5 flex items-center gap-1.5">
                  <Phone className="h-3.5 w-3.5 text-[#D89A86]" /> Store Helpline Phone
                </label>
                <Input 
                  value={adminProfile.storeMobilePhone} 
                  onChange={(e) => setAdminProfile({ ...adminProfile, storeMobilePhone: e.target.value })}
                  className="rounded-xl border-[#EFE6DD] text-xs font-semibold text-[#3A2B24] bg-white h-11" 
                />
              </div>

              <div>
                <label className="text-xs font-bold text-[#3A2B24] mb-1.5 flex items-center gap-1.5">
                  <MessageSquare className="h-3.5 w-3.5 text-emerald-600" /> WhatsApp Support Number
                </label>
                <Input 
                  value={adminProfile.storeWhatsAppNumber} 
                  onChange={(e) => setAdminProfile({ ...adminProfile, storeWhatsAppNumber: e.target.value })}
                  className="rounded-xl border-[#EFE6DD] text-xs font-bold text-[#3A2B24] bg-white h-11" 
                />
              </div>

              <div>
                <label className="text-xs font-bold text-[#3A2B24] mb-1.5 flex items-center gap-1.5">
                  <Mail className="h-3.5 w-3.5 text-[#D89A86]" /> Support Email Address
                </label>
                <Input 
                  type="email"
                  value={adminProfile.storeSupportEmail} 
                  onChange={(e) => setAdminProfile({ ...adminProfile, storeSupportEmail: e.target.value })}
                  className="rounded-xl border-[#EFE6DD] text-xs font-semibold text-[#3A2B24] bg-white h-11" 
                />
              </div>
            </div>

            <div className="flex justify-end pt-4 border-t border-[#EFE6DD]">
              <Button 
                type="submit" 
                className="btn-pixello-primary text-xs font-bold rounded-full px-8 h-11 shadow-md flex items-center gap-2 cursor-pointer"
              >
                <Save className="h-4 w-4 text-white" /> Save Settings &amp; Delivery Matrix Rates
              </Button>
            </div>
          </CardContent>
        </Card>
      </form>
    </div>
  );
}
