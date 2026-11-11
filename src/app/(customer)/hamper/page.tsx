'use client';

import React, { useState, useMemo, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Gift,
  Plus,
  Minus,
  Trash2,
  Sparkles,
  Search,
  CheckCircle2,
  ArrowRight,
  Package,
  Heart,
  Eye,
  ShoppingBag,
  SlidersHorizontal,
  FolderPlus,
  Wand2,
  X,
  Layers,
  ChevronRight,
  Info,
  Pencil,
  Edit2,
  Edit3,
  Camera,
  Upload,
  Image as ImageIcon,
  Check,
  RotateCcw,
  ShieldCheck,
  Sparkle,
} from 'lucide-react';

const compressImageFile = (file: File, callback: (dataUrl: string) => void) => {
  const reader = new FileReader();
  reader.onload = (event) => {
    const rawDataUrl = event.target?.result as string;
    if (!rawDataUrl) return;
    if (typeof window !== 'undefined') {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_SIZE = 900;
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
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          const compressed = canvas.toDataURL('image/jpeg', 0.82);
          callback(compressed);
        } else {
          callback(rawDataUrl);
        }
      };
      img.src = rawDataUrl;
    } else {
      callback(rawDataUrl);
    }
  };
  reader.readAsDataURL(file);
};

import { useProducts, Product, FrameSizeConfig, PolaroidSizeConfig } from '@/context/ProductContext';
import { useHamper, HamperItem, HAMPER_PACKAGING_OPTIONS, HAMPER_THEMES, HAMPER_OCCASIONS, HAMPER_BOX_ADDONS } from '@/context/HamperContext';
import { ProductTextCustomizer } from '@/components/customer/ProductTextCustomizer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

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

const POLAROID_SIZES: PolaroidSizeConfig[] = [
  {
    label: "SMALL",
    name: "Small Polaroid (3x4\")",
    priceEach: 8,
    minOrderQty: 1,
    description: "Pocket mini prints • 3x4 inches",
  },
  {
    label: "MEDIUM",
    name: "Medium Polaroid (4x4\")",
    priceEach: 12,
    minOrderQty: 1,
    description: "Square vintage prints • 4x4 inches",
  },
  {
    label: "LARGE",
    name: "Large Polaroid (4x5\")",
    priceEach: 18,
    minOrderQty: 1,
    description: "Jumbo aesthetic print • 4x5 inches",
  },
];

const FRAME_COLORS = [
  { label: "Natural Pine", hex: "#C49A6C" },
  { label: "Classic Black", hex: "#1A1A1A" },
  { label: "Walnut Brown", hex: "#4A2E1B" },
  { label: "Dusty Rose Red", hex: "#9F4D59" },
  { label: "Gallery White", hex: "#FFFFFF" },
];

