"use client";

import { useState, useCallback } from "react";
import { motion } from "framer-motion";
import {
  Download,
  FileSpreadsheet,
  FileText,
  Calendar,
  Filter,
  Loader2,
} from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { cn, formatCurrency, getCategoryLabel } from "@/lib/utils";
import { fadeIn, staggerContainer, staggerItem } from "@/lib/animations";
import { EXPENSE_CATEGORIES } from "@/lib/constants";
import type { Expense, Wallet } from "@/types";

function buildQueryParams(filters: {
  startDate: string;
  endDate: string;
  category: string;
  walletId: string;
}) {
  const params = new URLSearchParams();
  if (filters.startDate) params.set("startDate", filters.startDate);
  if (filters.endDate) params.set("endDate", filters.endDate);
  if (filters.category) params.set("category", filters.category);
  if (filters.walletId) params.set("walletId", filters.walletId);
  return params.toString();
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export default function ExportPage() {
  const [wallets, setWallets] = useState<Wallet[]>([]);
  const [walletsLoaded, setWalletsLoaded] = useState(false);
  const [exporting, setExporting] = useState<string | null>(null);

  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [category, setCategory] = useState("");
  const [walletId, setWalletId] = useState("");

  const loadWallets = useCallback(async () => {
    if (walletsLoaded) return;
    try {
      const res = await fetch("/api/wallets");
      if (res.ok) setWallets(await res.json());
      setWalletsLoaded(true);
    } catch {
      // silently fail, wallet filter just won't populate
    }
  }, [walletsLoaded]);

  async function fetchExpenses(): Promise<Expense[]> {
    const qs = buildQueryParams({ startDate, endDate, category, walletId });
    const url = `/api/expenses${qs ? `?${qs}` : ""}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error("Failed to fetch expenses");
    return res.json();
  }

  function expensesToCsvRows(expenses: Expense[]) {
    const header = "Date,Category,Description,Amount,Payment Method,Notes";
    const rows = expenses.map((e) =>
      [
        format(new Date(e.date), "yyyy-MM-dd"),
        getCategoryLabel(e.category),
        `"${(e.description || "").replace(/"/g, '""')}"`,
        e.amount,
        e.paymentMethod || "",
        `"${(e.notes || "").replace(/"/g, '""')}"`,
      ].join(",")
    );
    return [header, ...rows].join("\n");
  }

  async function handleExportCsv() {
    setExporting("csv");
    try {
      const expenses = await fetchExpenses();
      if (expenses.length === 0) {
        toast.warning("No expenses found for the selected filters");
        return;
      }
      const csv = expensesToCsvRows(expenses);
      const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
      downloadBlob(blob, `pursetrack-expenses-${format(new Date(), "yyyy-MM-dd")}.csv`);
      toast.success(`Exported ${expenses.length} expenses as CSV`);
    } catch {
      toast.error("Failed to export CSV");
    } finally {
      setExporting(null);
    }
  }

  async function handleExportPdf() {
    setExporting("pdf");
    try {
      const expenses = await fetchExpenses();
      if (expenses.length === 0) {
        toast.warning("No expenses found for the selected filters");
        return;
      }

      const lines: string[] = [
        "PURSETRACK - EXPENSE REPORT",
        `Generated: ${format(new Date(), "dd MMM yyyy, hh:mm a")}`,
        `Filters: ${category ? getCategoryLabel(category) : "All Categories"} | ${walletId ? wallets.find((w) => w.id === walletId)?.name : "All Wallets"}`,
        `Date Range: ${startDate || "Start"} to ${endDate || "End"}`,
        "",
        "Date | Category | Description | Amount | Payment",
        "-".repeat(70),
      ];

      let total = 0;
      for (const e of expenses) {
        total += e.amount;
        lines.push(
          `${format(new Date(e.date), "dd MMM yyyy")} | ${getCategoryLabel(e.category)} | ${e.description || "-"} | ${formatCurrency(e.amount)} | ${e.paymentMethod || "-"}`
        );
      }

      lines.push("");
      lines.push(`TOTAL: ${formatCurrency(total)}`);
      lines.push(`Total Records: ${expenses.length}`);

      const blob = new Blob([lines.join("\n")], { type: "text/plain;charset=utf-8;" });
      downloadBlob(blob, `pursetrack-report-${format(new Date(), "yyyy-MM-dd")}.txt`);
      toast.success(`Exported ${expenses.length} expenses as report`);
    } catch {
      toast.error("Failed to export report");
    } finally {
      setExporting(null);
    }
  }

  async function handleExportExcel() {
    setExporting("excel");
    try {
      const expenses = await fetchExpenses();
      if (expenses.length === 0) {
        toast.warning("No expenses found for the selected filters");
        return;
      }

      const header = "Date,Category,Description,Amount,Payment Method,Notes";
      const rows = expenses.map((e) =>
        [
          format(new Date(e.date), "yyyy-MM-dd"),
          getCategoryLabel(e.category),
          `"${(e.description || "").replace(/"/g, '""')}"`,
          e.amount,
          e.paymentMethod || "",
          `"${(e.notes || "").replace(/"/g, '""')}"`,
        ].join(",")
      );
      const csv = [header, ...rows].join("\n");
      const blob = new Blob(["\ufeff" + csv], { type: "application/vnd.ms-excel;charset=utf-8;" });
      downloadBlob(blob, `pursetrack-expenses-${format(new Date(), "yyyy-MM-dd")}.xlsx`);
      toast.success(`Exported ${expenses.length} expenses as Excel`);
    } catch {
      toast.error("Failed to export Excel");
    } finally {
      setExporting(null);
    }
  }

  function clearFilters() {
    setStartDate("");
    setEndDate("");
    setCategory("");
    setWalletId("");
  }

  const hasFilters = startDate || endDate || category || walletId;

  const exportOptions = [
    {
      id: "csv",
      icon: <FileSpreadsheet className="h-6 w-6 text-emerald-600" />,
      title: "CSV Export",
      description: "Spreadsheet-compatible format, perfect for Google Sheets or Excel",
      iconBg: "bg-emerald-100",
      gradient: "bg-gradient-to-br from-emerald-400 to-teal-500",
      handler: handleExportCsv,
    },
    {
      id: "pdf",
      icon: <FileText className="h-6 w-6 text-red-600" />,
      title: "Report Export",
      description: "Formatted text report with summary totals",
      iconBg: "bg-red-100",
      gradient: "bg-gradient-to-br from-red-400 to-rose-500",
      handler: handleExportPdf,
    },
    {
      id: "excel",
      icon: <FileSpreadsheet className="h-6 w-6 text-blue-600" />,
      title: "Excel Export",
      description: "Excel-compatible file for advanced spreadsheet analysis",
      iconBg: "bg-blue-100",
      gradient: "bg-gradient-to-br from-blue-400 to-indigo-500",
      handler: handleExportExcel,
    },
  ];

  return (
    <div className="mx-auto max-w-4xl space-y-8">
      <motion.div
        initial="hidden"
        animate="visible"
        variants={fadeIn}
        transition={{ duration: 0.5 }}
      >
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">
          Export Data
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          Download your financial data in various formats
        </p>
      </motion.div>

      {/* Export Options */}
      <motion.div
        className="grid grid-cols-1 gap-4 sm:grid-cols-3"
        initial="hidden"
        animate="visible"
        variants={staggerContainer}
      >
        {exportOptions.map((opt) => (
          <motion.div key={opt.id} variants={staggerItem}>
            <Card className="relative overflow-hidden border-0 shadow-md hover:shadow-xl transition-all duration-300 group h-full dark:bg-slate-900">
              <div className={cn("absolute inset-0 opacity-[0.03] group-hover:opacity-[0.06] transition-opacity", opt.gradient)} />
              <CardContent className="relative p-6 flex flex-col items-center text-center">
                <div className={cn("flex h-14 w-14 items-center justify-center rounded-2xl mb-4", opt.iconBg)}>
                  {opt.icon}
                </div>
                <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">{opt.title}</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 mb-5 flex-1">{opt.description}</p>
                <Button
                  variant="outline"
                  className="w-full gap-2"
                  onClick={opt.handler}
                  disabled={exporting !== null}
                >
                  {exporting === opt.id ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Download className="h-4 w-4" />
                  )}
                  {exporting === opt.id ? "Exporting..." : "Export"}
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </motion.div>

      {/* Filter Section */}
      <motion.div
        initial="hidden"
        animate="visible"
        variants={fadeIn}
        transition={{ delay: 0.4, duration: 0.5 }}
      >
        <Card className="border-0 shadow-md overflow-hidden dark:bg-slate-900">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4 text-slate-500 dark:text-slate-400" />
                <CardTitle className="text-base font-semibold">Filter Options</CardTitle>
              </div>
              {hasFilters && (
                <Button variant="ghost" size="sm" onClick={clearFilters}>
                  Clear Filters
                </Button>
              )}
            </div>
            <CardDescription>
              Apply filters to export only the data you need
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <Input
                label="Start Date"
                type="date"
                icon={<Calendar className="h-4 w-4" />}
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
              <Input
                label="End Date"
                type="date"
                icon={<Calendar className="h-4 w-4" />}
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Category</label>
                <Select value={category} onValueChange={setCategory}>
                  <SelectTrigger>
                    <SelectValue placeholder="All categories" />
                  </SelectTrigger>
                  <SelectContent>
                    {EXPENSE_CATEGORIES.map((cat) => (
                      <SelectItem key={cat} value={cat}>
                        {getCategoryLabel(cat)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Wallet</label>
                <Select
                  value={walletId}
                  onValueChange={(val) => {
                    setWalletId(val);
                    loadWallets();
                  }}
                  onOpenChange={(open) => {
                    if (open) loadWallets();
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="All wallets" />
                  </SelectTrigger>
                  <SelectContent>
                    {wallets.map((w) => (
                      <SelectItem key={w.id} value={w.id}>
                        {w.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {hasFilters && (
              <div className="mt-4 flex items-center gap-2 flex-wrap">
                <span className="text-xs text-slate-500 dark:text-slate-400">Active filters:</span>
                {startDate && (
                  <Badge variant="secondary" className="text-xs">From: {startDate}</Badge>
                )}
                {endDate && (
                  <Badge variant="secondary" className="text-xs">To: {endDate}</Badge>
                )}
                {category && (
                  <Badge variant="secondary" className="text-xs">{getCategoryLabel(category)}</Badge>
                )}
                {walletId && (
                  <Badge variant="secondary" className="text-xs">
                    {wallets.find((w) => w.id === walletId)?.name || "Wallet"}
                  </Badge>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
