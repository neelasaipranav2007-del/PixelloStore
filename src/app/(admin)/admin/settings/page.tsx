"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
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
  Star,
  Gift,
  ArrowRight,
  Edit,
  X,
  Package,
  Upload,
  RotateCcw,
  RefreshCw,
  AlertTriangle,
  Loader2,
  Building2,
  Users,
  FileText,
  CheckSquare,
  Square,
  ShieldAlert,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { getDeliveryConfig, saveDeliveryConfig, DEFAULT_DELIVERY_CONFIG, DeliveryConfig } from "@/lib/deliveryFee";
import { getHomepageStats, saveHomepageStats, DEFAULT_HOMEPAGE_STATS, HomepageStatsConfig, HomepageBadgeItem } from "@/lib/homepageStats";
import {
  getAdminBannersConfig,
  saveAdminBannersConfig,
  DEFAULT_BANNERS_CONFIG,
  AdminBannersConfig,
} from "@/lib/spotlightConfig";
import {
  getHamperConfig,
  saveHamperConfig,
  DEFAULT_HAMPER_CONFIG,
  HamperStoreConfig,
  HamperPackagingConfig,
} from "@/lib/hamperConfig";
import {
  getFrameStudioConfig,
  saveFrameStudioConfig,
  DEFAULT_FRAME_STUDIO_CONFIG,
  DEFAULT_FRAME_WOOD_COLORS,
  DEFAULT_FRAME_GSM_OPTIONS,
  DEFAULT_FRAME_SIZES,
  FrameStudioConfig,
  FrameWoodColorConfig,
  FrameGsmOptionConfig,
  FrameSizeConfig,
} from "@/lib/frameConfig";

const PRESET_BOX_IMAGES = [
  { label: "Signature Luxe", url: "https://images.unsplash.com/photo-1549465220-1a8b9238cd48?w=800&q=80" },
  { label: "Wooden Crate", url: "https://images.unsplash.com/photo-1513519245088-0e12902e5a38?w=800&q=80" },
  { label: "Velvet Heart", url: "https://images.unsplash.com/photo-1513151233558-d860c5398176?w=800&q=80" },
  { label: "Eco Kraft", url: "https://images.unsplash.com/photo-1607344645866-009c320c5ab8?w=800&q=80" },
  { label: "Black Luxe", url: "https://images.unsplash.com/photo-1512909006721-3d6018887383?w=800&q=80" },
  { label: "Pastel Gift", url: "https://images.unsplash.com/photo-1513885535751-8b9238bd345a?w=800&q=80" },
];

