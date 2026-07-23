import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { format } from "date-fns";
import type { Expense } from "@/types";

export type ReportPeriod =
  | "today"
  | "yesterday"
  | "thisWeek"
  | "lastWeek"
  | "thisMonth"
  | "lastMonth"
  | "thisYear"
  | "custom"
  | "all";

interface UserMeta {
  name: string;
  currency: string;
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

export function getFilteredDateRange(
  period: ReportPeriod,
  customStart?: string,
  customEnd?: string
): { startDate?: string; endDate?: string } {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  switch (period) {
    case "today": {
      const end = new Date(today);
      end.setHours(23, 59, 59, 999);
      return { startDate: today.toISOString(), endDate: end.toISOString() };
    }
    case "yesterday": {
      const start = new Date(today);
      start.setDate(start.getDate() - 1);
      const end = new Date(today);
      end.setTime(end.getTime() - 1);
      return { startDate: start.toISOString(), endDate: end.toISOString() };
    }
    case "thisWeek": {
      const start = new Date(today);
      start.setDate(today.getDate() - today.getDay());
      const end = new Date(start);
      end.setDate(start.getDate() + 6);
      end.setHours(23, 59, 59, 999);
      return { startDate: start.toISOString(), endDate: end.toISOString() };
    }
    case "lastWeek": {
      const start = new Date(today);
      start.setDate(today.getDate() - today.getDay() - 7);
      const end = new Date(start);
      end.setDate(start.getDate() + 6);
      end.setHours(23, 59, 59, 999);
      return { startDate: start.toISOString(), endDate: end.toISOString() };
    }
    case "thisMonth": {
      const start = new Date(now.getFullYear(), now.getMonth(), 1);
      const end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
      return { startDate: start.toISOString(), endDate: end.toISOString() };
    }
    case "lastMonth": {
      const start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const end = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);
      return { startDate: start.toISOString(), endDate: end.toISOString() };
    }
    case "thisYear": {
      const start = new Date(now.getFullYear(), 0, 1);
      const end = new Date(now.getFullYear(), 11, 31, 23, 59, 59, 999);
      return { startDate: start.toISOString(), endDate: end.toISOString() };
    }
    case "custom":
      return {
        startDate: customStart ? new Date(customStart).toISOString() : undefined,
        endDate: customEnd
          ? new Date(new Date(customEnd).setHours(23, 59, 59, 999)).toISOString()
          : undefined,
      };
    case "all":
      return {};
  }
}

function getFileName(period: ReportPeriod): string {
  switch (period) {
    case "today":
      return "Expense_Report_Today.pdf";
    case "yesterday":
      return "Expense_Report_Yesterday.pdf";
    case "thisWeek":
      return "Expense_Report_This_Week.pdf";
    case "lastWeek":
      return "Expense_Report_Last_Week.pdf";
    case "thisMonth":
      return `Expense_Report_${format(new Date(), "MMMM_yyyy")}.pdf`;
    case "lastMonth": {
      const d = new Date();
      d.setMonth(d.getMonth() - 1);
      return `Expense_Report_${format(d, "MMMM_yyyy")}.pdf`;
    }
    case "thisYear":
      return `Expense_Report_${format(new Date(), "yyyy")}.pdf`;
    case "custom":
      return "Expense_Report_Custom.pdf";
    case "all":
      return "Expense_Report_All.pdf";
  }
}

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

