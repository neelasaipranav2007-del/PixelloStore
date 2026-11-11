"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { Plus, Search, Edit, Trash2, X, CheckCircle2, Sparkles, Image as ImageIcon, Upload, Link2, Eye, Check, ArrowRight, Layers, Gift } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useProducts, Product, PolaroidSizeConfig } from "@/context/ProductContext";
import {
  getSpotlightConfig,
  saveSpotlightConfig,
  FeaturedSpotlightConfig,
  DEFAULT_SPOTLIGHT_CONFIG,
} from "@/lib/spotlightConfig";
import {
  getFrameStudioConfig,
  saveFrameStudioConfig,
  DEFAULT_FRAME_STUDIO_CONFIG,
  FrameStudioConfig,
  FrameWoodColorConfig,
  FrameGsmOptionConfig,
} from "@/lib/frameConfig";

const PRESET_SAMPLE_IMAGES = [
  { name: "Wooden Frame Main", url: "/images/wooden_frame_main.png" },
  { name: "Wooden Frame Angle", url: "/images/wooden_frame_angle.png" },
  { name: "Wooden Frame Wall", url: "/images/wooden_frame_wall.png" },
  { name: "Polaroid Stack", url: "/images/polaroid_set.png" },
  { name: "Custom Mug", url: "/images/custom_mug.png" },
  { name: "LED Acrylic Lamp", url: "/images/led_acrylic_lamp.png" },
];

