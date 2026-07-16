"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Plus,
  Target,
  ChevronLeft,
  ChevronRight,
  Edit3,
  Trash2,
  Loader2,
  AlertTriangle,
  CheckCircle2,
  TrendingDown,
} from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { EmptyState } from "@/components/ui/empty-state";
import { CardSkeleton } from "@/components/ui/skeletons";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { budgetSchema, type BudgetInput } from "@/lib/validations";
import { cn, formatCurrency, getMonthName, getCategoryLabel } from "@/lib/utils";
import { fadeIn, staggerContainer, staggerItem } from "@/lib/animations";
import { EXPENSE_CATEGORIES } from "@/lib/constants";
import type { Budget, Wallet } from "@/types";

function LoadingSkeleton() {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 p-4 md:p-8">
      <div className="mx-auto max-w-7xl space-y-8">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <div className="h-8 w-40 animate-pulse rounded bg-slate-200 dark:bg-slate-700" />
            <div className="h-4 w-64 animate-pulse rounded bg-slate-200 dark:bg-slate-700" />
          </div>
          <div className="h-10 w-32 animate-pulse rounded-xl bg-slate-200 dark:bg-slate-700" />
        </div>
        <div className="h-32 w-full animate-pulse rounded-2xl bg-slate-200 dark:bg-slate-700" />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <CardSkeleton key={i} />
          ))}
        </div>
      </div>
    </div>
  );
}

function BudgetStatusBadge({ percentage }: { percentage: number }) {
  if (percentage >= 100) {
    return (
      <Badge variant="destructive" className="gap-1">
        <AlertTriangle className="h-3 w-3" />
        Over Budget
      </Badge>
    );
  }
  if (percentage >= 80) {
    return (
      <Badge variant="warning" className="gap-1">
        <TrendingDown className="h-3 w-3" />
        Warning
      </Badge>
    );
  }
  return (
    <Badge variant="success" className="gap-1">
      <CheckCircle2 className="h-3 w-3" />
      On Track
    </Badge>
  );
}