function formatPdfCurrency(amount: number): string {
  return `Rs. ${amount.toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function formatDateDDMMMYYYY(dateStr: string): string {
  return format(new Date(dateStr), "dd MMM yyyy");
}

export async function generateExpensePDF(
  expenses: Expense[],
  user: UserMeta,
  period: ReportPeriod,
  customStart?: string,
  customEnd?: string
): Promise<void> {
  const doc = new jsPDF("p", "mm", "a4");

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 15;
  const contentWidth = pageWidth - margin * 2;

  let yPos = 0;

  function checkNewPage(needed: number): void {
    if (yPos + needed > pageHeight - 25) {
      doc.addPage();
      yPos = 20;
    }
  }

  const now = new Date();
  const periodLabel = getReportPeriodLabel(period, customStart, customEnd);
  const fileName = getFileName(period);

  const totalExpenses = expenses.reduce((s, e) => s + e.amount, 0);
  const count = expenses.length;
  const highest = count > 0 ? Math.max(...expenses.map((e) => e.amount)) : 0;
  const lowest = count > 0 ? Math.min(...expenses.map((e) => e.amount)) : 0;
  const average = count > 0 ? totalExpenses / count : 0;

  // ── Header ──────────────────────────────────────────────
  // Background bar
  doc.setFillColor(99, 102, 241); // indigo-500
  doc.rect(0, 0, pageWidth, 38, "F");

  // Logo text
  doc.setFont("helvetica", "bold");
  doc.setFontSize(22);
  doc.setTextColor(255, 255, 255);
  doc.text("PURSETRACK", margin, 16);

  doc.setFontSize(11);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(220, 220, 255);
  doc.text("Expense Report", margin, 24);

  // Right side — date & time
  doc.setFontSize(8);
  doc.setTextColor(200, 200, 255);
  doc.text(`Generated: ${format(now, "dd MMM yyyy, hh:mm a")}`, pageWidth - margin, 14, { align: "right" });
  doc.text(`User: ${user.name}`, pageWidth - margin, 19, { align: "right" });
  doc.text("Currency: Rs. (INR)", pageWidth - margin, 24, { align: "right" });

  yPos = 46;

  // ── Report Period ───────────────────────────────────────
  doc.setFontSize(9);
  doc.setTextColor(100, 116, 139); // slate-500
  doc.text("REPORT PERIOD", margin, yPos);
  yPos += 5;
  doc.setFontSize(12);
  doc.setTextColor(15, 23, 42); // slate-900
  doc.setFont("helvetica", "bold");
  doc.text(periodLabel, margin, yPos);
  yPos += 10;

  // ── Summary Cards ──────────────────────────────────────
  const cards = [
    { label: "Total Expenses", value: formatPdfCurrency(totalExpenses) },
    { label: "Transactions", value: String(count) },
    { label: "Highest", value: formatPdfCurrency(highest) },
    { label: "Lowest", value: formatPdfCurrency(lowest) },
    { label: "Average", value: formatPdfCurrency(average) },
  ];

  const cardWidth = (contentWidth - 4 * 4) / 5; // 4px gap between 5 cards
  const cardHeight = 22;

  checkNewPage(cardHeight + 12);

  cards.forEach((card, i) => {
    const x = margin + i * (cardWidth + 4);

    // Card background
    doc.setFillColor(248, 250, 252); // slate-50
    doc.roundedRect(x, yPos, cardWidth, cardHeight, 2, 2, "F");

    // Card border
    doc.setDrawColor(226, 232, 240); // slate-200
    doc.roundedRect(x, yPos, cardWidth, cardHeight, 2, 2, "S");

    // Label
    doc.setFontSize(6.5);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(100, 116, 139);
    doc.text(card.label, x + cardWidth / 2, yPos + 8, { align: "center" });

    // Value
    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(15, 23, 42);
    doc.text(card.value, x + cardWidth / 2, yPos + 16, { align: "center" });
  });

  yPos += cardHeight + 12;

  // ── Expense Table ──────────────────────────────────────
  checkNewPage(40);

  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(15, 23, 42);
  doc.text("Expense Details", margin, yPos);
  yPos += 6;

  const tableBody = expenses.map((e, idx) => [
    String(idx + 1),
    formatDateDDMMMYYYY(e.date),
    getCategoryDisplayName(e.category),
    e.wallet?.name || "—",
    truncate(e.description || "—", 28),
    e.paymentMethod || "—",
    formatPdfCurrency(e.amount),
  ]);

  autoTable(doc, {
    startY: yPos,
    margin: { left: margin, right: margin },
    head: [["#", "Date", "Category", "Wallet", "Description", "Payment", "Amount"]],
    body: tableBody,
    theme: "grid",
    styles: {
      fontSize: 7.5,
      cellPadding: 2.5,
      textColor: [30, 41, 59],
      lineColor: [226, 232, 240],
      lineWidth: 0.3,
      font: "helvetica",
    },
    headStyles: {
      fillColor: [99, 102, 241],
      textColor: [255, 255, 255],
      fontStyle: "bold",
      fontSize: 7.5,
      halign: "center",
      cellPadding: 3,
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252],
    },
    columnStyles: {
      0: { halign: "center", cellWidth: 10 },
      1: { cellWidth: 22 },
      2: { cellWidth: 28 },
      3: { cellWidth: 22 },
      4: { cellWidth: 38 },
      5: { cellWidth: 22 },
      6: { halign: "right", cellWidth: 26, fontStyle: "bold" },
    },
    didDrawPage: () => {
      drawFooter(doc, pageWidth, pageHeight, margin, now);
    },
  });

  yPos = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 12;

  // ── Category Summary ───────────────────────────────────
  const categoryTotals: Record<string, number> = {};
  expenses.forEach((e) => {
    const group = CATEGORY_SUMMARY_MAP[e.category] || "Others";
    categoryTotals[group] = (categoryTotals[group] || 0) + e.amount;
  });

  checkNewPage(40);

  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(15, 23, 42);
  doc.text("Category Summary", margin, yPos);
  yPos += 6;

  const catBody = SUMMARY_ORDER
    .filter((cat) => (categoryTotals[cat] || 0) > 0)
    .map((cat) => [
      cat,
      formatPdfCurrency(categoryTotals[cat] || 0),
    ]);

  autoTable(doc, {
    startY: yPos,
    margin: { left: margin + 20, right: margin + 20 },
    body: catBody,
    theme: "plain",
    styles: {
      fontSize: 9,
      cellPadding: 4,
      textColor: [30, 41, 59],
      font: "helvetica",
    },
    columnStyles: {
      0: { fontStyle: "bold", cellWidth: 60 },
      1: { halign: "right", cellWidth: 60 },
    },
    didDrawPage: () => {
      drawFooter(doc, pageWidth, pageHeight, margin, now);
    },
  });

  yPos = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 12;

  // ── Grand Total ────────────────────────────────────────
  checkNewPage(20);

  doc.setFillColor(99, 102, 241);
  doc.roundedRect(margin, yPos, contentWidth, 14, 2, 2, "F");

  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(255, 255, 255);
  doc.text("Grand Total", margin + 6, yPos + 9.5);
  doc.text(formatPdfCurrency(totalExpenses), pageWidth - margin - 6, yPos + 9.5, {
    align: "right",
  });

  yPos += 22;

  // ── Footer on last page ────────────────────────────────
  drawFooter(doc, pageWidth, pageHeight, margin, now);

  // ── Download ───────────────────────────────────────────
  doc.save(fileName);
}

function drawFooter(
  doc: jsPDF,
  pageWidth: number,
  pageHeight: number,
  margin: number,
  now: Date
): void {
  const pageCount = (doc as unknown as { getNumberOfPages(): number }).getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);

    // Separator line
    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.3);
    doc.line(margin, pageHeight - 16, pageWidth - margin, pageHeight - 16);

    doc.setFontSize(7);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(148, 163, 184); // slate-400

    doc.text("Generated by PurseTrack", margin, pageHeight - 11);
    doc.text(
      `Page ${i} of ${pageCount}`,
      pageWidth / 2,
      pageHeight - 11,
      { align: "center" }
    );
    doc.text(
      format(now, "dd MMM yyyy, hh:mm a"),
      pageWidth - margin,
      pageHeight - 11,
      { align: "right" }
    );
  }
}

function getCategoryDisplayName(category: string): string {
  const map: Record<string, string> = {
    FOOD: "Food & Dining",
    FUEL: "Fuel",
    TRANSPORT: "Transport",
    SHOPPING: "Shopping",
    MEDICAL: "Medical",
    BILLS: "Bills & Utilities",
    RENT: "Rent",
    ENTERTAINMENT: "Entertainment",
    RECHARGE: "Recharge",
    EDUCATION: "Education",
    TRAVEL: "Travel",
    INVESTMENT: "Investment",
    GIFT: "Gift",
    OTHERS: "Others",
  };
  return map[category] || category;
}

function truncate(str: string, max: number): string {
  return str.length > max ? str.slice(0, max - 1) + "…" : str;
}
