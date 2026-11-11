"use client";

import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { createPortal } from "react-dom";
import { 
  Bell, 
  ArrowRight, 
  X, 
  Check, 
  Trash2, 
  Sparkles, 
  CheckCheck, 
  Search, 
  Filter, 
  Clock, 
  ShoppingBag, 
  Truck, 
  Percent, 
  AlertCircle,
  ExternalLink
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { sharedSSE } from "@/lib/sseClient";

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
      // Optimistic update
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
      setUnreadCount(prev => Math.max(0, prev - 1));
      if (activeToast?.id === id) dismissToast();

      await fetch("/api/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
    } catch (err) {
      console.error("Error marking notification as read:", err);
    }
  }, [activeToast, dismissToast]);

  const markAllAsRead = useCallback(async () => {
    try {
      // Optimistic update
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
      setUnreadCount(0);
      dismissToast();

      await fetch("/api/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ markAll: true, role, userId }),
      });
    } catch (err) {
      console.error("Error marking all notifications read:", err);
    }
  }, [role, userId, dismissToast]);

  const clearAll = useCallback(async () => {
    try {
      // Immediate optimistic update
      setNotifications([]);
      setUnreadCount(0);
      dismissToast();

      await fetch(`/api/notifications?role=${role}${userId ? `&userId=${encodeURIComponent(userId)}` : ""}`, {
        method: "DELETE",
      });
    } catch (err) {
      console.error("Error clearing notifications:", err);
    }
  }, [role, userId, dismissToast]);

  const deleteNotification = useCallback(async (id: string) => {
    try {
      setNotifications(prev => {
        const target = prev.find(n => n.id === id);
        if (target && !target.isRead) {
          setUnreadCount(u => Math.max(0, u - 1));
        }
        return prev.filter(n => n.id !== id);
      });
      if (activeToast?.id === id) dismissToast();

      await fetch(`/api/notifications?id=${encodeURIComponent(id)}`, {
        method: "DELETE",
      });
    } catch (err) {
      console.error("Error deleting single notification:", err);
    }
  }, [activeToast, dismissToast]);

  // Initial Fetch & Periodic Polling
  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 8000);
    return () => clearInterval(interval);
  }, [fetchNotifications]);

  // Real-Time Singleton SSE Listener
  useEffect(() => {
    const unsubNotif = sharedSSE.subscribe("notification_update", () => {
      fetchNotifications();
    });
    const unsubOrder = sharedSSE.subscribe("order_update", () => {
      fetchNotifications();
    });
    const unsubComm = sharedSSE.subscribe("commission_update", () => {
      fetchNotifications();
    });

    return () => {
      unsubNotif();
      unsubOrder();
      unsubComm();
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
    deleteNotification,
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
 * Full Interactive Notifications Center Modal
 */
export function AllNotificationsModal({
  isOpen,
  onClose,
  role,
  notifications,
  unreadCount,
  onMarkRead,
  onMarkAllRead,
  onClearAll,
  onDeleteSingle,
  onNavigateOrder,
}: {
  isOpen: boolean;
  onClose: () => void;
  role: string;
  notifications: MobileDbNotification[];
  unreadCount: number;
  onMarkRead: (id: string) => void;
  onMarkAllRead: () => void;
  onClearAll: () => void;
  onDeleteSingle?: (id: string) => void;
  onNavigateOrder: (orderId?: string | null) => void;
}) {
  const [mounted, setMounted] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterTab, setFilterTab] = useState<"ALL" | "UNREAD" | "ORDERS" | "SYSTEM">("ALL");

  useEffect(() => {
    setMounted(true);
  }, []);

  const filteredNotifications = useMemo(() => {
    return notifications.filter(n => {
      // Tab filter
      if (filterTab === "UNREAD" && n.isRead) return false;
      if (filterTab === "ORDERS" && n.referenceType !== "ORDER" && !n.title.toLowerCase().includes("order") && !n.message.toLowerCase().includes("order")) return false;
      if (filterTab === "SYSTEM" && (n.referenceType === "ORDER" || n.title.toLowerCase().includes("order"))) return false;

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return n.title.toLowerCase().includes(q) || n.message.toLowerCase().includes(q) || (n.referenceId && n.referenceId.toLowerCase().includes(q));
      }
      return true;
    });
  }, [notifications, filterTab, searchQuery]);

  if (!mounted || !isOpen || typeof document === "undefined") return null;

  return createPortal(
    <div 
      className="fixed inset-0 z-[999999] flex items-center justify-center p-4 bg-black/65 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div 
        className="bg-[#FFFDFB] border border-[#EFE6DD] w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh] animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 bg-[#2A1E17] text-white flex items-center justify-between border-b border-[#443228]">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-full bg-[#E5A852]/20 flex items-center justify-center text-[#F5C46B] border border-[#E5A852]/30 shadow-xs">
              <Bell className="h-4 w-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-base font-serif-brand tracking-wide uppercase text-white">
                  Notification Center
                </h3>
                <Badge className="bg-[#DF8673] text-white text-[10px] font-black rounded-full border-none px-2.5 py-0.5">
                  {role}
                </Badge>
              </div>
              <p className="text-[11px] text-[#EFE6DD]/70">
                {notifications.length} total • {unreadCount} unread
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {unreadCount > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  onMarkAllRead();
                }}
                className="h-8 rounded-full border-white/20 bg-white/10 text-white hover:bg-white/20 text-xs font-bold flex items-center gap-1.5 cursor-pointer"
              >
                <Check className="h-3.5 w-3.5 text-[#F5C46B]" /> Mark All Read
              </Button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="h-8 w-8 rounded-full bg-white/10 hover:bg-white/20 text-[#EFE6DD] flex items-center justify-center transition-colors cursor-pointer"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Toolbar: Search & Filter Tabs */}
        <div className="p-4 border-b border-[#EFE6DD] bg-[#FAF6F0] flex flex-col sm:flex-row gap-3 items-center justify-between">
          <div className="relative w-full sm:w-64">
            <Search className="h-3.5 w-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[#6C5C54]" />
            <Input
              placeholder="Search notifications..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8 h-9 text-xs rounded-xl bg-white border-[#EFE6DD] focus-visible:ring-[#DF8673]"
            />
            {searchQuery && (
              <button 
                type="button"
                onClick={() => setSearchQuery("")} 
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600 cursor-pointer"
              >
                <X className="h-3 w-3" />
              </button>
            )}
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
            {(["ALL", "UNREAD", "ORDERS", "SYSTEM"] as const).map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => setFilterTab(tab)}
                className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                  filterTab === tab
                    ? "bg-[#2A1E17] text-white shadow-xs"
                    : "bg-white text-[#6C5C54] hover:bg-[#FFF5EE] border border-[#EFE6DD]"
                }`}
              >
                {tab === "ALL" && `All (${notifications.length})`}
                {tab === "UNREAD" && `Unread (${unreadCount})`}
                {tab === "ORDERS" && "Orders"}
                {tab === "SYSTEM" && "System"}
              </button>
            ))}
          </div>
        </div>

        {/* Notifications List */}
        <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-2.5 bg-[#FAF6F0]">
          {filteredNotifications.length === 0 ? (
            <div className="py-16 text-center text-xs text-[#6C5C54] bg-white rounded-3xl border border-[#EFE6DD] p-8">
              <div className="h-12 w-12 rounded-full bg-[#FFF5EE] border border-[#EFE6DD] flex items-center justify-center mx-auto mb-3 text-[#DF8673]">
                <Bell className="h-6 w-6 opacity-60" />
              </div>
              <h4 className="font-bold text-sm text-[#3A2B24] mb-1">No Notifications Found</h4>
              <p className="text-xs text-[#6C5C54] max-w-xs mx-auto">
                {searchQuery ? "No alerts match your current search criteria." : "You have cleared all alerts for this portal."}
              </p>
            </div>
          ) : (
            filteredNotifications.map((notif) => (
              <div
                key={notif.id}
                onClick={() => {
                  onMarkRead(notif.id);
                  if (notif.referenceId) {
                    onNavigateOrder(notif.referenceId);
                  } else {
                    onNavigateOrder(null);
                  }
                  onClose();
                }}
                className={`p-4 rounded-2xl border transition-all cursor-pointer shadow-xs hover:shadow-md flex flex-col sm:flex-row sm:items-center justify-between gap-3 relative group overflow-hidden ${
                  !notif.isRead
                    ? "bg-white border-[#DF8673]/70 ring-1 ring-[#DF8673]/20 shadow-amber-900/5"
                    : "bg-white/90 border-[#EFE6DD] hover:border-[#DF8673]/40"
                }`}
              >
                {/* Left unread bar */}
                {!notif.isRead && (
                  <span className="absolute left-0 top-3 bottom-3 w-1 bg-[#DF8673] rounded-r-full" />
                )}

                <div className="flex items-start gap-3 flex-1 min-w-0">
                  <div className="h-9 w-9 rounded-full bg-[#FFF5EE] border border-[#EFE6DD] flex items-center justify-center flex-shrink-0 text-[#DF8673] mt-0.5">
                    {notif.referenceType === "ORDER" ? (
                      <ShoppingBag className="h-4 w-4" />
                    ) : (
                      <Bell className="h-4 w-4" />
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="font-bold text-xs sm:text-sm text-[#3A2B24]">
                        {notif.title}
                      </h4>
                      {!notif.isRead && (
                        <span className="h-2 w-2 rounded-full bg-[#DF8673] animate-pulse" />
                      )}
                      {notif.referenceId && (
                        <span className="text-[10px] bg-[#FAF6F0] border border-[#EFE6DD] font-mono font-bold text-[#6C5C54] px-2 py-0.5 rounded-md">
                          #{notif.referenceId}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-[#6C5C54] mt-1 line-clamp-2 leading-relaxed">
                      {notif.message}
                    </p>
                    <div className="flex items-center gap-2 mt-2 text-[11px] text-[#6C5C54]/80">
                      <Clock className="h-3 w-3 text-[#DF8673]" />
                      <span>{new Date(notif.createdAt).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })}</span>
                      <span>•</span>
                      <span>{formatNotificationTime(notif.createdAt)}</span>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 flex-shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-[#EFE6DD]/60 justify-end">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={(e) => {
                      e.stopPropagation();
                      onMarkRead(notif.id);
                      onNavigateOrder(notif.referenceId);
                      onClose();
                    }}
                    className="h-8 rounded-full border-[#EFE6DD] text-[#3A2B24] hover:bg-[#FFF5EE] text-xs font-bold flex items-center gap-1 cursor-pointer"
                  >
                    View <ArrowRight className="h-3 w-3 text-[#DF8673]" />
                  </Button>

                  {onDeleteSingle && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeleteSingle(notif.id);
                      }}
                      className="h-8 w-8 rounded-full text-stone-400 hover:text-red-600 hover:bg-red-50 flex items-center justify-center transition-colors cursor-pointer"
                      title="Delete notification"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-white border-t border-[#EFE6DD] flex items-center justify-between">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              if (window.confirm("Are you sure you want to clear all notifications?")) {
                onClearAll();
              }
            }}
            className="text-xs font-bold text-red-600 hover:text-red-700 flex items-center gap-1.5 px-3 py-1.5 rounded-xl hover:bg-red-50 transition-colors cursor-pointer"
          >
            <Trash2 className="h-3.5 w-3.5" /> Clear all notifications
          </button>

          <Button
            onClick={onClose}
            className="btn-pixello-primary rounded-full text-xs font-bold h-9 px-6 cursor-pointer"
          >
            Done
          </Button>
        </div>
      </div>
    </div>,
    document.body
  );
}

/**
 * Compact One-Line Notification Center Dropdown Menu (Exact 1:1 Design Matching User Request)
 */
export function CompactNotificationCenter({
  role,
  notifications,
  unreadCount,
  onMarkRead,
  onMarkAllRead,
  onClearAll,
  onNavigateOrder,
  onDeleteSingle,
}: {
  role: string;
  notifications: MobileDbNotification[];
  unreadCount: number;
  onMarkRead: (id: string) => void;
  onMarkAllRead: () => void;
  onClearAll: () => void;
  onNavigateOrder: (orderId?: string | null) => void;
  onDeleteSingle?: (id: string) => void;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [isAllModalOpen, setIsAllModalOpen] = useState(false);

  const handleClearAllClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    onClearAll();
  };

  const handleViewAllClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    setIsOpen(false);
    setTimeout(() => {
      setIsAllModalOpen(true);
    }, 50);
  };

  const handleNotificationItemClick = (notif: MobileDbNotification) => {
    onMarkRead(notif.id);
    if (notif.referenceId) {
      onNavigateOrder(notif.referenceId);
    } else {
      onNavigateOrder(null);
    }
    setIsOpen(false);
  };

  return (
    <>
      <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
        <DropdownMenuTrigger
          aria-label="Notifications"
          className="relative inline-flex items-center justify-center hover:bg-[#FFF8F2] text-[#3A2B24] rounded-full h-9 w-9 sm:h-10 sm:w-10 cursor-pointer border-none outline-none focus:outline-none transition-colors"
        >
          <Bell className="h-4 w-4 sm:h-5 sm:w-5 text-[#3A2B24]" />
          {unreadCount > 0 && (
            <span className="absolute top-1 right-1 flex h-4.5 w-4.5 items-center justify-center rounded-full bg-[#DF8673] text-[10px] font-black text-white shadow-sm animate-pulse">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </DropdownMenuTrigger>

        <DropdownMenuContent
          align="end"
          className="w-[360px] sm:w-[460px] max-w-[94vw] rounded-[28px] border border-[#EFE6DD] p-0 shadow-2xl bg-[#FFFDFB] overflow-hidden z-50 animate-in fade-in-50 zoom-in-95 duration-200"
        >
          {/* Header matching screenshot */}
          <div className="px-4 py-3 bg-[#2A1E17] text-white flex items-center justify-between border-b border-[#443228]">
            <div className="flex items-center gap-2.5">
              <div className="h-7 w-7 rounded-full bg-[#E5A852]/20 flex items-center justify-center text-[#F5C46B] border border-[#E5A852]/40 shadow-2xs">
                <Bell className="h-3.5 w-3.5" />
              </div>
              <h4 className="font-bold text-xs sm:text-sm font-serif-brand tracking-wider uppercase text-white">
                NOTIFICATIONS
              </h4>
              {unreadCount > 0 && (
                <span className="bg-[#DF8673] text-white text-[11px] font-black px-2.5 py-0.5 rounded-full shadow-2xs">
                  {unreadCount} new
                </span>
              )}
            </div>

            {unreadCount > 0 && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onMarkAllRead();
                }}
                className="text-xs text-[#EFE6DD]/90 hover:text-white font-semibold transition-colors cursor-pointer flex items-center gap-1.5"
              >
                <Check className="h-3.5 w-3.5 text-[#F5C46B]" />
                <span>Mark all read</span>
              </button>
            )}
          </div>

          {/* List of Notification Cards matching screenshot */}
          <div className="max-h-[380px] overflow-y-auto p-3 flex flex-col gap-2 bg-[#FAF6F0]">
            {notifications.length === 0 ? (
              <div className="p-8 text-center text-xs text-[#6C5C54] bg-white rounded-3xl border border-[#EFE6DD]">
                <Bell className="h-6 w-6 text-[#DF8673] mx-auto mb-2 opacity-60" />
                <p className="font-bold text-[#3A2B24] text-xs">No Notifications</p>
                <p className="text-[11px] text-[#6C5C54] mt-0.5">You're all caught up with official updates.</p>
              </div>
            ) : (
              notifications.map((notif) => (
                <div
                  key={notif.id}
                  onClick={() => handleNotificationItemClick(notif)}
                  className={`p-3 rounded-[24px] border transition-all cursor-pointer shadow-2xs hover:shadow-md flex items-center justify-between gap-3 relative group overflow-hidden ${
                    !notif.isRead
                      ? "bg-white border-[#DF8673]/60 ring-1 ring-[#DF8673]/15 shadow-amber-900/5"
                      : "bg-white/90 border-[#EFE6DD] hover:border-[#DF8673]/40"
                  }`}
                >
                  {/* Unread Indicator Bar */}
                  {!notif.isRead && (
                    <span className="absolute left-0 top-3 bottom-3 w-[4px] bg-[#DF8673] rounded-r-full" />
                  )}

                  {/* Left Bell Icon Badge */}
                  <div className="h-8 w-8 rounded-full bg-[#FFF5EE] border border-[#EFE6DD] flex items-center justify-center flex-shrink-0 text-[#DF8673]">
                    <Bell className="h-4 w-4" />
                  </div>

                  {/* Single-Line Title & Message Content */}
                  <div className="flex-1 min-w-0 flex items-center gap-1.5 text-xs overflow-hidden">
                    <span className="font-bold text-[#3A2B24] truncate flex-shrink-0 max-w-[130px] sm:max-w-[160px]">
                      {notif.title}
                    </span>
                    <span className="text-[#8C7A70] text-xs flex-shrink-0">—</span>
                    <span className="text-[#6C5C54] text-xs font-medium truncate flex-1 min-w-0">
                      {notif.message}
                    </span>
                  </div>

                  {/* Timestamp & Right Arrow Button */}
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className="text-[11px] font-medium text-[#8C7A70] whitespace-nowrap">
                      {formatNotificationTime(notif.createdAt)}
                    </span>
                    <div className="h-7 w-7 rounded-full bg-white border border-[#EFE6DD] group-hover:border-[#DF8673] flex items-center justify-center text-[#DF8673] transition-colors shadow-2xs">
                      <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-0.5 transition-transform" />
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer Bar matching screenshot */}
          {notifications.length > 0 && (
            <div className="px-4 py-3 bg-white border-t border-[#EFE6DD] flex items-center justify-between text-xs">
              <button
                type="button"
                onClick={handleClearAllClick}
                className="text-xs text-[#6C5C54] hover:text-red-600 font-bold flex items-center gap-1.5 cursor-pointer transition-colors px-2 py-1 rounded-lg hover:bg-red-50"
              >
                <Trash2 className="h-3.5 w-3.5" /> Clear all
              </button>
              <button
                type="button"
                onClick={handleViewAllClick}
                className="text-xs font-bold text-[#3A2B24] hover:text-[#DF8673] flex items-center gap-1.5 transition-colors px-4 py-1.5 rounded-full border border-[#EFE6DD] hover:bg-[#FFF5EE] cursor-pointer shadow-2xs bg-white"
              >
                <span>View All</span>
                <ArrowRight className="h-3.5 w-3.5 text-[#DF8673]" />
              </button>
            </div>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Full All Notifications Modal */}
      <AllNotificationsModal
        isOpen={isAllModalOpen}
        onClose={() => setIsAllModalOpen(false)}
        role={role}
        notifications={notifications}
        unreadCount={unreadCount}
        onMarkRead={onMarkRead}
        onMarkAllRead={onMarkAllRead}
        onClearAll={onClearAll}
        onDeleteSingle={onDeleteSingle}
        onNavigateOrder={onNavigateOrder}
      />
    </>
  );
}
