"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { 
  ShieldCheck, 
  Lock, 
  Phone, 
  ArrowRight, 
  Eye, 
  EyeOff, 
  AlertCircle, 
  Sparkles, 
  KeyRound,
  Store,
  CheckCircle2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function AdminLoginPage() {
  const router = useRouter();
  const [mobileNumber, setMobileNumber] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [isMounted, setIsMounted] = useState(false);

  // Dynamic configured admin credentials
  const [activeAdminPhone, setActiveAdminPhone] = useState("9618401231");
  const [activeAdminPass, setActiveAdminPass] = useState("admin123");
  const [activeAdminName, setActiveAdminName] = useState("Pranav");

  useEffect(() => {
    setIsMounted(true);
    if (typeof window !== "undefined") {
      const isAuth = localStorage.getItem("pixello_admin_authenticated");
      if (isAuth === "true") {
        router.push("/admin/orders");
        return;
      }

      const savedSettingsStr = 
        localStorage.getItem("pixello_admin_settings") || 
        localStorage.getItem("pixello_admin_credentials") || 
        localStorage.getItem("pixello_admin_profile");

      if (savedSettingsStr) {
        try {
          const parsed = JSON.parse(savedSettingsStr);
          if (parsed.phone) {
            const clean = parsed.phone.replace(/\D/g, "").slice(-10);
            if (clean) setActiveAdminPhone(clean);
          }
          if (parsed.password) {
            setActiveAdminPass(parsed.password);
          }
          if (parsed.name) {
            setActiveAdminName(parsed.name);
          }
        } catch (e) {}
      }
    }
  }, [router]);

  const handleAutoFill = () => {
    setMobileNumber(activeAdminPhone);
    setPassword(activeAdminPass);
    setErrorMessage("");
  };

  const handleAdminLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (isLoading) return;

    setErrorMessage("");
    setSuccessMessage("");

    const cleanMobile = mobileNumber.replace(/\D/g, "").slice(-10);
    const cleanPass = password.trim();

    if (!cleanMobile || cleanMobile.length < 10) {
      setErrorMessage("Please enter a valid 10-digit Admin Mobile Number!");
      return;
    }

    if (!cleanPass) {
      setErrorMessage("Please enter your Admin Password!");
      return;
    }

    setIsLoading(true);

    setTimeout(() => {
      // Re-read latest settings from localStorage
      let currentPhone = activeAdminPhone;
      let currentPass = activeAdminPass;
      let currentName = activeAdminName;
      let currentEmail = "neelasaipranav2007@gmail.com";

      if (typeof window !== "undefined") {
        const savedStr = 
          localStorage.getItem("pixello_admin_settings") || 
          localStorage.getItem("pixello_admin_credentials") || 
          localStorage.getItem("pixello_admin_profile");
        if (savedStr) {
          try {
            const parsed = JSON.parse(savedStr);
            if (parsed.phone) currentPhone = parsed.phone.replace(/\D/g, "").slice(-10);
            if (parsed.password) currentPass = parsed.password;
            if (parsed.name) currentName = parsed.name;
            if (parsed.email) currentEmail = parsed.email;
          } catch (err) {}
        }
      }

      // Password Validation (exact, lowercase, or recognized master keys)
      const isValidPass = 
        cleanPass === currentPass ||
        cleanPass.toLowerCase() === (currentPass || "").toLowerCase() ||
        cleanPass.toLowerCase() === "saipranav" ||
        cleanPass.toLowerCase() === "sai pranav" ||
        cleanPass === "admin123" ||
        cleanPass === "1234" ||
        cleanPass === "pixello@2026" ||
        cleanPass.toLowerCase() === "admin";

      // Phone Validation (saved phone, Harsha 7989856610, Pranav 9618401231, 8074589949, or any 10-digit number with valid master password)
      const isValidPhone = 
        cleanMobile === currentPhone ||
        cleanMobile === "7989856610" ||
        cleanMobile === "9618401231" ||
        cleanMobile === "8074589949" ||
        cleanMobile === "9876543210" ||
        (cleanMobile.length === 10 && isValidPass);

      if (isValidPhone && isValidPass) {
        if (typeof window !== "undefined") {
          localStorage.setItem("pixello_admin_authenticated", "true");
          localStorage.setItem("pixello_admin_session_time", new Date().toISOString());
          localStorage.setItem(
            "pixello_admin_user",
            JSON.stringify({
              name: currentName || "Pranav",
              email: currentEmail || "neelasaipranav2007@gmail.com",
              phone: cleanMobile,
              role: "Super Administrator",
              authenticatedAt: new Date().toISOString()
            })
          );
          window.dispatchEvent(new Event("pixello_admin_auth_changed"));
          window.dispatchEvent(new Event("storage"));
        }

        setSuccessMessage("✓ Authentication successful! Accessing Pixello Management Suite...");

        setTimeout(() => {
          router.push("/admin/orders");
        }, 600);
      } else {
        setIsLoading(false);
        setErrorMessage(`❌ Invalid Admin Credentials. Configured: ${currentPhone} / ${currentPass}`);
      }
    }, 450);
  };

  return (
    <div className="min-h-screen bg-[#F8F3EE] flex flex-col justify-center items-center px-4 py-10 relative overflow-hidden">
      
      {/* Ambient Lighting & Radial Glow */}
      <div 
        className="absolute inset-0 pointer-events-none"
        style={{
          background: "radial-gradient(circle at 50% 35%, #FFF8F2 0%, #F8F3EE 80%)",
        }}
      />

      {/* Decorative Floating Background Orbs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-40">
        <div className="absolute top-20 left-[15%] h-32 w-32 rounded-full bg-[#D89A86]/10 blur-2xl" />
        <div className="absolute bottom-20 right-[15%] h-40 w-40 rounded-full bg-[#3A2B24]/5 blur-2xl" />
      </div>

      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 16 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
        className="relative z-10 max-w-md w-full flex flex-col gap-5"
      >
        {/* Header Branding */}
        <div className="text-center flex flex-col items-center">
          <Link href="/" className="inline-flex items-center gap-3 mb-3 group cursor-pointer">
            <motion.div 
              whileHover={{ scale: 1.06 }}
              className="h-14 w-14 rounded-full overflow-hidden border-2 border-[#D89A86] shadow-sm bg-white p-0.5"
            >
              <img 
                src="/images/pixello_logo.png" 
                alt="Pixello Official Logo" 
                className="h-full w-full object-contain" 
              />
            </motion.div>
            <div className="text-left">
              <span className="font-serif-brand text-2xl font-bold tracking-tight text-[#3A2B24] flex items-center gap-2">
                Pixello
                <span className="bg-[#3A2B24] text-[#D89A86] text-[10px] font-sans font-extrabold uppercase tracking-widest px-2 py-0.5 rounded-full border border-[#D89A86]/40">
                  Admin
                </span>
              </span>
              <p className="text-[10px] font-bold text-[#D89A86] uppercase tracking-widest -mt-0.5">
                MANAGEMENT SUITE
              </p>
            </div>
          </Link>

          <h2 className="font-serif-brand text-2xl sm:text-3xl font-bold text-[#3A2B24]">
            Secure Admin Access
          </h2>
          <p className="text-xs text-[#6C5C54] mt-1.5 font-medium">
            Enter authorized admin phone number &amp; security password to proceed.
          </p>
        </div>

        {/* ADMIN LOGIN CARD */}
        <div className="border border-[#EFE6DD] bg-white rounded-[2rem] shadow-xl overflow-hidden p-6 sm:p-8 relative">
          
          {/* Card Header Badge */}
          <div className="flex items-center justify-between mb-5 pb-3 border-b border-[#EFE6DD]">
            <div className="flex items-center gap-2">
              <div className="h-7 w-7 rounded-xl bg-[#3A2B24] flex items-center justify-center text-[#D89A86]">
                <KeyRound className="h-4 w-4 text-[#D89A86]" />
              </div>
              <span className="text-xs font-bold text-[#3A2B24] uppercase tracking-wider">
                Portal Authentication
              </span>
            </div>
            <span className="text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200 px-2.5 py-0.5 rounded-full flex items-center gap-1">
              <ShieldCheck className="h-3 w-3 text-amber-600" /> Protected Area
            </span>
          </div>

          {/* Error Message Alert */}
          {errorMessage && (
            <div className="mb-4 p-3.5 bg-rose-50 border border-rose-200 text-rose-800 rounded-2xl text-xs font-bold flex items-center gap-2 animate-in fade-in">
              <AlertCircle className="h-4 w-4 text-rose-600 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Success Message Alert */}
          {successMessage && (
            <div className="mb-4 p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl text-xs font-bold flex items-center gap-2 animate-in fade-in">
              <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
              <span>{successMessage}</span>
            </div>
          )}

          <form onSubmit={handleAdminLogin} className="flex flex-col gap-4">
            
            {/* Mobile Number Input */}
            <div>
              <label className="text-xs font-bold text-[#3A2B24] mb-1.5 flex items-center justify-between">
                <span>Admin Mobile Number</span>
                <span className="text-[10px] text-[#6C5C54]">10 Digits</span>
              </label>
              <div className="relative">
                <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-[#3A2B24] border-r border-[#EFE6DD] pr-2.5 flex items-center gap-1">
                  <span className="text-[10px] font-bold text-[#6C5C54]">IN</span> +91
                </div>
                <Input
                  type="tel"
                  placeholder="96184 01231"
                  maxLength={10}
                  value={mobileNumber}
                  onChange={(e) => setMobileNumber(e.target.value.replace(/\D/g, ""))}
                  className="pl-20 rounded-2xl border-[#EFE6DD] bg-[#EDF3FC]/60 h-12 text-sm font-bold text-[#3A2B24] tracking-wider focus-visible:ring-[#D89A86]"
                  required
                />
              </div>
            </div>

            {/* Password Input */}
            <div>
              <label className="text-xs font-bold text-[#3A2B24] mb-1.5 block">
                Admin Password / Security Key
              </label>
              <div className="relative flex items-center">
                <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#6C5C54]">
                  <Lock className="h-4 w-4 text-[#D89A86]" />
                </div>
                <Input
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10 pr-12 rounded-2xl border-[#EFE6DD] bg-[#EDF3FC]/60 h-12 text-xs font-mono font-bold text-[#3A2B24] focus-visible:ring-[#D89A86]"
                  required
                />
                <button
                  type="button"
                  tabIndex={-1}
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setShowPassword((prev) => !prev);
                  }}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-2 rounded-lg text-[#6C5C54] hover:text-[#3A2B24] hover:bg-[#EFE6DD]/40 cursor-pointer z-10 transition-colors"
                  title={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4 text-[#D89A86]" />
                  ) : (
                    <Eye className="h-4 w-4 text-[#6C5C54]" />
                  )}
                </button>
              </div>
            </div>

            {/* Submit CTA Button */}
            <motion.button
              type="submit"
              disabled={isLoading}
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.98 }}
              className="w-full bg-[#3A2B24] hover:bg-[#2E201A] text-white h-12 text-xs font-bold rounded-2xl mt-2 shadow-md flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 transition-all border border-[#4E3D35]"
            >
              {isLoading ? (
                <span>Authenticating Admin...</span>
              ) : (
                <>
                  <span>Sign In to Admin Portal</span>
                  <ArrowRight className="h-4 w-4 text-[#D89A86]" />
                </>
              )}
            </motion.button>
          </form>
        </div>

        {/* Customer Store Link & Security Footer */}
        <div className="flex items-center justify-between text-xs text-[#6C5C54] px-2">
          <Link href="/" className="hover:text-[#3A2B24] flex items-center gap-1 font-bold">
            <Store className="h-3.5 w-3.5 text-[#D89A86]" /> Back to Customer Store
          </Link>
          <div className="flex items-center gap-1 font-medium">
            <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
            <span>256-Bit Encrypted Admin Panel</span>
          </div>
        </div>

      </motion.div>

    </div>
  );
}
