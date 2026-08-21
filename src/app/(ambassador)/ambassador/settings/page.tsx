"use client";

import { useState, useEffect } from "react";
import { User, Mail, Phone, GraduationCap, Building, Save, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

export default function AmbassadorSettingsPage() {
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [profile, setProfile] = useState({
    name: "Sree Charani Grandhe",
    college: "Aurora Deemed To Be A University",
    email: "sree.charani@aurora.edu.in",
    phone: "+91 98123 45678",
    upiId: "sree@okaxis",
    bankAccount: "HDFC Bank (A/C: ****4892)",
  });

  useEffect(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("pixello_ambassador_profile");
      if (saved) {
        try {
          setProfile(JSON.parse(saved));
        } catch (e) {
          console.error(e);
        }
      }
    }
  }, []);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    if (typeof window !== "undefined") {
      localStorage.setItem("pixello_ambassador_profile", JSON.stringify(profile));
      window.dispatchEvent(new Event("pixello_ambassador_profile_updated"));
    }
    showToast("Ambassador profile & payout bank details saved!");
  };

  return (
    <div className="flex flex-col gap-6 bg-[#F8F3EE] p-6 rounded-3xl min-h-screen relative max-w-4xl">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-20 right-8 z-50 bg-[#3A2B24] text-white px-5 py-3 rounded-2xl shadow-xl border border-[#D89A86]/40 flex items-center gap-2.5 animate-in fade-in slide-in-from-top-4 duration-300">
          <CheckCircle2 className="h-5 w-5 text-[#D89A86]" />
          <span className="text-xs font-bold">{toastMessage}</span>
        </div>
      )}

      <div>
        <h2 className="font-serif-brand text-3xl font-bold text-[#3A2B24]">My Ambassador Profile & Settings</h2>
        <p className="text-xs text-[#6C5C54] mt-1">Manage your student campus profile, payout bank details & contact preferences.</p>
      </div>

      <form onSubmit={handleSaveSettings} className="flex flex-col gap-6">
        <Card className="border border-[#EFE6DD] bg-white rounded-3xl shadow-xs overflow-hidden">
          <CardContent className="p-6 md:p-8 flex flex-col gap-5">
            <div className="flex items-center justify-between pb-4 border-b border-[#EFE6DD]">
              <h3 className="font-serif-brand text-xl font-bold text-[#3A2B24]">Personal & Campus Info</h3>
              <Badge className="bg-[#FFF8F2] text-[#D89A86] border border-[#D89A86]/30 text-xs font-bold px-3 py-1 rounded-full">
                Gold Tier Representative
              </Badge>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <label className="text-xs font-bold text-[#3A2B24] mb-1.5 flex items-center gap-1.5">
                  <User className="h-3.5 w-3.5 text-[#D89A86]" /> Full Name *
                </label>
                <Input 
                  value={profile.name} 
                  onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                  className="rounded-xl border-[#EFE6DD] text-xs font-semibold text-[#3A2B24] bg-white h-11 focus-visible:ring-[#D89A86]" 
                />
              </div>

              <div>
                <label className="text-xs font-bold text-[#3A2B24] mb-1.5 flex items-center gap-1.5">
                  <GraduationCap className="h-3.5 w-3.5 text-[#D89A86]" /> College / University *
                </label>
                <Input 
                  value={profile.college} 
                  onChange={(e) => setProfile({ ...profile, college: e.target.value })}
                  className="rounded-xl border-[#EFE6DD] text-xs font-semibold text-[#3A2B24] bg-white h-11 focus-visible:ring-[#D89A86]" 
                />
              </div>

              <div>
                <label className="text-xs font-bold text-[#3A2B24] mb-1.5 flex items-center gap-1.5">
                  <Mail className="h-3.5 w-3.5 text-[#D89A86]" /> Student Email *
                </label>
                <Input 
                  type="email"
                  value={profile.email} 
                  onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                  className="rounded-xl border-[#EFE6DD] text-xs font-semibold text-[#3A2B24] bg-white h-11 focus-visible:ring-[#D89A86]" 
                />
              </div>

              <div>
                <label className="text-xs font-bold text-[#3A2B24] mb-1.5 flex items-center gap-1.5">
                  <Phone className="h-3.5 w-3.5 text-[#D89A86]" /> WhatsApp Phone *
                </label>
                <Input 
                  value={profile.phone} 
                  onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                  className="rounded-xl border-[#EFE6DD] text-xs font-semibold text-[#3A2B24] bg-white h-11 focus-visible:ring-[#D89A86]" 
                />
              </div>
            </div>

            <Separator className="bg-[#EFE6DD] my-2" />

            <h4 className="font-serif-brand font-bold text-base text-[#3A2B24]">Payout & Bank Details</h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <label className="text-xs font-bold text-[#3A2B24] mb-1.5 flex items-center gap-1.5">
                  UPI ID (Instant Payout)
                </label>
                <Input 
                  value={profile.upiId} 
                  onChange={(e) => setProfile({ ...profile, upiId: e.target.value })}
                  className="rounded-xl border-[#EFE6DD] text-xs font-semibold text-[#3A2B24] bg-white h-11 focus-visible:ring-[#D89A86]" 
                />
              </div>

              <div>
                <label className="text-xs font-bold text-[#3A2B24] mb-1.5 flex items-center gap-1.5">
                  Bank Settlement Account
                </label>
                <Input 
                  value={profile.bankAccount} 
                  onChange={(e) => setProfile({ ...profile, bankAccount: e.target.value })}
                  className="rounded-xl border-[#EFE6DD] text-xs font-semibold text-[#3A2B24] bg-white h-11 focus-visible:ring-[#D89A86]" 
                />
              </div>
            </div>

            <div className="pt-4 flex justify-end border-t border-[#EFE6DD]">
              <Button type="submit" className="btn-pixello-primary px-8 rounded-full text-xs font-bold h-11 shadow-xs flex items-center gap-2 cursor-pointer">
                <Save className="h-4 w-4 text-white" /> Save Profile & Payout Info
              </Button>
            </div>
          </CardContent>
        </Card>
      </form>
    </div>
  );
}
