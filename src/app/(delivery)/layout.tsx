"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Map, List, Wallet, User, Heart, LogOut, Truck, ShieldCheck, Power } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useState, useEffect } from "react";
import { 
  useMobileNotifications, 
  MobileNotificationToast, 
  CompactNotificationCenter 
} from "@/components/common/MobileNotificationSystem";

export default function DeliveryLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();

  const [isOnline, setIsOnline] = useState(true);

  // Real Database Notifications System for Delivery Portal
  const {
    notifications: dbNotifications,
    unreadCount,
    activeToast,
    dismissToast,
    markAsRead,
    markAllAsRead,
    clearAll,
  } = useMobileNotifications("DELIVERY");

  useEffect(() => {
    try {
      const saved = localStorage.getItem("pixello_rider_online");
      if (saved !== null) setIsOnline(saved === "true");
    } catch (e) {
      console.error(e);
    }
  }, []);

  const toggleOnline = () => {
    const nextVal = !isOnline;
    setIsOnline(nextVal);
    try {
      localStorage.setItem("pixello_rider_online", String(nextVal));
    } catch (e) {
      console.error(e);
    }
  };

  const NAV_ITEMS = [
    { label: "Dashboard & Navigation", href: "/delivery", icon: Map },
    { label: "Delivery Tasks", href: "/delivery/tasks", icon: List },
    { label: "Earnings & Payouts", href: "/delivery/earnings", icon: Wallet },
    { label: "Rider Profile", href: "/delivery/profile", icon: User },
  ];

  return (
    <div className="min-h-screen bg-[#F8F3EE] flex flex-col font-sans">
      {/* PC Top Navigation Bar */}
      <header className="bg-[#3A2B24] text-white border-b border-[#4E3D35] shadow-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-18 flex items-center justify-between">
          
          {/* Logo & Brand Header */}
          <div className="flex items-center gap-6">
            <Link href="/delivery" className="flex flex-col">
              <div className="flex items-center gap-2">
                <span className="font-serif-brand text-2xl font-bold tracking-tight text-white flex items-center gap-2">
                  Pixello
                  <span className="text-[#D89A86] font-sans text-xs font-bold uppercase tracking-wider bg-[#FFF8F2]/10 border border-[#D89A86]/40 px-2.5 py-0.5 rounded-full shadow-2xs">
                    RIDER
                  </span>
                </span>
              </div>
              <span className="text-[10px] text-[#EFE6DD]/80 font-medium uppercase tracking-widest mt-0.5 flex items-center gap-1">
                <Heart className="h-2.5 w-2.5 text-[#F48A8A] fill-[#F48A8A]" /> FRAMES • MEMORIES • GIFTS
              </span>
            </Link>

            {/* Desktop Navigation Links */}
            <nav className="hidden md:flex items-center gap-1.5 ml-4">
              {NAV_ITEMS.map((item) => {
                const isActive = pathname === item.href;
                const Icon = item.icon;
                return (
                  <Link key={item.label} href={item.href}>
                    <span
                      className={`flex items-center gap-2 px-4 py-2 rounded-2xl text-xs font-bold transition-all cursor-pointer ${
                        isActive
                          ? "bg-[#FFF8F2]/20 text-white border border-[#D89A86]/50 shadow-xs"
                          : "text-[#EFE6DD]/80 hover:text-white hover:bg-[#FFF8F2]/10"
                      }`}
                    >
                      <Icon className={`h-4 w-4 ${isActive ? "text-[#D89A86]" : "text-[#EFE6DD]/70"}`} />
                      <span>{item.label}</span>
                    </span>
                  </Link>
                );
              })}
            </nav>
          </div>

          {/* Right Side Info & Actions */}
          <div className="flex items-center gap-3">
            {/* Real Database Connected Compact Notification Center */}
            <CompactNotificationCenter
              role="DELIVERY"
              notifications={dbNotifications}
              unreadCount={unreadCount}
              onMarkRead={markAsRead}
              onMarkAllRead={markAllAsRead}
              onClearAll={clearAll}
              onNavigateOrder={() => {
                router.push("/delivery/tasks");
              }}
            />

            <Button 
              variant={isOnline ? "default" : "secondary"} 
              className={`rounded-full shadow-md h-9 px-4 font-bold text-xs transition-all cursor-pointer flex items-center gap-2 ${
                isOnline ? 'bg-emerald-600 hover:bg-emerald-700 text-white' : 'bg-slate-800 text-white hover:bg-slate-900'
              }`}
              onClick={toggleOnline}
            >
              <Power className="h-3.5 w-3.5" /> {isOnline ? 'Online' : 'Offline'}
            </Button>

            <Button 
              variant="ghost" 
              onClick={() => router.push("/")}
              className="text-[#EFE6DD]/80 hover:text-white hover:bg-[#FFF8F2]/10 rounded-2xl text-xs font-bold hidden sm:flex items-center gap-1.5"
            >
              <LogOut className="h-4 w-4 text-[#D89A86]" /> Store
            </Button>
          </div>
        </div>

        {/* Mobile Navigation Sub-Bar */}
        <div className="md:hidden flex items-center justify-around bg-[#2E201A] border-t border-[#4E3D35] px-2 py-2">
          {NAV_ITEMS.map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;
            return (
              <Link key={item.label} href={item.href} className={`flex flex-col items-center gap-1 px-3 py-1 rounded-xl ${
                isActive ? "text-[#D89A86] font-bold" : "text-[#EFE6DD]/70"
              }`}>
                <Icon className="h-5 w-5" />
                <span className="text-[10px] font-semibold">{item.label}</span>
              </Link>
            );
          })}
        </div>
      </header>

      {/* PC Widescreen Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8">
        {children}
      </main>

      {/* MOBILE-STYLE ONE-LINE FLOATING POPUP TOAST */}
      <MobileNotificationToast
        toast={activeToast}
        onDismiss={dismissToast}
        onClick={(toast) => {
          markAsRead(toast.id);
          dismissToast();
          router.push("/delivery/tasks");
        }}
      />
    </div>
  );
}
