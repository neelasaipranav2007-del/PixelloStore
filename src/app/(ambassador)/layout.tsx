"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { LayoutDashboard, Users, Trophy, Wallet, User, LogOut, Link2, Heart, Sparkles, ShoppingBag, ExternalLink, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { useOrders } from "@/context/OrderContext";

export default function AmbassadorLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { orders } = useOrders();
  const [profile, setProfile] = useState({
    name: "Sree Charani Grandhe",
    college: "Aurora Deemed To Be A University",
  });
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);

  const [payoutHistory, setPayoutHistory] = useState<any[]>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("pixello_ambassador_payouts_v1");
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed)) return parsed;
        } catch (e) {}
      }
    }
    return [];
  });

  const totalBalance = useMemo(() => {
    const liveReferred = (orders || []).filter((o) => Boolean(o.referralCode));
    const liveCommissionTotal = liveReferred.reduce((sum, o) => {
      if (o.status === "Cancelled") return sum;
      return sum + Math.round((o.totalAmount || 0) * 0.10);
    }, 0);

    const settledPayoutsTotal = payoutHistory
      .filter((p) => p.status === "SETTLED")
      .reduce((sum, p) => sum + (Number(p.amount) || 0), 0);

    const pendingPayoutsTotal = payoutHistory
      .filter((p) => p.status === "PENDING")
      .reduce((sum, p) => sum + (Number(p.amount) || 0), 0);

    return Math.max(0, 4250 + liveCommissionTotal - settledPayoutsTotal - pendingPayoutsTotal);
  }, [orders, payoutHistory]);

  useEffect(() => {
    const checkAuthAndLoadProfile = () => {
      if (typeof window !== "undefined") {
        const isAuth = localStorage.getItem("pixello_ambassador_authenticated") === "true";
        setIsAuthenticated(isAuth);

        if (!isAuth && pathname !== "/ambassador/login") {
          router.push(`/ambassador/login?redirect=${encodeURIComponent(pathname)}`);
          return;
        }

        const saved = localStorage.getItem("pixello_ambassador_profile");
        if (saved) {
          try {
            const parsed = JSON.parse(saved);
            if (parsed.name) {
              setProfile(parsed);
            }
          } catch (e) {
            console.error(e);
          }
        }
        const savedPayouts = localStorage.getItem("pixello_ambassador_payouts_v1");
        if (savedPayouts) {
          try {
            setPayoutHistory(JSON.parse(savedPayouts));
          } catch (e) {}
        }
      }
    };

    checkAuthAndLoadProfile();
    window.addEventListener("pixello_ambassador_authenticated", checkAuthAndLoadProfile);
    window.addEventListener("pixello_ambassador_profile_updated", checkAuthAndLoadProfile);
    window.addEventListener("pixello_payout_requested", checkAuthAndLoadProfile);
    window.addEventListener("storage", checkAuthAndLoadProfile);
    return () => {
      window.removeEventListener("pixello_ambassador_authenticated", checkAuthAndLoadProfile);
      window.removeEventListener("pixello_ambassador_profile_updated", checkAuthAndLoadProfile);
      window.removeEventListener("pixello_payout_requested", checkAuthAndLoadProfile);
      window.removeEventListener("storage", checkAuthAndLoadProfile);
    };
  }, [pathname, router]);

  const handleSignOut = () => {
    if (typeof window !== "undefined") {
      localStorage.removeItem("pixello_ambassador_authenticated");
      localStorage.removeItem("pixello_ambassador_token");
      localStorage.removeItem("pixello_ambassador_profile");
      window.dispatchEvent(new Event("storage"));
    }
    router.push("/ambassador/login");
  };

  // If on login page, render children without the dashboard layout wrapper
  if (pathname === "/ambassador/login") {
    return <>{children}</>;
  }

  // Prevent flash while checking auth
  if (isAuthenticated === false) {
    return null;
  }

  const nameParts = profile.name.trim().split(" ");
  const initials = nameParts.length >= 2 ? `${nameParts[0][0]}${nameParts[1][0]}`.toUpperCase() : profile.name.slice(0, 2).toUpperCase();

  const SIDEBAR_ITEMS = [
    { label: "Dashboard", href: "/ambassador", icon: LayoutDashboard },
    { label: "My Referrals", href: "/ambassador/referrals", icon: Users },
    { label: "Promo Links & QR", href: "/ambassador/links", icon: Link2 },
    { label: "Leaderboard", href: "/ambassador/leaderboard", icon: Trophy },
    { label: "Wallet & Payouts", href: "/ambassador/wallet", icon: Wallet },
    { label: "My Profile", href: "/ambassador/settings", icon: User },
  ];

  return (
    <div className="flex h-screen w-screen bg-[#F8F3EE] overflow-hidden">
      {/* Pixello Light-Dark Espresso Sidebar (#3A2B24) */}
      <aside className="w-64 bg-[#3A2B24] text-white flex flex-col flex-shrink-0 border-r border-[#4E3D35] shadow-md select-none z-20">
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
                <Link key={item.label} href={item.href}>
                  <span
                    className={`flex items-center gap-3 px-3.5 py-3 text-sm transition-all cursor-pointer ${
                      isActive
                        ? "bg-[#FFF8F2]/20 text-white font-bold border-l-4 border-[#D89A86] rounded-r-2xl shadow-xs"
                        : "text-white/90 font-semibold hover:bg-[#FFF8F2]/15 hover:text-white rounded-2xl"
                    }`}
                  >
                    <Icon className={`h-5 w-5 ${isActive ? "text-[#D89A86]" : "text-white"}`} />
                    {item.label}
                  </span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Footer / Sign Out */}
        <div className="p-4 border-t border-[#4E3D35] bg-[#2E201A]">
          <Button 
            onClick={handleSignOut}
            variant="ghost" 
            className="w-full justify-start text-white hover:text-white hover:bg-[#FFF8F2]/15 rounded-2xl text-xs font-bold h-11 cursor-pointer"
          >
            <LogOut className="h-4 w-4 mr-2.5 text-[#D89A86]" /> Sign Out
          </Button>
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
              Available Balance: <span suppressHydrationWarning className="text-emerald-600 font-extrabold">₹{totalBalance.toLocaleString("en-IN")}</span>
            </div>

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
                    <p className="text-[10px] text-[#D89A86] font-extrabold">{profile.college} • Gold Tier</p>
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
                        Gold Tier
                      </span>
                    </div>
                    <p className="text-[11px] text-[#EFE6DD] font-medium">{profile.college}</p>
                    <p className="text-[10px] text-emerald-300 font-bold mt-1">₹4,250 Wallet Balance</p>
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
      </main>
    </div>
  );
}

