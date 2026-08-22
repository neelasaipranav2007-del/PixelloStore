"use client";

import { useState, useEffect, useRef } from "react";
import QRCode from "qrcode";
import { Link2, Copy, Check, QrCode, Share2, Sparkles, Download, CheckCircle2, Printer, Eye, X, GraduationCap, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";

export default function AmbassadorLinksPage() {
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);
  const [isPosterModalOpen, setIsPosterModalOpen] = useState(false);
  const [qrDataUrl, setQrDataUrl] = useState<string>("");
  const [isGenerating, setIsGenerating] = useState(false);

  // Ambassador Profile Details
  const [ambassadorProfile, setAmbassadorProfile] = useState({
    name: "Sai Rohan",
    college: "Aurora Deemed to Be University",
  });

  // Live Admin Promo Code & Referral Link Configurations
  const [promoConfig, setPromoConfig] = useState(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("pixello_ambassador_promo_config");
      if (saved) {
        try {
          return JSON.parse(saved);
        } catch (e) {
          console.error(e);
        }
      }
    }
    return {
      promoCode: "SAIROHAN10",
      baseUrl: "https://pixellostore.com/ref/",
      discountPercent: "10%",
      commissionPercent: "10%",
    };
  });

  useEffect(() => {
    const syncConfig = () => {
      if (typeof window !== "undefined") {
        const saved = localStorage.getItem("pixello_ambassador_promo_config");
        if (saved) {
          try {
            setPromoConfig(JSON.parse(saved));
          } catch (e) {
            console.error(e);
          }
        }
        const savedProfile = localStorage.getItem("pixello_ambassador_profile");
        if (savedProfile) {
          try {
            const parsed = JSON.parse(savedProfile);
            if (parsed.name) {
              setAmbassadorProfile({
                name: parsed.name,
                college: parsed.college || "Campus Partner",
              });
            }
            if (parsed.promoCode && !saved) {
              setPromoConfig((prev: any) => ({ ...prev, promoCode: parsed.promoCode }));
            }
          } catch (e) {}
        }
      }
    };
    syncConfig();
    window.addEventListener("pixello_promo_config_updated", syncConfig);
    window.addEventListener("pixello_ambassador_profile_updated", syncConfig);
    window.addEventListener("pixello_ambassadors_updated", syncConfig);
    window.addEventListener("storage", syncConfig);
    return () => {
      window.removeEventListener("pixello_promo_config_updated", syncConfig);
      window.removeEventListener("pixello_ambassador_profile_updated", syncConfig);
      window.removeEventListener("pixello_ambassadors_updated", syncConfig);
      window.removeEventListener("storage", syncConfig);
    };
  }, []);

  const referralCode = promoConfig.promoCode || "SAIROHAN10";
  const referralLink = `${promoConfig.baseUrl || "https://pixellostore.com/ref/"}${referralCode}`;
  const discountText = promoConfig.discountPercent.includes("%") ? promoConfig.discountPercent : `${promoConfig.discountPercent}% OFF`;
  const commissionText = promoConfig.commissionPercent.includes("%") ? promoConfig.commissionPercent : `${promoConfig.commissionPercent}%`;

  // Generate QR Code Data URL dynamically
  useEffect(() => {
    QRCode.toDataURL(referralLink, {
      width: 600,
      margin: 1,
      color: {
        dark: "#3A2B24",
        light: "#FFFFFF",
      },
    })
      .then((url) => setQrDataUrl(url))
      .catch((err) => console.error("Error generating QR:", err));
  }, [referralLink]);

  const copyReferralLink = () => {
    navigator.clipboard.writeText(referralLink);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const copyPromoCode = () => {
    navigator.clipboard.writeText(referralCode);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  // Helper for drawing rounded rectangle on Canvas
  const drawRoundRect = (ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) => {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r);
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
  };

  // Download High-Res Poster Image (PNG)
  const downloadPosterImage = async () => {
    setIsGenerating(true);
    try {
      const canvas = document.createElement("canvas");
      canvas.width = 1240;
      canvas.height = 1754;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      // Background Warm Cream Gradient
      const grad = ctx.createLinearGradient(0, 0, 0, 1754);
      grad.addColorStop(0, "#FFF9F5");
      grad.addColorStop(1, "#F5ECE3");
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, 1240, 1754);

      // Border Outer Frame
      ctx.strokeStyle = "#D89A86";
      ctx.lineWidth = 14;
      ctx.strokeRect(36, 36, 1168, 1682);

      // Inner Accent Border
      ctx.strokeStyle = "#EFE6DD";
      ctx.lineWidth = 3;
      ctx.strokeRect(52, 52, 1136, 1650);

      // Header Banner Pill
      ctx.fillStyle = "#3A2B24";
      drawRoundRect(ctx, 120, 90, 1000, 68, 34);
      ctx.fill();

      ctx.fillStyle = "#FFFFFF";
      ctx.font = "bold 24px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
      ctx.textAlign = "center";
      ctx.fillText("✨ OFFICIAL CAMPUS AMBASSADOR SPECIAL ✨", 620, 133);

      // Pixello Brand Title
      ctx.fillStyle = "#3A2B24";
      ctx.font = "bold 82px Georgia, serif";
      ctx.fillText("PIXELLO STORE", 620, 250);

      ctx.fillStyle = "#6C5C54";
      ctx.font = "600 26px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
      ctx.fillText("Custom Photo Frames • Polaroids • Memory Prints & Gifts", 620, 298);

      // Exclusive Student Offer Card
      ctx.fillStyle = "#FFF2EB";
      drawRoundRect(ctx, 130, 345, 980, 140, 24);
      ctx.fill();
      ctx.strokeStyle = "#D89A86";
      ctx.lineWidth = 3;
      ctx.stroke();

      ctx.fillStyle = "#D89A86";
      ctx.font = "bold 28px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
      ctx.fillText("CAMPUS EXCLUSIVE OFFER", 620, 395);

      ctx.fillStyle = "#3A2B24";
      ctx.font = "900 46px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
      ctx.fillText(`FLAT ${discountText} ON ALL CUSTOM ORDERS`, 620, 452);

      // Scannable QR Code
      if (qrDataUrl) {
        const qrImg = new Image();
        qrImg.src = qrDataUrl;
        await new Promise((resolve) => {
          qrImg.onload = resolve;
          qrImg.onerror = resolve;
        });

        // White Card behind QR
        ctx.fillStyle = "#FFFFFF";
        drawRoundRect(ctx, 370, 520, 500, 500, 28);
        ctx.fill();
        ctx.strokeStyle = "#EFE6DD";
        ctx.lineWidth = 4;
        ctx.stroke();

        ctx.drawImage(qrImg, 400, 550, 440, 440);
      }

      // Scan instruction
      ctx.fillStyle = "#3A2B24";
      ctx.font = "bold 28px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
      ctx.fillText("👆 SCAN QR CODE WITH CAMERA TO ORDER", 620, 1070);

      // Promo Code Box
      ctx.fillStyle = "#FFFFFF";
      drawRoundRect(ctx, 160, 1120, 920, 130, 20);
      ctx.fill();
      ctx.strokeStyle = "#3A2B24";
      ctx.lineWidth = 4;
      ctx.stroke();

      ctx.fillStyle = "#6C5C54";
      ctx.font = "bold 20px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
      ctx.fillText("OR ENTER AMBASSADOR CODE AT CHECKOUT:", 620, 1162);

      ctx.fillStyle = "#3A2B24";
      ctx.font = "900 48px monospace";
      ctx.fillText(referralCode, 620, 1222);

      // Ambassador Details
      ctx.fillStyle = "#3A2B24";
      ctx.font = "bold 26px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
      ctx.fillText(`Campus Ambassador: ${ambassadorProfile.name}`, 620, 1320);

      ctx.fillStyle = "#6C5C54";
      ctx.font = "500 23px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
      ctx.fillText(ambassadorProfile.college, 620, 1360);

      // Popular items
      ctx.fillStyle = "#FFF8F2";
      drawRoundRect(ctx, 140, 1410, 960, 70, 18);
      ctx.fill();
      ctx.strokeStyle = "#EFE6DD";
      ctx.lineWidth = 2;
      ctx.stroke();

      ctx.fillStyle = "#3A2B24";
      ctx.font = "bold 21px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
      ctx.fillText("📸 Polaroids  •  🖼️ Wooden Frames  •  ☕ Custom Mugs  •  💡 Acrylic Lamps", 620, 1453);

      // Website & Fast Delivery
      ctx.fillStyle = "#D89A86";
      ctx.font = "bold 26px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
      ctx.fillText("⚡ Fast Campus Delivery  •  Free Shipping Available", 620, 1540);

      ctx.fillStyle = "#3A2B24";
      ctx.font = "bold 32px Georgia, serif";
      ctx.fillText("🌐 www.pixellostore.com", 620, 1610);

      // Trigger file download
      const dataUrl = canvas.toDataURL("image/png");
      const link = document.createElement("a");
      link.download = `Pixello-Campus-Poster-${referralCode}.png`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error("Poster download error:", err);
    } finally {
      setIsGenerating(false);
    }
  };

  // Open Direct Print / Save as PDF Window
  const handlePrintPoster = () => {
    const printWindow = window.open("", "_blank", "width=850,height=1100");
    if (!printWindow) {
      alert("Please allow popups to print/save poster as PDF.");
      return;
    }

    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Pixello Campus Poster - ${referralCode}</title>
          <meta charset="utf-8" />
          <style>
            @page {
              size: A4 portrait;
              margin: 0;
            }
            * {
              box-sizing: border-box;
              margin: 0;
              padding: 0;
            }
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
              background-color: #FFF9F5;
              color: #3A2B24;
              display: flex;
              justify-content: center;
              align-items: center;
              min-height: 100vh;
              padding: 15mm;
              -webkit-print-color-adjust: exact;
              print-color-adjust: exact;
            }
            .poster-card {
              width: 100%;
              max-width: 180mm;
              background: #FFFFFF;
              border: 4mm solid #3A2B24;
              border-radius: 12mm;
              padding: 10mm;
              text-align: center;
              box-shadow: 0 4px 20px rgba(0,0,0,0.08);
            }
            .pill-badge {
              display: inline-block;
              background: #3A2B24;
              color: #FFFFFF;
              font-size: 13px;
              font-weight: 800;
              padding: 6px 18px;
              border-radius: 20px;
              letter-spacing: 1px;
              margin-bottom: 12px;
            }
            .brand-title {
              font-family: Georgia, serif;
              font-size: 42px;
              font-weight: 900;
              color: #3A2B24;
              letter-spacing: 1px;
              margin-bottom: 4px;
            }
            .tagline {
              font-size: 13px;
              color: #6C5C54;
              font-weight: 600;
              margin-bottom: 18px;
            }
            .offer-box {
              background: #FFF2EB;
              border: 2px dashed #D89A86;
              border-radius: 12px;
              padding: 12px;
              margin-bottom: 18px;
            }
            .offer-subtitle {
              font-size: 13px;
              font-weight: 800;
              color: #D89A86;
              letter-spacing: 1px;
            }
            .offer-title {
              font-size: 26px;
              font-weight: 900;
              color: #3A2B24;
              margin-top: 2px;
            }
            .qr-wrapper {
              display: inline-block;
              background: #FFFFFF;
              border: 3px solid #EFE6DD;
              border-radius: 16px;
              padding: 12px;
              margin-bottom: 12px;
            }
            .qr-wrapper img {
              width: 180px;
              height: 180px;
              display: block;
            }
            .scan-hint {
              font-size: 14px;
              font-weight: 800;
              color: #3A2B24;
              margin-bottom: 16px;
            }
            .code-box {
              background: #FFF9F5;
              border: 2px solid #3A2B24;
              border-radius: 12px;
              padding: 10px 16px;
              margin: 0 auto 16px;
              max-width: 320px;
            }
            .code-label {
              font-size: 11px;
              font-weight: 800;
              color: #6C5C54;
              text-transform: uppercase;
            }
            .code-text {
              font-family: monospace;
              font-size: 28px;
              font-weight: 900;
              color: #3A2B24;
              letter-spacing: 3px;
            }
            .ambassador-footer {
              font-size: 13px;
              color: #6C5C54;
              border-top: 1px solid #EFE6DD;
              padding-top: 12px;
              margin-top: 8px;
            }
            .ambassador-name {
              font-weight: 800;
              color: #3A2B24;
              font-size: 14px;
            }
            .features {
              margin-top: 8px;
              font-size: 12px;
              font-weight: 700;
              color: #D89A86;
            }
            .website {
              font-size: 15px;
              font-weight: 800;
              color: #3A2B24;
              margin-top: 8px;
            }
          </style>
        </head>
        <body>
          <div class="poster-card">
            <div class="pill-badge">✨ OFFICIAL CAMPUS AMBASSADOR SPECIAL ✨</div>
            <h1 class="brand-title">PIXELLO STORE</h1>
            <p class="tagline">Custom Photo Frames • Polaroids • Memory Prints & Gifts</p>

            <div class="offer-box">
              <div class="offer-subtitle">CAMPUS EXCLUSIVE OFFER</div>
              <div class="offer-title">FLAT ${discountText} ON ALL ORDERS</div>
            </div>

            <div class="qr-wrapper">
              <img src="${qrDataUrl}" alt="Pixello QR Code" />
            </div>
            <p class="scan-hint">👆 Scan QR Code to Order Online</p>

            <div class="code-box">
              <div class="code-label">OR USE COUPON CODE AT CHECKOUT</div>
              <div class="code-text">${referralCode}</div>
            </div>

            <div class="ambassador-footer">
              <div class="ambassador-name">Campus Ambassador: ${ambassadorProfile.name}</div>
              <div>${ambassadorProfile.college}</div>
              <div class="features">⚡ Fast Delivery • Free Campus Pickups • High-Grade 260 GSM Prints</div>
              <div class="website">🌐 www.pixellostore.com</div>
            </div>
          </div>
          <script>
            window.onload = function() {
              window.print();
            };
          </script>
        </body>
      </html>
    `;

    printWindow.document.open();
    printWindow.document.write(htmlContent);
    printWindow.document.close();
  };

  return (
    <div className="flex flex-col gap-6 bg-[#F8F3EE] p-6 rounded-3xl min-h-screen">
      <div>
        <h2 className="font-serif-brand text-3xl font-bold text-[#3A2B24]">Promo Links & QR Code</h2>
        <p className="text-xs text-[#6C5C54] mt-1">Share your custom referral link, promo code, and QR poster to earn {commissionText} commission.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Referral Link Tool */}
        <Card className="border border-[#EFE6DD] bg-white rounded-3xl shadow-xs">
          <CardContent className="p-6 flex flex-col justify-between h-full">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <div className="h-9 w-9 rounded-2xl bg-[#FFF8F2] border border-[#EFE6DD] flex items-center justify-center text-[#D89A86]">
                  <Link2 className="h-5 w-5" />
                </div>
                <h3 className="font-serif-brand font-bold text-lg text-[#3A2B24]">Unique Referral Link</h3>
              </div>
              <p className="text-xs text-[#6C5C54] mb-4">Paste this link in your Instagram bio, WhatsApp status, or campus chat groups.</p>
              
              <div className="flex gap-2 bg-[#FFF8F2] p-3 rounded-2xl border border-[#EFE6DD] mb-3">
                <Input 
                  value={referralLink} 
                  readOnly 
                  className="bg-white border-[#EFE6DD] text-xs font-mono font-bold text-[#3A2B24] flex-1 min-w-0" 
                />
                <Button 
                  onClick={copyReferralLink} 
                  className="btn-pixello-primary text-xs font-bold rounded-xl px-4 h-10 shrink-0 flex items-center gap-1.5 shadow-2xs cursor-pointer"
                >
                  {copiedLink ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                  {copiedLink ? "Copied" : "Copy Link"}
                </Button>
              </div>
            </div>
            <p className="text-[11px] text-[#6C5C54] font-medium mt-4">✓ Auto-applies {discountText} discount to customer cart.</p>
          </CardContent>
        </Card>

        {/* Promo Code Tool */}
        <Card className="border border-[#EFE6DD] bg-white rounded-3xl shadow-xs">
          <CardContent className="p-6 flex flex-col justify-between h-full">
            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div className="h-9 w-9 rounded-2xl bg-[#FFF8F2] border border-[#EFE6DD] flex items-center justify-center text-[#D89A86]">
                    <QrCode className="h-5 w-5" />
                  </div>
                  <h3 className="font-serif-brand font-bold text-lg text-[#3A2B24]">Personal Coupon Code</h3>
                </div>
                <Badge className="bg-emerald-100 text-emerald-800 border border-emerald-200 text-xs font-bold px-3 py-0.5 rounded-full">
                  {discountText}
                </Badge>
              </div>
              <p className="text-xs text-[#6C5C54] mb-4">Students type this code during checkout to get {discountText} off instantly.</p>
              
              <div className="flex gap-2 bg-[#FFF8F2] p-3 rounded-2xl border border-[#EFE6DD] mb-3">
                <div className="flex-1 border-2 border-dashed border-[#D89A86]/50 rounded-xl flex items-center justify-center font-mono font-bold text-lg bg-white h-10 tracking-widest text-[#3A2B24]">
                  {referralCode}
                </div>
                <Button 
                  onClick={copyPromoCode} 
                  className="btn-pixello-secondary text-xs font-bold rounded-xl px-4 h-10 shrink-0 flex items-center gap-1.5 shadow-2xs cursor-pointer"
                >
                  {copiedCode ? <Check className="h-3.5 w-3.5 text-[#3A2B24]" /> : <Copy className="h-3.5 w-3.5 text-[#3A2B24]" />}
                  {copiedCode ? "Copied" : "Copy Code"}
                </Button>
              </div>
            </div>
            <p className="text-[11px] text-[#6C5C54] font-medium mt-4">
              ✓ Customers get {discountText}. You earn {commissionText} commission on final order amount.
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Campus Print Flyer QR Poster Card */}
      <Card className="border border-[#EFE6DD] bg-white rounded-3xl shadow-xs overflow-hidden">
        <CardContent className="p-6 md:p-8 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="h-16 w-16 rounded-3xl bg-[#3A2B24] text-white flex items-center justify-center font-bold shadow-md flex-shrink-0">
              <QrCode className="h-8 w-8 text-[#D89A86]" />
            </div>
            <div>
              <h3 className="font-serif-brand text-xl font-bold text-[#3A2B24]">Download Campus Printable Poster (PDF)</h3>
              <p className="text-xs text-[#6C5C54] mt-1">High-res A4 poster pre-embedded with your QR code ({referralCode}) for college noticeboards & hostel doors.</p>
            </div>
          </div>
          <div className="flex items-center gap-3 w-full md:w-auto">
            <Button 
              onClick={() => setIsPosterModalOpen(true)}
              variant="outline"
              className="rounded-full border-[#EFE6DD] text-xs font-bold text-[#3A2B24] hover:bg-[#FFF8F2] px-5 h-11 shadow-2xs flex items-center gap-2 cursor-pointer"
            >
              <Eye className="h-4 w-4 text-[#D89A86]" /> Preview Poster
            </Button>
            <Button 
              onClick={() => setIsPosterModalOpen(true)}
              className="btn-pixello-primary text-xs font-bold rounded-full px-6 h-11 shadow-xs flex items-center gap-2 shrink-0 cursor-pointer"
            >
              <Download className="h-4 w-4 text-white" /> Download Poster PDF
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* High-Fidelity Poster Preview & Download Modal Dialog */}
      {isPosterModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl border border-[#EFE6DD] shadow-2xl w-full max-w-lg p-6 overflow-hidden animate-in zoom-in-95 duration-200 my-8">
            <div className="flex items-center justify-between pb-4 border-b border-[#EFE6DD] mb-4">
              <div className="flex items-center gap-2.5">
                <div className="h-10 w-10 rounded-2xl bg-[#3A2B24] text-white flex items-center justify-center shadow-xs">
                  <QrCode className="h-5 w-5 text-[#D89A86]" />
                </div>
                <div>
                  <h3 className="font-serif-brand text-xl font-bold text-[#3A2B24]">Campus Printable Flyer</h3>
                  <p className="text-xs text-[#6C5C54]">A4 Print-Ready Format • {referralCode}</p>
                </div>
              </div>
              <button
                onClick={() => setIsPosterModalOpen(false)}
                className="h-8 w-8 rounded-full flex items-center justify-center text-[#6C5C54] hover:bg-[#FFF8F2] cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Live Visual Poster Preview Container */}
            <div className="bg-[#FFF9F5] border-2 border-[#D89A86]/40 rounded-2xl p-5 text-center shadow-inner relative overflow-hidden">
              <div className="inline-block bg-[#3A2B24] text-white text-[10px] font-extrabold px-3 py-1 rounded-full uppercase tracking-wider mb-2">
                ✨ OFFICIAL CAMPUS AMBASSADOR SPECIAL ✨
              </div>
              
              <h2 className="font-serif-brand text-2xl font-black text-[#3A2B24] tracking-tight">PIXELLO STORE</h2>
              <p className="text-[11px] text-[#6C5C54] font-medium">Custom Photo Frames • Polaroids • Memory Prints & Gifts</p>

              {/* Discount Box */}
              <div className="bg-[#FFF2EB] border border-[#D89A86] rounded-xl p-2.5 my-3">
                <span className="text-[10px] font-extrabold text-[#D89A86] tracking-wider uppercase block">Campus Exclusive Offer</span>
                <span className="text-lg font-black text-[#3A2B24] block">FLAT {discountText} ON ALL ORDERS</span>
              </div>

              {/* QR Code Container */}
              <div className="inline-block bg-white p-3 rounded-2xl border border-[#EFE6DD] shadow-sm my-1">
                {qrDataUrl ? (
                  <img 
                    src={qrDataUrl} 
                    alt="Pixello Ambassador QR" 
                    className="w-36 h-36 mx-auto object-contain"
                  />
                ) : (
                  <div className="w-36 h-36 flex items-center justify-center text-xs text-[#6C5C54]">Generating QR...</div>
                )}
              </div>
              <p className="text-xs font-bold text-[#3A2B24] mt-1">👆 Scan QR Code to Order Online</p>

              {/* Monospace Promo Code Box */}
              <div className="bg-white border-2 border-[#3A2B24] rounded-xl p-2 max-w-[260px] mx-auto my-2.5 shadow-2xs">
                <span className="text-[9px] font-extrabold text-[#6C5C54] uppercase block">Or Use Coupon Code at Checkout</span>
                <span className="font-mono text-xl font-black text-[#3A2B24] tracking-widest block">{referralCode}</span>
              </div>

              {/* Ambassador Credit Footer */}
              <div className="pt-2 border-t border-[#EFE6DD] text-[11px] text-[#6C5C54]">
                <p className="font-bold text-[#3A2B24] flex items-center justify-center gap-1">
                  <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" /> Campus Ambassador: {ambassadorProfile.name}
                </p>
                <p className="text-[10px] text-[#6C5C54]">{ambassadorProfile.college}</p>
                <p className="text-[10px] font-extrabold text-[#D89A86] mt-1">⚡ Fast Campus Delivery • Free Shipping Available</p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-5 mt-3 border-t border-[#EFE6DD]">
              <Button
                onClick={handlePrintPoster}
                className="bg-[#3A2B24] hover:bg-[#4E3D35] text-white text-xs font-bold rounded-full h-11 flex items-center justify-center gap-2 cursor-pointer shadow-xs"
              >
                <Printer className="h-4 w-4" /> Print / Save as PDF
              </Button>
              <Button
                onClick={downloadPosterImage}
                disabled={isGenerating}
                className="btn-pixello-primary text-xs font-bold rounded-full h-11 flex items-center justify-center gap-2 cursor-pointer shadow-xs"
              >
                <Download className="h-4 w-4" /> {isGenerating ? "Generating..." : "Download High-Res PNG"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

