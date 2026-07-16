"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus,
  Search,
  TrendingUp,
  Calendar,
  Wallet,
  MoreHorizontal,
  Pencil,
  Trash2,
  Copy,
  ChevronLeft,
  ChevronRight,
  Loader2,
  DollarSign,
  BarChart3,
  FileText,
} from "lucide-react";
import { toast } from "sonner";
import { incomeSchema, type IncomeInput } from "@/lib/validations";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
  SelectGroup,
} from "@/components/ui/select";
import { TableSkeleton } from "@/components/ui/skeletons";
import { EmptyState } from "@/components/ui/empty-state";
import {
  cn,
  formatCurrency,
  formatDate,
  getCategoryColor,
  getCategoryLabel,
} from "@/lib/utils";
import { fadeIn, staggerContainer, staggerItem } from "@/lib/animations";
import { INCOME_CATEGORIES } from "@/lib/constants";
import type { Income, Wallet as WalletType } from "@/types";

type DateFilter = "today" | "week" | "month" | "lastMonth" | "custom";

const PAGE_SIZE = 10;

function getDateRange(filter: DateFilter): { startDate?: string; endDate?: string } {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  switch (filter) {
    case "today": {
      const end = new Date(today);
      end.setHours(23, 59, 59, 999);
      return { startDate: today.toISOString(), endDate: end.toISOString() };
    }
    case "week": {
      const start = new Date(today);
      start.setDate(today.getDate() - today.getDay());
      const end = new Date(start);
      end.setDate(start.getDate() + 6);
      end.setHours(23, 59, 59, 999);
      return { startDate: start.toISOString(), endDate: end.toISOString() };
    }
    case "month": {
      const start = new Date(now.getFullYear(), now.getMonth(), 1);
      const end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
      return { startDate: start.toISOString(), endDate: end.toISOString() };
    }
    case "lastMonth": {
      const start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const end = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);
      return { startDate: start.toISOString(), endDate: end.toISOString() };
    }
    default:
      return {};
  }
}