export default function BudgetsPage() {
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [wallets, setWallets] = useState<Wallet[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingBudget, setEditingBudget] = useState<Budget | null>(null);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const now = new Date();
  const [currentMonth, setCurrentMonth] = useState(now.getMonth() + 1);
  const [currentYear, setCurrentYear] = useState(now.getFullYear());

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<BudgetInput>({
    resolver: zodResolver(budgetSchema),
    defaultValues: {
      name: "",
      amount: 0,
      category: undefined,
      month: currentMonth,
      year: currentYear,
      walletId: undefined,
    },
  });

  const watchCategory = watch("category");
  const watchWalletId = watch("walletId");

  async function fetchBudgets() {
    setLoading(true);
    try {
      const res = await fetch(`/api/budgets?month=${currentMonth}&year=${currentYear}`);
      if (!res.ok) throw new Error("Failed to load budgets");
      const data = await res.json();
      setBudgets(data);
    } catch {
      toast.error("Failed to load budgets");
    } finally {
      setLoading(false);
    }
  }

  async function fetchWallets() {
    try {
      const res = await fetch("/api/wallets");
      if (res.ok) setWallets(await res.json());
    } catch {
      // silent
    }
  }

  useEffect(() => {
    fetchBudgets();
    fetchWallets();
  }, [currentMonth, currentYear]);

  const totalBudget = budgets.reduce((sum, b) => sum + b.amount, 0);
  const totalSpent = budgets.reduce((sum, b) => sum + b.spent, 0);
  const totalRemaining = totalBudget - totalSpent;
  const overallPercentage = totalBudget > 0 ? Math.round((totalSpent / totalBudget) * 100) : 0;

  function navigateMonth(dir: number) {
    let newMonth = currentMonth + dir;
    let newYear = currentYear;
    if (newMonth < 1) {
      newMonth = 12;
      newYear--;
    } else if (newMonth > 12) {
      newMonth = 1;
      newYear++;
    }
    setCurrentMonth(newMonth);
    setCurrentYear(newYear);
  }

  function openCreateDialog() {
    setEditingBudget(null);
    reset({
      name: "",
      amount: 0,
      category: undefined,
      month: currentMonth,
      year: currentYear,
      walletId: undefined,
    });
    setDialogOpen(true);
  }

  function openEditDialog(budget: Budget) {
    setEditingBudget(budget);
    reset({
      name: budget.name,
      amount: budget.amount,
      category: budget.category || undefined,
      month: budget.month,
      year: budget.year,
      walletId: budget.walletId || undefined,
    });
    setDialogOpen(true);
  }

  async function onSubmit(data: BudgetInput) {
    setSaving(true);
    try {
      const payload = {
        ...data,
        month: currentMonth,
        year: currentYear,
        category: data.category || undefined,
        walletId: data.walletId || undefined,
      };

      const url = editingBudget ? `/api/budgets/${editingBudget.id}` : "/api/budgets";
      const method = editingBudget ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error("Failed to save budget");

      toast.success(editingBudget ? "Budget updated" : "Budget created");
      setDialogOpen(false);
      reset();
      setEditingBudget(null);
      await fetchBudgets();
    } catch {
      toast.error("Failed to save budget");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    setDeletingId(id);
    try {
      const res = await fetch(`/api/budgets/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete budget");
      toast.success("Budget deleted");
      await fetchBudgets();
    } catch {
      toast.error("Failed to delete budget");
    } finally {
      setDeletingId(null);
    }
  }

  if (loading) return <LoadingSkeleton />;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      <div className="mx-auto max-w-7xl p-4 md:p-8 space-y-8">
        {/* Header */}
        <motion.div
          initial="hidden"
          animate="visible"
          variants={fadeIn}
          transition={{ duration: 0.5 }}
          className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"
        >
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">Budgets</h1>
            <p className="text-slate-500 dark:text-slate-400 mt-1 text-sm md:text-base">
              Track your spending against monthly budgets
            </p>
          </div>
          <Button onClick={openCreateDialog} className="gap-2">
            <Plus className="h-4 w-4" />
            Add Budget
          </Button>
        </motion.div>

        {/* Month Navigator */}
        <motion.div
          initial="hidden"
          animate="visible"
          variants={fadeIn}
          transition={{ delay: 0.1, duration: 0.5 }}
        >
          <Card className="border-0 shadow-md">
            <CardContent className="p-4">
              <div className="flex items-center justify-center gap-6">
                <Button
                  variant="ghost"
                  size="icon-sm"
                  onClick={() => navigateMonth(-1)}
                >
                  <ChevronLeft className="h-5 w-5" />
                </Button>
                <div className="text-center">
                  <p className="text-lg font-bold text-slate-900 dark:text-slate-100">
                    {getMonthName(currentMonth)} {currentYear}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  onClick={() => navigateMonth(1)}
                >
                  <ChevronRight className="h-5 w-5" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Overview Card */}
        <motion.div
          initial="hidden"
          animate="visible"
          variants={fadeIn}
          transition={{ delay: 0.15, duration: 0.5 }}
        >
          <Card className="relative overflow-hidden border-0 shadow-md">
            <div className="absolute inset-0 bg-indigo-500" />
            <CardContent className="relative p-6 md:p-8">
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-3 mb-6">
                <div>
                  <p className="text-sm font-medium text-white/70">Total Budget</p>
                  <p className="text-2xl font-bold text-white">{formatCurrency(totalBudget)}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-white/70">Total Spent</p>
                  <p className="text-2xl font-bold text-white">{formatCurrency(totalSpent)}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-white/70">Remaining</p>
                  <p className={cn(
                    "text-2xl font-bold",
                    totalRemaining >= 0 ? "text-emerald-300" : "text-red-300"
                  )}>
                    {formatCurrency(totalRemaining)}
                  </p>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <p className="text-sm text-white/70">Overall Usage</p>
                  <p className="text-sm font-semibold text-white">{overallPercentage}%</p>
                </div>
                <div className="h-3 w-full overflow-hidden rounded-full bg-white/20">
                  <motion.div
                    className={cn(
                      "h-full rounded-full",
                      overallPercentage >= 100
                        ? "bg-red-400"
                        : overallPercentage >= 80
                          ? "bg-amber-400"
                          : "bg-emerald-400"
                    )}
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.min(overallPercentage, 100)}%` }}
                    transition={{ duration: 0.8, ease: "easeOut" }}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Budget List */}
        {budgets.length === 0 ? (
          <motion.div initial="hidden" animate="visible" variants={fadeIn} transition={{ delay: 0.2 }}>
            <EmptyState
              icon={<Target className="h-8 w-8 text-slate-400 dark:text-slate-500" />}
              title="No budgets for this month"
              description="Create a budget to start tracking your spending limits"
              action={
                <Button onClick={openCreateDialog} className="gap-2">
                  <Plus className="h-4 w-4" />
                  Create Budget
                </Button>
              }
            />
          </motion.div>
        ) : (
          <motion.div
            className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3"
            initial="hidden"
            animate="visible"
            variants={staggerContainer}
          >
            <AnimatePresence>
              {budgets.map((budget) => {
                const percentage = budget.amount > 0
                  ? Math.round((budget.spent / budget.amount) * 100)
                  : 0;
                const remaining = budget.amount - budget.spent;

                return (
                  <motion.div key={budget.id} variants={staggerItem} layout>
                    <Card className="relative overflow-hidden border-0 shadow-md hover:shadow-xl transition-all duration-300 h-full">
                      <CardContent className="p-5">
                        <div className="flex items-start justify-between mb-4">
                          <div>
                            <h3 className="font-semibold text-slate-900 dark:text-slate-100">{budget.name}</h3>
                            {budget.category && (
                              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                                {getCategoryLabel(budget.category)}
                              </p>
                            )}
                          </div>
                          <BudgetStatusBadge percentage={percentage} />
                        </div>

                        <div className="space-y-3">
                          <div className="flex items-end justify-between">
                            <span className="text-sm text-slate-500 dark:text-slate-400">
                              {formatCurrency(budget.spent)} / {formatCurrency(budget.amount)}
                            </span>
                            <span className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                              {percentage}%
                            </span>
                          </div>
                          <Progress
                            value={Math.min(percentage, 100)}
                            className="h-2.5"
                          />
                          <p className={cn(
                            "text-sm font-medium",
                            remaining >= 0 ? "text-emerald-600" : "text-red-600"
                          )}>
                            {remaining >= 0
                              ? `${formatCurrency(remaining)} remaining`
                              : `${formatCurrency(Math.abs(remaining))} over budget`}
                          </p>
                        </div>

                        <div className="flex items-center gap-2 pt-4 mt-4 border-t border-slate-100 dark:border-slate-700">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openEditDialog(budget)}
                            className="gap-1.5 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-700"
                          >
                            <Edit3 className="h-3.5 w-3.5" />
                            Edit
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(budget.id)}
                            disabled={deletingId === budget.id}
                            className="gap-1.5 text-slate-500 dark:text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950"
                          >
                            {deletingId === budget.id ? (
                              <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            ) : (
                              <Trash2 className="h-3.5 w-3.5" />
                            )}
                            Delete
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </motion.div>
        )}
      </div>

      {/* Add / Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editingBudget ? "Edit Budget" : "Create Budget"}</DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <Input
              label="Budget Name"
              placeholder="e.g. Monthly Groceries"
              error={errors.name?.message}
              {...register("name")}
            />

            <Input
              label="Budget Amount"
              type="number"
              step="0.01"
              placeholder="0.00"
              error={errors.amount?.message}
              {...register("amount", { valueAsNumber: true })}
            />

            {/* Category Select */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                Category{" "}
                <span className="text-slate-400 dark:text-slate-500 font-normal">(optional)</span>
              </label>
              <Select
                value={watchCategory || "__none__"}
                onValueChange={(val) =>
                  setValue("category", val === "__none__" ? undefined : val, {
                    shouldValidate: true,
                  })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="All categories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">All categories</SelectItem>
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

            {/* Wallet Select */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                Wallet{" "}
                <span className="text-slate-400 dark:text-slate-500 font-normal">(optional)</span>
              </label>
              <Select
                value={watchWalletId || "__none__"}
                onValueChange={(val) =>
                  setValue("walletId", val === "__none__" ? undefined : val, {
                    shouldValidate: true,
                  })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Any wallet" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">Any wallet</SelectItem>
                  {wallets.map((w) => (
                    <SelectItem key={w.id} value={w.id}>
                      {w.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.walletId && (
                <p className="text-xs text-red-500">{errors.walletId.message}</p>
              )}
            </div>

            {/* Current Period Display */}
            <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 p-3">
              <p className="text-xs text-slate-500 dark:text-slate-400">Budget Period</p>
              <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                {getMonthName(currentMonth)} {currentYear}
              </p>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setDialogOpen(false);
                  setEditingBudget(null);
                  reset();
                }}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={saving} className="gap-2">
                {saving && <Loader2 className="h-4 w-4 animate-spin" />}
                {editingBudget ? "Save Changes" : "Create Budget"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
