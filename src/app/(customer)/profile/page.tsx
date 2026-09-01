"use client";

import { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { User, Package, MapPin, Heart, Settings, LogOut, ShieldCheck, Check, Plus, Edit2, Key, Bell, CreditCard, ExternalLink, Download, Eye, EyeOff, CheckCircle2, Truck, Sparkles, Clock, PhoneCall, MessageSquare, FileText, Image as ImageIcon, X, Ticket, RefreshCw, Star, Upload, AlertTriangle, CheckCircle, MessageSquareQuote } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

import { useOrders } from "@/context/OrderContext";
import { useWishlist } from "@/context/WishlistContext";
import { useSearchParams } from "next/navigation";
import { usePixelloTransition } from "@/components/customer/PixelloPageTransition";

function ProfileContent() {
  const { startTransitionTo } = usePixelloTransition();
  const { orders, updateOrderStatus } = useOrders();
  const { wishlist, toggleWishlist } = useWishlist();
  const searchParams = useSearchParams();
  const initialTab = searchParams.get("tab") || "orders";

  const [activeTab, setActiveTab] = useState(initialTab);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);

  // Product Reviews State
  const [userReviews, setUserReviews] = useState<Record<string, any>>({});
  const [reviewModalItem, setReviewModalItem] = useState<{
    orderId: string;
    item: any;
    existingReview?: any;
  } | null>(null);
  const [reviewRating, setReviewRating] = useState<number>(5);
  const [reviewHoverRating, setReviewHoverRating] = useState<number>(0);
  const [reviewTitle, setReviewTitle] = useState<string>("");
  const [reviewComment, setReviewComment] = useState<string>("");
  const [reviewSelectedTags, setReviewSelectedTags] = useState<string[]>([]);
  const [reviewPhotoUrl, setReviewPhotoUrl] = useState<string | null>(null);
  const [isSubmittingReview, setIsSubmittingReview] = useState<boolean>(false);
  const [reviewSuccessMsg, setReviewSuccessMsg] = useState<string>("");

  useEffect(() => {
    const fetchCustomerReviews = async () => {
      if (typeof window !== "undefined") {
        try {
          const savedReviews = localStorage.getItem("pixello_customer_reviews_v1");
          if (savedReviews) {
            setUserReviews(JSON.parse(savedReviews));
          }
        } catch (e) {}
      }

      try {
        const res = await fetch("/api/reviews");
        const data = await res.json();
        if (data.success && Array.isArray(data.reviews)) {
          const reviewMap: Record<string, any> = {};
          data.reviews.forEach((r: any) => {
            const key = `${r.orderId}_${r.productName}`;
            reviewMap[key] = r;
          });
          setUserReviews((prev) => ({ ...prev, ...reviewMap }));
          if (typeof window !== "undefined") {
            const localSaved = JSON.parse(localStorage.getItem("pixello_customer_reviews_v1") || "{}");
            localStorage.setItem("pixello_customer_reviews_v1", JSON.stringify({ ...localSaved, ...reviewMap }));
          }
        }
      } catch (err) {
        console.error("Error fetching reviews:", err);
      }
    };

    fetchCustomerReviews();
    window.addEventListener("pixello_admin_reviews_updated", fetchCustomerReviews);
    window.addEventListener("storage", fetchCustomerReviews);
    const interval = setInterval(fetchCustomerReviews, 10000);
    return () => {
      window.removeEventListener("pixello_admin_reviews_updated", fetchCustomerReviews);
      window.removeEventListener("storage", fetchCustomerReviews);
      clearInterval(interval);
    };
  }, []);

  const openReviewModal = (orderId: string, item: any) => {
    setReviewSuccessMsg("");
    setReviewRating(5);
    setReviewHoverRating(0);
    setReviewTitle("");
    setReviewComment("");
    setReviewSelectedTags(["Crisp HD Print", "Sturdy Frame", "Vivid Colors"]);
    setReviewPhotoUrl(null);
    setReviewModalItem({
      orderId,
      item,
    });
  };

  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reviewModalItem) return;

    setIsSubmittingReview(true);
    try {
      const defaultTitle = reviewRating === 5 ? "Loved the Quality!" : (reviewRating === 4 ? "Very Good Quality" : (reviewRating === 3 ? "Good Quality" : (reviewRating === 2 ? "Fair Experience" : "Product Review")));
      const reviewKey = `${reviewModalItem.orderId}_${reviewModalItem.item.name}`;
      const newReview = {
        id: `rev-${Date.now()}`,
        orderId: reviewModalItem.orderId,
        productName: reviewModalItem.item.name,
        productSize: reviewModalItem.item.size,
        productImage: reviewModalItem.item.image || "/images/wooden_frame_main.png",
        rating: reviewRating,
        title: reviewTitle.trim() || defaultTitle,
        comment: reviewComment.trim(),
        tags: reviewSelectedTags,
        photoUrl: reviewPhotoUrl,
        date: new Date().toISOString().split("T")[0],
        reviewerName: profileData.name || "Verified Customer",
        reviewerEmail: profileData.email || "",
      };

      const updated = {
        ...userReviews,
        [reviewKey]: newReview,
      };
      setUserReviews(updated);
      if (typeof window !== "undefined") {
        localStorage.setItem("pixello_customer_reviews_v1", JSON.stringify(updated));
        localStorage.setItem("pixello_last_submitted_review", JSON.stringify(newReview));
        window.dispatchEvent(new CustomEvent("pixello_new_review", { detail: newReview }));
      }

      // Sync review with Admin Portal API
      try {
        await fetch("/api/reviews", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(newReview),
        });
      } catch (apiErr) {
        console.error("Failed to push review to /api/reviews:", apiErr);
      }

      setReviewSuccessMsg("⭐ Thank you! Your review has been submitted directly to the Pixello Admin team.");
      setTimeout(() => {
        setReviewModalItem(null);
        setReviewSuccessMsg("");
      }, 1600);
    } catch (err) {
      console.error("Error submitting review:", err);
      alert("Failed to submit review. Please try again.");
    } finally {
      setIsSubmittingReview(false);
    }
  };

  // Profile Form State dynamically loaded from logged-in customer session
  const [profileData, setProfileData] = useState({
    name: "",
    email: "",
    phone: "",
    college: ""
  });

  // Saved Addresses State per customer with localStorage persistence
  const [addresses, setAddresses] = useState<any[]>([]);

  const persistAddresses = async (newAddrs: any[]) => {
    setAddresses(newAddrs);
    if (typeof window !== "undefined") {
      let mobileKey = "";
      const savedUser = localStorage.getItem("pixello_user");
      if (savedUser) {
        try {
          const parsed = JSON.parse(savedUser);
          mobileKey = (parsed.mobile || "").replace(/\D/g, "").slice(-10);
        } catch (e) {
          console.error(e);
        }
      }
      if (mobileKey) {
        localStorage.setItem(`pixello_addresses_${mobileKey}`, JSON.stringify(newAddrs));
      }
      localStorage.removeItem("pixello_addresses_default");
      window.dispatchEvent(new Event("storage"));

      // Also persist latest address to backend database
      try {
        const latestAddr = newAddrs[0];
        if (latestAddr && mobileKey !== "default") {
          await fetch("/api/addresses", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              mobile: mobileKey,
              name: latestAddr.name,
              street: latestAddr.street,
              city: latestAddr.city,
              district: latestAddr.district,
              state: latestAddr.state,
              pincode: latestAddr.pincode,
              label: latestAddr.type || "Home",
            }),
          });
        }
      } catch (err) {
        console.error("Failed to persist address to database:", err);
      }
    }
  };

  // Track Order & Add/Edit Address Modal State
  const [trackingOrder, setTrackingOrder] = useState<string | null>(null);
  const [orderDetailsModal, setOrderDetailsModal] = useState<any | null>(null);
  const [photoPreviewModal, setPhotoPreviewModal] = useState<{
    isOpen: boolean;
    photoUrl: string;
    photoName: string;
    itemName: string;
    orderId: string;
  } | null>(null);
  const [cancelOrderModal, setCancelOrderModal] = useState<any | null>(null);
  const [cancelReason, setCancelReason] = useState<string>("Changed my mind");
  const [cancelSuccessMsg, setCancelSuccessMsg] = useState<string>("");

  // Enhanced Replacement Request Modal State
  const [replacementModalOrder, setReplacementModalOrder] = useState<any | null>(null);
  const [replacementCategory, setReplacementCategory] = useState<string>("TRANSIT_DAMAGE");
  const [replacementReason, setReplacementReason] = useState<string>("Broken glass / cracked wooden frame in transit");
  const [replacementExactIssue, setReplacementExactIssue] = useState<string>("");
  const [replacementResolution, setReplacementResolution] = useState<string>("Re-make and ship fresh replacement (100% Free)");
  const [replacementPhotoUrl, setReplacementPhotoUrl] = useState<string | null>(null);
  const [replacementSuccessMsg, setReplacementSuccessMsg] = useState<string>("");
  const [isSubmittingReplacement, setIsSubmittingReplacement] = useState<boolean>(false);

  const handleRequestReplacementSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!replacementModalOrder) return;
    if (!replacementExactIssue.trim()) {
      alert("Please describe the exact issue with your item so our team can fix it perfectly.");
      return;
    }

    setIsSubmittingReplacement(true);
    try {
      const fullNote = `Replacement Requested: [${replacementReason}] - Exact Defect: ${replacementExactIssue.trim()} - Resolution: ${replacementResolution}${replacementPhotoUrl ? " (Defect Photo Attached)" : ""}`;
      await updateOrderStatus(replacementModalOrder.id, "Replacement Requested", fullNote);
      setReplacementSuccessMsg("✓ Replacement request registered with exact reason! Our partner studio will dispatch a fresh replacement.");
      setTimeout(() => {
        setReplacementModalOrder(null);
        setReplacementSuccessMsg("");
      }, 2000);
    } catch (e) {
      console.error("Replacement request error:", e);
      alert("Failed to register replacement request. Please try again or reach out on WhatsApp.");
    } finally {
      setIsSubmittingReplacement(false);
    }
  };

  const [showAddAddressModal, setShowAddAddressModal] = useState(false);
  const [editingAddressId, setEditingAddressId] = useState<number | null>(null);
  const [newAddressForm, setNewAddressForm] = useState({
    type: "Home",
    name: "",
    street: "",
    district: "",
    city: "",
    state: "",
    pincode: "",
    phone: ""
  });

  // Password Change & Reset & Sign Out Modal State
  const [showChangePasswordModal, setShowChangePasswordModal] = useState(false);
  const [showSignOutConfirmModal, setShowSignOutConfirmModal] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: ""
  });
  const [otpInput, setOtpInput] = useState("");
  const [emailSentSuccess, setEmailSentSuccess] = useState(false);
  const [passwordSuccessMsg, setPasswordSuccessMsg] = useState("");
  const [passwordErrorMsg, setPasswordErrorMsg] = useState("");

  const [isPincodeLoading, setIsPincodeLoading] = useState(false);
  const [pincodeSuccessMsg, setPincodeSuccessMsg] = useState("");

  const PINCODE_MAP: Record<string, { city: string; district: string; state: string }> = {
    "400076": { city: "Powai, Mumbai", district: "Mumbai Suburban", state: "Maharashtra" },
    "500070": { city: "Sarada Nagar", district: "K.V.Rangareddy", state: "Telangana" },
    "400001": { city: "Fort, Mumbai", district: "Mumbai City", state: "Maharashtra" },
    "400050": { city: "Bandra, Mumbai", district: "Mumbai Suburban", state: "Maharashtra" },
    "500001": { city: "Abids", district: "Hyderabad", state: "Telangana" },
    "500032": { city: "Gachibowli", district: "Ranga Reddy", state: "Telangana" },
    "500081": { city: "Hitech City", district: "Ranga Reddy", state: "Telangana" },
    "500085": { city: "Kukatpally", district: "Medchal-Malkajgiri", state: "Telangana" },
    "110001": { city: "Connaught Place", district: "Central Delhi", state: "Delhi" },
    "560001": { city: "MG Road", district: "Bengaluru Urban", state: "Karnataka" },
    "600001": { city: "Parrys", district: "Chennai", state: "Tamil Nadu" },
    "700001": { city: "BBD Bagh", district: "Kolkata", state: "West Bengal" },
    "380001": { city: "Lal Darwaja", district: "Ahmedabad", state: "Gujarat" },
    "411001": { city: "Camp", district: "Pune", state: "Maharashtra" },
    "500049": { city: "Miyapur", district: "Ranga Reddy", state: "Telangana" },
    "500072": { city: "Moosapet", district: "Medchal-Malkajgiri", state: "Telangana" },
  };

  const handlePincodeChange = async (val: string) => {
    const pincode = val.replace(/\D/g, "").slice(0, 6);
    setNewAddressForm(prev => ({ ...prev, pincode }));

    if (pincode.length === 6) {
      if (PINCODE_MAP[pincode]) {
        const info = PINCODE_MAP[pincode];
        setNewAddressForm(prev => ({
          ...prev,
          pincode,
          city: info.city,
          district: info.district,
          state: info.state
        }));
        setPincodeSuccessMsg(`✓ Auto-filled: ${info.city}, ${info.district}, ${info.state}`);
        return;
      }

      setIsPincodeLoading(true);
      setPincodeSuccessMsg("");
      try {
        const res = await fetch(`https://api.postalpincode.in/pincode/${pincode}`);
        const data = await res.json();
        if (data && data[0] && data[0].Status === "Success" && data[0].PostOffice && data[0].PostOffice.length > 0) {
          const po = data[0].PostOffice[0];
          const areaName = po.Name || po.Block || "";
          const distName = po.District || po.Region || "";
          const stName = po.State || po.Circle || "";

          setNewAddressForm(prev => ({
            ...prev,
            pincode,
            city: areaName,
            district: distName,
            state: stName
          }));
          setPincodeSuccessMsg(`✓ Auto-filled: ${areaName}, ${distName}, ${stName}`);
        }
      } catch (err) {
        console.error("Pincode API lookup error:", err);
      } finally {
        setIsPincodeLoading(false);
      }
    } else {
      setPincodeSuccessMsg("");
    }
  };

  const handleDownloadInvoice = (order: any) => {
    const invoiceHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Tax Invoice #${order.id} - PixelloStore</title>
          <meta charset="utf-8" />
          <style>
            @page {
              size: A4 portrait;
              margin: 12mm 15mm;
            }
            * { box-sizing: border-box; }
            body {
              font-family: 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
              padding: 0;
              margin: 0;
              color: #3A2B24;
              background: #ffffff;
              line-height: 1.4;
              font-size: 13px;
            }
            .invoice-card {
              max-w: 800px;
              margin: 0 auto;
              padding: 24px;
              background: #ffffff;
            }
            .top-header {
              display: flex;
              justify-content: space-between;
              align-items: flex-start;
              border-bottom: 2px solid #3A2B24;
              padding-bottom: 16px;
              margin-bottom: 24px;
            }
            .brand-logo {
              display: flex;
              items-center;
              gap: 10px;
            }
            .brand-name {
              font-family: Georgia, serif;
              font-size: 28px;
              font-weight: bold;
              color: #3A2B24;
              letter-spacing: -0.5px;
            }
            .brand-name span { color: #D89A86; }
            .tagline { font-size: 11px; color: #6C5C54; margin-top: 2px; }
            .invoice-badge {
              text-align: right;
            }
            .invoice-title {
              font-size: 22px;
              font-weight: 800;
              color: #D89A86;
              letter-spacing: 1px;
              text-transform: uppercase;
            }
            .inv-meta { font-size: 12px; color: #6C5C54; margin-top: 4px; }
            .inv-meta strong { color: #3A2B24; }

            .details-grid {
              display: grid;
              grid-template-columns: 1fr 1fr;
              gap: 20px;
              margin-bottom: 24px;
            }
            .info-box {
              background: #FFF8F2;
              border: 1px solid #EFE6DD;
              border-radius: 12px;
              padding: 14px 16px;
            }
            .box-title {
              font-size: 10px;
              font-weight: 800;
              text-transform: uppercase;
              letter-spacing: 1px;
              color: #D89A86;
              margin-bottom: 6px;
            }
            .info-name { font-size: 15px; font-weight: 700; color: #3A2B24; margin-bottom: 4px; }
            .info-sub { font-size: 12px; color: #6C5C54; line-height: 1.4; }

            table.invoice-table {
              width: 100%;
              border-collapse: collapse;
              margin-bottom: 24px;
            }
            table.invoice-table th {
              background: #3A2B24;
              color: #ffffff;
              font-size: 11px;
              font-weight: 700;
              text-transform: uppercase;
              letter-spacing: 0.5px;
              padding: 10px 12px;
              text-align: left;
            }
            table.invoice-table td {
              padding: 12px;
              border-bottom: 1px solid #EFE6DD;
              font-size: 13px;
              vertical-align: middle;
            }
            table.invoice-table tr:nth-child(even) td {
              background-color: #FAF6F0;
            }
            .size-pill {
              display: inline-block;
              background: #FFF8F2;
              color: #D89A86;
              border: 1px solid #D89A86;
              border-radius: 20px;
              padding: 3px 10px;
              font-size: 11px;
              font-weight: 700;
              white-space: nowrap;
            }
            .photo-tag {
              font-size: 11px;
              color: #059669;
              font-weight: 600;
              margin-top: 4px;
              display: block;
            }

            .summary-section {
              display: flex;
              justify-content: space-between;
              align-items: flex-start;
              margin-bottom: 30px;
            }
            .paid-stamp {
              border: 2px dashed #059669;
              color: #059669;
              background: #ECFDF5;
              padding: 10px 16px;
              border-radius: 12px;
              font-size: 12px;
              font-weight: 800;
              text-transform: uppercase;
              letter-spacing: 1px;
              display: inline-flex;
              align-items: center;
              gap: 6px;
            }
            .amount-card {
              width: 300px;
              background: #FFF8F2;
              border: 1px solid #EFE6DD;
              border-radius: 12px;
              padding: 14px 16px;
            }
            .amount-row {
              display: flex;
              justify-content: space-between;
              font-size: 12px;
              color: #6C5C54;
              margin-bottom: 6px;
            }
            .total-row {
              display: flex;
              justify-content: space-between;
              font-size: 16px;
              font-weight: 800;
              color: #3A2B24;
              border-top: 2px solid #D89A86;
              padding-top: 8px;
              margin-top: 8px;
            }
            .total-row .highlight { color: #D89A86; }

            .footer-note {
              border-top: 1px solid #EFE6DD;
              padding-top: 16px;
              text-align: center;
              font-size: 11px;
              color: #6C5C54;
              line-height: 1.5;
            }
          </style>
        </head>
        <body>
          <div class="invoice-card">
            <div class="top-header">
              <div style="display: flex; align-items: center; gap: 14px;">
                <div style="height: 48px; width: 48px; border-radius: 50%; overflow: hidden; border: 2px solid #D89A86; background: #ffffff; flex-shrink: 0; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                  <img src="${typeof window !== 'undefined' ? window.location.origin + '/images/pixello_logo.png' : '/images/pixello_logo.png'}" alt="Pixello Logo" style="height: 100%; width: 100%; object-fit: cover;" />
                </div>
                <div>
                  <div class="brand-name">Pixello<span>Store</span></div>
                  <div class="tagline">Every Memory Deserves a Beautiful Frame • GSTIN: 27AAAAA0000A1Z5</div>
                </div>
              </div>
              <div class="invoice-badge">
                <div class="invoice-title">Tax Invoice</div>
                <div class="inv-meta">Invoice ID: <strong>${order.id}</strong></div>
                <div class="inv-meta">Order Date: <strong>${order.date}</strong></div>
              </div>
            </div>

            <div class="details-grid">
              <div class="info-box">
                <div class="box-title">Billed & Shipped To</div>
                <div class="info-name">${profileData.name || "Customer"}</div>
                <div class="info-sub">${order.deliveryAddress || "Flat 402, Sunshine Heights, Central Powai Road, Mumbai - 400076"}</div>
                <div class="info-sub" style="margin-top: 4px;">Phone: <strong>${profileData.phone || "+91 98765 43210"}</strong></div>
              </div>

              <div class="info-box">
                <div class="box-title">Fulfilled By Verified Partner Studio</div>
                <div class="info-name">${order.assignedStudio || "Studio Alpha - Powai Central Branch"}</div>
                <div class="info-sub">Master Craftsman Studio • Express Delivery</div>
                <div class="info-sub" style="margin-top: 4px; color: #059669; font-weight: 700;">Status: ${order.status}</div>
              </div>
            </div>

            <table class="invoice-table">
              <thead>
                <tr>
                  <th style="width: 7%; text-align: center;">S.No</th>
                  <th style="width: 35%;">Item Description</th>
                  <th style="width: 27%;">Variant / Style</th>
                  <th style="width: 7%; text-align: center;">Qty</th>
                  <th style="width: 11%; text-align: right;">Unit Price</th>
                  <th style="width: 13%; text-align: right;">Amount</th>
                </tr>
              </thead>
              <tbody>
                ${order.items.map((item: any, idx: number) => `
                  <tr>
                    <td style="text-align: center; font-weight: bold; color: #3A2B24;">${idx + 1}</td>
                    <td>
                      <strong style="color: #3A2B24;">${item.name}</strong>
                      ${item.photos && item.photos.length > 0 ? `<span class="photo-tag">📷 Attached: ${item.photos.join(", ")}</span>` : ""}
                    </td>
                    <td><span class="size-pill">${item.size}</span></td>
                    <td style="text-align: center; font-weight: 600;">${item.quantity}</td>
                    <td style="text-align: right;">₹${item.price}</td>
                    <td style="text-align: right; font-weight: 700; color: #3A2B24;">₹${(item.price * item.quantity).toFixed(2)}</td>
                  </tr>
                `).join("")}
              </tbody>
            </table>

            <div class="summary-section">
              <div style="display: flex; flex-direction: column; gap: 8px;">
                <div class="paid-stamp">
                  ✓ PAID (${order.paymentMethod || "COD / ONLINE"})
                </div>
                ${order.referralCode ? `
                  <div style="background: #ECFDF5; border: 1px solid #A7F3D0; border-radius: 10px; padding: 10px 14px; font-size: 11px; color: #065F46; max-width: 320px;">
                    <div style="font-weight: 800; text-transform: uppercase; letter-spacing: 0.5px; color: #047857; margin-bottom: 3px;">
                      🎟️ AMBASSADOR REFERRAL CODE APPLIED
                    </div>
                    <div>Code Used: <strong style="color: #065F46; font-family: monospace; font-size: 12px;">${order.referralCode}</strong></div>
                    <div>Ambassador Partner: <strong>${order.ambassadorName || (order.referralCode === "SAIROHAN10" ? "Sai Rohan" : "Campus Ambassador")}</strong></div>
                    ${order.referralDiscount ? `<div style="margin-top: 2px; font-weight: bold; color: #047857;">Referral Discount Applied: -₹${Number(order.referralDiscount).toFixed(2)}</div>` : ""}
                  </div>
                ` : ""}
              </div>

              <div class="amount-card">
                <div class="amount-row"><span>Items Subtotal:</span> <span>₹${((order.subtotal || order.totalAmount + (order.referralDiscount || 0))).toFixed(2)}</span></div>
                ${order.referralCode ? `<div class="amount-row" style="color: #047857; font-weight: bold;"><span>Referral Discount (${order.referralCode}):</span> <span>-₹${Number(order.referralDiscount || 0).toFixed(2)}</span></div>` : ""}
                <div class="amount-row"><span>Shipping Fee:</span> <span style="color: #059669; font-weight: bold;">${order.deliveryFee ? `₹${Number(order.deliveryFee).toFixed(2)}` : 'FREE'}</span></div>
                <div class="amount-row"><span>GST (0% Policy):</span> <span style="color: #059669; font-weight: bold;">₹0.00</span></div>
                <div class="total-row"><span>Total Amount Paid:</span> <span class="highlight">₹${order.totalAmount.toFixed(2)}</span></div>
              </div>
            </div>

            <div class="footer-note">
              Thank you for ordering with PixelloStore! Every memory deserves a beautiful frame.<br/>
              Need assistance? WhatsApp Support: <strong>+91 8074589949</strong> • Email: <strong>support@pixellostore.com</strong>
            </div>
          </div>

          <script>
            window.onload = function() {
              setTimeout(function() {
                window.print();
              }, 300);
            };
          </script>
        </body>
      </html>
    `;

    const printWindow = window.open("", "_blank");
    if (printWindow) {
      printWindow.document.write(invoiceHtml);
      printWindow.document.close();
    }
  };

  useEffect(() => {
    const syncProfileData = () => {
      if (typeof window !== "undefined") {
        const isLoggedOut = localStorage.getItem("pixello_logged_out") === "true";
        const savedUser = localStorage.getItem("pixello_user");
        let mobileKey = "default";

        if (isLoggedOut || !savedUser) {
          setIsLoggedIn(false);
          setIsCheckingAuth(false);
          setProfileData({
            name: "",
            email: "",
            phone: "",
            college: ""
          });
          setAddresses([]);
          return;
        }

        try {
          const parsed = JSON.parse(savedUser);
          if (!parsed || parsed.isLoggedIn === false) {
            setIsLoggedIn(false);
            setIsCheckingAuth(false);
            return;
          }

          const cleanMob = (parsed.mobile || "").replace(/\D/g, "").slice(-10);
          mobileKey = cleanMob || "default";

          const profileByKey = cleanMob ? localStorage.getItem(`pixello_profile_${cleanMob}`) : null;
          const parsedProf = profileByKey ? JSON.parse(profileByKey) : null;
          const finalData = { ...(parsedProf || {}), ...parsed };

          const resolvedName = (parsed.name && !parsed.name.startsWith("New Customer"))
            ? parsed.name
            : (parsedProf && parsedProf.name && !parsedProf.name.startsWith("New Customer") ? parsedProf.name : (finalData.name || "Customer"));

          setIsLoggedIn(true);
          setIsCheckingAuth(false);
          setProfileData({
            name: resolvedName,
            email: finalData.email || "",
            phone: finalData.mobile ? (finalData.mobile.startsWith("+91") ? finalData.mobile : `+91 ${finalData.mobile}`) : (finalData.phone || ""),
            college: finalData.college || ""
          });
        } catch (e) {
          console.error(e);
          setIsLoggedIn(false);
          setIsCheckingAuth(false);
        }

        const savedAddresses = mobileKey !== "default" ? localStorage.getItem(`pixello_addresses_${mobileKey}`) : null;
        if (savedAddresses) {
          try {
            const parsedAddrs = JSON.parse(savedAddresses);
            if (Array.isArray(parsedAddrs) && parsedAddrs.length > 0) {
              setAddresses(parsedAddrs);
              return;
            }
          } catch (e) {
            console.error(e);
          }
        }

        setAddresses([]);
      }
    };

    syncProfileData();
    window.addEventListener("auth_change", syncProfileData);
    window.addEventListener("storage", syncProfileData);
    return () => {
      window.removeEventListener("auth_change", syncProfileData);
      window.removeEventListener("storage", syncProfileData);
    };
  }, []);

  const handleProfileSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (typeof window !== "undefined") {
      const cleanMobile = (profileData.phone || "").replace(/\D/g, "").slice(-10);
      const savedUserStr = localStorage.getItem("pixello_user");
      let userObj = savedUserStr ? JSON.parse(savedUserStr) : {};
      
      const updatedUser = {
        ...userObj,
        name: profileData.name,
        email: profileData.email,
        mobile: cleanMobile,
        phone: profileData.phone,
        college: profileData.college,
        isLoggedIn: true
      };

      localStorage.setItem("pixello_user", JSON.stringify(updatedUser));
      if (cleanMobile) {
        localStorage.setItem(`pixello_profile_${cleanMobile}`, JSON.stringify(updatedUser));

        try {
          const existingStr = localStorage.getItem("pixello_registered_customers");
          let list: any[] = existingStr ? JSON.parse(existingStr) : [];
          const index = list.findIndex(c => (c.mobile || "").replace(/\D/g, "").slice(-10) === cleanMobile);
          const newEntry = {
            name: profileData.name,
            mobile: cleanMobile,
            phone: profileData.phone,
            email: profileData.email,
            college: profileData.college,
            status: "Active"
          };
          if (index >= 0) {
            list[index] = { ...list[index], ...newEntry };
          } else {
            list.unshift(newEntry);
          }
          localStorage.setItem("pixello_registered_customers", JSON.stringify(list));
        } catch (e) {
          console.error(e);
        }

        // Persist to backend database
        try {
          await fetch("/api/customers", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              name: profileData.name,
              email: profileData.email,
              mobile: cleanMobile,
              phone: profileData.phone,
              college: profileData.college,
            }),
          });
        } catch (err) {
          console.error("Failed to save profile to database:", err);
        }
      }
      window.dispatchEvent(new Event("auth_change"));
      window.dispatchEvent(new Event("storage"));
    }
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  const removeFromWishlist = (id: string) => {
    toggleWishlist({ id });
  };

  const TABS = [
    { id: "profile", label: "My Profile", icon: User },
    { id: "orders", label: "Order History", icon: Package },
    { id: "addresses", label: "Addresses", icon: MapPin },
    { id: "wishlist", label: "Wishlist", icon: Heart },
    { id: "settings", label: "Settings", icon: Settings },
  ];

  if (!isCheckingAuth && !isLoggedIn) {
    return (
      <div suppressHydrationWarning className="container mx-auto px-4 md:px-6 py-16 text-center max-w-md">
        <div className="bg-white border border-[#EFE6DD] rounded-3xl p-8 sm:p-10 shadow-xs">
          <div className="h-16 w-16 rounded-full bg-[#FFF8F2] border border-[#EFE6DD] flex items-center justify-center mx-auto mb-4 text-[#D89A86]">
            <User className="h-8 w-8" />
          </div>
          <h2 className="font-serif-brand text-2xl font-bold text-[#3A2B24] mb-2">Customer Account</h2>
          <p className="text-xs text-[#6C5C54] mb-6 leading-relaxed">
            Please sign in with your mobile number to view your order history, saved addresses, and profile details.
          </p>
          <Button 
            onClick={() => startTransitionTo("/login?redirect=/profile")}
            className="btn-pixello-primary w-full rounded-full font-bold h-12 text-sm shadow-xs cursor-pointer"
          >
            Sign In with Mobile Number
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div suppressHydrationWarning className="container mx-auto px-4 md:px-6 py-8">
      <h1 className="text-3xl font-bold tracking-tight mb-8">My Account</h1>

      <div className="flex flex-col md:flex-row gap-8">
        {/* Sidebar Navigation */}
        <div className="w-full md:w-72 flex-shrink-0">
          <div className="bg-white border border-[#EFE6DD] rounded-3xl p-5 mb-6 shadow-xs relative overflow-hidden group">
            <div className="flex items-center gap-3.5 min-w-0">
              <div className="h-11 w-11 rounded-full bg-[#FFF8F2] border border-[#EFE6DD] flex items-center justify-center flex-shrink-0 text-[#D89A86]">
                <User className="h-5 w-5 text-[#D89A86]" />
              </div>

              <div className="min-w-0 flex-1">
                <h3 className="font-serif-brand font-bold text-base text-[#3A2B24] truncate leading-tight mb-0.5">
                  {profileData.name || "Customer"}
                </h3>
                <p className="text-xs text-[#6C5C54] truncate font-medium">
                  {profileData.email || profileData.phone || "No email added"}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white border border-[#EFE6DD] rounded-3xl p-3 shadow-xs">
            <nav className="flex flex-col space-y-1.5">
              {TABS.map(tab => (
                <Button 
                  key={tab.id}
                  variant={activeTab === tab.id ? "default" : "ghost"}
                  className={cn(
                    "justify-start w-full font-bold rounded-2xl h-12 transition-all text-sm px-4",
                    activeTab === tab.id 
                      ? "bg-[#D89A86] hover:bg-[#c48773] text-white shadow-xs" 
                      : "text-[#3A2B24] hover:bg-[#FFF8F2] hover:text-[#D89A86]"
                  )}
                  onClick={() => setActiveTab(tab.id)}
                >
                  <tab.icon className={cn("h-5 w-5 mr-3.5", activeTab === tab.id ? "text-white" : "text-[#D89A86]")} />
                  <span className="text-sm font-bold">{tab.label}</span>
                </Button>
              ))}
              <div className="my-1 border-t border-[#EFE6DD] pt-1.5">
                <Button 
                  variant="ghost" 
                  className="justify-start w-full text-rose-600 hover:text-rose-700 hover:bg-rose-50 rounded-2xl h-12 text-sm font-bold px-4"
                  onClick={() => setShowSignOutConfirmModal(true)}
                >
                  <LogOut className="h-5 w-5 mr-3.5 text-rose-500" />
                  <span className="text-sm font-bold">Sign Out</span>
                </Button>
              </div>
            </nav>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1">
          {/* TAB 1: PROFILE */}
          {activeTab === "profile" && (
            <Card className="border border-[#EFE6DD] bg-white rounded-3xl p-6 sm:p-8 md:p-10 shadow-xs relative overflow-hidden">
              <CardHeader className="p-0 mb-6 pb-5 border-b border-[#EFE6DD]">
                <CardTitle className="font-serif-brand text-2xl font-bold text-[#3A2B24] flex items-center gap-2.5">
                  <User className="h-6 w-6 text-[#D89A86]" /> Personal Information
                </CardTitle>
                <CardDescription className="text-xs text-[#6C5C54] font-medium mt-1">
                  Update your personal account details and college information.
                </CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                <form onSubmit={handleProfileSave} className="flex flex-col gap-5 max-w-xl">
                  {savedSuccess && (
                    <div className="p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl text-xs font-bold flex items-center gap-2">
                      <Check className="h-4 w-4 text-emerald-600" /> Profile updated successfully!
                    </div>
                  )}
                  <div>
                    <label className="text-xs font-bold text-[#3A2B24] uppercase tracking-wider mb-2 block">Full Name</label>
                    <Input 
                      value={profileData.name} 
                      onChange={e => setProfileData({ ...profileData, name: e.target.value })} 
                      className="rounded-2xl border-[#EFE6DD] bg-[#FFF8F2]/60 text-sm font-medium text-[#3A2B24] h-12 px-4 focus-visible:ring-[#D89A86]"
                      placeholder="Enter your full name"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-[#3A2B24] uppercase tracking-wider mb-2 block">Email Address</label>
                    <Input 
                      type="email" 
                      value={profileData.email} 
                      onChange={e => setProfileData({ ...profileData, email: e.target.value })} 
                      className="rounded-2xl border-[#EFE6DD] bg-[#FFF8F2]/60 text-sm font-medium text-[#3A2B24] h-12 px-4 focus-visible:ring-[#D89A86]"
                      placeholder="Enter your email address"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-[#3A2B24] uppercase tracking-wider mb-2 block">Phone Number</label>
                    <Input 
                      value={profileData.phone} 
                      onChange={e => setProfileData({ ...profileData, phone: e.target.value })} 
                      className="rounded-2xl border-[#EFE6DD] bg-[#FFF8F2]/60 text-sm font-medium text-[#3A2B24] h-12 px-4 focus-visible:ring-[#D89A86]"
                      placeholder="Enter 10-digit phone number"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-[#3A2B24] uppercase tracking-wider mb-2 block">College / Campus</label>
                    <Input 
                      value={profileData.college} 
                      onChange={e => setProfileData({ ...profileData, college: e.target.value })} 
                      className="rounded-2xl border-[#EFE6DD] bg-[#FFF8F2]/60 text-sm font-medium text-[#3A2B24] h-12 px-4 focus-visible:ring-[#D89A86]"
                      placeholder="Enter your college or campus name"
                    />
                  </div>
                  <Button type="submit" className="btn-pixello-primary text-xs font-bold rounded-full h-11 px-8 shadow-xs w-fit mt-2">
                    Save Changes
                  </Button>
                </form>
              </CardContent>
            </Card>
          )}

          {/* TAB 2: ORDERS */}
          {activeTab === "orders" && (() => {
            const currentUserMobile = (profileData.phone || "").replace(/\D/g, "").slice(-10);
            const currentUserName = (profileData.name || "").trim().toLowerCase();

            const customerOrders = orders.filter(order => {
              if (!currentUserMobile && !currentUserName) return false;
              const orderMobile = ((order as any).customerMobile || order.customerPhone || "").replace(/\D/g, "").slice(-10);
              const orderName = (order.customerName || "").trim().toLowerCase();

              if (orderMobile && currentUserMobile && orderMobile === currentUserMobile) {
                return true;
              }
              if (currentUserName && currentUserName !== "customer" && orderName && (orderName.includes(currentUserName) || currentUserName.includes(orderName))) {
                return true;
              }
              return false;
            });

            return (
              <div className="flex flex-col gap-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <h2 className="font-serif-brand text-2xl font-bold text-[#3A2B24]">
                      Order History ({customerOrders.length})
                    </h2>
                    <p className="text-xs text-[#6C5C54] mt-0.5">
                      Live sync connected with Pixello Store Management Suite.
                    </p>
                  </div>
                  <span className="text-[11px] font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-full flex items-center gap-1.5 shadow-2xs self-start sm:self-auto">
                    <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" /> Live Real-time Sync
                  </span>
                </div>
                
                {customerOrders.length === 0 ? (
                  <Card className="border border-[#EFE6DD] bg-white rounded-3xl p-10 text-center shadow-xs">
                    <Package className="h-12 w-12 text-[#D89A86] mx-auto mb-3 opacity-60" />
                    <h3 className="font-serif-brand text-xl font-bold text-[#3A2B24]">No Orders Placed Yet</h3>
                    <p className="text-xs text-[#6C5C54] mt-1 max-w-sm mx-auto font-medium">
                      Explore our custom photo frames, polaroids, and acrylic lamps to place your first order.
                    </p>
                    <Link href="/products" className="inline-block mt-5">
                      <Button className="btn-pixello-primary px-6 rounded-full text-xs font-bold shadow-xs">
                        Browse & Order Products
                      </Button>
                    </Link>
                  </Card>
                ) : (
                  customerOrders.map((order, orderIdx) => {
                    const orderTimestamp = order.createdAt || new Date(order.date).getTime();
                    const hoursElapsed = (Date.now() - orderTimestamp) / (1000 * 60 * 60);
                    const cleanStatus = (order.status || "").trim().toUpperCase();
                    const isCancelled = cleanStatus === "CANCELLED" || cleanStatus === "CANCELED";
                    const isDelivered = cleanStatus === "DELIVERED";
                    const isPrintingStarted = cleanStatus === "PRINTING" || cleanStatus === "PACKED" || cleanStatus === "DELIVERY PICKED UP" || cleanStatus === "OUT FOR DELIVERY" || cleanStatus === "DELIVERED" || cleanStatus === "QUALITY_CHECK" || cleanStatus === "PICKED_UP";
                    const isCancelEligible = !isCancelled && !isDelivered && !isPrintingStarted && hoursElapsed < 24;
                    const isReplacementEligible = isDelivered && order.status !== "Replacement Requested" && hoursElapsed < 24;
                    const hoursRemaining = Math.max(0, Math.floor(24 - hoursElapsed));
                    const minsRemaining = Math.max(0, Math.floor((24 - hoursElapsed) * 60 % 60));

                    return (
                      <div key={`${order.id}-${orderIdx}`} className="border border-[#EFE6DD] bg-white rounded-3xl shadow-xs overflow-hidden">
                        <div className="bg-[#FFF8F2] border-b border-[#EFE6DD] p-4 sm:p-5 flex flex-wrap justify-between items-center gap-4 text-sm rounded-t-3xl">
                          <div className="flex flex-wrap gap-6 sm:gap-8">
                            <div>
                              <div className="text-[#6C5C54] text-xs">Order Placed</div>
                              <div className="font-semibold text-[#3A2B24]">{order.date}</div>
                            </div>
                            <div>
                              <div className="text-[#6C5C54] text-xs">Total Amount</div>
                              <div className="font-extrabold text-[#D89A86]">₹{order.totalAmount.toFixed(2)}</div>
                            </div>
                            <div>
                              <div className="text-[#6C5C54] text-xs">Order ID</div>
                              <div className="font-bold text-[#3A2B24]">{order.id}</div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Button 
                              variant="outline" 
                              size="sm" 
                              className="rounded-full text-xs border-[#EFE6DD] hover:bg-white flex items-center gap-1.5 font-semibold text-[#3A2B24]" 
                              onClick={() => setOrderDetailsModal(order)}
                            >
                              <FileText className="h-3.5 w-3.5 text-[#D89A86]" /> Order Details
                            </Button>
                            <Button 
                              variant="outline" 
                              size="sm" 
                              className="rounded-full text-xs border-[#EFE6DD] hover:bg-white flex items-center gap-1.5 font-semibold text-[#3A2B24]" 
                              onClick={() => handleDownloadInvoice(order)}
                            >
                              <Download className="h-3.5 w-3.5 text-[#D89A86]" /> Invoice
                            </Button>
                          </div>
                        </div>

                        <CardContent className="p-6">
                          <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center mb-6 gap-4 border-b border-[#EFE6DD] pb-5">
                            {/* Left: Status & Ambassador Info */}
                            <div className="space-y-1.5 min-w-0">
                              <div className="flex flex-wrap items-center gap-2">
                                <Badge className={cn(
                                  "border-none px-3 py-1 rounded-full text-xs font-bold shadow-2xs",
                                  isDelivered ? "bg-emerald-100 text-emerald-900 border border-emerald-300" : (isCancelled ? "bg-rose-100 text-rose-900 border border-rose-300" : (isPrintingStarted ? "bg-amber-100 text-amber-900 border border-amber-300" : "bg-[#FFF8F2] text-[#D89A86] border border-[#D89A86]/30"))
                                )}>
                                  {isCancelled ? "Cancelled" : order.status}
                                </Badge>

                                {order.referralCode && (
                                  <span className="text-[11px] font-bold text-emerald-900 bg-emerald-50 border border-emerald-200 px-3 py-0.5 rounded-full flex items-center gap-1.5 shadow-2xs">
                                    🎟️ Ambassador: <span className="font-mono">{order.referralCode}</span> {order.referralDiscount ? `(-₹${order.referralDiscount.toFixed(2)})` : ""}
                                  </span>
                                )}

                                {(() => {
                                  const isReplacementOrder = order.status === "Replacement Requested" || (order.history && order.history.some((h: any) => h.status === "Replacement Requested" || (h.note && h.note.includes("Replacement"))));
                                  if (isReplacementOrder) {
                                    return (
                                      <span className="text-[11px] font-bold text-purple-900 bg-purple-100 border border-purple-300 px-3 py-0.5 rounded-full flex items-center gap-1.5 shadow-2xs">
                                        <RefreshCw className="h-3 w-3 text-purple-700 animate-spin" style={{ animationDuration: "3s" }} />
                                        <span>Replacement In Progress</span>
                                      </span>
                                    );
                                  }
                                  return null;
                                })()}
                              </div>

                              <h3 className="font-bold text-base text-[#3A2B24]">
                                Pixello Handcrafted Express Delivery • Doorstep Tracking
                              </h3>
                              <p className="text-xs text-[#6C5C54]">Ship to: {order.deliveryAddress}</p>
                            </div>

                            {/* Right: Consolidated Action Toolbar */}
                            <div className="flex items-center gap-2.5 flex-wrap w-full xl:w-auto justify-start xl:justify-end">
                              {isCancelled ? (
                                <span className="text-[11px] font-bold text-rose-800 bg-rose-50 border border-rose-200 px-3.5 py-1.5 rounded-full flex items-center gap-1.5 shadow-2xs">
                                  ❌ Order Cancelled (Refund Initiated)
                                </span>
                              ) : (
                                <>
                                  {isPrintingStarted && !isDelivered && (
                                    <span className="text-[11px] font-bold text-amber-900 bg-amber-50 border border-amber-200 px-3 py-1.5 rounded-full flex items-center gap-1.5 shadow-2xs">
                                      🖨️ Printing Started (Non-Cancellable)
                                    </span>
                                  )}

                                  {isCancelEligible && (
                                    <Button 
                                      size="sm" 
                                      variant="outline"
                                      className="border-rose-300 text-rose-700 bg-rose-50/60 hover:bg-rose-100 hover:border-rose-400 font-bold text-xs rounded-full h-10 px-4 cursor-pointer flex items-center gap-1.5 shadow-2xs"
                                      onClick={() => setCancelOrderModal(order)}
                                    >
                                      <span>Cancel Order ({hoursRemaining}h left)</span>
                                    </Button>
                                  )}

                                  {isReplacementEligible && (
                                    <Button 
                                      size="sm" 
                                      variant="outline"
                                      className="border-purple-300 text-purple-950 bg-purple-50 hover:bg-purple-100 hover:border-purple-400 font-bold text-xs rounded-full h-10 px-4.5 cursor-pointer shadow-2xs flex items-center gap-2 transition-all"
                                      onClick={() => {
                                        setReplacementSuccessMsg("");
                                        setReplacementModalOrder(order);
                                      }}
                                    >
                                      <RefreshCw className="h-3.5 w-3.5 text-purple-700" />
                                      <span>Request Replacement</span>
                                      <span className="text-[10px] bg-purple-200/80 text-purple-900 px-1.5 py-0.2 rounded-full font-black">
                                        {hoursRemaining}h left
                                      </span>
                                    </Button>
                                  )}

                                  <Button 
                                    size="sm" 
                                    className="btn-pixello-primary text-xs font-bold px-5 h-10 rounded-full flex items-center gap-1.5 shadow-xs"
                                    onClick={() => setTrackingOrder(order.id)}
                                  >
                                    <Truck className="h-3.5 w-3.5 text-white" />
                                    <span>Track Live Order</span>
                                  </Button>
                                </>
                              )}
                            </div>
                          </div>
                          
                          <div className="flex flex-col gap-4">
                            {order.items.map((item, idx) => {
                              const customPhotoUrl = (item.photos && item.photos.length > 0 && (item.photos[0].startsWith("data:") || item.photos[0].startsWith("http") || item.photos[0].startsWith("/")))
                                ? item.photos[0]
                                : ((item.image && (item.image.startsWith("data:") || item.image.startsWith("http"))) ? item.image : item.image);

                              const photoLabel = (item.photos && item.photos.length > 0)
                                ? (item.photos[0].startsWith("data:") || item.photos[0].startsWith("http") ? "Uploaded Custom Photo" : item.photos[0])
                                : "Custom Photo Attached";

                              const targetPhotoCount = Math.max(item.photos ? item.photos.length : 0, item.quantity || 1);
                              const photoList = Array.from({ length: targetPhotoCount }, (_, i) => {
                                if (item.photos && item.photos[i]) {
                                  return item.photos[i];
                                }
                                return `Uploaded Photo #${i + 1}`;
                              });

                              const reviewKey = `${order.id}_${item.name}`;
                              const existingReview = userReviews[reviewKey];

                              return (
                                <div key={idx} className="p-4 rounded-2xl bg-[#FFF8F2]/60 border border-[#EFE6DD] hover:border-[#D89A86]/40 transition-all flex flex-col gap-3">
                                  <div className="flex gap-4 items-center justify-between">
                                    <div className="flex gap-3.5 items-center min-w-0">
                                      <div 
                                        className="h-14 w-14 rounded-2xl bg-white border border-[#EFE6DD] overflow-hidden flex-shrink-0 cursor-pointer relative group shadow-2xs"
                                        onClick={() => setPhotoPreviewModal({
                                          isOpen: true,
                                          photoUrl: customPhotoUrl,
                                          photoName: photoLabel,
                                          itemName: item.name,
                                          orderId: order.id
                                        })}
                                      >
                                        <img src={customPhotoUrl} alt={item.name} className="h-full w-full object-cover group-hover:scale-105 transition-transform" />
                                        <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity text-white">
                                          <Eye className="h-4 w-4" />
                                        </div>
                                      </div>
                                      <div className="min-w-0">
                                        <h4 className="font-bold text-base text-[#3A2B24] truncate">{item.name}</h4>
                                        <p className="text-xs text-[#6C5C54] mt-0.5">Size: <span className="font-semibold text-[#D89A86]">{item.size}</span> • Qty: {item.quantity}</p>
                                      </div>
                                    </div>
                                    <div className="font-extrabold text-base text-[#D89A86] whitespace-nowrap">
                                      ₹{(item.price * item.quantity).toFixed(2)}
                                    </div>
                                  </div>

                                  {/* Photo Badges Container with Generous Padding */}
                                  <div className="p-3 bg-emerald-50/70 border border-emerald-200/80 rounded-2xl flex flex-col gap-2">
                                    <span className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-950">Customer Uploaded Photos ({photoList.length}):</span>
                                    <div className="flex flex-wrap gap-2">
                                      {photoList.map((pName, pI) => {
                                        const pUrl = (pName.startsWith("data:") || pName.startsWith("http") || pName.startsWith("/")) ? pName : customPhotoUrl;
                                        const displayName = (pName.startsWith("data:") || pName.startsWith("http")) ? `Uploaded Photo #${pI + 1}` : pName;
                                        return (
                                          <button
                                            key={pI}
                                            type="button"
                                            onClick={() => setPhotoPreviewModal({
                                              isOpen: true,
                                              photoUrl: pUrl,
                                              photoName: displayName,
                                              itemName: item.name,
                                              orderId: order.id
                                            })}
                                            className="bg-white hover:bg-emerald-100/80 border border-emerald-300 text-emerald-950 px-3 py-1.5 rounded-full font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer shadow-2xs hover:scale-102"
                                          >
                                            <Eye className="h-3.5 w-3.5 text-emerald-600" />
                                            <span>Photo #{pI + 1}</span>
                                          </button>
                                        );
                                      })}
                                    </div>
                                  </div>

                                  {!existingReview && (isDelivered || cleanStatus === "DELIVERED" || isPrintingStarted) && (
                                    <div className="p-3 bg-white border border-amber-200/80 rounded-2xl flex items-center justify-between gap-3 shadow-2xs">
                                      <div className="flex items-center gap-2.5">
                                        <div className="h-8 w-8 rounded-full bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600 flex-shrink-0">
                                          <Star className="h-4 w-4 fill-amber-400 text-amber-500" />
                                        </div>
                                        <div>
                                          <span className="text-xs font-bold text-[#3A2B24] block">How is your {item.name}?</span>
                                          <span className="text-[10px] text-[#6C5C54] font-medium block">Share your rating & feedback directly with our studio team</span>
                                        </div>
                                      </div>
                                      <Button
                                        size="sm"
                                        className="bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs rounded-full h-8 px-4 flex items-center gap-1.5 shadow-xs cursor-pointer flex-shrink-0"
                                        onClick={() => openReviewModal(order.id, item)}
                                      >
                                        <Star className="h-3.5 w-3.5 fill-white text-white" />
                                        <span>Rate Product</span>
                                      </Button>
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        </CardContent>
                      </div>
                    );
                  })
              )}
            </div>
            );
          })()}

          {/* TAB 3: ADDRESSES */}
          {activeTab === "addresses" && (
            <div className="flex flex-col gap-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold">Saved Addresses</h2>
                  <p className="text-sm text-muted-foreground mt-1">Manage delivery locations for quick ordering.</p>
                </div>
                <Button 
                  size="sm" 
                  className="btn-pixello-primary px-5 rounded-full text-xs font-semibold"
                  onClick={() => {
                    setEditingAddressId(null);
                    setPincodeSuccessMsg("");
                    setNewAddressForm({
                      type: "Home",
                      name: profileData.name || "",
                      street: "",
                      city: "",
                      district: "",
                      state: "",
                      pincode: "",
                      phone: profileData.phone || ""
                    });
                    setShowAddAddressModal(true);
                  }}
                >
                  <Plus className="h-4 w-4 mr-1.5" /> Add Address
                </Button>
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                {addresses.length === 0 ? (
                  <Card className="border border-[#EFE6DD] bg-white rounded-3xl p-8 text-center sm:col-span-2 shadow-xs">
                    <MapPin className="h-10 w-10 text-[#D89A86] mx-auto mb-3 opacity-60" />
                    <h3 className="font-bold text-base text-[#3A2B24]">No Saved Addresses Yet</h3>
                    <p className="text-xs text-[#6C5C54] mt-1 max-w-sm mx-auto font-medium">
                      Add your delivery address so local partner studios can ship your customized photo frames directly to your doorstep.
                    </p>
                    <Button 
                      size="sm" 
                      className="btn-pixello-primary px-6 rounded-full text-xs font-semibold mt-4"
                      onClick={() => {
                        setEditingAddressId(null);
                        setPincodeSuccessMsg("");
                        setNewAddressForm({
                          type: "Home",
                          name: profileData.name || "",
                          street: "",
                          city: "",
                          district: "",
                          state: "",
                          pincode: "",
                          phone: profileData.phone || ""
                        });
                        setShowAddAddressModal(true);
                      }}
                    >
                      <Plus className="h-4 w-4 mr-1.5" /> Add Delivery Address
                    </Button>
                  </Card>
                ) : (
                  addresses.map(addr => (
                    <Card key={addr.id} className="border border-[#EFE6DD] bg-white rounded-3xl shadow-xs relative overflow-hidden">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between mb-3">
                        <Badge variant={addr.isDefault ? "default" : "outline"} className={cn("rounded-full px-3 py-0.5 text-xs font-bold", addr.isDefault ? "bg-[#D89A86] text-white" : "border-[#EFE6DD] text-[#3A2B24]")}>
                          {addr.type} {addr.isDefault ? "(Default)" : ""}
                        </Badge>
                        <div className="flex items-center gap-1">
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="h-8 text-xs font-semibold rounded-full border-[#EFE6DD] text-[#3A2B24] hover:bg-[#FFF8F2]"
                            onClick={() => {
                              setEditingAddressId(addr.id);
                              setPincodeSuccessMsg("");
                              const parts = addr.city.split("-");
                              const cityPart = parts[0]?.trim() || "";
                              const pincodePart = parts[1]?.trim() || "400076";
                              const citySubparts = cityPart.split(",");
                              setNewAddressForm({
                                type: addr.type,
                                name: addr.name,
                                street: addr.street,
                                city: citySubparts[0]?.trim() || cityPart,
                                district: citySubparts[1]?.trim() || "",
                                state: citySubparts[2]?.trim() || "",
                                pincode: pincodePart,
                                phone: addr.phone
                              });
                              setShowAddAddressModal(true);
                            }}
                          >
                            <Edit2 className="h-3.5 w-3.5 mr-1 text-[#D89A86]" /> Edit
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="h-8 text-xs font-bold text-red-600 hover:text-red-700 hover:bg-red-50 rounded-full"
                            onClick={() => {
                                if (confirm(`Remove address "${addr.street}"?`)) {
                                  persistAddresses(addresses.filter(a => a.id !== addr.id));
                                }
                            }}
                          >
                            Remove
                          </Button>
                        </div>
                      </div>
                      <h4 className="font-serif-brand font-bold text-base text-[#3A2B24]">{addr.name}</h4>
                      <p className="text-xs text-[#6C5C54] mt-1 font-medium">{addr.street}</p>
                      <p className="text-xs text-[#6C5C54] font-medium">{addr.city}</p>
                      <p className="text-xs font-bold text-[#3A2B24] mt-3">Phone: {addr.phone}</p>
                    </CardContent>
                  </Card>
                )))}
              </div>
            </div>
          )}

          {/* TAB 4: WISHLIST */}
          {activeTab === "wishlist" && (
            <div className="flex flex-col gap-6">
              <div>
                <h2 className="font-serif-brand text-2xl font-bold text-[#3A2B24]">My Wishlist ({wishlist.length})</h2>
                <p className="text-xs text-[#6C5C54] mt-1">Saved items you love.</p>
              </div>

              {wishlist.length === 0 ? (
                <Card className="border border-[#EFE6DD] bg-white rounded-3xl p-8 text-center">
                  <p className="text-[#6C5C54] mb-4">Your wishlist is empty. Save your favorite frames & gifts here!</p>
                  <Link href="/products" className="btn-pixello-primary px-6 h-10 inline-flex items-center justify-center text-sm">
                    Explore Products
                  </Link>
                </Card>
              ) : (
                <div className="grid sm:grid-cols-2 gap-4">
                  {wishlist.map((rawItem, idx) => {
                    const itemId = typeof rawItem === "string" ? rawItem : (rawItem?.id || `PRD-0${idx + 1}`);
                    const itemName = rawItem?.name || "Premium Custom Frame";
                    const itemCat = rawItem?.category || "Frames";
                    const itemPrice = rawItem?.price !== undefined ? rawItem.price : 499;
                    const itemImg = rawItem?.image || "/images/wooden_frame_main.png";

                    return (
                      <Card key={itemId} className="border border-[#EFE6DD] bg-white rounded-3xl flex flex-row items-center p-4 sm:p-5 gap-4 shadow-xs hover:shadow-md transition-all">
                        <div className="h-20 w-20 sm:h-24 sm:w-24 rounded-2xl bg-[#FFF8F2] border border-[#EFE6DD] overflow-hidden flex-shrink-0">
                          <img src={itemImg} alt={itemName} className="h-full w-full object-cover" />
                        </div>

                        <div className="flex-1 min-w-0">
                          <Badge className="bg-[#FFF8F2] text-[#D89A86] border border-[#D89A86]/20 text-[10px] font-bold mb-1.5 px-2.5 py-0.5 rounded-full">
                            {itemCat}
                          </Badge>
                          <h4 className="font-bold text-sm sm:text-base text-[#3A2B24] truncate">{itemName}</h4>
                          <p className="text-sm font-extrabold text-[#3A2B24] mt-1">₹{itemPrice}</p>
                        </div>

                        <div className="flex flex-col gap-2 flex-shrink-0">
                          <Link href={`/product/${itemId}`}>
                            <Button className="btn-pixello-primary px-4 h-9 text-xs rounded-full font-bold shadow-xs">
                              Customize
                            </Button>
                          </Link>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="text-xs font-bold text-red-600 hover:text-red-700 hover:bg-red-50 rounded-full h-8"
                            onClick={() => toggleWishlist(rawItem)}
                          >
                            Remove
                          </Button>
                        </div>
                      </Card>
                    );
                  })}
                </div>
              )}
            </div>
          )}



          {/* TAB 6: SETTINGS */}
          {activeTab === "settings" && (
            <Card className="border border-[#EFE6DD] bg-white rounded-3xl p-6 sm:p-8 md:p-10 shadow-xs relative overflow-hidden">
              <CardHeader className="p-0 mb-6 pb-5 border-b border-[#EFE6DD]">
                <CardTitle className="font-serif-brand text-2xl font-bold text-[#3A2B24] flex items-center gap-2.5">
                  <Settings className="h-6 w-6 text-[#D89A86]" /> Account Settings
                </CardTitle>
                <CardDescription className="text-xs text-[#6C5C54] font-medium mt-1">
                  Manage security and notification preferences.
                </CardDescription>
              </CardHeader>
              <CardContent className="p-0 flex flex-col gap-6">
                <div>
                  <h4 className="font-serif-brand font-bold text-base text-[#3A2B24] mb-3 flex items-center gap-2">
                    <Bell className="h-4 w-4 text-[#D89A86]" /> Notification Preferences
                  </h4>
                  <div className="flex flex-col gap-3">
                    <label className="flex items-center gap-3 text-xs font-semibold text-[#6C5C54] cursor-pointer">
                      <input type="checkbox" defaultChecked className="rounded border-[#EFE6DD] text-[#D89A86] focus:ring-[#D89A86] h-4 w-4" />
                      SMS Order Updates & Tracking Link
                    </label>
                    <label className="flex items-center gap-3 text-xs font-semibold text-[#6C5C54] cursor-pointer">
                      <input type="checkbox" defaultChecked className="rounded border-[#EFE6DD] text-[#D89A86] focus:ring-[#D89A86] h-4 w-4" />
                      WhatsApp Order Delivery Notifications
                    </label>
                    <label className="flex items-center gap-3 text-xs font-semibold text-[#6C5C54] cursor-pointer">
                      <input type="checkbox" className="rounded border-[#EFE6DD] text-[#D89A86] focus:ring-[#D89A86] h-4 w-4" />
                      Promotional Emails & Discount Coupons
                    </label>
                  </div>
                </div>

                <Separator className="bg-[#EFE6DD]" />

                <div>
                  <h4 className="font-serif-brand font-bold text-base text-[#3A2B24] mb-3 flex items-center gap-2">
                    <Key className="h-4 w-4 text-[#D89A86]" /> Security
                  </h4>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="rounded-full border-[#EFE6DD] text-[#3A2B24] font-bold text-xs h-10 px-5 hover:bg-[#FFF8F2]"
                    onClick={() => {
                      setPasswordSuccessMsg("");
                      setPasswordErrorMsg("");
                      setEmailSentSuccess(false);
                      setPasswordForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
                      setShowChangePasswordModal(true);
                    }}
                  >
                    <Key className="h-3.5 w-3.5 mr-1.5 text-[#D89A86]" /> Change Password & Security
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* DYNAMIC 5-STAGE TRACK ORDER MODAL */}
      {trackingOrder && (
        (() => {
          const trackOrderObj = orders.find(o => o.id === trackingOrder);
          const rawStatus = (trackOrderObj?.status || "").toUpperCase();
          const isReplacementTrack = rawStatus.includes("REPLACEMENT") || (trackOrderObj?.history && trackOrderObj.history.some((h: any) => h.status === "Replacement Requested" || (h.note && h.note.includes("Replacement"))));

          // Calculate current active stage index:
          // 0: Placed
          // 1: Studio Accepted / Designing
          // 2: Printing / Framing
          // 3: Quality Check / Packed / Ready for Delivery
          // 4: Out for Delivery
          // 5: Delivered
          let currentStepIdx = 0;
          if (rawStatus === "DELIVERED") {
            currentStepIdx = 5;
          } else if (rawStatus === "OUT_FOR_DELIVERY" || rawStatus === "OUT FOR DELIVERY" || rawStatus === "PICKED_UP" || rawStatus === "DELIVERY PICKED UP") {
            currentStepIdx = 4;
          } else if (rawStatus === "QUALITY_CHECK" || rawStatus === "PACKED" || rawStatus === "READY_FOR_PICKUP" || rawStatus === "READY FOR DELIVERY") {
            currentStepIdx = 3;
          } else if (rawStatus === "PRINTING" || rawStatus === "FRAMING") {
            currentStepIdx = 2;
          } else if (rawStatus === "ACCEPTED_BY_STUDIO" || rawStatus === "STUDIO ACCEPTED" || rawStatus === "DESIGNING") {
            currentStepIdx = 1;
          } else {
            currentStepIdx = 0;
          }

          const progressPercent = currentStepIdx === 0 ? 15 : (currentStepIdx === 1 ? 35 : (currentStepIdx === 2 ? 55 : (currentStepIdx === 3 ? 75 : (currentStepIdx === 4 ? 90 : 100))));

          const steps = isReplacementTrack ? [
            {
              title: "🔄 Replacement Requested & Approved",
              desc: "Replacement request registered and approved by Studio.",
              time: "Stage 1",
            },
            {
              title: "🖨️ Replacement Production & Framing",
              desc: "Re-printing high-resolution photo & solid wood frame assembly.",
              time: "Stage 2",
            },
            {
              title: "📦 Quality Check & Express Re-Packaging",
              desc: "Quality inspection & protective double-bubble wrap seal.",
              time: "Stage 3",
            },
            {
              title: "🚚 Replacement Out for Doorstep Handover",
              desc: `Rider: ${trackOrderObj?.deliveryPartner || "Ramesh K. (+91 99887 76655)"} • Direct local bike dispatch.`,
              time: "Stage 4",
            },
            {
              title: "✅ Replacement Delivered Successfully",
              desc: "Fresh replacement delivered to your doorstep. Enjoy!",
              time: "Completed",
            }
          ] : [
            {
              title: "Order Placed & Payment Verified",
              desc: trackOrderObj?.assignedStudio ? `Assigned to verified studio: ${trackOrderObj.assignedStudio}` : "Order confirmed & payment verified.",
              time: "Stage 1",
            },
            {
              title: "Studio Accepted & Layout Design",
              desc: "Studio verified photo resolution & aspect ratio cropping.",
              time: "Stage 2",
            },
            {
              title: "Master Lab Printing & Frame Assembly",
              desc: "High-definition archival photo printing on anti-glare paper & solid wood frame assembly.",
              time: "Stage 3",
            },
            {
              title: "Quality Check Passed & Gift Wrapped",
              desc: "Quality inspected, double bubble-wrapped & sealed for delivery.",
              time: "Stage 4",
            },
            {
              title: "Out for Express Doorstep Delivery",
              desc: `Rider: ${trackOrderObj?.deliveryPartner || "Ramesh K. (+91 99887 76655)"} • Direct local bike dispatch.`,
              time: "Stage 5",
            },
            {
              title: "Delivered Successfully",
              desc: "Handed over to customer. Enjoy your Pixello memories!",
              time: "Completed",
            }
          ];

          return (
            <div 
              className="fixed inset-0 top-0 left-0 w-screen h-screen z-[9999] bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in"
              onClick={() => setTrackingOrder(null)}
            >
              <div 
                className="bg-white border border-[#EFE6DD] rounded-3xl p-6 md:p-8 max-w-lg w-full shadow-2xl relative animate-in zoom-in-95 my-auto overflow-hidden text-left"
                onClick={e => e.stopPropagation()}
              >
                <button 
                  onClick={() => setTrackingOrder(null)}
                  className="absolute top-5 right-5 h-9 w-9 rounded-full bg-[#FFF8F2] hover:bg-[#F2C8B5]/30 text-[#3A2B24] flex items-center justify-center font-bold text-base transition-colors"
                >
                  ✕
                </button>

                <div className="flex items-center gap-2 mb-2 flex-wrap">
                  <Badge className="bg-[#D89A86] text-white border-none font-bold text-[10px] uppercase tracking-wider px-2.5 py-0.5 rounded-full">
                    {isReplacementTrack ? "🔄 Replacement Express Tracker" : "🚀 Hyper-Local Express Tracker"}
                  </Badge>
                  <Badge className="bg-emerald-100 text-emerald-800 border-none font-bold text-[10px] px-2.5 py-0.5 rounded-full flex items-center gap-1">
                    <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" /> LIVE STATUS: {trackOrderObj?.status || "Processing"}
                  </Badge>
                </div>

                <h3 className="font-serif-brand text-2xl font-bold text-[#3A2B24] mb-1">
                  Tracking Order #{trackingOrder}
                </h3>
                <p className="text-xs text-[#6C5C54] mb-5 font-medium flex items-center gap-1.5">
                  <Clock className="h-3.5 w-3.5 text-[#D89A86]" /> Status: <strong className="text-emerald-700 font-bold">{trackOrderObj?.status || "Processing"} ⚡</strong>
                </p>

                {/* Studio Progress Bar */}
                <div className="bg-[#FFF8F2] border border-[#EFE6DD] rounded-2xl p-4 mb-6">
                  <div className="flex justify-between items-center text-xs font-bold text-[#3A2B24] mb-2">
                    <span>{isReplacementTrack ? "Replacement Progress" : "Fulfillment Progress"}</span>
                    <span className="text-[#D89A86] font-extrabold">{progressPercent}% Completed</span>
                  </div>
                  <div className="w-full bg-[#EFE6DD] rounded-full h-2 overflow-hidden">
                    <div className="bg-[#D89A86] h-full rounded-full transition-all duration-500" style={{ width: `${progressPercent}%` }} />
                  </div>
                </div>

                {/* Multi-Step Timeline */}
                <div className="relative pl-6 space-y-6 before:absolute before:left-3 before:top-2 before:bottom-2 before:w-0.5 before:bg-[#EFE6DD] mb-6">
                  {steps.map((stObj, sIdx) => {
                    const isDone = sIdx < currentStepIdx || (currentStepIdx === steps.length - 1 && sIdx === steps.length - 1);
                    const isActive = sIdx === currentStepIdx && currentStepIdx < steps.length - 1;
                    const isPending = sIdx > currentStepIdx;

                    return (
                      <div key={sIdx} className={`relative transition-all ${isPending ? "opacity-45" : "opacity-100"}`}>
                        <div className={`absolute -left-[30px] top-0 h-6 w-6 rounded-full flex items-center justify-center shadow-xs text-white ${
                          isDone ? "bg-emerald-500" : (isActive ? "bg-[#D89A86] animate-pulse" : "bg-[#EFE6DD] text-[#6C5C54]")
                        }`}>
                          {isDone ? <Check className="h-3.5 w-3.5 stroke-[3]" /> : (isActive ? <Sparkles className="h-3.5 w-3.5" /> : <span className="text-[10px] font-bold">{sIdx + 1}</span>)}
                        </div>
                        <div className="flex justify-between items-start">
                          <h4 className={`font-bold text-sm ${isActive ? "text-[#D89A86]" : (isDone ? "text-[#3A2B24]" : "text-[#6C5C54]")}`}>
                            {stObj.title}
                          </h4>
                          {isActive && (
                            <span className="text-[10px] text-white bg-[#D89A86] font-bold px-2 py-0.5 rounded-full shadow-2xs">ACTIVE NOW</span>
                          )}
                          {isDone && (
                            <span className="text-[10px] text-emerald-800 bg-emerald-100 font-bold px-2 py-0.5 rounded-full">DONE</span>
                          )}
                        </div>
                        <p className="text-xs text-[#6C5C54] mt-0.5 font-medium">{stObj.desc}</p>
                      </div>
                    );
                  })}
                </div>

                {/* Actions */}
                <div className="flex flex-col sm:flex-row gap-3 pt-2">
                  <a 
                    href="https://wa.me/918074589949"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 btn-pixello-primary text-xs font-bold h-11 rounded-full flex items-center justify-center gap-2 shadow-xs"
                  >
                    <MessageSquare className="h-4 w-4" /> Chat with Studio on WhatsApp
                  </a>
                  <Button 
                    variant="outline" 
                    className="rounded-full border-[#EFE6DD] text-[#3A2B24] font-semibold text-xs h-11 px-6 hover:bg-[#FFF8F2]"
                    onClick={() => setTrackingOrder(null)}
                  >
                    Close
                  </Button>
                </div>
              </div>
            </div>
          );
        })()
      )}

      {/* PRODUCT REVIEW & RATING MODAL (NEW LUXURY MODEL) */}
      {reviewModalItem && (
        <div 
          className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in"
          onClick={() => !isSubmittingReview && setReviewModalItem(null)}
        >
          <div 
            className="bg-white border border-[#EFE6DD] rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl relative animate-in zoom-in-95 max-h-[92vh] overflow-y-auto"
            onClick={e => e.stopPropagation()}
          >
            <button 
              onClick={() => !isSubmittingReview && setReviewModalItem(null)}
              className="absolute top-5 right-5 h-9 w-9 rounded-full bg-[#FFF8F2] hover:bg-[#F2C8B5]/30 text-[#3A2B24] flex items-center justify-center font-bold text-base transition-colors cursor-pointer z-10"
            >
              ✕
            </button>

            {/* Header Medallion */}
            <div className="flex items-center gap-2 mb-2">
              <Badge className="bg-amber-100 text-amber-950 border border-amber-300 px-3 py-0.5 rounded-full text-xs font-bold flex items-center gap-1.5 w-fit">
                <Star className="h-3.5 w-3.5 fill-amber-500 text-amber-500" />
                <span>Verified Buyer Feedback</span>
              </Badge>
              <span className="text-xs text-[#6C5C54] font-semibold">Order #{reviewModalItem.orderId}</span>
            </div>

            <h3 className="font-serif-brand text-2xl sm:text-3xl font-extrabold text-[#3A2B24] tracking-tight">
              Rate Your Experience
            </h3>
            <p className="text-xs text-[#6C5C54] mb-5 font-medium">
              Your feedback is sent directly to the Pixello Admin management dashboard.
            </p>

            {/* Product Item Preview Banner */}
            <div className="p-3.5 bg-[#FFF8F2] border border-[#EFE6DD] rounded-2xl flex items-center gap-3.5 mb-5 shadow-2xs">
              <div className="h-13 w-13 rounded-xl bg-white border border-[#EFE6DD] overflow-hidden flex-shrink-0">
                <img 
                  src={reviewModalItem.item.image || "/images/wooden_frame_main.png"} 
                  alt={reviewModalItem.item.name} 
                  className="h-full w-full object-cover" 
                />
              </div>
              <div className="min-w-0">
                <h4 className="font-bold text-sm text-[#3A2B24] truncate">{reviewModalItem.item.name}</h4>
                <p className="text-xs text-[#6C5C54]">Spec: <span className="font-semibold text-[#D89A86]">{reviewModalItem.item.size}</span></p>
              </div>
            </div>

            {reviewSuccessMsg ? (
              <div className="p-5 bg-emerald-50 border border-emerald-200 rounded-2xl text-emerald-900 text-xs font-bold flex items-center gap-3 animate-in fade-in">
                <Check className="h-6 w-6 text-emerald-600 flex-shrink-0" />
                <div>
                  <h5 className="font-extrabold text-sm text-emerald-950">Review Received!</h5>
                  <p className="font-medium mt-0.5">{reviewSuccessMsg}</p>
                </div>
              </div>
            ) : (
              <form onSubmit={handleReviewSubmit} className="flex flex-col gap-4.5">
                {/* 1. Mood Rating Selector */}
                <div>
                  <label className="text-xs font-bold text-[#3A2B24] mb-2 block">
                    1. Overall Quality Rating:
                  </label>
                  <div className="grid grid-cols-5 gap-1.5">
                    {[
                      { star: 1, emoji: "😞", label: "1★ Poor" },
                      { star: 2, emoji: "😕", label: "2★ Fair" },
                      { star: 3, emoji: "🙂", label: "3★ Good" },
                      { star: 4, emoji: "😊", label: "4★ Great" },
                      { star: 5, emoji: "😍", label: "5★ Loved!" }
                    ].map((m) => {
                      const isSelected = reviewRating === m.star;
                      return (
                        <button
                          key={m.star}
                          type="button"
                          onClick={() => setReviewRating(m.star)}
                          className={cn(
                            "flex flex-col items-center justify-center p-2.5 rounded-2xl border transition-all cursor-pointer",
                            isSelected 
                              ? "bg-amber-100 border-amber-400 text-amber-950 font-bold shadow-2xs scale-102"
                              : "bg-[#FFF8F2]/70 border-[#EFE6DD] text-[#6C5C54] hover:bg-white"
                          )}
                        >
                          <span className="text-xl sm:text-2xl mb-1">{m.emoji}</span>
                          <span className="text-[10px] font-extrabold">{m.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* 2. Craftsmanship Highlight Tags */}
                <div>
                  <label className="text-xs font-bold text-[#3A2B24] mb-1.5 block">
                    2. What did you love most?
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {[
                      "🎨 Vivid HD Clarity",
                      "🪵 Solid Pine Frame",
                      "📦 Safe Box Packaging",
                      "✨ Smooth Matte Finish",
                      "⚡ Express Delivery",
                      "💎 Great Value"
                    ].map((tag) => {
                      const isSelected = reviewSelectedTags.includes(tag);
                      return (
                        <button
                          key={tag}
                          type="button"
                          onClick={() => {
                            if (isSelected) {
                              setReviewSelectedTags(reviewSelectedTags.filter((t) => t !== tag));
                            } else {
                              setReviewSelectedTags([...reviewSelectedTags, tag]);
                            }
                          }}
                          className={cn(
                            "text-xs px-3 py-1.5 rounded-full font-semibold border transition-all cursor-pointer",
                            isSelected
                              ? "bg-amber-500 border-amber-600 text-white shadow-2xs font-bold"
                              : "bg-[#FFF8F2] border-[#EFE6DD] text-[#6C5C54] hover:bg-white"
                          )}
                        >
                          {isSelected ? "✓ " : "+ "}{tag}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* 3. Review Headline (Optional) */}
                <div>
                  <label className="text-xs font-bold text-[#3A2B24] mb-1 block">
                    3. Headline / Summary (Optional):
                  </label>
                  <Input
                    type="text"
                    value={reviewTitle}
                    onChange={(e) => setReviewTitle(e.target.value)}
                    placeholder="e.g., Exceeded expectations, incredible frame craftsmanship!"
                    className="rounded-xl border-[#EFE6DD] text-xs font-medium bg-[#FFF8F2]/30"
                  />
                </div>

                {/* 4. Detailed Experience (Optional) */}
                <div>
                  <label className="text-xs font-bold text-[#3A2B24] mb-1 block">
                    4. Share Your Experience (Optional):
                  </label>
                  <textarea
                    value={reviewComment}
                    onChange={(e) => setReviewComment(e.target.value)}
                    placeholder="Tell us what you liked about the print clarity, colors, wooden frame finish, or doorstep packaging..."
                    rows={3}
                    className="w-full rounded-xl border border-[#EFE6DD] p-2.5 text-xs font-medium text-[#3A2B24] focus:ring-[#D89A86] focus:border-[#D89A86] outline-none bg-[#FFF8F2]/30"
                  />
                </div>

                {/* 5. Optional Customer Photo Attachment (Optional) */}
                <div>
                  <label className="text-xs font-bold text-[#3A2B24] mb-1 block">
                    5. Attach Photo of Product (Optional):
                  </label>
                  {reviewPhotoUrl ? (
                    <div className="relative w-24 h-24 rounded-2xl overflow-hidden border-2 border-amber-300 shadow-2xs">
                      <img src={reviewPhotoUrl} alt="Review" className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={() => setReviewPhotoUrl(null)}
                        className="absolute top-1 right-1 bg-black/70 hover:bg-black text-white rounded-full p-1 text-[10px] cursor-pointer"
                      >
                        ✕
                      </button>
                    </div>
                  ) : (
                    <label className="flex items-center gap-2.5 p-3 bg-[#FFF8F2] border border-dashed border-[#EFE6DD] rounded-2xl cursor-pointer hover:bg-amber-50/60 transition-all text-xs text-[#6C5C54] font-medium">
                      <Upload className="h-4 w-4 text-[#D89A86]" />
                      <span>Click to upload picture of your frame on the wall / desk</span>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          if (e.target.files && e.target.files[0]) {
                            const reader = new FileReader();
                            reader.onload = (ev) => {
                              if (ev.target?.result) setReviewPhotoUrl(ev.target.result as string);
                            };
                            reader.readAsDataURL(e.target.files[0]);
                          }
                        }}
                      />
                    </label>
                  )}
                </div>

                {/* Submit Buttons */}
                <div className="flex items-center gap-2 pt-2">
                  <Button
                    type="button"
                    variant="outline"
                    className="flex-1 rounded-full border-[#EFE6DD] text-xs font-bold h-11 cursor-pointer"
                    onClick={() => setReviewModalItem(null)}
                    disabled={isSubmittingReview}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={isSubmittingReview}
                    className="flex-1 bg-amber-500 hover:bg-amber-600 text-white rounded-full text-xs font-bold h-11 flex items-center justify-center gap-2 shadow-md cursor-pointer"
                  >
                    {isSubmittingReview ? (
                      <>
                        <RefreshCw className="h-4 w-4 animate-spin" />
                        <span>Submitting to Admin...</span>
                      </>
                    ) : (
                      <>
                        <Star className="h-4 w-4 fill-white" />
                        <span>Submit Review</span>
                      </>
                    )}
                  </Button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* ENHANCED REPLACEMENT REQUEST MODAL DIALOG */}
      {replacementModalOrder && (
        <div 
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in"
          onClick={() => !isSubmittingReplacement && setReplacementModalOrder(null)}
        >
          <div 
            className="bg-white border border-[#EFE6DD] rounded-3xl p-6 sm:p-7 max-w-lg w-full shadow-2xl relative animate-in zoom-in-95 max-h-[90vh] overflow-y-auto"
            onClick={e => e.stopPropagation()}
          >
            <button 
              onClick={() => !isSubmittingReplacement && setReplacementModalOrder(null)}
              className="absolute top-4 right-4 h-9 w-9 rounded-full bg-[#FFF8F2] hover:bg-[#F2C8B5]/30 text-[#3A2B24] flex items-center justify-center font-bold text-base transition-colors cursor-pointer"
            >
              ✕
            </button>

            <Badge className="bg-purple-100 text-purple-900 border border-purple-300 mb-2 px-3 py-0.5 rounded-full text-xs font-bold flex items-center gap-1.5 w-fit">
              <RefreshCw className="h-3.5 w-3.5 text-purple-700" />
              <span>24-Hour Free Replacement Guarantee • Express Redelivery</span>
            </Badge>

            <h3 className="font-serif-brand text-2xl font-bold text-[#3A2B24] mb-1">
              Request Order Replacement
            </h3>
            <p className="text-xs text-[#6C5C54] mb-4 font-medium">
              Order #{replacementModalOrder.id} • Please select the exact issue and explain what needs to be fixed so our partner studio crafts your replacement with 100% precision.
            </p>

            {replacementSuccessMsg ? (
              <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-emerald-800 text-xs font-bold flex items-center gap-2 animate-in fade-in">
                <Check className="h-5 w-5 text-emerald-600 flex-shrink-0" />
                <span>{replacementSuccessMsg}</span>
              </div>
            ) : (
              <form onSubmit={handleRequestReplacementSubmit} className="flex flex-col gap-4">
                {/* Categorized Reason Selector */}
                <div>
                  <label className="text-xs font-bold text-[#3A2B24] mb-1.5 block">
                    1. Select Specific Issue Category:
                  </label>
                  <div className="flex flex-col gap-2">
                    {[
                      {
                        label: "Broken glass / cracked wooden frame in transit",
                        desc: "Physical damage to the glass panel or wooden frame during courier transit."
                      },
                      {
                        label: "Print quality issue (Blurry, low resolution, or color defect)",
                        desc: "Print appears pixelated, overly dark, or colors do not match original photo."
                      },
                      {
                        label: "Wrong frame size or frame color delivered",
                        desc: "Received a different frame color or dimensions than what was ordered."
                      },
                      {
                        label: "Photo cut off or misaligned during framing",
                        desc: "Key subject or faces in the photo are cropped out or mounted unevenly."
                      },
                      {
                        label: "Defective hardware / missing wall hook or loose stand",
                        desc: "Tabletop easel stand or hanging hook is missing, loose, or broken."
                      },
                      {
                        label: "Defective gift item (Magic Mug, LED Lamp, Keepsake)",
                        desc: "Heat reveal not functioning, LED base not lighting up, or item chipped."
                      },
                      {
                        label: "Other manufacturing defect",
                        desc: "Any other defect with your customized order."
                      }
                    ].map((item) => (
                      <label 
                        key={item.label} 
                        className={cn(
                          "flex items-start gap-3 p-3 rounded-2xl border text-xs cursor-pointer transition-all",
                          replacementReason === item.label 
                            ? "bg-purple-50 border-purple-400 text-purple-950 font-bold shadow-2xs" 
                            : "bg-[#FFF8F2]/60 border-[#EFE6DD] text-[#6C5C54] hover:bg-[#FFF8F2]"
                        )}
                      >
                        <input 
                          type="radio" 
                          name="replacementReason" 
                          checked={replacementReason === item.label} 
                          onChange={() => setReplacementReason(item.label)}
                          className="mt-0.5 text-purple-600 focus:ring-purple-500" 
                        />
                        <div>
                          <span className="block font-bold">{item.label}</span>
                          <span className="block text-[11px] font-normal text-[#6C5C54] mt-0.5">{item.desc}</span>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Exact Issue Description */}
                <div>
                  <label className="text-xs font-bold text-[#3A2B24] mb-1 block">
                    2. Describe the Exact Issue in Detail (Required):
                  </label>
                  <textarea 
                    value={replacementExactIssue}
                    onChange={e => setReplacementExactIssue(e.target.value)}
                    placeholder="e.g., Glass cracked on top-right corner, colors are overly dark, wrong black frame received instead of brown..."
                    rows={3}
                    className="w-full rounded-xl border border-[#EFE6DD] p-2.5 text-xs font-medium text-[#3A2B24] focus:ring-[#D89A86] focus:border-[#D89A86] outline-none"
                    required
                  />
                </div>

                {/* Upload Defect Photo */}
                <div>
                  <label className="text-xs font-bold text-[#3A2B24] mb-1 block">
                    3. Attach Photo of the Defect / Damaged Item (Recommended):
                  </label>
                  {replacementPhotoUrl ? (
                    <div className="relative w-28 h-28 rounded-xl overflow-hidden border border-purple-300">
                      <img src={replacementPhotoUrl} alt="Defect" className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={() => setReplacementPhotoUrl(null)}
                        className="absolute top-1 right-1 bg-black/70 text-white rounded-full p-1 text-[10px] cursor-pointer"
                      >
                        ✕
                      </button>
                    </div>
                  ) : (
                    <label className="flex items-center gap-2 p-3 bg-[#FFF8F2] border border-dashed border-[#EFE6DD] rounded-xl cursor-pointer hover:bg-purple-50/50 transition-all text-xs text-[#6C5C54] font-medium">
                      <Upload className="h-4 w-4 text-purple-600" />
                      <span>Click to upload photo of the broken/damaged item</span>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          if (e.target.files && e.target.files[0]) {
                            const reader = new FileReader();
                            reader.onload = (ev) => {
                              if (ev.target?.result) setReplacementPhotoUrl(ev.target.result as string);
                            };
                            reader.readAsDataURL(e.target.files[0]);
                          }
                        }}
                      />
                    </label>
                  )}
                </div>

                {/* Preferred Resolution */}
                <div>
                  <label className="text-xs font-bold text-[#3A2B24] mb-1.5 block">
                    4. Preferred Resolution:
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {[
                      "Re-make and ship fresh replacement (100% Free)",
                      "Change frame color / size for replacement",
                      "Re-print with new higher-res photo"
                    ].map((res) => (
                      <button
                        key={res}
                        type="button"
                        onClick={() => setReplacementResolution(res)}
                        className={cn(
                          "text-left p-2.5 rounded-xl border text-xs transition-all cursor-pointer",
                          replacementResolution === res
                            ? "bg-purple-100 border-purple-400 font-bold text-purple-950"
                            : "bg-[#FFF8F2] border-[#EFE6DD] text-[#6C5C54] hover:bg-white"
                        )}
                      >
                        {replacementResolution === res ? "✓ " : "• "}{res}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Submit Buttons */}
                <div className="flex items-center gap-2 pt-2">
                  <Button
                    type="button"
                    variant="outline"
                    className="flex-1 rounded-full border-[#EFE6DD] text-xs font-bold h-11 cursor-pointer"
                    onClick={() => setReplacementModalOrder(null)}
                    disabled={isSubmittingReplacement}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={isSubmittingReplacement}
                    className="flex-1 bg-purple-700 hover:bg-purple-800 text-white rounded-full text-xs font-bold h-11 flex items-center justify-center gap-2 shadow-md cursor-pointer"
                  >
                    {isSubmittingReplacement ? (
                      <>
                        <RefreshCw className="h-4 w-4 animate-spin" />
                        <span>Submitting Request...</span>
                      </>
                    ) : (
                      <>
                        <RefreshCw className="h-4 w-4" />
                        <span>Confirm Replacement Request</span>
                      </>
                    )}
                  </Button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Add Address Modal Dialog */}
      {showAddAddressModal && (
        <div 
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in"
          onClick={() => setShowAddAddressModal(false)}
        >
          <div 
            className="bg-white border border-[#EFE6DD] rounded-3xl p-6 max-w-md w-full shadow-2xl relative animate-in zoom-in-95"
            onClick={e => e.stopPropagation()}
          >
            <button 
              onClick={() => setShowAddAddressModal(false)}
              className="absolute top-4 right-4 h-9 w-9 rounded-full bg-[#FFF8F2] hover:bg-[#F2C8B5]/30 text-[#3A2B24] flex items-center justify-center font-bold text-base transition-colors"
            >
              ✕
            </button>

            <Badge className="bg-[#FFF8F2] text-[#D89A86] border border-[#D89A86]/30 mb-2 px-3 py-0.5 rounded-full text-xs font-bold">
              {editingAddressId ? "Edit Location" : "New Delivery Location"}
            </Badge>

            <h3 className="font-serif-brand text-2xl font-bold text-[#3A2B24] mb-1">
              {editingAddressId ? "Update Delivery Address" : "Add Delivery Address"}
            </h3>
            <p className="text-xs text-[#6C5C54] mb-5 font-medium">
              {editingAddressId ? "Update address details for express local studio delivery." : "Save a new address for express local studio delivery."}
            </p>

            <form 
              onSubmit={(e) => {
                e.preventDefault();
                if (!newAddressForm.street.trim()) {
                  alert("Please enter street address!");
                  return;
                }

                const fullLocationStr = `${newAddressForm.city}${newAddressForm.district ? ", " + newAddressForm.district : ""}${newAddressForm.state ? ", " + newAddressForm.state : ""} - ${newAddressForm.pincode}`;

                if (editingAddressId !== null) {
                  // Update existing address
                  const updatedAddrs = addresses.map(a => a.id === editingAddressId ? {
                    ...a,
                    type: newAddressForm.type,
                    name: newAddressForm.name,
                    street: newAddressForm.street,
                    city: fullLocationStr,
                    phone: newAddressForm.phone
                  } : a);
                  persistAddresses(updatedAddrs);
                } else {
                  // Add new address
                  const updatedAddrs = [
                    ...addresses,
                    {
                      id: Date.now(),
                      type: newAddressForm.type,
                      isDefault: addresses.length === 0,
                      name: newAddressForm.name,
                      street: newAddressForm.street,
                      city: fullLocationStr,
                      phone: newAddressForm.phone
                    }
                  ];
                  persistAddresses(updatedAddrs);
                }

                setShowAddAddressModal(false);
                setEditingAddressId(null);
                setNewAddressForm({
                  type: "Home",
                  name: "",
                  street: "",
                  district: "",
                  city: "",
                  state: "",
                  pincode: "",
                  phone: ""
                });
              }}
              className="flex flex-col gap-4"
            >
              <div>
                <label className="text-xs font-bold text-[#3A2B24] mb-1.5 block">Address Label / Type</label>
                <div className="grid grid-cols-3 gap-2">
                  {["Home", "Work", "Campus Hostel"].map(t => (
                    <Button
                      key={t}
                      type="button"
                      variant={newAddressForm.type === t ? "default" : "outline"}
                      className={cn(
                        "rounded-full h-9 text-xs font-semibold transition-all",
                        newAddressForm.type === t ? "bg-[#D89A86] hover:bg-[#c48773] text-white border-[#D89A86]" : "border-[#EFE6DD] text-[#3A2B24] hover:bg-[#FFF8F2]"
                      )}
                      onClick={() => setNewAddressForm({ ...newAddressForm, type: t })}
                    >
                      {t}
                    </Button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-[#3A2B24] mb-1 block">Recipient Name</label>
                <Input 
                  value={newAddressForm.name}
                  onChange={e => setNewAddressForm({ ...newAddressForm, name: e.target.value })}
                  placeholder="Full Name"
                  className="rounded-xl border-[#EFE6DD] text-xs font-medium"
                  required
                />
              </div>

              <div>
                <label className="text-xs font-bold text-[#3A2B24] mb-1 block">Flat / House / Street Address</label>
                <Input 
                  value={newAddressForm.street}
                  onChange={e => setNewAddressForm({ ...newAddressForm, street: e.target.value })}
                  placeholder="e.g. Room 204, Hostel 14, Central Powai Road"
                  className="rounded-xl border-[#EFE6DD] text-xs font-medium"
                  required
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-bold text-[#3A2B24]">Pincode (6-digit)</label>
                  {isPincodeLoading && <span className="text-[10px] text-[#D89A86] font-bold animate-pulse">Searching Postal API...</span>}
                </div>
                <Input 
                  value={newAddressForm.pincode}
                  onChange={e => handlePincodeChange(e.target.value)}
                  placeholder="e.g. 400076"
                  maxLength={6}
                  className="rounded-xl border-[#EFE6DD] text-xs font-bold tracking-wider"
                  required
                />
              </div>

              {pincodeSuccessMsg && (
                <div className="text-[11px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-xl px-3 py-2 flex items-center gap-1.5 animate-in fade-in">
                  <Check className="h-3.5 w-3.5 text-emerald-600 flex-shrink-0" />
                  <span>{pincodeSuccessMsg}</span>
                </div>
              )}

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="text-xs font-bold text-[#3A2B24] mb-1 block">City / Area</label>
                  <Input 
                    value={newAddressForm.city}
                    onChange={e => setNewAddressForm({ ...newAddressForm, city: e.target.value })}
                    placeholder="City"
                    className="rounded-xl border-[#EFE6DD] text-xs font-medium bg-[#FFF8F2]/60"
                    required
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-[#3A2B24] mb-1 block">District</label>
                  <Input 
                    value={newAddressForm.district}
                    onChange={e => setNewAddressForm({ ...newAddressForm, district: e.target.value })}
                    placeholder="District"
                    className="rounded-xl border-[#EFE6DD] text-xs font-medium bg-[#FFF8F2]/60"
                    required
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-[#3A2B24] mb-1 block">State</label>
                  <Input 
                    value={newAddressForm.state}
                    onChange={e => setNewAddressForm({ ...newAddressForm, state: e.target.value })}
                    placeholder="State"
                    className="rounded-xl border-[#EFE6DD] text-xs font-medium bg-[#FFF8F2]/60"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-[#3A2B24] mb-1 block">Contact Phone Number</label>
                <Input 
                  value={newAddressForm.phone}
                  onChange={e => setNewAddressForm({ ...newAddressForm, phone: e.target.value })}
                  className="rounded-xl border-[#EFE6DD] text-xs font-medium"
                  required
                />
              </div>

              <div className="flex gap-3 mt-3">
                <Button 
                  type="button"
                  variant="outline" 
                  className="flex-1 rounded-full border-[#EFE6DD] text-xs font-semibold"
                  onClick={() => setShowAddAddressModal(false)}
                >
                  Cancel
                </Button>
                <Button 
                  type="submit"
                  className="flex-1 rounded-full btn-pixello-primary text-xs font-bold"
                >
                  Save Address
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CHANGE & RESET PASSWORD MODAL */}
      {showChangePasswordModal && (
        <div 
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in"
          onClick={() => setShowChangePasswordModal(false)}
        >
          <div 
            className="bg-white border border-[#EFE6DD] rounded-3xl p-6 max-w-md w-full shadow-2xl relative animate-in zoom-in-95"
            onClick={e => e.stopPropagation()}
          >
            <button 
              onClick={() => setShowChangePasswordModal(false)}
              className="absolute top-4 right-4 h-9 w-9 rounded-full bg-[#FFF8F2] hover:bg-[#F2C8B5]/30 text-[#3A2B24] flex items-center justify-center font-bold text-base transition-colors"
            >
              ✕
            </button>

            <Badge className="bg-[#FFF8F2] text-[#D89A86] border border-[#D89A86]/30 mb-2 px-3 py-0.5 rounded-full text-xs font-bold">
              Account Security
            </Badge>

            <h3 className="font-serif-brand text-2xl font-bold text-[#3A2B24] mb-1">
              Change Password
            </h3>
            <p className="text-xs text-[#6C5C54] mb-4 font-medium">
              Update your account password directly or request a verification reset code for <strong className="text-[#3A2B24]">{profileData.email}</strong>.
            </p>

            {emailSentSuccess && (
              <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl text-xs font-semibold flex flex-col gap-1 animate-in fade-in">
                <div className="flex items-center gap-1.5 font-bold">
                  <Check className="h-4 w-4 text-emerald-600 flex-shrink-0" />
                  <span>Password Reset Email Sent!</span>
                </div>
                <p className="text-[11px] text-emerald-700 font-normal">
                  A verification code and reset link have been dispatched to <strong>{profileData.email}</strong>. (Simulated OTP: <strong>807458</strong>)
                </p>
              </div>
            )}

            {passwordSuccessMsg && (
              <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl text-xs font-bold flex items-center gap-2 animate-in fade-in">
                <Check className="h-4 w-4 text-emerald-600" />
                <span>{passwordSuccessMsg}</span>
              </div>
            )}

            {passwordErrorMsg && (
              <div className="mb-4 p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-2xl text-xs font-bold flex items-center gap-2 animate-in fade-in">
                <span>⚠️ {passwordErrorMsg}</span>
              </div>
            )}

            <form 
              onSubmit={(e) => {
                e.preventDefault();
                setPasswordErrorMsg("");
                if (passwordForm.newPassword.length < 6) {
                  setPasswordErrorMsg("New password must be at least 6 characters long!");
                  return;
                }
                if (passwordForm.newPassword !== passwordForm.confirmPassword) {
                  setPasswordErrorMsg("New passwords do not match!");
                  return;
                }
                setPasswordSuccessMsg("✓ Password updated successfully!");
                setTimeout(() => {
                  setShowChangePasswordModal(false);
                }, 1800);
              }}
              className="flex flex-col gap-3.5"
            >
              <div>
                <label className="text-xs font-bold text-[#3A2B24] mb-1 block">Current Password</label>
                <div className="relative">
                  <Input 
                    type={showPassword ? "text" : "password"}
                    value={passwordForm.currentPassword}
                    onChange={e => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                    placeholder="••••••••"
                    className="rounded-xl border-[#EFE6DD] text-xs font-medium pr-10"
                    required
                  />
                  <button
                    type="button"
                    className="absolute right-3 top-2.5 text-[#6C5C54] hover:text-[#3A2B24] transition-colors p-0.5"
                    onClick={() => setShowPassword(!showPassword)}
                    title={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4 text-[#D89A86]" /> : <Eye className="h-4 w-4 text-[#6C5C54]" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-[#3A2B24] mb-1 block">New Password</label>
                <div className="relative">
                  <Input 
                    type={showPassword ? "text" : "password"}
                    value={passwordForm.newPassword}
                    onChange={e => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                    placeholder="Minimum 6 characters"
                    className="rounded-xl border-[#EFE6DD] text-xs font-medium pr-10"
                    required
                  />
                  <button
                    type="button"
                    className="absolute right-3 top-2.5 text-[#6C5C54] hover:text-[#3A2B24] transition-colors p-0.5"
                    onClick={() => setShowPassword(!showPassword)}
                    title={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4 text-[#D89A86]" /> : <Eye className="h-4 w-4 text-[#6C5C54]" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-[#3A2B24] mb-1 block">Confirm New Password</label>
                <div className="relative">
                  <Input 
                    type={showPassword ? "text" : "password"}
                    value={passwordForm.confirmPassword}
                    onChange={e => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                    placeholder="Re-enter new password"
                    className="rounded-xl border-[#EFE6DD] text-xs font-medium pr-10"
                    required
                  />
                  <button
                    type="button"
                    className="absolute right-3 top-2.5 text-[#6C5C54] hover:text-[#3A2B24] transition-colors p-0.5"
                    onClick={() => setShowPassword(!showPassword)}
                    title={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4 text-[#D89A86]" /> : <Eye className="h-4 w-4 text-[#6C5C54]" />}
                  </button>
                </div>
              </div>

              <div className="border-t border-[#EFE6DD] pt-3 mt-1 flex flex-col gap-2">
                <Button 
                  type="submit"
                  className="w-full rounded-full btn-pixello-primary text-xs font-bold h-10"
                >
                  Update Password Directly
                </Button>

                <Button 
                  type="button"
                  variant="outline"
                  className="w-full rounded-full border-[#EFE6DD] text-xs font-semibold text-[#6C5C54] hover:bg-[#FFF8F2] h-9"
                  onClick={() => {
                    setEmailSentSuccess(true);
                    setPasswordErrorMsg("");
                  }}
                >
                  📧 Send Reset Link & OTP to Email
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CUSTOM SIGN OUT CONFIRMATION MODAL */}
      {showSignOutConfirmModal && (
        <div 
          className="fixed inset-0 top-0 left-0 w-screen h-screen z-[9999] bg-black/75 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in"
          onClick={() => setShowSignOutConfirmModal(false)}
        >
          <div 
            className="bg-white border border-[#EFE6DD] rounded-3xl p-6 max-w-sm w-full shadow-2xl relative text-center animate-in zoom-in-95 my-auto"
            onClick={e => e.stopPropagation()}
          >
            <div className="h-14 w-14 rounded-full bg-rose-50 border border-rose-100 flex items-center justify-center mx-auto mb-4">
              <LogOut className="h-7 w-7 text-rose-600" />
            </div>

            <h3 className="font-serif-brand text-xl font-bold text-[#3A2B24] mb-1">
              Sign Out of Pixello?
            </h3>
            <p className="text-xs text-[#6C5C54] mb-6 font-medium leading-relaxed">
              Are you sure you want to end your current session? You can sign back in anytime with your mobile number.
            </p>

            <div className="flex items-center gap-3">
              <Button 
                variant="outline" 
                className="flex-1 rounded-full border-[#EFE6DD] text-xs font-semibold text-[#3A2B24] hover:bg-[#FFF8F2] h-10"
                onClick={() => setShowSignOutConfirmModal(false)}
              >
                Cancel
              </Button>
              <Button 
                className="flex-1 rounded-full bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold h-10 shadow-xs cursor-pointer"
                onClick={async () => {
                  try {
                    await fetch("/api/auth/logout", { method: "POST" });
                  } catch (e) {}

                  if (typeof window !== "undefined") {
                    localStorage.removeItem("pixello_user");
                    localStorage.removeItem("pixello_auth_token");
                    localStorage.removeItem("pixello_customer_orders_v5");
                    localStorage.removeItem("pixello_customer_orders_v3");
                    localStorage.removeItem("pixello_addresses_default");
                    localStorage.setItem("pixello_logged_out", "true");
                    window.dispatchEvent(new Event("auth_change"));
                    window.dispatchEvent(new Event("storage"));
                  }
                  setShowSignOutConfirmModal(false);
                  startTransitionTo("/login", "signing-out", "EXITING PIXELLO...");
                }}
              >
                Yes, Sign Out
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* CUSTOM CANCEL ORDER MODAL */}
      {cancelOrderModal && (
        <div 
          className="fixed inset-0 top-0 left-0 w-screen h-screen z-[9999] bg-black/75 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in"
          onClick={() => setCancelOrderModal(null)}
        >
          <div 
            className="bg-white border border-[#EFE6DD] rounded-3xl p-6 max-w-md w-full shadow-2xl relative animate-in zoom-in-95 my-auto overflow-hidden"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-start justify-between border-b border-[#EFE6DD] pb-4 mb-4">
              <div>
                <Badge className="bg-rose-100 text-rose-800 border-none font-bold text-xs px-3 py-0.5 rounded-full mb-1">
                  24-Hour Cancel Window
                </Badge>
                <h3 className="font-serif-brand font-bold text-xl text-[#3A2B24]">
                  Cancel Order {cancelOrderModal.id}?
                </h3>
                <p className="text-xs text-[#6C5C54] mt-0.5">
                  Amount to be refunded: <strong className="text-[#D89A86]">₹{cancelOrderModal.totalAmount?.toFixed(2)}</strong>
                </p>
              </div>
              <button
                onClick={() => setCancelOrderModal(null)}
                className="h-8 w-8 rounded-full bg-[#FFF8F2] border border-[#EFE6DD] flex items-center justify-center text-[#6C5C54] hover:text-[#3A2B24] transition-colors"
              >
                ✕
              </button>
            </div>

            {cancelSuccessMsg ? (
              <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl text-xs font-bold flex items-center gap-2 mb-4 animate-in fade-in">
                <Check className="h-4 w-4 text-emerald-600 flex-shrink-0" />
                <span>{cancelSuccessMsg}</span>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="p-3 bg-amber-50 border border-amber-200 text-amber-900 rounded-2xl text-xs font-medium">
                  ⚠️ Note: Orders can only be cancelled within <strong>24 hours</strong> of placement before studio framing begins.
                </div>

                <div>
                  <label className="text-xs font-bold text-[#3A2B24] mb-2 block uppercase tracking-wider">Select Reason for Cancellation:</label>
                  <div className="space-y-2 text-xs font-semibold text-[#3A2B24]">
                    {[
                      "Changed my mind",
                      "Ordered wrong frame size / color",
                      "Delivery timeframe too long",
                      "Will place a new order with different photos"
                    ].map((reason) => (
                      <label 
                        key={reason} 
                        className={cn(
                          "flex items-center gap-3 p-3 rounded-2xl border cursor-pointer transition-all",
                          cancelReason === reason ? "border-[#D89A86] bg-[#FFF8F2]" : "border-[#EFE6DD] bg-white hover:bg-[#FFF8F2]/40"
                        )}
                      >
                        <input
                          type="radio"
                          name="cancel_reason"
                          value={reason}
                          checked={cancelReason === reason}
                          onChange={() => setCancelReason(reason)}
                          className="accent-[#D89A86]"
                        />
                        <span>{reason}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div className="flex items-center gap-3 pt-2">
                  <Button 
                    variant="outline" 
                    className="flex-1 rounded-full border-[#EFE6DD] text-xs font-semibold text-[#3A2B24] hover:bg-[#FFF8F2] h-10"
                    onClick={() => setCancelOrderModal(null)}
                  >
                    Keep Order
                  </Button>
                  <Button 
                    className="flex-1 rounded-full bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold h-10 shadow-xs cursor-pointer"
                    onClick={() => {
                      updateOrderStatus(cancelOrderModal.id, "Cancelled");
                      setCancelSuccessMsg(`✓ Order ${cancelOrderModal.id} has been cancelled successfully.`);
                      setTimeout(() => {
                        setCancelSuccessMsg("");
                        setCancelOrderModal(null);
                      }, 1800);
                    }}
                  >
                    Confirm Cancellation
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* FULL ORDER DETAILS MODAL */}
      {orderDetailsModal && (() => {
        const orderTimestamp = orderDetailsModal.createdAt || new Date(orderDetailsModal.date).getTime();
        const hoursElapsed = (Date.now() - orderTimestamp) / (1000 * 60 * 60);
        const cleanStatus = (orderDetailsModal.status || "").trim().toUpperCase();
        const isCancelled = cleanStatus === "CANCELLED" || cleanStatus === "CANCELED";
        const isDelivered = cleanStatus === "DELIVERED";
        const isPrintingStarted = cleanStatus === "PRINTING" || cleanStatus === "PACKED" || cleanStatus === "DELIVERY PICKED UP" || cleanStatus === "OUT FOR DELIVERY" || cleanStatus === "DELIVERED" || cleanStatus === "QUALITY_CHECK" || cleanStatus === "PICKED_UP";
        const isCancelEligible = !isCancelled && !isDelivered && !isPrintingStarted && hoursElapsed < 24;
        const hoursRemaining = Math.max(0, Math.floor(24 - hoursElapsed));
        const minsRemaining = Math.max(0, Math.floor((24 - hoursElapsed) * 60 % 60));

        return (
          <div 
            className="fixed inset-0 top-0 left-0 w-screen h-screen z-[9999] bg-black/75 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in"
            onClick={() => setOrderDetailsModal(null)}
          >
            <div 
              className="bg-white border border-[#EFE6DD] rounded-3xl max-w-2xl w-full shadow-2xl relative animate-in zoom-in-95 my-auto overflow-hidden flex flex-col max-h-[90vh]"
              onClick={e => e.stopPropagation()}
            >
              {/* Header */}
              <div className="p-6 bg-[#FFF8F2] border-b border-[#EFE6DD] flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <Badge className={cn(
                      "border-none px-3 py-0.5 rounded-full text-xs font-bold",
                      isDelivered ? "bg-emerald-100 text-emerald-800" : (isCancelled ? "bg-rose-100 text-rose-800" : (isPrintingStarted ? "bg-amber-100 text-amber-900 border border-amber-300" : "bg-[#3A2B24] text-white"))
                    )}>
                      {isCancelled ? "Cancelled" : orderDetailsModal.status}
                    </Badge>
                    <span className="text-xs text-[#6C5C54] font-semibold">Placed on {orderDetailsModal.date}</span>
                  </div>
                  <h3 className="font-serif-brand font-bold text-2xl text-[#3A2B24]">
                    Order Details • {orderDetailsModal.id}
                  </h3>
                </div>
                <button
                  onClick={() => setOrderDetailsModal(null)}
                  className="h-9 w-9 rounded-full bg-white border border-[#EFE6DD] flex items-center justify-center text-[#6C5C54] hover:text-[#3A2B24] transition-colors"
                >
                  ✕
                </button>
              </div>

              {/* Scrollable Content */}
              <div className="p-6 overflow-y-auto space-y-6 flex-1 text-xs">
                {/* Cancellation & Printing Status Notice */}
                {isCancelled ? (
                  <div className="p-4 rounded-2xl border bg-rose-50 border-rose-200 text-rose-950 flex items-center justify-between gap-3">
                    <div>
                      <h4 className="font-bold text-sm">❌ Order Cancelled</h4>
                      <p className="mt-0.5 font-medium">This order was cancelled. Any online payment will be refunded within 3-5 business days.</p>
                    </div>
                  </div>
                ) : (
                  <div className={cn(
                    "p-4 rounded-2xl border flex items-center justify-between gap-3",
                    isPrintingStarted ? "bg-amber-50 border-amber-200 text-amber-950" : (isCancelEligible ? "bg-rose-50 border-rose-200 text-rose-950" : "bg-[#FFF8F2] border-[#EFE6DD] text-[#3A2B24]")
                  )}>
                    <div>
                      <h4 className="font-bold text-sm">
                        {isPrintingStarted ? "🖨️ Printing & Production Started" : (isCancelEligible ? "⏳ 24-Hour Cancel Window Open" : "📦 Production Status")}
                      </h4>
                      <p className="mt-0.5 font-medium">
                        {isPrintingStarted
                          ? "Studio framing and printing have begun. This order can no longer be cancelled."
                          : (isCancelEligible 
                            ? `You can cancel this order within ${hoursRemaining}h ${minsRemaining}m before studio printing starts.`
                            : "Order placed over 24 hours ago. Studio framing is underway.")}
                      </p>
                    </div>
                    {isCancelEligible && (
                      <Button 
                        size="sm" 
                        className="bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-full px-4 text-xs flex-shrink-0"
                        onClick={() => {
                          const ord = orderDetailsModal;
                          setOrderDetailsModal(null);
                          setCancelOrderModal(ord);
                        }}
                      >
                        Cancel Order
                      </Button>
                    )}
                  </div>
                )}

                {/* Dispatch & Address Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="p-4 bg-[#FFF8F2]/60 border border-[#EFE6DD] rounded-2xl">
                    <h4 className="font-bold text-xs uppercase tracking-wider text-[#3A2B24] mb-2 flex items-center gap-1.5">
                      <Truck className="h-4 w-4 text-[#D89A86]" /> Shipping & Address
                    </h4>
                    <p className="font-bold text-[#3A2B24]">{orderDetailsModal.customerName}</p>
                    <p className="text-[#6C5C54] mt-0.5">{orderDetailsModal.deliveryAddress}</p>
                    <p className="text-[#6C5C54] font-medium mt-1">Phone: {orderDetailsModal.customerPhone}</p>
                  </div>

                  <div className="p-4 bg-[#FFF8F2]/60 border border-[#EFE6DD] rounded-2xl">
                    <h4 className="font-bold text-xs uppercase tracking-wider text-[#3A2B24] mb-2 flex items-center gap-1.5">
                      <MapPin className="h-4 w-4 text-[#D89A86]" /> Fulfillment & Support
                    </h4>
                    <p className="font-bold text-[#D89A86]">Pixello Express Quality Dispatch</p>
                    <p className="text-[#6C5C54] mt-0.5">Order Status: <strong className="text-[#3A2B24]">{orderDetailsModal.status}</strong></p>
                    <p className="text-[#6C5C54] mt-1 font-medium">Helpline: +91 7989856610 / 8074589949</p>
                  </div>
                </div>

                {/* Delhivery Express Tracking Banner */}
                {orderDetailsModal.waybill && (
                  <div className="p-4 bg-blue-50/90 border border-blue-200 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs">
                    <div>
                      <div className="flex items-center gap-2">
                        <Badge className="bg-blue-600 text-white border-none font-bold text-[10px] px-2.5 py-0.5 rounded-full">
                          DELHIVERY EXPRESS B2C
                        </Badge>
                        <span className="text-[11px] font-bold text-blue-900">2-Day Guaranteed Surface</span>
                      </div>
                      <p className="font-mono font-bold text-blue-950 text-sm mt-1">
                        AWB: {orderDetailsModal.waybill}
                      </p>
                      <p className="text-[11px] text-[#6C5C54] mt-0.5">
                        Track live courier scans, hub dispatches, and delivery rider route directly on Delhivery.
                      </p>
                    </div>

                    <a
                      href={`https://www.delhivery.com/track/package/${orderDetailsModal.waybill}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-full font-bold text-xs flex items-center justify-center gap-1.5 shadow-xs flex-shrink-0"
                    >
                      Track on Delhivery.com <ExternalLink className="h-3.5 w-3.5" />
                    </a>
                  </div>
                )}

                {/* Items List */}
                <div>
                  <h4 className="font-bold text-xs uppercase tracking-wider text-[#3A2B24] mb-3">
                    Ordered Products ({orderDetailsModal.items?.length || 0})
                  </h4>
                  <div className="space-y-3">
                    {orderDetailsModal.items?.map((item: any, idx: number) => {
                      const itemRevKey = `${orderDetailsModal.id}_${item.name}`;
                      const existingRev = userReviews[itemRevKey];

                      return (
                        <div key={idx} className="p-3.5 bg-white border border-[#EFE6DD] rounded-2xl flex flex-col gap-2.5">
                          <div className="flex items-center justify-between gap-3">
                            <div className="flex items-center gap-3">
                              <div className="h-14 w-14 rounded-xl bg-[#FFF8F2] border border-[#EFE6DD] overflow-hidden flex-shrink-0">
                                <img src={item.image} alt={item.name} className="h-full w-full object-cover" />
                              </div>
                              <div>
                                <h5 className="font-bold text-sm text-[#3A2B24]">{item.name}</h5>
                                <p className="text-[#6C5C54] text-xs">Size: <span className="font-semibold text-[#D89A86]">{item.size}</span> • Qty: {item.quantity}</p>
                                {item.photos && item.photos.length > 0 && (
                                  <span className="inline-block mt-1 text-[10px] font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full">
                                    ✓ Photo #{idx+1}: Custom Uploaded Photo Attached
                                  </span>
                                )}
                              </div>
                            </div>
                            <span className="font-extrabold text-sm text-[#D89A86]">
                              ₹{(item.price * item.quantity).toFixed(2)}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Ambassador Referral & Promo Details Card */}
                {orderDetailsModal.referralCode && (
                  <div className="p-4 bg-emerald-50/90 border border-emerald-200 rounded-2xl space-y-2 text-xs">
                    <div className="flex items-center justify-between font-bold text-[#065F46]">
                      <span className="flex items-center gap-1.5 uppercase tracking-wider text-[11px]">
                        <Ticket className="h-4 w-4 text-emerald-600" /> Ambassador Referral Code Applied:
                      </span>
                      <span className="font-mono bg-white text-emerald-900 px-3 py-0.5 rounded-full border border-emerald-300 shadow-2xs font-extrabold text-xs">
                        {orderDetailsModal.referralCode}
                      </span>
                    </div>
                    <div className="flex justify-between text-emerald-800 font-medium">
                      <span>Ambassador Partner:</span>
                      <span className="font-bold">{orderDetailsModal.ambassadorName || (orderDetailsModal.referralCode === "SAIROHAN10" ? "Sai Rohan" : "Campus Ambassador")}</span>
                    </div>
                    {orderDetailsModal.referralDiscount && (
                      <div className="flex justify-between text-emerald-900 font-extrabold pt-1.5 border-t border-emerald-200/80">
                        <span>Referral Discount Applied:</span>
                        <span className="text-emerald-700">-₹{Number(orderDetailsModal.referralDiscount).toFixed(2)}</span>
                      </div>
                    )}
                  </div>
                )}

                {/* Financial Summary */}
                <div className="p-4 bg-[#FFF8F2] border border-[#EFE6DD] rounded-2xl space-y-2 text-xs">
                  <div className="flex justify-between text-[#6C5C54]">
                    <span>Item Subtotal:</span>
                    <span className="font-bold text-[#3A2B24]">
                      ₹{(orderDetailsModal.subtotal || orderDetailsModal.totalAmount + (orderDetailsModal.referralDiscount || 0)).toFixed(2)}
                    </span>
                  </div>
                  {orderDetailsModal.referralCode && (
                    <div className="flex justify-between text-emerald-700 font-bold">
                      <span>Referral Discount ({orderDetailsModal.referralCode}):</span>
                      <span>-₹{(orderDetailsModal.referralDiscount || 0).toFixed(2)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-[#6C5C54]">
                    <span>Shipping Fee:</span>
                    <span className="font-bold text-emerald-700">
                      {orderDetailsModal.deliveryFee ? `₹${orderDetailsModal.deliveryFee.toFixed(2)}` : "FREE (Doorstep Delivery)"}
                    </span>
                  </div>
                  <div className="flex justify-between text-[#6C5C54]">
                    <span>GST (0% Policy):</span>
                    <span className="font-bold text-[#3A2B24]">₹0.00</span>
                  </div>
                  <div className="pt-2 border-t border-[#EFE6DD] flex justify-between items-center text-sm font-extrabold text-[#3A2B24]">
                    <span>Total Paid:</span>
                    <span className="text-base text-[#D89A86]">₹{orderDetailsModal.totalAmount?.toFixed(2)}</span>
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="p-4 bg-[#FFF8F2] border-t border-[#EFE6DD] flex flex-wrap items-center justify-between gap-2">
                <Button 
                  variant="outline"
                  onClick={() => handleDownloadInvoice(orderDetailsModal)}
                  className="rounded-full text-xs font-bold border-[#EFE6DD] px-4"
                >
                  <Download className="h-4 w-4 mr-1.5 text-[#D89A86]" /> Download Invoice PDF
                </Button>

                <div className="flex items-center gap-2">
                  {isDelivered && hoursElapsed < 24 && orderDetailsModal.status !== "Replacement Requested" && (
                    <Button 
                      size="sm" 
                      variant="outline"
                      className="border-purple-300 text-purple-900 bg-purple-50 hover:bg-purple-100 hover:border-purple-400 font-bold text-xs rounded-full h-9 px-4 cursor-pointer shadow-2xs flex items-center gap-1.5"
                      onClick={() => {
                        const ord = orderDetailsModal;
                        setOrderDetailsModal(null);
                        setReplacementSuccessMsg("");
                        setReplacementModalOrder(ord);
                      }}
                    >
                      <RefreshCw className="h-3.5 w-3.5 text-purple-700" />
                      <span>Request Replacement ({hoursRemaining}h left)</span>
                    </Button>
                  )}

                  <Button 
                    onClick={() => setOrderDetailsModal(null)}
                    className="btn-pixello-primary rounded-full text-xs font-bold px-6"
                  >
                    Close
                  </Button>
                </div>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Customer Uploaded Photo Preview Modal */}
      {photoPreviewModal && photoPreviewModal.isOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white border border-[#EFE6DD] rounded-3xl max-w-lg w-full overflow-hidden shadow-2xl animate-in zoom-in-95">
            <div className="bg-[#FFF8F2] border-b border-[#EFE6DD] p-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-[#D89A86]/10 text-[#D89A86] rounded-full">
                  <ImageIcon className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-serif-brand font-bold text-base text-[#3A2B24]">Customer Uploaded Photo</h3>
                  <p className="text-xs text-[#6C5C54]">{photoPreviewModal.itemName} • {photoPreviewModal.orderId}</p>
                </div>
              </div>
              <button 
                onClick={() => setPhotoPreviewModal(null)}
                className="p-2 text-[#6C5C54] hover:text-[#3A2B24] rounded-full hover:bg-[#EFE6DD]/50 cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="p-6 flex flex-col items-center">
              <div className="w-full max-h-[380px] rounded-2xl overflow-hidden border border-[#EFE6DD] bg-slate-100 flex items-center justify-center mb-4 shadow-inner">
                <img 
                  src={photoPreviewModal.photoUrl} 
                  alt={photoPreviewModal.photoName} 
                  className="max-h-[360px] w-auto max-w-full object-contain rounded-xl"
                />
              </div>
              <p className="text-xs font-semibold text-[#6C5C54] mb-4 text-center">
                Attached Photo: <strong className="text-[#3A2B24]">{photoPreviewModal.photoName}</strong>
              </p>
              <div className="flex items-center gap-3 w-full">
                <a
                  href={photoPreviewModal.photoUrl}
                  download={`customer_photo_${photoPreviewModal.orderId}.png`}
                  target="_blank"
                  rel="noreferrer"
                  className="flex-1"
                >
                  <Button className="w-full btn-pixello-primary rounded-full text-xs font-bold h-11 flex items-center justify-center gap-2">
                    <Download className="h-4 w-4" /> Download Customer Photo
                  </Button>
                </a>
                <Button
                  variant="outline"
                  onClick={() => window.open(photoPreviewModal.photoUrl, "_blank")}
                  className="rounded-full border-[#EFE6DD] text-xs font-bold h-11 px-5 text-[#3A2B24] hover:bg-[#FFF8F2]"
                >
                  <ExternalLink className="h-4 w-4" /> Fullscreen
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function ProfilePage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#F8F3EE] flex items-center justify-center p-6 text-xs text-[#6C5C54] font-bold">Loading profile...</div>}>
      <ProfileContent />
    </Suspense>
  );
}
