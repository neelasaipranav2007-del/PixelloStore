"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  Clock,
  Gift,
  Sparkles,
  PartyPopper,
  Copy,
  Check,
  X,
  ArrowRight,
  Heart,
  Cake,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  getBirthdayStatus,
  getUpcomingLovedOnesBirthdays,
  getActiveCelebrationTarget,
  shouldShowBirthdayCelebration,
  dismissBirthdayCelebration,
  BirthdayStatus,
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

  const targetTime = isToday ? bdayEnd.getTime() : nextBday.getTime();
  const diffMs = Math.max(0, targetTime - now.getTime());

  const totalSeconds = Math.floor(diffMs / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  return { hours, minutes, seconds };
}

export default function BirthdayCelebrationModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [isPreviewMode, setIsPreviewMode] = useState(false);
  const [activeTarget, setActiveTarget] = useState<ActiveCelebrationTarget | null>(null);
  const [timeLeft, setTimeLeft] = useState<TimeLeft>({ hours: 71, minutes: 59, seconds: 45 });
  const [copied, setCopied] = useState(false);

  // Synchronize customer profile, birthday status, and loved ones' statuses
  const checkBirthday = useCallback(() => {
    if (typeof window === "undefined") return;

    try {
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
          if (localLoved) {
            lovedOnes = JSON.parse(localLoved);
          }
        } catch (e) {}
      }

      const { shouldShow, target } = shouldShowBirthdayCelebration(rawBirthday, resolvedName, lovedOnes);
      setActiveTarget(target);

      if (target?.birthdayStr) {
        setTimeLeft(calculateTimeLeft(target.birthdayStr));
      }

      if (shouldShow && target) {
        setIsOpen(true);
      }
    } catch (e) {
      console.warn("Birthday sync check error:", e);
    }
  }, []);

  useEffect(() => {
    checkBirthday();

    // Listen to manual triggers from Profile page or store
    const handleManualOpen = (e: any) => {
      if (typeof window === "undefined") return;

      const detail = e?.detail;
      const savedUserStr = localStorage.getItem("pixello_user");
      const user = savedUserStr ? JSON.parse(savedUserStr) : {};
      const resolvedName = user.name || "Friend";
      const cleanMobile = (user.mobile || user.phone || "").replace(/\D/g, "").slice(-10);

      let lovedOnes: LovedOneBirthday[] = Array.isArray(user.lovedOnes) ? user.lovedOnes : [];
      if (cleanMobile) {
        try {
          const localLoved = localStorage.getItem(`pixello_loved_ones_${cleanMobile}`);
          if (localLoved) lovedOnes = JSON.parse(localLoved);
        } catch (err) {}
      }

      if (detail && detail.targetLovedOne) {
        // Preview specific loved one
        const lo: LovedOneBirthday = detail.targetLovedOne;
        const status = getBirthdayStatus(lo.birthday);
        setActiveTarget({
          type: "loved_one",
          name: lo.name,
          relationship: lo.relationship,
          birthdayStr: lo.birthday,
          status,
          lovedOneId: lo.id,
        });
        setTimeLeft(calculateTimeLeft(lo.birthday));
      } else if (detail && detail.targetSelf) {
        // Preview self
        const rawBirthday = user.birthday || user.dob;
        const tmr = new Date();
        tmr.setDate(tmr.getDate() + 1);
        const bdayStr = rawBirthday || tmr.toISOString().split("T")[0];
        const status = getBirthdayStatus(bdayStr);
        setActiveTarget({
          type: "self",
          name: resolvedName,
          birthdayStr: bdayStr,
          status,
        });
        setTimeLeft(calculateTimeLeft(bdayStr));
      } else {
        const target = getActiveCelebrationTarget(user.birthday || user.dob, resolvedName, lovedOnes);
        if (target) {
          setActiveTarget(target);
          setTimeLeft(calculateTimeLeft(target.birthdayStr));
        } else {
          const tmr = new Date();
          tmr.setDate(tmr.getDate() + 1);
          const bdayStr = tmr.toISOString().split("T")[0];
          setActiveTarget({
            type: "self",
            name: resolvedName,
            birthdayStr: bdayStr,
            status: getBirthdayStatus(bdayStr),
          });
          setTimeLeft(calculateTimeLeft(bdayStr));
        }
      }

      setIsPreviewMode(true);
      setIsOpen(true);
    };

    window.addEventListener("auth_change", checkBirthday);
    window.addEventListener("storage", checkBirthday);
    window.addEventListener("pixello_loved_ones_updated", checkBirthday);
    window.addEventListener("open_birthday_celebration_popup", handleManualOpen);

    return () => {
      window.removeEventListener("auth_change", checkBirthday);
      window.removeEventListener("storage", checkBirthday);
      window.removeEventListener("pixello_loved_ones_updated", checkBirthday);
      window.removeEventListener("open_birthday_celebration_popup", handleManualOpen);
    };
  }, [checkBirthday]);

  // Live ticking countdown timer
  useEffect(() => {
    if (!isOpen || !activeTarget?.birthdayStr) return;

    const interval = setInterval(() => {
      setTimeLeft(calculateTimeLeft(activeTarget.birthdayStr));
    }, 1000);

    return () => clearInterval(interval);
  }, [isOpen, activeTarget?.birthdayStr]);

  const handleClose = () => {
    if (activeTarget) {
      const key = activeTarget.type === "self" ? "self" : `loved_${activeTarget.lovedOneId}`;
      dismissBirthdayCelebration(key);
    }
    setIsPreviewMode(false);
    setIsOpen(false);
  };

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  if (!isOpen || !activeTarget || (!activeTarget.status.isWithin72Hours && !isPreviewMode)) {
    return null;
  }

  const isSelf = activeTarget.type === "self";
  const status = activeTarget.status;

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-[99999] flex items-center justify-center p-3 sm:p-5 bg-black/80 backdrop-blur-md overflow-y-auto animate-in fade-in duration-200"
      onClick={handleClose}
    >
      <div
        className="relative w-full max-w-xl bg-[#2C201C] rounded-3xl border border-[#3E2D27] shadow-2xl overflow-hidden flex flex-col my-auto text-white animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Subtle decorative background glows */}
        <div className="absolute top-0 right-0 w-72 h-72 bg-[#DC7C72]/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-72 h-72 bg-[#FDE047]/10 rounded-full blur-3xl pointer-events-none" />

        {/* Close Button */}
        <button
          type="button"
          onClick={handleClose}
          className="absolute top-4 right-4 h-9 w-9 rounded-full bg-white/10 hover:bg-white/20 text-[#C4B5AC] hover:text-white border border-white/10 flex items-center justify-center transition-colors cursor-pointer shadow-xs z-10"
          title="Close message"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="p-6 sm:p-8 text-center flex flex-col items-center relative z-10">
          {/* Ordering Deadline Active Badge */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-[#FCE182] text-[#2C201C] text-xs font-extrabold uppercase tracking-wider mb-4 shadow-sm">
            <Clock className="h-3.5 w-3.5 text-[#2C201C]" />
            <span>Ordering Deadline Active</span>
            {!isSelf && activeTarget.relationship && (
              <span className="text-[10px] font-bold opacity-80 border-l border-[#2C201C]/30 pl-2">
                {activeTarget.relationship}
              </span>
            )}
          </div>

          {/* Headline */}
          <h2 className="font-serif-brand text-2xl sm:text-3xl md:text-4xl font-bold text-white tracking-tight leading-tight mb-2">
            Birthday &amp; Anniversary Priority Gifting Express
          </h2>

          {/* Subtitle */}
          <p className="text-xs sm:text-sm text-[#C4B5AC] max-w-md leading-relaxed font-normal mb-5">
            {isSelf ? (
              status.isToday ? (
                <>
                  Today is your special day, <strong>{activeTarget.name}</strong>! Order before the priority deadline to guarantee custom engraving, laser prints, and on-time doorstep delivery.
                </>
              ) : (
                <>
                  Order before the deadline to guarantee custom engraving, laser prints, and on-time doorstep hostel delivery for your birthday!
                </>
              )
            ) : status.isToday ? (
              <>
                Today is <strong>{activeTarget.name}&apos;s ({activeTarget.relationship})</strong> birthday! Order before the priority deadline to guarantee custom engraving and on-time delivery.
              </>
            ) : (
              <>
                Order before the deadline to guarantee custom engraving, laser prints, and on-time doorstep hostel delivery for <strong>{activeTarget.name}&apos;s</strong> birthday!
              </>
            )}
          </p>

          {/* 3 Countdown Blocks: HOURS : MINS : SECS */}
          <div className="flex items-center gap-2 sm:gap-3 mb-6">
            {/* HOURS */}
            <div className="flex flex-col items-center justify-center bg-[#201511]/95 border border-white/10 rounded-2xl w-16 sm:w-18 h-18 sm:h-20 shadow-inner">
              <span className="font-mono text-2xl sm:text-3xl font-black text-[#FDE047] leading-none">
                {String(timeLeft.hours).padStart(2, "0")}
              </span>
              <span className="text-[9px] sm:text-[10px] font-bold text-[#A8988F] uppercase tracking-wider mt-1.5">
                HOURS
              </span>
            </div>

            <span className="font-mono text-2xl sm:text-3xl font-black text-[#FDE047] leading-none">:</span>

            {/* MINS */}
            <div className="flex flex-col items-center justify-center bg-[#201511]/95 border border-white/10 rounded-2xl w-16 sm:w-18 h-18 sm:h-20 shadow-inner">
              <span className="font-mono text-2xl sm:text-3xl font-black text-[#FDE047] leading-none">
                {String(timeLeft.minutes).padStart(2, "0")}
              </span>
              <span className="text-[9px] sm:text-[10px] font-bold text-[#A8988F] uppercase tracking-wider mt-1.5">
                MINS
              </span>
            </div>

            <span className="font-mono text-2xl sm:text-3xl font-black text-[#FDE047] leading-none">:</span>

            {/* SECS */}
            <div className="flex flex-col items-center justify-center bg-[#201511]/95 border border-white/10 rounded-2xl w-16 sm:w-18 h-18 sm:h-20 shadow-inner">
              <span className="font-mono text-2xl sm:text-3xl font-black text-[#FDE047] leading-none">
                {String(timeLeft.seconds).padStart(2, "0")}
              </span>
              <span className="text-[9px] sm:text-[10px] font-bold text-[#A8988F] uppercase tracking-wider mt-1.5">
                SECS
              </span>
            </div>
          </div>

          {/* Coupon Code Card */}
          <div className="w-full max-w-md p-4 rounded-2xl bg-white/5 border border-white/10 shadow-inner flex items-center justify-between gap-3 mb-6">
            <div className="text-left">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#FCE182] block">
                {isSelf ? "Exclusive Birthday Discount" : `Celebration Perk for ${activeTarget.name}`}
              </span>
              <span className="font-mono text-lg sm:text-xl font-black text-white tracking-wider">
                {status.couponCode}
              </span>
              <span className="text-[10px] text-emerald-400 block font-semibold">
                25% OFF Frames, Polaroids &amp; Hampers
              </span>
            </div>

            <Button
              size="sm"
              onClick={() => handleCopyCode(status.couponCode)}
              className="bg-[#DC7C72] hover:bg-[#CF6F65] text-white h-9 px-3.5 rounded-xl text-xs font-bold shadow-md cursor-pointer flex items-center gap-1.5 shrink-0"
            >
              {copied ? (
                <>
                  <Check className="h-3.5 w-3.5" /> Copied!
                </>
              ) : (
                <>
                  <Copy className="h-3.5 w-3.5" /> Copy BDAY25
                </>
              )}
            </Button>
          </div>

          {/* Action CTAs */}
          <div className="w-full grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-md">
            <Link
              href="/products"
              onClick={handleClose}
              className="w-full"
            >
              <button
                type="button"
                className="w-full bg-[#DC7C72] hover:bg-[#CF6F65] text-white font-bold text-sm h-12 rounded-full shadow-lg transition-transform active:scale-95 flex items-center justify-center gap-2 cursor-pointer"
              >
                <Gift className="h-4 w-4" />
                <span>Shop Birthday Gifts</span>
              </button>
            </Link>

            <Link
              href="/hamper"
              onClick={handleClose}
              className="w-full"
            >
              <button
                type="button"
                className="w-full bg-white/10 hover:bg-white/15 border border-white/20 text-white font-bold text-sm h-12 rounded-full transition-colors flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>Build Keepsake Hamper</span>
                <ArrowRight className="h-4 w-4" />
              </button>
            </Link>
          </div>

          {/* Dismiss Footer */}
          <button
            type="button"
            onClick={handleClose}
            className="text-[11px] text-[#A8988F] hover:text-white transition-colors mt-5 underline underline-offset-4 cursor-pointer"
          >
            Remind me later in 12 hours
          </button>
        </div>
      </div>
    </div>
  );
}
