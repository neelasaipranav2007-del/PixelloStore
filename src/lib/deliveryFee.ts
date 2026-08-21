export interface CustomPincodeRate {
  pincode: string;
  fee: number;
  label?: string;
}

export interface DeliveryConfig {
  basePincode: string;
  baseHubName: string;
  standardCourierFee: number; // Standard Courier Shipping Fee (₹) e.g. 120
  freeShippingMinOrder: number; // Free Shipping Minimum Order (₹) e.g. 5000
  directStoreDeliveryFee: number; // Direct Store Delivery Fee (₹) e.g. 0
  freeShippingStatus: "Enabled" | "Disabled"; // Free Shipping Promotion Status
  storeHelplinePhone: string; // Store Contact / Helpline Phone Number
  localFee: number; // For pincodes close to base (e.g. 500010, 500011, 500015, 500070, etc.)
  cityFee: number; // For Hyderabad Metro (500001 - 500099)
  regionalFee: number; // For Telangana / Regional (500100 - 509999)
  outstationFee: number; // Rest of India (Delhi, Mumbai, etc.)
  freeDeliveryThreshold: number | null; // e.g. 5000 or null for no free delivery
  customPincodeRates: CustomPincodeRate[];
}

export const DEFAULT_DELIVERY_CONFIG: DeliveryConfig = {
  basePincode: "500010",
  baseHubName: "Central Hub: Alwal, Hyderabad (500010)",
  standardCourierFee: 120,
  freeShippingMinOrder: 5000,
  directStoreDeliveryFee: 50,
  freeShippingStatus: "Enabled",
  storeHelplinePhone: "+91 8074589949",
  localFee: 50,
  cityFee: 50,
  regionalFee: 50,
  outstationFee: 120,
  freeDeliveryThreshold: 5000,
  customPincodeRates: [
    { pincode: "500010", fee: 0, label: "Hub Pickup / Super Local (Alwal)" }
  ]
};

const STORAGE_KEY = "pixello_delivery_config_v2";

export function getDeliveryConfig(): DeliveryConfig {
  if (typeof window === "undefined") return DEFAULT_DELIVERY_CONFIG;
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      const minOrder = parsed.freeShippingMinOrder && parsed.freeShippingMinOrder >= 2000 ? parsed.freeShippingMinOrder : 5000;
      return {
        ...DEFAULT_DELIVERY_CONFIG,
        ...parsed,
        localFee: parsed.localFee !== undefined ? parsed.localFee : 50,
        cityFee: parsed.cityFee !== undefined ? parsed.cityFee : 50,
        regionalFee: parsed.regionalFee !== undefined ? parsed.regionalFee : 50,
        outstationFee: parsed.outstationFee !== undefined ? parsed.outstationFee : 120,
        standardCourierFee: parsed.standardCourierFee !== undefined ? parsed.standardCourierFee : 120,
        freeShippingMinOrder: minOrder,
        freeDeliveryThreshold: minOrder,
      };
    }
  } catch (e) {
    console.error("Error reading delivery config:", e);
  }
  return DEFAULT_DELIVERY_CONFIG;
}

export function saveDeliveryConfig(config: DeliveryConfig): void {
  if (typeof window === "undefined") return;
  try {
    // Keep outstationFee and standardCourierFee synced
    const updated = {
      ...config,
      outstationFee: config.outstationFee || config.standardCourierFee || 120,
      standardCourierFee: config.standardCourierFee || config.outstationFee || 120,
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    window.dispatchEvent(new Event("pixello_delivery_config_updated"));
    window.dispatchEvent(new Event("storage"));
  } catch (e) {
    console.error("Error saving delivery config:", e);
  }
}

export interface CalculatedDeliveryResult {
  fee: number;
  label: string;
  tier: "LOCAL" | "CITY" | "REGIONAL" | "OUTSTATION" | "CUSTOM" | "FREE";
  distanceNote: string;
}

export function calculateDeliveryFee(
  pincode: string,
  subtotal: number = 0
): CalculatedDeliveryResult {
  const config = getDeliveryConfig();
  const cleanPin = (pincode || "").replace(/\D/g, "").trim();

  // 1. Check Free Shipping Minimum Order Eligibility (e.g. Orders above ₹5000)
  const isFreeShippingEnabled = config.freeShippingStatus === "Enabled";
  const freeThreshold = config.freeShippingMinOrder || config.freeDeliveryThreshold || 5000;

  if (isFreeShippingEnabled && freeThreshold > 0 && subtotal >= freeThreshold) {
    return {
      fee: 0,
      label: `FREE Delivery (Order > ₹${freeThreshold})`,
      tier: "FREE",
      distanceNote: "Eligible for Free Shipping Promotion"
    };
  }

  const defaultFee = config.localFee !== undefined ? config.localFee : 50;

  if (!cleanPin || cleanPin.length !== 6) {
    return {
      fee: defaultFee,
      label: "Standard Delivery Charges",
      tier: "LOCAL",
      distanceNote: "Standard Delivery Fee Applied"
    };
  }

  // 2. Check Custom Specific Pincode Rules
  const customRule = (config.customPincodeRates || []).find((c) => c.pincode === cleanPin);
  if (customRule) {
    return {
      fee: customRule.fee,
      label: customRule.label || `Special Pincode Rate (${cleanPin})`,
      tier: "CUSTOM",
      distanceNote: `Direct rate for Pincode ${cleanPin}`
    };
  }

  const pinNum = parseInt(cleanPin, 10);
  const baseNum = parseInt(config.basePincode || "500010", 10);

  // 3. Direct Store / Local Radius Pincodes (within ~5 km, e.g. 500010, 500011, 500015, 500070)
  const LOCAL_PINCODES = ["500010", "500011", "500012", "500014", "500015", "500009", "500020", "500070", "500087"];
  if (LOCAL_PINCODES.includes(cleanPin) || Math.abs(pinNum - baseNum) <= 5) {
    const feeVal = config.localFee !== undefined ? config.localFee : 50;
    return {
      fee: feeVal,
      label: `Local Express Delivery (Near ${config.basePincode})`,
      tier: "LOCAL",
      distanceNote: `Within ~5 km from Central Hub ${config.basePincode}`
    };
  }

  // 4. Hyderabad Metro Area Pincodes (500001 - 500099)
  if (pinNum >= 500001 && pinNum <= 500099) {
    return {
      fee: config.cityFee !== undefined ? config.cityFee : 50,
      label: `City Delivery (Hyderabad Metro)`,
      tier: "CITY",
      distanceNote: `Hyderabad Metro Shipping`
    };
  }

  // 5. Regional Pincodes (500100 - 509999)
  if (pinNum >= 500100 && pinNum <= 509999) {
    return {
      fee: config.regionalFee !== undefined ? config.regionalFee : 50,
      label: `Regional Delivery (Telangana)`,
      tier: "REGIONAL",
      distanceNote: `Telangana State Courier`
    };
  }

  // 6. Rest of India Outstation (Delhi 110xxx, Mumbai 400xxx, Bangalore 560xxx, etc.)
  const outstationFee = config.outstationFee || config.standardCourierFee || 120;
  return {
    fee: outstationFee,
    label: `Standard Courier Shipping`,
    tier: "OUTSTATION",
    distanceNote: `Outstation Shipping across India`
  };
}