export default function AdminProductsPage() {
  const { products, addProduct, updateProduct, deleteProduct } = useProducts();
  const [isMounted, setIsMounted] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dedicatedFileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setIsMounted(true);
    setSpotlightForm(getSpotlightConfig());
    fetch("/api/settings/spotlight")
      .then((r) => r.json())
      .then((data) => {
        if (data.success && data.banners?.spotlight) {
          setSpotlightForm(data.banners.spotlight);
        }
      })
      .catch(() => {});
  }, []);
  
  // Modal states
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isSpotlightModalOpen, setIsSpotlightModalOpen] = useState(false);
  const [spotlightForm, setSpotlightForm] = useState<FeaturedSpotlightConfig>(getSpotlightConfig);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [showPolaroidSection, setShowPolaroidSection] = useState(false);
  const [deletingProduct, setDeletingProduct] = useState<{ id: string; name: string } | null>(null);
  const [activePricingTab, setActivePricingTab] = useState<"variants" | "frames" | "polaroids">("variants");

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleSaveSpotlightBanner = async () => {
    saveSpotlightConfig(spotlightForm);
    try {
      await fetch("/api/settings/spotlight", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ banners: { spotlight: spotlightForm } }),
      });
    } catch {}
    setIsSpotlightModalOpen(false);
    showToast("✓ Featured Spotlight banner updated & synced live to /products!");
  };

  const calculateStatusFromStock = (stockVal: number, currentStatus: string): "Active" | "Low Stock" | "Out of Stock" | "Inactive" => {
    if (currentStatus === "Inactive") return "Inactive";
    if (stockVal <= 0) return "Out of Stock";
    if (stockVal < 10) return "Low Stock";
    return "Active";
  };

  const [formData, setFormData] = useState<{
    name: string;
    category: string;
    price: string;
    originalPrice: string;
    description: string;
    badgeTag: string;
    stock: number;
    badge: string;
    status: "Active" | "Low Stock" | "Out of Stock" | "Inactive";
    image: string;
    image2: string;
    variants: Array<{
      id?: string;
      name: string;
      price: number;
      originalPrice?: number;
      description?: string;
      discountTag?: string;
    }>;
    frameSizes: Array<{
      label: string;
      name: string;
      dimensions: string;
      originalPrice: number;
      discountPct: number;
      gsm180Price: number;
      gsm260Price: number;
    }>;
    frameColors: Array<{
      label: string;
      colorClass: string;
      borderClass: string;
      hex: string;
    }>;
    polaroidSizes: PolaroidSizeConfig[];
    aboutTitle: string;
    aboutPoints: string[];
  }>({
    name: "",
    category: "Frames",
    price: "149",
    originalPrice: "199",
    description: "",
    badgeTag: "25% OFF OPENING OFFER",
    stock: 100,
    badge: "",
    status: "Active",
    image: "/images/wooden_frame_main.png",
    image2: "",
    variants: [],
    frameSizes: [
      { label: "4x6 INCH", name: "4x6 INCH", dimensions: "4 x 6 Inches (10.1 x 15.2 cm)", originalPrice: 199, discountPct: 25, gsm180Price: 149, gsm260Price: 159 },
      { label: "5x7 INCH", name: "5x7 INCH", dimensions: "5 x 7 Inches (12.7 x 17.7 cm)", originalPrice: 249, discountPct: 32, gsm180Price: 169, gsm260Price: 179 },
      { label: "6x8 INCH", name: "6x8 INCH", dimensions: "6 x 8 Inches (15.2 x 20.3 cm)", originalPrice: 299, discountPct: 40, gsm180Price: 179, gsm260Price: 189 },
      { label: "A4 SIZE", name: "A4 SIZE (21 x 29.7 cm)", dimensions: "A4 Size (21.0 x 29.7 cm)", originalPrice: 359, discountPct: 45, gsm180Price: 199, gsm260Price: 229 },
    ],
    frameColors: [
      { label: "Black", colorClass: "bg-black text-white", borderClass: "border-black", hex: "#000000" },
      { label: "Brown", colorClass: "bg-[#5A3A28] text-white", borderClass: "border-[#5A3A28]", hex: "#5A3A28" },
      { label: "White", colorClass: "bg-white text-[#3A2B24]", borderClass: "border-[#EFE6DD]", hex: "#FFFFFF" },
    ],
    polaroidSizes: [
      { label: "SMALL", name: "Small Polaroid", priceEach: 8, minOrderQty: 10, description: "Tiny prints • Min order 10 prints" },
      { label: "MEDIUM", name: "Medium Polaroid", priceEach: 15, minOrderQty: 12, description: "Classic polaroid size • Min order 12 prints" },
      { label: "LARGE", name: "Large Polaroid", priceEach: 25, minOrderQty: 4, description: "Jumbo aesthetic print • Min order 4 prints" },
    ],
    aboutTitle: "ABOUT PRODUCT",
    aboutPoints: [
      "Master studio handcrafted finish",
      "High-definition vibrant color reproduction",
      "Durable premium materials built to last",
      "Printed & dispatched by verified local studio",
      "Safe packaging & doorstep express delivery",
    ],
  });

  const handleStockInputChange = (stockVal: number) => {
    const autoStatus = calculateStatusFromStock(stockVal, formData.status);
    setFormData((prev) => ({
      ...prev,
      stock: stockVal,
      status: autoStatus,
    }));
  };

  const compressImageFile = (file: File, callback: (compressed: string) => void) => {
    const reader = new FileReader();
    reader.onload = (evt) => {
      const src = evt.target?.result as string;
      if (!src) return;
      const img = new Image();
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
        const compressed = canvas.toDataURL("image/jpeg", 0.75);
        callback(compressed);
      };
      img.src = src;
    };
    reader.readAsDataURL(file);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      compressImageFile(file, (compressed) => {
        setFormData((prev) => ({ ...prev, image: compressed }));
        showToast("✓ Custom image file uploaded & optimized!");
      });
    }
  };

  // Dedicated Multi-Image Uploader State (Up to 5 optional images per product)
  const [selectedQuickProduct, setSelectedQuickProduct] = useState<Product | null>(null);
  const [quickImages, setQuickImages] = useState<string[]>(["", "", "", "", ""]);
  const activeSlotIdxRef = useRef<number>(0);
  const slotFileInputRef = useRef<HTMLInputElement>(null);

  const handleSelectQuickProduct = (p: Product | null) => {
    setSelectedQuickProduct(p);
    if (p) {
      const existing = p.images && p.images.length > 0 ? p.images : (p.image ? [p.image] : []);
      const filled = ["", "", "", "", ""];
      existing.forEach((img, i) => {
        if (i < 5) filled[i] = img;
      });
      setQuickImages(filled);
    } else {
      setQuickImages(["", "", "", "", ""]);
    }
  };

  const handleSlotFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      compressImageFile(file, (compressedDataUrl) => {
        const slotIdx = activeSlotIdxRef.current;
        setQuickImages((prev) => {
          const nextArr = [...prev];
          nextArr[slotIdx] = compressedDataUrl;
          return nextArr;
        });
        showToast(`✓ Photo Slot #${slotIdx + 1} uploaded & optimized!`);
      });
    }
  };

  const handleSaveQuickImages = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedQuickProduct) return;

    const filtered = quickImages.map((img) => img.trim()).filter(Boolean);
    if (filtered.length === 0) {
      showToast("⚠️ Please upload or paste at least 1 image for the product!");
      return;
    }

    updateProduct(selectedQuickProduct.id, {
      image: filtered[0],
      images: filtered,
    });
    showToast(`✓ Saved ${filtered.length} image(s) for "${selectedQuickProduct.name}" & synced live to Customer Store!`);
  };

  // Custom Category State
  const [isCustomCategoryMode, setIsCustomCategoryMode] = useState(false);
  const [customCategoryInput, setCustomCategoryInput] = useState("");

  // Dedicated Frame Modal State
  const [frameModalProduct, setFrameModalProduct] = useState<Product | null>(null);
  const [frameModalActiveTab, setFrameModalActiveTab] = useState<"sizes" | "woods" | "gsm">("sizes");
  const [modalStudioConfig, setModalStudioConfig] = useState<FrameStudioConfig>(DEFAULT_FRAME_STUDIO_CONFIG);
  const [frameModalSizes, setFrameModalSizes] = useState<Array<{
    label: string;
    name: string;
    dimensions: string;
    originalPrice: number;
    discountPct: number;
    gsm180Price: number;
    gsm260Price: number;
  }>>([]);

  const handleOpenFrameModal = (product: Product) => {
    setFrameModalProduct(product);
    setFrameModalActiveTab("sizes");
    setModalStudioConfig(getFrameStudioConfig());
    fetch("/api/settings/frames")
      .then((r) => r.json())
      .then((d) => {
        if (d?.success && d?.config) setModalStudioConfig(d.config);
      })
      .catch(() => {});

    const pClean = (product.id || "").trim().toLowerCase();
    const pNum = parseInt(pClean.replace(/\D/g, ""), 10);
    
    const freshProduct = products.find((p) => {
      const itemClean = (p.id || "").trim().toLowerCase();
      const itemNum = parseInt(itemClean.replace(/\D/g, ""), 10);
      return itemClean === pClean || (!isNaN(pNum) && !isNaN(itemNum) && itemNum === pNum) || p.name.toLowerCase() === product.name.toLowerCase();
    }) || product;

    const defaultSizes = freshProduct.frameSizes !== undefined ? freshProduct.frameSizes : [
      { label: "4x6 INCH", name: "4x6 INCH", dimensions: "4 x 6 Inches (10.1 x 15.2 cm)", originalPrice: 199, discountPct: 25, gsm180Price: 149, gsm260Price: 159 },
      { label: "5x7 INCH", name: "5x7 INCH", dimensions: "5 x 7 Inches (12.7 x 17.7 cm)", originalPrice: 249, discountPct: 32, gsm180Price: 169, gsm260Price: 179 },
      { label: "6x8 INCH", name: "6x8 INCH", dimensions: "6 x 8 Inches (15.2 x 20.3 cm)", originalPrice: 299, discountPct: 40, gsm180Price: 179, gsm260Price: 189 },
      { label: "A4 SIZE", name: "A4 SIZE (21 x 29.7 cm)", dimensions: "A4 Size (21.0 x 29.7 cm)", originalPrice: 359, discountPct: 45, gsm180Price: 199, gsm260Price: 229 },
    ];
    setFrameModalSizes(JSON.parse(JSON.stringify(defaultSizes)));
  };

  const handleSaveFrameSizesModal = async () => {
    if (!frameModalProduct) return;
    const newSizes = JSON.parse(JSON.stringify(frameModalSizes));
    updateProduct(frameModalProduct.id, {
      name: frameModalProduct.name,
      frameSizes: newSizes,
    });
    if (editingProduct) {
      setEditingProduct((prev) => (prev ? { ...prev, frameSizes: newSizes } : null));
    }
    setFormData((prev) => ({
      ...prev,
      frameSizes: newSizes,
    }));

    // Persist Wood Finishes, GSM Qualities & Frame Sizes globally
    const updatedStudioConfig = {
      ...modalStudioConfig,
      frameSizes: newSizes,
    };
    setModalStudioConfig(updatedStudioConfig);
    saveFrameStudioConfig(updatedStudioConfig);
    try {
      await fetch("/api/settings/frames", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ config: updatedStudioConfig }),
      });
    } catch {}

    showToast(`✓ Frame Sizes, Wood Finishes & Paper GSM for "${frameModalProduct.name}" saved & synced to store!`);
    setFrameModalProduct(null);
  };

  const existingCategories = Array.from(
    new Set(["Frames", "Polaroids", "Gifts", "LED", "Mugs", ...products.map((p) => p.category).filter(Boolean)])
  );

  const handleOpenAddModal = () => {
    setFormData({
      name: "",
      category: "Frames",
      price: "149",
      originalPrice: "199",
      description: "",
      badgeTag: "25% OFF OPENING OFFER",
      stock: 100,
      badge: "",
      status: "Active",
      image: "/images/wooden_frame_main.png",
      image2: "",
      variants: [],
      frameSizes: [
        { label: "4x6 INCH", name: "4x6 INCH", dimensions: "4 x 6 Inches (10.1 x 15.2 cm)", originalPrice: 199, discountPct: 25, gsm180Price: 149, gsm260Price: 159 },
        { label: "5x7 INCH", name: "5x7 INCH", dimensions: "5 x 7 Inches (12.7 x 17.7 cm)", originalPrice: 249, discountPct: 32, gsm180Price: 169, gsm260Price: 179 },
        { label: "6x8 INCH", name: "6x8 INCH", dimensions: "6 x 8 Inches (15.2 x 20.3 cm)", originalPrice: 299, discountPct: 40, gsm180Price: 179, gsm260Price: 189 },
        { label: "A4 SIZE", name: "A4 SIZE (21 x 29.7 cm)", dimensions: "A4 Size (21.0 x 29.7 cm)", originalPrice: 359, discountPct: 45, gsm180Price: 199, gsm260Price: 229 },
      ],
      frameColors: [
        { label: "Black", colorClass: "bg-black text-white", borderClass: "border-black", hex: "#000000" },
        { label: "Brown", colorClass: "bg-[#5A3A28] text-white", borderClass: "border-[#5A3A28]", hex: "#5A3A28" },
        { label: "White", colorClass: "bg-white text-[#3A2B24]", borderClass: "border-[#EFE6DD]", hex: "#FFFFFF" },
      ],
      polaroidSizes: [
        { label: "SMALL", name: "Small Polaroid", priceEach: 8, minOrderQty: 10, description: "Tiny prints • Min order 10 prints" },
        { label: "MEDIUM", name: "Medium Polaroid", priceEach: 15, minOrderQty: 12, description: "Classic polaroid size • Min order 12 prints" },
        { label: "LARGE", name: "Large Polaroid", priceEach: 25, minOrderQty: 4, description: "Jumbo aesthetic print • Min order 4 prints" },
      ],
      aboutTitle: "ABOUT PRODUCT",
      aboutPoints: [
        "Master studio handcrafted finish",
        "High-definition vibrant color reproduction",
        "Durable premium materials built to last",
        "Printed & dispatched by verified local studio",
        "Safe packaging & doorstep express delivery",
      ],
    });
    setIsCustomCategoryMode(false);
    setCustomCategoryInput("");
    setActivePricingTab("variants");
    setIsAddModalOpen(true);
  };

  const handleSaveNewProduct = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) return;

    const finalCategory = (isCustomCategoryMode ? customCategoryInput.trim() : formData.category) || "Gifts";
    const numPrice = parseFloat(formData.price.replace(/[^0-9.]/g, "")) || 149;
    const numOrigPrice = parseFloat(formData.originalPrice.replace(/[^0-9.]/g, "")) || undefined;
    const finalStock = Number(formData.stock) || 0;
    const finalStatus = calculateStatusFromStock(finalStock, formData.status);
    const allImages = [formData.image, formData.image2].filter(Boolean) as string[];

    addProduct({
      id: `PRD-${101 + products.length}`,
      name: formData.name.trim(),
      category: finalCategory,
      price: numPrice,
      originalPrice: numOrigPrice,
      description: formData.description.trim() || undefined,
      badgeTag: formData.badgeTag.trim() || undefined,
      stock: finalStock,
      badge: formData.badge.trim() || undefined,
      status: finalStatus,
      image: formData.image || "/images/wooden_frame_main.png",
      images: allImages.length > 1 ? allImages : undefined,
      variants: formData.variants,
      frameSizes: formData.frameSizes,
      frameColors: formData.frameColors,
      polaroidSizes: formData.polaroidSizes,
      aboutTitle: formData.aboutTitle.trim() || undefined,
      aboutPoints: formData.aboutPoints,
    });

    setIsAddModalOpen(false);
    showToast(`Product "${formData.name.trim()}" (₹${numPrice} • ${finalCategory}) created & synced to customer store!`);
  };

  const handleOpenEditModal = (product: Product) => {
    setEditingProduct(product);
    const isStandardCat = ["Frames", "Polaroids", "Gifts", "LED", "Mugs"].includes(product.category);
    if (!isStandardCat) {
      setIsCustomCategoryMode(true);
      setCustomCategoryInput(product.category);
    } else {
      setIsCustomCategoryMode(false);
      setCustomCategoryInput("");
    }
    const existingImages = product.images || [];
    const img1 = product.image || "/images/wooden_frame_main.png";
    const img2 = existingImages.length > 1 ? existingImages[1] : "";
    setFormData({
      name: product.name,
      category: product.category,
      price: product.price.toString(),
      originalPrice: product.originalPrice ? product.originalPrice.toString() : "",
      description: product.description || "",
      badgeTag: product.badgeTag || "",
      stock: product.stock || 0,
      badge: product.badge || "",
      status: product.status || "Active",
      image: img1,
      image2: img2,
      variants: Array.isArray(product.variants) ? [...product.variants] : [],
      frameSizes: product.frameSizes !== undefined ? [...product.frameSizes] : [
        { label: "4x6 INCH", name: "4x6 INCH", dimensions: "4 x 6 Inches (10.1 x 15.2 cm)", originalPrice: 199, discountPct: 25, gsm180Price: 149, gsm260Price: 159 },
        { label: "5x7 INCH", name: "5x7 INCH", dimensions: "5 x 7 Inches (12.7 x 17.7 cm)", originalPrice: 249, discountPct: 32, gsm180Price: 169, gsm260Price: 179 },
        { label: "6x8 INCH", name: "6x8 INCH", dimensions: "6 x 8 Inches (15.2 x 20.3 cm)", originalPrice: 299, discountPct: 40, gsm180Price: 179, gsm260Price: 189 },
        { label: "A4 SIZE", name: "A4 SIZE (21 x 29.7 cm)", dimensions: "A4 Size (21.0 x 29.7 cm)", originalPrice: 359, discountPct: 45, gsm180Price: 199, gsm260Price: 229 },
      ],
      frameColors: product.frameColors !== undefined ? [...product.frameColors] : [
        { label: "Black", colorClass: "bg-black text-white", borderClass: "border-black", hex: "#000000" },
        { label: "Brown", colorClass: "bg-[#5A3A28] text-white", borderClass: "border-[#5A3A28]", hex: "#5A3A28" },
        { label: "White", colorClass: "bg-white text-[#3A2B24]", borderClass: "border-[#EFE6DD]", hex: "#FFFFFF" },
      ],
      polaroidSizes: product.polaroidSizes !== undefined ? [...product.polaroidSizes] : [
        { label: "SMALL", name: "Small Polaroid", priceEach: 8, minOrderQty: 10, description: "Tiny prints • Min order 10 prints" },
        { label: "MEDIUM", name: "Medium Polaroid", priceEach: 15, minOrderQty: 12, description: "Classic polaroid size • Min order 12 prints" },
        { label: "LARGE", name: "Large Polaroid", priceEach: 25, minOrderQty: 4, description: "Jumbo aesthetic print • Min order 4 prints" },
      ],
      aboutTitle: product.aboutTitle || (product.category === "Hamper" || product.name.toLowerCase().includes("hamper") ? "ABOUT HAMPER" : (product.category === "Frames" ? "ABOUT OUR FRAMES" : (product.category === "Polaroids" ? "ABOUT OUR POLAROIDS" : `ABOUT ${product.name.toUpperCase()}`))),
      aboutPoints: product.aboutPoints && Array.isArray(product.aboutPoints) && product.aboutPoints.length > 0
        ? [...product.aboutPoints]
        : [
            "Master studio handcrafted finish",
            "High-definition vibrant color reproduction",
            "Durable premium materials built to last",
            "Printed & dispatched by verified local studio",
            "Safe packaging & doorstep express delivery",
          ],
    });

    const catLower = product.category.toLowerCase();
    const nameLower = product.name.toLowerCase();
    if (catLower.includes("polaroid") || nameLower.includes("polaroid")) {
      setActivePricingTab("polaroids");
    } else if (catLower.includes("frame") || nameLower.includes("frame")) {
      setActivePricingTab("frames");
    } else if (product.variants && product.variants.length > 0) {
      setActivePricingTab("variants");
    } else {
      setActivePricingTab("variants");
    }
  };

  const handleUpdateProduct = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProduct || !formData.name.trim()) return;

    const finalCategory = (isCustomCategoryMode ? customCategoryInput.trim() : formData.category) || "Gifts";
    const numPrice = parseFloat(formData.price.replace(/[^0-9.]/g, "")) || 149;
    const numOrigPrice = parseFloat(formData.originalPrice.replace(/[^0-9.]/g, "")) || undefined;
    const finalStock = Number(formData.stock) || 0;
    const finalStatus = formData.status === "Inactive" ? "Inactive" : calculateStatusFromStock(finalStock, formData.status);
    const allImages = [formData.image, formData.image2].filter(Boolean) as string[];

    updateProduct(editingProduct.id, {
      name: formData.name.trim(),
      category: finalCategory,
      price: numPrice,
      originalPrice: numOrigPrice,
      description: formData.description.trim() || undefined,
      badgeTag: formData.badgeTag.trim() || undefined,
      stock: finalStock,
      badge: formData.badge.trim() || undefined,
      status: finalStatus,
      image: formData.image,
      images: allImages.length > 0 ? allImages : undefined,
      variants: formData.variants,
      frameSizes: formData.frameSizes,
      frameColors: formData.frameColors,
      polaroidSizes: formData.polaroidSizes,
      aboutTitle: formData.aboutTitle.trim() || undefined,
      aboutPoints: formData.aboutPoints,
    });

    if (editingProduct.id === "PRD-111" || editingProduct.category === "Hamper" || formData.name.toLowerCase().includes("hamper")) {
      fetch("/api/settings/hamper", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          config: {
            aboutTitle: formData.aboutTitle.trim() || "ABOUT HAMPER",
            aboutPoints: formData.aboutPoints.length > 0 ? formData.aboutPoints : undefined,
          },
        }),
      }).catch(() => {});
    }

    setEditingProduct(null);
    showToast(`Product "${formData.name}" (₹${numPrice} • ${finalCategory}) updated & synced!`);
  };

  const handleDeleteProduct = (id: string, name: string) => {
    setDeletingProduct({ id, name });
  };

  const confirmDeleteProduct = () => {
    if (!deletingProduct) return;
    deleteProduct(deletingProduct.id);
    showToast(`Product "${deletingProduct.name}" removed from customer catalog.`);
    setDeletingProduct(null);
  };

  const filteredProducts = products.filter((p) => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;
    return (
      p.name.toLowerCase().includes(q) ||
      p.category.toLowerCase().includes(q) ||
      p.id.toLowerCase().includes(q)
    );
  });

  return (
    <div className="flex flex-col gap-6 p-6 bg-[#F8F3EE] min-h-screen relative">
      {/* Toast Banner */}
      {toastMessage && (
        <div className="fixed top-20 right-8 z-50 bg-[#3A2B24] text-white px-5 py-3 rounded-2xl shadow-xl border border-[#D89A86]/40 flex items-center gap-2.5 animate-in fade-in slide-in-from-top-4 duration-300">
          <CheckCircle2 className="h-5 w-5 text-[#D89A86]" />
          <span className="text-xs font-bold">{toastMessage}</span>
        </div>
      )}

      {/* Top Action Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="font-serif-brand text-3xl font-bold tracking-tight text-[#3A2B24]">Products Management & Image Section</h2>
          <p className="text-xs text-[#6C5C54] mt-1">Upload custom product images from computer, manage catalog items & sync live to customer store.</p>
        </div>
        <div className="flex items-center gap-2.5 flex-wrap">
          <Link
            href="/admin/hamper"
            className="border-[#D89A86] bg-white text-[#D89A86] hover:bg-[#FFF8F2] text-xs font-bold rounded-full px-4 h-11 shadow-xs flex items-center gap-1.5 cursor-pointer transition-all duration-200 border"
          >
            <Gift className="h-4 w-4 text-[#D89A86]" /> Edit Hamper Boxes
          </Link>
          <Button 
            onClick={() => setIsSpotlightModalOpen(true)}
            variant="outline"
            className="border-[#D89A86] bg-white text-[#D89A86] hover:bg-[#FFF8F2] hover:text-[#C58572] text-xs font-bold rounded-full px-4 h-11 shadow-xs flex items-center gap-1.5 cursor-pointer transition-all duration-200"
          >
            <Sparkles className="h-4 w-4 text-[#D89A86]" /> Edit Spotlight Banner
          </Button>
          <Button 
            onClick={handleOpenAddModal}
            className="btn-pixello-primary text-xs font-bold rounded-full px-5 h-11 shadow-md flex items-center gap-2 cursor-pointer transition-all duration-200"
          >
            <Plus className="h-4 w-4 text-white" /> Add New Product & Image
          </Button>
        </div>
      </div>

      {/* Dedicated Customer Store Image Upload Section */}
      <Card className="border border-[#EFE6DD] bg-white rounded-3xl shadow-xs overflow-hidden">
        <CardHeader className="p-6 pb-3 border-b border-[#EFE6DD] bg-[#FFF8F2]">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="h-10 w-10 rounded-2xl bg-white border border-[#EFE6DD] flex items-center justify-center text-[#D89A86] shadow-2xs">
                <ImageIcon className="h-5 w-5" />
              </div>
              <div>
                <CardTitle className="font-serif-brand text-xl font-bold text-[#3A2B24]">
                  Product Image Uploader (4 to 5 Optional Photos)
                </CardTitle>
                <CardDescription className="text-xs text-[#6C5C54]">
                  Upload up to 5 optional product photos directly from your laptop or paste URLs to update the customer store gallery.
                </CardDescription>
              </div>
            </div>
            <Badge className="bg-emerald-100 text-emerald-800 border border-emerald-200 text-xs px-3 py-1 rounded-full font-bold w-fit">
              Live Store Sync Active
            </Badge>
          </div>
        </CardHeader>

        <CardContent className="p-6">
          <form onSubmit={handleSaveQuickImages} className="flex flex-col gap-6">
            <input
              type="file"
              ref={slotFileInputRef}
              onChange={handleSlotFileUpload}
              accept="image/*"
              className="hidden"
            />

            <div>
              <label className="text-xs font-bold text-[#3A2B24] mb-1.5 block">
                Select Target Product to Manage Product Photos *
              </label>
              <select
                value={selectedQuickProduct?.id || ""}
                onChange={(e) => {
                  const found = products.find((p) => p.id === e.target.value);
                  handleSelectQuickProduct(found || null);
                }}
                className="w-full h-11 rounded-xl border border-[#EFE6DD] bg-white text-xs font-bold text-[#3A2B24] px-3 focus:outline-none focus:ring-2 focus:ring-[#D89A86] cursor-pointer shadow-2xs"
              >
                <option value="" className="bg-white text-[#3A2B24]">-- Select Product to Upload 4-5 Photos --</option>
                {products.map((p) => (
                  <option key={p.id} value={p.id} className="bg-white text-[#3A2B24]">
                    {p.name} ({p.category})
                  </option>
                ))}
              </select>
            </div>

            {selectedQuickProduct && (
              <div>
                <div className="flex items-center justify-between mb-3">
                  <label className="text-xs font-bold text-[#3A2B24] flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-[#D89A86]" /> 
                    Product Photos Gallery (Slot #1 Main Photo • Slots #2-5 Optional)
                  </label>
                  <span className="text-[11px] text-[#D89A86] font-semibold">
                    {quickImages.filter(Boolean).length} of 5 photos added
                  </span>
                </div>

                {/* 5 Slots Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-5 gap-3.5">
                  {[0, 1, 2, 3, 4].map((slotIdx) => {
                    const imgUrl = quickImages[slotIdx];
                    const isMainSlot = slotIdx === 0;

                    return (
                      <div
                        key={slotIdx}
                        className={`p-3 rounded-2xl border flex flex-col justify-between transition-all ${
                          imgUrl
                            ? "border-emerald-300 bg-emerald-50/40"
                            : "border-dashed border-[#EFE6DD] bg-[#FFF8F2]/50 hover:border-[#D89A86]"
                        }`}
                      >
                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-[10px] font-bold text-[#3A2B24]">
                              Photo #{slotIdx + 1}
                            </span>
                            <span
                              className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${
                                isMainSlot
                                  ? "bg-[#3A2B24] text-white"
                                  : "bg-[#FFF8F2] text-[#D89A86] border border-[#D89A86]/30"
                              }`}
                            >
                              {isMainSlot ? "Main Photo" : "Optional"}
                            </span>
                          </div>

                          <div className="aspect-square rounded-xl overflow-hidden bg-white border border-[#EFE6DD] relative mb-2 flex items-center justify-center shadow-2xs group">
                            {imgUrl ? (
                              <img src={imgUrl} alt={`Photo ${slotIdx + 1}`} className="w-full h-full object-cover" />
                            ) : (
                              <div className="flex flex-col items-center justify-center text-center p-2 text-[#6C5C54]">
                                <ImageIcon className="h-6 w-6 text-[#D89A86]/60 mb-1" />
                                <span className="text-[10px] font-medium">Empty Slot #{slotIdx + 1}</span>
                              </div>
                            )}
                          </div>

                          <Input
                            placeholder={`Paste URL #${slotIdx + 1}...`}
                            value={imgUrl}
                            onChange={(e) => {
                              const val = e.target.value;
                              setQuickImages((prev) => {
                                const nextArr = [...prev];
                                nextArr[slotIdx] = val;
                                return nextArr;
                              });
                            }}
                            className="rounded-xl border-[#EFE6DD] text-[11px] font-mono text-[#3A2B24] h-8 bg-white mb-2"
                          />
                        </div>

                        <div className="flex gap-1.5 mt-1">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              activeSlotIdxRef.current = slotIdx;
                              slotFileInputRef.current?.click();
                            }}
                            className="flex-1 rounded-xl text-[10px] font-bold border-[#EFE6DD] bg-white hover:bg-[#FFF8F2] h-7 px-1.5 cursor-pointer"
                          >
                            <Upload className="h-3 w-3 mr-1 text-[#D89A86]" /> Laptop File
                          </Button>
                          {imgUrl && (
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setQuickImages((prev) => {
                                  const nextArr = [...prev];
                                  nextArr[slotIdx] = "";
                                  return nextArr;
                                });
                              }}
                              className="rounded-xl text-[10px] font-bold text-rose-600 hover:bg-rose-50 h-7 px-2 cursor-pointer"
                            >
                              Clear
                            </Button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="mt-5 flex justify-end">
                  <Button
                    type="submit"
                    className="btn-pixello-primary text-xs font-bold rounded-full h-12 px-8 shadow-md flex items-center gap-2 cursor-pointer"
                  >
                    <Upload className="h-4 w-4 text-white" /> Save & Push All {quickImages.filter(Boolean).length} Images to Customer Store
                  </Button>
                </div>
              </div>
            )}
          </form>
        </CardContent>
      </Card>

      <Card className="border border-[#EFE6DD] bg-white rounded-3xl shadow-xs overflow-hidden">
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <div>
              <h3 className="font-serif-brand text-xl font-bold text-[#3A2B24]">All Store Products & Images</h3>
              <p suppressHydrationWarning className="text-xs text-[#6C5C54] mt-0.5">{isMounted ? products.length : 0} Items Listed in Catalog</p>
            </div>
            <div className="relative w-full sm:w-72">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#6C5C54]" />
              <Input 
                placeholder="Search products..." 
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
                    <th className="px-4 py-3.5">Image</th>
                    <th className="px-4 py-3.5">ID</th>
                    <th className="px-4 py-3.5">Product Name</th>
                    <th className="px-4 py-3.5">Category</th>
                    <th className="px-4 py-3.5">Price</th>
                    <th className="px-4 py-3.5">Stock</th>
                    <th className="px-4 py-3.5">Status</th>
                    <th className="px-4 py-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#EFE6DD]">
                  {filteredProducts.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="text-center py-10 text-xs text-[#6C5C54]">
                        {searchQuery ? `No products found matching "${searchQuery}"` : "No products listed yet. Click '+ Add New Product' to create one!"}
                      </td>
                    </tr>
                  ) : (
                    filteredProducts.map((product) => (
                      <tr key={product.id} className="hover:bg-[#FFF8F2]/50 transition-colors">
                        <td className="px-4 py-3">
                          <div 
                            onClick={() => {
                              handleSelectQuickProduct(product);
                              window.scrollTo({ top: 300, behavior: "smooth" });
                            }}
                            title="Click to edit image"
                            className="h-12 w-12 rounded-xl overflow-hidden border border-[#EFE6DD] bg-[#FFF8F2] shadow-2xs group relative cursor-pointer"
                          >
                            <img src={product.image} alt={product.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform" />
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white">
                              <Edit className="h-4 w-4" />
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-4 text-xs font-medium text-[#6C5C54]">{product.id}</td>
                        <td className="px-4 py-4">
                          <p className="font-bold text-[#3A2B24]">{product.name}</p>
                          {product.badge && (
                            <Badge className="bg-[#3A2B24] text-white text-[9px] font-bold px-2 py-0 rounded-full mt-0.5 border-none">
                              {product.badge}
                            </Badge>
                          )}
                        </td>
                        <td className="px-4 py-4 text-xs font-medium text-[#6C5C54]">{product.category}</td>
                        <td className="px-4 py-4 font-extrabold text-[#D89A86]">₹{product.price}</td>
                        <td className="px-4 py-4 text-xs font-semibold text-[#3A2B24]">{product.stock || 0} units</td>
                        <td className="px-4 py-4">
                          <button
                            type="button"
                            onClick={() => {
                              const isCurrentlyOutOfStock = product.status === "Out of Stock" || (product.stock !== undefined && product.stock <= 0);
                              const newStatus = isCurrentlyOutOfStock ? "Active" : "Out of Stock";
                              const newStock = isCurrentlyOutOfStock ? 100 : 0;
                              updateProduct(product.id, { status: newStatus, stock: newStock });
                              showToast(`✓ Updated "${product.name}" stock status to ${newStatus === "Active" ? "IN STOCK ✅" : "OUT OF STOCK ❌"}!`);
                            }}
                            className={`px-3 py-1.5 rounded-xl text-xs font-extrabold flex items-center gap-1.5 transition-all cursor-pointer shadow-2xs border ${
                              product.status === "Out of Stock" || (product.stock !== undefined && product.stock <= 0)
                                ? "bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100"
                                : "bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100"
                            }`}
                          >
                            {product.status === "Out of Stock" || (product.stock !== undefined && product.stock <= 0) ? (
                              <>
                                <span>❌</span> Out of Stock
                              </>
                            ) : (
                              <>
                                <span>✅</span> In Stock
                              </>
                            )}
                          </button>
                        </td>
                        <td className="px-4 py-4 text-right whitespace-nowrap">
                          <div className="flex items-center justify-end gap-2">
                            {(product.category === "Frames" || (product.frameSizes && product.frameSizes.length > 0)) && (
                              <Button 
                                size="sm" 
                                variant="outline" 
                                onClick={() => handleOpenFrameModal(product)}
                                className="rounded-full text-xs font-bold border-amber-300 text-amber-900 bg-amber-50 hover:bg-amber-100 px-3.5 h-8 flex items-center gap-1.5 cursor-pointer shadow-2xs"
                              >
                                <Sparkles className="h-3.5 w-3.5 text-amber-600" /> Frame Sizes & Prices
                              </Button>
                            )}
                            <Button 
                              size="sm" 
                              variant="outline" 
                              onClick={() => handleOpenEditModal(product)}
                              className="rounded-full text-xs font-bold border-[#EFE6DD] text-[#3A2B24] bg-white hover:bg-[#FFF8F2] hover:text-[#D89A86] px-3.5 h-8 flex items-center gap-1.5 cursor-pointer shadow-2xs"
                            >
                              <Edit className="h-3.5 w-3.5 text-[#D89A86]" /> Edit Details
                            </Button>
                            <Button 
                              size="sm" 
                              variant="outline" 
                              onClick={() => handleDeleteProduct(product.id, product.name)}
                              className="rounded-full text-xs font-bold border-rose-200 text-rose-600 bg-white hover:bg-rose-50 px-3.5 h-8 flex items-center gap-1.5 cursor-pointer shadow-2xs"
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

      {/* Add / Edit Product Modal - Wide 2-Column Format */}
      {(isAddModalOpen || editingProduct) && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 sm:p-6 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl border border-[#EFE6DD] shadow-2xl w-full max-w-4xl p-6 flex flex-col max-h-[88vh] animate-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-4 border-b border-[#EFE6DD] flex-shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="h-10 w-10 rounded-2xl bg-[#FFF8F2] border border-[#EFE6DD] flex items-center justify-center text-[#D89A86]">
                  <Sparkles className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-serif-brand text-xl font-bold text-[#3A2B24]">
                    {editingProduct ? `Edit Product: ${editingProduct.name}` : "Add New Product"}
                  </h3>
                  <p className="text-xs text-[#6C5C54] font-medium">Configure product information, images, and pricing tiers.</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setIsAddModalOpen(false);
                  setEditingProduct(null);
                }}
                className="h-9 w-9 rounded-full bg-rose-50 border border-rose-200 flex items-center justify-center text-rose-600 hover:bg-rose-600 hover:text-white cursor-pointer shadow-xs transition-colors"
                title="Close modal"
              >
                <X className="h-4 w-4 stroke-[2.5]" />
              </button>
            </div>

            {/* Modal Scrollable Body */}
            <form onSubmit={editingProduct ? handleUpdateProduct : handleSaveNewProduct} className="flex flex-col flex-1 min-h-0 overflow-hidden mt-4">
              <div className="flex-1 overflow-y-auto pr-2 space-y-6 min-h-0">
                {/* SECTION 1: TWO COLUMN LAYOUT (LEFT: DETAILS, RIGHT: IMAGES) */}
                <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                  {/* LEFT COLUMN: BASIC DETAILS */}
                  <div className="md:col-span-7 flex flex-col gap-4">
                    <div>
                      <label className="text-xs font-bold text-[#3A2B24] mb-1 block">Product Name *</label>
                      <Input
                        required
                        placeholder="e.g. Lighting Panda"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        className="rounded-xl border-[#EFE6DD] bg-white text-xs font-medium text-[#3A2B24] focus-visible:ring-[#D89A86]"
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <label className="text-xs font-bold text-[#3A2B24]">Category *</label>
                          <button
                            type="button"
                            onClick={() => setIsCustomCategoryMode(!isCustomCategoryMode)}
                            className="text-[10px] font-bold text-[#D89A86] hover:underline"
                          >
                            {isCustomCategoryMode ? "← Existing" : "➕ Custom"}
                          </button>
                        </div>

                        {isCustomCategoryMode ? (
                          <Input
                            required
                            placeholder="e.g. Keychains, Wall Art"
                            value={customCategoryInput}
                            onChange={(e) => setCustomCategoryInput(e.target.value)}
                            className="rounded-xl border-[#D89A86] bg-[#FFF8F2] text-xs font-medium text-[#3A2B24] focus-visible:ring-[#D89A86]"
                          />
                        ) : (
                          <select
                            value={formData.category}
                            onChange={(e) => {
                              if (e.target.value === "__CUSTOM__") {
                                setIsCustomCategoryMode(true);
                                setCustomCategoryInput("");
                              } else {
                                setFormData({ ...formData, category: e.target.value });
                              }
                            }}
                            className="w-full h-10 rounded-xl border border-[#EFE6DD] bg-white text-xs font-medium text-[#3A2B24] px-3 focus:outline-none focus:ring-2 focus:ring-[#D89A86] cursor-pointer"
                          >
                            {existingCategories.map((cat) => (
                              <option key={cat} value={cat} className="bg-white text-[#3A2B24]">{cat}</option>
                            ))}
                            <option value="__CUSTOM__" className="bg-white text-[#D89A86] font-bold">➕ Create New Custom Category...</option>
                          </select>
                        )}
                      </div>

                      <div>
                        <label className="text-xs font-bold text-[#3A2B24] mb-1 block">Selling Price (₹) *</label>
                        <Input
                          required
                          type="text"
                          placeholder="e.g. 229"
                          value={formData.price}
                          onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                          className="rounded-xl border-[#EFE6DD] bg-white text-xs font-medium text-[#3A2B24] focus-visible:ring-[#D89A86]"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="text-xs font-bold text-[#3A2B24] mb-1 block">Original MRP Price (₹)</label>
                        <Input
                          type="text"
                          placeholder="e.g. 399 (Strikethrough)"
                          value={formData.originalPrice}
                          onChange={(e) => setFormData({ ...formData, originalPrice: e.target.value })}
                          className="rounded-xl border-[#EFE6DD] bg-white text-xs font-medium text-[#3A2B24] focus-visible:ring-[#D89A86]"
                        />
                      </div>

                      <div>
                        <label className="text-xs font-bold text-[#3A2B24] mb-1 block">Offer Badge Tag</label>
                        <Input
                          placeholder="e.g. ONLY AT ₹229 • BEST QUALITY ♥"
                          value={formData.badgeTag}
                          onChange={(e) => setFormData({ ...formData, badgeTag: e.target.value })}
                          className="rounded-xl border-[#EFE6DD] bg-white text-xs font-medium text-[#3A2B24] focus-visible:ring-[#D89A86]"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-3">
                      <div>
                        <label className="text-xs font-bold text-[#3A2B24] mb-1 block">Stock *</label>
                        <Input
                          required
                          type="number"
                          min="0"
                          value={formData.stock}
                          onChange={(e) => handleStockInputChange(Number(e.target.value) || 0)}
                          className="rounded-xl border-[#EFE6DD] bg-white text-xs font-medium text-[#3A2B24] focus-visible:ring-[#D89A86]"
                        />
                      </div>

                      <div>
                        <label className="text-xs font-bold text-[#3A2B24] mb-1 block">Badge Tag</label>
                        <Input
                          placeholder="e.g. Bestseller"
                          value={formData.badge}
                          onChange={(e) => setFormData({ ...formData, badge: e.target.value })}
                          className="rounded-xl border-[#EFE6DD] bg-white text-xs font-medium text-[#3A2B24] focus-visible:ring-[#D89A86]"
                        />
                      </div>

                      <div>
                        <label className="text-xs font-bold text-[#3A2B24] mb-1 block">Status</label>
                        <select
                          value={formData.status}
                          onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                          className="w-full h-10 rounded-xl border border-[#EFE6DD] bg-white text-xs font-medium text-[#3A2B24] px-2 focus:outline-none focus:ring-2 focus:ring-[#D89A86] cursor-pointer text-[11px]"
                        >
                          <option value="Active" className="bg-white text-[#3A2B24]">Active</option>
                          <option value="Low Stock" className="bg-white text-[#3A2B24]">Low Stock</option>
                          <option value="Out of Stock" className="bg-white text-[#3A2B24]">Out of Stock</option>
                          <option value="Inactive" className="bg-white text-[#3A2B24]">Inactive</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="text-xs font-bold text-[#3A2B24] mb-1 block">Product Description</label>
                      <textarea
                        rows={2}
                        placeholder="Enter full product description..."
                        value={formData.description}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        className="w-full rounded-xl border border-[#EFE6DD] bg-white text-xs font-medium text-[#3A2B24] p-2.5 focus:outline-none focus:ring-2 focus:ring-[#D89A86]"
                      />
                    </div>
                  </div>

                  {/* RIGHT COLUMN: IMAGES UPLOAD (PRIMARY + SECONDARY) */}
                  <div className="md:col-span-5 flex flex-col gap-4">
                    {/* PRIMARY IMAGE */}
                    <div className="p-4 bg-[#FFF8F2] border border-[#EFE6DD] rounded-2xl flex flex-col gap-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-[#3A2B24] flex items-center gap-1.5">
                          <ImageIcon className="h-4 w-4 text-[#D89A86]" /> Primary Image *
                        </span>
                        <span className="text-[10px] text-[#6C5C54]">Main Cover</span>
                      </div>

                      <div className="flex items-center gap-3">
                        <div className="h-20 w-20 rounded-2xl overflow-hidden border border-[#EFE6DD] bg-white flex-shrink-0 shadow-2xs relative">
                          <img src={formData.image} alt="Preview" className="w-full h-full object-cover" />
                        </div>

                        <div className="flex-1 flex flex-col gap-1.5">
                          <Input
                            placeholder="Paste image URL..."
                            value={formData.image}
                            onChange={(e) => setFormData({ ...formData, image: e.target.value })}
                            className="rounded-xl border-[#EFE6DD] bg-white text-[11px] font-mono text-[#3A2B24] h-8"
                          />
                          <input
                            type="file"
                            ref={fileInputRef}
                            onChange={handleFileUpload}
                            accept="image/*"
                            className="hidden"
                          />
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => fileInputRef.current?.click()}
                            className="rounded-xl border-[#EFE6DD] bg-white text-xs font-bold text-[#3A2B24] hover:bg-[#FFF8F2] h-8 px-3 flex items-center gap-1.5 cursor-pointer shadow-2xs w-full justify-center"
                          >
                            <Upload className="h-3.5 w-3.5 text-[#D89A86]" /> Upload Image
                          </Button>
                        </div>
                      </div>
                    </div>

                    {/* SECONDARY IMAGE */}
                    <div className="p-4 bg-[#FFF8F2] border border-[#EFE6DD] rounded-2xl flex flex-col gap-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-[#3A2B24] flex items-center gap-1.5">
                          <Layers className="h-4 w-4 text-[#D89A86]" /> Second Image (Optional)
                        </span>
                        <span className="text-[10px] text-[#6C5C54]">2nd Slide</span>
                      </div>

                      <div className="flex items-center gap-3">
                        <div className="h-20 w-20 rounded-2xl overflow-hidden border border-[#EFE6DD] bg-[#F8F3EE] flex-shrink-0 shadow-2xs flex items-center justify-center">
                          {formData.image2 ? (
                            <img src={formData.image2} alt="Preview 2" className="w-full h-full object-cover" />
                          ) : (
                            <ImageIcon className="h-7 w-7 text-[#D89A86]/50" />
                          )}
                        </div>

                        <div className="flex-1 flex flex-col gap-1.5">
                          <Input
                            placeholder="Paste 2nd image URL..."
                            value={formData.image2}
                            onChange={(e) => setFormData({ ...formData, image2: e.target.value })}
                            className="rounded-xl border-[#EFE6DD] bg-white text-[11px] font-mono text-[#3A2B24] h-8"
                          />
                          <input
                            type="file"
                            id="image2FileInput"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (!file) return;
                              compressImageFile(file, (compressed) => setFormData((prev) => ({ ...prev, image2: compressed })));
                            }}
                            accept="image/*"
                            className="hidden"
                          />
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => document.getElementById("image2FileInput")?.click()}
                            className="rounded-xl border-[#EFE6DD] bg-white text-xs font-bold text-[#3A2B24] hover:bg-[#FFF8F2] h-8 px-3 flex items-center gap-1.5 cursor-pointer shadow-2xs w-full justify-center"
                          >
                            <Upload className="h-3.5 w-3.5 text-[#D89A86]" /> Upload 2nd Image
                          </Button>
                          {formData.image2 && (
                            <button
                              type="button"
                              onClick={() => setFormData((prev) => ({ ...prev, image2: "" }))}
                              className="text-[10px] font-bold text-rose-500 hover:underline text-left"
                            >
                              ✕ Remove 2nd Image
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* SECTION 2: FULL-WIDTH PRICING & OPTIONS SEGMENTED TABS */}
                <div className="flex flex-col gap-3 pt-2 border-t border-[#EFE6DD]">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-[#3A2B24]">Pricing Tiers & Size Configurations</span>
                    <span className="text-[10px] text-[#6C5C54]">Select a tab to configure specific pricing</span>
                  </div>

                  {/* Segmented Tab Header */}
                  <div className="grid grid-cols-3 gap-2 p-1.5 bg-[#FFF8F2] border border-[#EFE6DD] rounded-2xl">
                    <button
                      type="button"
                      onClick={() => setActivePricingTab("variants")}
                      className={`py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                        activePricingTab === "variants"
                          ? "bg-white text-[#3A2B24] shadow-xs border border-[#EFE6DD]"
                          : "text-[#6C5C54] hover:text-[#3A2B24] hover:bg-white/50"
                      }`}
                    >
                      <Sparkles className="h-3.5 w-3.5 text-[#D89A86]" />
                      <span>Editions / Variants ({formData.variants.length})</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setActivePricingTab("frames")}
                      className={`py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                        activePricingTab === "frames"
                          ? "bg-amber-100/80 text-amber-900 shadow-xs border border-amber-300"
                          : "text-[#6C5C54] hover:text-[#3A2B24] hover:bg-white/50"
                      }`}
                    >
                      <Sparkles className="h-3.5 w-3.5 text-amber-600" />
                      <span>Frame Sizes ({formData.frameSizes.length})</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setActivePricingTab("polaroids")}
                      className={`py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                        activePricingTab === "polaroids"
                          ? "bg-pink-100/80 text-pink-900 shadow-xs border border-pink-300"
                          : "text-[#6C5C54] hover:text-[#3A2B24] hover:bg-white/50"
                      }`}
                    >
                      <Layers className="h-3.5 w-3.5 text-pink-600" />
                      <span>Polaroid Sizes ({formData.polaroidSizes.length})</span>
                    </button>
                  </div>

                  {/* TAB CONTENT 1: VARIANTS */}
                  {activePricingTab === "variants" && (
                    <div className="p-4 bg-[#FFF8F2] border border-[#EFE6DD] rounded-2xl flex flex-col gap-3 animate-in fade-in duration-150">
                      <div className="flex items-center justify-between">
                        <div>
                          <span className="text-xs font-bold text-[#3A2B24] flex items-center gap-1.5">
                            <Sparkles className="h-4 w-4 text-[#D89A86]" /> Product Editions / Variants
                          </span>
                          <p className="text-[10px] text-[#6C5C54] mt-0.5">Configure product editions (e.g. Standard, Gift Wrap Box Edition) shown on product page.</p>
                        </div>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setFormData((prev) => ({
                              ...prev,
                              variants: [
                                ...prev.variants,
                                {
                                  name: `Edition #${prev.variants.length + 1}`,
                                  price: Number(formData.price) || 229,
                                  originalPrice: Number(formData.originalPrice) || 399,
                                  description: "Includes gift box + Personalized message card",
                                },
                              ],
                            }));
                          }}
                          className="rounded-full border-[#D89A86] text-[#D89A86] hover:bg-white text-[11px] font-bold h-8 px-3 cursor-pointer"
                        >
                          + Add Product Edition
                        </Button>
                      </div>

                      {formData.variants.length === 0 ? (
                        <p className="text-xs text-[#6C5C54] italic text-center py-3 bg-white rounded-xl border border-dashed border-[#EFE6DD]">
                          No custom editions added yet. The product will use single standard pricing. Click &quot;+ Add Product Edition&quot; above to add editions!
                        </p>
                      ) : (
                        <div className="flex flex-col gap-3">
                          {formData.variants.map((variant, vIdx) => (
                            <div key={vIdx} className="p-3 bg-white border border-[#EFE6DD] rounded-xl flex flex-col gap-2 relative">
                              <div className="flex items-center justify-between">
                                <span className="text-xs font-bold text-[#3A2B24]">Edition #{vIdx + 1}</span>
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    const edName = variant.name || `Edition #${vIdx + 1}`;
                                    setFormData((prev) => ({
                                      ...prev,
                                      variants: prev.variants.filter((_, idx) => idx !== vIdx),
                                    }));
                                    showToast(`Removed "${edName}". Click "Save Changes & Sync" below to apply.`);
                                  }}
                                  className="text-xs font-bold text-rose-600 hover:text-rose-800 hover:bg-rose-50 px-2.5 py-1 rounded-lg border border-rose-200/80 hover:border-rose-300 transition-all cursor-pointer flex items-center gap-1.5 shadow-2xs"
                                  title="Remove this edition"
                                >
                                  <Trash2 className="h-3.5 w-3.5 text-rose-500" />
                                  <span>Remove Edition</span>
                                </button>
                              </div>

                              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                                <Input
                                  placeholder="Edition Name (e.g. STANDARD)"
                                  value={variant.name}
                                  onChange={(e) => {
                                    const val = e.target.value;
                                    setFormData((prev) => {
                                      const nextArr = [...prev.variants];
                                      nextArr[vIdx].name = val;
                                      return { ...prev, variants: nextArr };
                                    });
                                  }}
                                  className="rounded-lg border-[#EFE6DD] text-xs font-semibold h-8"
                                />

                                <Input
                                  placeholder="Selling Price (₹)"
                                  type="number"
                                  value={variant.price || ""}
                                  onChange={(e) => {
                                    const val = Number(e.target.value) || 0;
                                    setFormData((prev) => {
                                      const nextArr = [...prev.variants];
                                      nextArr[vIdx].price = val;
                                      return { ...prev, variants: nextArr };
                                    });
                                  }}
                                  className="rounded-lg border-[#EFE6DD] text-xs font-semibold h-8"
                                />

                                <Input
                                  placeholder="Original MRP Price (₹)"
                                  type="number"
                                  value={variant.originalPrice || ""}
                                  onChange={(e) => {
                                    const val = Number(e.target.value) || undefined;
                                    setFormData((prev) => {
                                      const nextArr = [...prev.variants];
                                      nextArr[vIdx].originalPrice = val;
                                      return { ...prev, variants: nextArr };
                                    });
                                  }}
                                  className="rounded-lg border-[#EFE6DD] text-xs font-semibold h-8"
                                />
                              </div>

                              <Input
                                placeholder="Subtitle / Features (e.g. Crystal clear acrylic • Couple figurine with warm LED glow)"
                                value={variant.description || ""}
                                onChange={(e) => {
                                  const val = e.target.value;
                                  setFormData((prev) => {
                                    const nextArr = [...prev.variants];
                                    nextArr[vIdx].description = val;
                                    return { ...prev, variants: nextArr };
                                  });
                                }}
                                className="rounded-lg border-[#EFE6DD] text-xs h-8"
                              />
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {/* TAB CONTENT 2: FRAME SIZES */}
                  {activePricingTab === "frames" && (
                    <div className="p-4 bg-amber-50/70 border border-amber-200/80 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-2xs animate-in fade-in duration-150">
                      <div>
                        <span className="text-xs font-bold text-[#3A2B24] flex items-center gap-1.5">
                          <Sparkles className="h-4 w-4 text-[#D89A86]" /> Frame Sizes & Paper Quality Prices (180G / 260G)
                        </span>
                        <p className="text-[11px] text-[#6C5C54] mt-0.5">
                          {formData.frameSizes.length > 0 
                            ? `${formData.frameSizes.length} Frame Sizes configured (${formData.frameSizes.map(s => s.label).join(", ")})` 
                            : "No frame sizes configured yet. Click button to set up sizes & paper pricing."}
                        </p>
                      </div>

                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          if (editingProduct) {
                            handleOpenFrameModal(editingProduct);
                          } else {
                            handleOpenFrameModal({
                              id: "NEW",
                              name: formData.name || "New Product",
                              category: "Frames",
                              price: Number(formData.price) || 149,
                              image: formData.image,
                              rating: 5.0,
                              reviews: 0,
                              status: "Active",
                              frameSizes: formData.frameSizes
                            });
                          }
                        }}
                        className="rounded-full border-amber-400 bg-white text-amber-900 hover:bg-amber-100 text-xs font-bold h-9 px-4 cursor-pointer shadow-xs flex-shrink-0 flex items-center gap-1.5"
                      >
                        <span>⚙️ Open Frame Sizes & Prices Editor</span>
                        <ArrowRight className="h-3.5 w-3.5 text-amber-600" />
                      </Button>
                    </div>
                  )}

                  {/* TAB CONTENT 3: POLAROID SIZES */}
                  {activePricingTab === "polaroids" && (
                    <div className="p-4 bg-pink-50/60 border border-pink-200/80 rounded-2xl flex flex-col gap-3 shadow-2xs animate-in fade-in duration-150">
                      <div className="flex items-center justify-between">
                        <div>
                          <span className="text-xs font-bold text-[#3A2B24] flex items-center gap-1.5">
                            <Layers className="h-4 w-4 text-pink-500" /> Polaroid Sizes &amp; Prices ({formData.polaroidSizes.length} Types)
                          </span>
                          <p className="text-[11px] text-[#6C5C54] mt-0.5">Add, edit, or remove polaroid print sizes &amp; prices. Syncs live to customer store.</p>
                        </div>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setFormData((prev) => ({
                              ...prev,
                              polaroidSizes: [
                                ...prev.polaroidSizes,
                                {
                                  label: `TYPE ${prev.polaroidSizes.length + 1}`,
                                  name: `Custom Polaroid Type ${prev.polaroidSizes.length + 1}`,
                                  priceEach: 10,
                                  minOrderQty: 5,
                                  description: `Custom polaroid • Min order 5 prints`,
                                },
                              ],
                            }));
                          }}
                          className="rounded-full border-pink-300 bg-white text-pink-700 hover:bg-pink-50 text-xs font-bold h-8 px-3 cursor-pointer flex items-center gap-1"
                        >
                          <Plus className="h-3.5 w-3.5" /> Add Type
                        </Button>
                      </div>

                      {formData.polaroidSizes.length === 0 ? (
                        <p className="text-xs text-[#6C5C54] italic text-center py-4 bg-white rounded-xl border border-dashed border-pink-200">
                          No polaroid sizes configured for this product. Click &quot;+ Add Type&quot; above to add polaroid print sizes!
                        </p>
                      ) : (
                        <div className="flex flex-col gap-3">
                          {formData.polaroidSizes.map((ps, idx) => (
                            <div key={idx} className="bg-white border border-pink-100 rounded-xl px-3 py-3 flex flex-col gap-2">
                              {/* Row 1: Label + Name + Price + Min Qty */}
                              <div className="grid grid-cols-5 gap-2 items-end">
                                <div>
                                  <label className="text-[9px] font-bold text-pink-700 uppercase block mb-0.5">Type Label</label>
                                  <Input
                                    placeholder="e.g. SMALL"
                                    value={ps.label}
                                    onChange={(e) => {
                                      const val = e.target.value.toUpperCase();
                                      setFormData((prev) => {
                                        const arr = [...prev.polaroidSizes];
                                        arr[idx] = { ...arr[idx], label: val };
                                        return { ...prev, polaroidSizes: arr };
                                      });
                                    }}
                                    className="rounded-lg border-pink-200 text-[10px] font-bold h-8 text-center uppercase"
                                  />
                                </div>
                                <div className="col-span-2">
                                  <label className="text-[9px] font-bold text-[#6C5C54] block mb-0.5">Display Name</label>
                                  <Input
                                    placeholder="e.g. Small Polaroid"
                                    value={ps.name}
                                    onChange={(e) => {
                                      const val = e.target.value;
                                      setFormData((prev) => {
                                        const arr = [...prev.polaroidSizes];
                                        arr[idx] = { ...arr[idx], name: val };
                                        return { ...prev, polaroidSizes: arr };
                                      });
                                    }}
                                    className="rounded-lg border-pink-200 text-xs h-8"
                                  />
                                </div>
                                <div>
                                  <label className="text-[9px] font-bold text-[#6C5C54] block mb-0.5">Price Each (₹)</label>
                                  <Input
                                    type="number"
                                    min={1}
                                    value={ps.priceEach}
                                    onChange={(e) => {
                                      const val = Number(e.target.value) || 1;
                                      setFormData((prev) => {
                                        const arr = [...prev.polaroidSizes];
                                        arr[idx] = { ...arr[idx], priceEach: val };
                                        return { ...prev, polaroidSizes: arr };
                                      });
                                    }}
                                    className="rounded-lg border-pink-200 text-xs font-bold h-8 text-center"
                                  />
                                </div>
                                <div>
                                  <label className="text-[9px] font-bold text-[#6C5C54] block mb-0.5">Min Qty</label>
                                  <Input
                                    type="number"
                                    min={1}
                                    value={ps.minOrderQty}
                                    onChange={(e) => {
                                      const val = Number(e.target.value) || 1;
                                      setFormData((prev) => {
                                        const arr = [...prev.polaroidSizes];
                                        arr[idx] = { ...arr[idx], minOrderQty: val };
                                        return { ...prev, polaroidSizes: arr };
                                      });
                                    }}
                                    className="rounded-lg border-pink-200 text-xs font-bold h-8 text-center"
                                  />
                                </div>
                              </div>

                              {/* Row 2: Description + Min Total + Delete */}
                              <div className="flex items-center gap-2">
                                <Input
                                  placeholder="Short description e.g. Tiny prints • Min order 10 prints"
                                  value={ps.description}
                                  onChange={(e) => {
                                    const val = e.target.value;
                                    setFormData((prev) => {
                                      const arr = [...prev.polaroidSizes];
                                      arr[idx] = { ...arr[idx], description: val };
                                      return { ...prev, polaroidSizes: arr };
                                    });
                                  }}
                                  className="flex-1 rounded-lg border-pink-200 text-[10px] h-7"
                                />
                                <span className="text-[10px] font-bold text-pink-700 whitespace-nowrap">
                                  Min: ₹{ps.priceEach * ps.minOrderQty}
                                </span>
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    const pName = ps.name || ps.label || `Type #${idx + 1}`;
                                    setFormData((prev) => ({
                                      ...prev,
                                      polaroidSizes: prev.polaroidSizes.filter((_, i) => i !== idx),
                                    }));
                                    showToast(`Removed "${pName}". Click "Save Changes & Sync" below to apply.`);
                                  }}
                                  className="text-rose-600 hover:text-rose-800 hover:bg-rose-50 px-2 py-0.5 rounded font-bold text-[10px] whitespace-nowrap flex items-center gap-1 cursor-pointer transition-colors border border-rose-200/60"
                                  title="Remove this size"
                                >
                                  <X className="h-3 w-3" /> Remove
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {/* SECTION: ABOUT PRODUCT / HIGHLIGHTS & QUALITY GUARANTEES */}
                  <div className="p-4 sm:p-5 bg-[#FAF7F4] border border-[#EFE6DD] rounded-2xl flex flex-col gap-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-[#EFE6DD]">
                      <div>
                        <span className="text-xs font-bold text-[#3A2B24] flex items-center gap-1.5">
                          <Sparkles className="h-4 w-4 text-[#D89A86]" /> ✨ &quot;About Product&quot; Highlights &amp; Guarantees ({formData.aboutPoints.length} Points)
                        </span>
                        <p className="text-[11px] text-[#6C5C54] mt-0.5">
                          Customize the section title and green checkmark guarantee bullet points shown on the customer product page.
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setFormData((prev) => ({
                              ...prev,
                              aboutPoints: [
                                ...prev.aboutPoints,
                                "Master studio handcrafted finish",
                              ],
                            }));
                          }}
                          className="rounded-full border-[#D89A86] bg-white text-[#D89A86] hover:bg-[#FFF8F2] text-xs font-bold h-8 px-3 cursor-pointer flex items-center gap-1"
                        >
                          <Plus className="h-3.5 w-3.5" /> Add Point
                        </Button>
                      </div>
                    </div>

                    {/* Section Headline Title */}
                    <div>
                      <label className="text-[10px] font-bold text-[#6C5C54] uppercase tracking-wider block mb-1">
                        Section Headline / Title *
                      </label>
                      <Input
                        placeholder="e.g. ABOUT HAMPER, ABOUT OUR FRAMES, ABOUT THIS PRODUCT"
                        value={formData.aboutTitle}
                        onChange={(e) => setFormData({ ...formData, aboutTitle: e.target.value })}
                        className="rounded-xl border-[#EFE6DD] bg-white text-xs font-bold text-[#3A2B24] h-9"
                      />
                    </div>

                    {/* Bullet Points List */}
                    <div className="flex flex-col gap-2">
                      <label className="text-[10px] font-bold text-[#6C5C54] uppercase tracking-wider block">
                        Bullet Points (Rendered with green checkmarks on customer storefront):
                      </label>
                      {formData.aboutPoints.map((point, ptIdx) => (
                        <div key={ptIdx} className="flex items-center gap-2 bg-white p-2 rounded-xl border border-[#EFE6DD]">
                          <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                          <span className="text-[10px] font-bold text-[#6C5C54] shrink-0">#{ptIdx + 1}</span>
                          <Input
                            value={point}
                            onChange={(e) => {
                              const next = [...formData.aboutPoints];
                              next[ptIdx] = e.target.value;
                              setFormData({ ...formData, aboutPoints: next });
                            }}
                            placeholder="e.g. Master studio handcrafted finish"
                            className="h-8 text-xs border-0 focus-visible:ring-0 focus-visible:outline-none p-0 text-[#3A2B24] font-medium"
                          />
                          {formData.aboutPoints.length > 1 && (
                            <button
                              type="button"
                              onClick={() => {
                                setFormData({
                                  ...formData,
                                  aboutPoints: formData.aboutPoints.filter((_, i) => i !== ptIdx),
                                });
                              }}
                              className="text-rose-500 hover:text-rose-700 p-1 cursor-pointer shrink-0"
                              title="Delete point"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Modal Sticky Footer */}
              <div className="flex justify-end gap-3 pt-4 mt-6 border-t border-[#EFE6DD] flex-shrink-0">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setIsAddModalOpen(false);
                    setEditingProduct(null);
                  }}
                  className="rounded-full text-xs font-bold border-[#EFE6DD] text-[#3A2B24] px-5 h-10"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  className="btn-pixello-primary text-xs font-bold rounded-full px-6 h-10 shadow-sm"
                >
                  {editingProduct ? "Save Changes & Sync" : "Create Product with Image"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DEDICATED FRAME SIZES & QUALITY PRICES MANAGER MODAL */}
      {frameModalProduct && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 sm:p-6 z-50 animate-in fade-in duration-200">
          <div className="bg-[#FFF8F2] rounded-3xl max-w-4xl w-full p-6 max-h-[88vh] border border-[#EFE6DD] shadow-2xl flex flex-col">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-[#EFE6DD] pb-4 mb-3 flex-shrink-0">
              <div>
                <span className="text-xs font-bold text-[#D89A86] uppercase tracking-wider block">Frame Customization Studio Editor</span>
                <h3 className="font-serif-brand text-2xl font-bold text-[#3A2B24]">
                  Sizes, Wood Finishes &amp; Paper GSM for &quot;{frameModalProduct.name}&quot;
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setFrameModalProduct(null)}
                className="h-9 w-9 rounded-full bg-rose-50 border border-rose-200 flex items-center justify-center text-rose-600 hover:bg-rose-600 hover:text-white cursor-pointer shadow-xs transition-colors"
                title="Close modal"
              >
                <X className="h-4 w-4 stroke-[2.5]" />
              </button>
            </div>

            {/* Modal Tabs Navigation */}
            <div className="flex items-center gap-2 border-b border-[#EFE6DD] pb-3 mb-4 flex-shrink-0 flex-wrap">
              <button
                type="button"
                onClick={() => setFrameModalActiveTab("sizes")}
                className={cn(
                  "px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer",
                  frameModalActiveTab === "sizes"
                    ? "bg-[#3A2B24] text-white shadow-xs"
                    : "bg-white text-[#6C5C54] hover:bg-[#FFF9F3] border border-[#EFE6DD]"
                )}
              >
                1. Frame Sizes &amp; Prices ({frameModalSizes.length})
              </button>
              <button
                type="button"
                onClick={() => setFrameModalActiveTab("woods")}
                className={cn(
                  "px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5",
                  frameModalActiveTab === "woods"
                    ? "bg-[#3A2B24] text-white shadow-xs"
                    : "bg-white text-[#6C5C54] hover:bg-[#FFF9F3] border border-[#EFE6DD]"
                )}
              >
                <span>2. Wood &amp; Finish Colors (Step 3)</span>
                <Badge className="bg-[#D89A86] text-white text-[9px] font-extrabold px-1.5 py-0.2">
                  {modalStudioConfig.woodColors.length}
                </Badge>
              </button>
              <button
                type="button"
                onClick={() => setFrameModalActiveTab("gsm")}
                className={cn(
                  "px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5",
                  frameModalActiveTab === "gsm"
                    ? "bg-[#3A2B24] text-white shadow-xs"
                    : "bg-white text-[#6C5C54] hover:bg-[#FFF9F3] border border-[#EFE6DD]"
                )}
              >
                <span>3. Print Paper Quality GSM (Step 4)</span>
                <Badge className="bg-[#D89A86] text-white text-[9px] font-extrabold px-1.5 py-0.2">
                  {modalStudioConfig.gsmOptions.length}
                </Badge>
              </button>
            </div>

            {/* Scrollable Modal Content */}
            <div className="flex-1 overflow-y-auto pr-1 space-y-4 min-h-0">
              
              {/* TAB 1: SIZES & PRICES */}
              {frameModalActiveTab === "sizes" && (
                <div className="space-y-4">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-white border border-[#EFE6DD] rounded-2xl p-4 shadow-2xs">
                    <div className="text-xs text-[#6C5C54]">
                      <strong className="text-[#3A2B24] font-bold">Quick Guide:</strong> Add frame sizes (4x6, 5x7, 6x8, A4, or custom). Set the strikethrough Original MRP, 180 GSM Matte price, and 260 GSM Glossy price for each size.
                    </div>
                    <Button
                      type="button"
                      onClick={() => {
                        setFrameModalSizes((prev) => [
                          ...prev,
                          {
                            label: "12x18 INCH",
                            name: "12x18 INCH",
                            dimensions: "12 x 18 Inches (30.4 x 45.7 cm)",
                            originalPrice: 499,
                            discountPct: 40,
                            gsm180Price: 299,
                            gsm260Price: 329,
                          },
                        ]);
                      }}
                      className="btn-pixello-primary rounded-full text-xs font-bold h-9 px-4 flex-shrink-0 cursor-pointer"
                    >
                      + Add New Size
                    </Button>
                  </div>

                  {/* TABLE VIEW OF FRAME SIZES */}
                  <div className="overflow-hidden border border-[#EFE6DD] rounded-2xl bg-white shadow-2xs">
                    <div className="overflow-x-auto max-h-[45vh] overflow-y-auto">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-[#FFF8F2] border-b border-[#EFE6DD] text-[11px] font-bold text-[#6C5C54] uppercase tracking-wider sticky top-0 z-10">
                          <tr>
                            <th className="px-4 py-3">#</th>
                            <th className="px-4 py-3">Size Label</th>
                            <th className="px-4 py-3">Dimensions / Description</th>
                            <th className="px-4 py-3">Original MRP (₹)</th>
                            <th className="px-4 py-3 text-emerald-800">180 GSM Price (₹)</th>
                            <th className="px-4 py-3 text-emerald-800">260 GSM Price (₹)</th>
                            <th className="px-4 py-3 text-right">Action</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[#EFE6DD]">
                          {frameModalSizes.map((fSize, sIdx) => (
                            <tr key={sIdx} className="hover:bg-[#FFF8F2]/40 transition-colors">
                              <td className="px-4 py-3 font-bold text-[#6C5C54]">{sIdx + 1}</td>
                              <td className="px-4 py-3">
                                <Input
                                  value={fSize.label}
                                  onChange={(e) => {
                                    const val = e.target.value;
                                    setFrameModalSizes((prev) => {
                                      const next = [...prev];
                                      next[sIdx].label = val;
                                      next[sIdx].name = val;
                                      return next;
                                    });
                                  }}
                                  className="rounded-lg border-[#EFE6DD] text-xs font-bold h-8 min-w-[100px]"
                                />
                              </td>
                              <td className="px-4 py-3">
                                <Input
                                  placeholder="e.g. 4 x 6 Inches (10.1 x 15.2 cm)"
                                  value={fSize.dimensions || ""}
                                  onChange={(e) => {
                                    const val = e.target.value;
                                    setFrameModalSizes((prev) => {
                                      const next = [...prev];
                                      next[sIdx].dimensions = val;
                                      return next;
                                    });
                                  }}
                                  className="rounded-lg border-[#EFE6DD] text-xs h-8 min-w-[180px]"
                                />
                              </td>
                              <td className="px-4 py-3">
                                <Input
                                  type="number"
                                  value={fSize.originalPrice}
                                  onChange={(e) => {
                                    const val = Number(e.target.value) || 0;
                                    setFrameModalSizes((prev) => {
                                      const next = [...prev];
                                      next[sIdx].originalPrice = val;
                                      return next;
                                    });
                                  }}
                                  className="rounded-lg border-[#EFE6DD] text-xs font-bold h-8 w-24"
                                />
                              </td>
                              <td className="px-4 py-3">
                                <Input
                                  type="number"
                                  value={fSize.gsm180Price}
                                  onChange={(e) => {
                                    const val = Number(e.target.value) || 0;
                                    setFrameModalSizes((prev) => {
                                      const next = [...prev];
                                      next[sIdx].gsm180Price = val;
                                      return next;
                                    });
                                  }}
                                  className="rounded-lg border-emerald-300 bg-emerald-50/50 text-xs font-bold h-8 w-24 text-emerald-800"
                                />
                              </td>
                              <td className="px-4 py-3">
                                <Input
                                  type="number"
                                  value={fSize.gsm260Price}
                                  onChange={(e) => {
                                    const val = Number(e.target.value) || 0;
                                    setFrameModalSizes((prev) => {
                                      const next = [...prev];
                                      next[sIdx].gsm260Price = val;
                                      return next;
                                    });
                                  }}
                                  className="rounded-lg border-emerald-300 bg-emerald-50/50 text-xs font-bold h-8 w-24 text-emerald-800"
                                />
                              </td>
                              <td className="px-4 py-3 text-right">
                                <button
                                  type="button"
                                  onClick={() => {
                                    setFrameModalSizes((prev) => prev.filter((_, idx) => idx !== sIdx));
                                  }}
                                  className="h-8 w-8 rounded-full flex items-center justify-center text-rose-600 hover:bg-rose-50 cursor-pointer ml-auto"
                                  title="Remove frame size"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 2: WOOD & FINISH COLORS (STEP 3) */}
              {frameModalActiveTab === "woods" && (
                <div className="space-y-4">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-white border border-[#EFE6DD] rounded-2xl p-4 shadow-2xs">
                    <div className="text-xs text-[#6C5C54]">
                      <strong className="text-[#3A2B24] font-bold">Wood &amp; Finish Colors:</strong> Edit the 4 standard wood finishes (Natural Pine, Classic Black, Walnut Brown, Dusty Rose Red) or add bespoke finishes with custom hex colors and descriptions.
                    </div>
                    <Button
                      type="button"
                      onClick={() => {
                        const newColor: FrameWoodColorConfig = {
                          id: `wood-${Date.now()}`,
                          name: "Warm Teak",
                          finish: "Handcrafted Matte Teak Finish",
                          hex: "#8B5A2B",
                          borderStyle: "linear-gradient(135deg, #A06535 0%, #75411E 50%, #8B5A2B 100%)",
                          matColor: "#FCFAF6",
                          description: "Organic golden teak with rich satin wax luster.",
                          enabled: true,
                        };
                        setModalStudioConfig((prev) => ({
                          ...prev,
                          woodColors: [...prev.woodColors, newColor],
                        }));
                      }}
                      className="btn-pixello-primary rounded-full text-xs font-bold h-9 px-4 flex-shrink-0 cursor-pointer"
                    >
                      + Add Wood Color
                    </Button>
                  </div>

                  <div className="space-y-3">
                    {modalStudioConfig.woodColors.map((color, cIdx) => (
                      <div
                        key={color.id || cIdx}
                        className={cn(
                          "p-4 rounded-xl border bg-white flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs",
                          color.enabled !== false ? "border-[#EFE6DD]" : "opacity-60 border-gray-200 bg-gray-50"
                        )}
                      >
                        {/* Swatch & Color Picker */}
                        <div className="flex items-center gap-3 shrink-0">
                          <div
                            style={{
                              backgroundColor: color.hex,
                              background: color.borderStyle || color.hex,
                            }}
                            className="h-10 w-10 rounded-xl shadow-xs border border-black/10 shrink-0 cursor-pointer overflow-hidden relative"
                            onClick={() => {
                              const input = document.getElementById(`prod-color-picker-${cIdx}`);
                              input?.click();
                            }}
                          >
                            <input
                              id={`prod-color-picker-${cIdx}`}
                              type="color"
                              value={color.hex.startsWith("#") && color.hex.length === 7 ? color.hex : "#C49A6C"}
                              onChange={(e) => {
                                const hex = e.target.value;
                                setModalStudioConfig((prev) => {
                                  const next = [...prev.woodColors];
                                  next[cIdx] = {
                                    ...next[cIdx],
                                    hex,
                                    borderStyle: `linear-gradient(135deg, ${hex}DD 0%, ${hex} 50%, ${hex}BB 100%)`,
                                  };
                                  return { ...prev, woodColors: next };
                                });
                              }}
                              className="opacity-0 absolute inset-0 cursor-pointer pointer-events-none"
                            />
                          </div>
                          <div>
                            <span className="text-xs font-bold text-[#3A2B24]">#{cIdx + 1}</span>
                          </div>
                        </div>

                        {/* Fields */}
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 flex-1">
                          <Input
                            value={color.name}
                            onChange={(e) => {
                              const name = e.target.value;
                              setModalStudioConfig((prev) => {
                                const next = [...prev.woodColors];
                                next[cIdx] = { ...next[cIdx], name };
                                return { ...prev, woodColors: next };
                              });
                            }}
                            placeholder="Color Name"
                            className="h-8 rounded-lg border-[#EFE6DD] text-xs font-bold"
                          />
                          <Input
                            value={color.finish}
                            onChange={(e) => {
                              const finish = e.target.value;
                              setModalStudioConfig((prev) => {
                                const next = [...prev.woodColors];
                                next[cIdx] = { ...next[cIdx], finish };
                                return { ...prev, woodColors: next };
                              });
                            }}
                            placeholder="Finish Subtitle"
                            className="h-8 rounded-lg border-[#EFE6DD] text-xs font-semibold"
                          />
                          <Input
                            value={color.hex}
                            onChange={(e) => {
                              const hex = e.target.value;
                              setModalStudioConfig((prev) => {
                                const next = [...prev.woodColors];
                                next[cIdx] = {
                                  ...next[cIdx],
                                  hex,
                                  borderStyle: `linear-gradient(135deg, ${hex}DD 0%, ${hex} 50%, ${hex}BB 100%)`,
                                };
                                return { ...prev, woodColors: next };
                              });
                            }}
                            placeholder="#1A1A1A"
                            className="h-8 rounded-lg border-[#EFE6DD] text-xs font-mono font-bold"
                          />
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                          <button
                            type="button"
                            onClick={() => {
                              setModalStudioConfig((prev) => {
                                const next = [...prev.woodColors];
                                next[cIdx] = { ...next[cIdx], enabled: next[cIdx].enabled === false ? true : false };
                                return { ...prev, woodColors: next };
                              });
                            }}
                            className={cn(
                              "text-[10px] font-bold px-2.5 py-1 rounded-full cursor-pointer border",
                              color.enabled !== false
                                ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                                : "bg-gray-100 text-gray-600 border-gray-300"
                            )}
                          >
                            {color.enabled !== false ? "Active" : "Off"}
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              if (modalStudioConfig.woodColors.length <= 1) return;
                              setModalStudioConfig((prev) => ({
                                ...prev,
                                woodColors: prev.woodColors.filter((_, idx) => idx !== cIdx),
                              }));
                            }}
                            disabled={modalStudioConfig.woodColors.length <= 1}
                            className="h-8 w-8 rounded-full flex items-center justify-center text-rose-600 hover:bg-rose-50 cursor-pointer disabled:opacity-30"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* TAB 3: PRINT PAPER QUALITY GSM (STEP 4) */}
              {frameModalActiveTab === "gsm" && (
                <div className="space-y-4">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-white border border-[#EFE6DD] rounded-2xl p-4 shadow-2xs">
                    <div className="text-xs text-[#6C5C54]">
                      <strong className="text-[#3A2B24] font-bold">Paper Quality GSM:</strong> Configure paper options (180 GSM Standard Matte Paper, 260 GSM Premium Glossy), archival finish descriptions, and extra price surcharges (+₹10).
                    </div>
                    <Button
                      type="button"
                      onClick={() => {
                        const newGsm: FrameGsmOptionConfig = {
                          id: `gsm-${Date.now()}`,
                          gsm: "300 GSM",
                          title: "300 GSM Archival Canvas",
                          description: "Museum-grade heavy textured canvas finish",
                          priceDelta: 20,
                          badge: "+₹20",
                        };
                        setModalStudioConfig((prev) => ({
                          ...prev,
                          gsmOptions: [...prev.gsmOptions, newGsm],
                        }));
                      }}
                      className="btn-pixello-primary rounded-full text-xs font-bold h-9 px-4 flex-shrink-0 cursor-pointer"
                    >
                      + Add GSM Tier
                    </Button>
                  </div>

                  <div className="space-y-3">
                    {modalStudioConfig.gsmOptions.map((gsm, gIdx) => (
                      <div
                        key={gsm.id || gIdx}
                        className="p-4 rounded-xl border border-[#EFE6DD] bg-white flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs"
                      >
                        {/* GSM Badge */}
                        <div className="h-9 w-9 rounded-xl bg-[#FFF8F2] border border-[#EFE6DD] flex items-center justify-center text-xs font-extrabold text-[#D89A86] shrink-0">
                          GSM
                        </div>

                        {/* Fields */}
                        <div className="grid grid-cols-1 sm:grid-cols-4 gap-2 flex-1">
                          <Input
                            value={gsm.gsm}
                            onChange={(e) => {
                              const val = e.target.value;
                              setModalStudioConfig((prev) => {
                                const next = [...prev.gsmOptions];
                                next[gIdx] = { ...next[gIdx], gsm: val };
                                return { ...prev, gsmOptions: next };
                              });
                            }}
                            placeholder="e.g. 180 GSM"
                            className="h-8 rounded-lg border-[#EFE6DD] text-xs font-bold"
                          />
                          <Input
                            value={gsm.title}
                            onChange={(e) => {
                              const val = e.target.value;
                              setModalStudioConfig((prev) => {
                                const next = [...prev.gsmOptions];
                                next[gIdx] = { ...next[gIdx], title: val };
                                return { ...prev, gsmOptions: next };
                              });
                            }}
                            placeholder="Card Title"
                            className="h-8 rounded-lg border-[#EFE6DD] text-xs font-bold"
                          />
                          <Input
                            value={gsm.description}
                            onChange={(e) => {
                              const val = e.target.value;
                              setModalStudioConfig((prev) => {
                                const next = [...prev.gsmOptions];
                                next[gIdx] = { ...next[gIdx], description: val };
                                return { ...prev, gsmOptions: next };
                              });
                            }}
                            placeholder="Description"
                            className="h-8 rounded-lg border-[#EFE6DD] text-xs font-medium"
                          />
                          <div className="flex items-center gap-1.5">
                            <Input
                              type="number"
                              min="0"
                              value={gsm.priceDelta}
                              onChange={(e) => {
                                const delta = Number(e.target.value) || 0;
                                setModalStudioConfig((prev) => {
                                  const next = [...prev.gsmOptions];
                                  next[gIdx] = {
                                    ...next[gIdx],
                                    priceDelta: delta,
                                    badge: delta > 0 ? `+₹${delta}` : "",
                                  };
                                  return { ...prev, gsmOptions: next };
                                });
                              }}
                              placeholder="0"
                              className="h-8 rounded-lg border-[#EFE6DD] text-xs font-bold w-16"
                              title="Extra price (₹)"
                            />
                            <Input
                              value={gsm.badge || ""}
                              onChange={(e) => {
                                const badge = e.target.value;
                                setModalStudioConfig((prev) => {
                                  const next = [...prev.gsmOptions];
                                  next[gIdx] = { ...next[gIdx], badge };
                                  return { ...prev, gsmOptions: next };
                                });
                              }}
                              placeholder="+₹10"
                              className="h-8 rounded-lg border-[#EFE6DD] text-xs font-bold text-[#D89A86] flex-1"
                              title="Badge"
                            />
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="shrink-0 self-end sm:self-center">
                          <button
                            type="button"
                            onClick={() => {
                              if (modalStudioConfig.gsmOptions.length <= 1) return;
                              setModalStudioConfig((prev) => ({
                                ...prev,
                                gsmOptions: prev.gsmOptions.filter((_, idx) => idx !== gIdx),
                              }));
                            }}
                            disabled={modalStudioConfig.gsmOptions.length <= 1}
                            className="h-8 w-8 rounded-full flex items-center justify-center text-rose-600 hover:bg-rose-50 cursor-pointer disabled:opacity-30"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-between gap-3 pt-4 mt-2 border-t border-[#EFE6DD] flex-shrink-0">
              <span className="text-[11px] text-[#8C7A70] font-medium hidden sm:inline">
                Edits in all 3 tabs are saved and synced simultaneously.
              </span>
              <div className="flex items-center gap-2 ml-auto">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setFrameModalProduct(null)}
                  className="rounded-full border-[#EFE6DD] text-xs font-bold h-10 px-5 text-[#3A2B24] hover:bg-[#FFF8F2]"
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  onClick={handleSaveFrameSizesModal}
                  className="btn-pixello-primary rounded-full text-xs font-bold h-10 px-6 shadow-sm flex items-center gap-2"
                >
                  <Sparkles className="h-4 w-4 text-white" />
                  <span>Save Sizes, Colors &amp; GSM (Sync Live)</span>
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* CUSTOM DELETE CONFIRMATION MODAL */}
      {deletingProduct && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white border border-[#EFE6DD] rounded-3xl p-6 max-w-md w-full shadow-2xl flex flex-col gap-4 animate-in zoom-in-95 duration-200">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-2xl bg-rose-50 border border-rose-100 flex items-center justify-center text-rose-600 flex-shrink-0">
                <Trash2 className="h-6 w-6" />
              </div>
              <div>
                <h3 className="font-serif-brand text-lg font-bold text-[#3A2B24]">Delete Product?</h3>
                <p className="text-xs text-[#6C5C54] font-medium mt-0.5">This action will remove the item from the catalog.</p>
              </div>
            </div>

            <div className="p-3.5 bg-rose-50/50 border border-rose-100 rounded-2xl text-xs text-[#3A2B24]">
              Are you sure you want to delete <span className="font-bold text-rose-700">&quot;{deletingProduct.name}&quot;</span>? It will no longer appear on the customer store.
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setDeletingProduct(null)}
                className="rounded-full border-[#EFE6DD] text-xs font-bold h-10 px-5 text-[#3A2B24] hover:bg-[#FFF8F2]"
              >
                Cancel
              </Button>
              <Button
                type="button"
                onClick={confirmDeleteProduct}
                className="bg-rose-600 hover:bg-rose-700 text-white rounded-full text-xs font-bold h-10 px-5 shadow-sm flex items-center gap-1.5 cursor-pointer"
              >
                <Trash2 className="h-4 w-4" />
                <span>Yes, Delete Product</span>
              </Button>
            </div>
          </div>
        </div>
      )}
      {/* SPOTLIGHT BANNER EDIT MODAL */}
      {isSpotlightModalOpen && (
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
                    Edit Featured Spotlight Banner
                  </h3>
                  <p className="text-xs text-[#6C5C54]">
                    Highlighted at the top of the customer catalog at <span className="font-bold text-[#3A2B24]">/products</span>.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsSpotlightModalOpen(false)}
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
                  <span className="text-xs font-bold text-[#3A2B24] block">Spotlight Banner Visibility</span>
                  <span className="text-[11px] text-[#6C5C54]">Turn ON to display on the /products page</span>
                </div>
                <button
                  type="button"
                  onClick={() => setSpotlightForm({ ...spotlightForm, enabled: !spotlightForm.enabled })}
                  className={cn(
                    "text-xs font-extrabold px-4 py-1.5 rounded-full cursor-pointer transition-all border",
                    spotlightForm.enabled
                      ? "bg-emerald-100 text-emerald-800 border-emerald-300"
                      : "bg-rose-100 text-rose-800 border-rose-300"
                  )}
                >
                  {spotlightForm.enabled ? "✓ Visible / Active" : "✕ Hidden"}
                </button>
              </div>

              {/* Quick Select from existing products */}
              <div className="p-3 bg-[#FFF8F2]/70 rounded-xl border border-[#EFE6DD]">
                <label className="text-[11px] font-bold text-[#6C5C54] mb-1 block">
                  ⚡ Autofill from existing product (Optional):
                </label>
                <select
                  defaultValue=""
                  onChange={(e) => {
                    const prod = products.find((p) => p.id === e.target.value);
                    if (prod) {
                      setSpotlightForm({
                        ...spotlightForm,
                        title: prod.name,
                        price: prod.price,
                        originalPrice: prod.originalPrice || Math.round(prod.price * 1.3),
                        productLink: `/product/${prod.id}`,
                        description: prod.description || spotlightForm.description,
                      });
                      showToast(`Autofilled spotlight details from "${prod.name}"`);
                    }
                  }}
                  className="w-full text-xs rounded-xl border-[#EFE6DD] bg-white p-2 font-medium text-[#3A2B24] focus:ring-[#D89A86]"
                >
                  <option value="" disabled>Select a product to auto-populate...</option>
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} (₹{p.price} • {p.category})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-[#3A2B24] mb-1 block">Spotlight Tag</label>
                  <Input
                    value={spotlightForm.tag}
                    onChange={(e) => setSpotlightForm({ ...spotlightForm, tag: e.target.value })}
                    placeholder="FEATURED SPOTLIGHT"
                    className="rounded-xl border-[#EFE6DD] text-xs bg-white h-10"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-[#3A2B24] mb-1 block">Highlight Badge Subtitle</label>
                  <Input
                    value={spotlightForm.badgeText}
                    onChange={(e) => setSpotlightForm({ ...spotlightForm, badgeText: e.target.value })}
                    placeholder="Handcrafted & Locally Printed"
                    className="rounded-xl border-[#EFE6DD] text-xs bg-white h-10"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-[#3A2B24] mb-1 block">Product Title *</label>
                <Input
                  value={spotlightForm.title}
                  onChange={(e) => setSpotlightForm({ ...spotlightForm, title: e.target.value })}
                  placeholder="Handcrafted Classic Wooden Frame"
                  className="rounded-xl border-[#EFE6DD] text-xs font-bold text-[#3A2B24] bg-white h-10"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-[#3A2B24] mb-1 block">Description</label>
                <Input
                  value={spotlightForm.description}
                  onChange={(e) => setSpotlightForm({ ...spotlightForm, description: e.target.value })}
                  placeholder="Short description..."
                  className="rounded-xl border-[#EFE6DD] text-xs text-[#3A2B24] bg-white h-10"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="text-xs font-bold text-[#3A2B24] mb-1 block">Original Price (₹)</label>
                  <Input
                    type="number"
                    min="0"
                    value={spotlightForm.originalPrice}
                    onChange={(e) => setSpotlightForm({ ...spotlightForm, originalPrice: Number(e.target.value) || 0 })}
                    className="rounded-xl border-[#EFE6DD] text-xs font-bold text-[#3A2B24] bg-white h-10"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-[#3A2B24] mb-1 block">Spotlight Price (₹) *</label>
                  <Input
                    type="number"
                    min="0"
                    value={spotlightForm.price}
                    onChange={(e) => setSpotlightForm({ ...spotlightForm, price: Number(e.target.value) || 0 })}
                    className="rounded-xl border-[#EFE6DD] text-xs font-bold text-emerald-700 bg-white h-10"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-[#3A2B24] mb-1 block">Button Label</label>
                  <Input
                    value={spotlightForm.buttonText}
                    onChange={(e) => setSpotlightForm({ ...spotlightForm, buttonText: e.target.value })}
                    placeholder="Customize & Order"
                    className="rounded-xl border-[#EFE6DD] text-xs font-semibold text-[#3A2B24] bg-white h-10"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-[#3A2B24] mb-1 block">Target Product URL / Path</label>
                <Input
                  value={spotlightForm.productLink}
                  onChange={(e) => setSpotlightForm({ ...spotlightForm, productLink: e.target.value })}
                  placeholder="/product/1"
                  className="rounded-xl border-[#EFE6DD] text-xs font-mono text-[#3A2B24] bg-white h-10"
                />
              </div>

              {/* Live Preview */}
              <div className="p-3 bg-[#FFFDFB] rounded-xl border border-[#EFE6DD] space-y-1.5">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#6C5C54]">Preview:</span>
                <div className="p-3.5 rounded-xl bg-gradient-to-r from-[#FFF8F2] via-white to-[#FFF4ED] border border-[#F2C8B5] flex flex-col sm:flex-row items-center justify-between gap-3">
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-1.5">
                      <span className="bg-[#D89A86] text-white text-[9px] font-extrabold px-2 py-0.5 rounded-full uppercase">
                        {spotlightForm.tag || "FEATURED SPOTLIGHT"}
                      </span>
                      {spotlightForm.badgeText && (
                        <span className="text-[10px] font-bold text-[#D89A86]">{spotlightForm.badgeText}</span>
                      )}
                    </div>
                    <div className="font-serif-brand text-sm font-bold text-[#3A2B24]">{spotlightForm.title || "Product Title"}</div>
                    <p className="text-[11px] text-[#6C5C54] line-clamp-1">{spotlightForm.description}</p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <div className="text-right">
                      {spotlightForm.originalPrice > 0 && (
                        <span className="text-[9px] text-[#6C5C54] block line-through">₹{spotlightForm.originalPrice}</span>
                      )}
                      <span className="text-base font-extrabold text-[#3A2B24]">₹{spotlightForm.price}</span>
                    </div>
                    <span className="btn-pixello-primary text-[11px] font-bold rounded-full px-3 py-1.5">
                      {spotlightForm.buttonText || "Customize & Order"}
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
                onClick={() => setIsSpotlightModalOpen(false)}
                className="rounded-full border-[#EFE6DD] text-xs font-bold h-10 px-5 text-[#3A2B24] hover:bg-white"
              >
                Cancel
              </Button>
              <Button
                type="button"
                onClick={handleSaveSpotlightBanner}
                className="btn-pixello-primary rounded-full text-xs font-bold h-10 px-6 shadow-sm flex items-center gap-2"
              >
                <Sparkles className="h-4 w-4 text-white" />
                <span>Save Spotlight Banner &amp; Sync</span>
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
