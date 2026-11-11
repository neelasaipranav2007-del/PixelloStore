"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  Clock,
  Gift,
  X,
  Sparkles,
  Heart,
  PartyPopper,
  Copy,
  Check,
} from "lucide-react";
import {
  getBirthdayStatus,
  getUpcomingLovedOnesBirthdays,
  getActiveCelebrationTarget,
  LovedOneBirthday,
  ActiveCelebrationTarget,
} from "@/lib/birthdayHelper";

interface TimeLeft {
  hours: number;
  minutes: number;
  seconds: number;
}

function calculateTimeLeft(birthdayStr?: string): TimeLeft {
  if (!birthdayStr) return { hours: 71, minutes: 59, seconds: 45 };

  const clean = birthdayStr.trim();
  const parts = clean.split("-");
  let bMonth = 0;
  let bDay = 0;

  if (parts.length === 3) {
    bMonth = parseInt(parts[1], 10);
    bDay = parseInt(parts[2], 10);
  } else if (parts.length === 2) {
    bMonth = parseInt(parts[0], 10);
    bDay = parseInt(parts[1], 10);
  }

  if (!bMonth || !bDay || isNaN(bMonth) || isNaN(bDay)) {
    return { hours: 71, minutes: 59, seconds: 45 };
  }

  const now = new Date();
  const currentYear = now.getFullYear();

  let nextBday = new Date(currentYear, bMonth - 1, bDay, 0, 0, 0, 0);
  const bdayEnd = new Date(currentYear, bMonth - 1, bDay, 23, 59, 59, 999);
  const isToday = now.getMonth() === bMonth - 1 && now.getDate() === bDay;

  if (now > bdayEnd) {
    nextBday = new Date(currentYear + 1, bMonth - 1, bDay, 0, 0, 0, 0);
  }

  // If today is birthday, target the end of today; otherwise target midnight of birthday
  const targetTime = isToday ? bdayEnd.getTime() : nextBday.getTime();
  const diffMs = Math.max(0, targetTime - now.getTime());

  const totalSeconds = Math.floor(diffMs / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  return { hours, minutes, seconds };
}

export function BirthdayReminderMessageBanner() {
  const [activeTarget, setActiveTarget] = useState<ActiveCelebrationTarget | null>(null);
  const [isDismissed, setIsDismissed] = useState(false);
  const [timeLeft, setTimeLeft] = useState<TimeLeft>({ hours: 71, minutes: 59, seconds: 45 });
  const [copied, setCopied] = useState(false);

  const checkCelebration = useCallback(() => {
    if (typeof window === "undefined") return;

    try {
      const isBannerDismissed = sessionStorage.getItem("pixello_bday_banner_dismissed");
      if (isBannerDismissed === "true") {
        setIsDismissed(true);
      }

      const savedUserStr = localStorage.getItem("pixello_user");
      if (!savedUserStr) {
        setActiveTarget(null);
        return;
      }

      const user = JSON.parse(savedUserStr);
      if (!user.isLoggedIn && !user.phone) {
        setActiveTarget(null);
        return;
      }

      const rawBirthday = user.birthday || user.dob || user.dateOfBirth;
      const resolvedName = user.name || "Friend";

      let lovedOnes: LovedOneBirthday[] = Array.isArray(user.lovedOnes) ? user.lovedOnes : [];
      const cleanMobile = (user.mobile || user.phone || "").replace(/\D/g, "").slice(-10);
      if (cleanMobile) {
        try {
          const localLoved = localStorage.getItem(`pixello_loved_ones_${cleanMobile}`);
          if (localLoved) lovedOnes = JSON.parse(localLoved);
        } catch (e) {}
      }

      const target = getActiveCelebrationTarget(rawBirthday, resolvedName, lovedOnes);
      setActiveTarget(target);

      if (target?.birthdayStr) {
        setTimeLeft(calculateTimeLeft(target.birthdayStr));
      }
    } catch (err) {
      console.warn("Celebration banner sync error:", err);
    }
  }, []);

  useEffect(() => {
    checkCelebration();

    window.addEventListener("auth_change", checkCelebration);
    window.addEventListener("storage", checkCelebration);
    window.addEventListener("pixello_loved_ones_updated", checkCelebration);

    return () => {
      window.removeEventListener("auth_change", checkCelebration);
      window.removeEventListener("storage", checkCelebration);
      window.removeEventListener("pixello_loved_ones_updated", checkCelebration);
    };
  }, [checkCelebration]);

  // Live second-by-second countdown tick
  useEffect(() => {
    if (!activeTarget?.birthdayStr) return;

    const interval = setInterval(() => {
      setTimeLeft(calculateTimeLeft(activeTarget.birthdayStr));
    }, 1000);

    return () => clearInterval(interval);
  }, [activeTarget?.birthdayStr]);

  const handleDismiss = () => {
    setIsDismissed(true);
    if (typeof window !== "undefined") {
      sessionStorage.setItem("pixello_bday_banner_dismissed", "true");
    }
  };

  const handleOpenCelebrationModal = () => {
    if (typeof window !== "undefined" && activeTarget) {
      if (activeTarget.type === "loved_one") {
        window.dispatchEvent(
          new CustomEvent("open_birthday_celebration_popup", {
            detail: {
              targetLovedOne: {
                id: activeTarget.lovedOneId,
                name: activeTarget.name,
                relationship: activeTarget.relationship,
                birthday: activeTarget.birthdayStr,
              },
            },
          })
        );
      } else {
        window.dispatchEvent(
          new CustomEvent("open_birthday_celebration_popup", {
            detail: { targetSelf: true },
          })
        );
      }
    }
  };

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (isDismissed || !activeTarget || !activeTarget.status.isWithin72Hours) {
    return null;
  }

  const isSelf = activeTarget.type === "self";
  const status = activeTarget.status;

  return (
    <section className="container mx-auto px-4 md:px-6 pt-6 -mb-4 animate-in fade-in slide-in-from-top-4 duration-300">
      <div className="relative overflow-hidden rounded-3xl bg-[#2C201C] border border-[#3E2D27] p-6 sm:p-8 md:p-10 shadow-2xl text-white">
        {/* Subtle decorative background glow */}
        <div className="absolute top-0 right-0 w-80 h-80 bg-[#DC7C72]/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-[#FDE047]/5 rounded-full blur-3xl pointer-events-none" />

        {/* Close Button */}
        <button
          type="button"
          onClick={handleDismiss}
          className="absolute top-4 right-4 h-8 w-8 rounded-full bg-white/10 hover:bg-white/20 text-[#C4B5AC] hover:text-white flex items-center justify-center transition-colors cursor-pointer z-10"
          title="Dismiss reminder"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6 lg:gap-8">
          {/* Left Column: Yellow Badge + Serif Headline + Subtitle */}
          <div className="flex-1 max-w-2xl">
            {/* Ordering Deadline Active Badge */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-[#FCE182] text-[#2C201C] text-xs font-extrabold shadow-sm">
              <Clock className="h-3.5 w-3.5 text-[#2C201C]" />
              <span>Ordering Deadline Active</span>
              {!isSelf && activeTarget.relationship && (
                <span className="text-[10px] font-bold opacity-80 border-l border-[#2C201C]/30 pl-2">
                  {activeTarget.relationship}
                </span>
              )}
            </div>

            {/* Headline */}
            <h2 className="font-serif-brand text-2xl sm:text-3xl md:text-4xl font-bold text-white tracking-tight leading-tight mt-3 mb-2">
              Birthday &amp; Anniversary Priority Gifting Express
            </h2>

            {/* Subtitle */}
            <p className="text-xs sm:text-sm text-[#C4B5AC] max-w-xl leading-relaxed font-normal">
              {isSelf ? (
                status.isToday ? (
                  <>
                    Today is your birthday, <strong>{activeTarget.name}</strong>! Order now to guarantee custom engraving, laser prints, and on-time doorstep hostel delivery with code <span className="font-mono text-[#FDE047] font-bold">BDAY25</span> (25% OFF).
                  </>
                ) : (
                  <>
                    Order before the deadline to guarantee custom engraving, laser prints, and on-time doorstep hostel delivery for your upcoming birthday celebration!
                  </>
                )
              ) : status.isToday ? (
                <>
                  Today is <strong>{activeTarget.name}&apos;s ({activeTarget.relationship})</strong> birthday! Order before the priority deadline to guarantee custom engraving and on-time doorstep delivery.
                </>
              ) : (
                <>
                  Order before the deadline to guarantee custom engraving, laser prints, and on-time doorstep hostel delivery for <strong>{activeTarget.name}&apos;s ({activeTarget.relationship})</strong> birthday!
                </>
              )}
            </p>

            {/* Optional Coupon Code pill */}
            <div className="mt-3 flex items-center gap-2 text-xs">
              <span className="text-[#C4B5AC] text-[11px]">Exclusive Celebration Code:</span>
              <button
                type="button"
                onClick={() => handleCopyCode(status.couponCode)}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/15 border border-white/15 text-[#FDE047] font-mono font-bold text-xs cursor-pointer transition-colors"
                title="Click to copy coupon code"
              >
                <span>{status.couponCode}</span>
                {copied ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3 opacity-70" />}
                <span className="text-[10px] text-white/80 font-sans font-normal">(25% OFF)</span>
              </button>
            </div>
          </div>

          {/* Right Column: 3 Countdown Blocks + Salmon/Coral CTA Button */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-6 self-start lg:self-center">
            {/* Countdown Blocks (HOURS : MINS : SECS) */}
            <div className="flex items-center gap-2 sm:gap-2.5">
              {/* HOURS */}
              <div className="flex flex-col items-center justify-center bg-[#201511]/90 border border-white/10 rounded-2xl w-14 sm:w-16 h-16 sm:h-18 shadow-inner">
                <span className="font-mono text-xl sm:text-2xl font-black text-[#FDE047] leading-none">
                  {String(timeLeft.hours).padStart(2, "0")}
                </span>
                <span className="text-[9px] sm:text-[10px] font-bold text-[#A8988F] uppercase tracking-wider mt-1">
                  HOURS
                </span>
              </div>

              <span className="font-mono text-xl sm:text-2xl font-black text-[#FDE047] leading-none">:</span>

              {/* MINS */}
              <div className="flex flex-col items-center justify-center bg-[#201511]/90 border border-white/10 rounded-2xl w-14 sm:w-16 h-16 sm:h-18 shadow-inner">
                <span className="font-mono text-xl sm:text-2xl font-black text-[#FDE047] leading-none">
                  {String(timeLeft.minutes).padStart(2, "0")}
                </span>
                <span className="text-[9px] sm:text-[10px] font-bold text-[#A8988F] uppercase tracking-wider mt-1">
                  MINS
                </span>
              </div>

              <span className="font-mono text-xl sm:text-2xl font-black text-[#FDE047] leading-none">:</span>

              {/* SECS */}
              <div className="flex flex-col items-center justify-center bg-[#201511]/90 border border-white/10 rounded-2xl w-14 sm:w-16 h-16 sm:h-18 shadow-inner">
                <span className="font-mono text-xl sm:text-2xl font-black text-[#FDE047] leading-none">
                  {String(timeLeft.seconds).padStart(2, "0")}
                </span>
                <span className="text-[9px] sm:text-[10px] font-bold text-[#A8988F] uppercase tracking-wider mt-1">
                  SECS
                </span>
              </div>
            </div>

            {/* Shop Birthday Gifts CTA Button */}
            <div className="flex items-center gap-2">
              <Link href="/products" className="shrink-0">
                <button
                  type="button"
                  className="bg-[#DC7C72] hover:bg-[#CF6F65] text-white font-bold text-sm sm:text-base px-6 sm:px-8 py-3.5 rounded-full shadow-lg hover:shadow-xl transition-all active:scale-95 whitespace-nowrap cursor-pointer flex items-center gap-2"
                >
                  <Gift className="h-4 w-4" />
                  <span>Shop Birthday Gifts</span>
                </button>
              </Link>

              {/* View Pop-up details icon button */}
              <button
                type="button"
                onClick={handleOpenCelebrationModal}
                className="h-12 w-12 rounded-full bg-white/10 hover:bg-white/20 border border-white/15 text-white flex items-center justify-center transition-colors cursor-pointer"
                title="View full celebration details"
              >
                <PartyPopper className="h-5 w-5 text-[#FDE047]" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
