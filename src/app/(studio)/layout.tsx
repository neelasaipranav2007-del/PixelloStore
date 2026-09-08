"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { Camera, LayoutDashboard, FileText, Package, Settings, LogOut, Bell, Check, X, Sparkles, Clock, AlertCircle, Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useRouter, usePathname } from "next/navigation";
import { 
  useMobileNotifications, 
  MobileNotificationToast, 
  CompactNotificationCenter 
} from "@/components/common/MobileNotificationSystem";



import { isStudioPortalEnabled } from "@/lib/studioConfig";

export default function StudioLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();

  const isStudioEnabled = isStudioPortalEnabled();

  // Redirect to /studio/closed when Studio Portal is temporarily closed
  useEffect(() => {
    if (!isStudioEnabled && pathname !== "/studio/closed") {
      router.replace("/studio/closed");
    }
  }, [isStudioEnabled, pathname, router]);

  const [isAccepting, setIsAccepting] = useState(true);
  const [studioBranchName, setStudioBranchName] = useState("Studio Alpha (Powai Branch)");

  // Real Database Notifications System for Studio Portal
  const {
    notifications: dbNotifications,
    unreadCount,
    activeToast,
    dismissToast,
    markAsRead,
    markAllAsRead,
    clearAll,
    deleteNotification,
  } = useMobileNotifications("STUDIO");

  useEffect(() => {
    try {
      const saved = localStorage.getItem("pixello_studio_accepting");
      if (saved !== null) {
        setIsAccepting(saved === "true");
      }
    } catch (e) {
      console.error(e);
    }
  }, []);

  useEffect(() => {
    const syncStudioSettings = () => {
      try {
        const saved = localStorage.getItem("pixello_studio_settings");
        if (saved) {
          const parsed = JSON.parse(saved);
          if (parsed.studioName) {
            setStudioBranchName(parsed.studioName);
          }
        }
      } catch (e) {
        console.error(e);
      }
    };

    syncStudioSettings();
    window.addEventListener("studio_settings_updated", syncStudioSettings);
    window.addEventListener("storage", syncStudioSettings);

    return () => {
      window.removeEventListener("studio_settings_updated", syncStudioSettings);
      window.removeEventListener("storage", syncStudioSettings);
    };
  }, []);

  const toggleAccepting = () => {
    const nextVal = !isAccepting;
    setIsAccepting(nextVal);
    try {
      localStorage.setItem("pixello_studio_accepting", String(nextVal));
    } catch (e) {
      console.error(e);
    }
  };



  const SIDEBAR_ITEMS = [
    { label: "Dashboard", href: "/studio", icon: LayoutDashboard },
    { label: "Order Queue", href: "/studio/orders", icon: FileText },
    { label: "Inventory", href: "/studio/inventory", icon: Package },
    { label: "Settings", href: "/studio/settings", icon: Settings },
  ];

  const getPageTitle = () => {
    if (pathname.includes("/studio/orders")) return "Studio Production Queue";
    if (pathname.includes("/studio/inventory")) return "Studio Inventory & Materials";
    if (pathname.includes("/studio/settings")) return "Studio Branch Settings";
    return "Production Dashboard";
  };

  // If Studio Portal is disabled, render simplified header without sidebar controls
  if (!isStudioEnabled || pathname === "/studio/closed") {
    return (
      <div className="min-h-screen bg-[#F8F3EE] flex flex-col font-sans">
        <header className="bg-[#3A2B24] text-white border-b border-[#4E3D35] shadow-md sticky top-0 z-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-18 flex items-center justify-between">
            <Link href="/" className="flex flex-col">
              <div className="flex items-center gap-2">
                <span className="font-serif-brand text-2xl font-bold tracking-tight text-white flex items-center gap-2">
                  Pixello
                  <span className="text-[#D89A86] font-sans text-xs font-bold uppercase tracking-wider bg-[#FFF8F2]/10 border border-[#D89A86]/40 px-2.5 py-0.5 rounded-full shadow-2xs">
                    STUDIO
                  </span>
                </span>
              </div>
              <span className="text-[10px] text-[#EFE6DD]/80 font-medium uppercase tracking-widest mt-0.5 flex items-center gap-1">
                <Heart className="h-2.5 w-2.5 text-[#F48A8A] fill-[#F48A8A]" /> FRAMES • MEMORIES • GIFTS
              </span>
            </Link>
            <Button 
              variant="ghost" 
              onClick={() => router.push("/")}
              className="text-[#EFE6DD]/80 hover:text-white hover:bg-[#FFF8F2]/10 rounded-2xl text-xs font-bold flex items-center gap-1.5"
            >
              <LogOut className="h-4 w-4 text-[#D89A86]" /> Store
            </Button>
          </div>
        </header>
        <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8">
          {children}
        </main>
      </div>
    );
  }

  return (

    <div className="flex h-screen bg-[#F8F3EE]">
      {/* Pixello Light-Dark Espresso Sidebar (#3A2B24) */}
      <aside className="w-64 bg-[#3A2B24] text-white flex flex-col flex-shrink-0 border-r border-[#4E3D35] shadow-md">
        {/* Logo & Brand Header */}
        <div className="h-20 flex flex-col justify-center px-6 border-b border-[#4E3D35] bg-[#2E201A]">
          <div className="flex items-center gap-2">
            <span className="font-serif-brand text-2xl font-bold tracking-tight text-white flex items-center gap-1.5">
              Pixello
              <span className="text-[#D89A86] font-sans text-xs font-bold uppercase tracking-wider bg-[#FFF8F2]/10 border border-[#D89A86]/40 px-2 py-0.5 rounded-full shadow-2xs">
                STUDIO
              </span>
            </span>
          </div>
          <span className="text-[10px] text-[#EFE6DD]/80 font-medium uppercase tracking-widest mt-0.5 flex items-center gap-1">
            <Heart className="h-2.5 w-2.5 text-[#F48A8A] fill-[#F48A8A]" /> FRAMES • MEMORIES • GIFTS
          </span>
        </div>

        <div className="flex-1 overflow-y-auto no-scrollbar py-3 px-3">
          <nav className="flex flex-col gap-1.5">
            {SIDEBAR_ITEMS.map((item) => {
              const isActive = pathname === item.href;
              const Icon = item.icon;
              return (
                <Link key={item.label} href={item.href}>
                  <span
                    className={`flex items-center gap-3 px-3.5 py-3 text-sm transition-all cursor-pointer ${
                      isActive
                        ? "bg-[#FFF8F2]/20 text-white font-bold border-l-4 border-[#D89A86] rounded-r-2xl shadow-xs"
                        : "text-[#EFE6DD]/80 hover:text-white hover:bg-[#FFF8F2]/10 rounded-2xl"
                    }`}
                  >
                    <Icon className={`h-5 w-5 ${isActive ? "text-[#D89A86]" : "text-[#EFE6DD]/70"}`} />
                    <span>{item.label}</span>
                  </span>
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="p-4 border-t border-[#4E3D35] bg-[#2E201A]/30">
          <Button 
            variant="ghost" 
            onClick={() => router.push("/")}
            className="w-full justify-start text-[#EFE6DD]/80 hover:text-white hover:bg-[#FFF8F2]/10 rounded-2xl text-xs font-bold"
          >
            <LogOut className="h-4 w-4 mr-2 text-[#D89A86]" /> Return to Customer Store
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden bg-[#F8F3EE]">
        <header className="h-16 bg-[#FFF8F2] border-b border-[#EFE6DD] flex items-center justify-between px-8 flex-shrink-0 relative z-40">
          <div className="flex items-center gap-3">
            <h1 className="font-serif-brand font-bold text-xl text-[#3A2B24]">{getPageTitle()}</h1>
            <span className="text-[#D89A86]/40 font-light hidden sm:inline">•</span>
            <div className="hidden sm:flex items-center gap-2">
              <span className="text-xs font-bold text-[#3A2B24]">{studioBranchName}</span>
              <Badge className="bg-emerald-100 text-emerald-800 border border-emerald-300 text-[10px] font-bold px-2 py-0.5 rounded-full">
                ✓ Verified Dispatch Partner
              </Badge>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            {/* Interactive Accepting Orders Toggle Button */}
            <Button
              variant="outline"
              size="sm"
              onClick={toggleAccepting}
              className={`rounded-full text-xs font-bold transition-all shadow-xs cursor-pointer flex items-center gap-2 px-3.5 h-8 ${
                isAccepting
                  ? "bg-emerald-50 text-emerald-800 border-emerald-300 hover:bg-emerald-100"
                  : "bg-red-50 text-red-800 border-red-300 hover:bg-red-100"
              }`}
            >
              <span className={`h-2 w-2 rounded-full ${isAccepting ? "bg-emerald-500 animate-pulse" : "bg-red-500"}`} />
              {isAccepting ? "Accepting Orders" : "Orders Paused"}
            </Button>

            {/* Real Database Connected Compact Notification Center */}
            <CompactNotificationCenter
              role="STUDIO"
              notifications={dbNotifications}
              unreadCount={unreadCount}
              onMarkRead={markAsRead}
              onMarkAllRead={markAllAsRead}
              onClearAll={clearAll}
              onDeleteSingle={deleteNotification}
              onNavigateOrder={(orderId) => {
                if (orderId) {
                  router.push(`/studio/orders?search=${encodeURIComponent(orderId)}`);
                } else {
                  router.push("/studio/orders");
                }
              }}
            />
          </div>
        </header>

        <div className="flex-1 overflow-auto p-8">
          {children}
        </div>

        {/* MOBILE-STYLE ONE-LINE FLOATING POPUP TOAST */}
        <MobileNotificationToast
          toast={activeToast}
          onDismiss={dismissToast}
          onClick={(toast) => {
            markAsRead(toast.id);
            dismissToast();
            router.push("/studio/orders");
          }}
        />
      </main>
    </div>
  );
}
