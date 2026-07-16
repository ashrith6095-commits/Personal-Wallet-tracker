"use client";

import { useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  CreditCard,
  Plus,
  Calendar,
  DollarSign,
  Pencil,
  Trash2,
  RefreshCw,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
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
import { cn, formatCurrency, formatDate } from "@/lib/utils";
import {
  subscriptionSchema,
  type SubscriptionInput,
} from "@/lib/validations";
import { fadeIn, staggerContainer, staggerItem } from "@/lib/animations";
import { BILLING_CYCLES } from "@/lib/constants";
import { differenceInDays, parseISO, format } from "date-fns";

interface Subscription {
  id: string;
  name: string;
  icon?: string;
  amount: number;
  billingCycle: string;
  nextRenewal: string;
  isActive: boolean;
  notes?: string;
}

const CYCLE_COLORS: Record<string, string> = {
  Weekly: "from-blue-500 to-cyan-500",
  Monthly: "from-violet-500 to-purple-500",
  Quarterly: "from-amber-500 to-orange-500",
  Yearly: "from-emerald-500 to-teal-500",
};

const CYCLE_BADGE_VARIANT: Record<string, "default" | "secondary" | "success" | "warning" | "destructive"> = {
  Weekly: "default",
  Monthly: "secondary",
  Quarterly: "warning",
  Yearly: "success",
};

function getMonthlyCost(amount: number, cycle: string): number {
  switch (cycle) {
    case "Weekly":
      return amount * (52 / 12);
    case "Quarterly":
      return amount / 3;
    case "Yearly":
      return amount / 12;
    default:
      return amount;
  }
}

function daysUntilRenewal(dateStr: string): number {
  return differenceInDays(parseISO(dateStr), new Date());
}

function LoadingSkeleton() {
  return (
    <div className="mx-auto max-w-5xl space-y-8">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-72" />
        </div>
        <Skeleton className="h-10 w-40 rounded-xl" />
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-24 rounded-2xl" />
        ))}
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <Card key={i} className="border-0 shadow-md dark:bg-slate-900">
            <CardContent className="p-5">
              <div className="flex items-center gap-4">
                <Skeleton className="h-12 w-12 rounded-xl" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-3 w-24" />
                  <Skeleton className="h-3 w-20" />
                </div>
                <Skeleton className="h-8 w-14 rounded-lg" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

