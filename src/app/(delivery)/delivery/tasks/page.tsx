"use client";

import { useState } from "react";
import { useOrders } from "@/context/OrderContext";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Truck, Package, ChevronRight, Search, ExternalLink, X, RefreshCw } from "lucide-react";
import Link from "next/link";

export default function DeliveryTasksPage() {
  const { orders, updateOrderStatus } = useOrders();
  const [filter, setFilter] = useState<"ALL" | "ACTIVE" | "COMPLETED">("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [isBookingId, setIsBookingId] = useState<string | null>(null);
  const [trackingModalData, setTrackingModalData] = useState<any | null>(null);
  const [isTrackingLoading, setIsTrackingLoading] = useState(false);

  const activeDeliveries = orders.filter(
    (o) => o.status === "Out for Delivery" || o.status === "Delivery Picked Up" || o.status === "Printing" || o.status === "Packed"
  );
  const completedDeliveries = orders.filter((o) => o.status === "Delivered");

  let filteredList = filter === "ACTIVE" 
    ? activeDeliveries 
    : filter === "COMPLETED" 
      ? completedDeliveries 
      : orders;

  if (searchQuery.trim()) {
    const q = searchQuery.toLowerCase();
    filteredList = filteredList.filter(
      (o) =>
        o.id.toLowerCase().includes(q) ||
        (o.customerName || "").toLowerCase().includes(q) ||
        (o.deliveryAddress || "").toLowerCase().includes(q) ||
        (o.waybill || "").toLowerCase().includes(q)
    );
  }

  const handleBookDelhivery = async (orderId: string) => {
    setIsBookingId(orderId);
    try {
      const res = await fetch("/api/delivery/delhivery/shipment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId }),
      });
      const data = await res.json();
      if (data.success && data.shipment) {
        alert(`✓ Delhivery AWB Created: ${data.shipment.waybill}`);
      } else {
        alert(data.error || "Failed to create Delhivery shipment");
      }
    } catch (err: any) {
      alert("Error: " + err.message);
    } finally {
      setIsBookingId(null);
    }
  };

  const handleOpenTracking = async (waybillOrOrderId: string) => {
    setIsTrackingLoading(true);
    setTrackingModalData({
      waybill: waybillOrOrderId,
      orderId: waybillOrOrderId,
      currentStatus: "Connecting to Delhivery Network...",
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

  return (
    <div className="space-y-6">
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-3xl border border-[#EFE6DD] shadow-xs">
        <div>
          <h1 className="font-serif-brand text-2xl font-bold text-[#3A2B24]">Delivery Tasks & Queue</h1>
          <p className="text-xs text-[#6C5C54] mt-0.5">Track active doorstep dispatches, Delhivery express shipments & completed orders.</p>
        </div>

        {/* Filter Pills */}
        <div className="flex bg-[#FFF8F2] p-1.5 rounded-2xl border border-[#EFE6DD] text-xs font-bold w-full sm:w-auto">
          <button 
            onClick={() => setFilter("ALL")} 
            className={`px-4 py-2 rounded-xl transition-all cursor-pointer ${filter === "ALL" ? "bg-[#3A2B24] text-white shadow-xs" : "text-[#6C5C54] hover:text-[#3A2B24]"}`}
          >
            All Tasks ({orders.length})
          </button>
          <button 
            onClick={() => setFilter("ACTIVE")} 
            className={`px-4 py-2 rounded-xl transition-all cursor-pointer ${filter === "ACTIVE" ? "bg-[#3A2B24] text-white shadow-xs" : "text-[#6C5C54] hover:text-[#3A2B24]"}`}
          >
            Active ({activeDeliveries.length})
          </button>
          <button 
            onClick={() => setFilter("COMPLETED")} 
            className={`px-4 py-2 rounded-xl transition-all cursor-pointer ${filter === "COMPLETED" ? "bg-[#3A2B24] text-white shadow-xs" : "text-[#6C5C54] hover:text-[#3A2B24]"}`}
          >
            Completed ({completedDeliveries.length})
          </button>
        </div>
      </div>

      {/* Search Input */}
      <div className="relative">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#6C5C54]" />
        <input
          type="text"
          placeholder="Search by Order ID, Customer Name, Pincode, Address, or Delhivery AWB..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-10 pr-4 py-3 bg-white border border-[#EFE6DD] rounded-2xl text-xs font-medium placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-[#D89A86]/40"
        />
      </div>

      {/* Task Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredList.length === 0 ? (
          <div className="col-span-full p-12 text-center bg-white rounded-3xl border border-[#EFE6DD] text-xs text-[#6C5C54] space-y-2">
            <Package className="h-12 w-12 text-[#D89A86] mx-auto opacity-50" />
            <h3 className="font-bold text-base text-[#3A2B24]">No delivery tasks found</h3>
            <p>New assigned orders from customer store will appear automatically in your queue.</p>
          </div>
        ) : (
          filteredList.map((order) => {
            const hasWaybill = !!order.waybill;
            return (
              <Card key={order.id} className="bg-white border border-[#EFE6DD] rounded-3xl shadow-xs hover:shadow-md transition-all overflow-hidden flex flex-col justify-between">
                <CardContent className="p-6 space-y-4">
                  <div className="flex justify-between items-start border-b border-[#EFE6DD] pb-3">
                    <div>
                      <Badge className={`border-none px-3 py-0.5 rounded-full text-xs font-bold ${
                        order.status === "Delivered" ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-900 border border-amber-300"
                      }`}>
                        {order.status}
                      </Badge>
                      <h4 className="font-bold text-base text-[#3A2B24] mt-1.5">{order.id}</h4>
                      <p className="text-xs text-[#6C5C54]">Placed on {order.date}</p>
                    </div>
                    <div className="text-right">
                      <span className="font-extrabold text-lg text-emerald-600">₹85.00</span>
                      <p className="text-[10px] text-[#6C5C54]">Rider Payout</p>
                    </div>
                  </div>

                  <div className="p-3.5 bg-[#FFF8F2]/60 border border-[#EFE6DD] rounded-2xl text-xs space-y-2">
                    <div>
                      <p className="font-bold text-blue-900 text-[10px] uppercase">Pickup Studio</p>
                      <p className="font-semibold text-[#3A2B24] mt-0.5">{order.assignedStudio || "Pixello Central Warehouse, Powai"}</p>
                    </div>
                    <div>
                      <p className="font-bold text-rose-900 text-[10px] uppercase">Dropoff Address</p>
                      <p className="font-semibold text-[#3A2B24] mt-0.5">
                        {(order.deliveryAddress && order.deliveryAddress.trim() !== "" && order.deliveryAddress.trim() !== "-") ? order.deliveryAddress : "Flat 402, Sunshine Heights, Central Powai Road, Mumbai - 400076"}
                      </p>
                    </div>
                  </div>

                  {/* Delhivery AWB & Status */}
                  {hasWaybill ? (
                    <div className="p-3 bg-blue-50 border border-blue-200 rounded-2xl flex items-center justify-between text-xs">
                      <div>
                        <span className="text-[10px] font-extrabold uppercase text-blue-900 block">Delhivery Waybill (AWB)</span>
                        <span className="font-mono font-bold text-blue-800 text-xs">{order.waybill}</span>
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleOpenTracking(order.waybill!)}
                        className="h-7 text-[11px] font-bold rounded-full border-blue-300 text-blue-800 bg-white hover:bg-blue-100 cursor-pointer"
                      >
                        Live Scans
                      </Button>
                    </div>
                  ) : (
                    <Button
                      size="sm"
                      disabled={isBookingId === order.id}
                      onClick={() => handleBookDelhivery(order.id)}
                      className="w-full h-9 rounded-2xl bg-blue-700 hover:bg-blue-800 text-white font-bold text-xs shadow-xs cursor-pointer flex items-center justify-center gap-1.5"
                    >
                      <Truck className="h-3.5 w-3.5 text-blue-200" />
                      <span>{isBookingId === order.id ? "Booking..." : "⚡ Book with Delhivery One"}</span>
                    </Button>
                  )}
                </CardContent>

                <div className="p-4 bg-[#FFF8F2] border-t border-[#EFE6DD] flex gap-2">
                  <Link href="/delivery" className="flex-1">
                    <Button variant="outline" className="w-full rounded-2xl text-xs font-bold border-[#EFE6DD] hover:bg-white text-[#3A2B24] h-10">
                      Live Route <ChevronRight className="h-4 w-4 ml-1 text-[#D89A86]" />
                    </Button>
                  </Link>

                  {hasWaybill ? (
                    <a
                      href={`https://www.delhivery.com/track/package/${order.waybill}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3.5 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl text-xs font-bold h-10 flex items-center justify-center gap-1 shadow-2xs"
                    >
                      Track <ExternalLink className="h-3 w-3" />
                    </a>
                  ) : null}

                  {order.status !== "Delivered" && (
                    <Button
                      size="sm"
                      onClick={() => updateOrderStatus(order.id, "Delivered")}
                      className="rounded-2xl text-xs font-bold h-10 px-3.5 bg-emerald-600 hover:bg-emerald-700 text-white cursor-pointer shadow-xs"
                    >
                      <CheckCircle2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </Card>
            );
          })
        )}
      </div>

      {/* Tracking Modal Dialog */}
      {trackingModalData && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl border border-[#EFE6DD] shadow-2xl max-w-lg w-full overflow-hidden flex flex-col max-h-[85vh]">
            <div className="p-5 bg-[#3A2B24] text-white flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <Truck className="h-5 w-5 text-[#D89A86]" />
                <div>
                  <h3 className="font-serif-brand font-bold text-base">Delhivery Live Tracking</h3>
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
                  <span className="text-[10px] font-extrabold uppercase text-blue-900 block">Current Status</span>
                  <span className="font-bold text-sm text-blue-900">{trackingModalData.currentStatus || "In Transit"}</span>
                </div>
                <Badge className="bg-blue-600 text-white border-none font-bold text-[10px] px-2.5 py-0.5 rounded-full">
                  DELHIVERY B2C
                </Badge>
              </div>

              <div className="space-y-3 pt-2">
                <h4 className="font-bold text-xs uppercase tracking-wider text-[#3A2B24]">Transit History</h4>
                {isTrackingLoading ? (
                  <div className="p-6 text-center text-[#6C5C54]">
                    <RefreshCw className="h-5 w-5 animate-spin mx-auto text-[#D89A86] mb-2" />
                    <span>Connecting to Delhivery...</span>
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
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-4 bg-stone-50 rounded-xl text-center text-xs text-[#6C5C54]">
                    Shipment manifested. Initial carrier pickup scan in progress.
                  </div>
                )}
              </div>
            </div>

            <div className="p-4 bg-[#FFF8F2] border-t border-[#EFE6DD] flex gap-2">
              <a
                href={`https://www.delhivery.com/track/package/${trackingModalData.waybill}`}
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
