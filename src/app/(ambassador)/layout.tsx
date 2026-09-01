"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { LayoutDashboard, Users, Trophy, Wallet, User, LogOut, Link2, Heart, Sparkles, ShoppingBag, ExternalLink, ChevronDown, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { 
  useMobileNotifications, 
  MobileNotificationToast, 
  CompactNotificationCenter 
} from "@/components/common/MobileNotificationSystem";

export default function AmbassadorLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();

  const [profile, setProfile] = useState<{
    name: string;
    college: string;
    tier: string;
    balance: number;
    referralCode: string;
  }>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("pixello_ambassador_profile");
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          return {
            name: parsed.name || "Campus Ambassador",
            college: parsed.college || "Campus Partner",
            tier: `${(parsed.rank || "GOLD").charAt(0)}${(parsed.rank || "GOLD").slice(1).toLowerCase()} Tier`,
            balance: parsed.balance || 0,
            referralCode: parsed.referralCode || parsed.promoCode || "",
          };
        } catch (e) {}
      }
    }
    return {
      name: "Campus Ambassador",
      college: "Campus Partner",
      tier: "Gold Tier",
      balance: 0,
      referralCode: "",
    };
  });

  // Real Database Notifications System for Ambassador Portal
  const {
    notifications: dbNotifications,
    unreadCount,
    activeToast,
    dismissToast,
    markAsRead,
    markAllAsRead,
    clearAll,
    deleteNotification,
  } = useMobileNotifications("AMBASSADOR");

  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(() => {
    if (typeof window !== "undefined") {
      const isAuth = localStorage.getItem("pixello_ambassador_authenticated") === "true";
      const hasToken = Boolean(localStorage.getItem("pixello_ambassador_token"));
      return isAuth && hasToken;
    }
    return null;
  });

  const fetchAmbassadorProfile = async () => {
    try {
      const token = typeof window !== "undefined" ? localStorage.getItem("pixello_ambassador_token") : null;
      const headers: Record<string, string> = {};
      if (token) headers["Authorization"] = `Bearer ${token}`;

      const res = await fetch("/api/ambassador/me", { headers });
      if (res.status === 401) {
        setIsAuthenticated(false);
        if (typeof window !== "undefined") {
          localStorage.removeItem("pixello_ambassador_authenticated");
          localStorage.removeItem("pixello_ambassador_token");
          localStorage.removeItem("pixello_auth_token");
          localStorage.removeItem("pixello_ambassador_profile");
          document.cookie = "pixello_ambassador_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
        }
        if (pathname !== "/ambassador/login") {
          router.replace("/ambassador/login");
        }
        return;
      }

      const data = await res.json();
      if (data.success && data.ambassador) {
        setIsAuthenticated(true);
        setProfile({
          name: data.ambassador.name,
          college: data.ambassador.college,
          tier: `${data.ambassador.rank.charAt(0)}${data.ambassador.rank.slice(1).toLowerCase()} Tier`,
          balance: data.ambassador.balance,
          referralCode: data.ambassador.referralCode,
        });
        if (typeof window !== "undefined") {
          localStorage.setItem("pixello_ambassador_authenticated", "true");
          localStorage.setItem("pixello_ambassador_profile", JSON.stringify(data.ambassador));
        }
      }
    } catch (e) {
      console.error("Error loading ambassador profile:", e);
    }
  };

  useEffect(() => {
    if (pathname === "/ambassador/login") return;

    fetchAmbassadorProfile();

    const handleProfileSync = () => {
      fetchAmbassadorProfile();
    };

    window.addEventListener("pixello_ambassador_profile_updated", handleProfileSync);
    window.addEventListener("pixello_payout_requested", handleProfileSync);
    window.addEventListener("pixello_orders_updated", handleProfileSync);
    return () => {
      window.removeEventListener("pixello_ambassador_profile_updated", handleProfileSync);
      window.removeEventListener("pixello_payout_requested", handleProfileSync);
      window.removeEventListener("pixello_orders_updated", handleProfileSync);
    };
  }, [pathname]);

  const handleSignOut = () => {
    if (typeof window !== "undefined") {
      localStorage.removeItem("pixello_ambassador_authenticated");
      localStorage.removeItem("pixello_ambassador_token");
      localStorage.removeItem("pixello_auth_token");
      localStorage.removeItem("pixello_ambassador_profile");
      localStorage.removeItem("pixello_ambassador_promo_config");
      document.cookie = "pixello_ambassador_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
      window.dispatchEvent(new Event("storage"));
      window.location.replace("/ambassador/login");
    }
  };

  // If on login page, render children directly without dashboard shell
  if (pathname === "/ambassador/login") {
    return <>{children}</>;
  }

  // If not authenticated, render clear redirecting view with direct button
  if (isAuthenticated === false) {
    return (
      <div className="flex h-screen w-screen flex-col items-center justify-center bg-[#F8F3EE] p-6 text-center">
        <div className="flex flex-col items-center max-w-sm p-8 bg-white rounded-3xl shadow-sm border border-[#EFE6DD] gap-4">
          <div className="h-12 w-12 rounded-2xl bg-[#FFF8F2] border border-[#EFE6DD] flex items-center justify-center text-[#D89A86]">
            <Lock className="h-6 w-6" />
          </div>
          <div>
            <h3 className="font-serif-brand font-bold text-lg text-[#3A2B24]">Ambassador Portal Login Required</h3>
            <p className="text-xs text-[#6C5C54] mt-1">Please enter your verified ambassador mobile number & PIN to access your personal dashboard.</p>
          </div>
          <Link href={`/ambassador/login?redirect=${encodeURIComponent(pathname)}`} className="w-full">
            <Button className="btn-pixello-primary w-full h-11 rounded-xl text-xs font-bold shadow-xs">
              Go to Ambassador Login →
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  // If loading, render elegant loader
  if (isAuthenticated === null) {
    return (
      <div className="flex h-screen w-screen flex-col items-center justify-center bg-[#F8F3EE] gap-3">
        <div className="h-10 w-10 border-4 border-[#D89A86] border-t-transparent rounded-full animate-spin" />
        <span className="font-serif-brand font-bold text-sm text-[#3A2B24]">Loading Ambassador Portal...</span>
      </div>
    );
  }

  const nameParts = (profile.name || "Ambassador").trim().split(/\s+/);
  const initials = nameParts.length >= 2 && nameParts[0] && nameParts[1]
    ? `${nameParts[0][0]}${nameParts[1][0]}`.toUpperCase()
    : (profile.name || "AM").slice(0, 2).toUpperCase();

  const SIDEBAR_ITEMS = [
    { label: "Dashboard", href: "/ambassador", icon: LayoutDashboard },
    { label: "My Referrals", href: "/ambassador/referrals", icon: Users },
    { label: "Promo Links & QR", href: "/ambassador/links", icon: Link2 },
    { label: "Leaderboard of Ambassadors", href: "/ambassador/leaderboard", icon: Trophy },
    { label: "Wallet & Payouts", href: "/ambassador/wallet", icon: Wallet },
    { label: "My Profile", href: "/ambassador/settings", icon: User },
  ];

  return (
    <div className="flex h-screen w-screen bg-[#F8F3EE] overflow-hidden">
      {/* Pixello Light-Dark Espresso Sidebar (#3A2B24) */}
      <aside className="w-64 bg-[#3A2B24] text-white flex flex-col flex-shrink-0 border-r border-[#4E3D35] shadow-md z-20">
        {/* Logo & Brand Header */}
        <div className="h-20 flex flex-col justify-center px-6 border-b border-[#4E3D35] bg-[#2E201A]">
          <div className="flex items-center gap-2">
            <span className="font-serif-brand text-2xl font-bold tracking-tight text-white flex items-center gap-1.5">
              Pixello
              <span className="text-[#D89A86] font-sans text-xs font-bold uppercase tracking-wider bg-[#FFF8F2]/10 border border-[#D89A86]/40 px-2 py-0.5 rounded-full shadow-2xs">
                Campus
              </span>
            </span>
          </div>
          <span className="text-[10px] text-[#EFE6DD]/80 font-medium uppercase tracking-widest mt-0.5 flex items-center gap-1">
            <Heart className="h-2.5 w-2.5 text-[#F48A8A] fill-[#F48A8A]" /> Ambassador Portal
          </span>
        </div>

        {/* Navigation Items */}
        <div className="flex-1 overflow-y-auto no-scrollbar py-5 px-3">
          <nav className="flex flex-col gap-1.5">
            {SIDEBAR_ITEMS.map((item) => {
              const isActive = pathname === item.href;
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-3 px-3.5 py-3 rounded-2xl text-xs font-bold transition-all cursor-pointer ${
                    isActive
                      ? "bg-[#D89A86] text-white shadow-xs font-extrabold"
                      : "text-[#EFE6DD]/85 hover:bg-[#FFF8F2]/10 hover:text-white"
                  }`}
                >
                  <Icon className={`h-4 w-4 ${isActive ? "text-white" : "text-[#D89A86]"}`} />
                  <span>{item.label}</span>
                  {isActive && (
                    <span className="ml-auto w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                  )}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Sidebar Footer User Card */}
        <div className="p-3 border-t border-[#4E3D35] bg-[#2E201A]">
          <div className="flex items-center gap-3 p-2 rounded-2xl bg-[#3A2B24]/80 border border-[#4E3D35]">
            <Avatar className="h-9 w-9 border border-[#D89A86]/60">
              <AvatarFallback className="bg-[#FFF8F2] text-[#3A2B24] font-bold text-xs">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold text-white truncate">{profile.name}</p>
              <p className="text-[10px] text-[#D89A86] font-medium truncate">{profile.college}</p>
            </div>
            <button
              onClick={handleSignOut}
              title="Sign Out"
              className="p-1.5 text-[#EFE6DD]/60 hover:text-rose-400 hover:bg-rose-950/30 rounded-xl transition-colors"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
        {/* Top Navbar Header with Student Ambassador Profile */}
        <header className="h-16 bg-white border-b border-[#EFE6DD] flex items-center justify-between px-8 flex-shrink-0 shadow-2xs">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-[#D89A86]" />
            <h1 className="font-serif-brand font-bold text-lg text-[#3A2B24]">Campus Ambassador Suite</h1>
          </div>

          <div className="flex items-center gap-4">
            <div className="text-xs font-semibold text-[#6C5C54] bg-[#FFF8F2] border border-[#EFE6DD] px-3.5 py-1.5 rounded-full flex items-center gap-1.5">
              Available Balance: <span suppressHydrationWarning className="text-emerald-600 font-extrabold">₹{profile.balance.toLocaleString("en-IN")}</span>
            </div>

            {/* Real Database Connected Compact Notification Center */}
            <CompactNotificationCenter
              role="AMBASSADOR"
              notifications={dbNotifications}
              unreadCount={unreadCount}
              onMarkRead={markAsRead}
              onMarkAllRead={markAllAsRead}
              onClearAll={clearAll}
              onDeleteSingle={deleteNotification}
              onNavigateOrder={(orderId) => {
                router.push("/ambassador/referrals");
              }}
            />

            <Link href="/products" target="_blank">
              <Button variant="outline" className="rounded-full border-[#EFE6DD] text-xs font-bold text-[#3A2B24] hover:bg-[#FFF8F2] flex items-center gap-1.5">
                <ShoppingBag className="h-3.5 w-3.5 text-[#D89A86]" /> Customer Store <ExternalLink className="h-3 w-3 text-[#6C5C54]" />
              </Button>
            </Link>

            {/* Student Ambassador Top Header Profile Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger className="focus:outline-none cursor-pointer">
                <div className="flex items-center gap-2.5 pl-3 border-l border-[#EFE6DD] hover:opacity-85 transition-opacity">
                  <div className="h-9 w-9 rounded-full bg-[#FFF8F2] border-2 border-[#D89A86] flex items-center justify-center font-bold text-[#D89A86] text-sm shadow-2xs">
                    {initials}
                  </div>
                  <div className="hidden sm:block text-left">
                    <div className="flex items-center gap-1">
                      <p className="text-xs font-bold text-[#3A2B24]">{profile.name}</p>
                      <ChevronDown className="h-3 w-3 text-[#6C5C54]" />
                    </div>
                    <p className="text-[10px] text-[#D89A86] font-extrabold">{profile.college} • {profile.tier}</p>
                  </div>
                </div>
              </DropdownMenuTrigger>

              <DropdownMenuContent align="end" className="w-64 rounded-3xl border border-[#EFE6DD] p-2.5 shadow-2xl bg-white">
                {/* Clickable Espresso Card Student Header -> Opens Profile */}
                <Link href="/ambassador/settings" className="block">
                  <div className="p-3.5 bg-[#3A2B24] hover:bg-[#2E201A] transition-colors rounded-2xl mb-2 text-white shadow-xs border border-[#4E3D35] cursor-pointer">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-bold text-[#D89A86]">{profile.name}</span>
                      <span className="text-[10px] bg-[#FFF8F2]/15 text-[#FFF8F2] font-bold px-2 py-0.5 rounded-full border border-[#D89A86]/40">
                        {profile.tier}
                      </span>
                    </div>
                    <p className="text-[11px] text-[#EFE6DD] font-medium">{profile.college}</p>
                    <p className="text-[10px] text-emerald-300 font-bold mt-1">₹{profile.balance.toLocaleString("en-IN")} Wallet Balance</p>
                  </div>
                </Link>

                <div className="flex flex-col gap-1">
                  <DropdownMenuItem asChild className="cursor-pointer rounded-xl p-0 focus:bg-transparent">
                    <Link href="/ambassador/settings" className="flex items-center gap-3 px-3 py-2.5 text-xs font-bold text-[#3A2B24] hover:bg-[#FFF8F2] transition-colors rounded-xl w-full">
                      <div className="h-7 w-7 rounded-lg bg-[#FFF8F2] border border-[#EFE6DD] flex items-center justify-center text-[#D89A86] flex-shrink-0">
                        <User className="h-3.5 w-3.5 text-[#D89A86]" />
                      </div>
                      <span className="text-[#3A2B24] font-bold">My Profile & Settings</span>
                    </Link>
                  </DropdownMenuItem>

                  <DropdownMenuItem asChild className="cursor-pointer rounded-xl p-0 focus:bg-transparent">
                    <Link href="/ambassador/wallet" className="flex items-center gap-3 px-3 py-2.5 text-xs font-bold text-[#3A2B24] hover:bg-[#FFF8F2] transition-colors rounded-xl w-full">
                      <div className="h-7 w-7 rounded-lg bg-[#FFF8F2] border border-[#EFE6DD] flex items-center justify-center text-[#D89A86] flex-shrink-0">
                        <Wallet className="h-3.5 w-3.5 text-[#D89A86]" />
                      </div>
                      <span className="text-[#3A2B24] font-bold">Wallet & Payouts</span>
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
                    onClick={handleSignOut}
                    className="cursor-pointer rounded-xl p-0 focus:bg-transparent"
                  >
                    <div className="flex items-center gap-3 px-3 py-2.5 text-xs font-bold text-rose-600 hover:bg-rose-50 transition-colors rounded-xl w-full">
                      <div className="h-7 w-7 rounded-lg bg-rose-50 border border-rose-100 flex items-center justify-center text-rose-600 flex-shrink-0">
                        <LogOut className="h-3.5 w-3.5 text-rose-600" />
                      </div>
                      <span className="text-rose-600 font-bold">Sign Out</span>
                    </div>
                  </DropdownMenuItem>
                </div>
              </DropdownMenuContent>
            </DropdownMenu>

          </div>
        </header>

        <div className="flex-1 overflow-y-auto overflow-x-hidden min-w-0 p-6">
          {children}
        </div>

        {/* MOBILE-STYLE ONE-LINE FLOATING POPUP TOAST */}
        <MobileNotificationToast
          toast={activeToast}
          onDismiss={dismissToast}
          onClick={(toast) => {
            markAsRead(toast.id);
            dismissToast();
            router.push("/ambassador/orders");
          }}
        />
      </main>
    </div>
  );
}
