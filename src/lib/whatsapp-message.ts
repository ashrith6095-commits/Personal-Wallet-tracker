import { format } from "date-fns";
import { getCategoryLabel } from "@/lib/utils";
import type { Expense } from "@/types";
import type { ReportPeriod } from "@/lib/pdf-generator";

const CATEGORY_EMOJI: Record<string, string> = {
  FOOD: "🍔",
  FUEL: "🚕",
  TRANSPORT: "🚕",
  SHOPPING: "🛍️",
  MEDICAL: "🏥",
  BILLS: "🏠",
  RENT: "🏠",
  ENTERTAINMENT: "🎬",
  RECHARGE: "📱",
  EDUCATION: "📚",
  TRAVEL: "🚕",
  INVESTMENT: "📈",
  GIFT: "🎁",
  OTHERS: "📦",
};

const CATEGORY_GROUP_EMOJI: Record<string, string> = {
  Food: "🍔",
  Travel: "🚕",
  Shopping: "🛍️",
  Bills: "🏠",
  Healthcare: "🏥",
  Entertainment: "🎬",
  Others: "📦",
};

const CATEGORY_SUMMARY_MAP: Record<string, string> = {
  FOOD: "Food",
  FUEL: "Travel",
  TRANSPORT: "Travel",
  SHOPPING: "Shopping",
  MEDICAL: "Healthcare",
  BILLS: "Bills",
  RENT: "Bills",
  ENTERTAINMENT: "Entertainment",
  RECHARGE: "Bills",
  EDUCATION: "Others",
  TRAVEL: "Travel",
  INVESTMENT: "Others",
  GIFT: "Others",
  OTHERS: "Others",
};

const SUMMARY_ORDER = [
  "Food",
  "Travel",
  "Shopping",
  "Bills",
  "Healthcare",
  "Entertainment",
  "Others",
];

const SEPARATOR = "━━━━━━━━━━━━━━━━━━";
const THIN_SEP = "────────────────";

