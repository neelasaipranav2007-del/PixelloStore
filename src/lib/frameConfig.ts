export interface FrameSizeConfig {
  label: string;
  name: string;
  dimensions: string;
  cmDimensions?: string;
  aspectRatio?: number;
  originalPrice: number;
  discountPct: number;
  gsm180Price: number;
  gsm260Price: number;
  price?: number;
}

export interface FrameWoodColorConfig {
  id: string;
  name: string;
  finish: string;
  hex: string;
  borderStyle: string;
  matColor: string;
  description: string;
  enabled?: boolean;
}

export interface FrameGsmOptionConfig {
  id: string;
  gsm: string; // "180 GSM" | "260 GSM" | custom
  title: string;
  description: string;
  priceDelta: number; // e.g. 0 for 180 GSM, 10 for 260 GSM
  badge?: string; // e.g. "+₹10"
}

export interface FrameStudioConfig {
  woodColors: FrameWoodColorConfig[];
  gsmOptions: FrameGsmOptionConfig[];
  frameSizes?: FrameSizeConfig[];
}

export const DEFAULT_FRAME_SIZES: FrameSizeConfig[] = [
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

export const DEFAULT_FRAME_WOOD_COLORS: FrameWoodColorConfig[] = [
  {
    id: "pine",
    name: "Natural Pine",
    finish: "Handcrafted Scandinavian Pine Wood",
    hex: "#C49A6C",
    borderStyle: "linear-gradient(135deg, #D4A373 0%, #BA8957 50%, #C49A6C 100%)",
    matColor: "#FDFBF7",
    description: "Warm golden organic pine grain with a soft satin wax seal.",
    enabled: true,
  },
  {
    id: "black",
    name: "Classic Black",
    finish: "Matte Charcoal Black Finish",
    hex: "#1A1A1A",
    borderStyle: "linear-gradient(135deg, #2B2B2B 0%, #151515 50%, #1F1F1F 100%)",
    matColor: "#FBF9F5",
    description: "Deep archival matte black with micro-beveled inner edge.",
    enabled: true,
  },
  {
    id: "walnut",
    name: "Walnut Brown",
    finish: "Deep American Walnut Grain",
    hex: "#4A2E1B",
    borderStyle: "linear-gradient(135deg, #5C3821 0%, #3B2313 50%, #4A2E1B 100%)",
    matColor: "#F9F6F0",
    description: "Rich dark chocolate walnut wood offering royal warmth.",
    enabled: true,
  },
  {
    id: "rose",
    name: "Dusty Rose Red",
    finish: "Signature Pixello Blush Red Wood",
    hex: "#9F4D59",
    borderStyle: "linear-gradient(135deg, #B55B68 0%, #8C3E4A 50%, #9F4D59 100%)",
    matColor: "#FFF8F7",
    description: "Bespoke vintage rose stain celebrating love and memories.",
    enabled: true,
  },
  {
    id: "white",
    name: "Gallery White",
    finish: "Pure Architectural Matte White",
    hex: "#F5F5F0",
    borderStyle: "linear-gradient(135deg, #FFFFFF 0%, #E8E8E2 50%, #F5F5F0 100%)",
    matColor: "#FFFFFF",
    description: "Clean modern minimalist white, perfect for bright contemporary spaces.",
    enabled: true,
  },
];

export const DEFAULT_FRAME_GSM_OPTIONS: FrameGsmOptionConfig[] = [
  {
    id: "180gsm",
    gsm: "180 GSM",
    title: "180 GSM Standard Matte Paper",
    description: "Clean archival matte finish",
    priceDelta: 0,
    badge: "",
  },
  {
    id: "260gsm",
    gsm: "260 GSM",
    title: "260 GSM Premium Glossy",
    description: "Ultra-vibrant glossy depth",
    priceDelta: 10,
    badge: "+₹10",
  },
];

export const DEFAULT_FRAME_STUDIO_CONFIG: FrameStudioConfig = {
  woodColors: DEFAULT_FRAME_WOOD_COLORS,
  gsmOptions: DEFAULT_FRAME_GSM_OPTIONS,
  frameSizes: DEFAULT_FRAME_SIZES,
};

const STORAGE_KEY = "pixello_frame_studio_config_v2";

export function getFrameStudioConfig(): FrameStudioConfig {
  if (typeof window === "undefined") return DEFAULT_FRAME_STUDIO_CONFIG;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_FRAME_STUDIO_CONFIG;
    const parsed = JSON.parse(raw);
    return {
      woodColors: Array.isArray(parsed.woodColors) && parsed.woodColors.length > 0
        ? parsed.woodColors
        : DEFAULT_FRAME_WOOD_COLORS,
      gsmOptions: Array.isArray(parsed.gsmOptions) && parsed.gsmOptions.length > 0
        ? parsed.gsmOptions
        : DEFAULT_FRAME_GSM_OPTIONS,
      frameSizes: Array.isArray(parsed.frameSizes) && parsed.frameSizes.length > 0
        ? parsed.frameSizes
        : DEFAULT_FRAME_SIZES,
    };
  } catch {
    return DEFAULT_FRAME_STUDIO_CONFIG;
  }
}

export function saveFrameStudioConfig(config: FrameStudioConfig) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
    window.dispatchEvent(new Event("pixello_frame_config_updated"));
    window.dispatchEvent(new Event("storage"));
  } catch (err) {
    console.error("Failed to save frame studio config:", err);
  }
}
