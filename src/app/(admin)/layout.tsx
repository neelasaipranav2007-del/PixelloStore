"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { LayoutDashboard, Users, Store, Package, Settings, LogOut, FileText, Bell, Sparkles, Heart, ChevronDown, ShoppingBag, ExternalLink, Ticket, Truck, CheckCheck, Check, RefreshCw, AlertTriangle, Trash2, X, Trophy, Star, ArrowUpRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { isDeliveryPortalEnabled } from "@/lib/deliveryConfig";
import { 
  useMobileNotifications, 
  MobileNotificationToast, 
  CompactNotificationCenter 
} from "@/components/common/MobileNotificationSystem";

export interface AdminNotification {
  id: string;
  title: string;
  desc: string;
  time: string;
  read: boolean;
  type: "order" | "studio" | "stock" | "ambassador" | "delivery";
  link: string;
}

const INITIAL_NOTIFICATIONS: AdminNotification[] = [
  { id: "notif-1", title: "New Order Placed", desc: "Order ORD-25827350 placed by Harsha vardhan (₹638.82)", time: "10 mins ago", read: false, type: "order", link: "/admin/orders" },
  { id: "notif-2", title: "Studio Verification Pending", desc: "PhotoGenic Pvt Ltd submitted verification documents", time: "1 hour ago", read: false, type: "studio", link: "/admin/studios" },
  { id: "notif-3", title: "Low Stock Alert", desc: "Spotify Acrylic Plaque is down to 12 units", time: "3 hours ago", read: false, type: "stock", link: "/admin/products" },
];

