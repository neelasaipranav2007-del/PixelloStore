"use client";

import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { Star, Truck, ShieldCheck, Camera, Upload, ArrowRight, ChevronRight, Minus, Plus, Heart, CheckCircle2, FolderPlus, FileText, Info, Eye, X, RefreshCw, ShoppingBag, Gift, Award, Maximize2, LayoutGrid, Sparkles, Image as ImageIcon, Zap, Smile, PackageCheck, Lightbulb, Droplets, Monitor, BookOpen, Home, ShieldAlert, Gem, Trash2 } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";
import { useCart } from "@/context/CartContext";
import { useWishlist } from "@/context/WishlistContext";
import { useProducts } from "@/context/ProductContext";

export interface FrameSizeConfig {
  label: string;
  name: string;
  dimensions: string;
  originalPrice: number;
  discountPct: number;
  gsm180Price: number;
  gsm260Price: number;
}

const FRAME_SIZES: FrameSizeConfig[] = [
  {
    label: "4x6 INCH",
    name: "4x6 INCH",
    dimensions: "4 x 6 Inches (10.1 x 15.2 cm)",
    originalPrice: 199,
    discountPct: 25,
    gsm180Price: 149,
    gsm260Price: 159,
  },
  {
    label: "5x7 INCH",
    name: "5x7 INCH",
    dimensions: "5 x 7 Inches (12.7 x 17.7 cm)",
    originalPrice: 249,
    discountPct: 32,
    gsm180Price: 169,
    gsm260Price: 179,
  },
  {
    label: "6x8 INCH",
    name: "6x8 INCH",
    dimensions: "6 x 8 Inches (15.2 x 20.3 cm)",
    originalPrice: 299,
    discountPct: 40,
    gsm180Price: 179,
    gsm260Price: 189,
  },
  {
    label: "A4 SIZE",
    name: "A4 SIZE (21 x 29.7 cm)",
    dimensions: "A4 Size (21.0 x 29.7 cm)",
    originalPrice: 359,
    discountPct: 45,
    gsm180Price: 199,
    gsm260Price: 229,
  },
];

export interface PolaroidSizeConfig {
  label: string;
  name: string;
  priceEach: number;
  minOrderQty: number;
  description: string;
}

const POLAROID_SIZES: PolaroidSizeConfig[] = [
  {
    label: "SMALL",
    name: "Small Polaroid",
    priceEach: 8,
    minOrderQty: 10,
    description: "Tiny prints • Min order 10 prints",
  },
  {
    label: "MEDIUM",
    name: "Medium Polaroid",
    priceEach: 15,
    minOrderQty: 12,
    description: "Classic polaroid size • Min order 12 prints",
  },
  {
    label: "LARGE",
    name: "Large Polaroid",
    priceEach: 25,
    minOrderQty: 4,
    description: "Jumbo aesthetic print • Min order 4 prints",
  },
];

export interface PandaVariantConfig {
  label: string;
  name: string;
  price: number;
  originalPrice: number;
  description: string;
}

const PANDA_VARIANTS: PandaVariantConfig[] = [
  {
    label: "STANDARD",
    name: "Moss Panda Lamp (Warm Glow)",
    price: 99,
    originalPrice: 199,
    description: "Soft warm LED glow • Battery included",
  },
  {
    label: "GIFT_BOX",
    name: "Panda Lamp + Custom Gift Wrap Box",
    price: 129,
    originalPrice: 249,
    description: "Includes gift box + Personalized message card",
  },
];

export interface TimerVariantConfig {
  label: string;
  name: string;
  price: number;
  originalPrice: number;
  description: string;
}

const TIMER_VARIANTS: TimerVariantConfig[] = [
  {
    label: "STANDARD",
    name: "Liquid Motion Timer (Blue & Green Droplets)",
    price: 299,
    originalPrice: 499,
    description: "Mesmerizing droplets • Calming desk vibes",
  },
  {
    label: "GIFT_BOX",
    name: "Liquid Timer + Custom Gift Box",
    price: 349,
    originalPrice: 599,
    description: "Includes gift box + Personalized message card",
  },
];

export interface PaperWeightVariantConfig {
  label: string;
  name: string;
  price: number;
  originalPrice: number;
  description: string;
}

const PAPER_WEIGHT_VARIANTS: PaperWeightVariantConfig[] = [
  {
    label: "STANDARD",
    name: "Forever Us Paper Weight (Standard)",
    price: 229,
    originalPrice: 399,
    description: "Crystal clear acrylic • Couple figurine with warm LED glow",
  },
  {
    label: "GIFT_BOX",
    name: "Forever Us Paper Weight + Gift Wrap Box",
    price: 269,
    originalPrice: 499,
    description: "Includes gift box + Personalized message card",
  },
];

const FRAME_COLORS = [
  { label: "Black", colorClass: "bg-black text-white", borderClass: "border-black", hex: "#000000" },
  { label: "Brown", colorClass: "bg-[#5A3A28] text-white", borderClass: "border-[#5A3A28]", hex: "#5A3A28" },
  { label: "White", colorClass: "bg-white text-[#3A2B24]", borderClass: "border-[#EFE6DD]", hex: "#FFFFFF" },
];

const GSM_OPTIONS = [
  { label: "180 GSM", name: "180 GSM Standard Matte Paper", desc: "Clean matte finish" },
  { label: "260 GSM", name: "260 GSM Premium Glossy Photo Paper", desc: "Ultra-vibrant glossy finish" },
];

const PRODUCTS_CATALOG: Record<string, {
  name: string;
  category: string;
  description: string;
  rating: number;
  reviews: number;
  images: string[];
  minOrderQty?: number;
  unitLabel?: string;
  badgeTag?: string;
}> = {
  "1": {
    name: "Premium Wooden Photo Frame",
    category: "Frames",
    description: "Frame your memories forever with Pixello's handcrafted premium photo frames. Made with high-quality MDF wood, crystal clear photo protection, and sturdy backing with dual stand & wall hook.",
    rating: 4.9,
    reviews: 184,
    images: ["/images/wooden_frame_main.png", "/images/wooden_frame_angle.png", "/images/wooden_frame_wall.png"],
    minOrderQty: 1,
    unitLabel: "Frames",
  },
  "2": {
    name: "Classic Custom Polaroid Set",
    category: "Polaroids",
    description: "Tiny prints, big memories! Transform digital photos into retro-style aesthetic polaroid prints with premium photo paper quality.",
    rating: 4.9,
    reviews: 342,
    images: ["/images/polaroid_set.png", "/images/polaroid_set.png"],
    minOrderQty: 10,
    unitLabel: "Prints",
  },
  "3": {
    name: "Custom Magic Photo Mug",
    category: "Custom Mugs",
    description: "Enjoy hot drinks with your favorite memories! High-grade ceramic mug printed with rich vibrant colors that reveal upon filling hot beverages.",
    rating: 4.7,
    reviews: 89,
    images: ["/images/custom_mug.png", "/images/custom_mug.png"],
    minOrderQty: 1,
    unitLabel: "Mugs",
  },
  "4": {
    name: "LED Acrylic Photo Lamp",
    category: "LED Frames",
    description: "Illuminate your special moments with custom laser-engraved LED acrylic lamps. Features 7 warm light modes with solid wood base.",
    rating: 4.9,
    reviews: 215,
    images: ["/images/led_acrylic_lamp.png", "/images/led_acrylic_lamp.png"],
    minOrderQty: 1,
    unitLabel: "Lamps",
  },
  "5": {
    name: "Glowing panda with hat",
    category: "Gifts",
    description: "Light up your CUTE MOMENTS! Moss Panda Lamp featuring soft warm glow, energy-efficient LED, and adorable room decor design.",
    rating: 5.0,
    reviews: 142,
    images: ["/images/led_acrylic_lamp.png", "/images/led_acrylic_lamp.png"],
    minOrderQty: 1,
    unitLabel: "Lamps",
  },
  "6": {
    name: "Liquid Timer Motion",
    category: "Gifts",
    description: "Mesmerizing drops. Calming vibes. Perfect for your desk or as a gift! Soothing liquid motion hourglass timer.",
    rating: 5.0,
    reviews: 118,
    images: ["/images/led_acrylic_lamp.png", "/images/led_acrylic_lamp.png"],
    minOrderQty: 1,
    unitLabel: "Timers",
  },
  "7": {
    name: "Forever Us Paper Weight",
    category: "Gifts",
    description: "Hold your FOREVER US PAPER WEIGHT! A keepsake that lasts forever. Beautifully crafted with crystal clear design, romantic resin figurines, and ambient LED light.",
    rating: 5.0,
    reviews: 94,
    images: ["/images/led_acrylic_lamp.png", "/images/led_acrylic_lamp.png"],
    minOrderQty: 1,
    unitLabel: "Keepsakes",
  }
};

