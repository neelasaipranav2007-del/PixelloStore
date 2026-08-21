"use client";

import React, { useState } from "react";
import { useOrders } from "@/context/OrderContext";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { OrderStatusBadge } from "@/components/ui/status-badge";
import { ChevronDown, Printer, FileText, Download, CheckCircle2, Truck, Eye, X, Image as ImageIcon } from "lucide-react";

const STATUS_OPTIONS = [
  { label: "Processing", desc: "Order received & queued", dotColor: "bg-amber-500" },
  { label: "Printing", desc: "In studio framing & printing", dotColor: "bg-[#D89A86]" },
  { label: "Packed", desc: "Print packed in gift wrap", dotColor: "bg-sky-500" },
  { label: "Delivery Picked Up", desc: "Rider dispatched to doorstep", dotColor: "bg-orange-500" },
  { label: "Delivered", desc: "Handed to customer", dotColor: "bg-emerald-500" },
];

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

export default function StudioOrdersPage() {
  const { orders, updateOrderStatus } = useOrders();
  const [filterStatus, setFilterStatus] = useState<string>("All");

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

  const filteredOrders = orders.filter((order) => {
    if (filterStatus === "All") return true;
    return order.status === filterStatus;
  });

  return (
    <div className="flex flex-col gap-6 p-6 bg-[#F8F3EE] min-h-screen">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-serif-brand text-3xl font-bold text-[#3A2B24]">Studio Production Order Queue</h1>
          <p className="text-xs text-[#6C5C54] mt-1">Manage print jobs, framing queues, and doorstep dispatch statuses.</p>
        </div>
        <div className="flex items-center gap-2">
          {["All", "Processing", "Printing", "Packed", "Delivered"].map((st) => (
            <Button
              key={st}
              variant={filterStatus === st ? "default" : "outline"}
              size="sm"
              onClick={() => setFilterStatus(st)}
              className={filterStatus === st ? "btn-pixello-primary text-xs font-bold rounded-full" : "rounded-full text-xs border-[#EFE6DD] bg-white text-[#3A2B24]"}
            >
              {st}
            </Button>
          ))}
        </div>
      </div>

      <Card className="border border-[#EFE6DD] bg-white rounded-3xl shadow-sm overflow-hidden">
        <CardHeader className="p-8 md:p-10 pb-4">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <CardTitle className="font-serif-brand text-2xl md:text-3xl font-bold text-[#3A2B24]">Active Orders Queue</CardTitle>
              <CardDescription className="text-xs md:text-sm text-[#6C5C54] mt-1">Click status pills to advance order stage live.</CardDescription>
            </div>
            <Badge className="bg-[#D89A86] text-white border-none px-4 py-2 rounded-full text-xs font-bold shadow-2xs">
              {filteredOrders.length} Orders Listed
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="p-8 md:p-10 pt-2">
          {filteredOrders.length === 0 ? (
            <div className="text-center py-12 text-sm text-[#6C5C54]">
              No orders found for category "{filterStatus}".
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              {filteredOrders.map((order) => (
                <div key={order.id} className="border border-[#EFE6DD] bg-white rounded-2xl p-5 shadow-2xs hover:shadow-xs transition-shadow">
                  <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#EFE6DD] pb-4 mb-4">
                    <div className="flex items-center gap-3">
                      <span className="font-bold text-base text-[#3A2B24]">{order.id}</span>
                      <DropdownMenu>
                        <DropdownMenuTrigger className="cursor-pointer group flex items-center gap-1 focus:outline-none">
                          <OrderStatusBadge status={order.status} />
                          <ChevronDown className="h-3.5 w-3.5 text-[#6C5C54] opacity-60 group-hover:opacity-100 transition-opacity" />
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="start" className="w-64 rounded-2xl p-2 bg-white border-[#EFE6DD] shadow-xl">
                          <div className="px-3 py-2 text-[11px] font-bold text-[#6C5C54] uppercase tracking-wider border-b border-[#EFE6DD]">
                            Update Order Stage
                          </div>
                          <div className="py-1 flex flex-col gap-1">
                            {STATUS_OPTIONS.map((st) => {
                              const isCurrent = order.status === st.label;
                              return (
                                <DropdownMenuItem
                                  key={st.label}
                                  onClick={() => updateOrderStatus(order.id, st.label as any)}
                                  className={`flex items-center justify-between p-2.5 rounded-xl cursor-pointer transition-colors ${
                                    isCurrent ? "bg-[#FFF8F2]" : "hover:bg-[#FFF8F2]/60"
                                  }`}
                                >
                                  <div className="flex items-center gap-2.5 min-w-0 pr-2">
                                    <span className={`h-2.5 w-2.5 rounded-full flex-shrink-0 ${st.dotColor}`} />
                                    <div className="min-w-0">
                                      <p className="text-xs font-bold text-[#3A2B24] leading-tight truncate">{st.label}</p>
                                      <p className="text-[10px] text-[#6C5C54] font-medium leading-tight mt-0.5 truncate">{st.desc}</p>
                                    </div>
                                  </div>
                                  {isCurrent && (
                                    <span className="text-[10px] font-bold text-[#D89A86] bg-[#FFF8F2] px-2 py-0.5 rounded-full border border-[#D89A86]/30 flex-shrink-0">
                                      Active
                                    </span>
                                  )}
                                </DropdownMenuItem>
                              );
                            })}
                          </div>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                    <div className="text-xs text-[#6C5C54]">
                      Customer: <strong className="text-[#3A2B24]">{order.customerName}</strong> ({order.customerPhone})
                    </div>
                    <div className="text-xs font-bold text-[#D89A86]">
                      ₹{order.totalAmount.toFixed(2)}
                    </div>
                  </div>

                  <div className="space-y-3">
                    <h5 className="text-xs font-bold text-[#3A2B24] uppercase tracking-wider">Ordered Items ({order.items.length}):</h5>
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
                                <p className="text-xs text-[#6C5C54] mt-0.5 font-medium">Size: <span className="font-bold text-[#D89A86]">{item.size}</span> • Qty: <strong className="text-[#3A2B24]">{item.quantity}</strong></p>
                              </div>
                            </div>

                            <div className="flex items-center gap-3">
                              <Button
                                size="sm"
                                variant="outline"
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
                                className="rounded-full text-xs font-bold border-emerald-300 bg-emerald-50 text-emerald-800 hover:bg-emerald-100 px-4 h-9 flex items-center gap-1.5 shadow-2xs cursor-pointer"
                              >
                                <Download className="h-4 w-4 text-emerald-600" /> View HD Print Files ({photoList.length})
                              </Button>
                              <span className="font-extrabold text-[#D89A86] text-base">₹{(item.price * item.quantity).toFixed(2)}</span>
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

                  <div className="mt-4 pt-3 border-t border-[#EFE6DD] flex items-center justify-between text-xs text-[#6C5C54]">
                    <span>Ship to: <strong className="text-[#3A2B24]">{order.deliveryAddress}</strong></span>
                    <span>Dispatch Studio: <strong className="text-[#D89A86]">{order.assignedStudio}</strong></span>
                  </div>
                </div>
              ))}
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
