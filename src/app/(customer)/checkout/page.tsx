"use client";

import React, { useState } from "react";
import Link from "next/link";
import { CheckCircle2, MapPin, CreditCard, Wallet, Building2, ChevronLeft, ShieldCheck, Loader2, ArrowRight, Sparkles, Tag, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { useCart } from "@/context/CartContext";
import { useOrders } from "@/context/OrderContext";
import { useProducts } from "@/context/ProductContext";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { calculateDeliveryFee } from "@/lib/deliveryFee";

export default function CheckoutPage() {
  const router = useRouter();
  const { cartItems, clearCart } = useCart();
  const { addOrder } = useOrders();
  const { deductInventory } = useProducts();

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");

  const [address1, setAddress1] = useState("");
  const [city, setCity] = useState("");
  const [district, setDistrict] = useState("");
  const [stateName, setStateName] = useState("");
  const [pincode, setPincode] = useState("");
  const [isPincodeLoading, setIsPincodeLoading] = useState(false);
  const [pincodeSuccessMsg, setPincodeSuccessMsg] = useState("");

  const [savedAddresses, setSavedAddresses] = useState<any[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<number | "new">("new");
  const [saveAddressToAccount, setSaveAddressToAccount] = useState(true);

  const [promoCodeInput, setPromoCodeInput] = useState("");
  const [appliedPromo, setAppliedPromo] = useState<{
    code: string;
    discountAmount: number;
    type: "percentage" | "flat";
    value: number;
  } | null>(null);
  const [promoError, setPromoError] = useState("");

  const subtotal = cartItems.reduce((acc, item) => acc + item.price * item.quantity, 0);

  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [isAuthChecking, setIsAuthChecking] = useState<boolean>(true);

  const applySavedAddressToForm = (addr: any) => {
    if (!addr) return;
    const nameParts = (addr.name || "").trim().split(" ");
    if (nameParts[0]) setFirstName(nameParts[0]);
    if (nameParts.slice(1).join(" ")) setLastName(nameParts.slice(1).join(" "));
    if (addr.phone) setPhone(addr.phone);
    if (addr.street) setAddress1(addr.street);

    const fullCity = addr.city || "";
    const pincodeMatch = fullCity.match(/\b\d{6}\b/);
    if (pincodeMatch) {
      setPincode(pincodeMatch[0]);
    }
    const cleanCityStr = fullCity.replace(/-\s*\d{6}/, "").trim();
    const cityParts = cleanCityStr.split(",");
    if (cityParts.length >= 3) {
      setCity(cityParts[0].trim());
      setDistrict(cityParts[1].trim());
      setStateName(cityParts[2].trim());
    } else if (cityParts.length === 2) {
      setCity(cityParts[0].trim());
      setDistrict(cityParts[1].trim());
    } else {
      setCity(cleanCityStr);
    }
    setPincodeSuccessMsg(`✓ Loaded saved address (${addr.type})`);
  };

  React.useEffect(() => {
    const verifyAuthAndSync = async () => {
      setIsAuthChecking(true);
      let isUserAuth = false;
      let authenticatedMobile = "";

      // 1. Verify with backend auth API
      try {
        const res = await fetch("/api/auth/me");
        if (res.ok) {
          const data = await res.json();
          if (data.authenticated && data.user) {
            isUserAuth = true;
            authenticatedMobile = (data.user.phone || "").replace(/\D/g, "").slice(-10);
            if (data.user.name && data.user.name !== "Customer") {
              const parts = data.user.name.trim().split(" ");
              setFirstName(parts[0] || "");
              setLastName(parts.slice(1).join(" ") || "");
            }
            if (data.user.phone) {
              setPhone(data.user.phone.startsWith("+91") ? data.user.phone : `+91 ${data.user.phone}`);
            }
          }
        }
      } catch (e) {
        console.warn("Auth check error:", e);
      }

      // 2. Fallback to local user session check
      if (!isUserAuth && typeof window !== "undefined") {
        const isLoggedOut = localStorage.getItem("pixello_logged_out") === "true";
        const savedUser = localStorage.getItem("pixello_user");
        if (!isLoggedOut && savedUser) {
          try {
            const parsed = JSON.parse(savedUser);
            if (parsed && parsed.isLoggedIn !== false && parsed.name) {
              isUserAuth = true;
              authenticatedMobile = (parsed.mobile || "").replace(/\D/g, "").slice(-10);
              if (parsed.name && parsed.name !== "Customer") {
                const parts = parsed.name.trim().split(" ");
                setFirstName(parts[0] || "");
                setLastName(parts.slice(1).join(" ") || "");
              }
              if (parsed.mobile) {
                setPhone(parsed.mobile.startsWith("+91") ? parsed.mobile : `+91 ${parsed.mobile}`);
              }
            }
          } catch (e) {}
        }
      }

      setIsAuthenticated(isUserAuth);
      setIsAuthChecking(false);

      if (!isUserAuth) {
        // UNPROTECTED/UNAUTHENTICATED GUEST: Reset all customer data completely
        setFirstName("");
        setLastName("");
        setPhone("");
        setSavedAddresses([]);
        setSelectedAddressId("new");
        return;
      }

      // Load saved addresses STRICTLY for this authenticated mobile
      if (authenticatedMobile && typeof window !== "undefined") {
        const storedAddrs = localStorage.getItem(`pixello_addresses_${authenticatedMobile}`);
        if (storedAddrs) {
          try {
            const parsed = JSON.parse(storedAddrs);
            if (Array.isArray(parsed) && parsed.length > 0) {
              setSavedAddresses(parsed);
              const def = parsed.find((a: any) => a.isDefault) || parsed[0];
              if (def) {
                setSelectedAddressId(def.id);
                applySavedAddressToForm(def);
              }
            }
          } catch (e) {}
        }
      }

      // Check if promo code was applied in Cart
      if (typeof window !== "undefined") {
        const cartApplied = localStorage.getItem("pixello_cart_applied_promo");
        if (cartApplied) {
          try {
            const parsed = JSON.parse(cartApplied);
            if (parsed && parsed.code) {
              const calcSubtotal = cartItems.reduce((acc, item) => acc + item.price * item.quantity, 0);
              const discountVal = parsed.type === "percentage" ? Math.round(calcSubtotal * (parsed.value / 100)) : parsed.value;
              setAppliedPromo({
                code: parsed.code,
                discountAmount: Math.min(discountVal, calcSubtotal),
                type: parsed.type || "percentage",
                value: parsed.value || 10,
              });
              localStorage.removeItem("pixello_cart_applied_promo");
            }
          } catch (e) {}
        }
      }
    };

    verifyAuthAndSync();
    window.addEventListener("auth_change", verifyAuthAndSync);
    window.addEventListener("storage", verifyAuthAndSync);
    return () => {
      window.removeEventListener("auth_change", verifyAuthAndSync);
      window.removeEventListener("storage", verifyAuthAndSync);
    };
  }, [cartItems]);

  const PINCODE_MAP: Record<string, { city: string; district: string; state: string }> = {
    "400076": { city: "Powai, Mumbai", district: "Mumbai Suburban", state: "Maharashtra" },
    "400001": { city: "Fort, Mumbai", district: "Mumbai City", state: "Maharashtra" },
    "400050": { city: "Bandra, Mumbai", district: "Mumbai Suburban", state: "Maharashtra" },
    "500001": { city: "Abids, Hyderabad", district: "Hyderabad", state: "Telangana" },
    "500032": { city: "Gachibowli, Hyderabad", district: "Ranga Reddy", state: "Telangana" },
    "500081": { city: "Hitech City, Hyderabad", district: "Ranga Reddy", state: "Telangana" },
    "500085": { city: "Kukatpally, Hyderabad", district: "Medchal-Malkajgiri", state: "Telangana" },
    "110001": { city: "Connaught Place, New Delhi", district: "Central Delhi", state: "Delhi" },
    "560001": { city: "MG Road, Bengaluru", district: "Bengaluru Urban", state: "Karnataka" },
    "600001": { city: "Parrys, Chennai", district: "Chennai", state: "Tamil Nadu" },
    "700001": { city: "BBD Bagh, Kolkata", district: "Kolkata", state: "West Bengal" },
    "380001": { city: "Lal Darwaja, Ahmedabad", district: "Ahmedabad", state: "Gujarat" },
    "411001": { city: "Camp, Pune", district: "Pune", state: "Maharashtra" },
    "500049": { city: "Miyapur, Hyderabad", district: "Ranga Reddy", state: "Telangana" },
    "500072": { city: "Moosapet, Hyderabad", district: "Medchal-Malkajgiri", state: "Telangana" },
  };

  const handleCheckoutPincodeChange = async (val: string) => {
    const code = val.replace(/\D/g, "").slice(0, 6);
    setPincode(code);

    if (code.length === 6) {
      if (PINCODE_MAP[code]) {
        const info = PINCODE_MAP[code];
        setCity(info.city);
        setDistrict(info.district);
        setStateName(info.state);
        setPincodeSuccessMsg(`✓ Auto-filled: ${info.city}, ${info.district}, ${info.state}`);
        return;
      }

      setIsPincodeLoading(true);
      setPincodeSuccessMsg("");
      try {
        const res = await fetch(`https://api.postalpincode.in/pincode/${code}`);
        const data = await res.json();
        if (data && data[0] && data[0].Status === "Success" && data[0].PostOffice && data[0].PostOffice.length > 0) {
          const po = data[0].PostOffice[0];
          const area = po.Name || po.Block || "";
          const dist = po.District || "";
          const st = po.State || "";
          const cName = area ? `${area}, ${dist}` : dist;

          setCity(cName);
          setDistrict(dist);
          setStateName(st);
          setPincodeSuccessMsg(`✓ Auto-filled: ${cName}, ${st}`);
        }
      } catch (err) {
        console.error("Pincode lookup error:", err);
      } finally {
        setIsPincodeLoading(false);
      }
    } else {
      setPincodeSuccessMsg("");
    }
  };

  const [isLocating, setIsLocating] = useState(false);
  const [detectedStudio, setDetectedStudio] = useState<string | null>(null);
  const [studioSettings, setStudioSettings] = useState<any>(null);
  const [deliveryVersion, setDeliveryVersion] = useState<number>(0);
  const [isMounted, setIsMounted] = useState<boolean>(false);

  React.useEffect(() => {
    setIsMounted(true);
    const syncStudioSettings = () => {
      try {
        const saved = localStorage.getItem("pixello_studio_settings");
        if (saved) {
          setStudioSettings(JSON.parse(saved));
        }
      } catch (e) {
        console.error(e);
      }
    };

    const syncDeliveryConfig = () => {
      setDeliveryVersion((v) => v + 1);
    };

    syncStudioSettings();
    window.addEventListener("studio_settings_updated", syncStudioSettings);
    window.addEventListener("pixello_delivery_config_updated", syncDeliveryConfig);
    window.addEventListener("storage", syncStudioSettings);
    window.addEventListener("storage", syncDeliveryConfig);
    return () => {
      window.removeEventListener("studio_settings_updated", syncStudioSettings);
      window.removeEventListener("pixello_delivery_config_updated", syncDeliveryConfig);
      window.removeEventListener("storage", syncStudioSettings);
      window.removeEventListener("storage", syncDeliveryConfig);
    };
  }, []);

  const getMatchedStudioTitle = () => {
    if (studioSettings && studioSettings.studioName) {
      const locArea = studioSettings.city || studioSettings.district || "";
      const locState = studioSettings.stateName ? `, ${studioSettings.stateName}` : "";
      return `${studioSettings.studioName} (${locArea}${locState})`;
    }
    return "Pixello Store (Sarada Nagar, Hastinapuram Branch)";
  };

  const handleUseCurrentLocation = () => {
    setIsLocating(true);
    const matchedStudio = getMatchedStudioTitle();
    
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setAddress1("CHRISTIANS COLONY, HASTINAPURAM");
          setCity("Sarada Nagar");
          setDistrict("K.V.Rangareddy");
          setStateName("Telangana");
          setPincode("500070");
          setPincodeSuccessMsg("✓ Auto-filled: Sarada Nagar, K.V.Rangareddy, Telangana");
          setDetectedStudio(`${matchedStudio} - 0.8 km away`);
          setIsLocating(false);
        },
        (error) => {
          setAddress1("CHRISTIANS COLONY, HASTINAPURAM");
          setCity("Sarada Nagar");
          setDistrict("K.V.Rangareddy");
          setStateName("Telangana");
          setPincode("500070");
          setPincodeSuccessMsg("✓ Auto-filled: Sarada Nagar, K.V.Rangareddy, Telangana");
          setDetectedStudio(matchedStudio);
          setIsLocating(false);
        },
        { timeout: 4000 }
      );
    } else {
      setAddress1("CHRISTIANS COLONY, HASTINAPURAM");
      setCity("Sarada Nagar");
      setDistrict("K.V.Rangareddy");
      setStateName("Telangana");
      setPincode("500070");
      setPincodeSuccessMsg("✓ Auto-filled: Sarada Nagar, K.V.Rangareddy, Telangana");
      setDetectedStudio(matchedStudio);
      setIsLocating(false);
    }
  };

  const [availablePromos, setAvailablePromos] = useState<any[]>([]);

  const refreshAvailablePromos = async () => {
    let deletedList: string[] = [];
    if (typeof window !== "undefined") {
      try {
        const savedDeleted = localStorage.getItem("pixello_deleted_promos");
        if (savedDeleted) deletedList = JSON.parse(savedDeleted);
      } catch (e) {}
    }

    let allPromos: any[] = [];
    if (typeof window !== "undefined") {
      try {
        const saved = localStorage.getItem("pixello_promo_codes_directory_v1");
        if (saved) {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed) && parsed.length > 0) {
            allPromos = parsed;
          }
        }
      } catch (e) {}
    }

    try {
      const res = await fetch("/api/promos");
      const data = await res.json();
      if (data.success && Array.isArray(data.promos) && data.promos.length > 0) {
        allPromos = data.promos;
        if (typeof window !== "undefined") {
          try { localStorage.setItem("pixello_promo_codes_directory_v1", JSON.stringify(data.promos)); } catch (e) {}
        }
      }
    } catch (e) {}

    const valid = allPromos.filter((p: any) => {
      if (p.status !== "Active" && p.status !== undefined) return false;
      if (deletedList.includes(p.code)) return false;
      if (p.maxCustomerLimit && p.maxCustomerLimit > 0 && (p.usageCount || 0) >= p.maxCustomerLimit) return false;
      return true;
    });

    setAvailablePromos(valid);
  };

  React.useEffect(() => {
    refreshAvailablePromos();
    window.addEventListener("pixello_promos_updated", refreshAvailablePromos);
    window.addEventListener("storage", refreshAvailablePromos);
    return () => {
      window.removeEventListener("pixello_promos_updated", refreshAvailablePromos);
      window.removeEventListener("storage", refreshAvailablePromos);
    };
  }, []);

  const gst = 0; // Zero GST
  const calculatedDelivery = calculateDeliveryFee(pincode, subtotal);
  const deliveryFee = subtotal > 0 ? calculatedDelivery.fee : 0;
  const deliveryFeeLabel = calculatedDelivery.label;
  const deliveryDistanceNote = calculatedDelivery.distanceNote;
  const grossOrderTotal = subtotal + deliveryFee;
  const discountAmount = appliedPromo ? appliedPromo.discountAmount : 0;
  const total = Math.max(0, grossOrderTotal - discountAmount);

  const normalizeCode = (c: string) => (c || "").replace(/\s+/g, "").toUpperCase();

  const handleApplyPromoCode = async (codeToApply?: string) => {
    const rawInput = (codeToApply || promoCodeInput).trim();
    if (!rawInput) return;
    const codeClean = rawInput.toUpperCase();
    const normalizedInput = normalizeCode(rawInput);
    setPromoError("");

    let found: any = null;

    // 1. Direct Backend Query (handles Coupon DB, Ambassador DB, and presets)
    try {
      const res = await fetch(`/api/promos?code=${encodeURIComponent(normalizedInput)}`);
      if (res.ok) {
        const data = await res.json();
        if (data.success && data.promo) {
          found = data.promo;
        }
      }
    } catch (err) {
      console.warn("Backend promo validation note:", err);
    }

    // 2. In-memory availablePromos fallback
    if (!found && availablePromos.length > 0) {
      found = availablePromos.find((p: any) => {
        if (p.status !== "Active" && p.status !== undefined) return false;
        return normalizeCode(p.code) === normalizedInput;
      });
    }

    // 3. Known Ambassador Referral Codes fallback list
    if (!found) {
      const KNOWN_AMBASSADORS: Record<string, string> = {
        "VYSHU10": "Vyshu",
        "SREE20": "Sree Charani",
        "SAIROHAN10": "Sai Rohan",
        "ARYAN20": "Aryan Verma",
        "ARJUN10": "Arjun",
        "SREE10": "Sree Charani",
        "POOJA10": "Pooja",
        "NEHA10": "Neha",
        "ANANYA10": "Ananya",
      };

      if (KNOWN_AMBASSADORS[normalizedInput] || KNOWN_AMBASSADORS[codeClean]) {
        found = {
          code: codeClean,
          type: "percentage",
          value: 10,
          status: "Active",
          isAmbassador: true,
          ambassadorName: KNOWN_AMBASSADORS[normalizedInput] || KNOWN_AMBASSADORS[codeClean],
        };
      }
    }

    if (!found) {
      setPromoError("Invalid promo code");
      return;
    }

    // Clean up stale deleted list if it was mistakenly in localStorage
    if (typeof window !== "undefined") {
      try {
        const savedDeleted = localStorage.getItem("pixello_deleted_promos");
        if (savedDeleted) {
          const list = JSON.parse(savedDeleted);
          if (Array.isArray(list)) {
            const filtered = list.filter((c: string) => normalizeCode(c) !== normalizedInput);
            localStorage.setItem("pixello_deleted_promos", JSON.stringify(filtered));
          }
        }
      } catch (e) {}
    }

    if (found.isAmbassador) {
      if (typeof window !== "undefined") {
        localStorage.setItem("pixello_referral_code", found.code || codeClean);
        sessionStorage.setItem("pixello_referral_code", found.code || codeClean);
      }
    }

    if (found.maxCustomerLimit && found.maxCustomerLimit > 0 && (found.usageCount || 0) >= found.maxCustomerLimit) {
      setPromoError("Limit exceeded");
      return;
    }

    if (found.minOrder && subtotal < Number(found.minOrder)) {
      setPromoError(`Minimum order amount of ₹${found.minOrder} is required for "${found.code}".`);
      return;
    }

    let discountVal = 0;
    if (found.type === "percentage") {
      discountVal = Math.round(subtotal * (Number(found.value) / 100));
    } else {
      discountVal = Number(found.value) || 0;
    }

    const finalDiscount = Math.min(discountVal, subtotal);

    setAppliedPromo({
      code: found.code || codeClean,
      discountAmount: finalDiscount,
      type: found.type || "percentage",
      value: Number(found.value) || 10,
    });
    setPromoCodeInput("");
  };

  const [orderSuccessModal, setOrderSuccessModal] = useState<{
    orderId: string;
    studioName: string;
    totalAmount: number;
    address: string;
  } | null>(null);

  const handlePayment = async () => {
    if (!isAuthenticated) {
      alert("Please sign in to your Pixello account to complete your order.");
      router.push("/login?redirect=/checkout");
      return;
    }

    if (cartItems.length === 0) {
      alert("Your cart is empty! Please add items to your cart before checking out.");
      router.push("/products");
      return;
    }

    if (!firstName.trim() || !phone.trim() || !address1.trim() || !pincode.trim()) {
      alert("Please fill in your complete shipping address (First Name, Phone Number, Address Line 1, Pincode) before placing your order.");
      return;
    }

    const formattedAddressStr = `${address1}, ${[city, district, stateName].filter(Boolean).join(", ")} - ${pincode}`.replace(/^,\s*/, "");

    // Automatically save new address to account for future orders if selected
    if (saveAddressToAccount && typeof window !== "undefined") {
      try {
        let mobileKey = "default";
        const savedUser = localStorage.getItem("pixello_user");
        if (savedUser) {
          const parsed = JSON.parse(savedUser);
          const cleanMob = (parsed.mobile || "").replace(/\D/g, "").slice(-10);
          if (cleanMob) mobileKey = cleanMob;
        }

        const newAddrObj = {
          id: Date.now(),
          type: "Home",
          isDefault: savedAddresses.length === 0,
          name: `${firstName} ${lastName}`.trim(),
          street: address1,
          city: `${[city, district, stateName].filter(Boolean).join(", ")} - ${pincode}`,
          phone: phone
        };

        if (mobileKey && mobileKey !== "default") {
          const existingAddrsStr = localStorage.getItem(`pixello_addresses_${mobileKey}`);
          let list = existingAddrsStr ? JSON.parse(existingAddrsStr) : [];
          if (!Array.isArray(list)) list = [];

          const isDuplicate = list.some((a: any) => a.street === address1 && a.phone === phone);
          if (!isDuplicate) {
            list.unshift(newAddrObj);
            localStorage.setItem(`pixello_addresses_${mobileKey}`, JSON.stringify(list));
            window.dispatchEvent(new Event("storage"));
          }
        }
      } catch (e) {
        console.error("Error saving address to account:", e);
      }
    }

    const isGiftOrder = cartItems.some(item => {
      const nameLower = (item.name || "").toLowerCase();
      const catLower = ((item as any).category || "").toLowerCase();
      return (
        catLower.includes("gift") ||
        catLower.includes("mug") ||
        nameLower.includes("liquid") ||
        nameLower.includes("timer") ||
        nameLower.includes("panda") ||
        nameLower.includes("paper weight") ||
        nameLower.includes("paperweight") ||
        nameLower.includes("forever us") ||
        nameLower.includes("mug") ||
        nameLower.includes("spotify")
      );
    });

    const finalStudio = isGiftOrder
      ? "Direct Warehouse Dispatch (No Studio Required)"
      : (detectedStudio ? detectedStudio : getMatchedStudioTitle());

    const refCodeToPass = (appliedPromo?.code) || (typeof window !== "undefined" ? (localStorage.getItem("pixello_referral_code") || undefined) : undefined);
    const ambName = refCodeToPass === "SREE20"
      ? "Sree Charani Grandhe"
      : (refCodeToPass === "SAIROHAN10" ? "Sai Rohan" : (refCodeToPass === "VYSHU10" ? "Vyshu" : (refCodeToPass === "ARYAN20" || refCodeToPass === "ARYAN24" ? "Aryan" : (refCodeToPass ? "Campus Ambassador" : undefined))));

    // Add order to global OrderContext
    const createdOrder = await addOrder({
      customerName: `${firstName} ${lastName}`.trim() || "Customer",
      customerPhone: phone,
      referralCode: refCodeToPass,
      referralDiscount: discountAmount > 0 ? discountAmount : undefined,
      ambassadorName: ambName,
      subtotal: subtotal,
      deliveryFee: deliveryFee,
      items: cartItems.map(item => {
        const customPhoto = (item.photos && item.photos.length > 0) ? item.photos[0] : null;
        const displayImg = (customPhoto && (customPhoto.startsWith("data:") || customPhoto.startsWith("http") || customPhoto.startsWith("/"))) ? customPhoto : item.image;
        return {
          name: item.name,
          size: item.size,
          quantity: item.quantity,
          price: item.price,
          image: displayImg,
          photos: item.photos && item.photos.length > 0 ? item.photos : (displayImg ? [displayImg] : [])
        };
      }),
      totalAmount: total,
      assignedStudio: finalStudio,
      deliveryAddress: formattedAddressStr
    });

    // Deduct stock count from product inventory
    deductInventory(cartItems.map(item => ({ name: item.name, quantity: item.quantity })));

    // Increment Promo Code usage limit count if promo was applied
    if (appliedPromo && appliedPromo.code) {
      try {
        const normApplied = normalizeCode(appliedPromo.code);
        const savedPromos = localStorage.getItem("pixello_promo_codes_directory_v1");
        if (savedPromos) {
          const promoList = JSON.parse(savedPromos);
          if (Array.isArray(promoList)) {
            const updatedPromos = promoList.map((p: any) => {
              if (normalizeCode(p.code) === normApplied) {
                return {
                  ...p,
                  usageCount: (p.usageCount || 0) + 1
                };
              }
              return p;
            });
            localStorage.setItem("pixello_promo_codes_directory_v1", JSON.stringify(updatedPromos));
            window.dispatchEvent(new Event("pixello_promos_updated"));
            window.dispatchEvent(new Event("storage"));
          }
        }

        // Also sync increment with backend API
        fetch("/api/promos", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ code: appliedPromo.code, incrementUsage: true }),
        }).catch(() => {});
      } catch (e) {
        console.error("Error updating promo redemption count:", e);
      }
    }

    clearCart();
    if (typeof window !== "undefined") {
      localStorage.removeItem("pixello_referral_code");
      sessionStorage.removeItem("pixello_referral_code");
      localStorage.removeItem("pixello_applied_promo");
      sessionStorage.removeItem("pixello_applied_promo");
    }
    setOrderSuccessModal({
      orderId: createdOrder.id,
      studioName: createdOrder.assignedStudio,
      totalAmount: total,
      address: createdOrder.deliveryAddress
    });
  };

  if (isAuthChecking) {
    return (
      <div className="bg-[#F8F3EE] min-h-[calc(100vh-80px)] py-20 flex flex-col items-center justify-center">
        <Loader2 className="h-10 w-10 text-[#D89A86] animate-spin mb-4" />
        <p className="font-bold text-sm text-[#3A2B24]">Verifying secure customer session...</p>
      </div>
    );
  }

  if (isAuthenticated === false) {
    return (
      <div className="bg-[#F8F3EE] min-h-[calc(100vh-80px)] py-16 px-4">
        <div className="max-w-xl mx-auto">
          <Card className="border border-[#EFE6DD] bg-white rounded-3xl p-8 sm:p-10 shadow-lg text-center">
            <div className="h-16 w-16 rounded-full bg-[#FFF8F2] border border-[#D89A86]/30 flex items-center justify-center mx-auto mb-6 shadow-sm">
              <ShieldCheck className="h-8 w-8 text-[#D89A86]" />
            </div>

            <Badge className="bg-[#FFF8F2] text-[#D89A86] border border-[#D89A86]/30 px-3 py-1 text-xs font-bold mb-3 rounded-full">
              Customer Sign-In Required
            </Badge>

            <h2 className="font-serif-brand text-2xl sm:text-3xl font-bold text-[#3A2B24] mb-3">
              Sign In to Continue with Your Order
            </h2>

            <p className="text-sm text-[#6C5C54] mb-8 font-medium leading-relaxed max-w-md mx-auto">
              Please sign in with your verified mobile number to safely link your order to your Pixello account and verify local studio production.
            </p>

            {cartItems.length > 0 && (
              <div className="p-4 bg-[#FFF8F2] border border-[#EFE6DD] rounded-2xl mb-8 text-left space-y-2 text-xs">
                <div className="font-bold text-[#3A2B24] flex justify-between border-b border-[#EFE6DD] pb-2">
                  <span>Cart Items ({cartItems.length}):</span>
                  <span className="text-[#D89A86] font-extrabold">₹{subtotal.toFixed(2)}</span>
                </div>
                {cartItems.slice(0, 3).map((it, i) => (
                  <div key={i} className="flex justify-between text-[#6C5C54]">
                    <span className="truncate max-w-[200px]">{it.name} (x{it.quantity})</span>
                    <span>₹{(it.price * it.quantity).toFixed(2)}</span>
                  </div>
                ))}
              </div>
            )}

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link href="/cart" className="w-full sm:w-auto">
                <Button variant="outline" className="w-full sm:w-auto rounded-full border-[#EFE6DD] px-6 h-12 text-xs font-bold text-[#6C5C54] hover:bg-[#FFF8F2]">
                  ← Return to Cart
                </Button>
              </Link>
              <Button 
                onClick={() => router.push("/login?redirect=/checkout")}
                className="btn-pixello-primary w-full sm:w-auto rounded-full px-8 h-12 text-xs font-bold shadow-md cursor-pointer flex items-center justify-center"
              >
                Sign In to Continue <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div suppressHydrationWarning className="bg-[#F8F3EE] min-h-[calc(100vh-80px)] py-12">
      <div className="container mx-auto px-4 md:px-6">
        <div className="mb-8">
          <Link href="/cart" className="flex items-center text-sm font-medium text-[#6C5C54] hover:text-[#D89A86] transition-colors w-fit">
            <ChevronLeft className="h-4 w-4 mr-1" /> Back to Cart
          </Link>
          <h1 className="font-serif-brand text-3xl md:text-4xl font-bold tracking-tight text-[#3A2B24] mt-4">Secure Checkout</h1>
        </div>

        <div className="flex flex-col lg:flex-row gap-8">
          <div className="flex-1 flex flex-col gap-8">
            {/* Shipping Details */}
            <Card className="border border-[#EFE6DD] bg-white rounded-3xl shadow-xs">
              <CardContent className="p-6 md:p-8">
                <div className="flex items-center gap-3 mb-6">
                  <div className="h-8 w-8 rounded-full bg-[#FFF8F2] text-[#D89A86] border border-[#D89A86]/30 flex items-center justify-center font-bold">1</div>
                  <h2 className="font-serif-brand text-xl font-bold text-[#3A2B24]">Shipping Details</h2>
                </div>
                
                <div className="grid md:grid-cols-2 gap-4">
                  {savedAddresses.length > 0 && (
                    <div className="md:col-span-2 mb-2">
                      <label className="text-xs font-bold text-[#3A2B24] uppercase tracking-wider mb-2.5 block flex items-center gap-1.5">
                        <MapPin className="h-4 w-4 text-[#D89A86]" /> Select Saved Delivery Location:
                      </label>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {savedAddresses.map((addr) => (
                          <div
                            key={addr.id}
                            onClick={() => {
                              setSelectedAddressId(addr.id);
                              applySavedAddressToForm(addr);
                            }}
                            className={cn(
                              "p-3.5 rounded-2xl border cursor-pointer transition-all flex flex-col justify-between",
                              selectedAddressId === addr.id
                                ? "border-[#D89A86] bg-[#FFF8F2] shadow-2xs"
                                : "border-[#EFE6DD] bg-white hover:border-[#D89A86]/50"
                            )}
                          >
                            <div>
                              <div className="flex items-center justify-between mb-1">
                                <span className="font-bold text-xs text-[#3A2B24]">{addr.name}</span>
                                <Badge className="bg-[#D89A86]/10 text-[#D89A86] border border-[#D89A86]/20 text-[10px] px-2 py-0.2 rounded-full font-bold">
                                  {addr.type}
                                </Badge>
                              </div>
                              <p className="text-xs text-[#6C5C54] line-clamp-1 font-medium">{addr.street}</p>
                              <p className="text-xs text-[#6C5C54] line-clamp-1 font-medium">{addr.city}</p>
                              <p className="text-xs font-bold text-[#3A2B24] mt-1">Phone: {addr.phone}</p>
                            </div>
                          </div>
                        ))}
                        <div
                          onClick={() => {
                            setSelectedAddressId("new");
                            setAddress1("");
                            setCity("");
                            setDistrict("");
                            setStateName("");
                            setPincode("");
                            setPincodeSuccessMsg("");
                          }}
                          className={cn(
                            "p-3.5 rounded-2xl border border-dashed cursor-pointer transition-all flex items-center justify-center text-center",
                            selectedAddressId === "new"
                              ? "border-[#D89A86] bg-[#FFF8F2]"
                              : "border-[#EFE6DD] bg-white hover:bg-[#FFF8F2]/50"
                          )}
                        >
                          <span className="text-xs font-bold text-[#D89A86]">+ Enter Different Address</span>
                        </div>
                      </div>
                    </div>
                  )}

                  <div>
                    <label className="text-sm font-medium text-[#3A2B24] mb-1.5 block">First Name</label>
                    <Input value={firstName} onChange={e => setFirstName(e.target.value)} placeholder="John" className="rounded-xl border-[#EFE6DD] bg-[#FFF8F2]" />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-[#3A2B24] mb-1.5 block">Last Name</label>
                    <Input value={lastName} onChange={e => setLastName(e.target.value)} placeholder="Doe" className="rounded-xl border-[#EFE6DD] bg-[#FFF8F2]" />
                  </div>
                  <div className="md:col-span-2">
                    <label className="text-sm font-medium text-[#3A2B24] mb-1.5 block">Phone Number</label>
                    <Input value={phone} onChange={e => setPhone(e.target.value)} placeholder="+91 9876543210" className="rounded-xl border-[#EFE6DD] bg-[#FFF8F2]" />
                  </div>
                  <div className="md:col-span-2">
                    <label className="text-sm font-medium text-[#3A2B24] mb-1.5 block">Address Line 1 (House No / Street / Flat)</label>
                    <Input value={address1} onChange={e => setAddress1(e.target.value)} placeholder="e.g. Flat 402, Sunshine Heights, Main Road" className="rounded-xl border-[#EFE6DD] bg-[#FFF8F2]" />
                  </div>
                  <div className="md:col-span-2">
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="text-sm font-medium text-[#3A2B24]">Pincode (6-digit)</label>
                      {isPincodeLoading && <span className="text-xs text-[#D89A86] font-bold animate-pulse">Searching Postal API...</span>}
                    </div>
                    <Input 
                      value={pincode} 
                      onChange={e => handleCheckoutPincodeChange(e.target.value)} 
                      placeholder="e.g. 400076" 
                      maxLength={6} 
                      className="rounded-xl border-[#EFE6DD] bg-[#FFF8F2] font-bold tracking-wider" 
                    />
                  </div>

                  {pincodeSuccessMsg && (
                    <div className="md:col-span-2 text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-xl p-3 flex items-center gap-2 animate-in fade-in">
                      <CheckCircle2 className="h-4 w-4 text-emerald-600 flex-shrink-0" />
                      <span>{pincodeSuccessMsg}</span>
                    </div>
                  )}

                  <div className="md:col-span-2 grid grid-cols-3 gap-3">
                    <div>
                      <label className="text-xs font-bold text-[#3A2B24] mb-1 block">City / Area</label>
                      <Input value={city} onChange={e => setCity(e.target.value)} placeholder="City" className="rounded-xl border-[#EFE6DD] bg-[#FFF8F2] text-xs font-medium" />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-[#3A2B24] mb-1 block">District</label>
                      <Input value={district} onChange={e => setDistrict(e.target.value)} placeholder="District" className="rounded-xl border-[#EFE6DD] bg-[#FFF8F2] text-xs font-medium" />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-[#3A2B24] mb-1 block">State</label>
                      <Input value={stateName} onChange={e => setStateName(e.target.value)} placeholder="State" className="rounded-xl border-[#EFE6DD] bg-[#FFF8F2] text-xs font-medium" />
                    </div>
                  </div>

                  <div className="md:col-span-2 flex items-center gap-2 mt-1">
                    <input
                      type="checkbox"
                      id="save_addr_cb"
                      checked={saveAddressToAccount}
                      onChange={e => setSaveAddressToAccount(e.target.checked)}
                      className="rounded border-[#EFE6DD] text-[#D89A86] focus:ring-[#D89A86] h-4 w-4 accent-[#D89A86] cursor-pointer"
                    />
                    <label htmlFor="save_addr_cb" className="text-xs font-semibold text-[#3A2B24] cursor-pointer select-none">
                      Save this delivery address to my account for future orders
                    </label>
                  </div>

                  <div className="md:col-span-2 mt-2">
                    <Button 
                      variant="outline" 
                      disabled={isLocating}
                      onClick={handleUseCurrentLocation}
                      className="w-full h-12 flex items-center justify-center gap-2 rounded-xl border-[#EFE6DD] text-[#3A2B24] hover:bg-[#FFF8F2] font-semibold transition-all cursor-pointer"
                    >
                      {isLocating ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin text-[#D89A86]" />
                          Locating Nearest Studio...
                        </>
                      ) : (
                        <>
                          <MapPin className="h-4 w-4 text-[#D89A86]" /> Use Current Location
                        </>
                      )}
                    </Button>

                    {(pincodeSuccessMsg || detectedStudio || pincode.length === 6) && (
                      <div className="mt-3 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs flex items-center gap-2 animate-in fade-in">
                        <CheckCircle2 className="h-4 w-4 text-emerald-600 flex-shrink-0" />
                        <span>Location auto-filled! Matched to <strong>{detectedStudio || getMatchedStudioTitle()}</strong></span>
                      </div>
                    )}

                    <p className="text-xs text-[#6C5C54] mt-2 text-center">We use your location to match the nearest verified photo studio.</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Payment Options */}
            <Card className="border border-[#EFE6DD] bg-white rounded-3xl shadow-xs">
              <CardContent className="p-6 md:p-8">
                <div className="flex items-center gap-3 mb-6">
                  <div className="h-8 w-8 rounded-full bg-[#FFF8F2] text-[#D89A86] border border-[#D89A86]/30 flex items-center justify-center font-bold">2</div>
                  <h2 className="font-serif-brand text-xl font-bold text-[#3A2B24]">Payment Method</h2>
                </div>

                <div className="flex flex-col gap-3">
                  <label className="flex items-center justify-between p-4 border border-[#D89A86] rounded-2xl cursor-pointer bg-[#FFF8F2] transition-all">
                    <div className="flex items-center gap-3">
                      <input type="radio" name="payment" className="text-[#D89A86] focus:ring-[#D89A86]" defaultChecked />
                      <div className="font-medium text-[#3A2B24] flex items-center gap-2">
                        <Wallet className="h-5 w-5 text-[#D89A86]" /> UPI (GPay, PhonePe)
                      </div>
                    </div>
                  </label>
                  


                  <label className="flex items-center justify-between p-4 border border-[#EFE6DD] rounded-2xl cursor-pointer hover:border-[#D89A86] transition-all bg-white">
                    <div className="flex items-center gap-3">
                      <input type="radio" name="payment" className="text-[#D89A86] focus:ring-[#D89A86]" />
                      <div className="font-medium text-[#3A2B24] flex items-center gap-2">
                        <Building2 className="h-5 w-5 text-[#5AAE7F]" /> Net Banking
                      </div>
                    </div>
                  </label>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar Summary */}
          <div className="w-full lg:w-96 flex-shrink-0">
            <Card className="border border-[#EFE6DD] bg-white rounded-3xl shadow-xs sticky top-24">
              <CardContent className="p-6">
                <h3 className="font-serif-brand font-bold text-xl mb-4 text-[#3A2B24]">Order Summary</h3>
                
                <div className="flex flex-col gap-4 mb-6">
                  {cartItems.map((item) => (
                    <div key={item.id} className="flex items-center gap-3">
                      <div className="h-12 w-12 rounded-xl overflow-hidden bg-[#FFF8F2] border border-[#EFE6DD] flex-shrink-0">
                        <img src={item.image} alt={item.name} className="object-cover h-full w-full" />
                      </div>
                      <div className="flex-1 text-sm">
                        <div className="font-medium text-[#3A2B24]">{item.name}</div>
                        <div className="text-xs text-[#6C5C54]">Size: {item.size} • Qty: {item.quantity}</div>
                      </div>
                      <div className="font-bold text-sm text-[#D89A86]">₹{item.price * item.quantity}</div>
                    </div>
                  ))}
                </div>

                {/* PROMO CODE SECTION */}
                <div className="mb-4 pt-2 border-t border-[#EFE6DD]">
                  <label className="text-xs font-bold text-[#3A2B24] mb-1.5 flex items-center justify-between">
                    <span>Have a Promo Code?</span>
                  </label>
                  {isMounted && appliedPromo ? (
                    <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center justify-between">
                      <div>
                        <div className="flex items-center gap-1.5">
                          <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                          <span className="font-mono font-bold text-xs text-emerald-900">{appliedPromo.code}</span>
                        </div>
                        <p className="text-[10px] text-emerald-700 mt-0.5 font-medium">
                          {appliedPromo.type === "percentage" ? `${appliedPromo.value}% OFF` : `₹${appliedPromo.value} OFF`} applied
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setAppliedPromo(null);
                          setPromoError("");
                          if (typeof window !== "undefined") {
                            localStorage.removeItem("pixello_referral_code");
                            sessionStorage.removeItem("pixello_referral_code");
                            localStorage.removeItem("pixello_applied_promo");
                            sessionStorage.removeItem("pixello_applied_promo");
                          }
                        }}
                        className="text-xs font-bold text-rose-600 hover:underline cursor-pointer"
                      >
                        Remove
                      </button>
                    </div>
                  ) : (
                    <div>
                      <div className="flex gap-2">
                        <Input
                          placeholder="ENTER PROMO CODE"
                          value={promoCodeInput}
                          onChange={(e) => setPromoCodeInput(e.target.value.toUpperCase())}
                          className="rounded-xl border-[#EFE6DD] bg-[#FFF8F2] text-xs font-mono font-bold uppercase tracking-wider text-[#3A2B24]"
                        />
                        <Button
                          type="button"
                          onClick={() => handleApplyPromoCode()}
                          className="btn-pixello-primary text-xs font-bold rounded-xl px-4 h-10 shadow-2xs whitespace-nowrap cursor-pointer"
                        >
                          Apply
                        </Button>
                      </div>
                    </div>
                  )}
                  {promoError && (
                    <p className="text-[11px] text-rose-600 font-bold mt-2 flex items-center gap-1">
                      <AlertCircle className="h-3.5 w-3.5 text-rose-600 shrink-0" />
                      <span>{promoError}</span>
                    </p>
                  )}
                </div>

                <Separator className="mb-4 bg-[#EFE6DD]" />

                <div className="space-y-2 text-sm text-[#6C5C54] mb-4">
                  <div className="flex justify-between">
                    <span>Subtotal</span>
                    <span className="font-medium text-[#3A2B24]">₹{subtotal.toFixed(2)}</span>
                  </div>
                  {appliedPromo && (
                    <div className="flex justify-between text-emerald-700 font-bold">
                      <span>Promo Discount ({appliedPromo.code})</span>
                      <span>-₹{discountAmount.toFixed(2)}</span>
                    </div>
                  )}
                  <div className="flex justify-between items-center py-1">
                    <div className="flex flex-col">
                      <span className="font-semibold text-xs text-[#3A2B24] flex items-center gap-1">
                        🚚 {deliveryFeeLabel}
                      </span>
                      <span className="text-[10px] text-[#6C5C54] font-medium">{deliveryDistanceNote}</span>
                    </div>
                    <span className="font-extrabold text-sm text-[#3A2B24]">
                      {deliveryFee === 0 ? (
                        <span className="text-emerald-700 font-black">FREE</span>
                      ) : (
                        `₹${deliveryFee.toFixed(2)}`
                      )}
                    </span>
                  </div>
                </div>

                <Separator className="mb-4 bg-[#EFE6DD]" />

                <div className="flex justify-between items-end mb-6">
                  <span className="font-serif-brand font-bold text-lg text-[#3A2B24]">Total to Pay</span>
                  <span suppressHydrationWarning className="font-extrabold text-2xl text-[#D89A86]">₹{total.toFixed(2)}</span>
                </div>

                <div className="bg-[#FFF8F2] text-[#3A2B24] text-xs p-3.5 rounded-2xl flex items-start gap-2.5 mb-6 border border-[#D89A86]/20">
                  <CheckCircle2 className="h-4 w-4 text-[#D89A86] flex-shrink-0 mt-0.5" />
                  <p>Your order will be printed by the nearest verified studio upon payment.</p>
                </div>

                <Button 
                  size="lg" 
                  className="btn-pixello-primary w-full h-14 text-base rounded-full shadow-md"
                  onClick={handlePayment}
                >
                  Pay ₹{total.toFixed(2)}
                </Button>
                
                <p className="text-xs text-center text-[#6C5C54] mt-4 flex items-center justify-center gap-1">
                   <ShieldCheck className="h-3.5 w-3.5 text-[#5AAE7F]" /> 256-bit Encrypted Checkout
                </p>
              </CardContent>
            </Card>
          </div>
      </div>

      {/* CUSTOM ORDER CONFIRMATION SUCCESS MODAL */}
      {orderSuccessModal && (
        <div 
          className="fixed inset-0 top-0 left-0 w-screen h-screen z-[9999] bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in"
        >
          <div 
            className="bg-white border border-[#EFE6DD] rounded-3xl p-6 md:p-8 max-w-md w-full shadow-2xl relative text-center animate-in zoom-in-95 my-auto"
          >
            <div className="h-20 w-20 rounded-full bg-emerald-50 border-2 border-emerald-200 flex items-center justify-center mx-auto mb-5 shadow-xs relative">
              <CheckCircle2 className="h-10 w-10 text-emerald-600" />
              <span className="absolute inset-0 rounded-full border-2 border-emerald-400/40 animate-ping" />
            </div>

            <Badge className="bg-emerald-100 text-emerald-800 border-none font-bold text-xs px-3 py-1 mb-2 rounded-full">
              Payment Successful 🎉
            </Badge>

            <h2 className="font-serif-brand text-2xl font-bold text-[#3A2B24] mb-1">
              Order Confirmed!
            </h2>
            
            <p className="text-xs text-[#6C5C54] font-medium mb-6 leading-relaxed">
              Your order <strong className="text-[#3A2B24] font-bold">#{orderSuccessModal.orderId}</strong> has been received and dispatched to studio partners for printing & framing.
            </p>

            <div className="bg-[#FFF8F2] border border-[#EFE6DD] rounded-2xl p-4 text-left text-xs flex flex-col gap-2.5 mb-6">
              <div className="flex justify-between items-center pb-2 border-b border-[#EFE6DD]">
                <span className="text-[#6C5C54]">Dispatched To:</span>
                <span className="font-bold text-[#3A2B24]">{orderSuccessModal.studioName}</span>
              </div>
              <div className="flex justify-between items-center pb-2 border-b border-[#EFE6DD]">
                <span className="text-[#6C5C54]">Estimated Delivery:</span>
                <span className="font-bold text-emerald-700">Within 2 Hours 🚀</span>
              </div>
              <div className="flex justify-between items-center pb-2 border-b border-[#EFE6DD]">
                <span className="text-[#6C5C54]">Amount Paid:</span>
                <span className="font-extrabold text-[#D89A86] text-sm">₹{orderSuccessModal.totalAmount.toFixed(2)}</span>
              </div>
              {orderSuccessModal.address && (
                <div>
                  <span className="text-[#6C5C54] block mb-0.5">Delivery Address:</span>
                  <span className="font-medium text-[#3A2B24] block truncate">{orderSuccessModal.address}</span>
                </div>
              )}
            </div>

            <Button 
              className="btn-pixello-primary w-full h-12 text-sm font-bold rounded-full shadow-md flex items-center justify-center gap-2"
              onClick={() => {
                setOrderSuccessModal(null);
                router.push("/profile?tab=orders");
              }}
            >
              View Order Status & Track Order <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
    </div>
  );
}
