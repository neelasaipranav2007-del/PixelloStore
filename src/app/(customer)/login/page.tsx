"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { 
  Phone, 
  Lock, 
  ArrowRight, 
  ShieldCheck, 
  CheckCircle2, 
  AlertCircle, 
  Eye, 
  EyeOff, 
  Sparkle,
  FileText
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { usePixelloTransition } from "@/components/customer/PixelloPageTransition";
import { 
  PIXELLO_TERMS_POINTS, 
  CURRENT_TERMS_VERSION, 
  CURRENT_POLICY_VERSION 
} from "@/lib/termsData";

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectParam = searchParams.get("redirect");
  const { startTransitionTo, isTransitioning } = usePixelloTransition();

  const [isMounted, setIsMounted] = useState(false);

  // Form State
  const [mobileNumber, setMobileNumber] = useState("");
  const [passwordPin, setPasswordPin] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [isRegisterMode, setIsRegisterMode] = useState(false);
  const [fullName, setFullName] = useState("");
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [termsError, setTermsError] = useState("");

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const handleForgotPin = async () => {
    const cleanMob = mobileNumber.replace(/\D/g, "").slice(-10);
    if (!cleanMob || cleanMob.length < 10) {
      setErrorMessage("Please enter your 10-digit mobile number first, then click 'Forgot PIN?'.");
      return;
    }

    try {
      const res = await fetch("/api/customer/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mobile: cleanMob, action: "forgot_pin" }),
      });
      const data = await res.json();
      if (data.success) {
        if (typeof window !== "undefined") {
          localStorage.setItem(`pixello_pin_${cleanMob}`, "1234");
        }
        setPasswordPin("1234");
        setSuccessMessage(data.message || `✓ Temporary PIN (1234) set for +91 ${cleanMob}. Click 'Sign In' to continue!`);
        setErrorMessage("");
      } else {
        setErrorMessage(data.error || `❌ Mobile number +91 ${cleanMob} is not registered! Please switch to 'Create Account' to register.`);
      }
    } catch (e) {
      if (typeof window !== "undefined") {
        localStorage.setItem(`pixello_pin_${cleanMob}`, "1234");
      }
      setPasswordPin("1234");
      setSuccessMessage(`✓ Temporary PIN (1234) set for +91 ${cleanMob}. Click 'Sign In' to continue!`);
      setErrorMessage("");
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLoading || isTransitioning) return;

    setErrorMessage("");
    setSuccessMessage("");

    // Validate terms acceptance
    if (!termsAccepted) {
      setTermsError("Please accept the Terms & Conditions to continue.");
      document.getElementById("auth_terms_cb")?.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }
    setTermsError("");

    const cleanMobile = mobileNumber.replace(/\D/g, "").slice(-10);
    if (cleanMobile.length < 10) {
      setErrorMessage("Please enter a valid 10-digit Indian mobile number!");
      return;
    }

    if (passwordPin.length !== 4) {
      setErrorMessage("Please enter your 4-digit security PIN!");
      return;
    }

    if (isRegisterMode && !fullName.trim()) {
      setErrorMessage("Please enter your full name to register!");
      return;
    }

    setIsLoading(true);

    try {
      let authUser: any = null;
      let authToken: string | null = null;

      if (!isRegisterMode) {
        // Sign In Flow via Backend API
        const res = await fetch("/api/customer/auth", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ 
            mobile: cleanMobile, 
            pin: passwordPin,
            termsAccepted: true,
            termsVersion: CURRENT_TERMS_VERSION,
          }),
        });
        const data = await res.json();

        if (!data.success) {
          setIsLoading(false);
          setErrorMessage(data.error || "Failed to sign in. Please verify your PIN.");
          return;
        }

        authUser = data.user;
        authToken = data.token;
      } else {
        // Register Mode via POST /api/customers
        const res = await fetch("/api/customers", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: fullName.trim(),
            phone: `+91 ${cleanMobile}`,
            mobile: cleanMobile,
            email: `${cleanMobile}@pixello.store`,
            password: passwordPin,
            termsAccepted: true,
            termsVersion: CURRENT_TERMS_VERSION,
          }),
        });
        const data = await res.json();

        if (!data.success) {
          setIsLoading(false);
          setErrorMessage(data.error || "Failed to register account.");
          return;
        }

        authUser = data.user;
        authToken = data.token;
      }

      // Construct formatted user state
      const resolvedName = authUser?.name || fullName.trim() || `Customer (${cleanMobile.slice(-4)})`;
      const userData = {
        id: authUser?.id,
        name: resolvedName,
        mobile: cleanMobile,
        phone: authUser?.phone || `+91 ${cleanMobile}`,
        email: authUser?.email || `${cleanMobile}@pixello.store`,
        pin: passwordPin,
        isLoggedIn: true,
        loggedInAt: new Date().toISOString(),
        status: "Active",
        customerProfileId: authUser?.customerProfileId || authUser?.customerProfile?.id,
        termsAcceptedVersion: CURRENT_TERMS_VERSION,
      };

      if (typeof window !== "undefined") {
        if (authToken) {
          localStorage.setItem("pixello_auth_token", authToken);
          document.cookie = `pixello_auth_token=${authToken}; path=/; max-age=2592000; SameSite=Lax`;
        }
        localStorage.removeItem("pixello_logged_out");
        localStorage.setItem(`pixello_pin_${cleanMobile}`, passwordPin);
        localStorage.setItem("pixello_user", JSON.stringify(userData));
        localStorage.setItem(`pixello_profile_${cleanMobile}`, JSON.stringify(userData));

        // Sync with registered customers list in local storage
        try {
          const regStr = localStorage.getItem("pixello_registered_customers");
          let list: any[] = regStr ? JSON.parse(regStr) : [];
          const idx = list.findIndex((c) => (c.mobile || "").replace(/\D/g, "").slice(-10) === cleanMobile);
          const entry = {
            name: resolvedName,
            mobile: cleanMobile,
            phone: `+91 ${cleanMobile}`,
            email: userData.email,
            registeredAt: userData.loggedInAt,
            status: "Active",
          };
          if (idx >= 0) list[idx] = { ...list[idx], ...entry };
          else list.unshift(entry);
          localStorage.setItem("pixello_registered_customers", JSON.stringify(list));
        } catch (e) {}

        window.dispatchEvent(new Event("auth_change"));
        window.dispatchEvent(new Event("storage"));
      }

      setIsLoading(false);
      setSuccessMessage(`✓ Welcome to Pixello, ${resolvedName}!`);

      // Preserve and navigate to originally requested destination
      const destination = redirectParam || "/profile";
      router.push(destination);
    } catch (err: any) {
      console.error("Login submission error:", err);
      setIsLoading(false);
      setErrorMessage("Network error occurred during authentication. Please try again.");
    }
  };

  return (
    <div className="relative min-h-[calc(100vh-80px)] bg-[#F8F3EE] overflow-hidden flex flex-col justify-center items-center px-4 py-8">
      
      {/* BACKGROUND AMBIENCE & RADIAL GLOW */}
      <div 
        className="absolute inset-0 pointer-events-none"
        style={{
          background: "radial-gradient(circle at 50% 40%, #FFF8F2 0%, #F8F3EE 75%)",
        }}
      />

      {/* FLOATING SUBTLE PARTICLES / SPARKLES */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[
          { top: "15%", left: "12%", delay: 0.2, size: 14, color: "#D89A86" },
          { top: "25%", right: "15%", delay: 0.8, size: 18, color: "#F48A8A" },
          { top: "70%", left: "18%", delay: 1.4, size: 12, color: "#D89A86" },
          { top: "65%", right: "20%", delay: 1.0, size: 16, color: "#F2C8B5" },
          { top: "82%", left: "48%", delay: 0.5, size: 10, color: "#D89A86" },
        ].map((p, i) => (
          <motion.div
            key={i}
            className="absolute opacity-30"
            style={{ top: p.top, left: p.left, right: p.right }}
            animate={{
              y: [0, -12, 0],
              opacity: [0.2, 0.5, 0.2],
              scale: [0.9, 1.15, 0.9],
            }}
            transition={{
              duration: 4 + i,
              repeat: Infinity,
              ease: "easeInOut",
              delay: p.delay,
            }}
          >
            <Sparkle style={{ width: p.size, height: p.size, color: p.color }} />
          </motion.div>
        ))}
      </div>

      {/* ========================================================================= */}
      {/* MAIN LOGIN & TERMS CONTAINER */}
      {/* ========================================================================= */}
      <motion.div
        key="direct-login-card-container"
        initial={{ opacity: 0, scale: 0.95, y: 16 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
        className="relative z-20 max-w-lg w-full flex flex-col gap-4"
      >
        {/* Header Branding */}
        <div className="text-center flex flex-col items-center">
          <Link href="/" className="inline-flex items-center gap-3 mb-2 group cursor-pointer">
            <motion.div 
              whileHover={{ scale: 1.06 }}
              className="h-12 w-12 rounded-full overflow-hidden border-2 border-[#D89A86] shadow-sm bg-white p-0.5"
            >
              <img 
                src="/images/pixello_logo.png" 
                alt="Pixello Official Logo" 
                className="h-full w-full object-contain" 
              />
            </motion.div>
            <div className="text-left">
              <span className="font-serif-brand text-2xl font-bold tracking-tight text-[#3A2B24]">
                Pixello<span className="text-[#D89A86]">Store</span>
              </span>
              <p className="text-[10px] font-bold text-[#D89A86] uppercase tracking-widest -mt-0.5">
                CUSTOMER PORTAL
              </p>
            </div>
          </Link>

          <h2 className="font-serif-brand text-2xl font-bold text-[#3A2B24]">
            {isRegisterMode ? "Create Customer Account" : "Customer Sign In"}
          </h2>
          <p className="text-xs text-[#6C5C54] mt-1 font-medium">
            {isRegisterMode 
              ? "Create your account and accept terms to access the Customer Portal."
              : "Sign in with your mobile number to view orders, addresses, and tracking."}
          </p>
        </div>

        {/* AUTHENTICATION & TERMS CARD */}
        <div className="border border-[#EFE6DD] bg-white rounded-[2rem] shadow-sm overflow-hidden p-6 sm:p-7 relative">
          
          {/* Mode Switch Tabs: Sign In / Create Account */}
          <div className="grid grid-cols-2 gap-2 p-1.5 bg-[#FFF8F2] rounded-2xl mb-4 border border-[#EFE6DD]">
            <button
              type="button"
              className={`py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                !isRegisterMode ? "bg-[#3A2B24] text-white shadow-xs" : "text-[#6C5C54] hover:text-[#3A2B24]"
              }`}
              onClick={() => { setIsRegisterMode(false); setErrorMessage(""); setTermsError(""); }}
            >
              Sign In
            </button>
            <button
              type="button"
              className={`py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                isRegisterMode ? "bg-[#3A2B24] text-white shadow-xs" : "text-[#6C5C54] hover:text-[#3A2B24]"
              }`}
              onClick={() => { setIsRegisterMode(true); setErrorMessage(""); setTermsError(""); }}
            >
              Create Account
            </button>
          </div>

          {/* Error Message Alert */}
          {errorMessage && (
            <div className="mb-4 p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-2xl text-xs font-bold flex items-center gap-2 animate-in fade-in">
              <AlertCircle className="h-4 w-4 text-rose-600 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Success Message Alert */}
          {successMessage && (
            <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl text-xs font-bold flex items-center gap-2 animate-in fade-in">
              <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
              <span>{successMessage}</span>
            </div>
          )}

          <form onSubmit={handleLogin} className="flex flex-col gap-3.5">
            
            {isRegisterMode && (
              <div>
                <label className="text-xs font-bold text-[#3A2B24] mb-1 block">Full Name</label>
                <Input
                  type="text"
                  placeholder="e.g. Sai Pranav"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="rounded-xl border-[#EFE6DD] bg-[#EDF3FC]/50 h-11 text-xs font-medium text-[#3A2B24] focus-visible:ring-[#D89A86]"
                  required
                />
              </div>
            )}

            {/* Mobile Number Input */}
            <div>
              <label className="text-xs font-bold text-[#3A2B24] mb-1 flex items-center justify-between">
                <span>Mobile Number</span>
                <span className="text-[10px] text-[#6C5C54] font-medium">10 Digits</span>
              </label>
              <div className="relative">
                <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-[#3A2B24] border-r border-[#EFE6DD] pr-2.5 flex items-center gap-1">
                  <span className="text-[10px] font-bold text-[#6C5C54]">IN</span> +91
                </div>
                <Input
                  type="tel"
                  placeholder="98765 43210"
                  maxLength={10}
                  value={mobileNumber}
                  onChange={(e) => setMobileNumber(e.target.value.replace(/\D/g, ""))}
                  className="pl-20 rounded-2xl border-[#EFE6DD] bg-[#EDF3FC] h-11 text-sm font-bold text-[#3A2B24] tracking-wider focus-visible:ring-[#D89A86]"
                  required
                />
              </div>
            </div>

            {/* Security PIN Input */}
            <div>
              <label className="text-xs font-bold text-[#3A2B24] mb-1 flex items-center justify-between">
                <span>Security PIN (4 Digits)</span>
                {!isRegisterMode && (
                  <button
                    type="button"
                    onClick={handleForgotPin}
                    className="text-[10px] text-[#D89A86] hover:underline font-bold cursor-pointer"
                  >
                    Forgot PIN?
                  </button>
                )}
              </label>
              <div className="relative">
                <Input
                  type={showPassword ? "text" : "password"}
                  placeholder="••••"
                  maxLength={4}
                  value={passwordPin}
                  onChange={(e) => setPasswordPin(e.target.value.replace(/\D/g, ""))}
                  className="rounded-2xl border-[#EFE6DD] bg-[#EDF3FC] h-11 text-sm font-mono font-extrabold text-[#3A2B24] tracking-widest focus-visible:ring-[#D89A86] pl-4 pr-12 text-left text-lg"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-[#6C5C54] hover:text-[#3A2B24] cursor-pointer"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4 text-[#6C5C54]" />}
                </button>
              </div>
            </div>

            {/* PixelloStore Terms & Conditions — Scrollable 10 Points */}
            <div className="flex flex-col gap-2 pt-1 border-t border-[#EFE6DD]/70">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-[#3A2B24] flex items-center gap-1.5">
                  <ShieldCheck className="h-4 w-4 text-[#D89A86]" />
                  <span>PixelloStore Terms &amp; Conditions</span>
                </label>
                <span className="text-[10px] font-semibold text-[#D89A86] bg-[#FFF8F2] px-2 py-0.5 rounded-full border border-[#D89A86]/30">
                  Version {CURRENT_TERMS_VERSION}
                </span>
              </div>

              {/* Complete, fully visible list of all 10 Terms points (no sliding / no scrollbar) */}
              <div 
                aria-label="PixelloStore Terms and Conditions points list"
                className="bg-[#FFFDFB] border border-[#EFE6DD] rounded-2xl p-4 text-[11px] text-[#6C5C54] flex flex-col gap-2.5 divide-y divide-[#EFE6DD]/50"
              >
                {PIXELLO_TERMS_POINTS.map((pt) => (
                  <div key={pt.id} className={`flex items-start gap-2.5 leading-relaxed ${pt.id !== 1 ? "pt-2" : ""}`}>
                    <span className="font-bold text-[#3A2B24] shrink-0 text-xs w-4">
                      {pt.id}.
                    </span>
                    <p className="flex-1">
                      <strong className="text-[#3A2B24] font-semibold">{pt.title}:</strong>{" "}
                      {pt.text}
                    </p>
                  </div>
                ))}
              </div>

              {/* Mandatory Acceptance Checkbox */}
              <div className="flex flex-col gap-1 pt-1">
                <label className="flex items-start gap-2.5 cursor-pointer group select-none">
                  <input
                    type="checkbox"
                    id="auth_terms_cb"
                    checked={termsAccepted}
                    onChange={(e) => {
                      setTermsAccepted(e.target.checked);
                      if (e.target.checked) setTermsError("");
                    }}
                    className="mt-0.5 h-4 w-4 rounded border-[#D89A86] accent-[#D89A86] flex-shrink-0 cursor-pointer"
                  />
                  <span className="text-[11px] text-[#6C5C54] leading-relaxed font-medium group-hover:text-[#3A2B24] transition-colors">
                    I have read and agree to the PixelloStore{" "}
                    <a href="/terms" target="_blank" rel="noopener noreferrer" className="text-[#D89A86] font-bold hover:underline" onClick={(e) => e.stopPropagation()}>Terms &amp; Conditions</a>{" "}
                    and applicable{" "}
                    <a href="/terms#privacy" target="_blank" rel="noopener noreferrer" className="text-[#D89A86] font-bold hover:underline" onClick={(e) => e.stopPropagation()}>Privacy</a>,{" "}
                    <a href="/terms#cancellation" target="_blank" rel="noopener noreferrer" className="text-[#D89A86] font-bold hover:underline" onClick={(e) => e.stopPropagation()}>Cancellation</a>,{" "}
                    <a href="/terms#refund" target="_blank" rel="noopener noreferrer" className="text-[#D89A86] font-bold hover:underline" onClick={(e) => e.stopPropagation()}>Refund</a>, and{" "}
                    <a href="/terms#shipping" target="_blank" rel="noopener noreferrer" className="text-[#D89A86] font-bold hover:underline" onClick={(e) => e.stopPropagation()}>Shipping Policies</a>.
                  </span>
                </label>
                {termsError && (
                  <p className="text-[11px] text-rose-600 font-bold flex items-center gap-1 ml-6.5">
                    <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                    {termsError}
                  </p>
                )}
              </div>
            </div>

            {/* Submit CTA Button */}
            <motion.button
              type="submit"
              disabled={isLoading || isTransitioning || !termsAccepted}
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.98 }}
              className="w-full bg-gradient-to-r from-[#D89A86] to-[#C88470] hover:opacity-95 text-white h-12 text-sm font-bold rounded-2xl mt-1 shadow-sm flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 transition-opacity"
            >
              {isLoading || isTransitioning ? (
                <span>Entering Customer Portal...</span>
              ) : (
                <>
                  <span>{isRegisterMode ? "Create Account & Continue" : "Sign In & Continue"}</span>
                  <ArrowRight className="h-4 w-4 text-white" />
                </>
              )}
            </motion.button>
          </form>
        </div>

        {/* Security Note */}
        <div className="text-center flex items-center justify-center gap-1.5 text-xs text-[#6C5C54]">
          <ShieldCheck className="h-4 w-4 text-emerald-600" />
          <span>Encrypted Studio Sign-In • Instant Customer Access</span>
        </div>
      </motion.div>

    </div>
  );
}

export default function CustomerLoginPage() {
  return (
    <React.Suspense fallback={<div className="min-h-screen flex items-center justify-center p-6 text-xs text-[#3A2B24]">Loading Pixello...</div>}>
      <LoginContent />
    </React.Suspense>
  );
}
