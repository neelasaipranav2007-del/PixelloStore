"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowRight, MapPin, Camera, Truck, Gift, Heart, Sparkles, GraduationCap, CheckCircle2, ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";
import { getHomepageStats, HomepageStatsConfig } from "@/lib/homepageStats";
import { getHamperConfig, DEFAULT_HAMPER_CONFIG, HamperStoreConfig } from "@/lib/hamperConfig";
import { PromotionalOfferCard } from "@/components/customer/PromotionalOfferCard";
import { BirthdayReminderMessageBanner } from "@/components/customer/BirthdayReminderMessageBanner";
import { Cursor1 } from "@/components/Cursor1";
import { TextMorphInput } from "@/components/TextMorphInput";

export default function HomePage() {
  const [stats, setStats] = useState<HomepageStatsConfig>(getHomepageStats);
  const [hamperConfig, setHamperConfig] = useState<HamperStoreConfig>(DEFAULT_HAMPER_CONFIG);

  useEffect(() => {
    setHamperConfig(getHamperConfig());

    fetch("/api/settings/hamper")
      .then((r) => r.json())
      .then((d) => {
        if (d.success && d.config) setHamperConfig(d.config);
      })
      .catch(() => {});

    const handleStatsUpdate = () => {
      setStats(getHomepageStats());
    };

    const handleHamperConfigUpdate = () => {
      setHamperConfig(getHamperConfig());
    };

    window.addEventListener("pixello_homepage_stats_updated", handleStatsUpdate);
    window.addEventListener("pixello_hamper_config_updated", handleHamperConfigUpdate);
    window.addEventListener("storage", handleStatsUpdate);
    window.addEventListener("storage", handleHamperConfigUpdate);
    return () => {
      window.removeEventListener("pixello_homepage_stats_updated", handleStatsUpdate);
      window.removeEventListener("pixello_hamper_config_updated", handleHamperConfigUpdate);
      window.removeEventListener("storage", handleStatsUpdate);
      window.removeEventListener("storage", handleHamperConfigUpdate);
    };
  }, []);

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      className="flex flex-col gap-10 pb-24 bg-[#F8F3EE]"
    >
      {/* 72-HOUR BIRTHDAY & LOVED ONES REMINDER MESSAGE BANNER */}
      <BirthdayReminderMessageBanner />

      {/* HERO SECTION */}
      <section className="relative overflow-hidden bg-gradient-to-b from-[#FFF8F2] via-[#F8F3EE] to-[#F8F3EE] pt-12 pb-8">
        <div className="container mx-auto px-4 md:px-6 relative z-10">
          <div className="max-w-4xl mx-auto flex flex-col items-center text-center">

            {/* PixelloStore TextMorph Animated Hero Header */}
            <TextMorphInput
              heading="Every Memory Deserves a Frame"
              words={["Capture", "Create", "Cherish", "Memories", "Gifting"]}
              subtitle="Turn your favourite moments into personalized gifts with PixelloStore."
              exploreLabel="Explore Gifts"
              exploreHref="/products"
              secondaryLabel="Become Campus Ambassador"
              secondaryHref="#campus-ambassador"
              mode="both"
            />

            {/* Trust Badges */}
            {stats.badges && stats.badges.length > 0 && (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.7, delay: 0.55 }}
                className={cn(
                  "gap-6 mt-12 pt-8 border-t border-[#EFE6DD] text-center w-full mx-auto justify-center",
                  stats.badges.length === 1 ? "flex justify-center max-w-xs" : 
                  stats.badges.length === 2 ? "grid grid-cols-2 max-w-sm" : 
                  stats.badges.length === 3 ? "grid grid-cols-3 max-w-md" : 
                  stats.badges.length === 4 ? "grid grid-cols-2 sm:grid-cols-4 max-w-xl" : 
                  "flex flex-wrap justify-center gap-6 max-w-2xl"
                )}
              >
                {stats.badges.map((b, idx) => (
                  <div key={b.id || idx} className="min-w-[100px] px-2">
                    <div className="font-bold text-2xl text-[#3A2B24]">{b.value}</div>
                    <div className="text-xs text-[#6C5C54] mt-0.5">{b.label}</div>
                  </div>
                ))}
              </motion.div>
            )}
          </div>
        </div>
      </section>

      {/* FEATURED PROMOTIONAL OFFER WITH BORDER TRAIL */}
      <section className="container mx-auto px-4 md:px-6">
        <PromotionalOfferCard />
      </section>

      {/* BUILD YOUR OWN HAMPER SHOWCASE */}
      {hamperConfig.homepage.enabled && (
        <section className="container mx-auto px-4 md:px-6">
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#FFF5ED] via-[#FFF9F5] to-[#FBF0E8] border border-[#EFE6DD] p-8 sm:p-12 shadow-sm">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
              <div className="lg:col-span-7 space-y-5">
                <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-[#FFF8F2] border border-[#D89A86]/40 text-[#D89A86] text-xs font-extrabold shadow-2xs">
                  <Sparkles className="h-3.5 w-3.5" />
                  <span>{hamperConfig.homepage.tag || "EXCLUSIVE CUSTOM GIFTING"}</span>
                </div>

                <h2 className="font-serif-brand text-3xl sm:text-4xl lg:text-5xl font-bold text-[#3A2B24] tracking-tight leading-tight">
                  {hamperConfig.homepage.headline || "Build Your Own"}{" "}
                  <span className="italic text-[#D89A86]">{hamperConfig.homepage.highlightText || "Custom Gift Hamper"}</span>
                </h2>

                <p className="text-sm sm:text-base text-[#6C5C54] leading-relaxed max-w-xl">
                  {hamperConfig.homepage.subtitle || "Can't pick just one gift? Combine your favourite personalized photo frames, retro polaroid prints, glowing LED lamps, and keepsakes into a bespoke luxury gift box with custom satin ribbons & printed dedication notes."}
                </p>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
                  <div className="p-3 bg-white/80 rounded-2xl border border-[#EFE6DD] text-center shadow-2xs">
                    <span className="text-xl block mb-1">🎁</span>
                    <span className="text-xs font-bold text-[#3A2B24] block">Pick 2 to 10 Gifts</span>
                    <span className="text-[10px] text-[#6C5C54]">From live catalog</span>
                  </div>
                  <div className="p-3 bg-white/80 rounded-2xl border border-[#EFE6DD] text-center shadow-2xs">
                    <span className="text-xl block mb-1">📦</span>
                    <span className="text-xs font-bold text-[#3A2B24] block">4 Luxury Boxes</span>
                    <span className="text-[10px] text-[#6C5C54]">Magnetic &amp; Wood crates</span>
                  </div>
                  <div className="p-3 bg-white/80 rounded-2xl border border-[#EFE6DD] text-center shadow-2xs">
                    <span className="text-xl block mb-1">🎀</span>
                    <span className="text-xs font-bold text-[#3A2B24] block">Satin Ribbon Themes</span>
                    <span className="text-[10px] text-[#6C5C54]">With wax seals</span>
                  </div>
                  <div className="p-3 bg-white/80 rounded-2xl border border-[#EFE6DD] text-center shadow-2xs">
                    <span className="text-xl block mb-1">💌</span>
                    <span className="text-xs font-bold text-[#3A2B24] block">Free Dedication Card</span>
                    <span className="text-[10px] text-[#6C5C54]">Custom printed message</span>
                  </div>
                </div>

                <div className="pt-3 flex flex-col sm:flex-row items-center gap-3">
                  <Link
                    href={hamperConfig.nav.url || "/hamper"}
                    className="btn-pixello-primary text-base h-13 px-8 rounded-full flex items-center justify-center w-full sm:w-auto shadow-md hover:shadow-lg transition-all active:scale-95 cursor-pointer font-bold gap-2"
                  >
                    <Gift className="h-5 w-5" />
                    <span>{hamperConfig.homepage.buttonText || "Create Your Hamper"}</span>
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                  <Link
                    href="/products"
                    className="h-13 px-6 rounded-full border border-[#EFE6DD] bg-white text-[#3A2B24] hover:bg-[#FFF8F2] transition-colors flex items-center justify-center w-full sm:w-auto text-xs font-bold shadow-2xs"
                  >
                    Browse Products First
                  </Link>
                </div>
              </div>

            <div className="lg:col-span-5 relative">
              <div className="relative mx-auto max-w-sm rounded-3xl overflow-hidden border-2 border-[#D89A86]/30 shadow-xl bg-white p-4 space-y-3">
                <div className="relative aspect-4/3 rounded-2xl overflow-hidden bg-[#FFF8F2]">
                  <img
                    src="/images/wooden_frame_main.png"
                    alt="Custom Hamper Curation"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute top-3 left-3 bg-[#3A2B24]/90 text-white text-[10px] font-extrabold px-2.5 py-1 rounded-full uppercase tracking-wider backdrop-blur-xs">
                    Curated Gift Box
                  </div>
                  <div className="absolute bottom-3 right-3 bg-[#D89A86] text-white text-xs font-extrabold px-3 py-1 rounded-full shadow-md">
                    Custom Packaging Included
                  </div>
                </div>

                <div className="p-2 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-[#3A2B24]">Signature Keepsake Box</span>
                    <span className="font-extrabold text-[#D89A86]">Storewide Free Delivery</span>
                  </div>
                  <p className="text-[11px] text-[#6C5C54]">
                    Hand-packed by verified studio artisans. Perfect for Birthdays, Anniversaries, and Milestones.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
      )}

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

      {/* FEATURED PRODUCTS SHOWCASE WITH INTERACTIVE MOTION CURSOR */}
      <section className="container mx-auto px-4 md:px-6">
        <Cursor1
          title="Curated Frames Gallery"
          subtitle="Explore our most loved personalized frames, vintage Polaroids, and glowing LED memory lamps."
          hoverText="View Product"
        />
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

      {/* PIXELLO CAMPUS AMBASSADOR PROGRAM SECTION */}
      <section id="campus-ambassador" className="container mx-auto px-4 md:px-6 scroll-mt-24">
        <div className="bg-gradient-to-br from-[#3A2B24] via-[#4A382F] to-[#2E201A] rounded-3xl p-8 sm:p-12 md:p-16 text-white shadow-2xl relative overflow-hidden border border-[#544036]">
          {/* Decorative ambient glows */}
          <div className="absolute top-0 right-0 w-96 h-96 bg-[#D89A86]/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-[#D89A86]/10 rounded-full blur-3xl pointer-events-none" />

          {/* Section Heading & Main Ambassador Definition */}
          <div className="relative z-10 max-w-4xl mx-auto text-center mb-12">
            <Badge className="bg-[#D89A86] text-white mb-4 border-none px-4 py-1.5 text-xs font-bold shadow-xs">
              Pixello Campus Ambassador Program
            </Badge>
            <h2 className="font-serif-brand text-3xl sm:text-4xl md:text-5xl font-bold mb-6 leading-tight text-white">
              Represent Pixello on Your College Campus
            </h2>
            <div className="bg-white/5 border border-white/10 rounded-3xl p-6 sm:p-8 backdrop-blur-xs text-left sm:text-center">
              <p className="text-[#EFE6DD] text-base sm:text-lg leading-relaxed font-medium">
                A <strong className="text-white font-bold">Pixello Campus Ambassador</strong> is a student who represents PixelloStore in their college by sharing our personalized photo frames, Polaroids, keychains, and unique gifts with friends and classmates.
              </p>
              <p className="text-[#D89A86] text-sm sm:text-base font-semibold mt-3">
                It’s a great opportunity for students to earn while learning, build their network, and grow together with PixelloStore!
              </p>
            </div>
          </div>

          {/* Feature Highlights: Ambassadors & Customers */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 relative z-10 mb-10">
            {/* For Ambassadors Card */}
            <div className="bg-white/5 border border-white/10 rounded-3xl p-6 sm:p-8 backdrop-blur-xs flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-3 mb-5">
                  <div className="h-11 w-11 rounded-2xl bg-[#D89A86]/20 border border-[#D89A86]/40 flex items-center justify-center text-[#D89A86] shrink-0">
                    <GraduationCap className="h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="font-serif-brand text-xl font-bold text-white">For Students & Ambassadors</h3>
                    <p className="text-xs text-[#EFE6DD]/70">Earn commissions, awards & valuable career skills</p>
                  </div>
                </div>
                <ul className="space-y-4 text-xs sm:text-sm text-[#EFE6DD]/90">
                  <li className="flex items-start gap-3">
                    <CheckCircle2 className="h-4.5 w-4.5 text-[#D89A86] shrink-0 mt-0.5" />
                    <span><strong className="text-white">Earn Commissions & Bonuses:</strong> Earn attractive commissions on successful orders through your referral, plus exciting performance rewards and bonuses.</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle2 className="h-4.5 w-4.5 text-[#D89A86] shrink-0 mt-0.5" />
                    <span><strong className="text-white">Certificate of Appreciation:</strong> Earn an official verified Certificate of Appreciation to highlight on your resume and LinkedIn.</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle2 className="h-4.5 w-4.5 text-[#D89A86] shrink-0 mt-0.5" />
                    <span><strong className="text-white">Professional Growth:</strong> Develop your communication, marketing, public relations, and leadership skills through hands-on campaign execution.</span>
                  </li>
                </ul>
              </div>
            </div>

            {/* For Campus Customers Card */}
            <div className="bg-white/5 border border-white/10 rounded-3xl p-6 sm:p-8 backdrop-blur-xs flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-3 mb-5">
                  <div className="h-11 w-11 rounded-2xl bg-[#D89A86]/20 border border-[#D89A86]/40 flex items-center justify-center text-[#D89A86] shrink-0">
                    <Sparkles className="h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="font-serif-brand text-xl font-bold text-white">How Campus Customers Benefit</h3>
                    <p className="text-xs text-[#EFE6DD]/70">Unique customized gifts & trusted campus ordering</p>
                  </div>
                </div>
                <ul className="space-y-4 text-xs sm:text-sm text-[#EFE6DD]/90">
                  <li className="flex items-start gap-3">
                    <CheckCircle2 className="h-4.5 w-4.5 text-[#D89A86] shrink-0 mt-0.5" />
                    <span><strong className="text-white">Discover Unique Gifts:</strong> Browse personalized photo frames, retro Polaroids, acrylic photo lamps, custom mugs, and keychains.</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle2 className="h-4.5 w-4.5 text-[#D89A86] shrink-0 mt-0.5" />
                    <span><strong className="text-white">Special Offers & Discounts:</strong> Access exclusive student-friendly pricing, special promotional deals, and coupon discounts.</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle2 className="h-4.5 w-4.5 text-[#D89A86] shrink-0 mt-0.5" />
                    <span><strong className="text-white">Trusted Campus Representative:</strong> Enjoy seamless, trusted ordering for events, birthdays, and anniversaries directly through your campus peer.</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>

          {/* Action CTAs */}
          <div className="relative z-10 flex flex-col sm:flex-row items-center justify-center gap-4 pt-6 border-t border-white/10">
            <a 
              href="https://docs.google.com/forms/d/e/1FAIpQLSdlvg1_aoq6GwQM3rz8qhmvM5jxo6q-ldWZFgdqb9R5dV6Hrw/viewform?usp=publish-editor"
              target="_blank"
              rel="noopener noreferrer"
              className="btn-pixello-primary px-8 h-13 rounded-full flex items-center justify-center font-bold text-sm shadow-lg hover:shadow-xl transition-all w-full sm:w-auto"
            >
              Apply to Become an Ambassador <ExternalLink className="ml-2 h-4 w-4" />
            </a>
            <Link
              href="/ambassador/login"
              className="h-13 px-7 rounded-full border-2 border-white/20 hover:border-white/40 text-white hover:bg-white/10 font-bold text-sm transition-all flex items-center justify-center w-full sm:w-auto"
            >
              Already an Ambassador? Sign In <ArrowRight className="ml-2 h-4 w-4 text-[#D89A86]" />
            </Link>
          </div>
        </div>
      </section>
    </motion.div>
  );
}
