"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { createPortal } from "react-dom";
import { Bell, ArrowRight, X, Check, Trash2, Sparkles, CheckCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

export interface MobileDbNotification {
  id: string;
  role: string | null;
  userId: string | null;
  type: string;
  title: string;
  message: string;
  referenceType?: string | null;
  referenceId?: string | null;
  isRead: boolean;
  createdAt: string;
}

export function formatNotificationTime(dateStr: string): string {
  try {
    const d = new Date(dateStr);
    const now = new Date();
    const diffSec = Math.floor((now.getTime() - d.getTime()) / 1000);
    if (diffSec < 45) return "Just now";
    if (diffSec < 3600) return `${Math.floor(diffSec / 60)}m ago`;
    if (diffSec < 86400) return `${Math.floor(diffSec / 3600)}h ago`;
    return `${Math.floor(diffSec / 86400)}d ago`;
  } catch (e) {
    return "Just now";
  }
}

/**
 * Universal Hook for Database Notifications with Real-Time SSE Sync
 */
export function useMobileNotifications(role: "ADMIN" | "STUDIO" | "DELIVERY" | "CUSTOMER" | "AMBASSADOR", userId?: string | null) {
  const [notifications, setNotifications] = useState<MobileDbNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [activeToast, setActiveToast] = useState<MobileDbNotification | null>(null);
  const toastTimerRef = useRef<NodeJS.Timeout | null>(null);
  const seenNotifIdsRef = useRef<Set<string>>(new Set());

  const fetchNotifications = useCallback(async () => {
    try {
      const url = `/api/notifications?role=${role}${userId ? `&userId=${encodeURIComponent(userId)}` : ""}`;
      const res = await fetch(url);
      const data = await res.json();
      if (data.success && Array.isArray(data.notifications)) {
        setNotifications(data.notifications);
        setUnreadCount(data.unreadCount || 0);

        // Check if there's a fresh unread notification to show as a one-line mobile toast
        const unreadItems = data.notifications.filter((n: MobileDbNotification) => !n.isRead);
        if (unreadItems.length > 0) {
          const newest = unreadItems[0];
          if (!seenNotifIdsRef.current.has(newest.id)) {
            seenNotifIdsRef.current.add(newest.id);
            showToast(newest);
          }
        }
      }
    } catch (err) {
      console.error("Error fetching notifications:", err);
    }
  }, [role, userId]);

  const showToast = useCallback((notif: MobileDbNotification) => {
    setActiveToast(notif);
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    // Auto dismiss after 5 seconds
    toastTimerRef.current = setTimeout(() => {
      setActiveToast(null);
    }, 5000);
  }, []);

  const dismissToast = useCallback(() => {
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    setActiveToast(null);
  }, []);

  const markAsRead = useCallback(async (id: string) => {
    try {
      await fetch("/api/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
      setUnreadCount(prev => Math.max(0, prev - 1));
      if (activeToast?.id === id) dismissToast();
    } catch (err) {
      console.error("Error marking notification as read:", err);
    }
  }, [activeToast, dismissToast]);

  const markAllAsRead = useCallback(async () => {
    try {
      await fetch("/api/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ markAll: true, role, userId }),
      });
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
      setUnreadCount(0);
      dismissToast();
    } catch (err) {
      console.error("Error marking all notifications read:", err);
    }
  }, [role, userId, dismissToast]);

  const clearAll = useCallback(async () => {
    try {
      await fetch(`/api/notifications?role=${role}${userId ? `&userId=${encodeURIComponent(userId)}` : ""}`, {
        method: "DELETE",
      });
      setNotifications([]);
      setUnreadCount(0);
      dismissToast();
    } catch (err) {
      console.error("Error clearing notifications:", err);
    }
  }, [role, userId, dismissToast]);

  // Initial Fetch & Periodic Polling
  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 8000);
    return () => clearInterval(interval);
  }, [fetchNotifications]);

  // Real-Time SSE Listener
  useEffect(() => {
    let eventSource: EventSource | null = null;
    try {
      eventSource = new EventSource("/api/events");
      eventSource.addEventListener("notification_update", () => {
        fetchNotifications();
      });
      eventSource.addEventListener("order_update", () => {
        fetchNotifications();
      });
      eventSource.addEventListener("commission_update", () => {
        fetchNotifications();
      });
    } catch (e) {
      console.error("SSE connection error in notifications:", e);
    }

    return () => {
      if (eventSource) eventSource.close();
    };
  }, [fetchNotifications]);

  return {
    notifications,
    unreadCount,
    activeToast,
    dismissToast,
    markAsRead,
    markAllAsRead,
    clearAll,
    fetchNotifications,
  };
}

