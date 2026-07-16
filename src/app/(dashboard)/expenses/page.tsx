"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus,
  Search,
  Filter,
  Receipt,
  TrendingDown,
  Calendar,
  Wallet,
  Tag,
  MoreHorizontal,
  Pencil,
  Trash2,
  Copy,
  MapPin,
  Clock,
  CreditCard,
  FileText,
  ChevronLeft,
  ChevronRight,
  X,
  Loader2,
  ReceiptText,
  BarChart3,
} from "lucide-react";
import { toast } from "sonner";
import { expenseSchema, type ExpenseInput } from "@/lib/validations";
import { fadeIn, staggerContainer, staggerItem } from "@/lib/animations";
import { EXPENSE_CATEGORIES } from "@/lib/constants";
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
import type { Expense, Wallet as WalletType } from "@/types";

const PAYMENT_METHODS = ["Cash", "UPI", "Card", "Net Banking"] as const;

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

export default function ExpensesPage() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [wallets, setWallets] = useState<WalletType[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);

  const [dateFilter, setDateFilter] = useState<DateFilter>("month");
  const [customStartDate, setCustomStartDate] = useState("");
  const [customEndDate, setCustomEndDate] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [walletFilter, setWalletFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [page, setPage] = useState(1);

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<ExpenseInput>({
    resolver: zodResolver(expenseSchema),
    defaultValues: {
      amount: 0,
      category: "",
      description: "",
      date: new Date().toISOString().split("T")[0],
      time: "",
      paymentMethod: "",
      notes: "",
      location: "",
      tags: [],
      walletId: "",
      isRecurring: false,
      isQuick: false,
    },
  });

  const watchedTags = watch("tags") || [];

  const fetchExpenses = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      const range = dateFilter === "custom"
        ? { startDate: customStartDate, endDate: customEndDate }
        : getDateRange(dateFilter);

      if (range.startDate) params.set("startDate", range.startDate);
      if (range.endDate) params.set("endDate", range.endDate);
      if (categoryFilter !== "all") params.set("category", categoryFilter);
      if (walletFilter !== "all") params.set("walletId", walletFilter);
      if (searchQuery) params.set("search", searchQuery);

      const res = await fetch(`/api/expenses?${params.toString()}`);
      if (!res.ok) throw new Error("Failed to fetch expenses");
      const data = await res.json();
      setExpenses(data);
    } catch {
      toast.error("Failed to load expenses");
    } finally {
      setLoading(false);
    }
  }, [dateFilter, customStartDate, customEndDate, categoryFilter, walletFilter, searchQuery]);

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
    fetchExpenses();
  }, [fetchExpenses]);

  useEffect(() => {
    fetchWallets();
  }, [fetchWallets]);

  useEffect(() => {
    setPage(1);
  }, [dateFilter, categoryFilter, walletFilter, searchQuery, customStartDate, customEndDate]);

  useEffect(() => {
    function handleClickOutside() {
      setActiveMenuId(null);
    }
    if (activeMenuId) {
      document.addEventListener("click", handleClickOutside);
      return () => document.removeEventListener("click", handleClickOutside);
    }
  }, [activeMenuId]);

  const stats = useMemo(() => {
    const total = expenses.reduce((sum, e) => sum + e.amount, 0);
    const avg = expenses.length > 0 ? total / expenses.length : 0;
    const categoryTotals: Record<string, number> = {};
    expenses.forEach((e) => {
      categoryTotals[e.category] = (categoryTotals[e.category] || 0) + e.amount;
    });
    const topCategory = Object.entries(categoryTotals).sort((a, b) => b[1] - a[1])[0];
    return { total, avg, topCategory, count: expenses.length };
  }, [expenses]);

  const paginatedExpenses = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE;
    return expenses.slice(start, start + PAGE_SIZE);
  }, [expenses, page]);

  const totalPages = Math.max(1, Math.ceil(expenses.length / PAGE_SIZE));

  function openCreateDialog() {
    setEditingExpense(null);
    reset({
      amount: 0,
      category: "",
      description: "",
      date: new Date().toISOString().split("T")[0],
      time: "",
      paymentMethod: "",
      notes: "",
      location: "",
      tags: [],
      walletId: "",
      isRecurring: false,
      isQuick: false,
    });
    setDialogOpen(true);
  }

  function openEditDialog(expense: Expense) {
    setEditingExpense(expense);
    reset({
      amount: expense.amount,
      category: expense.category,
      description: expense.description || "",
      date: expense.date ? new Date(expense.date).toISOString().split("T")[0] : "",
      time: expense.time || "",
      paymentMethod: expense.paymentMethod || "",
      notes: expense.notes || "",
      location: expense.location || "",
      tags: expense.tags || [],
      walletId: expense.walletId || "",
      isRecurring: expense.isRecurring,
      isQuick: expense.isQuick,
    });
    setDialogOpen(true);
    setActiveMenuId(null);
  }

  function openDuplicateDialog(expense: Expense) {
    setEditingExpense(null);
    reset({
      amount: expense.amount,
      category: expense.category,
      description: expense.description || "",
      date: new Date().toISOString().split("T")[0],
      time: expense.time || "",
      paymentMethod: expense.paymentMethod || "",
      notes: expense.notes || "",
      location: expense.location || "",
      tags: expense.tags || [],
      walletId: expense.walletId || "",
      isRecurring: false,
      isQuick: false,
    });
    setDialogOpen(true);
    setActiveMenuId(null);
  }

  async function onSubmit(data: ExpenseInput) {
    setSubmitting(true);
    try {
      const url = editingExpense
        ? `/api/expenses/${editingExpense.id}`
        : "/api/expenses";
      const method = editingExpense ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to save expense");
      }

      toast.success(editingExpense ? "Expense updated" : "Expense added");
      setDialogOpen(false);
      fetchExpenses();
      fetchWallets();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(id: string) {
    try {
      const res = await fetch(`/api/expenses/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete");
      toast.success("Expense deleted");
      setDeleteConfirmId(null);
      fetchExpenses();
      fetchWallets();
    } catch {
      toast.error("Failed to delete expense");
    }
  }

  function addTag(tagInput: string) {
    const tag = tagInput.trim();
    if (tag && !watchedTags.includes(tag)) {
      setValue("tags", [...watchedTags, tag], { shouldValidate: true });
    }
  }

  function removeTag(tag: string) {
    setValue(
      "tags",
      watchedTags.filter((t) => t !== tag),
      { shouldValidate: true }
    );
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
              Expenses
            </h1>
            <p className="text-slate-500 dark:text-slate-400 mt-1 text-sm">
              Track and manage all your expenses
            </p>
          </div>
          <Button onClick={openCreateDialog} size="lg" className="shrink-0">
            <Plus className="mr-2 h-4 w-4" />
            Add Expense
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
                            ? "bg-indigo-100 text-indigo-700 shadow-sm"
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

                {/* Filters row */}
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <Filter className="h-4 w-4 text-slate-400 dark:text-slate-500 shrink-0" />
                    <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                      <SelectTrigger className="w-full sm:w-[180px]">
                        <SelectValue placeholder="All Categories" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Categories</SelectItem>
                        <SelectGroup>
                          {EXPENSE_CATEGORIES.map((cat) => (
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
                  </div>

                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <Wallet className="h-4 w-4 text-slate-400 dark:text-slate-500 shrink-0" />
                    <Select value={walletFilter} onValueChange={setWalletFilter}>
                      <SelectTrigger className="w-full sm:w-[180px]">
                        <SelectValue placeholder="All Wallets" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Wallets</SelectItem>
                        {wallets.map((w) => (
                          <SelectItem key={w.id} value={w.id}>
                            {w.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex-1 min-w-0">
                    <Input
                      placeholder="Search expenses..."
                      icon={<Search className="h-4 w-4" />}
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>
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
              <div className="absolute inset-0 bg-gradient-to-br from-red-400 to-orange-500 opacity-[0.03] group-hover:opacity-[0.06] transition-opacity" />
              <CardContent className="relative p-5">
                <div className="flex items-start justify-between">
                  <div className="space-y-1.5">
                    <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Total Expenses</p>
                    <p className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
                      {formatCurrency(stats.total)}
                    </p>
                    <p className="text-xs text-slate-400 dark:text-slate-500">
                      {stats.count} transaction{stats.count !== 1 ? "s" : ""}
                    </p>
                  </div>
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-red-100">
                    <Receipt className="h-5 w-5 text-red-600" />
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
                    <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Average Expense</p>
                    <p className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
                      {formatCurrency(stats.avg)}
                    </p>
                    <p className="text-xs text-slate-400 dark:text-slate-500">per transaction</p>
                  </div>
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-100">
                    <BarChart3 className="h-5 w-5 text-blue-600" />
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
                    <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Highest Category</p>
                    <p className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
                      {stats.topCategory ? getCategoryLabel(stats.topCategory[0]) : "—"}
                    </p>
                    {stats.topCategory && (
                      <p className="text-xs text-slate-400 dark:text-slate-500">
                        {formatCurrency(stats.topCategory[1])} spent
                      </p>
                    )}
                  </div>
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-100">
                    <TrendingDown className="h-5 w-5 text-indigo-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </motion.div>

        {/* Expense List */}
        <motion.div
          initial="hidden"
          animate="visible"
          variants={fadeIn}
          transition={{ delay: 0.3, duration: 0.5 }}
        >
          <Card className="border-0 shadow-md overflow-hidden">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base font-semibold">Expense History</CardTitle>
                <Badge variant="secondary">
                  {expenses.length} expense{expenses.length !== 1 ? "s" : ""}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="pt-2">
              {loading ? (
                <TableSkeleton rows={5} />
              ) : expenses.length === 0 ? (
                <EmptyState
                  icon={<ReceiptText className="h-8 w-8 text-slate-400 dark:text-slate-500" />}
                  title="No expenses found"
                  description="Start tracking your expenses by adding your first one."
                  action={
                    <Button onClick={openCreateDialog}>
                      <Plus className="mr-2 h-4 w-4" />
                      Add Expense
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
                          <th className="pb-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                            Tags
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
                          {paginatedExpenses.map((expense, idx) => (
                            <motion.tr
                              key={expense.id}
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
                                    style={{ backgroundColor: getCategoryColor(expense.category) }}
                                  >
                                    {getCategoryLabel(expense.category).charAt(0)}
                                  </div>
                                  <span className="text-sm font-medium text-slate-900 dark:text-slate-100">
                                    {getCategoryLabel(expense.category)}
                                  </span>
                                </div>
                              </td>
                              <td className="py-3.5">
                                <span className="text-sm text-slate-600 dark:text-slate-300 truncate max-w-[180px] block">
                                  {expense.description || "—"}
                                </span>
                              </td>
                              <td className="py-3.5">
                                <span className="text-sm text-slate-500 dark:text-slate-400">
                                  {formatDate(expense.date)}
                                </span>
                              </td>
                              <td className="py-3.5">
                                <Badge variant="outline" className="text-xs font-normal">
                                  {expense.wallet?.name || "—"}
                                </Badge>
                              </td>
                              <td className="py-3.5">
                                <div className="flex flex-wrap gap-1 max-w-[150px]">
                                  {(expense.tags || []).slice(0, 2).map((tag) => (
                                    <Badge key={tag} variant="secondary" className="text-[10px] px-1.5 py-0">
                                      {tag}
                                    </Badge>
                                  ))}
                                  {(expense.tags || []).length > 2 && (
                                    <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                                      +{(expense.tags || []).length - 2}
                                    </Badge>
                                  )}
                                </div>
                              </td>
                              <td className="py-3.5 text-right">
                                <span className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                                  {formatCurrency(expense.amount)}
                                </span>
                              </td>
                              <td className="py-3.5 text-right">
                                <div className="relative inline-block">
                                  <Button
                                    variant="ghost"
                                    size="icon-sm"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setActiveMenuId(activeMenuId === expense.id ? null : expense.id);
                                    }}
                                  >
                                    <MoreHorizontal className="h-4 w-4" />
                                  </Button>
                                  {activeMenuId === expense.id && (
                                    <div className="absolute right-0 top-full z-50 mt-1 w-40 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 py-1 shadow-xl">
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          openEditDialog(expense);
                                        }}
                                        className="flex w-full items-center gap-2 px-3 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                                      >
                                        <Pencil className="h-3.5 w-3.5" />
                                        Edit
                                      </button>
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          openDuplicateDialog(expense);
                                        }}
                                        className="flex w-full items-center gap-2 px-3 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                                      >
                                        <Copy className="h-3.5 w-3.5" />
                                        Duplicate
                                      </button>
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          setDeleteConfirmId(expense.id);
                                          setActiveMenuId(null);
                                        }}
                                        className="flex w-full items-center gap-2 px-3 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/50 transition-colors"
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
                      {paginatedExpenses.map((expense, idx) => (
                        <motion.div
                          key={expense.id}
                          className="rounded-xl border border-slate-100 dark:border-slate-700 p-4 hover:border-indigo-100 dark:hover:border-indigo-800 hover:bg-indigo-50/20 dark:hover:bg-indigo-500/10 transition-all"
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -10 }}
                          transition={{ delay: 0.03 * idx }}
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex items-center gap-3">
                              <div
                                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-bold text-white"
                                style={{ backgroundColor: getCategoryColor(expense.category) }}
                              >
                                {getCategoryLabel(expense.category).charAt(0)}
                              </div>
                              <div>
                                <p className="text-sm font-medium text-slate-900 dark:text-slate-100">
                                  {getCategoryLabel(expense.category)}
                                </p>
                                <p className="text-xs text-slate-500 dark:text-slate-400">
                                  {formatDate(expense.date)}
                                  {expense.wallet?.name && ` · ${expense.wallet.name}`}
                                </p>
                              </div>
                            </div>
                            <span className="text-sm font-bold text-slate-900 dark:text-slate-100">
                              {formatCurrency(expense.amount)}
                            </span>
                          </div>
                          {expense.description && (
                            <p className="mt-2 text-xs text-slate-500 dark:text-slate-400 truncate">
                              {expense.description}
                            </p>
                          )}
                          {(expense.tags || []).length > 0 && (
                            <div className="mt-2 flex flex-wrap gap-1">
                              {expense.tags.map((tag) => (
                                <Badge key={tag} variant="secondary" className="text-[10px] px-1.5 py-0">
                                  {tag}
                                </Badge>
                              ))}
                            </div>
                          )}
                          <div className="mt-3 flex items-center gap-2 border-t border-slate-100 dark:border-slate-700 pt-3">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => openEditDialog(expense)}
                              className="h-8 text-xs"
                            >
                              <Pencil className="mr-1 h-3 w-3" />
                              Edit
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => openDuplicateDialog(expense)}
                              className="h-8 text-xs"
                            >
                              <Copy className="mr-1 h-3 w-3" />
                              Duplicate
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setDeleteConfirmId(expense.id)}
                              className="h-8 text-xs text-red-600 dark:text-red-400 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/50"
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
                        {Math.min(page * PAGE_SIZE, expenses.length)} of {expenses.length}
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
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto dark:bg-slate-800">
          <DialogHeader>
            <DialogTitle>
              {editingExpense ? "Edit Expense" : "Add Expense"}
            </DialogTitle>
            <DialogDescription>
              {editingExpense
                ? "Update the expense details below."
                : "Fill in the details to record a new expense."}
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
                    "flex h-10 w-full rounded-xl border bg-white pl-8 pr-3 py-2 text-sm transition-colors placeholder:text-slate-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:border-transparent dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100",
                    errors.amount ? "border-red-500 focus-visible:ring-red-500" : "border-slate-200 dark:border-slate-700"
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
                      {EXPENSE_CATEGORIES.map((cat) => (
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
              placeholder="What was this expense for?"
              icon={<FileText className="h-4 w-4" />}
              error={errors.description?.message}
              {...register("description")}
            />

            {/* Date & Time & Payment Method Row */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <Input
                label="Date"
                type="date"
                icon={<Calendar className="h-4 w-4" />}
                error={errors.date?.message}
                {...register("date")}
              />
              <Input
                label="Time"
                type="time"
                icon={<Clock className="h-4 w-4" />}
                error={errors.time?.message}
                {...register("time")}
              />
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                  Payment Method
                </label>
                <Select
                  value={watch("paymentMethod") || ""}
                  onValueChange={(val) => setValue("paymentMethod", val)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select method" />
                  </SelectTrigger>
                  <SelectContent>
                    {PAYMENT_METHODS.map((m) => (
                      <SelectItem key={m} value={m}>
                        <div className="flex items-center gap-2">
                          <CreditCard className="h-3.5 w-3.5 text-slate-400 dark:text-slate-500" />
                          {m}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Location */}
            <Input
              label="Location"
              placeholder="Where did this happen?"
              icon={<MapPin className="h-4 w-4" />}
              error={errors.location?.message}
              {...register("location")}
            />

            {/* Notes */}
            <Textarea
              label="Notes"
              placeholder="Additional notes..."
              error={errors.notes?.message}
              {...register("notes")}
            />

            {/* Tags */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                Tags
              </label>
              <div className="flex items-center gap-2">
                <Input
                  placeholder="Add a tag and press Enter"
                  icon={<Tag className="h-4 w-4" />}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      const input = e.target as HTMLInputElement;
                      addTag(input.value);
                      input.value = "";
                    }
                  }}
                />
              </div>
              {watchedTags.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {watchedTags.map((tag) => (
                    <Badge key={tag} variant="secondary" className="gap-1 pr-1">
                      {tag}
                      <button
                        type="button"
                        onClick={() => removeTag(tag)}
                        className="ml-0.5 rounded-full p-0.5 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              )}
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setDialogOpen(false)}
                disabled={submitting}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={submitting}>
                {submitting ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : null}
                {editingExpense ? "Update Expense" : "Add Expense"}
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
        <DialogContent className="max-w-sm dark:bg-slate-800">
          <DialogHeader>
            <DialogTitle>Delete Expense</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this expense? This action cannot be undone.
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
