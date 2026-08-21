"use client";

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Camera, MapPin, Phone, Mail, Clock, CheckCircle2, ShieldCheck, Building2 } from "lucide-react";

export default function StudioSettingsPage() {
  const [studioName, setStudioName] = useState("Studio Alpha (Central Powai Branch)");
  const [address, setAddress] = useState("Shop 14, Main Market, Powai");
  const [pincode, setPincode] = useState("400076");
  const [city, setCity] = useState("Powai, Mumbai");
  const [district, setDistrict] = useState("Mumbai Suburban");
  const [stateName, setStateName] = useState("Maharashtra");
  const [phone, setPhone] = useState("+91 8074589949");
  const [email, setEmail] = useState("studioalpha@pixellostore.com");
  const [operatingHours, setOperatingHours] = useState("09:00 AM - 10:00 PM");
  const [assemblySpeed, setAssemblySpeed] = useState("15 Mins Per Frame");
  const [isSaved, setIsSaved] = useState(false);

  const [isPincodeLoading, setIsPincodeLoading] = useState(false);
  const [pincodeSuccessMsg, setPincodeSuccessMsg] = useState("✓ Auto-filled: Powai, Mumbai, Mumbai Suburban, Maharashtra");

  const PINCODE_MAP: Record<string, { city: string; district: string; state: string }> = {
    "400076": { city: "Powai, Mumbai", district: "Mumbai Suburban", state: "Maharashtra" },
    "500070": { city: "Sarada Nagar", district: "K.V.Rangareddy", state: "Telangana" },
    "400001": { city: "Fort, Mumbai", district: "Mumbai City", state: "Maharashtra" },
    "400050": { city: "Bandra, Mumbai", district: "Mumbai Suburban", state: "Maharashtra" },
    "500001": { city: "Abids", district: "Hyderabad", state: "Telangana" },
    "500032": { city: "Gachibowli", district: "Ranga Reddy", state: "Telangana" },
    "500081": { city: "Hitech City", district: "Ranga Reddy", state: "Telangana" },
    "500085": { city: "Kukatpally", district: "Medchal-Malkajgiri", state: "Telangana" },
    "110001": { city: "Connaught Place", district: "Central Delhi", state: "Delhi" },
    "560001": { city: "MG Road", district: "Bengaluru Urban", state: "Karnataka" },
    "600001": { city: "Parrys", district: "Chennai", state: "Tamil Nadu" },
    "700001": { city: "BBD Bagh", district: "Kolkata", state: "West Bengal" },
    "380001": { city: "Lal Darwaja", district: "Ahmedabad", state: "Gujarat" },
    "411001": { city: "Camp", district: "Pune", state: "Maharashtra" },
    "500049": { city: "Miyapur", district: "Ranga Reddy", state: "Telangana" },
    "500072": { city: "Moosapet", district: "Medchal-Malkajgiri", state: "Telangana" },
  };

  const handlePincodeChange = async (val: string) => {
    const cleanPin = val.replace(/\D/g, "").slice(0, 6);
    setPincode(cleanPin);

    if (cleanPin.length === 6) {
      if (PINCODE_MAP[cleanPin]) {
        const info = PINCODE_MAP[cleanPin];
        setCity(info.city);
        setDistrict(info.district);
        setStateName(info.state);
        setPincodeSuccessMsg(`✓ Auto-filled: ${info.city}, ${info.district}, ${info.state}`);
        return;
      }

      setIsPincodeLoading(true);
      setPincodeSuccessMsg("");
      try {
        const res = await fetch(`https://api.postalpincode.in/pincode/${cleanPin}`);
        const data = await res.json();
        if (data && data[0] && data[0].Status === "Success" && data[0].PostOffice && data[0].PostOffice.length > 0) {
          const po = data[0].PostOffice[0];
          const areaName = po.Name || po.Block || "";
          const distName = po.District || po.Region || "";
          const stName = po.State || po.Circle || "";

          setCity(areaName);
          setDistrict(distName);
          setStateName(stName);
          setPincodeSuccessMsg(`✓ Auto-filled: ${areaName}, ${distName}, ${stName}`);
        } else {
          setPincodeSuccessMsg("⚠️ Pincode verified. Please review city & state.");
        }
      } catch (err) {
        console.error("Pincode API lookup failed:", err);
      } finally {
        setIsPincodeLoading(false);
      }
    } else {
      setPincodeSuccessMsg("");
    }
  };

  // Sync settings from localStorage on load
  React.useEffect(() => {
    try {
      const saved = localStorage.getItem("pixello_studio_settings");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.studioName) setStudioName(parsed.studioName);
        if (parsed.address) setAddress(parsed.address);
        if (parsed.pincode) setPincode(parsed.pincode);
        if (parsed.city) setCity(parsed.city);
        if (parsed.district) setDistrict(parsed.district);
        if (parsed.stateName) setStateName(parsed.stateName);
        if (parsed.phone) setPhone(parsed.phone);
        if (parsed.email) setEmail(parsed.email);
        if (parsed.operatingHours) setOperatingHours(parsed.operatingHours);
        if (parsed.assemblySpeed) setAssemblySpeed(parsed.assemblySpeed);
        if (parsed.pincode && parsed.city) {
          setPincodeSuccessMsg(`✓ Auto-filled: ${parsed.city}, ${parsed.district || ""}, ${parsed.stateName || ""}`);
        }
      }
    } catch (e) {
      console.error("Failed to load studio settings:", e);
    }
  }, []);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const settingsData = {
      studioName,
      address,
      pincode,
      city,
      district,
      stateName,
      phone,
      email,
      operatingHours,
      assemblySpeed
    };

    try {
      localStorage.setItem("pixello_studio_settings", JSON.stringify(settingsData));
      window.dispatchEvent(new Event("studio_settings_updated"));
      window.dispatchEvent(new Event("storage"));
      setIsSaved(true);
      setTimeout(() => setIsSaved(false), 3000);
    } catch (err) {
      console.error("Failed to save studio settings:", err);
    }
  };

  return (
    <div className="flex flex-col gap-6 p-6 bg-[#F8F3EE] min-h-screen">
      <div>
        <h1 className="font-serif-brand text-3xl font-bold text-[#3A2B24]">Studio Branch Profile & Settings</h1>
        <p className="text-xs text-[#6C5C54] mt-1">Configure your photo studio partner profile, contact info, and production hours.</p>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        <Card className="md:col-span-2 border border-[#EFE6DD] bg-white rounded-3xl shadow-xs">
          <CardHeader className="border-b border-[#EFE6DD] bg-[#FFF8F2] p-6">
            <CardTitle className="font-serif-brand text-xl font-bold text-[#3A2B24]">Studio Business Details</CardTitle>
            <CardDescription className="text-xs text-[#6C5C54]">This information is shown to customers during order assignment.</CardDescription>
          </CardHeader>
          <CardContent className="p-6">
            <form onSubmit={handleSave} className="flex flex-col gap-4">
              <div>
                <label className="text-xs font-bold text-[#3A2B24] mb-1.5 block">Studio Branch Name</label>
                <Input value={studioName} onChange={(e) => setStudioName(e.target.value)} className="rounded-xl border-[#EFE6DD] bg-[#FFF8F2]" />
              </div>

              <div>
                <label className="text-xs font-bold text-[#3A2B24] mb-1.5 block">Full Street Address</label>
                <Input value={address} onChange={(e) => setAddress(e.target.value)} className="rounded-xl border-[#EFE6DD] bg-[#FFF8F2]" placeholder="Shop / Building / Street Name" />
              </div>

              {/* Pincode (6-digit) Auto-Fill Block */}
              <div>
                <label className="text-xs font-bold text-[#3A2B24] mb-1.5 block">Pincode (6-digit)</label>
                <Input 
                  value={pincode} 
                  onChange={(e) => handlePincodeChange(e.target.value)} 
                  placeholder="Enter 6-digit Pincode (e.g. 500070)"
                  className="rounded-xl border-[#EFE6DD] bg-[#FFF8F2] text-sm font-semibold text-[#3A2B24]" 
                  maxLength={6}
                />
              </div>

              {pincodeSuccessMsg && (
                <div className="p-3 bg-emerald-50 border border-emerald-300 text-emerald-800 rounded-2xl text-xs font-bold flex items-center gap-2 animate-in fade-in">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600 flex-shrink-0" />
                  <span>{pincodeSuccessMsg}</span>
                </div>
              )}

              {/* City / Area, District, State Row */}
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-xs font-bold text-[#3A2B24] mb-1 block">City / Area</label>
                  <Input 
                    value={city} 
                    onChange={(e) => setCity(e.target.value)} 
                    className="rounded-xl border-[#EFE6DD] bg-[#FFF8F2]/70 text-xs font-medium" 
                    required 
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-[#3A2B24] mb-1 block">District</label>
                  <Input 
                    value={district} 
                    onChange={(e) => setDistrict(e.target.value)} 
                    className="rounded-xl border-[#EFE6DD] bg-[#FFF8F2]/70 text-xs font-medium" 
                    required 
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-[#3A2B24] mb-1 block">State</label>
                  <Input 
                    value={stateName} 
                    onChange={(e) => setStateName(e.target.value)} 
                    className="rounded-xl border-[#EFE6DD] bg-[#FFF8F2]/70 text-xs font-medium" 
                    required 
                  />
                </div>
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-[#3A2B24] mb-1.5 block">Partner Phone Helpline</label>
                  <Input value={phone} onChange={(e) => setPhone(e.target.value)} className="rounded-xl border-[#EFE6DD] bg-[#FFF8F2]" />
                </div>
                <div>
                  <label className="text-xs font-bold text-[#3A2B24] mb-1.5 block">Official Email</label>
                  <Input value={email} onChange={(e) => setEmail(e.target.value)} className="rounded-xl border-[#EFE6DD] bg-[#FFF8F2]" />
                </div>
              </div>
              <div className="pt-2 flex items-center justify-between">
                {isSaved && <span className="text-xs font-bold text-emerald-600 flex items-center gap-1"><CheckCircle2 className="h-4 w-4" /> Studio settings saved successfully!</span>}
                <Button type="submit" className="btn-pixello-primary px-6 h-10 rounded-full font-bold text-xs shadow-xs ml-auto">
                  Save Changes
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        <Card className="border border-[#EFE6DD] bg-white rounded-3xl shadow-xs">
          <CardHeader className="border-b border-[#EFE6DD] bg-[#FFF8F2] p-6">
            <CardTitle className="font-serif-brand text-lg font-bold text-[#3A2B24]">Studio Verification</CardTitle>
          </CardHeader>
          <CardContent className="p-6 flex flex-col gap-4">
            <div className="flex items-center gap-3">
              <ShieldCheck className="h-8 w-8 text-emerald-600" />
              <div>
                <p className="font-bold text-sm text-[#3A2B24]">Verified Partner</p>
                <p className="text-xs text-[#6C5C54]">Pixello Authorized Studio</p>
              </div>
            </div>
            <div className="border-t border-[#EFE6DD] pt-4 space-y-2 text-xs text-[#6C5C54]">
              <p><strong>Operating Hours:</strong> 09:00 AM - 10:00 PM</p>
              <p><strong>Printer Tech:</strong> 12-Color Pigment Master Printers</p>
              <p><strong>Assembly Speed:</strong> 15 Mins Per Frame</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