/**
 * Mobile-Style One-Line Floating Notification Popup/Toast
 */
export function MobileNotificationToast({
  toast,
  onDismiss,
  onClick,
}: {
  toast: MobileDbNotification | null;
  onDismiss: () => void;
  onClick: (toast: MobileDbNotification) => void;
}) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted || !toast || typeof document === "undefined") return null;

  return createPortal(
    <div
      onClick={() => onClick(toast)}
      role="alert"
      className="fixed top-4 left-3 right-3 sm:left-auto sm:right-6 sm:top-5 z-[999999] w-auto sm:w-[440px] max-w-[94vw] h-[56px] sm:h-[60px] bg-[#FFFDFB]/95 backdrop-blur-xl border border-[#D89A86]/50 rounded-full shadow-[0_14px_38px_rgba(58,43,36,0.22)] px-3.5 sm:px-4.5 flex items-center justify-between gap-2.5 transition-all cursor-pointer select-none animate-in slide-in-from-top-4 sm:slide-in-from-right-4 fade-in-50 zoom-in-95 duration-300 hover:border-[#D89A86] hover:shadow-[0_18px_45px_rgba(58,43,36,0.28)]"
    >
      {/* Small Pixello Logo / Bell Accent */}
      <div className="h-8 w-8 rounded-full bg-[#3A2B24] border border-[#4E3D35] flex items-center justify-center flex-shrink-0 shadow-2xs overflow-hidden">
        <img src="/images/pixello_logo.png" alt="Pixello" className="h-5 w-5 rounded-full object-cover" />
      </div>

      {/* Strict One Single Horizontal Line Content */}
      <div className="flex-1 min-w-0 flex items-center gap-1.5 overflow-hidden text-xs">
        <span className="font-extrabold text-[#3A2B24] text-[11px] tracking-tight uppercase flex-shrink-0">
          PIXELLO
        </span>
        <span className="text-[#D89A86] font-black text-xs flex-shrink-0">•</span>
        <span className="font-bold text-[#3A2B24] truncate flex-shrink-0">
          {toast.title}
        </span>
        <span className="text-[#6C5C54] flex-shrink-0">—</span>
        <span className="text-[#6C5C54] font-medium truncate">
          {toast.message}
        </span>
      </div>

      {/* Right Actions: Arrow & Close */}
      <div className="flex items-center gap-1 flex-shrink-0">
        <div className="h-6 w-6 rounded-full flex items-center justify-center text-[#D89A86] hover:text-[#3A2B24] transition-colors">
          <ArrowRight className="h-4 w-4" />
        </div>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onDismiss();
          }}
          className="h-6 w-6 rounded-full bg-[#FFF8F2] hover:bg-[#F2C8B5]/40 text-[#6C5C54] hover:text-[#3A2B24] flex items-center justify-center text-xs font-bold transition-colors cursor-pointer border border-[#EFE6DD]"
          title="Dismiss notification"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>,
    document.body
  );
}

/**
 * Compact One-Line Notification Center Dropdown Menu
 */
