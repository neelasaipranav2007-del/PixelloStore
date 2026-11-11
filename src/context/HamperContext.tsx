'use client';

import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import { useCart } from '@/context/CartContext';
import { Product } from '@/context/ProductContext';
import { getHamperConfig, saveHamperConfig, HamperStoreConfig, HamperPackagingConfig } from '@/lib/hamperConfig';

export interface HamperItem {
  id: string; // unique item id inside hamper
  productId: string;
  name: string;
  category: string;
  price: number;
  originalPrice?: number;
  quantity: number;
  image: string;
  selectedOption?: string; // e.g. "4x6 INCH (Black Frame)"
  customMessage?: string;
  photos?: string[];
}

export interface HamperPackagingOption {
  id: string;
  name: string;
  tagline: string;
  price: number;
  originalPrice: number;
  image: string;
  description: string;
  badge?: string;
  capacityText: string;
  maxCapacity?: number;
}

export interface HamperThemeOption {
  id: string;
  name: string;
  hex: string;
  accentHex: string;
  description: string;
}

export interface HamperBoxAddon {
  id: string;
  name: string;
  price: number;
  description: string;
  icon: string;
}

export const HAMPER_BOX_ADDONS: HamperBoxAddon[] = [
  {
    id: 'fairy-lights',
    name: 'Warm LED Micro Fairy Lights',
    price: 49,
    description: 'Battery-operated warm glow string lights tucked gently inside the box.',
    icon: '✨',
  },
  {
    id: 'dry-flowers',
    name: 'Dried Floral Bouquet Sprig',
    price: 39,
    description: 'Artisan dried baby’s breath and lavender sprig with natural scent.',
    icon: '🌸',
  },
  {
    id: 'wax-seal',
    name: 'Personalized Wax Seal Stamp',
    price: 29,
    description: 'Hand-pressed metallic gold wax seal with Pixello crest on the gift wrap.',
    icon: '🏷️',
  },
  {
    id: 'artisan-chocolates',
    name: 'Artisan Gourmet Chocolates (Set of 4)',
    price: 99,
    description: 'Assorted roasted hazelnut and dark chocolate truffles in gold foil.',
    icon: '🍫',
  },
];

export interface HamperCustomization {
  packagingId: string;
  themeId: string;
  recipientName: string;
  senderName: string;
  occasion: string;
  giftNote: string;
  selectedAddons?: string[];
}

export const HAMPER_PACKAGING_OPTIONS: HamperPackagingOption[] = [
  {
    id: 'natural-pine',
    name: 'Natural Pine Keepsake Trunk',
    tagline: 'Handcrafted solid pine wood • Brass latch • Wax seal',
    price: 350,
    originalPrice: 499,
    image: '/images/wooden_frame_main.png',
    description: 'Solid pine wood keepsake trunk with vintage brass latch, shredded paper padding, and wax seal.',
    badge: 'Artisan Choice',
    capacityText: 'Capacity: Up to 6 handcrafted gifts',
    maxCapacity: 6,
  },
  {
    id: 'artisan-kraft',
    name: 'Artisan Kraft Memory Box',
    tagline: 'Eco-friendly reinforced kraft • Vintage botanical presentation',
    price: 200,
    originalPrice: 299,
    image: '/images/hamper_box.png',
    description: 'Reinforced earthy kraft presentation box with vintage botanical sprig and natural jute cord.',
    badge: 'Eco-Luxe',
    capacityText: 'Capacity: Up to 4 handcrafted gifts',
    maxCapacity: 4,
  },
  {
    id: 'dusty-rose-velvet',
    name: 'Dusty Rose Velvet Chest',
    tagline: 'Romantic plush velvet • Satin ribbon • Embossed branding',
    price: 450,
    originalPrice: 599,
    image: '/images/wooden_frame_wall.png',
    description: 'Deep rose velvet luxury chest with silky ribbon tie, embossed metallic lettering, and satin lining.',
    badge: 'Luxury Edition',
    capacityText: 'Capacity: Up to 5 handcrafted gifts',
    maxCapacity: 5,
  },
  {
    id: 'signature-box',
    name: 'Signature Pixello Magnetic Box',
    tagline: 'Blush pink & pearl white luxury keepsake box',
    price: 149,
    originalPrice: 249,
    image: '/images/wooden_frame_angle.png',
    description: 'Magnetic-close luxury rigid box filled with protective crinkle paper, wax seal, and satin bow.',
    badge: 'Most Popular',
    capacityText: 'Capacity: Up to 8 handcrafted gifts',
    maxCapacity: 8,
  },
];

