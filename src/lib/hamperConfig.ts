export interface HamperNavConfig {
  enabled: boolean;
  label: string;
  badgeText: string;
  showBadge: boolean;
  url: string;
  showQuickAccessIcon: boolean;
}

export interface HamperHomepageConfig {
  enabled: boolean;
  tag: string;
  headline: string;
  highlightText: string;
  subtitle: string;
  buttonText: string;
}

export interface HamperPackagingConfig {
  id: string;
  name: string;
  price: number;
  originalPrice?: number;
  tagline?: string;
  capacityText?: string;
  maxCapacity?: number;
  description: string;
  image: string;
  badge?: string;
  enabled: boolean;
}

export interface HamperBoxAddonConfig {
  id: string;
  name: string;
  price: number;
  description: string;
  icon: string;
  enabled: boolean;
}

export interface HamperStoreConfig {
  nav: HamperNavConfig;
  homepage: HamperHomepageConfig;
  packagingOptions: HamperPackagingConfig[];
  boxAddons?: HamperBoxAddonConfig[];
  aboutTitle?: string;
  aboutPoints?: string[];
}

export const DEFAULT_HAMPER_CONFIG: HamperStoreConfig = {
  aboutTitle: "ABOUT HAMPER",
  aboutPoints: [
    "Master studio handcrafted finish",
    "High-definition vibrant color reproduction",
    "Durable premium materials built to last",
    "Printed & dispatched by verified local studio",
    "Safe packaging & doorstep express delivery",
  ],
  nav: {
    enabled: true,
    label: "Build a Hamper",
    badgeText: "NEW",
    showBadge: true,
    url: "/hamper",
    showQuickAccessIcon: true,
  },
  homepage: {
    enabled: true,
    tag: "EXCLUSIVE CUSTOM GIFTING",
    headline: "Build Your Own",
    highlightText: "Custom Gift Hamper",
    subtitle: "Handpick premium custom gifts, select luxurious packaging, add a hand-written wax-sealed personal note, and we will elegantly assemble your bespoke gift box.",
    buttonText: "Create Your Hamper",
  },
  packagingOptions: [
    {
      id: "natural-pine",
      name: "Natural Pine Keepsake Trunk",
      price: 350,
      originalPrice: 499,
      tagline: "Solid Pine Wood • Brass Latch • Wax Seal",
      capacityText: "Capacity: Up to 6 handcrafted gifts",
      maxCapacity: 6,
      description: "Handcrafted solid pine wood trunk with vintage brass latch, wax seal, and shredded paper padding.",
      image: "/images/wooden_frame_main.png",
      badge: "Artisan Choice",
      enabled: true,
    },
    {
      id: "artisan-kraft",
      name: "Artisan Kraft Memory Box",
      price: 200,
      originalPrice: 299,
      tagline: "Eco-Friendly Kraft • Vintage Presentation",
      capacityText: "Capacity: Up to 4 handcrafted gifts",
      maxCapacity: 4,
      description: "Eco-friendly reinforced kraft construction with vintage-style botanical presentation and natural jute cord.",
      image: "/images/hamper_box.png",
      badge: "Eco-Luxe",
      enabled: true,
    },
    {
      id: "dusty-rose-velvet",
      name: "Dusty Rose Velvet Chest",
      price: 450,
      originalPrice: 599,
      tagline: "Plush Velvet • Satin Ribbon • Embossed Branding",
      capacityText: "Capacity: Up to 5 handcrafted gifts",
      maxCapacity: 5,
      description: "Premium rigid keepsake gift chest wrapped in plush dusty rose velvet with silky ribbon tie and embossed branding.",
      image: "/images/wooden_frame_wall.png",
      badge: "Luxury Edition",
      enabled: true,
    },
    {
      id: "signature-box",
      name: "Signature Pixello Magnetic Box",
      price: 149,
      originalPrice: 249,
      tagline: "Magnetic Closure • Satin Bow • Gold Crest",
      capacityText: "Capacity: Up to 8 handcrafted gifts",
      maxCapacity: 8,
      description: "Rigid magnetic-close gift box filled with protective crinkle paper, wax seal, and satin bow ribbon.",
      image: "/images/wooden_frame_angle.png",
      badge: "Most Popular",
      enabled: true,
    },
  ],
  boxAddons: [
    {
      id: "fairy-lights",
      name: "Warm Micro LED Fairy Lights",
      price: 49,
      description: "Glowing battery-powered copper string lights nestled inside your box",
      icon: "💡",
      enabled: true,
    },
    {
      id: "dry-flowers",
      name: "Petite Dried Floral Bouquet",
      price: 39,
      description: "Hand-tied fragrant baby's breath and lavender mini bouquet",
      icon: "🌸",
      enabled: true,
    },
    {
      id: "wax-seal",
      name: "Custom Wax Seal Stamp Accent",
      price: 29,
      description: "Hand-pressed antique gold metallic wax stamp seal on tissue wrap",
      icon: "🕯️",
      enabled: true,
    },
    {
      id: "artisan-chocolates",
      name: "Artisan Chocolate Box (2 pcs)",
      price: 99,
      description: "Handcrafted dark hazelnut & milk chocolate pralines",
      icon: "🍫",
      enabled: true,
    },
  ],
};

const HAMPER_STORAGE_KEY = "pixello_hamper_store_config_v1";

export function getHamperConfig(): HamperStoreConfig {
  if (typeof window === "undefined") {
    return DEFAULT_HAMPER_CONFIG;
  }
  try {
    const saved = localStorage.getItem(HAMPER_STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      return {
        nav: { ...DEFAULT_HAMPER_CONFIG.nav, ...(parsed.nav || {}) },
        homepage: { ...DEFAULT_HAMPER_CONFIG.homepage, ...(parsed.homepage || {}) },
        packagingOptions: parsed.packagingOptions || DEFAULT_HAMPER_CONFIG.packagingOptions,
        boxAddons: parsed.boxAddons || DEFAULT_HAMPER_CONFIG.boxAddons,
      };
    }
  } catch (e) {
    console.error("Error loading hamper config:", e);
  }
  return DEFAULT_HAMPER_CONFIG;
}

export function saveHamperConfig(config: HamperStoreConfig): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(HAMPER_STORAGE_KEY, JSON.stringify(config));
    window.dispatchEvent(new Event("pixello_hamper_config_updated"));
    window.dispatchEvent(new Event("storage"));
  } catch (e) {
    console.error("Error saving hamper config:", e);
  }
}