export default function HamperBuilderPage() {
  const router = useRouter();
  const { products } = useProducts();
  const {
    items,
    customization,
    packagingOptions,
    themes,
    occasions,
    addons,
    selectedPackaging,
    selectedTheme,
    selectedAddons,
    itemCount,
    totalQuantity,
    productsSubtotal,
    packagingPrice,
    addonsTotal,
    hamperTotal,
    addToHamper,
    updateHamperItem,
    removeFromHamper,
    updateItemQuantity,
    updateCustomization,
    toggleAddon,
    clearHamper,
    addHamperToCart,
    isProductInHamper,
    getProductHamperQuantity,
  } = useHamper();

  const [activeStep, setActiveStep] = useState<1 | 2 | 3 | 4>(1);
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [sortBy, setSortBy] = useState<'featured' | 'price-asc' | 'price-desc'>('featured');
  const [isAddingToCart, setIsAddingToCart] = useState<boolean>(false);
  const [isMobilePreviewOpen, setIsMobilePreviewOpen] = useState<boolean>(false);

  // Quick customize modal for individual product inside hamper
  const [quickModalProduct, setQuickModalProduct] = useState<Product | null>(null);
  const [editingHamperItemId, setEditingHamperItemId] = useState<string | null>(null);
  const [modalCustomText, setModalCustomText] = useState<string>('');
  const [selectedFrameSize, setSelectedFrameSize] = useState<string>("4x6 INCH");
  const [selectedGsm, setSelectedGsm] = useState<"180 GSM" | "260 GSM">("180 GSM");
  const [selectedFrameColor, setSelectedFrameColor] = useState<string>("Natural Pine");
  const [selectedPolaroidSize, setSelectedPolaroidSize] = useState<"SMALL" | "MEDIUM" | "LARGE">("SMALL");
  const [selectedPolaroidCount, setSelectedPolaroidCount] = useState<number>(8);
  const [modalPhotoSlots, setModalPhotoSlots] = useState<(string | null)[]>([null]);
  const [isCompressingPhotos, setIsCompressingPhotos] = useState<boolean>(false);
  const singleSlotInputRef = useRef<HTMLInputElement>(null);
  const multiFileInputRef = useRef<HTMLInputElement>(null);
  const slotSpecificInputRef = useRef<HTMLInputElement>(null);
  const singleSlotTargetIndexRef = useRef<number | null>(null);
  const activeSlotRef = useRef<number>(0);

  // Determine Max Capacity for Selected Box
  const boxMaxCapacity = useMemo(() => {
    return selectedPackaging.maxCapacity || 6;
  }, [selectedPackaging]);

  const isAtCapacity = totalQuantity >= boxMaxCapacity;

  // Filter Catalog Products
  const categories = useMemo(() => {
    const set = new Set<string>();
    products.forEach((p) => {
      if (p.category && !p.name.toLowerCase().includes('hamper')) {
        set.add(p.category);
      }
    });
    return ['All', ...Array.from(set)];
  }, [products]);

  const eligibleProducts = useMemo(() => {
    return products.filter((p) => {
      // Exclude generic hamper items themselves
      if (p.name.toLowerCase().includes('hamper') || p.category?.toLowerCase().includes('hamper')) {
        return false;
      }
      if (selectedCategory !== 'All' && p.category !== selectedCategory) {
        return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return p.name.toLowerCase().includes(q) || (p.category && p.category.toLowerCase().includes(q));
      }
      return true;
    });
  }, [products, selectedCategory, searchQuery]);

  // Quick-Load Signature Memory Hamper Preset
  const handleLoadSignaturePreset = () => {
    clearHamper();

    // Box: Natural Pine Keepsake Trunk
    const pineBox = packagingOptions.find((p) => p.id === 'natural-pine') || packagingOptions[0];
    updateCustomization('packagingId', pineBox.id);

    // Item 1: Frame
    const frameProd = products.find((p) => p.id === 'PRD-01' || p.category?.toLowerCase().includes('frame'));
    if (frameProd) {
      addToHamper(
        {
          id: frameProd.id,
          name: frameProd.name,
          category: frameProd.category || 'Frames',
          price: 169,
          originalPrice: 249,
          image: frameProd.images?.[0] || '/images/wooden_frame_main.png',
        },
        {
          selectedOption: '5x7 INCH (180 GSM, Natural Pine)',
          photos: ['/images/wooden_frame_main.png'],
        }
      );
    }

    // Item 2: Polaroids
    const polaroidProd = products.find((p) => p.id === 'PRD-02' || p.category?.toLowerCase().includes('polaroid'));
    if (polaroidProd) {
      addToHamper(
        {
          id: polaroidProd.id,
          name: 'Classic Custom Polaroid Set (9 prints)',
          category: 'Polaroids',
          price: 80,
          originalPrice: 120,
          image: polaroidProd.images?.[0] || '/images/polaroid_set.png',
        },
        {
          selectedOption: 'Small Polaroid (9 prints)',
        }
      );
    }

    // Item 3: LED light or decorative lamp
    const lightProd = products.find((p) => p.id === 'PRD-06' || p.id === 'PRD-04' || p.category?.toLowerCase().includes('led'));
    if (lightProd) {
      addToHamper(
        {
          id: lightProd.id,
          name: lightProd.name,
          category: lightProd.category || 'LED',
          price: lightProd.price,
          originalPrice: lightProd.originalPrice,
          image: lightProd.images?.[0] || '/images/lighting_panda.png',
        },
        {
          selectedOption: 'Standard Ambient',
        }
      );
    }

    // Item 4: Keychain
    const keyChainProd = products.find((p) => p.id === 'PRD-109' || p.name.toLowerCase().includes('key chain'));
    if (keyChainProd) {
      addToHamper(
        {
          id: keyChainProd.id,
          name: keyChainProd.name,
          category: keyChainProd.category || 'Gifts',
          price: keyChainProd.price,
          originalPrice: keyChainProd.originalPrice,
          image: keyChainProd.images?.[0] || '/images/keychain.png',
        },
        {
          selectedOption: 'Double-Sided HD',
        }
      );
    }

    // Default note
    updateCustomization('occasion', 'Anniversary Celebration 💖');
    updateCustomization('giftNote', 'Every memory shared with you is a treasure. Happy Anniversary!');
    updateCustomization('recipientName', 'My Beloved');
    updateCustomization('senderName', 'With Love');

    setActiveStep(2);
  };

  const handleSelectPolaroidCount = (newCount: number) => {
    const validCount = Math.max(1, Math.min(50, newCount));
    setSelectedPolaroidCount(validCount);
    setModalPhotoSlots((prev) => {
      const next = [...prev];
      if (next.length < validCount) {
        while (next.length < validCount) next.push(null);
        return next;
      } else {
        return next.slice(0, validCount);
      }
    });
  };

  const handleMultiplePhotosUpload = (files: FileList | File[]) => {
    if (!files || files.length === 0) return;
    setIsCompressingPhotos(true);
    const fileArray = Array.from(files);

    const currentSlots = [...modalPhotoSlots];
    while (currentSlots.length < selectedPolaroidCount) currentSlots.push(null);

    const firstEmptyIndex = currentSlots.findIndex((s) => s === null);
    const startIdx = firstEmptyIndex === -1 ? 0 : firstEmptyIndex;
    const actualLimit = Math.min(fileArray.length, selectedPolaroidCount);

    let processed = 0;
    fileArray.slice(0, actualLimit).forEach((file, index) => {
      const slotIndex = (startIdx + index) % selectedPolaroidCount;
      compressImageFile(file, (url) => {
        currentSlots[slotIndex] = url;
        processed++;
        if (processed >= actualLimit) {
          setModalPhotoSlots([...currentSlots.slice(0, selectedPolaroidCount)]);
          setIsCompressingPhotos(false);
        }
      });
    });
  };

  const handleSlotPhotoUpload = (slotIndex: number, file: File) => {
    setIsCompressingPhotos(true);
    compressImageFile(file, (url) => {
      setModalPhotoSlots((prev) => {
        const next = [...prev];
        while (next.length <= slotIndex) next.push(null);
        next[slotIndex] = url;
        return next;
      });
      setIsCompressingPhotos(false);
    });
  };

  const handleRemoveSlotPhoto = (slotIndex: number) => {
    setModalPhotoSlots((prev) => {
      const next = [...prev];
      if (slotIndex < next.length) {
        next[slotIndex] = null;
      }
      return next;
    });
  };

  // Open Quick Customize Modal for item
  const handleOpenCustomizeModal = (product: Product, existingHamperItem?: HamperItem) => {
    if (!existingHamperItem && isAtCapacity) {
      alert(`Your selected gift box holds a maximum of ${boxMaxCapacity} items. Remove an item or upgrade box.`);
      return;
    }
    setQuickModalProduct(product);
    setEditingHamperItemId(existingHamperItem?.id || null);
    setModalCustomText(existingHamperItem?.customMessage || '');

    const isFrame = Boolean(
      product.category?.toLowerCase().includes('frame') || product.name?.toLowerCase().includes('frame')
    );
    const isPolaroid = Boolean(
      product.category?.toLowerCase().includes('polaroid') || product.name?.toLowerCase().includes('polaroid')
    );

    if (isFrame) {
      setSelectedFrameSize("4x6 INCH");
      setSelectedGsm("180 GSM");
      setSelectedFrameColor("Natural Pine");
      setModalPhotoSlots(existingHamperItem?.photos && existingHamperItem.photos.length > 0 ? existingHamperItem.photos : [null]);
    } else if (isPolaroid) {
      let initialCount = 8;
      if (existingHamperItem) {
        const match = (existingHamperItem.name + ' ' + (existingHamperItem.selectedOption || '')).match(/(\d+)\s*prints?/i);
        if (match) {
          initialCount = parseInt(match[1], 10);
        } else if (existingHamperItem.photos && existingHamperItem.photos.length > 0) {
          initialCount = existingHamperItem.photos.length;
        }
      }
      setSelectedPolaroidCount(initialCount);
      setSelectedPolaroidSize("SMALL");

      const existingPhotos = existingHamperItem?.photos || [];
      const initialSlots: (string | null)[] = [];
      for (let i = 0; i < initialCount; i++) {
        initialSlots.push(existingPhotos[i] || null);
      }
      setModalPhotoSlots(initialSlots);
    } else {
      setModalPhotoSlots(existingHamperItem?.photos && existingHamperItem.photos.length > 0 ? existingHamperItem.photos : [null]);
    }
  };

  // Save Modal Customization into Hamper
  const handleSaveModalItem = () => {
    if (!quickModalProduct) return;

    const isFrame = Boolean(
      quickModalProduct.category?.toLowerCase().includes('frame') || quickModalProduct.name?.toLowerCase().includes('frame')
    );
    const isPolaroid = Boolean(
      quickModalProduct.category?.toLowerCase().includes('polaroid') || quickModalProduct.name?.toLowerCase().includes('polaroid')
    );

    let optionLabel = 'Standard';
    let effectivePrice = quickModalProduct.price;
    let finalProductName = quickModalProduct.name;

    if (isFrame) {
      const frameConfig = FRAME_SIZES.find((s) => s.label === selectedFrameSize) || FRAME_SIZES[0];
      effectivePrice = selectedGsm === "260 GSM" ? frameConfig.gsm260Price : frameConfig.gsm180Price;
      optionLabel = `${selectedFrameSize} (${selectedGsm}, ${selectedFrameColor})`;
    } else if (isPolaroid) {
      const polConfig = POLAROID_SIZES.find((p) => p.label === selectedPolaroidSize) || POLAROID_SIZES[0];
      effectivePrice = polConfig.priceEach * selectedPolaroidCount;
      optionLabel = `${polConfig.name} (${selectedPolaroidCount} Prints)`;
      const cleanName = quickModalProduct.name.replace(/\(\d+\s*prints?\)/i, '').trim();
      finalProductName = `${cleanName} (${selectedPolaroidCount} prints)`;
    }

    const validPhotos = modalPhotoSlots.filter(Boolean) as string[];

    if (editingHamperItemId) {
      updateHamperItem(editingHamperItemId, {
        name: finalProductName,
        price: effectivePrice,
        selectedOption: optionLabel,
        customMessage: modalCustomText.trim() || undefined,
        photos: validPhotos.length > 0 ? validPhotos : undefined,
        image: validPhotos[0] || quickModalProduct.images?.[0] || '/images/polaroid_set.png',
      });
    } else {
      addToHamper(
        {
          id: quickModalProduct.id,
          name: finalProductName,
          category: quickModalProduct.category || (isPolaroid ? 'Polaroids' : 'Gifts'),
          price: effectivePrice,
          originalPrice: quickModalProduct.originalPrice,
          image: validPhotos[0] || quickModalProduct.images?.[0] || '/images/polaroid_set.png',
        },
        {
          selectedOption: optionLabel,
          customMessage: modalCustomText.trim() || undefined,
          photos: validPhotos.length > 0 ? validPhotos : undefined,
        }
      );
    }

    setQuickModalProduct(null);
    setEditingHamperItemId(null);
  };

  // Add Complete Hamper to Cart
  const handleFinalAddHamperToCart = async () => {
    if (items.length === 0) {
      alert("Please add at least one gift to your keepsake box.");
      return;
    }
    setIsAddingToCart(true);
    try {
      const success = await addHamperToCart();
      if (success) {
        router.push('/cart');
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsAddingToCart(false);
    }
  };

  // Box Visual Theme Styles
  const boxThemeStyles = useMemo(() => {
    switch (selectedPackaging.id) {
      case 'natural-pine':
        return {
          outerBorder: 'linear-gradient(135deg, #D4A373 0%, #BA8957 50%, #C49A6C 100%)',
          boxBg: '#F7EFE6',
          crinkleColor: '#E8D5C4',
          accent: 'Brass Latch • Wax Seal',
        };
      case 'artisan-kraft':
        return {
          outerBorder: 'linear-gradient(135deg, #C2A686 0%, #9F815F 100%)',
          boxBg: '#EFE7DA',
          crinkleColor: '#D8CCA8',
          accent: 'Natural Jute Cord • Botanical Seal',
        };
      case 'dusty-rose-velvet':
        return {
          outerBorder: 'linear-gradient(135deg, #B55B68 0%, #7E3643 100%)',
          boxBg: '#FDF4F5',
          crinkleColor: '#F5D0D6',
          accent: 'Satin Ribbon Bow • Gold Crest',
        };
      default:
        return {
          outerBorder: 'linear-gradient(135deg, #D89A86 0%, #B87A68 100%)',
          boxBg: '#FFF8F2',
          crinkleColor: '#F2E0D5',
          accent: 'Magnetic Closure • Wax Seal',
        };
    }
  }, [selectedPackaging.id]);

  return (
    <div className="min-h-screen bg-[#FFFDFB] text-[#3A2B24] pb-24">
      {/* ========================================================= */}
      {/* 1. HERO HEADER                                            */}
      {/* ========================================================= */}
      <section className="relative overflow-hidden bg-gradient-to-b from-[#FFF5ED] via-[#FFF8F2] to-[#FFFDFB] border-b border-[#EFE6DD] pt-8 pb-7 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="space-y-2.5 text-center md:text-left max-w-2xl">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#FFF8F2] border border-[#D89A86]/40 text-[#D89A86] text-xs font-extrabold shadow-2xs">
              <Sparkles className="h-3.5 w-3.5" />
              <span>Interactive Keepsake Studio • Hand-Packed with Love</span>
            </div>
            <h1 className="font-serif-brand text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-[#3A2B24] leading-tight">
              Build Your Own <span className="italic text-[#D89A86]">Memory Hamper</span>
            </h1>
            <p className="text-sm sm:text-base text-[#6C5C54] leading-relaxed">
              Create a beautiful gift box filled with your favourite memories. Handpick your keepsake trunk, curate personalized gifts, and customize with wax seals and notes.
            </p>
          </div>

          {/* Quick Preset CTA & Summary */}
          <div className="flex flex-col sm:flex-row items-center gap-3">
            <Button
              onClick={handleLoadSignaturePreset}
              variant="outline"
              className="rounded-full border-[#D89A86] text-[#D89A86] hover:bg-[#FFF2EB] text-xs font-bold px-4 py-2.5 shadow-sm flex items-center gap-1.5"
            >
              <Sparkle className="h-4 w-4" />
              <span>Quick-Load Signature Hamper</span>
            </Button>

            <button
              onClick={() => setIsMobilePreviewOpen(true)}
              className="lg:hidden rounded-full bg-[#D89A86] text-white text-xs font-bold px-4 py-2.5 shadow-md flex items-center gap-2"
            >
              <Package className="h-4 w-4" />
              <span>View Live Box ({totalQuantity}/{boxMaxCapacity})</span>
            </button>
          </div>
        </div>

        {/* 4-Step Navigation Tabs */}
        <div className="max-w-7xl mx-auto mt-8 pt-4 border-t border-[#EFE6DD]">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 sm:gap-4">
            {[
              { num: 1, title: 'Step 1: Choose Box', desc: selectedPackaging.name },
              { num: 2, title: 'Step 2: Fill Box', desc: `${totalQuantity} of ${boxMaxCapacity} filled` },
              { num: 3, title: 'Step 3: Personalize', desc: customization.occasion },
              { num: 4, title: 'Step 4: Review', desc: `Total: ₹${hamperTotal}` },
            ].map((step) => {
              const isActive = activeStep === step.num;
              const isPast = activeStep > step.num;
              return (
                <button
                  key={step.num}
                  onClick={() => setActiveStep(step.num as any)}
                  className={cn(
                    'p-2.5 sm:p-3 rounded-2xl text-left border transition-all flex items-center gap-2 sm:gap-3',
                    isActive
                      ? 'bg-white border-[#D89A86] shadow-sm ring-2 ring-[#D89A86]/20'
                      : isPast
                      ? 'bg-[#FFF8F2]/60 border-[#EFE6DD] hover:bg-white'
                      : 'bg-white/60 border-[#EFE6DD] opacity-70 hover:opacity-100'
                  )}
                >
                  <div
                    className={cn(
                      'h-6 w-6 sm:h-7 sm:w-7 rounded-full flex items-center justify-center text-[10px] sm:text-xs font-bold shrink-0',
                      isActive
                        ? 'bg-[#D89A86] text-white'
                        : isPast
                        ? 'bg-emerald-600 text-white'
                        : 'bg-[#EFE6DD] text-[#6C5C54]'
                    )}
                  >
                    {isPast ? <Check className="h-3 sm:h-3.5 w-3 sm:w-3.5 stroke-[3]" /> : step.num}
                  </div>
                  <div className="min-w-0">
                    <span className="block text-[11px] sm:text-xs font-bold text-[#3A2B24] truncate">
                      {step.title}
                    </span>
                    <span className="block text-[10px] sm:text-[11px] text-[#6C5C54] truncate">
                      {step.desc}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </section>

      {/* ========================================================= */}
      {/* 2. MAIN BUILDER GRID (Left: Controls, Right: Live Box)    */}
      {/* ========================================================= */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* ======================================================= */}
          {/* LEFT COLUMN: ACTIVE STEP WORKFLOW (7 COLS)              */}
          {/* ======================================================= */}
          <div className="lg:col-span-7 flex flex-col gap-6">
            {/* ---------------------------------------------------- */}
            {/* STEP 1: CHOOSE YOUR KEEPSAKE GIFT BOX BASE           */}
            {/* ---------------------------------------------------- */}
            {activeStep === 1 && (
              <div className="space-y-4 animate-in fade-in">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="font-serif-brand text-2xl font-bold text-[#3A2B24]">
                      Step 1 — Choose Your Keepsake Gift Box Base
                    </h2>
                    <p className="text-xs text-[#6C5C54] mt-0.5">
                      Select your handcrafted gift container. Every box includes protective crinkle bedding & wax seal.
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {packagingOptions.map((pkg) => {
                    const isSelected = selectedPackaging.id === pkg.id;
                    return (
                      <div
                        key={pkg.id}
                        onClick={() => updateCustomization('packagingId', pkg.id)}
                        className={cn(
                          'p-4 rounded-3xl border cursor-pointer transition-all flex flex-col justify-between bg-white relative overflow-hidden group',
                          isSelected
                            ? 'border-[#D89A86] ring-2 ring-[#D89A86]/25 shadow-md'
                            : 'border-[#EFE6DD] hover:border-[#D89A86]/50 shadow-xs'
                        )}
                      >
                        {pkg.badge && (
                          <div className="absolute top-3 right-3 z-10">
                            <Badge className="bg-[#FFF2EB] text-[#D89A86] border-[#F3DACF] text-[10px] font-bold">
                              {pkg.badge}
                            </Badge>
                          </div>
                        )}

                        <div>
                          <div className="relative h-40 w-full rounded-2xl overflow-hidden bg-[#FAF5F0] mb-3">
                            <img
                              src={pkg.image}
                              alt={pkg.name}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            />
                            {isSelected && (
                              <div className="absolute top-2 left-2 h-6 w-6 rounded-full bg-[#D89A86] text-white flex items-center justify-center shadow-md">
                                <Check className="h-3.5 w-3.5 stroke-[3]" />
                              </div>
                            )}
                          </div>

                          <h3 className="font-serif-brand text-base font-bold text-[#3A2B24]">
                            {pkg.name}
                          </h3>
                          <p className="text-[11px] font-medium text-[#D89A86] mt-0.5">
                            {pkg.tagline}
                          </p>
                          <p className="text-xs text-[#6C5C54] mt-2 line-clamp-2 leading-relaxed">
                            {pkg.description}
                          </p>
                        </div>

                        <div className="mt-4 pt-3 border-t border-[#EFE6DD] flex items-center justify-between">
                          <div>
                            <span className="text-lg font-extrabold text-[#D89A86]">
                              ₹{pkg.price}
                            </span>
                            <span className="text-xs text-[#9E8E84] line-through ml-1.5">
                              ₹{pkg.originalPrice}
                            </span>
                          </div>
                          <span className="text-[11px] font-bold text-[#6C5C54] bg-[#FFF8F2] px-2.5 py-1 rounded-full border border-[#EFE6DD]">
                            {pkg.capacityText}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="flex justify-end pt-4">
                  <Button
                    onClick={() => setActiveStep(2)}
                    className="btn-pixello-primary rounded-full px-6 py-2.5 text-xs font-bold shadow-md flex items-center gap-2"
                  >
                    <span>Continue to Fill Your Box</span>
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}

            {/* ---------------------------------------------------- */}
            {/* STEP 2: FILL YOUR GIFT BOX                           */}
            {/* ---------------------------------------------------- */}
            {activeStep === 2 && (
              <div className="space-y-4 animate-in fade-in">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <h2 className="font-serif-brand text-2xl font-bold text-[#3A2B24]">
                      Step 2 — Fill Your Gift Box
                    </h2>
                    <p className="text-xs text-[#6C5C54] mt-0.5">
                      Add actual handcrafted products from the PixelloStore catalog.
                    </p>
                  </div>

                  {/* Live Capacity Pill */}
                  <div
                    className={cn(
                      'px-3.5 py-1.5 rounded-full text-xs font-bold flex items-center gap-2 self-start sm:self-auto border',
                      isAtCapacity
                        ? 'bg-rose-50 text-rose-700 border-rose-200'
                        : 'bg-emerald-50 text-emerald-800 border-emerald-200'
                    )}
                  >
                    <Package className="h-4 w-4" />
                    <span>
                      Box Capacity: {totalQuantity} / {boxMaxCapacity} Items
                    </span>
                  </div>
                </div>

                {/* Filter and Search Bar */}
                <div className="bg-white p-3 rounded-2xl border border-[#EFE6DD] shadow-2xs flex flex-wrap items-center justify-between gap-2.5">
                  <div className="flex items-center gap-1.5 overflow-x-auto pb-1 max-w-full">
                    {categories.map((cat) => (
                      <button
                        key={cat}
                        onClick={() => setSelectedCategory(cat)}
                        className={cn(
                          'px-3 py-1 rounded-full text-xs font-bold transition-all whitespace-nowrap',
                          selectedCategory === cat
                            ? 'bg-[#D89A86] text-white shadow-2xs'
                            : 'bg-[#FFF8F2] text-[#6C5C54] hover:bg-[#FFF2EB]'
                        )}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>

                  <div className="relative w-full sm:w-48">
                    <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-[#9E8E84]" />
                    <Input
                      type="text"
                      placeholder="Search gifts..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-8 h-8 text-xs rounded-full border-[#EFE6DD]"
                    />
                  </div>
                </div>

                {/* Product Catalog Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3.5">
                  {eligibleProducts.map((p) => {
                    const inHamperQty = getProductHamperQuantity(p.id);
                    return (
                      <div
                        key={p.id}
                        className="p-3 rounded-2xl border border-[#EFE6DD] bg-white shadow-xs hover:border-[#D89A86]/50 transition-all flex flex-col justify-between"
                      >
                        <div>
                          <div className="relative h-28 w-full rounded-xl overflow-hidden bg-[#FAF5F0] mb-2.5">
                            <img
                              src={p.images?.[0] || '/images/wooden_frame_main.png'}
                              alt={p.name}
                              className="w-full h-full object-cover"
                            />
                            {inHamperQty > 0 && (
                              <div className="absolute top-1.5 right-1.5 bg-[#D89A86] text-white text-[10px] font-extrabold px-2 py-0.5 rounded-full shadow-sm">
                                {inHamperQty} in Box
                              </div>
                            )}
                          </div>

                          <h4 className="text-xs font-bold text-[#3A2B24] line-clamp-1">{p.name}</h4>
                          <span className="text-[10px] text-[#6C5C54] block mt-0.5">
                            {p.category}
                          </span>
                        </div>

                        <div className="mt-3 pt-2 border-t border-[#EFE6DD] flex items-center justify-between">
                          <span className="text-sm font-extrabold text-[#D89A86]">
                            ₹{p.price}
                          </span>

                          <Button
                            size="sm"
                            onClick={() => handleOpenCustomizeModal(p)}
                            disabled={isAtCapacity && inHamperQty === 0}
                            className="btn-pixello-primary h-7 px-2.5 text-[11px] font-bold rounded-full"
                          >
                            <Plus className="h-3 w-3 mr-1" />
                            Add to Box
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="flex items-center justify-between pt-4">
                  <Button
                    variant="outline"
                    onClick={() => setActiveStep(1)}
                    className="rounded-full text-xs font-bold border-[#EFE6DD]"
                  >
                    Back to Box Base
                  </Button>
                  <Button
                    onClick={() => setActiveStep(3)}
                    disabled={items.length === 0}
                    className="btn-pixello-primary rounded-full px-6 py-2.5 text-xs font-bold shadow-md flex items-center gap-2"
                  >
                    <span>Personalize Hamper</span>
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}

            {/* ---------------------------------------------------- */}
            {/* STEP 3: PERSONALIZE YOUR HAMPER                      */}
            {/* ---------------------------------------------------- */}
            {activeStep === 3 && (
              <div className="space-y-5 animate-in fade-in">
                <div>
                  <h2 className="font-serif-brand text-2xl font-bold text-[#3A2B24]">
                    Step 3 — Personalize Your Hamper
                  </h2>
                  <p className="text-xs text-[#6C5C54] mt-0.5">
                    Add a heartfelt message, pick wrapping colors, and include celebratory touches.
                  </p>
                </div>

                {/* Recipient & Sender */}
                <div className="bg-white p-5 rounded-3xl border border-[#EFE6DD] shadow-sm grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-bold text-[#3A2B24] block mb-1">
                      Recipient Name (Who is this for?)
                    </label>
                    <Input
                      type="text"
                      placeholder="e.g. Sarah Jenkins"
                      value={customization.recipientName}
                      onChange={(e) => updateCustomization('recipientName', e.target.value)}
                      className="rounded-xl border-[#EFE6DD] text-xs"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-[#3A2B24] block mb-1">
                      Sender Name (From)
                    </label>
                    <Input
                      type="text"
                      placeholder="e.g. David & Family"
                      value={customization.senderName}
                      onChange={(e) => updateCustomization('senderName', e.target.value)}
                      className="rounded-xl border-[#EFE6DD] text-xs"
                    />
                  </div>
                </div>

                {/* Occasion Selection */}
                <div className="bg-white p-5 rounded-3xl border border-[#EFE6DD] shadow-sm">
                  <label className="text-xs font-bold text-[#3A2B24] block mb-2.5">
                    Select Gift Occasion
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {occasions.map((occ) => {
                      const isSel = customization.occasion === occ;
                      return (
                        <button
                          key={occ}
                          onClick={() => updateCustomization('occasion', occ)}
                          className={cn(
                            'px-3.5 py-1.5 rounded-full text-xs font-bold border transition-all',
                            isSel
                              ? 'bg-[#D89A86] text-white border-[#D89A86] shadow-2xs'
                              : 'bg-[#FFF8F2] text-[#6C5C54] border-[#EFE6DD] hover:bg-white'
                          )}
                        >
                          {occ}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Wax-Sealed Handwritten Greeting Note */}
                <div className="bg-white p-5 rounded-3xl border border-[#EFE6DD] shadow-sm">
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-xs font-bold text-[#3A2B24] flex items-center gap-1.5">
                      <Pencil className="h-3.5 w-3.5 text-[#D89A86]" />
                      Personalized Wax-Sealed Note (Included)
                    </label>
                    <span className="text-[10px] text-[#9E8E84]">Printed on parchment</span>
                  </div>
                  <textarea
                    rows={3}
                    placeholder="Write your special message here... (e.g. Wishing you a day filled with laughter and joyful moments. Happy Birthday!)"
                    value={customization.giftNote}
                    onChange={(e) => updateCustomization('giftNote', e.target.value)}
                    className="w-full rounded-2xl border border-[#EFE6DD] p-3 text-xs text-[#3A2B24] focus:ring-1 focus:ring-[#D89A86] outline-none resize-none font-medium leading-relaxed bg-[#FFFDFB]"
                  />
                </div>

                {/* Packaging Theme Colors */}
                <div className="bg-white p-5 rounded-3xl border border-[#EFE6DD] shadow-sm">
                  <label className="text-xs font-bold text-[#3A2B24] block mb-2">
                    Packaging Ribbon & Crinkle Bedding Color
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                    {themes.map((th) => {
                      const isSel = selectedTheme.id === th.id;
                      return (
                        <div
                          key={th.id}
                          onClick={() => updateCustomization('themeId', th.id)}
                          className={cn(
                            'p-2.5 rounded-2xl border cursor-pointer transition-all flex items-center gap-2.5',
                            isSel
                              ? 'border-[#D89A86] bg-[#FFF8F2] ring-2 ring-[#D89A86]/20'
                              : 'border-[#EFE6DD] bg-white hover:border-[#D89A86]/40'
                          )}
                        >
                          <div
                            style={{ backgroundColor: th.hex }}
                            className="h-6 w-6 rounded-full border border-black/15 shadow-inner shrink-0"
                          />
                          <span className="text-xs font-bold text-[#3A2B24] truncate">
                            {th.name}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Luxury Add-Ons */}
                <div className="bg-white p-5 rounded-3xl border border-[#EFE6DD] shadow-sm">
                  <label className="text-xs font-bold text-[#3A2B24] block mb-3">
                    Optional Luxury Box Add-Ons
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {addons.map((add) => {
                      const isChecked = selectedAddons.includes(add.id);
                      return (
                        <div
                          key={add.id}
                          onClick={() => toggleAddon(add.id)}
                          className={cn(
                            'p-3 rounded-2xl border cursor-pointer transition-all flex items-start gap-3',
                            isChecked
                              ? 'border-[#D89A86] bg-[#FFF8F2] ring-1 ring-[#D89A86]'
                              : 'border-[#EFE6DD] bg-white hover:border-[#D89A86]/40'
                          )}
                        >
                          <div
                            className={cn(
                              'h-5 w-5 rounded-lg border mt-0.5 flex items-center justify-center shrink-0',
                              isChecked ? 'bg-[#D89A86] border-[#D89A86] text-white' : 'border-[#EFE6DD]'
                            )}
                          >
                            {isChecked && <Check className="h-3 w-3 stroke-[3]" />}
                          </div>
                          <div className="min-w-0">
                            <span className="text-xs font-bold text-[#3A2B24] block truncate">
                              {add.name}
                            </span>
                            <span className="text-[11px] text-[#6C5C54] line-clamp-1">
                              {add.description}
                            </span>
                            <span className="text-xs font-extrabold text-[#D89A86] mt-1 block">
                              +₹{add.price}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="flex items-center justify-between pt-4">
                  <Button
                    variant="outline"
                    onClick={() => setActiveStep(2)}
                    className="rounded-full text-xs font-bold border-[#EFE6DD]"
                  >
                    Back to Fill Box
                  </Button>
                  <Button
                    onClick={() => setActiveStep(4)}
                    className="btn-pixello-primary rounded-full px-6 py-2.5 text-xs font-bold shadow-md flex items-center gap-2"
                  >
                    <span>Review & Finalize Hamper</span>
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}

            {/* ---------------------------------------------------- */}
            {/* STEP 4: REVIEW YOUR HAMPER                           */}
            {/* ---------------------------------------------------- */}
            {activeStep === 4 && (
              <div className="space-y-4 animate-in fade-in">
                <div>
                  <h2 className="font-serif-brand text-2xl font-bold text-[#3A2B24]">
                    Step 4 — Review Your Hamper
                  </h2>
                  <p className="text-xs text-[#6C5C54] mt-0.5">
                    Verify all curated gifts, box container, and personal greeting note before adding to cart.
                  </p>
                </div>

                {/* Itemized Review List */}
                <div className="bg-white p-5 rounded-3xl border border-[#EFE6DD] shadow-sm space-y-4">
                  <div className="flex items-center justify-between pb-3 border-b border-[#EFE6DD]">
                    <div className="flex items-center gap-3">
                      <div className="h-12 w-12 rounded-xl overflow-hidden bg-[#FAF5F0] border border-[#EFE6DD]">
                        <img src={selectedPackaging.image} alt={selectedPackaging.name} className="w-full h-full object-cover" />
                      </div>
                      <div>
                        <span className="text-[10px] font-bold text-[#D89A86] uppercase tracking-wider block">GIFT BOX BASE</span>
                        <h4 className="text-sm font-bold text-[#3A2B24]">{selectedPackaging.name}</h4>
                      </div>
                    </div>
                    <span className="text-sm font-extrabold text-[#D89A86]">₹{selectedPackaging.price}</span>
                  </div>

                  {/* Products inside box */}
                  <div className="space-y-2.5">
                    <span className="text-xs font-bold text-[#6C5C54] block">Curated Gifts ({items.length} unique items):</span>
                    {items.map((it) => (
                      <div key={it.id} className="p-3 rounded-2xl bg-[#FFFBF7] border border-[#EFE6DD] flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="h-12 w-12 rounded-xl overflow-hidden bg-white border border-[#EFE6DD] shrink-0">
                            <img src={it.photos?.[0] || it.image} alt={it.name} className="w-full h-full object-cover" />
                          </div>
                          <div className="min-w-0">
                            <h5 className="text-xs font-bold text-[#3A2B24] truncate">{it.name}</h5>
                            <span className="text-[11px] text-[#6C5C54] block truncate">{it.selectedOption || 'Standard'}</span>
                            <div className="flex items-center gap-2 mt-0.5">
                              <span className="text-[10px] text-[#D89A86] font-bold">Qty: {it.quantity}</span>
                              {it.photos && it.photos.length > 0 && (
                                <span className="text-[9px] bg-[#FFF0E8] text-[#D89A86] border border-[#D89A86]/30 px-1.5 py-0.2 rounded-md font-extrabold">
                                  📸 {it.photos.length} Photo{it.photos.length > 1 ? 's' : ''} Attached
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <span className="text-xs font-extrabold text-[#3A2B24]">₹{it.price * it.quantity}</span>
                          <button
                            type="button"
                            onClick={() => {
                              const origProd = products.find((p) => p.id === it.productId) || {
                                id: it.productId,
                                name: it.name,
                                category: it.category,
                                price: it.price,
                                images: [it.image],
                              } as Product;
                              handleOpenCustomizeModal(origProd, it);
                            }}
                            className="text-[#D89A86] hover:text-[#C47E6A] p-1.5 bg-[#FFF0E8] rounded-lg border border-[#D89A86]/20 text-[10px] font-bold flex items-center gap-1 cursor-pointer"
                            title="Edit Item & Photos"
                          >
                            <Edit2 className="h-3 w-3" />
                            <span className="hidden sm:inline">Edit</span>
                          </button>
                          <button
                            onClick={() => removeFromHamper(it.id)}
                            className="text-rose-500 hover:text-rose-700 p-1.5 bg-rose-50 rounded-lg border border-rose-200 cursor-pointer"
                            title="Remove from Box"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Add-ons summary */}
                  {selectedAddons.length > 0 && (
                    <div className="pt-3 border-t border-[#EFE6DD] space-y-1.5">
                      <span className="text-xs font-bold text-[#6C5C54] block">Luxury Add-ons:</span>
                      {addons
                        .filter((a) => selectedAddons.includes(a.id))
                        .map((a) => (
                          <div key={a.id} className="flex justify-between text-xs text-[#3A2B24]">
                            <span>{a.name}</span>
                            <span className="font-bold text-[#D89A86]">+₹{a.price}</span>
                          </div>
                        ))}
                    </div>
                  )}

                  {/* Personal note preview */}
                  {customization.giftNote && (
                    <div className="p-3.5 rounded-2xl bg-[#FFF8F2] border border-[#EFE6DD] text-xs">
                      <span className="text-[10px] font-bold text-[#D89A86] uppercase tracking-wider block mb-1">
                        WAX-SEALED CARD MESSAGE:
                      </span>
                      <p className="italic text-[#5A463B] font-medium leading-relaxed">
                        "{customization.giftNote}"
                      </p>
                      <span className="text-[11px] font-bold text-[#3A2B24] block mt-1">
                        — {customization.senderName || 'Anonymous'} to {customization.recipientName || 'Recipient'}
                      </span>
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-between pt-4">
                  <Button
                    variant="outline"
                    onClick={() => setActiveStep(3)}
                    className="rounded-full text-xs font-bold border-[#EFE6DD]"
                  >
                    Back to Personalize
                  </Button>

                  <Button
                    onClick={handleFinalAddHamperToCart}
                    disabled={isAddingToCart || items.length === 0}
                    className="btn-pixello-primary rounded-full px-8 py-3 text-sm font-bold shadow-md flex items-center gap-2"
                  >
                    <ShoppingBag className="h-4 w-4" />
                    <span>{isAddingToCart ? 'Adding Hamper to Cart...' : `Add Hamper to Cart • ₹${hamperTotal}`}</span>
                  </Button>
                </div>
              </div>
            )}
          </div>

          {/* ======================================================= */}
          {/* RIGHT COLUMN: LIVE KEEPSAKE BOX PREVIEW (5 COLS)         */}
          {/* ======================================================= */}
          <div className="lg:col-span-5 hidden lg:block sticky top-20">
            <div className="bg-white rounded-3xl p-6 border border-[#EFE6DD] shadow-xl flex flex-col gap-4">
              {/* Header */}
              <div className="flex items-center justify-between border-b border-[#EFE6DD] pb-3">
                <div>
                  <span className="text-[10px] font-extrabold text-[#D89A86] uppercase tracking-wider block">
                    LIVE KEEPSAKE BOX PREVIEW
                  </span>
                  <h3 className="font-serif-brand text-lg font-bold text-[#3A2B24]">
                    {selectedPackaging.name}
                  </h3>
                </div>

                <Badge className="bg-[#FFF2EB] text-[#D89A86] border-[#F3DACF] font-bold text-[10px]">
                  {totalQuantity} / {boxMaxCapacity} Slots Filled
                </Badge>
              </div>

              {/* Realistic Visual Box Container Simulation */}
              <div
                style={{
                  background: boxThemeStyles.outerBorder,
                }}
                className="relative rounded-2xl p-4 shadow-xl border-4 border-black/10 flex flex-col justify-between overflow-hidden min-h-[360px]"
              >
                {/* Brass Latch / Top Ribbon Visual */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 z-10 bg-amber-200 border border-amber-400 text-amber-900 text-[9px] font-extrabold px-3 py-0.5 rounded-b-md shadow-xs flex items-center gap-1">
                  <span>★ {boxThemeStyles.accent}</span>
                </div>

                {/* Interior Crinkle Paper Bedding */}
                <div
                  style={{
                    backgroundColor: boxThemeStyles.boxBg,
                  }}
                  className="w-full h-full rounded-xl p-3 shadow-inner border border-black/10 flex flex-col justify-between"
                >
                  {/* Items Slot Arrangement Grid */}
                  <div className="grid grid-cols-2 gap-2.5">
                    {/* Render actual selected items */}
                    {items.map((it) => (
                      <div
                        key={it.id}
                        className="bg-white/95 backdrop-blur-xs rounded-xl p-2 border border-[#EFE6DD] shadow-sm flex items-center gap-2 relative group"
                      >
                        <div className="h-10 w-10 rounded-lg overflow-hidden bg-[#FAF5F0] shrink-0 border border-[#EFE6DD]">
                          <img
                            src={it.photos?.[0] || it.image}
                            alt={it.name}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div
                          className="min-w-0 flex-1 cursor-pointer"
                          onClick={() => {
                            const origProd = products.find((p) => p.id === it.productId) || {
                              id: it.productId,
                              name: it.name,
                              category: it.category,
                              price: it.price,
                              images: [it.image],
                            } as Product;
                            handleOpenCustomizeModal(origProd, it);
                          }}
                        >
                          <p className="text-[11px] font-bold text-[#3A2B24] truncate hover:text-[#D89A86]">{it.name}</p>
                          <div className="flex items-center gap-1.5">
                            <span className="text-[10px] text-[#D89A86] font-extrabold">₹{it.price}</span>
                            {it.photos && it.photos.length > 0 && (
                              <span className="text-[9px] text-[#6C5C54] font-semibold">
                                • {it.photos.length} photos
                              </span>
                            )}
                          </div>
                        </div>
                        <button
                          onClick={() => removeFromHamper(it.id)}
                          className="text-rose-500 opacity-60 hover:opacity-100 p-1 shrink-0"
                          title="Remove item"
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    ))}

                    {/* Render empty cushion slots */}
                    {Array.from({ length: Math.max(0, boxMaxCapacity - totalQuantity) }).map((_, i) => (
                      <div
                        key={`empty-${i}`}
                        onClick={() => setActiveStep(2)}
                        className="border-2 border-dashed border-[#D89A86]/35 rounded-xl p-3 flex flex-col items-center justify-center text-center cursor-pointer hover:bg-white/40 transition-colors h-14"
                      >
                        <Plus className="h-4 w-4 text-[#D89A86]" />
                        <span className="text-[10px] font-bold text-[#6C5C54]">
                          Empty Slot ({totalQuantity + i + 1} of {boxMaxCapacity})
                        </span>
                      </div>
                    ))}
                  </div>

                  {/* Box Bottom Crinkle Filler Accent */}
                  <div className="mt-3 pt-2 border-t border-black/5 flex items-center justify-between text-[10px] text-[#6C5C54]">
                    <span>Bedding: {selectedTheme.name}</span>
                    <span className="font-bold text-[#3A2B24]">Wax Sealed Archival Box</span>
                  </div>
                </div>
              </div>

              {/* Itemized Price Summary */}
              <div className="bg-[#FFFBF7] p-3.5 rounded-2xl border border-[#EFE6DD] space-y-1.5 text-xs">
                <div className="flex justify-between text-[#6C5C54]">
                  <span>Keepsake Box ({selectedPackaging.name}):</span>
                  <span className="font-bold text-[#3A2B24]">₹{packagingPrice}</span>
                </div>
                <div className="flex justify-between text-[#6C5C54]">
                  <span>Curated Gifts Subtotal:</span>
                  <span className="font-bold text-[#3A2B24]">₹{productsSubtotal}</span>
                </div>
                {addonsTotal > 0 && (
                  <div className="flex justify-between text-[#6C5C54]">
                    <span>Luxury Add-Ons:</span>
                    <span className="font-bold text-[#3A2B24]">₹{addonsTotal}</span>
                  </div>
                )}
                <div className="flex justify-between text-[#6C5C54]">
                  <span>Doorstep Delivery:</span>
                  <span className="font-bold text-emerald-700">FREE</span>
                </div>

                <div className="pt-2 border-t border-[#EFE6DD] flex justify-between items-baseline">
                  <span className="font-bold text-sm text-[#3A2B24]">Total Hamper:</span>
                  <span className="text-xl font-extrabold text-[#D89A86]">₹{hamperTotal}</span>
                </div>
              </div>

              {/* Add Hamper to Cart Button */}
              <Button
                onClick={handleFinalAddHamperToCart}
                disabled={isAddingToCart || items.length === 0}
                className="btn-pixello-primary w-full h-12 rounded-full font-bold text-xs sm:text-sm shadow-md flex items-center justify-center gap-2"
              >
                <ShoppingBag className="h-4 w-4" />
                <span>
                  {isAddingToCart ? 'Adding Hamper to Cart...' : `Add Hamper to Cart • ₹${hamperTotal}`}
                </span>
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================= */}
      {/* 3. PRODUCT CONFIGURATION MODAL (For Frames & Polaroids)   */}
      {/* ========================================================= */}
      {quickModalProduct && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 border border-[#EFE6DD] shadow-2xl relative max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setQuickModalProduct(null)}
              className="absolute top-4 right-4 h-8 w-8 rounded-full bg-[#FAF5F0] text-[#6C5C54] hover:text-[#3A2B24] flex items-center justify-center"
            >
              <X className="h-4 w-4" />
            </button>

            {(() => {
              const isModalPolaroid = Boolean(
                quickModalProduct.category?.toLowerCase().includes('polaroid') ||
                quickModalProduct.name?.toLowerCase().includes('polaroid')
              );
              const isModalFrame = Boolean(
                quickModalProduct.category?.toLowerCase().includes('frame') ||
                quickModalProduct.name?.toLowerCase().includes('frame')
              );

              const currentPolConfig = POLAROID_SIZES.find((p) => p.label === selectedPolaroidSize) || POLAROID_SIZES[0];
              const polaroidTotalPrice = currentPolConfig.priceEach * selectedPolaroidCount;
              const uploadedCount = modalPhotoSlots.filter(Boolean).length;
              const cleanModalTitle = quickModalProduct.name.replace(/\(\d+\s*prints?\)/i, '').trim();

              return (
                <>
                  <div className="flex items-center gap-3 mb-4">
                    <div className="h-14 w-14 rounded-2xl overflow-hidden bg-[#FAF5F0] border border-[#EFE6DD] shrink-0">
                      <img
                        src={modalPhotoSlots.find(Boolean) || quickModalProduct.images?.[0] || '/images/wooden_frame_main.png'}
                        alt={quickModalProduct.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div>
                      <h3 className="font-serif-brand font-bold text-base text-[#3A2B24]">
                        Configure {isModalPolaroid ? `${cleanModalTitle} (${selectedPolaroidCount} prints)` : quickModalProduct.name}
                      </h3>
                      <span className="text-xs font-bold text-[#D89A86]">
                        For your {selectedPackaging.name} {isModalPolaroid ? `• ${selectedPolaroidCount} Prints Pack` : ''}
                      </span>
                    </div>
                  </div>

                  {/* Frame specific size selector */}
                  {isModalFrame && (
                    <div className="space-y-3 mb-4">
                      <label className="text-xs font-bold text-[#3A2B24] block">Frame Size:</label>
                      <div className="grid grid-cols-2 gap-2">
                        {FRAME_SIZES.map((sz) => (
                          <button
                            key={sz.label}
                            type="button"
                            onClick={() => setSelectedFrameSize(sz.label)}
                            className={cn(
                              'p-2.5 rounded-xl border text-left text-xs font-bold transition-all cursor-pointer',
                              selectedFrameSize === sz.label
                                ? 'border-[#D89A86] bg-[#FFF8F2] text-[#3A2B24]'
                                : 'border-[#EFE6DD] text-[#6C5C54]'
                            )}
                          >
                            {sz.name} — ₹{selectedGsm === "260 GSM" ? sz.gsm260Price : sz.gsm180Price}
                          </button>
                        ))}
                      </div>

                      <label className="text-xs font-bold text-[#3A2B24] block mt-2">Finish Color:</label>
                      <div className="flex flex-wrap gap-2">
                        {FRAME_COLORS.map((c) => (
                          <button
                            key={c.label}
                            type="button"
                            onClick={() => setSelectedFrameColor(c.label)}
                            className={cn(
                              'px-3 py-1 rounded-full text-xs font-bold border transition-all cursor-pointer',
                              selectedFrameColor === c.label
                                ? 'border-[#D89A86] bg-[#D89A86] text-white'
                                : 'border-[#EFE6DD] text-[#6C5C54]'
                            )}
                          >
                            {c.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* POLAROID CONFIGURATION: COUNT, SIZE & MULTI-PHOTO UPLOAD */}
                  {isModalPolaroid && (
                    <div className="space-y-4 mb-5">
                      {/* 1. SELECT NUMBER OF PHOTOS / PRINTS */}
                      <div className="p-4 rounded-2xl bg-[#FFF8F2] border border-[#EFE6DD] space-y-3">
                        <div className="flex items-center justify-between flex-wrap gap-2">
                          <div>
                            <div className="flex items-center gap-2 flex-wrap">
                              <label className="text-xs font-black uppercase tracking-wider text-[#3A2B24] block">
                                Number of Polaroid Photos / Prints:
                              </label>
                              <span className="text-[10px] bg-emerald-100 text-emerald-800 font-extrabold px-2.5 py-0.5 rounded-full border border-emerald-300">
                                ✨ No Minimum Quantity
                              </span>
                            </div>
                            <span className="text-[11px] text-[#6C5C54]">
                              Choose any quantity you like for this gift box (from 1 print onwards)
                            </span>
                          </div>
                          <span className="text-xs font-black text-white bg-[#D89A86] px-3 py-1 rounded-full shadow-2xs">
                            {selectedPolaroidCount} Print{selectedPolaroidCount > 1 ? "s" : ""} Pack
                          </span>
                        </div>

                        {/* Preset options starting from 1: 1, 2, 4, 6, 8, 10, 12, 16 */}
                        <div className="grid grid-cols-4 sm:grid-cols-8 gap-1.5">
                          {[1, 2, 4, 6, 8, 10, 12, 16].map((cnt) => (
                            <button
                              key={cnt}
                              type="button"
                              onClick={() => handleSelectPolaroidCount(cnt)}
                              className={cn(
                                "py-2 px-1 rounded-xl text-xs font-extrabold border transition-all text-center cursor-pointer",
                                selectedPolaroidCount === cnt
                                  ? "border-[#D89A86] bg-[#D89A86] text-white shadow-xs scale-[1.02]"
                                  : "border-[#EFE6DD] bg-white text-[#6C5C54] hover:border-[#D89A86]/50 hover:text-[#3A2B24]"
                              )}
                            >
                              {cnt} {cnt === 1 ? "Pic" : "Pics"}
                            </button>
                          ))}
                        </div>

                        {/* Custom count stepper + direct input */}
                        <div className="flex items-center justify-between pt-2 border-t border-[#EFE6DD]/70 text-xs font-bold text-[#3A2B24]">
                          <span className="text-[11px] text-[#6C5C54]">Custom quantity (any number):</span>
                          <div className="flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => handleSelectPolaroidCount(selectedPolaroidCount - 1)}
                              disabled={selectedPolaroidCount <= 1}
                              className="h-7 w-7 rounded-lg bg-white border border-[#EFE6DD] hover:border-[#D89A86] flex items-center justify-center font-bold text-sm text-[#3A2B24] disabled:opacity-40 cursor-pointer"
                              title="Decrease count"
                            >
                              -
                            </button>
                            <input
                              type="number"
                              min={1}
                              max={50}
                              value={selectedPolaroidCount}
                              onChange={(e) => {
                                const val = parseInt(e.target.value, 10);
                                if (!isNaN(val)) handleSelectPolaroidCount(val);
                              }}
                              className="w-12 h-7 text-center font-black text-xs border border-[#EFE6DD] rounded-lg text-[#3A2B24] bg-white focus:outline-none focus:ring-1 focus:ring-[#D89A86]"
                            />
                            <button
                              type="button"
                              onClick={() => handleSelectPolaroidCount(selectedPolaroidCount + 1)}
                              disabled={selectedPolaroidCount >= 50}
                              className="h-7 w-7 rounded-lg bg-white border border-[#EFE6DD] hover:border-[#D89A86] flex items-center justify-center font-bold text-sm text-[#3A2B24] disabled:opacity-40 cursor-pointer"
                              title="Increase count"
                            >
                              +
                            </button>
                            <span className="text-[11px] text-[#6C5C54] ml-1">print{selectedPolaroidCount > 1 ? "s" : ""}</span>
                          </div>
                        </div>
                      </div>

                      {/* 2. SELECT POLAROID SIZE */}
                      <div className="space-y-2">
                        <label className="text-xs font-bold text-[#3A2B24] block">
                          Polaroid Size Style:
                        </label>
                        <div className="grid grid-cols-3 gap-2">
                          {POLAROID_SIZES.map((pol) => {
                            const isSel = selectedPolaroidSize === pol.label;
                            return (
                              <button
                                key={pol.label}
                                type="button"
                                onClick={() => setSelectedPolaroidSize(pol.label as any)}
                                className={cn(
                                  "p-2.5 rounded-xl border text-left transition-all cursor-pointer",
                                  isSel
                                    ? "border-[#D89A86] bg-[#FFF8F2] ring-2 ring-[#D89A86]/20 font-bold"
                                    : "border-[#EFE6DD] bg-white hover:border-[#D89A86]/40"
                                )}
                              >
                                <span className="font-bold text-xs block text-[#3A2B24] truncate">
                                  {pol.name}
                                </span>
                                <span className="text-[11px] text-[#D89A86] font-black block mt-0.5">
                                  ₹{pol.priceEach}/print
                                </span>
                                <span className="text-[10px] text-[#6C5C54] block truncate">
                                  Total: ₹{pol.priceEach * selectedPolaroidCount}
                                </span>
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      {/* 3. MULTI-PHOTO UPLOAD AREA */}
                      <div className="space-y-3">
                        <div className="flex items-center justify-between flex-wrap gap-2">
                          <div>
                            <label className="text-xs font-bold text-[#3A2B24] flex items-center gap-1.5">
                              <Camera className="h-4 w-4 text-[#D89A86]" />
                              <span>Upload Your {selectedPolaroidCount} Photo{selectedPolaroidCount > 1 ? "s" : ""}:</span>
                            </label>
                            <span className="text-[10px] text-[#6C5C54]">
                              Archival photo paper • Vintage white borders
                            </span>
                          </div>
                          <span className={cn(
                            "text-[11px] font-extrabold px-3 py-1 rounded-full border shadow-2xs",
                            uploadedCount === selectedPolaroidCount
                              ? "bg-emerald-50 text-emerald-800 border-emerald-300"
                              : "bg-amber-50 text-amber-900 border-amber-300"
                          )}>
                            {uploadedCount} / {selectedPolaroidCount} Uploaded
                          </span>
                        </div>

                        {/* Batch Multi-File input */}
                        <input
                          type="file"
                          ref={multiFileInputRef}
                          multiple
                          accept="image/jpeg,image/png,image/webp,image/jpg"
                          className="hidden"
                          onChange={(e) => {
                            if (e.target.files) {
                              handleMultiplePhotosUpload(e.target.files);
                            }
                          }}
                        />

                        {/* Single slot targeted input */}
                        <input
                          type="file"
                          ref={slotSpecificInputRef}
                          accept="image/jpeg,image/png,image/webp,image/jpg"
                          className="hidden"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file && singleSlotTargetIndexRef.current !== null) {
                              handleSlotPhotoUpload(singleSlotTargetIndexRef.current, file);
                            }
                          }}
                        />

                        {/* Action buttons for batch upload */}
                        <button
                          type="button"
                          onClick={() => multiFileInputRef.current?.click()}
                          disabled={isCompressingPhotos}
                          className="w-full btn-pixello-primary py-3 px-4 rounded-2xl text-xs font-extrabold flex items-center justify-center gap-2 shadow-xs cursor-pointer hover:scale-[1.01] transition-transform"
                        >
                          <Upload className="h-4 w-4" />
                          <span>
                            {isCompressingPhotos
                              ? "Processing & Securing Photos..."
                              : selectedPolaroidCount === 1
                                ? "Click to Upload Photo"
                                : `Upload All ${selectedPolaroidCount} Photos at Once (Multi-Select)`}
                          </span>
                        </button>

                        {/* Individual Photo Slots Grid */}
                        <div className="grid grid-cols-4 gap-2.5 max-h-64 overflow-y-auto p-2 border border-[#EFE6DD] rounded-2xl bg-[#FFFDFB]">
                          {modalPhotoSlots.map((photoUrl, sIdx) => (
                            <div
                              key={sIdx}
                              className={cn(
                                "relative aspect-[3/4] rounded-xl overflow-hidden border transition-all flex flex-col items-center justify-center text-center p-1 group shadow-2xs",
                                photoUrl
                                  ? "border-[#D89A86] bg-white ring-1 ring-[#D89A86]/30"
                                  : "border-dashed border-[#D89A86]/50 bg-[#FFF9F6] hover:border-[#D89A86] hover:bg-white cursor-pointer"
                              )}
                              onClick={() => {
                                if (!photoUrl) {
                                  singleSlotTargetIndexRef.current = sIdx;
                                  slotSpecificInputRef.current?.click();
                                }
                              }}
                            >
                              {photoUrl ? (
                                <>
                                  <img
                                    src={photoUrl}
                                    alt={`Photo ${sIdx + 1}`}
                                    className="w-full h-full object-cover rounded-lg"
                                  />
                                  <span className="absolute top-1 left-1 bg-black/70 text-white text-[9px] font-black px-1.5 py-0.2 rounded-md backdrop-blur-xs">
                                    #{sIdx + 1}
                                  </span>
                                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-1.5 p-1 rounded-xl">
                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        singleSlotTargetIndexRef.current = sIdx;
                                        slotSpecificInputRef.current?.click();
                                      }}
                                      className="bg-white/95 text-[#3A2B24] text-[9px] font-extrabold px-2 py-0.5 rounded-full hover:bg-white cursor-pointer"
                                    >
                                      Replace
                                    </button>
                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleRemoveSlotPhoto(sIdx);
                                      }}
                                      className="bg-rose-600 text-white text-[9px] font-extrabold px-2 py-0.5 rounded-full hover:bg-rose-700 cursor-pointer"
                                    >
                                      Remove
                                    </button>
                                  </div>
                                </>
                              ) : (
                                <div className="flex flex-col items-center justify-center p-1">
                                  <div className="h-6 w-6 rounded-full bg-[#FFF0E8] border border-[#D89A86]/30 flex items-center justify-center text-[#D89A86] mb-1 group-hover:scale-110 transition-transform">
                                    <Plus className="h-3.5 w-3.5" />
                                  </div>
                                  <span className="text-[10px] font-bold text-[#3A2B24]">
                                    Photo #{sIdx + 1}
                                  </span>
                                  <span className="text-[8px] text-[#6C5C54]">
                                    Click to add
                                  </span>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Standard Single Photo Upload for Non-Polaroids */}
                  {!isModalPolaroid && (
                    <div className="space-y-2 mb-4">
                      <label className="text-xs font-bold text-[#3A2B24] flex items-center justify-between">
                        <span>Upload Memory Photo for this Gift:</span>
                        <span className="text-[10px] text-emerald-700 font-bold">Encrypted Vault</span>
                      </label>

                      <input
                        type="file"
                        ref={singleSlotInputRef}
                        accept="image/jpeg,image/png,image/webp,image/jpg"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            setIsCompressingPhotos(true);
                            compressImageFile(file, (url) => {
                              setModalPhotoSlots([url]);
                              setIsCompressingPhotos(false);
                            });
                          }
                        }}
                      />

                      {modalPhotoSlots[0] ? (
                        <div className="relative h-36 w-full rounded-2xl overflow-hidden border border-[#EFE6DD] bg-black/5 flex items-center justify-center">
                          <img src={modalPhotoSlots[0]} alt="Uploaded" className="w-full h-full object-cover" />
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => setModalPhotoSlots([null])}
                            className="absolute top-2 right-2 h-7 px-2 text-xs rounded-full"
                          >
                            Remove Photo
                          </Button>
                        </div>
                      ) : (
                        <div
                          onClick={() => singleSlotInputRef.current?.click()}
                          className="border-2 border-dashed border-[#D89A86]/40 hover:border-[#D89A86] rounded-2xl p-4 text-center cursor-pointer transition-colors bg-[#FFF9F6]"
                        >
                          <Upload className="h-6 w-6 text-[#D89A86] mx-auto mb-1" />
                          <span className="text-xs font-bold text-[#3A2B24] block">
                            {isCompressingPhotos ? 'Processing Photo...' : 'Click to Upload Photograph'}
                          </span>
                          <span className="text-[10px] text-[#6C5C54]">JPG, PNG, WebP up to 10MB</span>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Custom Message / Inscription */}
                  <div className="space-y-1 mb-5">
                    <label className="text-xs font-bold text-[#3A2B24] block">
                      Gift Inscription (Optional):
                    </label>
                    <Input
                      type="text"
                      maxLength={40}
                      placeholder="e.g. Happy Memories 2026"
                      value={modalCustomText}
                      onChange={(e) => setModalCustomText(e.target.value)}
                      className="rounded-xl border-[#EFE6DD] text-xs"
                    />
                  </div>

                  <Button
                    onClick={handleSaveModalItem}
                    className="btn-pixello-primary w-full h-12 rounded-full font-bold text-xs shadow-md cursor-pointer"
                  >
                    {isModalPolaroid
                      ? `Save ${selectedPolaroidCount} Polaroid${selectedPolaroidCount > 1 ? "s" : ""} and Put in Gift Box • ₹${polaroidTotalPrice}`
                      : "Save and Put in Gift Box"}
                  </Button>
                </>
              );
            })()}
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* 4. MOBILE FLOATING "VIEW LIVE BOX" BUTTON                 */}
      {/* ========================================================= */}
      <div className="fixed bottom-20 right-4 z-30 lg:hidden">
        <button
          onClick={() => setIsMobilePreviewOpen(true)}
          className="rounded-full bg-[#3A2B24] text-white px-4 py-3 shadow-2xl hover:bg-[#D89A86] transition-all flex items-center gap-2 border-2 border-[#D89A86]/40 backdrop-blur-md active:scale-95"
        >
          <Package className="h-5 w-5 text-[#D89A86]" />
          <span className="text-xs font-bold">
            Live Box ({totalQuantity}/{boxMaxCapacity})
          </span>
          <span className="text-xs font-extrabold text-[#D89A86] ml-0.5">
            ₹{hamperTotal}
          </span>
        </button>
      </div>

      {/* ========================================================= */}
      {/* 5. MOBILE LIVE BOX PREVIEW MODAL / DRAWER                 */}
      {/* ========================================================= */}
      {isMobilePreviewOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in">
          <div className="bg-white rounded-t-3xl sm:rounded-3xl max-w-lg w-full p-5 border border-[#EFE6DD] shadow-2xl relative max-h-[88vh] overflow-y-auto flex flex-col gap-4 animate-in slide-in-from-bottom duration-200">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-[#EFE6DD] pb-3">
              <div>
                <span className="text-[10px] font-extrabold text-[#D89A86] uppercase tracking-wider block">
                  LIVE KEEPSAKE BOX PREVIEW
                </span>
                <h3 className="font-serif-brand text-lg font-bold text-[#3A2B24]">
                  {selectedPackaging.name}
                </h3>
              </div>
              <div className="flex items-center gap-2">
                <Badge className="bg-[#FFF2EB] text-[#D89A86] border-[#F3DACF] font-bold text-[10px]">
                  {totalQuantity} / {boxMaxCapacity} Filled
                </Badge>
                <button
                  onClick={() => setIsMobilePreviewOpen(false)}
                  className="h-8 w-8 rounded-full bg-[#FAF5F0] text-[#6C5C54] hover:text-[#3A2B24] flex items-center justify-center"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Box visual container */}
            <div
              style={{
                background: boxThemeStyles.outerBorder,
              }}
              className="relative rounded-2xl p-3 shadow-xl border-4 border-black/10 flex flex-col justify-between overflow-hidden min-h-[280px]"
            >
              <div className="absolute top-0 left-1/2 -translate-x-1/2 z-10 bg-amber-200 border border-amber-400 text-amber-900 text-[9px] font-extrabold px-3 py-0.5 rounded-b-md shadow-xs flex items-center gap-1">
                <span>★ {boxThemeStyles.accent}</span>
              </div>

              <div
                style={{
                  backgroundColor: boxThemeStyles.boxBg,
                }}
                className="w-full h-full rounded-xl p-2.5 shadow-inner border border-black/10 flex flex-col justify-between mt-3"
              >
                <div className="grid grid-cols-2 gap-2">
                  {items.map((it) => (
                    <div
                      key={it.id}
                      className="bg-white/95 backdrop-blur-xs rounded-xl p-2 border border-[#EFE6DD] shadow-xs flex items-center gap-2"
                    >
                      <div className="h-9 w-9 rounded-lg overflow-hidden bg-[#FAF5F0] shrink-0 border border-[#EFE6DD]">
                        <img
                          src={it.photos?.[0] || it.image}
                          alt={it.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div
                        className="min-w-0 flex-1 cursor-pointer"
                        onClick={() => {
                          setIsMobilePreviewOpen(false);
                          const origProd = products.find((p) => p.id === it.productId) || {
                            id: it.productId,
                            name: it.name,
                            category: it.category,
                            price: it.price,
                            images: [it.image],
                          } as Product;
                          handleOpenCustomizeModal(origProd, it);
                        }}
                      >
                        <p className="text-[10px] font-bold text-[#3A2B24] truncate">{it.name}</p>
                        <div className="flex items-center gap-1">
                          <span className="text-[10px] text-[#D89A86] font-extrabold">₹{it.price}</span>
                          {it.photos && it.photos.length > 0 && (
                            <span className="text-[9px] text-[#6C5C54]">
                              • {it.photos.length} pics
                            </span>
                          )}
                        </div>
                      </div>
                      <button
                        onClick={() => removeFromHamper(it.id)}
                        className="text-rose-500 opacity-70 hover:opacity-100 p-0.5 shrink-0"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ))}

                  {Array.from({ length: Math.max(0, boxMaxCapacity - totalQuantity) }).map((_, i) => (
                    <div
                      key={`m-empty-${i}`}
                      onClick={() => {
                        setIsMobilePreviewOpen(false);
                        setActiveStep(2);
                      }}
                      className="border-2 border-dashed border-[#D89A86]/35 rounded-xl p-2 flex flex-col items-center justify-center text-center cursor-pointer hover:bg-white/40 transition-colors h-13"
                    >
                      <Plus className="h-3.5 w-3.5 text-[#D89A86]" />
                      <span className="text-[9px] font-bold text-[#6C5C54]">
                        Empty Slot ({totalQuantity + i + 1}/{boxMaxCapacity})
                      </span>
                    </div>
                  ))}
                </div>

                <div className="mt-2 pt-1.5 border-t border-black/5 flex items-center justify-between text-[9px] text-[#6C5C54]">
                  <span>Bedding: {selectedTheme.name}</span>
                  <span className="font-bold text-[#3A2B24]">Wax Sealed Archival Box</span>
                </div>
              </div>
            </div>

            {/* Price Summary */}
            <div className="bg-[#FFFBF7] p-3 rounded-2xl border border-[#EFE6DD] space-y-1.5 text-xs">
              <div className="flex justify-between text-[#6C5C54]">
                <span>Keepsake Box ({selectedPackaging.name}):</span>
                <span className="font-bold text-[#3A2B24]">₹{packagingPrice}</span>
              </div>
              <div className="flex justify-between text-[#6C5C54]">
                <span>Curated Gifts Subtotal:</span>
                <span className="font-bold text-[#3A2B24]">₹{productsSubtotal}</span>
              </div>
              {addonsTotal > 0 && (
                <div className="flex justify-between text-[#6C5C54]">
                  <span>Luxury Add-Ons:</span>
                  <span className="font-bold text-[#3A2B24]">₹{addonsTotal}</span>
                </div>
              )}
              <div className="pt-2 border-t border-[#EFE6DD] flex justify-between items-baseline">
                <span className="font-bold text-xs text-[#3A2B24]">Total Hamper:</span>
                <span className="text-lg font-extrabold text-[#D89A86]">₹{hamperTotal}</span>
              </div>
            </div>

            <Button
              onClick={() => {
                setIsMobilePreviewOpen(false);
                handleFinalAddHamperToCart();
              }}
              disabled={isAddingToCart || items.length === 0}
              className="btn-pixello-primary w-full h-11 rounded-full font-bold text-xs shadow-md flex items-center justify-center gap-2"
            >
              <ShoppingBag className="h-4 w-4" />
              <span>{isAddingToCart ? 'Adding Hamper...' : `Add Hamper to Cart • ₹${hamperTotal}`}</span>
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
