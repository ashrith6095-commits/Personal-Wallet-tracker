"use client";

import { useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Bell,
  AlertTriangle,
  CreditCard,
  Target,
  Repeat,
  CheckCheck,
  Inbox,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { fadeIn, staggerContainer, staggerItem } from "@/lib/animations";
import type { Notification } from "@/types";

function LoadingSkeleton() {
  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <Skeleton className="h-8 w-40" />
          <Skeleton className="h-4 w-56" />
        </div>
        <Skeleton className="h-9 w-32 rounded-lg" />
      </div>
      <Skeleton className="h-10 w-48" />
      <div className="space-y-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <Card key={i} className="border-0 shadow-sm dark:bg-slate-900">
            <CardContent className="p-4">
              <div className="flex items-start gap-4">
                <Skeleton className="h-10 w-10 rounded-xl shrink-0" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-48" />
                  <Skeleton className="h-3 w-72" />
                  <Skeleton className="h-3 w-24" />
                </div>
                <Skeleton className="h-2.5 w-2.5 rounded-full shrink-0 mt-1.5" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

function getNotificationIcon(type: string) {
  switch (type) {
    case "BUDGET_WARNING":
      return { icon: <AlertTriangle className="h-5 w-5 text-amber-600" />, bg: "bg-amber-100" };
    case "SUBSCRIPTION":
      return { icon: <CreditCard className="h-5 w-5 text-indigo-600" />, bg: "bg-indigo-100" };
    case "GOAL":
      return { icon: <Target className="h-5 w-5 text-emerald-600" />, bg: "bg-emerald-100" };
    case "RECURRING":
      return { icon: <Repeat className="h-5 w-5 text-blue-600" />, bg: "bg-blue-100" };
    default:
      return { icon: <Bell className="h-5 w-5 text-slate-600 dark:text-slate-300" />, bg: "bg-slate-100" };
  }
}

function timeAgo(dateStr: string): string {
  const now = new Date();
  const date = new Date(dateStr);
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  const weeks = Math.floor(days / 7);
  if (weeks < 4) return `${weeks}w ago`;
  const months = Math.floor(days / 30);
  return `${months}mo ago`;
}

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [markingAll, setMarkingAll] = useState(false);

  const fetchNotifications = useCallback(async () => {
    try {
      const res = await fetch("/api/notifications");
      if (!res.ok) throw new Error("Failed");
      const data = await res.json();
      setNotifications(data);
    } catch {
      toast.error("Failed to load notifications");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  async function markAsRead(id: string) {
    try {
      const res = await fetch("/api/notifications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, read: true }),
      });
      if (!res.ok) throw new Error("Failed");
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, read: true } : n))
      );
    } catch {
      toast.error("Failed to mark as read");
    }
  }

  async function markAllAsRead() {
    const unread = notifications.filter((n) => !n.read);
    if (unread.length === 0) {
      toast.info("All notifications are already read");
      return;
    }
    setMarkingAll(true);
    try {
      await Promise.all(
        unread.map((n) =>
          fetch("/api/notifications", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ id: n.id, read: true }),
          })
        )
      );
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      toast.success("All notifications marked as read");
    } catch {
      toast.error("Failed to mark all as read");
    } finally {
      setMarkingAll(false);
    }
  }

  const unreadCount = notifications.filter((n) => !n.read).length;

  if (loading) return <LoadingSkeleton />;

  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <motion.div
        initial="hidden"
        animate="visible"
        variants={fadeIn}
        transition={{ duration: 0.5 }}
        className="flex items-center justify-between"
      >
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">
            Notifications
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            {unreadCount > 0
              ? `You have ${unreadCount} unread notification${unreadCount !== 1 ? "s" : ""}`
              : "You're all caught up"}
          </p>
        </div>
        {unreadCount > 0 && (
          <Button
            variant="outline"
            size="sm"
            className="gap-2"
            onClick={markAllAsRead}
            disabled={markingAll}
          >
            {markingAll ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <CheckCheck className="h-4 w-4" />
            )}
            Mark all as read
          </Button>
        )}
      </motion.div>

      <motion.div initial="hidden" animate="visible" variants={fadeIn} transition={{ delay: 0.2 }}>
        <Tabs defaultValue="all">
          <TabsList className="mb-4">
            <TabsTrigger value="all" className="gap-1.5">
              All
              <Badge variant="secondary" className="ml-1 text-xs h-5 px-1.5">
                {notifications.length}
              </Badge>
            </TabsTrigger>
            <TabsTrigger value="unread" className="gap-1.5">
              Unread
              {unreadCount > 0 && (
                <Badge variant="destructive" className="ml-1 text-xs h-5 px-1.5">
                  {unreadCount}
                </Badge>
              )}
            </TabsTrigger>
          </TabsList>

          {(["all", "unread"] as const).map((tab) => (
            <TabsContent key={tab} value={tab}>
              {notifications.filter((n) =>
                tab === "unread" ? !n.read : true
              ).length === 0 ? (
                <EmptyState
                  icon={<Inbox className="h-8 w-8 text-slate-400 dark:text-slate-500" />}
                  title={tab === "unread" ? "No unread notifications" : "No notifications yet"}
                  description={
                    tab === "unread"
                      ? "You've read all your notifications"
                      : "Notifications about your finances will appear here"
                  }
                />
              ) : (
                <motion.div
                  className="space-y-2"
                  initial="hidden"
                  animate="visible"
                  variants={staggerContainer}
                >
                  <AnimatePresence mode="popLayout">
                    {notifications
                      .filter((n) => (tab === "unread" ? !n.read : true))
                      .map((notification) => {
                        const { icon, bg } = getNotificationIcon(notification.type);
                        return (
                          <motion.div
                            key={notification.id}
                            variants={staggerItem}
                            layout
                            exit={{ opacity: 0, x: -20, scale: 0.95 }}
                            onClick={() => {
                              if (!notification.read) markAsRead(notification.id);
                            }}
                          >
                            <Card
                              className={cn(
                                "border-0 transition-all duration-200 cursor-pointer",
                                notification.read
                                  ? "shadow-sm bg-white dark:bg-slate-900 hover:bg-slate-50/50 dark:hover:bg-slate-800/50"
                                   : "shadow-md bg-indigo-50/30 dark:bg-indigo-950/30 hover:shadow-md border-l-4 border-l-indigo-500"
                              )}
                            >
                              <CardContent className="p-4">
                                <div className="flex items-start gap-4">
                                  <div
                                    className={cn(
                                      "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl",
                                      bg
                                    )}
                                  >
                                    {icon}
                                  </div>

                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2">
                                      <p
                                        className={cn(
                                          "text-sm font-semibold text-slate-900 dark:text-slate-100",
                                          !notification.read && "font-bold"
                                        )}
                                      >
                                        {notification.title}
                                      </p>
                                    </div>
                                    <p className="text-sm text-slate-600 dark:text-slate-300 mt-0.5 line-clamp-2">
                                      {notification.message}
                                    </p>
                                    <p className="text-xs text-slate-400 dark:text-slate-500 mt-1.5">
                                      {timeAgo(notification.createdAt)}
                                    </p>
                                  </div>

                                  {!notification.read && (
                                    <div className="shrink-0 mt-1.5">
                                      <div className="h-2.5 w-2.5 rounded-full bg-indigo-500" />
                                    </div>
                                  )}
                                </div>
                              </CardContent>
                            </Card>
                          </motion.div>
                        );
                      })}
                  </AnimatePresence>
                </motion.div>
              )}
            </TabsContent>
          ))}
        </Tabs>
      </motion.div>
    </div>
  );
}
