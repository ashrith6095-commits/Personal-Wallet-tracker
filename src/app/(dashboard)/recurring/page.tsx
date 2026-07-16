"use client";

import { useEffect, useState, useCallback } from "react";
import { motion } from "framer-motion";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Repeat,
  Plus,
  Calendar,
  Wallet,
  Loader2,
  Pencil,
  Trash2,
  ArrowDownCircle,
  ArrowUpCircle,
  Pause,
  Play,
} from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { EmptyState } from "@/components/ui/empty-state";
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
import { cn, formatCurrency, formatDate, getCategoryLabel } from "@/lib/utils";
import {
  recurringSchema,
  type RecurringInput,
} from "@/lib/validations";
import { fadeIn, staggerContainer, staggerItem } from "@/lib/animations";
import { EXPENSE_CATEGORIES } from "@/lib/constants";
import type { RecurringTransaction, Wallet as WalletType } from "@/types";

const FREQUENCY_LABELS: Record<string, string> = {
  DAILY: "Daily",
  WEEKLY: "Weekly",
  MONTHLY: "Monthly",
  YEARLY: "Yearly",
};

function LoadingSkeleton() {
  return (
    <div className="mx-auto max-w-5xl space-y-8">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-72" />
        </div>
        <Skeleton className="h-10 w-36 rounded-xl" />
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i} className="border-0 shadow-md dark:bg-slate-900">
            <CardContent className="p-5">
              <div className="flex items-center gap-4">
                <Skeleton className="h-12 w-12 rounded-xl" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-3 w-24" />
                  <Skeleton className="h-3 w-20" />
                </div>
                <Skeleton className="h-8 w-8 rounded-lg" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

export default function RecurringPage() {
  const [items, setItems] = useState<RecurringTransaction[]>([]);
  const [wallets, setWallets] = useState<WalletType[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<RecurringTransaction | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<RecurringInput>({
    resolver: zodResolver(recurringSchema),
    defaultValues: {
      title: "",
      amount: 0,
      type: "EXPENSE",
      category: "",
      frequency: "MONTHLY",
      nextDueDate: "",
      walletId: "",
    },
  });

  const watchType = watch("type");
  const watchFrequency = watch("frequency");

  const fetchData = useCallback(async () => {
    try {
      const [recRes, walRes] = await Promise.all([
        fetch("/api/recurring"),
        fetch("/api/wallets"),
      ]);
      if (recRes.ok) setItems(await recRes.json());
      if (walRes.ok) setWallets(await walRes.json());
    } catch {
      toast.error("Failed to load data");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  function openAdd() {
    setEditingItem(null);
    reset({
      title: "",
      amount: 0,
      type: "EXPENSE",
      category: "",
      frequency: "MONTHLY",
      nextDueDate: "",
      walletId: wallets.find((w) => w.isDefault)?.id || "",
    });
    setDialogOpen(true);
  }

  function openEdit(item: RecurringTransaction) {
    setEditingItem(item);
    reset({
      title: item.title,
      amount: item.amount,
      type: item.type as "EXPENSE" | "INCOME",
      category: item.category || "",
      frequency: item.frequency as "DAILY" | "WEEKLY" | "MONTHLY" | "YEARLY",
      nextDueDate: item.nextDueDate.split("T")[0],
      walletId: item.walletId,
    });
    setDialogOpen(true);
  }

  async function onSubmit(data: RecurringInput) {
    setSubmitting(true);
    try {
      const url = editingItem
        ? `/api/recurring/${editingItem.id}`
        : "/api/recurring";
      const method = editingItem ? "PUT" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed");
      toast.success(editingItem ? "Recurring updated" : "Recurring created");
      setDialogOpen(false);
      reset();
      fetchData();
    } catch {
      toast.error(editingItem ? "Failed to update" : "Failed to create");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleToggle(item: RecurringTransaction) {
    try {
      const res = await fetch(`/api/recurring/${item.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...item,
          isActive: !item.isActive,
        }),
      });
      if (!res.ok) throw new Error("Failed");
      toast.success(item.isActive ? "Paused" : "Resumed");
      fetchData();
    } catch {
      toast.error("Failed to update status");
    }
  }

  async function handleDelete(id: string) {
    try {
      const res = await fetch(`/api/recurring/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed");
      toast.success("Recurring deleted");
      fetchData();
    } catch {
      toast.error("Failed to delete");
    }
  }

  if (loading) return <LoadingSkeleton />;

  return (
    <div className="mx-auto max-w-5xl space-y-8">
      <motion.div
        initial="hidden"
        animate="visible"
        variants={fadeIn}
        transition={{ duration: 0.5 }}
        className="flex items-center justify-between"
      >
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">
            Recurring Transactions
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Manage your repeating income and expenses
          </p>
        </div>
        <Button onClick={openAdd} className="gap-2">
          <Plus className="h-4 w-4" />
          Add Recurring
        </Button>
      </motion.div>

      {items.length === 0 ? (
        <motion.div initial="hidden" animate="visible" variants={fadeIn}>
          <EmptyState
            icon={<Repeat className="h-8 w-8 text-slate-400 dark:text-slate-500" />}
            title="No recurring transactions"
            description="Set up automatic income or expense tracking with recurring entries"
            action={
              <Button onClick={openAdd} className="gap-2">
                <Plus className="h-4 w-4" />
                Add Recurring
              </Button>
            }
          />
        </motion.div>
      ) : (
        <motion.div
          className="grid grid-cols-1 gap-4 sm:grid-cols-2"
          initial="hidden"
          animate="visible"
          variants={staggerContainer}
        >
          {items.map((item) => {
            const wallet = wallets.find((w) => w.id === item.walletId);
            return (
              <motion.div key={item.id} variants={staggerItem}>
                <Card
                  className={cn(
                    "border-0 shadow-md hover:shadow-lg transition-all duration-200 dark:bg-slate-900",
                    !item.isActive && "opacity-60"
                  )}
                >
                  <CardContent className="p-5">
                    <div className="flex items-start gap-4">
                      <div
                        className={cn(
                          "flex h-12 w-12 shrink-0 items-center justify-center rounded-xl",
                          item.type === "INCOME" ? "bg-emerald-100 dark:bg-emerald-900/30" : "bg-orange-100 dark:bg-orange-900/30"
                        )}
                      >
                        {item.type === "INCOME" ? (
                          <ArrowUpCircle className="h-6 w-6 text-emerald-600" />
                        ) : (
                          <ArrowDownCircle className="h-6 w-6 text-orange-600" />
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-semibold text-slate-900 dark:text-slate-100 truncate">
                            {item.title}
                          </p>
                          <Badge
                            variant={item.type === "INCOME" ? "success" : "default"}
                            className="text-xs"
                          >
                            {item.type === "INCOME" ? "Income" : "Expense"}
                          </Badge>
                          {!item.isActive && (
                            <Badge variant="secondary" className="text-xs">Paused</Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-3 mt-1.5 text-xs text-slate-500 dark:text-slate-400">
                          <span className="flex items-center gap-1">
                            <Repeat className="h-3 w-3" />
                            {FREQUENCY_LABELS[item.frequency] || item.frequency}
                          </span>
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {formatDate(item.nextDueDate)}
                          </span>
                          {wallet && (
                            <span className="flex items-center gap-1">
                              <Wallet className="h-3 w-3" />
                              {wallet.name}
                            </span>
                          )}
                        </div>
                        {item.category && (
                          <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
                            {getCategoryLabel(item.category)}
                          </p>
                        )}
                      </div>

                      <div className="shrink-0 text-right">
                        <p
                          className={cn(
                            "text-lg font-bold",
                            item.type === "INCOME" ? "text-emerald-600" : "text-slate-900 dark:text-slate-100"
                          )}
                        >
                          {item.type === "INCOME" ? "+" : "-"}
                          {formatCurrency(item.amount)}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center justify-end gap-1 mt-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => handleToggle(item)}
                        title={item.isActive ? "Pause" : "Resume"}
                      >
                        {item.isActive ? (
                          <Pause className="h-4 w-4 text-slate-400 dark:text-slate-500" />
                        ) : (
                          <Play className="h-4 w-4 text-emerald-500" />
                        )}
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => openEdit(item)}
                      >
                        <Pencil className="h-4 w-4 text-slate-400 dark:text-slate-500" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => handleDelete(item.id)}
                      >
                        <Trash2 className="h-4 w-4 text-slate-400 dark:text-slate-500 hover:text-red-500" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </motion.div>
      )}

      {/* Add / Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md dark:bg-slate-900">
          <DialogHeader>
            <DialogTitle>
              {editingItem ? "Edit Recurring" : "Add Recurring Transaction"}
            </DialogTitle>
            <DialogDescription>
              {editingItem
                ? "Update the details of this recurring entry"
                : "Set up a new repeating income or expense"}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <Input
              label="Title"
              placeholder="e.g. Netflix Subscription"
              error={errors.title?.message}
              {...register("title")}
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
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Type</label>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant={watchType === "EXPENSE" ? "default" : "outline"}
                  className="flex-1 gap-2"
                  onClick={() => {
                    setValue("type", "EXPENSE", { shouldValidate: true });
                    setValue("category", "");
                  }}
                >
                  <ArrowDownCircle className="h-4 w-4" />
                  Expense
                </Button>
                <Button
                  type="button"
                  variant={watchType === "INCOME" ? "default" : "outline"}
                  className="flex-1 gap-2"
                  onClick={() => {
                    setValue("type", "INCOME", { shouldValidate: true });
                    setValue("category", "");
                  }}
                >
                  <ArrowUpCircle className="h-4 w-4" />
                  Income
                </Button>
              </div>
            </div>

            {watchType === "EXPENSE" && (
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Category</label>
                <Select
                  value={watch("category") || ""}
                  onValueChange={(val) => setValue("category", val)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {EXPENSE_CATEGORIES.map((cat) => (
                      <SelectItem key={cat} value={cat}>
                        {getCategoryLabel(cat)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.category && (
                  <p className="text-xs text-red-500">{errors.category.message}</p>
                )}
              </div>
            )}

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Frequency</label>
              <Select
                value={watchFrequency}
                onValueChange={(val) =>
                  setValue("frequency", val as "DAILY" | "WEEKLY" | "MONTHLY" | "YEARLY", {
                    shouldValidate: true,
                  })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(FREQUENCY_LABELS).map(([key, label]) => (
                    <SelectItem key={key} value={key}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Input
              label="Next Due Date"
              type="date"
              icon={<Calendar className="h-4 w-4" />}
              error={errors.nextDueDate?.message}
              {...register("nextDueDate")}
            />

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Wallet</label>
              <Select
                value={watch("walletId") || ""}
                onValueChange={(val) =>
                  setValue("walletId", val, { shouldValidate: true })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select wallet" />
                </SelectTrigger>
                <SelectContent>
                  {wallets.map((w) => (
                    <SelectItem key={w.id} value={w.id}>
                      {w.name} ({formatCurrency(w.balance)})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.walletId && (
                <p className="text-xs text-red-500">{errors.walletId.message}</p>
              )}
            </div>

            <DialogFooter>
              <DialogClose asChild>
                <Button type="button" variant="outline">
                  Cancel
                </Button>
              </DialogClose>
              <Button type="submit" disabled={submitting}>
                {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {editingItem ? "Update" : "Create"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