export default function IncomePage() {
  const [incomes, setIncomes] = useState<Income[]>([]);
  const [wallets, setWallets] = useState<WalletType[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingIncome, setEditingIncome] = useState<Income | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);

  const [dateFilter, setDateFilter] = useState<DateFilter>("month");
  const [customStartDate, setCustomStartDate] = useState("");
  const [customEndDate, setCustomEndDate] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [page, setPage] = useState(1);

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<IncomeInput>({
    resolver: zodResolver(incomeSchema),
    defaultValues: {
      amount: 0,
      category: "",
      description: "",
      date: new Date().toISOString().split("T")[0],
      notes: "",
      walletId: "",
    },
  });

  const fetchIncomes = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      const range = dateFilter === "custom"
        ? { startDate: customStartDate, endDate: customEndDate }
        : getDateRange(dateFilter);

      if (range.startDate) params.set("startDate", range.startDate);
      if (range.endDate) params.set("endDate", range.endDate);

      const res = await fetch(`/api/income?${params.toString()}`);
      if (!res.ok) throw new Error("Failed to fetch income");
      const data = await res.json();
      setIncomes(data);
    } catch {
      toast.error("Failed to load income");
    } finally {
      setLoading(false);
    }
  }, [dateFilter, customStartDate, customEndDate]);

  const fetchWallets = useCallback(async () => {
    try {
      const res = await fetch("/api/wallets");
      if (!res.ok) throw new Error("Failed to fetch wallets");
      const data = await res.json();
      setWallets(data);
    } catch {
      toast.error("Failed to load wallets");
    }
  }, []);

  useEffect(() => {
    fetchIncomes();
  }, [fetchIncomes]);

  useEffect(() => {
    fetchWallets();
  }, [fetchWallets]);

  useEffect(() => {
    setPage(1);
  }, [dateFilter, customStartDate, customEndDate]);

  useEffect(() => {
    function handleClickOutside() {
      setActiveMenuId(null);
    }
    if (activeMenuId) {
      document.addEventListener("click", handleClickOutside);
      return () => document.removeEventListener("click", handleClickOutside);
    }
  }, [activeMenuId]);

  const filteredIncomes = useMemo(() => {
    if (!searchQuery) return incomes;
    const q = searchQuery.toLowerCase();
    return incomes.filter(
      (inc) =>
        inc.description?.toLowerCase().includes(q) ||
        getCategoryLabel(inc.category).toLowerCase().includes(q) ||
        inc.notes?.toLowerCase().includes(q)
    );
  }, [incomes, searchQuery]);

  const stats = useMemo(() => {
    const total = filteredIncomes.reduce((sum, i) => sum + i.amount, 0);
    const avg = filteredIncomes.length > 0 ? total / filteredIncomes.length : 0;
    const categoryTotals: Record<string, number> = {};
    filteredIncomes.forEach((i) => {
      categoryTotals[i.category] = (categoryTotals[i.category] || 0) + i.amount;
    });
    const topCategory = Object.entries(categoryTotals).sort((a, b) => b[1] - a[1])[0];
    return { total, avg, topCategory, count: filteredIncomes.length };
  }, [filteredIncomes]);

  const paginatedIncomes = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE;
    return filteredIncomes.slice(start, start + PAGE_SIZE);
  }, [filteredIncomes, page]);

  const totalPages = Math.max(1, Math.ceil(filteredIncomes.length / PAGE_SIZE));

  function openCreateDialog() {
    setEditingIncome(null);
    reset({
      amount: 0,
      category: "",
      description: "",
      date: new Date().toISOString().split("T")[0],
      notes: "",
      walletId: "",
    });
    setDialogOpen(true);
  }

  function openEditDialog(income: Income) {
    setEditingIncome(income);
    reset({
      amount: income.amount,
      category: income.category,
      description: income.description || "",
      date: income.date ? new Date(income.date).toISOString().split("T")[0] : "",
      notes: income.notes || "",
      walletId: income.walletId || "",
    });
    setDialogOpen(true);
    setActiveMenuId(null);
  }

  function openDuplicateDialog(income: Income) {
    setEditingIncome(null);
    reset({
      amount: income.amount,
      category: income.category,
      description: income.description || "",
      date: new Date().toISOString().split("T")[0],
      notes: income.notes || "",
      walletId: income.walletId || "",
    });
    setDialogOpen(true);
    setActiveMenuId(null);
  }

  async function onSubmit(data: IncomeInput) {
    setSubmitting(true);
    try {
      const url = editingIncome
        ? `/api/income/${editingIncome.id}`
        : "/api/income";
      const method = editingIncome ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to save income");
      }

      toast.success(editingIncome ? "Income updated" : "Income added");
      setDialogOpen(false);
      fetchIncomes();
      fetchWallets();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(id: string) {
    try {
      const res = await fetch(`/api/income/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete");
      toast.success("Income deleted");
      setDeleteConfirmId(null);
      fetchIncomes();
      fetchWallets();
    } catch {
      toast.error("Failed to delete income");
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      <div className="mx-auto max-w-7xl p-4 md:p-8 space-y-6">
        {/* Header */}
        <motion.div
          className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"
          initial="hidden"
          animate="visible"
          variants={fadeIn}
          transition={{ duration: 0.5 }}
        >
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">
              Income
            </h1>
            <p className="text-slate-500 dark:text-slate-400 mt-1 text-sm">
              Track all your income sources and earnings
            </p>
          </div>
          <Button onClick={openCreateDialog} size="lg" variant="success" className="shrink-0">
            <Plus className="mr-2 h-4 w-4" />
            Add Income
          </Button>
        </motion.div>

        {/* Filter Bar */}
        <motion.div
          initial="hidden"
          animate="visible"
          variants={fadeIn}
          transition={{ delay: 0.1, duration: 0.5 }}
        >
          <Card className="border-0 shadow-md">
            <CardContent className="p-4">
              <div className="flex flex-col gap-4">
                {/* Date filters row */}
                <div className="flex flex-wrap items-center gap-2">
                  <Calendar className="h-4 w-4 text-slate-400 dark:text-slate-500 shrink-0" />
                  {(["today", "week", "month", "lastMonth", "custom"] as DateFilter[]).map(
                    (f) => (
                      <button
                        key={f}
                        onClick={() => setDateFilter(f)}
                        className={cn(
                          "rounded-lg px-3 py-1.5 text-xs font-medium transition-all",
                          dateFilter === f
                            ? "bg-emerald-100 text-emerald-700 shadow-sm"
                            : "text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-700 dark:hover:text-slate-300"
                        )}
                      >
                        {f === "today"
                          ? "Today"
                          : f === "week"
                            ? "This Week"
                            : f === "month"
                              ? "This Month"
                              : f === "lastMonth"
                                ? "Last Month"
                                : "Custom"}
                      </button>
                    )
                  )}
                </div>

                {/* Custom date inputs */}
                {dateFilter === "custom" && (
                  <div className="flex flex-wrap items-center gap-3">
                    <Input
                      type="date"
                      value={customStartDate}
                      onChange={(e) => setCustomStartDate(e.target.value)}
                      className="w-auto"
                    />
                    <span className="text-sm text-slate-400 dark:text-slate-500">to</span>
                    <Input
                      type="date"
                      value={customEndDate}
                      onChange={(e) => setCustomEndDate(e.target.value)}
                      className="w-auto"
                    />
                  </div>
                )}

                {/* Search */}
                <div className="max-w-sm">
                  <Input
                    placeholder="Search income..."
                    icon={<Search className="h-4 w-4" />}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Stats Row */}
        <motion.div
          className="grid grid-cols-1 gap-4 sm:grid-cols-3"
          initial="hidden"
          animate="visible"
          variants={staggerContainer}
        >
          <motion.div variants={staggerItem}>
            <Card className="border-0 shadow-md hover:shadow-lg transition-all duration-300 overflow-hidden relative group">
              <div className="absolute inset-0 bg-gradient-to-br from-emerald-400 to-teal-500 opacity-[0.03] group-hover:opacity-[0.06] transition-opacity" />
              <CardContent className="relative p-5">
                <div className="flex items-start justify-between">
                  <div className="space-y-1.5">
                    <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Total Income</p>
                    <p className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
                      {formatCurrency(stats.total)}
                    </p>
                    <p className="text-xs text-slate-400 dark:text-slate-500">
                      {stats.count} transaction{stats.count !== 1 ? "s" : ""}
                    </p>
                  </div>
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-100 dark:bg-emerald-900/30">
                    <TrendingUp className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div variants={staggerItem}>
            <Card className="border-0 shadow-md hover:shadow-lg transition-all duration-300 overflow-hidden relative group">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-400 to-cyan-500 opacity-[0.03] group-hover:opacity-[0.06] transition-opacity" />
              <CardContent className="relative p-5">
                <div className="flex items-start justify-between">
                  <div className="space-y-1.5">
                    <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Average Income</p>
                    <p className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
                      {formatCurrency(stats.avg)}
                    </p>
                    <p className="text-xs text-slate-400 dark:text-slate-500">per transaction</p>
                  </div>
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-100 dark:bg-blue-900/30">
                    <BarChart3 className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div variants={staggerItem}>
            <Card className="border-0 shadow-md hover:shadow-lg transition-all duration-300 overflow-hidden relative group">
              <div className="absolute inset-0 bg-gradient-to-br from-indigo-400 to-purple-500 opacity-[0.03] group-hover:opacity-[0.06] transition-opacity" />
              <CardContent className="relative p-5">
                <div className="flex items-start justify-between">
                  <div className="space-y-1.5">
                    <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Top Source</p>
                    <p className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
                      {stats.topCategory ? getCategoryLabel(stats.topCategory[0]) : "—"}
                    </p>
                    {stats.topCategory && (
                      <p className="text-xs text-slate-400 dark:text-slate-500">
                        {formatCurrency(stats.topCategory[1])} earned
                      </p>
                    )}
                  </div>
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-100 dark:bg-indigo-900/30">
                    <DollarSign className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </motion.div>

        {/* Income List */}
        <motion.div
          initial="hidden"
          animate="visible"
          variants={fadeIn}
          transition={{ delay: 0.3, duration: 0.5 }}
        >
          <Card className="border-0 shadow-md overflow-hidden">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base font-semibold">Income History</CardTitle>
                <Badge variant="success">
                  {filteredIncomes.length} record{filteredIncomes.length !== 1 ? "s" : ""}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="pt-2">
              {loading ? (
                <TableSkeleton rows={5} />
              ) : filteredIncomes.length === 0 ? (
                <EmptyState
                  icon={<DollarSign className="h-8 w-8 text-slate-400 dark:text-slate-500" />}
                  title="No income found"
                  description="Record your first income to start tracking your earnings."
                  action={
                    <Button onClick={openCreateDialog} variant="success">
                      <Plus className="mr-2 h-4 w-4" />
                      Add Income
                    </Button>
                  }
                />
              ) : (
                <>
                  {/* Desktop Table */}
                  <div className="hidden md:block overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-slate-100 dark:border-slate-700">
                          <th className="pb-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                            Category
                          </th>
                          <th className="pb-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                            Description
                          </th>
                          <th className="pb-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                            Date
                          </th>
                          <th className="pb-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                            Wallet
                          </th>
                          <th className="pb-3 text-right text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                            Amount
                          </th>
                          <th className="pb-3 text-right text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                            Actions
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                        <AnimatePresence>
                          {paginatedIncomes.map((income, idx) => (
                            <motion.tr
                              key={income.id}
                              className="group hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors"
                              initial={{ opacity: 0, x: -10 }}
                              animate={{ opacity: 1, x: 0 }}
                              exit={{ opacity: 0, x: 10 }}
                              transition={{ delay: 0.03 * idx }}
                            >
                              <td className="py-3.5">
                                <div className="flex items-center gap-3">
                                  <div
                                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white"
                                    style={{ backgroundColor: getCategoryColor(income.category) }}
                                  >
                                    {getCategoryLabel(income.category).charAt(0)}
                                  </div>
                                  <span className="text-sm font-medium text-slate-900 dark:text-slate-100">
                                    {getCategoryLabel(income.category)}
                                  </span>
                                </div>
                              </td>
                              <td className="py-3.5">
                                <span className="text-sm text-slate-600 dark:text-slate-300 truncate max-w-[200px] block">
                                  {income.description || "—"}
                                </span>
                              </td>
                              <td className="py-3.5">
                                <span className="text-sm text-slate-500 dark:text-slate-400">
                                  {formatDate(income.date)}
                                </span>
                              </td>
                              <td className="py-3.5">
                                <Badge variant="outline" className="text-xs font-normal">
                                  {income.wallet?.name || "—"}
                                </Badge>
                              </td>
                              <td className="py-3.5 text-right">
                                <span className="text-sm font-semibold text-emerald-600">
                                  +{formatCurrency(income.amount)}
                                </span>
                              </td>
                              <td className="py-3.5 text-right">
                                <div className="relative inline-block">
                                  <Button
                                    variant="ghost"
                                    size="icon-sm"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setActiveMenuId(activeMenuId === income.id ? null : income.id);
                                    }}
                                  >
                                    <MoreHorizontal className="h-4 w-4" />
                                  </Button>
                                  {activeMenuId === income.id && (
                                    <div className="absolute right-0 top-full z-50 mt-1 w-40 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 py-1 shadow-xl">
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          openEditDialog(income);
                                        }}
                                        className="flex w-full items-center gap-2 px-3 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                                      >
                                        <Pencil className="h-3.5 w-3.5" />
                                        Edit
                                      </button>
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          openDuplicateDialog(income);
                                        }}
                                        className="flex w-full items-center gap-2 px-3 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                                      >
                                        <Copy className="h-3.5 w-3.5" />
                                        Duplicate
                                      </button>
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          setDeleteConfirmId(income.id);
                                          setActiveMenuId(null);
                                        }}
                                        className="flex w-full items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                                      >
                                        <Trash2 className="h-3.5 w-3.5" />
                                        Delete
                                      </button>
                                    </div>
                                  )}
                                </div>
                              </td>
                            </motion.tr>
                          ))}
                        </AnimatePresence>
                      </tbody>
                    </table>
                  </div>

                  {/* Mobile Cards */}
                  <div className="md:hidden space-y-3">
                    <AnimatePresence>
                      {paginatedIncomes.map((income, idx) => (
                        <motion.div
                          key={income.id}
                          className="rounded-xl border border-slate-100 dark:border-slate-700 p-4 hover:border-emerald-200 dark:hover:border-emerald-800 hover:bg-emerald-50/20 dark:hover:bg-emerald-900/10 transition-all"
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -10 }}
                          transition={{ delay: 0.03 * idx }}
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex items-center gap-3">
                              <div
                                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-bold text-white"
                                style={{ backgroundColor: getCategoryColor(income.category) }}
                              >
                                {getCategoryLabel(income.category).charAt(0)}
                              </div>
                              <div>
                                <p className="text-sm font-medium text-slate-900 dark:text-slate-100">
                                  {getCategoryLabel(income.category)}
                                </p>
                                <p className="text-xs text-slate-500 dark:text-slate-400">
                                  {formatDate(income.date)}
                                  {income.wallet?.name && ` · ${income.wallet.name}`}
                                </p>
                              </div>
                            </div>
                            <span className="text-sm font-bold text-emerald-600">
                              +{formatCurrency(income.amount)}
                            </span>
                          </div>
                          {income.description && (
                            <p className="mt-2 text-xs text-slate-500 dark:text-slate-400 truncate">
                              {income.description}
                            </p>
                          )}
                          <div className="mt-3 flex items-center gap-2 border-t border-slate-100 dark:border-slate-700 pt-3">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => openEditDialog(income)}
                              className="h-8 text-xs"
                            >
                              <Pencil className="mr-1 h-3 w-3" />
                              Edit
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => openDuplicateDialog(income)}
                              className="h-8 text-xs"
                            >
                              <Copy className="mr-1 h-3 w-3" />
                              Duplicate
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setDeleteConfirmId(income.id)}
                              className="h-8 text-xs text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
                            >
                              <Trash2 className="mr-1 h-3 w-3" />
                              Delete
                            </Button>
                          </div>
                        </motion.div>
                      ))}
                    </AnimatePresence>
                  </div>

                  {/* Pagination */}
                  {totalPages > 1 && (
                    <div className="mt-6 flex items-center justify-between border-t border-slate-100 dark:border-slate-700 pt-4">
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        Showing {(page - 1) * PAGE_SIZE + 1}–
                        {Math.min(page * PAGE_SIZE, filteredIncomes.length)} of {filteredIncomes.length}
                      </p>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="outline"
                          size="icon-sm"
                          disabled={page <= 1}
                          onClick={() => setPage((p) => p - 1)}
                        >
                          <ChevronLeft className="h-4 w-4" />
                        </Button>
                        {Array.from({ length: totalPages }, (_, i) => i + 1)
                          .filter(
                            (p) => p === 1 || p === totalPages || Math.abs(p - page) <= 1
                          )
                          .reduce<(number | string)[]>((acc, p, i, arr) => {
                            if (i > 0 && typeof arr[i - 1] === "number" && p - (arr[i - 1] as number) > 1) {
                              acc.push("...");
                            }
                            acc.push(p);
                            return acc;
                          }, [])
                          .map((p, i) =>
                            typeof p === "string" ? (
                              <span key={`ellipsis-${i}`} className="px-1 text-xs text-slate-400 dark:text-slate-500">
                                ...
                              </span>
                            ) : (
                              <Button
                                key={p}
                                variant={p === page ? "default" : "ghost"}
                                size="icon-sm"
                                onClick={() => setPage(p)}
                                className={p === page ? "h-8 w-8" : "h-8 w-8 text-slate-500 dark:text-slate-400"}
                              >
                                {p}
                              </Button>
                            )
                          )}
                        <Button
                          variant="outline"
                          size="icon-sm"
                          disabled={page >= totalPages}
                          onClick={() => setPage((p) => p + 1)}
                        >
                          <ChevronRight className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Add/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingIncome ? "Edit Income" : "Add Income"}
            </DialogTitle>
            <DialogDescription>
              {editingIncome
                ? "Update the income details below."
                : "Fill in the details to record a new income entry."}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            {/* Amount */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                Amount <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 text-sm font-medium">
                  ₹
                </span>
                <input
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  {...register("amount", { valueAsNumber: true })}
                  className={cn(
                    "flex h-10 w-full rounded-xl border bg-white dark:bg-slate-800 pl-8 pr-3 py-2 text-sm transition-colors placeholder:text-slate-400 dark:placeholder:text-slate-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:border-transparent dark:border-slate-700 dark:text-slate-100",
                    errors.amount ? "border-red-500 focus-visible:ring-red-500" : "border-slate-200"
                  )}
                />
              </div>
              {errors.amount && (
                <p className="text-xs text-red-500">{errors.amount.message}</p>
              )}
            </div>

            {/* Category & Wallet Row */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                  Category <span className="text-red-500">*</span>
                </label>
                <Select
                  value={watch("category")}
                  onValueChange={(val) => setValue("category", val, { shouldValidate: true })}
                >
                  <SelectTrigger className={errors.category ? "border-red-500" : ""}>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      {INCOME_CATEGORIES.map((cat) => (
                        <SelectItem key={cat} value={cat}>
                          <div className="flex items-center gap-2">
                            <div
                              className="h-2.5 w-2.5 rounded-full shrink-0"
                              style={{ backgroundColor: getCategoryColor(cat) }}
                            />
                            {getCategoryLabel(cat)}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>
                {errors.category && (
                  <p className="text-xs text-red-500">{errors.category.message}</p>
                )}
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                  Wallet
                </label>
                <Select
                  value={watch("walletId")}
                  onValueChange={(val) => setValue("walletId", val, { shouldValidate: true })}
                >
                  <SelectTrigger className={errors.walletId ? "border-red-500" : ""}>
                    <SelectValue placeholder="Select wallet" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">
                      <div className="flex items-center gap-2">
                        <Wallet className="h-3.5 w-3.5 text-slate-400 dark:text-slate-500" />
                        No Wallet (Optional)
                      </div>
                    </SelectItem>
                    {wallets.map((w) => (
                      <SelectItem key={w.id} value={w.id}>
                        <div className="flex items-center gap-2">
                          <Wallet className="h-3.5 w-3.5 text-slate-400 dark:text-slate-500" />
                          {w.name}
                          <span className="text-xs text-slate-400 dark:text-slate-500">
                            ({formatCurrency(w.balance)})
                          </span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.walletId && (
                  <p className="text-xs text-red-500">{errors.walletId.message}</p>
                )}
              </div>
            </div>

            {/* Description */}
            <Input
              label="Description"
              placeholder="Income source or description"
              icon={<FileText className="h-4 w-4" />}
              error={errors.description?.message}
              {...register("description")}
            />

            {/* Date */}
            <Input
              label="Date"
              type="date"
              icon={<Calendar className="h-4 w-4" />}
              error={errors.date?.message}
              {...register("date")}
            />

            {/* Notes */}
            <Textarea
              label="Notes"
              placeholder="Additional notes..."
              error={errors.notes?.message}
              {...register("notes")}
            />

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setDialogOpen(false)}
                disabled={submitting}
              >
                Cancel
              </Button>
              <Button type="submit" variant="success" disabled={submitting}>
                {submitting ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : null}
                {editingIncome ? "Update Income" : "Add Income"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteConfirmId !== null}
        onOpenChange={() => setDeleteConfirmId(null)}
      >
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Delete Income</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this income record? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteConfirmId(null)}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => deleteConfirmId && handleDelete(deleteConfirmId)}
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
