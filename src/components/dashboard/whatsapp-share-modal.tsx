"use client";

import { useState, useEffect, useCallback } from "react";
import { MessageCircle, Loader2, Phone, Calendar } from "lucide-react";
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
  getFilteredDateRange,
  type ReportPeriod,
} from "@/lib/pdf-generator";
import {
  buildWhatsAppMessage,
  buildWhatsAppUrl,
} from "@/lib/whatsapp-message";
import type { Expense } from "@/types";

interface WhatsAppShareModalProps {
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

function validatePhone(value: string): string | null {
  const cleaned = value.replace(/\D/g, "");
  if (cleaned.length === 0) return "Phone number is required";
  if (cleaned.length !== 10) return "Enter exactly 10 digits";
  if (!/^[6-9]/.test(cleaned))
    return "Indian mobile numbers start with 6-9";
  return null;
}

export function WhatsAppShareModal({
  open,
  onOpenChange,
}: WhatsAppShareModalProps) {
  const { user } = useAuth();
  const [period, setPeriod] = useState<ReportPeriod>("thisMonth");
  const [customStartDate, setCustomStartDate] = useState("");
  const [customEndDate, setCustomEndDate] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [phoneError, setPhoneError] = useState<string | null>(null);
  const [messageType, setMessageType] = useState<"summary" | "full">(
    "summary"
  );
  const [sharing, setSharing] = useState(false);

  useEffect(() => {
    if (open) {
      setPeriod("thisMonth");
      setCustomStartDate("");
      setCustomEndDate("");
      setPhoneNumber("");
      setPhoneError(null);
      setMessageType("summary");
      setSharing(false);
    }
  }, [open]);

  const handlePhoneChange = useCallback((value: string) => {
    const cleaned = value.replace(/\D/g, "").slice(0, 10);
    setPhoneNumber(cleaned);
    if (cleaned.length === 10) {
      setPhoneError(validatePhone(cleaned));
    } else {
      setPhoneError(null);
    }
  }, []);

  const handleShare = useCallback(async () => {
    if (!user) {
      toast.error("Please log in to share reports");
      return;
    }

    const phoneErr = validatePhone(phoneNumber);
    if (phoneErr) {
      setPhoneError(phoneErr);
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

    setSharing(true);

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
        setSharing(false);
        return;
      }

      const message = buildWhatsAppMessage({
        expenses,
        userName: user.name,
        period,
        customStart: customStartDate,
        customEnd: customEndDate,
        includeDetails: messageType === "full",
      });

      const url = buildWhatsAppUrl(phoneNumber, message);
      window.open(url, "_blank", "noopener,noreferrer");

      toast.success(
        `Report shared \u2014 ${expenses.length} expense${expenses.length !== 1 ? "s" : ""}`
      );
      onOpenChange(false);
    } catch {
      toast.error("Failed to share report");
    } finally {
      setSharing(false);
    }
  }, [
    user,
    period,
    customStartDate,
    customEndDate,
    phoneNumber,
    messageType,
    onOpenChange,
  ]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md dark:bg-slate-800">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MessageCircle className="h-5 w-5 text-green-500" />
            Share via WhatsApp
          </DialogTitle>
          <DialogDescription>
            Send your expense report as a beautifully formatted WhatsApp
            message.
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

          {/* Phone Number */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
              Recipient WhatsApp Number
            </label>
            <div className="relative">
              <div className="absolute left-3 top-1/2 -translate-y-1/2 flex items-center gap-1.5 text-sm text-slate-500 dark:text-slate-400">
                <Phone className="h-4 w-4" />
                <span>+91</span>
              </div>
              <input
                type="tel"
                placeholder="9876543210"
                maxLength={10}
                value={phoneNumber}
                onChange={(e) => handlePhoneChange(e.target.value)}
                className={`flex h-10 w-full rounded-xl border bg-white pl-18 pr-3 py-2 text-sm transition-colors placeholder:text-slate-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:border-transparent dark:bg-slate-800 dark:text-slate-100 dark:placeholder:text-slate-500 ${
                  phoneError
                    ? "border-red-500 focus-visible:ring-red-500 dark:border-red-500"
                    : "border-slate-200 dark:border-slate-700"
                }`}
              />
            </div>
            {phoneError && (
              <p className="text-xs text-red-500">{phoneError}</p>
            )}
          </div>

          {/* Message Type */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
              Message Type
            </label>
            <div className="flex flex-col gap-2">
              <button
                type="button"
                onClick={() => setMessageType("summary")}
                className={`flex items-center gap-3 rounded-xl border px-4 py-3 text-left text-sm transition-all ${
                  messageType === "summary"
                    ? "border-green-500 bg-green-50 text-green-700 ring-1 ring-green-500 dark:border-green-500 dark:bg-green-950 dark:text-green-300"
                    : "border-slate-200 bg-white text-slate-700 hover:border-slate-300 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:border-slate-600"
                }`}
              >
                <span
                  className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-full border-2 ${
                    messageType === "summary"
                      ? "border-green-500"
                      : "border-slate-300 dark:border-slate-600"
                  }`}
                >
                  {messageType === "summary" && (
                    <span className="h-2 w-2 rounded-full bg-green-500" />
                  )}
                </span>
                <div>
                  <span className="font-medium">Summary Only</span>
                  <span className="ml-1 text-xs text-slate-400 dark:text-slate-500">
                    (Recommended)
                  </span>
                </div>
              </button>
              <button
                type="button"
                onClick={() => setMessageType("full")}
                className={`flex items-center gap-3 rounded-xl border px-4 py-3 text-left text-sm transition-all ${
                  messageType === "full"
                    ? "border-green-500 bg-green-50 text-green-700 ring-1 ring-green-500 dark:border-green-500 dark:bg-green-950 dark:text-green-300"
                    : "border-slate-200 bg-white text-slate-700 hover:border-slate-300 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:border-slate-600"
                }`}
              >
                <span
                  className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-full border-2 ${
                    messageType === "full"
                      ? "border-green-500"
                      : "border-slate-300 dark:border-slate-600"
                  }`}
                >
                  {messageType === "full" && (
                    <span className="h-2 w-2 rounded-full bg-green-500" />
                  )}
                </span>
                <div>
                  <span className="font-medium">
                    Summary + Expense Details
                  </span>
                </div>
              </button>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={sharing}
          >
            Cancel
          </Button>
          <Button
            onClick={handleShare}
            disabled={sharing}
            className="bg-green-600 hover:bg-green-700 text-white"
          >
            {sharing ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <MessageCircle className="mr-2 h-4 w-4" />
            )}
            {sharing ? "Sharing..." : "Share via WhatsApp"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