const DEFAULT_ADMIN_PROFILE = {
  name: "Pranav",
  email: "neelasaipranav2007@gmail.com",
  username: "admin",
  password: "admin123",
  securityPin: "1234",
  privacyPassword: "privacy@2026",
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
  const [activeTab, setActiveTab] = useState<string>("credentials");
  const [deliveryConfig, setDeliveryConfigState] = useState<DeliveryConfig>(DEFAULT_DELIVERY_CONFIG);
  const [adminProfile, setAdminProfile] = useState(DEFAULT_ADMIN_PROFILE);
  const [homepageStats, setHomepageStats] = useState<HomepageStatsConfig>(DEFAULT_HOMEPAGE_STATS);
  const [bannersConfig, setBannersConfig] = useState<AdminBannersConfig>(DEFAULT_BANNERS_CONFIG);
  const [isSavingBanners, setIsSavingBanners] = useState(false);
  const [hamperConfig, setHamperConfig] = useState<HamperStoreConfig>(DEFAULT_HAMPER_CONFIG);
  const [isSavingHamper, setIsSavingHamper] = useState(false);
  const [frameStudioConfig, setFrameStudioConfig] = useState<FrameStudioConfig>(DEFAULT_FRAME_STUDIO_CONFIG);
  const [isSavingFrameConfig, setIsSavingFrameConfig] = useState(false);
  const [previewColorId, setPreviewColorId] = useState<string>("pine");
  const [previewGsmId, setPreviewGsmId] = useState<string>("180gsm");
  const [previewSizeLabel, setPreviewSizeLabel] = useState<string>("4x6 INCH");
  const [isMounted, setIsMounted] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showSecurityPin, setShowSecurityPin] = useState(false);
  const [showPrivacyPassword, setShowPrivacyPassword] = useState(false);
  const [newCustomPin, setNewCustomPin] = useState("");
  const [newCustomFee, setNewCustomFee] = useState<number | "">("");
  const [newCustomLabel, setNewCustomLabel] = useState("");

  // Live Records & Danger Zone States
  const [platformCounts, setPlatformCounts] = useState({
    customers: 1,
    manufacturers: 1,
    categories: 10,
    products: 97,
    customerOrders: 1,
    purchaseOrders: 1,
    gstInvoices: 1,
    payments: 1,
    totalRecords: 113,
  });
  const [isLoadingCounts, setIsLoadingCounts] = useState(false);
  const [deleteSecondaryStaff, setDeleteSecondaryStaff] = useState(false);
  const [resetStoreDefaults, setResetStoreDefaults] = useState(false);

  // Danger Zone Confirmation Modal States
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);
  const [resetConfirmText, setResetConfirmText] = useState("");
  const [resetPassword, setResetPassword] = useState("");
  const [resetPin, setResetPin] = useState("");
  const [showResetPassword, setShowResetPassword] = useState(false);
  const [showResetPin, setShowResetPin] = useState(false);
  const [isResettingData, setIsResettingData] = useState(false);
  const [resetError, setResetError] = useState<string | null>(null);

  useEffect(() => {
    setIsMounted(true);
    setDeliveryConfigState(getDeliveryConfig());
    setHomepageStats(getHomepageStats());
    setBannersConfig(getAdminBannersConfig());
    setHamperConfig(getHamperConfig());
    setFrameStudioConfig(getFrameStudioConfig());

    fetch("/api/settings/spotlight")
      .then((r) => r.json())
      .then((data) => {
        if (data.success && data.banners) {
          setBannersConfig(data.banners);
        }
      })
      .catch(() => {});

    fetch("/api/settings/hamper")
      .then((r) => r.json())
      .then((data) => {
        if (data.success && data.config) {
          setHamperConfig(data.config);
        }
      })
      .catch(() => {});

    fetch("/api/settings/frames")
      .then((r) => r.json())
      .then((data) => {
        if (data?.success && data?.config) {
          setFrameStudioConfig(data.config);
          saveFrameStudioConfig(data.config);
        }
      })
      .catch(() => {});

    fetch("/api/admin/credentials")
      .then((r) => r.json())
      .then((data) => {
        if (data.success && data.credentials) {
          setAdminProfile((prev) => ({
            ...prev,
            securityPin: data.credentials.securityPin || prev.securityPin || "1234",
            privacyPassword: data.credentials.privacyPassword || prev.privacyPassword || "privacy@2026",
          }));
        }
      })
      .catch(() => {});

    fetch("/api/admin/reset-data")
      .then((r) => r.json())
      .then((data) => {
        if (data.success && data.counts) {
          setPlatformCounts(data.counts);
        }
      })
      .catch(() => {});

    if (typeof window !== "undefined") {
      if (window.location.hash === "#reset" || window.location.search.includes("tab=reset")) {
        setActiveTab("reset");
      }

      const saved = localStorage.getItem("pixello_admin_settings");
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          setAdminProfile({
            ...DEFAULT_ADMIN_PROFILE,
            ...parsed,
            username: parsed.username || DEFAULT_ADMIN_PROFILE.username || "admin",
            password: parsed.password || DEFAULT_ADMIN_PROFILE.password || "admin123",
            securityPin: parsed.securityPin || DEFAULT_ADMIN_PROFILE.securityPin || "1234",
            privacyPassword: parsed.privacyPassword || DEFAULT_ADMIN_PROFILE.privacyPassword || "privacy@2026",
          });
        } catch (e) {}
      }
    }
  }, []);

  const fetchPlatformCounts = async () => {
    setIsLoadingCounts(true);
    try {
      const res = await fetch("/api/admin/reset-data");
      const data = await res.json();
      if (data.success && data.counts) {
        setPlatformCounts(data.counts);
      }
    } catch (err) {
      console.warn("Could not fetch platform counts:", err);
    } finally {
      setIsLoadingCounts(false);
    }
  };

  const handlePermanentResetData = async (e: React.FormEvent) => {
    e.preventDefault();
    setResetError(null);

    if (resetConfirmText.trim() !== "RESET ALL DATA") {
      setResetError("Please type exactly 'RESET ALL DATA' to confirm.");
      return;
    }

    if (!resetPassword.trim()) {
      setResetError("Please enter your Admin Login Password.");
      return;
    }

    const cleanPin = resetPin.replace(/\D/g, "").slice(0, 4);
    if (cleanPin.length !== 4) {
      setResetError("Please enter your 4-Digit Security PIN.");
      return;
    }

    setIsResettingData(true);

    try {
      const res = await fetch("/api/admin/reset-data", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          confirmText: "RESET ALL DATA",
          password: resetPassword.trim(),
          securityPin: cleanPin,
          deleteSecondaryStaff,
          resetStoreDefaults,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        setResetError(data.error || "Reset failed. Verification error.");
        setIsResettingData(false);
        return;
      }

      // Success! Clear client storage
      if (typeof window !== "undefined") {
        localStorage.removeItem("pixello_registered_customers");
        localStorage.removeItem("pixello_user");
        localStorage.removeItem("pixello_cart");
        localStorage.removeItem("pixello_orders");
        localStorage.removeItem("pixello_customer_status_overrides");
        window.dispatchEvent(new Event("auth_change"));
        window.dispatchEvent(new Event("pixello_orders_updated"));
        window.dispatchEvent(new Event("storage"));
      }

      setPlatformCounts(data.counts || {
        customers: 0,
        manufacturers: deleteSecondaryStaff ? 0 : 1,
        categories: 0,
        products: 0,
        customerOrders: 0,
        purchaseOrders: 0,
        gstInvoices: 0,
        payments: 0,
        totalRecords: 0,
      });

      setIsResetModalOpen(false);
      setResetConfirmText("");
      setResetPassword("");
      setResetPin("");
      setResetError(null);
      showToast("✓ All platform business & customer data permanently reset successfully!");
    } catch (err: any) {
      setResetError(err.message || "Failed to reset data.");
    } finally {
      setIsResettingData(false);
    }
  };

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

  const handleSaveBanners = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setIsSavingBanners(true);
    try {
      saveAdminBannersConfig(bannersConfig);
      await fetch("/api/settings/spotlight", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ banners: bannersConfig }),
      });
      showToast("✓ Customer Store Spotlight & Promo Banners updated and synced live!");
    } catch (err) {
      console.error(err);
      showToast("✓ Banners saved locally and synced to customer pages.");
    } finally {
      setIsSavingBanners(false);
    }
  };

  const handleSaveHamper = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setIsSavingHamper(true);
    try {
      saveHamperConfig(hamperConfig);
      await fetch("/api/settings/hamper", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ config: hamperConfig }),
      });
      showToast("✓ 'Build a Hamper' navigation pill & settings updated and live!");
    } catch (err) {
      console.error(err);
      showToast("✓ Hamper settings saved locally and synced to customer navbar.");
    } finally {
      setIsSavingHamper(false);
    }
  };

  const handleAddPackagingBox = () => {
    const newId = `box-${Date.now().toString(36)}`;
    const newBox = {
      id: newId,
      name: "Deluxe Keepsake Gift Box",
      price: 199,
      description: "Rigid magnetic-close luxury presentation box with satin bow ribbon.",
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

  const [editingBox, setEditingBox] = useState<HamperPackagingConfig | null>(null);
  const [editingBoxIndex, setEditingBoxIndex] = useState<number | null>(null);

  const handleOpenEditBoxModal = (pkg: HamperPackagingConfig, index: number) => {
    setEditingBox({ ...pkg });
    setEditingBoxIndex(index);
  };

  const handleSaveEditedBox = async () => {
    if (!editingBox || editingBoxIndex === null) return;
    const updated = [...(hamperConfig.packagingOptions || [])];
    updated[editingBoxIndex] = { ...editingBox };
    const updatedConfig = { ...hamperConfig, packagingOptions: updated };
    setHamperConfig(updatedConfig);
    saveHamperConfig(updatedConfig);
    try {
      await fetch("/api/settings/hamper", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ config: updatedConfig }),
      });
      showToast(`✓ Updated packaging box "${editingBox.name}" live!`);
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

  // --- FRAME CUSTOMIZATION STUDIO HANDLERS ---
  const handleSaveFrameStudio = async (customConfig?: FrameStudioConfig) => {
    setIsSavingFrameConfig(true);
    const toSave = customConfig || frameStudioConfig;
    try {
      saveFrameStudioConfig(toSave);
      await fetch("/api/settings/frames", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ config: toSave }),
      });
      showToast("✓ Frame Studio Sizes, Wood Finishes & GSM Paper Qualities saved and synced live!");
    } catch {
      showToast("✓ Frame Studio settings saved locally and synced.");
    } finally {
      setIsSavingFrameConfig(false);
    }
  };

  const handleAddFrameSize = () => {
    const currentSizes = frameStudioConfig.frameSizes || DEFAULT_FRAME_SIZES;
    const newSize: FrameSizeConfig = {
      label: "12x18 INCH",
      name: "12x18 Inches",
      dimensions: "12 x 18 Inches",
      cmDimensions: "30.5 x 45.7 cm",
      aspectRatio: 12 / 18,
      originalPrice: 499,
      discountPct: 40,
      gsm180Price: 299,
      gsm260Price: 329,
    };
    const updated: FrameStudioConfig = {
      ...frameStudioConfig,
      frameSizes: [...currentSizes, newSize],
    };
    setFrameStudioConfig(updated);
    setPreviewSizeLabel(newSize.label);
    showToast("✓ Added new Frame Size. Click 'Save Frame Studio' to make live.");
  };

  const handleUpdateFrameSize = (index: number, updates: Partial<FrameSizeConfig>) => {
    const currentSizes = [...(frameStudioConfig.frameSizes || DEFAULT_FRAME_SIZES)];
    const item = { ...currentSizes[index], ...updates };
    currentSizes[index] = item;
    setFrameStudioConfig({
      ...frameStudioConfig,
      frameSizes: currentSizes,
    });
  };

  const handleDeleteFrameSize = (index: number) => {
    const currentSizes = frameStudioConfig.frameSizes || DEFAULT_FRAME_SIZES;
    if (currentSizes.length <= 1) {
      alert("At least one frame size is required.");
      return;
    }
    const nextSizes = currentSizes.filter((_, i) => i !== index);
    const updated: FrameStudioConfig = {
      ...frameStudioConfig,
      frameSizes: nextSizes,
    };
    setFrameStudioConfig(updated);
    if (!nextSizes.some((s) => s.label === previewSizeLabel)) {
      setPreviewSizeLabel(nextSizes[0].label);
    }
    showToast("Frame size removed. Click 'Save Frame Studio' to confirm.");
  };

  const handleAddWoodColor = () => {
    const id = `wood-${Date.now()}`;
    const newColor: FrameWoodColorConfig = {
      id,
      name: "Warm Teak",
      finish: "Handcrafted Matte Teak Finish",
      hex: "#8B5A2B",
      borderStyle: "linear-gradient(135deg, #A06535 0%, #75411E 50%, #8B5A2B 100%)",
      matColor: "#FCFAF6",
      description: "Organic golden teak with rich satin wax luster.",
      enabled: true,
    };
    const updated: FrameStudioConfig = {
      ...frameStudioConfig,
      woodColors: [...frameStudioConfig.woodColors, newColor],
    };
    setFrameStudioConfig(updated);
    setPreviewColorId(id);
    showToast("✓ Added new Wood Finish color. Click 'Save Frame Studio' to make live.");
  };

  const handleUpdateWoodColor = (index: number, updates: Partial<FrameWoodColorConfig>) => {
    const nextColors = [...frameStudioConfig.woodColors];
    const item = { ...nextColors[index], ...updates };
    // If hex changed and no custom borderStyle was passed, automatically generate realistic gradient
    if (updates.hex && !updates.borderStyle) {
      item.borderStyle = `linear-gradient(135deg, ${item.hex}DD 0%, ${item.hex} 50%, ${item.hex}BB 100%)`;
    }
    nextColors[index] = item;
    setFrameStudioConfig({
      ...frameStudioConfig,
      woodColors: nextColors,
    });
  };

  const handleDeleteWoodColor = (index: number) => {
    if (frameStudioConfig.woodColors.length <= 1) {
      alert("At least one wood finish color is required.");
      return;
    }
    const nextColors = frameStudioConfig.woodColors.filter((_, i) => i !== index);
    const updated: FrameStudioConfig = {
      ...frameStudioConfig,
      woodColors: nextColors,
    };
    setFrameStudioConfig(updated);
    if (!nextColors.some((c) => c.id === previewColorId)) {
      setPreviewColorId(nextColors[0].id);
    }
    showToast("Wood finish removed. Click 'Save Frame Studio' to confirm.");
  };

  const handleAddGsmOption = () => {
    const id = `gsm-${Date.now()}`;
    const newGsm: FrameGsmOptionConfig = {
      id,
      gsm: "300 GSM",
      title: "300 GSM Archival Canvas",
      description: "Museum-grade heavy textured canvas finish",
      priceDelta: 20,
      badge: "+₹20",
    };
    const updated: FrameStudioConfig = {
      ...frameStudioConfig,
      gsmOptions: [...frameStudioConfig.gsmOptions, newGsm],
    };
    setFrameStudioConfig(updated);
    setPreviewGsmId(id);
    showToast("✓ Added new GSM paper tier. Click 'Save Frame Studio' to make live.");
  };

  const handleUpdateGsmOption = (index: number, updates: Partial<FrameGsmOptionConfig>) => {
    const nextGsm = [...frameStudioConfig.gsmOptions];
    const item = { ...nextGsm[index], ...updates };
    if (typeof updates.priceDelta === "number" && updates.badge === undefined) {
      item.badge = item.priceDelta > 0 ? `+₹${item.priceDelta}` : "";
    }
    nextGsm[index] = item;
    setFrameStudioConfig({
      ...frameStudioConfig,
      gsmOptions: nextGsm,
    });
  };

  const handleDeleteGsmOption = (index: number) => {
    if (frameStudioConfig.gsmOptions.length <= 1) {
      alert("At least one GSM paper option is required.");
      return;
    }
    const nextGsm = frameStudioConfig.gsmOptions.filter((_, i) => i !== index);
    const updated: FrameStudioConfig = {
      ...frameStudioConfig,
      gsmOptions: nextGsm,
    };
    setFrameStudioConfig(updated);
    if (!nextGsm.some((g) => g.id === previewGsmId)) {
      setPreviewGsmId(nextGsm[0].id);
    }
    showToast("GSM option removed. Click 'Save Frame Studio' to confirm.");
  };

  const handleResetFrameStudioDefaults = () => {
    if (confirm("Reset Frame Studio wood finishes and paper GSM tiers to defaults?")) {
      setFrameStudioConfig(DEFAULT_FRAME_STUDIO_CONFIG);
      handleSaveFrameStudio(DEFAULT_FRAME_STUDIO_CONFIG);
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

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const cleanPhone = (adminProfile.phone || "").replace(/\D/g, "").slice(-10) || "9618401231";
      const cleanPin = (adminProfile.securityPin || "").replace(/\D/g, "").slice(0, 4) || "1234";
      const profileToSave = {
        ...adminProfile,
        phone: cleanPhone,
        password: adminProfile.password || "admin123",
        securityPin: cleanPin,
        privacyPassword: adminProfile.privacyPassword || "privacy@2026",
      };

      localStorage.setItem("pixello_admin_settings", JSON.stringify(profileToSave));
      localStorage.setItem("pixello_admin_credentials", JSON.stringify({ 
        phone: cleanPhone, 
        password: profileToSave.password,
        securityPin: cleanPin,
        privacyPassword: profileToSave.privacyPassword,
        name: profileToSave.name, 
        email: profileToSave.email,
        username: profileToSave.username || "admin"
      }));
      localStorage.setItem("pixello_admin_profile", JSON.stringify(profileToSave));
      saveDeliveryConfig(deliveryConfig);
      saveHomepageStats(homepageStats);
      saveAdminBannersConfig(bannersConfig);
      saveHamperConfig(hamperConfig);

      try {
        await Promise.all([
          fetch("/api/admin/credentials", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              loginPassword: profileToSave.password,
              securityPin: cleanPin,
              privacyPassword: profileToSave.privacyPassword,
              name: profileToSave.name,
              email: profileToSave.email,
              phone: cleanPhone,
            }),
          }),
          fetch("/api/settings/homepage-stats", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ stats: homepageStats }),
          }),
          fetch("/api/settings/spotlight", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ banners: bannersConfig }),
          }),
          fetch("/api/settings/hamper", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ config: hamperConfig }),
          }),
        ]);
      } catch (err) {}

      window.dispatchEvent(new Event("pixello_admin_profile_updated"));
      window.dispatchEvent(new Event("pixello_homepage_stats_updated"));
      window.dispatchEvent(new Event("storage"));
    } catch (err) {
      console.error(err);
    }
    showToast(`✓ Admin settings, delivery matrix & store banners saved successfully!`);
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
        <p className="text-xs text-[#6C5C54] mt-1">Manage administrator login credentials, 2-Factor Security PIN, platform data reset, delivery rates &amp; store configurations.</p>
      </div>

      {/* ========================================================================= */}
      {/* 🧭 TOP NAVIGATION TABS (MATCHING ADMIN INTERFACE SPECIFICATION) */}
      {/* ========================================================================= */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 border-b border-[#EFE6DD] scrollbar-none">
        <button
          type="button"
          onClick={() => setActiveTab("credentials")}
          className={cn(
            "px-4 py-2.5 rounded-2xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-2 cursor-pointer",
            activeTab === "credentials"
              ? "bg-[#3A2B24] text-white shadow-xs"
              : "text-[#6C5C54] hover:text-[#3A2B24] hover:bg-[#EFE6DD]/40"
          )}
        >
          <KeyRound className="h-3.5 w-3.5 text-[#D89A86]" /> Admin Credentials &amp; PIN
        </button>

        <button
          type="button"
          onClick={() => {
            setActiveTab("reset");
            fetchPlatformCounts();
          }}
          className={cn(
            "px-4 py-2.5 rounded-2xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-2 cursor-pointer border",
            activeTab === "reset"
              ? "bg-rose-600 text-white border-rose-600 shadow-xs"
              : "text-rose-700 hover:bg-rose-50 border-rose-200/80 bg-rose-50/40"
          )}
        >
          <RotateCcw className="h-3.5 w-3.5 text-rose-500" /> Reset All Data
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("profile")}
          className={cn(
            "px-4 py-2.5 rounded-2xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-2 cursor-pointer",
            activeTab === "profile"
              ? "bg-[#3A2B24] text-white shadow-xs"
              : "text-[#6C5C54] hover:text-[#3A2B24] hover:bg-[#EFE6DD]/40"
          )}
        >
          <Building2 className="h-3.5 w-3.5 text-[#D89A86]" /> Agency Profile &amp; GST
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("banners")}
          className={cn(
            "px-4 py-2.5 rounded-2xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-2 cursor-pointer",
            activeTab === "banners"
              ? "bg-[#3A2B24] text-white shadow-xs"
              : "text-[#6C5C54] hover:text-[#3A2B24] hover:bg-[#EFE6DD]/40"
          )}
        >
          <Award className="h-3.5 w-3.5 text-[#D89A86]" /> Homepage &amp; Badges
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("frames")}
          className={cn(
            "px-4 py-2.5 rounded-2xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-2 cursor-pointer",
            activeTab === "frames"
              ? "bg-[#3A2B24] text-white shadow-xs"
              : "text-[#6C5C54] hover:text-[#3A2B24] hover:bg-[#EFE6DD]/40"
          )}
        >
          <Sparkles className="h-3.5 w-3.5 text-[#D89A86]" /> Frame Studio
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("hamper")}
          className={cn(
            "px-4 py-2.5 rounded-2xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-2 cursor-pointer",
            activeTab === "hamper"
              ? "bg-[#3A2B24] text-white shadow-xs"
              : "text-[#6C5C54] hover:text-[#3A2B24] hover:bg-[#EFE6DD]/40"
          )}
        >
          <Gift className="h-3.5 w-3.5 text-[#D89A86]" /> Hamper Store
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("delivery")}
          className={cn(
            "px-4 py-2.5 rounded-2xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-2 cursor-pointer",
            activeTab === "delivery"
              ? "bg-[#3A2B24] text-white shadow-xs"
              : "text-[#6C5C54] hover:text-[#3A2B24] hover:bg-[#EFE6DD]/40"
          )}
        >
          <Truck className="h-3.5 w-3.5 text-[#D89A86]" /> Delivery &amp; Shipping
        </button>
      </div>

      {/* ========================================================================= */}
      {/* ⚠️ DANGER ZONE: RESET ALL PLATFORM DATA (EXACT DESIGN AS SPECIFIED) */}
      {/* ========================================================================= */}
      {activeTab === "reset" && (
        <Card className="border border-rose-200/90 bg-white rounded-3xl shadow-sm overflow-hidden animate-in fade-in duration-200">
          <CardContent className="p-6 md:p-8 flex flex-col gap-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-[#EFE6DD] gap-3">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-2xl bg-rose-100 border border-rose-200 flex items-center justify-center text-rose-600">
                  <RotateCcw className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-serif-brand text-xl font-bold text-rose-950 flex items-center gap-2">
                    Reset All Platform Data <span className="text-rose-600 text-sm font-semibold">(Danger Zone)</span>
                  </h3>
                  <p className="text-xs text-[#6C5C54] mt-0.5 font-medium">
                    Permanently delete all business, catalog, pricing, customer, supplier, order, invoice, payment, and uploaded file data so you can start completely fresh.
                  </p>
                </div>
              </div>
              <Button
                type="button"
                variant="outline"
                onClick={fetchPlatformCounts}
                disabled={isLoadingCounts}
                className="h-9 px-3.5 rounded-xl border-[#EFE6DD] text-xs font-bold text-[#3A2B24] hover:bg-[#FFF8F2] flex items-center gap-1.5 cursor-pointer self-start sm:self-auto"
              >
                <RefreshCw className={cn("h-3.5 w-3.5 text-[#D89A86]", isLoadingCounts && "animate-spin")} /> Refresh Counts
              </Button>
            </div>

            {/* LIVE RECORDS CURRENTLY STORED */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-[11px] font-bold text-[#6C5C54] uppercase tracking-wider flex items-center gap-1.5">
                  <Package className="h-3.5 w-3.5 text-[#D89A86]" /> LIVE RECORDS CURRENTLY STORED
                </span>
                <span className="text-xs font-bold text-[#6C5C54]">
                  {platformCounts.totalRecords} core business record(s)
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {/* Customers */}
                <div className="p-4 rounded-2xl bg-[#FFF8F2]/60 border border-[#EFE6DD] flex flex-col">
                  <span className="text-xs font-medium text-[#6C5C54]">Customers</span>
                  <span className="text-2xl font-bold text-[#3A2B24] mt-1">{platformCounts.customers}</span>
                </div>
                {/* Manufacturers */}
                <div className="p-4 rounded-2xl bg-[#FFF8F2]/60 border border-[#EFE6DD] flex flex-col">
                  <span className="text-xs font-medium text-[#6C5C54]">Manufacturers</span>
                  <span className="text-2xl font-bold text-[#3A2B24] mt-1">{platformCounts.manufacturers}</span>
                </div>
                {/* Categories */}
                <div className="p-4 rounded-2xl bg-[#FFF8F2]/60 border border-[#EFE6DD] flex flex-col">
                  <span className="text-xs font-medium text-[#6C5C54]">Categories</span>
                  <span className="text-2xl font-bold text-[#3A2B24] mt-1">{platformCounts.categories}</span>
                </div>
                {/* Products & Catalog */}
                <div className="p-4 rounded-2xl bg-[#FFF8F2]/60 border border-[#EFE6DD] flex flex-col">
                  <span className="text-xs font-medium text-[#6C5C54]">Products &amp; Catalog</span>
                  <span className="text-2xl font-bold text-[#3A2B24] mt-1">{platformCounts.products}</span>
                </div>
                {/* Customer Orders */}
                <div className="p-4 rounded-2xl bg-[#FFF8F2]/60 border border-[#EFE6DD] flex flex-col">
                  <span className="text-xs font-medium text-[#6C5C54]">Customer Orders</span>
                  <span className="text-2xl font-bold text-[#3A2B24] mt-1">{platformCounts.customerOrders}</span>
                </div>
                {/* Purchase Orders */}
                <div className="p-4 rounded-2xl bg-[#FFF8F2]/60 border border-[#EFE6DD] flex flex-col">
                  <span className="text-xs font-medium text-[#6C5C54]">Purchase Orders</span>
                  <span className="text-2xl font-bold text-[#3A2B24] mt-1">{platformCounts.purchaseOrders}</span>
                </div>
                {/* GST Invoices */}
                <div className="p-4 rounded-2xl bg-[#FFF8F2]/60 border border-[#EFE6DD] flex flex-col">
                  <span className="text-xs font-medium text-[#6C5C54]">GST Invoices</span>
                  <span className="text-2xl font-bold text-[#3A2B24] mt-1">{platformCounts.gstInvoices}</span>
                </div>
                {/* Payments */}
                <div className="p-4 rounded-2xl bg-[#FFF8F2]/60 border border-[#EFE6DD] flex flex-col">
                  <span className="text-xs font-medium text-[#6C5C54]">Payments</span>
                  <span className="text-2xl font-bold text-[#3A2B24] mt-1">{platformCounts.payments}</span>
                </div>
              </div>
            </div>

            {/* Columns: Will Be Permanently Deleted & Preserved Safely By Default */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Red Column */}
              <div className="p-5 rounded-2xl bg-rose-50/70 border border-rose-200/90 flex flex-col gap-3">
                <div className="flex items-center gap-2 text-rose-800 font-bold text-xs uppercase tracking-wider">
                  <Trash2 className="h-4 w-4 text-rose-600" /> Will Be Permanently Deleted
                </div>
                <ul className="text-xs text-rose-950/90 space-y-2 list-disc list-inside">
                  <li>All Customers, Delivery Addresses, Custom Prices, Carts &amp; Customer Portal Logins</li>
                  <li>All Categories, Subcategories, Products, Published Catalog Items &amp; Product Photos</li>
                  <li>All Inventory Balances, Stock Adjustments &amp; Movement History</li>
                  <li>All Customer Orders, Split/Manual Purchase Orders, GST Invoices &amp; Recorded Payments</li>
                  <li>All Notifications, Prior Audit Logs, &amp; Counters reset to 1001</li>
                </ul>
              </div>

              {/* Green Column */}
              <div className="p-5 rounded-2xl bg-emerald-50/70 border border-emerald-200/90 flex flex-col gap-3">
                <div className="flex items-center gap-2 text-emerald-800 font-bold text-xs uppercase tracking-wider">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600" /> Preserved Safely By Default
                </div>
                <ul className="text-xs text-emerald-950/90 space-y-2 list-disc list-inside">
                  <li>Your active Admin login account ({adminProfile.email || "admin@pixellostore.com"}) and 4-digit Security PIN stay working</li>
                  <li>Default Global Margin resets cleanly to 15% so Margin Pricing works immediately</li>
                  <li>System Roles and Storage Buckets stay configured for immediate reuse</li>
                  <li>Store Profile, Bank Details, Logo &amp; Staff Users stay intact unless checked below</li>
                </ul>
              </div>
            </div>

            {/* OPTIONAL ADDITIONAL CLEANUP */}
            <div className="p-4 rounded-2xl bg-[#FFF8F2]/60 border border-[#EFE6DD] flex flex-col gap-3">
              <span className="text-[11px] font-bold text-[#6C5C54] uppercase tracking-wider">
                OPTIONAL ADDITIONAL CLEANUP
              </span>
              <div className="flex flex-col gap-2.5">
                <label className="flex items-start gap-2.5 cursor-pointer text-xs text-[#3A2B24] font-medium">
                  <input
                    type="checkbox"
                    checked={deleteSecondaryStaff}
                    onChange={(e) => setDeleteSecondaryStaff(e.target.checked)}
                    className="mt-0.5 rounded border-[#EFE6DD] text-rose-600 focus:ring-rose-500 cursor-pointer"
                  />
                  <span>Also delete other Staff &amp; secondary Admin accounts (0 account(s) currently). Your own active Admin account will never be deleted.</span>
                </label>
                <label className="flex items-start gap-2.5 cursor-pointer text-xs text-[#3A2B24] font-medium">
                  <input
                    type="checkbox"
                    checked={resetStoreDefaults}
                    onChange={(e) => setResetStoreDefaults(e.target.checked)}
                    className="mt-0.5 rounded border-[#EFE6DD] text-rose-600 focus:ring-rose-500 cursor-pointer"
                  />
                  <span>Also reset Store Profile, GSTIN, Bank Details &amp; Logo back to initial factory defaults (clears uploaded brand logo too).</span>
                </label>
              </div>
            </div>

            {/* Bottom Alert & Trigger Button */}
            <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2 text-xs text-amber-900 font-medium">
                <AlertTriangle className="h-4 w-4 text-amber-600 flex-shrink-0" />
                <span>This action cannot be undone. Export PDF backups from Orders or Customers before proceeding if you want an offline copy.</span>
              </div>
              <Button
                type="button"
                onClick={() => {
                  setIsResetModalOpen(true);
                  setResetConfirmText("");
                  setResetPassword("");
                  setResetPin("");
                  setResetError(null);
                }}
                className="bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl h-10 px-5 flex items-center gap-2 cursor-pointer shadow-sm self-start sm:self-auto whitespace-nowrap"
              >
                <RotateCcw className="h-3.5 w-3.5 text-white" /> Reset All Data...
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <form onSubmit={handleSaveSettings} className={cn("flex flex-col gap-6", activeTab === "reset" && "hidden")}>
        
        {/* ========================================================================= */}
        {/* 🔐 ADMIN LOGIN CREDENTIALS & SECURITY CARD */}
        {/* ========================================================================= */}
        <Card className={cn(
          "border border-[#EFE6DD] bg-white rounded-3xl shadow-sm overflow-hidden",
          activeTab !== "credentials" && activeTab !== "profile" && "hidden"
        )}>
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

              {/* 4-Digit Security PIN (2FA Key) */}
              <div>
                <label className="text-xs font-bold text-[#3A2B24] mb-1.5 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <KeyRound className="h-3.5 w-3.5 text-[#D89A86]" /> 4-Digit Security PIN *
                  </span>
                  <span className="text-[10px] text-rose-600 font-bold">2FA Security Key</span>
                </label>
                <div className="relative flex items-center">
                  <Input 
                    type={showSecurityPin ? "text" : "password"}
                    maxLength={4}
                    value={adminProfile.securityPin || ""} 
                    onChange={(e) => {
                      const clean = e.target.value.replace(/\D/g, "").slice(0, 4);
                      setAdminProfile({ ...adminProfile, securityPin: clean });
                    }}
                    placeholder="1234"
                    className="rounded-xl border-[#EFE6DD] text-xs font-mono font-bold tracking-widest text-[#3A2B24] bg-[#FFF8F2]/40 h-11 pr-11 focus-visible:ring-[#D89A86]" 
                    required
                  />
                  <button
                    type="button"
                    tabIndex={-1}
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setShowSecurityPin((prev) => !prev);
                    }}
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-lg text-[#6C5C54] hover:text-[#3A2B24] hover:bg-[#EFE6DD]/40 cursor-pointer z-10 transition-colors"
                    title={showSecurityPin ? "Hide PIN" : "Show PIN"}
                  >
                    {showSecurityPin ? (
                      <EyeOff className="h-4 w-4 text-[#D89A86]" />
                    ) : (
                      <Eye className="h-4 w-4 text-[#6C5C54]" />
                    )}
                  </button>
                </div>
              </div>

              {/* Emergency Privacy Password (Lockout Recovery Key) */}
              <div>
                <label className="text-xs font-bold text-[#3A2B24] mb-1.5 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <ShieldCheck className="h-3.5 w-3.5 text-[#D89A86]" /> Emergency Privacy Password *
                  </span>
                  <span className="text-[10px] text-amber-600 font-bold">Lockout Recovery</span>
                </label>
                <div className="relative flex items-center">
                  <Input 
                    type={showPrivacyPassword ? "text" : "password"}
                    value={adminProfile.privacyPassword || ""} 
                    onChange={(e) => setAdminProfile({ ...adminProfile, privacyPassword: e.target.value })}
                    placeholder="privacy@2026"
                    className="rounded-xl border-[#EFE6DD] text-xs font-mono font-bold text-[#3A2B24] bg-[#FFF8F2]/40 h-11 pr-11 focus-visible:ring-[#D89A86]" 
                    required
                  />
                  <button
                    type="button"
                    tabIndex={-1}
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setShowPrivacyPassword((prev) => !prev);
                    }}
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-lg text-[#6C5C54] hover:text-[#3A2B24] hover:bg-[#EFE6DD]/40 cursor-pointer z-10 transition-colors"
                    title={showPrivacyPassword ? "Hide password" : "Show password"}
                  >
                    {showPrivacyPassword ? (
                      <EyeOff className="h-4 w-4 text-[#D89A86]" />
                    ) : (
                      <Eye className="h-4 w-4 text-[#6C5C54]" />
                    )}
                  </button>
                </div>
                <p className="text-[10px] text-[#6C5C54] mt-1">
                  Secret privacy key used to unlock the Admin Portal if locked out after 5 consecutive failed login attempts.
                </p>
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
              <span>💡 <strong>Live Security Sync:</strong> Saving changes will immediately update the login password for <strong>/admin/login</strong> and sync your 4-digit 2FA Security PIN across all administrative deletion actions.</span>
              <Button
                type="submit"
                size="sm"
                className="bg-[#3A2B24] hover:bg-[#2E201A] text-white text-xs font-bold rounded-xl h-8 px-4 flex items-center gap-1.5 cursor-pointer shadow-2xs"
              >
                <Save className="h-3.5 w-3.5 text-[#D89A86]" /> Save Credentials &amp; PIN
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
        {/* 🎨 CUSTOMER STORE PROMOTIONAL & SPOTLIGHT BANNERS (ADMIN EDITABLE) */}
        {/* ========================================================================= */}
        <Card className="border border-[#EFE6DD] bg-white rounded-3xl shadow-sm overflow-hidden">
          <CardContent className="p-6 md:p-8 flex flex-col gap-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-[#EFE6DD] gap-3">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-2xl bg-[#FFF8F2] border border-[#EFE6DD] flex items-center justify-center text-[#D89A86] shadow-2xs">
                  <Sparkles className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-serif-brand text-xl font-bold text-[#3A2B24]">Store Promotional &amp; Spotlight Banners</h3>
                  <p className="text-xs text-[#6C5C54] mt-0.5 font-medium">Customize the Featured Spotlight banner on the Products page and Welcome Promo offer on the Homepage.</p>
                </div>
              </div>
              <Button
                type="button"
                onClick={() => handleSaveBanners()}
                disabled={isSavingBanners}
                className="btn-pixello-primary text-xs font-bold rounded-full px-5 h-9 shadow-2xs flex items-center gap-1.5 cursor-pointer self-start sm:self-auto"
              >
                <Save className="h-3.5 w-3.5 text-white" />
                {isSavingBanners ? "Saving..." : "Save Banners & Sync"}
              </Button>
            </div>

            {/* TWO SUB-CARDS: 1. Spotlight Product Banner, 2. Welcome Promo Offer */}
            <div className="flex flex-col gap-8">
              
              {/* --- 1. FEATURED SPOTLIGHT PRODUCT BANNER (Products Catalog Page) --- */}
              <div className="p-5 sm:p-6 bg-[#FFFDFB] rounded-2xl border border-[#F2C8B5]/60 flex flex-col gap-5 shadow-2xs">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#F2C8B5]/40">
                  <div className="flex items-center gap-2">
                    <Badge className="bg-[#D89A86] text-white border-none text-[11px] font-extrabold px-2.5 py-0.5 rounded-full">
                      Catalog Page Banner
                    </Badge>
                    <h4 className="font-serif-brand text-base font-bold text-[#3A2B24]">
                      Featured Spotlight Product Banner (/products)
                    </h4>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-[#3A2B24]">Status:</span>
                    <button
                      type="button"
                      onClick={() => setBannersConfig({
                        ...bannersConfig,
                        spotlight: { ...bannersConfig.spotlight, enabled: !bannersConfig.spotlight.enabled }
                      })}
                      className={cn(
                        "text-xs font-extrabold px-3 py-1 rounded-full cursor-pointer transition-all border",
                        bannersConfig.spotlight.enabled
                          ? "bg-emerald-100 text-emerald-800 border-emerald-300"
                          : "bg-rose-100 text-rose-800 border-rose-300"
                      )}
                    >
                      {bannersConfig.spotlight.enabled ? "✓ Visible / Active" : "✕ Hidden"}
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="text-xs font-bold text-[#3A2B24] mb-1.5 block">Spotlight Tag</label>
                    <Input
                      value={bannersConfig.spotlight.tag}
                      onChange={(e) => setBannersConfig({
                        ...bannersConfig,
                        spotlight: { ...bannersConfig.spotlight, tag: e.target.value }
                      })}
                      placeholder="e.g. FEATURED SPOTLIGHT"
                      className="rounded-xl border-[#EFE6DD] text-xs font-semibold text-[#3A2B24] bg-white h-10"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-[#3A2B24] mb-1.5 block">Subtitle / Highlight Badge</label>
                    <Input
                      value={bannersConfig.spotlight.badgeText}
                      onChange={(e) => setBannersConfig({
                        ...bannersConfig,
                        spotlight: { ...bannersConfig.spotlight, badgeText: e.target.value }
                      })}
                      placeholder="e.g. Handcrafted & Locally Printed"
                      className="rounded-xl border-[#EFE6DD] text-xs font-semibold text-[#3A2B24] bg-white h-10"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-[#3A2B24] mb-1.5 block">Spotlight Product Title *</label>
                    <Input
                      value={bannersConfig.spotlight.title}
                      onChange={(e) => setBannersConfig({
                        ...bannersConfig,
                        spotlight: { ...bannersConfig.spotlight, title: e.target.value }
                      })}
                      placeholder="e.g. Handcrafted Classic Wooden Frame"
                      className="rounded-xl border-[#EFE6DD] text-xs font-bold text-[#3A2B24] bg-white h-10"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-[#3A2B24] mb-1.5 block">Spotlight Description</label>
                  <Input
                    value={bannersConfig.spotlight.description}
                    onChange={(e) => setBannersConfig({
                      ...bannersConfig,
                      spotlight: { ...bannersConfig.spotlight, description: e.target.value }
                    })}
                    placeholder="Brief description of the highlighted product..."
                    className="rounded-xl border-[#EFE6DD] text-xs font-medium text-[#3A2B24] bg-white h-10"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                  <div>
                    <label className="text-xs font-bold text-[#3A2B24] mb-1.5 block">Original Price (₹)</label>
                    <Input
                      type="number"
                      min="0"
                      value={bannersConfig.spotlight.originalPrice}
                      onChange={(e) => setBannersConfig({
                        ...bannersConfig,
                        spotlight: { ...bannersConfig.spotlight, originalPrice: Number(e.target.value) || 0 }
                      })}
                      className="rounded-xl border-[#EFE6DD] text-xs font-bold text-[#3A2B24] bg-white h-10"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-[#3A2B24] mb-1.5 block">Spotlight Offer Price (₹)</label>
                    <Input
                      type="number"
                      min="0"
                      value={bannersConfig.spotlight.price}
                      onChange={(e) => setBannersConfig({
                        ...bannersConfig,
                        spotlight: { ...bannersConfig.spotlight, price: Number(e.target.value) || 0 }
                      })}
                      className="rounded-xl border-[#EFE6DD] text-xs font-bold text-emerald-700 bg-white h-10"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-[#3A2B24] mb-1.5 block">Action Button Text</label>
                    <Input
                      value={bannersConfig.spotlight.buttonText}
                      onChange={(e) => setBannersConfig({
                        ...bannersConfig,
                        spotlight: { ...bannersConfig.spotlight, buttonText: e.target.value }
                      })}
                      placeholder="e.g. Customize & Order"
                      className="rounded-xl border-[#EFE6DD] text-xs font-semibold text-[#3A2B24] bg-white h-10"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-[#3A2B24] mb-1.5 block">Target Link / URL</label>
                    <Input
                      value={bannersConfig.spotlight.productLink}
                      onChange={(e) => setBannersConfig({
                        ...bannersConfig,
                        spotlight: { ...bannersConfig.spotlight, productLink: e.target.value }
                      })}
                      placeholder="e.g. /product/1"
                      className="rounded-xl border-[#EFE6DD] text-xs font-mono text-[#3A2B24] bg-white h-10"
                    />
                  </div>
                </div>

                {/* Live Preview Card */}
                <div className="p-4 bg-white rounded-xl border border-[#EFE6DD] flex flex-col gap-2">
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#6C5C54]">
                    Live Visual Preview (As seen on /products):
                  </span>
                  <div className="p-4 rounded-xl bg-gradient-to-r from-[#FFF8F2] via-white to-[#FFF4ED] border border-[#F2C8B5]">
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="bg-[#D89A86] text-white text-[10px] font-extrabold px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                            {bannersConfig.spotlight.tag || "FEATURED SPOTLIGHT"}
                          </span>
                          {bannersConfig.spotlight.badgeText && (
                            <span className="text-[11px] font-bold text-[#D89A86]">
                              {bannersConfig.spotlight.badgeText}
                            </span>
                          )}
                        </div>
                        <h5 className="font-serif-brand text-base font-bold text-[#3A2B24]">
                          {bannersConfig.spotlight.title || "Product Title"}
                        </h5>
                        <p className="text-xs text-[#6C5C54] max-w-lg">
                          {bannersConfig.spotlight.description || "Product description..."}
                        </p>
                      </div>
                      <div className="flex items-center gap-3 shrink-0">
                        <div className="text-right">
                          {bannersConfig.spotlight.originalPrice > 0 && (
                            <span className="text-[10px] text-[#6C5C54] block line-through">
                              ₹{bannersConfig.spotlight.originalPrice}
                            </span>
                          )}
                          <span className="text-lg font-extrabold text-[#3A2B24]">
                            ₹{bannersConfig.spotlight.price}
                          </span>
                        </div>
                        <span className="btn-pixello-primary text-xs font-bold rounded-full px-4 py-2 shadow-xs pointer-events-none">
                          {bannersConfig.spotlight.buttonText || "Customize & Order"}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* --- 2. HOMEPAGE WELCOME PROMOTIONAL OFFER BANNER --- */}
              <div className="p-5 sm:p-6 bg-[#FFFDFB] rounded-2xl border border-[#F2C8B5]/60 flex flex-col gap-5 shadow-2xs">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#F2C8B5]/40">
                  <div className="flex items-center gap-2">
                    <Badge className="bg-[#3A2B24] text-[#D89A86] border-none text-[11px] font-extrabold px-2.5 py-0.5 rounded-full">
                      Homepage Banner
                    </Badge>
                    <h4 className="font-serif-brand text-base font-bold text-[#3A2B24]">
                      Homepage Promotional Welcome Offer Banner (/)
                    </h4>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-[#3A2B24]">Status:</span>
                    <button
                      type="button"
                      onClick={() => setBannersConfig({
                        ...bannersConfig,
                        welcomePromo: { ...bannersConfig.welcomePromo, enabled: !bannersConfig.welcomePromo.enabled }
                      })}
                      className={cn(
                        "text-xs font-extrabold px-3 py-1 rounded-full cursor-pointer transition-all border",
                        bannersConfig.welcomePromo.enabled
                          ? "bg-emerald-100 text-emerald-800 border-emerald-300"
                          : "bg-rose-100 text-rose-800 border-rose-300"
                      )}
                    >
                      {bannersConfig.welcomePromo.enabled ? "✓ Visible / Active" : "✕ Hidden"}
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="text-xs font-bold text-[#3A2B24] mb-1.5 block">Special Badge</label>
                    <Input
                      value={bannersConfig.welcomePromo.badge}
                      onChange={(e) => setBannersConfig({
                        ...bannersConfig,
                        welcomePromo: { ...bannersConfig.welcomePromo, badge: e.target.value }
                      })}
                      placeholder="e.g. Special Offer"
                      className="rounded-xl border-[#EFE6DD] text-xs font-semibold text-[#3A2B24] bg-white h-10"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-[#3A2B24] mb-1.5 block">Verified Badge</label>
                    <Input
                      value={bannersConfig.welcomePromo.verifiedBadge}
                      onChange={(e) => setBannersConfig({
                        ...bannersConfig,
                        welcomePromo: { ...bannersConfig.welcomePromo, verifiedBadge: e.target.value }
                      })}
                      placeholder="e.g. Verified Deal"
                      className="rounded-xl border-[#EFE6DD] text-xs font-semibold text-[#3A2B24] bg-white h-10"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-[#3A2B24] mb-1.5 block">Offer Title *</label>
                    <Input
                      value={bannersConfig.welcomePromo.title}
                      onChange={(e) => setBannersConfig({
                        ...bannersConfig,
                        welcomePromo: { ...bannersConfig.welcomePromo, title: e.target.value }
                      })}
                      placeholder="e.g. Exclusive Pixello Welcome Offer"
                      className="rounded-xl border-[#EFE6DD] text-xs font-bold text-[#3A2B24] bg-white h-10"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="text-xs font-bold text-[#3A2B24] mb-1.5 block">Discount Label</label>
                    <Input
                      value={bannersConfig.welcomePromo.discountLabel}
                      onChange={(e) => setBannersConfig({
                        ...bannersConfig,
                        welcomePromo: { ...bannersConfig.welcomePromo, discountLabel: e.target.value }
                      })}
                      placeholder="e.g. 10% OFF"
                      className="rounded-xl border-[#EFE6DD] text-xs font-bold text-[#D89A86] bg-white h-10"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-[#3A2B24] mb-1.5 block">Coupon Promo Code *</label>
                    <Input
                      value={bannersConfig.welcomePromo.code}
                      onChange={(e) => setBannersConfig({
                        ...bannersConfig,
                        welcomePromo: { ...bannersConfig.welcomePromo, code: e.target.value.toUpperCase().replace(/\s+/g, '') }
                      })}
                      placeholder="e.g. WELCOME10"
                      className="rounded-xl border-[#EFE6DD] text-xs font-mono font-bold text-[#3A2B24] bg-white h-10"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-[#3A2B24] mb-1.5 block">Claim Button Text</label>
                    <Input
                      value={bannersConfig.welcomePromo.buttonText}
                      onChange={(e) => setBannersConfig({
                        ...bannersConfig,
                        welcomePromo: { ...bannersConfig.welcomePromo, buttonText: e.target.value }
                      })}
                      placeholder="e.g. Claim & Copy Code"
                      className="rounded-xl border-[#EFE6DD] text-xs font-semibold text-[#3A2B24] bg-white h-10"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-[#3A2B24] mb-1.5 block">Offer Description</label>
                  <Input
                    value={bannersConfig.welcomePromo.description}
                    onChange={(e) => setBannersConfig({
                      ...bannersConfig,
                      welcomePromo: { ...bannersConfig.welcomePromo, description: e.target.value }
                    })}
                    placeholder="Short description of the promotional offer..."
                    className="rounded-xl border-[#EFE6DD] text-xs font-medium text-[#3A2B24] bg-white h-10"
                  />
                </div>

                {/* Live Preview Card */}
                <div className="p-4 bg-white rounded-xl border border-[#EFE6DD] flex flex-col gap-2">
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#6C5C54]">
                    Live Visual Preview (As seen on Homepage):
                  </span>
                  <div className="p-4 rounded-xl bg-gradient-to-br from-white via-[#FFF9F5] to-[#FFF4ED] border border-[#F2C8B5]">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                      <div className="space-y-1 max-w-xl">
                        <div className="flex items-center gap-2">
                          <span className="inline-flex items-center gap-1 rounded-full bg-[#D89A86]/15 px-2.5 py-0.5 text-[10px] font-extrabold text-[#D89A86] border border-[#D89A86]/30">
                            ✨ {bannersConfig.welcomePromo.badge || "Special Offer"}
                          </span>
                          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700 border border-emerald-200">
                            🛡️ {bannersConfig.welcomePromo.verifiedBadge || "Verified Deal"}
                          </span>
                        </div>
                        <h5 className="font-serif-brand text-base font-bold text-[#3A2B24]">
                          {bannersConfig.welcomePromo.title} — <span className="text-[#D89A86]">{bannersConfig.welcomePromo.discountLabel}</span>
                        </h5>
                        <p className="text-xs text-[#6C5C54] leading-relaxed">
                          {bannersConfig.welcomePromo.description}
                        </p>
                      </div>
                      <div className="flex flex-col sm:items-end gap-2 shrink-0">
                        <div className="flex items-center gap-1.5 rounded-xl border-2 border-dashed border-[#D89A86] bg-white/90 px-3 py-1.5">
                          <span className="font-mono text-xs font-black tracking-widest text-[#3A2B24]">
                            {bannersConfig.welcomePromo.code}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="inline-flex items-center justify-center rounded-full px-4 py-2 text-xs font-bold bg-[#D89A86] text-white pointer-events-none">
                            {bannersConfig.welcomePromo.buttonText || "Claim & Copy Code"}
                          </span>
                          <span className="hidden sm:inline-flex items-center justify-center rounded-full border border-[#D89A86]/40 bg-white/80 px-3 py-2 text-xs font-bold text-[#3A2B24] pointer-events-none">
                            Shop →
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

              </div>

            </div>

            <div className="flex justify-end pt-4 border-t border-[#EFE6DD]">
              <Button
                type="button"
                onClick={() => handleSaveBanners()}
                disabled={isSavingBanners}
                className="btn-pixello-primary text-xs font-bold rounded-full px-8 h-11 shadow-md flex items-center gap-2 cursor-pointer"
              >
                <Save className="h-4 w-4 text-white" />
                {isSavingBanners ? "Saving..." : "Save Banners & Sync Live"}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* ========================================================================= */}
        {/* 🎁 HAMPER MANAGEMENT & PACKAGING BOXES (EDITABLE HERE & ON /admin/hamper) */}
        {/* ========================================================================= */}
        <Card className="border-2 border-[#D89A86]/40 bg-gradient-to-br from-[#FFFDFB] via-[#FFF8F2] to-[#FAF3EC] rounded-3xl shadow-sm overflow-hidden">
          <CardContent className="p-6 md:p-8 flex flex-col gap-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-5 pb-5 border-b border-[#EFE6DD]">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-2xl bg-[#D89A86]/20 border border-[#D89A86]/40 flex items-center justify-center text-2xl flex-shrink-0 shadow-2xs">
                  🎁
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-serif-brand text-xl font-bold text-[#3A2B24]">
                      Hamper Presentation Boxes &amp; Packaging Pricing
                    </h3>
                    <Badge className="bg-[#D89A86] text-white text-[10px] font-extrabold px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                      Live Editable
                    </Badge>
                  </div>
                  <p className="text-xs text-[#6C5C54] mt-1 font-medium">
                    Edit packaging box styles, pricing, badges, and photos right here or in the dedicated hamper portal.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2.5 flex-wrap">
                <Button
                  type="button"
                  onClick={handleAddPackagingBox}
                  className="h-10 px-4 rounded-xl bg-[#D89A86] hover:bg-[#c78672] text-white text-xs font-bold flex items-center gap-1.5 shadow-xs cursor-pointer"
                >
                  <Plus className="h-4 w-4" /> Add Box
                </Button>
                <Link
                  href="/admin/hamper"
                  className="btn-pixello-primary text-xs font-bold rounded-full px-5 h-10 shadow-md flex items-center gap-2 cursor-pointer flex-shrink-0"
                >
                  <span>Open Full Hamper Page</span>
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </div>

            {/* PACKAGING BOXES GRID */}
            {hamperConfig.packagingOptions && hamperConfig.packagingOptions.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4.5">
                {hamperConfig.packagingOptions.map((pkg, pIdx) => (
                  <div
                    key={pkg.id || pIdx}
                    className="p-4 bg-white/90 rounded-2xl border border-[#EFE6DD] flex flex-col justify-between gap-3 relative shadow-2xs hover:shadow-xs transition-shadow"
                  >
                    {/* Header */}
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
                        <span className="text-[10px] font-mono font-bold text-[#6C5C54] bg-[#FFF8F2] px-2 py-0.5 rounded-md border border-[#EFE6DD]">
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
            ) : (
              <div className="p-8 text-center bg-white/60 border-2 border-dashed border-[#EFE6DD] rounded-2xl flex flex-col items-center justify-center gap-3">
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
        {/* 🖼️ VISUAL MEMORY FRAMES STUDIO CUSTOMIZATION (WOOD COLORS & GSM TIERS)   */}
        {/* ========================================================================= */}
        <Card className="border-2 border-[#D89A86]/40 bg-gradient-to-br from-[#FFFDFB] via-[#FFF8F2] to-[#FAF3EC] rounded-3xl shadow-sm overflow-hidden">
          <CardContent className="p-6 md:p-8 flex flex-col gap-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-[#EFE6DD]">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-2xl bg-[#D89A86]/20 border border-[#D89A86]/40 flex items-center justify-center text-2xl flex-shrink-0 shadow-2xs">
                  🖼️
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-serif-brand text-xl font-bold text-[#3A2B24]">
                      Visual Memory Frames Studio Customization
                    </h3>
                    <Badge className="bg-[#D89A86] text-white text-[10px] font-extrabold px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                      Live Store Sync
                    </Badge>
                    <Badge className="bg-[#3A2B24] text-white text-[10px] font-bold px-2.5 py-0.5 rounded-full">
                      Step 3 &amp; 4 Editor
                    </Badge>
                  </div>
                  <p className="text-xs text-[#6C5C54] mt-0.5 font-medium">
                    Customize Wood &amp; Finish Colors (Step 3) and Print Paper Quality GSM (Step 4) displayed on Customer Product &amp; Customization Studio pages.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 self-start sm:self-auto flex-wrap">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleResetFrameStudioDefaults}
                  className="rounded-full text-xs font-bold h-9 px-4 border-[#EFE6DD] hover:bg-white text-[#6C5C54] cursor-pointer"
                >
                  Reset Defaults
                </Button>
                <Button
                  type="button"
                  onClick={() => handleSaveFrameStudio()}
                  disabled={isSavingFrameConfig}
                  className="btn-pixello-primary text-xs font-bold rounded-full px-5 h-9 shadow-2xs flex items-center gap-1.5 cursor-pointer"
                >
                  <Save className="h-3.5 w-3.5 text-white" />
                  {isSavingFrameConfig ? "Saving..." : "Save Frame Studio & Sync"}
                </Button>
              </div>
            </div>

            {/* TWO EDITING COLUMNS + LIVE CUSTOMER PREVIEW */}
            <div className="flex flex-col gap-6">

              {/* --- SECTION 0: FRAME SIZES & DIMENSIONS (STEP 2) --- */}
              <div className="p-5 sm:p-6 bg-white rounded-2xl border border-[#EFE6DD] flex flex-col gap-4 shadow-2xs">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#EFE6DD]">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="h-6 w-6 rounded-full bg-[#3A2B24] text-white text-xs font-bold flex items-center justify-center">
                        2
                      </span>
                      <h4 className="font-serif-brand text-base font-bold text-[#3A2B24]">
                        Frame Sizes &amp; Dimensions (Customer Step 2)
                      </h4>
                    </div>
                    <p className="text-[11px] text-[#6C5C54] mt-0.5">
                      Configure frame sizes (e.g. 4x6, 5x7, 6x8, A4, or custom), dimensions, original MRP, and 180G/260G prices. These sizes appear in Step 2 and live preview in the frame studio!
                    </p>
                  </div>
                  <Button
                    type="button"
                    onClick={handleAddFrameSize}
                    className="btn-pixello-primary text-xs font-bold rounded-full px-4 h-8 flex items-center gap-1.5 cursor-pointer self-start sm:self-auto"
                  >
                    <Plus className="h-3.5 w-3.5 text-white" />
                    <span>Add New Size</span>
                  </Button>
                </div>

                {/* List of Frame Sizes */}
                <div className="space-y-3">
                  {(frameStudioConfig.frameSizes || DEFAULT_FRAME_SIZES).map((size, sIdx) => (
                    <div
                      key={size.label || sIdx}
                      className="p-4 rounded-xl border border-[#EFE6DD] bg-[#FFFDFB] hover:border-[#D89A86]/50 transition-all flex flex-col gap-3"
                    >
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-6 gap-3 items-center">
                        <div>
                          <label className="text-[10px] font-bold text-[#6C5C54] block mb-1">Size Label</label>
                          <Input
                            value={size.label}
                            onChange={(e) => handleUpdateFrameSize(sIdx, { label: e.target.value })}
                            placeholder="e.g. 4x6 INCH"
                            className="h-8 rounded-lg border-[#EFE6DD] text-xs font-bold"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] font-bold text-[#6C5C54] block mb-1">Button Name</label>
                          <Input
                            value={size.name}
                            onChange={(e) => handleUpdateFrameSize(sIdx, { name: e.target.value })}
                            placeholder="e.g. 4x6 Inches"
                            className="h-8 rounded-lg border-[#EFE6DD] text-xs font-bold"
                          />
                        </div>
                        <div className="md:col-span-2">
                          <label className="text-[10px] font-bold text-[#6C5C54] block mb-1">Dimensions &amp; Metric</label>
                          <Input
                            value={size.dimensions}
                            onChange={(e) => handleUpdateFrameSize(sIdx, { dimensions: e.target.value })}
                            placeholder="e.g. 4 x 6 Inches (10.1 x 15.2 cm)"
                            className="h-8 rounded-lg border-[#EFE6DD] text-xs font-medium"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] font-bold text-[#6C5C54] block mb-1">180 GSM (₹)</label>
                          <Input
                            type="number"
                            value={size.gsm180Price}
                            onChange={(e) => handleUpdateFrameSize(sIdx, { gsm180Price: Number(e.target.value) || 0 })}
                            placeholder="149"
                            className="h-8 rounded-lg border-emerald-300 bg-emerald-50/40 text-xs font-bold text-emerald-800"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] font-bold text-[#6C5C54] block mb-1">260 GSM (₹)</label>
                          <div className="flex items-center gap-2">
                            <Input
                              type="number"
                              value={size.gsm260Price}
                              onChange={(e) => handleUpdateFrameSize(sIdx, { gsm260Price: Number(e.target.value) || 0 })}
                              placeholder="159"
                              className="h-8 rounded-lg border-emerald-300 bg-emerald-50/40 text-xs font-bold text-emerald-800"
                            />
                            <button
                              type="button"
                              onClick={() => handleDeleteFrameSize(sIdx)}
                              className="h-8 w-8 rounded-full flex items-center justify-center text-rose-600 hover:bg-rose-50 cursor-pointer shrink-0"
                              title="Delete size"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* --- SECTION 1: WOOD & FINISH COLORS (STEP 3) --- */}
              <div className="p-5 sm:p-6 bg-white rounded-2xl border border-[#EFE6DD] flex flex-col gap-4 shadow-2xs">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#EFE6DD]">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="h-6 w-6 rounded-full bg-[#3A2B24] text-white text-xs font-bold flex items-center justify-center">
                        3
                      </span>
                      <h4 className="font-serif-brand text-base font-bold text-[#3A2B24]">
                        Wood &amp; Finish Colors (Customer Step 3)
                      </h4>
                    </div>
                    <p className="text-[11px] text-[#6C5C54] mt-0.5">
                      Configure color buttons, finish text (e.g. &quot;Matte Charcoal Black Finish&quot;), hex codes, and realistic frame borders.
                    </p>
                  </div>
                  <Button
                    type="button"
                    onClick={handleAddWoodColor}
                    className="btn-pixello-primary text-xs font-bold rounded-full px-4 h-8 flex items-center gap-1.5 cursor-pointer self-start sm:self-auto"
                  >
                    <Plus className="h-3.5 w-3.5 text-white" />
                    <span>Add Finish Color</span>
                  </Button>
                </div>

                {/* List of Wood Finish Colors */}
                <div className="space-y-3">
                  {frameStudioConfig.woodColors.map((color, cIdx) => (
                    <div
                      key={color.id || cIdx}
                      className={cn(
                        "p-4 rounded-xl border transition-all flex flex-col lg:flex-row lg:items-center justify-between gap-4",
                        color.enabled !== false
                          ? "bg-[#FFFDFB] border-[#EFE6DD] hover:border-[#D89A86]/50"
                          : "bg-gray-50 border-gray-200 opacity-60"
                      )}
                    >
                      {/* Left: Swatch & Quick Selector */}
                      <div className="flex items-center gap-3">
                        <div className="relative group shrink-0">
                          <div
                            style={{
                              backgroundColor: color.hex,
                              background: color.borderStyle || color.hex,
                            }}
                            className="h-12 w-12 rounded-xl shadow-xs border-2 border-white ring-1 ring-black/10 flex items-center justify-center cursor-pointer overflow-hidden"
                            title="Click to pick hex color"
                            onClick={() => {
                              const input = document.getElementById(`color-picker-${cIdx}`);
                              input?.click();
                            }}
                          >
                            <span className="text-[9px] font-extrabold text-white bg-black/40 px-1 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity">
                              Pick
                            </span>
                          </div>
                          <input
                            id={`color-picker-${cIdx}`}
                            type="color"
                            value={color.hex.startsWith("#") && color.hex.length === 7 ? color.hex : "#C49A6C"}
                            onChange={(e) => handleUpdateWoodColor(cIdx, { hex: e.target.value })}
                            className="absolute inset-0 opacity-0 cursor-pointer pointer-events-none"
                          />
                        </div>

                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-extrabold text-[#3A2B24]">#{cIdx + 1}</span>
                            <span className="text-xs font-bold text-[#D89A86]">{color.name}</span>
                          </div>
                          <p className="text-[11px] text-[#6C5C54] line-clamp-1">{color.finish}</p>
                        </div>
                      </div>

                      {/* Middle: Editable Fields */}
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 flex-1 min-w-0">
                        <div>
                          <label className="text-[10px] font-bold text-[#6C5C54] uppercase block mb-1">
                            Color Button Label
                          </label>
                          <Input
                            value={color.name}
                            onChange={(e) => handleUpdateWoodColor(cIdx, { name: e.target.value })}
                            placeholder="e.g. Natural Pine"
                            className="h-9 rounded-xl border-[#EFE6DD] text-xs font-bold bg-white"
                          />
                        </div>

                        <div>
                          <label className="text-[10px] font-bold text-[#6C5C54] uppercase block mb-1">
                            Finish Subtitle (Shown below buttons)
                          </label>
                          <Input
                            value={color.finish}
                            onChange={(e) => handleUpdateWoodColor(cIdx, { finish: e.target.value })}
                            placeholder="e.g. Matte Charcoal Black Finish"
                            className="h-9 rounded-xl border-[#EFE6DD] text-xs font-semibold bg-white"
                          />
                        </div>

                        <div>
                          <label className="text-[10px] font-bold text-[#6C5C54] uppercase block mb-1">
                            Hex Color Code
                          </label>
                          <Input
                            value={color.hex}
                            onChange={(e) => handleUpdateWoodColor(cIdx, { hex: e.target.value })}
                            placeholder="#C49A6C"
                            className="h-9 rounded-xl border-[#EFE6DD] text-xs font-mono font-bold bg-white"
                          />
                        </div>
                      </div>

                      {/* Right: Actions */}
                      <div className="flex items-center gap-2 shrink-0 self-end lg:self-center">
                        <button
                          type="button"
                          onClick={() => handleUpdateWoodColor(cIdx, { enabled: color.enabled === false ? true : false })}
                          className={cn(
                            "text-[10px] font-bold px-3 py-1.5 rounded-full cursor-pointer transition-colors border",
                            color.enabled !== false
                              ? "bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100"
                              : "bg-gray-100 text-gray-600 border-gray-300 hover:bg-gray-200"
                          )}
                        >
                          {color.enabled !== false ? "Active" : "Disabled"}
                        </button>

                        <button
                          type="button"
                          onClick={() => handleDeleteWoodColor(cIdx)}
                          disabled={frameStudioConfig.woodColors.length <= 1}
                          className="h-8 w-8 rounded-full flex items-center justify-center text-rose-600 hover:bg-rose-50 cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                          title="Delete wood color"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* --- SECTION 2: PRINT PAPER QUALITY (GSM) (STEP 4) --- */}
              <div className="p-5 sm:p-6 bg-white rounded-2xl border border-[#EFE6DD] flex flex-col gap-4 shadow-2xs">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#EFE6DD]">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="h-6 w-6 rounded-full bg-[#3A2B24] text-white text-xs font-bold flex items-center justify-center">
                        4
                      </span>
                      <h4 className="font-serif-brand text-base font-bold text-[#3A2B24]">
                        Print Paper Quality GSM Options (Customer Step 4)
                      </h4>
                    </div>
                    <p className="text-[11px] text-[#6C5C54] mt-0.5">
                      Configure paper options (e.g. 180 GSM, 260 GSM), archival descriptions, and price surcharges (e.g. +₹10).
                    </p>
                  </div>
                  <Button
                    type="button"
                    onClick={handleAddGsmOption}
                    className="btn-pixello-primary text-xs font-bold rounded-full px-4 h-8 flex items-center gap-1.5 cursor-pointer self-start sm:self-auto"
                  >
                    <Plus className="h-3.5 w-3.5 text-white" />
                    <span>Add GSM Paper Tier</span>
                  </Button>
                </div>

                {/* List of GSM Options */}
                <div className="space-y-3">
                  {frameStudioConfig.gsmOptions.map((gsm, gIdx) => (
                    <div
                      key={gsm.id || gIdx}
                      className="p-4 rounded-xl border border-[#EFE6DD] bg-[#FFFDFB] hover:border-[#D89A86]/50 transition-all flex flex-col lg:flex-row lg:items-center justify-between gap-4"
                    >
                      {/* Left Header */}
                      <div className="flex items-center gap-3 shrink-0">
                        <div className="h-10 w-10 rounded-xl bg-[#FFF8F2] border border-[#EFE6DD] flex items-center justify-center font-extrabold text-xs text-[#D89A86] shadow-2xs">
                          GSM
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-extrabold text-[#3A2B24]">{gsm.gsm}</span>
                            {gsm.priceDelta > 0 && (
                              <span className="text-[9px] bg-[#D89A86] text-white px-2 py-0.5 rounded-full font-bold">
                                {gsm.badge || `+₹${gsm.priceDelta}`}
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] text-[#6C5C54] line-clamp-1">{gsm.title}</p>
                        </div>
                      </div>

                      {/* Middle Editable Inputs */}
                      <div className="grid grid-cols-1 sm:grid-cols-4 gap-2.5 flex-1 min-w-0">
                        <div className="sm:col-span-1">
                          <label className="text-[10px] font-bold text-[#6C5C54] uppercase block mb-1">
                            GSM Code / Label
                          </label>
                          <Input
                            value={gsm.gsm}
                            onChange={(e) => handleUpdateGsmOption(gIdx, { gsm: e.target.value })}
                            placeholder="e.g. 180 GSM"
                            className="h-9 rounded-xl border-[#EFE6DD] text-xs font-bold bg-white"
                          />
                        </div>

                        <div className="sm:col-span-1">
                          <label className="text-[10px] font-bold text-[#6C5C54] uppercase block mb-1">
                            Card Title
                          </label>
                          <Input
                            value={gsm.title}
                            onChange={(e) => handleUpdateGsmOption(gIdx, { title: e.target.value })}
                            placeholder="e.g. 180 GSM Standard Matte Paper"
                            className="h-9 rounded-xl border-[#EFE6DD] text-xs font-bold bg-white"
                          />
                        </div>

                        <div className="sm:col-span-1">
                          <label className="text-[10px] font-bold text-[#6C5C54] uppercase block mb-1">
                            Description Subtitle
                          </label>
                          <Input
                            value={gsm.description}
                            onChange={(e) => handleUpdateGsmOption(gIdx, { description: e.target.value })}
                            placeholder="e.g. Clean archival matte finish"
                            className="h-9 rounded-xl border-[#EFE6DD] text-xs font-medium bg-white"
                          />
                        </div>

                        <div className="sm:col-span-1">
                          <label className="text-[10px] font-bold text-[#6C5C54] uppercase block mb-1">
                            Price Surcharge (₹)
                          </label>
                          <div className="flex items-center gap-1.5">
                            <Input
                              type="number"
                              min="0"
                              value={gsm.priceDelta}
                              onChange={(e) => handleUpdateGsmOption(gIdx, { priceDelta: Number(e.target.value) || 0 })}
                              placeholder="0"
                              className="h-9 rounded-xl border-[#EFE6DD] text-xs font-bold bg-white w-20"
                            />
                            <Input
                              value={gsm.badge || ""}
                              onChange={(e) => handleUpdateGsmOption(gIdx, { badge: e.target.value })}
                              placeholder="+₹10"
                              className="h-9 rounded-xl border-[#EFE6DD] text-xs font-bold text-[#D89A86] bg-white flex-1"
                              title="Badge tag text"
                            />
                          </div>
                        </div>
                      </div>

                      {/* Right Delete */}
                      <div className="shrink-0 self-end lg:self-center">
                        <button
                          type="button"
                          onClick={() => handleDeleteGsmOption(gIdx)}
                          disabled={frameStudioConfig.gsmOptions.length <= 1}
                          className="h-8 w-8 rounded-full flex items-center justify-center text-rose-600 hover:bg-rose-50 cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                          title="Delete GSM option"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* --- SECTION 3: LIVE CUSTOMER STOREFRONT SIMULATION (Exact match to Customer UI) --- */}
              <div className="p-5 sm:p-6 bg-gradient-to-br from-[#FFF8F2] to-[#FFFDFB] rounded-2xl border-2 border-dashed border-[#D89A86]/50 flex flex-col gap-4 shadow-2xs">
                <div className="flex items-center justify-between pb-2 border-b border-[#D89A86]/30">
                  <div className="flex items-center gap-2">
                    <Badge className="bg-[#D89A86] text-white text-[10px] font-extrabold px-2 py-0.5 rounded-full">
                      Live Customer Preview
                    </Badge>
                    <h4 className="font-serif-brand text-sm sm:text-base font-bold text-[#3A2B24]">
                      How It Appears to Customers (Product Page &amp; Customization Studio)
                    </h4>
                  </div>
                  <span className="text-[11px] text-[#8C7A70] font-semibold hidden sm:inline">
                    Interactive • Click to Test
                  </span>
                </div>

                <div className="max-w-xl mx-auto w-full space-y-4 pt-2">
                  {/* Step 2 Simulation (Matching Image 1) */}
                  <div className="bg-white rounded-3xl p-5 border border-[#EFE6DD] shadow-xs">
                    <h3 className="font-bold text-xs sm:text-sm text-[#3A2B24] uppercase tracking-wider mb-3">
                      2. FRAME SIZE
                    </h3>
                    <div className="grid grid-cols-2 gap-3">
                      {(frameStudioConfig.frameSizes || DEFAULT_FRAME_SIZES).map((size, sIdx) => {
                        const isSelected = previewSizeLabel === size.label || (!previewSizeLabel && sIdx === 0);
                        return (
                          <button
                            key={size.label || sIdx}
                            type="button"
                            onClick={() => setPreviewSizeLabel(size.label)}
                            className={cn(
                              "py-3.5 px-4 rounded-xl font-bold text-xs sm:text-sm transition-all cursor-pointer border text-center",
                              isSelected
                                ? "bg-[#FCE8E6] border-[#E57373] text-[#C25454] shadow-xs ring-1 ring-[#E57373]/30"
                                : "bg-white border-[#EFE6DD] text-[#3A2B24] hover:border-[#D89A86]/60 hover:bg-[#FFF9F3]"
                            )}
                          >
                            {size.name || size.label}
                          </button>
                        );
                      })}
                    </div>
                    {(() => {
                      const activeS = (frameStudioConfig.frameSizes || DEFAULT_FRAME_SIZES).find((s) => s.label === previewSizeLabel) || (frameStudioConfig.frameSizes || DEFAULT_FRAME_SIZES)[0];
                      return (
                        <p className="text-[11px] text-[#8C7A70] mt-3 font-medium text-center">
                          Selected Dimensions: <span className="font-bold text-[#3A2B24]">{activeS?.dimensions} {activeS?.cmDimensions ? `(${activeS.cmDimensions})` : ""}</span>
                        </p>
                      );
                    })()}
                  </div>

                  {/* Step 3 Simulation */}
                  <div className="bg-white rounded-3xl p-5 border border-[#EFE6DD] shadow-xs">
                    <h3 className="font-bold text-xs sm:text-sm text-[#3A2B24] uppercase tracking-wider mb-3">
                      3. WOOD &amp; FINISH COLOR
                    </h3>

                    <div className="grid grid-cols-2 gap-3">
                      {frameStudioConfig.woodColors.filter((c) => c.enabled !== false).map((color) => {
                        const isSelected = previewColorId === color.id;
                        return (
                          <button
                            key={color.id}
                            type="button"
                            onClick={() => setPreviewColorId(color.id)}
                            className={cn(
                              "py-3.5 px-4 rounded-xl font-bold text-xs sm:text-sm transition-all cursor-pointer border text-center",
                              isSelected
                                ? "bg-[#3A2B24] border-[#3A2B24] text-white shadow-xs"
                                : "bg-white border-[#EFE6DD] text-[#3A2B24] hover:border-[#D89A86]/60 hover:bg-[#FFF9F3]"
                            )}
                          >
                            {color.name}
                          </button>
                        );
                      })}
                    </div>

                    <p className="text-[11px] text-[#8C7A70] mt-3 font-medium text-center">
                      Finish:{" "}
                      <span className="font-bold text-[#3A2B24]">
                        {frameStudioConfig.woodColors.find((c) => c.id === previewColorId)?.finish ||
                          frameStudioConfig.woodColors[0]?.finish ||
                          "Matte Charcoal Black Finish"}
                      </span>
                    </p>
                  </div>

                  {/* Step 4 Simulation */}
                  <div className="bg-white rounded-3xl p-5 border border-[#EFE6DD] shadow-xs">
                    <h3 className="font-bold text-xs sm:text-sm text-[#3A2B24] uppercase tracking-wider mb-3">
                      4. PRINT PAPER QUALITY (GSM)
                    </h3>
                    <div className={cn(
                      "grid gap-3",
                      frameStudioConfig.gsmOptions.length > 1 ? "grid-cols-1 sm:grid-cols-2" : "grid-cols-1"
                    )}>
                      {frameStudioConfig.gsmOptions.map((gsm) => {
                        const isSelected = previewGsmId === gsm.id;
                        return (
                          <div
                            key={gsm.id}
                            onClick={() => setPreviewGsmId(gsm.id)}
                            className={cn(
                              "p-3.5 rounded-2xl border cursor-pointer transition-all flex flex-col justify-between select-none",
                              isSelected
                                ? "border-[#D89A86] bg-[#FFF9F6] ring-1 ring-[#D89A86]"
                                : "border-[#EFE6DD] hover:border-[#D89A86]/50 bg-white"
                            )}
                          >
                            <div className="flex items-center justify-between gap-1">
                              <span className="font-bold text-xs text-[#3A2B24]">{gsm.title}</span>
                              {gsm.priceDelta > 0 && (
                                <span className="text-[9px] bg-[#D89A86] text-white px-1.5 py-0.5 rounded-full font-bold shrink-0">
                                  {gsm.badge || `+₹${gsm.priceDelta}`}
                                </span>
                              )}
                            </div>
                            <span className="text-[10px] text-[#6C5C54] mt-0.5 font-medium">{gsm.description}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>

            </div>

            {/* Bottom Save Action */}
            <div className="flex justify-end pt-4 border-t border-[#EFE6DD]">
              <Button
                type="button"
                onClick={() => handleSaveFrameStudio()}
                disabled={isSavingFrameConfig}
                className="btn-pixello-primary text-xs font-bold rounded-full px-8 h-11 shadow-md flex items-center gap-2 cursor-pointer"
              >
                <Save className="h-4 w-4 text-white" />
                {isSavingFrameConfig ? "Saving..." : "Save Frame Studio Customizations & Sync Live"}
              </Button>
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

      {/* Hidden file input for card direct upload */}
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

      {/* ========================================================================= */}
      {/* ⚠️ CONFIRM PERMANENT RESET OF ALL DATA MODAL (EXACT DESIGN AS SPECIFIED) */}
      {/* ========================================================================= */}
      {isResetModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl border border-[#EFE6DD] shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="p-6 pb-4 border-b border-[#EFE6DD] flex items-center justify-between bg-rose-50/40">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-2xl bg-rose-100 border border-rose-200 flex items-center justify-center text-rose-600">
                  <AlertTriangle className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-serif-brand text-lg font-bold text-rose-950">
                    Confirm Permanent Reset of All Data
                  </h3>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsResetModalOpen(false)}
                className="p-1.5 rounded-xl text-[#6C5C54] hover:bg-white/80 cursor-pointer transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Modal Body Form */}
            <form onSubmit={handlePermanentResetData} className="p-6 flex flex-col gap-4">
              <p className="text-xs text-[#6C5C54]">
                All customers, manufacturers, categories, products, margins, inventory, orders, purchase orders, invoices, payments, and uploaded files will be permanently deleted.
              </p>

              {/* Selected Scope Box */}
              <div className="p-4 bg-rose-50/70 border border-rose-200/90 rounded-2xl text-xs text-rose-950 flex flex-col gap-1.5">
                <span className="font-bold text-rose-900">Selected Scope:</span>
                <ul className="space-y-1 list-disc list-inside text-[11px] text-rose-900/90">
                  <li>Delete all business, catalog, customer, supplier, order, invoice &amp; payment data</li>
                  <li>Delete all Customer Portal logins &amp; reset Order/PO/Invoice sequences to 1001</li>
                  <li>Delete Staff / other Admin accounts: {deleteSecondaryStaff ? "Yes" : "No"}</li>
                  <li>Reset Store Profile &amp; Brand Logo: {resetStoreDefaults ? "Yes" : "No"}</li>
                </ul>
              </div>

              {resetError && (
                <div className="p-3 bg-red-100 border border-red-300 rounded-2xl text-xs font-bold text-red-900 flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-red-600 flex-shrink-0" />
                  <span>{resetError}</span>
                </div>
              )}

              {/* 1. Type RESET ALL DATA to confirm */}
              <div>
                <label className="text-xs font-bold text-[#3A2B24] mb-1.5 block">
                  Type <span className="font-mono text-rose-600 font-extrabold">RESET ALL DATA</span> to confirm *
                </label>
                <Input
                  value={resetConfirmText}
                  onChange={(e) => {
                    setResetConfirmText(e.target.value);
                    if (resetError) setResetError(null);
                  }}
                  placeholder="RESET ALL DATA"
                  className="rounded-xl border-[#EFE6DD] text-xs font-mono font-bold text-[#3A2B24] bg-[#FFF8F2]/40 h-11 focus-visible:ring-rose-500"
                  required
                  autoFocus
                />
              </div>

              {/* 2. Admin Login Password */}
              <div>
                <label className="text-xs font-bold text-[#3A2B24] mb-1.5 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <Lock className="h-3.5 w-3.5 text-[#D89A86]" /> Admin Login Password *
                  </span>
                </label>
                <div className="relative flex items-center">
                  <Input
                    type={showResetPassword ? "text" : "password"}
                    value={resetPassword}
                    onChange={(e) => {
                      setResetPassword(e.target.value);
                      if (resetError) setResetError(null);
                    }}
                    placeholder="Enter your login password"
                    className="rounded-xl border-[#EFE6DD] text-xs font-bold text-[#3A2B24] bg-[#FFF8F2]/40 h-11 pr-11 focus-visible:ring-rose-500"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowResetPassword(!showResetPassword)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-[#6C5C54] hover:text-[#3A2B24] cursor-pointer"
                  >
                    {showResetPassword ? <EyeOff className="h-4 w-4 text-[#D89A86]" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              {/* 3. 4-Digit Security PIN */}
              <div>
                <label className="text-xs font-bold text-[#3A2B24] mb-1.5 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <KeyRound className="h-3.5 w-3.5 text-[#D89A86]" /> 4-Digit Security PIN *
                  </span>
                  <span className="text-[10px] text-[#6C5C54] font-medium">Security Key</span>
                </label>
                <div className="relative flex items-center">
                  <Input
                    type={showResetPin ? "text" : "password"}
                    maxLength={4}
                    value={resetPin}
                    onChange={(e) => {
                      const val = e.target.value.replace(/\D/g, "").slice(0, 4);
                      setResetPin(val);
                      if (resetError) setResetError(null);
                    }}
                    placeholder="• • • •"
                    className="rounded-xl border-[#EFE6DD] text-center font-mono font-bold tracking-widest text-sm text-[#3A2B24] bg-[#FFF8F2]/40 h-11 pr-11 focus-visible:ring-rose-500"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowResetPin(!showResetPin)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-[#6C5C54] hover:text-[#3A2B24] cursor-pointer"
                  >
                    {showResetPin ? <EyeOff className="h-4 w-4 text-[#D89A86]" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-[#EFE6DD]">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsResetModalOpen(false)}
                  disabled={isResettingData}
                  className="rounded-xl text-xs font-bold h-10 px-4 border-[#EFE6DD] text-[#6C5C54] hover:bg-[#FFF8F2] cursor-pointer"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isResettingData || resetConfirmText.trim() !== "RESET ALL DATA" || !resetPassword || resetPin.length !== 4}
                  className="rounded-xl text-xs font-bold h-10 px-5 bg-rose-600 hover:bg-rose-700 text-white flex items-center gap-1.5 cursor-pointer shadow-md disabled:opacity-50"
                >
                  {isResettingData ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin text-white" /> Resetting All Data...
                    </>
                  ) : (
                    <>
                      <Trash2 className="h-4 w-4 text-white" /> Permanently Reset All Data
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