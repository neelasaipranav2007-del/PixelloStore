"use client";

import { useState, useEffect } from "react";
import { Navigation, MapPin, Power, Package, Phone, CheckCircle2, User, Truck, IndianRupee, Clock, ArrowRight, ShieldCheck, Compass, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useOrders } from "@/context/OrderContext";
import { cn } from "@/lib/utils";

const CITY_COORDINATES: Record<string, { lat: number; lng: number; city: string }> = {
  "500010": { lat: 17.5023, lng: 78.4975, city: "Alwal, Hyderabad" },
  "500070": { lat: 17.3551, lng: 78.5300, city: "Sarada Nagar, Hyderabad" },
  "hyderabad": { lat: 17.3850, lng: 78.4867, city: "Hyderabad" },
  "alwal": { lat: 17.5023, lng: 78.4975, city: "Alwal, Hyderabad" },
  "400076": { lat: 19.1176, lng: 72.9060, city: "Powai, Mumbai" },
  "mumbai": { lat: 19.0760, lng: 72.8777, city: "Mumbai" },
  "powai": { lat: 19.1176, lng: 72.9060, city: "Powai, Mumbai" },
  "bandra": { lat: 19.0596, lng: 72.8295, city: "Bandra, Mumbai" },
  "andheri": { lat: 19.1197, lng: 72.8464, city: "Andheri, Mumbai" },
  "hiranandani": { lat: 19.1189, lng: 72.9115, city: "Hiranandani, Powai" },
  "delhi": { lat: 28.6139, lng: 77.2090, city: "Delhi NCR" },
  "bangalore": { lat: 12.9716, lng: 77.5946, city: "Bengaluru" },
  "bengaluru": { lat: 12.9716, lng: 77.5946, city: "Bengaluru" },
  "chennai": { lat: 13.0827, lng: 80.2707, city: "Chennai" },
  "kolkata": { lat: 22.5726, lng: 88.3639, city: "Kolkata" },
  "pune": { lat: 18.5204, lng: 73.8567, city: "Pune" },
};

function resolveAddressCoords(address: string): { lat: number; lng: number; locationName: string } {
  if (!address) return { lat: 19.1176, lng: 72.9060, locationName: "Powai, Mumbai" };
  
  const lower = address.toLowerCase();

  const pinMatch = lower.match(/\b\d{6}\b/);
  if (pinMatch && CITY_COORDINATES[pinMatch[0]]) {
    const matched = CITY_COORDINATES[pinMatch[0]];
    return { lat: matched.lat, lng: matched.lng, locationName: matched.city };
  }

  for (const [key, val] of Object.entries(CITY_COORDINATES)) {
    if (lower.includes(key)) {
      return { lat: val.lat, lng: val.lng, locationName: val.city };
    }
  }

  return { lat: 19.1176, lng: 72.9060, locationName: "Powai, Mumbai" };
}

