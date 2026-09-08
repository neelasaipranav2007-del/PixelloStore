"use client";

import React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Camera, ShieldCheck, Heart, ArrowLeft, Clock, Store } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function StudioClosedPage() {
  return (
    <div className="min-h-[calc(100vh-120px)] bg-[#F8F3EE] flex flex-col items-center justify-center px-4 py-12 relative overflow-hidden font-sans">
      {/* Background Radial Soft Ambient Glow */}
      <div 
        className="absolute inset-0 pointer-events-none"
        style={{
          background: "radial-gradient(circle at 50% 45%, #FFF8F2 0%, #F8F3EE 70%)",
        }}
      />

      {/* Main Pixello Themed Closure Card */}
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 16 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
        className="relative z-10 max-w-lg w-full bg-white rounded-[2.5rem] border border-[#EFE6DD] shadow-lg overflow-hidden p-8 sm:p-10 flex flex-col items-center text-center"
      >
        {/* Brand Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="h-12 w-12 rounded-full overflow-hidden border-2 border-[#D89A86] shadow-sm bg-white p-0.5">
            <img 
              src="/images/pixello_logo.png" 
              alt="Pixello Store Logo" 
              className="h-full w-full object-contain" 
            />
          </div>
          <div className="text-left">
            <span className="font-serif-brand text-2xl font-bold tracking-tight text-[#3A2B24]">
              Pixello<span className="text-[#D89A86]">Store</span>
            </span>
            <p className="text-[10px] font-bold text-[#D89A86] uppercase tracking-widest -mt-0.5">
              STUDIO & CRAFTING PORTAL
            </p>
          </div>
        </div>

        {/* Animated Camera / Studio Icon Circle */}
        <div className="relative mb-6">
          <div className="h-24 w-24 rounded-full bg-[#FFF8F2] border-2 border-[#D89A86]/40 flex items-center justify-center text-[#D89A86] shadow-md">
            <Camera className="h-12 w-12 text-[#D89A86]" />
          </div>
          <span className="absolute -top-1 -right-1 bg-amber-500 text-white rounded-full p-1.5 shadow-sm">
            <Clock className="h-4 w-4" />
          </span>
        </div>

        {/* Closed Status Pill Badge */}
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-amber-50 border border-amber-200 text-amber-900 font-extrabold text-xs tracking-wider uppercase mb-5 shadow-2xs">
          <span className="h-2 w-2 rounded-full bg-amber-500 animate-pulse" />
          <span>TEMPORARILY CLOSED</span>
        </div>

        {/* Main Title & Messages */}
        <h1 className="font-serif-brand text-2xl sm:text-3xl font-bold text-[#3A2B24] tracking-tight mb-3">
          Studio Portal<br />Temporarily Closed
        </h1>

        <p className="text-sm font-semibold text-[#6C5C54] mb-2">
          Studio production & crafting operations are temporarily unavailable.
        </p>

        <p className="text-xs text-[#8C7A70] leading-relaxed max-w-sm mb-6">
          We&apos;re currently updating our studio production systems. Please check back later. Your orders, inventory data, and branch settings remain 100% safe.
        </p>

        {/* Safety & Reassurance Box */}
        <div className="w-full bg-[#FFF8F2] border border-[#EFE6DD] rounded-2xl p-4 mb-6 flex items-center gap-3 text-left">
          <ShieldCheck className="h-6 w-6 text-emerald-600 shrink-0" />
          <div className="text-xs">
            <span className="font-bold text-[#3A2B24] block">All Production Data Preserved</span>
            <span className="text-[#6C5C54] text-[11px]">
              Customer orders, previous lab prints, inventory stock, and studio profiles are safely stored.
            </span>
          </div>
        </div>

        {/* Return Button */}
        <Link href="/" className="w-full">
          <Button className="w-full bg-[#3A2B24] hover:bg-[#2E201A] text-white font-bold text-xs h-12 rounded-2xl shadow-sm flex items-center justify-center gap-2 cursor-pointer transition-all">
            <ArrowLeft className="h-4 w-4 text-[#D89A86]" />
            <span>Return to Pixello Main Store</span>
          </Button>
        </Link>
      </motion.div>

      {/* Footer Branding Subtext */}
      <p className="mt-8 text-[11px] font-medium text-[#8C7A70] flex items-center gap-1.5">
        <Heart className="h-3 w-3 text-[#F48A8A] fill-[#F48A8A]" /> PIXELLO STORE • FRAMES & MEMORIES
      </p>
    </div>
  );
}
