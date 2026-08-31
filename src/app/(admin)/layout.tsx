"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { LayoutDashboard, Users, Store, Package, Settings, LogOut, FileText, Bell, Sparkles, Heart, ChevronDown, ShoppingBag, ExternalLink, Ticket, Truck, CheckCheck, Check, RefreshCw, AlertTriangle, Trash2, X, Trophy, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";

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
  const [activeTab, setActiveTab] = useState<"unread" | "all">("unread");
  
  // Interactive Notification State with localStorage persistence
  const [notifications, setNotifications] = useState<AdminNotification[]>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("pixello_admin_notifications_v3");
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed) && parsed.length > 0) return parsed;
        } catch (e) {
          console.error(e);
        }
      }
    }
    return INITIAL_NOTIFICATIONS;
  });

  const unreadNotifications = notifications.filter((n) => !n.read);
  const unreadCount = unreadNotifications.length;

  const handleMarkAllAsRead = (e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = notifications.map((n) => ({ ...n, read: true }));
    setNotifications(updated);
    if (typeof window !== "undefined") {
      localStorage.setItem("pixello_admin_notifications_v3", JSON.stringify(updated));
    }
  };

  const handleMarkAsRead = (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const updated = notifications.map((n) => (n.id === id ? { ...n, read: true } : n));
    setNotifications(updated);
    if (typeof window !== "undefined") {
      localStorage.setItem("pixello_admin_notifications_v3", JSON.stringify(updated));
    }
  };

  const handleDismiss = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = notifications.filter((n) => n.id !== id);
    setNotifications(updated);
    if (typeof window !== "undefined") {
      localStorage.setItem("pixello_admin_notifications_v3", JSON.stringify(updated));
    }
  };

  const handleLoadNewNotifications = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const existingIds = new Set(notifications.map((n) => n.id));
    const newItems = SECONDARY_NOTIFICATIONS.filter((n) => !existingIds.has(n.id));

    let updated: AdminNotification[];
    if (newItems.length > 0) {
      updated = [...newItems, ...notifications];
    } else {
      const randomOrderNum = Math.floor(1000 + Math.random() * 9000);
      const freshAlert: AdminNotification = {
        id: `notif-live-${Date.now()}`,
        title: "New Incoming Customer Order",
        desc: `Order PXL-${randomOrderNum}-5000 received for Instant Studio Printing`,
        time: "Just now",
        read: false,
        type: "order",
        link: "/admin/orders",
      };
      updated = [freshAlert, ...notifications];
    }
    setNotifications(updated);
    setActiveTab("unread");
    if (typeof window !== "undefined") {
      localStorage.setItem("pixello_admin_notifications_v3", JSON.stringify(updated));
    }
  };

  // Sync incoming orders from OrderContext
  useEffect(() => {
    const handleOrderUpdate = () => {
      try {
        const savedOrders = localStorage.getItem("pixello_customer_orders_v3");
        if (savedOrders) {
          const orders = JSON.parse(savedOrders);
          if (Array.isArray(orders) && orders.length > 0) {
            const latest = orders[0];
            setNotifications((prev) => {
              if (prev.some((n) => n.desc.includes(latest.id))) return prev;
              const liveNotif: AdminNotification = {
                id: `notif-order-${latest.id}`,
                title: "New Customer Order Placed",
                desc: `Order ${latest.id} placed by ${latest.customerName} (₹${latest.totalAmount})`,
                time: "Just now",
                read: false,
                type: "order",
                link: "/admin/orders",
              };
              const updated = [liveNotif, ...prev];
              if (typeof window !== "undefined") {
                localStorage.setItem("pixello_admin_notifications_v3", JSON.stringify(updated));
              }
              return updated;
            });
          }
        }
      } catch (e) {
        console.error(e);
      }
    };
    window.addEventListener("pixello_orders_updated", handleOrderUpdate);
    return () => window.removeEventListener("pixello_orders_updated", handleOrderUpdate);
  }, []);

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

  const displayedNotifications = activeTab === "unread" ? unreadNotifications : notifications;

  const getNotifIcon = (type: AdminNotification["type"]) => {
    switch (type) {
      case "order":
        return <Package className="h-3.5 w-3.5 text-emerald-600" />;
      case "studio":
        return <Store className="h-3.5 w-3.5 text-blue-600" />;
      case "stock":
        return <AlertTriangle className="h-3.5 w-3.5 text-rose-600" />;
      case "ambassador":
        return <Users className="h-3.5 w-3.5 text-purple-600" />;
      case "delivery":
        return <Truck className="h-3.5 w-3.5 text-amber-600" />;
      default:
        return <Bell className="h-3.5 w-3.5 text-[#D89A86]" />;
    }
  };

  const getNotifBg = (type: AdminNotification["type"]) => {
    switch (type) {
      case "order":
        return "bg-emerald-50 border-emerald-200";
      case "studio":
        return "bg-blue-50 border-blue-200";
      case "stock":
        return "bg-rose-50 border-rose-200";
      case "ambassador":
        return "bg-purple-50 border-purple-200";
      case "delivery":
        return "bg-amber-50 border-amber-200";
      default:
        return "bg-[#FFF8F2] border-[#EFE6DD]";
    }
  };

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
            {/* Interactive Dynamic Notification Bell Dropdown Menu */}
            <DropdownMenu>
              <DropdownMenuTrigger className="relative rounded-full hover:bg-[#FFF8F2] text-[#6C5C54] cursor-pointer p-2 flex items-center justify-center border-none outline-none bg-transparent focus:outline-none transition-colors">
                <Bell className="h-5 w-5 text-[#6C5C54]" />
                {unreadCount > 0 && (
                  <span className="absolute top-1.5 right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-[#F48A8A] text-[9px] font-black text-white ring-2 ring-white animate-pulse">
                    {unreadCount}
                  </span>
                )}
              </DropdownMenuTrigger>

              <DropdownMenuContent align="end" className="w-84 sm:w-96 p-0 rounded-3xl border border-[#EFE6DD] shadow-2xl bg-white overflow-hidden z-50">
                {/* Header */}
                <div className="p-4 bg-[#FFF8F2] border-b border-[#EFE6DD]">
                  <div className="flex items-center justify-between mb-2.5">
                    <div className="flex items-center gap-2">
                      <Bell className="h-4 w-4 text-[#D89A86]" />
                      <span className="font-serif-brand font-bold text-sm text-[#3A2B24]">Admin Notifications</span>
                      {unreadCount > 0 && (
                        <Badge className="bg-[#D89A86] text-white border-none text-[10px] px-2 py-0.2 rounded-full font-bold">
                          {unreadCount} New
                        </Badge>
                      )}
                    </div>
                    {unreadCount > 0 && (
                      <button
                        onClick={handleMarkAllAsRead}
                        className="text-[11px] text-[#D89A86] font-bold hover:underline cursor-pointer flex items-center gap-1 transition-colors"
                      >
                        <CheckCheck className="h-3.5 w-3.5" /> Mark all as read
                      </button>
                    )}
                  </div>

                  {/* Tabs: Unread vs All */}
                  <div className="flex items-center gap-1.5 bg-white p-1 rounded-xl border border-[#EFE6DD]">
                    <button
                      onClick={() => setActiveTab("unread")}
                      className={`flex-1 text-[11px] font-bold py-1 px-2.5 rounded-lg transition-all ${
                        activeTab === "unread"
                          ? "bg-[#3A2B24] text-white shadow-2xs"
                          : "text-[#6C5C54] hover:text-[#3A2B24]"
                      }`}
                    >
                      Unread ({unreadCount})
                    </button>
                    <button
                      onClick={() => setActiveTab("all")}
                      className={`flex-1 text-[11px] font-bold py-1 px-2.5 rounded-lg transition-all ${
                        activeTab === "all"
                          ? "bg-[#3A2B24] text-white shadow-2xs"
                          : "text-[#6C5C54] hover:text-[#3A2B24]"
                      }`}
                    >
                      All History ({notifications.length})
                    </button>
                  </div>
                </div>

                {/* Notifications Body */}
                <div className="divide-y divide-[#EFE6DD] max-h-80 overflow-y-auto">
                  {displayedNotifications.length === 0 ? (
                    <div className="py-8 px-5 text-center flex flex-col items-center justify-center bg-white">
                      <div className="h-12 w-12 rounded-full bg-[#FFF8F2] border border-[#EFE6DD] flex items-center justify-center text-[#D89A86] mb-3 shadow-xs">
                        <Sparkles className="h-6 w-6 text-[#D89A86]" />
                      </div>
                      <h4 className="font-serif-brand font-bold text-sm text-[#3A2B24] mb-1">All Caught Up!</h4>
                      <p className="text-xs text-[#6C5C54] mb-4 max-w-[220px] leading-relaxed">
                        {activeTab === "unread"
                          ? "You have marked all notifications as read."
                          : "No notifications recorded yet."}
                      </p>
                      <div className="flex flex-col gap-2 w-full max-w-[220px]">
                        <Button
                          size="sm"
                          onClick={handleLoadNewNotifications}
                          className="btn-pixello-primary w-full h-8 text-xs font-bold rounded-xl shadow-xs flex items-center justify-center gap-1.5 cursor-pointer"
                        >
                          <RefreshCw className="h-3.5 w-3.5" /> Check For New Alerts
                        </Button>
                        {activeTab === "unread" && notifications.length > 0 && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setActiveTab("all")}
                            className="text-[11px] text-[#6C5C54] hover:text-[#3A2B24] h-7 font-bold cursor-pointer"
                          >
                            View Read History ({notifications.length})
                          </Button>
                        )}
                      </div>
                    </div>
                  ) : (
                    displayedNotifications.map((item) => (
                      <div
                        key={item.id}
                        className={`p-3.5 hover:bg-[#FFF8F2]/60 transition-colors flex items-start justify-between gap-3 group ${
                          !item.read ? "bg-amber-50/20" : "bg-white"
                        }`}
                      >
                        <Link href={item.link} className="flex-1 flex items-start gap-2.5">
                          <div className={`h-7 w-7 rounded-lg flex items-center justify-center border flex-shrink-0 mt-0.5 ${getNotifBg(item.type)}`}>
                            {getNotifIcon(item.type)}
                          </div>
                          <div>
                            <div className="flex items-center gap-1.5 mb-0.5">
                              <span className={`text-xs font-bold ${!item.read ? "text-[#3A2B24]" : "text-[#6C5C54]"}`}>
                                {item.title}
                              </span>
                              {!item.read && (
                                <span className="h-1.5 w-1.5 rounded-full bg-[#D89A86]" />
                              )}
                            </div>
                            <p className="text-[11px] text-[#6C5C54] line-clamp-2 leading-relaxed">
                              {item.desc}
                            </p>
                            <span className="text-[10px] text-[#D89A86] font-semibold mt-1 inline-block">
                              {item.time}
                            </span>
                          </div>
                        </Link>

                        <div className="flex items-center gap-1 flex-shrink-0">
                          {!item.read ? (
                            <button
                              title="Mark as read"
                              onClick={(e) => handleMarkAsRead(item.id, e)}
                              className="h-6 w-6 rounded-md hover:bg-[#FFF8F2] border border-transparent hover:border-[#EFE6DD] flex items-center justify-center text-[#D89A86] cursor-pointer"
                            >
                              <Check className="h-3.5 w-3.5" />
                            </button>
                          ) : (
                            <button
                              title="Dismiss"
                              onClick={(e) => handleDismiss(item.id, e)}
                              className="h-6 w-6 rounded-md hover:bg-rose-50 border border-transparent hover:border-rose-200 flex items-center justify-center text-[#6C5C54] hover:text-rose-600 cursor-pointer"
                            >
                              <X className="h-3.5 w-3.5" />
                            </button>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>

                {/* Footer */}
                <div className="p-3 bg-[#FFF8F2] border-t border-[#EFE6DD] flex items-center justify-between">
                  <button
                    onClick={handleLoadNewNotifications}
                    className="text-[11px] font-bold text-[#6C5C54] hover:text-[#3A2B24] flex items-center gap-1 cursor-pointer transition-colors"
                  >
                    <RefreshCw className="h-3 w-3" /> Fetch New Alerts
                  </button>
                  <Link href="/admin/orders" className="text-xs font-bold text-[#D89A86] hover:underline flex items-center gap-1">
                    View All Orders →
                  </Link>
                </div>
              </DropdownMenuContent>
            </DropdownMenu>

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

        {/* Scrollable Page Body */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden min-w-0 w-full">{children}</div>
      </main>
    </div>
  );
}
