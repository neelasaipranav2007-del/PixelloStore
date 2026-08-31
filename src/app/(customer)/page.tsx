"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowRight, MapPin, Camera, Truck, Gift, Heart, Sparkles, ShieldCheck, Award } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";
import { getHomepageStats, DEFAULT_HOMEPAGE_STATS, HomepageStatsConfig } from "@/lib/homepageStats";

export default function HomePage() {
  const [stats, setStats] = useState<HomepageStatsConfig>(DEFAULT_HOMEPAGE_STATS);

  useEffect(() => {
    setStats(getHomepageStats());

    const handleStatsUpdate = () => {
      setStats(getHomepageStats());
    };

    window.addEventListener("pixello_homepage_stats_updated", handleStatsUpdate);
    window.addEventListener("storage", handleStatsUpdate);
    return () => {
      window.removeEventListener("pixello_homepage_stats_updated", handleStatsUpdate);
      window.removeEventListener("storage", handleStatsUpdate);
    };
  }, []);

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      className="flex flex-col gap-10 pb-24 bg-[#F8F3EE]"
    >
      {/* HERO SECTION */}
      <section className="relative overflow-hidden bg-gradient-to-b from-[#FFF8F2] via-[#F8F3EE] to-[#F8F3EE] pt-12 pb-8">
        <div className="container mx-auto px-4 md:px-6 relative z-10">
          <div className="max-w-3xl mx-auto flex flex-col items-center text-center">

            {/* Hero Heading with Gentle Reveal */}
            <motion.h1 
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
              className="font-serif-brand text-5xl sm:text-6xl md:text-7xl font-bold tracking-tight text-[#3A2B24] mb-6 leading-[1.15]"
            >
              Every Memory Deserves a{" "}
              <span className="italic text-[#D89A86] font-normal underline decoration-[#F2C8B5] underline-offset-8">
                Beautiful Frame.
              </span>
            </motion.h1>
            
            {/* Hero Subtitle */}
            <motion.p 
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.25, ease: [0.16, 1, 0.3, 1] }}
              className="text-lg md:text-xl text-[#6C5C54] mb-10 max-w-xl leading-relaxed"
            >
              Turn your favorite moments into handcrafted photo frames, polaroids, and personalized gifts. Printed by your nearest verified local photo studio.
            </motion.p>
            
            {/* CTA Buttons */}
            <motion.div 
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4, ease: [0.16, 1, 0.3, 1] }}
              className="flex flex-col sm:flex-row items-center justify-center gap-4 w-full sm:w-auto"
            >
              <Link 
                href="/products"
                className="btn-pixello-primary text-lg h-14 px-10 flex items-center justify-center w-full sm:w-auto shadow-md hover:shadow-lg transition-all"
              >
                Order Now <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
              <a 
                href="https://docs.google.com/forms/d/e/1FAIpQLSdlvg1_aoq6GwQM3rz8qhmvM5jxo6q-ldWZFgdqb9R5dV6Hrw/viewform?usp=publish-editor"
                target="_blank"
                rel="noopener noreferrer"
                className="h-14 px-8 text-base font-semibold rounded-full border-2 border-[#D89A86]/40 text-[#3A2B24] hover:bg-[#FFF8F2] transition-all flex items-center justify-center w-full sm:w-auto"
              >
                Become Campus Ambassador
              </a>
            </motion.div>

            {/* Trust Badges */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.7, delay: 0.55 }}
              className="grid grid-cols-3 gap-6 mt-12 pt-8 border-t border-[#EFE6DD] text-center w-full max-w-md"
            >
              <div>
                <div className="font-bold text-2xl text-[#3A2B24]">{stats.stat1Value}</div>
                <div className="text-xs text-[#6C5C54]">{stats.stat1Label}</div>
              </div>
              <div>
                <div className="font-bold text-2xl text-[#3A2B24]">{stats.stat2Value}</div>
                <div className="text-xs text-[#6C5C54]">{stats.stat2Label}</div>
              </div>
              <div>
                <div className="font-bold text-2xl text-[#3A2B24]">{stats.stat3Value}</div>
                <div className="text-xs text-[#6C5C54]">{stats.stat3Label}</div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* CATEGORIES SECTION */}
      <section className="container mx-auto px-4 md:px-6">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-12">
          <div>
            <Badge className="mb-2 bg-[#D89A86] text-white font-bold border-none px-3 py-1 shadow-xs">Curated Collections</Badge>
            <h2 className="font-serif-brand text-4xl font-bold text-[#3A2B24]">Shop By Category</h2>
          </div>
          <Link 
            href="/categories"
            className="text-sm font-semibold text-[#D89A86] hover:text-[#3A2B24] flex items-center gap-1 mt-4 md:mt-0 transition-colors"
          >
            View All Categories <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {[
            { name: "Photo Frames", slug: "photo-frames", icon: Camera, color: "bg-[#FFF8F2] text-[#D89A86]" },
            { name: "Polaroid Prints", slug: "polaroid-prints", icon: Heart, color: "bg-[#FFF8F2] text-[#F48A8A]" },
            { name: "Custom Mugs", slug: "custom-mugs", icon: Gift, color: "bg-[#FFF8F2] text-[#D89A86]" },
            { name: "LED Frames", slug: "led-frames", icon: Sparkles, color: "bg-[#FFF8F2] text-[#5AAE7F]" },
          ].map((cat, i) => (
            <Link key={i} href={`/category/${cat.slug}`}>
              <Card className="group cursor-pointer hover:shadow-xl transition-all border border-[#EFE6DD] bg-white rounded-3xl p-2">
                <CardContent className="p-8 flex flex-col items-center text-center gap-4">
                  <div className={`p-5 rounded-2xl ${cat.color} group-hover:scale-110 transition-transform shadow-sm`}>
                    <cat.icon className="h-8 w-8" />
                  </div>
                  <h3 className="font-serif-brand font-bold text-xl text-[#3A2B24]">{cat.name}</h3>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="bg-[#FFF8F2] py-24 border-y border-[#EFE6DD]">
        <div className="container mx-auto px-4 md:px-6">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <Badge className="mb-3 bg-[#D89A86]/20 text-[#3A2B24] border-none">Simple & Fast</Badge>
            <h2 className="font-serif-brand text-4xl font-bold text-[#3A2B24] mb-4">How Pixello Works</h2>
            <p className="text-[#6C5C54] text-lg">Connecting you with nearby photo studios for ultra-fast custom printing.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-10 text-center">
            <Card className="border border-[#EFE6DD] bg-white rounded-3xl p-6 shadow-sm">
              <CardContent className="flex flex-col items-center p-4">
                <div className="h-20 w-20 rounded-full bg-[#FFF8F2] text-[#D89A86] border border-[#D89A86]/30 flex items-center justify-center mb-6 shadow-sm">
                  <MapPin className="h-9 w-9" />
                </div>
                <h3 className="font-serif-brand text-2xl font-bold text-[#3A2B24] mb-3">1. Smart Location Match</h3>
                <p className="text-sm text-[#6C5C54] leading-relaxed">
                  We automatically assign your photo product order to the nearest verified photo studio.
                </p>
              </CardContent>
            </Card>

            <Card className="border border-[#EFE6DD] bg-white rounded-3xl p-6 shadow-sm">
              <CardContent className="flex flex-col items-center p-4">
                <div className="h-20 w-20 rounded-full bg-[#FFF8F2] text-[#D89A86] border border-[#D89A86]/30 flex items-center justify-center mb-6 shadow-sm">
                  <Camera className="h-9 w-9" />
                </div>
                <h3 className="font-serif-brand text-2xl font-bold text-[#3A2B24] mb-3">2. Local Studio Production</h3>
                <p className="text-sm text-[#6C5C54] leading-relaxed">
                  Local master studio craftsmen print and assemble your frame using premium materials.
                </p>
              </CardContent>
            </Card>

            <Card className="border border-[#EFE6DD] bg-white rounded-3xl p-6 shadow-sm">
              <CardContent className="flex flex-col items-center p-4">
                <div className="h-20 w-20 rounded-full bg-[#FFF8F2] text-[#D89A86] border border-[#D89A86]/30 flex items-center justify-center mb-6 shadow-sm">
                  <Truck className="h-9 w-9" />
                </div>
                <h3 className="font-serif-brand text-2xl font-bold text-[#3A2B24] mb-3">3. Express Doorstep Delivery</h3>
                <p className="text-sm text-[#6C5C54] leading-relaxed">
                  Our hyper-local delivery partners bring your framed memory directly to your doorstep in hours.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* AMBASSADOR CTA SECTION */}
      <section className="container mx-auto px-4 md:px-6">
        <div className="bg-gradient-to-r from-[#3A2B24] to-[#544036] rounded-3xl p-10 md:p-16 text-white flex flex-col md:flex-row items-center justify-between gap-8 shadow-2xl relative overflow-hidden">
          <div className="max-w-2xl">
            <Badge className="bg-[#D89A86] text-white mb-5 border-none px-4 py-1 font-bold">Campus Ambassador Program</Badge>
            <h2 className="font-serif-brand text-3xl sm:text-4xl md:text-5xl font-bold mb-4 leading-tight">
              Promote Pixello on Your College Campus.
            </h2>
            <p className="text-[#EFE6DD]/80 text-base mb-8 leading-relaxed">
              Earn commissions, leaderboard rewards, and official certificates by introducing PixelloStore to your campus friends!
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <a 
                href="https://docs.google.com/forms/d/e/1FAIpQLSdlvg1_aoq6GwQM3rz8qhmvM5jxo6q-ldWZFgdqb9R5dV6Hrw/viewform?usp=publish-editor"
                target="_blank"
                rel="noopener noreferrer"
                className="btn-pixello-primary px-8 h-12 flex items-center justify-center font-bold text-sm shadow-md"
              >
                Become Campus Ambassador <ArrowRight className="ml-2 h-4 w-4" />
              </a>
            </div>
          </div>
        </div>
      </section>
    </motion.div>
  );
}
