"use client";

import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Truck, CheckCircle2, Check, MapPin, ShieldCheck, Sparkles } from "lucide-react";
import { getDeliveryConfig, saveDeliveryConfig, DEFAULT_DELIVERY_CONFIG, DeliveryConfig } from "@/lib/deliveryFee";

export default function AdminDeliveryChargesPage() {
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [config, setConfig] = useState<DeliveryConfig>(DEFAULT_DELIVERY_CONFIG);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    setConfig(getDeliveryConfig());
  }, []);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleSaveDeliverySettings = (e: React.FormEvent) => {
    e.preventDefault();
    try {
      saveDeliveryConfig(config);
      showToast("✓ Delivery charges & shipping policy settings saved & applied to customer portal!");
    } catch (err) {
      console.error(err);
      showToast("⚠️ Failed to save delivery settings.");
    }
  };

  if (!isMounted) {
    return (
      <div suppressHydrationWarning className="flex flex-col gap-6 p-6 md:p-8 bg-[#F8F3EE] min-h-screen relative max-w-5xl">
        <div>
          <h2 className="font-serif-brand text-3xl font-bold text-[#3A2B24]">
            Store Settings &amp; Delivery Charge Configuration
          </h2>
          <p className="text-xs text-[#6C5C54] mt-1">Loading settings...</p>
        </div>
      </div>
    );
  }

  return (
    <div suppressHydrationWarning className="flex flex-col gap-6 p-6 md:p-8 bg-[#F8F3EE] min-h-screen relative max-w-5xl">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-20 right-8 z-50 bg-[#3A2B24] text-white px-5 py-3 rounded-2xl shadow-xl border border-[#D89A86]/40 flex items-center gap-2.5 animate-in fade-in slide-in-from-top-4 duration-300">
          <CheckCircle2 className="h-5 w-5 text-[#D89A86]" />
          <span className="text-xs font-bold">{toastMessage}</span>
        </div>
      )}

      {/* Page Header */}
      <div>
        <h2 className="font-serif-brand text-3xl font-bold text-[#3A2B24]">
          Store Settings &amp; Delivery Charge Configuration
        </h2>
        <p className="text-xs text-[#6C5C54] mt-1">
          Configure global shipping charges, free delivery thresholds &amp; customer helpline details.
        </p>
      </div>

      {/* Main Delivery Charges Card (Pixello Theme) */}
      <form onSubmit={handleSaveDeliverySettings}>
        <Card className="border border-[#EFE6DD] bg-white rounded-3xl shadow-xs overflow-hidden">
          <CardContent className="p-6 md:p-8 flex flex-col gap-6">
            {/* Card Header Title */}
            <div className="flex items-center justify-between pb-4 border-b border-[#EFE6DD]">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-2xl bg-[#FFF8F2] border border-[#EFE6DD] flex items-center justify-center text-[#D89A86]">
                  <Truck className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-serif-brand text-xl font-bold text-[#3A2B24]">
                    Delivery Charges &amp; Shipping Policy Settings
                  </h3>
                  <p className="text-xs text-[#6C5C54] mt-0.5 font-medium">
                    Configure store shipping fees &amp; free delivery promotions
                  </p>
                </div>
              </div>
            </div>

            {/* Form Fields Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Field 1: Standard Courier Shipping Fee */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-[#3A2B24]">
                  Standard Courier Shipping Fee (₹) *
                </label>
                <Input
                  required
                  type="text"
                  value={config.standardCourierFee ?? 120}
                  onChange={(e) => {
                    const val = e.target.value.replace(/\D/g, "");
                    const numVal = val === "" ? 0 : Number(val);
                    setConfig({ ...config, standardCourierFee: numVal, outstationFee: numVal });
                  }}
                  className="rounded-xl border-[#EFE6DD] bg-white text-xs font-semibold text-[#3A2B24] h-11 focus-visible:ring-[#D89A86]"
                />
                <span className="text-[11px] text-[#6C5C54] font-medium">
                  Standard flat rate shipping charged per order
                </span>
              </div>

              {/* Field 2: Free Shipping Minimum Order */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-[#3A2B24]">
                  Free Shipping Minimum Order (₹) *
                </label>
                <Input
                  required
                  type="number"
                  min="0"
                  value={config.freeShippingMinOrder ?? 5000}
                  onChange={(e) => setConfig({ ...config, freeShippingMinOrder: Number(e.target.value) || 0 })}
                  className="rounded-xl border-[#EFE6DD] bg-white text-xs font-semibold text-[#3A2B24] h-11 focus-visible:ring-[#D89A86]"
                />
                <span className="text-[11px] text-[#6C5C54] font-medium">
                  Orders above this amount get FREE shipping
                </span>
              </div>

              {/* Field 3: Direct Store Delivery Fee */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-[#3A2B24]">
                  Direct Store Delivery Fee (₹)
                </label>
                <Input
                  type="number"
                  min="0"
                  value={config.directStoreDeliveryFee ?? 0}
                  onChange={(e) => setConfig({ ...config, directStoreDeliveryFee: Number(e.target.value) || 0 })}
                  className="rounded-xl border-[#EFE6DD] bg-white text-xs font-semibold text-[#3A2B24] h-11 focus-visible:ring-[#D89A86]"
                />
                <span className="text-[11px] text-[#6C5C54] font-medium">
                  Fee for local direct delivery (Enter 0 for Free)
                </span>
              </div>

              {/* Field 4: Free Shipping Promotion Status */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-[#3A2B24]">
                  Free Shipping Promotion Status
                </label>
                <select
                  value={config.freeShippingStatus || "Enabled"}
                  onChange={(e) => setConfig({ ...config, freeShippingStatus: e.target.value as "Enabled" | "Disabled" })}
                  className="w-full h-11 rounded-xl border border-[#EFE6DD] bg-white text-xs font-bold text-[#3A2B24] px-3 focus:outline-none focus:ring-2 focus:ring-[#D89A86] cursor-pointer"
                >
                  <option value="Enabled" className="bg-white text-emerald-800">✅ Enabled (Offer Free Shipping on Eligible Orders)</option>
                  <option value="Disabled" className="bg-white text-rose-800">❌ Disabled (Charge Delivery Fee on All Orders)</option>
                </select>
              </div>

              {/* Field 5: Store Contact / Helpline Phone Number */}
              <div className="md:col-span-2 flex flex-col gap-1.5">
                <label className="text-xs font-bold text-[#3A2B24]">
                  Store Contact / Helpline Phone Number
                </label>
                <Input
                  type="text"
                  placeholder="+91 79816 54635"
                  value={config.storeHelplinePhone || "+91 79816 54635"}
                  onChange={(e) => setConfig({ ...config, storeHelplinePhone: e.target.value })}
                  className="rounded-xl border-[#EFE6DD] bg-white text-xs font-semibold text-[#3A2B24] h-11 focus-visible:ring-[#D89A86]"
                />
              </div>
            </div>

            {/* Save Button (Pixello Brand Style) */}
            <div className="pt-4 border-t border-[#EFE6DD] flex justify-end">
              <Button
                type="submit"
                className="btn-pixello-primary text-xs font-bold rounded-full px-8 h-12 shadow-md flex items-center gap-2 cursor-pointer uppercase tracking-wider"
              >
                <Check className="h-4 w-4 text-white stroke-[3]" /> SAVE &amp; APPLY DELIVERY SETTINGS
              </Button>
            </div>
          </CardContent>
        </Card>
      </form>
    </div>
  );
}
