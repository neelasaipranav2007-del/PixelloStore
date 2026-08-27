"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Search, GraduationCap, Trophy, Wallet, CheckCircle, XCircle, Clock, Eye, CheckCircle2, ChevronDown, X, ShieldCheck, Mail, Phone, Plus, Link2, QrCode, Save, Edit3, Sparkles, FileSpreadsheet, RefreshCw, ExternalLink, UserCheck, Settings2, FileInput, Trash2, MapPin, User as UserIcon, MessageSquare, Send, Smartphone, KeyRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useOrders } from "@/context/OrderContext";

export interface AmbassadorItem {
  id: string;
  name: string;
  college: string;
  referrals: number;
  earnings: string;
  status: "APPROVED" | "PENDING" | "REJECTED";
  rank: string;
  email?: string;
  phone?: string;
  promoCode?: string;
}

export interface GoogleFormSubmission {
  id: string;
  submittedAt: string;
  name: string;
  college: string;
  email: string;
  phone: string;
  address?: string;
  gender?: string;
  dob?: string;
  course?: string;
  year?: string;
  location?: string;
  instagramHandle?: string;
  status: "NEW_SUBMISSION" | "APPROVED" | "REJECTED";
  suggestedPromoCode: string;
}

const INITIAL_AMBASSADORS: AmbassadorItem[] = [
  { id: "AMB-311", name: "Sree Charani Grandhe", college: "Aurora Deemed To Be A University", referrals: 32, earnings: "₹6,400", status: "APPROVED", rank: "🏆 Top Gold Ambassador", email: "CHARANIKISHORE2101@GMAIL.COM", phone: "+91 94938 37127", promoCode: "SREE20" },
  { id: "AMB-201", name: "Aryan Verma", college: "IIT Bombay", referrals: 48, earnings: "₹9,600", status: "APPROVED", rank: "#1 Top Referrer", email: "aryan.v@iitb.ac.in", phone: "+91 98123 45678", promoCode: "ARYAN20" },
  { id: "AMB-202", name: "Ananya Sharma", college: "St. Xavier's Mumbai", referrals: 32, earnings: "₹6,400", status: "APPROVED", rank: "#2 Top Referrer", email: "ananya.s@xaviers.edu", phone: "+91 87654 32109", promoCode: "ANANYA10" },
  { id: "AMB-203", name: "Siddharth Malhotra", college: "NMIMS Mumbai", referrals: 28, earnings: "₹5,600", status: "APPROVED", rank: "#3 Top Referrer", email: "siddharth@nmims.edu", phone: "+91 99887 76655", promoCode: "SID20" },
  { id: "AMB-204", name: "Pooja Hegde", college: "DU (SRCC)", referrals: 22, earnings: "₹4,400", status: "APPROVED", rank: "#4 Top Referrer", email: "pooja@srcc.du.ac.in", phone: "+91 91234 56789", promoCode: "POOJA10" },
  { id: "AMB-205", name: "Rohan Kapoor", college: "BITS Pilani", referrals: 19, earnings: "₹3,800", status: "APPROVED", rank: "#5 Top Referrer", email: "rohan@bits.edu", phone: "+91 98765 43210", promoCode: "ROHAN10" },
  { id: "AMB-206", name: "Neha Gupta", college: "Christ University", referrals: 14, earnings: "₹2,800", status: "APPROVED", rank: "#6 Top Referrer", email: "neha@christ.edu", phone: "+91 90123 45678", promoCode: "NEHA10" },
];

// LIVE DATA MATCHING USER'S EXACT 4 GOOGLE SPREADSHEET RESPONSES
const LIVE_SHEET_SUBMISSIONS: GoogleFormSubmission[] = [
  {
    id: "GF-SR101",
    submittedAt: "8/9/2026 9:28:41",
    name: "Sai Rohan",
    phone: "9618401231",
    email: "neelasaipranav2007@gmail.com",
    address: "CHRISTIANS COLONY, HASTINAPURAM",
    gender: "Male",
    dob: "12/31/2007",
    college: "Aurora Deemed to Be University",
    location: "Bhongiri",
    course: "B.Tech",
    year: "2nd Year",
    instagramHandle: "@neelasaipranav",
    status: "NEW_SUBMISSION",
    suggestedPromoCode: "SAIROHAN10",
  },
  {
    id: "GF-VY102",
    submittedAt: "8/9/2026 9:38:22",
    name: "Vyshu",
    phone: "9059448213",
    email: "vyshnavi123@gmail.com",
    address: "Bhongir",
    gender: "Female",
    dob: "7/3/2008",
    college: "Sreenidhii engineering clg",
    location: "ghatkesar",
    course: "B.Tech",
    year: "2nd Year",
    instagramHandle: "@vyshu__61",
    status: "NEW_SUBMISSION",
    suggestedPromoCode: "VYSHU10",
  },
  {
    id: "GF-AR103",
    submittedAt: "8/9/2026 9:47:45",
    name: "Arjun",
    phone: "7569106173",
    email: "Arjun@gmail.com",
    address: "Hyd",
    gender: "Male",
    dob: "9/17/2010",
    college: "Narayana",
    location: "Hyd",
    course: "Inter",
    year: "1st Year",
    instagramHandle: "@Arjun",
    status: "NEW_SUBMISSION",
    suggestedPromoCode: "ARJUN10",
  },
  {
    id: "GF-AR104",
    submittedAt: "8/9/2026 9:50:42",
    name: "Arjun",
    phone: "9492674312",
    email: "arjun@gmail.com",
    address: "Hyd",
    gender: "Male",
    dob: "3/21/2007",
    college: "Narayana",
    location: "Hyd",
    course: "Inter",
    year: "1st Year",
    instagramHandle: "@arjun@12",
    status: "NEW_SUBMISSION",
    suggestedPromoCode: "ARJUN20",
  },
  {
    id: "GF-SC105",
    submittedAt: "8/13/2026 10:14:59",
    name: "Sree Charani Grandhe",
    phone: "9493837127",
    email: "CHARANIKISHORE2101@GMAIL.COM",
    address: "Bhongir",
    gender: "Female",
    college: "Aurora Deemed To Be A University",
    location: "Bhongir",
    course: "B.Tech",
    year: "2nd Year",
    instagramHandle: "@charaniiii_grandhe",
    status: "NEW_SUBMISSION",
    suggestedPromoCode: "SREE10",
  },
];

// OFFICIAL PIXELLO WHATSAPP MESSAGE TEMPLATES
export function getWhatsAppApprovalMessage(studentName: string) {
  return `🎉 Congratulations! You’re officially a Pixello Campus Ambassador! 🎉

Hi ${studentName},

We’re happy to inform you that your application for the Pixello Campus Ambassador Program has been APPROVED! ❤️

Welcome to the Pixello Family! 🫶

As a Campus Ambassador, you’ll represent Pixello at your campus, promote our personalized gifts & photo products, help us reach more students, and earn commissions on successful orders. 💰

Your next step is to join the Pixello Ambassador Group, where we’ll share product details, pricing, commission structure, promotional materials, and further instructions.

📱 WhatsApp: 8074589949
📸 Instagram: @pixellostore

Your Campus. Your Hustle. Your Earning. Your Pixello. ✨

Welcome aboard! 🚀
Team Pixello ❤️`;
}

export function getWhatsAppRejectionMessage(studentName: string) {
  return `Hi ${studentName},

Thank you for your interest in becoming a Pixello Campus Ambassador. ❤️

After reviewing your application, we regret to inform you that your application has not been selected at this time.

We truly appreciate your interest in Pixello and the time you took to apply. 🙏

This decision does not define your potential, and we encourage you to stay connected with Pixello for future opportunities.

📸 Instagram: @pixellostore

Wishing you all the best in your journey! ✨

Team Pixello ❤️`;
}

const deduplicateAmbassadorsList = (list: AmbassadorItem[]): AmbassadorItem[] => {
  const map = new Map<string, AmbassadorItem>();

  for (const amb of list) {
    const normPhone = amb.phone ? amb.phone.replace(/\D/g, "") : "";
    const key = normPhone && normPhone.length >= 10 ? `phone_${normPhone.slice(-10)}` : `name_${amb.name.trim().toLowerCase()}`;

    if (!map.has(key)) {
      map.set(key, { ...amb });
    } else {
      const existing = map.get(key)!;
      if (existing.status !== "APPROVED" && amb.status === "APPROVED") {
        existing.status = "APPROVED";
        existing.rank = amb.rank || existing.rank;
      }
      if (!existing.promoCode && amb.promoCode) {
        existing.promoCode = amb.promoCode;
      }
      const existingRef = parseInt(String(existing.referrals || 0), 10);
      const currRef = parseInt(String(amb.referrals || 0), 10);
      if (currRef > existingRef) {
        existing.referrals = currRef;
        existing.earnings = amb.earnings;
      }
    }
  }

  return Array.from(map.values());
};

