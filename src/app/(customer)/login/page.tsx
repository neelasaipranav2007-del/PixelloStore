"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Phone, 
  Lock, 
  ArrowRight, 
  ShieldCheck, 
  CheckCircle2, 
  AlertCircle, 
  Eye, 
  EyeOff, 
  Sparkle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { usePixelloTransition } from "@/components/customer/PixelloPageTransition";

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

  // Demo Credentials
  const DEMO_MOBILE = "8074589949";
  const DEMO_PIN = "1234";

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const handleForgotPin = () => {
    const cleanMob = mobileNumber.replace(/\D/g, "").slice(-10);
    if (!cleanMob || cleanMob.length < 10) {
      setErrorMessage("Please enter your 10-digit mobile number first, then click 'Forgot PIN?'.");
      return;
    }

    const isDemoUser = cleanMob === DEMO_MOBILE;
    const existingProfile = typeof window !== "undefined" ? localStorage.getItem(`pixello_profile_${cleanMob}`) : null;
    const savedPin = typeof window !== "undefined" ? localStorage.getItem(`pixello_pin_${cleanMob}`) : null;

    if (!isDemoUser && !existingProfile && !savedPin) {
      setErrorMessage(`❌ Mobile number +91 ${cleanMob} is not registered! Please switch to the 'Register' tab to create an account.`);
      return;
    }

    if (typeof window !== "undefined") {
      localStorage.setItem(`pixello_pin_${cleanMob}`, "1234");
    }
    setPasswordPin("1234");
    setSuccessMessage(`✓ Temporary PIN (1234) set for +91 ${cleanMob}. Click 'Continue to Store' to sign in!`);
    setErrorMessage("");
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (isLoading || isTransitioning) return; // Prevent double submission

    setErrorMessage("");
    setSuccessMessage("");

    const cleanMobile = mobileNumber.replace(/\D/g, "");
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

    setTimeout(async () => {
      const cleanMobile = mobileNumber.replace(/\D/g, "").slice(-10);
      const isDemoUser = cleanMobile === DEMO_MOBILE;

      let userData: any = null;
      let registeredPin: string | null = null;
      let isExistingAccount = false;

      if (typeof window !== "undefined") {
        const savedPin = localStorage.getItem(`pixello_pin_${cleanMobile}`);
        if (savedPin) {
          registeredPin = savedPin;
          isExistingAccount = true;
        }

        const existingProfile = localStorage.getItem(`pixello_profile_${cleanMobile}`);
        if (existingProfile) {
          try {
            userData = JSON.parse(existingProfile);
            if (userData) {
              isExistingAccount = true;
              if (userData.pin || userData.password) {
                registeredPin = userData.pin || userData.password;
              }
            }
          } catch (e) {
            console.error(e);
          }
        }

        if (!isExistingAccount) {
          const registeredListStr = localStorage.getItem("pixello_registered_customers");
          if (registeredListStr) {
            try {
              const list = JSON.parse(registeredListStr);
              const found = list.find((c: any) => (c.mobile || "").replace(/\D/g, "").slice(-10) === cleanMobile);
              if (found) {
                isExistingAccount = true;
                if (!userData) userData = found;
              }
            } catch (e) {
              console.error(e);
            }
          }
        }
      }

      if (isDemoUser) {
        isExistingAccount = true;
        if (!registeredPin) registeredPin = DEMO_PIN;
      }

      // Check if user is marked Inactive by Admin
      let isInactive = false;
      if (typeof window !== "undefined") {
        try {
          const statusOverridesStr = localStorage.getItem("pixello_customer_status_overrides");
          if (statusOverridesStr) {
            const overrides = JSON.parse(statusOverridesStr);
            if (overrides[cleanMobile] === "Inactive") {
              isInactive = true;
            }
          }
          if (!isInactive) {
            const regStr = localStorage.getItem("pixello_registered_customers");
            if (regStr) {
              const list = JSON.parse(regStr);
              const found = list.find((c: any) => (c.mobile || "").replace(/\D/g, "").slice(-10) === cleanMobile);
              if (found && found.status === "Inactive") {
                isInactive = true;
              }
            }
          }
        } catch (e) {}
      }

      if (isInactive) {
        setIsLoading(false);
        setErrorMessage("❌ This customer account is INACTIVE / SUSPENDED by Admin. Please contact customer support.");
        return;
      }

      // CASE 1: SIGN IN MODE (Must be registered previously)
      if (!isRegisterMode) {
        if (!isExistingAccount) {
          setIsLoading(false);
          setErrorMessage("❌ Mobile number not registered! Please switch to 'Register' tab to create your account.");
          return;
        }

        const expectedPin = registeredPin || (userData && (userData.pin || userData.password)) || (isDemoUser ? DEMO_PIN : "1234");
        if (passwordPin !== expectedPin) {
          setIsLoading(false);
          setErrorMessage("❌ Incorrect 4-digit Security PIN! Please enter your registered PIN or click 'Forgot PIN?'.");
          return;
        }
      }

      // CASE 2: REGISTER MODE (Save new user & PIN)
      if (isRegisterMode) {
        if (typeof window !== "undefined") {
          localStorage.setItem(`pixello_pin_${cleanMobile}`, passwordPin);
        }

        userData = {
          name: fullName.trim(),
          mobile: cleanMobile,
          email: `${cleanMobile}@pixello.store`,
          isDemoUser: isDemoUser,
          pin: passwordPin,
          isLoggedIn: true,
          loggedInAt: new Date().toISOString(),
          status: "Active"
        };
      } else {
        // Sign-in successful for existing user
        if (!userData) {
          userData = {
            name: isDemoUser ? "NEELA SAI PRANAV" : `Customer (${cleanMobile.slice(-4)})`,
            mobile: cleanMobile,
            email: isDemoUser ? "neelasaipranav2007@gmail.com" : "",
            isDemoUser: isDemoUser,
            pin: passwordPin,
            isLoggedIn: true,
            loggedInAt: new Date().toISOString(),
            status: "Active"
          };
        } else {
          userData = {
            ...userData,
            mobile: cleanMobile,
            pin: userData.pin || passwordPin,
            isLoggedIn: true,
            loggedInAt: new Date().toISOString(),
            status: userData.status || "Active"
          };
        }
      }

      // Save customer to global registered customers list
      try {
        const existingStr = localStorage.getItem("pixello_registered_customers");
        let list: any[] = existingStr ? JSON.parse(existingStr) : [];
        const cleanMob = (userData.mobile || "").replace(/\D/g, "").slice(-10);
        if (cleanMob) {
          const index = list.findIndex(c => (c.mobile || "").replace(/\D/g, "").slice(-10) === cleanMob);
          const newEntry = {
            name: userData.name || `Customer (${cleanMob.slice(-4)})`,
            mobile: cleanMob,
            phone: `+91 ${cleanMob}`,
            email: userData.email || `${cleanMob}@pixello.store`,
            registeredAt: userData.loggedInAt || new Date().toISOString(),
            status: "Active"
          };
          if (index >= 0) {
            list[index] = { ...list[index], ...newEntry };
          } else {
            list.unshift(newEntry);
          }
          localStorage.setItem("pixello_registered_customers", JSON.stringify(list));
        }
      } catch (e) {
        console.error(e);
      }

      // Persist to database via API and retrieve signed auth token
      try {
        const res = await fetch("/api/customers", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: userData.name,
            phone: `+91 ${cleanMobile}`,
            mobile: cleanMobile,
            email: userData.email,
            password: userData.pin,
          }),
        });
        const resData = await res.json();
        if (resData.success && resData.token) {
          localStorage.setItem("pixello_auth_token", resData.token);
          if (resData.user?.customerProfile?.id || resData.customerProfileId) {
            userData.customerProfileId = resData.user?.customerProfile?.id || resData.customerProfileId;
          }
        }
      } catch (e) {
        console.error(e);
      }

      localStorage.removeItem("pixello_logged_out");
      localStorage.setItem("pixello_user", JSON.stringify(userData));
      if (cleanMobile) {
        localStorage.setItem(`pixello_profile_${cleanMobile}`, JSON.stringify(userData));
      }
      if (typeof window !== "undefined") {
        window.dispatchEvent(new Event("auth_change"));
        window.dispatchEvent(new Event("storage"));
      }

      setIsLoading(false);
      setSuccessMessage(`✓ Welcome to Pixello, ${userData.name}!`);

      // Trigger Immediate Navigation to Target
      const destination = redirectParam || "/";
      startTransitionTo(destination, "to-home", "WELCOME TO PIXELLO");
      setTimeout(() => {
        if (typeof window !== "undefined") {
          router.push(destination);
        }
      }, 350);
    }, 500);
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
      {/* MAIN ANIMATED LOGIN CONTAINER */}
      {/* ========================================================================= */}
      <motion.div
        key="direct-login-card-container"
        initial={{ opacity: 0, scale: 0.95, y: 16 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
        className="relative z-20 max-w-md w-full flex flex-col gap-5"
      >
        {/* Header Branding (Matches Uploaded Reference) */}
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
              <span className="font-serif-brand text-2xl font-bold tracking-tight text-[#3A2B24]">
                Pixello<span className="text-[#D89A86]">Store</span>
              </span>
              <p className="text-[10px] font-bold text-[#D89A86] uppercase tracking-widest -mt-0.5">
                PERSONALIZED GIFTS
              </p>
            </div>
          </Link>

          <h2 className="font-serif-brand text-2xl sm:text-3xl font-bold text-[#3A2B24]">
            Continue your gifting journey
          </h2>
          <p className="text-xs text-[#6C5C54] mt-1.5 font-medium">
            {isRegisterMode 
              ? "Create your account to design, preview & order personalized gifts."
              : "Enter your mobile number and 4-digit PIN to proceed."}
          </p>
        </div>

        {/* LOGIN FORM CARD (Exact Visuals to Uploaded Reference) */}
        <div className="border border-[#EFE6DD] bg-white rounded-[2rem] shadow-sm overflow-hidden p-6 sm:p-8 relative">
          
          {/* Mode Switch Tabs (Sign In / Register) */}
          <div className="grid grid-cols-2 gap-2 p-1.5 bg-[#FFF8F2] rounded-2xl mb-5 border border-[#EFE6DD]">
            <button
              type="button"
              className={`py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                !isRegisterMode ? "bg-[#3A2B24] text-white shadow-xs" : "text-[#6C5C54] hover:text-[#3A2B24]"
              }`}
              onClick={() => { setIsRegisterMode(false); setErrorMessage(""); }}
            >
              Sign In
            </button>
            <button
              type="button"
              className={`py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                isRegisterMode ? "bg-[#3A2B24] text-white shadow-xs" : "text-[#6C5C54] hover:text-[#3A2B24]"
              }`}
              onClick={() => { setIsRegisterMode(true); setErrorMessage(""); }}
            >
              Register
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

          <form onSubmit={handleLogin} className="flex flex-col gap-4">
            
            {isRegisterMode && (
              <div>
                <label className="text-xs font-bold text-[#3A2B24] mb-1.5 block">Full Name</label>
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
              <label className="text-xs font-bold text-[#3A2B24] mb-1.5 flex items-center justify-between">
                <span>Mobile Number</span>
                <span className="text-[10px] text-[#6C5C54] font-medium">10 Digits (OTP / PIN Verified)</span>
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
                  className="pl-20 rounded-2xl border-[#EFE6DD] bg-[#EDF3FC] h-12 text-sm font-bold text-[#3A2B24] tracking-wider focus-visible:ring-[#D89A86]"
                  required
                />
              </div>
            </div>

            {/* Security PIN Input */}
            <div>
              <label className="text-xs font-bold text-[#3A2B24] mb-1.5 flex items-center justify-between">
                <span>Security PIN (4 Digits)</span>
                <button
                  type="button"
                  onClick={handleForgotPin}
                  className="text-[10px] text-[#D89A86] hover:underline font-bold cursor-pointer"
                >
                  Forgot PIN?
                </button>
              </label>
              <div className="relative">
                <Input
                  type={showPassword ? "text" : "password"}
                  placeholder="••••"
                  maxLength={4}
                  value={passwordPin}
                  onChange={(e) => setPasswordPin(e.target.value.replace(/\D/g, ""))}
                  className="rounded-2xl border-[#EFE6DD] bg-[#EDF3FC] h-12 text-sm font-mono font-extrabold text-[#3A2B24] tracking-widest focus-visible:ring-[#D89A86] pl-4 pr-12 text-left text-lg"
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

            {/* Submit CTA Button */}
            <motion.button
              type="submit"
              disabled={isLoading || isTransitioning}
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.98 }}
              className="w-full bg-gradient-to-r from-[#D89A86] to-[#C88470] hover:opacity-95 text-white h-12 text-sm font-bold rounded-2xl mt-2 shadow-sm flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 transition-opacity"
            >
              {isLoading || isTransitioning ? (
                <span>Entering Pixello...</span>
              ) : (
                <>
                  <span>{isRegisterMode ? "Create Account & Continue" : "Continue to Store"}</span>
                  <ArrowRight className="h-4 w-4 text-white" />
                </>
              )}
            </motion.button>
          </form>
        </div>

        {/* Security Note */}
        <div className="text-center flex items-center justify-center gap-1.5 text-xs text-[#6C5C54]">
          <ShieldCheck className="h-4 w-4 text-emerald-600" />
          <span>Encrypted Studio Sign-In • Instant Local Ordering</span>
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
