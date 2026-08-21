"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { User, Phone, ShieldCheck, Truck, Star, LogOut, MapPin, Award } from "lucide-react";
import Link from "next/link";

export default function DeliveryProfilePage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif-brand text-2xl font-bold text-[#3A2B24]">Delivery Partner Profile</h1>
        <p className="text-xs text-[#6C5C54] mt-0.5">Manage partner verification, registered vehicle details, and helpline support.</p>
      </div>

      {/* PC Widescreen 2-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Rider Badge Card (5 Cols on PC) */}
        <div className="lg:col-span-5 space-y-6">
          <Card className="bg-white border border-[#EFE6DD] rounded-3xl p-6 shadow-xs text-center space-y-4">
            <div className="h-24 w-24 bg-[#3A2B24] text-white rounded-full flex items-center justify-center mx-auto text-3xl font-bold shadow-md border-4 border-[#FFF8F2]">
              R
            </div>

            <div>
              <h2 className="font-serif-brand text-2xl font-bold text-[#3A2B24]">Ramesh Kumar</h2>
              <p className="text-xs text-[#6C5C54] font-semibold mt-0.5">Delivery Partner ID: PX-RIDER-8821</p>
            </div>
            
            <div className="flex justify-center gap-2">
              <Badge className="bg-emerald-100 text-emerald-800 border-none font-bold text-xs px-3 py-1 rounded-full">
                ✓ Verified Delivery Partner
              </Badge>
              <Badge className="bg-amber-100 text-amber-900 border border-amber-300 font-bold text-xs px-3 py-1 rounded-full flex items-center gap-1">
                <Star className="h-3.5 w-3.5 fill-amber-500 text-amber-500" /> 4.9 Rating
              </Badge>
            </div>

            <div className="p-4 bg-[#FFF8F2] border border-[#EFE6DD] rounded-2xl text-xs space-y-2 text-left">
              <div className="flex items-center gap-2 text-[#3A2B24] font-bold">
                <Award className="h-4 w-4 text-[#D89A86]" /> Star Dispatch Award Winner
              </div>
              <p className="text-[#6C5C54]">Completed over 450+ doorstep deliveries with a 99.4% on-time record across Powai & Central Mumbai.</p>
            </div>
          </Card>
        </div>

        {/* Right Column: Vehicle & Support Details (7 Cols on PC) */}
        <div className="lg:col-span-7 space-y-6">
          <Card className="border border-[#EFE6DD] bg-white rounded-3xl shadow-xs overflow-hidden">
            <CardHeader className="bg-[#FFF8F2] border-b border-[#EFE6DD] p-5">
              <CardTitle className="font-serif-brand text-lg font-bold text-[#3A2B24] flex items-center gap-2">
                <Truck className="h-5 w-5 text-[#D89A86]" /> Vehicle & Fulfillment Zone Specs
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-4 text-xs">
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="p-4 bg-[#FFF8F2]/60 border border-[#EFE6DD] rounded-2xl">
                  <span className="text-[#6C5C54] block mb-1 font-medium">Vehicle Category</span>
                  <strong className="text-[#3A2B24] text-sm">Two-Wheeler (Scooter)</strong>
                </div>

                <div className="p-4 bg-[#FFF8F2]/60 border border-[#EFE6DD] rounded-2xl">
                  <span className="text-[#6C5C54] block mb-1 font-medium">Registration Number</span>
                  <strong className="text-[#3A2B24] text-sm">MH 02 AB 1234</strong>
                </div>

                <div className="p-4 bg-[#FFF8F2]/60 border border-[#EFE6DD] rounded-2xl">
                  <span className="text-[#6C5C54] block mb-1 font-medium">Assigned Base Studio</span>
                  <strong className="text-[#3A2B24] text-sm">Studio Alpha (Powai Branch)</strong>
                </div>

                <div className="p-4 bg-[#FFF8F2]/60 border border-[#EFE6DD] rounded-2xl">
                  <span className="text-[#6C5C54] block mb-1 font-medium">Primary Dispatch Radius</span>
                  <strong className="text-[#3A2B24] text-sm">Powai, Chandivali & Kanjurmarg</strong>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border border-[#EFE6DD] bg-white rounded-3xl p-6 shadow-xs space-y-4">
            <h3 className="font-serif-brand text-lg font-bold text-[#3A2B24]">Help & Partner Support</h3>
            <div className="flex flex-col sm:flex-row gap-3">
              <a href="tel:+917989856610" className="flex-1">
                <Button variant="outline" className="w-full h-11 rounded-2xl border-[#EFE6DD] hover:bg-[#FFF8F2] text-xs font-bold text-[#3A2B24] flex items-center justify-center gap-2">
                  <Phone className="h-4 w-4 text-emerald-600" /> Call Rider Support
                </Button>
              </a>

              <Link href="/" className="flex-1">
                <Button className="w-full h-11 rounded-2xl bg-[#3A2B24] hover:bg-[#2E201A] text-white text-xs font-bold flex items-center justify-center gap-2">
                  <LogOut className="h-4 w-4 text-[#D89A86]" /> Return to Store
                </Button>
              </Link>
            </div>
          </Card>
        </div>

      </div>
    </div>
  );
}
