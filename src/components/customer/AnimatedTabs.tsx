'use client';

import React, { Suspense, useMemo } from 'react';
import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import { Home, ShoppingBag, Package, User } from 'lucide-react';
import { AnimatedBackground } from '@/components/core/animated-background';
import { cn } from '@/lib/utils';

export interface TabItem {
  id: 'home' | 'shop' | 'orders' | 'account';
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
}

export const CUSTOMER_MOBILE_TABS: TabItem[] = [
  {
    id: 'home',
    label: 'Home',
    href: '/',
    icon: Home,
  },
  {
    id: 'shop',
    label: 'Shop',
    href: '/products',
    icon: ShoppingBag,
  },
  {
    id: 'orders',
    label: 'My Orders',
    href: '/profile?tab=orders',
    icon: Package,
  },
  {
    id: 'account',
    label: 'Account',
    href: '/profile?tab=profile',
    icon: User,
  },
];

function AnimatedTabsInner() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Determine active tab id based on current route and search params
  const activeTabId = useMemo<'home' | 'shop' | 'orders' | 'account' | null>(() => {
    if (!pathname) return null;

    if (pathname === '/') {
      return 'home';
    }

    if (
      pathname.startsWith('/products') ||
      pathname.startsWith('/product') ||
      pathname.startsWith('/categories') ||
      pathname.startsWith('/category')
    ) {
      return 'shop';
    }

    if (pathname.startsWith('/profile')) {
      const tabParam = searchParams.get('tab');
      if (tabParam === 'orders') {
        return 'orders';
      }
      return 'account';
    }

    // Default or other customer pages (e.g. /cart, /wishlist)
    return null;
  }, [pathname, searchParams]);

  // Pages where floating bottom navigation must NOT be displayed:
  // - Login and registration pages
  // - Checkout page (to avoid covering checkout controls/payment buttons)
  // - Admin, Ambassador, Delivery, Studio portals
  const shouldHide = useMemo(() => {
    if (!pathname) return true;
    return (
      pathname === '/login' ||
      pathname === '/checkout' ||
      pathname.startsWith('/admin') ||
      pathname.startsWith('/ambassador') ||
      pathname.startsWith('/delivery') ||
      pathname.startsWith('/studio')
    );
  }, [pathname]);

  if (shouldHide) {
    return null;
  }

  return (
    <nav
      aria-label="Mobile Bottom Navigation"
      role="navigation"
      className="fixed bottom-4 inset-x-0 mx-auto z-40 w-fit max-w-[95vw] px-2 md:hidden pointer-events-auto select-none"
    >
      <div className="flex items-center gap-1 rounded-full border border-[#EFE6DD] bg-white/95 p-1.5 shadow-[0_10px_35px_rgba(58,43,36,0.15)] backdrop-blur-md">
        <AnimatedBackground
          defaultValue={activeTabId || undefined}
          value={activeTabId || undefined}
          className="rounded-full bg-gradient-to-r from-[#FFF4ED] to-[#FFEBE3] border border-[#F2C8B5] shadow-2xs"
          transition={{
            type: 'spring',
            bounce: 0.2,
            duration: 0.3,
          }}
        >
          {CUSTOMER_MOBILE_TABS.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTabId === tab.id;

            return (
              <Link
                key={tab.id}
                href={tab.href}
                data-id={tab.id}
                role="tab"
                aria-selected={isActive}
                aria-label={tab.label}
                className={cn(
                  'flex flex-col items-center justify-center py-1.5 px-3.5 sm:px-4 min-w-[64px] min-h-[46px] rounded-full transition-colors duration-150 outline-none focus-visible:ring-2 focus-visible:ring-[#D89A86]',
                  isActive
                    ? 'text-[#D89A86] font-bold'
                    : 'text-[#6C5C54] hover:text-[#3A2B24] font-medium'
                )}
              >
                <Icon
                  className={cn(
                    'h-4.5 w-4.5 transition-transform duration-150',
                    isActive && 'scale-110 text-[#D89A86]'
                  )}
                />
                <span className="text-[10px] tracking-tight mt-0.5 leading-none font-sans">
                  {tab.label}
                </span>
              </Link>
            );
          })}
        </AnimatedBackground>
      </div>
    </nav>
  );
}

export function AnimatedTabs() {
  return (
    <Suspense fallback={null}>
      <AnimatedTabsInner />
    </Suspense>
  );
}

export default AnimatedTabs;
