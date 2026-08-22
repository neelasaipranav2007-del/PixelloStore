"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { 
  Heart, 
  Lock, 
  Phone, 
  ArrowRight, 
  Eye, 
  EyeOff, 
  AlertCircle, 
  Sparkles, 
  KeyRound,
  GraduationCap,
  Trophy,
  CheckCircle2,
  ExternalLink,
  ShieldCheck,
  Store,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

const PRESET_AMBASSADORS = [
  { name: "Sree Charani", phone: "9493837127", pin: "1234", college: "Aurora University", promo: "SREE20" },
  { name: "Sai Rohan", phone: "9618401231", pin: "1234", college: "Aurora University", promo: "SAIROHAN10" },
  { name: "Aryan Verma", phone: "9812345678", pin: "1234", college: "IIT Bombay", promo: "ARYAN20" },
  { name: "Vyshu", phone: "9059448213", pin: "1234", college: "Sreenidhii Engg", promo: "VYSHU10" },
];

export default function AmbassadorLoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectParam = searchParams.get("redirect");

  const [mobileNumber, setMobileNumber] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    if (typeof window !== "undefined") {
      const token = localStorage.getItem("pixello_ambassador_token");
      if (token) {
        // Silently verify if existing session is still valid
        fetch("/api/ambassador/me", {
          headers: { Authorization: `Bearer ${token}` },
        })
          .then((res) => res.json())
          .then((data) => {
            if (data.success && data.ambassador) {
              router.replace(redirectParam || "/ambassador");
            } else {
              localStorage.removeItem("pixello_ambassador_authenticated");
              localStorage.removeItem("pixello_ambassador_token");
              localStorage.removeItem("pixello_ambassador_profile");
            }
          })
          .catch(() => {
            localStorage.removeItem("pixello_ambassador_authenticated");
            localStorage.removeItem("pixello_ambassador_token");
            localStorage.removeItem("pixello_ambassador_profile");
          });
      } else {
        localStorage.removeItem("pixello_ambassador_authenticated");
      }
    }
  }, [router, redirectParam]);

  const handleQuickFill = (item: typeof PRESET_AMBASSADORS[0]) => {
    setMobileNumber(item.phone);
    setPassword(item.pin);
    setErrorMessage("");
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLoading) return;

    setErrorMessage("");
    setSuccessMessage("");

    const cleanMobile = mobileNumber.replace(/\D/g, "").slice(-10);
    const cleanPass = password.trim();

    if (!cleanMobile || cleanMobile.length < 10) {
      setErrorMessage("Please enter a valid 10-digit Ambassador mobile number!");
      return;
    }

    if (!cleanPass) {
      setErrorMessage("Please enter your security password or PIN!");
      return;
    }

    setIsLoading(true);

    try {
      const res = await fetch("/api/ambassador/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phone: cleanMobile,
          password: cleanPass,
          pin: cleanPass,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        setIsLoading(false);
        setErrorMessage(data.error || "Ambassador verification failed. Please check credentials.");
        return;
      }

      // Success: persist ambassador auth state
      if (typeof window !== "undefined") {
        localStorage.setItem("pixello_ambassador_authenticated", "true");
        if (data.token) {
          localStorage.setItem("pixello_ambassador_token", data.token);
          localStorage.setItem("pixello_auth_token", data.token);
        }
        if (data.ambassador) {
          localStorage.setItem("pixello_ambassador_profile", JSON.stringify(data.ambassador));
          localStorage.setItem("pixello_ambassador_promo_config", JSON.stringify({
            promoCode: data.ambassador.promoCode || "SREE20",
            baseUrl: "https://pixellostore.com/ref/",
            discountPercent: "10%",
            commissionPercent: "10%",
          }));
        }
        window.dispatchEvent(new Event("pixello_ambassador_authenticated"));
        window.dispatchEvent(new Event("pixello_ambassador_profile_updated"));
        window.dispatchEvent(new Event("storage"));
      }

      setSuccessMessage(`✓ Welcome back, ${data.ambassador?.name || "Ambassador"}! Opening Dashboard...`);

      setTimeout(() => {
        router.push(redirectParam || "/ambassador");
      }, 500);
    } catch (err: any) {
      setIsLoading(false);
      setErrorMessage("Network error connecting to Ambassador auth service. Please try again.");
    }
  };

  if (!isMounted) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#2E201A] via-[#3A2B24] to-[#241712] text-white flex flex-col justify-between py-8 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Background Glows */}
      <div className="absolute top-0 right-1/4 w-96 h-96 bg-[#D89A86]/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-1/4 w-96 h-96 bg-[#D89A86]/10 rounded-full blur-3xl pointer-events-none" />

      {/* Top Navbar */}
      <header className="w-full max-w-5xl mx-auto flex items-center justify-between z-10">
        <Link href="/" className="flex items-center gap-2 group cursor-pointer">
          <span className="font-serif-brand text-2xl font-bold text-white tracking-tight flex items-center gap-1.5">
            Pixello
            <span className="text-[#D89A86] font-sans text-xs font-bold uppercase tracking-wider bg-[#FFF8F2]/10 border border-[#D89A86]/40 px-2 py-0.5 rounded-full shadow-2xs">
              Campus
            </span>
          </span>
        </Link>
        <Link 
          href="/" 
          className="text-xs font-bold text-[#EFE6DD]/80 hover:text-white flex items-center gap-1.5 transition-colors bg-white/5 hover:bg-white/10 px-3.5 py-1.5 rounded-full border border-white/10"
        >
          <Store className="h-3.5 w-3.5 text-[#D89A86]" /> Return to Store
        </Link>
      </header>

      {/* Main Login Card */}
      <main className="w-full max-w-md mx-auto my-auto z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          className="bg-[#FFF8F2] rounded-3xl border border-[#EFE6DD] p-7 sm:p-9 shadow-2xl text-[#3A2B24]"
        >
          {/* Header */}
          <div className="text-center mb-6">
            <div className="mx-auto h-14 w-14 rounded-2xl bg-[#3A2B24] border border-[#4E3D35] flex items-center justify-center text-[#D89A86] mb-3.5 shadow-md">
              <GraduationCap className="h-7 w-7" />
            </div>
            <h1 className="font-serif-brand text-2xl sm:text-3xl font-bold text-[#3A2B24] tracking-tight">
              Ambassador Portal
            </h1>
            <p className="text-xs text-[#6C5C54] mt-1">
              Sign in with your registered phone number &amp; PIN
            </p>
          </div>

          {/* Error Message */}
          {errorMessage && (
            <motion.div 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              className="mb-5 p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold flex items-center gap-2"
            >
              <AlertCircle className="h-4 w-4 text-rose-600 flex-shrink-0" />
              <span>{errorMessage}</span>
            </motion.div>
          )}

          {/* Success Message */}
          {successMessage && (
            <motion.div 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              className="mb-5 p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center gap-2"
            >
              <CheckCircle2 className="h-4 w-4 text-emerald-600 flex-shrink-0" />
              <span>{successMessage}</span>
            </motion.div>
          )}

          {/* Login Form */}
          <form onSubmit={handleLogin} className="space-y-4">
            {/* Phone Number Field */}
            <div>
              <label className="block text-xs font-bold text-[#3A2B24] uppercase tracking-wider mb-1.5">
                Registered Mobile Number *
              </label>
              <div className="relative flex items-center">
                <div className="absolute left-3.5 flex items-center gap-1.5 pointer-events-none text-xs font-bold text-[#6C5C54] border-r border-[#EFE6DD] pr-2.5">
                  <Phone className="h-3.5 w-3.5 text-[#D89A86]" />
                  <span>+91</span>
                </div>
                <Input
                  type="tel"
                  maxLength={10}
                  placeholder="94938 37127"
                  value={mobileNumber}
                  onChange={(e) => setMobileNumber(e.target.value.replace(/\D/g, "").slice(0, 10))}
                  className="pl-20 h-12 rounded-2xl border-[#EFE6DD] bg-white text-sm font-bold text-[#3A2B24] focus-visible:ring-[#D89A86]"
                  required
                />
              </div>
            </div>

            {/* Password / PIN Field */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-bold text-[#3A2B24] uppercase tracking-wider">
                  Security Password / PIN *
                </label>
                <span className="text-[10px] text-[#D89A86] font-extrabold bg-[#FFF8F2] px-2 py-0.5 rounded-full border border-[#D89A86]/30">
                  Default: 1234
                </span>
              </div>
              <div className="relative flex items-center">
                <div className="absolute left-3.5 pointer-events-none">
                  <KeyRound className="h-4 w-4 text-[#6C5C54]" />
                </div>
                <Input
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter 4-digit PIN or Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10 pr-10 h-12 rounded-2xl border-[#EFE6DD] bg-white text-sm font-semibold text-[#3A2B24] focus-visible:ring-[#D89A86]"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 text-[#6C5C54] hover:text-[#3A2B24] cursor-pointer"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              disabled={isLoading}
              className="btn-pixello-primary w-full h-12 rounded-2xl text-xs font-bold shadow-md flex items-center justify-center gap-2 cursor-pointer mt-2"
            >
              {isLoading ? (
                <span>Authenticating Ambassador...</span>
              ) : (
                <>
                  <span>Sign In to Ambassador Dashboard</span>
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </Button>
          </form>

          {/* Quick Demo Credentials */}
          <div className="mt-6 pt-5 border-t border-[#EFE6DD]">
            <p className="text-[11px] font-bold text-[#6C5C54] uppercase tracking-wider mb-2.5 text-center flex items-center justify-center gap-1.5">
              <Trophy className="h-3.5 w-3.5 text-[#D89A86]" /> Approved Ambassador Profiles:
            </p>
            <div className="grid grid-cols-2 gap-2">
              {PRESET_AMBASSADORS.map((item) => (
                <button
                  key={item.name}
                  type="button"
                  onClick={() => handleQuickFill(item)}
                  className="p-2 bg-white hover:bg-[#FFF8F2] border border-[#EFE6DD] hover:border-[#D89A86]/60 rounded-xl text-left transition-all cursor-pointer shadow-2xs group"
                >
                  <p className="text-xs font-bold text-[#3A2B24] group-hover:text-[#D89A86]">{item.name}</p>
                  <p className="text-[10px] text-[#6C5C54] font-mono">{item.phone}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Application CTA */}
          <div className="mt-5 text-center">
            <p className="text-xs text-[#6C5C54]">
              Not an approved ambassador yet?
            </p>
            <a
              href="https://docs.google.com/forms/d/e/1FAIpQLSdlvg1_aoq6GwQM3rz8qhmvM5jxo6q-ldWZFgdqb9R5dV6Hrw/viewform"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-xs font-bold text-[#D89A86] hover:underline mt-1 cursor-pointer"
            >
              Apply via Google Form <ExternalLink className="h-3 w-3" />
            </a>
          </div>
        </motion.div>
      </main>

      {/* Footer */}
      <footer className="w-full max-w-5xl mx-auto text-center text-[11px] text-[#EFE6DD]/60 z-10">
        Pixello Store &bull; Campus Ambassador Network &bull; Secure Authentication
      </footer>
    </div>
  );
}
