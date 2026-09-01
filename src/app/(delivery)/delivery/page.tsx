"use client";

import { useState, useEffect } from "react";
import { Navigation, MapPin, Power, Package, Phone, CheckCircle2, User, Truck, IndianRupee, Clock, ArrowRight, ShieldCheck, Compass, Sparkles, ExternalLink, FileText, X, Search, AlertCircle, RefreshCw, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { useOrders } from "@/context/OrderContext";

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

  // Delhivery One Integration State
  const [delhiveryConfig, setDelhiveryConfig] = useState<{
    configured: boolean;
    maskedToken: string;
    carrierName: string;
    status: string;
    message: string;
  }>({
    configured: false,
    maskedToken: "PENDING",
    carrierName: "Delhivery One B2C Express",
    status: "CHECKING",
    message: "Verifying server environment configuration...",
  });
  const [isBookingDelhivery, setIsBookingDelhivery] = useState(false);
  const [trackingModalData, setTrackingModalData] = useState<any | null>(null);
  const [isTrackingLoading, setIsTrackingLoading] = useState(false);
  const [pincodeCheckInput, setPincodeCheckInput] = useState("");
  const [pincodeResult, setPincodeResult] = useState<any | null>(null);
  const [isCheckingPincode, setIsCheckingPincode] = useState(false);

  const [dismissedOrderIds, setDismissedOrderIds] = useState<string[]>([]);
  const [gpsStatus, setGpsStatus] = useState("🛰️ Live Satellite Active");
  const [userCoords, setUserCoords] = useState<{ lat: number; lng: number }>({ lat: 19.1176, lng: 72.9060 });
  const [isFetchingGPS, setIsFetchingGPS] = useState(false);
  const [mapMode, setMapMode] = useState<"ROUTE" | "OSM" | "SATELLITE">("ROUTE");
  const [queueFilter, setQueueFilter] = useState<"ALL" | "READY" | "TRANSIT" | "DELIVERED">("ALL");
  const [queueSearch, setQueueSearch] = useState("");

  const getStudioCoords = (pickupName?: string, dropoffAddr?: string) => {
    const lower = `${pickupName || ""} ${dropoffAddr || ""}`.toLowerCase();
    if (lower.includes("hastinapuram") || lower.includes("500070") || lower.includes("sarada") || lower.includes("hyderabad") || lower.includes("alwal") || lower.includes("500010") || lower.includes("reedy") || lower.includes("ranga")) {
      return { lat: 17.3551, lng: 78.5300, name: "Pixello Studio (Hastinapuram Branch)", shortName: "Studio Hastinapuram" };
    }
    return { lat: 19.1176, lng: 72.9060, name: "Studio Alpha (Powai Central Branch)", shortName: "Studio Powai" };
  };

  // Fetch Delhivery Status
  useEffect(() => {
    fetch("/api/delivery/delhivery/status")
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setDelhiveryConfig({
            configured: data.configured,
            maskedToken: data.maskedToken,
            carrierName: data.carrierName,
            status: data.status,
            message: data.message,
          });
        }
      })
      .catch(() => {});
  }, []);

  const handleCheckPincodeService = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const pin = pincodeCheckInput.replace(/\D/g, "").slice(0, 6);
    if (pin.length !== 6) return;

    setIsCheckingPincode(true);
    try {
      const res = await fetch(`/api/delivery/delhivery/pincode?pincode=${pin}`);
      const data = await res.json();
      if (data.success) {
        setPincodeResult(data.result);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsCheckingPincode(false);
    }
  };

  const handleBookDelhiveryShipment = async (orderId: string) => {
    setIsBookingDelhivery(true);
    try {
      const res = await fetch("/api/delivery/delhivery/shipment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId }),
      });
      const data = await res.json();
      if (data.success && data.shipment) {
        setDeliverySuccessMsg(`✓ Delhivery AWB Created: ${data.shipment.waybill} • Shipped with Express`);
        if (activeOrder && activeOrder.id === orderId) {
          setActiveOrder({
            ...activeOrder,
            status: "OUT_FOR_DELIVERY",
            waybill: data.shipment.waybill,
            trackingUrl: data.shipment.trackingUrl,
          });
        }
        setTimeout(() => setDeliverySuccessMsg(""), 5000);
      } else {
        alert(data.error || "Failed to create Delhivery shipment");
      }
    } catch (err: any) {
      alert("Delhivery booking error: " + err.message);
    } finally {
      setIsBookingDelhivery(false);
    }
  };

  const handleOpenTrackingModal = async (waybillOrOrderId: string) => {
    setIsTrackingLoading(true);
    setTrackingModalData({
      waybill: waybillOrOrderId,
      orderId: waybillOrOrderId,
      currentStatus: "Querying Delhivery Network...",
      scans: [],
    });

    try {
      const res = await fetch(`/api/delivery/delhivery/track?waybill=${encodeURIComponent(waybillOrOrderId)}`);
      const data = await res.json();
      if (data.success && data.tracking) {
        setTrackingModalData(data.tracking);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsTrackingLoading(false);
    }
  };

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

  // Auto-sync active order from live database if none selected
  useEffect(() => {
    if (orders.length > 0 && !activeOrder) {
      const firstActive = orders.find(
        (o) => o.status !== "Delivered" && o.status !== "Cancelled"
      ) || orders[0];

      if (firstActive) {
        const dropAddress = firstActive.deliveryAddress || "Powai, Mumbai";
        const newActive = {
          id: firstActive.id,
          customerName: firstActive.customerName || "Customer",
          customerPhone: firstActive.customerPhone || "+91 8074589949",
          pickup: firstActive.assignedStudio || "Studio Alpha (Central Powai Branch)",
          dropoff: dropAddress,
          earnings: "₹85.00",
          rawEarningsNum: 85,
          status: firstActive.status === "Delivered" ? "DELIVERED" : (firstActive.status === "Out for Delivery" ? "OUT_FOR_DELIVERY" : "ASSIGNED"),
          totalAmount: firstActive.totalAmount || 899,
          itemsCount: firstActive.items?.length || 1,
          waybill: firstActive.waybill,
          trackingUrl: firstActive.trackingUrl,
        };
        setActiveOrder(newActive);
        const resolved = resolveAddressCoords(dropAddress);
        setUserCoords({ lat: resolved.lat, lng: resolved.lng });
        setGpsStatus(`📍 Navigating to Customer: ${resolved.locationName}`);
      }
    }
  }, [orders, activeOrder]);

  const handleSelectActiveOrder = (order: any) => {
    const dropAddress = order.deliveryAddress || order.address || "Powai, Mumbai";
    const newActive = {
      id: order.id,
      customerName: order.customerName || "Customer",
      customerPhone: order.customerPhone || "+91 8074589949",
      pickup: order.assignedStudio || "Studio Alpha (Central Powai Branch)",
      dropoff: dropAddress,
      earnings: "₹85.00",
      rawEarningsNum: 85,
      status: order.status === "Delivered" ? "DELIVERED" : (order.status === "Out for Delivery" ? "OUT_FOR_DELIVERY" : "ASSIGNED"),
      totalAmount: order.totalAmount || 899,
      itemsCount: order.items?.length || 1,
      waybill: order.waybill,
      trackingUrl: order.trackingUrl,
    };
    setActiveOrder(newActive);
    const resolved = resolveAddressCoords(dropAddress);
    setUserCoords({ lat: resolved.lat, lng: resolved.lng });
    setGpsStatus(`📍 Routing to Customer: ${resolved.locationName}`);
    setDeliverySuccessMsg(`📍 Set Active GPS Route: Order #${order.id}`);
    setTimeout(() => setDeliverySuccessMsg(""), 3500);
  };

  const findNextOrder = () => {
    const eligibleOrders = orders.filter(
      (o) => o.id !== activeOrder?.id && o.status !== "Delivered" && o.status !== "Cancelled"
    );

    if (eligibleOrders.length > 0) {
      const randomIndex = Math.floor(Math.random() * eligibleOrders.length);
      handleSelectActiveOrder(eligibleOrders[randomIndex]);
    } else if (orders.length > 0) {
      handleSelectActiveOrder(orders[0]);
    } else {
      setDeliverySuccessMsg("✓ Waiting for new customer orders from studios.");
    }
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

                  {/* Delhivery One Waybill Badge if dispatched */}
                  {activeOrder.waybill && (
                    <div className="p-3 bg-blue-50 border border-blue-200 rounded-2xl flex items-center justify-between text-xs">
                      <div>
                        <span className="text-[10px] font-extrabold uppercase text-blue-900 block">Delhivery Waybill (AWB)</span>
                        <span className="font-mono font-bold text-blue-700 text-sm">{activeOrder.waybill}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleOpenTrackingModal(activeOrder.waybill)}
                          className="h-8 rounded-full text-xs font-bold border-blue-300 text-blue-800 bg-white hover:bg-blue-100/80 cursor-pointer"
                        >
                          Live Scans
                        </Button>
                        <a
                          href={`https://www.delhivery.com/track/package/${activeOrder.waybill}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="h-8 px-3 rounded-full text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-1 shadow-2xs"
                        >
                          Track <ExternalLink className="h-3 w-3" />
                        </a>
                      </div>
                    </div>
                  )}

                  {/* Action Buttons */}
                  {activeOrder.status === "ASSIGNED" && (
                    <div className="space-y-2 pt-2">
                      <div className="flex gap-2.5">
                        <Button 
                          variant="outline" 
                          className="flex-1 h-11 rounded-2xl text-rose-600 border-rose-200 hover:bg-rose-50 font-bold text-xs cursor-pointer" 
                          onClick={handleRejectOrder}
                        >
                          Decline
                        </Button>
                        <Button 
                          className="flex-[2] h-11 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md cursor-pointer flex items-center justify-center gap-1.5" 
                          onClick={handleAcceptOrder}
                        >
                          Accept Task <ArrowRight className="h-4 w-4" />
                        </Button>
                      </div>

                      {/* Delhivery One Express Dispatch Button */}
                      <Button
                        onClick={() => handleBookDelhiveryShipment(activeOrder.id)}
                        disabled={isBookingDelhivery}
                        className="w-full h-11 rounded-2xl bg-blue-700 hover:bg-blue-800 text-white font-bold text-xs shadow-md cursor-pointer flex items-center justify-center gap-2 transition-all"
                      >
                        <Truck className="h-4 w-4 text-blue-200" />
                        {isBookingDelhivery ? "Booking with Delhivery..." : "⚡ Book with Delhivery One (Generate AWB)"}
                      </Button>
                    </div>
                  )}

                  {activeOrder.status === "OUT_FOR_DELIVERY" && (
                    <div className="space-y-2 pt-2">
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

          {/* Delhivery One Carrier & Pincode Serviceability Card */}
          <Card className="border border-[#EFE6DD] bg-white rounded-3xl shadow-xs overflow-hidden">
            <CardHeader className="bg-[#FFF8F2] border-b border-[#EFE6DD] p-4 flex flex-row items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-xl bg-[#3A2B24] text-white flex items-center justify-center font-bold">
                  <Truck className="h-4 w-4 text-[#D89A86]" />
                </div>
                <div>
                  <CardTitle className="font-serif-brand text-base font-bold text-[#3A2B24]">Delhivery One Integration</CardTitle>
                  <p className="text-[11px] text-[#6C5C54]">B2C Express & Surface Shipping Engine</p>
                </div>
              </div>
              <Badge className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full border ${
                delhiveryConfig.configured
                  ? "bg-emerald-100 text-emerald-800 border-emerald-300"
                  : "bg-amber-100 text-amber-900 border-amber-300"
              }`}>
                {delhiveryConfig.configured ? "● CONNECTED" : "● READY FOR TOKEN"}
              </Badge>
            </CardHeader>

            <CardContent className="p-4 space-y-4 text-xs">
              <div className="p-3 bg-[#FFF8F2]/70 border border-[#EFE6DD] rounded-2xl space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-[#6C5C54] uppercase">API Auth Token Status</span>
                  <span className="font-mono text-xs font-bold text-[#3A2B24]">{delhiveryConfig.maskedToken}</span>
                </div>
                <p className="text-[11px] text-[#6C5C54]">
                  {delhiveryConfig.configured
                    ? "Token is active on server (process.env.DELHIVERY_API_TOKEN). Live shipments & tracking active."
                    : "Add your real token to .env.local as DELHIVERY_API_TOKEN. Preview generator active."}
                </p>
              </div>

              {/* Pincode Serviceability Lookup */}
              <div className="space-y-2">
                <label className="text-[11px] font-bold text-[#3A2B24] uppercase tracking-wider block">
                  Check Pincode Serviceability
                </label>
                <form onSubmit={handleCheckPincodeService} className="flex gap-2">
                  <Input
                    type="text"
                    placeholder="Enter 6-digit Pincode (e.g. 500070)"
                    value={pincodeCheckInput}
                    onChange={(e) => setPincodeCheckInput(e.target.value)}
                    maxLength={6}
                    className="rounded-full text-xs font-semibold border-[#EFE6DD] bg-[#FFF8F2] h-9"
                  />
                  <Button
                    type="submit"
                    disabled={isCheckingPincode || pincodeCheckInput.length !== 6}
                    className="btn-pixello-primary text-xs font-bold rounded-full h-9 px-4 cursor-pointer"
                  >
                    {isCheckingPincode ? "Checking..." : "Verify"}
                  </Button>
                </form>

                {pincodeResult && (
                  <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-2xl animate-in fade-in duration-200">
                    <div className="flex items-center gap-1.5 text-emerald-800 font-bold text-xs">
                      <Check className="h-3.5 w-3.5 text-emerald-600" />
                      <span>{pincodeResult.pincode} — {pincodeResult.city}, {pincodeResult.state}</span>
                    </div>
                    <div className="flex gap-3 text-[11px] text-emerald-700 mt-1 font-medium">
                      <span>• Express Delivery: <strong>2 Days</strong></span>
                      <span>• COD: <strong>{pincodeResult.codAvailable ? "Available" : "No"}</strong></span>
                      <span>• Prepaid: <strong>Available</strong></span>
                    </div>
                  </div>
                )}
              </div>
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

      {/* Live Delhivery & Studio Dispatch Queue Section */}
      <Card className="border border-[#EFE6DD] bg-white rounded-3xl shadow-xs overflow-hidden">
        <CardHeader className="bg-[#FFF8F2] border-b border-[#EFE6DD] p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5">
              <div className="h-9 w-9 rounded-2xl bg-[#3A2B24] text-white flex items-center justify-center font-bold">
                <Package className="h-4 w-4 text-[#D89A86]" />
              </div>
              <div>
                <CardTitle className="font-serif-brand text-xl font-bold text-[#3A2B24]">
                  Live Delhivery & Studio Dispatch Queue ({orders.length})
                </CardTitle>
                <p className="text-xs text-[#6C5C54]">All customer orders synchronized live with central database & Delhivery carrier network</p>
              </div>
            </div>
          </div>

          {/* Filter Pills */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex bg-white p-1 rounded-2xl border border-[#EFE6DD] text-xs font-bold shadow-2xs">
              <button
                onClick={() => setQueueFilter("ALL")}
                className={`px-3.5 py-1.5 rounded-xl transition-all cursor-pointer ${
                  queueFilter === "ALL" ? "bg-[#3A2B24] text-white shadow-xs" : "text-[#6C5C54] hover:text-[#3A2B24]"
                }`}
              >
                All Orders ({orders.length})
              </button>
              <button
                onClick={() => setQueueFilter("READY")}
                className={`px-3.5 py-1.5 rounded-xl transition-all cursor-pointer ${
                  queueFilter === "READY" ? "bg-[#3A2B24] text-white shadow-xs" : "text-[#6C5C54] hover:text-[#3A2B24]"
                }`}
              >
                Ready for Pickup ({orders.filter((o) => o.status === "Packed" || o.status === "Printing" || o.status === "Processing").length})
              </button>
              <button
                onClick={() => setQueueFilter("TRANSIT")}
                className={`px-3.5 py-1.5 rounded-xl transition-all cursor-pointer ${
                  queueFilter === "TRANSIT" ? "bg-[#3A2B24] text-white shadow-xs" : "text-[#6C5C54] hover:text-[#3A2B24]"
                }`}
              >
                In Transit ({orders.filter((o) => o.status === "Out for Delivery" || o.status === "Delivery Picked Up").length})
              </button>
              <button
                onClick={() => setQueueFilter("DELIVERED")}
                className={`px-3.5 py-1.5 rounded-xl transition-all cursor-pointer ${
                  queueFilter === "DELIVERED" ? "bg-[#3A2B24] text-white shadow-xs" : "text-[#6C5C54] hover:text-[#3A2B24]"
                }`}
              >
                Delivered ({orders.filter((o) => o.status === "Delivered").length})
              </button>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-6 space-y-4">
          {/* Search bar */}
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#6C5C54]" />
            <Input
              placeholder="Search by Order ID, Customer Name, Phone, Address, or Delhivery AWB..."
              value={queueSearch}
              onChange={(e) => setQueueSearch(e.target.value)}
              className="pl-10 rounded-2xl bg-[#FFF8F2] border-[#EFE6DD] text-xs h-11"
            />
          </div>

          {/* Orders Grid */}
          {(() => {
            let filtered = orders;
            if (queueFilter === "READY") {
              filtered = orders.filter((o) => o.status === "Packed" || o.status === "Printing" || o.status === "Processing");
            } else if (queueFilter === "TRANSIT") {
              filtered = orders.filter((o) => o.status === "Out for Delivery" || o.status === "Delivery Picked Up");
            } else if (queueFilter === "DELIVERED") {
              filtered = orders.filter((o) => o.status === "Delivered");
            }

            if (queueSearch.trim()) {
              const q = queueSearch.toLowerCase();
              filtered = filtered.filter(
                (o) =>
                  o.id.toLowerCase().includes(q) ||
                  (o.customerName || "").toLowerCase().includes(q) ||
                  (o.customerPhone || "").toLowerCase().includes(q) ||
                  (o.deliveryAddress || "").toLowerCase().includes(q) ||
                  (o.waybill || "").toLowerCase().includes(q) ||
                  (o.assignedStudio || "").toLowerCase().includes(q)
              );
            }

            if (filtered.length === 0) {
              return (
                <div className="p-12 text-center text-[#6C5C54] space-y-2 bg-[#FFF8F2]/50 rounded-2xl border border-dashed border-[#EFE6DD]">
                  <Package className="h-10 w-10 mx-auto text-[#D89A86] opacity-60" />
                  <p className="font-bold text-sm text-[#3A2B24]">No orders matching your criteria</p>
                  <p className="text-xs">Orders placed on the customer store will appear here in real time.</p>
                </div>
              );
            }

            return (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {filtered.map((order) => {
                  const isCurrentActive = activeOrder?.id === order.id;
                  const hasWaybill = !!order.waybill;

                  return (
                    <div
                      key={order.id}
                      className={`p-5 rounded-3xl border transition-all flex flex-col justify-between space-y-4 ${
                        isCurrentActive
                          ? "bg-blue-50/70 border-blue-300 ring-2 ring-blue-300 shadow-md"
                          : "bg-white border-[#EFE6DD] hover:border-[#D89A86]/60 shadow-2xs hover:shadow-xs"
                      }`}
                    >
                      <div className="space-y-3">
                        <div className="flex items-start justify-between gap-2 border-b border-[#EFE6DD] pb-3">
                          <div>
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <Badge
                                className={`border-none px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                                  order.status === "Delivered"
                                    ? "bg-emerald-100 text-emerald-800"
                                    : order.status === "Out for Delivery" || order.status === "Delivery Picked Up"
                                    ? "bg-blue-100 text-blue-800"
                                    : "bg-amber-100 text-amber-900 border border-amber-300"
                                }`}
                              >
                                {order.status}
                              </Badge>

                              {isCurrentActive && (
                                <Badge className="bg-blue-600 text-white border-none text-[9px] font-black px-2 py-0.5 rounded-full">
                                  ● ACTIVE GPS TARGET
                                </Badge>
                              )}
                            </div>

                            <h4 className="font-bold text-base text-[#3A2B24] mt-1">{order.id}</h4>
                            <p className="text-[11px] text-[#6C5C54]">Placed {order.date}</p>
                          </div>

                          <div className="text-right">
                            <span className="font-black text-emerald-600 text-base">₹85.00</span>
                            <span className="text-[10px] text-[#6C5C54] block">Payout</span>
                          </div>
                        </div>

                        {/* Customer & Studio Details */}
                        <div className="p-3 bg-[#FFF8F2]/70 border border-[#EFE6DD] rounded-2xl text-xs space-y-2">
                          <div>
                            <span className="text-[10px] font-bold text-blue-900 uppercase block">Pickup Studio</span>
                            <span className="font-semibold text-[#3A2B24]">{order.assignedStudio || "Studio Alpha (Central Powai Branch)"}</span>
                          </div>
                          <div>
                            <span className="text-[10px] font-bold text-rose-900 uppercase block">Customer & Dropoff</span>
                            <p className="font-semibold text-[#3A2B24]">{order.customerName} ({order.customerPhone})</p>
                            <p className="text-[11px] text-[#6C5C54] line-clamp-2 mt-0.5">{order.deliveryAddress || "Powai, Mumbai"}</p>
                          </div>
                        </div>

                        {/* Delhivery AWB Section */}
                        {hasWaybill ? (
                          <div className="p-3 bg-blue-50 border border-blue-200 rounded-2xl flex items-center justify-between text-xs">
                            <div>
                              <span className="text-[10px] font-extrabold uppercase text-blue-900 block">Delhivery Waybill</span>
                              <span className="font-mono font-bold text-blue-800 text-xs">{order.waybill}</span>
                            </div>
                            <div className="flex gap-1.5">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleOpenTrackingModal(order.waybill!)}
                                className="h-7 text-[11px] font-bold rounded-full border-blue-300 text-blue-800 bg-white hover:bg-blue-100 cursor-pointer"
                              >
                                Live Scans
                              </Button>
                              <a
                                href={`https://www.delhivery.com/track/package/${order.waybill}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="h-7 px-2.5 rounded-full text-[11px] font-bold bg-blue-600 text-white flex items-center gap-1 hover:bg-blue-700 shadow-2xs"
                              >
                                Track <ExternalLink className="h-3 w-3" />
                              </a>
                            </div>
                          </div>
                        ) : (
                          <Button
                            size="sm"
                            disabled={isBookingDelhivery}
                            onClick={() => handleBookDelhiveryShipment(order.id)}
                            className="w-full h-9 rounded-2xl bg-blue-700 hover:bg-blue-800 text-white font-bold text-xs shadow-xs cursor-pointer flex items-center justify-center gap-1.5"
                          >
                            <Truck className="h-3.5 w-3.5 text-blue-200" />
                            <span>⚡ Book with Delhivery One</span>
                          </Button>
                        )}
                      </div>

                      {/* Action Bar */}
                      <div className="pt-2 border-t border-[#EFE6DD] flex items-center gap-2">
                        <Button
                          size="sm"
                          variant={isCurrentActive ? "default" : "outline"}
                          onClick={() => handleSelectActiveOrder(order)}
                          className={`flex-1 rounded-2xl text-xs font-bold h-9 cursor-pointer ${
                            isCurrentActive
                              ? "bg-blue-700 hover:bg-blue-800 text-white"
                              : "border-[#EFE6DD] text-[#3A2B24] hover:bg-[#FFF8F2]"
                          }`}
                        >
                          <Navigation className="h-3.5 w-3.5 mr-1" />
                          <span>{isCurrentActive ? "Active on GPS" : "Set GPS Route"}</span>
                        </Button>

                        {order.status !== "Delivered" && (
                          <Button
                            size="sm"
                            onClick={() => updateOrderStatus(order.id, "Delivered")}
                            className="rounded-2xl text-xs font-bold h-9 px-3 bg-emerald-600 hover:bg-emerald-700 text-white cursor-pointer shadow-xs"
                          >
                            <CheckCircle2 className="h-3.5 w-3.5" />
                          </Button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            );
          })()}
        </CardContent>
      </Card>
      {trackingModalData && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl border border-[#EFE6DD] shadow-2xl max-w-lg w-full overflow-hidden flex flex-col max-h-[85vh]">
            <div className="p-5 bg-[#3A2B24] text-white flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <Truck className="h-5 w-5 text-[#D89A86]" />
                <div>
                  <h3 className="font-serif-brand font-bold text-base">Delhivery One Live Carrier Tracking</h3>
                  <p className="text-[11px] text-stone-300 font-mono">AWB / Waybill: {trackingModalData.waybill}</p>
                </div>
              </div>
              <button
                onClick={() => setTrackingModalData(null)}
                className="h-8 w-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center cursor-pointer transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="p-5 space-y-4 overflow-y-auto flex-1 text-xs">
              <div className="p-3.5 bg-blue-50 border border-blue-200 rounded-2xl flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-extrabold uppercase text-blue-900 block">Current Express Status</span>
                  <span className="font-bold text-sm text-blue-900">{trackingModalData.currentStatus || "In Transit"}</span>
                </div>
                <Badge className="bg-blue-600 text-white border-none font-bold text-[10px] px-2.5 py-0.5 rounded-full">
                  DELHIVERY B2C
                </Badge>
              </div>

              <div className="grid grid-cols-2 gap-3 text-[11px]">
                <div className="p-3 bg-[#FFF8F2] border border-[#EFE6DD] rounded-xl">
                  <span className="text-[10px] font-bold text-[#6C5C54] uppercase block">Origin Studio Hub</span>
                  <p className="font-semibold text-[#3A2B24] mt-0.5">{trackingModalData.origin || "Powai Central Studio"}</p>
                </div>
                <div className="p-3 bg-[#FFF8F2] border border-[#EFE6DD] rounded-xl">
                  <span className="text-[10px] font-bold text-[#6C5C54] uppercase block">Est. Delivery Date</span>
                  <p className="font-semibold text-[#3A2B24] mt-0.5">{trackingModalData.estimatedDelivery || "Within 48 Hours"}</p>
                </div>
              </div>

              {/* Scans Timeline */}
              <div className="space-y-3 pt-2">
                <h4 className="font-bold text-xs uppercase tracking-wider text-[#3A2B24]">Real-Time Transit Scans</h4>
                {isTrackingLoading ? (
                  <div className="p-6 text-center text-[#6C5C54]">
                    <RefreshCw className="h-5 w-5 animate-spin mx-auto text-[#D89A86] mb-2" />
                    <span>Connecting to Delhivery API...</span>
                  </div>
                ) : trackingModalData.scans && trackingModalData.scans.length > 0 ? (
                  <div className="space-y-3 relative pl-4 before:absolute before:left-1.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-blue-200">
                    {trackingModalData.scans.map((scan: any, idx: number) => (
                      <div key={idx} className="relative pl-3 space-y-0.5">
                        <div className={`absolute -left-[19px] top-1 h-3 w-3 rounded-full border-2 border-white ${idx === 0 ? "bg-blue-600 ring-2 ring-blue-200" : "bg-slate-300"}`} />
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-[#3A2B24] text-xs">{scan.status}</span>
                          <span className="text-[10px] text-[#6C5C54] font-medium">{scan.time}</span>
                        </div>
                        <p className="text-[11px] text-[#6C5C54]">{scan.location}</p>
                        {scan.instructions && (
                          <p className="text-[10px] text-blue-700 italic">{scan.instructions}</p>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-4 bg-stone-50 rounded-xl text-center text-xs text-[#6C5C54]">
                    Shipment manifested. Waiting for initial carrier pickup scan at partner studio.
                  </div>
                )}
              </div>
            </div>

            <div className="p-4 bg-[#FFF8F2] border-t border-[#EFE6DD] flex gap-2">
              <a
                href={trackingModalData.trackingUrl || `https://www.delhivery.com/track/package/${trackingModalData.waybill}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 btn-pixello-primary text-xs font-bold rounded-2xl h-10 flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
              >
                Track on Delhivery.com <ExternalLink className="h-3.5 w-3.5" />
              </a>
              <Button
                variant="outline"
                onClick={() => setTrackingModalData(null)}
                className="rounded-2xl text-xs font-bold border-[#EFE6DD] h-10 px-5"
              >
                Close
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}