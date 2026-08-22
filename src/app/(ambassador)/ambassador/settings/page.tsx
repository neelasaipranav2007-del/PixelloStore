"use client";

import { useState, useEffect } from "react";
import { User, Mail, Phone, GraduationCap, Building, Save, CheckCircle2, AlertCircle, BookOpen, Calendar, AtSign, Camera } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

export default function AmbassadorSettingsPage() {
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  const [profile, setProfile] = useState({
    id: "",
    name: "",
    college: "",
    branch: "",
    year: "",
    email: "",
    phone: "",
    bio: "",
    instagramHandle: "",
    referralCode: "",
    rank: "GOLD",
    upiId: "",
    accountNumber: "",
  });

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const token = typeof window !== "undefined" ? localStorage.getItem("pixello_ambassador_token") : null;
      const headers: Record<string, string> = {};
      if (token) headers["Authorization"] = `Bearer ${token}`;

      const res = await fetch("/api/ambassador/profile", { headers });
      if (res.ok) {
        const data = await res.json();
        if (data.success && data.profile) {
          setProfile(data.profile);
        }
      }
    } catch (e) {
      console.error("Error loading profile:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsSaving(true);
      setErrorMessage(null);
      const token = typeof window !== "undefined" ? localStorage.getItem("pixello_ambassador_token") : null;
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (token) headers["Authorization"] = `Bearer ${token}`;

      const res = await fetch("/api/ambassador/profile", {
        method: "PATCH",
        headers,
        body: JSON.stringify({
          name: profile.name,
          college: profile.college,
          branch: profile.branch,
          year: profile.year,
          bio: profile.bio,
          instagramHandle: profile.instagramHandle,
          upiId: profile.upiId,
          accountNumber: profile.accountNumber,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        setErrorMessage(data.error || "Failed to update profile.");
        return;
      }

      showToast("Ambassador profile & bank details saved to database!");
      window.dispatchEvent(new Event("pixello_ambassador_profile_updated"));
    } catch (err: any) {
      setErrorMessage(err.message || "An unexpected error occurred.");
    } finally {
      setIsSaving(false);
    }
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

      {/* Error Banner */}
      {errorMessage && (
        <div className="p-4 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-2xl flex items-center gap-2">
          <AlertCircle className="h-4 w-4 flex-shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      <div>
        <h2 className="font-serif-brand text-3xl font-bold text-[#3A2B24]">My Ambassador Profile & Settings</h2>
        <p className="text-xs text-[#6C5C54] mt-1">Manage your campus workspace details, payout accounts & preferences.</p>
      </div>

      <form onSubmit={handleSaveSettings} className="flex flex-col gap-6">
        <Card className="border border-[#EFE6DD] bg-white rounded-3xl shadow-xs overflow-hidden">
          <CardContent className="p-6 md:p-8 flex flex-col gap-5">
            <div className="flex items-center justify-between pb-4 border-b border-[#EFE6DD]">
              <div>
                <h3 className="font-serif-brand text-xl font-bold text-[#3A2B24]">Personal & Campus Information</h3>
                <p className="text-xs text-[#6C5C54] mt-0.5">Ambassador ID: <strong className="font-mono text-[#3A2B24]">{profile.id}</strong></p>
              </div>
              <Badge className="bg-[#FFF8F2] text-[#D89A86] border border-[#D89A86]/30 text-xs font-bold px-3 py-1 rounded-full">
                {profile.rank} Tier Representative
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
                  <BookOpen className="h-3.5 w-3.5 text-[#D89A86]" /> Branch / Department
                </label>
                <Input 
                  value={profile.branch} 
                  onChange={(e) => setProfile({ ...profile, branch: e.target.value })}
                  placeholder="e.g. Computer Science, IT, Commerce"
                  className="rounded-xl border-[#EFE6DD] text-xs font-semibold text-[#3A2B24] bg-white h-11 focus-visible:ring-[#D89A86]" 
                />
              </div>

              <div>
                <label className="text-xs font-bold text-[#3A2B24] mb-1.5 flex items-center gap-1.5">
                  <Calendar className="h-3.5 w-3.5 text-[#D89A86]" /> Year of Study
                </label>
                <Input 
                  value={profile.year} 
                  onChange={(e) => setProfile({ ...profile, year: e.target.value })}
                  placeholder="e.g. 2nd Year, 3rd Year (2026 Batch)"
                  className="rounded-xl border-[#EFE6DD] text-xs font-semibold text-[#3A2B24] bg-white h-11 focus-visible:ring-[#D89A86]" 
                />
              </div>

              <div>
                <label className="text-xs font-bold text-[#3A2B24] mb-1.5 flex items-center gap-1.5">
                  <Mail className="h-3.5 w-3.5 text-[#D89A86]" /> Student Email
                </label>
                <Input 
                  type="email"
                  value={profile.email} 
                  disabled
                  className="rounded-xl border-[#EFE6DD] text-xs font-semibold text-[#6C5C54] bg-[#F8F3EE] h-11" 
                />
              </div>

              <div>
                <label className="text-xs font-bold text-[#3A2B24] mb-1.5 flex items-center gap-1.5">
                  <Phone className="h-3.5 w-3.5 text-[#D89A86]" /> Registered Mobile
                </label>
                <Input 
                  value={profile.phone} 
                  disabled
                  className="rounded-xl border-[#EFE6DD] text-xs font-semibold text-[#6C5C54] bg-[#F8F3EE] h-11" 
                />
              </div>

              <div className="sm:col-span-2">
                <label className="text-xs font-bold text-[#3A2B24] mb-1.5 flex items-center gap-1.5">
                  <AtSign className="h-3.5 w-3.5 text-[#D89A86]" /> Instagram Handle
                </label>
                <Input 
                  value={profile.instagramHandle} 
                  onChange={(e) => setProfile({ ...profile, instagramHandle: e.target.value })}
                  placeholder="e.g. @yourhandle"
                  className="rounded-xl border-[#EFE6DD] text-xs font-semibold text-[#3A2B24] bg-white h-11 focus-visible:ring-[#D89A86]" 
                />
              </div>
            </div>

            <Separator className="bg-[#EFE6DD] my-2" />

            <h4 className="font-serif-brand font-bold text-base text-[#3A2B24]">Default Payout & Bank Account Details</h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <label className="text-xs font-bold text-[#3A2B24] mb-1.5 flex items-center gap-1.5">
                  UPI ID (e.g. yourname@okhdfcbank)
                </label>
                <Input 
                  value={profile.upiId} 
                  onChange={(e) => setProfile({ ...profile, upiId: e.target.value })}
                  placeholder="name@upi"
                  className="rounded-xl border-[#EFE6DD] text-xs font-semibold text-[#3A2B24] bg-white h-11 focus-visible:ring-[#D89A86]" 
                />
              </div>

              <div>
                <label className="text-xs font-bold text-[#3A2B24] mb-1.5 flex items-center gap-1.5">
                  Bank Settlement Account & Name
                </label>
                <Input 
                  value={profile.accountNumber} 
                  onChange={(e) => setProfile({ ...profile, accountNumber: e.target.value })}
                  placeholder="Account Number (Bank Name)"
                  className="rounded-xl border-[#EFE6DD] text-xs font-semibold text-[#3A2B24] bg-white h-11 focus-visible:ring-[#D89A86]" 
                />
              </div>
            </div>

            <div className="pt-4 flex justify-end border-t border-[#EFE6DD]">
              <Button 
                type="submit" 
                disabled={isSaving}
                className="btn-pixello-primary px-8 rounded-full text-xs font-bold h-11 shadow-xs flex items-center gap-2 cursor-pointer"
              >
                <Save className="h-4 w-4" />
                {isSaving ? "Saving..." : "Save Profile & Settings"}
              </Button>
            </div>
          </CardContent>
        </Card>
      </form>
    </div>
  );
}