export default function SubscriptionsPage() {
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Subscription | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<SubscriptionInput>({
    resolver: zodResolver(subscriptionSchema),
    defaultValues: {
      name: "",
      icon: "",
      amount: 0,
      billingCycle: "Monthly",
      nextRenewal: "",
      notes: "",
    },
  });

  const watchBillingCycle = watch("billingCycle");

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch("/api/subscriptions");
      if (res.ok) setSubscriptions(await res.json());
    } catch {
      toast.error("Failed to load subscriptions");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const activeSubs = subscriptions.filter((s) => s.isActive);
  const totalMonthlyCost = activeSubs.reduce(
    (sum, s) => sum + getMonthlyCost(s.amount, s.billingCycle),
    0
  );
  const soonestRenewal = activeSubs
    .filter((s) => daysUntilRenewal(s.nextRenewal) >= 0)
    .sort(
      (a, b) =>
        daysUntilRenewal(a.nextRenewal) - daysUntilRenewal(b.nextRenewal)
    )[0];

  function openAdd() {
    setEditingItem(null);
    reset({
      name: "",
      icon: "",
      amount: 0,
      billingCycle: "Monthly",
      nextRenewal: format(new Date(), "yyyy-MM-dd"),
      notes: "",
    });
    setDialogOpen(true);
  }

  function openEdit(sub: Subscription) {
    setEditingItem(sub);
    reset({
      name: sub.name,
      icon: sub.icon || "",
      amount: sub.amount,
      billingCycle: sub.billingCycle,
      nextRenewal: sub.nextRenewal.split("T")[0],
      notes: sub.notes || "",
    });
    setDialogOpen(true);
  }

  async function onSubmit(data: SubscriptionInput) {
    setSubmitting(true);
    try {
      const url = editingItem
        ? `/api/subscriptions/${editingItem.id}`
        : "/api/subscriptions";
      const method = editingItem ? "PUT" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed");
      toast.success(editingItem ? "Subscription updated" : "Subscription added");
      setDialogOpen(false);
      reset();
      fetchData();
    } catch {
      toast.error(editingItem ? "Failed to update" : "Failed to create");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleToggle(sub: Subscription) {
    try {
      const res = await fetch(`/api/subscriptions/${sub.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: sub.name,
          icon: sub.icon,
          amount: sub.amount,
          billingCycle: sub.billingCycle,
          nextRenewal: sub.nextRenewal,
          notes: sub.notes,
          isActive: !sub.isActive,
        }),
      });
      if (!res.ok) throw new Error("Failed");
      toast.success(sub.isActive ? "Subscription paused" : "Subscription resumed");
      fetchData();
    } catch {
      toast.error("Failed to update status");
    }
  }

  async function handleDelete(id: string) {
    setDeletingId(id);
    try {
      const res = await fetch(`/api/subscriptions/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed");
      toast.success("Subscription deleted");
      setDeleteConfirmId(null);
      fetchData();
    } catch {
      toast.error("Failed to delete");
    } finally {
      setDeletingId(null);
    }
  }

  if (loading) return <LoadingSkeleton />;

  return (
    <div className="mx-auto max-w-5xl space-y-8">
      {/* Header */}
      <motion.div
        initial="hidden"
        animate="visible"
        variants={fadeIn}
        transition={{ duration: 0.5 }}
        className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"
      >
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">
            Subscriptions
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Track and manage your recurring subscriptions
          </p>
        </div>
        <Button onClick={openAdd} className="gap-2">
          <Plus className="h-4 w-4" />
          Add Subscription
        </Button>
      </motion.div>

      {subscriptions.length === 0 ? (
        <motion.div initial="hidden" animate="visible" variants={fadeIn}>
          <EmptyState
            icon={<CreditCard className="h-8 w-8 text-slate-400 dark:text-slate-500" />}
            title="No subscriptions yet"
            description="Add your subscriptions to track recurring payments and never miss a renewal"
            action={
              <Button onClick={openAdd} className="gap-2">
                <Plus className="h-4 w-4" />
                Add Subscription
              </Button>
            }
          />
        </motion.div>
      ) : (
        <>
          {/* Summary Cards */}
          <motion.div
            className="grid grid-cols-1 gap-4 sm:grid-cols-3"
            initial="hidden"
            animate="visible"
            variants={staggerContainer}
          >
            <motion.div variants={staggerItem}>
              <Card className="relative overflow-hidden border-0 shadow-md">
                <div className="absolute inset-0 bg-indigo-500" />
                <CardContent className="relative p-5">
                  <div className="flex items-center gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/20">
                      <DollarSign className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <p className="text-xs font-medium text-white/70">
                        Total Monthly Cost
                      </p>
                      <p className="text-xl font-bold text-white tracking-tight">
                        {formatCurrency(totalMonthlyCost)}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div variants={staggerItem}>
              <Card className="relative overflow-hidden border-0 shadow-md">
                <div className="absolute inset-0 bg-gradient-to-br from-emerald-500 to-teal-500" />
                <CardContent className="relative p-5">
                  <div className="flex items-center gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/20">
                      <RefreshCw className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <p className="text-xs font-medium text-white/70">
                        Active Subscriptions
                      </p>
                      <p className="text-xl font-bold text-white tracking-tight">
                        {activeSubs.length}
                        <span className="text-sm font-normal text-white/60 ml-1">
                          / {subscriptions.length}
                        </span>
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div variants={staggerItem}>
              <Card className="relative overflow-hidden border-0 shadow-md">
                <div className="absolute inset-0 bg-gradient-to-br from-amber-500 to-orange-500" />
                <CardContent className="relative p-5">
                  <div className="flex items-center gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/20">
                      <Calendar className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <p className="text-xs font-medium text-white/70">
                        Next Renewal
                      </p>
                      {soonestRenewal ? (
                        <>
                          <p className="text-xl font-bold text-white tracking-tight">
                            {soonestRenewal.icon} {soonestRenewal.name}
                          </p>
                          <p className="text-xs text-white/60">
                            in {daysUntilRenewal(soonestRenewal.nextRenewal)} day
                            {daysUntilRenewal(soonestRenewal.nextRenewal) !== 1
                              ? "s"
                              : ""}
                          </p>
                        </>
                      ) : (
                        <p className="text-xl font-bold text-white tracking-tight">
                          None
                        </p>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </motion.div>

          {/* Subscription Grid */}
          <motion.div
            className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3"
            initial="hidden"
            animate="visible"
            variants={staggerContainer}
          >
            <AnimatePresence>
              {subscriptions.map((sub) => {
                const daysLeft = daysUntilRenewal(sub.nextRenewal);
                const isOverdue = daysLeft < 0;
                const isUrgent = daysLeft >= 0 && daysLeft <= 3;
                const monthlyCost = getMonthlyCost(sub.amount, sub.billingCycle);
                const cycleGradient = CYCLE_COLORS[sub.billingCycle] || "from-slate-400 to-slate-500";

                return (
                  <motion.div key={sub.id} variants={staggerItem} layout>
                    <Card
                      className={cn(
                        "relative overflow-hidden border-0 shadow-md hover:shadow-xl transition-all duration-300 group h-full dark:bg-slate-900",
                        !sub.isActive && "opacity-55"
                      )}
                    >
                      {/* Color accent stripe */}
                      <div
                        className={cn(
                          "absolute left-0 top-0 bottom-0 w-1.5 bg-gradient-to-b",
                          cycleGradient
                        )}
                      />

                      <CardContent className="relative p-5 pl-6">
                        {/* Top row: icon + name + toggle */}
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center gap-3">
                            <div
                              className={cn(
                                "flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br text-white text-xl",
                                cycleGradient
                              )}
                            >
                              {sub.icon || "📦"}
                            </div>
                            <div>
                              <h3 className="font-semibold text-slate-900 dark:text-slate-100 truncate max-w-[160px]">
                                {sub.name}
                              </h3>
                              <div className="flex items-center gap-2 mt-0.5">
                                <Badge
                                  variant={CYCLE_BADGE_VARIANT[sub.billingCycle] || "secondary"}
                                  className="text-[10px] font-medium"
                                >
                                  {sub.billingCycle}
                                </Badge>
                                {!sub.isActive && (
                                  <Badge variant="outline" className="text-[10px] font-medium">
                                    Paused
                                  </Badge>
                                )}
                              </div>
                            </div>
                          </div>
                          <Switch
                            checked={sub.isActive}
                            onCheckedChange={() => handleToggle(sub)}
                            title={sub.isActive ? "Pause" : "Resume"}
                          />
                        </div>

                        {/* Amount */}
                        <div className="mb-3">
                          <p className="text-2xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">
                            {formatCurrency(sub.amount)}
                          </p>
                          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                            ≈ {formatCurrency(monthlyCost)}/mo
                          </p>
                        </div>

                        {/* Renewal info */}
                        <div
                          className={cn(
                            "flex items-center gap-1.5 text-xs rounded-lg px-2.5 py-1.5 mb-3",
                            isOverdue
                              ? "bg-red-50 dark:bg-red-950/30 text-red-600 dark:text-red-400"
                              : isUrgent
                                ? "bg-amber-50 dark:bg-amber-950/30 text-amber-600 dark:text-amber-400"
                                : "bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300"
                          )}
                        >
                          <Calendar className="h-3.5 w-3.5" />
                          <span>
                            Renews{" "}
                            {format(parseISO(sub.nextRenewal), "MMM d, yyyy")}
                          </span>
                          <span className="mx-0.5">·</span>
                          <span className="font-medium">
                            {isOverdue
                              ? `${Math.abs(daysLeft)}d overdue`
                              : daysLeft === 0
                                ? "Today"
                                : `in ${daysLeft}d`}
                          </span>
                        </div>

                        {/* Notes */}
                        {sub.notes && (
                          <p className="text-xs text-slate-400 dark:text-slate-500 mb-3 line-clamp-2">
                            {sub.notes}
                          </p>
                        )}

                        {/* Actions */}
                        <div className="flex items-center justify-end gap-1 pt-3 border-t border-slate-100 dark:border-slate-800">
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            onClick={() => openEdit(sub)}
                            title="Edit"
                          >
                            <Pencil className="h-4 w-4 text-slate-400 dark:text-slate-500" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            onClick={() => setDeleteConfirmId(sub.id)}
                            title="Delete"
                          >
                            <Trash2 className="h-4 w-4 text-slate-400 dark:text-slate-500 hover:text-red-500" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </motion.div>
        </>
      )}

      {/* Add / Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md dark:bg-slate-900">
          <DialogHeader>
            <DialogTitle>
              {editingItem ? "Edit Subscription" : "Add Subscription"}
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="flex items-end gap-3">
              <div className="flex-1">
                <Input
                  label="Icon (emoji)"
                  placeholder="e.g. 🎬"
                  error={errors.icon?.message}
                  {...register("icon")}
                />
              </div>
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-slate-200 dark:border-slate-700 text-2xl dark:text-slate-100">
                {watch("icon") || "📦"}
              </div>
            </div>

            <Input
              label="Name"
              placeholder="e.g. Netflix, Spotify"
              error={errors.name?.message}
              {...register("name")}
            />

            <Input
              label="Amount"
              type="number"
              step="0.01"
              placeholder="0.00"
              error={errors.amount?.message}
              {...register("amount", { valueAsNumber: true })}
            />

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                Billing Cycle
              </label>
              <Select
                value={watchBillingCycle}
                onValueChange={(val) =>
                  setValue("billingCycle", val, { shouldValidate: true })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {BILLING_CYCLES.map((cycle) => (
                    <SelectItem key={cycle} value={cycle}>
                      {cycle}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.billingCycle && (
                <p className="text-xs text-red-500">
                  {errors.billingCycle.message}
                </p>
              )}
            </div>

            <Input
              label="Next Renewal Date"
              type="date"
              error={errors.nextRenewal?.message}
              {...register("nextRenewal")}
            />

            <Textarea
              label="Notes (optional)"
              placeholder="Any notes about this subscription..."
              rows={3}
              {...register("notes")}
            />

            <DialogFooter>
              <DialogClose asChild>
                <Button type="button" variant="outline">
                  Cancel
                </Button>
              </DialogClose>
              <Button type="submit" disabled={submitting}>
                {submitting && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                {editingItem ? "Update" : "Add Subscription"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={!!deleteConfirmId}
        onOpenChange={(open) => {
          if (!open) setDeleteConfirmId(null);
        }}
      >
        <DialogContent className="max-w-sm dark:bg-slate-900">
          <DialogHeader>
            <DialogTitle>Delete Subscription</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Are you sure you want to delete this subscription? This action cannot
            be undone.
          </p>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Cancel</Button>
            </DialogClose>
            <Button
              variant="destructive"
              onClick={() => deleteConfirmId && handleDelete(deleteConfirmId)}
              disabled={!!deletingId}
            >
              {deletingId && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