export function CompactNotificationCenter({
  role,
  notifications,
  unreadCount,
  onMarkRead,
  onMarkAllRead,
  onClearAll,
  onNavigateOrder,
}: {
  role: string;
  notifications: MobileDbNotification[];
  unreadCount: number;
  onMarkRead: (id: string) => void;
  onMarkAllRead: () => void;
  onClearAll: () => void;
  onNavigateOrder: (orderId?: string | null) => void;
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        aria-label="Notifications"
        className="relative inline-flex items-center justify-center hover:bg-[#FFF8F2] text-[#3A2B24] rounded-full h-9 w-9 sm:h-10 sm:w-10 cursor-pointer border-none outline-none focus:outline-none transition-colors"
      >
        <Bell className="h-4 w-4 sm:h-5 sm:w-5 text-[#3A2B24]" />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-[#D89A86] text-[10px] font-bold text-white shadow-sm animate-pulse">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </DropdownMenuTrigger>

      <DropdownMenuContent
        align="end"
        className="w-[360px] sm:w-[440px] max-w-[94vw] rounded-3xl border border-[#EFE6DD] p-0 shadow-2xl bg-[#FFFDFB] overflow-hidden z-50 animate-in fade-in-50 zoom-in-95 duration-200"
      >
        {/* Compact Espresso Header */}
        <div className="px-4 py-3 bg-[#2E201A] text-white flex items-center justify-between border-b border-[#443228]">
          <div className="flex items-center gap-2">
            <div className="h-7 w-7 rounded-xl bg-white/10 flex items-center justify-center text-amber-300 border border-white/10 shadow-xs">
              <Bell className="h-3.5 w-3.5" />
            </div>
            <h4 className="font-bold text-xs font-serif-brand tracking-wide uppercase text-[#EFE6DD]">
              Notifications
            </h4>
            {unreadCount > 0 && (
              <span className="bg-[#D89A86] text-white text-[10px] font-black px-2 py-0.2 rounded-full shadow-2xs">
                {unreadCount} new
              </span>
            )}
          </div>
          {unreadCount > 0 && (
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onMarkAllRead();
              }}
              className="text-[11px] text-[#EFE6DD]/80 hover:text-white font-semibold transition-colors cursor-pointer flex items-center gap-1"
            >
              <Check className="h-3 w-3 text-amber-300" />
              <span>Mark all read</span>
            </button>
          )}
        </div>

        {/* Compact Single-Line Notification Items List */}
        <div className="max-h-[360px] overflow-y-auto p-2.5 flex flex-col gap-1.5 bg-[#FAF6F0]">
          {notifications.length === 0 ? (
            <div className="p-8 text-center text-xs text-[#6C5C54] bg-white rounded-2xl border border-[#EFE6DD]">
              <Bell className="h-5 w-5 text-[#D89A86] mx-auto mb-1.5 opacity-60" />
              <p className="font-bold text-[#3A2B24] text-xs">No Notifications</p>
              <p className="text-[10px] text-[#6C5C54]">You're all caught up with official updates.</p>
            </div>
          ) : (
            notifications.map((notif) => (
              <div
                key={notif.id}
                onPointerDown={(e) => e.stopPropagation()}
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  onMarkRead(notif.id);
                  onNavigateOrder(notif.referenceId);
                }}
                className={`p-2.5 sm:p-3 rounded-2xl border transition-all cursor-pointer shadow-xs hover:shadow-md flex items-center justify-between gap-2.5 relative group overflow-hidden ${
                  !notif.isRead
                    ? "bg-white border-[#D89A86]/60 ring-1 ring-[#D89A86]/15 shadow-amber-900/5"
                    : "bg-white/90 border-[#EFE6DD] hover:border-[#D89A86]/40"
                }`}
              >
                {/* Unread Indicator Bar */}
                {!notif.isRead && (
                  <span className="absolute left-0 top-2 bottom-2 w-1 bg-[#D89A86] rounded-r-full" />
                )}

                {/* Left Mini Icon */}
                <div className="h-7 w-7 rounded-lg bg-[#FFF8F2] border border-[#EFE6DD] flex items-center justify-center flex-shrink-0 text-[#D89A86]">
                  <Bell className="h-3.5 w-3.5" />
                </div>

                {/* Single-Line Content Preview */}
                <div className="flex-1 min-w-0 flex items-center gap-1.5 text-xs overflow-hidden">
                  <span className="font-bold text-[#3A2B24] truncate flex-shrink-0 max-w-[120px] sm:max-w-[150px]">
                    {notif.title}
                  </span>
                  <span className="text-[#6C5C54] text-[10px] flex-shrink-0">—</span>
                  <span className="text-[#6C5C54] text-xs font-medium truncate flex-1 min-w-0">
                    {notif.message}
                  </span>
                </div>

                {/* Timestamp & Arrow */}
                <div className="flex items-center gap-1.5 flex-shrink-0">
                  <span className="text-[10px] font-medium text-[#6C5C54] whitespace-nowrap">
                    {formatNotificationTime(notif.createdAt)}
                  </span>
                  <ArrowRight className="h-3.5 w-3.5 text-[#D89A86] opacity-60 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all" />
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        {notifications.length > 0 && (
          <div className="px-3.5 py-2.5 bg-white border-t border-[#EFE6DD] flex items-center justify-between text-xs">
            <button
              type="button"
              onPointerDown={(e) => e.stopPropagation()}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onClearAll();
              }}
              className="text-[11px] text-[#6C5C54] hover:text-red-600 font-bold flex items-center gap-1 cursor-pointer transition-colors px-2 py-1 rounded-lg hover:bg-red-50"
            >
              <Trash2 className="h-3 w-3" /> Clear all
            </button>
            <button
              type="button"
              onPointerDown={(e) => e.stopPropagation()}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onNavigateOrder(null);
              }}
              className="text-[11px] font-bold text-[#3A2B24] hover:text-[#D89A86] flex items-center gap-1 transition-colors px-2.5 py-1 rounded-lg hover:bg-[#FFF8F2] border border-[#EFE6DD] cursor-pointer shadow-2xs"
            >
              <span>View All</span>
              <ArrowRight className="h-3 w-3 text-[#D89A86]" />
            </button>
          </div>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
