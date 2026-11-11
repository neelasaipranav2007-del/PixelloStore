"use client";

import React, { useState, useMemo, useRef, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Upload,
  Heart,
  ZoomIn,
  ZoomOut,
  RotateCw,
  ShoppingBag,
  ArrowRight,
  ShieldCheck,
  Layers,
  Maximize2,
  Info,
  CheckCircle2,
  ChevronRight,
  Sliders,
  Sparkles,
  Award,
  Gift,
  LayoutGrid,
  Check,
  Star,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { useProducts, Product } from "@/context/ProductContext";
import { useCart } from "@/context/CartContext";
import { useWishlist } from "@/context/WishlistContext";
import { cn } from "@/lib/utils";
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

export interface FrameVariantConfig {
  label: string;
  name: string;
  dimensions: string;
  cmDimensions: string;
  aspectRatio: number;
  originalPrice: number;
  discountPct: number;
  gsm180Price: number;
  gsm260Price: number;
  price?: number;
}

export const FRAME_SIZES: FrameVariantConfig[] = [
  {
    label: "4x6 INCH",
    name: "4x6 Inches",
    dimensions: "4 x 6 Inches",
    cmDimensions: "10.1 x 15.2 cm",
    aspectRatio: 4 / 6,
    originalPrice: 199,
    discountPct: 25,
    gsm180Price: 149,
    gsm260Price: 159,
  },
  {
    label: "5x7 INCH",
    name: "5x7 Inches",
    dimensions: "5 x 7 Inches",
    cmDimensions: "12.7 x 17.7 cm",
    aspectRatio: 5 / 7,
    originalPrice: 249,
    discountPct: 32,
    gsm180Price: 169,
    gsm260Price: 179,
  },
  {
    label: "6x8 INCH",
    name: "6x8 Inches",
    dimensions: "6 x 8 Inches",
    cmDimensions: "15.2 x 20.3 cm",
    aspectRatio: 6 / 8,
    originalPrice: 299,
    discountPct: 40,
    gsm180Price: 179,
    gsm260Price: 189,
  },
  {
    label: "A4 SIZE",
    name: "A4 Inches",
    dimensions: "8.3 x 11.7 Inches",
    cmDimensions: "21.0 x 29.7 cm",
    aspectRatio: 1 / 1.414,
    originalPrice: 359,
    discountPct: 45,
    gsm180Price: 199,
    gsm260Price: 229,
  },
];

export type FrameColorOption = FrameWoodColorConfig;

export const FRAME_COLORS: FrameWoodColorConfig[] = DEFAULT_FRAME_WOOD_COLORS;

interface VisualMemoryFrameStudioProps {
  productId?: string;
  initialProduct?: any;
}

export default function VisualMemoryFrameStudio({
  productId = "PRD-01",
  initialProduct,
}: VisualMemoryFrameStudioProps) {
  const router = useRouter();
  const { products } = useProducts();
  const { addToCart } = useCart();
  const { toggleWishlist, isInWishlist } = useWishlist();

  // Find all available frame products from catalog for the model selector
  const frameProducts = useMemo(() => {
    const list = products.filter(
      (p) =>
        p.category?.toLowerCase().includes("frame") ||
        p.name?.toLowerCase().includes("frame")
    );
    if (list.length === 0 && initialProduct) {
      return [initialProduct];
    }
    return list;
  }, [products, initialProduct]);

  // Selected frame product model
  const [selectedProduct, setSelectedProduct] = useState<any>(() => {
    if (initialProduct) return initialProduct;
    const found = products.find((p) => p.id === productId);
    return found || products[0] || null;
  });

  useEffect(() => {
    if (initialProduct) {
      setSelectedProduct(initialProduct);
    } else if (frameProducts.length > 0) {
      const found = frameProducts.find((p) => p.id === productId);
      if (found) setSelectedProduct(found);
    }
  }, [productId, initialProduct, frameProducts]);

  // Studio configuration dynamically loaded from admin settings & database
  const [studioConfig, setStudioConfig] = useState<FrameStudioConfig>(DEFAULT_FRAME_STUDIO_CONFIG);

  useEffect(() => {
    // Initial load from local storage
    const initialConfig = getFrameStudioConfig();
    setStudioConfig(initialConfig);

    // Fetch latest from API
    fetch("/api/settings/frames")
      .then((res) => res.json())
      .then((data) => {
        if (data?.success && data?.config) {
          setStudioConfig(data.config);
          saveFrameStudioConfig(data.config);
        }
      })
      .catch(() => {});

    const handleSync = () => {
      setStudioConfig(getFrameStudioConfig());
    };

    window.addEventListener("pixello_frame_config_updated", handleSync);
    window.addEventListener("storage", handleSync);
    return () => {
      window.removeEventListener("pixello_frame_config_updated", handleSync);
      window.removeEventListener("storage", handleSync);
    };
  }, []);

  const activeWoodColors = useMemo(() => {
    const list = studioConfig.woodColors || DEFAULT_FRAME_STUDIO_CONFIG.woodColors;
    const enabled = list.filter((c) => c.enabled !== false);
    return enabled.length > 0 ? enabled : DEFAULT_FRAME_STUDIO_CONFIG.woodColors;
  }, [studioConfig.woodColors]);

  const activeGsmOptions = useMemo(() => {
    const list = studioConfig.gsmOptions || DEFAULT_FRAME_STUDIO_CONFIG.gsmOptions;
    return list.length > 0 ? list : DEFAULT_FRAME_STUDIO_CONFIG.gsmOptions;
  }, [studioConfig.gsmOptions]);

  // Compute active frame sizes configured by admin (on product or in frame studio settings)
  const activeFrameSizes = useMemo<FrameVariantConfig[]>(() => {
    const productSizes = selectedProduct?.frameSizes;
    const studioSizes = studioConfig?.frameSizes;
    const rawList = (Array.isArray(productSizes) && productSizes.length > 0)
      ? productSizes
      : ((Array.isArray(studioSizes) && studioSizes.length > 0) ? studioSizes : FRAME_SIZES);

    return rawList.map((size: any) => {
      let ar = size.aspectRatio;
      const combinedText = `${size.label || ""} ${size.name || ""} ${size.dimensions || ""}`;
      if (!ar || typeof ar !== "number" || isNaN(ar)) {
        const match = combinedText.match(/(\d+(?:\.\d+)?)\s*(?:x|X|\*|×)\s*(\d+(?:\.\d+)?)/);
        if (match) {
          const w = parseFloat(match[1]);
          const h = parseFloat(match[2]);
          if (w > 0 && h > 0) {
            ar = w / h;
          }
        } else if (/a4/i.test(combinedText)) {
          ar = 1 / 1.414;
        } else if (/a3/i.test(combinedText)) {
          ar = 1 / 1.414;
        } else if (/a5/i.test(combinedText)) {
          ar = 1 / 1.414;
        } else if (/square|1:1/i.test(combinedText)) {
          ar = 1.0;
        } else {
          ar = 4 / 6;
        }
      }

      let cm = size.cmDimensions;
      if (!cm) {
        const cmMatch = (size.dimensions || "").match(/\(([^)]+cm[^)]*)\)/i);
        if (cmMatch) {
          cm = cmMatch[1];
        } else {
          const numMatch = combinedText.match(/(\d+(?:\.\d+)?)\s*(?:x|X|\*|×)\s*(\d+(?:\.\d+)?)/);
          if (numMatch) {
            const wIn = parseFloat(numMatch[1]);
            const hIn = parseFloat(numMatch[2]);
            cm = `${(wIn * 2.54).toFixed(1)} x ${(hIn * 2.54).toFixed(1)} cm`;
          } else {
            cm = "";
          }
        }
      }

      let displayName = size.name || size.label;
      if (!displayName.toLowerCase().includes("inch") && !displayName.toLowerCase().includes("size") && !displayName.toLowerCase().includes("cm")) {
        displayName = `${displayName} Inches`;
      }

      return {
        label: size.label || displayName,
        name: displayName,
        dimensions: size.dimensions || displayName,
        cmDimensions: cm || "",
        aspectRatio: ar,
        originalPrice: Number(size.originalPrice) || 249,
        discountPct: Number(size.discountPct) || 25,
        gsm180Price: Number(size.gsm180Price) || Number(size.price) || 149,
        gsm260Price: Number(size.gsm260Price) || (Number(size.gsm180Price) || 149) + 10,
        price: Number(size.gsm180Price) || Number(size.price) || 149,
      };
    });
  }, [selectedProduct?.frameSizes, studioConfig?.frameSizes]);

  // Customization States (matching Image 1 & 2 defaults: 4x6 Inches, Natural Pine)
  const [selectedSize, setSelectedSize] = useState<FrameVariantConfig>(FRAME_SIZES[0]);

  // Keep selectedSize synchronized whenever admin updates frame sizes
  useEffect(() => {
    if (activeFrameSizes.length > 0) {
      const match = activeFrameSizes.find(
        (s) => s.label.toLowerCase() === selectedSize?.label?.toLowerCase() ||
               s.name.toLowerCase() === selectedSize?.name?.toLowerCase()
      );
      if (match) {
        setSelectedSize(match);
      } else {
        setSelectedSize(activeFrameSizes[0]);
      }
    }
  }, [activeFrameSizes]);

  const [selectedColor, setSelectedColor] = useState<FrameWoodColorConfig>(FRAME_COLORS[0]); // Default Natural Pine
  const [selectedGsmId, setSelectedGsmId] = useState<string>("180gsm");
  const [orientation, setOrientation] = useState<"portrait" | "landscape">("portrait");
  const [hasMat, setHasMat] = useState<boolean>(true);
  const [customInscription, setCustomInscription] = useState<string>("");
  const [quantity, setQuantity] = useState<number>(1);

  // Sync selectedColor if not in active list
  useEffect(() => {
    if (activeWoodColors.length > 0) {
      const match = activeWoodColors.find((c) => c.id === selectedColor?.id);
      if (!match) {
        setSelectedColor(activeWoodColors[0]);
      } else {
        setSelectedColor(match);
      }
    }
  }, [activeWoodColors]);

  // Active selected GSM option
  const selectedGsmOption = useMemo(() => {
    return activeGsmOptions.find((g) => g.id === selectedGsmId) || activeGsmOptions[0] || DEFAULT_FRAME_GSM_OPTIONS[0];
  }, [activeGsmOptions, selectedGsmId]);

  const selectedGsm = selectedGsmOption?.gsm || selectedGsmOption?.title || "180 GSM";

  // Photograph Upload & Manipulation States
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [imageFileName, setImageFileName] = useState<string>("");
  const [imageFileSize, setImageFileSize] = useState<string>("");
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Image Transformations inside the frame
  const [zoomScale, setZoomScale] = useState<number>(1);
  const [panX, setPanX] = useState<number>(0);
  const [panY, setPanY] = useState<number>(0);
  const [rotation, setRotation] = useState<number>(0);

  // Feedback states
  const [addedSuccess, setAddedSuccess] = useState<boolean>(false);

  // Check out of stock status
  const isOutOfStock = useMemo(() => {
    if (!selectedProduct) return false;
    const status = selectedProduct.status || "In Stock";
    const stock = selectedProduct.stock !== undefined ? selectedProduct.stock : 100;
    return status === "Out of Stock" || stock <= 0;
  }, [selectedProduct]);

  // Wishlist state
  const isWishlisted = useMemo(() => {
    if (!selectedProduct) return false;
    return isInWishlist(selectedProduct.id);
  }, [isInWishlist, selectedProduct]);

  const handleToggleWishlist = () => {
    if (!selectedProduct) return;
    toggleWishlist({
      id: selectedProduct.id,
      name: selectedProduct.name,
      category: "Frames",
      price: unitPrice,
      image: uploadedImage || selectedProduct.images?.[0] || "/images/wooden_frame_main.png",
    });
  };

  // Pricing calculations
  const unitPrice = useMemo(() => {
    const base180 = selectedSize.gsm180Price || selectedSize.price || 149;
    if (!selectedGsmOption) return base180;
    if (selectedGsmOption.id === "260gsm" && selectedSize.gsm260Price) {
      return selectedSize.gsm260Price;
    }
    const delta = typeof selectedGsmOption.priceDelta === "number" ? selectedGsmOption.priceDelta : 0;
    return base180 + delta;
  }, [selectedSize, selectedGsmOption]);

  const totalPrice = unitPrice * quantity;
  const originalTotalPrice = selectedSize.originalPrice * quantity;
  const totalSavings = originalTotalPrice - totalPrice;

  // Handle Photo Upload
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadError(null);

    // Format validation
    const validTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
    if (!validTypes.includes(file.type.toLowerCase())) {
      setUploadError("Invalid file format. Please upload JPEG, PNG, or WebP photo.");
      return;
    }

    // Size validation (25MB limit as shown in Picture 2)
    if (file.size > 25 * 1024 * 1024) {
      setUploadError("Photograph exceeds 25MB limit. Please select a smaller file.");
      return;
    }

    setIsUploading(true);
    setImageFileName(file.name);
    setImageFileSize(`${(file.size / (1024 * 1024)).toFixed(2)} MB`);

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      if (dataUrl) {
        setUploadedImage(dataUrl);
        setZoomScale(1);
        setPanX(0);
        setPanY(0);
        setRotation(0);
      }
      setIsUploading(false);
    };
    reader.onerror = () => {
      setUploadError("Failed to read image file. Please try again.");
      setIsUploading(false);
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveImage = () => {
    setUploadedImage(null);
    setImageFileName("");
    setImageFileSize("");
    setZoomScale(1);
    setPanX(0);
    setPanY(0);
    setRotation(0);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleRotate = () => {
    setRotation((prev) => (prev + 90) % 360);
  };

  const handleResetCrop = () => {
    setZoomScale(1);
    setPanX(0);
    setPanY(0);
    setRotation(0);
  };

  // Add to Cart
  const handleAddToCart = async () => {
    if (isOutOfStock || !selectedProduct) return;

    const variantLabel = `${selectedSize.name} (${selectedGsm}, ${selectedColor.name}${
      hasMat ? ", Gallery Mat" : ", Full Bleed"
    })`;

    const frameCustomizationData = {
      modelId: selectedProduct.id,
      modelName: selectedProduct.name,
      sizeLabel: selectedSize.label,
      sizeName: selectedSize.name,
      dimensions: selectedSize.dimensions,
      colorId: selectedColor.id,
      colorName: selectedColor.name,
      finish: selectedColor.finish,
      gsm: selectedGsm,
      orientation,
      hasMat,
      customInscription: customInscription.trim() || undefined,
      cropSettings: {
        scale: zoomScale,
        panX,
        panY,
        rotation,
      },
    };

    const cartItemId = `frame-custom-${selectedProduct.id}-${selectedSize.label}-${selectedColor.id}-${Date.now()}`;
    const primaryImage =
      uploadedImage || selectedProduct.images?.[0] || "/images/wooden_frame_main.png";

    await addToCart({
      id: cartItemId,
      name: selectedProduct.name,
      size: customInscription ? `${variantLabel} • Inscription: "${customInscription}"` : variantLabel,
      price: unitPrice,
      quantity,
      image: primaryImage,
      photos: uploadedImage ? [uploadedImage] : [primaryImage],
      frameCustomization: frameCustomizationData,
      customizationDetails: {
        photos: uploadedImage ? [uploadedImage] : [primaryImage],
        frameCustomization: frameCustomizationData,
      },
    });

    if (typeof window !== "undefined") {
      try {
        localStorage.setItem(
          `pixello_frame_custom_${cartItemId}`,
          JSON.stringify(frameCustomizationData)
        );
      } catch (e) {}
    }

    setAddedSuccess(true);
    setTimeout(() => setAddedSuccess(false), 3000);
  };

  // Buy Now
  const handleBuyNow = async () => {
    if (isOutOfStock || !selectedProduct) return;
    await handleAddToCart();
    router.push("/cart");
  };

  // Compute aspect ratio CSS for live frame preview
  const frameAspectRatio = useMemo(() => {
    const base = selectedSize.aspectRatio;
    return orientation === "portrait" ? base : 1 / base;
  }, [selectedSize, orientation]);

  return (
    <div className="w-full bg-[#FFFDFB] text-[#3A2B24] pb-20">
      {/* HEADER SECTION (EXACT MATCH TO PICTURE 2) */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 pb-4">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-xs text-[#8C7A70] mb-4">
          <Link href="/" className="hover:text-[#D89A86] transition-colors">
            Home
          </Link>
          <ChevronRight className="h-3 w-3" />
          <Link href="/products" className="hover:text-[#D89A86] transition-colors">
            Catalog
          </Link>
          <ChevronRight className="h-3 w-3" />
          <Link href="/products?category=Frames" className="hover:text-[#D89A86] transition-colors">
            Frames
          </Link>
          <ChevronRight className="h-3 w-3" />
          <span className="font-bold text-[#3A2B24] truncate">
            {selectedProduct?.name || "Premium Wooden Frame"}
          </span>
        </div>

        {/* Studio Heading & Model Selector */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#EFE6DD]/70">
          <div>
            <h1 className="font-serif-brand text-2xl sm:text-3xl lg:text-4xl font-extrabold text-[#3A2B24] tracking-tight">
              Visual Memory Customization Studio
            </h1>
            <p className="text-xs sm:text-sm text-[#8C7A70] mt-1 font-medium">
              Turn your favourite photograph into a timeless keepsake. Handcrafted wood and archival print finish.
            </p>
          </div>

          {/* Model Selector (Top Right of Picture 2) */}
          {frameProducts.length > 0 && (
            <div className="flex items-center gap-2.5 shrink-0 bg-[#FFF9F3] border border-[#EFE6DD] px-3.5 py-2 rounded-2xl shadow-2xs">
              <span className="text-xs font-bold text-[#6C5C54]">Model:</span>
              <select
                value={selectedProduct?.id || "PRD-01"}
                onChange={(e) => {
                  const target = frameProducts.find((p) => p.id === e.target.value);
                  if (target) {
                    setSelectedProduct(target);
                    router.push(`/product/${target.id}`);
                  }
                }}
                className="text-xs font-bold text-[#3A2B24] bg-transparent outline-none cursor-pointer max-w-[220px] truncate"
              >
                {frameProducts.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>
      </div>

      {/* MAIN TWO-COLUMN STUDIO GRID */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-start">
          
          {/* ========================================================= */}
          {/* LEFT SIDE: LIVE FRAME PREVIEW (EXACT MATCH TO PICTURE 2)  */}
          {/* ========================================================= */}
          <div className="lg:col-span-6 xl:col-span-7 flex flex-col gap-4 lg:sticky lg:top-24">
            <div className="relative rounded-3xl p-6 md:p-10 bg-[#FFF9F3] border border-[#EFE6DD] shadow-sm flex flex-col items-center justify-center min-h-[480px] md:min-h-[560px]">
              
              {/* TOP LEFT: YELLOW MEMORY ARCHIVE BADGE */}
              <div className="absolute top-6 left-6 z-10">
                <span className="bg-[#FFE066] text-[#3A2B24] font-black text-[11px] tracking-wider px-3.5 py-1 rounded shadow-xs font-mono">
                  // MEMORY ARCHIVE //
                </span>
              </div>

              {/* TOP RIGHT: WISHLIST PINK/RED HEART CIRCLE */}
              <button
                type="button"
                onClick={handleToggleWishlist}
                className="absolute top-6 right-6 z-10 h-10 w-10 rounded-full bg-[#E57373] hover:bg-[#d66565] text-white flex items-center justify-center shadow-md transition-all active:scale-95 cursor-pointer"
                title="Save to Wishlist"
              >
                <Heart className={cn("h-5 w-5", isWishlisted ? "fill-white text-white" : "text-white")} />
              </button>

              {/* ORIENTATION & MAT CONTROLS */}
              <div className="absolute top-6 left-1/2 -translate-x-1/2 z-10 hidden sm:flex items-center gap-2">
                <button
                  type="button"
                  onClick={() =>
                    setOrientation((prev) => (prev === "portrait" ? "landscape" : "portrait"))
                  }
                  className="px-3 py-1 rounded-full bg-white/95 border border-[#EFE6DD] text-[11px] font-bold text-[#3A2B24] hover:bg-[#FFF8F2] flex items-center gap-1.5 shadow-2xs cursor-pointer transition-all"
                  title="Toggle Orientation"
                >
                  <RotateCw className="h-3 w-3 text-[#D89A86]" />
                  <span className="capitalize">{orientation}</span>
                </button>

                <button
                  type="button"
                  onClick={() => setHasMat((prev) => !prev)}
                  className={cn(
                    "px-3 py-1 rounded-full text-[11px] font-bold border transition-all flex items-center gap-1.5 shadow-2xs cursor-pointer",
                    hasMat
                      ? "bg-[#D89A86] text-white border-[#D89A86]"
                      : "bg-white/95 text-[#6C5C54] border-[#EFE6DD] hover:bg-[#FFF8F2]"
                  )}
                  title="Toggle Mat Border"
                >
                  <Layers className="h-3 w-3" />
                  <span>{hasMat ? "Gallery Mat" : "No Mat"}</span>
                </button>

                {/* Selected Frame Size Pill */}
                <div
                  className="px-3 py-1 rounded-full bg-white/95 border border-[#EFE6DD] text-[11px] font-bold text-[#3A2B24] flex items-center gap-1.5 shadow-2xs"
                  title="Active Size from Admin"
                >
                  <Maximize2 className="h-3 w-3 text-[#D89A86]" />
                  <span>{selectedSize.name || selectedSize.label}</span>
                </div>
              </div>

              {/* REALISTIC FRAME CONSTRUCTION */}
              <div className="w-full flex flex-col items-center justify-center py-4 sm:py-6">
                <div
                  style={{
                    aspectRatio: `${frameAspectRatio}`,
                    maxWidth: orientation === "portrait"
                      ? (selectedSize.aspectRatio <= 0.68 ? "315px" : selectedSize.aspectRatio >= 0.85 ? "370px" : "340px")
                      : (selectedSize.aspectRatio <= 0.68 ? "460px" : "420px"),
                    width: "100%",
                    background: selectedColor.borderStyle,
                  }}
                  className="relative rounded-2xl p-3 sm:p-4 md:p-5 shadow-2xl transition-all duration-300 flex flex-col justify-between border-4 border-black/10 my-2 sm:my-4"
                >
                  {/* Outer Frame Bevel Shadow */}
                  <div className="absolute inset-0 rounded-2xl pointer-events-none shadow-[inset_0_2px_8px_rgba(0,0,0,0.35),inset_0_-2px_8px_rgba(0,0,0,0.35)]" />

                  {/* Inner Mat Mount */}
                  <div
                    style={{
                      backgroundColor: hasMat ? selectedColor.matColor : "transparent",
                    }}
                    className={cn(
                      "relative w-full h-full rounded-lg transition-all duration-300 flex flex-col justify-between overflow-hidden min-h-0",
                      hasMat
                        ? "p-3 sm:p-4 md:p-5 shadow-[inset_0_2px_6px_rgba(0,0,0,0.25)] border border-black/10"
                        : "p-0"
                    )}
                  >
                    {/* Customer Photo / Empty State Window */}
                    <div className="relative w-full h-full rounded overflow-hidden bg-white shadow-[inset_0_1px_4px_rgba(0,0,0,0.15)] flex items-center justify-center min-h-[220px]">
                      {uploadedImage ? (
                        <div className="relative w-full h-full overflow-hidden flex items-center justify-center">
                          <div
                            style={{
                              transform: `translate(${panX}px, ${panY}px) scale(${zoomScale}) rotate(${rotation}deg)`,
                              transformOrigin: "center center",
                              transition: isUploading ? "none" : "transform 0.15s ease-out",
                            }}
                            className="relative w-full h-full"
                          >
                            <img
                              src={uploadedImage}
                              alt="Custom Memory Photograph"
                              className="w-full h-full object-cover select-none pointer-events-none"
                            />
                          </div>

                          {/* Paper Texture Overlay */}
                          <div
                            className={cn(
                              "absolute inset-0 pointer-events-none transition-opacity",
                              selectedGsm === "180 GSM"
                                ? "bg-gradient-to-tr from-black/5 via-transparent to-white/10 opacity-60 mix-blend-overlay"
                                : "bg-gradient-to-tr from-white/20 via-transparent to-white/30 opacity-70 mix-blend-soft-light"
                            )}
                          />
                        </div>
                      ) : (
                        /* EXACT MATCH TO PICTURE 2 EMPTY STATE */
                        <div
                          onClick={() => fileInputRef.current?.click()}
                          className="flex flex-col items-center justify-center p-6 text-center cursor-pointer group w-full h-full hover:bg-rose-50/20 transition-colors"
                        >
                          <div className="h-14 w-14 rounded-full bg-[#FCE8E6] text-[#E57373] flex items-center justify-center mb-3 group-hover:scale-110 transition-transform shadow-2xs">
                            <Upload className="h-6 w-6 stroke-[2.5]" />
                          </div>
                          <p className="font-serif-brand font-bold text-base md:text-lg text-[#3A2B24]">
                            Your Snapshot Goes Here
                          </p>
                          <p className="text-xs text-[#8C7A70] mt-1 font-medium max-w-[200px]">
                            Click below to upload from your phone or gallery
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Mat Inscription */}
                    {hasMat && customInscription && (
                      <div className="pt-2 text-center">
                        <span className="font-serif-brand text-[11px] text-[#5A463B] italic tracking-wide block truncate px-2 font-medium">
                          {customInscription}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* LIVE SIZE DIMENSION BADGE DIRECTLY ON PREVIEW */}
                <div className="mt-3 flex items-center justify-center">
                  <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/95 border border-[#EFE6DD] text-xs font-bold text-[#3A2B24] shadow-2xs animate-in fade-in duration-200">
                    <span className="text-[#D89A86]">📐</span>
                    <span>{selectedSize.name || selectedSize.label}</span>
                    <span className="text-[#D89A86]">•</span>
                    <span className="text-[#6C5C54] font-medium">{selectedSize.dimensions}</span>
                    {selectedSize.cmDimensions && (
                      <span className="text-[10px] text-[#8C7A70] font-normal">({selectedSize.cmDimensions})</span>
                    )}
                  </div>
                </div>
              </div>

              {/* POSITION & CROP CONTROLS (WHEN PHOTO IS UPLOADED) */}
              {uploadedImage && (
                <div className="w-full bg-white border border-[#EFE6DD] rounded-2xl p-4 mt-2 flex flex-col gap-3 shadow-2xs">
                  <div className="flex items-center justify-between text-xs font-bold text-[#6C5C54]">
                    <span className="flex items-center gap-1.5">
                      <Sliders className="h-3.5 w-3.5 text-[#D89A86]" />
                      Position & Crop Controls
                    </span>
                    <button
                      type="button"
                      onClick={handleResetCrop}
                      className="text-[11px] text-[#D89A86] hover:underline font-bold"
                    >
                      Reset
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
                    {/* Zoom Slider */}
                    <div className="flex items-center gap-3">
                      <ZoomOut className="h-4 w-4 text-[#6C5C54] shrink-0" />
                      <div className="flex-1">
                        <input
                          type="range"
                          min={1}
                          max={2.5}
                          step={0.05}
                          value={zoomScale}
                          onChange={(e) => setZoomScale(parseFloat(e.target.value))}
                          className="w-full h-1.5 bg-[#EFE6DD] rounded-lg appearance-none cursor-pointer accent-[#D89A86]"
                        />
                      </div>
                      <ZoomIn className="h-4 w-4 text-[#6C5C54] shrink-0" />
                      <span className="text-[11px] font-bold text-[#3A2B24] w-9 text-right">
                        {zoomScale.toFixed(1)}x
                      </span>
                    </div>

                    {/* Quick Alignment / Rotation Buttons */}
                    <div className="flex items-center justify-end gap-1.5">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setPanX((prev) => prev - 15)}
                        className="h-7 px-2 text-xs border-[#EFE6DD] text-[#3A2B24]"
                        title="Nudge Left"
                      >
                        ←
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setPanX((prev) => prev + 15)}
                        className="h-7 px-2 text-xs border-[#EFE6DD] text-[#3A2B24]"
                        title="Nudge Right"
                      >
                        →
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setPanY((prev) => prev - 15)}
                        className="h-7 px-2 text-xs border-[#EFE6DD] text-[#3A2B24]"
                        title="Nudge Up"
                      >
                        ↑
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setPanY((prev) => prev + 15)}
                        className="h-7 px-2 text-xs border-[#EFE6DD] text-[#3A2B24]"
                        title="Nudge Down"
                      >
                        ↓
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={handleRotate}
                        className="h-7 px-2 text-xs border-[#EFE6DD] text-[#3A2B24] flex items-center gap-1"
                        title="Rotate 90°"
                      >
                        <RotateCw className="h-3 w-3" />
                        {rotation}°
                      </Button>
                    </div>
                  </div>
                </div>
              )}

              {/* SELECTED SPEC PILLS */}
              <div className="w-full flex flex-wrap items-center justify-center gap-2 pt-2">
                <span className="text-[11px] font-bold bg-[#FFF2EB] text-[#D89A86] px-3 py-1 rounded-full border border-[#F3DACF]">
                  Size: {selectedSize.name}
                </span>
                <span className="text-[11px] font-bold bg-white text-[#6C5C54] px-3 py-1 rounded-full border border-[#EFE6DD]">
                  Color: {selectedColor.name}
                </span>
                <span className="text-[11px] font-bold bg-white text-[#6C5C54] px-3 py-1 rounded-full border border-[#EFE6DD]">
                  Paper: {selectedGsm}
                </span>
              </div>

              {/* DISCLAIMER */}
              <p className="text-[11px] text-center text-[#9E8E84] mt-3 font-medium flex items-center justify-center gap-1">
                <Info className="h-3.5 w-3.5 shrink-0 text-[#D89A86]" />
                Screen preview is illustrative; actual handcrafted wood grain and archival print colors may vary slightly.
              </p>
            </div>
          </div>

          {/* ========================================================= */}
          {/* RIGHT SIDE: CUSTOMIZATION CONTROLS (EXACT TO PICTURE 2)   */}
          {/* ========================================================= */}
          <div className="lg:col-span-6 xl:col-span-5 flex flex-col gap-5">
            
            {/* STEP 1: CHOOSE PHOTOGRAPH */}
            <div className="bg-white rounded-3xl p-6 border border-[#EFE6DD] shadow-xs">
              <h3 className="font-bold text-xs sm:text-sm text-[#3A2B24] uppercase tracking-wider mb-3">
                1. CHOOSE PHOTOGRAPH
              </h3>

              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileSelect}
                accept="image/jpeg,image/png,image/webp,image/jpg"
                className="hidden"
              />

              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="w-full py-4 px-6 rounded-2xl border-2 border-dashed border-[#E57373] bg-white hover:bg-[#FFF5F4] transition-all flex items-center justify-center gap-2 text-[#D87070] font-bold text-sm cursor-pointer shadow-2xs group active:scale-[0.99]"
              >
                <Upload className="h-4 w-4 stroke-[2.5] group-hover:-translate-y-0.5 transition-transform" />
                <span>Upload Memory Snapshot</span>
              </button>

              <p className="text-[11px] text-[#8C7A70] text-center mt-3 font-medium">
                Supports JPEG, PNG, WEBP up to 25MB. Your uploads remain 100% private.
              </p>

              {uploadError && (
                <p className="text-xs text-rose-600 mt-2 text-center font-bold">
                  {uploadError}
                </p>
              )}

              {uploadedImage && (
                <div className="mt-3 p-3 rounded-xl bg-[#FFF9F3] border border-[#EFE6DD] flex items-center justify-between text-xs">
                  <div className="min-w-0 flex-1 mr-2">
                    <p className="font-bold text-[#3A2B24] truncate">{imageFileName}</p>
                    <p className="text-[10px] text-[#8C7A70]">{imageFileSize}</p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="text-[#D89A86] hover:underline font-bold text-[11px]"
                    >
                      Replace
                    </button>
                    <span className="text-[#EFE6DD]">•</span>
                    <button
                      type="button"
                      onClick={handleRemoveImage}
                      className="text-red-500 hover:underline font-bold text-[11px]"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* STEP 2: FRAME SIZE (ADMIN CONFIGURED & SYNCED) */}
            <div className="bg-white rounded-3xl p-6 border border-[#EFE6DD] shadow-xs">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-bold text-xs sm:text-sm text-[#3A2B24] uppercase tracking-wider">
                  2. FRAME SIZE
                </h3>
                <span className="text-[10px] font-bold text-[#D89A86] uppercase tracking-wider bg-[#FFF8F2] px-2.5 py-0.5 rounded-full border border-[#D89A86]/30">
                  {activeFrameSizes.length} Sizes
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3">
                {activeFrameSizes.map((size) => {
                  const isSelected = selectedSize.label === size.label;
                  return (
                    <button
                      key={size.label}
                      type="button"
                      onClick={() => setSelectedSize(size)}
                      className={cn(
                        "py-3.5 px-4 rounded-xl font-bold text-xs sm:text-sm transition-all cursor-pointer border text-center flex flex-col items-center justify-center",
                        isSelected
                          ? "bg-[#FCE8E6] border-[#E57373] text-[#C25454] shadow-xs ring-1 ring-[#E57373]/30"
                          : "bg-white border-[#EFE6DD] text-[#3A2B24] hover:border-[#D89A86]/60 hover:bg-[#FFF9F3]"
                      )}
                    >
                      <span>{size.name || size.label}</span>
                    </button>
                  );
                })}
              </div>

              <p className="text-[11px] text-[#8C7A70] mt-3 font-medium text-center">
                Selected Dimensions: <span className="font-bold text-[#3A2B24]">{selectedSize.dimensions} {selectedSize.cmDimensions ? `(${selectedSize.cmDimensions})` : ""}</span>
              </p>
            </div>

            {/* STEP 3: WOOD & FINISH COLOR */}
            <div className="bg-white rounded-3xl p-6 border border-[#EFE6DD] shadow-xs">
              <h3 className="font-bold text-xs sm:text-sm text-[#3A2B24] uppercase tracking-wider mb-3">
                3. WOOD &amp; FINISH COLOR
              </h3>

              <div className="grid grid-cols-2 gap-3">
                {activeWoodColors.map((color) => {
                  const isSelected = selectedColor?.id === color.id;
                  return (
                    <button
                      key={color.id}
                      type="button"
                      onClick={() => setSelectedColor(color)}
                      className={cn(
                        "py-3.5 px-4 rounded-xl font-bold text-xs sm:text-sm transition-all cursor-pointer border text-center relative overflow-hidden",
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
                Finish: <span className="font-bold text-[#3A2B24]">{selectedColor?.finish || selectedColor?.name}</span>
              </p>
            </div>

            {/* STEP 4: PRINT PAPER QUALITY (GSM) */}
            <div className="bg-white rounded-3xl p-6 border border-[#EFE6DD] shadow-xs">
              <h3 className="font-bold text-xs sm:text-sm text-[#3A2B24] uppercase tracking-wider mb-3">
                4. PRINT PAPER QUALITY (GSM)
              </h3>
              <div className={cn(
                "grid gap-3",
                activeGsmOptions.length > 1 ? "grid-cols-1 sm:grid-cols-2" : "grid-cols-1"
              )}>
                {activeGsmOptions.map((gsm) => {
                  const isSelected = selectedGsmOption?.id === gsm.id;
                  return (
                    <div
                      key={gsm.id}
                      onClick={() => setSelectedGsmId(gsm.id)}
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

            {/* STEP 5: OPTIONAL CUSTOM INSCRIPTION */}
            <div className="bg-white rounded-3xl p-6 border border-[#EFE6DD] shadow-xs">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-bold text-xs sm:text-sm text-[#3A2B24] uppercase tracking-wider">
                  5. CUSTOM INSCRIPTION (OPTIONAL)
                </h3>
                <span className="text-[10px] text-[#8C7A70] font-semibold">On Mat Border</span>
              </div>
              <Input
                type="text"
                placeholder="e.g. John & Sarah • Forever In Love • 2026"
                value={customInscription}
                onChange={(e) => setCustomInscription(e.target.value)}
                maxLength={60}
                className="h-10 rounded-xl bg-[#FFF9F3] border-[#EFE6DD] text-xs font-semibold focus:border-[#D89A86]"
              />
            </div>

            {/* STEP 6: PRICING SUMMARY & PURCHASE ACTIONS */}
            <div className="bg-white rounded-3xl p-6 border border-[#EFE6DD] shadow-md flex flex-col gap-4">
              <div className="flex items-baseline justify-between">
                <div className="flex items-baseline gap-2.5">
                  <span className="text-3xl font-extrabold text-[#D89A86]">₹{totalPrice}</span>
                  <span className="text-sm text-gray-400 line-through">₹{originalTotalPrice}</span>
                  <span className="text-xs font-bold text-white bg-[#3A2B24] px-2.5 py-0.5 rounded-full">
                    {selectedSize.discountPct}% OFF
                  </span>
                </div>
                <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                  Save ₹{totalSavings}
                </span>
              </div>

              {/* Quantity Controls */}
              <div className="flex items-center justify-between py-2 border-y border-[#EFE6DD]">
                <span className="text-xs font-bold text-[#3A2B24]">Quantity:</span>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                    className="h-8 w-8 rounded-full border border-[#EFE6DD] flex items-center justify-center text-[#3A2B24] hover:bg-[#FFF8F2] font-bold text-sm cursor-pointer"
                  >
                    -
                  </button>
                  <span className="font-bold text-sm text-[#3A2B24] w-6 text-center">{quantity}</span>
                  <button
                    type="button"
                    onClick={() => setQuantity((q) => Math.min(20, q + 1))}
                    className="h-8 w-8 rounded-full border border-[#EFE6DD] flex items-center justify-center text-[#3A2B24] hover:bg-[#FFF8F2] font-bold text-sm cursor-pointer"
                  >
                    +
                  </button>
                </div>
              </div>

              {/* Stock check & Add to Cart / Buy Now buttons */}
              {isOutOfStock ? (
                <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-center">
                  <p className="text-sm font-bold text-rose-600">Product is Currently Out of Stock</p>
                  <p className="text-xs text-rose-500 mt-1">You can explore variants and previews, but ordering is temporarily disabled.</p>
                </div>
              ) : (
                <div className="flex flex-col sm:flex-row gap-3">
                  <Button
                    type="button"
                    onClick={handleAddToCart}
                    className="flex-1 h-12 rounded-full btn-pixello-primary text-xs sm:text-sm font-bold shadow-md cursor-pointer flex items-center justify-center gap-2"
                  >
                    <ShoppingBag className="h-4 w-4" />
                    <span>{addedSuccess ? "Added to Cart! ✓" : "Add to Cart"}</span>
                  </Button>

                  <Button
                    type="button"
                    onClick={handleBuyNow}
                    className="flex-1 h-12 rounded-full bg-[#3A2B24] hover:bg-[#2A1E17] text-white text-xs sm:text-sm font-bold shadow-md cursor-pointer flex items-center justify-center gap-2"
                  >
                    <span>Buy Now</span>
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </div>

          </div>
        </div>

        {/* BOTTOM FEATURES & ABOUT SECTION */}
        <div className="mt-16 pt-10 border-t border-[#EFE6DD]">
          {/* Feature Badges */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5 p-4 bg-[#FFF8F2] border border-[#EFE6DD] rounded-3xl mb-8 shadow-xs">
            <div className="flex items-center gap-3 p-2 bg-white rounded-2xl border border-[#EFE6DD]">
              <div className="h-10 w-10 rounded-xl bg-[#FFF8F2] border border-[#EFE6DD] flex items-center justify-center text-[#D89A86] shrink-0">
                <Maximize2 className="h-5 w-5" />
              </div>
              <div>
                <span className="font-bold text-xs text-[#3A2B24] uppercase tracking-wider block">PERFECT SIZE</span>
                <span className="text-[10px] text-[#6C5C54] block font-medium">Archival custom cuts</span>
              </div>
            </div>

            <div className="flex items-center gap-3 p-2 bg-white rounded-2xl border border-[#EFE6DD]">
              <div className="h-10 w-10 rounded-xl bg-[#FFF8F2] border border-[#EFE6DD] flex items-center justify-center text-[#D89A86] shrink-0">
                <Award className="h-5 w-5" />
              </div>
              <div>
                <span className="font-bold text-xs text-[#3A2B24] uppercase tracking-wider block">PREMIUM QUALITY</span>
                <span className="text-[10px] text-[#6C5C54] block font-medium">Durable frame & finish</span>
              </div>
            </div>

            <div className="flex items-center gap-3 p-2 bg-white rounded-2xl border border-[#EFE6DD]">
              <div className="h-10 w-10 rounded-xl bg-[#FFF8F2] border border-[#EFE6DD] flex items-center justify-center text-[#D89A86] shrink-0">
                <Gift className="h-5 w-5" />
              </div>
              <div>
                <span className="font-bold text-xs text-[#3A2B24] uppercase tracking-wider block">THOUGHTFUL GIFT</span>
                <span className="text-[10px] text-[#6C5C54] block font-medium">Perfect for loved ones</span>
              </div>
            </div>

            <div className="flex items-center gap-3 p-2 bg-white rounded-2xl border border-[#EFE6DD]">
              <div className="h-10 w-10 rounded-xl bg-[#FFF8F2] border border-[#EFE6DD] flex items-center justify-center text-[#D89A86] shrink-0">
                <LayoutGrid className="h-5 w-5" />
              </div>
              <div>
                <span className="font-bold text-xs text-[#3A2B24] uppercase tracking-wider block">WALL & TABLE TOP</span>
                <span className="text-[10px] text-[#6C5C54] block font-medium">With stand & hook</span>
              </div>
            </div>
          </div>

          {/* About Our Frames */}
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[#EFE6DD] shadow-xs">
            <h3 className="font-serif-brand text-xl font-bold text-[#3A2B24] mb-4 flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-[#D89A86]" /> About Our Handcrafted Frames
            </h3>
            <div className="grid md:grid-cols-2 gap-4 text-xs text-[#6C5C54]">
              <div className="flex items-center gap-2.5 font-medium">
                <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" /> High quality handcrafted MDF wood frame
              </div>
              <div className="flex items-center gap-2.5 font-medium">
                <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" /> Crystal clear shatter-resistant photo protection
              </div>
              <div className="flex items-center gap-2.5 font-medium">
                <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" /> Fade-resistant archival pigment print technology
              </div>
              <div className="flex items-center gap-2.5 font-medium">
                <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" /> Dual orientation with sturdy stand & hanging hooks
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