const SECONDARY_NOTIFICATIONS: AdminNotification[] = [
  { id: "notif-4", title: "Ambassador Referral Applied", desc: "Sree Charani (SREE20) generated a new referral order (₹161.00)", time: "Just now", read: false, type: "ambassador", link: "/admin/ambassadors" },
  { id: "notif-5", title: "Express Delivery Completed", desc: "Order PXL-1231-0070 delivered to Sai Pranav by Ramesh Kumar", time: "5 mins ago", read: false, type: "delivery", link: "/admin/orders" },
  { id: "notif-6", title: "New Studio Onboarding Request", desc: "Apex Color Lab (Secunderabad) requested studio partner access", time: "20 mins ago", read: false, type: "studio", link: "/admin/studios" },
  { id: "notif-7", title: "Customer Review Received", desc: "Sai Pranav left a ★★★★★ 5-Star review on Premium Wooden Frame", time: "35 mins ago", read: false, type: "order", link: "/admin/orders" },
  { id: "notif-8", title: "High Demand Surge Alert", desc: "LED Acrylic Photo Lamp has received 8 bulk orders today", time: "50 mins ago", read: false, type: "stock", link: "/admin/products" },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const isDeliveryEnabled = isDeliveryPortalEnabled();
  
  // Real Database Notifications System for Admin Portal
  const {
    notifications: dbNotifications,
    unreadCount,
    activeToast,
    dismissToast,
    markAsRead,
    markAllAsRead,
    clearAll,
    deleteNotification,
  } = useMobileNotifications("ADMIN");

  // Live Admin Profile State Synced from Admin Settings
  const [adminProfile, setAdminProfile] = useState(() => {
    if (typeof window !== "undefined") {
      const savedProf = localStorage.getItem("pixello_admin_profile");
      if (savedProf) {
        try {
          const parsed = JSON.parse(savedProf);
          if (parsed.name) return { name: parsed.name, email: parsed.email || "neelasaipranav2007@gmail.com" };
        } catch (e) {
          console.error(e);
        }
      }

      const savedSet = localStorage.getItem("pixello_admin_settings");
      if (savedSet) {
        try {
          const parsed = JSON.parse(savedSet);
          if (parsed.name) return { name: parsed.name, email: parsed.email || "neelasaipranav2007@gmail.com" };
        } catch (e) {
          console.error(e);
        }
      }
    }
    return {
      name: "Pranav",
      email: "neelasaipranav2007@gmail.com",
    };
  });

  useEffect(() => {
    const syncProfile = () => {
      if (typeof window !== "undefined") {
        const savedProf = localStorage.getItem("pixello_admin_profile");
        if (savedProf) {
          try {
            const parsed = JSON.parse(savedProf);
            if (parsed.name) {
              setAdminProfile({ name: parsed.name, email: parsed.email || "neelasaipranav2007@gmail.com" });
              return;
            }
          } catch (e) {
            console.error(e);
          }
        }

        const savedSet = localStorage.getItem("pixello_admin_settings");
        if (savedSet) {
          try {
            const parsed = JSON.parse(savedSet);
            if (parsed.name) {
              setAdminProfile({ name: parsed.name, email: parsed.email || "neelasaipranav2007@gmail.com" });
            }
          } catch (e) {
            console.error(e);
          }
        }
      }
    };

    window.addEventListener("pixello_admin_profile_updated", syncProfile);
    window.addEventListener("storage", syncProfile);
    return () => {
      window.removeEventListener("pixello_admin_profile_updated", syncProfile);
      window.removeEventListener("storage", syncProfile);
    };
  }, []);

  const avatarInitial = adminProfile.name ? adminProfile.name.charAt(0).toUpperCase() : "P";

  const SIDEBAR_ITEMS = [
    { label: "Dashboard", href: "/admin", icon: LayoutDashboard },
    { label: "Orders", href: "/admin/orders", icon: FileText },
    { label: "Products", href: "/admin/products", icon: Package },
    { label: "Customer Reviews", href: "/admin/reviews", icon: Star },
    { label: "Customers", href: "/admin/customers", icon: Users },
    { label: "Studios", href: "/admin/studios", icon: Store },
    { label: "Ambassadors", href: "/admin/ambassadors", icon: Users },
    { label: "Leaderboard of Ambassadors", href: "/admin/ambassadors/leaderboard", icon: Trophy },
    { label: "Promo Codes", href: "/admin/promos", icon: Ticket },
    { label: "Delivery Charges", href: "/admin/delivery", icon: Truck },
    { label: "Settings", href: "/admin/settings", icon: Settings },
  ];

  useEffect(() => {
    if (pathname === "/admin/login") {
      setIsAuthenticated(true);
      return;
    }

    const checkAdminAuth = () => {
      if (typeof window !== "undefined") {
        const isAuth = localStorage.getItem("pixello_admin_authenticated");
        const adminUser = localStorage.getItem("pixello_admin_user");
        const adminToken = localStorage.getItem("pixello_admin_token");
        if (isAuth === "true" || adminUser || adminToken) {
          setIsAuthenticated(true);
          if (!adminToken) {
            fetch("/api/admin/auth", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ phone: "9618401231", name: "Pranav" }),
            })
              .then((res) => res.json())
              .then((data) => {
                if (data.token) {
                  localStorage.setItem("pixello_admin_token", data.token);
                  document.cookie = `pixello_admin_token=${data.token}; path=/; max-age=2592000; SameSite=Lax`;
                  window.dispatchEvent(new Event("pixello_orders_updated"));
                }
              })
              .catch((err) => console.warn("Admin token sync:", err));
          }
        } else {
          setIsAuthenticated(false);
          if (pathname !== "/admin/login") {
            router.replace("/admin/login");
          }
        }
      }
    };

    checkAdminAuth();
    window.addEventListener("pixello_admin_auth_changed", checkAdminAuth);
    return () => {
      window.removeEventListener("pixello_admin_auth_changed", checkAdminAuth);
    };
  }, [pathname, router]);

  const handleAdminSignOut = (e?: React.MouseEvent) => {
    if (e) e.preventDefault();
    if (typeof window !== "undefined") {
      localStorage.removeItem("pixello_admin_authenticated");
      localStorage.removeItem("pixello_admin_user");
      window.dispatchEvent(new Event("pixello_admin_auth_changed"));
    }
    router.push("/admin/login");
  };

  // If on Admin Login page, render directly without sidebar
  if (pathname === "/admin/login") {
    return <>{children}</>;
  }

  // If verifying authentication, show clean branded verification state
  if (isAuthenticated === null || isAuthenticated === false) {
    return (
      <div className="min-h-screen bg-[#F8F3EE] flex flex-col items-center justify-center p-6 text-center">
        <div className="h-16 w-16 rounded-full overflow-hidden border-2 border-[#D89A86] bg-white p-1 shadow-lg mb-4 flex items-center justify-center animate-pulse">
          <img src="/images/pixello_logo.png" alt="Pixello Admin" className="h-full w-full object-contain" />
        </div>
        <h2 className="font-serif-brand text-lg font-bold text-[#3A2B24]">Verifying Admin Access...</h2>
        <p className="text-xs text-[#6C5C54] mt-1">Securing Pixello Management Suite session</p>
      </div>
    );
  }

  return (
    <div className="flex h-screen w-screen bg-[#F8F3EE] overflow-hidden">
      {/* Pixello Light-Dark Espresso Sidebar (#3A2B24) */}
      <aside className="w-64 bg-[#3A2B24] text-white flex flex-col flex-shrink-0 border-r border-[#4E3D35] shadow-md select-none z-20">
        {/* Logo & Brand Header */}
        <div className="h-16 flex flex-col justify-center px-5 border-b border-[#4E3D35] bg-[#2E201A] flex-shrink-0">
          <div className="flex items-center gap-2">
            <span className="font-serif-brand text-2xl font-bold tracking-tight text-white flex items-center gap-1.5">
              Pixello
              <span className="text-[#D89A86] font-sans text-xs font-bold uppercase tracking-wider bg-[#FFF8F2]/10 border border-[#D89A86]/40 px-2 py-0.5 rounded-full shadow-2xs">
                Admin
              </span>
            </span>
          </div>
          <span className="text-[10px] text-[#EFE6DD]/80 font-medium uppercase tracking-widest mt-0.5 flex items-center gap-1">
            <Heart className="h-2.5 w-2.5 text-[#F48A8A] fill-[#F48A8A]" /> Frames • Memories • Gifts
          </span>
        </div>

        {/* Navigation Items */}
        <div className="flex-1 overflow-y-auto no-scrollbar py-3 px-3">
          <nav className="flex flex-col gap-1">
            {SIDEBAR_ITEMS.map((item) => {
              const isActive = pathname === item.href || (item.href === "/admin/ambassadors/leaderboard" && pathname === "/admin/leaderboard");
              const Icon = item.icon;
              return (
                <Link
                  key={item.label}
                  href={item.href}
                  className={`flex items-center gap-3 px-3.5 py-2.5 text-xs transition-all cursor-pointer select-none ${
                    isActive
                      ? "bg-[#FFF8F2]/20 text-white font-bold border-l-4 border-[#D89A86] rounded-r-xl shadow-xs"
                      : "text-white/90 font-medium hover:bg-[#FFF8F2]/15 hover:text-white rounded-xl"
                  }`}
                >
                  <Icon className={`h-4.5 w-4.5 ${isActive ? "text-[#D89A86]" : "text-white"}`} />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Footer / Sign Out */}
        <div className="p-3 border-t border-[#4E3D35] bg-[#2E201A] flex-shrink-0">
          <Button
            variant="ghost"
            onClick={handleAdminSignOut}
            className="w-full justify-start text-white hover:text-white hover:bg-[#FFF8F2]/15 rounded-xl text-xs font-bold h-10 cursor-pointer"
          >
            <LogOut className="h-4 w-4 mr-2.5 text-[#D89A86]" /> Sign Out
          </Button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
        {/* Top Navbar */}
        <header className="h-16 bg-white border-b border-[#EFE6DD] flex items-center justify-between px-8 flex-shrink-0 shadow-2xs">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-[#D89A86]" />
            <h1 className="font-serif-brand font-bold text-lg text-[#3A2B24]">Pixello Management Suite</h1>
          </div>

          <div className="flex items-center gap-4">
            {/* Real Database Connected Compact Notification Center */}
            <CompactNotificationCenter
              role="ADMIN"
              notifications={dbNotifications}
              unreadCount={unreadCount}
              onMarkRead={markAsRead}
              onMarkAllRead={markAllAsRead}
              onClearAll={clearAll}
              onDeleteSingle={deleteNotification}
              onNavigateOrder={(orderId) => {
                if (orderId) {
                  router.push(`/admin/orders?search=${encodeURIComponent(orderId)}`);
                } else {
                  router.push("/admin/orders");
                }
              }}
            />

            {/* High-Contrast Harmonious Admin Profile Dropdown Menu Synced Live */}
            <DropdownMenu>
              <DropdownMenuTrigger className="focus:outline-none cursor-pointer">
                <div className="flex items-center gap-2.5 pl-2 border-l border-[#EFE6DD] hover:opacity-80 transition-opacity">
                  <div className="h-9 w-9 rounded-full bg-[#FFF8F2] border border-[#EFE6DD] flex items-center justify-center font-bold text-[#D89A86] text-sm shadow-2xs">
                    {avatarInitial}
                  </div>
                  <div className="hidden sm:block text-left">
                    <div className="flex items-center gap-1">
                      <p className="text-xs font-bold text-[#3A2B24]">{adminProfile.name}</p>
                      <ChevronDown className="h-3 w-3 text-[#6C5C54]" />
                    </div>
                    <p className="text-[10px] text-[#6C5C54] font-medium max-w-[140px] truncate">{adminProfile.email}</p>
                  </div>
                </div>
              </DropdownMenuTrigger>

              <DropdownMenuContent align="end" className="w-64 rounded-3xl border border-[#EFE6DD] p-2.5 shadow-2xl bg-white">
                {/* Espresso Card Header */}
                <div className="p-3.5 bg-[#3A2B24] rounded-2xl mb-2 text-white shadow-xs border border-[#4E3D35]">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-bold text-[#D89A86]">{adminProfile.name}</span>
                    <span className="text-[10px] bg-[#FFF8F2]/15 text-[#FFF8F2] font-bold px-2 py-0.5 rounded-full border border-[#D89A86]/40">
                      Superadmin
                    </span>
                  </div>
                  <p className="text-[11px] text-[#EFE6DD] font-medium truncate">{adminProfile.email}</p>
                </div>

                <div className="flex flex-col gap-1">
                  <DropdownMenuItem asChild className="cursor-pointer rounded-xl p-0 focus:bg-transparent">
                    <Link href="/admin/settings" className="flex items-center gap-3 px-3 py-2.5 text-xs font-bold text-[#3A2B24] hover:bg-[#FFF8F2] transition-colors rounded-xl w-full">
                      <div className="h-7 w-7 rounded-lg bg-[#FFF8F2] border border-[#EFE6DD] flex items-center justify-center text-[#D89A86] flex-shrink-0">
                        <Settings className="h-3.5 w-3.5 text-[#D89A86]" />
                      </div>
                      <span className="text-[#3A2B24] font-bold">Admin Platform Settings</span>
                    </Link>
                  </DropdownMenuItem>

                  <DropdownMenuItem asChild className="cursor-pointer rounded-xl p-0 focus:bg-transparent">
                    <Link href="/admin/orders" className="flex items-center gap-3 px-3 py-2.5 text-xs font-bold text-[#3A2B24] hover:bg-[#FFF8F2] transition-colors rounded-xl w-full">
                      <div className="h-7 w-7 rounded-lg bg-[#FFF8F2] border border-[#EFE6DD] flex items-center justify-center text-[#D89A86] flex-shrink-0">
                        <FileText className="h-3.5 w-3.5 text-[#D89A86]" />
                      </div>
                      <span className="text-[#3A2B24] font-bold">Live Orders Management</span>
                    </Link>
                  </DropdownMenuItem>

                  <DropdownMenuItem asChild className="cursor-pointer rounded-xl p-0 focus:bg-transparent">
                    <Link href="/products" target="_blank" className="flex items-center gap-3 px-3 py-2.5 text-xs font-bold text-[#3A2B24] hover:bg-[#FFF8F2] transition-colors rounded-xl w-full">
                      <div className="h-7 w-7 rounded-lg bg-[#FFF8F2] border border-[#EFE6DD] flex items-center justify-center text-[#D89A86] flex-shrink-0">
                        <ShoppingBag className="h-3.5 w-3.5 text-[#D89A86]" />
                      </div>
                      <span className="text-[#3A2B24] font-bold">Open Customer Store</span>
                      <ExternalLink className="h-3 w-3 ml-auto text-[#6C5C54]" />
                    </Link>
                  </DropdownMenuItem>

                  <DropdownMenuSeparator className="bg-[#EFE6DD] my-1" />

                  <DropdownMenuItem 
                    onClick={handleAdminSignOut}
                    className="cursor-pointer rounded-xl p-0 focus:bg-transparent"
                  >
                    <div className="flex items-center gap-3 px-3 py-2.5 text-xs font-bold text-rose-600 hover:bg-rose-50 transition-colors rounded-xl w-full">
                      <div className="h-7 w-7 rounded-lg bg-rose-50 border border-rose-100 flex items-center justify-center text-rose-600 flex-shrink-0">
                        <LogOut className="h-3.5 w-3.5 text-rose-600" />
                      </div>
                      <span className="text-rose-600 font-bold">Sign Out Admin</span>
                    </div>
                  </DropdownMenuItem>
                </div>
              </DropdownMenuContent>
            </DropdownMenu>

          </div>
        </header>

        {/* Delivery Operations Closed Admin Alert Banner */}
        {!isDeliveryEnabled && (
          <div className="bg-amber-500 text-white px-6 py-2.5 flex items-center justify-between shadow-xs border-b border-amber-600 text-xs font-bold shrink-0">
            <div className="flex items-center gap-2">
              <Truck className="h-4 w-4" />
              <span>DELIVERY OPERATIONS TEMPORARILY CLOSED</span>
              <span className="opacity-90 font-normal ml-2 hidden sm:inline">
                (New delivery assignments are paused. Delivery Portal is blocked for riders.)
              </span>
            </div>
            <span className="bg-amber-700 text-white text-[10px] uppercase tracking-wider px-2.5 py-0.5 rounded-full font-black">
              FLAG: DELIVERY_PORTAL_ENABLED=false
            </span>
          </div>
        )}

        {/* Scrollable Page Body */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden min-w-0 w-full">{children}</div>

        {/* MOBILE-STYLE ONE-LINE FLOATING POPUP TOAST */}
        <MobileNotificationToast
          toast={activeToast}
          onDismiss={dismissToast}
          onClick={(toast) => {
            markAsRead(toast.id);
            dismissToast();
            router.push(toast.type?.includes("REVIEW") ? "/admin/reviews" : "/admin/orders");
          }}
        />
      </main>
    </div>
  );
}