export default function DeliveryDashboard() {
  const { orders, updateOrderStatus } = useOrders();
  const [isOnline, setIsOnline] = useState(true);
  const [activeOrder, setActiveOrder] = useState<any>(null);
  const [todayEarnings, setTodayEarnings] = useState(850);
  const [completedCount, setCompletedCount] = useState(12);
  const [deliverySuccessMsg, setDeliverySuccessMsg] = useState("");

  const [dismissedOrderIds, setDismissedOrderIds] = useState<string[]>([]);
  const [gpsStatus, setGpsStatus] = useState("🛰️ Live Satellite Active");
  const [userCoords, setUserCoords] = useState<{ lat: number; lng: number }>({ lat: 19.1176, lng: 72.9060 });
  const [isFetchingGPS, setIsFetchingGPS] = useState(false);
  const [mapMode, setMapMode] = useState<"ROUTE" | "OSM" | "SATELLITE">("ROUTE");

  const getStudioCoords = (pickupName?: string, dropoffAddr?: string) => {
    const lower = `${pickupName || ""} ${dropoffAddr || ""}`.toLowerCase();
    if (lower.includes("hastinapuram") || lower.includes("500070") || lower.includes("sarada") || lower.includes("hyderabad") || lower.includes("alwal") || lower.includes("500010") || lower.includes("reedy") || lower.includes("ranga")) {
      return { lat: 17.3551, lng: 78.5300, name: "Pixello Studio (Hastinapuram Branch)", shortName: "Studio Hastinapuram" };
    }
    return { lat: 19.1176, lng: 72.9060, name: "Studio Alpha (Powai Central Branch)", shortName: "Studio Powai" };
  };

  // Load state from localStorage
  useEffect(() => {
    try {
      const savedOnline = localStorage.getItem("pixello_rider_online");
      if (savedOnline !== null) setIsOnline(savedOnline === "true");

      const savedEarnings = localStorage.getItem("pixello_rider_earnings");
      if (savedEarnings) setTodayEarnings(parseFloat(savedEarnings));

      const savedActive = localStorage.getItem("pixello_rider_active_order");
      if (savedActive) {
        const parsed = JSON.parse(savedActive);
        setActiveOrder(parsed);
        if (parsed.dropoff) {
          const resolved = resolveAddressCoords(parsed.dropoff);
          setUserCoords({ lat: resolved.lat, lng: resolved.lng });
          setGpsStatus(`📍 Navigating to Customer: ${resolved.locationName}`);
        }
      }

      const savedDismissed = localStorage.getItem("pixello_rider_dismissed");
      if (savedDismissed) setDismissedOrderIds(JSON.parse(savedDismissed));
    } catch (e) {
      console.error(e);
    }
  }, []);

  // Sync GPS Map Location whenever activeOrder changes
  useEffect(() => {
    if (activeOrder && activeOrder.dropoff) {
      const resolved = resolveAddressCoords(activeOrder.dropoff);
      setUserCoords({ lat: resolved.lat, lng: resolved.lng });
      setGpsStatus(`📍 Customer Location Fixed: ${resolved.locationName}`);
    }
  }, [activeOrder?.id, activeOrder?.dropoff]);

  // Listen for cross-portal order updates from Admin/Studio/Customer portals
  useEffect(() => {
    if (activeOrder && orders.length > 0) {
      const match = orders.find(o => o.id === activeOrder.id);
      if (match) {
        if (match.status === "Delivered" && activeOrder.status !== "DELIVERED") {
          setActiveOrder((prev: any) => prev ? { ...prev, status: "DELIVERED" } : null);
        } else if (match.status === "Out for Delivery" && activeOrder.status === "ASSIGNED") {
          setActiveOrder((prev: any) => prev ? { ...prev, status: "OUT_FOR_DELIVERY" } : null);
        }
      }
    }
  }, [orders]);

  const toggleOnline = () => {
    const nextVal = !isOnline;
    setIsOnline(nextVal);
    try {
      localStorage.setItem("pixello_rider_online", String(nextVal));
    } catch (e) {
      console.error(e);
    }
  };

  const findNextOrder = () => {
    // Filter out current active order, dismissed orders, and completed/cancelled orders
    const eligibleOrders = orders.filter(o => 
      o.id !== activeOrder?.id &&
      !dismissedOrderIds.includes(o.id) &&
      o.status !== "Delivered" &&
      o.status !== "Cancelled"
    );

    if (eligibleOrders.length > 0) {
      // Randomize index so rider gets a different order every time
      const randomIndex = Math.floor(Math.random() * eligibleOrders.length);
      const pendingOrder = eligibleOrders[randomIndex];

      const rawAddr = pendingOrder.deliveryAddress || "";
      const dropAddress = (rawAddr.trim() !== "" && rawAddr.trim() !== "-")
        ? rawAddr
        : "Flat 302, Lake View Apartments, Hiranandani Powai, Mumbai - 400076";

      const newActive = {
        id: pendingOrder.id,
        customerName: pendingOrder.customerName || "Sai Pranav",
        customerPhone: pendingOrder.customerPhone || "+91 8074589949",
        pickup: pendingOrder.assignedStudio || "Studio Alpha (Central Powai Branch)",
        dropoff: dropAddress,
        earnings: `₹${Math.floor(Math.random() * 40 + 60)}`,
        rawEarningsNum: Math.floor(Math.random() * 40 + 60),
        status: "ASSIGNED",
        totalAmount: pendingOrder.totalAmount || 899,
        itemsCount: pendingOrder.items?.length || 1
      };
      setActiveOrder(newActive);
      localStorage.setItem("pixello_rider_active_order", JSON.stringify(newActive));

      // Resolve and set GPS coordinates
      const resolved = resolveAddressCoords(dropAddress);
      setUserCoords({ lat: resolved.lat, lng: resolved.lng });
      setGpsStatus(`📍 Customer Location Fixed: ${resolved.locationName}`);
    } else {
      setActiveOrder(null);
      if (typeof window !== "undefined") {
        localStorage.removeItem("pixello_rider_active_order");
      }
      setDeliverySuccessMsg("✓ All assigned deliveries have been completed! Waiting for next orders to be ready for pickup.");
    }
  };

  const handleSelectOrderForDelivery = (order: any) => {
    const rawAddr = order.deliveryAddress || order.shippingAddress || "";
    const dropAddress = (rawAddr.trim() !== "" && rawAddr.trim() !== "-")
      ? rawAddr
      : "Flat 402, Sai Ram Towers, Sarada Nagar, Hyderabad - 500070";

    const newActive = {
      id: order.id,
      customerName: order.customerName || "Customer",
      customerPhone: order.customerPhone || "+91 7989856610",
      pickup: order.assignedStudio || "Pixello Studio (Hastinapuram Branch)",
      dropoff: dropAddress,
      earnings: `₹${Math.floor(Math.random() * 40 + 60)}`,
      rawEarningsNum: Math.floor(Math.random() * 40 + 60),
      status: (order.status === "Out for Delivery" || order.status === "OUT_FOR_DELIVERY") ? "OUT_FOR_DELIVERY" : "ASSIGNED",
      totalAmount: order.totalAmount || 149,
      itemsCount: order.items?.length || 1
    };
    setActiveOrder(newActive);
    localStorage.setItem("pixello_rider_active_order", JSON.stringify(newActive));

    const resolved = resolveAddressCoords(dropAddress);
    setUserCoords({ lat: resolved.lat, lng: resolved.lng });
    setGpsStatus(`📍 Active Navigation: ${resolved.locationName}`);
  };

  const handleAcceptOrder = () => {
    if (!activeOrder) return;
    const updated = { ...activeOrder, status: "OUT_FOR_DELIVERY" };
    setActiveOrder(updated);
    localStorage.setItem("pixello_rider_active_order", JSON.stringify(updated));
    updateOrderStatus(activeOrder.id, "Out for Delivery");

    if (activeOrder.dropoff) {
      const resolved = resolveAddressCoords(activeOrder.dropoff);
      setUserCoords({ lat: resolved.lat, lng: resolved.lng });
      setGpsStatus(`📍 Live Route Guidance: Navigating to ${resolved.locationName}`);
    }
  };

  const handleCompleteDelivery = () => {
    if (!activeOrder) return;
    updateOrderStatus(activeOrder.id, "Delivered");

    if (activeOrder.id) {
      const updatedDismissed = [...dismissedOrderIds, activeOrder.id];
      setDismissedOrderIds(updatedDismissed);
      localStorage.setItem("pixello_rider_dismissed", JSON.stringify(updatedDismissed));
    }

    const earned = activeOrder.rawEarningsNum || 85;
    const newTotal = todayEarnings + earned;
    setTodayEarnings(newTotal);
    setCompletedCount(prev => prev + 1);
    localStorage.setItem("pixello_rider_earnings", String(newTotal));

    setDeliverySuccessMsg(`🎉 Delivery Complete! You earned ${activeOrder.earnings}`);
    setActiveOrder(null);
    localStorage.removeItem("pixello_rider_active_order");

    setTimeout(() => setDeliverySuccessMsg(""), 3500);
  };

  const handleRejectOrder = () => {
    if (activeOrder?.id) {
      const updatedDismissed = [...dismissedOrderIds, activeOrder.id];
      setDismissedOrderIds(updatedDismissed);
      localStorage.setItem("pixello_rider_dismissed", JSON.stringify(updatedDismissed));
    }
    setActiveOrder(null);
    localStorage.removeItem("pixello_rider_active_order");
  };

  const handleRecenterGPS = () => {
    setIsFetchingGPS(true);
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const newCoords = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          };
          setUserCoords(newCoords);
          setGpsStatus(`✓ Live Device GPS Fixed (${newCoords.lat.toFixed(4)}°, ${newCoords.lng.toFixed(4)}°)`);
          setIsFetchingGPS(false);
        },
        (error) => {
          console.warn("GPS Geolocation notice:", error);
          // Fallback coords for Powai / Mumbai dispatch center
          setUserCoords({ lat: 19.1176, lng: 72.9060 });
          setGpsStatus("✓ Live GPS Fixed (Powai Central Hub)");
          setIsFetchingGPS(false);
        },
        { enableHighAccuracy: true, timeout: 8000 }
      );
    } else {
      setUserCoords({ lat: 19.1176, lng: 72.9060 });
      setGpsStatus("✓ Live GPS Fixed (Powai Hub)");
      setIsFetchingGPS(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner Stats Grid for PC */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="border border-[#EFE6DD] bg-white rounded-3xl p-5 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-[#6C5C54] uppercase tracking-wider">Today's Earnings</p>
            <h3 className="text-2xl font-black text-emerald-700 mt-1">₹{todayEarnings.toFixed(2)}</h3>
          </div>
          <div className="h-12 w-12 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-700 font-bold">
            <IndianRupee className="h-6 w-6" />
          </div>
        </Card>

        <Card className="border border-[#EFE6DD] bg-white rounded-3xl p-5 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-[#6C5C54] uppercase tracking-wider">Completed Deliveries</p>
            <h3 className="text-2xl font-bold text-[#3A2B24] mt-1">{completedCount} Orders</h3>
          </div>
          <div className="h-12 w-12 rounded-2xl bg-[#FFF8F2] border border-[#EFE6DD] flex items-center justify-center text-[#D89A86] font-bold">
            <CheckCircle2 className="h-6 w-6 text-emerald-600" />
          </div>
        </Card>

        <Card className="border border-[#EFE6DD] bg-white rounded-3xl p-5 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-[#6C5C54] uppercase tracking-wider">Rider Status</p>
            <div className="flex items-center gap-2 mt-1">
              <span className={`h-3 w-3 rounded-full ${isOnline ? "bg-emerald-500 animate-pulse" : "bg-slate-400"}`} />
              <h3 className="text-lg font-bold text-[#3A2B24]">{isOnline ? "Online & Ready" : "Offline"}</h3>
            </div>
          </div>
          <Button 
            onClick={toggleOnline}
            className={`rounded-2xl text-xs font-bold ${isOnline ? "bg-emerald-600 hover:bg-emerald-700 text-white" : "bg-slate-800 text-white"}`}
          >
            {isOnline ? "Go Offline" : "Go Online"}
          </Button>
        </Card>
      </div>

      {deliverySuccessMsg && (
        <div className="p-4 bg-emerald-600 text-white rounded-2xl font-bold text-sm shadow-lg flex items-center justify-between animate-in fade-in">
          <span>{deliverySuccessMsg}</span>
          <CheckCircle2 className="h-6 w-6" />
        </div>
      )}

      {/* PC Widescreen 2-Column Dashboard Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Active Order Panel & Controls (5 Cols on PC) */}
        <div className="lg:col-span-5 space-y-6">
          <Card className="border border-[#EFE6DD] bg-white rounded-3xl shadow-xs overflow-hidden">
            <CardHeader className="bg-[#FFF8F2] border-b border-[#EFE6DD] p-5 flex flex-row items-center justify-between">
              <div>
                <CardTitle className="font-serif-brand text-xl font-bold text-[#3A2B24]">Dispatch Control</CardTitle>
                <p className="text-xs text-[#6C5C54] mt-0.5">Manage doorstep deliveries & customer navigation</p>
              </div>
              <Badge className="bg-emerald-100 text-emerald-800 border-none font-bold text-xs px-3 py-1 rounded-full">
                LIVE GPS
              </Badge>
            </CardHeader>

            <CardContent className="p-6">
              {!isOnline ? (
                <div className="p-6 text-center space-y-3">
                  <div className="h-16 w-16 bg-slate-100 text-slate-400 rounded-full flex items-center justify-center mx-auto mb-2">
                    <Power className="h-8 w-8" />
                  </div>
                  <h4 className="text-lg font-bold text-[#3A2B24]">You are Currently Offline</h4>
                  <p className="text-xs text-[#6C5C54] leading-relaxed">
                    Toggle your status to <strong>Online</strong> to start receiving auto-assigned doorstep deliveries from Powai studios.
                  </p>
                  <Button className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-full px-6 font-bold text-xs h-10 shadow-md" onClick={toggleOnline}>
                    Go Online Now
                  </Button>
                </div>
              ) : !activeOrder ? (
                <div className="p-6 text-center space-y-4">
                  <div className="h-16 w-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto animate-pulse">
                    <Navigation className="h-8 w-8" />
                  </div>
                  <div>
                    <h4 className="text-lg font-bold text-[#3A2B24]">Searching for Deliveries...</h4>
                    <p className="text-xs text-[#6C5C54] mt-1">Stay in high-demand areas to get order dispatch requests faster.</p>
                  </div>
                  <Button 
                    className="w-full bg-[#3A2B24] hover:bg-[#2E201A] text-white font-bold text-xs h-12 rounded-2xl shadow-lg cursor-pointer flex items-center justify-center gap-2" 
                    onClick={findNextOrder}
                  >
                    <Truck className="h-4 w-4 text-[#D89A86]" /> Simulate / Fetch Next Order
                  </Button>
                </div>
              ) : (
                <div className="space-y-5">
                  <div className="flex justify-between items-start border-b border-[#EFE6DD] pb-4">
                    <div>
                      <Badge className="bg-emerald-100 text-emerald-800 border-none font-bold text-xs px-3 py-0.5 rounded-full mb-1">
                        NEW DISPATCH REQUEST
                      </Badge>
                      <h3 className="text-xl font-bold text-[#3A2B24]">{activeOrder.id}</h3>
                      <p className="text-xs text-[#6C5C54]">{activeOrder.itemsCount} Item(s) • Prepaid Order</p>
                    </div>
                    <div className="text-right">
                      <div className="text-3xl font-black text-emerald-600">{activeOrder.earnings}</div>
                      <div className="text-[10px] font-bold text-[#6C5C54] uppercase">Guaranteed Payout</div>
                    </div>
                  </div>

                  {/* Pickup & Dropoff Address Box */}
                  <div className="p-4 bg-[#FFF8F2]/60 border border-[#EFE6DD] rounded-2xl flex gap-3 text-xs">
                    <div className="flex flex-col items-center mt-1">
                      <div className="h-3.5 w-3.5 rounded-full border-2 border-blue-600 bg-blue-100" />
                      <div className="w-0.5 h-12 bg-[#EFE6DD] my-1" />
                      <div className="h-3.5 w-3.5 rounded-full bg-rose-500" />
                    </div>
                    <div className="flex-1 space-y-4">
                      <div>
                        <p className="font-bold text-blue-900 uppercase tracking-wider text-[10px]">PICKUP FROM STUDIO</p>
                        <p className="font-semibold text-[#3A2B24] mt-0.5">{getStudioCoords(activeOrder.pickup, activeOrder.dropoff).name}</p>
                      </div>
                      <div>
                        <p className="font-bold text-rose-900 uppercase tracking-wider text-[10px]">DROP OFF AT CUSTOMER</p>
                        <p className="font-semibold text-[#3A2B24] mt-0.5">{activeOrder.dropoff}</p>
                      </div>
                    </div>
                  </div>

                  {/* Customer Info */}
                  <div className="p-3.5 bg-[#FFF8F2] border border-[#EFE6DD] rounded-2xl flex items-center justify-between text-xs">
                    <div className="flex items-center gap-3">
                      <div className="h-9 w-9 rounded-full bg-[#3A2B24] text-white flex items-center justify-center font-bold">
                        <User className="h-4 w-4" />
                      </div>
                      <div>
                        <p className="font-bold text-[#3A2B24]">{activeOrder.customerName}</p>
                        <p className="text-[10px] text-[#6C5C54]">Customer Helpline</p>
                      </div>
                    </div>
                    <a 
                      href={`tel:${activeOrder.customerPhone}`}
                      className="h-9 w-9 rounded-full bg-emerald-50 border border-emerald-300 flex items-center justify-center text-emerald-700 hover:bg-emerald-100 transition-colors"
                    >
                      <Phone className="h-4 w-4" />
                    </a>
                  </div>

                  {/* Action Buttons */}
                  {activeOrder.status === "ASSIGNED" && (
                    <div className="flex gap-3 pt-2">
                      <Button 
                        variant="outline" 
                        className="flex-1 h-11 rounded-2xl text-rose-600 border-rose-200 hover:bg-rose-50 font-bold text-xs cursor-pointer" 
                        onClick={handleRejectOrder}
                      >
                        Decline
                      </Button>
                      <Button 
                        className="flex-[2] h-11 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md cursor-pointer flex items-center justify-center gap-2" 
                        onClick={handleAcceptOrder}
                      >
                        Accept & Start Delivery <ArrowRight className="h-4 w-4" />
                      </Button>
                    </div>
                  )}

                  {activeOrder.status === "OUT_FOR_DELIVERY" && (
                    <div className="pt-2">
                      <Button 
                        className="w-full h-12 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-lg cursor-pointer flex items-center justify-center gap-2" 
                        onClick={handleCompleteDelivery}
                      >
                        <CheckCircle2 className="h-5 w-5" /> Mark Order Delivered
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Full Widescreen Interactive Map & Route Guidance (7 Cols on PC) */}
        <div className="lg:col-span-7">
          <Card className="border border-[#EFE6DD] bg-white rounded-3xl shadow-xs overflow-hidden h-full min-h-[520px] flex flex-col relative">
            <div className="p-4 bg-[#FFF8F2] border-b border-[#EFE6DD] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Compass className="h-5 w-5 text-[#D89A86]" />
                <h3 className="font-serif-brand font-bold text-base text-[#3A2B24]">Live Studio to Customer Navigation</h3>
              </div>
              <div className="flex items-center gap-1.5">
                <Button 
                  size="sm" 
                  variant={mapMode === "ROUTE" ? "default" : "outline"} 
                  onClick={() => setMapMode("ROUTE")}
                  className={`rounded-full text-[10px] font-bold h-7 px-3 ${mapMode === "ROUTE" ? "bg-[#3A2B24] text-white" : "border-[#EFE6DD]"}`}
                >
                  🛣️ Route Path
                </Button>
                <Button 
                  size="sm" 
                  variant={mapMode === "OSM" ? "default" : "outline"} 
                  onClick={() => setMapMode("OSM")}
                  className={`rounded-full text-[10px] font-bold h-7 px-3 ${mapMode === "OSM" ? "bg-[#3A2B24] text-white" : "border-[#EFE6DD]"}`}
                >
                  🗺️ Street Map
                </Button>
                <Button 
                  size="sm" 
                  variant={mapMode === "SATELLITE" ? "default" : "outline"} 
                  onClick={() => setMapMode("SATELLITE")}
                  className={`rounded-full text-[10px] font-bold h-7 px-3 ${mapMode === "SATELLITE" ? "bg-[#3A2B24] text-white" : "border-[#EFE6DD]"}`}
                >
                  🛰️ Satellite
                </Button>
              </div>
            </div>

            {/* Interactive Studio ➔ Customer Route Map Visualizer */}
            <div className="flex-1 relative min-h-[440px] bg-slate-900 overflow-hidden flex flex-col">
              {/* Layer 1: Base OpenStreetMap / Tile Layer */}
              {mapMode !== "SATELLITE" ? (
                <iframe
                  title="Interactive Live GPS Map"
                  width="100%"
                  height="100%"
                  className="w-full flex-1 border-0 min-h-[440px]"
                  loading="lazy"
                  src={`https://www.openstreetmap.org/export/embed.html?bbox=${userCoords.lng - 0.02}%2C${userCoords.lat - 0.015}%2C${userCoords.lng + 0.02}%2C${userCoords.lat + 0.015}&layer=mapnik&marker=${userCoords.lat}%2C${userCoords.lng}`}
                />
              ) : (
                <div className="flex-1 bg-[url('https://images.unsplash.com/photo-1524661135-423995f22d0b?q=80&w=1200&auto=format&fit=crop')] bg-cover bg-center relative min-h-[440px]">
                  <div className="absolute inset-0 bg-emerald-950/20 backdrop-brightness-95" />
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-24 w-24 bg-emerald-500/30 rounded-full animate-ping" />
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white/95 p-3.5 rounded-full shadow-2xl border-2 border-emerald-600">
                    <Navigation className="h-8 w-8 text-emerald-600 fill-emerald-600 -rotate-45" />
                  </div>
                </div>
              )}

              {/* Layer 2: Interactive Studio to Destination Route Overlay (Visible on ROUTE & OSM Mode) */}
              {activeOrder && (
                <>
                  {/* Top Route Steps Card */}
                  <div className="absolute top-3 left-3 right-3 bg-white/95 backdrop-blur-md p-3.5 rounded-2xl shadow-xl border border-slate-200 text-xs z-20 space-y-3">
                    <div className="flex justify-between items-center border-b border-slate-100 pb-2">
                      <div className="flex items-center gap-2">
                        <span className="h-2.5 w-2.5 rounded-full bg-emerald-500 animate-pulse" />
                        <h4 className="font-bold text-[#3A2B24] text-xs">
                          Active Route: {getStudioCoords(activeOrder.pickup, activeOrder.dropoff).shortName} ➔ Customer Destination
                        </h4>
                      </div>
                      <div className="flex gap-2">
                        <Badge className="bg-blue-100 text-blue-900 border-none font-bold text-[10px] px-2 py-0.5 rounded-full">
                          ⚡ 4.2 km
                        </Badge>
                        <Badge className="bg-emerald-100 text-emerald-900 border-none font-bold text-[10px] px-2 py-0.5 rounded-full">
                          ⏱️ 14 Mins
                        </Badge>
                      </div>
                    </div>

                    {/* Route Steps Bar */}
                    <div className="flex items-center justify-between gap-2 bg-[#FFF8F2] p-2.5 rounded-xl border border-[#EFE6DD]">
                      <div className="flex items-center gap-2 min-w-0 flex-1">
                        <div className="h-6 w-6 rounded-full bg-blue-600 text-white font-bold text-[10px] flex items-center justify-center flex-shrink-0 shadow-sm">
                          1
                        </div>
                        <div className="min-w-0">
                          <p className="text-[10px] font-bold text-blue-900 uppercase">PICKUP STUDIO</p>
                          <p className="font-semibold text-[#3A2B24] truncate text-[11px]">{getStudioCoords(activeOrder.pickup, activeOrder.dropoff).name}</p>
                        </div>
                      </div>

                      <div className="flex flex-col items-center flex-shrink-0 px-2">
                        <span className="text-[10px] font-bold text-emerald-600">🛵 EN ROUTE</span>
                        <div className="w-16 h-1 bg-gradient-to-r from-blue-500 via-emerald-500 to-rose-500 rounded-full mt-0.5 animate-pulse" />
                      </div>

                      <div className="flex items-center gap-2 min-w-0 flex-1 justify-end text-right">
                        <div className="min-w-0">
                          <p className="text-[10px] font-bold text-rose-900 uppercase">CUSTOMER DROPOFF</p>
                          <p className="font-semibold text-[#3A2B24] truncate text-[11px]">{activeOrder.dropoff}</p>
                        </div>
                        <div className="h-6 w-6 rounded-full bg-rose-600 text-white font-bold text-[10px] flex items-center justify-center flex-shrink-0 shadow-sm">
                          2
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Map Visual Markers: Studio Pin + Customer Pin + Route Path Line */}
                  <div className="absolute inset-0 pointer-events-none z-15 flex items-center justify-center">
                    {/* SVG Route Connector Line */}
                    <svg className="absolute inset-0 w-full h-full">
                      <defs>
                        <linearGradient id="routeGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                          <stop offset="0%" stopColor="#2563eb" />
                          <stop offset="50%" stopColor="#10b981" />
                          <stop offset="100%" stopColor="#e11d48" />
                        </linearGradient>
                      </defs>
                      <line 
                        x1="22%" 
                        y1="45%" 
                        x2="78%" 
                        y2="68%" 
                        stroke="url(#routeGrad)" 
                        strokeWidth="5" 
                        strokeDasharray="8 6" 
                        className="animate-pulse"
                      />
                    </svg>

                    {/* Pin 1: Studio Pickup Pin */}
                    <div className="absolute top-[45%] left-[22%] -translate-x-1/2 -translate-y-1/2 flex flex-col items-center animate-bounce">
                      <div className="bg-blue-600 text-white text-[10px] font-bold px-3 py-1 rounded-full shadow-2xl border-2 border-white flex items-center gap-1">
                        <span>🔵 1. Studio Pickup</span>
                      </div>
                      <div className="w-1 h-5 bg-blue-600 rounded-full" />
                    </div>

                    {/* En-Route Bike Beacon */}
                    <div className="absolute top-[56.5%] left-[50%] -translate-x-1/2 -translate-y-1/2 bg-white text-emerald-700 font-bold text-[10px] px-2.5 py-1 rounded-full shadow-2xl border-2 border-emerald-500 flex items-center gap-1 animate-pulse">
                      <span>🛵 Rider (28 km/h)</span>
                    </div>

                    {/* Pin 2: Customer Dropoff Pin */}
                    <div className="absolute top-[68%] left-[78%] -translate-x-1/2 -translate-y-1/2 flex flex-col items-center animate-bounce">
                      <div className="bg-rose-600 text-white text-[10px] font-bold px-3 py-1 rounded-full shadow-2xl border-2 border-white flex items-center gap-1">
                        <span>🚩 2. Customer Dropoff</span>
                      </div>
                      <div className="w-1 h-5 bg-rose-600 rounded-full" />
                    </div>
                  </div>
                </>
              )}

              {/* Floating Bottom Navigation Bar Banner */}
              <div className="absolute bottom-4 left-4 right-4 bg-white/95 backdrop-blur-md p-4 rounded-2xl shadow-xl border border-slate-200 text-xs flex flex-wrap justify-between items-center gap-3 z-10">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-center text-emerald-700 font-bold flex-shrink-0">
                    <Truck className="h-5 w-5" />
                  </div>
                  <div>
                    <h4 className="font-bold text-sm text-[#3A2B24]">
                      {activeOrder ? `Routing to ${activeOrder.id}` : "Rider Stationed in Hub"}
                    </h4>
                    <p className="text-[#6C5C54] mt-0.5 line-clamp-1">
                      {activeOrder ? activeOrder.dropoff : "Stay within 5km radius of partner studios for priority orders"}
                    </p>
                  </div>
                </div>

                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={handleRecenterGPS}
                  disabled={isFetchingGPS}
                  className="rounded-full text-xs font-bold border-[#EFE6DD] bg-white hover:bg-[#FFF8F2] text-[#3A2B24] px-4 cursor-pointer"
                >
                  {isFetchingGPS ? "📍 Fetching GPS..." : "📍 Recenter GPS"}
                </Button>
              </div>
            </div>
          </Card>
        </div>

      </div>

      {/* LIVE ASSIGNED DELIVERY QUEUE & DB TASKS */}
      <Card className="border border-[#EFE6DD] bg-white rounded-3xl p-6 shadow-xs">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 mb-4 pb-3 border-b border-[#EFE6DD]">
          <div>
            <h3 className="font-serif-brand font-bold text-lg text-[#3A2B24] flex items-center gap-2">
              <Package className="h-5 w-5 text-[#D89A86]" />
              <span>Live Delivery Queue & Dispatches</span>
            </h3>
            <p className="text-xs text-[#6C5C54] mt-0.5">
              Live orders from database ready for pickup or actively out for delivery
            </p>
          </div>
          <Badge className="bg-[#FFF8F2] text-[#3A2B24] border border-[#EFE6DD] font-bold text-xs px-3 py-1 rounded-full">
            {orders.length} Total Orders in System
          </Badge>
        </div>

        {orders.length === 0 ? (
          <p className="text-xs text-center text-[#6C5C54] py-8">No orders currently found in database.</p>
        ) : (
          <div className="space-y-3">
            {orders.map((o) => {
              const isCurrentActive = activeOrder?.id === o.id;
              const isOrder127093 = o.id === "127093c0243c6e9c9d456bcf28b72a9fd014b64e";

              return (
                <div 
                  key={o.id}
                  className={cn(
                    "p-4 rounded-2xl border transition-all flex flex-col md:flex-row items-start md:items-center justify-between gap-4",
                    isCurrentActive
                      ? "border-emerald-500 bg-emerald-50/40 shadow-xs ring-1 ring-emerald-400"
                      : isOrder127093
                      ? "border-[#D89A86] bg-[#FFF8F2] shadow-xs"
                      : "border-[#EFE6DD] bg-white hover:bg-[#FFF8F2]/50"
                  )}
                >
                  <div className="flex-1 space-y-1.5 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono font-extrabold text-sm text-[#3A2B24]">{o.id}</span>
                      {isOrder127093 && (
                        <Badge className="bg-purple-100 text-purple-900 border border-purple-300 text-[10px] font-bold px-2 py-0 rounded-full">
                          ⚡ Priority Live Task
                        </Badge>
                      )}
                      <Badge className={cn(
                        "text-[10px] font-bold px-2.5 py-0.5 rounded-full",
                        o.status === "Delivered" ? "bg-emerald-100 text-emerald-800" :
                        o.status === "Out for Delivery" ? "bg-blue-100 text-blue-800" :
                        "bg-amber-100 text-amber-800"
                      )}>
                        {o.status}
                      </Badge>
                    </div>

                    <div className="text-xs text-[#6C5C54] flex flex-wrap gap-x-4 gap-y-1">
                      <span className="font-semibold text-[#3A2B24]">👤 {o.customerName} ({o.customerPhone})</span>
                      <span>📍 {o.deliveryAddress || "Sarada Nagar, Hyderabad"}</span>
                      <span className="font-bold text-[#D89A86]">₹{o.totalAmount}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 w-full md:w-auto">
                    {isCurrentActive ? (
                      <Badge className="bg-emerald-600 text-white font-bold text-xs px-3 py-1.5 rounded-xl shadow-xs">
                        ✓ In Active Navigation
                      </Badge>
                    ) : (
                      <Button
                        size="sm"
                        onClick={() => handleSelectOrderForDelivery(o)}
                        className="bg-[#3A2B24] hover:bg-[#2E201A] text-white font-bold text-xs rounded-xl px-4 h-9 shadow-xs cursor-pointer flex items-center gap-1.5"
                      >
                        <Truck className="h-3.5 w-3.5 text-[#D89A86]" />
                        <span>Dispatch / Load Active</span>
                      </Button>
                    )}

                    {o.status !== "Delivered" && o.status !== "Cancelled" && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => updateOrderStatus(o.id, "Delivered")}
                        className="border-emerald-300 text-emerald-700 hover:bg-emerald-50 font-bold text-xs rounded-xl px-3 h-9 cursor-pointer"
                      >
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        <span>Mark Delivered</span>
                      </Button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Card>
    </div>
  );
}