export const HAMPER_THEMES: HamperThemeOption[] = [
  {
    id: 'blush-rose',
    name: 'Blush Rose & Gold',
    hex: '#D89A86',
    accentHex: '#FFF8F2',
    description: 'Soft pastel pink satin ribbon with warm golden accents',
  },
  {
    id: 'royal-champagne',
    name: 'Royal Champagne & Cream',
    hex: '#D4AF37',
    accentHex: '#FFFFF0',
    description: 'Shimmering metallic gold ribbon with elegant cream ribbon trim',
  },
  {
    id: 'ruby-romance',
    name: 'Ruby Romance',
    hex: '#9E2A2B',
    accentHex: '#FFE3E3',
    description: 'Deep passionate wine-red ribbon perfect for love & anniversaries',
  },
  {
    id: 'emerald-luxe',
    name: 'Emerald Luxe',
    hex: '#2D6A4F',
    accentHex: '#E8F5E9',
    description: 'Rich royal forest green ribbon with pearl white wax seal',
  },
  {
    id: 'classic-noir',
    name: 'Midnight & Gold',
    hex: '#3A2B24',
    accentHex: '#F5EBE6',
    description: 'Sophisticated deep espresso ribbon with gold foil badge',
  },
];

export const HAMPER_OCCASIONS = [
  'Birthday Celebration 🎂',
  'Anniversary & Love ❤️',
  'Congratulations 🎉',
  'Friendship & Memories ✨',
  'Thinking of You 💌',
  'Just Because / Thank You 🌸',
];

interface HamperContextType {
  items: HamperItem[];
  customization: HamperCustomization;
  packagingOptions: HamperPackagingOption[];
  themes: HamperThemeOption[];
  occasions: string[];
  addons: HamperBoxAddon[];
  selectedPackaging: HamperPackagingOption;
  selectedTheme: HamperThemeOption;
  selectedAddons: string[];
  itemCount: number;
  totalQuantity: number;
  productsSubtotal: number;
  packagingPrice: number;
  addonsTotal: number;
  hamperTotal: number;
  addToHamper: (
    product: Product | { id: string; name: string; category?: string; price: number; originalPrice?: number; image: string },
    options?: {
      selectedOption?: string;
      customMessage?: string;
      photos?: string[];
      quantity?: number;
      price?: number;
      image?: string;
    }
  ) => void;
  updateHamperItem: (hamperItemId: string, updates: Partial<HamperItem>) => void;
  removeFromHamper: (hamperItemId: string) => void;
  updateItemQuantity: (hamperItemId: string, delta: number) => void;
  updateCustomization: (field: keyof HamperCustomization, value: string) => void;
  toggleAddon: (addonId: string) => void;
  clearHamper: () => void;
  addHamperToCart: () => Promise<boolean>;
  isProductInHamper: (productId: string) => boolean;
  getProductHamperQuantity: (productId: string) => number;
}

const HamperContext = createContext<HamperContextType | undefined>(undefined);

const LOCAL_STORAGE_KEY = 'pixello_active_hamper_v1';