function formatCurrency(amount: number): string {
  return `Rs. ${amount.toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function getReportPeriodLabel(
  period: ReportPeriod,
  customStart?: string,
  customEnd?: string
): string {
  switch (period) {
    case "today":
      return `Today — ${format(new Date(), "dd MMM yyyy")}`;
    case "yesterday":
      return `Yesterday — ${format(new Date(Date.now() - 86400000), "dd MMM yyyy")}`;
    case "thisWeek":
      return `This Week — ${format(new Date(), "dd MMM yyyy")}`;
    case "lastWeek":
      return "Last Week";
    case "thisMonth":
      return format(new Date(), "MMMM yyyy");
    case "lastMonth": {
      const d = new Date();
      d.setMonth(d.getMonth() - 1);
      return format(d, "MMMM yyyy");
    }
    case "thisYear":
      return `Year ${format(new Date(), "yyyy")}`;
    case "custom":
      if (customStart && customEnd) {
        return `${format(new Date(customStart), "dd MMM yyyy")} — ${format(new Date(customEnd), "dd MMM yyyy")}`;
      }
      return "Custom Date Range";
    case "all":
      return "All Expenses";
  }
}

function formatExpenseDate(dateStr: string): string {
  return format(new Date(dateStr), "dd MMM yyyy");
}

export interface WhatsAppMessageOptions {
  expenses: Expense[];
  userName: string;
  period: ReportPeriod;
  customStart?: string;
  customEnd?: string;
  includeDetails: boolean;
}

export function buildWhatsAppMessage({
  expenses,
  userName,
  period,
  customStart,
  customEnd,
  includeDetails,
}: WhatsAppMessageOptions): string {
  const now = new Date();
  const totalExpenses = expenses.reduce((s, e) => s + e.amount, 0);
  const count = expenses.length;
  const highest = count > 0 ? Math.max(...expenses.map((e) => e.amount)) : 0;
  const lowest = count > 0 ? Math.min(...expenses.map((e) => e.amount)) : 0;
  const average = count > 0 ? totalExpenses / count : 0;

  const uniqueCategories = new Set(expenses.map((e) => e.category)).size;
  const uniqueWallets = new Set(
    expenses.filter((e) => e.walletId).map((e) => e.walletId)
  ).size;

  const categoryTotals: Record<string, number> = {};
  expenses.forEach((e) => {
    const group = CATEGORY_SUMMARY_MAP[e.category] || "Others";
    categoryTotals[group] = (categoryTotals[group] || 0) + e.amount;
  });

  const lines: string[] = [];

  // ── Header ──────────────────────────────────
  lines.push("📊 *PURSETRACK EXPENSE REPORT*");
  lines.push(SEPARATOR);
  lines.push("");
  lines.push("📅 Report Period:");
  lines.push(getReportPeriodLabel(period, customStart, customEnd));
  lines.push("");
  lines.push("👤 User:");
  lines.push(userName);
  lines.push("");
  lines.push("🗓️ Generated:");
  lines.push(format(now, "dd MMM yyyy"));
  lines.push("");
  lines.push("🕒 Time:");
  lines.push(format(now, "hh:mm a"));
  lines.push(SEPARATOR);

  // ── Summary ─────────────────────────────────
  lines.push("");
  lines.push("💰 *SUMMARY*");
  lines.push("");
  lines.push("💵 Total Expenses");
  lines.push(formatCurrency(totalExpenses));
  lines.push("");
  lines.push("🧾 Transactions");
  lines.push(String(count));
  lines.push("");
  lines.push("📈 Highest Expense");
  lines.push(formatCurrency(highest));
  lines.push("");
  lines.push("📉 Lowest Expense");
  lines.push(formatCurrency(lowest));
  lines.push("");
  lines.push("📊 Average Expense");
  lines.push(formatCurrency(average));
  lines.push("");
  lines.push("📂 Categories");
  lines.push(String(uniqueCategories));
  lines.push("");
  lines.push("👛 Wallets Used");
  lines.push(String(uniqueWallets));
  lines.push(SEPARATOR);

  // ── Category Totals ─────────────────────────
  lines.push("");
  lines.push("📂 *CATEGORY TOTALS*");
  lines.push("");

  SUMMARY_ORDER.forEach((cat) => {
    const total = categoryTotals[cat] || 0;
    if (total > 0) {
      const emoji = CATEGORY_GROUP_EMOJI[cat] ?? "📦";
      lines.push(`${emoji} ${cat}`);
      lines.push(formatCurrency(total));
      lines.push("");
    }
  });

  // ── Expense Details ─────────────────────────
  if (includeDetails && expenses.length > 0) {
    lines.push(SEPARATOR);
    lines.push("");
    lines.push("📋 *EXPENSE DETAILS*");
    lines.push("");

    expenses.forEach((e, i) => {
      const emoji = CATEGORY_EMOJI[e.category] ?? "📦";

      lines.push(SEPARATOR);
      lines.push("");
      lines.push(`Expense #${i + 1}`);
      lines.push("");
      lines.push(SEPARATOR);
      lines.push("");
      lines.push("📅 Date");
      lines.push(formatExpenseDate(e.date));
      lines.push("");
      lines.push("🏷️ Category");
      lines.push(`${emoji} ${getCategoryLabel(e.category)}`);
      lines.push("");
      lines.push("👛 Wallet");
      lines.push(e.wallet?.name || "—");
      lines.push("");
      lines.push("💳 Payment");
      lines.push(e.paymentMethod || "—");
      lines.push("");
      lines.push("📝 Description");
      lines.push(e.description || "—");
      lines.push("");
      lines.push("💵 Amount");
      lines.push(formatCurrency(e.amount));
    });

    lines.push("");
    lines.push(SEPARATOR);
  }

  // ── Grand Total ─────────────────────────────
  lines.push(SEPARATOR);
  lines.push("");
  lines.push("💵 Grand Total");
  lines.push("");
  lines.push(formatCurrency(totalExpenses));
  lines.push(SEPARATOR);
  lines.push("");
  lines.push("Generated using ❤️ PurseTrack");
  lines.push("Track Smart • Spend Smart • Save Smart");

  return lines.join("\n");
}

export function buildWhatsAppUrl(phoneNumber: string, message: string): string {
  const encoded = encodeURIComponent(message);
  return `https://wa.me/91${phoneNumber}?text=${encoded}`;
}
