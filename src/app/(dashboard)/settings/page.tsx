"use client";

import { useEffect, useState, useCallback } from "react";
import { motion } from "framer-motion";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTheme } from "next-themes";
import {
  User,
  Settings,
  Palette,
  Database,
  Loader2,
  Save,
  Download,
  Trash2,
  Globe,
  Shield,
} from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { useAuth } from "@/components/providers/auth-provider";
import { z } from "zod";
import { fadeIn, staggerContainer, staggerItem } from "@/lib/animations";

const profileSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
});

type ProfileInput = z.infer<typeof profileSchema>;

const CURRENCIES = [
  { value: "₹", label: "₹ INR (Indian Rupee)" },
  { value: "$", label: "$ USD (US Dollar)" },
  { value: "€", label: "€ EUR (Euro)" },
  { value: "£", label: "£ GBP (British Pound)" },
  { value: "¥", label: "¥ JPY (Japanese Yen)" },
];

const TIMEZONES = [
  "Asia/Kolkata",
  "America/New_York",
  "America/Los_Angeles",
  "America/Chicago",
  "Europe/London",
  "Europe/Berlin",
  "Europe/Paris",
  "Asia/Tokyo",
  "Asia/Shanghai",
  "Australia/Sydney",
];

function LoadingSkeleton() {
  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <Skeleton className="h-8 w-36" />
      <div className="space-y-6">
        {Array.from({ length: 3 }).map((_, i) => (
          <Card key={i} className="border-0 shadow-md dark:bg-slate-900">
            <CardHeader>
              <Skeleton className="h-5 w-40" />
              <Skeleton className="h-4 w-64" />
            </CardHeader>
            <CardContent className="space-y-4">
              <Skeleton className="h-10 w-full rounded-xl" />
              <Skeleton className="h-10 w-full rounded-xl" />
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

export default function SettingsPage() {
  const { theme, setTheme } = useTheme();
  const { user, refresh } = useAuth();
  const [loading, setLoading] = useState(true);
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPrefs, setSavingPrefs] = useState(false);
  const [currency, setCurrency] = useState("₹");
  const [timezone, setTimezone] = useState("Asia/Kolkata");
  const [clearDialogOpen, setClearDialogOpen] = useState(false);
  const [clearing, setClearing] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isDirty },
  } = useForm<ProfileInput>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: "",
    },
  });

  const fetchSettings = useCallback(async () => {
    try {
      const res = await fetch("/api/auth/me");
      if (res.ok) {
        const data = await res.json();
        reset({ name: data.name || "" });
        if (data.currency) setCurrency(data.currency);
        if (data.timezone) setTimezone(data.timezone);
      }
    } catch {
      // silently handle
    } finally {
      setLoading(false);
    }
  }, [reset]);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  useEffect(() => {
    if (user?.name) {
      reset({ name: user.name });
    }
  }, [user, reset]);

  async function onSaveProfile(data: ProfileInput) {
    setSavingProfile(true);
    try {
      const res = await fetch("/api/auth/me", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => null);
        toast.error(err?.error || "Failed to update profile");
        return;
      }
      toast.success("Profile updated");
      refresh();
    } catch {
      toast.error("Failed to update profile");
    } finally {
      setSavingProfile(false);
    }
  }

  async function handleClearData() {
    setClearing(true);
    try {
      const res = await fetch("/api/settings/clear-data", { method: "DELETE" });
      if (!res.ok) throw new Error("Failed");
      toast.success("All data cleared successfully");
      setClearDialogOpen(false);
    } catch {
      toast.error("Failed to clear data");
    } finally {
      setClearing(false);
    }
  }

  if (loading) return <LoadingSkeleton />;

  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <motion.div
        initial="hidden"
        animate="visible"
        variants={fadeIn}
        transition={{ duration: 0.5 }}
      >
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">Settings</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          Manage your account preferences and data
        </p>
      </motion.div>

      <motion.div
        className="space-y-6"
        initial="hidden"
        animate="visible"
        variants={staggerContainer}
      >
        {/* Profile Section */}
        <motion.div variants={staggerItem}>
          <Card className="border-0 shadow-md overflow-hidden dark:bg-slate-900">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-100">
                  <User className="h-5 w-5 text-indigo-600" />
                </div>
                <div>
                  <CardTitle className="text-base font-semibold">Profile</CardTitle>
                  <CardDescription>Your personal information</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit(onSaveProfile)} className="space-y-4">
                <div className="flex items-center gap-4 mb-6">
                  <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-indigo-500 shadow-lg">
                    <span className="text-2xl font-bold text-white">
                      {user?.name?.charAt(0)?.toUpperCase() || "U"}
                    </span>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-900 dark:text-slate-100">{user?.name}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">{user?.email}</p>
                  </div>
                </div>

                <Input
                  label="Full Name"
                  placeholder="Your name"
                  icon={<User className="h-4 w-4" />}
                  error={errors.name?.message}
                  {...register("name")}
                />

                <Input
                  label="Email"
                  value={user?.email || ""}
                  disabled
                  icon={<Shield className="h-4 w-4" />}
                />

                <div className="flex justify-end">
                  <Button type="submit" disabled={savingProfile || !isDirty} className="gap-2">
                    {savingProfile ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Save className="h-4 w-4" />
                    )}
                    Save Changes
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </motion.div>

        {/* Preferences Section */}
        <motion.div variants={staggerItem}>
          <Card className="border-0 shadow-md overflow-hidden dark:bg-slate-900">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-100">
                  <Palette className="h-5 w-5 text-amber-600" />
                </div>
                <div>
                  <CardTitle className="text-base font-semibold">Preferences</CardTitle>
                  <CardDescription>Customize your app experience</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Currency */}
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300 flex items-center gap-2">
                  Currency
                </label>
                <Select value={currency} onValueChange={setCurrency}>
                  <SelectTrigger className="max-w-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CURRENCIES.map((c) => (
                      <SelectItem key={c.value} value={c.value}>
                        {c.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Theme */}
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Theme</label>
                <div className="flex gap-2 max-w-sm">
                  {(["system", "light", "dark"] as const).map((t) => (
                    <Button
                      key={t}
                      variant={theme === t ? "default" : "outline"}
                      className="flex-1 capitalize"
                      onClick={() => setTheme(t)}
                    >
                      {t}
                    </Button>
                  ))}
                </div>
              </div>

              {/* Timezone */}
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300 flex items-center gap-2">
                  <Globe className="h-4 w-4" />
                  Timezone
                </label>
                <Select value={timezone} onValueChange={setTimezone}>
                  <SelectTrigger className="max-w-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {TIMEZONES.map((tz) => (
                      <SelectItem key={tz} value={tz}>
                        {tz.replace("_", " ")}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex justify-end">
                <Button
                  onClick={async () => {
                    setSavingPrefs(true);
                    try {
                      const res = await fetch("/api/auth/me", {
                        method: "PUT",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ currency, timezone }),
                      });
                      if (!res.ok) throw new Error("Failed");
                      toast.success("Preferences saved");
                      refresh();
                    } catch {
                      toast.error("Failed to save preferences");
                    } finally {
                      setSavingPrefs(false);
                    }
                  }}
                  disabled={savingPrefs}
                  className="gap-2"
                >
                  {savingPrefs ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Save className="h-4 w-4" />
                  )}
                  Save Preferences
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Data Management Section */}
        <motion.div variants={staggerItem}>
          <Card className="border-0 shadow-md overflow-hidden dark:bg-slate-900">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-100">
                  <Database className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <CardTitle className="text-base font-semibold">Data Management</CardTitle>
                  <CardDescription>Export or clear your financial data</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 rounded-xl border border-slate-100 dark:border-slate-800 hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors">
                  <div>
                    <p className="text-sm font-medium text-slate-900 dark:text-slate-100">Export Data</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Download all your expenses, income, and transactions
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-2"
                    onClick={() => window.location.href = "/export"}
                  >
                    <Download className="h-4 w-4" />
                    Export
                  </Button>
                </div>

                <div className="flex items-center justify-between p-4 rounded-xl border border-red-100 dark:border-red-900 bg-red-50/30 dark:bg-red-950/30 hover:bg-red-50/60 dark:hover:bg-red-950/50 transition-colors">
                  <div>
                    <p className="text-sm font-medium text-red-900 dark:text-red-100">Clear All Data</p>
                    <p className="text-xs text-red-600/80 dark:text-red-400/80">
                      Permanently delete all your financial records. This cannot be undone.
                    </p>
                  </div>
                  <Button
                    variant="destructive"
                    size="sm"
                    className="gap-2"
                    onClick={() => setClearDialogOpen(true)}
                  >
                    <Trash2 className="h-4 w-4" />
                    Clear Data
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>

      {/* Clear Data Confirmation Dialog */}
      <Dialog open={clearDialogOpen} onOpenChange={setClearDialogOpen}>
        <DialogContent className="max-w-md dark:bg-slate-900">
          <DialogHeader>
            <DialogTitle className="text-red-600">Clear All Data?</DialogTitle>
            <DialogDescription>
              This will permanently delete all your expenses, income, wallets, budgets,
              goals, subscriptions, borrow/lend records, and recurring transactions.
              This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Cancel</Button>
            </DialogClose>
            <Button
              variant="destructive"
              onClick={handleClearData}
              disabled={clearing}
            >
              {clearing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Yes, Clear Everything
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
