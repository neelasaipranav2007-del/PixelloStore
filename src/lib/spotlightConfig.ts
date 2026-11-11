export interface FeaturedSpotlightConfig {
  enabled: boolean;
  tag: string;
  badgeText: string;
  title: string;
  description: string;
  originalPrice: number;
  price: number;
  buttonText: string;
  productLink: string;
}

export interface WelcomePromoBannerConfig {
  enabled: boolean;
  badge: string;
  verifiedBadge: string;
  title: string;
  discountLabel: string;
  description: string;
  code: string;
  buttonText: string;
  shopLink: string;
}

export interface AdminBannersConfig {
  spotlight: FeaturedSpotlightConfig;
  welcomePromo: WelcomePromoBannerConfig;
}

export const DEFAULT_SPOTLIGHT_CONFIG: FeaturedSpotlightConfig = {
  enabled: true,
  tag: "FEATURED SPOTLIGHT",
  badgeText: "Handcrafted & Locally Printed",
  title: "Handcrafted Classic Wooden Frame",
  description: "Premium solid natural wood frame with HD crystal photographic print and protective acrylic glass.",
  originalPrice: 699,
  price: 499,
  buttonText: "Customize & Order",
  productLink: "/product/1",
};

export const DEFAULT_WELCOME_PROMO_CONFIG: WelcomePromoBannerConfig = {
  enabled: true,
  badge: "Special Offer",
  verifiedBadge: "Verified Deal",
  title: "Exclusive Pixello Welcome Offer",
  discountLabel: "10% OFF",
  description: "Enjoy an instant discount on your order of personalized handcrafted photo frames, Polaroids, and custom gifts.",
  code: "WELCOME10",
  buttonText: "Claim & Copy Code",
  shopLink: "/products",
};

export const DEFAULT_BANNERS_CONFIG: AdminBannersConfig = {
  spotlight: DEFAULT_SPOTLIGHT_CONFIG,
  welcomePromo: DEFAULT_WELCOME_PROMO_CONFIG,
};

const SPOTLIGHT_STORAGE_KEY = "pixello_featured_spotlight_v1";
const WELCOME_PROMO_STORAGE_KEY = "pixello_welcome_promo_v1";

export function getSpotlightConfig(): FeaturedSpotlightConfig {
  if (typeof window === "undefined") {
    return DEFAULT_SPOTLIGHT_CONFIG;
  }
  try {
    const saved = localStorage.getItem(SPOTLIGHT_STORAGE_KEY);
    if (saved) {
      return { ...DEFAULT_SPOTLIGHT_CONFIG, ...JSON.parse(saved) };
    }
  } catch (e) {
    console.error("Error loading spotlight config:", e);
  }
  return DEFAULT_SPOTLIGHT_CONFIG;
}

export function saveSpotlightConfig(config: FeaturedSpotlightConfig): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(SPOTLIGHT_STORAGE_KEY, JSON.stringify(config));
    window.dispatchEvent(new Event("pixello_banners_updated"));
    window.dispatchEvent(new Event("storage"));
  } catch (e) {
    console.error("Error saving spotlight config:", e);
  }
}

export function getWelcomePromoConfig(): WelcomePromoBannerConfig {
  if (typeof window === "undefined") {
    return DEFAULT_WELCOME_PROMO_CONFIG;
  }
  try {
    const saved = localStorage.getItem(WELCOME_PROMO_STORAGE_KEY);
    if (saved) {
      return { ...DEFAULT_WELCOME_PROMO_CONFIG, ...JSON.parse(saved) };
    }
  } catch (e) {
    console.error("Error loading welcome promo config:", e);
  }
  return DEFAULT_WELCOME_PROMO_CONFIG;
}

export function saveWelcomePromoConfig(config: WelcomePromoBannerConfig): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(WELCOME_PROMO_STORAGE_KEY, JSON.stringify(config));
    window.dispatchEvent(new Event("pixello_banners_updated"));
    window.dispatchEvent(new Event("storage"));
  } catch (e) {
    console.error("Error saving welcome promo config:", e);
  }
}

export function getAdminBannersConfig(): AdminBannersConfig {
  return {
    spotlight: getSpotlightConfig(),
    welcomePromo: getWelcomePromoConfig(),
  };
}

export function saveAdminBannersConfig(config: Partial<AdminBannersConfig>): void {
  if (config.spotlight) {
    saveSpotlightConfig(config.spotlight);
  }
  if (config.welcomePromo) {
    saveWelcomePromoConfig(config.welcomePromo);
  }
}
