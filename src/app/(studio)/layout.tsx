"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { Camera, LayoutDashboard, FileText, Package, Settings, LogOut, Bell, Check, X, Sparkles, Clock, AlertCircle, Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useRouter, usePathname } from "next/navigation";

const MOCK_NOTIFICATIONS = [
  { id: 1, title: "New Order #ORD-59709430 Assigned", desc: "Liquid Timer Motion • Express Delivery", time: "2 mins ago", unread: true },
  { id: 2, title: "High-Res Photo File Uploaded", desc: "Customer attached HD photo for Wooden Frame", time: "15 mins ago", unread: true },
  { id: 3, title: "Rider Ramesh Dispatched", desc: "Order #ORD-1092 picked up for doorstep delivery", time: "1 hour ago", unread: false },
];

export default function StudioLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();

  const [isAccepting, setIsAccepting] = useState(true);
  const [studioBranchName, setStudioBranchName] = useState("Studio Alpha (Powai Branch)");
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState(MOCK_NOTIFICATIONS);
  const notifRef = useRef<HTMLDivElement>(null);

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

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setShowNotifications(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const markAllRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, unread: false })));
  };

  const unreadCount = notifications.filter(n => n.unread).length;

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

            {/* Interactive Notification Bell Icon with Popover */}
            <div ref={notifRef} className="relative">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowNotifications(prev => !prev)}
                className="relative rounded-full hover:bg-slate-100 text-slate-700"
                aria-label="Notifications"
              >
                <Bell className="h-5 w-5 text-slate-600" />
                {unreadCount > 0 && (
                  <span className="absolute top-1.5 right-1.5 h-2.5 w-2.5 rounded-full bg-red-500 ring-2 ring-white animate-pulse" />
                )}
              </Button>

              {/* Notifications Popover */}
              {showNotifications && (
                <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white border border-[#EFE6DD] rounded-3xl shadow-2xl overflow-hidden z-50 animate-in fade-in zoom-in-95">
                  <div className="p-4 bg-[#FFF8F2] border-b border-[#EFE6DD] flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <h4 className="font-serif-brand font-bold text-sm text-[#3A2B24]">Studio Notifications</h4>
                      {unreadCount > 0 && (
                        <Badge className="bg-[#D89A86] text-white border-none text-[10px] px-2 py-0.5 rounded-full font-bold">
                          {unreadCount} New
                        </Badge>
                      )}
                    </div>
                    {unreadCount > 0 && (
                      <button onClick={markAllRead} className="text-[11px] font-bold text-[#D89A86] hover:underline cursor-pointer flex items-center gap-1">
                        <Check className="h-3 w-3" /> Mark all as read
                      </button>
                    )}
                  </div>

                  <div className="divide-y divide-[#EFE6DD] max-h-80 overflow-y-auto">
                    {notifications.filter(n => n.unread).length === 0 ? (
                      <div className="py-8 px-5 text-center flex flex-col items-center justify-center bg-white">
                        <div className="h-10 w-10 rounded-full bg-[#FFF8F2] border border-[#EFE6DD] flex items-center justify-center text-[#D89A86] mb-2.5 shadow-2xs">
                          <Sparkles className="h-5 w-5 text-[#D89A86]" />
                        </div>
                        <h5 className="font-serif-brand font-bold text-sm text-[#3A2B24] mb-1">All caught up!</h5>
                        <p className="text-xs text-[#6C5C54] mb-3 max-w-[200px]">No pending unread production notifications.</p>
                        <Button
                          size="sm"
                          onClick={() => {
                            setNotifications([
                              { id: Date.now(), title: "New Urgent Order Queued", desc: "5x7 Wooden Frame • Customer requested 2-hr priority dispatch", time: "Just now", unread: true },
                              ...notifications
                            ]);
                          }}
                          className="btn-pixello-primary h-7 text-xs font-bold rounded-xl shadow-2xs"
                        >
                          Check For Production Alerts
                        </Button>
                      </div>
                    ) : (
                      notifications.filter(n => n.unread).map((n) => (
                        <div key={n.id} className="p-3.5 hover:bg-[#FFF8F2]/60 transition-colors bg-amber-50/20 flex items-start justify-between gap-3">
                          <div>
                            <div className="flex items-center gap-1.5 mb-0.5">
                              <h5 className="font-bold text-xs text-[#3A2B24]">{n.title}</h5>
                              <span className="h-1.5 w-1.5 rounded-full bg-[#D89A86]" />
                            </div>
                            <p className="text-xs text-[#6C5C54] leading-relaxed">{n.desc}</p>
                            <span className="text-[10px] text-[#D89A86] font-semibold mt-1 inline-block">{n.time}</span>
                          </div>
                          <button
                            title="Mark as read"
                            onClick={() => setNotifications(prev => prev.map(item => item.id === n.id ? { ...item, unread: false } : item))}
                            className="h-6 w-6 rounded-md hover:bg-[#FFF8F2] border border-transparent hover:border-[#EFE6DD] flex items-center justify-center text-[#D89A86] cursor-pointer flex-shrink-0"
                          >
                            <Check className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      ))
                    )}
                  </div>

                  <div className="p-3 bg-slate-50 border-t border-[#EFE6DD] text-center">
                    <Link href="/studio/orders" onClick={() => setShowNotifications(false)} className="text-xs font-bold text-[#D89A86] hover:underline">
                      View All Production Orders ➔
                    </Link>
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-auto p-8">
          {children}
        </div>
      </main>
    </div>
  );
}