export default function ProductDetailsPage({ params }: { params: Promise<any> }) {
  const { id } = React.use(params);
  const router = useRouter();
  const [addedToast, setAddedToast] = useState<{ size: string; quantity: number } | null>(null);

  const { cartItems, addToCart, cartCount } = useCart();
  const { toggleWishlist, isInWishlist } = useWishlist();
  const { products } = useProducts();
  const isWishlisted = isInWishlist(id);

  const cleanId = (id || "").trim().toLowerCase();
  const numId = parseInt(cleanId.replace(/\D/g, ""), 10);

  const foundFromContext = products.find((p) => {
    const pClean = (p.id || "").trim().toLowerCase();
    const pNum = parseInt(pClean.replace(/\D/g, ""), 10);

    if (pClean === cleanId) return true;
    if (!isNaN(numId) && !isNaN(pNum) && numId === pNum) return true;
    return p.name.toLowerCase() === cleanId;
  });

  const catalogKey = cleanId in PRODUCTS_CATALOG ? cleanId : (!isNaN(numId) && numId.toString() in PRODUCTS_CATALOG ? numId.toString() : null);
  const catalogEntry = catalogKey ? PRODUCTS_CATALOG[catalogKey] : null;

  const adminImages = foundFromContext?.images && foundFromContext.images.length > 0
    ? foundFromContext.images
    : (foundFromContext?.image ? [foundFromContext.image] : null);

  const adminVariants = foundFromContext?.variants;
  const [selectedAdminVariantIdx, setSelectedAdminVariantIdx] = useState<number>(0);

  const baseProduct = foundFromContext ? {
    name: foundFromContext.name,
    category: foundFromContext.category,
    description: foundFromContext.description || (foundFromContext.name.toLowerCase().includes("paper weight") || foundFromContext.name.toLowerCase().includes("paperweight") || foundFromContext.name.toLowerCase().includes("forever us")
      ? "Hold your FOREVER US PAPER WEIGHT! A keepsake that lasts forever. Beautifully crafted with crystal clear design, romantic resin figurines, and ambient LED light."
      : (foundFromContext.name.toLowerCase().includes("liquid") || foundFromContext.name.toLowerCase().includes("timer")
        ? "Mesmerizing drops. Calming vibes. Perfect for your desk or as a gift! Soothing liquid motion hourglass timer."
        : (foundFromContext.name.toLowerCase().includes("panda")
          ? "Light up your CUTE MOMENTS! Moss Panda Lamp featuring soft warm glow, energy-efficient LED, and adorable room decor design."
          : `Personalized ${foundFromContext.name} crafted with premium quality materials. Perfect for home, office & gifting.`))),
    rating: foundFromContext.rating || 5.0,
    reviews: foundFromContext.reviews || 24,
    images: adminImages || [foundFromContext.image || "/images/wooden_frame_main.png"],
    badgeTag: foundFromContext.badgeTag,
  } : (catalogEntry ? {
    ...catalogEntry,
    images: adminImages || catalogEntry.images,
  } : PRODUCTS_CATALOG["1"]);

  const isPolaroid = baseProduct.category.toLowerCase().includes("polaroid") || baseProduct.name.toLowerCase().includes("polaroid");
  const isPanda = baseProduct.name.toLowerCase().includes("panda") || baseProduct.category.toLowerCase().includes("panda") || baseProduct.name.toLowerCase().includes("glowing panda");
  const isLiquidTimer = baseProduct.name.toLowerCase().includes("liquid") || baseProduct.name.toLowerCase().includes("timer") || baseProduct.category.toLowerCase().includes("timer");
  const isPaperWeight = baseProduct.name.toLowerCase().includes("paper weight") || baseProduct.name.toLowerCase().includes("paperweight") || baseProduct.name.toLowerCase().includes("forever us");

  // Variant objects
  const activeFrameSizes = (foundFromContext?.frameSizes && foundFromContext.frameSizes.length > 0)
    ? foundFromContext.frameSizes
    : FRAME_SIZES;

  const [selectedSizeLabel, setSelectedSizeLabel] = useState<string>(() => {
    return activeFrameSizes && activeFrameSizes.length > 0 ? activeFrameSizes[0].label : "4x6 INCH";
  });

  useEffect(() => {
    if (activeFrameSizes && activeFrameSizes.length > 0) {
      const exists = activeFrameSizes.some((s) => s.label === selectedSizeLabel);
      if (!exists) {
        setSelectedSizeLabel(activeFrameSizes[0].label);
      }
    }
  }, [activeFrameSizes]);

  const [selectedPolaroidSize, setSelectedPolaroidSize] = useState<string>("SMALL");
  const [selectedPandaVariant, setSelectedPandaVariant] = useState<string>("STANDARD");
  const [selectedTimerVariant, setSelectedTimerVariant] = useState<string>("STANDARD");
  const [selectedPaperWeightVariant, setSelectedPaperWeightVariant] = useState<string>("STANDARD");
  const [selectedGsm, setSelectedGsm] = useState<"180 GSM" | "260 GSM">("180 GSM");
  const [selectedColor, setSelectedColor] = useState<string>("Black");
  const [customGiftMessage, setCustomGiftMessage] = useState<string>("");

  const activeFrameColors = (foundFromContext?.frameColors && foundFromContext.frameColors.length > 0)
    ? foundFromContext.frameColors
    : FRAME_COLORS;

  const activePolaroidSizes = (foundFromContext?.polaroidSizes && foundFromContext.polaroidSizes.length > 0)
    ? foundFromContext.polaroidSizes
    : POLAROID_SIZES;

  const currentPolaroidObj = activePolaroidSizes.find((p) => p.label === selectedPolaroidSize) || activePolaroidSizes[0];
  const currentFrameObj = (activeFrameSizes && activeFrameSizes.length > 0)
    ? (activeFrameSizes.find((s) => s.label === selectedSizeLabel) || activeFrameSizes[0])
    : FRAME_SIZES[0];
  const currentPandaObj = PANDA_VARIANTS.find((v) => v.label === selectedPandaVariant) || PANDA_VARIANTS[0];
  const currentTimerObj = TIMER_VARIANTS.find((v) => v.label === selectedTimerVariant) || TIMER_VARIANTS[0];
  const currentPaperWeightObj = PAPER_WEIGHT_VARIANTS.find((v) => v.label === selectedPaperWeightVariant) || PAPER_WEIGHT_VARIANTS[0];

  const minOrderQty = isPolaroid
    ? currentPolaroidObj.minOrderQty
    : ((isPanda || isLiquidTimer || isPaperWeight || (adminVariants && adminVariants.length > 0)) ? 1 : (baseProduct.minOrderQty || 1));

  const unitLabel = isPolaroid ? "Prints" : (isPaperWeight ? "Keepsakes" : ((isPanda || isLiquidTimer) ? "Items" : (baseProduct.unitLabel || "Items")));

  const [quantity, setQuantity] = useState<number>(minOrderQty);

  // When changing Polaroid size option, update min order quantity & current quantity
  const handleSelectPolaroidSize = (sizeLabel: string) => {
    setSelectedPolaroidSize(sizeLabel);
    const target = activePolaroidSizes.find((p) => p.label === sizeLabel) || activePolaroidSizes[0];
    setQuantity(target.minOrderQty);
  };

  const selectedAdminVariant = adminVariants && adminVariants.length > 0 ? adminVariants[selectedAdminVariantIdx] : null;

  // Unit price calculation
  const unitPrice = selectedAdminVariant
    ? selectedAdminVariant.price
    : (isPaperWeight
      ? currentPaperWeightObj.price
      : (isLiquidTimer
        ? currentTimerObj.price
        : (isPanda
          ? currentPandaObj.price
          : (isPolaroid
            ? currentPolaroidObj.priceEach
            : (selectedGsm === "180 GSM" ? (currentFrameObj?.gsm180Price || foundFromContext?.price || 149) : (currentFrameObj?.gsm260Price || foundFromContext?.price || 159))))));

  const unitOriginalPrice = selectedAdminVariant
    ? (selectedAdminVariant.originalPrice || Math.round(unitPrice * 1.4))
    : (foundFromContext?.originalPrice || (isPaperWeight
      ? currentPaperWeightObj.originalPrice
      : (isLiquidTimer
        ? currentTimerObj.originalPrice
        : (isPanda
          ? currentPandaObj.originalPrice
          : (isPolaroid ? Math.round(unitPrice * 1.5) : (currentFrameObj?.originalPrice || 199))))));

  const totalPrice = unitPrice * quantity;
  const totalOriginalPrice = unitOriginalPrice * quantity;

  // Photos Upload State
  const totalRequiredPhotos = (isPanda || isLiquidTimer || isPaperWeight) ? 0 : quantity;
  const [uploadedPhotos, setUploadedPhotos] = useState<(File | null)[]>(() => Array(totalRequiredPhotos).fill(null));
  const [uploadedPhotoDataUrls, setUploadedPhotoDataUrls] = useState<(string | null)[]>(() => Array(totalRequiredPhotos).fill(null));
  const [previewPhotoModal, setPreviewPhotoModal] = useState<{ index: number; file: File; url: string } | null>(null);

  const activeSlotRef = useRef<number>(0);
  const singleFileInputRef = useRef<HTMLInputElement>(null);
  const bulkFileInputRef = useRef<HTMLInputElement>(null);
  
  const [mainImageIndex, setMainImageIndex] = useState(0);

  // Sync photo slot length with quantity
  useEffect(() => {
    if (isPanda || isLiquidTimer || isPaperWeight) return;
    setUploadedPhotos((prev) => {
      const updated = [...prev];
      while (updated.length < totalRequiredPhotos) {
        updated.push(null);
      }
      return updated.slice(0, totalRequiredPhotos);
    });
    setUploadedPhotoDataUrls((prev) => {
      const updated = [...prev];
      while (updated.length < totalRequiredPhotos) {
        updated.push(null);
      }
      return updated.slice(0, totalRequiredPhotos);
    });
  }, [quantity, totalRequiredPhotos, isPanda, isLiquidTimer, isPaperWeight]);

  const handleSingleFileUpload = (file: File, slotIdx: number) => {
    setUploadedPhotos((prev) => {
      const nextArr = [...prev];
      nextArr[slotIdx] = file;
      return nextArr;
    });

    const reader = new FileReader();
    reader.onload = (event) => {
      const rawDataUrl = event.target?.result as string;
      if (rawDataUrl) {
        if (typeof window !== "undefined") {
          const img = document.createElement("img");
          img.onload = () => {
            const canvas = document.createElement("canvas");
            const MAX_SIZE = 800;
            let width = img.width;
            let height = img.height;
            if (width > MAX_SIZE || height > MAX_SIZE) {
              if (width > height) {
                height = Math.round((height * MAX_SIZE) / width);
                width = MAX_SIZE;
              } else {
                width = Math.round((width * MAX_SIZE) / height);
                height = MAX_SIZE;
              }
            }
            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext("2d");
            if (ctx) {
              ctx.drawImage(img, 0, 0, width, height);
              const compressedUrl = canvas.toDataURL("image/jpeg", 0.75);
              setUploadedPhotoDataUrls((prev) => {
                const nextUrls = [...prev];
                nextUrls[slotIdx] = compressedUrl;
                return nextUrls;
              });
            } else {
              setUploadedPhotoDataUrls((prev) => {
                const nextUrls = [...prev];
                nextUrls[slotIdx] = rawDataUrl;
                return nextUrls;
              });
            }
          };
          img.src = rawDataUrl;
        } else {
          setUploadedPhotoDataUrls((prev) => {
            const nextUrls = [...prev];
            nextUrls[slotIdx] = rawDataUrl;
            return nextUrls;
          });
        }
      }
    };
    reader.readAsDataURL(file);
  };

  const handleBulkUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const selectedFiles = Array.from(e.target.files);
      selectedFiles.forEach((file, i) => {
        if (i < totalRequiredPhotos) {
          handleSingleFileUpload(file, i);
        }
      });
    }
  };

  const handleClearAllPhotos = () => {
    setUploadedPhotos([]);
    setUploadedPhotoDataUrls([]);
    if (bulkFileInputRef.current) bulkFileInputRef.current.value = "";
    if (singleFileInputRef.current) singleFileInputRef.current.value = "";
  };

  const handleRemoveSinglePhoto = (slotIdx: number) => {
    setUploadedPhotos((prev) => {
      const next = [...prev];
      next[slotIdx] = null as any;
      return next;
    });
    setUploadedPhotoDataUrls((prev) => {
      const next = [...prev];
      next[slotIdx] = null as any;
      return next;
    });
  };

  const uploadedCount = uploadedPhotos.filter(Boolean).length;
  const isComplete = (isPanda || isLiquidTimer || isPaperWeight) ? true : (uploadedCount === totalRequiredPhotos);

  const product = { 
    id, 
    name: baseProduct.name, 
    category: baseProduct.category, 
    price: totalPrice, 
    originalPrice: totalOriginalPrice,
    unitPrice,
    rating: baseProduct.rating, 
    reviews: baseProduct.reviews, 
    description: baseProduct.description,
    images: baseProduct.images,
    status: (baseProduct as any).status || "In Stock",
    stock: (baseProduct as any).stock !== undefined ? (baseProduct as any).stock : 100,
  };

  return (
    <div suppressHydrationWarning className="container mx-auto px-4 md:px-6 py-8">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground mb-8">
        <Link href="/" className="hover:text-primary">Home</Link>
        <ChevronRight className="h-4 w-4" />
        <Link href="/products" className="hover:text-primary">Products</Link>
        <ChevronRight className="h-4 w-4" />
        <span className="text-foreground font-medium">{product.category}</span>
      </div>

      {/* Feature Highlights Grid */}
      {isPaperWeight ? (
        /* FOREVER US PAPER WEIGHT FEATURES GRID (From Image 1) */
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3.5 p-4 bg-[#FFF8F2] border border-[#EFE6DD] rounded-3xl mb-8 shadow-xs">
          <div className="flex items-center gap-3 p-2 bg-white rounded-2xl border border-[#EFE6DD]">
            <div className="h-10 w-10 rounded-xl bg-[#FFF8F2] border border-[#EFE6DD] flex items-center justify-center text-rose-500 flex-shrink-0">
              <Gem className="h-5 w-5" />
            </div>
            <div>
              <span className="font-bold text-xs text-[#3A2B24] uppercase tracking-wider block">Crystal Clear</span>
              <span className="text-[10px] text-[#6C5C54] block font-medium">Transparent design</span>
            </div>
          </div>

          <div className="flex items-center gap-3 p-2 bg-white rounded-2xl border border-[#EFE6DD]">
            <div className="h-10 w-10 rounded-xl bg-[#FFF8F2] border border-[#EFE6DD] flex items-center justify-center text-amber-500 flex-shrink-0">
              <Award className="h-5 w-5" />
            </div>
            <div>
              <span className="font-bold text-xs text-[#3A2B24] uppercase tracking-wider block">Premium Resin</span>
              <span className="text-[10px] text-[#6C5C54] block font-medium">Couple figurine</span>
            </div>
          </div>

          <div className="flex items-center gap-3 p-2 bg-white rounded-2xl border border-[#EFE6DD]">
            <div className="h-10 w-10 rounded-xl bg-[#FFF8F2] border border-[#EFE6DD] flex items-center justify-center text-[#D89A86] flex-shrink-0">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div>
              <span className="font-bold text-xs text-[#3A2B24] uppercase tracking-wider block">Elegant & Durable</span>
              <span className="text-[10px] text-[#6C5C54] block font-medium">Heavyweight finish</span>
            </div>
          </div>

          <div className="flex items-center gap-3 p-2 bg-white rounded-2xl border border-[#EFE6DD]">
            <div className="h-10 w-10 rounded-xl bg-[#FFF8F2] border border-[#EFE6DD] flex items-center justify-center text-pink-500 flex-shrink-0">
              <Gift className="h-5 w-5" />
            </div>
            <div>
              <span className="font-bold text-xs text-[#3A2B24] uppercase tracking-wider block">Perfect Gift</span>
              <span className="text-[10px] text-[#6C5C54] block font-medium">For couples & loved ones</span>
            </div>
          </div>

          <div className="flex items-center gap-3 p-2 bg-white rounded-2xl border border-[#EFE6DD]">
            <div className="h-10 w-10 rounded-xl bg-[#FFF8F2] border border-[#EFE6DD] flex items-center justify-center text-purple-500 flex-shrink-0">
              <Home className="h-5 w-5" />
            </div>
            <div>
              <span className="font-bold text-xs text-[#3A2B24] uppercase tracking-wider block">Desk & Paper Weight</span>
              <span className="text-[10px] text-[#6C5C54] block font-medium">Dual purpose accent</span>
            </div>
          </div>
        </div>
      ) : isLiquidTimer ? (
        /* LIQUID MOTION TIMER FEATURES GRID (From Image 2) */
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5 p-4 bg-[#FFF8F2] border border-[#EFE6DD] rounded-3xl mb-8 shadow-xs">
          <div className="flex items-center gap-3 p-2 bg-white rounded-2xl border border-[#EFE6DD]">
            <div className="h-10 w-10 rounded-xl bg-[#FFF8F2] border border-[#EFE6DD] flex items-center justify-center text-[#D89A86] flex-shrink-0">
              <Droplets className="h-5 w-5 text-sky-500" />
            </div>
            <div>
              <span className="font-bold text-xs text-[#3A2B24] uppercase tracking-wider block">Mesmerizing Motion</span>
              <span className="text-[10px] text-[#6C5C54] block font-medium">Soothing liquid droplets</span>
            </div>
          </div>

          <div className="flex items-center gap-3 p-2 bg-white rounded-2xl border border-[#EFE6DD]">
            <div className="h-10 w-10 rounded-xl bg-[#FFF8F2] border border-[#EFE6DD] flex items-center justify-center text-[#D89A86] flex-shrink-0">
              <Gift className="h-5 w-5" />
            </div>
            <div>
              <span className="font-bold text-xs text-[#3A2B24] uppercase tracking-wider block">Perfect Gift</span>
              <span className="text-[10px] text-[#6C5C54] block font-medium">For all ages</span>
            </div>
          </div>

          <div className="flex items-center gap-3 p-2 bg-white rounded-2xl border border-[#EFE6DD]">
            <div className="h-10 w-10 rounded-xl bg-[#FFF8F2] border border-[#EFE6DD] flex items-center justify-center text-[#D89A86] flex-shrink-0">
              <Home className="h-5 w-5" />
            </div>
            <div>
              <span className="font-bold text-xs text-[#3A2B24] uppercase tracking-wider block">Desk & Home Decor</span>
              <span className="text-[10px] text-[#6C5C54] block font-medium">Calming aesthetic vibes</span>
            </div>
          </div>

          <div className="flex items-center gap-3 p-2 bg-white rounded-2xl border border-[#EFE6DD]">
            <div className="h-10 w-10 rounded-xl bg-[#FFF8F2] border border-[#EFE6DD] flex items-center justify-center text-[#D89A86] flex-shrink-0">
              <Award className="h-5 w-5" />
            </div>
            <div>
              <span className="font-bold text-xs text-[#3A2B24] uppercase tracking-wider block">Durable & High Quality</span>
              <span className="text-[10px] text-[#6C5C54] block font-medium">Leak-proof acrylic</span>
            </div>
          </div>
        </div>
      ) : isPanda ? (
        /* PANDA LAMP FEATURES GRID (From Image 2) */
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5 p-4 bg-[#FFF8F2] border border-[#EFE6DD] rounded-3xl mb-8 shadow-xs">
          <div className="flex items-center gap-3 p-2 bg-white rounded-2xl border border-[#EFE6DD]">
            <div className="h-10 w-10 rounded-xl bg-[#FFF8F2] border border-[#EFE6DD] flex items-center justify-center text-[#D89A86] flex-shrink-0">
              <Lightbulb className="h-5 w-5" />
            </div>
            <div>
              <span className="font-bold text-xs text-[#3A2B24] uppercase tracking-wider block">Soft & Warm Glow</span>
              <span className="text-[10px] text-[#6C5C54] block font-medium">Eye-caring night light</span>
            </div>
          </div>

          <div className="flex items-center gap-3 p-2 bg-white rounded-2xl border border-[#EFE6DD]">
            <div className="h-10 w-10 rounded-xl bg-[#FFF8F2] border border-[#EFE6DD] flex items-center justify-center text-[#D89A86] flex-shrink-0">
              <Zap className="h-5 w-5" />
            </div>
            <div>
              <span className="font-bold text-xs text-[#3A2B24] uppercase tracking-wider block">Energy Efficient</span>
              <span className="text-[10px] text-[#6C5C54] block font-medium">Long lasting LED</span>
            </div>
          </div>

          <div className="flex items-center gap-3 p-2 bg-white rounded-2xl border border-[#EFE6DD]">
            <div className="h-10 w-10 rounded-xl bg-[#FFF8F2] border border-[#EFE6DD] flex items-center justify-center text-[#D89A86] flex-shrink-0">
              <Gift className="h-5 w-5" />
            </div>
            <div>
              <span className="font-bold text-xs text-[#3A2B24] uppercase tracking-wider block">Perfect Gift</span>
              <span className="text-[10px] text-[#6C5C54] block font-medium">For kids & loved ones</span>
            </div>
          </div>

          <div className="flex items-center gap-3 p-2 bg-white rounded-2xl border border-[#EFE6DD]">
            <div className="h-10 w-10 rounded-xl bg-[#FFF8F2] border border-[#EFE6DD] flex items-center justify-center text-[#D89A86] flex-shrink-0">
              <Smile className="h-5 w-5 text-amber-500" />
            </div>
            <div>
              <span className="font-bold text-xs text-[#3A2B24] uppercase tracking-wider block">Cute Room Decor</span>
              <span className="text-[10px] text-[#6C5C54] block font-medium">Endless cuteness</span>
            </div>
          </div>
        </div>
      ) : isPolaroid ? (
        /* POLAROID FEATURES GRID (From Image 2) */
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 p-4 bg-[#FFF8F2] border border-[#EFE6DD] rounded-3xl mb-8 shadow-xs">
          <div className="flex items-center gap-3 p-3 bg-white rounded-2xl border border-[#EFE6DD]">
            <div className="h-10 w-10 rounded-xl bg-[#FFF8F2] border border-[#EFE6DD] flex items-center justify-center text-[#D89A86] flex-shrink-0">
              <Camera className="h-5 w-5" />
            </div>
            <div>
              <span className="font-bold text-xs text-[#3A2B24] uppercase tracking-wider block">High Quality Prints</span>
              <span className="text-[10px] text-[#6C5C54] block font-medium">Vibrant colors, sharp & lasting</span>
            </div>
          </div>

          <div className="flex items-center gap-3 p-3 bg-white rounded-2xl border border-[#EFE6DD]">
            <div className="h-10 w-10 rounded-xl bg-[#FFF8F2] border border-[#EFE6DD] flex items-center justify-center text-[#D89A86] flex-shrink-0">
              <Heart className="h-5 w-5 text-rose-500 fill-rose-500" />
            </div>
            <div>
              <span className="font-bold text-xs text-[#3A2B24] uppercase tracking-wider block">Perfect for Every Memory</span>
              <span className="text-[10px] text-[#6C5C54] block font-medium">Capture moments, cherish forever</span>
            </div>
          </div>

          <div className="flex items-center gap-3 p-3 bg-white rounded-2xl border border-[#EFE6DD]">
            <div className="h-10 w-10 rounded-xl bg-[#FFF8F2] border border-[#EFE6DD] flex items-center justify-center text-[#D89A86] flex-shrink-0">
              <Gift className="h-5 w-5" />
            </div>
            <div>
              <span className="font-bold text-xs text-[#3A2B24] uppercase tracking-wider block">Gifting & Scrapbooking</span>
              <span className="text-[10px] text-[#6C5C54] block font-medium">Add personal touch to gifts</span>
            </div>
          </div>
        </div>
      ) : (
        /* FRAME FEATURES GRID (From Image 2) */
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5 p-4 bg-[#FFF8F2] border border-[#EFE6DD] rounded-3xl mb-8 shadow-xs">
          <div className="flex items-center gap-3 p-2 bg-white rounded-2xl border border-[#EFE6DD]">
            <div className="h-10 w-10 rounded-xl bg-[#FFF8F2] border border-[#EFE6DD] flex items-center justify-center text-[#D89A86] flex-shrink-0">
              <Maximize2 className="h-5 w-5" />
            </div>
            <div>
              <span className="font-bold text-xs text-[#3A2B24] uppercase tracking-wider block">PERFECT SIZE</span>
              <span className="text-[10px] text-[#6C5C54] block font-medium">Ideal for your memories</span>
            </div>
          </div>

          <div className="flex items-center gap-3 p-2 bg-white rounded-2xl border border-[#EFE6DD]">
            <div className="h-10 w-10 rounded-xl bg-[#FFF8F2] border border-[#EFE6DD] flex items-center justify-center text-[#D89A86] flex-shrink-0">
              <Award className="h-5 w-5" />
            </div>
            <div>
              <span className="font-bold text-xs text-[#3A2B24] uppercase tracking-wider block">PREMIUM QUALITY</span>
              <span className="text-[10px] text-[#6C5C54] block font-medium">Durable frame & finish</span>
            </div>
          </div>

          <div className="flex items-center gap-3 p-2 bg-white rounded-2xl border border-[#EFE6DD]">
            <div className="h-10 w-10 rounded-xl bg-[#FFF8F2] border border-[#EFE6DD] flex items-center justify-center text-[#D89A86] flex-shrink-0">
              <Gift className="h-5 w-5" />
            </div>
            <div>
              <span className="font-bold text-xs text-[#3A2B24] uppercase tracking-wider block">THOUGHTFUL GIFT</span>
              <span className="text-[10px] text-[#6C5C54] block font-medium">Perfect for loved ones</span>
            </div>
          </div>

          <div className="flex items-center gap-3 p-2 bg-white rounded-2xl border border-[#EFE6DD]">
            <div className="h-10 w-10 rounded-xl bg-[#FFF8F2] border border-[#EFE6DD] flex items-center justify-center text-[#D89A86] flex-shrink-0">
              <LayoutGrid className="h-5 w-5" />
            </div>
            <div>
              <span className="font-bold text-xs text-[#3A2B24] uppercase tracking-wider block">WALL & TABLE TOP</span>
              <span className="text-[10px] text-[#6C5C54] block font-medium">With stand & hook</span>
            </div>
          </div>
        </div>
      )}

      <div className="grid md:grid-cols-12 gap-8 md:gap-12 items-start">
        {/* Image Gallery */}
        <div className="md:col-span-5 flex flex-col gap-4 max-w-md w-full mx-auto md:mx-0">
          <div className="aspect-square max-h-[380px] md:max-h-[420px] rounded-3xl overflow-hidden bg-white border border-[#EFE6DD] relative group shadow-xs">
            <img 
              src={product.images[mainImageIndex]} 
              alt={product.name} 
              className="object-cover w-full h-full"
            />
            <Badge className="absolute top-4 left-4 bg-[#3A2B24] text-white text-[10px] font-bold px-3 py-1 rounded-full border-none shadow-xs">
              {isPaperWeight ? "ONLY AT ₹229 • BEST QUALITY ♥" : (isLiquidTimer ? "SPECIAL PRICE ₹299 ONLY ✨" : (isPanda ? "ONLY AT ₹99 ONLY ✨" : (isPolaroid ? "Tiny Prints • Big Memories" : "Special Opening Offer")))}
            </Badge>
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => {
                const added = toggleWishlist({
                  id: product.id,
                  name: product.name,
                  category: product.category,
                  price: unitPrice,
                  image: product.images[mainImageIndex]
                });
                alert(added ? `❤️ Saved "${product.name}" to your Wishlist!` : `Removed "${product.name}" from your Wishlist.`);
              }}
              className="absolute top-4 right-4 bg-white/90 hover:bg-white rounded-full backdrop-blur-sm shadow-md transition-all cursor-pointer"
            >
              <Heart className={cn("h-5 w-5 transition-colors", isWishlisted ? "fill-rose-500 text-rose-500" : "text-[#3A2B24]")} />
            </Button>
          </div>

          <div className="grid grid-cols-4 gap-3 max-w-md">
            {product.images.map((img, i) => (
              <div 
                key={i} 
                onClick={() => setMainImageIndex(i)}
                className={`aspect-square rounded-2xl overflow-hidden cursor-pointer border-2 transition-all ${mainImageIndex === i ? 'border-[#D89A86] shadow-xs scale-105' : 'border-transparent opacity-70 hover:opacity-100'}`}
              >
                <img src={img} alt="" className="object-cover w-full h-full" />
              </div>
            ))}
          </div>

          {/* About Section */}
          <div className="p-5 bg-white border border-[#EFE6DD] rounded-3xl mt-2">
            <h4 className="font-serif-brand font-bold text-base text-[#3A2B24] mb-3 flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-[#D89A86]" /> {isPaperWeight ? "ABOUT FOREVER US PAPER WEIGHT" : (isLiquidTimer ? "ABOUT LIQUID MOTION TIMER" : (isPanda ? "ABOUT MOSS PANDA LAMP" : (isPolaroid ? "ABOUT OUR POLAROIDS" : "ABOUT OUR FRAMES")))}
            </h4>
            <ul className="flex flex-col gap-2 text-xs text-[#6C5C54]">
              {isPaperWeight ? (
                <>
                  <li className="flex items-center gap-2 font-medium">
                    <CheckCircle2 className="h-4 w-4 text-rose-500 flex-shrink-0" /> Crystal clear transparent acrylic suitcase design
                  </li>
                  <li className="flex items-center gap-2 font-medium">
                    <CheckCircle2 className="h-4 w-4 text-rose-500 flex-shrink-0" /> Premium romantic couple figurine with heart detail
                  </li>
                  <li className="flex items-center gap-2 font-medium">
                    <CheckCircle2 className="h-4 w-4 text-rose-500 flex-shrink-0" /> Built-in warm fairy LED light-up glow
                  </li>
                  <li className="flex items-center gap-2 font-medium">
                    <CheckCircle2 className="h-4 w-4 text-rose-500 flex-shrink-0" /> Heavyweight paper weight & aesthetic desk decor
                  </li>
                </>
              ) : isLiquidTimer ? (
                <>
                  <li className="flex items-center gap-2 font-medium">
                    <CheckCircle2 className="h-4 w-4 text-[#D89A86] flex-shrink-0" /> Mesmerizing slow-falling colorful droplets
                  </li>
                  <li className="flex items-center gap-2 font-medium">
                    <CheckCircle2 className="h-4 w-4 text-[#D89A86] flex-shrink-0" /> Calming sensory motion & stress reliever
                  </li>
                  <li className="flex items-center gap-2 font-medium">
                    <CheckCircle2 className="h-4 w-4 text-[#D89A86] flex-shrink-0" /> Leak-proof high quality durable acrylic
                  </li>
                  <li className="flex items-center gap-2 font-medium">
                    <CheckCircle2 className="h-4 w-4 text-[#D89A86] flex-shrink-0" /> Perfect for work desk, study table & gifting
                  </li>
                </>
              ) : isPanda ? (
                <>
                  <li className="flex items-center gap-2 font-medium">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600 flex-shrink-0" /> Soft warm ambient LED glow (Eye-caring)
                  </li>
                  <li className="flex items-center gap-2 font-medium">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600 flex-shrink-0" /> Energy-efficient battery powered
                  </li>
                  <li className="flex items-center gap-2 font-medium">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600 flex-shrink-0" /> Cute green moss hat panda design
                  </li>
                  <li className="flex items-center gap-2 font-medium">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600 flex-shrink-0" /> Perfect for bedside companion, desk decor & gifting
                  </li>
                </>
              ) : isPolaroid ? (
                <>
                  <li className="flex items-center gap-2 font-medium">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600 flex-shrink-0" /> Premium high-gsm photo paper prints
                  </li>
                  <li className="flex items-center gap-2 font-medium">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600 flex-shrink-0" /> Vibrant colors, sharp details & fade resistant
                  </li>
                  <li className="flex items-center gap-2 font-medium">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600 flex-shrink-0" /> Authentic retro polaroid white borders
                  </li>
                  <li className="flex items-center gap-2 font-medium">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600 flex-shrink-0" /> Perfect for wall decor, scrapbooks & gifting
                  </li>
                </>
              ) : (
                <>
                  <li className="flex items-center gap-2 font-medium">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600 flex-shrink-0" /> High quality MDF wood frame
                  </li>
                  <li className="flex items-center gap-2 font-medium">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600 flex-shrink-0" /> Crystal clear photo protection
                  </li>
                  <li className="flex items-center gap-2 font-medium">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600 flex-shrink-0" /> Fade resistant print
                  </li>
                  <li className="flex items-center gap-2 font-medium">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600 flex-shrink-0" /> Sturdy backing with stand & hook
                  </li>
                  <li className="flex items-center gap-2 font-medium">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600 flex-shrink-0" /> Perfect for home, office & gifting
                  </li>
                </>
              )}
            </ul>
          </div>
        </div>

        {/* Product Customization */}
        <div className="md:col-span-7 flex flex-col">
          <Badge className="w-fit mb-3 bg-[#FFF8F2] text-[#D89A86] border border-[#D89A86]/20 font-bold">
            {product.category}
          </Badge>
          <h1 className="font-serif-brand text-3xl md:text-4xl font-bold tracking-tight mb-3 text-[#3A2B24]">{product.name}</h1>
          
          <div className="flex items-center gap-4 mb-4">
            <div className="flex items-center gap-1">
              {[1, 2, 3, 4, 5].map(star => (
                <Star key={star} className={`h-4 w-4 ${star <= Math.floor(product.rating) ? "fill-amber-400 text-amber-400" : "text-gray-300"}`} />
              ))}
            </div>
            <span className="text-xs font-bold text-[#3A2B24]">{product.rating} Rating</span>
            <span className="text-xs text-[#6C5C54] font-medium">({product.reviews} Customer Reviews)</span>
          </div>

          <div className="flex items-baseline flex-wrap gap-3 mb-6 bg-[#FFF8F2] p-4 rounded-2xl border border-[#EFE6DD]">
            <span className="text-4xl font-extrabold text-[#D89A86]">₹{unitPrice}</span>
            <span className="text-xs text-[#6C5C54] font-medium">per item</span>
            <span className="text-lg text-muted-foreground line-through ml-2">₹{unitOriginalPrice}</span>
            <Badge suppressHydrationWarning className="bg-[#3A2B24] text-white font-bold text-xs px-3 py-1 rounded-full border-none">
              {baseProduct.badgeTag || (isPaperWeight ? "ONLY AT ₹229 • BEST QUALITY ♥" : (isLiquidTimer ? "SPECIAL PRICE ₹299 ONLY ✨" : (isPanda ? "ONLY AT ₹99 ONLY ✨" : (isPolaroid ? `Min Order ${currentPolaroidObj.minOrderQty} Prints` : `${currentFrameObj.discountPct}% OFF OPENING OFFER`))))}
            </Badge>
          </div>

          <p className="text-[#6C5C54] mb-6 text-sm leading-relaxed">
            {product.description}
          </p>

          <Separator className="mb-6" />

          {/* VARIANTS SELECTION */}
          <div className="flex flex-col gap-6 mb-8">
            {adminVariants && adminVariants.length > 0 ? (
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-serif-brand text-xl font-bold text-[#3A2B24]">Choose {product.name} Edition</h3>
                  {baseProduct.badgeTag && (
                    <span className="text-xs text-[#D89A86] font-bold">✨ {baseProduct.badgeTag} ✨</span>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  {adminVariants.map((v, vIdx) => {
                    const isSelected = selectedAdminVariantIdx === vIdx;
                    const calcDiscountTag = v.discountTag || (v.originalPrice && v.originalPrice > v.price
                      ? `${Math.round(((v.originalPrice - v.price) / v.originalPrice) * 100)}% OFF`
                      : undefined);

                    return (
                      <div
                        key={vIdx}
                        onClick={() => setSelectedAdminVariantIdx(vIdx)}
                        className={`p-4 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between shadow-2xs ${
                          isSelected
                            ? "border-[#D89A86] bg-[#FFF8F2] ring-2 ring-[#D89A86]/40 shadow-sm"
                            : "border-[#EFE6DD] bg-white hover:bg-[#FFF8F2]/60"
                        }`}
                      >
                        <div>
                          <div className="flex items-center justify-between mb-1">
                            <span className="font-extrabold text-xs text-[#3A2B24] uppercase tracking-wider">{v.name}</span>
                            {calcDiscountTag && (
                              <span suppressHydrationWarning className="text-[9px] font-bold bg-[#3A2B24] text-white px-2 py-0.5 rounded-full">
                                {calcDiscountTag}
                              </span>
                            )}
                          </div>
                          <p suppressHydrationWarning className="text-2xl font-extrabold text-[#D89A86] mt-1">₹{v.price}/-</p>
                          {v.description && (
                            <p className="text-[11px] text-[#6C5C54] mt-1 font-medium">{v.description}</p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : isPaperWeight ? (
              /* FOREVER US PAPER WEIGHT OFFER VARIANT CARDS (From Image 1) */
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-serif-brand text-xl font-bold text-[#3A2B24]">Choose Paper Weight Edition</h3>
                  <span className="text-xs text-[#D89A86] font-bold">✨ ONLY AT ₹229 • BEST QUALITY ✨</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  {PAPER_WEIGHT_VARIANTS.map((v) => {
                    const isSelected = v.label === selectedPaperWeightVariant;
                    return (
                      <div
                        key={v.label}
                        onClick={() => setSelectedPaperWeightVariant(v.label)}
                        className={`p-4 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between shadow-2xs ${
                          isSelected
                            ? "border-[#D89A86] bg-[#FFF8F2] ring-2 ring-[#D89A86]/40 shadow-sm"
                            : "border-[#EFE6DD] bg-white hover:bg-[#FFF8F2]/60"
                        }`}
                      >
                        <div>
                          <div className="flex items-center justify-between mb-1">
                            <span className="font-extrabold text-xs text-[#3A2B24] uppercase tracking-wider">{v.name}</span>
                            <span className="text-[9px] font-bold bg-[#3A2B24] text-white px-2 py-0.5 rounded-full">
                              42% OFF
                            </span>
                          </div>
                          <p suppressHydrationWarning className="text-2xl font-extrabold text-[#D89A86] mt-1">₹{v.price}/-</p>
                          <p className="text-[11px] text-[#6C5C54] mt-1 font-medium">{v.description}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Optional Custom Gift Card Message */}
                <div className="mt-4">
                  <label className="text-xs font-bold text-[#3A2B24] mb-1.5 flex items-center justify-between">
                    <span>Add Optional Gift Message Card (Free):</span>
                    <span className="text-[10px] text-[#D89A86]">Optional</span>
                  </label>
                  <Input 
                    placeholder="Enter gift message (e.g. Forever Us! With Love ❤️)"
                    value={customGiftMessage}
                    onChange={(e) => setCustomGiftMessage(e.target.value)}
                    className="rounded-xl border-[#EFE6DD] bg-white text-xs font-medium"
                  />
                </div>
              </div>
            ) : isLiquidTimer ? (
              /* LIQUID MOTION TIMER OFFER VARIANT CARDS (From Image 2) */
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-serif-brand text-xl font-bold text-[#3A2B24]">Choose Liquid Motion Edition</h3>
                  <span className="text-xs text-[#D89A86] font-bold">✨ SPECIAL PRICE ₹299 ONLY ✨</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  {TIMER_VARIANTS.map((v) => {
                    const isSelected = v.label === selectedTimerVariant;
                    return (
                      <div
                        key={v.label}
                        onClick={() => setSelectedTimerVariant(v.label)}
                        className={`p-4 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between shadow-2xs ${
                          isSelected
                            ? "border-[#D89A86] bg-[#FFF8F2] ring-2 ring-[#D89A86]/40 shadow-sm"
                            : "border-[#EFE6DD] bg-white hover:bg-[#FFF8F2]/60"
                        }`}
                      >
                        <div>
                          <div className="flex items-center justify-between mb-1">
                            <span className="font-extrabold text-xs text-[#3A2B24] uppercase tracking-wider">{v.name}</span>
                            <span className="text-[9px] font-bold bg-[#3A2B24] text-white px-2 py-0.5 rounded-full">
                              40% OFF
                            </span>
                          </div>
                          <p suppressHydrationWarning className="text-2xl font-extrabold text-[#D89A86] mt-1">₹{v.price}/-</p>
                          <p className="text-[11px] text-[#6C5C54] mt-1 font-medium">{v.description}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Perfect For Section (From Image 2) */}
                <div className="mt-5 p-4 bg-white border border-[#EFE6DD] rounded-2xl">
                  <label className="text-xs font-bold text-[#3A2B24] mb-3 block uppercase tracking-wider">
                    ♥ Perfect For ♥
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
                    <div className="p-2 bg-[#FFF8F2] rounded-xl border border-[#EFE6DD]">
                      <Monitor className="h-5 w-5 mx-auto text-[#D89A86] mb-1" />
                      <span className="text-[11px] font-bold text-[#3A2B24]">Work Desk</span>
                    </div>
                    <div className="p-2 bg-[#FFF8F2] rounded-xl border border-[#EFE6DD]">
                      <BookOpen className="h-5 w-5 mx-auto text-[#D89A86] mb-1" />
                      <span className="text-[11px] font-bold text-[#3A2B24]">Study Table</span>
                    </div>
                    <div className="p-2 bg-[#FFF8F2] rounded-xl border border-[#EFE6DD]">
                      <Home className="h-5 w-5 mx-auto text-[#D89A86] mb-1" />
                      <span className="text-[11px] font-bold text-[#3A2B24]">Home Decor</span>
                    </div>
                    <div className="p-2 bg-[#FFF8F2] rounded-xl border border-[#EFE6DD]">
                      <Gift className="h-5 w-5 mx-auto text-[#D89A86] mb-1" />
                      <span className="text-[11px] font-bold text-[#3A2B24]">Gifting</span>
                    </div>
                  </div>
                </div>

                {/* Optional Custom Gift Card Message */}
                <div className="mt-4">
                  <label className="text-xs font-bold text-[#3A2B24] mb-1.5 flex items-center justify-between">
                    <span>Add Optional Gift Message Card (Free):</span>
                    <span className="text-[10px] text-[#D89A86]">Optional</span>
                  </label>
                  <Input 
                    placeholder="Enter gift message (e.g. For your work desk! With Love ❤️)"
                    value={customGiftMessage}
                    onChange={(e) => setCustomGiftMessage(e.target.value)}
                    className="rounded-xl border-[#EFE6DD] bg-white text-xs font-medium"
                  />
                </div>
              </div>
            ) : isPanda ? (
              /* PANDA LAMP OFFER VARIANT CARDS (From Image 2) */
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-serif-brand text-xl font-bold text-[#3A2B24]">Choose Lamp Edition</h3>
                  <span className="text-xs text-[#D89A86] font-bold">✨ ONLY AT ₹99 ONLY ✨</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  {PANDA_VARIANTS.map((v) => {
                    const isSelected = v.label === selectedPandaVariant;
                    return (
                      <div
                        key={v.label}
                        onClick={() => setSelectedPandaVariant(v.label)}
                        className={`p-4 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between shadow-2xs ${
                          isSelected
                            ? "border-[#D89A86] bg-[#FFF8F2] ring-2 ring-[#D89A86]/40 shadow-sm"
                            : "border-[#EFE6DD] bg-white hover:bg-[#FFF8F2]/60"
                        }`}
                      >
                        <div>
                          <div className="flex items-center justify-between mb-1">
                            <span className="font-extrabold text-xs text-[#3A2B24] uppercase tracking-wider">{v.name}</span>
                            <span className="text-[9px] font-bold bg-[#3A2B24] text-white px-2 py-0.5 rounded-full">
                              50% OFF
                            </span>
                          </div>
                          <p suppressHydrationWarning className="text-2xl font-extrabold text-[#D89A86] mt-1">₹{v.price}/-</p>
                          <p className="text-[11px] text-[#6C5C54] mt-1 font-medium">{v.description}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Optional Custom Gift Card Message */}
                <div className="mt-4">
                  <label className="text-xs font-bold text-[#3A2B24] mb-1.5 flex items-center justify-between">
                    <span>Add Optional Gift Message Card (Free):</span>
                    <span className="text-[10px] text-[#D89A86]">Optional</span>
                  </label>
                  <Input 
                    placeholder="Enter gift message (e.g. Happy Birthday! With Love ❤️)"
                    value={customGiftMessage}
                    onChange={(e) => setCustomGiftMessage(e.target.value)}
                    className="rounded-xl border-[#EFE6DD] bg-white text-xs font-medium"
                  />
                </div>
              </div>
            ) : isPolaroid ? (
              /* OUR POLAROID PRICES (From Image 2) */
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-serif-brand text-xl font-bold text-[#3A2B24]">Our Polaroid Prices</h3>
                  <span className="text-xs text-[#D89A86] font-bold">Tiny Prints • Big Memories</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                  {activePolaroidSizes.map((p) => {
                    const isSelected = p.label === selectedPolaroidSize;
                    const minPriceTotal = p.priceEach * p.minOrderQty;
                    return (
                      <div
                        key={p.label}
                        onClick={() => handleSelectPolaroidSize(p.label)}
                        className={`p-4 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between shadow-2xs ${
                          isSelected
                            ? "border-[#D89A86] bg-[#FFF8F2] ring-2 ring-[#D89A86]/40 shadow-sm"
                            : "border-[#EFE6DD] bg-white hover:bg-[#FFF8F2]/60"
                        }`}
                      >
                        <div>
                          <div className="flex items-center justify-between mb-1">
                            <span className="font-extrabold text-sm text-[#3A2B24] uppercase tracking-wider">{p.label}</span>
                            <span className="text-[10px] font-bold bg-[#D89A86] text-white px-2 py-0.5 rounded-full">
                              Min {p.minOrderQty}
                            </span>
                          </div>
                          <p suppressHydrationWarning className="text-2xl font-extrabold text-[#D89A86] mt-1">
                            ₹{p.priceEach} <span className="text-xs font-semibold text-[#6C5C54]">EACH</span>
                          </p>
                          <p className="text-[11px] text-[#6C5C54] mt-1 font-medium">{p.description}</p>
                        </div>

                        <div className="mt-3 pt-2.5 border-t border-[#EFE6DD] text-xs font-bold text-[#3A2B24] flex justify-between">
                          <span>Min Order Total:</span>
                          <span className="text-[#D89A86]">₹{minPriceTotal} ({p.minOrderQty} prints)</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              /* CHOOSE YOUR FRAME SIZES (From Image 2) */
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-serif-brand text-xl font-bold text-[#3A2B24]">Choose Your Frame Size</h3>
                  <span className="text-xs text-[#D89A86] font-bold">Special Opening Prices</span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {activeFrameSizes.map((s) => {
                    const isSelected = s.label === selectedSizeLabel;
                    const curPrice = selectedGsm === "180 GSM" ? s.gsm180Price : s.gsm260Price;
                    const discount = s.discountPct || (s.originalPrice ? Math.round(((s.originalPrice - s.gsm180Price) / s.originalPrice) * 100) : 25);
                    return (
                      <div
                        key={s.label}
                        onClick={() => setSelectedSizeLabel(s.label)}
                        className={`p-3 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between ${
                          isSelected
                            ? "border-[#D89A86] bg-[#FFF8F2] ring-2 ring-[#D89A86]/40 shadow-sm"
                            : "border-[#EFE6DD] bg-white hover:bg-[#FFF8F2]/60"
                        }`}
                      >
                        <div>
                          <div className="flex items-center justify-between mb-1">
                            <span className="font-extrabold text-xs text-[#3A2B24]">{s.label}</span>
                            <span suppressHydrationWarning className="text-[9px] font-bold bg-[#3A2B24] text-white px-1.5 py-0.5 rounded-md">
                              {discount}% OFF
                            </span>
                          </div>
                          {s.dimensions && (
                            <p className="text-[10px] text-[#6C5C54] font-medium leading-tight my-0.5">{s.dimensions}</p>
                          )}
                          <p className="text-[10px] text-[#6C5C54] font-medium line-through">₹{s.originalPrice}/-</p>
                          <p className="text-base font-extrabold text-[#D89A86] mt-0.5">₹{curPrice}/-</p>
                        </div>

                        <div className="mt-2 pt-2 border-t border-[#EFE6DD]/80 text-[10px] flex justify-between font-semibold">
                          <span className={selectedGsm === "180 GSM" ? "text-[#D89A86] font-bold" : "text-[#6C5C54]"}>180G: ₹{s.gsm180Price}</span>
                          <span className={selectedGsm === "260 GSM" ? "text-[#D89A86] font-bold" : "text-[#6C5C54]"}>260G: ₹{s.gsm260Price}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {currentFrameObj && currentFrameObj.dimensions && (
                  <div className="mt-3 p-3 bg-[#FFF8F2] border border-[#EFE6DD] rounded-xl flex items-center gap-2 text-xs text-[#3A2B24]">
                    <Sparkles className="h-4 w-4 text-[#D89A86] flex-shrink-0" />
                    <span className="font-medium">Selected Size Details: <strong className="font-bold text-[#D89A86]">{currentFrameObj.dimensions}</strong></span>
                  </div>
                )}
              </div>
            )}

            {/* GSM & COLOR OPTIONS ONLY FOR FRAMES */}
            {!isPolaroid && !isPanda && !isLiquidTimer && !isPaperWeight && (
              <>
                <div>
                  <label className="text-xs font-bold text-[#3A2B24] mb-2 block uppercase tracking-wider">
                    Select Print Paper Quality (GSM)
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    {GSM_OPTIONS.map((g) => {
                      const isSelected = selectedGsm === g.label;
                      return (
                        <button
                          key={g.label}
                          type="button"
                          onClick={() => setSelectedGsm(g.label as any)}
                          className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                            isSelected
                              ? "border-[#D89A86] bg-[#FFF8F2] ring-1 ring-[#D89A86]"
                              : "border-[#EFE6DD] bg-white hover:bg-[#FFF8F2]/50"
                          }`}
                        >
                          <span className="font-bold text-xs text-[#3A2B24] block">{g.name}</span>
                          <span className="text-[10px] text-[#6C5C54] mt-0.5 block">{g.desc}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-[#3A2B24] mb-2 block uppercase tracking-wider">
                    Available Frame Colors
                  </label>
                  <div className="flex items-center gap-3">
                    {activeFrameColors.map((c) => {
                      const isSelected = selectedColor === c.label;
                      return (
                        <button
                          key={c.label}
                          type="button"
                          onClick={() => setSelectedColor(c.label)}
                          className={`px-4 py-2 rounded-2xl border text-xs font-bold flex items-center gap-2 transition-all cursor-pointer ${
                            isSelected
                              ? "border-[#D89A86] bg-[#3A2B24] text-white shadow-xs"
                              : "border-[#EFE6DD] bg-white text-[#3A2B24] hover:bg-[#FFF8F2]"
                          }`}
                        >
                          <span className={`h-3.5 w-3.5 rounded-full border border-gray-400`} style={{ backgroundColor: c.hex }} />
                          <span>{c.label} Frame</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </>
            )}

            {/* Photo Upload Section (NOT required for Panda Lamp, Liquid Timer, or Paper Weight) */}
            {!isPanda && !isLiquidTimer && !isPaperWeight && (
              <div>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-3 gap-2">
                  <h3 className="font-semibold text-sm text-[#3A2B24]">
                    Upload Photos for <span className="text-[#D89A86] font-bold">{isPolaroid ? `${selectedPolaroidSize} Polaroid` : selectedSizeLabel}</span> ({uploadedCount}/{totalRequiredPhotos} Uploaded)
                  </h3>
                </div>

                {/* Upload Progress Bar */}
                <div className="w-full bg-[#FFF8F2] border border-[#EFE6DD] rounded-full h-2.5 mb-4 overflow-hidden">
                  <div 
                    className="bg-[#D89A86] h-full transition-all duration-300 rounded-full" 
                    style={{ width: `${(uploadedCount / totalRequiredPhotos) * 100}%` }} 
                  />
                </div>

                <input 
                  type="file" 
                  ref={bulkFileInputRef} 
                  onChange={handleBulkUpload} 
                  accept="image/*" 
                  multiple
                  className="hidden" 
                />
                <input 
                  type="file" 
                  ref={singleFileInputRef} 
                  onChange={(e) => {
                    if (e.target.files && e.target.files.length > 0) {
                      const file = e.target.files[0];
                      const slotIdx = activeSlotRef.current;
                      handleSingleFileUpload(file, slotIdx);
                    }
                  }} 
                  accept="image/*" 
                  className="hidden" 
                />

                <div className="flex flex-col sm:flex-row items-center gap-2 mb-4">
                  <Button 
                    onClick={() => bulkFileInputRef.current?.click()}
                    variant="outline" 
                    className="flex-1 h-11 rounded-2xl border border-[#D89A86] bg-[#FFF8F2] text-[#3A2B24] font-semibold hover:bg-[#F2C8B5]/20 flex items-center justify-center gap-2 cursor-pointer text-xs"
                  >
                    <FolderPlus className="h-4 w-4 text-[#D89A86]" /> 
                    Upload All {totalRequiredPhotos} Photos at Once
                  </Button>

                  {uploadedCount > 0 && (
                    <Button 
                      onClick={handleClearAllPhotos}
                      variant="outline" 
                      className="h-11 px-4 rounded-2xl border-rose-200 bg-rose-50 text-rose-700 font-bold hover:bg-rose-100 flex items-center justify-center gap-1.5 cursor-pointer text-xs transition-colors shadow-2xs whitespace-nowrap"
                    >
                      <Trash2 className="h-4 w-4 text-rose-600" />
                      Remove All Uploaded Pics
                    </Button>
                  )}
                </div>

                {/* Photo Slots Grid */}
                <div className={cn(
                  "grid gap-3 max-h-80 overflow-y-auto pr-1",
                  totalRequiredPhotos > 6 ? "grid-cols-2 sm:grid-cols-3" : "grid-cols-1"
                )}>
                  {Array.from({ length: totalRequiredPhotos }).map((_, slotIdx) => {
                    const file = uploadedPhotos[slotIdx];
                    const previewUrl = file ? URL.createObjectURL(file) : null;

                    return (
                      <div 
                        key={slotIdx}
                        onClick={() => {
                          if (file && previewUrl) {
                            setPreviewPhotoModal({ index: slotIdx, file, url: previewUrl });
                          } else {
                            activeSlotRef.current = slotIdx;
                            singleFileInputRef.current?.click();
                          }
                        }}
                        className={cn(
                          "border rounded-2xl p-3 flex items-center justify-between cursor-pointer transition-all shadow-xs group",
                          file ? "border-emerald-500 bg-emerald-50/90 hover:bg-emerald-100/90" : "border-dashed bg-white border-[#EFE6DD] hover:border-[#D89A86]"
                        )}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          {file && previewUrl ? (
                            <div className="h-10 w-10 rounded-xl overflow-hidden bg-white border border-emerald-300 flex-shrink-0 relative group-hover:scale-105 transition-transform shadow-xs">
                              <img src={previewUrl} alt={file.name} className="h-full w-full object-cover" />
                            </div>
                          ) : (
                            <div className="h-8 w-8 rounded-full bg-[#FFF8F2] text-[#D89A86] flex items-center justify-center font-bold text-xs flex-shrink-0">
                              #{slotIdx + 1}
                            </div>
                          )}

                          <div className="truncate flex-1 pr-2">
                            {file ? (
                              <div>
                                <p className="font-bold text-xs text-emerald-950 truncate flex items-center gap-1">
                                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 flex-shrink-0" /> Photo #{slotIdx + 1}
                                </p>
                                <p className="text-[11px] text-emerald-800 font-medium truncate">{file.name}</p>
                              </div>
                            ) : (
                              <div>
                                <p className="font-semibold text-xs text-[#3A2B24] truncate">Photo #{slotIdx + 1}</p>
                                <p className="text-[10px] text-[#6C5C54] truncate">Click to select photo</p>
                              </div>
                            )}
                          </div>
                        </div>

                        {file ? (
                          <button
                            type="button"
                            title="Remove this photo"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleRemoveSinglePhoto(slotIdx);
                            }}
                            className="h-7 w-7 rounded-full bg-rose-100 hover:bg-rose-200 text-rose-700 flex items-center justify-center transition-colors cursor-pointer border border-rose-300 shadow-2xs flex-shrink-0"
                          >
                            <X className="h-3.5 w-3.5" />
                          </button>
                        ) : (
                          <span className="text-[10px] font-bold text-[#D89A86] bg-[#FFF8F2] px-2 py-0.5 rounded-full border border-[#D89A86]/20 flex-shrink-0">
                            + Upload
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Quantity Selector & Total Price Card */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-base text-[#3A2B24]">Quantity ({unitLabel})</h3>
                {minOrderQty > 1 && (
                  <Badge className="bg-[#FFF8F2] text-[#D89A86] border border-[#D89A86]/30 text-xs px-3 py-1 font-semibold flex items-center gap-1">
                    <Info className="h-3.5 w-3.5" /> Minimum Order: {minOrderQty} {unitLabel}
                  </Badge>
                )}
              </div>

              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                <div className="flex items-center border border-[#EFE6DD] bg-white rounded-full p-1 shadow-xs">
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="rounded-full h-8 w-8 text-[#3A2B24]"
                    onClick={() => {
                      if (quantity <= minOrderQty) {
                        alert(`Minimum order quantity for ${product.name} is ${minOrderQty} ${unitLabel}.`);
                        return;
                      }
                      setQuantity(quantity - 1);
                    }}
                  >
                    <Minus className="h-4 w-4" />
                  </Button>
                  <span className="w-12 text-center font-bold text-[#3A2B24] text-base">{quantity}</span>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="rounded-full h-8 w-8 text-[#3A2B24]"
                    onClick={() => setQuantity(quantity + 1)}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* Total Amount Card */}
              <div className="mt-4 p-4 rounded-2xl bg-white border border-[#EFE6DD] flex items-center justify-between shadow-xs max-w-md">
                <span className="text-xs font-medium text-[#6C5C54]">
                  Total ({isPaperWeight ? currentPaperWeightObj.name : (isLiquidTimer ? currentTimerObj.name : (isPanda ? currentPandaObj.name : (isPolaroid ? `${selectedPolaroidSize} Polaroid` : `${selectedSizeLabel} • ${selectedGsm}`)))})
                </span>
                <div className="flex items-baseline gap-2">
                  <span suppressHydrationWarning className="text-2xl font-bold text-[#D89A86]">₹{totalPrice}</span>
                  <span suppressHydrationWarning className="text-xs text-[#6C5C54] bg-[#FFF8F2] px-2 py-0.5 rounded-md border border-[#D89A86]/20">
                    (₹{unitPrice} × {quantity})
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Success Banner */}
          {addedToast && (
            <div className="mb-4 p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 flex flex-col sm:flex-row items-center justify-between gap-3 animate-in fade-in">
              <div className="flex items-center gap-2.5">
                <CheckCircle2 className="h-5 w-5 text-emerald-600 flex-shrink-0" />
                <span className="text-sm font-medium">
                  Added <strong>{addedToast.size}</strong> to your cart!
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Link href="/cart">
                  <Button size="sm" className="rounded-full bg-emerald-700 hover:bg-emerald-800 text-white text-xs">
                    View Cart ({cartCount}) →
                  </Button>
                </Link>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            {product.status === "Out of Stock" || (product.stock !== undefined && product.stock <= 0) ? (
              <Button 
                size="lg" 
                disabled
                className="flex-1 h-14 text-base font-extrabold rounded-2xl bg-gray-400 text-white cursor-not-allowed uppercase tracking-wider shadow-none border-none"
              >
                OUT OF STOCK
              </Button>
            ) : (
              <Button 
                size="lg" 
                className="flex-1 h-14 text-lg rounded-full btn-pixello-primary cursor-pointer"
                onClick={() => {
                  if (!isComplete) {
                    alert(`Please upload all ${totalRequiredPhotos} photo(s) before adding to cart! (${uploadedCount}/${totalRequiredPhotos} uploaded)`);
                    return;
                  }
                  const chosenSize = isPaperWeight
                    ? `${currentPaperWeightObj.name}`
                    : (isLiquidTimer
                      ? `${currentTimerObj.name}`
                      : (isPanda
                        ? `${currentPandaObj.name}`
                        : (isPolaroid ? `${selectedPolaroidSize} Polaroid (${quantity} Prints)` : `${selectedSizeLabel} (${selectedGsm}, ${selectedColor} Frame)`)));

                  const validPhotoDataUrls = uploadedPhotoDataUrls.filter(Boolean) as string[];
                  const primaryImage = validPhotoDataUrls.length > 0
                    ? validPhotoDataUrls[0]
                    : (uploadedPhotos[0] ? URL.createObjectURL(uploadedPhotos[0]) : product.images[mainImageIndex]);

                  addToCart({
                    id: `custom-${id}-${selectedPaperWeightVariant}-${selectedTimerVariant}-${selectedPandaVariant}-${selectedPolaroidSize}-${selectedSizeLabel}-${Date.now()}`,
                    name: product.name,
                    size: customGiftMessage ? `${chosenSize} [Message: ${customGiftMessage}]` : chosenSize,
                    price: unitPrice,
                    quantity: quantity,
                    image: primaryImage,
                    photos: (isPanda || isLiquidTimer || isPaperWeight) ? [] : (validPhotoDataUrls.length > 0 ? validPhotoDataUrls : [primaryImage])
                  });
                  setAddedToast({ size: chosenSize, quantity: 1 });
                }}
              >
                Add to Cart
              </Button>
            )}
            <Button 
              size="lg" 
              variant="secondary" 
              className="flex-1 h-14 text-lg rounded-full bg-[#3A2B24] text-white hover:bg-[#544036] cursor-pointer"
              onClick={() => {
                if (!isComplete) {
                  alert(`Please upload all ${totalRequiredPhotos} photo(s) before checkout! (${uploadedCount}/${totalRequiredPhotos} uploaded)`);
                  return;
                }
                const chosenSize = isPaperWeight
                  ? `${currentPaperWeightObj.name}`
                  : (isLiquidTimer
                    ? `${currentTimerObj.name}`
                    : (isPanda
                      ? `${currentPandaObj.name}`
                      : (isPolaroid ? `${selectedPolaroidSize} Polaroid (${quantity} Prints)` : `${selectedSizeLabel} (${selectedGsm}, ${selectedColor} Frame)`)));

                const validPhotoDataUrls = uploadedPhotoDataUrls.filter(Boolean) as string[];
                const primaryImage = validPhotoDataUrls.length > 0
                  ? validPhotoDataUrls[0]
                  : (uploadedPhotos[0] ? URL.createObjectURL(uploadedPhotos[0]) : product.images[mainImageIndex]);

                addToCart({
                  id: `custom-${id}-${selectedPaperWeightVariant}-${selectedTimerVariant}-${selectedPandaVariant}-${selectedPolaroidSize}-${selectedSizeLabel}-${Date.now()}`,
                  name: product.name,
                  size: customGiftMessage ? `${chosenSize} [Message: ${customGiftMessage}]` : chosenSize,
                  price: unitPrice,
                  quantity: quantity,
                  image: primaryImage,
                  photos: (isPanda || isLiquidTimer || isPaperWeight) ? [] : (validPhotoDataUrls.length > 0 ? validPhotoDataUrls : [primaryImage])
                });
                router.push("/checkout");
              }}
            >
              Buy Now
            </Button>
          </div>

          {/* Contact Banner */}
          <div className="p-4 bg-[#3A2B24] text-[#EFE6DD] rounded-3xl flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left">
            <div>
              <p className="text-xs text-[#F2C8B5] font-bold uppercase tracking-wider">Pixello Store • {isPaperWeight ? "Hold Your FOREVER US Keepsake!" : (isLiquidTimer ? "Mesmerizing Drops • Calming Vibes" : (isPanda ? "Light Up Your CUTE MOMENTS!" : (isPolaroid ? "Tiny Prints, Big Memories" : "Thoughtfully Yours")))}</p>
              <p className="text-[11px] text-[#EFE6DD] mt-0.5">{isPaperWeight ? "A keepsake that lasts forever • Beautifully crafted" : (isLiquidTimer ? "Perfect for your desk or as a gift!" : (isPanda ? "Soft glow • Warm vibes • Endless cuteness" : (isPolaroid ? "Tiny prints • Timeless memories" : "Frames that speak your heart • Memories that last forever")))}</p>
            </div>
            <div className="flex items-center gap-3 text-xs font-semibold">
              <span>📱 7989856610 / 8074589949</span>
              <span>📸 pixellostore</span>
            </div>
          </div>

        </div>
      </div>

      {/* Pop-Up Photo Preview Modal */}
      {previewPhotoModal && (
        <div 
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in"
          onClick={() => setPreviewPhotoModal(null)}
        >
          <div 
            className="bg-white border border-[#EFE6DD] rounded-3xl p-6 max-w-lg w-full shadow-2xl relative flex flex-col items-center text-center animate-in zoom-in-95"
            onClick={(e) => e.stopPropagation()}
          >
            <button 
              onClick={() => setPreviewPhotoModal(null)}
              className="absolute top-4 right-4 h-9 w-9 rounded-full bg-[#FFF8F2] hover:bg-[#F2C8B5]/30 text-[#3A2B24] flex items-center justify-center font-bold text-base transition-colors cursor-pointer"
            >
              ✕
            </button>

            <Badge className="bg-[#FFF8F2] text-[#D89A86] border border-[#D89A86]/30 mb-3 px-3.5 py-1 rounded-full text-xs font-bold">
              Photo #{previewPhotoModal.index + 1} High-Res Preview
            </Badge>

            <h3 className="font-serif-brand text-xl font-bold text-[#3A2B24] mb-1 truncate max-w-[85%]">
              {previewPhotoModal.file.name}
            </h3>
            <p className="text-xs text-[#6C5C54] mb-4 font-medium">
              Ready for master studio printing ({Math.round(previewPhotoModal.file.size / 1024)} KB)
            </p>

            <div className="w-full aspect-square max-h-80 rounded-2xl overflow-hidden bg-[#FFF8F2] border-4 border-[#3A2B24] shadow-lg relative mb-6">
              <img 
                src={previewPhotoModal.url} 
                alt={previewPhotoModal.file.name} 
                className="w-full h-full object-contain p-2" 
              />
            </div>

            <div className="flex gap-3 w-full">
              <Button 
                variant="outline" 
                className="flex-1 rounded-full border-[#EFE6DD] text-xs font-semibold hover:bg-[#FFF8F2]"
                onClick={() => {
                  activeSlotRef.current = previewPhotoModal.index;
                  setPreviewPhotoModal(null);
                  singleFileInputRef.current?.click();
                }}
              >
                <RefreshCw className="h-3.5 w-3.5 mr-1.5 text-[#D89A86]" /> Replace Photo
              </Button>
              <Button 
                variant="secondary" 
                className="flex-1 rounded-full bg-[#3A2B24] text-white hover:bg-[#544036] text-xs font-semibold"
                onClick={() => setPreviewPhotoModal(null)}
              >
                Close Preview
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