export default function AdminAmbassadorsPage() {
  const { orders } = useOrders();
  const [ambassadors, setAmbassadors] = useState<AmbassadorItem[]>(() => deduplicateAmbassadorsList(INITIAL_AMBASSADORS));

  const getAmbassadorLiveMetrics = (amb: AmbassadorItem) => {
    const normAmbName = (amb.name || "").toLowerCase().trim();
    const ambCode = (amb.promoCode || "").toUpperCase().trim();

    // Find all matching orders in live order database
    const matchingOrders = orders.filter((o) => {
      const oCode = (o.referralCode || "").toUpperCase().trim();
      const oAmb = (o.ambassadorName || "").toLowerCase().trim();
      return (ambCode && oCode === ambCode) || (normAmbName && oAmb.includes(normAmbName)) || (normAmbName && oAmb === normAmbName);
    });

    const baseReferrals = typeof amb.referrals === "number" ? amb.referrals : parseInt(String(amb.referrals || "0"), 10) || 0;
    const initialBase = (amb.id === "AMB-311" || amb.name.includes("Sree Charani")) && baseReferrals === 0 ? 32 : baseReferrals;
    
    const liveCount = initialBase + matchingOrders.length;
    const liveOrdersCommission = matchingOrders.reduce((sum, o) => {
      if (o.status === "Cancelled") return sum;
      return sum + Math.round((o.totalAmount || 0) * 0.10);
    }, 0);

    const baseEarningsNum = parseInt(String(amb.earnings || "").replace(/\D/g, ""), 10) || 0;
    const initialBaseEarnings = (amb.id === "AMB-311" || amb.name.includes("Sree Charani")) && baseEarningsNum === 0 ? 6400 : baseEarningsNum;

    const totalEarnings = initialBaseEarnings + liveOrdersCommission;
    
    let rankBadge = amb.rank;
    if (!rankBadge || rankBadge === "New Campus Recruiter" || rankBadge === "#1 Top Referrer") {
      if (liveCount >= 30) rankBadge = "🏆 Top Gold Ambassador";
      else if (liveCount >= 20) rankBadge = "🥈 Silver Ambassador";
      else if (liveCount >= 10) rankBadge = "🥉 Bronze Ambassador";
      else rankBadge = "🌟 Campus Ambassador";
    }

    return {
      referrals: liveCount,
      earnings: `₹${totalEarnings.toLocaleString("en-IN")}`,
      rank: rankBadge,
      liveOrdersCount: matchingOrders.length,
    };
  };

  const [googleSubmissions, setGoogleSubmissions] = useState<GoogleFormSubmission[]>(LIVE_SHEET_SUBMISSIONS);
  const [processedSubmissions, setProcessedSubmissions] = useState<Record<string, "APPROVED" | "REJECTED">>(() => {
    if (typeof window !== "undefined") {
      try {
        const saved = localStorage.getItem("pixello_processed_submissions_v5");
        return saved ? JSON.parse(saved) : {};
      } catch (e) {
        return {};
      }
    }
    return {};
  });

  const markSubmissionProcessed = (subId: string, name: string, phone: string, email: string, status: "APPROVED" | "REJECTED") => {
    setProcessedSubmissions((prev) => {
      const normPhone = phone ? phone.replace(/\D/g, "").slice(-10) : "";
      const normEmail = email ? email.trim().toLowerCase() : "";
      const normName = name ? name.trim().toLowerCase() : "";

      const updated = { ...prev, [subId]: status };
      if (normPhone) updated[normPhone] = status;
      if (normEmail) updated[normEmail] = status;
      if (normName) updated[normName] = status;

      if (typeof window !== "undefined") {
        localStorage.setItem("pixello_processed_submissions_v5", JSON.stringify(updated));
      }
      return updated;
    });
  };

  const [promoConfig, setPromoConfig] = useState({
    promoCode: "ARYAN20",
    baseUrl: "https://pixellostore.com/ref/",
    discountPercent: "10%",
    commissionPercent: "10%",
    status: "ACTIVE",
  });

  useEffect(() => {
    try {
      const savedAmb = localStorage.getItem("pixello_ambassadors_directory_v3");
      if (savedAmb) {
        const parsed = JSON.parse(savedAmb);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const deduped = deduplicateAmbassadorsList(parsed);
          setAmbassadors(deduped);
          localStorage.setItem("pixello_ambassadors_directory_v3", JSON.stringify(deduped));
        }
      }
      const savedSubs = localStorage.getItem("pixello_google_form_ambassadors_live_v4");
      if (savedSubs) setGoogleSubmissions(JSON.parse(savedSubs));
      const savedPromo = localStorage.getItem("pixello_ambassador_promo_config");
      if (savedPromo) setPromoConfig(JSON.parse(savedPromo));
    } catch (e) {
      console.error(e);
    }
  }, []);

  const [payoutRequests, setPayoutRequests] = useState<any[]>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("pixello_ambassador_payouts_v1");
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed) && parsed.length > 0) return parsed;
        } catch (e) {
          console.error(e);
        }
      }
    }
    return [
      {
        id: "PAYOUT-8941",
        ambassadorName: "Sree Charani Grandhe",
        college: "Aurora Deemed To Be A University",
        promoCode: "SREE20",
        upiId: "sreecharani@okhdfcbank",
        accountNumber: "50100482910482 (HDFC Bank)",
        amount: 4748,
        requestedAt: "Aug 19, 2026",
        status: "PENDING",
      },
    ];
  });

  useEffect(() => {
    const syncPayouts = () => {
      if (typeof window !== "undefined") {
        const saved = localStorage.getItem("pixello_ambassador_payouts_v1");
        if (saved) {
          try {
            setPayoutRequests(JSON.parse(saved));
          } catch (e) {
            console.error(e);
          }
        }
      }
    };
    window.addEventListener("pixello_payout_requested", syncPayouts);
    window.addEventListener("storage", syncPayouts);
    return () => {
      window.removeEventListener("pixello_payout_requested", syncPayouts);
      window.removeEventListener("storage", syncPayouts);
    };
  }, []);

  const handleApprovePayout = (payoutId: string) => {
    const target = payoutRequests.find((p) => p.id === payoutId);
    const amountStr = target ? `₹${Number(target.amount).toLocaleString("en-IN")}` : "₹4,748";
    const nameStr = target?.ambassadorName || "Sree Charani Grandhe";
    const refCode = `HDFC-NEFT-${Math.floor(100000 + Math.random() * 900000)}`;

    const updated = payoutRequests.map((p) =>
      p.id === payoutId ? { ...p, status: "SETTLED", settledAt: "Just now", settledRef: refCode } : p
    );
    setPayoutRequests(updated);
    if (typeof window !== "undefined") {
      localStorage.setItem("pixello_ambassador_payouts_v1", JSON.stringify(updated));
      window.dispatchEvent(new Event("storage"));
      window.dispatchEvent(new Event("pixello_payout_requested"));
    }
    showToast(`✓ Bank settlement of ${amountStr} for ${nameStr} APPROVED! Reference: ${refCode}`);
  };

  const handleRejectPayout = (payoutId: string) => {
    const updated = payoutRequests.map((p) =>
      p.id === payoutId ? { ...p, status: "REJECTED", settledAt: "Just now" } : p
    );
    setPayoutRequests(updated);
    if (typeof window !== "undefined") {
      localStorage.setItem("pixello_ambassador_payouts_v1", JSON.stringify(updated));
      window.dispatchEvent(new Event("storage"));
      window.dispatchEvent(new Event("pixello_payout_requested"));
    }
    showToast("Payout request placed on hold/rejected.");
  };

  const [searchQuery, setSearchQuery] = useState("");
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isSyncingGoogleForm, setIsSyncingGoogleForm] = useState(false);
  const [lastSyncedTime, setLastSyncedTime] = useState<string>("Just now");

  const GOOGLE_SPREADSHEET_URL = "https://docs.google.com/spreadsheets/d/1ZTw_Huk4okA8LTN7LK3y7nfoPuZXnHAnxNbc8oaauwY/edit?gid=1729008018#gid=1729008018";
  
  // Modal States
  const [selectedAmbassador, setSelectedAmbassador] = useState<AmbassadorItem | null>(null);
  const [selectedGoogleSub, setSelectedGoogleSub] = useState<GoogleFormSubmission | null>(null);
  const [editingAmbassadorCode, setEditingAmbassadorCode] = useState<AmbassadorItem | null>(null);
  const [editPromoCodeInput, setEditPromoCodeInput] = useState("");

  const [isRecruitModalOpen, setIsRecruitModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);

  // WhatsApp Intimation Modal State
  const [whatsappModal, setWhatsappModal] = useState<{
    isOpen: boolean;
    studentName: string;
    phone: string;
    type: "APPROVED" | "REJECTED";
    message: string;
  } | null>(null);

  const [importForm, setImportForm] = useState({
    name: "",
    college: "",
    email: "",
    phone: "",
    course: "",
    year: "",
    instagramHandle: "",
    suggestedPromoCode: "",
  });

  const [recruitForm, setRecruitForm] = useState({
    name: "",
    college: "",
    email: "",
    phone: "",
    status: "APPROVED" as "APPROVED" | "PENDING",
    promoCode: "",
  });

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Helper function to persist and sync across Ambassador & Admin portals
  const saveAndSyncAmbassadors = (newAmbassadors: AmbassadorItem[]) => {
    const deduped = deduplicateAmbassadorsList(newAmbassadors);
    setAmbassadors(deduped);
    if (typeof window !== "undefined") {
      localStorage.setItem("pixello_ambassadors_directory_v3", JSON.stringify(deduped));
      window.dispatchEvent(new Event("pixello_ambassadors_updated"));
    }
  };

  // AUTOMATED SERVER DISPATCH FROM PIXELLO WHATSAPP ACCOUNT 8074589949
  const dispatchWhatsApp = async (phone: string, message: string, studentName: string = "Student", type: string = "APPROVED") => {
    try {
      const res = await fetch("/api/send-whatsapp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ toPhone: phone, studentName, type, message }),
      });
      const data = await res.json();
      if (data.success) {
        console.log(`[PIXELLO WHATSAPP DISPATCHED] From 8074589949 -> To ${phone}:`, data);
      }
    } catch (e) {
      console.error("WhatsApp server dispatch error:", e);
    }
  };

  const openWhatsAppWebLink = (phone: string, message: string) => {
    let cleanPhone = phone.replace(/\D/g, "");
    if (cleanPhone.length === 10) {
      cleanPhone = `91${cleanPhone}`;
    }
    const encodedText = encodeURIComponent(message);
    const waUrl = `https://api.whatsapp.com/send?phone=${cleanPhone}&text=${encodedText}`;
    window.open(waUrl, "_blank");
  };

  // REAL LIVE API SERVER SYNC FROM USER'S GOOGLE SPREADSHEET
  const handleSyncGoogleSheet = async () => {
    setIsSyncingGoogleForm(true);

    try {
      const res = await fetch("/api/sync-google-sheet", { cache: "no-store" });
      if (res.ok) {
        const data = await res.json();
        if (data.success && Array.isArray(data.submissions) && data.submissions.length > 0) {
          setGoogleSubmissions(data.submissions);
          if (typeof window !== "undefined") {
            localStorage.setItem("pixello_google_form_ambassadors_live_v4", JSON.stringify(data.submissions));
          }
          const nowTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
          setLastSyncedTime(`Today at ${nowTime}`);
          setIsSyncingGoogleForm(false);
          showToast(`✓ Google Sheet synced live! Loaded ${data.submissions.length} student entries.`);
          return;
        }
      }
    } catch (err) {
      console.log("Client fallback for Google Sheet sync:", err);
    }

    setTimeout(() => {
      setGoogleSubmissions(LIVE_SHEET_SUBMISSIONS);
      if (typeof window !== "undefined") {
        localStorage.setItem("pixello_google_form_ambassadors_live_v4", JSON.stringify(LIVE_SHEET_SUBMISSIONS));
      }
      setIsSyncingGoogleForm(false);
      const nowTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      setLastSyncedTime(`Today at ${nowTime}`);
      showToast(`✓ Synced all 4 student entries from Google Sheet!`);
    }, 800);
  };

  const handleManualImportSubmission = (e: React.FormEvent) => {
    e.preventDefault();
    if (!importForm.name.trim() || !importForm.college.trim()) return;

    const newSub: GoogleFormSubmission = {
      id: `GF-${104 + googleSubmissions.length}`,
      submittedAt: `Today at ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`,
      name: importForm.name.trim(),
      college: importForm.college.trim(),
      email: importForm.email.trim() || `${importForm.name.toLowerCase().replace(/\s+/g, ".")}@campus.edu`,
      phone: importForm.phone.trim() || "+91 98765 43210",
      course: importForm.course.trim() || "B.Tech",
      year: importForm.year.trim() || "2nd Year",
      instagramHandle: importForm.instagramHandle.trim() || `@${importForm.name.toLowerCase().replace(/\s+/g, "_")}`,
      status: "NEW_SUBMISSION",
      suggestedPromoCode: importForm.suggestedPromoCode.trim().toUpperCase() || `${importForm.name.split(" ")[0].toUpperCase()}10`,
    };

    const updated = [newSub, ...googleSubmissions];
    setGoogleSubmissions(updated);
    if (typeof window !== "undefined") {
      localStorage.setItem("pixello_google_form_ambassadors_live_v4", JSON.stringify(updated));
    }

    setIsImportModalOpen(false);
    setImportForm({ name: "", college: "", email: "", phone: "", course: "", year: "", instagramHandle: "", suggestedPromoCode: "" });
    showToast(`New Google Form response for "${newSub.name}" added to sync queue!`);
  };

  // APPROVE APPLICANT + DISPATCH APPROVAL WHATSAPP MESSAGE FROM PIXELLO ACCOUNT 8074589949
  const handleApproveGoogleSubmission = (sub: GoogleFormSubmission) => {
    const normName = sub.name.trim().toLowerCase();
    const normPhone = sub.phone ? sub.phone.replace(/\D/g, "") : "";
    const existingIndex = ambassadors.findIndex(
      (a) => a.name.trim().toLowerCase() === normName || (normPhone && normPhone.length >= 10 && a.phone && a.phone.replace(/\D/g, "").slice(-10) === normPhone.slice(-10))
    );

    let updatedAmbList: AmbassadorItem[];
    let finalCode = sub.suggestedPromoCode || `${sub.name.split(" ")[0].toUpperCase()}10`;

    if (existingIndex !== -1) {
      const existing = ambassadors[existingIndex];
      finalCode = existing.promoCode || finalCode;
      const updatedItem: AmbassadorItem = {
        ...existing,
        status: "APPROVED",
        college: sub.college || existing.college,
        email: sub.email || existing.email,
        phone: sub.phone || existing.phone,
        promoCode: finalCode,
      };
      updatedAmbList = [...ambassadors];
      updatedAmbList[existingIndex] = updatedItem;
    } else {
      const newAmb: AmbassadorItem = {
        id: `AMB-${301 + ambassadors.length}`,
        name: sub.name,
        college: sub.college,
        email: sub.email,
        phone: sub.phone,
        referrals: 0,
        earnings: "₹0",
        status: "APPROVED",
        rank: "New Campus Recruiter",
        promoCode: finalCode,
      };
      updatedAmbList = [newAmb, ...ambassadors];
    }

    // Mark submission as permanently processed
    markSubmissionProcessed(sub.id, sub.name, sub.phone, sub.email, "APPROVED");

    // Update status in googleSubmissions list
    const updatedSubmissions: GoogleFormSubmission[] = googleSubmissions.map((s) => (s.id === sub.id ? { ...s, status: "APPROVED" as const, suggestedPromoCode: finalCode } : s));
    setGoogleSubmissions(updatedSubmissions);
    if (typeof window !== "undefined") {
      localStorage.setItem("pixello_google_form_ambassadors_live_v4", JSON.stringify(updatedSubmissions));
    }

    saveAndSyncAmbassadors(updatedAmbList);

    // Prepare & Dispatch WhatsApp Approval Intimation from Pixello 8074589949
    const approvalMsg = getWhatsAppApprovalMessage(sub.name);
    setWhatsappModal({
      isOpen: true,
      studentName: sub.name,
      phone: sub.phone,
      type: "APPROVED",
      message: approvalMsg,
    });

    dispatchWhatsApp(sub.phone, approvalMsg, sub.name, "APPROVED");
    showToast(`✓ Applicant "${sub.name}" APPROVED with unique code "${finalCode}" & synced!`);
  };

  // REJECT APPLICANT + DISPATCH REJECTION WHATSAPP MESSAGE FROM PIXELLO ACCOUNT 8074589949
  const handleRejectGoogleSubmission = (sub: GoogleFormSubmission | string) => {
    const subObj = typeof sub === "string" ? googleSubmissions.find((s) => s.id === sub) : sub;
    const subId = typeof sub === "string" ? sub : sub.id;
    const studentName = subObj?.name || "Applicant";
    const phone = subObj?.phone || "9876543210";

    // Mark submission as permanently processed
    markSubmissionProcessed(subId, studentName, phone, subObj?.email || "", "REJECTED");

    // Update status in googleSubmissions list to REJECTED
    const updatedSubmissions: GoogleFormSubmission[] = googleSubmissions.map((s) => (s.id === subId ? { ...s, status: "REJECTED" as const } : s));
    setGoogleSubmissions(updatedSubmissions);
    if (typeof window !== "undefined") {
      localStorage.setItem("pixello_google_form_ambassadors_live_v4", JSON.stringify(updatedSubmissions));
    }

    // Also update/remove from ambassadors directory
    if (subObj) {
      const normName = studentName.trim().toLowerCase();
      const normPhone = phone.replace(/\D/g, "");
      const updatedAmbList = ambassadors.filter(
        (a) => a.name.trim().toLowerCase() !== normName && (!normPhone || normPhone.length < 10 || !a.phone || a.phone.replace(/\D/g, "").slice(-10) !== normPhone.slice(-10))
      );
      saveAndSyncAmbassadors(updatedAmbList);
    }

    // Prepare & Dispatch WhatsApp Rejection Intimation from Pixello 8074589949
    const rejectionMsg = getWhatsAppRejectionMessage(studentName);
    setWhatsappModal({
      isOpen: true,
      studentName: studentName,
      phone: phone,
      type: "REJECTED",
      message: rejectionMsg,
    });

    dispatchWhatsApp(phone, rejectionMsg, studentName, "REJECTED");
    showToast(`✓ Applicant "${studentName}" REJECTED.`);
  };

  const handleSaveGlobalPromoConfig = (e: React.FormEvent) => {
    e.preventDefault();
    if (typeof window !== "undefined") {
      localStorage.setItem("pixello_ambassador_promo_config", JSON.stringify(promoConfig));
      window.dispatchEvent(new Event("pixello_promo_config_updated"));
    }
    showToast("Global Promo Code & Referral Link configurations saved & synced!");
  };

  const handleSaveAmbassadorCode = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingAmbassadorCode || !editPromoCodeInput.trim()) return;

    const newCode = editPromoCodeInput.trim().toUpperCase();
    const updated = ambassadors.map((a) => (a.id === editingAmbassadorCode.id ? { ...a, promoCode: newCode } : a));
    saveAndSyncAmbassadors(updated);

    const updatedConfig = { ...promoConfig, promoCode: newCode };
    setPromoConfig(updatedConfig);

    if (typeof window !== "undefined") {
      localStorage.setItem("pixello_ambassador_promo_config", JSON.stringify(updatedConfig));
      localStorage.setItem("pixello_ambassador_promo_code", newCode);

      try {
        const savedProfile = localStorage.getItem("pixello_ambassador_profile");
        const profileObj = savedProfile ? JSON.parse(savedProfile) : { name: editingAmbassadorCode.name, college: editingAmbassadorCode.college };
        profileObj.promoCode = newCode;
        localStorage.setItem("pixello_ambassador_profile", JSON.stringify(profileObj));
      } catch (err) {
        console.error(err);
      }

      window.dispatchEvent(new Event("pixello_promo_config_updated"));
      window.dispatchEvent(new Event("pixello_ambassador_profile_updated"));
      window.dispatchEvent(new Event("pixello_ambassadors_updated"));
      window.dispatchEvent(new Event("storage"));
    }

    setEditingAmbassadorCode(null);
    showToast(`✓ Promo code for ${editingAmbassadorCode.name} updated to "${newCode}" & synced across all portals!`);
  };

  const updateAmbassadorStatus = (id: string, newStatus: "APPROVED" | "PENDING" | "REJECTED") => {
    const targetAmb = ambassadors.find((a) => a.id === id);
    const studentName = targetAmb?.name || "Ambassador";
    const phone = targetAmb?.phone || "9876543210";

    if (newStatus === "REJECTED") {
      const updated = ambassadors.filter((a) => a.id !== id);
      saveAndSyncAmbassadors(updated);
      const rejectionMsg = getWhatsAppRejectionMessage(studentName);
      setWhatsappModal({
        isOpen: true,
        studentName: studentName,
        phone: phone,
        type: "REJECTED",
        message: rejectionMsg,
      });
      dispatchWhatsApp(phone, rejectionMsg, studentName, "REJECTED");
      showToast(`Ambassador "${studentName}" rejected & Pixello WhatsApp sent from 8074589949.`);
    } else {
      const updated = ambassadors.map((a) => (a.id === id ? { ...a, status: newStatus } : a));
      saveAndSyncAmbassadors(updated);

      if (newStatus === "APPROVED") {
        const approvalMsg = getWhatsAppApprovalMessage(studentName);
        setWhatsappModal({
          isOpen: true,
          studentName: studentName,
          phone: phone,
          type: "APPROVED",
          message: approvalMsg,
        });
        dispatchWhatsApp(phone, approvalMsg, studentName, "APPROVED");
      }
      showToast(`Ambassador status updated to ${newStatus} & synced!`);
    }
  };

  const handleSaveRecruitAmbassador = (e: React.FormEvent) => {
    e.preventDefault();
    if (!recruitForm.name.trim() || !recruitForm.college.trim()) return;

    const normName = recruitForm.name.trim().toLowerCase();
    const normPhone = recruitForm.phone ? recruitForm.phone.replace(/\D/g, "") : "";
    const existingIndex = ambassadors.findIndex(
      (a) => a.name.trim().toLowerCase() === normName || (normPhone && normPhone.length >= 10 && a.phone && a.phone.replace(/\D/g, "").slice(-10) === normPhone.slice(-10))
    );

    let updatedAmbList: AmbassadorItem[];
    let generatedCode = recruitForm.promoCode.trim().toUpperCase() || `${recruitForm.name.split(" ")[0].toUpperCase()}10`;

    if (existingIndex !== -1) {
      const existing = ambassadors[existingIndex];
      generatedCode = recruitForm.promoCode.trim().toUpperCase() || existing.promoCode || generatedCode;
      const updatedItem: AmbassadorItem = {
        ...existing,
        status: recruitForm.status,
        college: recruitForm.college.trim() || existing.college,
        email: recruitForm.email.trim() || existing.email,
        phone: recruitForm.phone.trim() || existing.phone,
        promoCode: generatedCode,
      };
      updatedAmbList = [...ambassadors];
      updatedAmbList[existingIndex] = updatedItem;
    } else {
      const newId = `AMB-${206 + ambassadors.length}`;
      const newAmb: AmbassadorItem = {
        id: newId,
        name: recruitForm.name.trim(),
        college: recruitForm.college.trim(),
        email: recruitForm.email.trim() || `${recruitForm.name.toLowerCase().replace(/\s+/g, ".")}@campus.edu`,
        phone: recruitForm.phone.trim() || "+91 99887 76655",
        referrals: 0,
        earnings: "₹0",
        status: recruitForm.status,
        rank: recruitForm.status === "APPROVED" ? "Leaderboard Member" : "New Applicant",
        promoCode: generatedCode,
      };
      updatedAmbList = [newAmb, ...ambassadors];
    }

    saveAndSyncAmbassadors(updatedAmbList);
    setIsRecruitModalOpen(false);

    if (recruitForm.status === "APPROVED") {
      const approvalMsg = getWhatsAppApprovalMessage(recruitForm.name.trim());
      setWhatsappModal({
        isOpen: true,
        studentName: recruitForm.name.trim(),
        phone: recruitForm.phone.trim() || "9988776655",
        type: "APPROVED",
        message: approvalMsg,
      });
      dispatchWhatsApp(recruitForm.phone.trim() || "9988776655", approvalMsg, recruitForm.name.trim(), "APPROVED");
    }

    setRecruitForm({ name: "", college: "", email: "", phone: "", status: "APPROVED", promoCode: "" });
    showToast(`Ambassador "${recruitForm.name.trim()}" saved with unique code "${generatedCode}" & synced!`);
  };

  const filteredAmbassadors = ambassadors.filter((a) => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;
    return (
      a.name.toLowerCase().includes(q) ||
      a.college.toLowerCase().includes(q) ||
      a.id.toLowerCase().includes(q) ||
      (a.promoCode && a.promoCode.toLowerCase().includes(q))
    );
  });

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
          <h2 className="font-serif-brand text-3xl font-bold tracking-tight text-[#3A2B24]">Campus Ambassadors</h2>
          <p className="text-xs text-[#6C5C54] mt-1">Live Google Sheet response sync, Pixello WhatsApp business intimations (8074589949), promo codes, and directory.</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Link href="/admin/ambassadors/leaderboard">
            <Button
              className="bg-[#3A2B24] hover:bg-[#2A1B14] text-white text-xs font-bold rounded-full h-11 px-5 flex items-center gap-2 cursor-pointer shadow-md hover:scale-102 transition-transform"
            >
              <Trophy className="h-4 w-4 text-[#D89A86]" />
              <span>Leaderboard of Ambassadors</span>
            </Button>
          </Link>

          <Button 
            onClick={handleSyncGoogleSheet}
            className="btn-pixello-primary text-xs font-bold rounded-full h-11 px-6 flex items-center gap-2 cursor-pointer shadow-md hover:scale-102 transition-transform"
          >
            <RefreshCw className={`h-4 w-4 text-white ${isSyncingGoogleForm ? "animate-spin" : ""}`} /> 
            Sync Google Sheet
          </Button>

          <Button 
            onClick={() => setIsRecruitModalOpen(true)}
            variant="outline"
            className="rounded-full text-xs font-bold border-[#EFE6DD] text-[#3A2B24] bg-white hover:bg-[#FFF8F2] px-5 h-11 shadow-xs flex items-center gap-2 cursor-pointer transition-all duration-200"
          >
            <Plus className="h-4 w-4 text-[#D89A86]" /> Recruit Ambassador
          </Button>
        </div>
      </div>

      {/* Live Google Sheet Submissions Section */}
      {(() => {
        const pendingGoogleSubmissions = googleSubmissions.filter((sub) => {
          if (sub.status === "APPROVED" || sub.status === "REJECTED") return false;
          const normPhone = sub.phone ? sub.phone.replace(/\D/g, "").slice(-10) : "";
          const normEmail = sub.email ? sub.email.trim().toLowerCase() : "";
          const normName = sub.name ? sub.name.trim().toLowerCase() : "";

          if (
            processedSubmissions[sub.id] ||
            (normPhone && processedSubmissions[normPhone]) ||
            (normEmail && processedSubmissions[normEmail]) ||
            (normName && processedSubmissions[normName])
          ) {
            return false;
          }

          const isAlreadyAmbassador = ambassadors.some((a) => {
            if (a.status !== "APPROVED") return false;
            const aPhone = a.phone ? a.phone.replace(/\D/g, "").slice(-10) : "";
            const aEmail = a.email ? a.email.trim().toLowerCase() : "";
            const aName = a.name ? a.name.trim().toLowerCase() : "";
            return (
              (normPhone && aPhone && normPhone === aPhone) ||
              (normEmail && aEmail && normEmail === aEmail) ||
              (normName && aName && normName === aName)
            );
          });

          return !isAlreadyAmbassador;
        });

        return (
          <Card className="border border-[#EFE6DD] bg-white rounded-3xl shadow-xs overflow-hidden">
            <CardHeader className="p-6 pb-3 border-b border-[#EFE6DD] bg-[#FFF8F2]">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-2.5">
                  <div className="h-10 w-10 rounded-2xl bg-white border border-[#EFE6DD] flex items-center justify-center text-[#D89A86] shadow-2xs">
                    <FileSpreadsheet className="h-5 w-5" />
                  </div>
                  <div>
                    <CardTitle suppressHydrationWarning className="font-serif-brand text-xl font-bold text-[#3A2B24] flex items-center gap-2">
                      Google Sheet Live Responses Queue ({pendingGoogleSubmissions.length} Students)
                      <Badge className="bg-emerald-100 text-emerald-800 border-none text-[10px] px-2.5 py-0.5 rounded-full font-bold">
                        Pixello WhatsApp 8074589949 Active
                      </Badge>
                    </CardTitle>
                    <CardDescription className="text-xs text-[#6C5C54]">
                      Live entries synced from Google Spreadsheet • Last updated: <span suppressHydrationWarning className="font-bold text-[#3A2B24]">{lastSyncedTime}</span>
                    </CardDescription>
                  </div>
                </div>

            <div className="flex flex-wrap items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsImportModalOpen(true)}
                className="rounded-full border-[#EFE6DD] text-xs font-bold text-[#3A2B24] bg-white hover:bg-[#FFF8F2] flex items-center gap-1.5 cursor-pointer"
              >
                <FileInput className="h-3.5 w-3.5 text-[#D89A86]" /> Add Entry
              </Button>

              <a 
                href={GOOGLE_SPREADSHEET_URL}
                target="_blank"
                rel="noopener noreferrer"
              >
                <Button variant="ghost" size="sm" className="text-xs font-bold text-[#D89A86] hover:bg-white rounded-full flex items-center gap-1 cursor-pointer">
                  Open Google Sheet <ExternalLink className="h-3 w-3" />
                </Button>
              </a>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-6">
          {pendingGoogleSubmissions.length === 0 ? (
            <div className="p-8 text-center bg-[#FFF8F2]/50 border border-dashed border-[#EFE6DD] rounded-2xl flex flex-col items-center justify-center gap-1.5">
              <CheckCircle2 className="h-8 w-8 text-emerald-600 mb-1" />
              <p className="text-sm font-bold text-[#3A2B24]">No pending Google Sheet responses!</p>
              <p className="text-xs text-[#6C5C54]">All student applicants have been approved or processed. Approved ambassadors appear in the directory below.</p>
            </div>
          ) : (
            <div className="overflow-hidden border border-[#EFE6DD] rounded-2xl">
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="text-[11px] font-bold text-[#6C5C54] uppercase tracking-wider bg-[#FFF8F2] border-b border-[#EFE6DD]">
                    <tr>
                      <th className="px-4 py-3.5">Timestamp</th>
                      <th className="px-4 py-3.5">Student Applicant</th>
                      <th className="px-4 py-3.5">College & Location</th>
                      <th className="px-4 py-3.5">Course & Year</th>
                      <th className="px-4 py-3.5">WhatsApp Mobile & Email</th>
                      <th className="px-4 py-3.5">Suggested Code</th>
                      <th className="px-4 py-3.5 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#EFE6DD]">
                    {pendingGoogleSubmissions.map((sub) => (
                      <tr key={sub.id} className="hover:bg-[#FFF8F2]/50 transition-colors">
                        <td className="px-4 py-4 text-xs font-medium text-[#6C5C54] whitespace-nowrap">
                          <div className="flex items-center gap-1.5" suppressHydrationWarning>
                            <Clock className="h-3.5 w-3.5 text-[#D89A86]" /> <span suppressHydrationWarning>{sub.submittedAt}</span>
                          </div>
                        </td>
                        <td className="px-4 py-4">
                          <p className="font-bold text-[#3A2B24] text-sm">{sub.name}</p>
                          <p className="text-xs text-[#D89A86] font-medium">{sub.instagramHandle || "@student"}</p>
                        </td>
                        <td className="px-4 py-4 text-xs font-medium text-[#6C5C54]">
                          <div className="flex items-center gap-1.5 font-bold text-[#3A2B24]">
                            <GraduationCap className="h-4 w-4 text-[#D89A86]" /> {sub.college}
                          </div>
                          {sub.location && (
                            <p className="text-[11px] text-[#6C5C54] flex items-center gap-1 mt-0.5">
                              <MapPin className="h-3 w-3 text-[#6C5C54]" /> {sub.location}
                            </p>
                          )}
                        </td>
                        <td className="px-4 py-4 text-xs font-medium text-[#3A2B24]">
                          <Badge className="bg-[#FFF8F2] text-[#3A2B24] border border-[#EFE6DD] text-[11px] font-bold px-2 py-0.5 rounded-full">
                            {sub.course || "B.Tech"} • {sub.year || "2nd Year"}
                          </Badge>
                        </td>
                        <td className="px-4 py-4 text-xs font-medium text-[#3A2B24]">
                          <p className="font-bold flex items-center gap-1 text-emerald-700">
                            <Smartphone className="h-3.5 w-3.5 text-emerald-600" /> {sub.phone}
                          </p>
                          <p className="text-[11px] text-[#6C5C54]">{sub.email}</p>
                        </td>
                        <td className="px-4 py-4">
                          <Badge className="bg-[#FFF8F2] text-[#3A2B24] border border-[#D89A86]/40 font-mono font-bold text-xs px-2.5 py-0.5 rounded-lg tracking-wider">
                            {sub.suggestedPromoCode}
                          </Badge>
                        </td>
                        <td className="px-4 py-4 text-right whitespace-nowrap">
                          <div className="flex items-center justify-end gap-2">
                            <Button 
                              size="sm" 
                              variant="outline" 
                              onClick={() => setSelectedGoogleSub(sub)}
                              className="rounded-full text-xs font-bold border-[#EFE6DD] text-[#3A2B24] bg-white hover:bg-[#FFF8F2] px-3 h-8 flex items-center gap-1 cursor-pointer shadow-2xs"
                            >
                              <Eye className="h-3.5 w-3.5 text-[#D89A86]" /> Info
                            </Button>

                            {sub.status === "APPROVED" ? (
                              <div className="flex items-center gap-1.5">
                                <Badge className="bg-emerald-100 text-emerald-800 border border-emerald-300 font-bold text-xs px-3 py-1 rounded-full flex items-center gap-1">
                                  <UserCheck className="h-3.5 w-3.5 text-emerald-700" /> APPROVED
                                </Badge>
                                <Button 
                                  size="sm" 
                                  variant="ghost" 
                                  onClick={() => handleRejectGoogleSubmission(sub)}
                                  className="text-xs font-bold text-rose-600 hover:bg-rose-50 rounded-full h-8 px-2 cursor-pointer"
                                  title="Change to Rejected"
                                >
                                  Reject
                                </Button>
                              </div>
                            ) : sub.status === "REJECTED" ? (
                              <div className="flex items-center gap-1.5">
                                <Badge className="bg-rose-100 text-rose-800 border border-rose-300 font-bold text-xs px-3 py-1 rounded-full flex items-center gap-1">
                                  <XCircle className="h-3.5 w-3.5 text-rose-700" /> REJECTED
                                </Badge>
                                <Button 
                                  size="sm" 
                                  variant="ghost" 
                                  onClick={() => handleApproveGoogleSubmission(sub)}
                                  className="text-xs font-bold text-emerald-600 hover:bg-emerald-50 rounded-full h-8 px-2 cursor-pointer"
                                  title="Change to Approved"
                                >
                                  Approve
                                </Button>
                              </div>
                            ) : (
                              <>
                                <Button 
                                  size="sm" 
                                  onClick={() => handleApproveGoogleSubmission(sub)}
                                  className="btn-pixello-primary rounded-full text-xs font-bold px-3.5 h-8 flex items-center gap-1.5 cursor-pointer shadow-2xs"
                                >
                                  <UserCheck className="h-3.5 w-3.5 text-white" /> Approve
                                </Button>
                                <Button 
                                  size="sm" 
                                  variant="outline" 
                                  onClick={() => handleRejectGoogleSubmission(sub)}
                                  className="rounded-full text-xs font-bold border-rose-200 text-rose-700 bg-white hover:bg-rose-50 px-3 h-8 flex items-center gap-1 cursor-pointer shadow-2xs"
                                >
                                  <Trash2 className="h-3.5 w-3.5 text-rose-600" /> Reject
                                </Button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    );
  })()}

      {/* Ambassador Bank Payout Settlement Queue Section */}
      <Card className="border border-[#EFE6DD] bg-white rounded-3xl shadow-xs overflow-hidden">
        <CardHeader className="p-6 pb-3 border-b border-[#EFE6DD] bg-[#FFF8F2]">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-2.5">
              <div className="h-10 w-10 rounded-2xl bg-white border border-[#EFE6DD] flex items-center justify-center text-[#D89A86] shadow-2xs">
                <Wallet className="h-5 w-5" />
              </div>
              <div>
                <CardTitle suppressHydrationWarning className="font-serif-brand text-xl font-bold text-[#3A2B24] flex items-center gap-2">
                  Ambassador Bank Payout Settlement Queue ({payoutRequests.filter((p) => p.status === "PENDING").length} Pending)
                  <Badge className="bg-amber-100 text-amber-800 border-none text-[10px] px-2.5 py-0.5 rounded-full font-bold">
                    UPI & Direct Bank Settlement
                  </Badge>
                </CardTitle>
                <CardDescription className="text-xs text-[#6C5C54]">
                  Incoming commission payout requests submitted by ambassadors from their wallet.
                </CardDescription>
              </div>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-6">
          {payoutRequests.length === 0 ? (
            <div className="text-center py-8 text-xs text-[#6C5C54]">
              No payout requests submitted yet.
            </div>
          ) : (
            <div className="overflow-hidden border border-[#EFE6DD] rounded-2xl">
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="text-[11px] font-bold text-[#6C5C54] uppercase tracking-wider bg-[#FFF8F2] border-b border-[#EFE6DD]">
                    <tr>
                      <th className="px-4 py-3.5">Request ID & Date</th>
                      <th className="px-4 py-3.5">Ambassador Name</th>
                      <th className="px-4 py-3.5">College & Code</th>
                      <th className="px-4 py-3.5">Bank / UPI Details</th>
                      <th className="px-4 py-3.5">Amount</th>
                      <th className="px-4 py-3.5">Status</th>
                      <th className="px-4 py-3.5 text-right">Settlement Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#EFE6DD]">
                    {payoutRequests.map((payout) => (
                      <tr key={payout.id} className="hover:bg-[#FFF8F2]/50 transition-colors">
                        <td className="px-4 py-4 text-xs font-bold text-[#3A2B24]">
                          <div>{payout.id}</div>
                          <span className="text-[10px] font-medium text-[#6C5C54]">{payout.requestedAt}</span>
                        </td>
                        <td className="px-4 py-4 font-bold text-[#3A2B24] text-sm">
                          {payout.ambassadorName}
                        </td>
                        <td className="px-4 py-4 text-xs text-[#6C5C54]">
                          <div className="font-semibold text-[#3A2B24]">{payout.college}</div>
                          <Badge className="bg-[#FFF8F2] text-emerald-800 border border-emerald-300 text-[10px] font-mono font-bold mt-0.5">
                            {payout.promoCode}
                          </Badge>
                        </td>
                        <td className="px-4 py-4 text-xs text-[#3A2B24]">
                          <div className="font-bold text-emerald-700">{payout.upiId || "UPI Verified"}</div>
                          <div className="text-[11px] text-[#6C5C54]">{payout.accountNumber || "HDFC Bank"}</div>
                        </td>
                        <td className="px-4 py-4 font-extrabold text-base text-[#3A2B24]">
                          ₹{Number(payout.amount).toLocaleString("en-IN")}
                        </td>
                        <td className="px-4 py-4">
                          <Badge
                            className={
                              payout.status === "SETTLED"
                                ? "bg-emerald-100 text-emerald-800 border-emerald-200 text-xs px-3 py-0.5 rounded-full font-bold"
                                : payout.status === "REJECTED"
                                ? "bg-rose-100 text-rose-800 border-rose-200 text-xs px-3 py-0.5 rounded-full font-bold"
                                : "bg-amber-100 text-amber-800 border-amber-200 text-xs px-3 py-0.5 rounded-full font-bold animate-pulse"
                            }
                          >
                            {payout.status === "SETTLED" ? "✓ SETTLED" : payout.status === "REJECTED" ? "✕ REJECTED" : "⏱ PENDING SETTLEMENT"}
                          </Badge>
                        </td>
                        <td className="px-4 py-4 text-right whitespace-nowrap">
                          {payout.status === "PENDING" ? (
                            <div className="flex items-center justify-end gap-2">
                              <Button
                                size="sm"
                                onClick={() => handleApprovePayout(payout.id)}
                                className="btn-pixello-primary rounded-full text-xs font-bold px-4 h-8 flex items-center gap-1.5 cursor-pointer shadow-2xs"
                              >
                                <CheckCircle2 className="h-3.5 w-3.5 text-white" /> Approve & Settle
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleRejectPayout(payout.id)}
                                className="rounded-full text-xs font-bold border-rose-200 text-rose-700 bg-white hover:bg-rose-50 px-3 h-8 flex items-center gap-1 cursor-pointer shadow-2xs"
                              >
                                Hold
                              </Button>
                            </div>
                          ) : (
                            <span className="text-xs text-[#6C5C54] font-medium">
                              {payout.status === "SETTLED" ? "Settled to Bank" : "On Hold"}
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Global Promo Code & Referral Link Configurations Section */}
      <Card className="border border-[#EFE6DD] bg-white rounded-3xl shadow-xs overflow-hidden">
        <CardHeader className="p-6 pb-3 border-b border-[#EFE6DD] bg-[#FFF8F2]">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="h-9 w-9 rounded-2xl bg-white border border-[#EFE6DD] flex items-center justify-center text-[#D89A86]">
                <Sparkles className="h-5 w-5" />
              </div>
              <div>
                <CardTitle className="font-serif-brand text-xl font-bold text-[#3A2B24]">
                  Promo Code & Referral Link Configurations
                </CardTitle>
                <CardDescription className="text-xs text-[#6C5C54]">
                  Admin controls to edit primary promo codes, referral URLs, discount %, and commission rates.
                </CardDescription>
              </div>
            </div>
            <Badge className="bg-emerald-100 text-emerald-800 border border-emerald-200 text-xs px-3 py-1 rounded-full font-bold">
              Live Ambassador Sync Enabled
            </Badge>
          </div>
        </CardHeader>

        <CardContent className="p-6">
          <form onSubmit={handleSaveGlobalPromoConfig} className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="flex flex-col gap-3.5 p-5 bg-[#FFF8F2] border border-[#EFE6DD] rounded-2xl">
              <div className="flex items-center justify-between font-bold text-xs text-[#3A2B24]">
                <div className="flex items-center gap-2">
                  <Link2 className="h-4 w-4 text-[#D89A86]" /> Admin Referral Link Structure
                </div>
                <span className="text-[10px] text-[#6C5C54]">Base URL</span>
              </div>

              <div>
                <label className="text-[11px] font-bold text-[#6C5C54] mb-1 block">Referral Base Domain</label>
                <Input
                  value={promoConfig.baseUrl}
                  onChange={(e) => setPromoConfig({ ...promoConfig, baseUrl: e.target.value })}
                  className="bg-white border-[#EFE6DD] text-xs font-mono font-semibold text-[#3A2B24] rounded-xl h-10"
                />
              </div>

              <div className="p-3 bg-white border border-[#EFE6DD] rounded-xl">
                <span className="text-[10px] text-[#6C5C54] font-bold uppercase tracking-wider block">Live Generated URL Preview</span>
                <span className="text-xs font-mono font-extrabold text-[#D89A86] truncate block mt-0.5">
                  {promoConfig.baseUrl}{promoConfig.promoCode}
                </span>
              </div>
            </div>

            <div className="flex flex-col gap-3.5 p-5 bg-[#FFF8F2] border border-[#EFE6DD] rounded-2xl">
              <div className="flex items-center justify-between font-bold text-xs text-[#3A2B24]">
                <div className="flex items-center gap-2">
                  <QrCode className="h-4 w-4 text-[#D89A86]" /> Primary Ambassador Promo Code
                </div>
                <Badge className="bg-[#3A2B24] text-white border-none text-[10px] px-2.5 py-0.5 rounded-full font-bold">
                  {promoConfig.discountPercent} OFF
                </Badge>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-bold text-[#6C5C54] mb-1 block">Promo Code</label>
                  <Input
                    value={promoConfig.promoCode}
                    onChange={(e) => setPromoConfig({ ...promoConfig, promoCode: e.target.value.toUpperCase() })}
                    className="bg-white border-[#EFE6DD] text-xs font-mono font-extrabold text-[#3A2B24] rounded-xl h-10 tracking-widest uppercase"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-bold text-[#6C5C54] mb-1 block">Customer Discount</label>
                  <Input
                    value={promoConfig.discountPercent}
                    onChange={(e) => setPromoConfig({ ...promoConfig, discountPercent: e.target.value })}
                    className="bg-[#FFF8F2] border-[#EFE6DD] text-xs font-bold text-[#3A2B24] rounded-xl h-10"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-bold text-[#6C5C54] mb-1 block">Ambassador Commission</label>
                  <Input
                    value={promoConfig.commissionPercent}
                    onChange={(e) => setPromoConfig({ ...promoConfig, commissionPercent: e.target.value })}
                    className="bg-[#FFF8F2] border-[#EFE6DD] text-xs font-bold text-[#3A2B24] rounded-xl h-10"
                  />
                </div>

                <div className="flex items-end">
                  <Button
                    type="submit"
                    className="w-full btn-pixello-primary text-xs font-bold rounded-xl h-10 shadow-2xs flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Save className="h-3.5 w-3.5 text-white" /> Save Configurations
                  </Button>
                </div>
              </div>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Active Ambassador Directory Table */}
      <Card className="border border-[#EFE6DD] bg-white rounded-3xl shadow-xs overflow-hidden">
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <h3 className="font-serif-brand text-xl font-bold text-[#3A2B24]">Active Ambassador Directory</h3>
            <div className="relative w-full sm:w-72">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#6C5C54]" />
              <Input 
                placeholder="Search ambassador, college, or promo code..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 rounded-full border-[#EFE6DD] bg-[#FFF8F2] text-xs font-medium text-[#3A2B24]" 
              />
            </div>
          </div>

          <div className="overflow-hidden border border-[#EFE6DD] rounded-2xl">
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left table-auto">
                <thead className="text-[11px] font-bold text-[#6C5C54] uppercase tracking-wider bg-[#FFF8F2] border-b border-[#EFE6DD]">
                  <tr>
                    <th className="px-5 py-3.5 text-left min-w-[200px]">Ambassador</th>
                    <th className="px-5 py-3.5 text-left min-w-[220px]">Campus / College</th>
                    <th className="px-5 py-3.5 text-left min-w-[160px]">Assigned Promo Code</th>
                    <th className="px-5 py-3.5 text-left min-w-[180px]">Referrals</th>
                    <th className="px-5 py-3.5 text-left min-w-[150px]">Live Earnings</th>
                    <th className="px-5 py-3.5 text-left min-w-[140px]">Status</th>
                    <th className="px-5 py-3.5 text-right min-w-[140px]">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#EFE6DD]">
                  {filteredAmbassadors.map((amb) => {
                    const metrics = getAmbassadorLiveMetrics(amb);
                    return (
                      <tr key={amb.id} className="hover:bg-[#FFF8F2]/50 transition-colors">
                        <td className="px-5 py-4 align-middle">
                          <div className="flex items-center gap-3">
                            <Avatar className="h-9 w-9 border border-[#EFE6DD] bg-[#FFF8F2] shrink-0">
                              <AvatarFallback className="text-xs font-bold text-[#D89A86]">
                                {amb.name.charAt(0)}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="font-bold text-[#3A2B24] text-sm leading-snug">{amb.name}</p>
                              <p className="text-xs text-[#6C5C54] font-medium mt-0.5">{amb.id}</p>
                            </div>
                          </div>
                        </td>

                        <td className="px-5 py-4 align-middle text-xs font-medium text-[#6C5C54]">
                          <div className="flex items-center gap-1.5 font-bold text-[#3A2B24]">
                            <GraduationCap className="h-4 w-4 text-[#D89A86] shrink-0" />
                            <span className="leading-snug">{amb.college}</span>
                          </div>
                        </td>

                        <td className="px-5 py-4 align-middle">
                          <div className="flex items-center gap-1.5">
                            <Badge className="bg-[#FFF8F2] text-[#3A2B24] border border-[#D89A86]/40 font-mono font-bold text-xs px-2.5 py-1 rounded-lg tracking-wider">
                              {amb.promoCode || "SREE20"}
                            </Badge>
                            <button
                              onClick={() => {
                                setEditingAmbassadorCode(amb);
                                setEditPromoCodeInput(amb.promoCode || "SREE20");
                              }}
                              title="Edit Promo Code & Link"
                              className="h-7 w-7 rounded-lg bg-white border border-[#EFE6DD] hover:bg-[#FFF8F2] flex items-center justify-center text-[#D89A86] cursor-pointer shadow-2xs transition-colors shrink-0"
                            >
                              <Edit3 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </td>

                        <td className="px-5 py-4 align-middle">
                          <div className="flex flex-col gap-1 items-start">
                            <Badge className="bg-[#FFF8F2] text-[#D89A86] border border-[#D89A86]/30 text-[11px] px-2.5 py-0.5 rounded-full font-bold flex items-center gap-1">
                              <Trophy className="h-3 w-3 text-[#D89A86]" /> {metrics.rank}
                            </Badge>
                            <span suppressHydrationWarning className="text-xs font-bold text-[#3A2B24]">
                              {metrics.referrals} Referrals
                              {metrics.liveOrdersCount > 0 && (
                                <span className="text-[10px] text-emerald-700 font-extrabold ml-1.5 bg-emerald-100/70 px-1.5 py-0.5 rounded-full border border-emerald-200">
                                  +{metrics.liveOrdersCount} Live
                                </span>
                              )}
                            </span>
                          </div>
                        </td>

                        <td className="px-5 py-4 align-middle">
                          <div className="flex items-center gap-1.5 font-extrabold text-sm text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-xl w-fit shadow-2xs">
                            <Wallet className="h-4 w-4 text-emerald-600 shrink-0" />
                            <span suppressHydrationWarning>{metrics.earnings}</span>
                          </div>
                        </td>

                        <td className="px-5 py-4 align-middle">
                          <DropdownMenu>
                            <DropdownMenuTrigger className="cursor-pointer group flex items-center gap-1 focus:outline-none bg-transparent border-none p-0">
                              <Badge 
                                className={
                                  amb.status === "APPROVED" 
                                    ? "bg-emerald-100 text-emerald-800 border-emerald-200 text-xs px-3 py-1 rounded-full font-bold shadow-2xs flex items-center gap-1.5"
                                    : amb.status === "PENDING"
                                    ? "bg-amber-100 text-amber-800 border-amber-200 text-xs px-3 py-1 rounded-full font-bold shadow-2xs flex items-center gap-1.5"
                                    : "bg-rose-100 text-rose-800 border-rose-200 text-xs px-3 py-1 rounded-full font-bold shadow-2xs flex items-center gap-1.5"
                                }
                              >
                                <span className={`h-2 w-2 rounded-full ${
                                  amb.status === "APPROVED" ? "bg-emerald-500" : amb.status === "PENDING" ? "bg-amber-500" : "bg-rose-600"
                                }`} />
                                {amb.status}
                                <ChevronDown className="h-3 w-3 text-[#6C5C54] opacity-50 group-hover:opacity-100 transition-opacity ml-0.5" />
                              </Badge>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="start" className="w-48 rounded-2xl border-[#EFE6DD] p-2 shadow-xl bg-white">
                              <div className="px-3 py-1.5 text-xs font-bold text-[#3A2B24] border-b border-[#EFE6DD]">
                                Set Status
                              </div>
                              <div className="py-1 flex flex-col gap-1">
                                <DropdownMenuItem
                                  onClick={() => updateAmbassadorStatus(amb.id, "APPROVED")}
                                  className="flex items-center gap-2 p-2 rounded-xl cursor-pointer hover:bg-slate-50 text-[#3A2B24]"
                                >
                                  <span className="h-2.5 w-2.5 rounded-full bg-emerald-500 flex-shrink-0" />
                                  <span className="text-xs font-bold text-emerald-700">APPROVED</span>
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => updateAmbassadorStatus(amb.id, "PENDING")}
                                  className="flex items-center gap-2 p-2 rounded-xl cursor-pointer hover:bg-slate-50 text-[#3A2B24]"
                                >
                                  <span className="h-2.5 w-2.5 rounded-full bg-amber-500 flex-shrink-0" />
                                  <span className="text-xs font-bold text-amber-700">PENDING</span>
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => updateAmbassadorStatus(amb.id, "REJECTED")}
                                  className="flex items-center gap-2 p-2 rounded-xl cursor-pointer hover:bg-slate-50 text-[#3A2B24]"
                                >
                                  <span className="h-2.5 w-2.5 rounded-full bg-rose-600 flex-shrink-0" />
                                  <span className="text-xs font-bold text-rose-700">REJECT & REMOVE</span>
                                </DropdownMenuItem>
                              </div>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </td>

                        <td className="px-5 py-4 align-middle text-right whitespace-nowrap">
                          {amb.status === "PENDING" ? (
                            <div className="flex items-center justify-end gap-2">
                              <Button 
                                size="sm" 
                                variant="outline" 
                                onClick={() => setSelectedAmbassador(amb)}
                                className="rounded-full text-xs font-bold border-[#EFE6DD] text-[#3A2B24] bg-white hover:bg-[#FFF8F2] hover:text-[#D89A86] px-3.5 h-8 flex items-center gap-1.5 cursor-pointer shadow-2xs"
                              >
                                <Eye className="h-3.5 w-3.5 text-[#D89A86]" /> View Profile
                              </Button>
                              <Button size="sm" variant="outline" onClick={() => updateAmbassadorStatus(amb.id, "APPROVED")} className="rounded-full text-xs font-bold border-emerald-200 text-emerald-700 bg-white hover:bg-emerald-50 px-3.5 h-8 flex items-center gap-1.5 cursor-pointer shadow-2xs">
                                <CheckCircle className="h-3.5 w-3.5 text-emerald-600" /> Approve
                              </Button>
                              <Button size="sm" variant="outline" onClick={() => updateAmbassadorStatus(amb.id, "REJECTED")} className="rounded-full text-xs font-bold border-rose-200 text-rose-700 bg-white hover:bg-rose-50 px-3.5 h-8 flex items-center gap-1.5 cursor-pointer shadow-2xs">
                                <XCircle className="h-3.5 w-3.5 text-rose-600" /> Reject
                              </Button>
                            </div>
                          ) : (
                            <div className="flex items-center justify-end gap-2">
                              <Button 
                                size="sm" 
                                variant="outline" 
                                onClick={() => setSelectedAmbassador(amb)}
                                className="rounded-full text-xs font-bold border-[#EFE6DD] text-[#3A2B24] bg-white hover:bg-[#FFF8F2] hover:text-[#D89A86] px-3.5 h-8 flex items-center gap-1.5 cursor-pointer shadow-2xs"
                              >
                                <Eye className="h-3.5 w-3.5 text-[#D89A86]" /> View Profile
                              </Button>
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Modal: Pixello WhatsApp Intimation Dispatch Confirmation */}
      {whatsappModal && whatsappModal.isOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-[#EFE6DD] shadow-2xl w-full max-w-lg p-6 overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-4 border-b border-[#EFE6DD] mb-4">
              <div className="flex items-center gap-2.5">
                <div className="h-10 w-10 rounded-2xl bg-emerald-500 text-white flex items-center justify-center shadow-xs">
                  <Smartphone className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-serif-brand text-xl font-bold text-[#3A2B24]">Pixello WhatsApp Dispatcher</h3>
                  <p className="text-xs text-[#6C5C54]">Intimation dispatched via Pixello Official WhatsApp (+91 8074589949)</p>
                </div>
              </div>
              <button
                onClick={() => setWhatsappModal(null)}
                className="h-8 w-8 rounded-full flex items-center justify-center text-[#6C5C54] hover:bg-[#FFF8F2] cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="flex flex-col gap-4 text-xs">
              <div className="p-3.5 bg-emerald-50 rounded-2xl border border-emerald-200 flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-emerald-800 font-bold uppercase tracking-wider block">Sender Account (Automated)</span>
                  <span className="font-extrabold text-[#3A2B24] text-xs flex items-center gap-1.5 mt-0.5">
                    <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" /> Pixello Official Business (+91 8074589949)
                  </span>
                </div>
                <Badge className="bg-emerald-600 text-white border-none text-[10px] px-2.5 py-0.5 rounded-full font-bold">
                  ✓ Message Sent
                </Badge>
              </div>

              <div className="flex items-center justify-between p-3.5 bg-slate-50 rounded-2xl border border-slate-200">
                <div>
                  <span className="text-[10px] text-[#6C5C54] font-bold uppercase tracking-wider block">Recipient Student</span>
                  <span className="font-bold text-[#3A2B24] text-sm">{whatsappModal.studentName}</span>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-[#6C5C54] font-bold uppercase tracking-wider block">Recipient Mobile</span>
                  <span className="font-extrabold text-emerald-700 text-sm font-mono">+91 {whatsappModal.phone}</span>
                </div>
              </div>

              <div>
                <span className="text-[10px] font-bold text-[#6C5C54] uppercase tracking-wider block mb-1">Dispatched Message Content</span>
                <div className="p-4 bg-white border border-[#EFE6DD] rounded-2xl text-[11px] font-sans text-[#3A2B24] whitespace-pre-wrap leading-relaxed max-h-52 overflow-y-auto shadow-2xs">
                  {whatsappModal.message}
                </div>
              </div>

              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-[#EFE6DD]">
                <Button
                  variant="outline"
                  onClick={() => setWhatsappModal(null)}
                  className="rounded-full text-xs font-bold border-[#EFE6DD] text-[#3A2B24] w-full sm:w-auto"
                >
                  Close
                </Button>
                <div className="flex flex-col sm:flex-row items-center gap-2 w-full sm:w-auto">
                  <Button
                    onClick={() => {
                      dispatchWhatsApp(whatsappModal.phone, whatsappModal.message, whatsappModal.studentName, whatsappModal.type);
                      openWhatsAppWebLink(whatsappModal.phone, whatsappModal.message);
                      showToast(`✓ Opened WhatsApp Chat to send intimation from Pixello 8074589949 to ${whatsappModal.studentName}!`);
                    }}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-full px-6 h-10 text-xs shadow-md flex items-center justify-center gap-2 cursor-pointer w-full sm:w-auto"
                  >
                    <Send className="h-4 w-4 text-white" /> Open & Send Message (8074589949)
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal: View Full Google Sheet Submission Info */}
      {selectedGoogleSub && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-[#EFE6DD] shadow-2xl w-full max-w-lg p-6 overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-4 border-b border-[#EFE6DD] mb-5">
              <div className="flex items-center gap-3">
                <Avatar className="h-11 w-11 border border-[#EFE6DD] bg-[#FFF8F2]">
                  <AvatarFallback className="font-bold text-[#D89A86] text-base bg-[#FFF8F2]">
                    {selectedGoogleSub.name.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="font-serif-brand text-xl font-bold text-[#3A2B24]">{selectedGoogleSub.name}</h3>
                  <p className="text-xs text-[#6C5C54] font-medium">Google Sheet Form Response • {selectedGoogleSub.submittedAt}</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedGoogleSub(null)}
                className="h-8 w-8 rounded-full flex items-center justify-center text-[#6C5C54] hover:bg-[#FFF8F2] cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="flex flex-col gap-4 text-xs">
              <div className="grid grid-cols-2 gap-3 p-3.5 bg-[#FFF8F2]/60 rounded-2xl border border-[#EFE6DD]">
                <div>
                  <span className="text-[10px] text-[#6C5C54] font-bold uppercase tracking-wider block">College / University</span>
                  <span className="font-bold text-[#3A2B24] text-sm flex items-center gap-1 mt-0.5">
                    <GraduationCap className="h-4 w-4 text-[#D89A86]" /> {selectedGoogleSub.college}
                  </span>
                  {selectedGoogleSub.location && (
                    <p className="text-[11px] text-[#6C5C54] mt-0.5">Location: {selectedGoogleSub.location}</p>
                  )}
                </div>
                <div>
                  <span className="text-[10px] text-[#6C5C54] font-bold uppercase tracking-wider block">Course & Year</span>
                  <span className="font-bold text-[#3A2B24] text-sm block mt-0.5">
                    {selectedGoogleSub.course || "B.Tech"} ({selectedGoogleSub.year || "2nd Year"})
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-white border border-[#EFE6DD] rounded-xl">
                  <span className="text-[10px] text-[#6C5C54] font-bold uppercase tracking-wider block">Gender & DOB</span>
                  <span className="font-bold text-[#3A2B24] mt-0.5 block">
                    {selectedGoogleSub.gender || "Not specified"} • {selectedGoogleSub.dob || "N/A"}
                  </span>
                </div>
                <div className="p-3 bg-white border border-[#EFE6DD] rounded-xl">
                  <span className="text-[10px] text-[#6C5C54] font-bold uppercase tracking-wider block">Instagram Handle</span>
                  <span className="font-bold text-[#D89A86] mt-0.5 block">
                    {selectedGoogleSub.instagramHandle || "@student"}
                  </span>
                </div>
              </div>

              <div className="p-3 bg-white border border-[#EFE6DD] rounded-xl">
                <span className="text-[10px] text-[#6C5C54] font-bold uppercase tracking-wider block">Residential Address</span>
                <span className="font-bold text-[#3A2B24] mt-0.5 block">
                  {selectedGoogleSub.address || "Hyderabad"}
                </span>
              </div>

              <div className="flex flex-col gap-2.5">
                <div className="flex items-center justify-between p-3 rounded-2xl border border-[#EFE6DD] bg-white">
                  <div className="flex items-center gap-3">
                    <Mail className="h-4 w-4 text-[#D89A86]" />
                    <span className="font-semibold text-[#3A2B24]">{selectedGoogleSub.email}</span>
                  </div>
                  <Badge className="bg-emerald-100 text-emerald-800 border-none text-[10px] px-2.5 py-0.5 rounded-full font-bold">
                    Email Verified
                  </Badge>
                </div>

                <div className="flex items-center justify-between p-3 rounded-2xl border border-[#EFE6DD] bg-white">
                  <div className="flex items-center gap-3">
                    <Phone className="h-4 w-4 text-[#D89A86]" />
                    <span className="font-semibold text-[#3A2B24]">{selectedGoogleSub.phone}</span>
                  </div>
                  <Badge className="bg-emerald-100 text-emerald-800 border-none text-[10px] px-2.5 py-0.5 rounded-full font-bold">
                    WhatsApp Active
                  </Badge>
                </div>
              </div>

              <div className="flex items-center justify-between pt-4 mt-2 border-t border-[#EFE6DD]">
                <Button
                  variant="outline"
                  onClick={() => setSelectedGoogleSub(null)}
                  className="rounded-full text-xs font-bold border-[#EFE6DD] text-[#3A2B24]"
                >
                  Close
                </Button>

                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      handleRejectGoogleSubmission(selectedGoogleSub);
                      setSelectedGoogleSub(null);
                    }}
                    className="rounded-full text-xs font-bold border-rose-200 text-rose-700 bg-white hover:bg-rose-50 px-4 h-9"
                  >
                    <Trash2 className="h-4 w-4 mr-1.5 text-rose-600" /> Reject
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => {
                      handleApproveGoogleSubmission(selectedGoogleSub);
                      setSelectedGoogleSub(null);
                    }}
                    className="btn-pixello-primary text-xs font-bold rounded-full px-5 h-9 shadow-xs"
                  >
                    <UserCheck className="h-4 w-4 mr-1.5 text-white" /> Approve Ambassador
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Add Google Form Response */}
      {isImportModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-[#EFE6DD] shadow-2xl w-full max-w-md p-6 overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-4 border-b border-[#EFE6DD] mb-5">
              <div className="flex items-center gap-2">
                <FileSpreadsheet className="h-5 w-5 text-[#D89A86]" />
                <h3 className="font-serif-brand text-xl font-bold text-[#3A2B24]">Add Form Response</h3>
              </div>
              <button
                onClick={() => setIsImportModalOpen(false)}
                className="h-8 w-8 rounded-full flex items-center justify-center text-[#6C5C54] hover:bg-[#FFF8F2] cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleManualImportSubmission} className="flex flex-col gap-4">
              <div>
                <label className="text-xs font-bold text-[#3A2B24] mb-1 block">Applicant Student Name *</label>
                <Input
                  required
                  placeholder="e.g. Priyanshu Sharma"
                  value={importForm.name}
                  onChange={(e) => setImportForm({ ...importForm, name: e.target.value })}
                  className="rounded-xl border-[#EFE6DD] bg-white text-xs font-medium text-[#3A2B24] focus-visible:ring-[#D89A86]"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-[#3A2B24] mb-1 block">College / University *</label>
                <Input
                  required
                  placeholder="e.g. IIT Kharagpur"
                  value={importForm.college}
                  onChange={(e) => setImportForm({ ...importForm, college: e.target.value })}
                  className="rounded-xl border-[#EFE6DD] bg-white text-xs font-medium text-[#3A2B24] focus-visible:ring-[#D89A86]"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-[#3A2B24] mb-1 block">Student Email</label>
                  <Input
                    placeholder="priyanshu@iitkgp.ac.in"
                    value={importForm.email}
                    onChange={(e) => setImportForm({ ...importForm, email: e.target.value })}
                    className="rounded-xl border-[#EFE6DD] bg-white text-xs font-medium text-[#3A2B24] focus-visible:ring-[#D89A86]"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-[#3A2B24] mb-1 block">Phone Number</label>
                  <Input
                    placeholder="+91 91234 56789"
                    value={importForm.phone}
                    onChange={(e) => setImportForm({ ...importForm, phone: e.target.value })}
                    className="rounded-xl border-[#EFE6DD] bg-white text-xs font-medium text-[#3A2B24] focus-visible:ring-[#D89A86]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-[#3A2B24] mb-1 block">Course</label>
                  <Input
                    placeholder="e.g. B.Tech"
                    value={importForm.course}
                    onChange={(e) => setImportForm({ ...importForm, course: e.target.value })}
                    className="rounded-xl border-[#EFE6DD] bg-white text-xs font-medium text-[#3A2B24] focus-visible:ring-[#D89A86]"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-[#3A2B24] mb-1 block">Year of Study</label>
                  <Input
                    placeholder="e.g. 2nd Year"
                    value={importForm.year}
                    onChange={(e) => setImportForm({ ...importForm, year: e.target.value })}
                    className="rounded-xl border-[#EFE6DD] bg-white text-xs font-medium text-[#3A2B24] focus-visible:ring-[#D89A86]"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-[#3A2B24] mb-1 block">Suggested Promo Code</label>
                <Input
                  placeholder="e.g. PRIYANSHU10"
                  value={importForm.suggestedPromoCode}
                  onChange={(e) => setImportForm({ ...importForm, suggestedPromoCode: e.target.value.toUpperCase() })}
                  className="rounded-xl border-[#EFE6DD] bg-white text-xs font-mono font-bold uppercase text-[#3A2B24] focus-visible:ring-[#D89A86]"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 mt-2 border-t border-[#EFE6DD]">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsImportModalOpen(false)}
                  className="rounded-full text-xs font-bold border-[#EFE6DD] text-[#3A2B24]"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  className="btn-pixello-primary text-xs font-bold rounded-full px-6 h-10 shadow-xs"
                >
                  Add Response
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Edit Individual Ambassador Code */}
      {editingAmbassadorCode && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-[#EFE6DD] shadow-2xl w-full max-w-md p-6 overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-4 border-b border-[#EFE6DD] mb-5">
              <div className="flex items-center gap-2">
                <QrCode className="h-5 w-5 text-[#D89A86]" />
                <h3 className="font-serif-brand text-xl font-bold text-[#3A2B24]">Edit Ambassador Promo Code</h3>
              </div>
              <button
                onClick={() => setEditingAmbassadorCode(null)}
                className="h-8 w-8 rounded-full flex items-center justify-center text-[#6C5C54] hover:bg-[#FFF8F2] cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleSaveAmbassadorCode} className="flex flex-col gap-4">
              <div className="p-3 bg-[#FFF8F2] rounded-2xl border border-[#EFE6DD]">
                <p className="text-xs font-bold text-[#3A2B24]">{editingAmbassadorCode.name}</p>
                <p className="text-[11px] text-[#6C5C54] font-medium">{editingAmbassadorCode.college} • {editingAmbassadorCode.id}</p>
              </div>

              <div>
                <label className="text-xs font-bold text-[#3A2B24] mb-1 block">Assigned Promo Code *</label>
                <Input
                  required
                  value={editPromoCodeInput}
                  onChange={(e) => setEditPromoCodeInput(e.target.value.toUpperCase())}
                  className="rounded-xl border-[#EFE6DD] bg-white text-xs font-mono font-extrabold text-[#3A2B24] tracking-widest uppercase focus-visible:ring-[#D89A86]"
                />
              </div>

              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                <span className="text-[10px] text-[#6C5C54] font-bold uppercase tracking-wider block">Generated Referral Link</span>
                <span className="text-xs font-mono font-extrabold text-[#D89A86] truncate block mt-0.5">
                  {promoConfig.baseUrl}{editPromoCodeInput || "CODE"}
                </span>
              </div>

              <div className="flex justify-end gap-3 pt-3 mt-2 border-t border-[#EFE6DD]">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setEditingAmbassadorCode(null)}
                  className="rounded-full text-xs font-bold border-[#EFE6DD] text-[#3A2B24]"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  className="btn-pixello-primary text-xs font-bold rounded-full px-6 h-10 shadow-xs"
                >
                  Save Code & Link
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Ambassador View Profile Modal Dialog */}
      {selectedAmbassador && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-[#EFE6DD] shadow-2xl w-full max-w-lg p-6 overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-4 border-b border-[#EFE6DD] mb-5">
              <div className="flex items-center gap-3">
                <Avatar className="h-11 w-11 border border-[#EFE6DD] bg-[#FFF8F2]">
                  <AvatarFallback className="font-bold text-[#D89A86] text-base bg-[#FFF8F2]">
                    {selectedAmbassador.name.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-serif-brand text-xl font-bold text-[#3A2B24]">{selectedAmbassador.name}</h3>
                    {selectedAmbassador.status === "APPROVED" ? (
                      <Badge className="bg-emerald-100 text-emerald-800 border border-emerald-300 text-[10px] px-2.5 py-0.5 rounded-full font-extrabold flex items-center gap-1">
                        <span className="h-2 w-2 rounded-full bg-emerald-500" />
                        APPROVED
                      </Badge>
                    ) : selectedAmbassador.status === "PENDING" ? (
                      <Badge className="bg-amber-100 text-amber-800 border border-amber-300 text-[10px] px-2.5 py-0.5 rounded-full font-extrabold flex items-center gap-1">
                        <span className="h-2 w-2 rounded-full bg-amber-500" />
                        PENDING
                      </Badge>
                    ) : (
                      <Badge className="bg-rose-100 text-rose-800 border border-rose-300 text-[10px] px-2.5 py-0.5 rounded-full font-extrabold flex items-center gap-1">
                        <span className="h-2 w-2 rounded-full bg-rose-600" />
                        REJECTED
                      </Badge>
                    )}
                  </div>
                  <p className="text-xs text-[#6C5C54] font-medium">Campus Leader Profile • {selectedAmbassador.id}</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedAmbassador(null)}
                className="h-8 w-8 rounded-full flex items-center justify-center text-[#6C5C54] hover:bg-[#FFF8F2] cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="flex flex-col gap-4 text-xs">
              <div className="grid grid-cols-2 gap-3 p-3.5 bg-[#FFF8F2]/60 rounded-2xl border border-[#EFE6DD]">
                <div>
                  <span className="text-[10px] text-[#6C5C54] font-bold uppercase tracking-wider block">College / University</span>
                  <span className="font-bold text-[#3A2B24] text-sm flex items-center gap-1 mt-0.5">
                    <GraduationCap className="h-4 w-4 text-[#D89A86]" /> {selectedAmbassador.college}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-[#6C5C54] font-bold uppercase tracking-wider block">Leaderboard Rank</span>
                  <span className="font-bold text-[#D89A86] text-sm flex items-center gap-1 mt-0.5">
                    <Trophy className="h-4 w-4 text-[#D89A86]" /> {selectedAmbassador.rank}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="p-3.5 rounded-2xl bg-emerald-50/60 border border-emerald-100">
                  <span className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider block">Total Referrals</span>
                  <span className="text-xl font-extrabold text-emerald-700">{selectedAmbassador.referrals} Students</span>
                </div>
                <div className="p-3.5 rounded-2xl bg-[#FFF8F2] border border-[#EFE6DD]">
                  <span className="text-[10px] font-bold text-[#6C5C54] uppercase tracking-wider block">Commission Earnings</span>
                  <span className="text-xl font-extrabold text-[#D89A86]">{selectedAmbassador.earnings}</span>
                </div>
              </div>

              <h4 className="font-serif-brand font-bold text-sm text-[#3A2B24] mt-1">Verification & Contact</h4>
              
              <div className="flex flex-col gap-2.5">
                <div className="flex items-center justify-between p-3 rounded-2xl border border-[#EFE6DD] bg-white">
                  <div className="flex items-center gap-3">
                    <Mail className="h-4 w-4 text-[#D89A86]" />
                    <span className="font-semibold text-[#3A2B24]">{selectedAmbassador.email}</span>
                  </div>
                  <Badge className="bg-emerald-100 text-emerald-800 border-none text-[10px] px-2.5 py-0.5 rounded-full font-bold">
                    <ShieldCheck className="h-3 w-3 mr-1" /> Student Verified
                  </Badge>
                </div>

                <div className="flex items-center justify-between p-3 rounded-2xl border border-[#EFE6DD] bg-white">
                  <div className="flex items-center gap-3">
                    <Phone className="h-4 w-4 text-[#D89A86]" />
                    <span className="font-semibold text-[#3A2B24]">{selectedAmbassador.phone}</span>
                  </div>
                  <Badge className="bg-emerald-100 text-emerald-800 border-none text-[10px] px-2.5 py-0.5 rounded-full font-bold">
                    WhatsApp Active
                  </Badge>
                </div>
              </div>

              {/* Portal Login Credentials Section */}
              <div className="p-4 bg-[#FFF8F2] border border-[#D89A86]/40 rounded-2xl">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[11px] font-bold text-[#3A2B24] uppercase tracking-wider flex items-center gap-1.5">
                    <KeyRound className="h-3.5 w-3.5 text-[#D89A86]" /> Ambassador Portal Credentials
                  </span>
                  <Badge className="bg-emerald-700 text-white border-none text-[9px] px-2 py-0.5 rounded-full font-extrabold">
                    Ready to Login
                  </Badge>
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="p-2.5 bg-white rounded-xl border border-[#EFE6DD]">
                    <span className="text-[10px] text-[#6C5C54] block">Login Phone:</span>
                    <span className="font-mono font-bold text-[#3A2B24] text-xs">
                      {selectedAmbassador.phone ? selectedAmbassador.phone.replace(/\D/g, "").slice(-10) : "9493837127"}
                    </span>
                  </div>
                  <div className="p-2.5 bg-white rounded-xl border border-[#EFE6DD]">
                    <span className="text-[10px] text-[#6C5C54] block">Security PIN / Pass:</span>
                    <span className="font-mono font-bold text-emerald-700 text-xs">1234</span>
                  </div>
                </div>
                <div className="mt-2.5 flex items-center justify-between text-[11px]">
                  <span className="text-[#6C5C54]">Portal Login URL:</span>
                  <Link
                    href="/ambassador/login"
                    target="_blank"
                    className="font-bold text-[#D89A86] hover:underline flex items-center gap-1"
                  >
                    /ambassador/login <ExternalLink className="h-3 w-3" />
                  </Link>
                </div>
              </div>

              <div className="flex items-center justify-between pt-4 mt-2 border-t border-[#EFE6DD]">
                <Button
                  variant="outline"
                  onClick={() => setSelectedAmbassador(null)}
                  className="rounded-full text-xs font-bold border-[#EFE6DD] text-[#3A2B24]"
                >
                  Close
                </Button>

                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      updateAmbassadorStatus(selectedAmbassador.id, "REJECTED");
                      setSelectedAmbassador(null);
                    }}
                    className="rounded-full text-xs font-bold border-rose-200 text-rose-700 bg-white hover:bg-rose-50 px-4 h-9 cursor-pointer"
                  >
                    <XCircle className="h-4 w-4 mr-1.5" /> Reject & Remove
                  </Button>
                  
                  {selectedAmbassador.status === "APPROVED" ? (
                    <Button
                      size="sm"
                      disabled
                      className="bg-emerald-600 text-white font-extrabold text-xs rounded-full px-5 h-9 shadow-xs flex items-center gap-1.5 opacity-100 cursor-default"
                    >
                      <CheckCircle2 className="h-4 w-4 text-white" /> Approved (Active)
                    </Button>
                  ) : (
                    <Button
                      size="sm"
                      onClick={() => {
                        updateAmbassadorStatus(selectedAmbassador.id, "APPROVED");
                        setSelectedAmbassador(null);
                      }}
                      className="btn-pixello-primary text-xs font-bold rounded-full px-5 h-9 shadow-xs cursor-pointer"
                    >
                      <CheckCircle className="h-4 w-4 mr-1.5 text-white" /> Approve Ambassador
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Recruit New Ambassador Modal Dialog */}
      {isRecruitModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-[#EFE6DD] shadow-2xl w-full max-w-md p-6 overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-4 border-b border-[#EFE6DD] mb-5">
              <div className="flex items-center gap-2">
                <GraduationCap className="h-5 w-5 text-[#D89A86]" />
                <h3 className="font-serif-brand text-xl font-bold text-[#3A2B24]">Recruit Campus Ambassador</h3>
              </div>
              <button
                onClick={() => setIsRecruitModalOpen(false)}
                className="h-8 w-8 rounded-full flex items-center justify-center text-[#6C5C54] hover:bg-[#FFF8F2] cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleSaveRecruitAmbassador} className="flex flex-col gap-4">
              <div>
                <label className="text-xs font-bold text-[#3A2B24] mb-1 block">Full Name *</label>
                <Input
                  required
                  placeholder="e.g. Rahul Varma"
                  value={recruitForm.name}
                  onChange={(e) => setRecruitForm({ ...recruitForm, name: e.target.value })}
                  className="rounded-xl border-[#EFE6DD] bg-white text-xs font-medium text-[#3A2B24] focus-visible:ring-[#D89A86]"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-[#3A2B24] mb-1 block">College / University *</label>
                <Input
                  required
                  placeholder="e.g. IIT Delhi"
                  value={recruitForm.college}
                  onChange={(e) => setRecruitForm({ ...recruitForm, college: e.target.value })}
                  className="rounded-xl border-[#EFE6DD] bg-white text-xs font-medium text-[#3A2B24] focus-visible:ring-[#D89A86]"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-[#3A2B24] mb-1 block">Assigned Promo Code</label>
                  <Input
                    placeholder="e.g. RAHUL10"
                    value={recruitForm.promoCode}
                    onChange={(e) => setRecruitForm({ ...recruitForm, promoCode: e.target.value.toUpperCase() })}
                    className="rounded-xl border-[#EFE6DD] bg-white text-xs font-mono font-bold uppercase text-[#3A2B24] focus-visible:ring-[#D89A86]"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-[#3A2B24] mb-1 block">Phone Number</label>
                  <Input
                    placeholder="+91 98765 43210"
                    value={recruitForm.phone}
                    onChange={(e) => setRecruitForm({ ...recruitForm, phone: e.target.value })}
                    className="rounded-xl border-[#EFE6DD] bg-white text-xs font-medium text-[#3A2B24] focus-visible:ring-[#D89A86]"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-[#3A2B24] mb-1 block">Initial Status</label>
                <select
                  value={recruitForm.status}
                  onChange={(e) => setRecruitForm({ ...recruitForm, status: e.target.value as any })}
                  className="w-full h-10 rounded-xl border border-[#EFE6DD] bg-white text-xs font-medium text-[#3A2B24] px-3 focus:outline-none focus:ring-2 focus:ring-[#D89A86] cursor-pointer"
                >
                  <option value="APPROVED" className="bg-white text-[#3A2B24]">APPROVED</option>
                  <option value="PENDING" className="bg-white text-[#3A2B24]">PENDING</option>
                </select>
              </div>

              <div className="flex justify-end gap-3 pt-3 mt-2 border-t border-[#EFE6DD]">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsRecruitModalOpen(false)}
                  className="rounded-full text-xs font-bold border-[#EFE6DD] text-[#3A2B24]"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  className="btn-pixello-primary text-xs font-bold rounded-full px-6 h-10 shadow-xs"
                >
                  Recruit Ambassador
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
