"use client";

import { useState } from "react";
import { Printer, PackageCheck, AlertCircle, Clock, MapPin, Truck, CheckCircle2, FileText, Eye, X, Download, Image as ImageIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { useOrders } from "@/context/OrderContext";

const getItemPhotosList = (item: { image?: string; photos?: string[]; quantity?: number }) => {
  const qty = item?.quantity || 1;
  let photos: string[] = [];
  if (item?.photos && item.photos.length > 0) {
    photos = item.photos.map(p => (typeof p === "string" && (p.startsWith("data:") || p.startsWith("http") || p.startsWith("/"))) ? p : (item.image || "https://images.unsplash.com/photo-1513519245088-0e12902e5a38?w=800&q=80"));
  } else if (item?.image) {
    photos = [item.image];
  } else {
    photos = ["https://images.unsplash.com/photo-1513519245088-0e12902e5a38?w=800&q=80"];
  }

  const targetCount = Math.max(photos.length, qty);
  const result: string[] = [];
  for (let i = 0; i < targetCount; i++) {
    result.push(photos[i] || photos[0]);
  }
  return result;
};

const getValidPhotoUrl = (item: { image?: string; photos?: string[] }) => {
  const list = getItemPhotosList(item);
  return list[0];
};

export default function StudioDashboard() {
  const { orders, updateOrderStatus } = useOrders();

  const [previewModal, setPreviewModal] = useState<{
    isOpen: boolean;
    orderId: string;
    customerName: string;
    customerPhone: string;
    itemName: string;
    itemSize: string;
    photos: string[];
    activePhotoIdx: number;
    assignedStudio: string;
  } | null>(null);

  const activeOrders = orders.filter(o => o.status !== "Delivered");
  const printingCount = orders.filter(o => o.status === "Printing").length;
  const readyCount = orders.filter(o => o.status === "Ready for Delivery").length;
  const completedCount = orders.filter(o => o.status === "Delivered").length;
  
  // Credited Revenue: ONLY credited when status === "Delivered"
  const creditedOrders = orders.filter(o => o.status === "Delivered");
  const creditedRevenue = creditedOrders.reduce((sum, o) => sum + (o.totalAmount || 0), 0);

  // Pending Credits: orders currently in progress
  const pendingOrders = orders.filter(o => o.status !== "Delivered");
  const pendingRevenue = pendingOrders.reduce((sum, o) => sum + (o.totalAmount || 0), 0);

  const totalPipelineRevenue = creditedRevenue + pendingRevenue;
  const settlementPercentage = totalPipelineRevenue > 0 ? (creditedRevenue / totalPipelineRevenue) * 100 : 0;

  return (
    <div className="flex flex-col gap-8 p-6 bg-[#F8F3EE] min-h-screen">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-serif-brand text-3xl font-bold text-[#3A2B24]">Photo Studio Production Portal</h1>
          <p className="text-xs text-[#6C5C54] mt-1">Studio Alpha (Central Powai Branch) • Live Executive Financial & Production Overview</p>
        </div>
        <Badge className="bg-[#FFF8F2] text-[#D89A86] border border-[#D89A86]/30 px-3.5 py-1.5 text-xs font-bold rounded-full shadow-2xs">
          ⚡ 15-Min Express Printing Active
        </Badge>
      </div>

      {/* NEW EXECUTIVE FORMAT: Financial Wallet Hero + Operations Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Financial Wallet Hero Card (7 Cols) */}
        <Card className="lg:col-span-7 border border-emerald-200 bg-gradient-to-br from-emerald-50/90 via-white to-[#FFF8F2] rounded-3xl shadow-sm overflow-hidden relative">
          <CardContent className="p-6 md:p-8 flex flex-col justify-between h-full">
            <div>
              <div className="flex items-center justify-between gap-2 mb-3">
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 rounded-full bg-emerald-500 text-white flex items-center justify-center font-bold shadow-xs">
                    <CheckCircle2 className="h-5 w-5 stroke-[2.5]" />
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-emerald-900 uppercase tracking-wider">Credited Studio Wallet Balance</h3>
                    <p className="text-[11px] text-emerald-700 font-medium">Auto-credited upon customer delivery confirmation</p>
                  </div>
                </div>
                <Badge className="bg-emerald-600 text-white border-none font-bold text-xs px-3 py-1 rounded-full shadow-2xs">
                  ✓ Ready for Payout
                </Badge>
              </div>

              <div className="my-4">
                <div className="text-3xl md:text-4xl lg:text-5xl font-extrabold text-emerald-600 tracking-tight">
                  ₹{creditedRevenue.toFixed(2)}
                </div>
                <p className="text-xs font-bold text-[#3A2B24] mt-1.5 flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                  {completedCount} Delivered Orders Payout Cleared
                </p>
              </div>
            </div>

            <div className="pt-4 border-t border-emerald-200/80 mt-4 space-y-3">
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-xs">
                <div className="bg-white/80 border border-amber-200/80 rounded-2xl p-3">
                  <span className="text-[10px] font-bold text-amber-800 uppercase tracking-wider block mb-0.5">Pending Credits</span>
                  <span className="text-lg font-extrabold text-amber-600">₹{pendingRevenue.toFixed(2)}</span>
                  <span className="text-[10px] text-[#6C5C54] block mt-0.5 font-medium">{pendingOrders.length} Orders In Queue</span>
                </div>

                <div className="bg-white/80 border border-[#EFE6DD] rounded-2xl p-3">
                  <span className="text-[10px] font-bold text-[#3A2B24] uppercase tracking-wider block mb-0.5">Total Order Pipeline</span>
                  <span className="text-lg font-extrabold text-[#3A2B24]">₹{totalPipelineRevenue.toFixed(2)}</span>
                  <span className="text-[10px] text-[#6C5C54] block mt-0.5 font-medium">{orders.length} Total Jobs</span>
                </div>

                <div className="col-span-2 sm:col-span-1 bg-white/80 border border-[#EFE6DD] rounded-2xl p-3">
                  <span className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider block mb-0.5">Settlement Rate</span>
                  <span className="text-lg font-extrabold text-emerald-700">{settlementPercentage.toFixed(1)}%</span>
                  <span className="text-[10px] text-emerald-600 block mt-0.5 font-medium">Delivered Ratio</span>
                </div>
              </div>

              {/* Progress Meter */}
              <div className="space-y-1">
                <div className="flex justify-between text-[11px] font-bold text-[#6C5C54]">
                  <span>Payout Settlement Meter</span>
                  <span className="text-emerald-700 font-extrabold">{settlementPercentage.toFixed(1)}% Credited</span>
                </div>
                <div className="w-full bg-emerald-100/70 rounded-full h-2.5 overflow-hidden p-0.5">
                  <div 
                    className="bg-gradient-to-r from-emerald-500 to-[#D89A86] h-full rounded-full transition-all duration-700 shadow-2xs" 
                    style={{ width: `${Math.min(100, Math.max(5, settlementPercentage))}%` }}
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Right Column: Operations Cards Grid (5 Cols) */}
        <div className="lg:col-span-5 flex flex-col gap-4">
          <Card className="border border-[#EFE6DD] bg-white rounded-3xl shadow-xs hover:shadow-sm transition-shadow">
            <CardContent className="p-5 flex items-center justify-between">
              <div>
                <span className="text-[11px] font-bold text-[#6C5C54] uppercase tracking-wider block mb-0.5">
                  In Production Queue
                </span>
                <span className="text-3xl font-extrabold text-[#D89A86]">{printingCount}</span>
                <p className="text-xs text-[#6C5C54] mt-1 font-medium">
                  {readyCount} Ready • {printingCount} Printing
                </p>
              </div>
              <div className="h-12 w-12 rounded-2xl bg-[#FFF8F2] border border-[#EFE6DD] text-[#D89A86] flex items-center justify-center font-bold text-xl shadow-2xs">
                🖨️
              </div>
            </CardContent>
          </Card>

          <Card className="border border-emerald-200 bg-white rounded-3xl shadow-xs hover:shadow-sm transition-shadow">
            <CardContent className="p-5 flex items-center justify-between">
              <div>
                <span className="text-[11px] font-bold text-emerald-800 uppercase tracking-wider block mb-0.5">
                  Completed Doorstep Deliveries
                </span>
                <span className="text-3xl font-extrabold text-emerald-600">{completedCount}</span>
                <p className="text-xs text-emerald-700 mt-1 font-medium">
                  100% Payout Cleared to Wallet
                </p>
              </div>
              <div className="h-12 w-12 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-600 flex items-center justify-center font-bold text-xl shadow-2xs">
                ✅
              </div>
            </CardContent>
          </Card>

          <Card className="border border-[#EFE6DD] bg-white rounded-3xl shadow-xs hover:shadow-sm transition-shadow">
            <CardContent className="p-5 flex items-center justify-between">
              <div>
                <span className="text-[11px] font-bold text-[#6C5C54] uppercase tracking-wider block mb-0.5">
                  Total Studio Lifetime Jobs
                </span>
                <span className="text-3xl font-extrabold text-[#3A2B24]">{orders.length}</span>
                <p className="text-xs text-[#6C5C54] mt-1 font-medium">
                  Average Turnaround: 15 Mins
                </p>
              </div>
              <div className="h-12 w-12 rounded-2xl bg-[#FFF8F2] border border-[#EFE6DD] text-[#3A2B24] flex items-center justify-center font-bold text-xl shadow-2xs">
                📊
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Live Orders Production List */}
      <Card className="border border-[#EFE6DD] bg-white rounded-3xl shadow-sm overflow-hidden">
        <CardHeader className="p-8 md:p-10 pb-4">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <CardTitle className="font-serif-brand text-2xl md:text-3xl font-bold text-[#3A2B24]">Studio Production Queue</CardTitle>
              <CardDescription className="text-xs md:text-sm text-[#6C5C54] mt-1">Live print jobs assigned to your photo studio</CardDescription>
            </div>
            <Badge className="bg-[#FFF8F2] text-[#D89A86] border border-[#D89A86]/30 px-4 py-2 rounded-full text-xs font-bold shadow-2xs">
              {activeOrders.length} Active Jobs
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="p-8 md:p-10 pt-2 flex flex-col gap-8">
          {orders.length === 0 ? (
            <p className="text-sm text-[#6C5C54] text-center py-12">No incoming orders in studio queue.</p>
          ) : (
            orders.map(order => (
              <div key={order.id} className="border border-[#EFE6DD] bg-[#FFF8F2]/60 rounded-3xl p-6 sm:p-8 flex flex-col gap-6 shadow-2xs">
                <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#EFE6DD] pb-3">
                  <div className="flex items-center gap-3">
                    <span className="font-bold text-base text-[#3A2B24]">{order.id}</span>
                    <Badge className="bg-[#D89A86] text-white border-none text-xs">{order.status}</Badge>
                  </div>
                  <div className="text-xs text-[#6C5C54] font-medium">
                    Customer: <span className="font-bold text-[#3A2B24]">{order.customerName}</span> ({order.customerPhone})
                  </div>
                  <div className="text-xs text-[#6C5C54]">
                    Placed: {order.date} • Total: <span className="font-bold text-[#D89A86]">₹{order.totalAmount.toFixed(2)}</span>
                  </div>
                </div>

                {/* Items & Uploaded Photos */}
                <div className="space-y-3">
                  <h4 className="text-xs font-bold text-[#3A2B24] uppercase tracking-wider">Frames & High-Res Print Files:</h4>
                  {order.items.map((item, idx) => {
                    const photoList = getItemPhotosList(item);
                    return (
                      <div key={idx} className="bg-white border border-[#EFE6DD] rounded-2xl p-5 flex flex-col gap-4 shadow-xs">
                        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                          <div 
                            onClick={() => setPreviewModal({
                              isOpen: true,
                              orderId: order.id,
                              customerName: order.customerName,
                              customerPhone: order.customerPhone,
                              itemName: item.name,
                              itemSize: item.size,
                              photos: photoList,
                              activePhotoIdx: 0,
                              assignedStudio: order.assignedStudio
                            })}
                            className="flex items-center gap-3.5 cursor-pointer group flex-1"
                          >
                            <div className="relative h-14 w-14 rounded-2xl bg-[#FFF8F2] border border-[#EFE6DD] overflow-hidden flex-shrink-0 group-hover:scale-105 transition-transform shadow-2xs">
                              <img src={photoList[0]} alt={item.name} className="h-full w-full object-cover" />
                              <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                                <Eye className="h-4 w-4 text-white drop-shadow-md" />
                              </div>
                            </div>
                            <div>
                              <p className="font-bold text-base text-[#3A2B24] group-hover:text-[#D89A86] transition-colors">{item.name}</p>
                              <p className="text-xs text-[#6C5C54] mt-0.5 font-medium">Size: <span className="font-bold text-[#D89A86]">{item.size}</span> • Quantity: <strong className="text-[#3A2B24]">{item.quantity}</strong></p>
                            </div>
                          </div>

                          {/* Photo Files Action Button */}
                          <div className="flex flex-wrap gap-2">
                            <Button 
                              variant="outline" 
                              size="sm" 
                              className="text-xs rounded-full border-emerald-300 bg-emerald-50 text-emerald-800 hover:bg-emerald-100 font-bold px-4 h-9 flex items-center gap-1.5 shadow-2xs cursor-pointer"
                              onClick={() => setPreviewModal({
                                isOpen: true,
                                orderId: order.id,
                                customerName: order.customerName,
                                customerPhone: order.customerPhone,
                                itemName: item.name,
                                itemSize: item.size,
                                photos: photoList,
                                activePhotoIdx: 0,
                                assignedStudio: order.assignedStudio
                              })}
                            >
                              <Download className="h-4 w-4 text-emerald-600" /> View HD Print Files ({photoList.length})
                            </Button>
                          </div>
                        </div>

                        {/* Photo Badges Container with Generous Padding & Spacing */}
                        <div className="p-5 sm:p-6 bg-[#FFF8F2]/90 border border-[#EFE6DD] rounded-2xl flex flex-col gap-3 mt-2 shadow-xs">
                          <span className="text-xs font-extrabold uppercase tracking-wider text-[#3A2B24]">
                            CUSTOMER UPLOADED PRINT FILES ({photoList.length}):
                          </span>
                          <div className="flex flex-wrap gap-2.5 sm:gap-3 pt-1">
                            {photoList.map((pUrl, pIdx) => (
                              <button
                                key={pIdx}
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setPreviewModal({
                                    isOpen: true,
                                    orderId: order.id,
                                    customerName: order.customerName,
                                    customerPhone: order.customerPhone,
                                    itemName: item.name,
                                    itemSize: item.size,
                                    photos: photoList,
                                    activePhotoIdx: pIdx,
                                    assignedStudio: order.assignedStudio
                                  });
                                }}
                                className="text-xs font-bold text-emerald-900 bg-emerald-100/90 hover:bg-emerald-200 border border-emerald-300 px-4 py-2 rounded-full inline-flex items-center gap-2 cursor-pointer transition-all shadow-xs hover:scale-105 active:scale-95"
                              >
                                <ImageIcon className="h-4 w-4 text-emerald-600" /> Photo #{pIdx + 1}
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Studio Controls */}
                <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-[#EFE6DD]">
                  <div className="text-xs text-[#6C5C54]">
                    <MapPin className="h-3.5 w-3.5 inline mr-1 text-[#D89A86]" />
                    Delivery Address: {order.deliveryAddress}
                  </div>

                  <div className="flex items-center gap-2">
                    {order.status === "Printing" && (
                      <Button 
                        size="sm" 
                        className="bg-blue-600 hover:bg-blue-700 text-white rounded-full text-xs"
                        onClick={() => updateOrderStatus(order.id, "Ready for Delivery")}
                      >
                        <PackageCheck className="h-3.5 w-3.5 mr-1" /> Mark Ready for Delivery
                      </Button>
                    )}
                    {order.status === "Ready for Delivery" && (
                      <Button 
                        size="sm" 
                        className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-full text-xs"
                        onClick={() => updateOrderStatus(order.id, "Delivered")}
                      >
                        <Truck className="h-3.5 w-3.5 mr-1" /> Hand over to Rider / Complete
                      </Button>
                    )}
                    {order.status === "Delivered" && (
                      <Badge className="bg-emerald-100 text-emerald-800 border-none text-xs px-3 py-1">
                        ✓ Order Completed
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      {/* Studio Credited Payout Ledger */}
      <Card className="border border-emerald-200 bg-white rounded-3xl shadow-xs overflow-hidden">
        <CardHeader className="bg-emerald-50/60 border-b border-emerald-200 p-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <CardTitle className="font-serif-brand text-xl font-bold text-emerald-950 flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-emerald-600" /> Credited Payout Ledger
              </CardTitle>
              <CardDescription className="text-xs text-emerald-800 mt-0.5">
                Amounts are credited to Studio Alpha account immediately upon customer delivery confirmation.
              </CardDescription>
            </div>
            <Badge className="bg-emerald-600 text-white border-none text-xs font-bold px-3 py-1 rounded-full">
              ₹{creditedRevenue.toFixed(2)} Total Credited
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="p-6">
          {creditedOrders.length === 0 ? (
            <p className="text-xs text-[#6C5C54] text-center py-6">
              No orders credited yet. Advance an order to "Delivered" stage to credit payout instantly!
            </p>
          ) : (
            <div className="overflow-x-auto border border-emerald-100 rounded-2xl">
              <table className="w-full text-xs text-left">
                <thead className="bg-emerald-50 text-emerald-900 font-bold uppercase tracking-wider border-b border-emerald-100">
                  <tr>
                    <th className="px-4 py-3">Order ID</th>
                    <th className="px-4 py-3">Customer</th>
                    <th className="px-4 py-3">Delivery Date</th>
                    <th className="px-4 py-3">Credit Status</th>
                    <th className="px-4 py-3 text-right">Credited Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-emerald-50">
                  {creditedOrders.map((ord) => (
                    <tr key={ord.id} className="hover:bg-emerald-50/40 transition-colors">
                      <td className="px-4 py-3 font-bold text-[#3A2B24]">{ord.id}</td>
                      <td className="px-4 py-3 text-[#6C5C54] font-medium">{ord.customerName} ({ord.customerPhone})</td>
                      <td className="px-4 py-3 text-[#6C5C54]">{ord.date}</td>
                      <td className="px-4 py-3">
                        <span className="bg-emerald-100 text-emerald-800 border border-emerald-300 px-2.5 py-0.5 rounded-full font-bold text-[10px] inline-flex items-center gap-1">
                          <CheckCircle2 className="h-3 w-3 text-emerald-600" /> Credited to Studio Account
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right font-extrabold text-emerald-600 text-sm">
                        + ₹{ord.totalAmount.toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Customer Uploaded High-Res Photo Modal (Multi-Photo Gallery) */}
      {previewModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-2xl w-full border border-[#EFE6DD] shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
            <div className="p-5 bg-[#FFF8F2] border-b border-[#EFE6DD] flex items-center justify-between">
              <div>
                <Badge className="bg-emerald-600 text-white border-none text-xs font-bold px-3 py-0.5 rounded-full mb-1">
                  HD Customer Photo #{previewModal.activePhotoIdx + 1} of {previewModal.photos.length}
                </Badge>
                <h3 className="font-serif-brand font-bold text-lg text-[#3A2B24]">
                  {previewModal.orderId} • {previewModal.customerName}
                </h3>
                <p className="text-xs text-[#6C5C54]">
                  Item: <span className="font-bold text-[#3A2B24]">{previewModal.itemName}</span> ({previewModal.itemSize})
                </p>
              </div>
              <button
                onClick={() => setPreviewModal(null)}
                className="h-9 w-9 rounded-full bg-white border border-[#EFE6DD] flex items-center justify-center text-[#6C5C54] hover:text-[#3A2B24] hover:bg-[#FFF8F2] transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-6 bg-slate-900/5 flex-1 overflow-y-auto flex flex-col items-center justify-center min-h-[300px]">
              <div className="relative rounded-2xl overflow-hidden border border-[#EFE6DD] shadow-lg max-h-[45vh] bg-slate-900/5">
                <img
                  src={previewModal.photos[previewModal.activePhotoIdx]}
                  alt={`Customer Photo ${previewModal.activePhotoIdx + 1}`}
                  className="max-h-[45vh] max-w-full object-contain rounded-2xl"
                />
              </div>

              {/* Photo Selector Thumbnails Carousel */}
              {previewModal.photos.length > 1 && (
                <div className="w-full mt-4 flex items-center gap-2 overflow-x-auto pb-1 px-1 justify-center">
                  {previewModal.photos.map((pUrl, pIdx) => (
                    <button
                      key={pIdx}
                      onClick={() => setPreviewModal({ ...previewModal, activePhotoIdx: pIdx })}
                      className={`relative h-12 w-12 rounded-xl overflow-hidden border-2 flex-shrink-0 cursor-pointer transition-all ${
                        pIdx === previewModal.activePhotoIdx
                          ? "border-emerald-600 scale-105 shadow-md"
                          : "border-[#EFE6DD] opacity-60 hover:opacity-100"
                      }`}
                    >
                      <img src={pUrl} alt={`Photo ${pIdx + 1}`} className="h-full w-full object-cover" />
                      <span className="absolute bottom-0 right-0 bg-black/70 text-white text-[8px] font-bold px-1 rounded-tl-sm">
                        #{pIdx + 1}
                      </span>
                    </button>
                  ))}
                </div>
              )}

              <p className="text-xs font-semibold text-[#6C5C54] mt-3">
                Assigned Dispatch Studio: <span className="font-bold text-[#D89A86]">{previewModal.assignedStudio}</span>
              </p>
            </div>

            <div className="p-4 bg-[#FFF8F2] border-t border-[#EFE6DD] flex items-center justify-between flex-wrap gap-2">
              <span className="text-xs text-[#6C5C54] font-medium">Customer Phone: {previewModal.customerPhone}</span>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  onClick={() => setPreviewModal(null)}
                  className="rounded-full text-xs font-bold border-[#EFE6DD] px-4"
                >
                  Close
                </Button>
                <Button
                  onClick={() => {
                    const link = document.createElement("a");
                    link.href = previewModal.photos[previewModal.activePhotoIdx];
                    link.download = `Pixello_${previewModal.orderId}_Photo_${previewModal.activePhotoIdx + 1}.jpg`;
                    link.click();
                  }}
                  className="btn-pixello-primary rounded-full text-xs font-bold px-4"
                >
                  <Download className="h-4 w-4 mr-1.5" /> Download Photo #{previewModal.activePhotoIdx + 1}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}