"use client";

import { useState, useEffect, useCallback } from "react";
import { FileDown, Loader2, Calendar } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
} from "@/components/ui/select";
import { useAuth } from "@/components/providers/auth-provider";
import {
  generateExpensePDF,
  getFilteredDateRange,
  type ReportPeriod,
} from "@/lib/pdf-generator";
import type { Expense } from "@/types";

interface ExpenseReportModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const PERIOD_OPTIONS: { value: ReportPeriod; label: string }[] = [
  { value: "today", label: "Today" },
  { value: "yesterday", label: "Yesterday" },
  { value: "thisWeek", label: "This Week" },
  { value: "lastWeek", label: "Last Week" },
  { value: "thisMonth", label: "This Month" },
  { value: "lastMonth", label: "Last Month" },
  { value: "thisYear", label: "This Year" },
  { value: "custom", label: "Custom Date Range" },
  { value: "all", label: "All Expenses" },
];

export function ExpenseReportModal({ open, onOpenChange }: ExpenseReportModalProps) {
  const { user } = useAuth();
  const [period, setPeriod] = useState<ReportPeriod>("thisMonth");
  const [customStartDate, setCustomStartDate] = useState("");
  const [customEndDate, setCustomEndDate] = useState("");
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    if (open) {
      setPeriod("thisMonth");
      setCustomStartDate("");
      setCustomEndDate("");
      setGenerating(false);
    }
  }, [open]);

  const handleGenerate = useCallback(async () => {
    if (!user) {
      toast.error("Please log in to generate reports");
      return;
    }

    if (period === "custom") {
      if (!customStartDate || !customEndDate) {
        toast.warning("Please select both start and end dates");
        return;
      }
      if (new Date(customStartDate) > new Date(customEndDate)) {
        toast.warning("Start date must be before end date");
        return;
      }
    }

    setGenerating(true);

    try {
      const range = getFilteredDateRange(period, customStartDate, customEndDate);
      const params = new URLSearchParams();
      if (range.startDate) params.set("startDate", range.startDate);
      if (range.endDate) params.set("endDate", range.endDate);

      const res = await fetch(`/api/expenses?${params.toString()}`);
      if (!res.ok) throw new Error("Failed to fetch expenses");

      const expenses: Expense[] = await res.json();

      if (expenses.length === 0) {
        toast.warning("No expenses found for the selected period.");
        return;
      }

      await generateExpensePDF(
        expenses,
        { name: user.name, currency: "₹" },
        period,
        customStartDate,
        customEndDate
      );

      toast.success(`Report downloaded — ${expenses.length} expense${expenses.length !== 1 ? "s" : ""}`);
      onOpenChange(false);
    } catch {
      toast.error("Failed to generate report");
    } finally {
      setGenerating(false);
    }
  }, [user, period, customStartDate, customEndDate, onOpenChange]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md dark:bg-slate-800">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileDown className="h-5 w-5 text-indigo-500" />
            Download Expense Report
          </DialogTitle>
          <DialogDescription>
            Select a time period and generate a professional PDF report.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Report Period */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
              Report Period
            </label>
            <Select
              value={period}
              onValueChange={(val) => setPeriod(val as ReportPeriod)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PERIOD_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Custom Date Range */}
          {period === "custom" && (
            <div className="grid grid-cols-2 gap-3">
              <Input
                label="From Date"
                type="date"
                icon={<Calendar className="h-4 w-4" />}
                value={customStartDate}
                onChange={(e) => setCustomStartDate(e.target.value)}
              />
              <Input
                label="To Date"
                type="date"
                icon={<Calendar className="h-4 w-4" />}
                value={customEndDate}
                onChange={(e) => setCustomEndDate(e.target.value)}
              />
            </div>
          )}
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={generating}
          >
            Cancel
          </Button>
          <Button onClick={handleGenerate} disabled={generating}>
            {generating ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <FileDown className="mr-2 h-4 w-4" />
            )}
            {generating ? "Generating..." : "Generate PDF"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
