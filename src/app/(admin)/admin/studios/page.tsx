"use client";

import { useState } from "react";
import { Search, MapPin, Store, CheckCircle, XCircle, Clock, FileText, ArrowUpRight, ChevronDown, Eye, CheckCircle2, X, ShieldCheck, Award, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

export interface StudioPartner {
  id: string;
  name: string;
  owner: string;
  location: string;
  joined: string;
  status: "APPROVED" | "PENDING" | "REJECTED";
  completedOrders: number;
  gstin?: string;
  phone?: string;
}

const INITIAL_STUDIOS: StudioPartner[] = [
  { id: "STD-101", name: "Pixello Hub Bangalore", owner: "Rajesh K.", location: "Indiranagar, Bangalore", joined: "Jan 12, 2026", status: "APPROVED", completedOrders: 432, gstin: "29AABCU9639R1ZM", phone: "+91 98765 43210" },
  { id: "STD-102", name: "LensCraft Studio", owner: "Amit Singh", location: "Koramangala, Bangalore", joined: "Feb 05, 2026", status: "APPROVED", completedOrders: 189, gstin: "29BBBCU8472R1ZN", phone: "+91 87654 32109" },
  { id: "STD-103", name: "Creative Snaps", owner: "Sneha R.", location: "Jayanagar, Bangalore", joined: "Aug 07, 2026", status: "PENDING", completedOrders: 0, gstin: "29CCBCU1092R1ZO", phone: "+91 76543 21098" },
  { id: "STD-104", name: "PhotoGenic Pvt Ltd", owner: "Vikram P.", location: "Whitefield, Bangalore", joined: "Aug 06, 2026", status: "PENDING", completedOrders: 0, gstin: "29DDBCU5531R1ZP", phone: "+91 65432 10987" },
  { id: "STD-105", name: "Shutterbugs", owner: "Neha Gupta", location: "HSR Layout, Bangalore", joined: "Mar 22, 2026", status: "REJECTED", completedOrders: 0, gstin: "29EEBCU7782R1ZQ", phone: "+91 54321 09876" },
];

export default function AdminStudiosPage() {
  const [studios, setStudios] = useState<StudioPartner[]>(INITIAL_STUDIOS);
  const [searchQuery, setSearchQuery] = useState("");
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  
  // Modal State for Verification Docs
  const [selectedStudioDocs, setSelectedStudioDocs] = useState<StudioPartner | null>(null);

  // Modal State for Onboarding New Studio
  const [isOnboardModalOpen, setIsOnboardModalOpen] = useState(false);
  const [onboardForm, setOnboardForm] = useState({
    name: "",
    owner: "",
    location: "",
    phone: "",
    gstin: "",
    status: "APPROVED" as "APPROVED" | "PENDING",
  });

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const updateStudioStatus = (id: string, newStatus: "APPROVED" | "PENDING" | "REJECTED") => {
    setStudios((prev) =>
      prev.map((s) => (s.id === id ? { ...s, status: newStatus } : s))
    );
    showToast(`Studio status updated to ${newStatus}.`);
  };

  const handleSaveNewStudio = (e: React.FormEvent) => {
    e.preventDefault();
    if (!onboardForm.name.trim() || !onboardForm.owner.trim()) return;

    const newId = `STD-${106 + studios.length}`;
    const newStudio: StudioPartner = {
      id: newId,
      name: onboardForm.name.trim(),
      owner: onboardForm.owner.trim(),
      location: onboardForm.location.trim() || "Bangalore",
      phone: onboardForm.phone.trim() || "+91 99887 76655",
      gstin: onboardForm.gstin.trim() || "29KKBCU4821R1ZX",
      joined: "Just now",
      status: onboardForm.status,
      completedOrders: 0,
    };

    setStudios((prev) => [newStudio, ...prev]);
    setIsOnboardModalOpen(false);
    setOnboardForm({ name: "", owner: "", location: "", phone: "", gstin: "", status: "APPROVED" });
    showToast(`Studio "${newStudio.name}" onboarded successfully!`);
  };

  const filteredStudios = studios.filter((s) => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;
    return (
      s.name.toLowerCase().includes(q) ||
      s.owner.toLowerCase().includes(q) ||
      s.location.toLowerCase().includes(q) ||
      s.id.toLowerCase().includes(q)
    );
  });

  const STATS = [
    { label: "Total Studios", value: `${studios.length}`, change: "+12 network", icon: Store },
    { label: "Pending Approval", value: `${studios.filter(s => s.status === 'PENDING').length}`, change: "Requires review", icon: Clock },
    { label: "Active Studios", value: `${studios.filter(s => s.status === 'APPROVED').length}`, change: "Live fulfillment", icon: CheckCircle },
  ];

  return (
    <div className="flex flex-col gap-6 p-6 bg-[#F8F3EE] min-h-screen relative">
      {/* Toast Banner */}
      {toastMessage && (
        <div className="fixed top-20 right-8 z-50 bg-[#3A2B24] text-white px-5 py-3 rounded-2xl shadow-xl border border-[#D89A86]/40 flex items-center gap-2.5 animate-in fade-in slide-in-from-top-4 duration-300">
          <CheckCircle2 className="h-5 w-5 text-[#D89A86]" />
          <span className="text-xs font-bold">{toastMessage}</span>
        </div>
      )}

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="font-serif-brand text-3xl font-bold tracking-tight text-[#3A2B24]">Studio Partners</h2>
          <p className="text-xs text-[#6C5C54] mt-1">Manage local printing & framing studio partner network.</p>
        </div>
        <Button 
          onClick={() => setIsOnboardModalOpen(true)}
          className="btn-pixello-primary text-xs font-bold rounded-full px-5 h-11 shadow-xs flex items-center gap-2 cursor-pointer transition-all duration-200"
        >
          <Plus className="h-4 w-4 text-white" /> Onboard New Studio
        </Button>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        {STATS.map((stat) => (
          <Card key={stat.label} className="border border-[#EFE6DD] bg-white rounded-3xl shadow-xs hover:shadow-md transition-shadow overflow-hidden">
            <CardContent className="p-5 flex flex-col justify-between h-full min-h-[130px]">
              <div className="flex items-start justify-between gap-3 mb-3">
                <span className="text-[11px] font-bold text-[#6C5C54] uppercase tracking-wider leading-snug flex-1">
                  {stat.label}
                </span>
                <div className="h-9 w-9 rounded-2xl bg-[#FFF8F2] border border-[#EFE6DD] flex items-center justify-center flex-shrink-0 text-[#D89A86]">
                  <stat.icon className="h-4 w-4" />
                </div>
              </div>

              <div>
                <div className="text-2xl sm:text-3xl font-extrabold text-[#3A2B24] tracking-tight">
                  {stat.value}
                </div>
                <div className="flex items-center gap-1 mt-1 text-[11px] font-bold text-emerald-600">
                  <ArrowUpRight className="h-3.5 w-3.5" />
                  <span>{stat.change}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="border border-[#EFE6DD] bg-white rounded-3xl shadow-xs overflow-hidden">
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <h3 className="font-serif-brand text-xl font-bold text-[#3A2B24]">Studio Verification Queue</h3>
            <div className="relative w-full sm:w-72">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#6C5C54]" />
              <Input 
                placeholder="Search studio or owner..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 rounded-full border-[#EFE6DD] bg-[#FFF8F2] text-xs font-medium text-[#3A2B24]" 
              />
            </div>
          </div>

          <div className="overflow-hidden border border-[#EFE6DD] rounded-2xl">
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="text-[11px] font-bold text-[#6C5C54] uppercase tracking-wider bg-[#FFF8F2] border-b border-[#EFE6DD]">
                  <tr>
                    <th className="px-4 py-3.5">Studio Name</th>
                    <th className="px-4 py-3.5">Location</th>
                    <th className="px-4 py-3.5">Completed Orders</th>
                    <th className="px-4 py-3.5">Status</th>
                    <th className="px-4 py-3.5 text-right">Verification Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#EFE6DD]">
                  {filteredStudios.map((studio) => (
                    <tr key={studio.id} className="hover:bg-[#FFF8F2]/50 transition-colors">
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-2xl bg-[#3A2B24] text-white flex items-center justify-center font-bold flex-shrink-0">
                            <Store className="h-4 w-4 text-[#D89A86]" />
                          </div>
                          <div>
                            <p className="font-bold text-[#3A2B24]">{studio.name}</p>
                            <p className="text-xs text-[#6C5C54] font-medium">Owner: {studio.owner}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-4 text-xs font-medium text-[#6C5C54]">
                        <div className="flex items-center gap-1.5">
                          <MapPin className="h-3.5 w-3.5 text-[#D89A86]" /> {studio.location}
                        </div>
                      </td>
                      <td className="px-4 py-4 font-extrabold text-[#3A2B24]">{studio.completedOrders} orders</td>
                      
                      {/* Interactive Status Badge */}
                      <td className="px-4 py-4">
                        <DropdownMenu>
                          <DropdownMenuTrigger className="cursor-pointer group flex items-center gap-1 focus:outline-none bg-transparent border-none p-0">
                            <Badge 
                              className={
                                studio.status === "APPROVED" 
                                  ? "bg-emerald-100 text-emerald-800 border-emerald-200 text-xs px-3 py-1 rounded-full font-bold shadow-2xs flex items-center gap-1"
                                  : studio.status === "PENDING"
                                  ? "bg-amber-100 text-amber-800 border-amber-200 text-xs px-3 py-1 rounded-full font-bold shadow-2xs flex items-center gap-1"
                                  : "bg-rose-100 text-rose-800 border-rose-200 text-xs px-3 py-1 rounded-full font-bold shadow-2xs flex items-center gap-1"
                              }
                            >
                              <span className={`h-2 w-2 rounded-full ${
                                studio.status === "APPROVED" ? "bg-emerald-500" : studio.status === "PENDING" ? "bg-amber-500" : "bg-rose-600"
                              }`} />
                              {studio.status}
                            </Badge>
                            <ChevronDown className="h-3 w-3 text-[#6C5C54] opacity-50 group-hover:opacity-100 transition-opacity" />
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="start" className="w-48 rounded-2xl border-[#EFE6DD] p-2 shadow-xl bg-white">
                            <div className="px-3 py-1.5 text-xs font-bold text-[#3A2B24] border-b border-[#EFE6DD]">
                              Set Verification Status
                            </div>
                            <div className="py-1 flex flex-col gap-1">
                              <DropdownMenuItem
                                onClick={() => updateStudioStatus(studio.id, "APPROVED")}
                                className="flex items-center gap-2 p-2 rounded-xl cursor-pointer hover:bg-slate-50 text-[#3A2B24]"
                              >
                                <span className="h-2.5 w-2.5 rounded-full bg-emerald-500 flex-shrink-0" />
                                <span className="text-xs font-bold text-emerald-700">APPROVED</span>
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => updateStudioStatus(studio.id, "PENDING")}
                                className="flex items-center gap-2 p-2 rounded-xl cursor-pointer hover:bg-slate-50 text-[#3A2B24]"
                              >
                                <span className="h-2.5 w-2.5 rounded-full bg-amber-500 flex-shrink-0" />
                                <span className="text-xs font-bold text-amber-700">PENDING</span>
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => updateStudioStatus(studio.id, "REJECTED")}
                                className="flex items-center gap-2 p-2 rounded-xl cursor-pointer hover:bg-slate-50 text-[#3A2B24]"
                              >
                                <span className="h-2.5 w-2.5 rounded-full bg-rose-600 flex-shrink-0" />
                                <span className="text-xs font-bold text-rose-700">REJECTED</span>
                              </DropdownMenuItem>
                            </div>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </td>

                      {/* Verification Actions Column */}
                      <td className="px-4 py-4 text-right whitespace-nowrap">
                        {studio.status === "PENDING" ? (
                          <div className="flex items-center justify-end gap-2">
                            <Button 
                              size="sm" 
                              variant="outline" 
                              onClick={() => setSelectedStudioDocs(studio)}
                              className="rounded-full text-xs font-bold border-[#EFE6DD] text-[#3A2B24] bg-white hover:bg-[#FFF8F2] hover:text-[#D89A86] px-3.5 h-8 flex items-center gap-1.5 cursor-pointer shadow-2xs"
                            >
                              <FileText className="h-3.5 w-3.5 text-[#D89A86]" /> Docs
                            </Button>
                            <Button size="sm" variant="outline" onClick={() => updateStudioStatus(studio.id, "APPROVED")} className="rounded-full text-xs font-bold border-emerald-200 text-emerald-700 bg-white hover:bg-emerald-50 px-3.5 h-8 flex items-center gap-1.5 cursor-pointer shadow-2xs">
                              <CheckCircle className="h-3.5 w-3.5 text-emerald-600" /> Approve
                            </Button>
                            <Button size="sm" variant="outline" onClick={() => updateStudioStatus(studio.id, "REJECTED")} className="rounded-full text-xs font-bold border-rose-200 text-rose-700 bg-white hover:bg-rose-50 px-3.5 h-8 flex items-center gap-1.5 cursor-pointer shadow-2xs">
                              <XCircle className="h-3.5 w-3.5 text-rose-600" /> Reject
                            </Button>
                          </div>
                        ) : (
                          <div className="flex items-center justify-end gap-2">
                            <Button 
                              size="sm" 
                              variant="outline" 
                              onClick={() => setSelectedStudioDocs(studio)}
                              className="rounded-full text-xs font-bold border-[#EFE6DD] text-[#3A2B24] bg-white hover:bg-[#FFF8F2] hover:text-[#D89A86] px-3.5 h-8 flex items-center gap-1.5 cursor-pointer shadow-2xs"
                            >
                              <Eye className="h-3.5 w-3.5 text-[#D89A86]" /> View Profile
                            </Button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Verification Documents Modal Dialog */}
      {selectedStudioDocs && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-[#EFE6DD] shadow-2xl w-full max-w-lg p-6 overflow-hidden animate-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-4 border-b border-[#EFE6DD] mb-5">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-2xl bg-[#FFF8F2] border border-[#EFE6DD] flex items-center justify-center text-[#D89A86]">
                  <Award className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-serif-brand text-xl font-bold text-[#3A2B24]">{selectedStudioDocs.name}</h3>
                  <p className="text-xs text-[#6C5C54] font-medium">Verification Certificate & Credentials • {selectedStudioDocs.id}</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedStudioDocs(null)}
                className="h-8 w-8 rounded-full flex items-center justify-center text-[#6C5C54] hover:bg-[#FFF8F2] cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Studio Info Details */}
            <div className="flex flex-col gap-4 text-xs">
              <div className="grid grid-cols-2 gap-3 p-3.5 bg-[#FFF8F2]/60 rounded-2xl border border-[#EFE6DD]">
                <div>
                  <span className="text-[10px] text-[#6C5C54] font-bold uppercase tracking-wider block">Owner Name</span>
                  <span className="font-bold text-[#3A2B24] text-sm">{selectedStudioDocs.owner}</span>
                </div>
                <div>
                  <span className="text-[10px] text-[#6C5C54] font-bold uppercase tracking-wider block">Contact Phone</span>
                  <span className="font-bold text-[#3A2B24] text-sm">{selectedStudioDocs.phone || "+91 98765 43210"}</span>
                </div>
                <div className="col-span-2 pt-1 border-t border-[#EFE6DD]">
                  <span className="text-[10px] text-[#6C5C54] font-bold uppercase tracking-wider block">Studio Location</span>
                  <span className="font-medium text-[#3A2B24] flex items-center gap-1 mt-0.5">
                    <MapPin className="h-3.5 w-3.5 text-[#D89A86]" /> {selectedStudioDocs.location}
                  </span>
                </div>
              </div>

              {/* Submitted Verification Documents */}
              <h4 className="font-serif-brand font-bold text-sm text-[#3A2B24] mt-1">Submitted Legal Documents</h4>
              
              <div className="flex flex-col gap-2.5">
                <div className="flex items-center justify-between p-3 rounded-2xl border border-[#EFE6DD] bg-white hover:bg-[#FFF8F2]/40 transition-colors">
                  <div className="flex items-center gap-3">
                    <FileText className="h-5 w-5 text-[#D89A86]" />
                    <div>
                      <p className="font-bold text-[#3A2B24]">GST & Business Registration</p>
                      <p className="text-[10px] text-[#6C5C54] font-medium">GSTIN: {selectedStudioDocs.gstin || "29AABCU9639R1ZM"}</p>
                    </div>
                  </div>
                  <Badge className="bg-emerald-100 text-emerald-800 border-emerald-200 text-[10px] px-2.5 py-0.5 rounded-full font-bold flex items-center gap-1">
                    <ShieldCheck className="h-3 w-3" /> Verified PDF
                  </Badge>
                </div>

                <div className="flex items-center justify-between p-3 rounded-2xl border border-[#EFE6DD] bg-white hover:bg-[#FFF8F2]/40 transition-colors">
                  <div className="flex items-center gap-3">
                    <Store className="h-5 w-5 text-[#D89A86]" />
                    <div>
                      <p className="font-bold text-[#3A2B24]">Studio Premises & Printer Lab</p>
                      <p className="text-[10px] text-[#6C5C54] font-medium">12-Color Photo Printer & Framing Setup</p>
                    </div>
                  </div>
                  <Badge className="bg-emerald-100 text-emerald-800 border-emerald-200 text-[10px] px-2.5 py-0.5 rounded-full font-bold flex items-center gap-1">
                    <ShieldCheck className="h-3 w-3" /> Inspection OK
                  </Badge>
                </div>

                <div className="flex items-center justify-between p-3 rounded-2xl border border-[#EFE6DD] bg-white hover:bg-[#FFF8F2]/40 transition-colors">
                  <div className="flex items-center gap-3">
                    <Award className="h-5 w-5 text-[#D89A86]" />
                    <div>
                      <p className="font-bold text-[#3A2B24]">Bank Payout & Settlement Account</p>
                      <p className="text-[10px] text-[#6C5C54] font-medium">HDFC Bank (A/C: ****4892 • IFSC: HDFC0001294)</p>
                    </div>
                  </div>
                  <Badge className="bg-emerald-100 text-emerald-800 border-emerald-200 text-[10px] px-2.5 py-0.5 rounded-full font-bold flex items-center gap-1">
                    <ShieldCheck className="h-3 w-3" /> Active
                  </Badge>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-between pt-4 mt-2 border-t border-[#EFE6DD]">
                <Button
                  variant="outline"
                  onClick={() => setSelectedStudioDocs(null)}
                  className="rounded-full text-xs font-bold border-[#EFE6DD] text-[#3A2B24]"
                >
                  Close
                </Button>

                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      updateStudioStatus(selectedStudioDocs.id, "REJECTED");
                      setSelectedStudioDocs(null);
                    }}
                    className="rounded-full text-xs font-bold border-rose-200 text-rose-700 bg-white hover:bg-rose-50 px-4 h-9"
                  >
                    <XCircle className="h-4 w-4 mr-1.5" /> Reject Studio
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => {
                      updateStudioStatus(selectedStudioDocs.id, "APPROVED");
                      setSelectedStudioDocs(null);
                    }}
                    className="btn-pixello-primary text-xs font-bold rounded-full px-5 h-9 shadow-xs"
                  >
                    <CheckCircle className="h-4 w-4 mr-1.5 text-white" /> Approve Studio Partner
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Onboard New Studio Modal Dialog */}
      {isOnboardModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-[#EFE6DD] shadow-2xl w-full max-w-md p-6 overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-4 border-b border-[#EFE6DD] mb-5">
              <div className="flex items-center gap-2">
                <Store className="h-5 w-5 text-[#D89A86]" />
                <h3 className="font-serif-brand text-xl font-bold text-[#3A2B24]">Onboard New Studio Partner</h3>
              </div>
              <button
                onClick={() => setIsOnboardModalOpen(false)}
                className="h-8 w-8 rounded-full flex items-center justify-center text-[#6C5C54] hover:bg-[#FFF8F2] cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleSaveNewStudio} className="flex flex-col gap-4">
              <div>
                <label className="text-xs font-bold text-[#3A2B24] mb-1 block">Studio Name *</label>
                <Input
                  required
                  placeholder="e.g. Pixello Print Studio"
                  value={onboardForm.name}
                  onChange={(e) => setOnboardForm({ ...onboardForm, name: e.target.value })}
                  className="rounded-xl border-[#EFE6DD] bg-white text-xs font-medium text-[#3A2B24] focus-visible:ring-[#D89A86]"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-[#3A2B24] mb-1 block">Owner Name *</label>
                  <Input
                    required
                    placeholder="e.g. Rajesh Kumar"
                    value={onboardForm.owner}
                    onChange={(e) => setOnboardForm({ ...onboardForm, owner: e.target.value })}
                    className="rounded-xl border-[#EFE6DD] bg-white text-xs font-medium text-[#3A2B24] focus-visible:ring-[#D89A86]"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-[#3A2B24] mb-1 block">Phone Number</label>
                  <Input
                    placeholder="+91 98765 43210"
                    value={onboardForm.phone}
                    onChange={(e) => setOnboardForm({ ...onboardForm, phone: e.target.value })}
                    className="rounded-xl border-[#EFE6DD] bg-white text-xs font-medium text-[#3A2B24] focus-visible:ring-[#D89A86]"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-[#3A2B24] mb-1 block">Location / Address</label>
                <Input
                  placeholder="e.g. Indiranagar, Bangalore"
                  value={onboardForm.location}
                  onChange={(e) => setOnboardForm({ ...onboardForm, location: e.target.value })}
                  className="rounded-xl border-[#EFE6DD] bg-white text-xs font-medium text-[#3A2B24] focus-visible:ring-[#D89A86]"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-[#3A2B24] mb-1 block">GSTIN / Reg No</label>
                  <Input
                    placeholder="29AABCU9639R1ZM"
                    value={onboardForm.gstin}
                    onChange={(e) => setOnboardForm({ ...onboardForm, gstin: e.target.value })}
                    className="rounded-xl border-[#EFE6DD] bg-white text-xs font-medium text-[#3A2B24] focus-visible:ring-[#D89A86]"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-[#3A2B24] mb-1 block">Initial Status</label>
                  <select
                    value={onboardForm.status}
                    onChange={(e) => setOnboardForm({ ...onboardForm, status: e.target.value as any })}
                    className="w-full h-10 rounded-xl border border-[#EFE6DD] bg-white text-xs font-medium text-[#3A2B24] px-3 focus:outline-none focus:ring-2 focus:ring-[#D89A86] cursor-pointer"
                  >
                    <option value="APPROVED" className="bg-white text-[#3A2B24]">APPROVED</option>
                    <option value="PENDING" className="bg-white text-[#3A2B24]">PENDING</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-3 mt-2 border-t border-[#EFE6DD]">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsOnboardModalOpen(false)}
                  className="rounded-full text-xs font-bold border-[#EFE6DD] text-[#3A2B24]"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  className="btn-pixello-primary text-xs font-bold rounded-full px-6 h-10 shadow-xs"
                >
                  Onboard Studio
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