export function HamperProvider({ children }: { children: React.ReactNode }) {
  const { addToCart } = useCart();

  const [items, setItems] = useState<HamperItem[]>([]);
  const [customization, setCustomization] = useState<HamperCustomization>({
    packagingId: 'signature-box',
    themeId: 'blush-rose',
    recipientName: '',
    senderName: '',
    occasion: 'Birthday Celebration 🎂',
    giftNote: '',
  });

  // Restore active hamper from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed.items)) setItems(parsed.items);
        if (parsed.customization) {
          setCustomization((prev) => ({ ...prev, ...parsed.customization }));
        }
      }
    } catch (e) {
      console.warn('Failed to restore hamper from localStorage', e);
    }
  }, []);

  // Save changes to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(
        LOCAL_STORAGE_KEY,
        JSON.stringify({
          items,
          customization,
          updatedAt: Date.now(),
        })
      );
    } catch (e) {
      // localStorage may fail on quota; ignore safely
    }
  }, [items, customization]);

  const [dynamicPackagingOptions, setDynamicPackagingOptions] = useState<HamperPackagingOption[]>(HAMPER_PACKAGING_OPTIONS);
  const [dynamicAddons, setDynamicAddons] = useState<HamperBoxAddon[]>(HAMPER_BOX_ADDONS);

  useEffect(() => {
    const applyConfig = (cfg: HamperStoreConfig) => {
      if (!cfg) return;
      if (cfg.packagingOptions && Array.isArray(cfg.packagingOptions) && cfg.packagingOptions.length > 0) {
        const mapped = cfg.packagingOptions.map((opt: HamperPackagingConfig) => {
          const base = HAMPER_PACKAGING_OPTIONS.find((b) => b.id === opt.id);
          const priceNum = Number(opt.price);
          const origPriceNum = Number(opt.originalPrice);
          const maxCapNum = opt.maxCapacity !== undefined ? Number(opt.maxCapacity) : (base?.maxCapacity || 6);
          return {
            id: opt.id,
            name: opt.name || base?.name || 'Luxury Gift Box',
            tagline: opt.tagline || base?.tagline || opt.description || 'Luxury gift presentation box',
            price: !isNaN(priceNum) ? priceNum : (base?.price || 149),
            originalPrice: !isNaN(origPriceNum) && origPriceNum > 0 ? origPriceNum : (base?.originalPrice || (!isNaN(priceNum) ? priceNum + 100 : 249)),
            image: opt.image || base?.image || 'https://images.unsplash.com/photo-1549465220-1a8b9238cd48?w=800&q=80',
            description: opt.description || base?.description || 'Custom crafted keepsake gift box.',
            badge: opt.badge !== undefined ? opt.badge : base?.badge,
            capacityText: opt.capacityText || base?.capacityText || `Capacity: Up to ${maxCapNum} handcrafted gifts`,
            maxCapacity: !isNaN(maxCapNum) && maxCapNum > 0 ? maxCapNum : 6,
          };
        });
        setDynamicPackagingOptions(mapped);
      }
      if (cfg.boxAddons && Array.isArray(cfg.boxAddons) && cfg.boxAddons.length > 0) {
        setDynamicAddons(cfg.boxAddons as HamperBoxAddon[]);
      }
    };

    // 1. Initial sync from localStorage/defaults
    try {
      applyConfig(getHamperConfig());
    } catch (e) {}

    // 2. Fetch authoritative configuration from API
    fetch('/api/settings/hamper')
      .then((r) => r.json())
      .then((data) => {
        if (data.success && data.config) {
          applyConfig(data.config);
          saveHamperConfig(data.config);
        }
      })
      .catch(() => {});

    // 3. Listen to live events across tabs / components
    const handleSync = () => {
      try {
        applyConfig(getHamperConfig());
      } catch (e) {}
    };

    window.addEventListener('pixello_hamper_config_updated', handleSync);
    window.addEventListener('storage', handleSync);
    return () => {
      window.removeEventListener('pixello_hamper_config_updated', handleSync);
      window.removeEventListener('storage', handleSync);
    };
  }, []);

  const selectedPackaging = useMemo(() => {
    return (
      dynamicPackagingOptions.find((p) => p.id === customization.packagingId) ||
      dynamicPackagingOptions[0] ||
      HAMPER_PACKAGING_OPTIONS[0]
    );
  }, [dynamicPackagingOptions, customization.packagingId]);

  const selectedTheme = useMemo(() => {
    return HAMPER_THEMES.find((t) => t.id === customization.themeId) || HAMPER_THEMES[0];
  }, [customization.themeId]);

  const itemCount = items.length;
  const totalQuantity = items.reduce((sum, it) => sum + it.quantity, 0);
  const productsSubtotal = items.reduce((sum, it) => sum + it.price * it.quantity, 0);
  const packagingPrice = selectedPackaging.price;
  const selectedAddons = customization.selectedAddons || [];
  const addonsTotal = useMemo(() => {
    return (customization.selectedAddons || []).reduce((sum, addonId) => {
      const match = dynamicAddons.find((a) => a.id === addonId) || HAMPER_BOX_ADDONS.find((a) => a.id === addonId);
      return sum + (match?.price || 0);
    }, 0);
  }, [customization.selectedAddons, dynamicAddons]);
  const hamperTotal = productsSubtotal + packagingPrice + addonsTotal;

  const toggleAddon = useCallback((addonId: string) => {
    setCustomization((prev) => {
      const current = prev.selectedAddons || [];
      const exists = current.includes(addonId);
      const updated = exists ? current.filter((id) => id !== addonId) : [...current, addonId];
      return { ...prev, selectedAddons: updated };
    });
  }, []);

  const updateHamperItem = useCallback((hamperItemId: string, updates: Partial<HamperItem>) => {
    setItems((prev) =>
      prev.map((it) => (it.id === hamperItemId ? { ...it, ...updates } : it))
    );
  }, []);

  const addToHamper = useCallback(
    (
      product: Product | { id: string; name: string; category?: string; price: number; originalPrice?: number; image: string },
      options?: {
        selectedOption?: string;
        customMessage?: string;
        photos?: string[];
        quantity?: number;
        price?: number;
        image?: string;
      }
    ) => {
      const qty = options?.quantity && options.quantity > 0 ? options.quantity : 1;
      const effectivePrice = options?.price !== undefined ? options.price : product.price;
      const optStr = options?.selectedOption || 'Standard Edition';
      const effectiveImage = (options?.photos && options.photos.length > 0)
        ? options.photos[0]
        : (options?.image || product.image || '/images/wooden_frame_main.png');

      setItems((prev) => {
        // Find existing matching product with same variant/option
        const existingIdx = prev.findIndex(
          (it) => it.productId === product.id && it.selectedOption === optStr && it.customMessage === (options?.customMessage || '')
        );

        if (existingIdx > -1) {
          const next = [...prev];
          next[existingIdx] = {
            ...next[existingIdx],
            quantity: next[existingIdx].quantity + qty,
            photos: options?.photos && options.photos.length > 0 ? options.photos : next[existingIdx].photos,
            image: (options?.photos && options.photos.length > 0) ? options.photos[0] : next[existingIdx].image,
          };
          return next;
        }

        const newItem: HamperItem = {
          id: `h-item-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
          productId: product.id,
          name: product.name,
          category: product.category || 'Gifts',
          price: effectivePrice,
          originalPrice: product.originalPrice,
          quantity: qty,
          image: effectiveImage,
          selectedOption: optStr,
          customMessage: options?.customMessage,
          photos: options?.photos || [],
        };

        return [...prev, newItem];
      });

      // Dispatch event for any other components listening
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('pixello_hamper_updated', { detail: { action: 'add' } }));
      }
    },
    []
  );

  const removeFromHamper = useCallback((hamperItemId: string) => {
    setItems((prev) => prev.filter((it) => it.id !== hamperItemId));
  }, []);

  const updateItemQuantity = useCallback((hamperItemId: string, delta: number) => {
    setItems((prev) =>
      prev
        .map((it) => {
          if (it.id === hamperItemId) {
            const nextQty = it.quantity + delta;
            return nextQty > 0 ? { ...it, quantity: nextQty } : null;
          }
          return it;
        })
        .filter(Boolean) as HamperItem[]
    );
  }, []);

  const updateCustomization = useCallback((field: keyof HamperCustomization, value: string) => {
    setCustomization((prev) => ({
      ...prev,
      [field]: value,
    }));
  }, []);

  const clearHamper = useCallback(() => {
    setItems([]);
    try {
      localStorage.removeItem(LOCAL_STORAGE_KEY);
    } catch (e) {}
  }, []);

  const isProductInHamper = useCallback(
    (productId: string) => {
      return items.some((it) => it.productId === productId);
    },
    [items]
  );

  const getProductHamperQuantity = useCallback(
    (productId: string) => {
      return items.filter((it) => it.productId === productId).reduce((sum, it) => sum + it.quantity, 0);
    },
    [items]
  );

  const addHamperToCart = useCallback(async (): Promise<boolean> => {
    if (items.length === 0) return false;

    // Collect all valid photos from items
    const allPhotos = items.flatMap((it) => (Array.isArray(it.photos) ? it.photos : []));
    const primaryImg = selectedPackaging.image || items[0]?.image || '/images/wooden_frame_main.png';

    const hamperDataPayload = {
      isHamper: true,
      packaging: {
        id: selectedPackaging.id,
        name: selectedPackaging.name,
        price: selectedPackaging.price,
      },
      theme: {
        id: selectedTheme.id,
        name: selectedTheme.name,
        hex: selectedTheme.hex,
      },
      recipientName: customization.recipientName,
      senderName: customization.senderName,
      occasion: customization.occasion,
      giftNote: customization.giftNote,
      items: items.map((it) => ({
        productId: it.productId,
        name: it.name,
        category: it.category,
        price: it.price,
        quantity: it.quantity,
        selectedOption: it.selectedOption,
        customMessage: it.customMessage,
        image: (it.photos && it.photos.length > 0) ? it.photos[0] : it.image,
        photos: it.photos || [],
      })),
      addons: (customization.selectedAddons || []).map((addonId) => {
        const match = HAMPER_BOX_ADDONS.find((a) => a.id === addonId);
        return {
          id: addonId,
          name: match?.name || addonId,
          price: match?.price || 0,
        };
      }),
      addonsTotal,
      productsSubtotal,
      packagingPrice,
      hamperTotal,
    };

    const recipientPart = customization.recipientName ? ` For: ${customization.recipientName}` : '';
    const occasionPart = customization.occasion ? ` [Occasion: ${customization.occasion}]` : '';
    const notePart = customization.giftNote ? ` [Message: ${customization.giftNote}]` : '';
    const addonsPart = (customization.selectedAddons && customization.selectedAddons.length > 0)
      ? ` + ${customization.selectedAddons.length} Extras`
      : '';

    const cartItem = {
      id: `hamper-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      name: `Custom Gift Hamper (${items.length} Gifts)`,
      size: `${selectedPackaging.name} • ${selectedTheme.name}${recipientPart}${occasionPart}${notePart}${addonsPart}`,
      price: hamperTotal,
      quantity: 1,
      image: primaryImg,
      photos: allPhotos.length > 0 ? allPhotos : [primaryImg],
      // Extended properties preserved in cart session & local storage
      isHamper: true,
      hamperData: hamperDataPayload,
    };

    // Store rich payload in localStorage indexed by cartItem.id so cart and checkout views can render the breakdown
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(`pixello_hamper_details_${cartItem.id}`, JSON.stringify(hamperDataPayload));
      } catch (e) {}
    }

    await addToCart(cartItem as any);

    // Clear active hamper builder once added to cart
    clearHamper();

    return true;
  }, [
    items,
    selectedPackaging,
    selectedTheme,
    customization,
    productsSubtotal,
    packagingPrice,
    hamperTotal,
    addToCart,
    clearHamper,
  ]);

  return (
    <HamperContext.Provider
      value={{
        items,
        customization,
        packagingOptions: dynamicPackagingOptions,
        themes: HAMPER_THEMES,
        occasions: HAMPER_OCCASIONS,
        addons: dynamicAddons,
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
      }}
    >
      {children}
    </HamperContext.Provider>
  );
}

export function useHamper() {
  const context = useContext(HamperContext);
  if (!context) {
    throw new Error('useHamper must be used within a HamperProvider');
  }
  return context;
}

export default HamperContext;
